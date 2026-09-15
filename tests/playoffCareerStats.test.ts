import assert from 'node:assert/strict';
import test from 'node:test';
import type { PlayerProfile, PlayerStats } from '../src/types';
import { applyPlayoffGamesToCareer } from '../src/utils/playoffStats';

const stats = (pts: number): PlayerStats => ({
  games: 0, gamesStarted: 0, pts, reb: 5, ast: 7, stl: 1, blk: 1,
  fgm: 8, fga: 16, tpm: 2, tpa: 5, ftm: 2, fta: 2, minutes: 36,
  turnovers: 3, offReb: 1, defReb: 4,
});

function player(): PlayerProfile {
  return {
    id: 'user', name: '玩家', currentTeamId: 'LAL',
    careerStats: stats(100), seasonStats: stats(100),
  } as unknown as PlayerProfile;
}

test('all hidden games from a simulated playoff round enter career totals', () => {
  const updated = applyPlayoffGamesToCareer(player(), [
    { id: 'R1:G1', started: true, playerStats: stats(20) },
    { id: 'R1:G2', started: false, playerStats: stats(25) },
  ]);
  assert.equal(updated.careerStats.games, 2);
  assert.equal(updated.careerStats.pts, 145);
  assert.equal(updated.careerStats.reb, 15);
  assert.equal(updated.careerStats.gamesStarted, 1);
  assert.deepEqual(updated.playoffStatGameIds, ['R1:G1', 'R1:G2']);
});

test('a playoff game is never counted twice after save or rerender', () => {
  const once = applyPlayoffGamesToCareer(player(), [{ id: 'R1:G1', playerStats: stats(20) }]);
  const twice = applyPlayoffGamesToCareer(once, [{ id: 'R1:G1', playerStats: stats(20) }]);
  assert.strictEqual(twice, once);
});
