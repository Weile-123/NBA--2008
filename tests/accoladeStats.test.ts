import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateGoatScore } from '../src/utils/calc2k';
import type { PlayerProfile } from '../src/types';

function playerWithAccolades(accolades: PlayerProfile['accolades']): PlayerProfile {
  return {
    accolades,
    careerStats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, turnovers: 0 },
    skillPoints: 0,
  } as PlayerProfile;
}

test('counts only the highest All-NBA selection when one season contains duplicate tiers', () => {
  const result = calculateGoatScore(playerWithAccolades([
    { year: 2025, seasonStr: '2025-26', type: 'ALL_NBA_2ND', title: '最佳阵容二阵' },
    { year: 2025, seasonStr: '2025-26', type: 'ALL_NBA_1ST', title: '最佳阵容一阵' },
    { year: 2026, seasonStr: '2026-27', type: 'ALL_NBA_3RD', title: '最佳阵容三阵' },
  ]));

  assert.equal(result.details.allNba1st, 1);
  assert.equal(result.details.allNba2nd3rd, 1);
  assert.equal(result.sAllNba, 90);
});

test('counts only the highest defensive team selection per season', () => {
  const result = calculateGoatScore(playerWithAccolades([
    { year: 2025, seasonStr: '2025-26', type: 'ALL_DEFENSE_2ND', title: '最佳防守二阵' },
    { year: 2025, seasonStr: '2025-26', type: 'ALL_DEFENSE_1ST', title: '最佳防守一阵' },
  ]));

  assert.equal(result.details.allDef1st, 1);
  assert.equal(result.details.allDef2nd, 0);
  assert.equal(result.sAllNba, 45);
});
