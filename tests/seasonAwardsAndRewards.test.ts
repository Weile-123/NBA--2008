import assert from 'node:assert/strict';
import test from 'node:test';
import { NBA_TEAMS_2008 } from '../src/data/nbaData2008';
import type { Attributes, PlayerProfile, Team } from '../src/types';
import { applyAttributeAdReward } from '../src/utils/attributeTraining';
import { calculateSeasonAwards } from '../src/utils/awardsLogic';
import { calculateBuzzerBeaterSuccessRate } from '../src/utils/matchEvents';
import { calculateGoatScore } from '../src/utils/calc2k';
import { isLocalOnlyStatTitle, leaderboardAccoladeTitles, LOCAL_ONLY_STAT_TITLES } from '../src/utils/localOnlyAwards';

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

test('best rookie goes to the stronger first-season production', () => {
  const player = makePlayer(15, 3, 8);
  player.isRookie = true;
  const teams = makeTeams(40);
  const rival = teams.find((team) => team.id === 'bos')?.roster.at(-1);
  assert.ok(rival);
  rival.isRookie = true;
  rival.stats = { ppg: 8, rpg: 2, apg: 3, spg: 0, bpg: 0, fgPct: 45 };
  for (const team of teams) team.roster = [];
  const boston = teams.find((team) => team.id === 'bos');
  assert.ok(boston);
  boston.roster = [rival];

  const awards = calculateSeasonAwards(teams, player, 2008);
  assert.equal(awards.roy.isUser, true, `winner: ${awards.roy.name} ${awards.roy.ppg}+${awards.roy.rpg}+${awards.roy.apg}`);
});

test('statistical leaders use regular-season simulation and the user actual three-point total', () => {
  const player = makePlayer(36, 24, 22);
  player.seasonStats.stl = 6 * 82;
  player.seasonStats.blk = 8 * 82;
  player.seasonStats.tpm = 7 * 82;
  const awards = calculateSeasonAwards(makeTeams(60), player, 2008);
  assert.equal(awards.reboundLeader.isUser, true);
  assert.equal(awards.assistLeader.isUser, true);
  assert.equal(awards.stealLeader.isUser, true);
  assert.equal(awards.blockLeader.isUser, true);
  assert.equal(awards.threePointLeader.isUser, true);
  assert.equal(awards.threePointLeader.tpm, 7);
});

test('DPOY rewards dominant defensive production even outside the playoffs', () => {
  const player = makePlayer(12, 15.4, 2);
  player.attributes = { ...attributes, perimeterDef: 70, interiorDef: 70 };
  player.seasonStats.stl = 2.1 * 82;
  player.seasonStats.blk = 3.9 * 82;

  const teams = makeTeams(20);
  for (const team of teams) {
    if (team.conference === 'West' && team.id !== 'lal') {
      team.wins = 50;
      team.losses = 32;
    }
  }
  const memphis = teams.find((team) => team.id === 'mem');
  const gasol = memphis?.roster.find((rosterPlayer) => rosterPlayer.name === '马克·加索尔');
  assert.ok(memphis && gasol);
  memphis.wins = 60;
  memphis.losses = 22;
  gasol.ovr = 90;
  gasol.stats = { ppg: 15, rpg: 11.2, apg: 3, spg: 0.8, bpg: 2.1, fgPct: 50 };

  const awards = calculateSeasonAwards(teams, player, 2008);
  assert.equal(awards.userMadePlayoffs, false);
  assert.equal(awards.dpoy.isUser, true);
  assert.equal(awards.dpoy.probabilityPct, 100);
});

test('new local stat honors do not change GOAT score or enter retired leaderboard titles', () => {
  const player = makePlayer(25, 10, 10);
  player.accolades = [];
  const baseline = calculateGoatScore(player).score;
  player.accolades = LOCAL_ONLY_STAT_TITLES.map((title, index) => ({
    year: 2008, seasonStr: '2008-2009', title, type: ['REBOUND_LEADER', 'ASSIST_LEADER', 'THREE_POINT_LEADER', 'BLOCK_LEADER', 'STEAL_LEADER'][index],
  }));
  assert.equal(calculateGoatScore(player).score, baseline);
  assert.ok(LOCAL_ONLY_STAT_TITLES.every(isLocalOnlyStatTitle));
  assert.equal(isLocalOnlyStatTitle('常规赛得分王'), false);
  assert.deepEqual(leaderboardAccoladeTitles(['常规赛得分王', ...LOCAL_ONLY_STAT_TITLES]), ['常规赛得分王']);
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
