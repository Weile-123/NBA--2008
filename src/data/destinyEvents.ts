import type { GameState, RosterPlayer, Team } from '../types';
import { calculateTeamPowerRating } from '../utils/leagueLogic';

export type DestinyEventCategory = '决定' | '重磅交易' | '自由市场' | '联盟大事';

export interface DestinyEventCondition {
  type: 'player_exists' | 'player_on_team' | 'player_without_title' | 'players_exist' | 'team_strategy_in' | 'team_previous_wins_at_least' | 'team_max_elite_players' | 'player_team_previous_wins_at_most' | 'player_has_higher_rated_teammates';
  playerNames?: string[];
  teamId?: string;
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
}

export interface DestinyEventRoute {
  id: string;
  title: string;
  result: string;
  requiredScore: number;
  conditions: DestinyEventCondition[];
  moves: DestinyEventMove[];
}

export interface DestinyEventRecord {
  eventId: string;
  triggeredAtYear: number;
  result: string;
  movedPlayers: string[];
  routeId?: string;
  routeTitle?: string;
}

export type DestinyEventStatus = 'upcoming' | 'unavailable' | 'available' | 'triggered' | 'expired';

export interface DestinyEventEvaluation {
  event: DestinyEventDefinition;
  status: DestinyEventStatus;
  checks: DestinyConditionCheck[];
  score: number;
  requiredScore: number;
  routeEvaluations: DestinyRouteEvaluation[];
  record?: DestinyEventRecord;
}

export interface DestinyConditionCheck {
  label: string;
  met: boolean;
  required: boolean;
  points: number;
}

export interface DestinyRouteEvaluation {
  route: DestinyEventRoute;
  checks: DestinyConditionCheck[];
  score: number;
  requiredScore: number;
  available: boolean;
}

const exists = (playerName: string): DestinyEventCondition => ({
  type: 'player_exists', playerNames: [playerName], required: true, label: `${playerName}仍在联盟中`,
});
const allExist = (...playerNames: string[]): DestinyEventCondition => ({
  type: 'players_exist', playerNames, required: true, label: `${playerNames.join('、')}均在联盟中`,
});
const onTeam = (playerName: string, teamId: string, teamName: string): DestinyEventCondition => ({
  type: 'player_on_team', playerNames: [playerName], teamId, points: 2, label: `${playerName}效力于${teamName}（+2）`,
});
const withoutTitle = (playerName: string): DestinyEventCondition => ({
  type: 'player_without_title', playerNames: [playerName], required: true, label: `${playerName}此前尚未夺冠`,
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
const higherRatedTeammates = (playerName: string, value: number, points = 1): DestinyEventCondition => ({
  type: 'player_has_higher_rated_teammates', playerNames: [playerName], value, points, label: `${playerName}队内至少有${value}名综评更高的队友（+${points}）`,
});

export const DESTINY_EVENTS: DestinyEventDefinition[] = [
  {
    id: 'decision_1', year: 2010, title: '决定一：南海岸集结', category: '决定', protectionYears: 3,
    history: '2010 年夏天，勒布朗·詹姆斯宣布离开克里夫兰，与德维恩·韦德、克里斯·波什在迈阿密联手。',
    result: '勒布朗·詹姆斯与克里斯·波什加盟迈阿密，三位核心进入三年稳定期。',
    conditions: [exists('勒布朗·詹姆斯'), withoutTitle('勒布朗·詹姆斯')],
    moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'mia' }, { playerName: '克里斯·波什', destinationTeamId: 'mia' }],
    routes: [
      {
        id: 'south_beach', title: '南海岸三巨头', result: '勒布朗·詹姆斯与克里斯·波什加盟迈阿密，三位核心进入三年稳定期。', requiredScore: 4,
        conditions: [allExist('德维恩·韦德', '克里斯·波什'), onTeam('德维恩·韦德', 'mia', '迈阿密'), strategyIn('mia', '迈阿密', ['contender', 'playoff']), playerTeamMaxWins('勒布朗·詹姆斯', 59)],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'mia' }, { playerName: '克里斯·波什', destinationTeamId: 'mia' }],
      },
      {
        id: 'windy_city', title: '风城新王', result: '勒布朗·詹姆斯加盟芝加哥，与德里克·罗斯组成新的争冠核心。', requiredScore: 4,
        conditions: [exists('德里克·罗斯'), onTeam('德里克·罗斯', 'chi', '芝加哥'), strategyIn('chi', '芝加哥', ['contender', 'playoff']), minWins('chi', '芝加哥', 45)],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'chi' }],
      },
      {
        id: 'broadway', title: '百老汇巨星', result: '勒布朗·詹姆斯加盟纽约，麦迪逊广场花园迎来新的建队核心。', requiredScore: 3,
        conditions: [strategyIn('nyk', '纽约', ['retooling', 'rebuilding'], 2), maxElite('nyk', '纽约', 1, 88, 1), playerTeamMaxWins('勒布朗·詹姆斯', 55, 1)],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'nyk' }],
      },
    ],
  },
  {
    id: 'melo_new_york', year: 2011, title: '甜瓜奔赴纽约', category: '重磅交易', protectionYears: 2,
    history: '卡梅隆·安东尼在生涯巅峰期离开丹佛，纽约迎来久违的超级得分手。',
    result: '卡梅隆·安东尼加盟纽约，成为麦迪逊广场花园的新核心。',
    guide: true, conditions: [exists('卡梅隆·安东尼')], moves: [{ playerName: '卡梅隆·安东尼', destinationTeamId: 'nyk' }],
  },
  {
    id: 'lockout_2011', year: 2011, title: '停摆后的缩水赛季', category: '联盟大事', protectionYears: 2,
    history: '劳资谈判让新赛季延迟开启，密集赛程成为所有球队必须面对的新考验。',
    result: '缩水赛季成为这条时间线的重要节点，联盟竞争进入高强度阶段。',
    guide: true, conditions: [exists('勒布朗·詹姆斯')],
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
    guide: true, conditions: [exists('斯蒂芬·库里')],
  },
  {
    id: 'durant_warriors', year: 2016, title: '杜兰特的抉择', category: '决定', protectionYears: 3,
    history: '凯文·杜兰特加盟金州，与斯蒂芬·库里领衔的冠军班底组成历史级阵容。',
    result: '凯文·杜兰特加盟金州，杜兰特与库里进入三年稳定期。',
    conditions: [exists('凯文·杜兰特'), withoutTitle('凯文·杜兰特')],
    moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'gsw' }],
    routes: [
      {
        id: 'bay_area', title: '死神降临湾区', result: '凯文·杜兰特加盟金州，与斯蒂芬·库里组成历史级双核。', requiredScore: 3,
        conditions: [exists('斯蒂芬·库里'), onTeam('斯蒂芬·库里', 'gsw', '金州'), strategyIn('gsw', '金州', ['contender', 'playoff']), minWins('gsw', '金州', 55)],
        moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'gsw' }],
      },
      {
        id: 'boston_project', title: '绿军复兴计划', result: '凯文·杜兰特加盟波士顿，成为绿军复兴计划的头号核心。', requiredScore: 3,
        conditions: [strategyIn('bos', '波士顿', ['contender', 'playoff'], 2), maxElite('bos', '波士顿', 1, 88), playerTeamMaxWins('凯文·杜兰特', 55)],
        moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'bos' }],
      },
      {
        id: 'thunder_return', title: '雷霆最后一舞', result: '凯文·杜兰特留守俄克拉荷马，与威斯布鲁克继续冲击冠军。', requiredScore: 3,
        conditions: [exists('拉塞尔·威斯布鲁克'), onTeam('拉塞尔·威斯布鲁克', 'okc', '俄克拉荷马'), strategyIn('okc', '俄克拉荷马', ['contender', 'playoff'])],
        moves: [{ playerName: '凯文·杜兰特', destinationTeamId: 'okc' }],
      },
    ],
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
    id: 'lebron_lakers', year: 2018, title: '詹姆斯的下一站', category: '决定', protectionYears: 3,
    history: '勒布朗·詹姆斯加盟洛杉矶，将自己的生涯带到新的舞台。',
    result: '勒布朗·詹姆斯加盟洛杉矶湖人，开启三年稳定期。',
    conditions: [exists('勒布朗·詹姆斯')], moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'lal' }],
    routes: [
      {
        id: 'hollywood', title: '天选之子西游', result: '勒布朗·詹姆斯加盟洛杉矶湖人，开启新的争冠篇章。', requiredScore: 3,
        conditions: [strategyIn('lal', '洛杉矶湖人', ['playoff', 'retooling'], 2), maxElite('lal', '洛杉矶湖人', 1, 88), playerTeamMaxWins('勒布朗·詹姆斯', 55)],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'lal' }],
      },
      {
        id: 'process', title: '加入费城过程', result: '勒布朗·詹姆斯加盟费城，与乔尔·恩比德组成全新的东部争冠核心。', requiredScore: 4,
        conditions: [exists('乔尔·恩比德'), onTeam('乔尔·恩比德', 'phi', '费城'), strategyIn('phi', '费城', ['contender', 'playoff']), minWins('phi', '费城', 45)],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'phi' }],
      },
      {
        id: 'home_guardian', title: '继续守护家乡', result: '勒布朗·詹姆斯留在克里夫兰，继续为家乡冲击冠军。', requiredScore: 3,
        conditions: [onTeam('勒布朗·詹姆斯', 'cle', '克里夫兰'), strategyIn('cle', '克里夫兰', ['contender', 'playoff'])],
        moves: [{ playerName: '勒布朗·詹姆斯', destinationTeamId: 'cle' }],
      },
    ],
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
    guide: true, conditions: [exists('勒布朗·詹姆斯')],
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

function checkCondition(condition: DestinyEventCondition, teams: Team[], leagueHistory: GameState['leagueHistory'] = []): DestinyConditionCheck {
  const names = condition.playerNames || [];
  let met = false;
  if (condition.type === 'player_exists') met = !!findPlayer(teams, names[0]);
  else if (condition.type === 'players_exist') met = names.every((name) => !!findPlayer(teams, name));
  else if (condition.type === 'player_on_team') met = findPlayer(teams, names[0])?.team.id === condition.teamId;
  else if (condition.type === 'player_without_title') met = !playerWonTitle(names[0], leagueHistory);
  else if (condition.type === 'team_strategy_in') met = !!condition.strategies?.includes(teams.find((team) => team.id === condition.teamId)?.strategy || 'retooling');
  else if (condition.type === 'team_previous_wins_at_least') met = (teams.find((team) => team.id === condition.teamId)?.previousSeasonWins || 0) >= (condition.value || 0);
  else if (condition.type === 'team_max_elite_players') {
    const team = teams.find((candidate) => candidate.id === condition.teamId);
    met = !!team && team.roster.filter((player) => player.ovr >= (condition.ovrThreshold || 88)).length <= (condition.value || 0);
  } else if (condition.type === 'player_team_previous_wins_at_most') {
    const located = findPlayer(teams, names[0]);
    met = !!located && (located.team.previousSeasonWins || 0) <= (condition.value || 0);
  } else if (condition.type === 'player_has_higher_rated_teammates') {
    const located = findPlayer(teams, names[0]);
    met = !!located && located.team.roster.filter((player) => player.id !== located.player.id && player.ovr > located.player.ovr).length >= (condition.value || 0);
  }
  return { label: condition.label, met, required: condition.required === true, points: condition.required ? 0 : (condition.points || 0) };
}

function defaultScoringConditions(event: DestinyEventDefinition, teams: Team[]): DestinyEventCondition[] {
  if (event.guide || event.routes?.length || !event.moves?.length) return [];
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
): DestinyEventEvaluation {
  const record = records[event.id];
  const checks = [...event.conditions, ...defaultScoringConditions(event, teams)].map((condition) => checkCondition(condition, teams, leagueHistory));
  const requiredMet = checks.filter((check) => check.required).every((check) => check.met);
  const score = checks.reduce((sum, check) => sum + (check.met ? check.points : 0), 0);
  const requiredScore = event.requiredScore ?? (event.guide ? 0 : event.category === '决定' ? 3 : 2);
  const routeEvaluations = (event.routes || []).map((route) => {
    const routeChecks = route.conditions.map((condition) => checkCondition(condition, teams, leagueHistory));
    const routeRequiredMet = routeChecks.filter((check) => check.required).every((check) => check.met);
    const routeScore = routeChecks.reduce((sum, check) => sum + (check.met ? check.points : 0), 0);
    return { route, checks: routeChecks, score: routeScore, requiredScore: route.requiredScore, available: requiredMet && routeRequiredMet && routeScore >= route.requiredScore };
  });
  const conditionsMet = routeEvaluations.length
    ? routeEvaluations.some((route) => route.available)
    : requiredMet && score >= requiredScore;
  const status: DestinyEventStatus = record
    ? 'triggered'
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
  routeId?: string,
): { success: boolean; teams: Team[]; record?: DestinyEventRecord; message: string } {
  const evaluation = evaluateDestinyEvent(event, currentYear, currentTeams, leagueHistory, records);
  if (evaluation.status !== 'available') return { success: false, teams: currentTeams, message: '当前条件不满足，无法触发该事件' };
  const routeEvaluation = evaluation.routeEvaluations.length
    ? evaluation.routeEvaluations.find((route) => route.route.id === routeId && route.available) || evaluation.routeEvaluations.find((route) => route.available)
    : undefined;
  if (evaluation.routeEvaluations.length && !routeEvaluation) return { success: false, teams: currentTeams, message: '所选命运分支的条件尚未满足' };
  const activeMoves = routeEvaluation?.route.moves || event.moves || [];
  const activeResult = routeEvaluation?.route.result || event.result;
  const teams = currentTeams.map((team) => ({ ...team, roster: team.roster.map((player) => ({ ...player })) }));
  const movedPlayers: string[] = [];

  for (const move of activeMoves) {
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

  const protagonists = new Set(activeMoves.map((move) => move.playerName));
  for (const team of teams) {
    team.roster = team.roster.map((player) => protagonists.has(player.name)
      ? { ...player, tradeProtectionUntilYear: currentYear + event.protectionYears - 1 }
      : player);
    refreshTeam(team);
  }
  const record: DestinyEventRecord = { eventId: event.id, triggeredAtYear: currentYear, result: activeResult, movedPlayers, routeId: routeEvaluation?.route.id, routeTitle: routeEvaluation?.route.title };
  return { success: true, teams, record, message: activeResult };
}
