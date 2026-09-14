import assert from 'node:assert/strict';
import test from 'node:test';
import type { Position, Team } from '../src/types';
import { DESTINY_EVENTS, evaluateDestinyEvent, triggerDestinyEvent } from '../src/data/destinyEvents';
import { executeRandomTradesForSeason } from '../src/utils/randomTradeLogic';

const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

function makeTeam(id: string, name: string, specialPlayers: Array<{ id: string; name: string; ovr: number }> = []): Team {
  const filler = Array.from({ length: 8 - specialPlayers.length }, (_, index) => ({
    id: `${id}_filler_${index}`,
    name: `${name}轮换${index}`,
    position: positions[index % positions.length],
    ovr: 68 + index,
  }));
  const roster = [...specialPlayers.map((player, index) => ({ ...player, position: positions[index % positions.length] })), ...filler];
  return {
    id,
    name,
    city: name,
    abbrev: id.toUpperCase(),
    primaryColor: '#111111',
    secondaryColor: '#eeeeee',
    rating: 80,
    conference: 'East',
    starPlayer: roster[0]?.name || '无',
    wins: 0,
    losses: 0,
    roster,
  };
}

test('destiny event is available only in its exact season with all conditions met', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_1')!;
  const teams = [
    makeTeam('cle', '克里夫兰', [{ id: 'lebron', name: '勒布朗·詹姆斯', ovr: 96 }]),
    makeTeam('mia', '迈阿密', [{ id: 'wade', name: '德维恩·韦德', ovr: 94 }]),
    makeTeam('tor', '多伦多', [{ id: 'bosh', name: '克里斯·波什', ovr: 89 }]),
  ];
  assert.equal(evaluateDestinyEvent(event, 2009, teams).status, 'upcoming');
  assert.equal(evaluateDestinyEvent(event, 2010, teams).status, 'available');
  assert.equal(evaluateDestinyEvent(event, 2011, teams).status, 'expired');
  assert.equal(evaluateDestinyEvent(event, 2010, teams, [{
    year: 2009, seasonStr: '2009-10', champion: '克里夫兰', championId: 'cle', mvp: '其他人', fmvp: '其他人', dpoy: '其他人', roy: '其他人', championRosterPlayerNames: ['勒布朗·詹姆斯'],
  }]).status, 'unavailable');
});

test('triggering a destiny event preserves roster sizes and the user player', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_1')!;
  const teams = [
    makeTeam('cle', '克里夫兰', [{ id: 'lebron', name: '勒布朗·詹姆斯', ovr: 96 }]),
    makeTeam('mia', '迈阿密', [{ id: 'wade', name: '德维恩·韦德', ovr: 94 }, { id: 'user', name: '测试玩家', ovr: 60 }]),
    makeTeam('tor', '多伦多', [{ id: 'bosh', name: '克里斯·波什', ovr: 89 }]),
  ];
  const sizes = new Map(teams.map((team) => [team.id, team.roster.length]));
  const result = triggerDestinyEvent(event, 2010, teams, [], {}, 'user', '测试玩家');
  assert.equal(result.success, true);
  assert.equal(result.record?.movedPlayers.length, 2);
  assert.equal(result.teams.find((team) => team.id === 'mia')?.roster.some((player) => player.id === 'user'), true);
  assert.equal(result.teams.find((team) => team.id === 'mia')?.roster.some((player) => player.name === '勒布朗·詹姆斯'), true);
  assert.equal(result.teams.find((team) => team.id === 'mia')?.roster.some((player) => player.name === '克里斯·波什'), true);
  for (const team of result.teams) assert.equal(team.roster.length, sizes.get(team.id));
});

test('destiny protagonists remain unavailable to random trades through the protection window', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'durant_warriors')!;
  const teams = [
    makeTeam('okc', '俄克拉荷马', [{ id: 'durant', name: '凯文·杜兰特', ovr: 96 }]),
    makeTeam('gsw', '金州', [{ id: 'curry', name: '斯蒂芬·库里', ovr: 97 }]),
    ...Array.from({ length: 8 }, (_, index) => makeTeam(`team_${index}`, `球队${index}`)),
  ];
  const triggered = triggerDestinyEvent(event, 2016, teams);
  const durant = triggered.teams.flatMap((team) => team.roster).find((player) => player.id === 'durant');
  assert.equal(durant?.tradeProtectionUntilYear, 2018);
  const afterTrades = executeRandomTradesForSeason(triggered.teams, 2018, { random: () => 0.4, minTrades: 8, maxTrades: 8 });
  assert.equal(afterTrades.updatedTeams.find((team) => team.id === 'gsw')?.roster.some((player) => player.id === 'durant'), true);
});

test('destiny event catalog covers multiple eras without duplicate ids', () => {
  assert.ok(DESTINY_EVENTS.length >= 20);
  assert.equal(new Set(DESTINY_EVENTS.map((event) => event.id)).size, DESTINY_EVENTS.length);
  assert.ok(Math.min(...DESTINY_EVENTS.map((event) => event.year)) <= 2010);
  assert.ok(Math.max(...DESTINY_EVENTS.map((event) => event.year)) >= 2024);
});
