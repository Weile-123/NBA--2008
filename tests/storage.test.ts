import assert from 'node:assert/strict';
import test from 'node:test';
import { createAutoSave } from '../src/utils/autoSave';
import { clearSlotStorage, loadGameFromStorage, SavedData, saveGameToStorage } from '../src/utils/storage';

const latestKey = 'nba2k2008_mycareer_save_v1';
const slotKey = (slot: string) => `nba2k2008_mycareer_save_${slot}`;
const snapshot = (name: string) => ({
  version: 1, player: { name }, teams: [{ id: 'lal' }], updatedAt: '2026-09-10T10:00:00Z',
} as SavedData);

function withStorage(run: (values: Map<string, string>, writes: string[]) => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  const writes: string[] = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { writes.push(key); values.set(key, value); },
    removeItem: (key: string) => values.delete(key),
  } });
  try { run(values, writes); }
  finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
}

function withClock(run: (tick: (ms: number) => void) => void) {
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  let now = 0, id = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  globalThis.setTimeout = ((callback: () => void, ms: number) => {
    timers.set(++id, { at: now + ms, callback });
    return id;
  }) as unknown as typeof setTimeout;
  globalThis.clearTimeout = ((key: number) => timers.delete(key)) as unknown as typeof clearTimeout;
  const tick = (ms: number) => {
    const end = now + ms;
    while (true) {
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      now = due[1].at;
      timers.delete(due[0]);
      due[1].callback();
    }
    now = end;
  };
  try { run(tick); }
  finally { globalThis.setTimeout = originalSet; globalThis.clearTimeout = originalClear; }
}

test('rapid changes save only the newest snapshot after the debounce', () => withClock(tick => {
  const writes: number[] = [];
  const save = createAutoSave<number>(value => { writes.push(value); return true; });
  for (let i = 0; i < 20; i++) { save.schedule(i); tick(20); }
  assert.deepEqual(writes, []);
  tick(800);
  assert.deepEqual(writes, [19]);
  tick(5000);
  assert.deepEqual(writes, [19]);
}));

test('continuous changes cannot defer saving beyond five seconds', () => withClock(tick => {
  const writes: number[] = [];
  const save = createAutoSave<number>(value => { writes.push(value); return true; });
  for (let i = 0; i < 10; i++) { save.schedule(i); tick(500); }
  assert.deepEqual(writes, [9]);
}));

test('flush saves once; cancellation prevents stale writes after manual save or reset', () => withClock(tick => {
  const writes: number[] = [];
  const save = createAutoSave<number>(value => { writes.push(value); return true; });
  save.schedule(1);
  save.flush();
  save.flush();
  tick(5000);
  assert.deepEqual(writes, [1]);
  save.schedule(2);
  save.cancel();
  tick(5000);
  save.flush();
  assert.deepEqual(writes, [1]);
}));

test('failed saves remain pending for a later lifecycle flush', () => withClock(tick => {
  let succeed = false;
  const writes: number[] = [];
  const save = createAutoSave<number>(value => { if (succeed) writes.push(value); return succeed; });
  save.schedule(3);
  tick(800);
  succeed = true;
  assert.equal(save.flush(), true);
  assert.deepEqual(writes, [3]);
}));

test('a save stores one payload and a small latest-slot pointer', () => withStorage((values, writes) => {
  assert.equal(saveGameToStorage(snapshot('A'), 'slot_2'), true);
  assert.equal(values.get(latestKey), 'slot_2');
  assert.equal(loadGameFromStorage()?.player?.name, 'A');
  writes.length = 0;
  saveGameToStorage(snapshot('B'), 'slot_2');
  assert.deepEqual(writes, [slotKey('slot_2')]);
  assert.equal(loadGameFromStorage()?.player?.name, 'B');
}));

test('legacy default snapshots remain readable and are replaced by a pointer on save', () => withStorage(values => {
  values.set(latestKey, JSON.stringify(snapshot('Legacy')));
  const legacy = loadGameFromStorage();
  assert.equal(legacy?.player?.name, 'Legacy');
  saveGameToStorage(legacy!, 'slot_1');
  assert.equal(values.get(latestKey), 'slot_1');
  assert.equal(loadGameFromStorage()?.player?.name, 'Legacy');
}));

test('slots remain independent and deleting the latest slot removes its pointer', () => withStorage(values => {
  saveGameToStorage(snapshot('A'), 'slot_1');
  saveGameToStorage(snapshot('B'), 'slot_2');
  assert.equal(loadGameFromStorage('slot_1')?.player?.name, 'A');
  assert.equal(loadGameFromStorage()?.player?.name, 'B');
  clearSlotStorage('slot_2');
  assert.equal(values.has(latestKey), false);
  assert.equal(loadGameFromStorage()?.player?.name, 'A');
}));

test('a missing pointer target falls back to another occupied slot', () => withStorage(values => {
  saveGameToStorage(snapshot('A'), 'slot_1');
  values.set(latestKey, 'slot_4');
  assert.equal(loadGameFromStorage()?.player?.name, 'A');
}));
