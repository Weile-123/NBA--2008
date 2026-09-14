import type { GameState, RosterPlayer, Team } from '../types';
import { calculateTeamPowerRating } from '../utils/leagueLogic';

export type DestinyEventCategory = '决定' | '重磅交易' | '自由市场' | '联盟大事';

export interface DestinyEventCondition {
  type: 'player_exists' | 'player_on_team' | 'player_without_title' | 'players_exist';
  playerNames?: string[];
  teamId?: string;
  label: string;
}

export interface DestinyEventMove {
  playerName: string;
  destinationTeamId: string;
}

export interface DestinyEventDefinition {
  id: string;
  year: number;
  title: string;
  category: DestinyEventCategory;
  history: string;
  result: string;
  conditions: DestinyEventCondition[];
  moves?: DestinyEventMove[];
  protectionYears: 2 | 3;
}

export interface DestinyEventRecord {
  eventId: string;
  triggeredAtYear: number;
  result: string;
  movedPlayers: string[];
}

export type DestinyEventStatus = 'upcoming' | 'unavailable' | 'available' | 'triggered' | 'expired';

export interface DestinyEventEvaluation {
  event: DestinyEventDefinition;
  status: DestinyEventStatus;
  checks: Array<{ label: string; met: boolean }>;
  record?: DestinyEventRecord;
}

const exists = (playerName: string): DestinyEventCondition => ({
  type: 'player_exists', playerNames: [playerName], label: `${playerName}仍在联盟中`,
});
const allExist = (...playerNames: string[]): DestinyEventCondition => ({
  type: 'players_exist', playerNames, label: `${playerNames.join('、')}均在联盟中`,
});
const onTeam = (playerName: string, teamId: string, teamName: string): DestinyEventCondition => ({
  type: 'player_on_team', playerNames: [playerName], teamId, label: `${playerName}效力于${teamName}`,
});
const withoutTitle = (playerName: string): DestinyEventCondition => ({
  type: 'player_without_title', playerNames: [playerName], label: `${playerName}此前尚未夺冠`,
});

export const DESTINY_EVENTS: DestinyEventDefinition[] = [
  {
    id: 'decision_1', year: 2010, title: '决定一：南海岸集结', category: '决定', protectionYears: 3,
    history: '2010 年夏天，勒布朗·詹姆斯宣布离开克里夫兰，与德维恩·韦德、克里斯·波什在迈阿密联手。',
    result: '勒布朗·詹姆斯与克里斯·波什加盟迈阿密，三位核心进入三年稳定期。',
    conditions: [allExist('勒布朗·詹姆斯', '德维恩·韦德', '克里斯·波什'), onTeam('德维恩·韦德', 'mia', '迈阿密'), withoutTitle('勒布朗·詹姆斯')],
    moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'mia' }, { playerName: '克里斯·波什', destinationTeamId: 'mia' }],
  },
  {
    id: 'melo_new_york', year: 2011, title: '甜瓜奔赴纽约', category: '重磅交易', protectionYears: 2,
    history: '卡梅隆·安东尼在生涯巅峰期离开丹佛，纽约迎来久违的超级得分手。',
    result: '卡梅隆·安东尼加盟纽约，成为麦迪逊广场花园的新核心。',
    conditions: [exists('卡梅隆·安东尼')], moves: [{ playerName: '卡梅隆·安东尼', destinationTeamId: 'nyk' }],
  },
  {
    id: 'lockout_2011', year: 2011, title: '停摆后的缩水赛季', category: '联盟大事', protectionYears: 2,
    history: '劳资谈判让新赛季延迟开启，密集赛程成为所有球队必须面对的新考验。',
    result: '缩水赛季成为这条时间线的重要节点，联盟竞争进入高强度阶段。',
    conditions: [exists('勒布朗·詹姆斯')],
  },
  {
    id: 'harden_houston', year: 2012, title: '大胡子独当一面', category: '重磅交易', protectionYears: 3,
    history: '雷霆年轻第六人詹姆斯·哈登被送往休斯敦，从此成长为持球大核心。',
    result: '詹姆斯·哈登加盟休斯敦并获得建队核心地位。',
    conditions: [exists('詹姆斯·哈登')], moves: [{ playerName: '詹姆斯·哈登', destinationTeamId: 'hou' }],
  },
  {
    id: 'howard_houston', year: 2013, title: '魔兽空降休斯敦', category: '自由市场', protectionYears: 2,
    history: '德怀特·霍华德离开洛杉矶，选择前往休斯敦开启新的争冠窗口。',
    result: '德怀特·霍华德加盟休斯敦，球队内线实力得到提升。',
    conditions: [exists('德怀特·霍华德')], moves: [{ playerName: '德怀特·霍华德', destinationTeamId: 'hou' }],
  },
  {
    id: 'decision_2', year: 2014, title: '决定二：回到故乡', category: '决定', protectionYears: 3,
    history: '勒布朗·詹姆斯宣布回归克里夫兰，要为家乡带回一座冠军奖杯。',
    result: '勒布朗·詹姆斯回归克里夫兰，重新成为球队核心。',
    conditions: [exists('勒布朗·詹姆斯')], moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'cle' }],
  },
  {
    id: 'love_cleveland', year: 2014, title: '三巨头最后一块拼图', category: '重磅交易', protectionYears: 2,
    history: '克里夫兰以年轻资产换来凯文·乐福，组建新的争冠三巨头。',
    result: '凯文·乐福加盟克里夫兰，与球队核心共同冲击冠军。',
    conditions: [exists('凯文·乐福'), onTeam('勒布朗·詹姆斯', 'cle', '克里夫兰')], moves: [{ playerName: '凯文·乐福', destinationTeamId: 'cle' }],
  },
  {
    id: 'aldridge_spurs', year: 2015, title: '马刺迎来全明星内线', category: '自由市场', protectionYears: 2,
    history: '拉马库斯·阿尔德里奇选择圣安东尼奥，延续球队的争冠周期。',
    result: '拉马库斯·阿尔德里奇加盟圣安东尼奥。',
    conditions: [exists('拉马库斯·阿尔德里奇')], moves: [{ playerName: '拉马库斯·阿尔德里奇', destinationTeamId: 'sas' }],
  },
  {
    id: 'small_ball_revolution', year: 2015, title: '三分浪潮席卷联盟', category: '联盟大事', protectionYears: 2,
    history: '金州的传切与三分体系改变了比赛空间，越来越多球队开始拥抱小球阵容。',
    result: '小球革命被写入联盟时间线，比赛正式迈入空间与三分时代。',
    conditions: [exists('斯蒂芬·库里')],
  },
  {
    id: 'durant_warriors', year: 2016, title: '死神降临湾区', category: '决定', protectionYears: 3,
    history: '凯文·杜兰特加盟金州，与斯蒂芬·库里领衔的冠军班底组成历史级阵容。',
    result: '凯文·杜兰特加盟金州，杜兰特与库里进入三年稳定期。',
    conditions: [allExist('凯文·杜兰特', '斯蒂芬·库里'), onTeam('斯蒂芬·库里', 'gsw', '金州'), withoutTitle('凯文·杜兰特')],
    moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'gsw' }],
  },
  {
    id: 'cp3_houston', year: 2017, title: '灯泡组合成军', category: '重磅交易', protectionYears: 2,
    history: '克里斯·保罗转投休斯敦，与詹姆斯·哈登组成联盟顶级后场。',
    result: '克里斯·保罗加盟休斯敦，与哈登共同进入争冠窗口。',
    conditions: [allExist('克里斯·保罗', '詹姆斯·哈登'), onTeam('詹姆斯·哈登', 'hou', '休斯敦')], moves: [{ playerName: '克里斯·保罗', destinationTeamId: 'hou' }],
  },
  {
    id: 'kyrie_boston', year: 2017, title: '欧文接掌绿军', category: '重磅交易', protectionYears: 2,
    history: '凯里·欧文离开克里夫兰，前往波士顿寻求独自带队的机会。',
    result: '凯里·欧文加盟波士顿，成为球队新的后场核心。',
    conditions: [exists('凯里·欧文')], moves: [{ playerName: '凯里·欧文', destinationTeamId: 'bos' }],
  },
  {
    id: 'lebron_lakers', year: 2018, title: '天选之子西游', category: '自由市场', protectionYears: 3,
    history: '勒布朗·詹姆斯加盟洛杉矶，将自己的生涯带到新的舞台。',
    result: '勒布朗·詹姆斯加盟洛杉矶湖人，开启三年稳定期。',
    conditions: [exists('勒布朗·詹姆斯')], moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'lal' }],
  },
  {
    id: 'kawhi_toronto', year: 2018, title: '北境豪赌', category: '重磅交易', protectionYears: 2,
    history: '多伦多以核心阵容为筹码换来科怀·伦纳德，押注一次争冠机会。',
    result: '科怀·伦纳德加盟多伦多，北境进入争冠模式。',
    conditions: [exists('科怀·伦纳德')], moves: [{ playerName: '科怀·伦纳德', destinationTeamId: 'tor' }],
  },
  {
    id: 'ad_lakers', year: 2019, title: '浓眉加盟湖人', category: '重磅交易', protectionYears: 3,
    history: '安东尼·戴维斯前往洛杉矶，与勒布朗·詹姆斯组成顶级锋线组合。',
    result: '安东尼·戴维斯加盟洛杉矶湖人，两位核心进入三年稳定期。',
    conditions: [allExist('安东尼·戴维斯', '勒布朗·詹姆斯'), onTeam('勒布朗·詹姆斯', 'lal', '洛杉矶湖人')], moves: [{ playerName: '安东尼·戴维斯', destinationTeamId: 'lal' }],
  },
  {
    id: 'kawhi_pg_clippers', year: 2019, title: '洛城双翼集结', category: '决定', protectionYears: 3,
    history: '科怀·伦纳德选择快船，球队同步交易得到保罗·乔治。',
    result: '科怀·伦纳德与保罗·乔治加盟洛杉矶快船。',
    conditions: [allExist('科怀·伦纳德', '保罗·乔治')], moves: [{ playerName: '科怀·伦纳德', destinationTeamId: 'lac' }, { playerName: '保罗·乔治', destinationTeamId: 'lac' }],
  },
  {
    id: 'westbrook_houston', year: 2019, title: '昔日兄弟再聚首', category: '重磅交易', protectionYears: 2,
    history: '拉塞尔·威斯布鲁克与詹姆斯·哈登在休斯敦重聚。',
    result: '拉塞尔·威斯布鲁克加盟休斯敦。',
    conditions: [allExist('拉塞尔·威斯布鲁克', '詹姆斯·哈登'), onTeam('詹姆斯·哈登', 'hou', '休斯敦')], moves: [{ playerName: '拉塞尔·威斯布鲁克', destinationTeamId: 'hou' }],
  },
  {
    id: 'holiday_bucks', year: 2020, title: '雄鹿补上冠军后卫', category: '重磅交易', protectionYears: 2,
    history: '密尔沃基得到朱·霍勒迪，为核心阵容补上攻防兼备的后场。',
    result: '朱·霍勒迪加盟密尔沃基。',
    conditions: [exists('朱·霍勒迪')], moves: [{ playerName: '朱·霍勒迪', destinationTeamId: 'mil' }],
  },
  {
    id: 'bubble_2020', year: 2020, title: '封闭园区特别赛季', category: '联盟大事', protectionYears: 2,
    history: '一场前所未有的公共事件改变了赛季安排，所有球队在封闭园区完成余下赛程。',
    result: '封闭园区赛季正式进入本存档的联盟历史。',
    conditions: [exists('勒布朗·詹姆斯')],
  },
  {
    id: 'harden_brooklyn', year: 2021, title: '布鲁克林超级三巨头', category: '重磅交易', protectionYears: 2,
    history: '詹姆斯·哈登前往布鲁克林，与杜兰特、欧文组成豪华进攻阵容。',
    result: '詹姆斯·哈登加盟布鲁克林，核心成员获得两年稳定期。',
    conditions: [allExist('詹姆斯·哈登', '凯文·杜兰特', '凯里·欧文'), onTeam('凯文·杜兰特', 'bkn', '布鲁克林')], moves: [{ playerName: '詹姆斯·哈登', destinationTeamId: 'bkn' }],
  },
  {
    id: 'westbrook_lakers', year: 2021, title: '三双王来到洛杉矶', category: '重磅交易', protectionYears: 2,
    history: '洛杉矶湖人交易得到拉塞尔·威斯布鲁克，组建经验丰富的明星阵容。',
    result: '拉塞尔·威斯布鲁克加盟洛杉矶湖人。',
    conditions: [exists('拉塞尔·威斯布鲁克')], moves: [{ playerName: '拉塞尔·威斯布鲁克', destinationTeamId: 'lal' }],
  },
  {
    id: 'gobert_wolves', year: 2022, title: '双塔实验启动', category: '重磅交易', protectionYears: 2,
    history: '明尼苏达付出大量筹码得到鲁迪·戈贝尔，组建双塔阵容。',
    result: '鲁迪·戈贝尔加盟明尼苏达。',
    conditions: [exists('鲁迪·戈贝尔')], moves: [{ playerName: '鲁迪·戈贝尔', destinationTeamId: 'min' }],
  },
  {
    id: 'mitchell_cleveland', year: 2022, title: '米切尔空降骑士', category: '重磅交易', protectionYears: 2,
    history: '克里夫兰交易得到多诺万·米切尔，年轻阵容迎来明星得分手。',
    result: '多诺万·米切尔加盟克里夫兰。',
    conditions: [exists('多诺万·米切尔')], moves: [{ playerName: '多诺万·米切尔', destinationTeamId: 'cle' }],
  },
  {
    id: 'durant_phoenix', year: 2023, title: '太阳组成豪华进攻组', category: '重磅交易', protectionYears: 2,
    history: '菲尼克斯交易得到凯文·杜兰特，向总冠军发起冲击。',
    result: '凯文·杜兰特加盟菲尼克斯太阳。',
    conditions: [exists('凯文·杜兰特')], moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'phx' }],
  },
  {
    id: 'lillard_bucks', year: 2023, title: '利拉德联手字母哥', category: '重磅交易', protectionYears: 2,
    history: '达米安·利拉德离开波特兰，加盟密尔沃基追逐冠军。',
    result: '达米安·利拉德加盟密尔沃基。',
    conditions: [exists('达米安·利拉德')], moves: [{ playerName: '达米安·利拉德', destinationTeamId: 'mil' }],
  },
  {
    id: 'harden_clippers', year: 2023, title: '哈登回到家乡', category: '重磅交易', protectionYears: 2,
    history: '詹姆斯·哈登加盟洛杉矶快船，与多位明星队友并肩作战。',
    result: '詹姆斯·哈登加盟洛杉矶快船。',
    conditions: [exists('詹姆斯·哈登')], moves: [{ playerName: '詹姆斯·哈登', destinationTeamId: 'lac' }],
  },
  {
    id: 'kawhi_extension', year: 2024, title: '快船确定长期核心', category: '联盟大事', protectionYears: 2,
    history: '科怀·伦纳德与洛杉矶快船延续合作，球队确定未来方向。',
    result: '科怀·伦纳德留在洛杉矶快船并获得两年交易保护。',
    conditions: [exists('科怀·伦纳德')], moves: [{ playerName: '科怀·伦纳德', destinationTeamId: 'lac' }],
  },
];

function findPlayer(teams: Team[], name: string): { team: Team; player: RosterPlayer } | null {
  for (const team of teams) {
    const player = team.roster.find((candidate) => candidate.name === name);
    if (player) return { team, player };
  }
  return null;
}

function playerWonTitle(playerName: string, leagueHistory: GameState['leagueHistory'] = []): boolean {
  return leagueHistory.some((season) =>
    season.fmvp === playerName ||
    season.championRosterPlayerNames?.includes(playerName),
  );
}

export function evaluateDestinyEvent(
  event: DestinyEventDefinition,
  currentYear: number,
  teams: Team[],
  leagueHistory: GameState['leagueHistory'] = [],
  records: Record<string, DestinyEventRecord> = {},
): DestinyEventEvaluation {
  const record = records[event.id];
  const checks = event.conditions.map((condition) => {
    const names = condition.playerNames || [];
    if (condition.type === 'player_exists') return { label: condition.label, met: !!findPlayer(teams, names[0]) };
    if (condition.type === 'players_exist') return { label: condition.label, met: names.every((name) => !!findPlayer(teams, name)) };
    if (condition.type === 'player_on_team') return { label: condition.label, met: findPlayer(teams, names[0])?.team.id === condition.teamId };
    return { label: condition.label, met: !playerWonTitle(names[0], leagueHistory) };
  });
  const status: DestinyEventStatus = record
    ? 'triggered'
    : currentYear < event.year
      ? 'upcoming'
      : currentYear > event.year
        ? 'expired'
        : checks.every((check) => check.met)
          ? 'available'
          : 'unavailable';
  return { event, status, checks, record };
}

export function getDestinyEventEvaluations(
  currentYear: number,
  teams: Team[],
  leagueHistory: GameState['leagueHistory'] = [],
  records: Record<string, DestinyEventRecord> = {},
): DestinyEventEvaluation[] {
  return DESTINY_EVENTS.map((event) => evaluateDestinyEvent(event, currentYear, teams, leagueHistory, records));
}

function refreshTeam(team: Team): void {
  team.roster.sort((a, b) => b.ovr - a.ovr);
  team.roster.forEach((player, index) => {
    player.role = index === 0 ? '战术核心' : index < 5 ? '绝对首发' : index === 5 ? '第六人' : index < 10 ? '轮换替补' : '饮水机守门员';
    player.isStar = index < 3 || player.ovr >= 86;
  });
  team.starPlayer = team.roster[0]?.name || team.starPlayer;
  team.rating = calculateTeamPowerRating(team);
}

export function triggerDestinyEvent(
  event: DestinyEventDefinition,
  currentYear: number,
  currentTeams: Team[],
  leagueHistory: GameState['leagueHistory'] = [],
  records: Record<string, DestinyEventRecord> = {},
  userPlayerId?: string,
  userPlayerName?: string,
): { success: boolean; teams: Team[]; record?: DestinyEventRecord; message: string } {
  const evaluation = evaluateDestinyEvent(event, currentYear, currentTeams, leagueHistory, records);
  if (evaluation.status !== 'available') return { success: false, teams: currentTeams, message: '当前条件不满足，无法触发该事件' };
  const teams = currentTeams.map((team) => ({ ...team, roster: team.roster.map((player) => ({ ...player })) }));
  const movedPlayers: string[] = [];

  for (const move of event.moves || []) {
    const located = findPlayer(teams, move.playerName);
    const destination = teams.find((team) => team.id === move.destinationTeamId);
    if (!located || !destination) return { success: false, teams: currentTeams, message: '事件涉及的球员或球队已不在当前联盟中' };
    const protectedPlayer = {
      ...located.player,
      acquisitionSource: 'destiny_event' as const,
      tradeProtectionUntilYear: currentYear + event.protectionYears - 1,
    };
    if (located.team.id === destination.id) {
      const index = destination.roster.findIndex((player) => player.id === located.player.id);
      destination.roster[index] = protectedPlayer;
      movedPlayers.push(move.playerName);
      continue;
    }
    const outgoing = [...destination.roster]
      .filter((player) => player.id !== userPlayerId && player.name !== userPlayerName && player.name !== move.playerName)
      .sort((a, b) => a.ovr - b.ovr)[0];
    if (!outgoing) return { success: false, teams: currentTeams, message: '目标球队没有可用于阵容调整的名额' };
    located.team.roster = located.team.roster.filter((player) => player.id !== located.player.id);
    destination.roster = destination.roster.filter((player) => player.id !== outgoing.id);
    located.team.roster.push(outgoing);
    destination.roster.push(protectedPlayer);
    movedPlayers.push(move.playerName);
  }

  const protagonists = new Set((event.moves || []).map((move) => move.playerName));
  for (const team of teams) {
    team.roster = team.roster.map((player) => protagonists.has(player.name)
      ? { ...player, tradeProtectionUntilYear: currentYear + event.protectionYears - 1 }
      : player);
    refreshTeam(team);
  }
  const record: DestinyEventRecord = { eventId: event.id, triggeredAtYear: currentYear, result: event.result, movedPlayers };
  return { success: true, teams, record, message: event.result };
}
