import assert from 'node:assert/strict';
import test from 'node:test';
import type { MatchBoxScore, Team } from '../src/types';
import { getUserPlayoffStatus, settleInteractivePlayoffGame, type InteractivePlayoffSeries } from '../src/utils/playoffMatch';

const makeTeam = (id: string): Team => ({
  id,
  name: id,
  city: id,
  abbrev: id,
  primaryColor: '#000',
  secondaryColor: '#fff',
  rating: 80,
  conference: 'West',
  starPlayer: '球星',
  wins: 0,
  losses: 0,
  roster: [],
});

const makeBoxScore = (userTeamScore: number, opponentScore: number): MatchBoxScore => ({
  userTeamScore,
  opponentScore,
  userTeamId: 'USER',
  opponentTeamId: 'OPP',
  isPlayoffs: true,
  logs: [],
  challengesCompleted: [],
  rewardSkillPoints: 0,
  rewardMoney: 0,
  playerStats: {
    pts: 31, reb: 8, ast: 7, stl: 2, blk: 1,
    fgm: 12, fga: 21, tpm: 3, tpa: 7, ftm: 4, fta: 5,
    minutes: 38, turnovers: 2, ratingGrade: 'A',
  },
});

test('a personally played playoff win advances the correct side and stores the exact box score', () => {
  const series: InteractivePlayoffSeries = { teamA: makeTeam('OPP'), teamB: makeTeam('USER'), winsA: 2, winsB: 3 };
  const result = settleInteractivePlayoffGame(series, 'USER', makeBoxScore(108, 101));

  assert.equal(result.winsA, 2);
  assert.equal(result.winsB, 4);
  assert.equal(result.winnerId, 'USER');
  assert.equal(result.lastUserGame?.teamAScore, 101);
  assert.equal(result.lastUserGame?.teamBScore, 108);
  assert.equal(result.lastUserGame?.playerStats.pts, 31);
});

test('a personally played playoff loss advances only the opponent', () => {
  const series: InteractivePlayoffSeries = { teamA: makeTeam('USER'), teamB: makeTeam('OPP'), winsA: 1, winsB: 1 };
  const result = settleInteractivePlayoffGame(series, 'USER', makeBoxScore(94, 102));

  assert.equal(result.winsA, 1);
  assert.equal(result.winsB, 2);
  assert.equal(result.winnerId, undefined);
});

test('an unresolved tie cannot accidentally become a playoff loss', () => {
  const series: InteractivePlayoffSeries = { teamA: makeTeam('USER'), teamB: makeTeam('OPP'), winsA: 1, winsB: 1 };
  const result = settleInteractivePlayoffGame(series, 'USER', makeBoxScore(88, 88));

  assert.equal(result, series);
});

test('winning a completed round is not mistaken for playoff elimination', () => {
  const status = getUserPlayoffStatus([
    { teamA: makeTeam('USER'), teamB: makeTeam('OPP'), winnerId: 'USER' },
  ], 'USER');

  assert.deepEqual(status, { madePlayoffs: true, wasEliminated: false, isAlive: true });
});

test('losing any completed user series marks the player as eliminated', () => {
  const status = getUserPlayoffStatus([
    { teamA: makeTeam('USER'), teamB: makeTeam('OPP'), winnerId: 'OPP' },
  ], 'USER');

  assert.deepEqual(status, { madePlayoffs: true, wasEliminated: true, isAlive: false });
});
