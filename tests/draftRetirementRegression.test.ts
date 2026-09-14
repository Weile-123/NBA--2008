import assert from 'node:assert/strict';
import test from 'node:test';
import type { PlayerProfile, RetiredPlayerRecord, Team } from '../src/types';
import { executeHistoricalTradesForSeason } from '../src/data/realTradesData';
import { resolveUserDraftTeam } from '../src/utils/draftLogic';
import {
  resolveCompletedCareerEndYear,
  sanitizeRetirementTimeline,
} from '../src/utils/retirementTimeline';

function makeTeam(id: string, name: string): Team {
  return {
    id,
    name,
    city: name,
    abbrev: id.toUpperCase(),
    conference: id === 'lal' ? 'West' : 'East',
    primaryColor: '#111111',
    secondaryColor: '#eeeeee',
    rating: 80,
    wins: 0,
    losses: 0,
    starPlayer: '',
    roster: [],
  };
}

test('the selected favorite team stays authoritative in both game modes', () => {
  const teams = [makeTeam('lal', '湖人'), makeTeam('bos', '凯尔特人')];
  const player = { favoriteTeamId: 'bos', currentTeamId: 'lal' } as PlayerProfile;

  for (const mode of ['classic', 'random_trade']) {
    assert.equal(resolveUserDraftTeam(teams, player, 'lal').id, 'bos', mode);
  }
});

test('classic mode silently retires unlisted age-43 players and preserves the user', () => {
  const teams = [makeTeam('lal', '湖人'), makeTeam('bos', '凯尔特人')];
  teams[0].roster = [
    { id: 'career_user', name: '玩家', position: 'PG', ovr: 90, age: 43 },
    { id: 'lebron', name: '勒布朗·詹姆斯', position: 'SF', ovr: 80, age: 43, peakOvr: 99 },
    { id: 'role', name: '普通老将', position: 'C', ovr: 66, age: 43, peakOvr: 76 },
  ];

  const result = executeHistoricalTradesForSeason(teams, 2035, {
    userPlayerId: 'career_user',
    userPlayerName: '玩家',
  });

  const roster = result.updatedTeams[0].roster;
  assert.equal(roster.some((player) => player.id === 'career_user'), true);
  assert.equal(roster.some((player) => player.id === 'lebron'), false);
  assert.equal(roster.some((player) => player.id === 'role'), false);
  assert.equal(result.modalData, null);
});

test('retirement timeline excludes the unplayed offseason year', () => {
  const completedYears = Array.from({ length: 24 }, (_, index) => 2008 + index);
  assert.equal(resolveCompletedCareerEndYear(2008, 2032, completedYears, completedYears), 2031);

  const timeline = Array.from({ length: 25 }, (_, index) => ({
    year: 2008 + index,
    seasonStr: `${2008 + index}-${String(2009 + index).slice(-2)} 赛季`,
    teamId: 'lal',
    teamName: '洛杉矶湖人',
    wins: 50,
    losses: 32,
    ppg: 20,
    rpg: 5,
    apg: 5,
    accolades: index === 24 ? ['平稳表现赛季'] : [],
  }));
  const repaired = sanitizeRetirementTimeline({
    retireAge: 43,
    seasonsPlayed: 25,
    endYear: 2032,
    timeline,
  } as RetiredPlayerRecord);

  assert.equal(repaired.timeline.length, 24);
  assert.equal(repaired.seasonsPlayed, 24);
  assert.equal(repaired.endYear, 2031);
  assert.equal(repaired.timeline.at(-1)?.year, 2031);
});
