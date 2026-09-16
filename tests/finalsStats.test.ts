import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinalsAverages, selectFinalsMvp } from '../src/utils/finalsStats';

test('FMVP averages use the actual Finals game box scores', () => {
  const averages = calculateFinalsAverages([
    { playerStats: { pts: 30, reb: 8, ast: 6 } },
    { playerStats: { pts: 24, reb: 10, ast: 8 } },
    { playerStats: { pts: 36, reb: 6, ast: 10 } },
  ]);

  assert.deepEqual(averages, { games: 3, ppg: 30, rpg: 8, apg: 8 });
});

test('FMVP averages report missing legacy game data explicitly', () => {
  assert.equal(calculateFinalsAverages([]), null);
});

test('27-point Finals average guarantees user FMVP, below 27 retains OVR draw', () => {
  const candidates = [
    { id: 'star', ovr: 99, stats: { ppg: 27, rpg: 8, apg: 6 } },
    { id: 'user', ovr: 96, isUser: true },
  ];
  assert.equal(selectFinalsMvp(candidates, 'user', { games: 5, ppg: 27, rpg: 2, apg: 1 }, 99)?.id, 'user');
  assert.equal(selectFinalsMvp(candidates, 'user', { games: 5, ppg: 26.9, rpg: 20, apg: 20 }, 89)?.id, 'star');
  assert.equal(selectFinalsMvp(candidates, 'user', { games: 5, ppg: 26.9, rpg: 20, apg: 20 }, 90)?.id, 'user');
  assert.equal(selectFinalsMvp(candidates, 'user', null, 89)?.id, 'star');
  assert.equal(selectFinalsMvp([{ id: 'star', ovr: 99 }, { id: 'user', ovr: 93, isUser: true }], 'user', null, 99)?.id, 'star');
});
