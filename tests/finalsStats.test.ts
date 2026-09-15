import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinalsAverages } from '../src/utils/finalsStats';

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
