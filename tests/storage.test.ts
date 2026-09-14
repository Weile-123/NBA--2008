import assert from 'node:assert/strict';
import test from 'node:test';
import { createAutoSave } from '../src/utils/autoSave';
import { clearGameStorage, clearSlotStorage, getHallOfFameLegends, getLatestSaveSlotMeta, loadGameFromStorage, SavedData, saveGameToStorage, saveHallOfFameLegend } from '../src/utils/storage';
import { RetiredPlayerRecord } from '../src/types';

const snapshot = (name: string) => ({
  version: 1, player: { name }, teams: [{ id: 'lal' }], updatedAt: '2026-09-10T10:00:00Z',
} as SavedData);

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

test('a save updates the selected slot and makes it the latest save', () => {
  clearGameStorage();
  assert.equal(saveGameToStorage(snapshot('A'), 'slot_2'), true);
  assert.equal(loadGameFromStorage()?.player?.name, 'A');
  saveGameToStorage(snapshot('B'), 'slot_2');
  assert.equal(loadGameFromStorage()?.player?.name, 'B');
});

test('slots remain independent and deleting the latest slot falls back safely', () => {
  clearGameStorage();
  saveGameToStorage(snapshot('A'), 'slot_1');
  saveGameToStorage(snapshot('B'), 'slot_2');
  assert.equal(loadGameFromStorage('slot_1')?.player?.name, 'A');
  assert.equal(loadGameFromStorage()?.player?.name, 'B');
  clearSlotStorage('slot_2');
  assert.equal(loadGameFromStorage()?.player?.name, 'A');
});

test('clearing an explicitly selected slot does not affect another slot', () => {
  clearGameStorage();
  saveGameToStorage(snapshot('A'), 'slot_1');
  saveGameToStorage(snapshot('B'), 'slot_4');
  clearSlotStorage('slot_4');
  assert.equal(loadGameFromStorage('slot_1')?.player?.name, 'A');
  assert.equal(loadGameFromStorage('slot_4'), null);
});

test('classic and random-trade careers use completely separate save slots', () => {
  clearGameStorage('classic');
  clearGameStorage('random_trade');
  saveGameToStorage(snapshot('经典球员'), 'slot_1', 'classic');
  saveGameToStorage(snapshot('平行联盟球员'), 'slot_1', 'random_trade');

  assert.equal(loadGameFromStorage('slot_1', 'classic')?.player?.name, '经典球员');
  assert.equal(loadGameFromStorage('slot_1', 'random_trade')?.player?.name, '平行联盟球员');

  clearGameStorage('random_trade');
  assert.equal(loadGameFromStorage('slot_1', 'classic')?.player?.name, '经典球员');
  assert.equal(loadGameFromStorage('slot_1', 'random_trade'), null);
});

test('each mode resumes its newest save across all four slots', () => {
  clearGameStorage('classic');
  clearGameStorage('random_trade');
  saveGameToStorage({ ...snapshot('经典旧档'), updatedAt: '2026-09-10T10:00:00Z' }, 'slot_1', 'classic');
  saveGameToStorage({ ...snapshot('经典新档'), updatedAt: '2026-09-12T10:00:00Z' }, 'slot_3', 'classic');
  saveGameToStorage({ ...snapshot('平行旧档'), updatedAt: '2026-09-11T10:00:00Z' }, 'slot_2', 'random_trade');
  saveGameToStorage({ ...snapshot('平行新档'), updatedAt: '2026-09-13T10:00:00Z' }, 'slot_4', 'random_trade');

  assert.equal(getLatestSaveSlotMeta('classic').slotId, 'slot_3');
  assert.equal(getLatestSaveSlotMeta('classic').playerName, '经典新档');
  assert.equal(getLatestSaveSlotMeta('random_trade').slotId, 'slot_4');
  assert.equal(getLatestSaveSlotMeta('random_trade').playerName, '平行新档');
});

test('classic and random-trade personal leaderboards are independent', () => {
  const classicLegend = { id: 'classic-legend', goatScore: 100 } as RetiredPlayerRecord;
  const randomLegend = { id: 'random-legend', goatScore: 200 } as RetiredPlayerRecord;

  saveHallOfFameLegend(classicLegend, 'classic');
  saveHallOfFameLegend(randomLegend, 'random_trade');

  assert.equal(getHallOfFameLegends('classic').some((legend) => legend.id === classicLegend.id), true);
  assert.equal(getHallOfFameLegends('classic').some((legend) => legend.id === randomLegend.id), false);
  assert.equal(getHallOfFameLegends('random_trade').some((legend) => legend.id === randomLegend.id), true);
  assert.equal(getHallOfFameLegends('random_trade').some((legend) => legend.id === classicLegend.id), false);
});
