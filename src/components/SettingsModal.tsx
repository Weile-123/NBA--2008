import React from 'react';
import { Settings, X, ShieldCheck, User, Home } from 'lucide-react';
import { PlayerProfile, Team } from '../types';

interface SettingsModalProps {
  player: PlayerProfile | null;
  currentTeam: Team | null;
  currentYear: number;
  seasonWeek: number;
  lastSavedAt: string | null;
  onGoHome?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  player,
  currentTeam,
  currentYear,
  seasonWeek,
  lastSavedAt,
  onGoHome,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0d1017] p-4 border-b border-[#232834] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="font-black italic uppercase text-white text-base">系统设置与生涯管理</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-[#181d28] p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Current Player & Save Card */}
          {player ? (
            <div className="bg-[#0d1017] p-4 rounded-xl border border-[#232834] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">{player.name} 的生涯存档</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 bg-[#11141b] p-3 rounded-lg border border-[#232834]">
                <div>
                  <span className="text-[10px] text-slate-500 block">球员能力</span>
                  <span className="text-amber-400 font-bold">{player.ovr} OVR · {player.position}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">效力球队</span>
                  <span className="text-white font-bold">{currentTeam ? currentTeam.name : '等待选秀'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">赛季年份</span>
                  <span className="text-slate-200">{currentYear}-{currentYear + 1} 赛季</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">进度周数</span>
                  <span className="text-slate-200">第 {seasonWeek} 周</span>
                </div>
              </div>

              {lastSavedAt && (
                <div className="text-[10px] text-slate-500 font-mono text-right">
                  最近自动归档时间: {lastSavedAt}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0d1017] p-4 rounded-xl border border-[#232834] text-xs text-slate-400">
              尚无进行中的生涯存档，正在角色创建流程中。
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              游戏操作
            </span>

            {/* Action: Go to Home Screen */}
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="w-full py-2.5 px-3 bg-[#161b26] hover:bg-[#202736] border border-[#2e374d] text-slate-200 font-bold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>返回游戏首页大厅</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                  主菜单
                </span>
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 pt-2 border-t border-[#232834]">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> 篮坛传奇：重返2008
          </p>
        </div>
      </div>
    </div>
  );
};
