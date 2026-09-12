import React, { useRef, useEffect } from 'react';
import { ScheduleItem, Team } from '../types';
import { TeamLogo } from './TeamLogo';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface SeasonScheduleTickerProps {
  schedule: ScheduleItem[];
  currentGame: number;
  userTeam: Team;
  teams: Team[];
  isAutoSimulating?: boolean;
  onSelectMatch: (match: ScheduleItem, oppTeam: Team) => void;
}

export const SeasonScheduleTicker: React.FC<SeasonScheduleTickerProps> = ({
  schedule,
  currentGame,
  userTeam,
  teams,
  isAutoSimulating = false,
  onSelectMatch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center current game item whenever currentGame changes
  useEffect(() => {
    if (isAutoSimulating) return;
    const animationFrame = requestAnimationFrame(() => {
      activeItemRef.current?.scrollIntoView({
        inline: 'center',
        block: 'nearest',
        behavior: 'smooth',
      });
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [currentGame, isAutoSimulating]);

  const handleScrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  const playedCount = (schedule || []).filter((s) => s.isPlayed).length;

  // Rendering and reconciling all 82 cards (including team logos) for every
  // simulated game is much more expensive than the simulation itself on older
  // Android WebViews. Keep only a static, lightweight progress view running;
  // the complete interactive ticker returns as soon as simulation pauses.
  if (isAutoSimulating) {
    const progress = Math.min(100, Math.round((playedCount / 82) * 100));
    return (
      <div className="rounded-2xl border border-[#232834] bg-[#11141b] p-3 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="truncate text-xs font-black italic text-white">常规赛快速模拟</span>
          </div>
          <span className="shrink-0 font-mono text-[10px] font-bold text-amber-300">
            {playedCount}/82
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#080b11]">
          <div
            className="h-full rounded-full bg-amber-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3 shadow-xl space-y-2 relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-1 sm:px-2 pb-2 border-b border-[#232834]/60">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="text-[11px] sm:text-xs font-black italic uppercase text-white tracking-wide truncate">
            <span className="hidden sm:inline">常规赛日程</span>
            <span className="sm:hidden">常规赛日程</span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
            {playedCount}/82 场
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleScrollLeft}
            className="p-1 rounded-lg bg-[#181d29] text-slate-400 hover:text-white border border-[#2d3446] transition-colors"
            title="向左滚动"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleScrollRight}
            className="p-1 rounded-lg bg-[#181d29] text-slate-400 hover:text-white border border-[#2d3446] transition-colors"
            title="向右滚动"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={containerRef}
        className="flex items-center gap-2.5 overflow-x-auto px-2.5 py-2.5 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent snap-x"
      >
        {schedule.map((item, index) => {
          const gameNum = item.gameNumber || item.week || index + 1;
          const isActive = gameNum === currentGame;
          const isPlayed = !!item.isPlayed;

          const oppTeam = teams.find((t) => t.id === item.opponentId) || teams[0];
          const homeTeam = item.isHome ? userTeam : oppTeam;
          const awayTeam = item.isHome ? oppTeam : userTeam;

          const userScore = item.userScore ?? (item.rosterStats?.userScore || 100);
          const oppScore = item.oppScore ?? (item.rosterStats?.oppScore || 92);
          const isUserWin = item.userWon ?? (userScore > oppScore);

          return (
            <div
              key={`ticker-game-${gameNum}`}
              ref={isActive ? activeItemRef : null}
              onClick={() => isPlayed && onSelectMatch(item, oppTeam)}
              className={`snap-center flex-shrink-0 w-28 p-2 rounded-xl border select-none ${
                isAutoSimulating ? '' : 'transition-all duration-200'
              } ${
                isActive
                  ? 'bg-gradient-to-b from-amber-500/20 to-amber-900/10 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50 scale-105 z-10'
                  : isPlayed
                  ? 'bg-[#141822] border-[#232834] hover:bg-[#1a202e] cursor-pointer'
                  : 'bg-[#0d1017] border-[#1d222e] opacity-65'
              }`}
            >
              {/* Top: Game # & Status badge */}
              <div className="flex items-center justify-between text-[9px] font-mono font-bold mb-1">
                <span className={isActive ? 'text-amber-300 font-black' : 'text-slate-400'}>
                  G{gameNum}
                </span>

                {isActive ? (
                  <span className={`px-1.5 py-0.2 bg-amber-500 text-black rounded font-black text-[8px] ${isAutoSimulating ? '' : 'animate-pulse'}`}>
                    进行中
                  </span>
                ) : isPlayed ? (
                  <span
                    className={`px-1 py-0.2 rounded text-[8px] font-black ${
                      isUserWin
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {isUserWin ? '胜 W' : '负 L'}
                  </span>
                ) : (
                  <span className="text-slate-600 font-normal">
                    {item.isHome ? '主' : '客'}
                  </span>
                )}
              </div>

              {/* Middle: Opponent logo & abbreviation */}
              <div className="flex items-center justify-center gap-1.5 my-1">
                <TeamLogo
                  logo={oppTeam.logo}
                  abbrev={oppTeam.abbrev}
                  primaryColor={oppTeam.primaryColor}
                  secondaryColor={oppTeam.secondaryColor}
                  className="w-5 h-5 object-contain"
                />
                <span className={`text-xs font-bold font-mono ${isActive ? 'text-white font-black' : 'text-slate-300'}`}>
                  {oppTeam.abbrev}
                </span>
              </div>

              {/* Bottom: Score or Matchup Label */}
              <div className="text-center font-mono text-[10px] font-bold border-t border-[#232834]/50 pt-1">
                {isPlayed ? (
                  <span className={isUserWin ? 'text-amber-400 font-black' : 'text-slate-400'}>
                    {userScore}:{oppScore}
                  </span>
                ) : isActive ? (
                  <span className="text-amber-300 text-[9px]">点击开始</span>
                ) : (
                  <span className="text-slate-500 text-[9px]">{item.isHome ? 'VS 主场' : '@ 客场'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
