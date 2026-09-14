import React, { useState } from 'react';
import { PlayerProfile, Team } from '../types';
import { gameConfetti as confetti } from '../utils/gameConfetti';
import { Award, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { TeamLogo } from './TeamLogo';
import { getHistoricalDraftData, YearDraftData } from '../data/draftData';
import { applyDraftRookiesToTeams } from '../utils/draftLogic';
import { generateParallelDraftData } from '../utils/randomDraftLogic';

interface DraftNightModalProps {
  player: PlayerProfile;
  teams: Team[];
  currentYear?: number;
  suppliedDraftData?: YearDraftData | null;
  isOffseasonFlow?: boolean;
  onComplete: (updatedTeams?: Team[], teamId?: string, pick?: number, selectedJerseyNum?: number) => void;
}

function createStableDraftRandom(year: number): () => number {
  let value = (year * 2654435761) >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export const DraftNightModal: React.FC<DraftNightModalProps> = ({
  player,
  teams,
  currentYear = 2009,
  suppliedDraftData,
  onComplete,
}) => {
  const draftData: YearDraftData | null = React.useMemo(
    () => suppliedDraftData
      || getHistoricalDraftData(currentYear)
      || (currentYear > 2026 ? generateParallelDraftData(teams, currentYear, createStableDraftRandom(currentYear)) : null),
    [currentYear, suppliedDraftData, teams],
  );

  // Target team
  const targetTeamId = player.favoriteTeamId || player.currentTeamId || 'lal';
  const draftTeam = teams.find((t) => t.id === targetTeamId) || teams[0];

  React.useEffect(() => {
    if (!draftData || !draftData.draftPicks || draftData.draftPicks.length === 0) {
      onComplete(teams, draftTeam.id, player.draftPick || 1, player.jerseyNum || 24);
    }
  }, [draftData]);

  if (!draftData || !draftData.draftPicks || draftData.draftPicks.length === 0) {
    return null;
  }

  // Handler to finalize draft night and apply rookies to all 30 teams
  const handleFinalizeDraft = () => {
    // Apply rookies to teams and satisfy 15-man roster constraint
    const updatedTeams = applyDraftRookiesToTeams(teams, currentYear, player, draftData);

    try {
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 } });
    } catch (e) {}

    onComplete(updatedTeams, draftTeam.id, player.draftPick || 1, player.jerseyNum || 24);
  };

  return (
    <div className="bg-[#11141b] border-2 border-amber-500/40 rounded-2xl w-full p-3 sm:p-6 shadow-2xl relative text-left overflow-hidden space-y-3 sm:space-y-5">
      {/* MODULE HEADER */}
      <div className="flex items-center justify-between border-b border-[#232a3c] pb-3 sm:pb-4 flex-wrap gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg sm:text-xl shadow-lg shrink-0">
            🏀
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {currentYear} 联盟选秀
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black italic uppercase text-white mt-0.5 sm:mt-1">
              {currentYear}年 联盟 选秀大会
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={handleFinalizeDraft}
          className="sm:hidden shrink-0 px-2.5 py-2 bg-amber-500 text-black font-black text-[11px] rounded-lg shadow-lg shadow-amber-500/20 flex items-center gap-1"
        >
          确认结果
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 30 PICKS TABLE */}
      <div className="space-y-2">

        <p className="sm:hidden px-1 text-[10px] text-slate-500">选秀名单可上下滑动查看</p>
        <div className="overflow-y-auto space-y-1.5 sm:space-y-2 pr-2 max-h-[min(32svh,250px)] sm:max-h-[450px] scrollbar-thin">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500 px-2 sm:px-3 py-1 font-mono">
            <span>选秀顺位 & 指名球队</span>
            <span className="hidden sm:inline">获选新秀资料与球探总结</span>
            <span className="sm:hidden">获选新秀</span>
          </div>

          {draftData.draftPicks.map((pickItem) => {
            const pickTeam = teams.find((t) => t.id === pickItem.teamId);
            const p = pickItem.player;

            return (
              <div
                key={pickItem.pick}
                className="flex flex-row items-center justify-between p-2 sm:p-3 rounded-xl border text-xs bg-[#090c12] border-[#1e2535] hover:border-amber-500/40 transition-all gap-2"
              >
                {/* Pick Number & Team Logo */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="font-mono font-black text-amber-400 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-amber-500/20 text-[11px] sm:text-xs">
                    #{pickItem.pick}
                  </div>
                  <div className="font-bold text-white flex items-center gap-1.5 sm:gap-2">
                    <TeamLogo
                      team={pickTeam}
                      abbrev={pickItem.teamId}
                      name={pickItem.teamName}
                      size="xs"
                    />
                    <span className="font-bold text-slate-200 text-xs truncate max-w-[90px] sm:max-w-none">{pickItem.teamName}</span>
                  </div>
                </div>

                {/* Player details (College & Highlights hidden on mobile) */}
                <div className="flex-1 space-y-0.5 text-right">
                  <div className="flex items-center gap-1.5 justify-end flex-wrap">
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 text-[9px] sm:text-[10px]">
                      {p.position}
                    </span>
                    <span className="font-black text-white text-xs sm:text-sm">{p.name}</span>
                    <span className="font-mono text-[10px] sm:text-[11px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      {p.ovr} OVR
                    </span>
                    {p.college && (
                      <span className="text-[10px] sm:text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-mono hidden sm:inline-block">
                        🎓 {p.college}
                      </span>
                    )}
                  </div>
                  {p.highlights && (
                    <p className="text-[11px] text-amber-200/80 italic font-medium leading-tight hidden sm:block">
                      “{p.highlights}”
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="pt-3 border-t border-[#232a3c] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <span className="text-[11px] sm:text-xs text-slate-400 font-mono text-center sm:text-left">
          确认后，新秀将正式录入全联盟球队名单
        </span>

        <button
          type="button"
          onClick={handleFinalizeDraft}
          className="w-full sm:w-auto justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black italic text-xs rounded-xl uppercase transition-all shadow-xl flex items-center gap-2 cursor-pointer ring-2 ring-amber-300"
        >
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>确认选秀结束，更新全联盟名单</span>
          <ChevronRight className="w-4 h-4 text-black shrink-0" />
        </button>
      </div>
    </div>
  );
};
