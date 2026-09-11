import React, { useState, useEffect, useRef } from 'react';
import { GameState, Team, MatchRosterStats, SingleGamePlayerStats, ScheduleItem, PlayerProfile } from '../types';
import { Play, Pause, FastForward, TrendingUp, HeartHandshake, Calendar, ChevronRight, ChevronDown, ChevronUp, X, Trophy, Sparkles } from 'lucide-react';
import { getCompleteTeamRoster, generateFullMatchRosterStats, calculateMatchScores } from '../utils/leagueLogic';
import { ContractOffer } from '../utils/contractLogic';
import { TeamLogo } from './TeamLogo';
import { SeasonScheduleTicker } from './SeasonScheduleTicker';
import { PlayoffPanel } from './PlayoffPanel';
import { SeasonSummaryModal } from './SeasonSummaryModal';
import { OffseasonDashboard } from './OffseasonDashboard';

const AUTO_SIM_GAME_DELAY_MS = 150;

interface SeasonDashboardProps {
  gameState: GameState;
  currentTeam: Team;
  oppTeam: Team;
  usedEventIds?: Set<string>;
  offseasonMonth?: number;
  offseasonCompletedPlans?: Record<number, { id: string; title: string; desc: string }>;
  offseasonEventMonths?: number[];
  offseasonPhase?: 'draft' | 'contract' | 'training';
  isDraftCompleted?: boolean;
  isContractCompleted?: boolean;
  contractStep?: 'decision' | 'renewal_offer' | 'free_agency';
  renewalOffer?: ContractOffer | null;
  freeAgencyOffers?: ContractOffer[];
  onSetOffseasonPhase?: (phase: 'draft' | 'contract' | 'training') => void;
  onSetIsDraftCompleted?: (completed: boolean) => void;
  onSetIsContractCompleted?: (completed: boolean) => void;
  onSetContractStep?: (step: 'decision' | 'renewal_offer' | 'free_agency') => void;
  onSetRenewalOffer?: (offer: ContractOffer | null) => void;
  onSetFreeAgencyOffers?: (offers: ContractOffer[]) => void;
  onStartMatch: (isInteractive: boolean) => void;
  onWorkout: () => void;
  onRest: () => void;
  onAdvanceWeek: () => void;
  onEnterPlayoffs?: () => void;
  onEnterOffseason?: (championTeam?: Team, fmvpName?: string) => void;
  onNextSeason?: () => void;
  onUpdatePlayer?: (player: PlayerProfile) => void;
  onUpdateTeams?: (teams: Team[]) => void;
  onSetOffseasonMonth?: (month: number) => void;
  onSetOffseasonCompletedPlans?: (plans: Record<number, { id: string; title: string; desc: string }>) => void;
  onAddUsedEventId?: (id: string) => void;
  onSignContract?: (newTeamId: string, salaryPerYear: number, totalYears: number) => void;
  onViewSeasonTrades?: () => void;
  hasActiveMilestoneModal?: boolean;
  isSettingsOpen?: boolean;
}

export const SeasonDashboard: React.FC<SeasonDashboardProps> = ({
  gameState,
  currentTeam,
  oppTeam,
  usedEventIds,
  offseasonMonth,
  offseasonCompletedPlans,
  offseasonEventMonths,
  offseasonPhase,
  isDraftCompleted,
  isContractCompleted,
  contractStep,
  renewalOffer,
  freeAgencyOffers,
  onSetOffseasonPhase,
  onSetIsDraftCompleted,
  onSetIsContractCompleted,
  onSetContractStep,
  onSetRenewalOffer,
  onSetFreeAgencyOffers,
  onStartMatch,
  onEnterPlayoffs,
  onEnterOffseason,
  onNextSeason,
  onUpdatePlayer,
  onUpdateTeams,
  onSetOffseasonMonth,
  onSetOffseasonCompletedPlans,
  onAddUsedEventId,
  onSignContract,
  onViewSeasonTrades,
  hasActiveMilestoneModal,
  isSettingsOpen = false,
}) => {
  const { player, currentGame = 1, isPlayoffs, schedule = [], currentYear = 2008, teams = [], phase } = gameState;
  const currentMatchInfo = schedule.find((s) => (s as any).gameNumber === currentGame || s.week === currentGame) || schedule[0];

  const [selectedMatchForModal, setSelectedMatchForModal] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<'position' | 'points'>('position');
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [showSeasonSummaryModal, setShowSeasonSummaryModal] = useState(false);
  const [isRecentGamesExpandedMobile, setIsRecentGamesExpandedMobile] = useState(false);

  const autoSimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If milestone modal pops up during auto simulation, pause immediately
  useEffect(() => {
    if (hasActiveMilestoneModal && isAutoSimulating) {
      setIsAutoSimulating(false);
    }
  }, [hasActiveMilestoneModal, isAutoSimulating]);

  // Opening settings must always pause the regular-season simulation.
  useEffect(() => {
    if (isSettingsOpen && isAutoSimulating) {
      setIsAutoSimulating(false);
    }
  }, [isSettingsOpen, isAutoSimulating]);

  // Auto-simulation timer loop for regular season
  useEffect(() => {
    const playedCount = schedule.filter((s) => s.isPlayed).length;
    if (isAutoSimulating && !hasActiveMilestoneModal && currentGame <= 82 && playedCount < 82 && !isPlayoffs && phase === 'regular_season') {
      // Schedule one game at a time so simulations cannot overlap or starve
      // higher-priority taps. The next game is scheduled after this render.
      autoSimTimerRef.current = setTimeout(() => {
        React.startTransition(() => onStartMatch(false));
      }, AUTO_SIM_GAME_DELAY_MS);
    } else {
      if (autoSimTimerRef.current) clearTimeout(autoSimTimerRef.current);
      if (isAutoSimulating && playedCount >= 82) {
        setIsAutoSimulating(false);
      }
    }

    return () => {
      if (autoSimTimerRef.current) clearTimeout(autoSimTimerRef.current);
    };
  }, [isAutoSimulating, hasActiveMilestoneModal, currentGame, isPlayoffs, phase, onStartMatch, schedule]);

  // Regular season finished -> Pause auto-sim & show Season Summary Modal
  useEffect(() => {
    if (phase !== 'regular_season') {
      setShowSeasonSummaryModal(false);
      return;
    }

    const playedCount = schedule.filter((s) => s.isPlayed).length;
    const isSeasonFinished = playedCount >= 82;
    if (isSeasonFinished && !isPlayoffs) {
      setIsAutoSimulating(false);
      setShowSeasonSummaryModal(true);
    } else {
      setShowSeasonSummaryModal(false);
    }
  }, [schedule, isPlayoffs, phase]);

  const toggleAutoSim = () => {
    setIsAutoSimulating((prev) => !prev);
  };

  const isInjured = player.health.status === 'injured';
  const seasonIndex = currentYear - 2007;
  const seasonStr = `${currentYear}-${(currentYear + 1).toString().slice(-2)} 赛季`;

  // Render Offseason Dashboard if in Offseason phase
  if (phase === 'offseason') {
    return (
      <OffseasonDashboard
        player={player}
        currentTeam={currentTeam}
        teams={teams}
        currentYear={currentYear}
        offseasonMonth={offseasonMonth || 1}
        offseasonCompletedPlans={offseasonCompletedPlans || {}}
        offseasonEventMonths={offseasonEventMonths || [1, 3]}
        usedEventIds={usedEventIds || new Set()}
        offseasonPhase={offseasonPhase || 'draft'}
        isDraftCompleted={isDraftCompleted || false}
        isContractCompleted={isContractCompleted || false}
        contractStep={contractStep || 'decision'}
        renewalOffer={renewalOffer || null}
        freeAgencyOffers={freeAgencyOffers || []}
        onSetOffseasonPhase={onSetOffseasonPhase || (() => {})}
        onSetIsDraftCompleted={onSetIsDraftCompleted || (() => {})}
        onSetIsContractCompleted={onSetIsContractCompleted || (() => {})}
        onSetContractStep={onSetContractStep || (() => {})}
        onSetRenewalOffer={onSetRenewalOffer || (() => {})}
        onSetFreeAgencyOffers={onSetFreeAgencyOffers || (() => {})}
        onUpdatePlayer={onUpdatePlayer || (() => {})}
        onUpdateTeams={onUpdateTeams}
        onSetOffseasonMonth={onSetOffseasonMonth || (() => {})}
        onSetOffseasonCompletedPlans={onSetOffseasonCompletedPlans || (() => {})}
        onAddUsedEventId={onAddUsedEventId || (() => {})}
        onNextSeason={() => {
          if (onNextSeason) onNextSeason();
        }}
        onSignContract={onSignContract || (() => {})}
      />
    );
  }

  // Render Playoff Panel if in Playoff mode
  if (isPlayoffs) {
    return (
      <PlayoffPanel
        userTeam={currentTeam}
        teams={teams}
        player={player}
        currentYear={currentYear}
        onStartInteractiveMatch={() => onStartMatch(true)}
        onFinishPlayoffs={(championTeam, fmvpName) => {
          if (onEnterOffseason) {
            onEnterOffseason(championTeam, fmvpName);
          } else if (onNextSeason) {
            onNextSeason();
          }
        }}
      />
    );
  }

  // Synchronized calculation of assigned minutes, dynamic role, and projected stats via Team Roster
  const { roster: userTeamRoster, userMinutes: assignedMinutes, userRole: currentRole } = getCompleteTeamRoster(
    currentTeam,
    player,
    seasonIndex
  );
  const userRosterEntry = userTeamRoster.find((r) => r.isUser);
  const projStats = userRosterEntry?.stats || { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, fgPct: 45.0, mpg: assignedMinutes };

  // Stats averages (when gp === 0, display 0.0)
  const stats = player.seasonStats;
  const gp = stats.games || 0;
  const ppg = gp > 0 ? (stats.pts / gp).toFixed(1) : '0.0';
  const rpg = gp > 0 ? (stats.reb / gp).toFixed(1) : '0.0';
  const apg = gp > 0 ? (stats.ast / gp).toFixed(1) : '0.0';
  const spg = gp > 0 ? (stats.stl / gp).toFixed(1) : '0.0';
  const bpg = gp > 0 ? (stats.blk / gp).toFixed(1) : '0.0';
  const mpg = gp > 0 ? (stats.minutes / gp).toFixed(1) : '0.0';
  const tov = gp > 0 && stats.turnovers ? (stats.turnovers / gp).toFixed(1) : '0.0';

  const fgPct = stats.fga > 0 ? ((stats.fgm / stats.fga) * 100).toFixed(1) : '0.0';
  const tpPct = stats.tpa > 0 ? ((stats.tpm / stats.tpa) * 100).toFixed(1) : '0.0';
  const ftPct = stats.fta > 0 ? ((stats.ftm / stats.fta) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* 1. 82-Game Schedule Horizontal Ticker Bar */}
      <SeasonScheduleTicker
        schedule={schedule as ScheduleItem[]}
        currentGame={currentGame}
        userTeam={currentTeam}
        teams={teams}
        onSelectMatch={(m, opp) => setSelectedMatchForModal({ match: m, userTeam: currentTeam, oppTeam: opp })}
      />

      {/* Next Game Match Banner */}
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-6 relative z-10">
          {/* Home Team */}
          <div className="flex items-center gap-2 sm:gap-4 text-left min-w-0 flex-1">
            <div
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg border border-white/10 p-1 bg-[#0d1017] shrink-0"
              style={{ borderColor: currentTeam.primaryColor }}
            >
              <TeamLogo
                logo={currentTeam.logo}
                abbrev={currentTeam.abbrev}
                primaryColor={currentTeam.primaryColor}
                secondaryColor={currentTeam.secondaryColor}
                className="w-7 h-7 sm:w-11 sm:h-11 object-contain"
                alt={currentTeam.name}
              />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold block truncate">
                <span className="hidden sm:inline">主队</span>
                <span className="sm:hidden">主队</span>
              </span>
              <h3 className="text-xs sm:text-lg font-black italic uppercase text-white tracking-tight truncate">
                <span className="hidden sm:inline">{currentTeam.name}</span>
                <span className="sm:hidden">{currentTeam.abbrev}</span>
              </h3>
              <p className="text-[9px] sm:text-xs text-amber-400 font-mono font-bold truncate">
                {currentTeam.wins}胜{currentTeam.losses}负
                <span className="hidden sm:inline"> · OVR {currentTeam.rating}</span>
              </p>
            </div>
          </div>

          {/* Match Status Badge */}
          <div className="text-center px-1 sm:px-4 flex flex-col items-center shrink-0">
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded border border-amber-500/30 whitespace-nowrap">
              <span className="hidden sm:inline">{`${seasonStr} · `}</span>
              第 {currentGame}/82 场
            </span>
            <div className="text-sm sm:text-2xl font-black italic text-white my-0.5 sm:mt-1">VS</div>
            <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {currentMatchInfo?.isHome ? '主场' : '客场'}
            </span>
            {onViewSeasonTrades && (
              <button
                onClick={onViewSeasonTrades}
                className="mt-1 sm:mt-2 inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                <span>查看赛季变动</span>
              </button>
            )}
          </div>

          {/* Opponent Team */}
          <div className="flex items-center gap-2 sm:gap-4 text-right flex-row-reverse min-w-0 flex-1">
            <div
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg border border-white/10 p-1 bg-[#0d1017] shrink-0"
              style={{ borderColor: oppTeam.primaryColor }}
            >
              <TeamLogo
                logo={oppTeam.logo}
                abbrev={oppTeam.abbrev}
                primaryColor={oppTeam.primaryColor}
                secondaryColor={oppTeam.secondaryColor}
                className="w-7 h-7 sm:w-11 sm:h-11 object-contain"
                alt={oppTeam.name}
              />
            </div>
            <div className="text-right min-w-0">
              <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold block truncate">
                <span className="hidden sm:inline">对手</span>
                <span className="sm:hidden">对手</span>
              </span>
              <h3 className="text-xs sm:text-lg font-black italic uppercase text-white tracking-tight truncate">
                <span className="hidden sm:inline">{oppTeam.name}</span>
                <span className="sm:hidden">{oppTeam.abbrev}</span>
              </h3>
              <p className="text-[9px] sm:text-xs text-cyan-400 font-mono font-bold truncate">
                {oppTeam.wins}胜{oppTeam.losses}负
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-3 sm:mt-5 pt-3 sm:pt-5 border-t border-[#232834]">
          {schedule.filter((s) => s.isPlayed).length >= 82 || currentGame > 82 ? (
            <button
              type="button"
              onClick={() => setShowSeasonSummaryModal(true)}
              className="w-full justify-center px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black italic rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-tight shadow-xl shadow-amber-500/20 cursor-pointer animate-pulse"
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 fill-black shrink-0" />
              <span>常规赛已结束 · 点击查看荣誉并进入季后赛</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => onStartMatch(true)}
                disabled={isInjured || isAutoSimulating}
                className="w-full justify-center px-2 sm:px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black italic rounded-xl transition-all flex items-center gap-1.5 text-xs uppercase tracking-tight shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black shrink-0" />
                <span>亲自出战</span>
              </button>

              {/* Auto-Simulation Play / Pause Toggle Button */}
              <button
                type="button"
                onClick={toggleAutoSim}
                disabled={isInjured || currentGame > 82}
                className={`w-full justify-center px-2 sm:px-4 py-2.5 font-bold rounded-xl border transition-all flex items-center gap-1.5 text-xs uppercase ${
                  isAutoSimulating
                    ? 'bg-rose-500 hover:bg-rose-400 text-white border-rose-500 shadow-lg shadow-rose-500/20 animate-pulse'
                    : 'bg-[#0d1017] hover:bg-[#181d29] text-slate-200 border-[#232834]'
                }`}
              >
                {isAutoSimulating ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-white fill-current shrink-0" /> 暂停模拟
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" /> 开始模拟
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unified Season Stats & Tactical Rotation Panel */}
      <div className="space-y-3 sm:space-y-4">
        {/* Season Detailed Stats */}
        <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-[#232834] pb-2.5 sm:pb-3">
            <h4 className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">{seasonStr}场均全能数据统计</span>
              <span className="sm:hidden">赛季场均数据</span>
            </h4>
            <span className="text-[10px] sm:text-[11px] font-mono text-amber-400 font-bold shrink-0">
              已出战 {gp} 场
            </span>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 text-center">
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-bold block">得分</span>
              <span className="text-base sm:text-xl font-black text-amber-400 font-mono italic">{ppg}</span>
            </div>
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-bold block">篮板</span>
              <span className="text-base sm:text-xl font-black text-blue-400 font-mono italic">{rpg}</span>
            </div>
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-bold block">助攻</span>
              <span className="text-base sm:text-xl font-black text-emerald-400 font-mono italic">{apg}</span>
            </div>
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-bold block">抢断</span>
              <span className="text-base sm:text-xl font-black text-purple-400 font-mono italic">{spg}</span>
            </div>
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-bold block">盖帽</span>
              <span className="text-base sm:text-xl font-black text-cyan-400 font-mono italic">{bpg}</span>
            </div>
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-bold block">时间</span>
              <span className="text-base sm:text-xl font-black text-slate-200 font-mono italic">{gp > 0 ? mpg : assignedMinutes}m</span>
            </div>
          </div>

          {/* Advanced Shooting & Turnover Efficiency */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center pt-1">
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block">投篮</span>
              <span className="text-sm sm:text-lg font-black text-amber-300 font-mono">{fgPct}%</span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 block font-mono">({stats.fgm}/{stats.fga})</span>
            </div>
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block">三分</span>
              <span className="text-sm sm:text-lg font-black text-emerald-300 font-mono">{tpPct}%</span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 block font-mono">({stats.tpm}/{stats.tpa})</span>
            </div>
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block">罚球</span>
              <span className="text-sm sm:text-lg font-black text-cyan-300 font-mono">{ftPct}%</span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 block font-mono">({stats.ftm}/{stats.fta})</span>
            </div>
            <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834]">
              <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block">失误</span>
              <span className="text-sm sm:text-lg font-black text-red-400 font-mono">{tov}</span>
              <span className="hidden sm:block text-[8px] sm:text-[9px] text-slate-500 font-mono">控制良好</span>
            </div>
          </div>
        </div>
      </div>

      {/* 赛事中心最下方：最近 5 场比赛数据列表 */}
      {(() => {
        const userTeamId = currentTeam.id;
        const playedSchedule = (schedule || []).filter((s) => s.isPlayed);
        const listToShow = playedSchedule.slice(-5).reverse();

        if (listToShow.length === 0) {
          return (
            <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-4 sm:p-6 shadow-2xl space-y-3 mt-4 sm:mt-6 animate-fadeIn text-center">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-black italic uppercase text-white">最近 5 场比赛</h3>
              </div>
              <div className="py-4 sm:py-6 bg-[#0d1017] rounded-xl border border-[#232834] text-slate-400 text-xs">
                <p className="font-bold text-slate-300">🏀 赛季初开打中 · 暂无比赛记录</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">开始常规赛模拟或亲自出战后，这里将实时呈现单场数据单</p>
              </div>
            </div>
          );
        }

        return (
          <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 mt-4 sm:mt-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#232834] pb-2.5 sm:pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <h3 className="text-xs sm:text-base font-black italic uppercase text-white">
                  <span className="hidden sm:inline">最近 5 场比赛数据列表</span>
                  <span className="sm:hidden">最近 5 场比赛</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-slate-400 font-mono">
                  点击任意比赛查看完整单场高精球员数据
                </span>
                <button
                  type="button"
                  onClick={() => setIsRecentGamesExpandedMobile((prev) => !prev)}
                  className="sm:hidden flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg active:scale-95 transition-all"
                >
                  <span>{isRecentGamesExpandedMobile ? '折叠列表' : '展开列表'}</span>
                  {isRecentGamesExpandedMobile ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Mobile Compact View (Default when folded on mobile) */}
            {!isRecentGamesExpandedMobile && (
              <div className="sm:hidden space-y-2">
                <div className="grid grid-cols-5 gap-1.5">
                  {listToShow.map((m, idx) => {
                    const opponentTeam = teams.find((t) => t.id === m.opponentId) || oppTeam;
                    const isUserWin = m.userWon ?? (m.userScore! > m.oppScore!);
                    const userScore = m.userScore ?? 100;
                    const oppScore = m.oppScore ?? 90;

                    return (
                      <button
                        key={`recent-game-compact-${m.week || idx}-${idx}`}
                        type="button"
                        onClick={() => setSelectedMatchForModal({ match: m, userTeam: currentTeam, oppTeam: opponentTeam })}
                        className={`p-1.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all active:scale-95 shadow-sm ${
                          isUserWin
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded font-mono ${isUserWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {isUserWin ? '胜' : '负'}
                        </span>
                        <TeamLogo
                          logo={opponentTeam.logo}
                          abbrev={opponentTeam.abbrev}
                          primaryColor={opponentTeam.primaryColor}
                          secondaryColor={opponentTeam.secondaryColor}
                          className="w-5 h-5 object-contain my-1 drop-shadow"
                        />
                        <span className="text-[9px] font-mono font-black text-amber-300 leading-none">
                          {userScore}:{oppScore}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] text-center text-slate-500 font-medium">
                  💡 点击小卡片开出单场数据单 · 右上角可展开完整列表
                </p>
              </div>
            )}

            {/* Detailed Vertical List (Visible on desktop or when expanded on mobile) */}
            <div className={`divide-y divide-[#232834] ${isRecentGamesExpandedMobile ? 'block' : 'hidden sm:block'}`}>
              {listToShow.map((m, idx) => {
                const opponentTeam = teams.find((t) => t.id === m.opponentId) || oppTeam;
                const homeTeam = m.isHome ? currentTeam : opponentTeam;
                const awayTeam = m.isHome ? opponentTeam : currentTeam;

                const homeScore = m.isHome ? (m.userScore ?? 100) : (m.oppScore ?? 90);
                const awayScore = m.isHome ? (m.oppScore ?? 90) : (m.userScore ?? 100);

                const isUserWin = m.userWon ?? (m.userScore! > m.oppScore!);

                return (
                  <div
                    key={`recent-game-${m.week || idx}-${idx}`}
                    onClick={() => setSelectedMatchForModal({ match: m, userTeam: currentTeam, oppTeam: opponentTeam })}
                    className="py-2.5 px-2 sm:px-3 hover:bg-[#181e2a] rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-1.5 sm:gap-4 group"
                  >
                    {/* Left: Week & Status */}
                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                      <span className="text-[10px] sm:text-xs font-mono font-bold px-1.5 sm:px-2.5 py-1 rounded-md bg-[#0d1017] text-slate-300 border border-[#232834]">
                        {m.week}轮
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded font-mono ${
                          isUserWin
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        <span className="hidden sm:inline">{isUserWin ? '胜利' : '败北'}</span>
                        <span className="sm:hidden">{isUserWin ? '胜' : '负'}</span>
                      </span>
                    </div>

                    {/* Middle: Matchup & Score */}
                    <div className="flex items-center gap-1 sm:gap-4 justify-center flex-1 min-w-0">
                      {/* Home Team */}
                      <div className="flex items-center gap-1.5 justify-end flex-1 min-w-0">
                        <span className={`text-[11px] sm:text-xs font-bold truncate ${m.isHome ? 'text-amber-300 font-black' : 'text-slate-300'}`}>
                          <span className="hidden md:inline">{homeTeam.name}</span>
                          <span className="md:hidden">{homeTeam.abbrev}</span>
                        </span>
                        <TeamLogo
                          logo={homeTeam.logo}
                          abbrev={homeTeam.abbrev}
                          primaryColor={homeTeam.primaryColor}
                          secondaryColor={homeTeam.secondaryColor}
                          className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                        />
                      </div>

                      {/* Score display */}
                      <div className="px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-lg bg-[#0d1017] border border-[#232834] font-mono font-black text-xs sm:text-sm text-amber-400 flex items-center gap-1 shrink-0">
                        <span>{homeScore}</span>
                        <span className="text-slate-600 text-[10px] sm:text-xs font-normal">:</span>
                        <span>{awayScore}</span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-1.5 justify-start flex-1 min-w-0">
                        <TeamLogo
                          logo={awayTeam.logo}
                          abbrev={awayTeam.abbrev}
                          primaryColor={awayTeam.primaryColor}
                          secondaryColor={awayTeam.secondaryColor}
                          className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                        />
                        <span className={`text-[11px] sm:text-xs font-bold truncate ${!m.isHome ? 'text-amber-300 font-black' : 'text-slate-300'}`}>
                          <span className="hidden md:inline">{awayTeam.name}</span>
                          <span className="md:hidden">{awayTeam.abbrev}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Button prompt */}
                    <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-amber-400 font-bold group-hover:translate-x-1 transition-transform shrink-0">
                      <span className="hidden sm:inline">数据单</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Match Box Score Modal */}
      {selectedMatchForModal && (() => {
        const m = selectedMatchForModal.match;
        const userTeam = selectedMatchForModal.userTeam;
        const opponentTeam = selectedMatchForModal.oppTeam;
        const homeTeam = m.isHome ? userTeam : opponentTeam;
        const awayTeam = m.isHome ? opponentTeam : userTeam;

        const uScore = m.userScore ?? 98;
        const oScore = m.oppScore ?? 92;

        const rosterStats = m.rosterStats || generateFullMatchRosterStats(
          userTeam,
          opponentTeam,
          player,
          uScore,
          oScore,
          m.isHome,
          seasonIndex
        );

        const posRank: Record<string, number> = { PG: 1, SG: 2, SF: 3, PF: 4, C: 5 };
        const sortPlayers = (players: SingleGamePlayerStats[]) => {
          const list = [...players];
          if (sortBy === 'points') {
            list.sort((a, b) => b.pts - a.pts || a.minutes - b.minutes);
          } else {
            list.sort((a, b) => (posRank[a.position] || 9) - (posRank[b.position] || 9) || b.pts - a.pts);
          }
          return list;
        };

        const homePlayersSorted = sortPlayers(rosterStats.homePlayers);
        const awayPlayersSorted = sortPlayers(rosterStats.awayPlayers);

        const homeSumPts = rosterStats.homePlayers.reduce((s, p) => s + p.pts, 0);
        const homeSumReb = rosterStats.homePlayers.reduce((s, p) => s + p.reb, 0);
        const homeSumAst = rosterStats.homePlayers.reduce((s, p) => s + p.ast, 0);

        const awaySumPts = rosterStats.awayPlayers.reduce((s, p) => s + p.pts, 0);
        const awaySumReb = rosterStats.awayPlayers.reduce((s, p) => s + p.reb, 0);
        const awaySumAst = rosterStats.awayPlayers.reduce((s, p) => s + p.ast, 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-[#0d1017] border border-[#232834] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl relative my-auto animate-fadeIn overflow-hidden">
              
              {/* Header */}
              <div className="bg-[#141822] border-b border-[#232834] p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/30 shrink-0">
                    第 {m.week} 场 · 数据单
                  </span>
                  <h2 className="text-xs sm:text-lg font-black italic uppercase text-white truncate">
                    <span className="hidden sm:inline">单场比赛球员高精数据 (100%得分对应)</span>
                    <span className="sm:hidden">单场比赛高精数据</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedMatchForModal(null)}
                    className="sm:hidden p-1.5 rounded-lg bg-[#1a1f2c] text-slate-400 hover:text-white border border-[#2d3446]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between">
                  <div className="flex items-center gap-1 bg-[#1a1f2c] p-1 rounded-xl border border-[#2d3446]">
                    <button
                      type="button"
                      onClick={() => setSortBy('position')}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                        sortBy === 'position'
                          ? 'bg-amber-500 text-black shadow font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🏀 按位置
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy('points')}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                        sortBy === 'points'
                          ? 'bg-amber-500 text-black shadow font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🔥 按得分
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMatchForModal(null)}
                    className="hidden sm:flex p-2 rounded-xl bg-[#1a1f2c] text-slate-400 hover:text-white border border-[#2d3446] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scoreboard Banner */}
              <div className="bg-[#0a0c12] border-b border-[#232834] py-2 sm:py-3 px-3 sm:px-6 flex items-center justify-center gap-3 sm:gap-8">
                <div className="flex items-center gap-2 sm:gap-3">
                  <TeamLogo
                    logo={homeTeam.logo}
                    abbrev={homeTeam.abbrev}
                    primaryColor={homeTeam.primaryColor}
                    secondaryColor={homeTeam.secondaryColor}
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                  <div className="text-right min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-300 block truncate">
                      <span className="hidden sm:inline">{homeTeam.name} (主队)</span>
                      <span className="sm:hidden">{homeTeam.abbrev}</span>
                    </span>
                    <span className={`text-lg sm:text-2xl font-black font-mono ${rosterStats.homeScore > rosterStats.awayScore ? 'text-amber-400' : 'text-slate-400'}`}>
                      {rosterStats.homeScore}
                    </span>
                  </div>
                </div>

                <div className="text-slate-600 font-mono font-black italic text-sm sm:text-lg px-1 sm:px-2">VS</div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="text-left min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-300 block truncate">
                      <span className="hidden sm:inline">{awayTeam.name} (客队)</span>
                      <span className="sm:hidden">{awayTeam.abbrev}</span>
                    </span>
                    <span className={`text-lg sm:text-2xl font-black font-mono ${rosterStats.awayScore > rosterStats.homeScore ? 'text-amber-400' : 'text-slate-400'}`}>
                      {rosterStats.awayScore}
                    </span>
                  </div>
                  <TeamLogo
                    logo={awayTeam.logo}
                    abbrev={awayTeam.abbrev}
                    primaryColor={awayTeam.primaryColor}
                    secondaryColor={awayTeam.secondaryColor}
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                </div>
              </div>

              {/* Modal Body: Split 2 Columns */}
              <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-160px)] grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Left Column: Home Team */}
                <div className="bg-[#11141d] border border-[#232834] rounded-xl p-4 flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#232834] pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        logo={homeTeam.logo}
                        abbrev={homeTeam.abbrev}
                        primaryColor={homeTeam.primaryColor}
                        secondaryColor={homeTeam.secondaryColor}
                        className="w-5 h-5 object-contain"
                      />
                      <span className="font-black text-sm text-white">{homeTeam.name} (主队)</span>
                    </div>
                    <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      总得分: {rosterStats.homeScore} 分
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-[#232834] text-[10px] text-slate-500 uppercase font-mono">
                          <th className="pb-2">球员</th>
                          <th className="pb-2 text-center">位置</th>
                          <th className="pb-2 text-center">时间</th>
                          <th className="pb-2 text-center text-amber-400 font-bold">得分</th>
                          <th className="pb-2 text-center">篮板</th>
                          <th className="pb-2 text-center">助攻</th>
                          <th className="pb-2 text-center">抢断</th>
                          <th className="pb-2 text-center">盖帽</th>
                          <th className="pb-2 text-right">投篮</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#232834]/40">
                        {homePlayersSorted.map((p, pIdx) => (
                          <tr
                            key={`home-p-${p.id || p.name}-${pIdx}`}
                            className={p.isUser ? 'bg-amber-500/15 font-bold text-amber-300' : 'hover:bg-[#181e2b]/50 text-slate-300'}
                          >
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className={p.isUser ? 'text-amber-300 font-black' : 'text-white font-medium'}>
                                  {p.isUser ? `👑 ${p.name}` : p.name}
                                </span>
                                {p.isUser && (
                                  <span className="text-[9px] bg-amber-500 text-black px-1 rounded font-black italic">
                                    玩家
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.position}</td>
                            <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.minutes}m</td>
                            <td className="py-2 text-center font-mono font-black text-amber-400 text-xs">{p.pts}</td>
                            <td className="py-2 text-center font-mono text-blue-300 text-[11px]">{p.reb}</td>
                            <td className="py-2 text-center font-mono text-emerald-300 text-[11px]">{p.ast}</td>
                            <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.stl}</td>
                            <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.blk}</td>
                            <td className="py-2 text-right font-mono text-slate-400 text-[11px]">{p.fgm}/{p.fga}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#232834] flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>全队得分和对应</span>
                    <span className="font-bold text-amber-400">
                      {homeSumPts}分 · {homeSumReb}板 · {homeSumAst}助
                    </span>
                  </div>
                </div>

                {/* Right Column: Away Team */}
                <div className="bg-[#11141d] border border-[#232834] rounded-xl p-4 flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#232834] pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <TeamLogo
                        logo={awayTeam.logo}
                        abbrev={awayTeam.abbrev}
                        primaryColor={awayTeam.primaryColor}
                        secondaryColor={awayTeam.secondaryColor}
                        className="w-5 h-5 object-contain"
                      />
                      <span className="font-black text-sm text-white">{awayTeam.name} (客队)</span>
                    </div>
                    <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      总得分: {rosterStats.awayScore} 分
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-[#232834] text-[10px] text-slate-500 uppercase font-mono">
                          <th className="pb-2">球员</th>
                          <th className="pb-2 text-center">位置</th>
                          <th className="pb-2 text-center">时间</th>
                          <th className="pb-2 text-center text-amber-400 font-bold">得分</th>
                          <th className="pb-2 text-center">篮板</th>
                          <th className="pb-2 text-center">助攻</th>
                          <th className="pb-2 text-center">抢断</th>
                          <th className="pb-2 text-center">盖帽</th>
                          <th className="pb-2 text-right">投篮</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#232834]/40">
                        {awayPlayersSorted.map((p, pIdx) => (
                          <tr
                            key={`away-p-${p.id || p.name}-${pIdx}`}
                            className={p.isUser ? 'bg-amber-500/15 font-bold text-amber-300' : 'hover:bg-[#181e2b]/50 text-slate-300'}
                          >
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className={p.isUser ? 'text-amber-300 font-black' : 'text-white font-medium'}>
                                  {p.isUser ? `👑 ${p.name}` : p.name}
                                </span>
                                {p.isUser && (
                                  <span className="text-[9px] bg-amber-500 text-black px-1 rounded font-black italic">
                                    玩家
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.position}</td>
                            <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.minutes}m</td>
                            <td className="py-2 text-center font-mono font-black text-amber-400 text-xs">{p.pts}</td>
                            <td className="py-2 text-center font-mono text-blue-300 text-[11px]">{p.reb}</td>
                            <td className="py-2 text-center font-mono text-emerald-300 text-[11px]">{p.ast}</td>
                            <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.stl}</td>
                            <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.blk}</td>
                            <td className="py-2 text-right font-mono text-slate-400 text-[11px]">{p.fgm}/{p.fga}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#232834] flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>全队得分和对应</span>
                    <span className="font-bold text-amber-400">
                      {awaySumPts}分 · {awaySumReb}板 · {awaySumAst}助
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
      {showSeasonSummaryModal && (
        <SeasonSummaryModal
          player={player}
          teams={teams}
          currentYear={currentYear}
          onProceedToPlayoffs={() => {
            setShowSeasonSummaryModal(false);
            setIsAutoSimulating(false);
            if (onEnterPlayoffs) {
              onEnterPlayoffs();
            }
          }}
        />
      )}
    </div>
  );
};
