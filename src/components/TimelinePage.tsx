import React from 'react';
import { PlayerProfile } from '../types';
import { TeamLogo } from './TeamLogo';
import { formatPercentage } from '../utils/statsFormat';
import { NBA_TEAMS_2008 } from '../data/nbaData2008';
import {
  History,
  Crown,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface TimelinePageProps {
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
}

// NBA Timeline History Data (2008 to Present)
const NBA_TIMELINE_HISTORY = [
  {
    year: 2008,
    seasonStr: '2008-09 赛季',
    champion: '洛杉矶湖人',
    mvp: '勒布朗·詹姆斯',
    scoringLeader: '德维恩·韦德',
    fmvp: '科比·布莱恩特',
    dpoy: '德怀特·霍华德',
    roy: '德里克·罗斯',
  },
  {
    year: 2009,
    seasonStr: '2009-10 赛季',
    champion: '洛杉矶湖人',
    mvp: '勒布朗·詹姆斯',
    scoringLeader: '凯文·杜兰特',
    fmvp: '科比·布莱恩特',
    dpoy: '德怀特·霍华德',
    roy: '泰瑞克·埃文斯',
  },
  {
    year: 2010,
    seasonStr: '2010-11 赛季',
    champion: '达拉斯独行侠',
    mvp: '德里克·罗斯',
    scoringLeader: '凯文·杜兰特',
    fmvp: '德克·诺维茨基',
    dpoy: '德怀特·霍华德',
    roy: '布莱克·格里芬',
  },
  {
    year: 2011,
    seasonStr: '2011-12 赛季',
    champion: '迈阿密热火',
    mvp: '勒布朗·詹姆斯',
    scoringLeader: '凯文·杜兰特',
    fmvp: '勒布朗·詹姆斯',
    dpoy: '泰森·钱德勒',
    roy: '凯里·欧文',
  },
  {
    year: 2012,
    seasonStr: '2012-13 赛季',
    champion: '迈阿密热火',
    mvp: '勒布朗·詹姆斯',
    scoringLeader: '卡梅隆·安东尼',
    fmvp: '勒布朗·詹姆斯',
    dpoy: '马克·加索尔',
    roy: '达米安·利拉德',
  },
  {
    year: 2013,
    seasonStr: '2013-14 赛季',
    champion: '圣安东尼奥马刺',
    mvp: '凯文·杜兰特',
    scoringLeader: '凯文·杜兰特',
    fmvp: '科怀·伦纳德',
    dpoy: '乔金·诺阿',
    roy: '迈克尔·卡特-威廉姆斯',
  },
  {
    year: 2014,
    seasonStr: '2014-15 赛季',
    champion: '金州勇士',
    mvp: '斯蒂芬·库里',
    scoringLeader: '拉塞尔·威斯布鲁克',
    fmvp: '安德烈·伊戈达拉',
    dpoy: '科怀·伦纳德',
    roy: '安德鲁·维金斯',
  },
  {
    year: 2015,
    seasonStr: '2015-16 赛季',
    champion: '克里夫兰骑士',
    mvp: '斯蒂芬·库里',
    scoringLeader: '斯蒂芬·库里',
    fmvp: '勒布朗·詹姆斯',
    dpoy: '科怀·伦纳德',
    roy: '卡尔-安东尼·唐斯',
  },
  {
    year: 2016,
    seasonStr: '2016-17 赛季',
    champion: '金州勇士',
    mvp: '拉塞尔·威斯布鲁克',
    scoringLeader: '拉塞尔·威斯布鲁克',
    fmvp: '凯文·杜兰特',
    dpoy: '德雷蒙德·格林',
    roy: '马尔科姆·布罗格登',
  },
  {
    year: 2017,
    seasonStr: '2017-18 赛季',
    champion: '金州勇士',
    mvp: '詹姆斯·哈登',
    scoringLeader: '詹姆斯·哈登',
    fmvp: '凯文·杜兰特',
    dpoy: '鲁迪·戈贝尔',
    roy: '本·西蒙斯',
  },
  {
    year: 2018,
    seasonStr: '2018-19 赛季',
    champion: '多伦多猛龙',
    mvp: '扬尼斯·阿德托昆博',
    scoringLeader: '詹姆斯·哈登',
    fmvp: '科怀·伦纳德',
    dpoy: '鲁迪·戈贝尔',
    roy: '卢卡·东契奇',
  },
  {
    year: 2019,
    seasonStr: '2019-20 赛季',
    champion: '洛杉矶湖人',
    mvp: '扬尼斯·阿德托昆博',
    scoringLeader: '詹姆斯·哈登',
    fmvp: '勒布朗·詹姆斯',
    dpoy: '扬尼斯·阿德托昆博',
    roy: '贾·莫兰特',
  },
  {
    year: 2020,
    seasonStr: '2020-21 赛季',
    champion: '密尔沃基雄鹿',
    mvp: '尼古拉·约基奇',
    scoringLeader: '斯蒂芬·库里',
    fmvp: '扬尼斯·阿德托昆博',
    dpoy: '鲁迪·戈贝尔',
    roy: '拉梅洛·鲍尔',
  },
  {
    year: 2021,
    seasonStr: '2021-22 赛季',
    champion: '金州勇士',
    mvp: '尼古拉·约基奇',
    scoringLeader: '乔尔·恩比德',
    fmvp: '斯蒂芬·库里',
    dpoy: '马库斯·斯玛特',
    roy: '斯科蒂·巴恩斯',
  },
  {
    year: 2022,
    seasonStr: '2022-23 赛季',
    champion: '丹佛掘金',
    mvp: '乔尔·恩比德',
    scoringLeader: '乔尔·恩比德',
    fmvp: '尼古拉·约基奇',
    dpoy: '贾伦·杰克逊',
    roy: '保罗·班凯罗',
  },
  {
    year: 2023,
    seasonStr: '2023-24 赛季',
    champion: '波士顿凯尔特人',
    mvp: '尼古拉·约基奇',
    scoringLeader: '卢卡·东契奇',
    fmvp: '杰伦·布朗',
    dpoy: '鲁迪·戈贝尔',
    roy: '维克托·文班亚马',
  },
  {
    year: 2024,
    seasonStr: '2024-25 赛季',
    champion: '俄克拉荷马雷霆',
    mvp: '谢伊·吉尔杰斯-亚历山大',
    scoringLeader: '谢伊·吉尔杰斯-亚历山大',
    fmvp: '谢伊·吉尔杰斯-亚历山大',
    dpoy: '维克托·文班亚马',
    roy: '斯蒂芬·卡斯尔',
  },
];

export const TimelinePage: React.FC<TimelinePageProps> = ({
  player,
  careerHistory = [],
  leagueHistory = [],
  currentYear = 2008,
}) => {
  // Upper bound year: only display up to previous season if player is in current season
  const currentYearVal = currentYear || 2008;
  const maxTimelineYear = currentYearVal - 1;

  // Map user career history by year
  const userTeamHistoryMap: Record<number, NonNullable<TimelinePageProps['careerHistory']>[number]> = {};
  careerHistory.forEach((h) => {
    userTeamHistoryMap[h.year] = h;
  });

  // Collect years strictly from 2008 up to maxTimelineYear
  const knownYears = new Set<number>();
  for (let y = 2008; y <= maxTimelineYear; y++) {
    knownYears.add(y);
  }

  const timelineList = Array.from(knownYears)
    .filter((yr) => yr <= maxTimelineYear)
    .sort((a, b) => b - a)
    .map((yr) => {
      const simulatedHist = leagueHistory.find((lh) => lh.year === yr);
      const realHist = NBA_TIMELINE_HISTORY.find((h) => h.year === yr);

      const hist = simulatedHist ? {
        year: yr,
        seasonStr: simulatedHist.seasonStr,
        champion: simulatedHist.champion,
        championId: simulatedHist.championId,
        mvp: simulatedHist.mvp,
        scoringLeader: simulatedHist.scoringLeader || realHist?.scoringLeader || '待定',
        fmvp: simulatedHist.fmvp,
        dpoy: simulatedHist.dpoy,
        roy: simulatedHist.roy,
      } : (realHist || {
        year: yr,
        seasonStr: `${yr}-${(yr + 1).toString().slice(-2)} 赛季`,
        champion: '待定 / 赛季进行中',
        mvp: '待定',
        scoringLeader: '待定',
        fmvp: '待定',
        dpoy: '待定',
        roy: '待定',
      });

      // User accolades for this year
      // Accolades are stored in player.accolades
      const userHist = userTeamHistoryMap[yr];
      const userAccs = (player.accolades || []).filter((a) => a.year === yr);
      const historyAccolades = userHist?.accoladesEarned || [];
      const userTeamName = userHist?.teamName || '';

      const hasUserChampAccolade = userAccs.some((a) => a.type === 'CHAMPION' || a.title.includes('冠军'));
      const isUserTeam =
        hasUserChampAccolade ||
        (Boolean(userTeamName) && (hist.champion.includes(userTeamName) || userTeamName.includes(hist.champion)));

      const userMvp = userAccs.some((a) => a.type === 'MVP' || a.title === '常规赛 MVP' || a.title.includes('最有价值球员'));
      const userScoringLeader = userAccs.some((a) => a.type === 'SCORING_TITLE' || a.title === '常规赛得分王' || a.title.includes('得分王') || a.title.includes('Scoring Leader'));
      const userFmvp = userAccs.some((a) => a.type === 'FMVP' || a.title === '总决赛 FMVP' || a.title.includes('FMVP') || a.title.includes('总决赛MVP'));
      const userDpoy = userAccs.some((a) => a.type === 'DPOY' || a.title === '最佳防守球员' || (a.title.includes('DPOY') && !a.title.includes('阵容') && !a.title.includes('阵')) || a.title.includes('最佳防守球员'));
      const userRoy = userAccs.some((a) => a.type === 'ROY' || a.title === '最佳新秀' || (a.title.includes('ROY') && !a.title.includes('阵容')) || (a.title.includes('最佳新秀') && !a.title.includes('阵容')));

      return {
        ...hist,
        champion: isUserTeam ? (userTeamName ? userTeamName : hist.champion) : hist.champion,
        isUserTeam,
        mvp: userMvp ? player.name : hist.mvp,
        scoringLeader: userScoringLeader ? player.name : hist.scoringLeader,
        fmvp: userFmvp ? player.name : hist.fmvp,
        dpoy: userDpoy ? player.name : hist.dpoy,
        roy: userRoy ? player.name : hist.roy,
        userAwards: {
          mvp: userMvp,
          scoringLeader: userScoringLeader,
          fmvp: userFmvp,
          dpoy: userDpoy,
          roy: userRoy,
        },
        userYearAccolades: Array.from(
          new Set(
            [...userAccs.map((a) => a.title), ...historyAccolades].map((title) => {
              if (title.includes('冠军') || title.includes('Champion')) return '联盟总冠军';
              if (title.includes('FMVP') || title.includes('总决赛MVP')) return '总决赛 FMVP';
              return title;
            })
          )
        ),
      };
    });

  return (
    <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232834] pb-3">
        <div>
          <h4 className="text-sm font-black italic uppercase text-white flex items-center gap-1.5">
            <History className="w-4 h-4 text-amber-400" /> 联盟 时间线历史荣誉列表
          </h4>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded bg-[#181d28] text-amber-300 border border-amber-500/20 font-mono">
          共 {timelineList.length} 届历史记录
        </span>
      </div>

      {/* Vertical Timeline Structure */}
      {timelineList.length === 0 ? (
        <div className="bg-[#0d1017] border border-[#232834] rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl mx-auto">
            🏆
          </div>
          <h3 className="text-sm font-black text-white">暂无历史赛季记录</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            你正处于职业生涯的第 1 个赛季（{currentYearVal}-{currentYearVal + 1} 赛季）。随着你征战常规赛与季后赛，完成当赛季后，此处将记录联盟冠军归属与你的各项个人荣誉！
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-amber-500/80 before:via-amber-500/30 before:to-slate-700/30">
          {timelineList.map((t) => {
            const isUserTeamChampion = t.isUserTeam;
            const cleanChamp = t.champion.replace(/\s*\(你的球队\)\s*/g, '');
            const userHistForYr = careerHistory.find((h) => h.year === t.year);
            const userTeamNameVal = userHistForYr?.teamName || '';
            
            const userTeam = userHistForYr ? NBA_TEAMS_2008.find(team => 
              userHistForYr.teamId === team.id ||
              userHistForYr.teamName.includes(team.name) || 
              team.name.includes(userHistForYr.teamName) || 
              userHistForYr.teamName.includes(team.city)
            ) : undefined;
            
            const champTeam = NBA_TEAMS_2008.find(team => 
              (t as any).championId === team.id ||
              cleanChamp.includes(team.name) || 
              team.name.includes(cleanChamp) || 
              cleanChamp.includes(team.city) || 
              (isUserTeamChampion && userTeamNameVal && (team.name.includes(userTeamNameVal) || userTeamNameVal.includes(team.name)))
            );

            return (
              <div key={t.year} className="relative group">
                {/* Timeline Dot Node */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] z-10 transition-all ${
                    isUserTeamChampion
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/50 ring-2 ring-amber-300'
                      : 'bg-[#181d28] text-slate-400 border border-[#2d3446]'
                  }`}
                >
                  {isUserTeamChampion ? '🏆' : '🏀'}
                </div>

                {/* Card Box */}
                <span className="text-base font-black font-mono text-amber-400">
                  {t.seasonStr}
                </span>
                <div
                  className={`mt-2 p-4 rounded-xl border transition-all ${
                    isUserTeamChampion
                      ? 'bg-gradient-to-r from-amber-500/10 via-[#11141b] to-[#0d1017] border-amber-500/50 ring-1 ring-amber-400/20 shadow-xl'
                      : 'bg-[#0d1017] border-[#232834] hover:border-slate-600'
                  }`}
                >
                  {/* Header: Season & Champion */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
                    {/* Champion Display */}
                    <div className={`flex items-center gap-3 bg-[#131822] border rounded-xl px-4 py-2 shadow-inner transition-all hover:bg-[#161c28] ${
                      isUserTeamChampion ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-[#232834]'
                    }`}>
                      {champTeam ? (
                        <TeamLogo 
                          team={champTeam} 
                          className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.25)] transform hover:scale-105 transition-all shrink-0" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1c2230] flex items-center justify-center text-lg shrink-0">🏆</div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[9px] text-amber-400/80 font-black tracking-widest uppercase">
                          🏆 联盟 总冠军
                        </span>
                        <span className={`text-xs font-black tracking-wide ${isUserTeamChampion ? 'text-amber-300' : 'text-white'}`}>
                          {t.champion}
                        </span>
                      </div>
                    </div>
                  {/* Additional User Accolades for this year */}
                  {t.userYearAccolades && t.userYearAccolades.length > 0 && (
                    <div className="border-t border-[#232834]/60 flex flex-wrap items-center gap-1.5 pt-2">
                      <span className="text-[10px] text-amber-400 font-bold">🏅 你的当季斩获荣誉:</span>
                      {t.userYearAccolades.map((accTitle, aIdx) => (
                        <span
                          key={aIdx}
                          className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold"
                        >
                          {accTitle}
                        </span>
                      ))}
                    </div>
                  )}
                  </div>

                  {/* Major League Awards Grid (MVP, Scoring Leader, FMVP, DPOY, ROY) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 pt-3 border-t border-[#232834]/60">
                    <div className="bg-[#131822] p-2 rounded-lg border border-[#232834] flex flex-col justify-center">
                      <span className="text-[9px] text-amber-400/90 font-black uppercase tracking-wider flex items-center gap-1">
                        👑 常规赛 MVP
                      </span>
                      <span className={`text-xs font-black truncate mt-0.5 ${t.userAwards?.mvp ? 'text-amber-300' : 'text-slate-200'}`}>
                        {t.mvp || '待定'}
                      </span>
                    </div>

                    <div className="bg-[#131822] p-2 rounded-lg border border-[#232834] flex flex-col justify-center">
                      <span className="text-[9px] text-rose-400/90 font-black uppercase tracking-wider flex items-center gap-1">
                        🔥 得分王
                      </span>
                      <span className={`text-xs font-black truncate mt-0.5 ${t.userAwards?.scoringLeader ? 'text-rose-300' : 'text-slate-200'}`}>
                        {t.scoringLeader || '待定'}
                      </span>
                    </div>

                    <div className="bg-[#131822] p-2 rounded-lg border border-[#232834] flex flex-col justify-center">
                      <span className="text-[9px] text-amber-400/90 font-black uppercase tracking-wider flex items-center gap-1">
                        🌟 总决赛 FMVP
                      </span>
                      <span className={`text-xs font-black truncate mt-0.5 ${t.userAwards?.fmvp ? 'text-amber-300' : 'text-slate-200'}`}>
                        {t.fmvp || '待定'}
                      </span>
                    </div>

                    <div className="bg-[#131822] p-2 rounded-lg border border-[#232834] flex flex-col justify-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        🛡️ 最佳防守 DPOY
                      </span>
                      <span className={`text-xs font-black truncate mt-0.5 ${t.userAwards?.dpoy ? 'text-amber-300' : 'text-slate-200'}`}>
                        {t.dpoy || '待定'}
                      </span>
                    </div>

                    <div className="bg-[#131822] p-2 rounded-lg border border-[#232834] flex flex-col justify-center col-span-2 sm:col-span-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        🎯 最佳新秀 ROY
                      </span>
                      <span className={`text-xs font-black truncate mt-0.5 ${t.userAwards?.roy ? 'text-amber-300' : 'text-slate-200'}`}>
                        {t.roy || '待定'}
                      </span>
                    </div>
                  </div>

                  {/* Season stats & team block (Requirement 2) */}
                  {userHistForYr && (
                    <div className="mt-3 bg-[#141923] border border-amber-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-center gap-2.5">
                        {userTeam ? (
                          <TeamLogo 
                            team={userTeam} 
                            className="w-8 h-8 object-contain shrink-0" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">
                            🏀
                          </div>
                        )}
                        <div>
                          <span className="text-[9px] text-amber-400/80 font-black tracking-widest uppercase block">
                            当季效力球队
                          </span>
                          <span className="text-xs font-bold text-white font-sans">
                            {userHistForYr.teamName}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 sm:flex sm:items-center gap-x-4 gap-y-1.5 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 block">场均得分</span>
                          <span className="font-mono font-black text-amber-400">{(userHistForYr.ppg ?? 0).toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">场均篮板</span>
                          <span className="font-mono font-black text-blue-400">{(userHistForYr.rpg ?? 0).toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">场均助攻</span>
                          <span className="font-mono font-black text-purple-400">{(userHistForYr.apg ?? 0).toFixed(1)}</span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-[#232834]" />
                        <div>
                          <span className="text-[9px] text-slate-500 block">场均抢断</span>
                          <span className="font-mono font-black text-emerald-400">{(userHistForYr.spg ?? 0).toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">场均盖帽</span>
                          <span className="font-mono font-black text-cyan-400">{userHistForYr.bpg.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">命中率</span>
                          <span className="font-mono font-black text-white">{formatPercentage(userHistForYr.fgPct)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
