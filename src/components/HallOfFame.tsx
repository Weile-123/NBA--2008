import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types';
import { calculateGoatScore, TOP_50_LEGENDS } from '../utils/calc2k';
import { GoatCalculatorModal } from './GoatCalculatorModal';
import { TeamLogo } from './TeamLogo';
import { NBA_TEAMS_2008 } from '../data/nbaData2008';
import {
  Trophy,
  Award,
  Crown,
  Star,
  Medal,
  Sparkles,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  BarChart2,
  History,
  Zap,
  Flame,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface HallOfFameProps {
  player: PlayerProfile;
  careerHistory?: {
    year: number;
    seasonStr: string;
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    fgPct: number;
    accoladesEarned: string[];
  }[];
  leagueHistory?: {
    year: number;
    seasonStr: string;
    champion: string;
    championId: string;
    mvp: string;
    fmvp: string;
    dpoy: string;
    roy: string;
  }[];
  currentYear?: number;
  onRetireCareer: () => void;
  onOpenLegendaryHof?: () => void;
}

// NBA Timeline History Data (2008 to Present)
const NBA_TIMELINE_HISTORY = [
  {
    year: 2008,
    seasonStr: '2008-09 赛季',
    champion: '洛杉矶湖人',
    mvp: '勒布朗·詹姆斯',
    fmvp: '科比·布莱恩特',
    dpoy: '德怀特·霍华德',
    roy: '德里克·罗斯',
  },
  {
    year: 2009,
    seasonStr: '2009-10 赛季',
    champion: '洛杉矶湖人',
    mvp: '勒布朗·詹姆斯',
    fmvp: '科比·布莱恩特',
    dpoy: '德怀特·霍华德',
    roy: '泰瑞克·埃文斯',
  },
  {
    year: 2010,
    seasonStr: '2010-11 赛季',
    champion: '达拉斯独行侠',
    mvp: '德里克·罗斯',
    fmvp: '德克·诺维茨基',
    dpoy: '德怀特·霍华德',
    roy: '布莱克·格里芬',
  },
  {
    year: 2011,
    seasonStr: '2011-12 赛季',
    champion: '迈阿密热火',
    mvp: '勒布朗·詹姆斯',
    fmvp: '勒布朗·詹姆斯',
    dpoy: '泰森·钱德勒',
    roy: '凯里·欧文',
  },
  {
    year: 2012,
    seasonStr: '2012-13 赛季',
    champion: '迈阿密热火',
    mvp: '勒布朗·詹姆斯',
    fmvp: '勒布朗·詹姆斯',
    dpoy: '马克·加索尔',
    roy: '达米安·利拉德',
  },
  {
    year: 2013,
    seasonStr: '2013-14 赛季',
    champion: '圣安东尼奥马刺',
    mvp: '凯文·杜兰特',
    fmvp: '科怀·伦纳德',
    dpoy: '乔金·诺阿',
    roy: '迈克尔·卡特-威廉姆斯',
  },
  {
    year: 2014,
    seasonStr: '2014-15 赛季',
    champion: '金州勇士',
    mvp: '斯蒂芬·库里',
    fmvp: '安德烈·伊戈达拉',
    dpoy: '科怀·伦纳德',
    roy: '安德鲁·维金斯',
  },
  {
    year: 2015,
    seasonStr: '2015-16 赛季',
    champion: '克里夫兰骑士',
    mvp: '斯蒂芬·库里',
    fmvp: '勒布朗·詹姆斯',
    dpoy: '科怀·伦纳德',
    roy: '卡尔-安东尼·唐斯',
  },
  {
    year: 2016,
    seasonStr: '2016-17 赛季',
    champion: '金州勇士',
    mvp: '拉塞尔·威斯布鲁克',
    fmvp: '凯文·杜兰特',
    dpoy: '德雷蒙德·格林',
    roy: '马尔科姆·布罗格登',
  },
  {
    year: 2017,
    seasonStr: '2017-18 赛季',
    champion: '金州勇士',
    mvp: '詹姆斯·哈登',
    fmvp: '凯文·杜兰特',
    dpoy: '鲁迪·戈贝尔',
    roy: '本·西蒙斯',
  },
  {
    year: 2018,
    seasonStr: '2018-19 赛季',
    champion: '多伦多猛龙',
    mvp: '扬尼斯·阿德托昆博',
    fmvp: '科怀·伦纳德',
    dpoy: '鲁迪·戈贝尔',
    roy: '卢卡·东契奇',
  },
  {
    year: 2019,
    seasonStr: '2019-20 赛季',
    champion: '洛杉矶湖人',
    mvp: '扬尼斯·阿德托昆博',
    fmvp: '勒布朗·詹姆斯',
    dpoy: '扬尼斯·阿德托昆博',
    roy: '贾·莫兰特',
  },
  {
    year: 2020,
    seasonStr: '2020-21 赛季',
    champion: '密尔沃基雄鹿',
    mvp: '尼古拉·约基奇',
    fmvp: '扬尼斯·阿德托昆博',
    dpoy: '鲁迪·戈贝尔',
    roy: '拉梅洛·鲍尔',
  },
  {
    year: 2021,
    seasonStr: '2021-22 赛季',
    champion: '金州勇士',
    mvp: '尼古拉·约基奇',
    fmvp: '斯蒂芬·库里',
    dpoy: '马库斯·斯玛特',
    roy: '斯科蒂·巴恩斯',
  },
  {
    year: 2022,
    seasonStr: '2022-23 赛季',
    champion: '丹佛掘金',
    mvp: '乔尔·恩比德',
    fmvp: '尼古拉·约基奇',
    dpoy: '贾伦·杰克逊',
    roy: '保罗·班凯罗',
  },
  {
    year: 2023,
    seasonStr: '2023-24 赛季',
    champion: '波士顿凯尔特人',
    mvp: '尼古拉·约基奇',
    fmvp: '杰伦·布朗',
    dpoy: '鲁迪·戈贝尔',
    roy: '维克托·文班亚马',
  },
  {
    year: 2024,
    seasonStr: '2024-25 赛季',
    champion: '俄克拉荷马雷霆',
    mvp: '谢伊·吉尔杰斯-亚历山大',
    fmvp: '谢伊·吉尔杰斯-亚历山大',
    dpoy: '维克托·文班亚马',
    roy: '斯蒂芬·卡斯尔',
  },
];

export const HallOfFame: React.FC<HallOfFameProps> = ({ player, careerHistory, leagueHistory, currentYear, onRetireCareer, onOpenLegendaryHof }) => {
  const [activeTab, setActiveTab] = useState<'trophy' | 'goat'>('trophy');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [activeTab]);
  const [isFormulaExpanded, setIsFormulaExpanded] = useState<boolean>(false);

  const goatResult = calculateGoatScore(player);
  const { score, rankTitle, sHonor, sAllNba, sEfficiency, sTotals, sSkillPoints, ppgReset, details } = goatResult;
  const accolades = player.accolades || [];
  const careerStats = player.careerStats || {
    games: 0,
    pts: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    gamesStarted: 0,
  };

  // 10 Core Honors Quantities Real-time Calculation
  const mvpCount = accolades.filter(
    (a) => a.type === 'MVP' || (a.title.includes('MVP') && !a.title.includes('FMVP'))
  ).length;

  const scoringTitleCount = accolades.filter(
    (a) =>
      a.type === 'SCORING_TITLE' ||
      a.title.includes('得分王') ||
      a.title.includes('Scoring Leader') ||
      a.title.includes('Scoring Champion')
  ).length;

  const dpoyCount = accolades.filter(
    (a) => a.type === 'DPOY' || a.title.includes('最佳防守球员') || (a.title.includes('DPOY') && !a.title.includes('阵') && !a.title.includes('阵容'))
  ).length;

  const championCount = accolades.filter(
    (a) => a.type === 'CHAMPION' || a.title.includes('冠军')
  ).length;

  const fmvpCount = accolades.filter(
    (a) => a.type === 'FMVP' || a.title.includes('FMVP') || a.title.includes('总决赛MVP')
  ).length;

  const allNba1stCount = accolades.filter(
    (a) =>
      a.type === 'ALL_NBA_1ST' ||
      (a.title.includes('最佳阵容') &&
        (a.title.includes('一阵') || a.title.includes('一队') || a.title.includes('1队')) &&
        !a.title.includes('防守'))
  ).length;

  const allNba2ndCount = accolades.filter(
    (a) =>
      a.type === 'ALL_NBA_2ND' ||
      (a.title.includes('最佳阵容') &&
        (a.title.includes('二阵') || a.title.includes('二队') || a.title.includes('2队')) &&
        !a.title.includes('防守'))
  ).length;

  const allNba3rdCount = accolades.filter(
    (a) =>
      a.type === 'ALL_NBA_3RD' ||
      (a.title.includes('最佳阵容') &&
        (a.title.includes('三阵') || a.title.includes('三队') || a.title.includes('3队')) &&
        !a.title.includes('防守'))
  ).length;

  const allDef1stCount = accolades.filter(
    (a) =>
      a.type === 'ALL_DEFENSE_1ST' ||
      (a.title.includes('最佳防守') &&
        (a.title.includes('一阵') || a.title.includes('一队') || a.title.includes('1队')))
  ).length;

  const allDef2ndCount = accolades.filter(
    (a) =>
      a.type === 'ALL_DEFENSE_2ND' ||
      (a.title.includes('最佳防守') &&
        (a.title.includes('二阵') || a.title.includes('二队') || a.title.includes('2队')))
  ).length;

  const royCount = accolades.filter(
    (a) => a.type === 'ROY' || a.title.includes('ROY') || a.title.includes('最佳新秀')
  ).length;

  const sixthManCount = accolades.filter(
    (a) =>
      a.type === 'SIXTH_MAN' ||
      a.title.includes('SIXTH_MAN') ||
      a.title.includes('最佳第六人') ||
      a.title.includes('6MOTY')
  ).length;

  const allStarCount = accolades.filter(
    (a) =>
      a.type === 'ALL_STAR' ||
      a.title.includes('全明星') ||
      a.title.includes('All-Star')
  ).length;

  const milestoneTop3Count = accolades.filter(
    (a) => a.title?.includes('历史') || a.type?.startsWith('MILESTONE')
  ).length;

  // Career Averages
  const games = careerStats.games || 0;
  const ppg = games > 0 ? (careerStats.pts / games).toFixed(1) : '0.0';
  const rpg = games > 0 ? (careerStats.reb / games).toFixed(1) : '0.0';
  const apg = games > 0 ? (careerStats.ast / games).toFixed(1) : '0.0';
  const spg = games > 0 ? (careerStats.stl / games).toFixed(1) : '0.0';
  const bpg = games > 0 ? (careerStats.blk / games).toFixed(1) : '0.0';
  const fgPct = careerStats.fga > 0 ? ((careerStats.fgm / careerStats.fga) * 100).toFixed(1) + '%' : '0.0%';
  const tpPct = careerStats.tpa > 0 ? ((careerStats.tpm / careerStats.tpa) * 100).toFixed(1) + '%' : '0.0%';
  const ftPct = careerStats.fta > 0 ? ((careerStats.ftm / careerStats.fta) * 100).toFixed(1) + '%' : '0.0%';

  // Core Honors Configuration Array
  const CORE_HONORS = [
    {
      key: 'allStar',
      title: '联盟 全明星',
      subtitle: 'All-Star Selection',
      count: allStarCount,
      icon: '🌟',
      accentColor: 'border-orange-500/50 text-orange-300 bg-orange-500/10',
      badgeBg: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
    },
    {
      key: 'milestoneTop3',
      title: '历史单项 Top 3',
      subtitle: 'All-Time Milestone Top 3',
      count: milestoneTop3Count,
      icon: '🎖️',
      accentColor: 'border-amber-400/50 text-amber-300 bg-amber-400/10',
      badgeBg: 'bg-amber-400/20 text-amber-300 border border-amber-400/40',
    },
    {
      key: 'mvp',
      title: '常规赛 MVP',
      subtitle: 'Most Valuable Player',
      count: mvpCount,
      icon: '👑',
      accentColor: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
      badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      key: 'scoringTitle',
      title: '常规赛得分王',
      subtitle: 'Scoring Champion',
      count: scoringTitleCount,
      icon: '🔥',
      accentColor: 'border-rose-500/50 text-rose-400 bg-rose-500/10',
      badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    },
    {
      key: 'dpoy',
      title: '最佳防守球员',
      subtitle: 'DPOY Defense Player',
      count: dpoyCount,
      icon: '🛡️',
      accentColor: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
      badgeBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    },
    {
      key: 'champion',
      title: '联盟 总冠军',
      subtitle: 'Championship Ring',
      count: championCount,
      icon: '💍',
      accentColor: 'border-yellow-500/50 text-yellow-300 bg-yellow-500/10',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
    },
    {
      key: 'fmvp',
      title: '总决赛 FMVP',
      subtitle: 'Finals MVP Trophy',
      count: fmvpCount,
      icon: '🏆',
      accentColor: 'border-amber-400/50 text-amber-300 bg-amber-400/10',
      badgeBg: 'bg-amber-400/20 text-amber-300 border border-amber-400/40',
    },
    {
      key: 'allNba1st',
      title: '最佳阵容一阵',
      subtitle: '最佳阵容一阵',
      count: allNba1stCount,
      icon: '🥇',
      accentColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
    {
      key: 'allNba2nd',
      title: '最佳阵容二阵',
      subtitle: '最佳阵容二阵',
      count: allNba2ndCount,
      icon: '🥈',
      accentColor: 'border-teal-500/50 text-teal-300 bg-teal-500/10',
      badgeBg: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
    },
    {
      key: 'allNba3rd',
      title: '最佳阵容三阵',
      subtitle: '最佳阵容三阵',
      count: allNba3rdCount,
      icon: '🥉',
      accentColor: 'border-amber-600/50 text-amber-500 bg-amber-600/10',
      badgeBg: 'bg-amber-600/20 text-amber-400 border border-amber-600/40',
    },
    {
      key: 'allDef1st',
      title: '最佳防守一阵',
      subtitle: 'All-Defensive 1st Team',
      count: allDef1stCount,
      icon: '🛡️🥇',
      accentColor: 'border-cyan-500/50 text-cyan-300 bg-cyan-500/10',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
    },
    {
      key: 'allDef2nd',
      title: '最佳防守二阵',
      subtitle: 'All-Defensive 2nd Team',
      count: allDef2ndCount,
      icon: '🛡️🥈',
      accentColor: 'border-sky-500/50 text-sky-300 bg-sky-500/10',
      badgeBg: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
    },
    {
      key: 'roy',
      title: '最佳新秀',
      subtitle: 'Rookie of the Year',
      count: royCount,
      icon: '⭐',
      accentColor: 'border-indigo-500/50 text-indigo-300 bg-indigo-500/10',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40',
    },
    {
      key: 'sixthMan',
      title: '最佳第六人',
      subtitle: 'Sixth Man of the Year',
      count: sixthManCount,
      icon: '⚡',
      accentColor: 'border-purple-500/50 text-purple-300 bg-purple-500/10',
      badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    },
  ];

  const userEntry = {
    name: `${player.name} (你的生涯)`,
    score,
    rings: championCount,
    mvps: mvpCount,
    scoringTitles: scoringTitleCount,
    avatar: '⭐',
    isUser: true,
  };

  const combinedRankings = [...TOP_50_LEGENDS.map((l) => ({ ...l, isUser: false })), userEntry].sort(
    (a, b) => b.score - a.score
  );

  const userRankIndex = combinedRankings.findIndex((item) => item.isUser);
  const userRankDisplay = userRankIndex < 50 ? `#${userRankIndex + 1}` : '#50+';

  return (
    <div className="space-y-5">
      {/* GOAT Meter & Player Career Live Status Banner */}
      <div className="bg-[#11141b] border border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10">
          
          {/* Player Info & Rank */}
          <div className="space-y-1.5 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase">
              <Crown className="w-4 h-4 text-amber-400" /> 生涯荣誉陈列室 & 名人堂记录
              <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 实时同步
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tight">
              {player.name} 的传奇生涯陈列室
            </h3>
            <p className="text-xs text-amber-400 font-bold flex items-center justify-center lg:justify-start gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 历史地位评估: {rankTitle}
            </p>
          </div>

          {/* Quick Real-Time Career Totals Pills & GOAT Score */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <div className="bg-[#0d1017] border border-[#232834] px-3.5 py-2 rounded-xl text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">总得分</span>
              <span className="text-base font-black font-mono text-amber-400">{careerStats.pts.toLocaleString()}</span>
            </div>
            <div className="bg-[#0d1017] border border-[#232834] px-3.5 py-2 rounded-xl text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">总篮板</span>
              <span className="text-base font-black font-mono text-blue-400">{careerStats.reb.toLocaleString()}</span>
            </div>
            <div className="bg-[#0d1017] border border-[#232834] px-3.5 py-2 rounded-xl text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">总助攻</span>
              <span className="text-base font-black font-mono text-purple-400">{careerStats.ast.toLocaleString()}</span>
            </div>
            <div className="bg-[#0d1017] border border-amber-500/30 px-3.5 py-2 rounded-xl text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">历史排名</span>
              <span className="text-base font-black font-mono italic text-amber-400">{userRankDisplay}</span>
            </div>
            <div className="bg-amber-500 text-black px-4 py-2 rounded-xl text-center shadow-lg">
              <span className="text-[9px] font-black text-black/80 uppercase block">GOAT 积分</span>
              <span className="text-xl font-black font-mono italic leading-none">{score}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#11141b] p-1.5 rounded-xl border border-[#232834]">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('trophy')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'trophy'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> 核心生涯荣誉 ({accolades.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('goat')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'goat'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Medal className="w-3.5 h-3.5" /> 联盟历史50大
          </button>
        </div>
      </div>

      {/* TAB 1: 核心生涯荣誉 (核心荣誉 Grid + 生涯场均表现与命中率) */}
      {activeTab === 'trophy' && (() => {
        // Filter acquired honors for Core Honors Case
        const acquiredHonors = CORE_HONORS.filter((h) => h.count > 0);

        return (
          <div className="space-y-5">
            {/* 1. Core Honors Quantity Grid */}
            <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#232834] pb-3">
                <div>
                  <h4 className="text-sm font-black italic uppercase text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" /> 生涯荣誉斩获
                  </h4>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  已获:{acquiredHonors.reduce((sum, h) => sum + h.count, 0)}次项
                </span>
              </div>

              {acquiredHonors.length > 0 ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
                  {acquiredHonors.map((h) => (
                    <div
                      key={h.key}
                      className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${h.accentColor} ring-1 ring-amber-400/30 shadow-md`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl shrink-0">{h.icon}</span>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-black text-white leading-tight break-words">{h.title}</h5>
                          <p className="text-[9px] text-slate-400 font-mono truncate hidden xs:block">{h.subtitle}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] sm:text-xs font-black font-mono px-2 py-0.5 rounded-full shrink-0 ${h.badgeBg}`}>
                        {h.count} 次
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-[#0d1017] rounded-xl border border-[#232834] text-slate-500 text-xs font-mono space-y-1">
                  <Trophy className="w-7 h-7 text-slate-600 mx-auto opacity-40 mb-1" />
                  <div className="text-slate-300 font-bold">暂无斩获核心个人荣誉</div>
                  <div className="text-[11px] text-slate-500">在常规赛与季后赛中获得 MVP、总冠军、FMVP 或防守等最高荣誉后将实时计入</div>
                </div>
              )}
            </div>

            {/* 2. Career Averages & Percentages (Moved here directly below Core Honors) */}
            <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-[#232834] pb-2.5">
                <h4 className="text-xs font-black italic uppercase text-blue-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" /> 生涯场均表现与命中率
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  职业生涯整体效率与场均高阶贡献
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-[#0d1017] p-3 rounded-xl border border-[#232834] text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">场均得分</span>
                  <span className="text-lg font-black text-amber-400">{ppg}</span>
                  <span className="text-[9px] text-slate-500 block">PPG</span>
                </div>

                <div className="bg-[#0d1017] p-3 rounded-xl border border-[#232834] text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">场均篮板</span>
                  <span className="text-lg font-black text-blue-400">{rpg}</span>
                  <span className="text-[9px] text-slate-500 block">RPG</span>
                </div>

                <div className="bg-[#0d1017] p-3 rounded-xl border border-[#232834] text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">场均助攻</span>
                  <span className="text-lg font-black text-purple-400">{apg}</span>
                  <span className="text-[9px] text-slate-500 block">APG</span>
                </div>

                <div className="bg-[#0d1017] p-3 rounded-xl border border-[#232834] text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">场均抢断</span>
                  <span className="text-lg font-black text-emerald-400">{spg}</span>
                  <span className="text-[9px] text-slate-500 block">SPG</span>
                </div>

                <div className="bg-[#0d1017] p-3 rounded-xl border border-[#232834] text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">场均盖帽</span>
                  <span className="text-lg font-black text-cyan-400">{bpg}</span>
                  <span className="text-[9px] text-slate-500 block">BPG</span>
                </div>

                <div className="bg-[#0d1017] p-3 rounded-xl border border-[#232834] text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">投篮命中率</span>
                  <span className="text-lg font-black text-rose-400">{fgPct}</span>
                  <span className="text-[9px] text-slate-500 block">FG%</span>
                </div>

                <div className="bg-[#0d1017] p-3 rounded-xl border border-[#232834] text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">三分命中率</span>
                  <span className="text-lg font-black text-amber-300">{tpPct}</span>
                  <span className="text-[9px] text-slate-500 block">3P%</span>
                </div>

                <div className="bg-[#0d1017] p-3 rounded-xl border border-[#232834] text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">罚球命中率</span>
                  <span className="text-lg font-black text-teal-300">{ftPct}</span>
                  <span className="text-[9px] text-slate-500 block">FT%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: NBA 历史 50 大巨星榜对比 */}
      {activeTab === 'goat' && (
        <div className="space-y-4">
          {/* Goat Score Formula Breakdown Card */}
          <div className="bg-[#11141b] border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 shadow-xl transition-all">
            <div
              onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
              className={`flex items-center justify-between cursor-pointer select-none ${
                isFormulaExpanded ? 'border-b border-[#232834] pb-2.5 mb-3' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <h4 className="text-xs font-black italic uppercase text-amber-400">
                  GOAT积分公式
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black font-mono text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  当前:{score}分
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFormulaExpanded(!isFormulaExpanded);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#181d29] hover:bg-[#232834] text-amber-400 text-xs font-bold border border-[#2b3245] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span className="text-[11px]">{isFormulaExpanded ? '收起' : '展开'}</span>
                  {isFormulaExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
              </div>
            </div>

            {isFormulaExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {/* 统治荣誉分 */}
                <div className="bg-[#0d1017] border border-[#232834] p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">1. 统治荣誉分</span>
                    <span className="text-xs font-black text-amber-400 font-mono">+{sHonor} 分</span>
                  </div>
                  <div className="text-[9px] text-slate-500 space-y-0.5 font-mono">
                    <div>• MVP ({details.mvp}个 × 350分): {details.mvp * 350}</div>
                    <div>• FMVP ({details.fmvp}个 × 280分): {details.fmvp * 280}</div>
                    <div>• 得分王 ({details.scoringTitle || 0}个 × 80分): {(details.scoringTitle || 0) * 80}</div>
                    <div>• DPOY ({details.dpoy}个 × 100分): {details.dpoy * 100}</div>
                    <div>• 总冠军 ({details.champion}个 × 120分): {details.champion * 120}</div>
                  </div>
                </div>

                {/* 阵容与防守分 */}
                <div className="bg-[#0d1017] border border-[#232834] p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">2. 阵容与防守分</span>
                    <span className="text-xs font-black text-blue-400 font-mono">+{sAllNba} 分</span>
                  </div>
                  <div className="text-[9px] text-slate-500 space-y-0.5 font-mono">
                    <div>• 最佳一阵 ({details.allNba1st}次 × 60分): {details.allNba1st * 60}</div>
                    <div>• 二/三阵 ({details.allNba2nd3rd}次 × 30分): {details.allNba2nd3rd * 30}</div>
                    <div>• 最佳一防 ({details.allDef1st}次 × 45分): {details.allDef1st * 45}</div>
                    <div>• 最佳二防 ({details.allDef2nd}次 × 20分): {details.allDef2nd * 20}</div>
                    <div>• 全明星 ({details.allStar}次 × 15分): {details.allStar * 15}</div>
                  </div>
                </div>

                {/* 巅峰效率分 */}
                <div className="bg-[#0d1017] border border-[#232834] p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">3. 巅峰效率分</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">+{sEfficiency} 分</span>
                  </div>
                  <div className="text-[9px] text-slate-500 space-y-0.5 font-mono">
                    <div>• 效率重置值: {ppgReset}</div>
                    <div>• 公式: PPG_reset × 8</div>
                    <div className="text-[8px] text-slate-600 truncate">(得分×1.2+篮板+助攻×1.2+抢断×2+盖帽×2-失误×1.5)</div>
                  </div>
                </div>

                {/* 累计数据分 */}
                <div className="bg-[#0d1017] border border-[#232834] p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">4. 累计数据分</span>
                    <span className="text-xs font-black text-purple-400 font-mono">+{sTotals} 分</span>
                  </div>
                  <div className="text-[9px] text-slate-500 space-y-0.5 font-mono">
                    <div>• 总得分 ({careerStats.pts} ÷ 1000 × 10): {((careerStats.pts / 1000) * 10).toFixed(1)}</div>
                    <div>• 总篮板 ({careerStats.reb} ÷ 1000 × 6): {((careerStats.reb / 1000) * 6).toFixed(1)}</div>
                    <div>• 总助攻 ({careerStats.ast} ÷ 1000 × 8): {((careerStats.ast / 1000) * 8).toFixed(1)}</div>
                    <div>• 抢断+盖帽 ((抢+盖)÷500×5): {((((careerStats.stl || 0) + (careerStats.blk || 0)) / 500) * 5).toFixed(1)}</div>
                  </div>
                </div>

                {/* 属性点加成 */}
                <div className="bg-[#0d1017] border border-[#232834] p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">5. 属性点加成</span>
                    <span className="text-xs font-black text-amber-300 font-mono">+{sSkillPoints} 分</span>
                  </div>
                  <div className="text-[9px] text-slate-500 space-y-0.5 font-mono">
                    <div>• 未使用属性点: {details.unusedSkillPoints || 0} 点</div>
                    <div>• 公式: Math.floor(点数 / 100) × 10</div>
                    <div>• 每满100点未使用属性点奖励 +10分</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#232834] pb-2.5">
              <div>
                <h4 className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                  <Medal className="w-4 h-4 text-amber-400" /> 联盟 历史 50 大巨星
                </h4>
              </div>
              <span className="text-xs font-bold text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded border border-amber-500/30">
                你的排名: {userRankDisplay}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              排名由 AI 通过计算得出，不代表个人观点
            </p>

          <div className="max-h-[30rem] overflow-y-auto space-y-2 pr-1">
            {combinedRankings.slice(0, 50).map((g, idx) => {
              const rankNum = idx + 1;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    g.isUser
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md ring-1 ring-amber-400'
                      : 'bg-[#0d1017] border-[#232834] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-slate-500 text-xs w-7">#{rankNum}</span>
                    <span className="text-xl">{g.avatar}</span>
                    <div>
                      <div className="font-bold text-white text-xs uppercase">{g.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        总冠军: {g.rings}个 · MVP: {g.mvps}次
                      </div>
                    </div>
                  </div>

                  <span className="text-sm font-black font-mono italic text-amber-400">{g.score} 积分</span>
                </div>
              );
            })}

            {/* If user rank is outside top 50, show user card at bottom with #50+ */}
            {userRankIndex >= 50 && (
              <div className="p-3.5 rounded-xl border bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md ring-1 ring-amber-400 flex items-center justify-between text-xs mt-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-black text-amber-400 text-xs w-9">#50+</span>
                  <span className="text-xl">⭐</span>
                  <div>
                    <div className="font-bold text-white text-xs uppercase">{userEntry.name}</div>
                    <div className="text-[10px] text-amber-300 font-mono">
                      还需要积累更多冠军与MVP，冲刺进入历史 Top 50 传奇榜！
                    </div>
                  </div>
                </div>

                <span className="text-sm font-black font-mono italic text-amber-400">{userEntry.score} 积分</span>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Retirement Action Box - Floating Sticky Bar at Bottom (Only available after completing rookie season) */}
      {careerHistory && careerHistory.length > 0 && (
        <div className="sticky bottom-[3.8rem] md:bottom-4 z-30 bg-gradient-to-r from-[#11141b]/95 via-[#161c2a]/95 to-[#11141b]/95 backdrop-blur-md border-2 border-amber-500/60 p-3 sm:p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] ring-2 ring-amber-400/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-center sm:text-left my-2 mb-4">
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black italic uppercase text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span className="text-amber-400">🏛️</span>
              <span>宣布退役并进入奈史密斯篮球名人堂</span>
            </h4>
            <p className="text-[10px] sm:text-[11px] text-amber-300/80 font-mono mt-0.5">
              结束辉煌的职业生涯，举行球衣退役仪式，正式入选联盟名人堂！
            </p>
          </div>
          <button
            type="button"
            onClick={onRetireCareer}
            className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black italic rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-red-950/50 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-2 cursor-pointer ring-2 ring-red-400/40"
          >
            <span>正式退役并结算生涯</span>
          </button>
        </div>
      )}

      {/* GOAT Score Realtime Calculator Modal */}
      <GoatCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </div>
  );
};
