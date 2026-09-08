import React, { useEffect } from 'react';
import { PlayerProfile, HistoricalSeason } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, Award, Crown, Sparkles, ChevronRight } from 'lucide-react';

interface YearSummaryModalProps {
  player: PlayerProfile;
  currentYear: number;
  historicalSeason: HistoricalSeason;
  userWonChampion: boolean;
  userWonMVP: boolean;
  userWonROY: boolean;
  onNextSeason: () => void;
}

export const YearSummaryModal: React.FC<YearSummaryModalProps> = ({
  player,
  currentYear,
  historicalSeason,
  userWonChampion,
  userWonMVP,
  userWonROY,
  onNextSeason,
}) => {
  useEffect(() => {
    if (userWonChampion || userWonMVP || userWonROY) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11141b] border border-[#232834] rounded-xl max-w-xl w-full p-5 sm:p-6 shadow-2xl text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {currentYear}-{currentYear + 1} 赛季总结与颁奖盛典
        </div>

        <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white">{historicalSeason.headline}</h2>

        {/* Awards Unlocked Card */}
        <div className="bg-[#0d1017] p-4 rounded-xl border border-[#232834] text-left space-y-2">
          <h4 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500">
            本赛季最高荣誉汇总
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className={`p-2.5 rounded-lg border ${userWonChampion ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#11141b] border-[#232834] text-slate-400'}`}>
              <div className="text-[9px] text-slate-500 uppercase">NBA总冠军</div>
              <div className="text-xs font-black text-white">{userWonChampion ? `🏆 ${player.name} (${player.currentTeamId.toUpperCase()})` : historicalSeason.realChampion}</div>
            </div>

            <div className={`p-2.5 rounded-lg border ${userWonMVP ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#11141b] border-[#232834] text-slate-400'}`}>
              <div className="text-[9px] text-slate-500 uppercase">常规赛 MVP</div>
              <div className="text-xs font-black text-white">{userWonMVP ? `👑 ${player.name}` : historicalSeason.realMVP}</div>
            </div>

            <div className={`p-2.5 rounded-lg border ${userWonROY ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#11141b] border-[#232834] text-slate-400'}`}>
              <div className="text-[9px] text-slate-500 uppercase">最佳新秀</div>
              <div className="text-xs font-black text-white">{userWonROY ? `⭐ ${player.name}` : historicalSeason.realROY}</div>
            </div>

            <div className="p-2.5 rounded-lg border bg-[#11141b] border-[#232834] text-slate-400">
              <div className="text-[9px] text-slate-500 uppercase">最佳阵容</div>
              <div className="text-xs font-black text-emerald-400">最佳阵容一队入选</div>
            </div>
          </div>
        </div>

        {/* Action button to proceed */}
        <button
          onClick={onNextSeason}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded text-xs uppercase tracking-tight shadow-xl flex items-center justify-center gap-1.5"
        >
          迈向 {currentYear + 1} 赛季 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
