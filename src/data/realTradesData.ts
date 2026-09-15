import { Team, RosterPlayer, Position } from '../types';
import { calculateTeamPowerRating } from '../utils/leagueLogic';

export type RealTradeType = 'swap' | 'three_way' | 'single_move' | 'retire' | 'league_change';

export interface RealTradeItem {
  id: string;
  type?: RealTradeType; // defaults to 'swap'
  // For standard 'swap':
  playerAName?: string;
  teamAId?: string;
  teamAName?: string;
  playerBName?: string;
  teamBId?: string;
  teamBName?: string;

  // For 'three_way':
  threeWayMoves?: Array<{
    playerName: string;
    fromTeamId: string;
    fromTeamName: string;
    toTeamId: string;
    toTeamName: string;
  }>;

  // For 'single_move' and 'retire':
  playerName?: string;
  retiredPlayerName?: string;
  fromTeamId?: string;
  fromTeamName?: string;
  toTeamId?: string;
  toTeamName?: string;
  targetOvr?: number;

  // For 'league_change':
  leagueChangeDetail?: {
    title: string;
    description: string;
  };
}

export interface SeasonTradesConfig {
  year: number; // e.g. 2009 for 2009-2010 season, 2010 for 2010-2011 season
  seasonName: string;
  trades: RealTradeItem[];
}

export interface ExecutedTradeDetail {
  id: string;
  type: RealTradeType;
  tradeCategory?: 'blockbuster' | 'starter' | 'rotation';
  importanceScore?: number;

  // For 'swap'
  playerA?: {
    name: string;
    position: string;
    ovr: number;
    fromTeamId: string;
    fromTeamName: string;
    toTeamId: string;
    toTeamName: string;
  };
  playerB?: {
    name: string;
    position: string;
    ovr: number;
    fromTeamId: string;
    fromTeamName: string;
    toTeamId: string;
    toTeamName: string;
  };
  teamAOldRating?: number;
  teamANewRating?: number;
  teamBOldRating?: number;
  teamBNewRating?: number;

  // For 'three_way'
  threeWayMovesDetails?: Array<{
    playerName: string;
    position: string;
    ovr: number;
    fromTeamId: string;
    fromTeamName: string;
    toTeamId: string;
    toTeamName: string;
  }>;

  // For 'single_move'
  singleMoveDetail?: {
    playerName: string;
    position: string;
    ovr: number;
    fromTeamId: string;
    fromTeamName: string;
    toTeamId: string;
    toTeamName: string;
  };

  // For 'retire'
  retireDetail?: {
    playerName: string;
    position: string;
    ovr: number;
    fromTeamId: string;
    fromTeamName: string;
  };

  // For 'league_change'
  leagueChangeDetail?: {
    title: string;
    description: string;
  };
}

export interface TradeModalData {
  year: number;
  seasonName: string;
  tradeSource?: 'historical' | 'random';
  totalTransactions?: number;
  hiddenTransactions?: number;
  executedTrades: ExecutedTradeDetail[];
}

export interface HistoricalTradeOptions {
  userPlayerId?: string;
  userPlayerName?: string;
}

export const HISTORICAL_REAL_TRADES: Record<number, SeasonTradesConfig> = {
  2009: {
    year: 2009,
    seasonName: '2009-2010 赛季',
    trades: [
      {
        id: 'trade_2009_1',
        type: 'swap',
        playerAName: '文斯·卡特',
        teamAId: 'bkn',
        teamAName: '新泽西篮网',
        playerBName: '考特尼·李',
        teamBId: 'orl',
        teamBName: '奥兰多魔术',
      },
      {
        id: 'trade_2009_2',
        type: 'swap',
        playerAName: '沙奎尔·奥尼尔',
        teamAId: 'phx',
        teamAName: '菲尼克斯太阳',
        playerBName: '本·华莱士',
        teamBId: 'cle',
        teamBName: '克利夫兰骑士',
      },
      {
        id: 'trade_2009_3',
        type: 'swap',
        playerAName: '理查德·杰弗森',
        teamAId: 'mil',
        teamAName: '密尔沃基雄鹿',
        playerBName: '法布里西奥·奥贝托',
        teamBId: 'sas',
        teamBName: '圣安东尼奥马刺',
      },
      {
        id: 'trade_2009_4',
        type: 'swap',
        playerAName: '扎克·兰多夫',
        teamAId: 'lac',
        teamAName: '洛杉矶快船',
        playerBName: '哈基姆·瓦里克',
        teamBId: 'mem',
        teamBName: '孟菲斯灰熊',
      },
      {
        id: 'trade_2009_5',
        type: 'swap',
        playerAName: '希达耶特·特科格鲁',
        teamAId: 'orl',
        teamAName: '奥兰多魔术',
        playerBName: '贾马里奥·穆恩',
        teamBId: 'tor',
        teamBName: '多伦多猛龙',
      },
      {
        id: 'trade_2009_6',
        type: 'swap',
        playerAName: '罗恩·阿泰斯特',
        teamAId: 'hou',
        teamAName: '休斯顿火箭',
        playerBName: '特雷沃·阿里扎',
        teamBId: 'lal',
        teamBName: '洛杉矶湖人',
      },
      {
        id: 'trade_2009_7',
        type: 'swap',
        playerAName: '拉希德·华莱士',
        teamAId: 'det',
        teamAName: '底特律活塞',
        playerBName: '布莱恩·斯卡拉布莱恩',
        teamBId: 'bos',
        teamBName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2009_8',
        type: 'swap',
        playerAName: '本·戈登',
        teamAId: 'chi',
        teamAName: '芝加哥公牛',
        playerBName: '阿隆·阿夫拉罗',
        teamBId: 'det',
        teamBName: '底特律活塞',
      },
      {
        id: 'trade_2009_9',
        type: 'swap',
        playerAName: '阿伦·艾弗森',
        teamAId: 'det',
        teamAName: '底特律活塞',
        playerBName: '凯尔·洛瑞',
        teamBId: 'mem',
        teamBName: '孟菲斯灰熊',
      },
      {
        id: 'trade_2009_10',
        type: 'retire',
        retiredPlayerName: '迪肯贝·穆托姆博',
        fromTeamId: 'hou',
        fromTeamName: '休斯顿火箭',
      },
      {
        id: 'trade_2009_11',
        type: 'single_move',
        playerName: '斯蒂芬·杰克逊',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
        toTeamId: 'cha',
        toTeamName: '夏洛特山猫',
      },
    ],
  },
  2010: {
    year: 2010,
    seasonName: '2010-2011 赛季',
    trades: [
      {
        id: 'trade_2010_1',
        type: 'swap',
        playerAName: '勒布朗·詹姆斯',
        teamAId: 'cle',
        teamAName: '克利夫兰骑士',
        playerBName: '亚库巴·迪亚瓦拉',
        teamBId: 'mia',
        teamBName: '迈阿密热火',
      },
      {
        id: 'trade_2010_2',
        type: 'swap',
        playerAName: '肖恩·马里昂',
        teamAId: 'mia',
        teamAName: '迈阿密热火',
        playerBName: '詹姆斯·辛格尔顿',
        teamBId: 'dal',
        teamBName: '达拉斯独行侠',
      },
      {
        id: 'trade_2010_3',
        type: 'swap',
        playerAName: '克里斯·波什',
        teamAId: 'tor',
        teamAName: '多伦多猛龙',
        playerBName: '迈克尔·比斯利',
        teamBId: 'mia',
        teamBName: '迈阿密热火',
      },
      {
        id: 'trade_2010_4',
        type: 'swap',
        playerAName: '阿玛雷·斯塔德迈尔',
        teamAId: 'phx',
        teamAName: '菲尼克斯太阳',
        playerBName: '艾尔·哈灵顿',
        teamBId: 'nyk',
        teamBName: '纽约尼克斯',
      },
      {
        id: 'trade_2010_5',
        type: 'swap',
        playerAName: '卡洛斯·布泽尔',
        teamAId: 'uta',
        teamAName: '犹他爵士',
        playerBName: '泰鲁斯·托马斯',
        teamBId: 'chi',
        teamBName: '芝加哥公牛',
      },
      {
        id: 'trade_2010_6',
        type: 'swap',
        playerAName: '卡隆·巴特勒',
        teamAId: 'was',
        teamAName: '华盛顿奇才',
        playerBName: '约什·霍华德',
        teamBId: 'dal',
        teamBName: '达拉斯独行侠',
      },
      {
        id: 'trade_2010_7',
        type: 'swap',
        playerAName: '布兰登·海伍德',
        teamAId: 'was',
        teamAName: '华盛顿奇才',
        playerBName: '埃里克·丹皮尔',
        teamBId: 'dal',
        teamBName: '达拉斯独行侠',
      },
      {
        id: 'trade_2010_8',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '特雷西·麦克格雷迪',
            fromTeamId: 'hou',
            fromTeamName: '休斯顿火箭',
            toTeamId: 'nyk',
            toTeamName: '纽约尼克斯',
          },
          {
            playerName: '凯文·马丁',
            fromTeamId: 'sac',
            fromTeamName: '萨克拉门托国王',
            toTeamId: 'hou',
            toTeamName: '休斯顿火箭',
          },
          {
            playerName: '昆廷·理查德森',
            fromTeamId: 'nyk',
            fromTeamName: '纽约尼克斯',
            toTeamId: 'sac',
            toTeamName: '萨克拉门托国王',
          },
        ],
      },
      {
        id: 'trade_2010_9',
        type: 'single_move',
        playerName: '沙奎尔·奥尼尔',
        fromTeamId: 'cle',
        fromTeamName: '克利夫兰骑士',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2010_10',
        type: 'swap',
        playerAName: '大卫·李',
        teamAId: 'nyk',
        teamAName: '纽约尼克斯',
        playerBName: '罗尼·图里亚夫',
        teamBId: 'gsw',
        teamBName: '金州勇士',
      },
      {
        id: 'trade_2010_11',
        type: 'retire',
        retiredPlayerName: '阿伦·艾弗森',
        fromTeamId: 'mem',
        fromTeamName: '孟菲斯灰熊',
      },
      {
        id: 'trade_2010_12',
        type: 'retire',
        retiredPlayerName: '拉希德·华莱士',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2010_13',
        type: 'retire',
        retiredPlayerName: '卡蒂诺·莫布里',
        fromTeamId: 'nyk',
        fromTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2010_14',
        type: 'single_move',
        playerName: '丹尼·格林',
        fromTeamId: 'cle',
        fromTeamName: '克利夫兰骑士',
        toTeamId: 'sas',
        toTeamName: '圣安东尼奥马刺',
      },
    ],
  },
  2011: {
    year: 2011,
    seasonName: '2011-2012 赛季',
    trades: [
      {
        id: 'trade_2011_1',
        type: 'swap',
        playerAName: '卡梅隆·安东尼',
        teamAId: 'den',
        teamAName: '丹佛掘金',
        playerBName: '威尔森·钱德勒',
        teamBId: 'nyk',
        teamBName: '纽约尼克斯',
      },
      {
        id: 'trade_2011_2',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '克里斯·保罗',
            fromTeamId: 'noh',
            fromTeamName: '新奥尔良黄蜂',
            toTeamId: 'lac',
            toTeamName: '洛杉矶快船',
          },
          {
            playerName: '埃里克·戈登',
            fromTeamId: 'lac',
            fromTeamName: '洛杉矶快船',
            toTeamId: 'noh',
            toTeamName: '新奥尔良黄蜂',
          },
          {
            playerName: '克里斯·卡曼',
            fromTeamId: 'lac',
            fromTeamName: '洛杉矶快船',
            toTeamId: 'noh',
            toTeamName: '新奥尔良黄蜂',
          },
        ],
      },
      {
        id: 'trade_2011_3',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '德隆·威廉姆斯',
            fromTeamId: 'uta',
            fromTeamName: '犹他爵士',
            toTeamId: 'bkn',
            toTeamName: '新泽西篮网',
          },
          {
            playerName: '德文·哈里斯',
            fromTeamId: 'bkn',
            fromTeamName: '新泽西篮网',
            toTeamId: 'uta',
            toTeamName: '犹他爵士',
          },
          {
            playerName: '德里克·费沃斯',
            fromTeamId: 'bkn',
            fromTeamName: '新泽西篮网',
            toTeamId: 'uta',
            toTeamName: '犹他爵士',
          },
        ],
      },
      {
        id: 'trade_2011_4',
        type: 'swap',
        playerAName: '肖恩·巴蒂尔',
        teamAId: 'hou',
        teamAName: '休斯顿火箭',
        playerBName: '哈希姆·塔比特',
        teamBId: 'mem',
        teamBName: '孟菲斯灰熊',
      },
      {
        id: 'trade_2011_5',
        type: 'single_move',
        playerName: '昌西·比卢普斯',
        fromTeamId: 'den',
        fromTeamName: '丹佛掘金',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2011_6',
        type: 'swap',
        playerAName: '泰森·钱德勒',
        teamAId: 'noh',
        teamAName: '新奥尔良黄蜂',
        playerBName: '埃迪·库里',
        teamBId: 'nyk',
        teamBName: '纽约尼克斯',
      },
      {
        id: 'trade_2011_7',
        type: 'single_move',
        playerName: '马库斯·坎比',
        fromTeamId: 'lac',
        fromTeamName: '洛杉矶快船',
        toTeamId: 'hou',
        toTeamName: '休斯顿火箭',
      },
      {
        id: 'trade_2011_8',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '蒙塔·埃利斯',
            fromTeamId: 'gsw',
            fromTeamName: '金州勇士',
            toTeamId: 'mil',
            toTeamName: '密尔沃基雄鹿',
          },
          {
            playerName: '埃佩·尤度',
            fromTeamId: 'gsw',
            fromTeamName: '金州勇士',
            toTeamId: 'mil',
            toTeamName: '密尔沃基雄鹿',
          },
          {
            playerName: '安德鲁·博古特',
            fromTeamId: 'mil',
            fromTeamName: '密尔沃基雄鹿',
            toTeamId: 'gsw',
            toTeamName: '金州勇士',
          },
        ],
      },
      {
        id: 'trade_2011_9',
        type: 'retire',
        retiredPlayerName: '姚明',
        fromTeamId: 'hou',
        fromTeamName: '休斯顿火箭',
      },
      {
        id: 'trade_2011_10',
        type: 'retire',
        retiredPlayerName: '沙奎尔·奥尼尔',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2011_11',
        type: 'retire',
        retiredPlayerName: '佩贾·斯托亚科维奇',
        fromTeamId: 'noh',
        fromTeamName: '新奥尔良黄蜂',
      },
    ],
  },
  2012: {
    year: 2012,
    seasonName: '2012-2013 赛季',
    trades: [
      {
        id: 'trade_2012_1',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '德怀特·霍华德',
            fromTeamId: 'orl',
            fromTeamName: '奥兰多魔术',
            toTeamId: 'lal',
            toTeamName: '洛杉矶湖人',
          },
          {
            playerName: '安德烈·伊古达拉',
            fromTeamId: 'phi',
            fromTeamName: '费城76人',
            toTeamId: 'den',
            toTeamName: '丹佛掘金',
          },
          {
            playerName: '尼古拉·武切维奇',
            fromTeamId: 'phi',
            fromTeamName: '费城76人',
            toTeamId: 'orl',
            toTeamName: '奥兰多魔术',
          },
          {
            playerName: '安德鲁·拜纳姆',
            fromTeamId: 'lal',
            fromTeamName: '洛杉矶湖人',
            toTeamId: 'phi',
            toTeamName: '费城76人',
          },
          {
            playerName: '贾森·理查德森',
            fromTeamId: 'phx',
            fromTeamName: '菲尼克斯太阳',
            toTeamId: 'phi',
            toTeamName: '费城76人',
          },
        ],
      },
      {
        id: 'trade_2012_2',
        type: 'single_move',
        playerName: '史蒂夫·纳什',
        fromTeamId: 'phx',
        fromTeamName: '菲尼克斯太阳',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2012_3',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '詹姆斯·哈登',
            fromTeamId: 'okc',
            fromTeamName: '俄克拉荷马雷霆',
            toTeamId: 'hou',
            toTeamName: '休斯顿火箭',
          },
          {
            playerName: '凯文·马丁',
            fromTeamId: 'hou',
            fromTeamName: '休斯顿火箭',
            toTeamId: 'okc',
            toTeamName: '俄克拉荷马雷霆',
          },
          {
            playerName: '杰里米·兰姆',
            fromTeamId: 'hou',
            fromTeamName: '休斯顿火箭',
            toTeamId: 'okc',
            toTeamName: '俄克拉荷马雷霆',
          },
        ],
      },
      {
        id: 'trade_2012_4',
        type: 'single_move',
        playerName: '乔·约翰逊',
        fromTeamId: 'atl',
        fromTeamName: '亚特兰大老鹰',
        toTeamId: 'bkn',
        toTeamName: '布鲁克林篮网',
      },
      {
        id: 'trade_2012_5',
        type: 'single_move',
        playerName: '易建联',
        fromTeamId: 'bkn',
        fromTeamName: '布鲁克林篮网',
        toTeamId: 'den',
        toTeamName: '丹佛掘金',
      },
      {
        id: 'trade_2012_6',
        type: 'single_move',
        playerName: '安东尼·莫罗',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
        toTeamId: 'atl',
        toTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2012_7',
        type: 'single_move',
        playerName: '乔丹·法玛尔',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'atl',
        toTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2012_8',
        type: 'single_move',
        playerName: '雷·阿伦',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'mia',
        toTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2012_9',
        type: 'single_move',
        playerName: '凯尔·洛瑞',
        fromTeamId: 'det',
        fromTeamName: '底特律活塞',
        toTeamId: 'tor',
        toTeamName: '多伦多猛龙',
      },
      {
        id: 'trade_2012_10',
        type: 'single_move',
        playerName: '加里·福布斯',
        fromTeamId: 'noh',
        fromTeamName: '新奥尔良黄蜂',
        toTeamId: 'hou',
        toTeamName: '休斯顿火箭',
      },
      {
        id: 'trade_2012_11',
        type: 'single_move',
        playerName: '贾马尔·克劳福德',
        fromTeamId: 'nyk',
        fromTeamName: '纽约尼克斯',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2012_12',
        type: 'single_move',
        playerName: '贾森·基德',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
        toTeamId: 'nyk',
        toTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2012_13',
        type: 'retire',
        retiredPlayerName: '本·华莱士',
        fromTeamId: 'det',
        fromTeamName: '底特律活塞',
      },
    ],
  },
  2013: {
    year: 2013,
    seasonName: '2013-2014 赛季',
    trades: [
      {
        id: 'trade_2013_league_change',
        type: 'league_change',
        leagueChangeDetail: {
          title: '球队更名公告',
          description: '新奥尔良黄蜂 正式更名为 新奥尔良鹈鹕',
        },
      },
      {
        id: 'trade_2013_1',
        type: 'single_move',
        playerName: '凯文·加内特',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'bkn',
        toTeamName: '布鲁克林篮网',
      },
      {
        id: 'trade_2013_2',
        type: 'single_move',
        playerName: '保罗·皮尔斯',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'bkn',
        toTeamName: '布鲁克林篮网',
      },
      {
        id: 'trade_2013_3',
        type: 'single_move',
        playerName: '杰拉德·华莱士',
        fromTeamId: 'cha',
        fromTeamName: '夏洛特山猫',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2013_4',
        type: 'single_move',
        playerName: '基斯·博甘斯',
        fromTeamId: 'orl',
        fromTeamName: '奥兰多魔术',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2013_5',
        type: 'single_move',
        playerName: '雷吉·埃文斯',
        fromTeamId: 'phi',
        fromTeamName: '费城76人',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2013_6',
        type: 'single_move',
        playerName: '德怀特·霍华德',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'hou',
        toTeamName: '休斯顿火箭',
      },
      {
        id: 'trade_2013_7',
        type: 'single_move',
        playerName: '安德烈·伊戈达拉',
        fromTeamId: 'den',
        fromTeamName: '丹佛掘金',
        toTeamId: 'gsw',
        toTeamName: '金州勇士',
      },
      {
        id: 'trade_2013_8',
        type: 'single_move',
        playerName: '兰迪·弗耶',
        fromTeamId: 'min',
        fromTeamName: '明尼苏达森林狼',
        toTeamId: 'den',
        toTeamName: '丹佛掘金',
      },
      {
        id: 'trade_2013_9',
        type: 'swap',
        playerAName: '朱·霍勒迪',
        teamAId: 'phi',
        teamAName: '费城76人',
        playerBName: '诺伦斯·诺尔',
        teamBId: 'noh',
        teamBName: '新奥尔良鹈鹕',
      },
      {
        id: 'trade_2013_10',
        type: 'single_move',
        playerName: '保罗·米尔萨普',
        fromTeamId: 'uta',
        fromTeamName: '犹他爵士',
        toTeamId: 'atl',
        toTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2013_11',
        type: 'single_move',
        playerName: '安德里亚·巴尔尼亚尼',
        fromTeamId: 'tor',
        fromTeamName: '多伦多猛龙',
        toTeamId: 'nyk',
        toTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2013_12',
        type: 'single_move',
        playerName: '史蒂夫·诺瓦克',
        fromTeamId: 'lac',
        fromTeamName: '洛杉矶快船',
        toTeamId: 'tor',
        toTeamName: '多伦多猛龙',
      },
      {
        id: 'trade_2013_13',
        type: 'single_move',
        playerName: '昆廷·理查德森',
        fromTeamId: 'sac',
        fromTeamName: '萨克拉门托国王',
        toTeamId: 'tor',
        toTeamName: '多伦多猛龙',
      },
      {
        id: 'trade_2013_14',
        type: 'swap',
        playerAName: '埃里克·布莱索',
        teamAId: 'lac',
        teamAName: '洛杉矶快船',
        playerBName: '贾里德·杜德利',
        teamBId: 'phx',
        teamBName: '菲尼克斯太阳',
      },
      {
        id: 'trade_2013_15',
        type: 'single_move',
        playerName: '蒙塔·埃利斯',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
        toTeamId: 'dal',
        toTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2013_16',
        type: 'single_move',
        playerName: '约什·史密斯',
        fromTeamId: 'atl',
        fromTeamName: '亚特兰大老鹰',
        toTeamId: 'det',
        toTeamName: '底特律活塞',
      },
      {
        id: 'trade_2013_17',
        type: 'retire',
        retiredPlayerName: '特雷西·麦克格雷迪',
        fromTeamId: 'nyk',
        fromTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2013_18',
        type: 'retire',
        retiredPlayerName: '贾森·基德',
        fromTeamId: 'nyk',
        fromTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2013_19',
        type: 'retire',
        retiredPlayerName: '格兰特·希尔',
        fromTeamId: 'phx',
        fromTeamName: '菲尼克斯太阳',
      },
      {
        id: 'trade_2013_20',
        type: 'retire',
        retiredPlayerName: '理查德·汉密尔顿',
        fromTeamId: 'det',
        fromTeamName: '底特律活塞',
      },
      {
        id: 'trade_2013_21',
        type: 'retire',
        retiredPlayerName: '朱万·霍华德',
        fromTeamId: 'mia',
        fromTeamName: '迈阿密热火',
      },
    ],
  },
  2014: {
    year: 2014,
    seasonName: '2014-2015 赛季',
    trades: [
      {
        id: 'trade_2014_league_change',
        type: 'league_change',
        leagueChangeDetail: {
          title: '球队更名公告',
          description: '夏洛特山猫 正式更名为 夏洛特黄蜂',
        },
      },
      {
        id: 'trade_2014_1',
        type: 'single_move',
        playerName: '勒布朗·詹姆斯',
        fromTeamId: 'mia',
        fromTeamName: '迈阿密热火',
        toTeamId: 'cle',
        toTeamName: '克利夫兰骑士',
      },
      {
        id: 'trade_2014_2',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '凯文·乐福',
            fromTeamId: 'min',
            fromTeamName: '明尼苏达森林狼',
            toTeamId: 'cle',
            toTeamName: '克利夫兰骑士',
          },
          {
            playerName: '安德鲁·维金斯',
            fromTeamId: 'cle',
            fromTeamName: '克利夫兰骑士',
            toTeamId: 'min',
            toTeamName: '明尼苏达森林狼',
          },
          {
            playerName: '安东尼·本内特',
            fromTeamId: 'cle',
            fromTeamName: '克利夫兰骑士',
            toTeamId: 'min',
            toTeamName: '明尼苏达森林狼',
          },
        ],
      },
      {
        id: 'trade_2014_3',
        type: 'single_move',
        playerName: '保罗·加索尔',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'chi',
        toTeamName: '芝加哥公牛',
      },
      {
        id: 'trade_2014_4',
        type: 'single_move',
        playerName: '鲁迪·盖伊',
        fromTeamId: 'mem',
        fromTeamName: '孟菲斯灰熊',
        toTeamId: 'sac',
        toTeamName: '萨克拉门托国王',
      },
      {
        id: 'trade_2014_5',
        type: 'single_move',
        playerName: '约翰·萨尔蒙斯',
        fromTeamId: 'sac',
        fromTeamName: '萨克拉门托国王',
        toTeamId: 'tor',
        toTeamName: '多伦多猛龙',
      },
      {
        id: 'trade_2014_6',
        type: 'single_move',
        playerName: '格雷维斯·瓦斯奎兹',
        fromTeamId: 'mem',
        fromTeamName: '孟菲斯灰熊',
        toTeamId: 'tor',
        toTeamName: '多伦多猛龙',
      },
      {
        id: 'trade_2014_9',
        type: 'single_move',
        playerName: '以赛亚·托马斯',
        fromTeamId: 'sac',
        fromTeamName: '萨克拉门托国王',
        toTeamId: 'phx',
        toTeamName: '菲尼克斯太阳',
      },
      {
        id: 'trade_2014_7',
        type: 'retire',
        retiredPlayerName: '德里克·费舍尔',
        fromTeamId: 'okc',
        fromTeamName: '俄克拉荷马雷霆',
      },
      {
        id: 'trade_2014_8',
        type: 'retire',
        retiredPlayerName: '肖恩·巴蒂尔',
        fromTeamId: 'mia',
        fromTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2014_10',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '迪昂·维特斯',
            fromTeamId: 'cle',
            fromTeamName: '克利夫兰骑士',
            toTeamId: 'den',
            toTeamName: '丹佛掘金',
          },
          {
            playerName: 'J.R. 史密斯',
            fromTeamId: 'den',
            fromTeamName: '丹佛掘金',
            toTeamId: 'cle',
            toTeamName: '克利夫兰骑士',
          },
        ],
      },
    ],
  },
  2015: {
    year: 2015,
    seasonName: '2015-2016 赛季',
    trades: [
      {
        id: 'trade_2015_1',
        type: 'single_move',
        playerName: '拉马库斯·阿尔德里奇',
        fromTeamId: 'por',
        fromTeamName: '波特兰开拓者',
        toTeamId: 'sas',
        toTeamName: '圣安东尼奥马刺',
      },
      {
        id: 'trade_2015_2',
        type: 'single_move',
        playerName: '戈兰·德拉季奇',
        fromTeamId: 'phx',
        fromTeamName: '菲尼克斯太阳',
        toTeamId: 'mia',
        toTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2015_3',
        type: 'single_move',
        playerName: '丹尼·格兰杰',
        fromTeamId: 'ind',
        fromTeamName: '印第安纳步行者',
        toTeamId: 'phx',
        toTeamName: '菲尼克斯太阳',
      },
      {
        id: 'trade_2015_4',
        type: 'single_move',
        playerName: '雷吉·杰克逊',
        fromTeamId: 'okc',
        fromTeamName: '俄克拉荷马雷霆',
        toTeamId: 'det',
        toTeamName: '底特律活塞',
      },
      {
        id: 'trade_2015_5',
        type: 'single_move',
        playerName: 'D.J. 奥古斯丁',
        fromTeamId: 'cha',
        fromTeamName: '夏洛特黄蜂',
        toTeamId: 'okc',
        toTeamName: '俄克拉荷马雷霆',
      },
      {
        id: 'trade_2015_6',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '尼古拉·巴图姆',
            fromTeamId: 'por',
            fromTeamName: '波特兰开拓者',
            toTeamId: 'cha',
            toTeamName: '夏洛特黄蜂',
          },
          {
            playerName: '杰拉德·亨德森',
            fromTeamId: 'cha',
            fromTeamName: '夏洛特黄蜂',
            toTeamId: 'por',
            toTeamName: '波特兰开拓者',
          },
          {
            playerName: '诺阿·冯莱',
            fromTeamId: 'cha',
            fromTeamName: '夏洛特黄蜂',
            toTeamId: 'por',
            toTeamName: '波特兰开拓者',
          },
        ],
      },
      {
        id: 'trade_2015_7',
        type: 'single_move',
        playerName: '泰·劳森',
        fromTeamId: 'min',
        fromTeamName: '明尼苏达森林狼',
        toTeamId: 'hou',
        toTeamName: '休斯顿火箭',
      },
      {
        id: 'trade_2015_8',
        type: 'single_move',
        playerName: '乔伊·多西',
        fromTeamId: 'hou',
        fromTeamName: '休斯顿火箭',
        toTeamId: 'den',
        toTeamName: '丹佛掘金',
      },
      {
        id: 'trade_2015_9',
        type: 'single_move',
        playerName: '蒙塔·埃利斯',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
        toTeamId: 'ind',
        toTeamName: '印第安纳步行者',
      },
      {
        id: 'trade_2015_10',
        type: 'single_move',
        playerName: '葛雷格·门罗',
        fromTeamId: 'det',
        fromTeamName: '底特律活塞',
        toTeamId: 'mil',
        toTeamName: '密尔沃基雄鹿',
      },
      {
        id: 'trade_2015_11',
        type: 'single_move',
        playerName: '德马尔·卡罗尔',
        fromTeamId: 'mem',
        fromTeamName: '孟菲斯灰熊',
        toTeamId: 'tor',
        toTeamName: '多伦多猛龙',
      },
      {
        id: 'trade_2015_16',
        type: 'single_move',
        playerName: '以赛亚·托马斯',
        fromTeamId: 'phx',
        fromTeamName: '菲尼克斯太阳',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2015_12',
        type: 'retire',
        retiredPlayerName: '史蒂夫·纳什',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2015_13',
        type: 'retire',
        retiredPlayerName: '雷·阿伦',
        fromTeamId: 'mia',
        fromTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2015_14',
        type: 'retire',
        retiredPlayerName: '安德烈·基里连科',
        fromTeamId: 'uta',
        fromTeamName: '犹他爵士',
      },
      {
        id: 'trade_2015_15',
        type: 'retire',
        retiredPlayerName: '肖恩·马里昂',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2015_23',
        type: 'single_move',
        playerName: '塞斯·库里',
        fromTeamId: 'phx',
        fromTeamName: '菲尼克斯太阳',
        toTeamId: 'sac',
        toTeamName: '萨克拉门托国王',
      },
    ],
  },
  2016: {
    year: 2016,
    seasonName: '2016-2017 赛季',
    trades: [
      {
        id: 'trade_2016_1',
        type: 'single_move',
        playerName: '凯文·杜兰特',
        fromTeamId: 'okc',
        fromTeamName: '俄克拉荷马雷霆',
        toTeamId: 'gsw',
        toTeamName: '金州勇士',
      },
      {
        id: 'trade_2016_2',
        type: 'single_move',
        playerName: '德维恩·韦德',
        fromTeamId: 'mia',
        fromTeamName: '迈阿密热火',
        toTeamId: 'chi',
        toTeamName: '芝加哥公牛',
      },
      {
        id: 'trade_2016_3',
        type: 'single_move',
        playerName: '艾尔·霍福德',
        fromTeamId: 'atl',
        fromTeamName: '亚特兰大老鹰',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2016_4',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '德里克·罗斯',
            fromTeamId: 'chi',
            fromTeamName: '芝加哥公牛',
            toTeamId: 'nyk',
            toTeamName: '纽约尼克斯',
          },
          {
            playerName: '杰里安·格兰特',
            fromTeamId: 'nyk',
            fromTeamName: '纽约尼克斯',
            toTeamId: 'chi',
            toTeamName: '芝加哥公牛',
          },
        ],
      },
      {
        id: 'trade_2016_5',
        type: 'single_move',
        playerName: '保罗·加索尔',
        fromTeamId: 'chi',
        fromTeamName: '芝加哥公牛',
        toTeamId: 'sas',
        toTeamName: '圣安东尼奥马刺',
      },
      {
        id: 'trade_2016_6',
        type: 'single_move',
        playerName: '哈里森·巴恩斯',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
        toTeamId: 'dal',
        toTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2016_13',
        type: 'single_move',
        playerName: '维克托·奥拉迪波',
        fromTeamId: 'orl',
        fromTeamName: '奥兰多魔术',
        toTeamId: 'okc',
        toTeamName: '俄克拉荷马雷霆',
      },
      {
        id: 'trade_2016_14',
        type: 'single_move',
        playerName: '塞尔吉·伊巴卡',
        fromTeamId: 'okc',
        fromTeamName: '俄克拉荷马雷霆',
        toTeamId: 'orl',
        toTeamName: '奥兰多魔术',
      },
      {
        id: 'trade_2016_7',
        type: 'retire',
        retiredPlayerName: '科比·布莱恩特',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2016_8',
        type: 'retire',
        retiredPlayerName: '蒂姆·邓肯',
        fromTeamId: 'sas',
        fromTeamName: '圣安东尼奥马刺',
      },
      {
        id: 'trade_2016_9',
        type: 'retire',
        retiredPlayerName: '凯文·加内特',
        fromTeamId: 'bkn',
        fromTeamName: '布鲁克林篮网',
      },
      {
        id: 'trade_2016_10',
        type: 'retire',
        retiredPlayerName: '阿玛雷·斯塔德迈尔',
        fromTeamId: 'nyk',
        fromTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2016_15',
        type: 'single_move',
        playerName: '塞斯·库里',
        fromTeamId: 'sac',
        fromTeamName: '萨克拉门托国王',
        toTeamId: 'dal',
        toTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2016_11',
        type: 'retire',
        retiredPlayerName: '安德烈·米勒',
        fromTeamId: 'phi',
        fromTeamName: '费城76人',
      },
      {
        id: 'trade_2016_12',
        type: 'retire',
        retiredPlayerName: '卡隆·巴特勒',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2016_16',
        type: 'single_move',
        playerName: '斯潘塞·丁威迪',
        fromTeamId: 'det',
        fromTeamName: '底特律活塞',
        toTeamId: 'bkn',
        toTeamName: '布鲁克林篮网',
      },
    ],
  },
  2017: {
    year: 2017,
    seasonName: '2017-2018 赛季',
    trades: [
      {
        id: 'trade_2017_1',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '克里斯·保罗',
            fromTeamId: 'lac',
            fromTeamName: '洛杉矶快船',
            toTeamId: 'hou',
            toTeamName: '休斯顿火箭',
          },
          {
            playerName: '萨姆·德克尔',
            fromTeamId: 'hou',
            fromTeamName: '休斯顿火箭',
            toTeamId: 'lac',
            toTeamName: '洛杉矶快船',
          },
        ],
      },
      {
        id: 'trade_2017_2',
        type: 'single_move',
        playerName: '帕特里克·贝弗利',
        fromTeamId: 'hou',
        fromTeamName: '休斯顿火箭',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2017_3',
        type: 'single_move',
        playerName: '路易斯·威廉姆斯',
        fromTeamId: 'phi',
        fromTeamName: '费城76人',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2017_4',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '凯里·欧文',
            fromTeamId: 'cle',
            fromTeamName: '克利夫兰骑士',
            toTeamId: 'bos',
            toTeamName: '波士顿凯尔特人',
          },
          {
            playerName: '以赛亚·托马斯',
            fromTeamId: 'bos',
            fromTeamName: '波士顿凯尔特人',
            toTeamId: 'cle',
            toTeamName: '克利夫兰骑士',
          },
          {
            playerName: '安特·日日奇',
            fromTeamId: 'bos',
            fromTeamName: '波士顿凯尔特人',
            toTeamId: 'cle',
            toTeamName: '克利夫兰骑士',
          },
        ],
      },
      {
        id: 'trade_2017_5',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '保罗·乔治',
            fromTeamId: 'ind',
            fromTeamName: '印第安纳步行者',
            toTeamId: 'okc',
            toTeamName: '俄克拉荷马雷霆',
          },
          {
            playerName: '维克托·奥拉迪波',
            fromTeamId: 'okc',
            fromTeamName: '俄克拉荷马雷霆',
            toTeamId: 'ind',
            toTeamName: '印第安纳步行者',
          },
          {
            playerName: '多曼塔斯·萨博尼斯',
            fromTeamId: 'okc',
            fromTeamName: '俄克拉荷马雷霆',
            toTeamId: 'ind',
            toTeamName: '印第安纳步行者',
          },
        ],
      },
      {
        id: 'trade_2017_6',
        type: 'single_move',
        playerName: '卡梅隆·安东尼',
        fromTeamId: 'nyk',
        fromTeamName: '纽约尼克斯',
        toTeamId: 'okc',
        toTeamName: '俄克拉荷马雷霆',
      },
      {
        id: 'trade_2017_7',
        type: 'single_move',
        playerName: '埃内斯·坎特',
        fromTeamId: 'uta',
        fromTeamName: '犹他爵士',
        toTeamId: 'nyk',
        toTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2017_8',
        type: 'single_move',
        playerName: '道格·麦克德莫特',
        fromTeamId: 'den',
        fromTeamName: '丹佛掘金',
        toTeamId: 'nyk',
        toTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2017_9',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '吉米·巴特勒',
            fromTeamId: 'chi',
            fromTeamName: '芝加哥公牛',
            toTeamId: 'min',
            toTeamName: '明尼苏达森林狼',
          },
          {
            playerName: '扎克·拉文',
            fromTeamId: 'min',
            fromTeamName: '明尼苏达森林狼',
            toTeamId: 'chi',
            toTeamName: '芝加哥公牛',
          },
          {
            playerName: '柯里斯·邓恩',
            fromTeamId: 'min',
            fromTeamName: '明尼苏达森林狼',
            toTeamId: 'chi',
            toTeamName: '芝加哥公牛',
          },
        ],
      },
      {
        id: 'trade_2017_10',
        type: 'single_move',
        playerName: '戈登·海沃德',
        fromTeamId: 'uta',
        fromTeamName: '犹他爵士',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2017_11',
        type: 'single_move',
        playerName: '保罗·米尔萨普',
        fromTeamId: 'atl',
        fromTeamName: '亚特兰大老鹰',
        toTeamId: 'den',
        toTeamName: '丹佛掘金',
      },
      {
        id: 'trade_2017_12',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '德马库斯·考辛斯',
            fromTeamId: 'sac',
            fromTeamName: '萨克拉门托国王',
            toTeamId: 'noh',
            toTeamName: '新奥尔良鹈鹕',
          },
          {
            playerName: '巴迪·希尔德',
            fromTeamId: 'noh',
            fromTeamName: '新奥尔良鹈鹕',
            toTeamId: 'sac',
            toTeamName: '萨克拉门托国王',
          },
        ],
      },
      {
        id: 'trade_2017_13',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '布鲁克·洛佩斯',
            fromTeamId: 'bkn',
            fromTeamName: '布鲁克林篮网',
            toTeamId: 'lal',
            toTeamName: '洛杉矶湖人',
          },
          {
            playerName: '德安吉洛·拉塞尔',
            fromTeamId: 'lal',
            fromTeamName: '洛杉矶湖人',
            toTeamId: 'bkn',
            toTeamName: '布鲁克林篮网',
          },
        ],
      },
      {
        id: 'trade_2017_14',
        type: 'retire',
        retiredPlayerName: '保罗·皮尔斯',
        fromTeamId: 'bkn',
        fromTeamName: '布鲁克林篮网',
      },
      {
        id: 'trade_2017_15',
        type: 'retire',
        retiredPlayerName: '马努·吉诺比利',
        fromTeamId: 'sas',
        fromTeamName: '圣安东尼奥马刺',
      },
      {
        id: 'trade_2017_16',
        type: 'retire',
        retiredPlayerName: '卡隆·巴特勒',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2017_17',
        type: 'single_move',
        playerName: '德维恩·韦德',
        fromTeamId: 'chi',
        fromTeamName: '芝加哥公牛',
        toTeamId: 'cle',
        toTeamName: '克利夫兰骑士',
      },
      {
        id: 'trade_2017_18',
        type: 'single_move',
        playerName: '塞尔吉·伊巴卡',
        fromTeamId: 'orl',
        fromTeamName: '奥兰多魔术',
        toTeamId: 'tor',
        toTeamName: '多伦多猛龙',
      },
      {
        id: 'trade_2017_19',
        type: 'single_move',
        playerName: '考德威尔-波普',
        fromTeamId: 'det',
        fromTeamName: '底特律活塞',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2017_20',
        type: 'retire',
        retiredPlayerName: '罗恩·阿泰斯特',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
      },
    ],
  },
  2018: {
    year: 2018,
    seasonName: '2018-2019 赛季',
    trades: [
      {
        id: 'trade_2018_1',
        type: 'single_move',
        playerName: '勒布朗·詹姆斯',
        fromTeamId: 'cle',
        fromTeamName: '克利夫兰骑士',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2018_2',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '科怀·伦纳德',
            fromTeamId: 'sas',
            fromTeamName: '圣安东尼奥马刺',
            toTeamId: 'tor',
            toTeamName: '多伦多猛龙',
          },
          {
            playerName: '德玛尔·德罗赞',
            fromTeamId: 'tor',
            fromTeamName: '多伦多猛龙',
            toTeamId: 'sas',
            toTeamName: '圣安东尼奥马刺',
          },
          {
            playerName: '雅各布·珀尔特尔',
            fromTeamId: 'tor',
            fromTeamName: '多伦多猛龙',
            toTeamId: 'sas',
            toTeamName: '圣安东尼奥马刺',
          },
          {
            playerName: '丹尼·格林',
            fromTeamId: 'sas',
            fromTeamName: '圣安东尼奥马刺',
            toTeamId: 'tor',
            toTeamName: '多伦多猛龙',
          },
        ],
      },
      {
        id: 'trade_2018_3',
        type: 'single_move',
        playerName: '布莱克·格里芬',
        fromTeamId: 'lac',
        fromTeamName: '洛杉矶快船',
        toTeamId: 'det',
        toTeamName: '底特律活塞',
      },
      {
        id: 'trade_2018_4',
        type: 'single_move',
        playerName: '埃弗里·布拉德利',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2018_5',
        type: 'single_move',
        playerName: '托比亚斯·哈里斯',
        fromTeamId: 'mil',
        fromTeamName: '密尔沃基雄鹿',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2018_6',
        type: 'single_move',
        playerName: '德马库斯·考辛斯',
        targetOvr: 89,
        fromTeamId: 'noh',
        fromTeamName: '新奥尔良鹈鹕',
        toTeamId: 'gsw',
        toTeamName: '金州勇士',
      },
      {
        id: 'trade_2018_7',
        type: 'single_move',
        playerName: '朱利叶斯·兰德尔',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'noh',
        toTeamName: '新奥尔良鹈鹕',
      },
      {
        id: 'trade_2018_8',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '吉米·巴特勒',
            fromTeamId: 'min',
            fromTeamName: '明尼苏达森林狼',
            toTeamId: 'phi',
            toTeamName: '费城76人',
          },
          {
            playerName: '达里奥·沙里奇',
            fromTeamId: 'phi',
            fromTeamName: '费城76人',
            toTeamId: 'min',
            toTeamName: '明尼苏达森林狼',
          },
        ],
      },
      {
        id: 'trade_2018_9',
        type: 'retire',
        retiredPlayerName: '贾马尔·克劳福德',
        fromTeamId: 'min',
        fromTeamName: '明尼苏达森林狼',
      },
      {
        id: 'trade_2018_10',
        type: 'retire',
        retiredPlayerName: '大卫·韦斯特',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
      },
      {
        id: 'trade_2018_11',
        type: 'single_move',
        playerName: '德维恩·韦德',
        fromTeamId: 'cle',
        fromTeamName: '克利夫兰骑士',
        toTeamId: 'mia',
        toTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2018_12',
        type: 'single_move',
        playerName: '塞斯·库里',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
        toTeamId: 'por',
        toTeamName: '波特兰开拓者',
      },
      {
        id: 'trade_2018_13',
        type: 'single_move',
        playerName: '拉简·隆多',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
    ],
  },
  2019: {
    year: 2019,
    seasonName: '2019-2020 赛季',
    trades: [
      {
        id: 'trade_2019_1',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '安东尼·戴维斯',
            fromTeamId: 'noh',
            fromTeamName: '新奥尔良鹈鹕',
            toTeamId: 'lal',
            toTeamName: '洛杉矶湖人',
          },
          {
            playerName: '朗佐·鲍尔',
            fromTeamId: 'lal',
            fromTeamName: '洛杉矶湖人',
            toTeamId: 'noh',
            toTeamName: '新奥尔良鹈鹕',
          },
          {
            playerName: '布兰登·英格拉姆',
            fromTeamId: 'lal',
            fromTeamName: '洛杉矶湖人',
            toTeamId: 'noh',
            toTeamName: '新奥尔良鹈鹕',
          },
          {
            playerName: '乔什·哈特',
            fromTeamId: 'lal',
            fromTeamName: '洛杉矶湖人',
            toTeamId: 'noh',
            toTeamName: '新奥尔良鹈鹕',
          },
        ],
      },
      {
        id: 'trade_2019_2',
        type: 'single_move',
        playerName: '保罗·乔治',
        fromTeamId: 'okc',
        fromTeamName: '俄克拉荷马雷霆',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2019_3',
        type: 'single_move',
        playerName: '达尼洛·加里纳利',
        fromTeamId: 'nyk',
        fromTeamName: '纽约尼克斯',
        toTeamId: 'okc',
        toTeamName: '俄克拉荷马雷霆',
      },
      {
        id: 'trade_2019_4',
        type: 'single_move',
        playerName: '科怀·伦纳德',
        fromTeamId: 'tor',
        fromTeamName: '多伦多猛龙',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2019_5',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '凯文·杜兰特',
            fromTeamId: 'gsw',
            fromTeamName: '金州勇士',
            toTeamId: 'bkn',
            toTeamName: '布鲁克林篮网',
          },
          {
            playerName: '德安吉洛·拉塞尔',
            fromTeamId: 'bkn',
            fromTeamName: '布鲁克林篮网',
            toTeamId: 'gsw',
            toTeamName: '金州勇士',
          },
        ],
      },
      {
        id: 'trade_2019_6',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '拉塞尔·威斯布鲁克',
            fromTeamId: 'okc',
            fromTeamName: '俄克拉荷马雷霆',
            toTeamId: 'hou',
            toTeamName: '休斯顿火箭',
          },
          {
            playerName: '克里斯·保罗',
            fromTeamId: 'hou',
            fromTeamName: '休斯顿火箭',
            toTeamId: 'okc',
            toTeamName: '俄克拉荷马雷霆',
          },
        ],
      },
      {
        id: 'trade_2019_7',
        type: 'single_move',
        playerName: '凯里·欧文',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'bkn',
        toTeamName: '布鲁克林篮网',
      },
      {
        id: 'trade_2019_8',
        type: 'single_move',
        playerName: '吉米·巴特勒',
        fromTeamId: 'phi',
        fromTeamName: '费城76人',
        toTeamId: 'mia',
        toTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2019_9',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '肯巴·沃克',
            fromTeamId: 'cha',
            fromTeamName: '夏洛特黄蜂',
            toTeamId: 'bos',
            toTeamName: '波士顿凯尔特人',
          },
          {
            playerName: '泰瑞·罗齐尔',
            fromTeamId: 'bos',
            fromTeamName: '波士顿凯尔特人',
            toTeamId: 'cha',
            toTeamName: '夏洛特黄蜂',
          },
        ],
      },
      {
        id: 'trade_2019_10',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '克里斯塔普斯·波尔津吉斯',
            fromTeamId: 'nyk',
            fromTeamName: '纽约尼克斯',
            toTeamId: 'dal',
            toTeamName: '达拉斯独行侠',
          },
          {
            playerName: '丹尼斯·史密斯',
            fromTeamId: 'dal',
            fromTeamName: '达拉斯独行侠',
            toTeamId: 'nyk',
            toTeamName: '纽约尼克斯',
          },
        ],
      },
      {
        id: 'trade_2019_11',
        type: 'single_move',
        playerName: '德安德烈·乔丹',
        fromTeamId: 'lac',
        fromTeamName: '洛杉矶快船',
        toTeamId: 'nyk',
        toTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2019_12',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '迈克·康利',
            fromTeamId: 'mem',
            fromTeamName: '孟菲斯灰熊',
            toTeamId: 'uta',
            toTeamName: '犹他爵士',
          },
          {
            playerName: '凯尔·科沃尔',
            fromTeamId: 'uta',
            fromTeamName: '犹他爵士',
            toTeamId: 'mem',
            toTeamName: '孟菲斯灰熊',
          },
          {
            playerName: '格雷森·阿伦',
            fromTeamId: 'uta',
            fromTeamName: '犹他爵士',
            toTeamId: 'mem',
            toTeamName: '孟菲斯灰熊',
          },
        ],
      },
      {
        id: 'trade_2019_13',
        type: 'single_move',
        playerName: '艾尔·霍福德',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'phi',
        toTeamName: '费城76人',
      },
      {
        id: 'trade_2019_14',
        type: 'single_move',
        playerName: '马尔科姆·布罗格登',
        fromTeamId: 'mil',
        fromTeamName: '密尔沃基雄鹿',
        toTeamId: 'ind',
        toTeamName: '印第安纳步行者',
      },
      {
        id: 'trade_2019_15',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '马克·加索尔',
            fromTeamId: 'mem',
            fromTeamName: '孟菲斯灰熊',
            toTeamId: 'tor',
            toTeamName: '多伦多猛龙',
          },
          {
            playerName: '约纳斯·瓦兰丘纳斯',
            fromTeamId: 'tor',
            fromTeamName: '多伦多猛龙',
            toTeamId: 'mem',
            toTeamName: '孟菲斯灰熊',
          },
          {
            playerName: '德隆·赖特',
            fromTeamId: 'tor',
            fromTeamName: '多伦多猛龙',
            toTeamId: 'mem',
            toTeamName: '孟菲斯灰熊',
          },
        ],
      },
      {
        id: 'trade_2019_16',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '托比亚斯·哈里斯',
            fromTeamId: 'lac',
            fromTeamName: '洛杉矶快船',
            toTeamId: 'phi',
            toTeamName: '费城76人',
          },
          {
            playerName: '兰德里·沙梅特',
            fromTeamId: 'phi',
            fromTeamName: '费城76人',
            toTeamId: 'lac',
            toTeamName: '洛杉矶快船',
          },
        ],
      },
      {
        id: 'trade_2019_17',
        type: 'single_move',
        playerName: '德怀特·霍华德',
        fromTeamId: 'hou',
        fromTeamName: '休斯顿火箭',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2019_18',
        type: 'retire',
        retiredPlayerName: '托尼·帕克',
        fromTeamId: 'cha',
        fromTeamName: '夏洛特黄蜂',
      },
      {
        id: 'trade_2019_19',
        type: 'retire',
        retiredPlayerName: '德维恩·韦德',
        fromTeamId: 'mia',
        fromTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2019_20',
        type: 'retire',
        retiredPlayerName: '克里斯·波什',
        fromTeamId: 'mia',
        fromTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2019_21',
        type: 'retire',
        retiredPlayerName: '德克·诺维茨基',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2019_22',
        type: 'single_move',
        playerName: '丹尼·格林',
        fromTeamId: 'tor',
        fromTeamName: '多伦多猛龙',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2019_23',
        type: 'single_move',
        playerName: '塞斯·库里',
        fromTeamId: 'por',
        fromTeamName: '波特兰开拓者',
        toTeamId: 'dal',
        toTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2019_24',
        type: 'single_move',
        playerName: '安德烈·德拉蒙德',
        fromTeamId: 'det',
        fromTeamName: '底特律活塞',
        toTeamId: 'cle',
        toTeamName: '克利夫兰骑士',
      },
      {
        id: 'trade_2019_25',
        type: 'single_move',
        playerName: '德马库斯·考辛斯',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
    ],
  },
  2020: {
    year: 2020,
    seasonName: '2020-2021 赛季',
    trades: [
      {
        id: 'trade_2020_1',
        type: 'swap',
        playerAName: '克里斯·保罗',
        teamAId: 'okc',
        teamAName: '俄克拉荷马雷霆',
        playerBName: '泰·杰罗姆',
        teamBId: 'phx',
        teamBName: '菲尼克斯太阳',
      },
      {
        id: 'trade_2020_2',
        type: 'single_move',
        playerName: '凯利·乌布雷',
        fromTeamId: 'was',
        fromTeamName: '华盛顿奇才',
        toTeamId: 'okc',
        toTeamName: '俄克拉荷马雷霆',
      },
      {
        id: 'trade_2020_3',
        type: 'swap',
        playerAName: '拉塞尔·威斯布鲁克',
        teamAId: 'hou',
        teamAName: '休斯顿火箭',
        playerBName: '约翰·沃尔',
        teamBId: 'was',
        teamBName: '华盛顿奇才',
      },
      {
        id: 'trade_2020_4',
        type: 'single_move',
        playerName: '朱·霍勒迪',
        fromTeamId: 'nop',
        fromTeamName: '新奥尔良鹈鹕',
        toTeamId: 'mil',
        toTeamName: '密尔沃基雄鹿',
      },
      {
        id: 'trade_2020_5',
        type: 'single_move',
        playerName: '埃里克·布莱索',
        fromTeamId: 'phx',
        fromTeamName: '菲尼克斯太阳',
        toTeamId: 'nop',
        toTeamName: '新奥尔良鹈鹕',
      },
      {
        id: 'trade_2020_6',
        type: 'single_move',
        playerName: '乔治·希尔',
        fromTeamId: 'sas',
        fromTeamName: '圣安东尼奥马刺',
        toTeamId: 'nop',
        toTeamName: '新奥尔良鹈鹕',
      },
      {
        id: 'trade_2020_7',
        type: 'single_move',
        playerName: '戈登·海沃德',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'cha',
        toTeamName: '夏洛特黄蜂',
      },
      {
        id: 'trade_2020_8',
        type: 'single_move',
        playerName: '塞尔吉·伊巴卡',
        fromTeamId: 'tor',
        fromTeamName: '多伦多猛龙',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2020_9',
        type: 'single_move',
        playerName: '马克·加索尔',
        fromTeamId: 'tor',
        fromTeamName: '多伦多猛龙',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2020_10',
        type: 'swap',
        playerAName: '丹尼斯·施罗德',
        teamAId: 'atl',
        teamAName: '亚特兰大老鹰',
        playerBName: '丹尼·格林',
        teamBId: 'lal',
        teamBName: '洛杉矶湖人',
      },
      {
        id: 'trade_2020_11',
        type: 'single_move',
        playerName: '鲍格丹·博格达诺维奇',
        fromTeamId: 'sac',
        fromTeamName: '萨克拉门托国王',
        toTeamId: 'atl',
        toTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2020_12',
        type: 'single_move',
        playerName: '德怀特·霍华德',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'phi',
        toTeamName: '费城76人',
      },
      {
        id: 'trade_2020_13',
        type: 'single_move',
        playerName: '拉简·隆多',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'atl',
        toTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2020_14',
        type: 'single_move',
        playerName: '特里斯坦·汤普森',
        fromTeamId: 'cle',
        fromTeamName: '克利夫兰骑士',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2020_15',
        type: 'single_move',
        playerName: '塞斯·库里',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
        toTeamId: 'phi',
        toTeamName: '费城76人',
      },
      {
        id: 'trade_2020_16',
        type: 'single_move',
        playerName: '维克托·奥拉迪波',
        fromTeamId: 'ind',
        fromTeamName: '印第安纳步行者',
        toTeamId: 'hou',
        toTeamName: '休斯顿火箭',
      },
      {
        id: 'trade_2020_17',
        type: 'single_move',
        playerName: '安德烈·德拉蒙德',
        fromTeamId: 'cle',
        fromTeamName: '克利夫兰骑士',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2020_18',
        type: 'single_move',
        playerName: '德马库斯·考辛斯',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'hou',
        toTeamName: '休斯顿火箭',
      },
    ],
  },
  2021: {
    year: 2021,
    seasonName: '2021-2022 赛季',
    trades: [
      {
        id: 'trade_2021_1',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '詹姆斯·哈登',
            fromTeamId: 'hou',
            fromTeamName: '休斯顿火箭',
            toTeamId: 'bkn',
            toTeamName: '布鲁克林篮网',
          },
          {
            playerName: '维克托·奥拉迪波',
            fromTeamId: 'ind',
            fromTeamName: '印第安纳步行者',
            toTeamId: 'hou',
            toTeamName: '休斯顿火箭',
          },
        ],
      },
      {
        id: 'trade_2021_2',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '拉塞尔·威斯布鲁克',
            fromTeamId: 'was',
            fromTeamName: '华盛顿奇才',
            toTeamId: 'lal',
            toTeamName: '洛杉矶湖人',
          },
          {
            playerName: '凯尔·库兹马',
            fromTeamId: 'lal',
            fromTeamName: '洛杉矶湖人',
            toTeamId: 'was',
            toTeamName: '华盛顿奇才',
          },
          {
            playerName: '考德威尔-波普',
            fromTeamId: 'lal',
            fromTeamName: '洛杉矶湖人',
            toTeamId: 'was',
            toTeamName: '华盛顿奇才',
          },
        ],
      },
      {
        id: 'trade_2021_3',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '凯尔·洛瑞',
            fromTeamId: 'tor',
            fromTeamName: '多伦多猛龙',
            toTeamId: 'mia',
            toTeamName: '迈阿密热火',
          },
          {
            playerName: '戈兰·德拉季奇',
            fromTeamId: 'mia',
            fromTeamName: '迈阿密热火',
            toTeamId: 'tor',
            toTeamName: '多伦多猛龙',
          },
          {
            playerName: '阿奇乌瓦',
            fromTeamId: 'mia',
            fromTeamName: '迈阿密热火',
            toTeamId: 'tor',
            toTeamName: '多伦多猛龙',
          },
        ],
      },
      {
        id: 'trade_2021_4',
        type: 'single_move',
        playerName: '德玛尔·德罗赞',
        fromTeamId: 'sas',
        fromTeamName: '圣安东尼奥马刺',
        toTeamId: 'chi',
        toTeamName: '芝加哥公牛',
      },
      {
        id: 'trade_2021_5',
        type: 'single_move',
        playerName: '赛迪斯·杨',
        fromTeamId: 'phi',
        fromTeamName: '费城76人',
        toTeamId: 'sas',
        toTeamName: '圣安东尼奥马刺',
      },
      {
        id: 'trade_2021_6',
        type: 'single_move',
        playerName: '艾尔-法鲁克·阿米努',
        fromTeamId: 'lac',
        fromTeamName: '洛杉矶快船',
        toTeamId: 'sas',
        toTeamName: '圣安东尼奥马刺',
      },
      {
        id: 'trade_2021_7',
        type: 'single_move',
        playerName: '朗佐·鲍尔',
        fromTeamId: 'nop',
        fromTeamName: '新奥尔良鹈鹕',
        toTeamId: 'chi',
        toTeamName: '芝加哥公牛',
      },
      {
        id: 'trade_2021_8',
        type: 'single_move',
        playerName: '克里斯塔普斯·波尔津吉斯',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
        toTeamId: 'was',
        toTeamName: '华盛顿奇才',
      },
      {
        id: 'trade_2021_9',
        type: 'single_move',
        playerName: '戴维斯·贝尔坦斯',
        fromTeamId: 'sas',
        fromTeamName: '圣安东尼奥马刺',
        toTeamId: 'dal',
        toTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2021_10',
        type: 'swap',
        playerAName: '尼古拉·武切维奇',
        teamAId: 'orl',
        teamAName: '奥兰多魔术',
        playerBName: '温德尔·卡特',
        teamBId: 'chi',
        teamBName: '芝加哥公牛',
      },
      {
        id: 'trade_2021_11',
        type: 'single_move',
        playerName: '奥托·波特',
        fromTeamId: 'was',
        fromTeamName: '华盛顿奇才',
        toTeamId: 'orl',
        toTeamName: '奥兰多魔术',
      },
      {
        id: 'trade_2021_12',
        type: 'swap',
        playerAName: '阿隆·戈登',
        teamAId: 'orl',
        teamAName: '奥兰多魔术',
        playerBName: '加里·哈里斯',
        teamBId: 'den',
        teamBName: '丹佛掘金',
      },
      {
        id: 'trade_2021_13',
        type: 'single_move',
        playerName: '肯巴·沃克',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'okc',
        toTeamName: '俄克拉荷马雷霆',
      },
      {
        id: 'trade_2021_14',
        type: 'single_move',
        playerName: '艾尔·霍福德',
        fromTeamId: 'phi',
        fromTeamName: '费城76人',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2021_15',
        type: 'single_move',
        playerName: '劳里·马尔卡宁',
        fromTeamId: 'chi',
        fromTeamName: '芝加哥公牛',
        toTeamId: 'cle',
        toTeamName: '克利夫兰骑士',
      },
      {
        id: 'trade_2021_16',
        type: 'single_move',
        playerName: '小拉里·南斯',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'por',
        toTeamName: '波特兰开拓者',
      },
      {
        id: 'trade_2021_17',
        type: 'retire',
        retiredPlayerName: '保罗·加索尔',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2021_18',
        type: 'retire',
        retiredPlayerName: 'J.J. 雷迪克',
        fromTeamId: 'nop',
        fromTeamName: '新奥尔良鹈鹕',
      },
      {
        id: 'trade_2021_19',
        type: 'retire',
        retiredPlayerName: 'J.R. 史密斯',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2021_20',
        type: 'retire',
        retiredPlayerName: '泰森·钱德勒',
        fromTeamId: 'hou',
        fromTeamName: '休斯顿火箭',
      },
      {
        id: 'trade_2021_21',
        type: 'retire',
        retiredPlayerName: '凯尔·科沃尔',
        fromTeamId: 'mil',
        fromTeamName: '密尔沃基雄鹿',
      },
      {
        id: 'trade_2021_22',
        type: 'single_move',
        playerName: '安德烈·德拉蒙德',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'phi',
        toTeamName: '费城76人',
      },
      {
        id: 'trade_2021_23',
        type: 'single_move',
        playerName: '德马库斯·考辛斯',
        fromTeamId: 'hou',
        fromTeamName: '休斯顿火箭',
        toTeamId: 'den',
        toTeamName: '丹佛掘金',
      },
      {
        id: 'trade_2021_24',
        type: 'single_move',
        playerName: '斯潘塞·丁威迪',
        fromTeamId: 'bkn',
        fromTeamName: '布鲁克林篮网',
        toTeamId: 'dal',
        toTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2021_25',
        type: 'single_move',
        playerName: '亚历克斯·卡鲁索',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'chi',
        toTeamName: '芝加哥公牛',
      },
    ],
  },
  2022: {
    year: 2022,
    seasonName: '2022-2023 赛季',
    trades: [
      {
        id: 'trade_2022_1',
        type: 'swap',
        playerAName: '鲁迪·戈贝尔',
        teamAId: 'uta',
        teamAName: '犹他爵士',
        playerBName: '沃克·凯斯勒',
        teamBId: 'min',
        teamBName: '明尼苏达森林狼',
      },
      {
        id: 'trade_2022_2',
        type: 'single_move',
        playerName: '马利克·比斯利',
        fromTeamId: 'den',
        fromTeamName: '丹佛掘金',
        toTeamId: 'uta',
        toTeamName: '犹他爵士',
      },
      {
        id: 'trade_2022_3',
        type: 'single_move',
        playerName: '帕特里克·贝弗利',
        fromTeamId: 'lac',
        fromTeamName: '洛杉矶快船',
        toTeamId: 'uta',
        toTeamName: '犹他爵士',
      },
      {
        id: 'trade_2022_4',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '多诺万·米切尔',
            fromTeamId: 'uta',
            fromTeamName: '犹他爵士',
            toTeamId: 'cle',
            toTeamName: '克利夫兰骑士',
          },
          {
            playerName: '劳里·马尔卡宁',
            fromTeamId: 'cle',
            fromTeamName: '克利夫兰骑士',
            toTeamId: 'uta',
            toTeamName: '犹他爵士',
          },
          {
            playerName: '柯林·塞克斯顿',
            fromTeamId: 'cle',
            fromTeamName: '克利夫兰骑士',
            toTeamId: 'uta',
            toTeamName: '犹他爵士',
          },
          {
            playerName: '奥查伊·阿格巴吉',
            fromTeamId: 'cle',
            fromTeamName: '克利夫兰骑士',
            toTeamId: 'uta',
            toTeamName: '犹他爵士',
          },
        ],
      },
      {
        id: 'trade_2022_5',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '詹姆斯·哈登',
            fromTeamId: 'bkn',
            fromTeamName: '布鲁克林篮网',
            toTeamId: 'phi',
            toTeamName: '费城76人',
          },
          {
            playerName: '本·西蒙斯',
            fromTeamId: 'phi',
            fromTeamName: '费城76人',
            toTeamId: 'bkn',
            toTeamName: '布鲁克林篮网',
          },
          {
            playerName: '塞斯·库里',
            fromTeamId: 'phi',
            fromTeamName: '费城76人',
            toTeamId: 'bkn',
            toTeamName: '布鲁克林篮网',
          },
          {
            playerName: '安德烈·德拉蒙德',
            fromTeamId: 'phi',
            fromTeamName: '费城76人',
            toTeamId: 'bkn',
            toTeamName: '布鲁克林篮网',
          },
        ],
      },
      {
        id: 'trade_2022_6',
        type: 'swap',
        playerAName: '哈利伯顿',
        teamAId: 'sac',
        teamAName: '萨克拉门托国王',
        playerBName: '多曼塔斯·萨博尼斯',
        teamBId: 'ind',
        teamBName: '印第安纳步行者',
      },
      {
        id: 'trade_2022_7',
        type: 'single_move',
        playerName: '德章泰·默里',
        fromTeamId: 'sas',
        fromTeamName: '圣安东尼奥马刺',
        toTeamId: 'atl',
        toTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2022_8',
        type: 'single_move',
        playerName: '达尼洛·加里纳利',
        fromTeamId: 'okc',
        fromTeamName: '俄克拉荷马雷霆',
        toTeamId: 'sas',
        toTeamName: '圣安东尼奥马刺',
      },
      {
        id: 'trade_2022_9',
        type: 'single_move',
        playerName: '杰伦·布伦森',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
        toTeamId: 'nyk',
        toTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2022_10',
        type: 'single_move',
        playerName: '马尔科姆·布罗格登',
        fromTeamId: 'ind',
        fromTeamName: '印第安纳步行者',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2022_11',
        type: 'single_move',
        playerName: '约翰·沃尔',
        fromTeamId: 'hou',
        fromTeamName: '休斯顿火箭',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2022_12',
        type: 'retire',
        retiredPlayerName: '贾马尔·克劳福德',
        fromTeamId: 'bkn',
        fromTeamName: '布鲁克林篮网',
      },
      {
        id: 'trade_2022_13',
        type: 'retire',
        retiredPlayerName: 'J.J. 巴里亚',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2022_14',
        type: 'single_move',
        playerName: '考德威尔-波普',
        fromTeamId: 'was',
        fromTeamName: '华盛顿奇才',
        toTeamId: 'den',
        toTeamName: '丹佛掘金',
      },
    ],
  },
  2023: {
    year: 2023,
    seasonName: '2023-2024 赛季',
    trades: [
      {
        id: 'trade_2023_1',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '凯文·杜兰特',
            fromTeamId: 'bkn',
            fromTeamName: '布鲁克林篮网',
            toTeamId: 'phx',
            toTeamName: '菲尼克斯太阳',
          },
          {
            playerName: '密卡尔·布里奇斯',
            fromTeamId: 'phx',
            fromTeamName: '菲尼克斯太阳',
            toTeamId: 'bkn',
            toTeamName: '布鲁克林篮网',
          },
          {
            playerName: '卡梅隆·约翰逊',
            fromTeamId: 'phx',
            fromTeamName: '菲尼克斯太阳',
            toTeamId: 'bkn',
            toTeamName: '布鲁克林篮网',
          },
        ],
      },
      {
        id: 'trade_2023_2',
        type: 'swap',
        playerAName: '凯里·欧文',
        teamAId: 'bkn',
        teamAName: '布鲁克林篮网',
        playerBName: '斯潘塞·丁威迪',
        teamBId: 'dal',
        teamBName: '达拉斯独行侠',
      },
      {
        id: 'trade_2023_3',
        type: 'single_move',
        playerName: '达米安·利拉德',
        fromTeamId: 'por',
        fromTeamName: '波特兰开拓者',
        toTeamId: 'mil',
        toTeamName: '密尔沃基雄鹿',
      },
      {
        id: 'trade_2023_4',
        type: 'single_move',
        playerName: '朱·霍勒迪',
        fromTeamId: 'mil',
        fromTeamName: '密尔沃基雄鹿',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2023_5',
        type: 'single_move',
        playerName: '马尔科姆·布罗格登',
        fromTeamId: 'ind',
        fromTeamName: '印第安纳步行者',
        toTeamId: 'por',
        toTeamName: '波特兰开拓者',
      },
      {
        id: 'trade_2023_6',
        type: 'single_move',
        playerName: '罗伯特·威廉姆斯',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'por',
        toTeamName: '波特兰开拓者',
      },
      {
        id: 'trade_2023_7',
        type: 'single_move',
        playerName: '克里斯塔普斯·波尔津吉斯',
        fromTeamId: 'was',
        fromTeamName: '华盛顿奇才',
        toTeamId: 'bos',
        toTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2023_8',
        type: 'single_move',
        playerName: '马库斯·斯玛特',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'mem',
        toTeamName: '孟菲斯灰熊',
      },
      {
        id: 'trade_2023_9',
        type: 'single_move',
        playerName: '詹姆斯·哈登',
        fromTeamId: 'phi',
        fromTeamName: '费城76人',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2023_10',
        type: 'single_move',
        playerName: '尼古拉·巴图姆',
        fromTeamId: 'cha',
        fromTeamName: '夏洛特黄蜂',
        toTeamId: 'phi',
        toTeamName: '费城76人',
      },
      {
        id: 'trade_2023_11_a',
        type: 'single_move',
        playerName: '克里斯·保罗',
        fromTeamId: 'phx',
        fromTeamName: '菲尼克斯太阳',
        toTeamId: 'gsw',
        toTeamName: '金州勇士',
      },
      {
        id: 'trade_2023_11_b',
        type: 'single_move',
        playerName: '乔丹·普尔',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
        toTeamId: 'was',
        toTeamName: '华盛顿奇才',
      },
      {
        id: 'trade_2023_12',
        type: 'single_move',
        playerName: '布拉德利·比尔',
        fromTeamId: 'was',
        fromTeamName: '华盛顿奇才',
        toTeamId: 'phx',
        toTeamName: '菲尼克斯太阳',
      },
      {
        id: 'trade_2023_13',
        type: 'single_move',
        playerName: '弗雷德·范弗利特',
        fromTeamId: 'tor',
        fromTeamName: '多伦多猛龙',
        toTeamId: 'hou',
        toTeamName: '休斯顿火箭',
      },
      {
        id: 'trade_2023_14',
        type: 'single_move',
        playerName: '约翰·科林斯',
        fromTeamId: 'atl',
        fromTeamName: '亚特兰大老鹰',
        toTeamId: 'uta',
        toTeamName: '犹他爵士',
      },
      {
        id: 'trade_2023_15',
        type: 'single_move',
        playerName: '鲁迪·盖伊',
        fromTeamId: 'sac',
        fromTeamName: '萨克拉门托国王',
        toTeamId: 'atl',
        toTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2023_16',
        type: 'retire',
        retiredPlayerName: '卡梅隆·安东尼',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2023_17',
        type: 'retire',
        retiredPlayerName: '尤多尼斯·哈斯勒姆',
        fromTeamId: 'mia',
        fromTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2023_18',
        type: 'retire',
        retiredPlayerName: '安德烈·伊戈达拉',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
      },
      {
        id: 'trade_2023_19',
        type: 'retire',
        retiredPlayerName: '戈兰·德拉季奇',
        fromTeamId: 'chi',
        fromTeamName: '芝加哥公牛',
      },
      {
        id: 'trade_2023_20',
        type: 'single_move',
        playerName: '凯文·乐福',
        fromTeamId: 'cle',
        fromTeamName: '克利夫兰骑士',
        toTeamId: 'mia',
        toTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2023_21',
        type: 'single_move',
        playerName: '八村垒',
        fromTeamId: 'was',
        fromTeamName: '华盛顿奇才',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2023_22',
        type: 'single_move',
        playerName: '丹尼斯·施罗德',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'tor',
        toTeamName: '多伦多猛龙',
      },
      {
        id: 'trade_2023_23',
        type: 'single_move',
        playerName: '拉塞尔·威斯布鲁克',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
    ],
  },
  2024: {
    year: 2024,
    seasonName: '2024-2025 赛季',
    trades: [
      {
        id: 'trade_2024_1',
        type: 'single_move',
        playerName: '保罗·乔治',
        fromTeamId: 'lac',
        fromTeamName: '洛杉矶快船',
        toTeamId: 'phi',
        toTeamName: '费城76人',
      },
      {
        id: 'trade_2024_2',
        type: 'single_move',
        playerName: '卡尔-安东尼·唐斯',
        fromTeamId: 'min',
        fromTeamName: '明尼苏达森林狼',
        toTeamId: 'nyk',
        toTeamName: '纽约尼克斯',
      },
      {
        id: 'trade_2024_3',
        type: 'single_move',
        playerName: '朱利叶斯·兰德尔',
        fromTeamId: 'nop',
        fromTeamName: '新奥尔良鹈鹕',
        toTeamId: 'min',
        toTeamName: '明尼苏达森林狼',
      },
      {
        id: 'trade_2024_4',
        type: 'single_move',
        playerName: '迪温琴佐',
        fromTeamId: 'mil',
        fromTeamName: '密尔沃基雄鹿',
        toTeamId: 'min',
        toTeamName: '明尼苏达森林狼',
      },
      {
        id: 'trade_2024_5',
        type: 'single_move',
        playerName: '克莱·汤普森',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
        toTeamId: 'dal',
        toTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2024_6',
        type: 'single_move',
        playerName: '德玛尔·德罗赞',
        fromTeamId: 'chi',
        fromTeamName: '芝加哥公牛',
        toTeamId: 'sac',
        toTeamName: '萨克拉门托国王',
      },
      {
        id: 'trade_2024_7',
        type: 'single_move',
        playerName: '克里斯·杜阿尔特',
        fromTeamId: 'ind',
        fromTeamName: '印第安纳步行者',
        toTeamId: 'chi',
        toTeamName: '芝加哥公牛',
      },
      {
        id: 'trade_2024_8',
        type: 'single_move',
        playerName: '帕斯卡尔·西亚卡姆',
        fromTeamId: 'tor',
        fromTeamName: '多伦多猛龙',
        toTeamId: 'ind',
        toTeamName: '印第安纳步行者',
      },
      {
        id: 'trade_2024_9',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: 'OG·阿奴诺比',
            fromTeamId: 'tor',
            fromTeamName: '多伦多猛龙',
            toTeamId: 'nyk',
            toTeamName: '纽约尼克斯',
          },
          {
            playerName: 'RJ·巴雷特',
            fromTeamId: 'nyk',
            fromTeamName: '纽约尼克斯',
            toTeamId: 'tor',
            toTeamName: '多伦多猛龙',
          },
          {
            playerName: '奎克利',
            fromTeamId: 'nyk',
            fromTeamName: '纽约尼克斯',
            toTeamId: 'tor',
            toTeamName: '多伦多猛龙',
          },
        ],
      },
      {
        id: 'trade_2024_10',
        type: 'swap',
        playerAName: '德章泰·默里',
        teamAId: 'atl',
        teamAName: '亚特兰大老鹰',
        playerBName: '戴森·丹尼尔斯',
        teamBId: 'nop',
        teamBName: '新奥尔良鹈鹕',
      },
      {
        id: 'trade_2024_11',
        type: 'single_move',
        playerName: '小拉里·南斯',
        fromTeamId: 'por',
        fromTeamName: '波特兰开拓者',
        toTeamId: 'atl',
        toTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2024_12',
        type: 'single_move',
        playerName: '科迪·泽勒',
        fromTeamId: 'cha',
        fromTeamName: '夏洛特黄蜂',
        toTeamId: 'atl',
        toTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2024_13',
        type: 'swap',
        playerAName: '亚历克斯·卡鲁索',
        teamAId: 'chi',
        teamAName: '芝加哥公牛',
        playerBName: '约什·吉迪',
        teamBId: 'okc',
        teamBName: '俄克拉荷马雷霆',
      },
      {
        id: 'trade_2024_14',
        type: 'single_move',
        playerName: '克里斯·保罗',
        fromTeamId: 'gsw',
        fromTeamName: '金州勇士',
        toTeamId: 'sas',
        toTeamName: '圣安东尼奥马刺',
      },
      {
        id: 'trade_2024_15',
        type: 'single_move',
        playerName: '考德威尔-波普',
        fromTeamId: 'den',
        fromTeamName: '丹佛掘金',
        toTeamId: 'orl',
        toTeamName: '奥兰多魔术',
      },
      {
        id: 'trade_2024_16',
        type: 'retire',
        retiredPlayerName: '德里克·罗斯',
        fromTeamId: 'mem',
        fromTeamName: '孟菲斯灰熊',
      },
      {
        id: 'trade_2024_17',
        type: 'retire',
        retiredPlayerName: '布莱克·格里芬',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
      },
      {
        id: 'trade_2024_18',
        type: 'retire',
        retiredPlayerName: '戈登·海沃德',
        fromTeamId: 'okc',
        fromTeamName: '俄克拉荷马雷霆',
      },
      {
        id: 'trade_2024_19',
        type: 'retire',
        retiredPlayerName: '肯巴·沃克',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
      },
      {
        id: 'trade_2024_20',
        type: 'retire',
        retiredPlayerName: '丹尼·格林',
        fromTeamId: 'phi',
        fromTeamName: '费城76人',
      },
      {
        id: 'trade_2024_21',
        type: 'retire',
        retiredPlayerName: '鲁迪·盖伊',
        fromTeamId: 'atl',
        fromTeamName: '亚特兰大老鹰',
      },
      {
        id: 'trade_2024_22',
        type: 'single_move',
        playerName: '拉塞尔·威斯布鲁克',
        fromTeamId: 'lac',
        fromTeamName: '洛杉矶快船',
        toTeamId: 'den',
        toTeamName: '丹佛掘金',
      },
    ],
  },
  2025: {
    year: 2025,
    seasonName: '2025-2026 赛季',
    trades: [
      {
        id: 'trade_2025_1',
        type: 'swap',
        playerAName: '凯文·杜兰特',
        teamAId: 'phx',
        teamAName: '菲尼克斯太阳',
        playerBName: '杰伦·格林',
        teamBId: 'hou',
        teamBName: '休斯顿火箭',
      },
      {
        id: 'trade_2025_2',
        type: 'single_move',
        playerName: '卡曼·马鲁阿奇',
        fromTeamId: 'por',
        fromTeamName: '波特兰开拓者',
        toTeamId: 'phx',
        toTeamName: '菲尼克斯太阳',
      },
      {
        id: 'trade_2025_3',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '德斯蒙德·贝恩',
            fromTeamId: 'mem',
            fromTeamName: '孟菲斯灰熊',
            toTeamId: 'orl',
            toTeamName: '奥兰多魔术',
          },
          {
            playerName: '考德威尔-波普',
            fromTeamId: 'orl',
            fromTeamName: '奥兰多魔术',
            toTeamId: 'mem',
            toTeamName: '孟菲斯灰熊',
          },
          {
            playerName: '科尔·安东尼',
            fromTeamId: 'orl',
            fromTeamName: '奥兰多魔术',
            toTeamId: 'mem',
            toTeamName: '孟菲斯灰熊',
          },
        ],
      },
      {
        id: 'trade_2025_4',
        type: 'swap',
        playerAName: '小迈克尔·波特',
        teamAId: 'den',
        teamAName: '丹佛掘金',
        playerBName: '卡梅隆·约翰逊',
        teamBId: 'bkn',
        teamBName: '布鲁克林篮网',
      },
      {
        id: 'trade_2025_5',
        type: 'single_move',
        playerName: '迈尔斯·特纳',
        fromTeamId: 'ind',
        fromTeamName: '印第安纳步行者',
        toTeamId: 'mil',
        toTeamName: '密尔沃基雄鹿',
      },
      {
        id: 'trade_2025_6',
        type: 'single_move',
        playerName: '乔丹·普尔',
        fromTeamId: 'was',
        fromTeamName: '华盛顿奇才',
        toTeamId: 'noh',
        toTeamName: '新奥尔良鹈鹕',
      },
      {
        id: 'trade_2025_7',
        type: 'single_move',
        playerName: '凯利·奥利尼克',
        fromTeamId: 'bos',
        fromTeamName: '波士顿凯尔特人',
        toTeamId: 'was',
        toTeamName: '华盛顿奇才',
      },
      {
        id: 'trade_2025_8',
        type: 'single_move',
        playerName: '诺曼·鲍威尔',
        fromTeamId: 'tor',
        fromTeamName: '多伦多猛龙',
        toTeamId: 'mia',
        toTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2025_9',
        type: 'single_move',
        playerName: '约翰·科林斯',
        fromTeamId: 'uta',
        fromTeamName: '犹他爵士',
        toTeamId: 'lac',
        toTeamName: '洛杉矶快船',
      },
      {
        id: 'trade_2025_10',
        type: 'single_move',
        playerName: '德安德烈·艾顿',
        fromTeamId: 'phx',
        fromTeamName: '菲尼克斯太阳',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2025_11',
        type: 'single_move',
        playerName: '柯林·塞克斯顿',
        fromTeamId: 'uta',
        fromTeamName: '犹他爵士',
        toTeamId: 'cha',
        toTeamName: '夏洛特黄蜂',
      },
      {
        id: 'trade_2025_12',
        type: 'single_move',
        playerName: '尤瑟夫·努尔基奇',
        fromTeamId: 'den',
        fromTeamName: '丹佛掘金',
        toTeamId: 'uta',
        toTeamName: '犹他爵士',
      },
      {
        id: 'trade_2025_13',
        type: 'retire',
        retiredPlayerName: '凯尔·洛瑞',
        fromTeamId: 'mia',
        fromTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2025_14',
        type: 'single_move',
        playerName: '卢卡·东契奇',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2025_15',
        type: 'single_move',
        playerName: '马基夫·莫里斯',
        fromTeamId: 'phx',
        fromTeamName: '菲尼克斯太阳',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2025_16',
        type: 'single_move',
        playerName: '安东尼·戴维斯',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'dal',
        toTeamName: '达拉斯独行侠',
      },
    ],
  },
  2026: {
    year: 2026,
    seasonName: '2026-2027 赛季',
    trades: [
      {
        id: 'trade_2026_1',
        type: 'single_move',
        playerName: '勒布朗·詹姆斯',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'phi',
        toTeamName: '费城76人',
      },
      {
        id: 'trade_2026_2',
        type: 'swap',
        playerAName: '杰伦·布朗',
        teamAId: 'bos',
        teamAName: '波士顿凯尔特人',
        playerBName: '保罗·乔治',
        teamBId: 'phi',
        teamBName: '费城76人',
      },
      {
        id: 'trade_2026_3',
        type: 'single_move',
        playerName: '扬尼斯·阿德托昆博',
        fromTeamId: 'mil',
        fromTeamName: '密尔沃基雄鹿',
        toTeamId: 'mia',
        toTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2026_4',
        type: 'single_move',
        playerName: '安东尼·戴维斯',
        fromTeamId: 'dal',
        fromTeamName: '达拉斯独行侠',
        toTeamId: 'was',
        toTeamName: '华盛顿奇才',
      },
      {
        id: 'trade_2026_5',
        type: 'single_move',
        playerName: '鲍比·波蒂斯',
        fromTeamId: 'mil',
        fromTeamName: '密尔沃基雄鹿',
        toTeamId: 'mia',
        toTeamName: '迈阿密热火',
      },
      {
        id: 'trade_2026_6',
        type: 'three_way',
        threeWayMoves: [
          {
            playerName: '科怀·伦纳德',
            fromTeamId: 'lac',
            fromTeamName: '洛杉矶快船',
            toTeamId: 'tor',
            toTeamName: '多伦多猛龙',
          },
          {
            playerName: '布兰登·英格拉姆',
            fromTeamId: 'tor',
            fromTeamName: '多伦多猛龙',
            toTeamId: 'lac',
            toTeamName: '洛杉矶快船',
          },
          {
            playerName: '格雷迪·迪克',
            fromTeamId: 'tor',
            fromTeamName: '多伦多猛龙',
            toTeamId: 'lac',
            toTeamName: '洛杉矶快船',
          },
        ],
      },
      {
        id: 'trade_2026_7',
        type: 'single_move',
        playerName: '贾·莫兰特',
        fromTeamId: 'mem',
        fromTeamName: '孟菲斯灰熊',
        toTeamId: 'por',
        toTeamName: '波特兰开拓者',
      },
      {
        id: 'trade_2026_8',
        type: 'single_move',
        playerName: '拉梅洛·鲍尔',
        fromTeamId: 'cha',
        fromTeamName: '夏洛特黄蜂',
        toTeamId: 'min',
        toTeamName: '明尼苏达森林狼',
      },
      {
        id: 'trade_2026_9',
        type: 'single_move',
        playerName: '沃克·凯斯勒',
        fromTeamId: 'uta',
        fromTeamName: '犹他爵士',
        toTeamId: 'lal',
        toTeamName: '洛杉矶湖人',
      },
      {
        id: 'trade_2026_10',
        type: 'single_move',
        playerName: '德安德烈·艾顿',
        fromTeamId: 'lal',
        fromTeamName: '洛杉矶湖人',
        toTeamId: 'was',
        toTeamName: '华盛顿奇才',
      },
      {
        id: 'trade_2026_11',
        type: 'single_move',
        playerName: '卡里斯·勒夫特',
        fromTeamId: 'bkn',
        fromTeamName: '布鲁克林篮网',
        toTeamId: 'mil',
        toTeamName: '密尔沃基雄鹿',
      },
      {
        id: 'trade_2026_12',
        type: 'single_move',
        playerName: '达米安·利拉德',
        fromTeamId: 'mil',
        fromTeamName: '密尔沃基雄鹿',
        toTeamId: 'por',
        toTeamName: '波特兰开拓者',
      },
      {
        id: 'trade_2026_13',
        type: 'retire',
        retiredPlayerName: '拉塞尔·威斯布鲁克',
        fromTeamId: 'den',
        fromTeamName: '丹佛掘金',
      },
      {
        id: 'trade_2026_14',
        type: 'retire',
        retiredPlayerName: '克里斯·保罗',
        fromTeamId: 'sas',
        fromTeamName: '圣安东尼奥马刺',
      },
    ],
  },
};

const FALLBACK_ROSTER_PLAYERS: Record<string, { position: Position; ovr: number; age: number }> = {
  '弗雷德·范弗利特': { position: 'PG', ovr: 83, age: 26 },
  '斯潘塞·丁威迪': { position: 'PG', ovr: 81, age: 27 },
  '泰·杰罗姆': { position: 'PG', ovr: 74, age: 23 },
  '凯利·乌布雷': { position: 'SF', ovr: 80, age: 24 },
  '约翰·沃尔': { position: 'PG', ovr: 86, age: 30 },
  '乔治·希尔': { position: 'PG', ovr: 78, age: 34 },
  '戈登·海沃德': { position: 'SF', ovr: 85, age: 30 },
  '丹尼斯·施罗德': { position: 'PG', ovr: 81, age: 27 },
  '鲍格丹·博格达诺维奇': { position: 'SG', ovr: 80, age: 28 },
  '博格丹·博格达诺维奇': { position: 'SG', ovr: 80, age: 28 },
  '特里斯坦·汤普森': { position: 'C', ovr: 78, age: 29 },
  '塞斯·库里': { position: 'SG', ovr: 76, age: 24 },
  '塞尔吉·伊巴卡': { position: 'PF', ovr: 83, age: 29 },
  '丹尼·格林': { position: 'SG', ovr: 80, age: 31 },
  '安东尼·戴维斯': { position: 'PF', ovr: 94, age: 26 },
  '朗佐·鲍尔': { position: 'PG', ovr: 79, age: 21 },
  '布兰登·英格拉姆': { position: 'SF', ovr: 82, age: 21 },
  '乔什·哈特': { position: 'SG', ovr: 78, age: 24 },
  '保罗·乔治': { position: 'SF', ovr: 93, age: 29 },
  '保罗乔治': { position: 'SF', ovr: 93, age: 29 },
  '达尼洛·加里纳利': { position: 'SF', ovr: 83, age: 30 },
  '德安吉洛·拉塞尔': { position: 'PG', ovr: 85, age: 23 },
  '拉塞尔·威斯布鲁克': { position: 'PG', ovr: 90, age: 30 },
  '克里斯·保罗': { position: 'PG', ovr: 88, age: 34 },
  '凯里·欧文': { position: 'PG', ovr: 92, age: 27 },
  '肯巴·沃克': { position: 'PG', ovr: 88, age: 29 },
  '泰瑞·罗齐尔': { position: 'PG', ovr: 78, age: 25 },
  '克里斯塔普斯·波尔津吉斯': { position: 'PF', ovr: 86, age: 24 },
  '丹尼斯·史密斯': { position: 'PG', ovr: 77, age: 21 },
  '德安德烈·乔丹': { position: 'C', ovr: 81, age: 30 },
  '迈克·康利': { position: 'PG', ovr: 86, age: 31 },
  '凯尔·科沃尔': { position: 'SG', ovr: 75, age: 38 },
  '格雷森·阿伦': { position: 'SG', ovr: 76, age: 23 },
  '马尔科姆·布罗格登': { position: 'PG', ovr: 83, age: 26 },
  '马克·加索尔': { position: 'C', ovr: 82, age: 34 },
  '约纳斯·瓦兰丘纳斯': { position: 'C', ovr: 81, age: 27 },
  '德隆·赖特': { position: 'PG', ovr: 77, age: 27 },
  '兰德里·沙梅特': { position: 'SG', ovr: 76, age: 22 },
  '托尼·帕克': { position: 'PG', ovr: 75, age: 37 },
  '克里斯·波什': { position: 'PF', ovr: 80, age: 35 },
  '德克·诺维茨基': { position: 'PF', ovr: 75, age: 40 },
  '拉简·隆多': { position: 'PG', ovr: 82, age: 32 },
  '科怀·伦纳德': { position: 'SF', ovr: 94, age: 27 },
  '德玛尔·德罗赞': { position: 'SG', ovr: 88, age: 29 },
  '雅各布·珀尔特尔': { position: 'C', ovr: 77, age: 23 },
  '布莱克·格里芬': { position: 'PF', ovr: 88, age: 29 },
  '埃弗里·布拉德利': { position: 'SG', ovr: 79, age: 27 },
  '托比亚斯·哈里斯': { position: 'PF', ovr: 84, age: 26 },
  '德马库斯·考辛斯': { position: 'C', ovr: 86, age: 28 },
  '朱利叶斯·兰德尔': { position: 'PF', ovr: 82, age: 23 },
  '吉米·巴特勒': { position: 'SF', ovr: 89, age: 29 },
  '达里奥·沙里奇': { position: 'PF', ovr: 79, age: 24 },
  '贾马尔·克劳福德': { position: 'SG', ovr: 75, age: 38 },
  '大卫·韦斯特': { position: 'PF', ovr: 76, age: 38 },
  '帕特里克·贝弗利': { position: 'PG', ovr: 79, age: 29 },
  '路易斯·威廉姆斯': { position: 'SG', ovr: 80, age: 31 },
  '萨姆·德克尔': { position: 'SF', ovr: 74, age: 23 },
  '安特·日日奇': { position: 'C', ovr: 72, age: 20 },
  '巴迪·希尔德': { position: 'SG', ovr: 77, age: 24 },
  '维克托·奥拉迪波': { position: 'SG', ovr: 81, age: 24 },
  '以赛亚·托马斯': { position: 'PG', ovr: 82, age: 26 },
  '凯文·杜兰特': { position: 'SF', ovr: 95, age: 28 },
  '德维恩·韦德': { position: 'SG', ovr: 87, age: 34 },
  '艾尔·霍福德': { position: 'C', ovr: 85, age: 30 },
  '德里克·罗斯': { position: 'PG', ovr: 81, age: 28 },
  '杰里安·格兰特': { position: 'PG', ovr: 74, age: 24 },
  '哈里森·巴恩斯': { position: 'SF', ovr: 80, age: 24 },
  '科比·布莱恩特': { position: 'SG', ovr: 84, age: 38 },
  '蒂姆·邓肯': { position: 'C', ovr: 83, age: 40 },
  '阿玛雷·斯塔德迈尔': { position: 'PF', ovr: 76, age: 34 },
  '安德烈·米勒': { position: 'PG', ovr: 74, age: 40 },
  '卡隆·巴特勒': { position: 'SF', ovr: 75, age: 36 },
  '拉希德·华莱士': { position: 'PF', ovr: 82, age: 36 },
  '斯蒂芬·杰克逊': { position: 'SF', ovr: 83, age: 31 },
  '卡蒂诺·莫布里': { position: 'SG', ovr: 78, age: 35 },
  '沙奎尔·奥尼尔': { position: 'C', ovr: 84, age: 39 },
  '佩贾·斯托亚科维奇': { position: 'SF', ovr: 78, age: 34 },
  '本·华莱士': { position: 'C', ovr: 78, age: 38 },
  '朱万·霍华德': { position: 'PF', ovr: 75, age: 40 },
  '德里克·费舍尔': { position: 'PG', ovr: 76, age: 40 },
  '肖恩·巴蒂尔': { position: 'SF', ovr: 78, age: 36 },
  '拉马库斯·阿尔德里奇': { position: 'PF', ovr: 88, age: 30 },
  '戈兰·德拉季奇': { position: 'PG', ovr: 82, age: 29 },
  '丹尼·格兰杰': { position: 'SF', ovr: 78, age: 32 },
  '雷吉·杰克逊': { position: 'PG', ovr: 80, age: 25 },
  'D.J. 奥古斯丁': { position: 'PG', ovr: 76, age: 27 },
  '尼古拉·巴图姆': { position: 'SF', ovr: 81, age: 26 },
  '尼古拉斯·巴图姆': { position: 'SF', ovr: 81, age: 26 },
  '杰拉德·亨德森': { position: 'SG', ovr: 76, age: 27 },
  '诺阿·冯莱': { position: 'PF', ovr: 73, age: 20 },
  '泰·劳森': { position: 'PG', ovr: 80, age: 27 },
  '乔伊·多西': { position: 'C', ovr: 72, age: 31 },
  '蒙塔·埃利斯': { position: 'SG', ovr: 82, age: 29 },
  '安德鲁·博古特': { position: 'C', ovr: 83, age: 27 },
  '埃佩·尤度': { position: 'C', ovr: 74, age: 24 },
  '葛雷格·门罗': { position: 'C', ovr: 82, age: 25 },
  '德马尔·卡罗尔': { position: 'SF', ovr: 80, age: 29 },
  '史蒂夫·纳什': { position: 'PG', ovr: 82, age: 41 },
  '雷·阿伦': { position: 'SG', ovr: 80, age: 40 },
  '安德烈·基里连科': { position: 'SF', ovr: 78, age: 34 },
  '肖恩·马里昂': { position: 'SF', ovr: 78, age: 37 },
  '德里克·费沃斯': { position: 'PF', ovr: 76, age: 20 },
  '哈希姆·塔比特': { position: 'C', ovr: 72, age: 23 },
  '詹姆斯·哈登': { position: 'SG', ovr: 85, age: 23 },
  '尼古拉·武切维奇': { position: 'C', ovr: 75, age: 21 },
  '杰里米·兰姆': { position: 'SG', ovr: 73, age: 20 },
  '朱·霍勒迪': { position: 'PG', ovr: 82, age: 23 },
  '诺伦斯·诺尔': { position: 'C', ovr: 75, age: 19 },
  '埃里克·布莱索': { position: 'PG', ovr: 78, age: 23 },
  '基斯·博甘斯': { position: 'SG', ovr: 74, age: 32 },
  '雷吉·埃文斯': { position: 'PF', ovr: 76, age: 32 },
  '史蒂夫·诺瓦克': { position: 'SF', ovr: 72, age: 29 },
  '昆廷·理查德森': { position: 'SG', ovr: 75, age: 32 },
  '贾里德·杜德利': { position: 'SF', ovr: 75, age: 27 },
  '保罗·皮尔斯': { position: 'SF', ovr: 88, age: 35 },
  '凯文·加内特': { position: 'PF', ovr: 88, age: 37 },
  '杰拉德·华莱士': { position: 'SF', ovr: 80, age: 30 },
  '德怀特·霍华德': { position: 'C', ovr: 90, age: 27 },
  '安德烈·伊戈达拉': { position: 'SF', ovr: 85, age: 29 },
  '兰迪·弗耶': { position: 'PG', ovr: 77, age: 29 },
  '保罗·米尔萨普': { position: 'PF', ovr: 83, age: 28 },
  '安德里亚·巴尔尼亚尼': { position: 'C', ovr: 78, age: 27 },
  '约什·史密斯': { position: 'PF', ovr: 82, age: 27 },
  '勒布朗·詹姆斯': { position: 'SF', ovr: 98, age: 29 },
  '凯文·乐福': { position: 'PF', ovr: 89, age: 26 },
  '安德鲁·维金斯': { position: 'SF', ovr: 81, age: 19 },
  '安德鲁·威金斯': { position: 'SF', ovr: 81, age: 19 },
  '安东尼·本内特': { position: 'PF', ovr: 72, age: 21 },
  '保罗·加索尔': { position: 'PF', ovr: 85, age: 34 },
  '鲁迪·盖伊': { position: 'SF', ovr: 83, age: 28 },
  '约翰·萨尔蒙斯': { position: 'SG', ovr: 74, age: 34 },
  '格雷维斯·瓦斯奎兹': { position: 'PG', ovr: 76, age: 27 },
  '特雷西·麦克格雷迪': { position: 'SG', ovr: 80, age: 35 },
  '贾森·基德': { position: 'PG', ovr: 80, age: 41 },
  '格兰特·希尔': { position: 'SF', ovr: 78, age: 41 },
  '理查德·汉密尔顿': { position: 'SG', ovr: 78, age: 36 },
  '迪昂·维特斯': { position: 'SG', ovr: 78, age: 23 },
  'J.R. 史密斯': { position: 'SG', ovr: 80, age: 29 },
  '卡里斯·勒韦尔': { position: 'SG', ovr: 80, age: 26 },
  '凯利·奥利尼克': { position: 'C', ovr: 77, age: 29 },
  'C.J. 麦科勒姆': { position: 'SG', ovr: 84, age: 30 },
  '凯尔·库兹马': { position: 'SF', ovr: 81, age: 26 },
  '考德威尔-波普': { position: 'SG', ovr: 78, age: 24 },
  '阿奇乌瓦': { position: 'PF', ovr: 76, age: 21 },
  '温德尔·卡特': { position: 'C', ovr: 78, age: 21 },
  '加里·哈里斯': { position: 'SG', ovr: 77, age: 25 },
  '阿隆·戈登': { position: 'PF', ovr: 81, age: 25 },
  '劳里·马尔卡宁': { position: 'PF', ovr: 80, age: 23 },
  '小拉里·南斯': { position: 'PF', ovr: 78, age: 27 },
  '戴维斯·贝尔坦斯': { position: 'PF', ovr: 76, age: 28 },
  '艾尔-法鲁克·阿米努': { position: 'SF', ovr: 75, age: 30 },
  '凯尔·洛瑞': { position: 'PG', ovr: 85, age: 31 },
  '赛迪斯·杨': { position: 'PF', ovr: 78, age: 32 },
  '奥托·波特': { position: 'SF', ovr: 78, age: 27 },
  '安德烈·德拉蒙德': { position: 'C', ovr: 81, age: 27 },
  '多曼塔斯·萨博尼斯': { position: 'PF', ovr: 86, age: 26 },
  '哈利伯顿': { position: 'PG', ovr: 84, age: 22 },
  '多诺万·米切尔': { position: 'SG', ovr: 88, age: 25 },
  '鲁迪·戈贝尔': { position: 'C', ovr: 86, age: 30 },
  '沃克·凯斯勒': { position: 'C', ovr: 81, age: 20 },
  '马利克·比斯利': { position: 'SG', ovr: 78, age: 25 },
  '柯林·塞克斯顿': { position: 'PG', ovr: 81, age: 23 },
  '奥查伊·阿格巴吉': { position: 'SG', ovr: 75, age: 22 },
  '阿格巴吉': { position: 'SG', ovr: 75, age: 22 },
  '本·西蒙斯': { position: 'PG', ovr: 80, age: 26 },
  '德章泰·默里': { position: 'PG', ovr: 84, age: 25 },
  '杰伦·布伦森': { position: 'PG', ovr: 84, age: 25 },
  'J.J. 巴里亚': { position: 'PG', ovr: 74, age: 38 },
  '亚历克斯·卡鲁索': { position: 'PG', ovr: 78, age: 27 },
  '卡尔-安东尼·唐斯': { position: 'C', ovr: 89, age: 28 },
  '迪温琴佐': { position: 'SG', ovr: 80, age: 27 },
  '克莱·汤普森': { position: 'SG', ovr: 84, age: 34 },
  '克里斯·杜阿尔特': { position: 'SG', ovr: 76, age: 26 },
  '帕斯卡尔·西亚卡姆': { position: 'PF', ovr: 88, age: 30 },
  'OG·阿奴诺比': { position: 'SF', ovr: 84, age: 27 },
  '科迪·泽勒': { position: 'C', ovr: 74, age: 31 },
  '八村垒': { position: 'PF', ovr: 80, age: 24 },
  '马基夫·莫里斯': { position: 'PF', ovr: 76, age: 35 },
  '卢卡·东契奇': { position: 'PG', ovr: 96, age: 26 },
  '鲍比·波蒂斯': { position: 'PF', ovr: 80, age: 31 },
  '格雷迪·迪克': { position: 'SG', ovr: 77, age: 22 },
  '卡里斯·勒夫特': { position: 'SG', ovr: 80, age: 32 },
  '贾·莫兰特': { position: 'PG', ovr: 89, age: 27 },
  '拉梅洛·鲍尔': { position: 'PG', ovr: 86, age: 25 },
  '扬尼斯·阿德托昆博': { position: 'PF', ovr: 96, age: 31 },
  '杰伦·布朗': { position: 'SG', ovr: 89, age: 29 },
  '达米安·利拉德': { position: 'PG', ovr: 89, age: 36 },
  '德安德烈·艾顿': { position: 'C', ovr: 83, age: 28 },
  '艾顿': { position: 'C', ovr: 83, age: 28 },
};

function findMatchingPlayerIndex(roster: RosterPlayer[], targetName: string): number {
  if (!targetName) return -1;
  const nameVariants = [
    targetName,
    targetName.replace('伊戈达拉', '伊古达拉'),
    targetName.replace('伊古达拉', '伊戈达拉'),
    targetName.replace('维金斯', '威金斯'),
    targetName.replace('威金斯', '维金斯'),
  ];

  for (const name of nameVariants) {
    // 1. Exact match
    const exact = roster.findIndex((p) => p.name === name);
    if (exact !== -1) return exact;

    // 2. Contains match with division check to prevent false positives
    const contains = roster.findIndex((p) => {
      if (p.name.includes(name) || name.includes(p.name)) {
        if (p.name.includes('·') && name.includes('·')) {
          const [pFirst, pLast] = p.name.split('·');
          const [tFirst, tLast] = name.split('·');
          if (pFirst !== tFirst && pLast !== tLast) {
            return false;
          }
        }
        return true;
      }
      return false;
    });
    if (contains !== -1) return contains;

    // 3. Clean name match if cleanName is at least 3 chars, with division check to prevent false positives
    const cleanName = name.replace(/^(克里斯|卡梅隆|德隆|罗恩|法布里西奥|贾马里奥|特雷沃|布莱恩|哈基姆|希达耶特|勒布朗|阿玛雷|卡洛斯|安德烈)·?/g, '');
    if (cleanName.length >= 3) {
      const cleanIdx = roster.findIndex((p) => {
        if (p.name.includes(cleanName)) {
          if (p.name.includes('·') && name.includes('·')) {
            const [pFirst, pLast] = p.name.split('·');
            const [tFirst, tLast] = name.split('·');
            if (pLast === cleanName && pFirst !== tFirst) {
              return false; // e.g. different first names with same last name
            }
            if (pFirst === cleanName && pLast !== tLast) {
              return false; // e.g. different last names with same first name (Carmelo Anthony vs Anthony Davis)
            }
          }
          return true;
        }
        return false;
      });
      if (cleanIdx !== -1) return cleanIdx;
    }
  }

  return -1;
}

function getOrAddPlayerIndex(team: Team, targetName: string): number {
  let idx = findMatchingPlayerIndex(team.roster, targetName);
  if (idx === -1) {
    const fallback = FALLBACK_ROSTER_PLAYERS[targetName];
    if (fallback) {
      team.roster.push({
        id: `fallback_${targetName}_${Date.now()}`,
        name: targetName,
        position: fallback.position,
        ovr: fallback.ovr,
        age: fallback.age,
      });
      idx = team.roster.length - 1;
    }
  }
  return idx;
}

function updateTeamStarPlayers(team: Team) {
  team.rating = calculateTeamPowerRating(team);
  const top2 = [...team.roster].sort((a, b) => b.ovr - a.ovr).slice(0, 2);
  team.starPlayer = top2.map((p) => p.name).join(' & ');
}

/**
 * Helper to match teams flexible by ID or aliases (e.g. nop/noh for Pelicans, cha/chb for Bobcats/Hornets).
 */
function findTeamById(teams: Team[], teamId?: string): Team | undefined {
  if (!teamId) return undefined;
  return teams.find((t) => {
    if (t.id === teamId) return true;
    if (
      (teamId === 'nop' || teamId === 'noh') &&
      (t.id === 'noh' || t.id === 'nop' || t.abbrev === 'NOP' || t.abbrev === 'NOH')
    ) {
      return true;
    }
    if (
      (teamId === 'cha' || teamId === 'chb') &&
      (t.id === 'cha' || t.id === 'chb' || t.abbrev === 'CHA' || t.abbrev === 'CHB')
    ) {
      return true;
    }
    if (
      (teamId === 'bkn' || teamId === 'njn') &&
      (t.id === 'bkn' || t.id === 'njn' || t.abbrev === 'BKN' || t.abbrev === 'NJN')
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Franchise identity changes belong to the league timeline rather than the
 * historical trade script, so both classic and parallel careers apply them.
 */
export function applyHistoricalTeamIdentityUpdates(currentTeams: Team[], year: number): Team[] {
  return currentTeams.map((team) => {
    const updated = { ...team };
    if (year >= 2012 && updated.id === 'bkn' && (updated.name === '新泽西网' || updated.name === '新泽西篮网')) {
      updated.name = '布鲁克林篮网';
      updated.abbrev = 'BKN';
    }
    if (year >= 2013 && (updated.id === 'noh' || updated.name === '新奥尔良黄蜂')) {
      updated.name = '新奥尔良鹈鹕';
      updated.abbrev = 'NOP';
    }
    if (year >= 2014 && (updated.id === 'cha' || updated.name === '夏洛特山猫')) {
      updated.name = '夏洛特黄蜂';
      updated.abbrev = 'CHA';
    }
    return updated;
  });
}

/**
 * Executes historical trades for a given season year on the teams list.
 * Recalculates team ratings and returns updated teams alongside execution details for the modal.
 */
export function executeHistoricalTradesForSeason(
  currentTeams: Team[],
  year: number,
  options: HistoricalTradeOptions = {},
): { updatedTeams: Team[]; modalData: TradeModalData | null } {
  const config = HISTORICAL_REAL_TRADES[year];
  const configuredTrades = config?.trades || [];

  // Deep clone teams to avoid mutating original state directly
  const teams = applyHistoricalTeamIdentityUpdates(JSON.parse(JSON.stringify(currentTeams)) as Team[], year);

  const executedDetails: ExecutedTradeDetail[] = [];

  for (const trade of configuredTrades) {
    const tradeType = trade.type || 'swap';

    if (tradeType === 'league_change' && trade.leagueChangeDetail) {
      executedDetails.push({
        id: trade.id,
        type: 'league_change',
        leagueChangeDetail: trade.leagueChangeDetail,
      });
    } else if (tradeType === 'swap') {
      if (!trade.playerAName || !trade.playerBName) continue;

      // Find intended destination teams
      const destTeamA = findTeamById(teams, trade.teamBId); // Player A goes to B's designated team
      const destTeamB = findTeamById(teams, trade.teamAId); // Player B goes to A's designated team
      const designatedSourceA = findTeamById(teams, trade.teamAId);
      const designatedSourceB = findTeamById(teams, trade.teamBId);

      if (!destTeamA || !destTeamB || !designatedSourceA || !designatedSourceB) continue;

      // Find current actual source teams where players are located
      let actualTeamA = teams.find((t) => findMatchingPlayerIndex(t.roster, trade.playerAName!) !== -1) || designatedSourceA;
      let actualTeamB = teams.find((t) => findMatchingPlayerIndex(t.roster, trade.playerBName!) !== -1) || designatedSourceB;

      // Get player indices on their current actual source teams
      const pAIndex = getOrAddPlayerIndex(actualTeamA, trade.playerAName!);
      const pBIndex = getOrAddPlayerIndex(actualTeamB, trade.playerBName!);

      if (pAIndex === -1 || pBIndex === -1) continue;

      const playerA = actualTeamA.roster[pAIndex];
      const playerB = actualTeamB.roster[pBIndex];

      const sourceTeamAOldRating = actualTeamA.rating || calculateTeamPowerRating(actualTeamA);
      const sourceTeamBOldRating = actualTeamB.rating || calculateTeamPowerRating(actualTeamB);

      // Handle splice carefully if they are currently on the same team
      if (actualTeamA.id === actualTeamB.id) {
        // Remove both from same team
        const firstIdx = Math.max(pAIndex, pBIndex);
        const secondIdx = Math.min(pAIndex, pBIndex);
        actualTeamA.roster.splice(firstIdx, 1);
        actualTeamA.roster.splice(secondIdx, 1);
      } else {
        actualTeamA.roster.splice(pAIndex, 1);
        actualTeamB.roster.splice(pBIndex, 1);
      }

      // Add to final destination teams
      destTeamA.roster.push({ ...playerA });
      destTeamB.roster.push({ ...playerB });

      // Update ratings for all affected teams
      updateTeamStarPlayers(actualTeamA);
      if (actualTeamB.id !== actualTeamA.id) {
        updateTeamStarPlayers(actualTeamB);
      }
      if (destTeamA.id !== actualTeamA.id && destTeamA.id !== actualTeamB.id) {
        updateTeamStarPlayers(destTeamA);
      }
      if (destTeamB.id !== actualTeamA.id && destTeamB.id !== actualTeamB.id && destTeamB.id !== destTeamA.id) {
        updateTeamStarPlayers(destTeamB);
      }

      executedDetails.push({
        id: trade.id,
        type: 'swap',
        playerA: {
          name: playerA.name,
          position: playerA.position,
          ovr: playerA.ovr,
          fromTeamId: designatedSourceA.id,
          fromTeamName: trade.teamAName || designatedSourceA.name,
          toTeamId: destTeamA.id,
          toTeamName: trade.teamBName || destTeamA.name,
        },
        playerB: {
          name: playerB.name,
          position: playerB.position,
          ovr: playerB.ovr,
          fromTeamId: designatedSourceB.id,
          fromTeamName: trade.teamBName || designatedSourceB.name,
          toTeamId: destTeamB.id,
          toTeamName: trade.teamAName || destTeamB.name,
        },
        teamAOldRating: sourceTeamAOldRating,
        teamANewRating: actualTeamA.rating,
        teamBOldRating: sourceTeamBOldRating,
        teamBNewRating: actualTeamB.rating,
      });
    } else if (tradeType === 'three_way' && trade.threeWayMoves) {
      const moveDetails: Array<{
        playerName: string;
        position: string;
        ovr: number;
        fromTeamId: string;
        fromTeamName: string;
        toTeamId: string;
        toTeamName: string;
      }> = [];

      // Collect moving players and teams
      const extractedPlayers: Array<{ player: RosterPlayer; actualTeam: Team; toTeam: Team }> = [];

      for (const m of trade.threeWayMoves) {
        const designatedFromTeam = findTeamById(teams, m.fromTeamId);
        const designatedToTeam = findTeamById(teams, m.toTeamId);

        if (!designatedFromTeam || !designatedToTeam) continue;

        let actualTeam = teams.find((t) => findMatchingPlayerIndex(t.roster, m.playerName) !== -1) || designatedFromTeam;

        const pIdx = getOrAddPlayerIndex(actualTeam, m.playerName);
        if (pIdx === -1) continue;

        const player = actualTeam.roster[pIdx];
        actualTeam.roster.splice(pIdx, 1);

        extractedPlayers.push({ player, actualTeam, toTeam: designatedToTeam });

        moveDetails.push({
          playerName: player.name,
          position: player.position,
          ovr: player.ovr,
          fromTeamId: designatedFromTeam.id,
          fromTeamName: m.fromTeamName || designatedFromTeam.name,
          toTeamId: designatedToTeam.id,
          toTeamName: m.toTeamName || designatedToTeam.name,
        });
      }

      // Add players to destination teams
      extractedPlayers.forEach(({ player, toTeam }) => {
        toTeam.roster.push({ ...player });
      });

      // Update ratings for affected teams
      const affectedTeamIds = Array.from(
        new Set(extractedPlayers.flatMap(({ actualTeam, toTeam }) => [actualTeam.id, toTeam.id]))
      );
      affectedTeamIds.forEach((id) => {
        const teamObj = findTeamById(teams, id);
        if (teamObj) updateTeamStarPlayers(teamObj);
      });

      if (moveDetails.length > 0) {
        executedDetails.push({
          id: trade.id,
          type: 'three_way',
          threeWayMovesDetails: moveDetails,
        });
      }
    } else if (tradeType === 'single_move' && trade.playerName) {
      const designatedFromTeam = findTeamById(teams, trade.fromTeamId);
      const designatedToTeam = findTeamById(teams, trade.toTeamId);

      if (designatedFromTeam && designatedToTeam) {
        let actualTeam = teams.find((t) => findMatchingPlayerIndex(t.roster, trade.playerName!) !== -1) || designatedFromTeam;

        const pIdx = getOrAddPlayerIndex(actualTeam, trade.playerName);
        if (pIdx !== -1) {
          const player = actualTeam.roster[pIdx];
          if (trade.targetOvr) {
            player.ovr = trade.targetOvr;
          }
          actualTeam.roster.splice(pIdx, 1);
          designatedToTeam.roster.push({ ...player });

          updateTeamStarPlayers(actualTeam);
          updateTeamStarPlayers(designatedToTeam);

          executedDetails.push({
            id: trade.id,
            type: 'single_move',
            singleMoveDetail: {
              playerName: player.name,
              position: player.position,
              ovr: player.ovr,
              fromTeamId: designatedFromTeam.id,
              fromTeamName: trade.fromTeamName || designatedFromTeam.name,
              toTeamId: designatedToTeam.id,
              toTeamName: trade.toTeamName || designatedToTeam.name,
            },
          });
        }
      }
    } else if (tradeType === 'retire' && trade.retiredPlayerName) {
      let fromTeam = findTeamById(teams, trade.fromTeamId);
      if (!fromTeam || findMatchingPlayerIndex(fromTeam.roster, trade.retiredPlayerName!) === -1) {
        const found = teams.find((t) => findMatchingPlayerIndex(t.roster, trade.retiredPlayerName!) !== -1);
        if (found) fromTeam = found;
      }

      if (fromTeam) {
        const pIdx = getOrAddPlayerIndex(fromTeam, trade.retiredPlayerName);
        if (pIdx !== -1) {
          const player = fromTeam.roster[pIdx];
          fromTeam.roster.splice(pIdx, 1);
          updateTeamStarPlayers(fromTeam);

          executedDetails.push({
            id: trade.id,
            type: 'retire',
            retireDetail: {
              playerName: player.name,
              position: player.position,
              ovr: player.ovr,
              fromTeamId: fromTeam.id,
              fromTeamName: fromTeam.name,
            },
          });
        }
      }
    }
  }

  // Historical tables only list notable real-world retirements. Players who
  // are not explicitly listed must still leave the league at age 43, but their
  // routine exits stay out of the visible transaction report.
  let hasSilentRetirement = false;
  for (const team of teams) {
    const retainedRoster = team.roster.filter((rosterPlayer) => {
      const isUser =
        (!!options.userPlayerId && rosterPlayer.id === options.userPlayerId) ||
        (!!options.userPlayerName && rosterPlayer.name === options.userPlayerName);
      const shouldRetireSilently = !isUser && (rosterPlayer.age || 0) >= 43;
      if (shouldRetireSilently) hasSilentRetirement = true;
      return !shouldRetireSilently;
    });
    if (retainedRoster.length !== team.roster.length) {
      team.roster = retainedRoster;
      updateTeamStarPlayers(team);
    }
  }

  if (executedDetails.length === 0) {
    return { updatedTeams: hasSilentRetirement ? teams : currentTeams, modalData: null };
  }

  // Sort executed details so 'retire' trades are always placed at the bottom
  executedDetails.sort((a, b) => {
    const isARetire = a.type === 'retire';
    const isBRetire = b.type === 'retire';
    if (isARetire && !isBRetire) return 1;
    if (!isARetire && isBRetire) return -1;
    return 0;
  });

  const modalData: TradeModalData = {
    year,
    seasonName: config?.seasonName || `${year}-${year + 1} 赛季`,
    executedTrades: executedDetails,
  };

  return { updatedTeams: teams, modalData };
}

