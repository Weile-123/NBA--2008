import { FastForward,Flame,Pause,Play,Sparkles,UserCheck } from 'lucide-react';
import React from 'react';

import { MatchSimulatorProps,useMatchSimulation } from '../hooks/useMatchSimulation';
export { buildQuarterEvents,isPlayerOnCourt } from '../utils/matchEvents';
export type { ScheduledQuarterEvent,TacticalOption } from '../utils/matchEvents';
export const MatchSimulator: React.FC<MatchSimulatorProps> = ({
  player,
  userTeam,
  oppTeam,
  isInteractive,
  isPlayoffs,
  currentYear = 2008,
  onFinishMatch,
}) => {
  const {
    hasStarted,
    isSimulating,
    setIsSimulating,
    speedMultiplier,
    setSpeedMultiplier,
    currentQuarter,
    remainingSeconds,
    quarterSimulated,
    logs,
    logsEndRef,
    userScore,
    oppScore,
    pts,
    reb,
    ast,
    stl,
    blk,
    fgm,
    fga,
    tpm,
    tpa,
    ftm,
    fta,
    turnovers,
    playedMinutes,
    earnedFans,
    earnedXp,
    assignedMPG,
    userRole,
    currentlyOnCourt,
    showBuzzerBeaterModal,
    showQuarterEvent,
    setShowQuarterEvent,
    currentTacticalOptions,
    eventProcessed,
    setEventProcessed,
    eventFeedback,
    setEventFeedback,
    formatTime,
    startMatchSimulation,
    handleNextQuarterOrFinish,
    quickSimulateCurrentQuarter,
    handleTacticalChoiceOption,
    handleBuzzerBeaterChoice,
  } = useMatchSimulation({ player, userTeam, oppTeam, isInteractive, isPlayoffs, currentYear, onFinishMatch });


  return (
    <div className="fixed inset-0 z-50 bg-[#070913] flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn isolate">
      <div className="bg-[#11141b] border-2 border-amber-500/40 rounded-2xl p-3 sm:p-6 max-w-4xl w-full shadow-2xl relative space-y-2.5 sm:space-y-4 max-h-[95vh] overflow-y-auto">
        {/* Header Title */}
        <div className="flex items-center gap-2 border-b border-[#232834] pb-2 sm:pb-3">
          <span className="p-1.5 sm:p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-black italic uppercase text-white tracking-tight truncate">
              <span className="hidden sm:inline">比赛现场实况</span>
              <span className="sm:hidden">比赛现场实况</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              {userTeam.name} VS {oppTeam.name}
            </p>
          </div>
        </div>

        {/* PROMINENT CENTER PIECE: QUARTER & COUNTDOWN TIMER PANEL */}
        <div className="bg-gradient-to-b from-[#161a24] to-[#0d1017] border-2 border-amber-500/50 rounded-2xl p-3 sm:p-5 shadow-2xl relative overflow-hidden text-center space-y-2 sm:space-y-3">
          {/* Status Indicator Bar */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs border-b border-[#232834] pb-1.5 sm:pb-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-slate-400 font-bold hidden sm:inline">对阵赛事:</span>
              <span className="text-amber-400 font-bold">
                {isPlayoffs ? `${currentYear} 季后赛` : `${currentYear} 常规赛`}
              </span>
            </div>

            {/* Live Simulation Status Badge */}
            <div className="flex items-center gap-2">
              {!hasStarted ? (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] sm:text-[11px] font-bold border border-slate-700">
                  ⏳ 等待跳球
                </span>
              ) : showQuarterEvent ? (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] sm:text-[11px] font-bold border border-amber-500/40 animate-pulse">
                  ⏸️ 战术决策
                </span>
              ) : isSimulating ? (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  🟢 推进中 ({speedMultiplier}x)
                </span>
              ) : quarterSimulated ? (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] sm:text-[11px] font-bold border border-blue-500/40">
                  🏁 第 {currentQuarter} 节结束
                </span>
              ) : (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] sm:text-[11px] font-bold border border-slate-700">
                  ⏸️ 已暂停
                </span>
              )}
            </div>
          </div>

          {/* MAIN CENTER DISPLAY: QUARTER & COUNTDOWN CLOCK */}
          <div className="py-1 sm:py-2 flex flex-col items-center justify-center space-y-1">
            <div className="text-xs sm:text-sm font-black italic uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <span className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-mono shadow-inner text-[10px] sm:text-xs">
                第 {currentQuarter} 节<span className="hidden sm:inline"> (QUARTER {currentQuarter} / 4)</span>
              </span>
            </div>

            {/* COUNTDOWN CLOCK */}
            <div className="text-3xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(245,158,11,0.4)] bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-transparent py-0.5 sm:py-1">
              {formatTime(remainingSeconds)}
            </div>

            {/* TEAM SCORES */}
            <div className="flex items-center justify-center gap-4 sm:gap-14 pt-1 sm:pt-2">
              <div className="text-center">
                <span className="text-[11px] sm:text-xs text-slate-400 font-bold block">{userTeam.name}</span>
                <span className="text-2xl sm:text-5xl font-black font-mono text-amber-400 drop-shadow">{userScore}</span>
              </div>
              <span className="text-xs sm:text-base font-black italic text-slate-600">VS</span>
              <div className="text-center">
                <span className="text-[11px] sm:text-xs text-slate-400 font-bold block">{oppTeam.name}</span>
                <span className="text-2xl sm:text-5xl font-black font-mono text-cyan-400 drop-shadow">{oppScore}</span>
              </div>
            </div>
          </div>

          {/* SIMULATION SPEED & CONTROLS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 sm:pt-3 border-t border-[#232834] gap-2">
            <div className="flex items-center justify-center sm:justify-start gap-1">
              <span className="text-[10px] text-slate-400 font-bold mr-1">倍速:</span>
              {[
                { label: '1x', mult: 1 },
                { label: '2x', mult: 2 },
                { label: '4x', mult: 4 },
                { label: '8x', mult: 8 },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSpeedMultiplier(s.mult)}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] font-mono font-bold rounded-lg border transition-all ${
                    speedMultiplier === s.mult
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                      : 'bg-[#11141b] text-slate-400 border-[#232834] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* ACTION / CONTROL BUTTONS */}
            <div className="flex items-center justify-center gap-2">
              {!hasStarted ? (
                <button
                  onClick={startMatchSimulation}
                  className="w-full sm:w-auto justify-center px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black italic rounded-xl text-xs uppercase tracking-wider shadow-xl flex items-center gap-1.5 transition-transform active:scale-95 animate-bounce"
                >
                  <Play className="w-4 h-4 fill-black shrink-0" />
                  <span>🏀 开始比赛</span>
                </button>
              ) : quarterSimulated ? (
                <button
                  onClick={handleNextQuarterOrFinish}
                  className="w-full sm:w-auto justify-center px-4 sm:px-6 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs uppercase tracking-wider shadow-xl flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>
                    {currentQuarter < 4
                      ? `进入第 ${currentQuarter + 1} 节`
                      : '查看全场战报'}
                  </span>
                  <Play className="w-4 h-4 fill-black shrink-0" />
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    disabled={showQuarterEvent}
                    className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-1.5 bg-[#11141b] hover:bg-[#1a202c] text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>暂停</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span>继续</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={quickSimulateCurrentQuarter}
                    disabled={showQuarterEvent}
                    className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="一键快速推导本节剩余日志"
                  >
                    <FastForward className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>⚡ 快速完成本节</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ON-COURT / ON-BENCH STATUS BANNER */}
        {currentlyOnCourt ? (
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border border-emerald-500/80 rounded-2xl flex items-center justify-between text-emerald-300 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="px-2.5 sm:px-3 py-1 bg-emerald-500 text-black rounded-xl font-black text-[11px] sm:text-xs flex items-center gap-1 shadow-md shrink-0">
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black shrink-0" /> 🏀 【登场比赛】
              </span>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">
                  场上比赛中 ({userRole} · {assignedMPG}分钟/场)
                </div>
                <div className="hidden sm:block text-[11px] text-emerald-300">
                  第 {currentQuarter} 节进球、抢断与战术抉择将直接决定比赛胜负与个人数据。
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 rounded-2xl flex items-center justify-between text-amber-300 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="px-2.5 sm:px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1 shrink-0">
                🪑 【替补席】
              </span>
              <div>
                <div className="text-xs sm:text-sm font-black text-amber-300">
                  替补席休整 (当前角色: {userRole})
                </div>
                <div className="hidden sm:block text-[11px] text-slate-400">
                  提升个人能力值与同位置表现，可进一步增加你的轮换上场时间。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player Personal Stats Bar */}
        <div className="bg-[#0d1017] border border-[#232834] p-2.5 sm:p-3 rounded-xl border-amber-500/20">
          <div className="flex items-center justify-between text-xs mb-1.5 sm:mb-2">
            <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px] sm:text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {player.name} 个人数据:
            </span>
            <span className="font-mono text-slate-400 text-[10px] sm:text-[11px]">
              {playedMinutes}m · 粉丝+{earnedFans} · XP+{earnedXp}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 sm:gap-2 text-center text-xs">
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">得分</span>
              <span className="font-black text-amber-400 text-xs sm:text-sm font-mono">{pts}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">篮板</span>
              <span className="font-black text-blue-400 text-xs sm:text-sm font-mono">{reb}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">助攻</span>
              <span className="font-black text-emerald-400 text-xs sm:text-sm font-mono">{ast}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">抢断</span>
              <span className="font-black text-purple-400 text-xs sm:text-sm font-mono">{stl}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">盖帽</span>
              <span className="font-black text-cyan-400 text-xs sm:text-sm font-mono">{blk}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834] hidden sm:block">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">命中</span>
              <span className="font-bold text-slate-200 font-mono text-xs">{fgm}/{fga}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834] hidden sm:block">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">三分</span>
              <span className="font-bold text-slate-200 font-mono text-xs">{tpm}/{tpa}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834] hidden sm:block">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">罚球</span>
              <span className="font-bold text-slate-200 font-mono text-xs">{ftm}/{fta}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834] hidden sm:block">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">失误</span>
              <span className="font-bold text-red-400 font-mono text-xs">{turnovers}</span>
            </div>
          </div>
        </div>

        {/* BUZZER BEATER POPUP MODAL */}
        {showBuzzerBeaterModal && (
          <div className="fixed inset-0 z-[70] bg-[#070913] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[#11141b] border-2 border-red-500 rounded-2xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-3 sm:space-y-4 relative">
              <div className="flex items-center justify-between border-b border-[#232834] pb-2 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="p-1.5 sm:p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
                    <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 animate-bounce" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-lg font-black italic text-red-400 uppercase tracking-tight flex items-center gap-2">
                      🚨 终场绝杀时刻
                    </h3>
                    <span className="text-[11px] sm:text-xs text-amber-300 font-mono font-bold">
                      全场剩余: 00:04 · 实时比分: {userTeam.name} {userScore} - {oppScore} {oppTeam.name}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs bg-red-500/20 text-red-300 border border-red-500/40 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold shrink-0">
                  绝杀事件
                </span>
              </div>

              <div className="p-3 sm:p-3.5 bg-gradient-to-r from-red-950/40 via-[#0d1017] to-red-950/40 border border-red-500/30 rounded-xl text-xs text-slate-200 leading-relaxed">
                🚨 全场仅剩 <span className="text-red-400 font-black font-mono">4.0秒</span>！球队落后 1 分！选择你的绝杀出手方式（<span className="text-amber-400 font-bold">成功率 30%</span>，获 <span className="text-emerald-400 font-bold">+3倍粉丝</span> & <span className="text-amber-400 font-bold">+3属性点</span>）：
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleBuzzerBeaterChoice('3pt')}
                  className="p-3 sm:p-4 rounded-xl border-2 border-amber-500/50 hover:border-amber-400 bg-gradient-to-r from-amber-950/30 to-[#161a24] hover:from-amber-900/40 transition-all text-left group shadow-lg flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-black text-amber-300 group-hover:text-amber-200 flex items-center gap-2">
                      🎯 1. 弧顶强行干拔三分绝杀
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">
                      顶着两人死缠包夹强行拔树跳投，向死而生高高弧线轰向篮筐！
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2 sm:ml-3">
                    <span className="text-[10px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 block">
                      30% 成功率
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono block mt-0.5 sm:mt-1 font-bold">
                      +3倍粉丝 & +3属性点
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleBuzzerBeaterChoice('mid')}
                  className="p-3 sm:p-4 rounded-xl border-2 border-amber-500/50 hover:border-amber-400 bg-gradient-to-r from-amber-950/30 to-[#161a24] hover:from-amber-900/40 transition-all text-left group shadow-lg flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-black text-amber-300 group-hover:text-amber-200 flex items-center gap-2">
                      🔥 2. 招牌后撤步中距离漂移绝杀
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">
                      连续交叉步晃开重心，后撤步极限滞空漂移中距离压哨！
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2 sm:ml-3">
                    <span className="text-[10px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 block">
                      30% 成功率
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono block mt-0.5 sm:mt-1 font-bold">
                      +3倍粉丝 & +3属性点
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleBuzzerBeaterChoice('layup')}
                  className="p-3 sm:p-4 rounded-xl border-2 border-amber-500/50 hover:border-amber-400 bg-gradient-to-r from-amber-950/30 to-[#161a24] hover:from-amber-900/40 transition-all text-left group shadow-lg flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-black text-amber-300 group-hover:text-amber-200 flex items-center gap-2">
                      🚀 3. 强突禁区抗人拉杆抛投绝杀
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">
                      第一步刺穿第一道防线直钻内线，空中强抗对抗打高板抛投！
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2 sm:ml-3">
                    <span className="text-[10px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 block">
                      30% 成功率
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono block mt-0.5 sm:mt-1 font-bold">
                      +3倍粉丝 & +3属性点
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quarterly Tactical Event POPUP MODAL */}
        {showQuarterEvent && (
          <div className="fixed inset-0 z-[60] bg-[#070913] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[#11141b] border-2 border-amber-500/80 rounded-2xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-3 sm:space-y-4 relative">
              <div className="flex items-center justify-between border-b border-[#232834] pb-2 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-base font-black italic text-white uppercase tracking-tight">
                      第 {currentQuarter} 节战术抉择
                    </h3>
                    <span className="text-[10px] sm:text-[11px] text-amber-400 font-mono font-bold">
                      比分: {userTeam.name} {userScore} - {oppScore} {oppTeam.name}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold shrink-0">
                  关键决策
                </span>
              </div>

              {!eventProcessed ? (
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="p-2.5 sm:p-3 bg-[#0d1017] border border-[#232834] rounded-xl text-xs text-slate-300 leading-relaxed">
                    🏀 第 <span className="text-amber-400 font-bold">{currentQuarter}</span> 节关键回合！选择战术选项，成功可获 <span className="text-amber-400 font-bold">属性点 +1</span> 与额外粉丝收益：
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {currentTacticalOptions.map((opt) => {
                      const isHighProb = opt.prob >= 0.75;
                      const isMedProb = opt.prob >= 0.50;

                      let borderStyle = 'border-amber-500/30 hover:border-amber-400';
                      let badgeStyle = 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                      if (opt.isNeutral) {
                        borderStyle = 'border-blue-500/30 hover:border-blue-400 bg-[#121826]';
                        badgeStyle = 'text-blue-300 bg-blue-500/10 border-blue-500/30';
                      } else if (isHighProb) {
                        borderStyle = 'border-emerald-500/30 hover:border-emerald-400';
                        badgeStyle = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                      } else if (isMedProb) {
                        borderStyle = 'border-amber-500/30 hover:border-amber-400';
                        badgeStyle = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                      } else {
                        borderStyle = 'border-purple-500/30 hover:border-purple-400';
                        badgeStyle = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleTacticalChoiceOption(opt)}
                          className={`p-2.5 sm:p-3.5 rounded-xl border bg-[#161a24] hover:bg-[#1f2535] transition-all text-left group shadow-md ${borderStyle}`}
                        >
                          <div className="flex justify-between items-center mb-1 gap-1.5">
                            <span className="text-xs font-black text-amber-300 group-hover:text-amber-200 truncate">
                              {opt.title}
                            </span>
                            <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded border shrink-0 ${badgeStyle}`}>
                              成功率 {(opt.prob * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {opt.desc}
                          </p>
                          <div className="mt-1.5 text-[9px] sm:text-[10px] text-amber-400/80 font-mono flex items-center gap-2">
                            <span>奖励: {!opt.isNeutral ? '属性点+1 / ' : ''}粉丝+{opt.fanReward}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-[#0d1017] p-3 sm:p-4 rounded-xl border border-amber-500/40 text-xs text-amber-300 font-bold leading-relaxed shadow-lg">
                    {eventFeedback}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowQuarterEvent(false);
                      setEventProcessed(false);
                      setEventFeedback(null);
                      setIsSimulating(true); // Resume simulation
                    }}
                    className="w-full py-3 sm:py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs uppercase tracking-tight shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>确认战术结果，继续比赛</span>
                    <Play className="w-4 h-4 fill-black shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Play-by-Play Logs */}
        <div className="bg-[#0d1017] border border-[#232834] rounded-2xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
          <div className="text-xs font-black italic uppercase text-slate-300 flex items-center justify-between border-b border-[#232834] pb-1.5 sm:pb-2">
            <span>
              <span className="hidden sm:inline">比赛解说实时日志</span>
              <span className="sm:hidden">比赛解说实时日志</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400">已推演 {logs.length} 条</span>
          </div>

          <div className="max-h-36 sm:max-h-52 overflow-y-auto space-y-1 sm:space-y-1.5 text-xs pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-[11px] flex items-center justify-between transition-all ${
                  log.type === 'highlight'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold shadow-sm'
                    : log.type === 'user'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : log.type === 'system'
                    ? 'bg-blue-950/20 border-blue-500/30 text-blue-300 font-bold'
                    : 'bg-[#11141b] border-[#232834] text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="font-mono text-amber-400/80 text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 bg-black/40 rounded border border-[#232834] shrink-0">
                    Q{log.quarter} {log.time}
                  </span>
                  <span className="truncate">{log.text}</span>
                </div>
                {log.points && (
                  <span className="font-mono font-black text-amber-400 text-[9px] sm:text-[10px] shrink-0 ml-1.5 sm:ml-2">
                    +{log.points}分
                  </span>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
