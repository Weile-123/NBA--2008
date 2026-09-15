import assert from 'node:assert/strict';
import test from 'node:test';
import type { Position, Team } from '../src/types';
import { DESTINY_EVENTS, evaluateDestinyEvent, getDestinyEventEntrySummary, ignoreDestinyEvent, triggerDestinyEvent } from '../src/data/destinyEvents';
import { executeRandomTradesForSeason } from '../src/utils/randomTradeLogic';
import { getSeasonSimulationPowerRating } from '../src/utils/parallelSeasonBalance';

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

test('decision one requires LeBron to remain without a championship', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_1')!;
  const teams = [
    makeTeam('cle', '克里夫兰', [{ id: 'lebron', name: '勒布朗·詹姆斯', ovr: 96 }]),
    makeTeam('mia', '迈阿密', [{ id: 'wade', name: '德维恩·韦德', ovr: 94 }]),
    makeTeam('tor', '多伦多', [{ id: 'bosh', name: '克里斯·波什', ovr: 89 }]),
  ];
  teams[1].strategy = 'playoff';
  assert.equal(evaluateDestinyEvent(event, 2009, teams).status, 'upcoming');
  assert.equal(evaluateDestinyEvent(event, 2010, teams).status, 'available');
  assert.equal(evaluateDestinyEvent(event, 2011, teams).status, 'expired');
  assert.equal(evaluateDestinyEvent(event, 2010, teams, [{
    year: 2009, seasonStr: '2009-10', champion: '克里夫兰', championId: 'cle', mvp: '其他人', fmvp: '其他人', dpoy: '其他人', roy: '其他人', championRosterPlayerNames: ['勒布朗·詹姆斯'],
  }]).status, 'unavailable');
});

test('future routes cannot become available or be triggered early', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_1')!;
  const teams = [
    makeTeam('cle', '克里夫兰', [{ id: 'lebron', name: '勒布朗·詹姆斯', ovr: 96 }]),
    makeTeam('mia', '迈阿密', [{ id: 'wade', name: '德维恩·韦德', ovr: 94 }]),
    makeTeam('tor', '多伦多', [{ id: 'bosh', name: '克里斯·波什', ovr: 89 }]),
  ];
  teams[1].strategy = 'playoff';
  const evaluation = evaluateDestinyEvent(event, 2009, teams);
  assert.equal(evaluation.status, 'upcoming');
  assert.equal(evaluation.routeEvaluations.some((route) => route.available), false);
  assert.equal(triggerDestinyEvent(event, 2009, teams).success, false);
});

test('a rewarded ad can unlock the final optional condition after all mandatory conditions pass', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_1')!;
  const cleveland = makeTeam('cle', '克里夫兰', [{ id: 'lebron', name: '勒布朗·詹姆斯', ovr: 96 }]);
  const miami = makeTeam('mia', '迈阿密', [{ id: 'wade', name: '德维恩·韦德', ovr: 94 }]);
  const toronto = makeTeam('tor', '多伦多', [{ id: 'bosh', name: '克里斯·波什', ovr: 89 }]);
  cleveland.previousSeasonWins = 60;
  miami.previousSeasonWins = 45;
  miami.strategy = 'playoff';
  const teams = [cleveland, miami, toronto];
  const before = evaluateDestinyEvent(event, 2010, teams);
  const route = before.routeEvaluations.find((candidate) => candidate.route.id === 'south_beach')!;
  assert.equal(route.score, 2);
  assert.equal(route.available, false);
  const missing = route.checks.find((check) => !check.met && !check.required)!;
  const after = evaluateDestinyEvent(event, 2010, teams, [], {}, [missing.unlockKey]);
  assert.equal(after.routeEvaluations.find((candidate) => candidate.route.id === 'south_beach')?.available, true);
  assert.equal(triggerDestinyEvent(event, 2010, teams, [], {}, undefined, undefined, 'south_beach', [missing.unlockKey]).success, true);
});

test('linked destiny events require their preceding event or exact branch', () => {
  const lebron = { id: 'lebron', name: '勒布朗·詹姆斯', ovr: 96 };
  const cleveland = makeTeam('cle', '克里夫兰', [lebron]);
  cleveland.strategy = 'contender';
  cleveland.previousSeasonWins = 50;
  const decisionTwo = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_2')!;
  assert.equal(evaluateDestinyEvent(decisionTwo, 2014, [cleveland]).requiredScore, 3);
  assert.equal(evaluateDestinyEvent(decisionTwo, 2014, [cleveland]).checks.find((check) => check.label.includes('决定一'))?.met, false);
  const decisionOneRecord = { decision_1: { eventId: 'decision_1', triggeredAtYear: 2010, result: '完成', movedPlayers: [] } };
  assert.equal(evaluateDestinyEvent(decisionTwo, 2014, [cleveland], [], decisionOneRecord).checks.find((check) => check.label.includes('决定一'))?.met, true);

  const davis = makeTeam('noh', '新奥尔良', [{ id: 'davis', name: '安东尼·戴维斯', ovr: 94 }]);
  const lakers = makeTeam('lal', '洛杉矶湖人', [lebron]);
  const adEvent = DESTINY_EVENTS.find((candidate) => candidate.id === 'ad_lakers')!;
  const wrongRouteRecord = { lebron_lakers: { eventId: 'lebron_lakers', triggeredAtYear: 2018, result: '完成', movedPlayers: [], routeId: 'process' } };
  const rightRouteRecord = { lebron_lakers: { ...wrongRouteRecord.lebron_lakers, routeId: 'hollywood' } };
  assert.equal(evaluateDestinyEvent(adEvent, 2019, [lakers, davis], [], wrongRouteRecord).checks.find((check) => check.label.includes('天选之子西游'))?.met, false);
  assert.equal(evaluateDestinyEvent(adEvent, 2019, [lakers, davis], [], rightRouteRecord).checks.find((check) => check.label.includes('天选之子西游'))?.met, true);
});

test('season entry reports a completed decision instead of unmet conditions', () => {
  const decisionTwo = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_2')!;
  const records = {
    decision_1: { eventId: 'decision_1', triggeredAtYear: 2010, result: '完成', movedPlayers: [] },
    decision_2: { eventId: 'decision_2', triggeredAtYear: 2014, result: '完成', movedPlayers: [] },
  };
  const evaluation = evaluateDestinyEvent(decisionTwo, 2014, [], [], records);
  assert.equal(getDestinyEventEntrySummary([evaluation], 2014), '本赛季命定事件已完成');
});

test('Melo to New York is blocked only when decision one selected Broadway', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'melo_new_york')!;
  const teams = [
    makeTeam('den', '丹佛', [{ id: 'melo', name: '卡梅隆·安东尼', ovr: 93 }]),
    makeTeam('nyk', '纽约'),
  ];
  const southBeachRecord = { decision_1: { eventId: 'decision_1', triggeredAtYear: 2010, result: '完成', movedPlayers: [], routeId: 'south_beach' } };
  const broadwayRecord = { decision_1: { ...southBeachRecord.decision_1, routeId: 'broadway' } };
  assert.equal(evaluateDestinyEvent(event, 2011, teams, [], {}).status, 'available');
  assert.equal(evaluateDestinyEvent(event, 2011, teams, [], southBeachRecord).status, 'available');
  assert.equal(evaluateDestinyEvent(event, 2011, teams, [], broadwayRecord).status, 'unavailable');
});

test('vetoed 2011 Chris Paul trade can send Paul to the Lakers under public fit conditions', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'cp3_lakers')!;
  const lakers = makeTeam('lal', '洛杉矶湖人', [
    { id: 'kobe', name: '科比·布莱恩特', ovr: 95 },
    { id: 'gasol', name: '保罗·加索尔', ovr: 89 },
  ]);
  lakers.strategy = 'contender';
  lakers.previousSeasonWins = 57;
  const hornets = makeTeam('noh', '新奥尔良黄蜂', [{ id: 'cp3', name: '克里斯·保罗', ovr: 94 }]);
  hornets.previousSeasonWins = 46;
  const evaluation = evaluateDestinyEvent(event, 2011, [lakers, hornets]);
  assert.equal(evaluation.status, 'available');
  assert.equal(evaluation.requiredScore, 3);
  const result = triggerDestinyEvent(event, 2011, [lakers, hornets]);
  assert.equal(result.success, true);
  assert.equal(result.teams.find((team) => team.id === 'lal')?.roster.some((player) => player.id === 'cp3'), true);
});

test('later event conditions use championship history and the rebuilt Brooklyn chain', () => {
  const lebronEvent = DESTINY_EVENTS.find((candidate) => candidate.id === 'lebron_lakers')!;
  const lebronTeams = [makeTeam('cle', '克里夫兰', [{ id: 'lebron', name: '勒布朗·詹姆斯', ovr: 96 }])];
  const titleHistory = [
    { year: 2016, seasonStr: '2016-17', champion: '金州', championId: 'gsw', mvp: '其他人', fmvp: '其他人', dpoy: '其他人', roy: '其他人', championRosterPlayerNames: ['其他人'] },
    { year: 2017, seasonStr: '2017-18', champion: '克里夫兰', championId: 'cle', mvp: '其他人', fmvp: '勒布朗·詹姆斯', dpoy: '其他人', roy: '其他人', championRosterPlayerNames: ['勒布朗·詹姆斯'] },
  ];
  assert.equal(evaluateDestinyEvent(lebronEvent, 2018, lebronTeams, titleHistory).checks.find((check) => check.label.includes('此前2个赛季'))?.met, false);
  titleHistory[1] = { ...titleHistory[1], champion: '波士顿', championId: 'bos', fmvp: '其他人', championRosterPlayerNames: ['其他人'] };
  assert.equal(evaluateDestinyEvent(lebronEvent, 2018, lebronTeams, titleHistory).checks.find((check) => check.label.includes('此前2个赛季'))?.met, true);

  const brooklynPair = DESTINY_EVENTS.find((candidate) => candidate.id === 'durant_kyrie_brooklyn')!;
  const nets = makeTeam('bkn', '布鲁克林');
  const warriors = makeTeam('gsw', '金州', [{ id: 'durant', name: '凯文·杜兰特', ovr: 96 }]);
  const celtics = makeTeam('bos', '波士顿', [{ id: 'kyrie', name: '凯里·欧文', ovr: 92 }]);
  const durantRecord = { durant_warriors: { eventId: 'durant_warriors', triggeredAtYear: 2016, result: '完成', movedPlayers: [], routeId: 'bay_area' } };
  const brooklynHistory = [{ year: 2018, seasonStr: '2018-19', champion: '多伦多', championId: 'tor', mvp: '其他人', fmvp: '其他人', dpoy: '其他人', roy: '其他人' }];
  assert.equal(evaluateDestinyEvent(brooklynPair, 2019, [nets, warriors, celtics], brooklynHistory, {}).status, 'unavailable');
  assert.equal(evaluateDestinyEvent(brooklynPair, 2019, [nets, warriors, celtics], brooklynHistory, durantRecord).status, 'available');
  const warriorsTitleHistory = [{ ...brooklynHistory[0], champion: '金州', championId: 'gsw', championRosterPlayerNames: ['凯文·杜兰特'] }];
  assert.equal(evaluateDestinyEvent(brooklynPair, 2019, [nets, warriors, celtics], warriorsTitleHistory, durantRecord).status, 'unavailable');

  const hardenEvent = DESTINY_EVENTS.find((candidate) => candidate.id === 'harden_brooklyn')!;
  const brooklyn = makeTeam('bkn', '布鲁克林', [{ id: 'durant', name: '凯文·杜兰特', ovr: 96 }, { id: 'kyrie', name: '凯里·欧文', ovr: 92 }]);
  brooklyn.strategy = 'contender';
  const houston = makeTeam('hou', '休斯敦', [{ id: 'harden', name: '詹姆斯·哈登', ovr: 95 }]);
  const pairRecord = { durant_kyrie_brooklyn: { eventId: 'durant_kyrie_brooklyn', triggeredAtYear: 2019, result: '完成', movedPlayers: ['凯文·杜兰特', '凯里·欧文'] } };
  const evaluation = evaluateDestinyEvent(hardenEvent, 2021, [brooklyn, houston], [{ year: 2020, seasonStr: '2020-21', champion: '洛杉矶湖人', championId: 'lal', mvp: '其他人', fmvp: '其他人', dpoy: '其他人', roy: '其他人' }], pairRecord);
  assert.equal(evaluation.checks.some((check) => check.label.includes('88+综评')), false);
  assert.equal(evaluation.checks.some((check) => check.label.includes('不超过55胜')), false);
  assert.equal(evaluation.checks.find((check) => check.label.includes('上赛季未夺冠'))?.met, true);
  assert.equal(evaluation.status, 'available');
});

test('removed events no longer appear in the destiny catalog', () => {
  for (const id of ['lockout_2011', 'small_ball_revolution', 'bubble_2020', 'lakers_f4', 'holiday_bucks', 'gobert_wolves', 'kawhi_extension']) {
    assert.equal(DESTINY_EVENTS.some((event) => event.id === id), false);
  }
});

test('parallel pre-decision Cavaliers receive a small simulation-only penalty', () => {
  const cavaliers = makeTeam('cle', '克里夫兰', [{ id: 'lebron', name: '勒布朗·詹姆斯', ovr: 97 }]);
  const classicRating = getSeasonSimulationPowerRating(cavaliers, 'classic', 2009);
  assert.equal(getSeasonSimulationPowerRating(cavaliers, 'random_trade', 2009), classicRating - 2);
  assert.equal(getSeasonSimulationPowerRating(cavaliers, 'random_trade', 2010), classicRating);
});

test('triggering a destiny event preserves roster sizes and the user player', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_1')!;
  const teams = [
    makeTeam('cle', '克里夫兰', [{ id: 'lebron', name: '勒布朗·詹姆斯', ovr: 96 }]),
    makeTeam('mia', '迈阿密', [{ id: 'wade', name: '德维恩·韦德', ovr: 94 }, { id: 'user', name: '测试玩家', ovr: 60 }]),
    makeTeam('tor', '多伦多', [{ id: 'bosh', name: '克里斯·波什', ovr: 89 }]),
  ];
  const sizes = new Map(teams.map((team) => [team.id, team.roster.length]));
  teams[1].strategy = 'playoff';
  teams[1].previousSeasonWins = 45;
  const result = triggerDestinyEvent(event, 2010, teams, [], {}, 'user', '测试玩家', 'south_beach');
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
  teams[1].strategy = 'contender';
  teams[1].previousSeasonWins = 60;
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

test('destiny catalog has valid dependencies, no same-year duplicate player moves, and labeled history', () => {
  const eventsById = new Map(DESTINY_EVENTS.map((event) => [event.id, event]));
  const eventOrder = new Map(DESTINY_EVENTS.map((event, index) => [event.id, index]));
  const moveEventsByYearAndPlayer = new Map<string, Set<string>>();
  for (const event of DESTINY_EVENTS) {
    assert.ok(event.history.startsWith('现实中：'), `${event.id} 缺少现实背景前缀`);
    assert.equal(new Set((event.routes || []).map((route) => route.id)).size, event.routes?.length || 0, `${event.id} 存在重复分支 ID`);
    const conditionGroups = [event.conditions, ...(event.routes || []).map((route) => route.conditions)];
    for (const conditions of conditionGroups) {
      const signatures = conditions.map((condition) => JSON.stringify({
        type: condition.type,
        playerNames: condition.playerNames,
        teamId: condition.teamId,
        eventId: condition.eventId,
        routeId: condition.routeId,
        strategies: condition.strategies,
        value: condition.value,
        ovrThreshold: condition.ovrThreshold,
      }));
      assert.equal(new Set(signatures).size, signatures.length, `${event.id} 存在重复条件`);
    }
    for (const condition of conditionGroups.flat()) {
      if (!condition.eventId) continue;
      const dependency = eventsById.get(condition.eventId);
      assert.ok(dependency, `${event.id} 引用了不存在的事件 ${condition.eventId}`);
      assert.ok(
        dependency!.year < event.year || (dependency!.year === event.year && eventOrder.get(condition.eventId)! < eventOrder.get(event.id)!),
        `${event.id} 的前置事件必须位于更早年份，或同年列表中的更早位置`,
      );
      if (condition.routeId) {
        assert.ok(dependency!.routes?.some((route) => route.id === condition.routeId), `${event.id} 引用了不存在的分支 ${condition.routeId}`);
      }
    }
    const optionalPoints = event.conditions.filter((condition) => condition.required !== true).reduce((sum, condition) => sum + (condition.points || 0), 0);
    if (event.skipDefaultScoring || event.guide) assert.ok(optionalPoints >= (event.requiredScore || 0), `${event.id} 的最高条件分不足以触发事件`);
    for (const route of event.routes || []) {
      const routePoints = route.conditions.filter((condition) => condition.required !== true).reduce((sum, condition) => sum + (condition.points || 0), 0);
      assert.ok(routePoints >= route.requiredScore, `${event.id}/${route.id} 的最高条件分不足以触发分支`);
    }
    const possibleMoves = [...(event.moves || []), ...(event.routes || []).flatMap((route) => route.moves)];
    for (const move of possibleMoves) {
      const key = `${event.year}:${move.playerName}`;
      const eventIds = moveEventsByYearAndPlayer.get(key) || new Set<string>();
      eventIds.add(event.id);
      moveEventsByYearAndPlayer.set(key, eventIds);
    }
  }
  for (const [key, eventIds] of moveEventsByYearAndPlayer) {
    assert.equal(eventIds.size, 1, `${key} 存在相互冲突的命定转会：${[...eventIds].join('、')}`);
  }
});

test('major events require a public numeric fit score instead of player existence alone', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'howard_houston')!;
  const houston = makeTeam('hou', '休斯敦', [
    { id: 'elite_1', name: '休斯敦巨星一', ovr: 94 },
    { id: 'elite_2', name: '休斯敦巨星二', ovr: 92 },
    { id: 'elite_3', name: '休斯敦巨星三', ovr: 90 },
  ]);
  houston.strategy = 'rebuilding';
  const orlando = makeTeam('orl', '奥兰多', [{ id: 'howard', name: '德怀特·霍华德', ovr: 95 }]);
  orlando.previousSeasonWins = 60;
  const hardenRecord = { harden_houston: { eventId: 'harden_houston', triggeredAtYear: 2012, result: '完成', movedPlayers: ['詹姆斯·哈登'] } };
  const unavailable = evaluateDestinyEvent(event, 2013, [houston, orlando], [], hardenRecord);
  assert.equal(unavailable.checks.some((check) => check.label.includes('仍在联盟')), false);
  assert.equal(unavailable.checks.some((check) => check.label.includes('球队方向')), false);
  assert.equal(unavailable.score, 0);
  assert.equal(unavailable.requiredScore, 2);
  assert.equal(unavailable.status, 'unavailable');

  houston.strategy = 'retooling';
  houston.roster = houston.roster.filter((player) => player.id !== 'elite_2' && player.id !== 'elite_3');
  orlando.previousSeasonWins = 45;
  const available = evaluateDestinyEvent(event, 2013, [houston, orlando], [], hardenRecord);
  assert.equal(available.score, 2);
  assert.equal(available.status, 'available');
});

test('Howard and Davis event dependencies do not repeat equivalent team conditions', () => {
  const howardEvent = DESTINY_EVENTS.find((candidate) => candidate.id === 'howard_houston')!;
  assert.equal(howardEvent.conditions.some((condition) => condition.type === 'event_completed' && condition.eventId === 'harden_houston'), true);
  assert.equal(howardEvent.conditions.some((condition) => condition.type === 'team_strategy_in'), false);

  const davisEvent = DESTINY_EVENTS.find((candidate) => candidate.id === 'ad_lakers')!;
  assert.equal(davisEvent.conditions.some((condition) => condition.type === 'event_completed' && condition.routeId === 'hollywood'), true);
  assert.equal(davisEvent.conditions.some((condition) => condition.type === 'player_on_team' && condition.playerNames?.includes('勒布朗·詹姆斯')), false);
});

test('inevitable roster-presence checks stay hidden while missing event players still block execution', () => {
  for (const event of DESTINY_EVENTS) {
    for (const condition of [...event.conditions, ...(event.routes || []).flatMap((route) => route.conditions)]) {
      assert.notEqual(condition.type, 'player_exists');
      assert.notEqual(condition.type, 'players_exist');
      assert.equal(condition.label.includes('仍在联盟'), false);
    }
  }
  const hardenEvent = DESTINY_EVENTS.find((candidate) => candidate.id === 'harden_houston')!;
  const houston = makeTeam('hou', '休斯敦');
  houston.strategy = 'contender';
  assert.equal(evaluateDestinyEvent(hardenEvent, 2012, [houston]).status, 'unavailable');
  assert.equal(triggerDestinyEvent(hardenEvent, 2012, [houston]).success, false);
});

test('Lillard can join Milwaukee only while Antetokounmpo remains with the Bucks', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'lillard_bucks')!;
  const lillard = { id: 'lillard', name: '达米安·利拉德', ovr: 94 };
  const giannis = { id: 'giannis', name: '扬尼斯·阿德托昆博', ovr: 97 };
  const portland = makeTeam('por', '波特兰', [lillard]);
  portland.previousSeasonWins = 40;
  const milwaukee = makeTeam('mil', '密尔沃基雄鹿', [giannis]);
  milwaukee.strategy = 'contender';
  const available = evaluateDestinyEvent(event, 2023, [portland, milwaukee]);
  assert.equal(available.checks.find((check) => check.label.includes('扬尼斯·阿德托昆博效力于密尔沃基雄鹿'))?.met, true);
  assert.equal(available.status, 'available');

  const miami = makeTeam('mia', '迈阿密', [giannis]);
  const milwaukeeWithoutGiannis = makeTeam('mil', '密尔沃基雄鹿');
  milwaukeeWithoutGiannis.strategy = 'contender';
  assert.equal(evaluateDestinyEvent(event, 2023, [portland, milwaukeeWithoutGiannis, miami]).status, 'unavailable');
});

test('decision one exposes multiple routes and records the selected branch result', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_1')!;
  const cleveland = makeTeam('cle', '克里夫兰', [{ id: 'lebron', name: '勒布朗·詹姆斯', ovr: 96 }]);
  cleveland.previousSeasonWins = 50;
  const miami = makeTeam('mia', '迈阿密', [{ id: 'wade', name: '德维恩·韦德', ovr: 94 }]);
  miami.strategy = 'contender';
  miami.previousSeasonWins = 45;
  const toronto = makeTeam('tor', '多伦多', [{ id: 'bosh', name: '克里斯·波什', ovr: 89 }]);
  const newYork = makeTeam('nyk', '纽约');
  newYork.strategy = 'rebuilding';
  const teams = [cleveland, miami, toronto, newYork];
  const evaluation = evaluateDestinyEvent(event, 2010, teams);
  assert.equal(evaluation.routeEvaluations.length, 3);
  assert.equal(evaluation.routeEvaluations.some((route) => route.route.id === 'windy_city'), false);
  const result = triggerDestinyEvent(event, 2010, teams, [], {}, undefined, undefined, 'south_beach');
  assert.equal(result.success, true);
  assert.equal(result.record?.routeId, 'south_beach');
  assert.equal(result.teams.find((team) => team.id === 'mia')?.roster.some((player) => player.id === 'lebron'), true);
});

test('ignoring an event records no roster change and decision fallbacks select their stay route', () => {
  const tradeEvent = DESTINY_EVENTS.find((candidate) => candidate.id === 'paul_suns')!;
  const ignored = ignoreDestinyEvent(tradeEvent, 2020);
  assert.equal(ignored.success, true);
  assert.equal(ignored.record?.ignored, true);
  assert.deepEqual(ignored.record?.movedPlayers, []);
  assert.equal(evaluateDestinyEvent(tradeEvent, 2020, [], [], { paul_suns: ignored.record! }).status, 'ignored');

  const decisionOne = DESTINY_EVENTS.find((candidate) => candidate.id === 'decision_1')!;
  const stayed = ignoreDestinyEvent(decisionOne, 2010);
  assert.equal(stayed.record?.ignored, true);
  assert.equal(stayed.record?.routeId, 'stay_cavaliers');
  assert.deepEqual(stayed.record?.movedPlayers, []);
});

test('ignoring Durant choice sends Durant to a random different team', () => {
  const event = DESTINY_EVENTS.find((candidate) => candidate.id === 'durant_warriors')!;
  const thunder = makeTeam('okc', '俄克拉荷马', [{ id: 'durant', name: '凯文·杜兰特', ovr: 96 }]);
  const celtics = makeTeam('bos', '波士顿', [{ id: 'reserve', name: '替补球员', ovr: 70 }]);
  const ignored = ignoreDestinyEvent(event, 2016, {}, [thunder, celtics], undefined, undefined, false, () => 0);
  assert.equal(ignored.success, true);
  assert.equal(ignored.record?.ignored, true);
  assert.deepEqual(ignored.record?.movedPlayers, ['凯文·杜兰特']);
  assert.equal(ignored.teams.find((team) => team.id === 'bos')?.roster.some((player) => player.name === '凯文·杜兰特'), true);
});

test('revised destiny catalog keeps the requested thresholds, replacements and dependencies', () => {
  const byId = (id: string) => DESTINY_EVENTS.find((event) => event.id === id)!;
  const decisionOne = byId('decision_1');
  const southBeach = decisionOne.routes!.find((route) => route.id === 'south_beach')!;
  assert.equal(southBeach.requiredScore, 3);
  assert.equal(southBeach.conditions.find((condition) => condition.playerNames?.includes('德维恩·韦德'))?.required, true);
  assert.equal(southBeach.conditions.some((condition) => condition.teamId === 'mia' && condition.type === 'team_previous_wins_at_least' && condition.value === 45), true);
  assert.equal(decisionOne.routes!.find((route) => route.id === 'stay_cavaliers')?.fallback, true);

  const vetoedTrade = byId('cp3_lakers');
  assert.equal(vetoedTrade.title, '被叫停的交易');
  assert.equal(vetoedTrade.conditions.some((condition) => condition.type === 'team_strategy_in'), false);
  assert.equal(vetoedTrade.conditions.some((condition) => condition.type === 'team_previous_wins_at_least' && condition.value === 53), true);
  assert.equal(byId('howard_houston').conditions.some((condition) => condition.playerNames?.includes('德怀特·霍华德') && condition.value === 50), true);

  const decisionTwo = byId('decision_2');
  assert.equal(decisionTwo.conditions.some((condition) => condition.type === 'event_completed_route_not_selected' && condition.routeId === 'stay_cavaliers'), true);
  const durant = byId('durant_warriors');
  assert.equal(durant.routes!.find((route) => route.id === 'bay_area')?.conditions.find((condition) => condition.playerNames?.includes('斯蒂芬·库里'))?.required, true);
  assert.equal(durant.routes!.find((route) => route.id === 'thunder_return')?.conditions.some((condition) => condition.type === 'team_previous_wins_at_least' && condition.value === 50), true);
  assert.equal(byId('cp3_houston').conditions.some((condition) => condition.type === 'event_completed_player_on_team'), true);

  const lebron = byId('lebron_lakers');
  assert.equal(lebron.routes!.find((route) => route.id === 'hollywood')?.conditions.some((condition) => condition.type === 'team_strategy_in'), false);
  assert.equal(lebron.routes!.find((route) => route.id === 'hollywood')?.conditions.some((condition) => condition.type === 'team_max_elite_players' && condition.ovrThreshold === 90 && condition.value === 1), true);
  assert.equal(lebron.routes!.find((route) => route.id === 'process')?.conditions.find((condition) => condition.playerNames?.includes('乔尔·恩比德'))?.required, true);
  assert.equal(lebron.routes!.find((route) => route.id === 'home_guardian')?.fallback, true);
  assert.equal(byId('ad_lakers').conditions.some((condition) => condition.type === 'team_max_elite_players' && condition.ovrThreshold === 90 && condition.value === 2), true);

  assert.equal(DESTINY_EVENTS.some((event) => event.id === 'paul_suns'), true);
  assert.equal(DESTINY_EVENTS.some((event) => event.id === 'klay_leaves_warriors'), true);
  assert.equal(DESTINY_EVENTS.some((event) => event.id === 'luka_davis_swap' && event.year === 2025), true);
});
