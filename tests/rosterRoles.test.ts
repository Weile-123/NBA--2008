import assert from 'node:assert/strict';
import test from 'node:test';
import type { Attributes, PlayerProfile, Position, Team } from '../src/types';
import { getCompleteTeamRoster } from '../src/utils/leagueLogic';

const attributes = Object.fromEntries([
  'midRange', 'threePoint', 'freeThrow', 'layup', 'dunk', 'insideFinish', 'postMove', 'ballHandle',
  'passing', 'perimeterDef', 'interiorDef', 'block', 'steal', 'rebounding', 'speed', 'vertical',
  'strength', 'stamina',
].map((key) => [key, 80])) as unknown as Attributes;

function makeTeam(centerOvr = 75, sixthManOvr = 84): Team {
  const players: Array<[string, number, Position]> = [
    ['pg-starter', 95, 'PG'],
    ['sg-starter', 90, 'SG'],
    ['sf-starter', 88, 'SF'],
    ['pf-starter', 86, 'PF'],
    ['c-starter', centerOvr, 'C'],
    ['best-bench', sixthManOvr, 'SG'],
    ['bench-pg', 74, 'PG'],
  ];
  return {
    id: 'HOME', name: '测试队', city: '测试城', abbrev: 'TST', primaryColor: '#000', secondaryColor: '#fff',
    rating: 85, conference: 'West', starPlayer: 'pg-starter', wins: 0, losses: 0,
    roster: players.map(([id, ovr, position]) => ({
      id, name: id, ovr, position, age: 25, peakAge: 27, peakOvr: ovr, peakDuration: 5, isStar: false,
    })),
  } as Team;
}

function makeUser(ovr: number, games: number): PlayerProfile {
  return {
    id: 'user', name: '玩家', position: 'C', ovr, currentTeamId: 'HOME', attributes, attributeCaps: attributes,
    age: 20, morale: 70,
    seasonStats: {
      games, gamesStarted: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
      fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, minutes: games * 8,
    },
    careerStats: {
      games, gamesStarted: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
      fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, minutes: games * 8,
    },
  } as unknown as PlayerProfile;
}

test('one poor early-season game does not immediately remove a legitimate starter', () => {
  const result = getCompleteTeamRoster(makeTeam(79, 78), makeUser(80, 1), 2);
  assert.equal(result.userRole, '绝对首发');
  assert.equal(result.userMinutes, 30);
});

test('a player who beats the same-position starter is not blocked by an unrelated sixth man', () => {
  const result = getCompleteTeamRoster(makeTeam(75, 84), makeUser(90, 10), 2);
  assert.equal(result.userRole, '绝对首发');
});

test('the highest-rated reserve remains sixth man after the user enters the starting lineup', () => {
  const result = getCompleteTeamRoster(makeTeam(75, 84), makeUser(90, 10), 2);
  const bestBench = result.roster.find((player) => player.id === 'best-bench');
  const displacedCenter = result.roster.find((player) => player.id === 'c-starter');
  assert.equal(bestBench?.role, '第六人');
  assert.equal(displacedCenter?.role, '轮换替补');
});

test('two elite point guards can start together in the two-guard lineup', () => {
  const team = makeTeam();
  team.roster = team.roster.map((candidate) => candidate.id === 'sg-starter' ? { ...candidate, position: 'PG' as Position } : candidate);
  const result = getCompleteTeamRoster(team, null, 2);
  assert.equal(result.roster.find((candidate) => candidate.id === 'pg-starter')?.role, '战术核心');
  assert.equal(result.roster.find((candidate) => candidate.id === 'sg-starter')?.role, '绝对首发');
});
