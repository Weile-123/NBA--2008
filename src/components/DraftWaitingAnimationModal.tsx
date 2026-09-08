import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Radio, ArrowRight, Dices, ChevronRight } from 'lucide-react';

interface DraftWaitingAnimationModalProps {
  currentYear: number;
  onComplete: () => void;
}

export const DraftWaitingAnimationModal: React.FC<DraftWaitingAnimationModalProps> = ({
  currentYear,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);

  const newsTickers = [
    `📊 联盟30支球队高层已齐聚麦迪逊广场花园，正在进行最后体测报告核对...`,
    `🎲 乐透抽签结果公布完毕，首轮 1-30 顺位归属正式锁存！`,
    `⚡ 绿室（Green Room）新秀就座完毕，本届热门新秀悉数到场！`,
    `🎙️ 提词器启动，NBA总裁大卫·斯特恩即走向发言台...`,
  ];

  useEffect(() => {
    // Progress bar ticker over 3 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // News ticker rotator
    const tickerInterval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % newsTickers.length);
    }, 700);

    return () => {
      clearInterval(interval);
      clearInterval(tickerInterval);
    };
  }, [onComplete, newsTickers.length]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 text-slate-100 font-sans">
      <div className="bg-gradient-to-b from-[#141926] via-[#0d1018] to-[#07090e] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-center space-y-6 overflow-hidden">
        {/* Background glow beams */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/20 blur-3xl rounded-full pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider relative z-10">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-ping" />
          <span>{currentYear - 1} NBA DRAFT PREPARATION</span>
        </div>

        {/* Animated Lottery / Draft Sphere */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent border-2 border-amber-400/60 flex items-center justify-center relative shadow-2xl shadow-amber-500/20">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 animate-spin" style={{ animationDuration: '8s' }} />
            <div className="text-4xl sm:text-5xl animate-bounce">🏀</div>
            <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] font-mono shadow-md">
              DRAFT LOTTERY
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tight">
            筹备 {currentYear - 1} NBA 选秀大会...
          </h2>
          <p className="text-xs text-slate-400">
            赛季结束，联盟正在同步30支球队选秀权并布置现场
          </p>
        </div>

        {/* News Ticker */}
        <div className="bg-[#090c13] border border-[#212838] p-3 rounded-2xl min-h-[50px] flex items-center justify-center relative z-10">
          <p className="text-xs font-mono font-bold text-amber-300 animate-fadeIn">
            {newsTickers[tickerIndex]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 font-bold">
            <span>选秀大会准备进度</span>
            <span className="text-amber-400">{progress}%</span>
          </div>
          <div className="w-full bg-[#111520] h-3 rounded-full overflow-hidden border border-[#232a3c] p-0.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-100 shadow-md shadow-amber-500/30"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Fast Forward / Skip Button */}
        <div className="pt-1 relative z-10">
          <button
            type="button"
            onClick={onComplete}
            className="w-full py-3 bg-[#161c2b] hover:bg-[#1f283d] text-amber-300 font-black italic text-xs rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            <span>直接进入选秀大会现场</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
