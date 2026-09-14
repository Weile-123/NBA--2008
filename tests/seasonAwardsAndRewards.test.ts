import assert from 'node:assert/strict';
import test from 'node:test';
import { NBA_TEAMS_2008 } from '../src/data/nbaData2008';
import type { Attributes, PlayerProfile, Team } from '../src/types';
import { applyAttributeAdReward } from '../src/utils/attributeTraining';
import { calculateSeasonAwards } from '../src/utils/awardsLogic';
import { calculateBuzzerBeaterSuccessRate } from '../src/utils/matchEvents';

const attributes = Object.fromEntries([
  'midRange', 'threePoint', 'freeThrow', 'layup', 'dunk', 'insideFinish', 'postMove', 'ballHandle',
  'passing', 'perimeterDef', 'interiorDef', 'block', 'steal', 'rebounding', 'speed', 'vertical',
  'strength', 'stamina',
].map((key) => [key, 90])) as unknown as Attributes;

function makePlayer(ppg: number, rpg: number, apg: number): PlayerProfile {
  const games = 82;
  return {
    id: 'award-test-user', name: '测试玩家', position: 'PG', ovr: 99, currentTeamId: 'lal',
    attributes, attributeCaps: attributes, age: 27, skillPoints: 5,
    seasonStats: {
      games, gamesStarted: games, pts: ppg * games, reb: rpg * games, ast: apg * games,
      stl: 1.5 * games, blk: 0.4 * games, fgm: ppg * games * 0.4, fga: ppg * games * 0.82,
      tpm: 0, tpa: 0, ftm: 0, fta: 0, minutes: 36 * games,
    },
  } as unknown as PlayerProfile;
}

function makeTeams(wins: number): Team[] {
  const teams = structuredClone(NBA_TEAMS_2008);
  const team = teams.find((candidate) => candidate.id === 'lal');
  assert.ok(team);
  team.wins = wins;
  team.losses = 82 - wins;
  return teams;
}

function allNbaTier(teams: Team[], player: PlayerProfile): number | undefined {
  const awards = calculateSeasonAwards(teams, player, 2008);
  return awards.allNbaTeams.find((team) => team.players.some((candidate) => candidate.isUser))?.teamIndex;
}

test('a 60-win high-OVR 25+5+5 player reaches an all-league top two team', () => {
  const tier = allNbaTier(makeTeams(60), makePlayer(25, 5, 5));
  assert.ok(tier !== undefined && tier <= 2, `expected first or second team, received ${tier}`);
});

test('a 70-win high-OVR 24+3+15 player reaches an all-league top two team', () => {
  const tier = allNbaTier(makeTeams(70), makePlayer(24, 3, 15));
  assert.ok(tier !== undefined && tier <= 2, `expected first or second team, received ${tier}`);
});

test('buzzer-beater odds rise with the relevant scoring attributes', () => {
  const low = { attributes: { ...attributes, threePoint: 60, ballHandle: 60 } };
  const high = { attributes: { ...attributes, threePoint: 99, ballHandle: 99 } };
  assert.ok(calculateBuzzerBeaterSuccessRate(high, '3pt') > calculateBuzzerBeaterSuccessRate(low, '3pt'));
  assert.equal(calculateBuzzerBeaterSuccessRate(high, '3pt'), 0.494);
});

test('attribute ad reward adds 30 points once and respects the career limit', () => {
  const rewarded = applyAttributeAdReward({ ...makePlayer(20, 5, 5), skillPoints: 5, adRewardUses: 1 });
  assert.equal(rewarded.skillPoints, 35);
  assert.equal(rewarded.adRewardUses, 2);

  const capped = applyAttributeAdReward({ ...rewarded, adRewardUses: 3 });
  assert.equal(capped.skillPoints, 35);
  assert.equal(capped.adRewardUses, 3);
});
