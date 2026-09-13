import assert from 'node:assert/strict';
import test from 'node:test';
import type { Position, Team } from '../src/types';
import { executeRandomTradesForSeason, inviteStarToTeam } from '../src/utils/randomTradeLogic';
import { generateParallelDraftData } from '../src/utils/randomDraftLogic';
import { evaluateTeamStrategies, initializeTeamStrategies } from '../src/utils/teamStrategyLogic';

const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

function seededRandom(seed = 17): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function makeLeague(teamCount = 12): Team[] {
  return Array.from({ length: teamCount }, (_, teamIndex) => ({
    id: `team_${teamIndex}`,
    name: `球队${teamIndex}`,
    city: `城市${teamIndex}`,
    abbrev: `T${teamIndex}`,
    primaryColor: '#111111',
    secondaryColor: '#eeeeee',
    rating: 80,
    conference: teamIndex < 6 ? 'East' as const : 'West' as const,
    starPlayer: `球员_${teamIndex}_0`,
    wins: 0,
    losses: 0,
    roster: Array.from({ length: 10 }, (_, playerIndex) => ({
      id: `player_${teamIndex}_${playerIndex}`,
      name: `球员_${teamIndex}_${playerIndex}`,
      position: positions[(playerIndex + teamIndex) % positions.length],
      ovr: 72 + ((playerIndex * 3 + teamIndex) % 20),
      role: playerIndex < 5 ? '绝对首发' : '轮换替补',
    })),
  }));
}

test('parallel league generates a restrained and valid trade window', () => {
  const teams = makeLeague();
  const originalRosterSizes = new Map(teams.map((team) => [team.id, team.roster.length]));
  const result = executeRandomTradesForSeason(teams, 2009, {
    random: seededRandom(),
    minTrades: 5,
    maxTrades: 5,
  });

  assert.equal(result.modalData?.tradeSource, 'random');
  assert.equal(result.modalData?.executedTrades.length, 5);
  for (const team of result.updatedTeams) {
    assert.equal(team.roster.length, originalRosterSizes.get(team.id));
    assert.equal(team.starPlayer, team.roster[0]?.name);
    assert.ok(team.rating >= 65 && team.rating <= 99);
  }

  const movedIds = new Set<string>();
  for (const trade of result.modalData?.executedTrades || []) {
    assert.ok(trade.playerA && trade.playerB);
    assert.ok(Math.abs(trade.playerA!.ovr - trade.playerB!.ovr) <= 11);
    for (const player of [trade.playerA!, trade.playerB!]) {
      assert.equal(movedIds.has(player.name), false, `${player.name} was traded twice`);
      movedIds.add(player.name);
    }
  }
});

test('parallel league keeps the opening 2008 timeline unchanged', () => {
  const teams = makeLeague();
  const result = executeRandomTradesForSeason(teams, 2008, { random: seededRandom() });
  assert.equal(result.modalData, null);
  assert.equal(result.updatedTeams, teams);
});

test('full parallel league performs 14 to 20 moves but only displays major deals', () => {
  const teams = makeLeague(30);
  const result = executeRandomTradesForSeason(teams, 2011, { random: seededRandom(913), userTeamId: 'team_0' });
  assert.ok((result.modalData?.totalTransactions || 0) >= 14);
  assert.ok((result.modalData?.totalTransactions || 0) <= 20);
  assert.ok((result.modalData?.executedTrades.length || 0) >= 6);
  assert.ok((result.modalData?.executedTrades.length || 0) <= 10);
  assert.equal(result.modalData?.hiddenTransactions, (result.modalData?.totalTransactions || 0) - (result.modalData?.executedTrades.length || 0));
});

test('team direction responds to sustained results without skipping across all tiers', () => {
  const teams = makeLeague();
  teams[0].strategy = 'rebuilding';
  teams[0].wins = 65;
  teams[0].losses = 17;
  teams[0].rating = 94;
  const evaluated = evaluateTeamStrategies(teams, 2010);
  assert.equal(evaluated[0].strategy, 'retooling');
  assert.equal(evaluated[0].previousSeasonWins, 65);
});

test('initial team directions always cover all four league tiers', () => {
  const initialized = initializeTeamStrategies(makeLeague(30).map((team, index) => ({ ...team, rating: 95 - Math.floor(index / 2) })), 2008);
  const directions = new Set(initialized.map((team) => team.strategy));
  assert.deepEqual(directions, new Set(['contender', 'playoff', 'retooling', 'rebuilding']));
  assert.ok(initialized.every((team) => team.strategyModelVersion === 2));
});

test('parallel draft follows simulated order while protecting elite prospects', () => {
  const teams = makeLeague(30).map((team, index) => ({
    ...team,
    wins: index + 10,
    losses: 72 - index,
  }));
  const draft = generateParallelDraftData(teams, 2009, seededRandom(42));
  assert.equal(draft?.draftPicks.length, 30);
  assert.equal(new Set(draft?.draftPicks.map((pick) => pick.teamId)).size, 30);
  for (const pick of draft?.draftPicks || []) {
    if ((pick.player.peakOvr || 0) >= 95) assert.ok(pick.pick <= 5);
    else if ((pick.player.peakOvr || 0) >= 91) assert.ok(pick.pick <= 10);
  }
});

test('parallel league never moves the user player', () => {
  const teams = makeLeague();
  const user = teams[0].roster[0];
  user.name = '玩家本人';
  user.id = 'user_player';

  const result = executeRandomTradesForSeason(teams, 2010, {
    random: seededRandom(88),
    minTrades: 8,
    maxTrades: 8,
    userPlayerId: user.id,
    userPlayerName: user.name,
  });

  const userTeam = result.updatedTeams.find((team) => team.id === teams[0].id);
  assert.equal(userTeam?.roster.some((player) => player.id === user.id), true);
  assert.equal(
    result.modalData?.executedTrades.some((trade) =>
      trade.playerA?.name === user.name || trade.playerB?.name === user.name,
    ),
    false,
  );
});

test('invited star replaces an end-of-roster player and stays protected next season', () => {
  const teams = makeLeague();
  const user = teams[0].roster[0];
  const invited = teams[1].roster.find((player) => player.ovr >= 86)!;
  const invitation = inviteStarToTeam(teams, teams[0].id, teams[1].id, invited.id, 2009, user.id, user.name);

  assert.equal(invitation.error, undefined);
  assert.equal(invitation.updatedTeams[0].roster.length, teams[0].roster.length);
  assert.equal(invitation.updatedTeams[1].roster.length, teams[1].roster.length);
  const joined = invitation.updatedTeams[0].roster.find((player) => player.id === invited.id);
  assert.equal(joined?.tradeProtectionUntilYear, 2010);
  assert.equal(joined?.acquisitionSource, 'star_invitation');
  assert.equal(invitation.updatedTeams[1].roster.some((player) => player.id === invitation.outgoingPlayer?.id), true);

  const nextSeason = executeRandomTradesForSeason(invitation.updatedTeams, 2010, {
    random: seededRandom(901),
    minTrades: 8,
    maxTrades: 8,
    userPlayerId: user.id,
    userPlayerName: user.name,
  });
  assert.equal(
    nextSeason.modalData?.executedTrades.some((trade) =>
      trade.playerA?.name === invited.name || trade.playerB?.name === invited.name,
    ),
    false,
  );
});
