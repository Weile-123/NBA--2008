import React from 'react';
import { Trophy, Sparkles, Award, Crown, Flame, X } from 'lucide-react';
import { MilestoneTrigger } from '../data/milestonesData';

interface MilestoneModalProps {
  milestone: MilestoneTrigger | null;
  playerName: string;
  onClose: () => void;
  onViewMilestones?: () => void;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  milestone,
  playerName,
  onClose,
  onViewMilestones,
}) => {
  if (!milestone) return null;

  const isNo1 = milestone.type === 'NO1';
  const isTop3 = milestone.type === 'TOP3';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none overflow-hidden">
      <div className="relative w-full max-w-md sm:max-w-lg overflow-hidden bg-[#11141b] border-2 border-amber-500/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(245,158,11,0.35)] text-center space-y-3 sm:space-y-4 animate-scale-up [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Background Glowing Rings */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full bg-[#1e2330] text-slate-400 hover:text-white transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-black text-[10px] sm:text-xs uppercase tracking-wider animate-pulse">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span>联盟 历史里程碑纪录达成</span>
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
        </div>

        {/* Main Trophy/Crown Icon Container */}
        <div className="relative mx-auto w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-xl shadow-amber-500/40 border-2 border-amber-200 shrink-0">
          {isNo1 ? (
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-black animate-bounce" />
          ) : isTop3 ? (
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-black animate-bounce" />
          ) : (
            <Award className="w-8 h-8 sm:w-10 sm:h-10 text-black animate-bounce" />
          )}
          <span className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 bg-black text-amber-400 font-black text-[10px] sm:text-xs px-1.5 py-0.5 rounded-lg border border-amber-400">
            {milestone.icon}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-black italic uppercase text-white tracking-wide leading-snug">
            {isNo1
              ? `👑 登顶 联盟 ${milestone.catName}历史第一人！`
              : isTop3
              ? `🔥 挺进 联盟 ${milestone.catName}历史 Top 3！`
              : `🎉 杀入 联盟 ${milestone.catName}历史前 10！`}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 font-bold">
            恭喜 <span className="text-amber-400 italic">{playerName}</span> 再次刷新联盟历史传奇画卷！
          </p>
        </div>

        {/* Main Stat Card */}
        <div className="bg-[#181d29] border border-amber-500/30 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 space-y-1.5 text-center shadow-inner">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {milestone.catName} 生涯累计数值
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 italic drop-shadow">
            {milestone.newStat.toLocaleString()} <span className="text-xs sm:text-sm text-slate-300 font-normal">{milestone.unit}</span>
          </div>

          <div className="pt-2 border-t border-[#232834] flex flex-col sm:flex-row items-center justify-around gap-1 sm:gap-2 text-xs font-bold">
            <div className="text-slate-300">
              最新历史排名：
              <span className="text-amber-400 font-black italic text-sm"> 第 {milestone.newRank} 位</span>
            </div>
            {milestone.passedLeaderName && (
              <div className="text-slate-400 text-[11px] sm:text-xs">
                超越传奇：
                <span className="text-white font-black">{milestone.passedLeaderName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Accolade info banner for Top 3 & No.1 */}
        {(isTop3 || isNo1) && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/40 rounded-xl p-2 sm:p-2.5 text-[10px] sm:text-xs text-amber-200 font-bold flex items-center justify-center gap-1.5 sm:gap-2">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>此项成就已永载史册！实时计入个人核心荣誉与历史殿堂。</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          {onViewMilestones && (
            <button
              onClick={() => {
                onClose();
                onViewMilestones();
              }}
              className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl bg-[#1d2332] hover:bg-slate-800 text-amber-300 hover:text-amber-200 font-bold text-xs sm:text-sm border border-amber-500/40 hover:border-amber-400/80 transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 shadow-md group"
            >
              <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>查看历史里程碑</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-black text-xs sm:text-sm uppercase italic tracking-wider shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            收下这份至高荣耀
          </button>
        </div>
      </div>
    </div>
  );
};

