import assert from 'node:assert/strict';
import test from 'node:test';
import { selectAllNbaFive, type EvaluatedPlayer } from '../src/utils/awardsLogic';
import type { Position } from '../src/types';

function candidate(id: string, position: Position, score: number): EvaluatedPlayer {
  return {
    id,
    name: id,
    position,
    teamId: 'team',
    teamName: '球队',
    teamAbbrev: 'T',
    conference: 'East',
    teamWins: 50,
    teamConferenceRank: 1,
    isPlayoffTeam: true,
    isTop6Seed: true,
    ovr: 90,
    role: '绝对首发',
    isUser: false,
    isRookie: false,
    ppg: 20,
    rpg: 5,
    apg: 5,
    spg: 1,
    bpg: 1,
    tpm: 2,
    fgPct: 50,
    minutes: 34,
    statScore: score,
    allNbaScore: score,
    mvpScore: score,
    defensiveScore: score,
    sixthManScore: score,
    rookieScore: score,
  };
}

function positionCounts(players: EvaluatedPlayer[]) {
  return {
    guards: players.filter((player) => player.position === 'PG' || player.position === 'SG').length,
    forwards: players.filter((player) => player.position === 'SF' || player.position === 'PF').length,
    centers: players.filter((player) => player.position === 'C').length,
  };
}

test('All-NBA selection uses two guards, two forwards and one center instead of one exact position each', () => {
  const pool = [
    candidate('pg-1', 'PG', 100),
    candidate('pg-2', 'PG', 99),
    candidate('sg-1', 'SG', 80),
    candidate('sf-1', 'SF', 98),
    candidate('sf-2', 'SF', 97),
    candidate('pf-1', 'PF', 79),
    candidate('c-1', 'C', 96),
  ];

  const selected = selectAllNbaFive(pool);
  assert.deepEqual(selected.map((player) => player.id), ['pg-1', 'pg-2', 'sf-1', 'sf-2', 'c-1']);
  assert.deepEqual(positionCounts(selected), { guards: 2, forwards: 2, centers: 1 });
});

test('mandatory first-team MVP still respects the grouped position quotas', () => {
  const pool = [
    candidate('pg-1', 'PG', 100),
    candidate('sg-1', 'SG', 99),
    candidate('sf-1', 'SF', 98),
    candidate('pf-mvp', 'PF', 97),
    candidate('pf-2', 'PF', 96),
    candidate('c-1', 'C', 95),
  ];

  const selected = selectAllNbaFive(pool, pool[3]);
  assert.equal(selected.some((player) => player.id === 'pf-mvp'), true);
  assert.deepEqual(positionCounts(selected), { guards: 2, forwards: 2, centers: 1 });
});
