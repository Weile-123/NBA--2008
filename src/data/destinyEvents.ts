import type { GameState, RosterPlayer, Team } from '../types';
import { calculateTeamPowerRating } from '../utils/leagueLogic';

export type DestinyEventCategory = '决定' | '重磅交易' | '自由市场' | '联盟大事';

export interface DestinyEventCondition {
  type: 'player_on_team' | 'player_without_title' | 'player_without_title_in_previous_seasons' | 'team_strategy_in' | 'team_previous_wins_at_least' | 'team_max_elite_players' | 'player_team_previous_wins_at_most' | 'player_team_previous_season_without_title' | 'player_has_higher_rated_teammates' | 'event_completed' | 'event_completed_player_on_team' | 'event_completed_route_not_selected' | 'event_route_not_selected';
  playerNames?: string[];
  teamId?: string;
  eventId?: string;
  routeId?: string;
  strategies?: Array<'contender' | 'playoff' | 'retooling' | 'rebuilding'>;
  value?: number;
  ovrThreshold?: number;
  required?: boolean;
  points?: number;
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
  guide?: boolean;
  requiredScore?: number;
  routes?: DestinyEventRoute[];
  skipDefaultScoring?: boolean;
  ignoreResult?: string;
}

export interface DestinyEventRoute {
  id: string;
  title: string;
  result: string;
  requiredScore: number;
  conditions: DestinyEventCondition[];
  moves: DestinyEventMove[];
  fallback?: boolean;
}

export interface DestinyEventRecord {
  eventId: string;
  triggeredAtYear: number;
  result: string;
  movedPlayers: string[];
  routeId?: string;
  routeTitle?: string;
  ignored?: boolean;
  autoIgnored?: boolean;
}

export type DestinyEventStatus = 'upcoming' | 'unavailable' | 'available' | 'triggered' | 'ignored' | 'expired';

export const DESTINY_EVENT_DEADLINE_GAME = 55;

export interface DestinyEventEvaluation {
  event: DestinyEventDefinition;
  status: DestinyEventStatus;
  checks: DestinyConditionCheck[];
  score: number;
  requiredScore: number;
  routeEvaluations: DestinyRouteEvaluation[];
  record?: DestinyEventRecord;
}

export function canUnlockDestinyConditionWithAd(score: number, requiredScore: number): boolean {
  const deficit = requiredScore - score;
  return deficit >= 1 && deficit <= 2;
}

export interface DestinyConditionCheck {
  label: string;
  met: boolean;
  required: boolean;
  points: number;
  unlockKey: string;
}

export interface DestinyRouteEvaluation {
  route: DestinyEventRoute;
  checks: DestinyConditionCheck[];
  score: number;
  requiredScore: number;
  available: boolean;
}

const requiredOnTeam = (playerName: string, teamId: string, teamName: string): DestinyEventCondition => ({
  type: 'player_on_team', playerNames: [playerName], teamId, required: true, label: `${playerName}效力于${teamName}`,
});
const withoutTitle = (playerName: string): DestinyEventCondition => ({
  type: 'player_without_title', playerNames: [playerName], required: true, label: `${playerName}此前尚未夺冠`,
});
const withoutTitleInPreviousSeasons = (playerName: string, seasons: number): DestinyEventCondition => ({
  type: 'player_without_title_in_previous_seasons', playerNames: [playerName], value: seasons, required: true, label: `${playerName}此前${seasons}个赛季均未夺冠`,
});
const eventCompleted = (eventId: string, eventTitle: string, routeId?: string, routeTitle?: string): DestinyEventCondition => ({
  type: 'event_completed', eventId, routeId, required: true, label: routeId ? `已完成“${eventTitle}”的“${routeTitle}”分支` : `已完成“${eventTitle}”`,
});
const eventCompletedWithPlayerOnTeam = (eventId: string, eventTitle: string, playerName: string, teamId: string, teamName: string): DestinyEventCondition => ({
  type: 'event_completed_player_on_team', eventId, playerNames: [playerName], teamId, required: true,
  label: `已完成“${eventTitle}”，且${playerName}仍效力于${teamName}`,
});
const eventCompletedWithoutRoute = (eventId: string, eventTitle: string, routeId: string, routeTitle: string): DestinyEventCondition => ({
  type: 'event_completed_route_not_selected', eventId, routeId, required: true,
  label: `已完成“${eventTitle}”，且未选择“${routeTitle}”`,
});
const eventRouteNotSelected = (eventId: string, eventTitle: string, routeId: string, routeTitle: string): DestinyEventCondition => ({
  type: 'event_route_not_selected', eventId, routeId, required: true, label: `“${eventTitle}”未选择“${routeTitle}”分支`,
});
const strategyIn = (teamId: string, teamName: string, strategies: DestinyEventCondition['strategies'], points = 1): DestinyEventCondition => ({
  type: 'team_strategy_in', teamId, strategies, points, label: `${teamName}球队方向为${strategies?.map((item) => ({ contender: '争冠', playoff: '季后赛竞争', retooling: '观望调整', rebuilding: '重建' })[item]).join('或')}（+${points}）`,
});
const minWins = (teamId: string, teamName: string, value: number, points = 1): DestinyEventCondition => ({
  type: 'team_previous_wins_at_least', teamId, value, points, label: `${teamName}上赛季至少${value}胜（+${points}）`,
});
const maxElite = (teamId: string, teamName: string, value: number, ovrThreshold = 88, points = 1): DestinyEventCondition => ({
  type: 'team_max_elite_players', teamId, value, ovrThreshold, points, label: `${teamName}${ovrThreshold}+综评球员不超过${value}人（+${points}）`,
});
const playerTeamMaxWins = (playerName: string, value: number, points = 1): DestinyEventCondition => ({
  type: 'player_team_previous_wins_at_most', playerNames: [playerName], value, points, label: `${playerName}所在球队上赛季不超过${value}胜（+${points}）`,
});
const playerTeamPreviousSeasonWithoutTitle = (playerName: string, points = 1): DestinyEventCondition => ({
  type: 'player_team_previous_season_without_title', playerNames: [playerName], points, label: `${playerName}所在球队上赛季未夺冠（+${points}）`,
});
const requiredPlayerTeamPreviousSeasonWithoutTitle = (playerName: string): DestinyEventCondition => ({
  type: 'player_team_previous_season_without_title', playerNames: [playerName], required: true, label: `${playerName}所在球队上赛季未夺冠`,
});
const higherRatedTeammates = (playerName: string, value: number, points = 1): DestinyEventCondition => ({
  type: 'player_has_higher_rated_teammates', playerNames: [playerName], value, points, label: `${playerName}队内至少有${value}名综评更高的队友（+${points}）`,
});

const DESTINY_EVENT_DEFINITIONS: DestinyEventDefinition[] = [
  {
    id: 'decision_1', year: 2010, title: '决定一', category: '决定', protectionYears: 3,
    history: '2010 年夏天，勒布朗·詹姆斯宣布离开克里夫兰，与德维恩·韦德、克里斯·波什在迈阿密联手。',
    result: '勒布朗·詹姆斯与克里斯·波什加盟迈阿密，三位核心进入三年稳定期。',
    conditions: [withoutTitle('勒布朗·詹姆斯')],
    moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'mia' }, { playerName: '克里斯·波什', destinationTeamId: 'mia' }],
    routes: [
      {
        id: 'south_beach', title: '三巨头', result: '勒布朗·詹姆斯与克里斯·波什加盟迈阿密，三位核心进入三年稳定期。', requiredScore: 3,
        conditions: [requiredOnTeam('德维恩·韦德', 'mia', '迈阿密'), strategyIn('mia', '迈阿密', ['contender', 'playoff']), playerTeamMaxWins('勒布朗·詹姆斯', 55), minWins('mia', '迈阿密', 48)],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'mia' }, { playerName: '克里斯·波什', destinationTeamId: 'mia' }],
      },
      {
        id: 'broadway', title: '百老汇巨星', result: '勒布朗·詹姆斯加盟纽约，麦迪逊广场花园迎来新的建队核心。', requiredScore: 3,
        conditions: [strategyIn('nyk', '纽约', ['retooling', 'rebuilding']), maxElite('nyk', '纽约', 1, 88, 1), playerTeamMaxWins('勒布朗·詹姆斯', 52, 1)],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'nyk' }],
      },
      {
        id: 'stay_cavaliers', title: '留守骑士', result: '勒布朗·詹姆斯留在克里夫兰，继续带领家乡球队冲击冠军。', requiredScore: 0,
        conditions: [], moves: [], fallback: true,
      },
    ],
  },
  {
    id: 'melo_new_york', year: 2011, title: '甜瓜奔赴纽约', category: '重磅交易', protectionYears: 2,
    history: '卡梅隆·安东尼在生涯巅峰期离开丹佛，纽约迎来久违的超级得分手。',
    result: '卡梅隆·安东尼加盟纽约，成为麦迪逊广场花园的新核心。',
    ignoreResult: '条件未达成或选择忽略，卡梅隆·安东尼留在丹佛掘金。',
    guide: true,
    conditions: [eventRouteNotSelected('decision_1', '决定一', 'broadway', '百老汇巨星')],
    moves: [{ playerName: '卡梅隆·安东尼', destinationTeamId: 'nyk' }],
  },
  {
    id: 'cp3_lakers', year: 2011, title: '篮球原因', category: '重磅交易', protectionYears: 2,
    history: '2011 年，湖人曾达成得到克里斯·保罗的三方交易，但这笔交易最终被联盟叫停。',
    result: '交易在平行时空顺利完成，克里斯·保罗加盟洛杉矶湖人，与科比组成顶级后场。',
    conditions: [
      requiredOnTeam('科比·布莱恩特', 'lal', '洛杉矶湖人'),
      withoutTitle('克里斯·保罗'),
      minWins('lal', '洛杉矶湖人', 53),
      maxElite('lal', '洛杉矶湖人', 2, 88),
      playerTeamMaxWins('克里斯·保罗', 50),
    ],
    moves: [{ playerName: '克里斯·保罗', destinationTeamId: 'lal' }],
    requiredScore: 3,
    skipDefaultScoring: true,
  },
  {
    id: 'harden_houston', year: 2012, title: '一小时通牒', category: '重磅交易', protectionYears: 3,
    history: '雷霆年轻第六人詹姆斯·哈登被送往休斯敦，从此成长为持球大核心。',
    result: '詹姆斯·哈登加盟休斯敦并获得建队核心地位。',
    conditions: [], moves: [{ playerName: '詹姆斯·哈登', destinationTeamId: 'hou' }], requiredScore: 3,
  },
  {
    id: 'howard_houston', year: 2013, title: '摩登时代', category: '自由市场', protectionYears: 2,
    history: '德怀特·霍华德离开洛杉矶，选择前往休斯敦开启新的争冠窗口。',
    result: '德怀特·霍华德加盟休斯敦，球队内线实力得到提升。',
    conditions: [
      eventCompleted('harden_houston', '一小时通牒'),
      maxElite('hou', '休斯敦', 2, 88),
      playerTeamMaxWins('德怀特·霍华德', 50),
    ],
    moves: [{ playerName: '德怀特·霍华德', destinationTeamId: 'hou' }],
    requiredScore: 2,
    skipDefaultScoring: true,
  },
  {
    id: 'decision_2', year: 2014, title: '决定二', category: '决定', protectionYears: 3,
    history: '勒布朗·詹姆斯宣布回归克里夫兰，要为家乡带回一座冠军奖杯。',
    result: '勒布朗·詹姆斯回归克里夫兰，重新成为球队核心。',
    conditions: [eventCompletedWithoutRoute('decision_1', '决定一', 'stay_cavaliers', '留守骑士')], moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'cle' }],
    requiredScore: 3,
  },
  {
    id: 'love_cleveland', year: 2014, title: '爱神', category: '重磅交易', protectionYears: 2,
    history: '克里夫兰以年轻资产换来凯文·乐福，组建新的争冠三巨头。',
    result: '凯文·乐福加盟克里夫兰，与球队核心共同冲击冠军。',
    conditions: [eventCompleted('decision_2', '决定二'), requiredOnTeam('凯里·欧文', 'cle', '克里夫兰'), requiredOnTeam('勒布朗·詹姆斯', 'cle', '克里夫兰')], moves: [{ playerName: '凯文·乐福', destinationTeamId: 'cle' }], requiredScore: 3,
  },
  {
    id: 'aldridge_spurs', year: 2015, title: '阿德返乡', category: '自由市场', protectionYears: 2,
    history: '拉马库斯·阿尔德里奇选择圣安东尼奥，延续球队的争冠周期。',
    result: '拉马库斯·阿尔德里奇加盟圣安东尼奥。',
    conditions: [], moves: [{ playerName: '拉马库斯·阿尔德里奇', destinationTeamId: 'sas' }], requiredScore: 3,
  },
  {
    id: 'durant_warriors', year: 2016, title: '联盟大结局', category: '决定', protectionYears: 3,
    history: '凯文·杜兰特加盟金州，与斯蒂芬·库里领衔的冠军班底组成历史级阵容。',
    result: '凯文·杜兰特加盟金州，杜兰特与库里进入三年稳定期。',
    conditions: [withoutTitle('凯文·杜兰特')],
    moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'gsw' }],
    routes: [
      {
        id: 'bay_area', title: '海啸兄弟', result: '凯文·杜兰特加盟金州，与斯蒂芬·库里组成历史级双核。', requiredScore: 2,
        conditions: [requiredOnTeam('斯蒂芬·库里', 'gsw', '金州'), strategyIn('gsw', '金州', ['contender', 'playoff']), minWins('gsw', '金州', 55)],
        moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'gsw' }],
      },
      {
        id: 'boston_project', title: '绿军复兴计划', result: '凯文·杜兰特加盟波士顿，成为绿军复兴计划的头号核心。', requiredScore: 3,
        conditions: [strategyIn('bos', '波士顿', ['contender', 'playoff'], 1), maxElite('bos', '波士顿', 1, 88), playerTeamMaxWins('凯文·杜兰特', 55)],
        moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'bos' }],
      },
      {
        id: 'thunder_return', title: '真正的MVP', result: '凯文·杜兰特留守俄克拉荷马。', requiredScore: 2,
        conditions: [requiredOnTeam('凯文·杜兰特', 'okc', '俄克拉荷马雷霆'), minWins('okc', '俄克拉荷马', 50), strategyIn('okc', '俄克拉荷马', ['contender', 'playoff'])],
        moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'okc' }],
      },
    ],
  },
  {
    id: 'cp3_houston', year: 2017, title: '灯泡组合', category: '重磅交易', protectionYears: 2,
    history: '克里斯·保罗转投休斯敦，与詹姆斯·哈登组成联盟顶级后场。',
    result: '克里斯·保罗加盟休斯敦，与哈登共同进入争冠窗口。',
    conditions: [eventCompletedWithPlayerOnTeam('harden_houston', '一小时通牒', '詹姆斯·哈登', 'hou', '休斯敦'), strategyIn('hou', '休斯敦', ['contender', 'playoff']), minWins('hou', '休斯敦', 45), maxElite('hou', '休斯敦', 2, 88)], moves: [{ playerName: '克里斯·保罗', destinationTeamId: 'hou' }], requiredScore: 3, skipDefaultScoring: true,
  },
  {
    id: 'kyrie_boston', year: 2017, title: '德鲁大叔', category: '重磅交易', protectionYears: 2,
    history: '凯里·欧文离开克里夫兰，前往波士顿寻求独自带队的机会。',
    result: '凯里·欧文加盟波士顿，成为球队新的后场核心。',
    conditions: [strategyIn('bos', '波士顿', ['contender', 'playoff']), maxElite('bos', '波士顿', 2, 88), minWins('bos', '波士顿', 45)], moves: [{ playerName: '凯里·欧文', destinationTeamId: 'bos' }], requiredScore: 3, skipDefaultScoring: true,
  },
  {
    id: 'lebron_lakers', year: 2018, title: '决定三', category: '决定', protectionYears: 3,
    history: '勒布朗·詹姆斯加盟洛杉矶，将自己的生涯带到新的舞台。',
    result: '勒布朗·詹姆斯加盟洛杉矶湖人，开启三年稳定期。',
    conditions: [withoutTitleInPreviousSeasons('勒布朗·詹姆斯', 2)], moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'lal' }],
    routes: [
      {
        id: 'hollywood', title: '紫金的传承', result: '勒布朗·詹姆斯加盟洛杉矶湖人，开启新的争冠篇章。', requiredScore: 2,
        conditions: [maxElite('lal', '洛杉矶湖人', 1, 90), playerTeamMaxWins('勒布朗·詹姆斯', 55)],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'lal' }],
      },
      {
        id: 'process', title: '相信过程', result: '勒布朗·詹姆斯加盟费城，与乔尔·恩比德组成全新的东部争冠核心。', requiredScore: 1,
        conditions: [requiredOnTeam('乔尔·恩比德', 'phi', '费城'), minWins('phi', '费城', 45)],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'phi' }],
      },
      {
        id: 'home_guardian', title: '继续坚守', result: '勒布朗·詹姆斯继续留在当前球队。', requiredScore: 0,
        conditions: [], moves: [], fallback: true,
      },
    ],
  },
  {
    id: 'kawhi_toronto', year: 2018, title: '北境之王', category: '重磅交易', protectionYears: 2,
    history: '多伦多以核心阵容为筹码换来科怀·伦纳德，押注一次争冠机会。',
    result: '科怀·伦纳德加盟多伦多，北境进入争冠模式。',
    conditions: [strategyIn('tor', '多伦多', ['contender', 'playoff']), minWins('tor', '多伦多', 45), maxElite('tor', '多伦多', 2, 88)], moves: [{ playerName: '科怀·伦纳德', destinationTeamId: 'tor' }], requiredScore: 3, skipDefaultScoring: true,
  },
  {
    id: 'ad_lakers', year: 2019, title: '擎天白玉柱', category: '重磅交易', protectionYears: 3,
    history: '安东尼·戴维斯前往洛杉矶，与勒布朗·詹姆斯组成顶级锋线组合。',
    result: '安东尼·戴维斯加盟洛杉矶湖人，两位核心进入三年稳定期。',
    conditions: [eventCompleted('lebron_lakers', '决定三', 'hollywood', '紫金的传承'), maxElite('lal', '洛杉矶湖人', 2, 90), minWins('lal', '洛杉矶湖人', 45)], moves: [{ playerName: '安东尼·戴维斯', destinationTeamId: 'lal' }], requiredScore: 2, skipDefaultScoring: true,
  },
  {
    id: 'kawhi_pg_clippers', year: 2019, title: '银河战舰', category: '决定', protectionYears: 3,
    history: '科怀·伦纳德选择快船，球队同步交易得到保罗·乔治。',
    result: '科怀·伦纳德与保罗·乔治加盟洛杉矶快船。',
    conditions: [strategyIn('lac', '洛杉矶快船', ['contender', 'playoff']), minWins('lac', '洛杉矶快船', 45), playerTeamMaxWins('保罗·乔治', 55)], moves: [{ playerName: '科怀·伦纳德', destinationTeamId: 'lac' }, { playerName: '保罗·乔治', destinationTeamId: 'lac' }], requiredScore: 3, skipDefaultScoring: true,
  },
  {
    id: 'westbrook_houston', year: 2019, title: '昔日兄弟再聚首', category: '重磅交易', protectionYears: 2,
    history: '拉塞尔·威斯布鲁克与詹姆斯·哈登在休斯敦重聚。',
    result: '拉塞尔·威斯布鲁克加盟休斯敦。',
    conditions: [requiredOnTeam('詹姆斯·哈登', 'hou', '休斯敦'), strategyIn('hou', '休斯敦', ['contender', 'playoff']), minWins('hou', '休斯敦', 45)], moves: [{ playerName: '拉塞尔·威斯布鲁克', destinationTeamId: 'hou' }], requiredScore: 2, skipDefaultScoring: true,
  },
  {
    id: 'durant_kyrie_brooklyn', year: 2019, title: '布鲁克林的火把', category: '自由市场', protectionYears: 3,
    history: '凯文·杜兰特与凯里·欧文相约布鲁克林，篮网由此迎来新的争冠核心。',
    result: '凯文·杜兰特与凯里·欧文加盟布鲁克林，双星获得三年交易保护。',
    conditions: [
      eventCompleted('durant_warriors', '联盟大结局'),
      requiredPlayerTeamPreviousSeasonWithoutTitle('凯文·杜兰特'),
      requiredPlayerTeamPreviousSeasonWithoutTitle('凯里·欧文'),
    ],
    moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'bkn' }, { playerName: '凯里·欧文', destinationTeamId: 'bkn' }],
    requiredScore: 0,
    skipDefaultScoring: true,
  },
  {
    id: 'paul_suns', year: 2020, title: '控场大师', category: '重磅交易', protectionYears: 2,
    history: '菲尼克斯以年轻资产换来克里斯·保罗，组建新的争冠后场。',
    result: '克里斯·保罗加盟菲尼克斯太阳。',
    conditions: [strategyIn('phx', '菲尼克斯', ['contender', 'playoff']), minWins('phx', '菲尼克斯', 45), maxElite('phx', '菲尼克斯', 2, 88)], moves: [{ playerName: '克里斯·保罗', destinationTeamId: 'phx' }], requiredScore: 3, skipDefaultScoring: true,
  },
  {
    id: 'harden_brooklyn', year: 2021, title: '最强的进攻', category: '重磅交易', protectionYears: 2,
    history: '詹姆斯·哈登前往布鲁克林，与杜兰特、欧文组成豪华进攻阵容。',
    result: '詹姆斯·哈登加盟布鲁克林，核心成员获得两年稳定期。',
    conditions: [
      eventCompleted('durant_kyrie_brooklyn', '布鲁克林的火把'),
      strategyIn('bkn', '布鲁克林', ['contender', 'playoff']),
      playerTeamPreviousSeasonWithoutTitle('詹姆斯·哈登'),
    ],
    moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'bkn' }, { playerName: '凯里·欧文', destinationTeamId: 'bkn' }, { playerName: '詹姆斯·哈登', destinationTeamId: 'bkn' }],
    requiredScore: 2,
    skipDefaultScoring: true,
  },
  {
    id: 'westbrook_lakers', year: 2021, title: '场均三双', category: '重磅交易', protectionYears: 2,
    history: '洛杉矶湖人交易得到拉塞尔·威斯布鲁克，组建经验丰富的明星阵容。',
    result: '拉塞尔·威斯布鲁克加盟洛杉矶湖人。',
    conditions: [], moves: [{ playerName: '拉塞尔·威斯布鲁克', destinationTeamId: 'lal' }], requiredScore: 3,
  },
  {
    id: 'mitchell_cleveland', year: 2022, title: '米球王', category: '重磅交易', protectionYears: 2,
    history: '克里夫兰交易得到多诺万·米切尔，年轻阵容迎来明星得分手。',
    result: '多诺万·米切尔加盟克里夫兰。',
    conditions: [], moves: [{ playerName: '多诺万·米切尔', destinationTeamId: 'cle' }], requiredScore: 3,
  },
  {
    id: 'durant_phoenix', year: 2023, title: '凤凰城崛起', category: '重磅交易', protectionYears: 2,
    history: '菲尼克斯交易得到凯文·杜兰特，向总冠军发起冲击。',
    result: '凯文·杜兰特加盟菲尼克斯太阳。',
    conditions: [], moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'phx' }], requiredScore: 3,
  },
  {
    id: 'lillard_bucks', year: 2023, title: '读表先生', category: '重磅交易', protectionYears: 2,
    history: '达米安·利拉德离开波特兰，加盟密尔沃基追逐冠军。',
    result: '达米安·利拉德加盟密尔沃基。',
    conditions: [requiredOnTeam('扬尼斯·阿德托昆博', 'mil', '密尔沃基雄鹿')],
    moves: [{ playerName: '达米安·利拉德', destinationTeamId: 'mil' }], requiredScore: 3,
  },
  {
    id: 'harden_clippers', year: 2023, title: '洛城的孩子', category: '重磅交易', protectionYears: 2,
    history: '詹姆斯·哈登加盟洛杉矶快船，与多位明星队友并肩作战。',
    result: '詹姆斯·哈登加盟洛杉矶快船。',
    conditions: [], moves: [{ playerName: '詹姆斯·哈登', destinationTeamId: 'lac' }], requiredScore: 3,
  },
  {
    id: 'klay_leaves_warriors', year: 2024, title: '再见，克莱', category: '自由市场', protectionYears: 2,
    history: '克莱·汤普森结束金州生涯，加盟达拉斯开启职业生涯新篇章。',
    result: '克莱·汤普森加盟达拉斯独行侠。',
    conditions: [requiredOnTeam('克莱·汤普森', 'gsw', '金州勇士'), strategyIn('dal', '达拉斯', ['contender', 'playoff']), minWins('dal', '达拉斯', 45), maxElite('dal', '达拉斯', 2, 88)],
    moves: [{ playerName: '克莱·汤普森', destinationTeamId: 'dal' }], requiredScore: 3, skipDefaultScoring: true,
  },
  {
    id: 'luka_davis_swap', year: 2025, title: '谁才是赢家？', category: '重磅交易', protectionYears: 3,
    history: '洛杉矶与达拉斯完成震动联盟的交易，卢卡·东契奇和安东尼·戴维斯互换东家。',
    result: '卢卡·东契奇加盟洛杉矶湖人，安东尼·戴维斯加盟达拉斯独行侠。',
    conditions: [requiredOnTeam('卢卡·东契奇', 'dal', '达拉斯独行侠'), requiredOnTeam('安东尼·戴维斯', 'lal', '洛杉矶湖人'), strategyIn('lal', '洛杉矶湖人', ['contender', 'playoff']), strategyIn('dal', '达拉斯', ['contender', 'playoff']), playerTeamPreviousSeasonWithoutTitle('卢卡·东契奇')],
    moves: [{ playerName: '卢卡·东契奇', destinationTeamId: 'lal' }, { playerName: '安东尼·戴维斯', destinationTeamId: 'dal' }], requiredScore: 3, skipDefaultScoring: true,
  },
];

export const DESTINY_EVENTS: DestinyEventDefinition[] = DESTINY_EVENT_DEFINITIONS.map((event) => ({
  ...event,
  history: event.history.startsWith('现实中：') ? event.history : `现实中：${event.history}`,
}));

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

function playerWonTitleInSeason(playerName: string, year: number, leagueHistory: GameState['leagueHistory'] = []): boolean {
  const season = leagueHistory.find((item) => item.year === year);
  return !!season && (season.fmvp === playerName || season.championRosterPlayerNames?.includes(playerName) === true);
}

function checkCondition(
  condition: DestinyEventCondition,
  teams: Team[],
  leagueHistory: GameState['leagueHistory'] = [],
  records: Record<string, DestinyEventRecord> = {},
  currentYear = 0,
  unlockKey = '',
  unlocked = false,
): DestinyConditionCheck {
  const names = condition.playerNames || [];
  let met = false;
  if (condition.type === 'player_on_team') met = findPlayer(teams, names[0])?.team.id === condition.teamId;
  else if (condition.type === 'player_without_title') met = !playerWonTitle(names[0], leagueHistory);
  else if (condition.type === 'player_without_title_in_previous_seasons') {
    const seasonCount = condition.value || 0;
    const relevantYears = Array.from({ length: seasonCount }, (_, index) => currentYear - seasonCount + index);
    met = seasonCount > 0 && relevantYears.every((year) =>
      leagueHistory.some((season) => season.year === year) && !playerWonTitleInSeason(names[0], year, leagueHistory));
  }
  else if (condition.type === 'team_strategy_in') met = !!condition.strategies?.includes(teams.find((team) => team.id === condition.teamId)?.strategy || 'retooling');
  else if (condition.type === 'team_previous_wins_at_least') met = (teams.find((team) => team.id === condition.teamId)?.previousSeasonWins || 0) >= (condition.value || 0);
  else if (condition.type === 'team_max_elite_players') {
    const team = teams.find((candidate) => candidate.id === condition.teamId);
    met = !!team && team.roster.filter((player) => player.ovr >= (condition.ovrThreshold || 88)).length <= (condition.value || 0);
  } else if (condition.type === 'player_team_previous_wins_at_most') {
    const located = findPlayer(teams, names[0]);
    met = !!located && (located.team.previousSeasonWins || 0) <= (condition.value || 0);
  } else if (condition.type === 'player_team_previous_season_without_title') {
    const located = findPlayer(teams, names[0]);
    const previousSeason = leagueHistory.find((season) => season.year === currentYear - 1);
    met = !!located && !!previousSeason && previousSeason.championId !== located.team.id;
  } else if (condition.type === 'player_has_higher_rated_teammates') {
    const located = findPlayer(teams, names[0]);
    met = !!located && located.team.roster.filter((player) => player.id !== located.player.id && player.ovr > located.player.ovr).length >= (condition.value || 0);
  } else if (condition.type === 'event_completed') {
    const record = condition.eventId ? records[condition.eventId] : undefined;
    met = !!record && !record.ignored && (!condition.routeId || record.routeId === condition.routeId);
  } else if (condition.type === 'event_completed_player_on_team') {
    const record = condition.eventId ? records[condition.eventId] : undefined;
    met = !!record && !record.ignored && findPlayer(teams, names[0])?.team.id === condition.teamId;
  } else if (condition.type === 'event_completed_route_not_selected') {
    const record = condition.eventId ? records[condition.eventId] : undefined;
    met = !!record && !record.ignored && record.routeId !== condition.routeId;
  } else if (condition.type === 'event_route_not_selected') {
    const record = condition.eventId ? records[condition.eventId] : undefined;
    met = !record || record.routeId !== condition.routeId;
  }
  if (!condition.required && unlocked) met = true;
  return { label: condition.label, met, required: condition.required === true, points: condition.required ? 0 : (condition.points || 0), unlockKey };
}

function defaultScoringConditions(event: DestinyEventDefinition, teams: Team[]): DestinyEventCondition[] {
  if (event.guide || event.skipDefaultScoring || event.routes?.length || !event.moves?.length) return [];
  const primaryMove = event.moves[0];
  const destination = teams.find((team) => team.id === primaryMove.destinationTeamId);
  const destinationName = destination?.name || primaryMove.destinationTeamId.toUpperCase();
  return [
    strategyIn(primaryMove.destinationTeamId, destinationName, ['contender', 'playoff', 'retooling']),
    maxElite(primaryMove.destinationTeamId, destinationName, 2, 88),
    playerTeamMaxWins(primaryMove.playerName, 55),
  ];
}

export function evaluateDestinyEvent(
  event: DestinyEventDefinition,
  currentYear: number,
  teams: Team[],
  leagueHistory: GameState['leagueHistory'] = [],
  records: Record<string, DestinyEventRecord> = {},
  adUnlocks: string[] = [],
): DestinyEventEvaluation {
  const record = records[event.id];
  const unlocked = new Set(adUnlocks);
  const checks = [...event.conditions, ...defaultScoringConditions(event, teams)].map((condition, index) => {
    const unlockKey = `${event.id}:base:${index}`;
    return checkCondition(condition, teams, leagueHistory, records, currentYear, unlockKey, unlocked.has(unlockKey));
  });
  const requiredMet = checks.filter((check) => check.required).every((check) => check.met);
  const score = checks.reduce((sum, check) => sum + (check.met ? check.points : 0), 0);
  const requiredScore = event.requiredScore ?? (event.guide ? 0 : event.category === '决定' ? 3 : 2);
  const routeEvaluations = (event.routes || []).map((route) => {
    const routeChecks = route.conditions.map((condition, index) => {
      const unlockKey = `${event.id}:route:${route.id}:${index}`;
      return checkCondition(condition, teams, leagueHistory, records, currentYear, unlockKey, unlocked.has(unlockKey));
    });
    const routeRequiredMet = routeChecks.filter((check) => check.required).every((check) => check.met);
    const routePlayersAvailable = route.moves.every((move) => !!findPlayer(teams, move.playerName));
    const routeScore = routeChecks.reduce((sum, check) => sum + (check.met ? check.points : 0), 0);
    return {
      route,
      checks: routeChecks,
      score: routeScore,
      requiredScore: route.requiredScore,
      available: currentYear === event.year && requiredMet && routeRequiredMet && routePlayersAvailable && routeScore >= route.requiredScore,
    };
  });
  const conditionsMet = routeEvaluations.length
    ? routeEvaluations.some((route) => route.available)
    : requiredMet && (event.moves || []).every((move) => !!findPlayer(teams, move.playerName)) && score >= requiredScore;
  const status: DestinyEventStatus = record
    ? record.ignored ? 'ignored' : 'triggered'
    : currentYear < event.year
      ? 'upcoming'
      : currentYear > event.year
        ? 'expired'
        : conditionsMet
          ? 'available'
          : 'unavailable';
  return { event, status, checks, score, requiredScore, routeEvaluations, record };
}

export function getDestinyEventEvaluations(
  currentYear: number,
  teams: Team[],
  leagueHistory: GameState['leagueHistory'] = [],
  records: Record<string, DestinyEventRecord> = {},
  adUnlocks: Record<string, string[]> = {},
): DestinyEventEvaluation[] {
  return DESTINY_EVENTS.map((event) => evaluateDestinyEvent(event, currentYear, teams, leagueHistory, records, adUnlocks[event.id] || []));
}

export function getDestinyEventEntrySummary(evaluations: DestinyEventEvaluation[], currentYear: number): string {
  const available = evaluations.find((item) => item.status === 'available');
  if (available) return available.event.title;
  const currentEvents = evaluations.filter((item) => item.event.year === currentYear);
  if (currentEvents.some((item) => item.status === 'triggered')) return '本赛季命定事件已完成';
  if (currentEvents.some((item) => item.status === 'ignored')) return '本赛季命定事件已忽略';
  if (currentEvents.length > 0) return '本赛季事件条件尚未满足';
  return '查看历史时间线与未来事件';
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

function applyDestinyMoves(
  event: DestinyEventDefinition,
  currentYear: number,
  currentTeams: Team[],
  moves: DestinyEventMove[],
  userPlayerId?: string,
  userPlayerName?: string,
): { success: boolean; teams: Team[]; movedPlayers: string[]; message?: string } {
  const teams = currentTeams.map((team) => ({ ...team, roster: team.roster.map((player) => ({ ...player })) }));
  const movedPlayers: string[] = [];

  for (const move of moves) {
    const located = findPlayer(teams, move.playerName);
    const destination = teams.find((team) => team.id === move.destinationTeamId);
    if (!located || !destination) return { success: false, teams: currentTeams, movedPlayers: [], message: '事件涉及的球员或球队已不在当前联盟中' };
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
    if (!outgoing) return { success: false, teams: currentTeams, movedPlayers: [], message: '目标球队没有可用于阵容调整的名额' };
    located.team.roster = located.team.roster.filter((player) => player.id !== located.player.id);
    destination.roster = destination.roster.filter((player) => player.id !== outgoing.id);
    located.team.roster.push(outgoing);
    destination.roster.push(protectedPlayer);
    movedPlayers.push(move.playerName);
  }

  const protagonists = new Set(moves.map((move) => move.playerName));
  for (const team of teams) {
    team.roster = team.roster.map((player) => protagonists.has(player.name)
      ? { ...player, tradeProtectionUntilYear: currentYear + event.protectionYears - 1 }
      : player);
    refreshTeam(team);
  }
  return { success: true, teams, movedPlayers };
}

export function triggerDestinyEvent(
  event: DestinyEventDefinition,
  currentYear: number,
  currentTeams: Team[],
  leagueHistory: GameState['leagueHistory'] = [],
  records: Record<string, DestinyEventRecord> = {},
  userPlayerId?: string,
  userPlayerName?: string,
  routeId?: string,
  adUnlocks: string[] = [],
): { success: boolean; teams: Team[]; record?: DestinyEventRecord; message: string } {
  const evaluation = evaluateDestinyEvent(event, currentYear, currentTeams, leagueHistory, records, adUnlocks);
  if (evaluation.status !== 'available') return { success: false, teams: currentTeams, message: '当前条件不满足，无法触发该事件' };
  const routeEvaluation = evaluation.routeEvaluations.length
    ? evaluation.routeEvaluations.find((route) => route.route.id === routeId && route.available) || evaluation.routeEvaluations.find((route) => route.available)
    : undefined;
  if (evaluation.routeEvaluations.length && !routeEvaluation) return { success: false, teams: currentTeams, message: '所选命运分支的条件尚未满足' };
  const activeMoves = routeEvaluation?.route.moves || event.moves || [];
  const activeResult = routeEvaluation?.route.result || event.result;
  const moved = applyDestinyMoves(event, currentYear, currentTeams, activeMoves, userPlayerId, userPlayerName);
  if (!moved.success) return { success: false, teams: currentTeams, message: moved.message || '事件阵容调整失败' };
  const record: DestinyEventRecord = { eventId: event.id, triggeredAtYear: currentYear, result: activeResult, movedPlayers: moved.movedPlayers, routeId: routeEvaluation?.route.id, routeTitle: routeEvaluation?.route.title };
  return { success: true, teams: moved.teams, record, message: activeResult };
}

export function ignoreDestinyEvent(
  event: DestinyEventDefinition,
  currentYear: number,
  records: Record<string, DestinyEventRecord> = {},
  currentTeams: Team[] = [],
  userPlayerId?: string,
  userPlayerName?: string,
  autoIgnored = false,
  randomValue = Math.random,
): { success: boolean; teams: Team[]; record?: DestinyEventRecord; message: string } {
  if (currentYear !== event.year) return { success: false, teams: currentTeams, message: '仅能在事件所属赛季作出选择' };
  if (records[event.id]) return { success: false, teams: currentTeams, message: '该事件已经处理' };
  const fallback = event.routes?.find((route) => route.fallback);
  if (fallback) {
    return {
      success: true,
      teams: currentTeams,
      record: {
        eventId: event.id,
        triggeredAtYear: currentYear,
        result: fallback.result,
        movedPlayers: [],
        routeId: fallback.id,
        routeTitle: fallback.title,
        ignored: true,
        autoIgnored,
      },
      message: `${fallback.result} 该事件已失效。`,
    };
  }

  if (event.id === 'durant_warriors' && currentTeams.length > 0) {
    const located = findPlayer(currentTeams, '凯文·杜兰特');
    const destinations = currentTeams.filter((team) => team.id !== located?.team.id && team.roster.some((player) => player.id !== userPlayerId && player.name !== userPlayerName));
    if (located && destinations.length > 0) {
      const destination = destinations[Math.min(destinations.length - 1, Math.floor(randomValue() * destinations.length))];
      const moved = applyDestinyMoves(event, currentYear, currentTeams, [{ playerName: '凯文·杜兰特', destinationTeamId: destination.id }], userPlayerId, userPlayerName);
      if (moved.success) {
        const message = `你没有选择既定分支，凯文·杜兰特随机加盟${destination.name}。该事件已失效。`;
        return {
          success: true,
          teams: moved.teams,
          record: { eventId: event.id, triggeredAtYear: currentYear, result: message, movedPlayers: moved.movedPlayers, ignored: true, autoIgnored },
          message,
        };
      }
    }
  }

  const resultText = event.ignoreResult || '玩家选择忽略，该事件没有改变当前时间线。';
  return {
    success: true,
    teams: currentTeams,
    record: {
      eventId: event.id,
      triggeredAtYear: currentYear,
      result: `${resultText} 该事件已失效。`,
      movedPlayers: [],
      ignored: true,
      autoIgnored,
    },
    message: `${resultText} 该事件已失效。`,
  };
}
