import React, { useState, useEffect } from 'react';
import { scheduleRootScrollToTop } from '../utils/scroll';
import {
  Trophy,
  Award,
  Crown,
  Star,
  Medal,
  ShieldCheck,
  UserCheck,
  Flame,
  Shirt,
  Calendar,
  ArrowLeft,
  Trash2,
  Search,
  Sparkles,
  X,
  Building2,
  CheckCircle2,
  BarChart2,
  BookOpen,
  Home,
  ChevronRight,
  Loader2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { RetiredPlayerRecord } from '../types';
import { getHallOfFameLegends, deleteHallOfFameLegend, saveHallOfFameLegend } from '../utils/storage';
import { loadGlobalHallOfFame, GlobalHallOfFameRank, syncLocalBestAndLoadMyRank } from '../lib/globalLeaderboard';
import { TeamLogo } from './TeamLogo';
import { NBA_TEAMS_2008 } from '../data/nbaData2008';
import { formatLocalDateTime } from '../utils/dateTime';
import { DEFAULT_GAME_MODE, GameMode, GAME_MODE_CONFIG } from '../gameMode';

interface LegendaryHallOfFameModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onGoHome?: () => void;
  initialMode?: 'local' | 'global';
  initialGameMode?: GameMode;
}

// Preset demo legend for preview when list is empty
const DEMO_KOBE_LEGEND: RetiredPlayerRecord = {
  id: 'legend_demo_kobe_2008_2020',
  retireDate: '2020-01-26',
  player: {
    name: '科比·布莱恩特',
    position: 'SG',
    archetype: '得分狂人 / 曼巴精神',
    height: 198,
    weight: 96,
    draftYear: 1996,
    draftPick: 13,
    birthplace: '宾夕法尼亚州费城',
    jerseyNum: 24,
  },
  retireAge: 38,
  peakOvr: 99,
  finalOvr: 92,
  goatScore: 5380,
  seasonsPlayed: 20,
  startYear: 1996,
  endYear: 2016,
  totalGames: 1346,
  totalPoints: 33643,
  totalRebounds: 7047,
  totalAssists: 6306,
  avgPpg: 25.0,
  avgRpg: 5.2,
  avgApg: 4.7,
  careerAccolades: {
    championships: 5,
    mvps: 1,
    fmvps: 2,
    dpoys: 0,
    roys: 0,
    scoringTitles: 2,
    allStarApps: 18,
    allNbaFirsts: 11,
    allNbaSeconds: 2,
    allNbaThirds: 2,
    hallOfFame: true,
  },
  retiredJerseys: [
    {
      teamId: 'LAL',
      teamName: '洛杉矶湖人',
      primaryColor: '#552583',
      secondaryColor: '#FDB927',
      seasonsCount: 20,
      jerseyNum: 24,
      reasons: ['效力满 20 个赛季', '在 2009、2010 赛季率领球队夺得 联盟 总冠军并荣膺 FMVP'],
    },
  ],
  timeline: [
    {
      year: 2008,
      seasonStr: '2008-09 赛季',
      teamId: 'LAL',
      teamName: '洛杉矶湖人',
      wins: 65,
      losses: 17,
      ppg: 26.8,
      rpg: 5.2,
      apg: 4.9,
      accolades: ['联盟总冠军', '总决赛 FMVP', '全明星第一阵容', '最佳防守一阵'],
    },
    {
      year: 2009,
      seasonStr: '2009-10 赛季',
      teamId: 'LAL',
      teamName: '洛杉矶湖人',
      wins: 57,
      losses: 25,
      ppg: 27.0,
      rpg: 5.4,
      apg: 5.0,
      accolades: ['联盟总冠军', '总决赛 FMVP', '全明星第一阵容'],
    },
  ],
};

export const LegendaryHallOfFameModal: React.FC<LegendaryHallOfFameModalProps> = ({
  isOpen,
  onClose,
  onGoHome,
  initialMode = 'local',
  initialGameMode = DEFAULT_GAME_MODE,
}) => {
  const [tabMode, setTabMode] = useState<'local' | 'global'>(initialMode);
  const [leaderboardGameMode, setLeaderboardGameMode] = useState<GameMode>(DEFAULT_GAME_MODE);
  const [legends, setLegends] = useState<RetiredPlayerRecord[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState<boolean>(false);
  const [isTimeoutGlobal, setIsTimeoutGlobal] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [myGlobalRank, setMyGlobalRank] = useState<GlobalHallOfFameRank | null>(null);
  const [myGlobalRankError, setMyGlobalRankError] = useState<string | null>(null);
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [localSyncNotice, setLocalSyncNotice] = useState<string | null>(null);
  const [globalRefreshVersion, setGlobalRefreshVersion] = useState(0);
  const [selectedLegend, setSelectedLegend] = useState<RetiredPlayerRecord | null>(null);
  const [searchQuery] = useState('');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<RetiredPlayerRecord | null>(null);
  const [showFullTimelineModal, setShowFullTimelineModal] = useState<boolean>(false);
  const [showFullEpilogueModal, setShowFullEpilogueModal] = useState<boolean>(false);

  // Helper to ensure float values are strictly rounded to 1 decimal place and fix legacy accolade counts
  const sanitizeLegend = (l: RetiredPlayerRecord): RetiredPlayerRecord => {
    let dpoys = l.careerAccolades?.dpoys || 0;
    let allNbaFirsts = l.careerAccolades?.allNbaFirsts || 0;
    let allNbaSeconds = l.careerAccolades?.allNbaSeconds || 0;
    let allNbaThirds = l.careerAccolades?.allNbaThirds || 0;
    // Recalculate dpoys from season timeline if available to correct legacy records where All-Defensive teams inflated DPOY count
    if (l.timeline && l.timeline.length > 0) {
      dpoys = l.timeline.reduce((count, season) => {
        const hasDpoy = (season.accolades || []).some(
          (acc) =>
            (acc.includes('最佳防守球员') || acc.includes('DPOY')) &&
            !acc.includes('阵') &&
            !acc.includes('阵容')
        );
        return hasDpoy ? count + 1 : count;
      }, 0);
      const seasonTiers = l.timeline.map((season) => {
        const accolades = season.accolades || [];
        if (accolades.some((acc) => acc.includes('最佳阵容一阵') && !acc.includes('防守'))) return 1;
        if (accolades.some((acc) => acc.includes('最佳阵容二阵') && !acc.includes('防守'))) return 2;
        if (accolades.some((acc) => acc.includes('最佳阵容三阵') && !acc.includes('防守'))) return 3;
        return 0;
      });
      allNbaFirsts = seasonTiers.filter((tier) => tier === 1).length;
      allNbaSeconds = seasonTiers.filter((tier) => tier === 2).length;
      allNbaThirds = seasonTiers.filter((tier) => tier === 3).length;
    }

    return {
      ...l,
      avgPpg: Number(Number(l.avgPpg || 0).toFixed(1)),
      avgRpg: Number(Number(l.avgRpg || 0).toFixed(1)),
      avgApg: Number(Number(l.avgApg || 0).toFixed(1)),
      careerAccolades: {
        ...l.careerAccolades,
        dpoys,
        allNbaFirsts,
        allNbaSeconds,
        allNbaThirds,
      },
      timeline: (l.timeline || []).map((t) => ({
        ...t,
        ppg: Number(Number(t.ppg || 0).toFixed(1)),
        rpg: Number(Number(t.rpg || 0).toFixed(1)),
        apg: Number(Number(t.apg || 0).toFixed(1)),
      })),
    };
  };

  const resetModalScroll = () => scheduleRootScrollToTop();
  const hasLocalRetirement = getHallOfFameLegends(leaderboardGameMode).length > 0;

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen !== false) {
      setTabMode(initialMode);
      setLeaderboardGameMode(initialGameMode);
    }
  }, [isOpen, initialMode, initialGameMode]);

  // Reset scroll position when selecting a legend, returning to list, switching tab, or opening modal
  useEffect(() => {
    if (isOpen !== false) {
      const animationFrame = resetModalScroll();
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [selectedLegend, tabMode, isOpen]);

  // Load legends based on tabMode (local vs global)
  useEffect(() => {
    if (isOpen === false) return;

    let isMounted = true;
    let retryTimer: any = null;
    setSelectedLegend(null);
    setDeleteConfirmTarget(null);
    setShowFullTimelineModal(false);
    setShowFullEpilogueModal(false);

    if (tabMode === 'local') {
      const stored = getHallOfFameLegends(leaderboardGameMode).map(sanitizeLegend);
      setLegends(stored);
      setIsLoadingGlobal(false);
      setIsTimeoutGlobal(false);
      setGlobalError(null);
      setMyGlobalRank(null);
      setMyGlobalRankError(null);
      setLocalSyncNotice(null);
    } else {
      setIsLoadingGlobal(true);
      setIsTimeoutGlobal(false);
      setGlobalError(null);
      setMyGlobalRank(null);
      setMyGlobalRankError(null);

      const loadGlobal = async () => {
        if (!isMounted) return;
        try {
          let records = await loadGlobalHallOfFame(leaderboardGameMode);
          let mine: GlobalHallOfFameRank | null = null;
          let rankError: string | null = null;
          try {
            // Always reconcile the best local retirement first. This covers
            // both new retirements and users discarded by the old top-50-only
            // server rule, even when their previous /me lookup was empty.
            mine = await syncLocalBestAndLoadMyRank(getHallOfFameLegends(leaderboardGameMode), leaderboardGameMode);
            records = await loadGlobalHallOfFame(leaderboardGameMode);
          } catch (error) {
            rankError = error instanceof Error ? error.message : '本地退役记录暂时无法同步';
          }

          if (isMounted) {
            setLegends(records.map(sanitizeLegend));
            setMyGlobalRank(mine);
            setMyGlobalRankError(rankError);
            setIsLoadingGlobal(false);
            setIsTimeoutGlobal(false);
          }
        } catch (err: any) {
          if (!isMounted) return;
          const isTimeout = err?.name === 'GlobalHofTimeoutError' || err?.message?.includes('timed out');
          if (isTimeout) {
            setIsLoadingGlobal(true);
            setIsTimeoutGlobal(true);
            retryTimer = setTimeout(loadGlobal, 3500);
          } else {
            console.error('全网传奇榜加载失败:', err);
            setIsLoadingGlobal(false);
            setIsTimeoutGlobal(false);
            setGlobalError(err?.message || '全网传奇榜暂时不可用，请稍后重试');
          }
        }
      };

      void loadGlobal();
    }

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isOpen, tabMode, globalRefreshVersion, leaderboardGameMode]);

  const handleSyncLocalRetirement = async () => {
    if (isSyncingLocal) return;
    setIsSyncingLocal(true);
    setMyGlobalRankError(null);
    setLocalSyncNotice('正在上传本地最佳退役记录并查询名次…');
    try {
      const mine = await syncLocalBestAndLoadMyRank(getHallOfFameLegends(leaderboardGameMode), leaderboardGameMode);
      setMyGlobalRank(mine);
      setLocalSyncNotice(mine ? `同步成功：当前全网第 ${mine.rank} 名` : '没有找到可同步的本地退役记录');
      const records = await loadGlobalHallOfFame(leaderboardGameMode);
      setLegends(records.map(sanitizeLegend));
    } catch (error) {
      setLocalSyncNotice(null);
      setMyGlobalRankError(error instanceof Error ? error.message : '本地退役记录同步失败，请稍后重试');
    } finally {
      setIsSyncingLocal(false);
    }
  };

  if (isOpen === false) return null;

  // Filter and sort legends
  const filteredLegends = legends.filter(
    (l) =>
      l.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.player.archetype && l.player.archetype.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedLegends = [...filteredLegends].sort((a, b) => b.goatScore - a.goatScore);

  const handleOpenDeleteConfirm = (e: React.MouseEvent, legend: RetiredPlayerRecord) => {
    e.stopPropagation();
    setDeleteConfirmTarget(legend);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    deleteHallOfFameLegend(deleteConfirmTarget.id, leaderboardGameMode);
    const updated = legends.filter((l) => l.id !== deleteConfirmTarget.id);
    setLegends(updated);
    if (selectedLegend?.id === deleteConfirmTarget.id) {
      setSelectedLegend(null);
    }
    setDeleteConfirmTarget(null);
  };

  const handleAddDemoLegend = () => {
    saveHallOfFameLegend(DEMO_KOBE_LEGEND, leaderboardGameMode);
    setLegends(getHallOfFameLegends(leaderboardGameMode));
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-200 p-3 sm:p-6 lg:p-8 flex flex-col selection:bg-amber-500 selection:text-black animate-in fade-in duration-200">
      <div className="max-w-6xl w-full mx-auto space-y-6 flex-1 flex flex-col">
        {/* Top Header Bar - Hidden when viewing details of a selected legend */}
        {!selectedLegend && (
          <header className="p-4 sm:p-6 bg-gradient-to-r from-amber-950/60 via-[#121624] to-[#0b0e17] rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 relative z-10">
              {/* Top Left Return Home Button */}
              {onGoHome && (
                <button
                  type="button"
                  onClick={onGoHome}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-600/10 hover:from-amber-500/35 hover:to-amber-600/25 text-amber-300 hover:text-white font-black text-xs sm:text-sm border border-amber-500/40 transition-all cursor-pointer flex items-center gap-2 shadow-lg active:scale-95 shrink-0"
                  title="返回首页"
                >
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>返回首页</span>
                </button>
              )}

              {onGoHome && <div className="h-6 w-px bg-amber-500/20 hidden sm:block" />}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
                  <div className="w-full h-full bg-[#0d1018] rounded-[10px] flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base sm:text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase tracking-tight flex items-center gap-2">
                    <span>{tabMode === 'global' ? '全网传奇榜' : '个人传奇榜'}</span>
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {tabMode === 'global' ? 'GLOBAL GOAT LEADERBOARD' : 'PERSONAL LEGENDS'}
                    </span>
                  </h1>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {tabMode === 'global'
                      ? '全网玩家云端实时同步，按 GOAT 综合积分排名决出的终极传奇殿堂'
                      : `记录您在此设备上缔造的${GAME_MODE_CONFIG[leaderboardGameMode].name}退役球星荣耀与完整赛季时间线`}
                  </p>
                </div>
              </div>
            </div>

            {/* The entry decides personal/global; this tab only selects the leaderboard's game mode. */}
            <div className="flex items-center gap-2 relative z-10 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 bg-[#0b0e17] p-1 rounded-xl border border-amber-500/20 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setLeaderboardGameMode('classic');
                    resetModalScroll();
                  }}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    leaderboardGameMode === 'classic'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>经典模式</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLeaderboardGameMode('random_trade');
                    resetModalScroll();
                  }}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    leaderboardGameMode === 'random_trade'
                        ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>平行时空</span>
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Page Main Body */}
        <div className="flex-1 space-y-6">
          {selectedLegend ? (
            /* ================= DETAIL VIEW (Mobile H5 / Responsive Optimized) ================= */
            <div className="space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-150">
              {/* Back to List Navigation & Delete Button */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedLegend(null);
                    resetModalScroll();
                  }}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#161c2b] hover:bg-[#20283d] text-amber-400 font-bold text-xs border border-amber-500/30 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>返回历史传奇列表</span>
                </button>

                {tabMode === 'local' && (
                  <button
                    onClick={(e) => handleOpenDeleteConfirm(e, selectedLegend)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
                    title="删除此传奇记录"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>删除纪录</span>
                  </button>
                )}
              </div>

              {/* Legend Hero Banner Card */}
              <div className="p-3.5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#141b2a] to-[#0e1320] border-2 border-amber-500/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 sm:p-1 shadow-xl shrink-0">
                      <div className="w-full h-full bg-[#111624] rounded-[10px] sm:rounded-xl flex items-center justify-center text-xl sm:text-3xl font-black text-amber-400 border border-amber-500/40">
                        🏀
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                        <span className="text-xl sm:text-3xl font-black italic text-white truncate">
                          {selectedLegend.player.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] sm:text-xs font-bold shrink-0">
                          {selectedLegend.player.position} · #{selectedLegend.player.jerseyNum || 24}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-300 font-mono truncate">
                        {selectedLegend.player.archetype || '自建球星'} · {selectedLegend.startYear}-{selectedLegend.endYear}生涯 ({selectedLegend.seasonsPlayed}季)
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] text-slate-400 mt-1 font-mono flex-wrap">
                        <span>退役: <strong className="text-amber-400">{selectedLegend.retireAge}岁</strong></span>
                        <span>•</span>
                        <span>选秀: <strong className="text-amber-400">{selectedLegend.player.draftYear}年#{selectedLegend.player.draftPick}</strong></span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">结算: {selectedLegend.retireDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* GOAT Score & Peak OVR Badge */}
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto mt-1 sm:mt-0 pt-2.5 sm:pt-0 border-t border-amber-500/20 sm:border-t-0">
                    <div className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-center">
                      <span className="text-[9px] sm:text-[10px] text-amber-400 font-mono block uppercase tracking-wider">GOAT 积分</span>
                      <span className="text-base sm:text-xl font-black italic text-amber-300 font-mono">
                        {selectedLegend.goatScore} <span className="text-[10px] sm:text-xs font-normal">分</span>
                      </span>
                    </div>
                    <div className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#1a2233] border border-slate-700 text-center">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono block uppercase tracking-wider">最高综评 OVR</span>
                      <span className="text-base sm:text-xl font-black italic text-white font-mono">
                        {selectedLegend.peakOvr}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Totals & Averages Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#121724] border border-[#232c40] text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">生涯总得分</span>
                  <span className="text-sm sm:text-lg font-black font-mono text-amber-400">
                    {selectedLegend.totalPoints.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-400">分</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">场均 {Number(selectedLegend.avgPpg || 0).toFixed(1)} 分</span>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#121724] border border-[#232c40] text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">生涯总篮板</span>
                  <span className="text-sm sm:text-lg font-black font-mono text-blue-400">
                    {selectedLegend.totalRebounds.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-400">板</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">场均 {Number(selectedLegend.avgRpg || 0).toFixed(1)} 板</span>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#121724] border border-[#232c40] text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">生涯总助攻</span>
                  <span className="text-sm sm:text-lg font-black font-mono text-emerald-400">
                    {selectedLegend.totalAssists.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-400">助</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">场均 {Number(selectedLegend.avgApg || 0).toFixed(1)} 助</span>
                </div>

                <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#121724] border border-[#232c40] text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">生涯出场数</span>
                  <span className="text-sm sm:text-lg font-black font-mono text-purple-400">
                    {selectedLegend.totalGames} <span className="text-[10px] sm:text-xs font-normal text-slate-400">场</span>
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{selectedLegend.seasonsPlayed} 个赛季</span>
                </div>
              </div>

              {/* Section 1: 生涯荣誉汇总 (Accolades Summary) */}
              {(() => {
                const allDefensiveCount =
                  ((selectedLegend.careerAccolades as any)?.allDefensiveFirsts || 0) +
                  ((selectedLegend.careerAccolades as any)?.allDefensiveSeconds || 0) ||
                  (selectedLegend.timeline || []).reduce((count, season) => {
                    const hasDef = (season.accolades || []).some(
                      (acc) =>
                        acc.includes('防守一阵') ||
                        acc.includes('防守二阵') ||
                        acc.includes('防守阵容') ||
                        (acc.includes('最佳防守') && !acc.includes('球员') && !acc.includes('DPOY'))
                    );
                    return hasDef ? count + 1 : count;
                  }, 0);

                return (
                  <div className="space-y-2.5 sm:space-y-3">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>生涯成就与荣誉汇总</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                      <div className="p-2.5 sm:p-3 rounded-xl bg-[#121724] border border-amber-500/30 flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl shrink-0">🏆</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white truncate">{selectedLegend.careerAccolades.championships} 次</div>
                          <div className="text-[9px] sm:text-[10px] text-amber-300 font-mono truncate">联盟 总冠军</div>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-[#121724] border border-amber-500/30 flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl shrink-0">🥇</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white truncate">{selectedLegend.careerAccolades.mvps} 次</div>
                          <div className="text-[9px] sm:text-[10px] text-amber-300 font-mono truncate">常规赛 MVP</div>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-[#121724] border border-amber-500/30 flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl shrink-0">🎖️</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white truncate">{selectedLegend.careerAccolades.fmvps} 次</div>
                          <div className="text-[9px] sm:text-[10px] text-amber-300 font-mono truncate">总决赛 FMVP</div>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-[#121724] border border-amber-500/30 flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl shrink-0">🛡️</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white truncate">{selectedLegend.careerAccolades.dpoys} 次</div>
                          <div className="text-[9px] sm:text-[10px] text-amber-300 font-mono truncate">最佳防守 DPOY</div>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-[#121724] border border-slate-700 flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl shrink-0">🌟</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white truncate">{selectedLegend.careerAccolades.allStarApps} 次</div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">全明星正赛</div>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-[#121724] border border-slate-700 flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl shrink-0">👑</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white truncate">
                            {selectedLegend.careerAccolades.allNbaFirsts + selectedLegend.careerAccolades.allNbaSeconds + selectedLegend.careerAccolades.allNbaThirds} 次
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">最佳阵容</div>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-[#121724] border border-slate-700 flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl shrink-0">🛡️</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white truncate">{allDefensiveCount} 次</div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">最佳防守阵容</div>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-[#121724] border border-slate-700 flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl shrink-0">🎯</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-white truncate">{selectedLegend.careerAccolades.scoringTitles} 次</div>
                          <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">常规赛得分王</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Section 2: 退役球衣汇总 (Simplified: Enlarged Team Logo + Jersey Number below) */}
              {selectedLegend.retiredJerseys && selectedLegend.retiredJerseys.length > 0 && (
                <div className="space-y-2.5 sm:space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>退役球衣汇总 ({selectedLegend.retiredJerseys.length} 支球队)</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3">
                    {selectedLegend.retiredJerseys.map((jersey, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 rounded-2xl bg-[#121724] border border-amber-500/30 flex flex-col items-center justify-center gap-2 relative overflow-hidden hover:border-amber-400/70 transition-all shadow-lg group"
                      >
                        {/* 球队 Logo (放大显示) */}
                        <TeamLogo teamId={jersey.teamId} className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg group-hover:scale-105 transition-transform" />
                        {/* 下方球衣号码 */}
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black font-mono text-xs sm:text-sm shadow-sm">
                          #{jersey.jerseyNum || selectedLegend.player.jerseyNum}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: 赛季时间线 (Season Timeline in Visual Timeline Style with Gold Border for Champion Seasons) */}
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>职业生涯赛季时间线</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    展示前 {Math.min(3, selectedLegend.timeline.length)} 季 / 共 {selectedLegend.timeline.length} 季
                  </span>
                </div>

                {/* Sleek Season Timeline Cards */}
                <div className="space-y-3">
                  {selectedLegend.timeline.slice(0, 3).map((item, idx) => {
                    const isChampion = item.accolades && item.accolades.some((acc) => acc.includes('冠军') || acc.includes('Champion'));

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 sm:p-4 rounded-2xl transition-all relative overflow-hidden ${
                          isChampion
                            ? 'border border-amber-500/20 shadow-[inset_0_0_18px_rgba(245,158,11,0.14)] bg-gradient-to-r from-amber-950/20 via-[#131826] to-[#101420]'
                            : 'border border-slate-800/90 bg-[#111622] hover:border-slate-700/80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Left: Year Badge & Team Stats */}
                          <div className="flex items-center gap-3">
                            <TeamLogo teamId={item.teamId} className="w-8 h-8 object-contain shrink-0" />

                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] sm:text-xs text-slate-300 font-mono mt-1">
                                <div className="mb-1">
                                  <span><strong className="text-white">{item.wins}胜-{item.losses}负</strong></span>
                                  <span className="text-slate-600">•</span>
                                    <span className="text-[11px] sm:text-xs font-mono text-slate-400">({item.seasonStr})</span>
                                </div>
                                <div>
                                  <span><strong className="text-amber-400">{Number(item.ppg || 0).toFixed(1)}分 {Number(item.rpg || 0).toFixed(1)}板 {Number(item.apg || 0).toFixed(1)}助</strong></span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Accolades Pills */}
                          {item.accolades && item.accolades.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
                              {item.accolades.map((acc, aIdx) => (
                                <span
                                  key={aIdx}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                                    acc.includes('冠军') || acc.includes('MVP')
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                      : 'bg-slate-800/90 text-slate-300 border border-slate-700/80'
                                  }`}
                                >
                                  {acc}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View Full Timeline Button */}
                {selectedLegend.timeline.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowFullTimelineModal(true)}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-[#161f33] via-[#1d2840] to-[#161f33] hover:from-amber-500/20 hover:via-amber-500/30 hover:to-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] group mt-2"
                  >
                    <Calendar className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span>查看完整赛季时间线 (共 {selectedLegend.timeline.length} 赛季)</span>
                    <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                )}
              </div>

              {/* Section 4: Epilogue Story (Preview) */}
              {false && selectedLegend.epilogueStory && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#121724] border border-amber-500/30 space-y-2.5 sm:space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>离开赛场后的退役后日谈</span>
                    </h3>
                    <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                      纪实篇章
                    </span>
                  </div>

                  {/* Preview snippet with subtle gradient clamp */}
                  <div className="relative">
                    <p className="text-xs text-slate-300 leading-relaxed font-serif line-clamp-3">
                      {selectedLegend.epilogueStory.replace(/[\*\_]/g, '').replace(/###\s*/g, '')}
                    </p>
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#121724] to-transparent pointer-events-none" />
                  </div>

                  {/* View Full Epilogue Button */}
                  <button
                    type="button"
                    onClick={() => setShowFullEpilogueModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 hover:from-amber-500/30 hover:to-amber-500/35 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] group mt-1"
                  >
                    <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span>查看完整后日谈</span>
                    <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ================= LIST VIEW ================= */
            <div className="space-y-5">
              {tabMode === 'global' && !isLoadingGlobal && !globalError && (
                <section className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/35 via-[#171b28] to-[#111522] p-4 shadow-xl" aria-label="我的全网排名">
                  <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
                        <UserCheck className="h-3.5 w-3.5" /> 我的全网排名
                      </div>
                      {myGlobalRank ? (
                        <>
                          <div className="mt-1 truncate text-sm font-black text-white">{myGlobalRank.displayName}</div>
                          <div className="mt-0.5 text-[11px] text-slate-400">榜单仅展示前50名，但所有玩家成绩都会参与排名</div>
                        </>
                      ) : (
                        <div className="mt-1 space-y-2">
                          <div className={`text-xs ${myGlobalRankError ? 'text-red-300' : localSyncNotice ? 'text-emerald-300' : 'text-slate-400'}`}>
                            {myGlobalRankError || localSyncNotice || (hasLocalRetirement
                              ? '已检测到本地退役记录，正在等待全网名次同步'
                              : '完成一次正式退役后即可参与全网排名')}
                          </div>
                          {hasLocalRetirement && (
                            <button
                              type="button"
                              onClick={() => void handleSyncLocalRetirement()}
                              disabled={isSyncingLocal}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-wait disabled:opacity-60"
                            >
                              {isSyncingLocal ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                              {isSyncingLocal ? '同步中…' : myGlobalRankError ? '重新同步本地退役记录' : '立即同步本地退役记录'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-2xl font-black italic text-amber-300">
                        {myGlobalRank ? `#${myGlobalRank.rank}` : '--'}
                      </div>
                      {myGlobalRank && <div className="font-mono text-[10px] font-bold text-slate-400">{myGlobalRank.score} GOAT分</div>}
                    </div>
                  </div>
                </section>
              )}

              {/* Legends List Grid */}
              {isLoadingGlobal ? (
                <div className="p-8 sm:p-12 rounded-2xl bg-[#111522] border border-amber-500/30 text-center space-y-3.5 my-4 flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
                  <div className="relative">
                    <Loader2 className="w-9 h-9 text-amber-400 animate-spin" />
                    {isTimeoutGlobal && (
                      <Clock className="w-4 h-4 text-amber-300 absolute -bottom-1 -right-1 animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-200 font-mono font-bold">
                      {isTimeoutGlobal
                        ? '全网传奇榜接口请求超时，正在持续保持加载状态并自动重试中...'
                        : '正在连接云端服务器，同步全网 GOAT 殿堂记录...'}
                    </p>
                    {isTimeoutGlobal && (
                      <p className="text-[11px] text-amber-400/80 font-mono">
                        系统已开启自动重连守护，获取成功后将实时呈现
                      </p>
                    )}
                  </div>
                </div>
              ) : globalError && tabMode === 'global' ? (
                <div className="p-8 sm:p-12 rounded-2xl bg-[#111522] border border-red-400/30 text-center space-y-4 my-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-400/30 mx-auto flex items-center justify-center text-3xl">⚠️</div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-base font-bold text-white">全网传奇榜暂时无法加载</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">{globalError}</p>
                  </div>
                  <button type="button" onClick={() => setGlobalRefreshVersion((version) => version + 1)} className="mx-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />重新加载
                  </button>
                </div>
              ) : sortedLegends.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
                  {sortedLegends.map((legend, index) => (
                    <div
                      key={legend.id}
                      onClick={() => {
                        setSelectedLegend(legend);
                        resetModalScroll();
                      }}
                      className={`p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-[#121624] via-[#161d2e] to-[#121624] border border-[#232c42] hover:border-amber-500/60 transition-all cursor-pointer shadow-xl relative group overflow-hidden ${leaderboardGameMode === 'random_trade' ? 'pt-10 sm:pt-10' : ''}`}
                    >
                      {leaderboardGameMode === 'random_trade' && (
                        <span className="absolute right-3 top-2.5 inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-2 py-1 text-[9px] font-black text-cyan-200">
                          <Sparkles className="h-3 w-3" />平行时空
                        </span>
                      )}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        {/* Left: Rank, Name, Career Years */}
                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                          {/* Rank Badge */}
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black font-mono text-xs sm:text-sm shrink-0 border ${
                            index === 0
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black border-amber-300 shadow-lg shadow-amber-500/20'
                              : index === 1
                              ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black border-slate-200'
                              : index === 2
                              ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200 border-amber-600'
                              : 'bg-[#1a2233] text-slate-400 border-slate-700'
                          }`}>
                            #{index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {tabMode === 'local' ? (
                                <span className="text-base sm:text-lg font-black text-amber-300 italic font-mono truncate">
                                  {legend.goatScore} <span className="text-xs sm:text-sm not-italic">GOAT分</span>
                                </span>
                              ) : (
                                <span className="text-base sm:text-lg font-black text-white italic truncate">
                                  {legend.player.name}
                                </span>
                              )}
                              <span className="hidden sm:inline-block text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                {legend.player.position}
                              </span>
                            </div>
                            {/* 职业生涯 (哪一年到哪一年) */}
                            <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                              {legend.startYear}-{legend.endYear} 职业生涯
                              <span className="hidden sm:inline"> ({legend.seasonsPlayed} 赛季) · {legend.retireAge} 岁退役</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: GOAT Score, View Details & Delete Action Buttons */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                          {/* Trophy Summary (Hidden on Mobile) */}
                          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-[#0d111a] px-3 py-1.5 rounded-xl border border-[#232a3a]">
                            <span>🏆 {legend.careerAccolades.championships} 冠</span>
                            <span>·</span>
                            <span>🥇 {legend.careerAccolades.mvps} MVP</span>
                            <span>·</span>
                            <span>🎖️ {legend.careerAccolades.fmvps} FMVP</span>
                          </div>

                          {tabMode === 'local' ? (
                            <div className="px-2.5 py-1.5 rounded-xl bg-[#0d111a] border border-[#2b3448] text-slate-300 font-mono font-bold text-[11px] sm:text-xs shrink-0">
                              {formatLocalDateTime(legend.retireDate)}
                            </div>
                          ) : (
                            <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-black text-xs sm:text-sm shrink-0">
                              {legend.goatScore} <span className="text-[10px] sm:text-xs">GOAT分</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* 查看详情按钮 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLegend(legend);
                                resetModalScroll();
                              }}
                              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1 text-xs font-bold font-mono active:scale-95"
                            >
                              <span>查看详情</span>
                            </button>

                            {/* 删除按钮 (仅限个人传奇榜) */}
                            {tabMode === 'local' && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenDeleteConfirm(e, legend)}
                                className="px-2.5 py-1.5 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1 text-xs font-bold font-mono active:scale-95"
                                title="删除存档记录"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">删除</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="p-8 sm:p-12 rounded-2xl bg-[#111522] border border-[#232c42] text-center space-y-4 my-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-3xl">
                    {tabMode === 'global' ? '🌐' : '🏛️'}
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-base font-bold text-white">
                      {tabMode === 'global' ? '暂无全网退役球星记录' : '暂无本地退役球星记录'}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      {tabMode === 'global'
                        ? '云端全网传奇榜暂无退役球星记录。当您或全网其他玩家在游戏内完成【正式退役】后，生涯荣耀将自动同步上传至此处！'
                        : '当您在游戏内完成赛季并选择【正式退役】后，该球星的整个职业生涯、退役球衣及历史时间线将自动保存至本榜单！'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#121624] border border-red-500/40 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 shrink-0">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">确认删除传奇记录</h3>
                <p className="text-[11px] text-slate-400 font-mono">此操作无法撤销</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#0d101a] p-3 rounded-xl border border-slate-800">
              确定要从本地历史传奇榜中移除球星【<strong className="text-amber-300">{deleteConfirmTarget.player.name}</strong>】（{deleteConfirmTarget.startYear}-{deleteConfirmTarget.endYear}）的整个生涯荣耀与时间线记录吗？
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl bg-[#1a2233] hover:bg-[#222b40] text-slate-300 font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Full Timeline Modal */}
      {showFullTimelineModal && selectedLegend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-[#0e1320] border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col max-h-[85vh] space-y-4 text-slate-200 relative ring-1 ring-amber-500/30">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg font-bold shrink-0">
                  🗓️
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white italic flex items-center gap-2">
                    <span>{selectedLegend.player.name} · 职业生涯</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedLegend.startYear}-{selectedLegend.endYear}赛季 · 共{selectedLegend.timeline.length}载征程
                  </p>
                </div>
              </div>
            </div>

            {/* Content List - Sleek Self-Contained Cards */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {selectedLegend.timeline.map((item, idx) => {
                const isChampion = item.accolades && item.accolades.some((acc) => acc.includes('冠军') || acc.includes('Champion'));

                return (
                  <div
                    key={idx}
                    className={`p-3.5 sm:p-4 rounded-2xl transition-all relative overflow-hidden ${
                      isChampion
                        ? 'border border-amber-500/20 shadow-[inset_0_0_18px_rgba(245,158,11,0.14)] bg-gradient-to-r from-amber-950/20 via-[#131929] to-[#101420]'
                        : 'border border-slate-800/90 bg-[#131929] hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Year Badge & Team Stats */}
                      <div className="flex items-center gap-3">
                        <TeamLogo teamId={item.teamId} className="w-8 h-8 object-contain shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] sm:text-xs text-slate-300 font-mono mt-1">
                            <div className="mb-1">
                              <span><strong className="text-white">{item.wins}胜-{item.losses}负</strong></span>
                              <span className="text-slate-600">•</span>
                              <span className="text-[11px] sm:text-xs font-mono text-slate-400">({item.seasonStr})</span>
                            </div>
                            <div>
                              <span><strong className="text-amber-400">{Number(item.ppg || 0).toFixed(1)}分 {Number(item.rpg || 0).toFixed(1)}板 {Number(item.apg || 0).toFixed(1)}助</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Accolades Pills */}
                      {item.accolades && item.accolades.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
                          {item.accolades.map((acc, aIdx) => (
                            <span
                              key={aIdx}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                                acc.includes('冠军') || acc.includes('MVP')
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                  : 'bg-slate-800/90 text-slate-300 border border-slate-700/80'
                              }`}
                            >
                              {acc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullTimelineModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Full Epilogue Story Modal */}
      {false && showFullEpilogueModal && selectedLegend && selectedLegend.epilogueStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-[#0d1220] border-2 border-amber-500/50 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col max-h-[85vh] space-y-4 text-slate-200 relative ring-1 ring-amber-500/30">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg font-bold shrink-0">
                  📖
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 italic flex items-center gap-2">
                    <span>{selectedLegend.player.name} · 退役后日谈</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedLegend.endYear} 年退役
                  </p>
                </div>
              </div>
            </div>

            {/* Chapters Body */}
            <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {selectedLegend.epilogueStory.split(/(?=###\s*)/g).map((sec, idx) => {
                const trimmed = sec.trim();
                if (!trimmed) return null;

                const lines = trimmed.split('\n').filter(Boolean);
                const firstLine = lines[0] || '';
                const isHeader = firstLine.startsWith('###');

                if (isHeader) {
                  const headerTitle = firstLine.replace(/^###\s*/, '').replace(/[\*\_]/g, '');
                  const bodyLines = lines.slice(1).join('\n').replace(/[\*\_]/g, '');

                  let icon = '📖';
                  if (headerTitle.includes('第一章') || headerTitle.includes('告别') || headerTitle.includes('挂靴')) icon = '🎬';
                  else if (headerTitle.includes('第二章') || headerTitle.includes('新的人生') || headerTitle.includes('赛道')) icon = '👔';
                  else if (headerTitle.includes('第三章') || headerTitle.includes('场外故事') || headerTitle.includes('传承')) icon = '🏀';
                  else if (headerTitle.includes('第四章') || headerTitle.includes('传奇') || headerTitle.includes('烙印')) icon = '🏛️';

                  return (
                    <div key={idx} className="bg-[#131929] border border-amber-500/20 p-4 rounded-xl sm:rounded-2xl space-y-2 shadow-md">
                      <h4 className="text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 border-b border-amber-500/10 pb-2">
                        <span className="text-base">{icon}</span>
                        <span>{headerTitle}</span>
                      </h4>
                      <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-serif whitespace-pre-line text-justify indent-4">
                        {bodyLines}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="bg-[#131929] border border-slate-800 p-3.5 rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed font-serif whitespace-pre-line">
                    {trimmed.replace(/[\*\_]/g, '')}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullEpilogueModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
