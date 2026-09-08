import React from 'react';
import { TradeModalData } from '../data/realTradesData';
import { Team } from '../types';
import { TeamLogo } from './TeamLogo';
import { ArrowLeftRight, Sparkles, Check, ArrowRight, UserX, UserCheck } from 'lucide-react';

interface RealTradesModalProps {
  modalData: TradeModalData;
  teams: Team[];
  onConfirm: () => void;
}

export const RealTradesModal: React.FC<RealTradesModalProps> = ({
  modalData,
  teams,
  onConfirm,
}) => {
  const findTeam = (id: string) => teams.find((t) => t.id === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#11151e] rounded-2xl max-w-3xl w-full p-3 sm:p-6 shadow-2xl space-y-3 sm:space-y-5 my-auto relative animate-scaleUp">
        {/* Header section */}
        <div className="text-center space-y-1 border-b border-[#232834] pb-2.5 sm:pb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-black uppercase">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{modalData.seasonName}</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black italic uppercase text-white tracking-tight">
            重磅交易与人员变动
          </h2>
        </div>

        {/* Trade cards list */}
        <div className="max-h-[65vh] overflow-y-auto space-y-2.5 sm:space-y-3 pr-1 custom-scrollbar">
          {[...modalData.executedTrades]
            .sort((a, b) => {
              const isARetire = a.type === 'retire';
              const isBRetire = b.type === 'retire';
              if (isARetire && !isBRetire) return 1;
              if (!isARetire && isBRetire) return -1;
              return 0;
            })
            .map((trade, idx) => {
            const tradeType = trade.type || 'swap';

            if (tradeType === 'league_change' && trade.leagueChangeDetail) {
              const d = trade.leagueChangeDetail;
              return (
                <div
                  key={trade.id || idx}
                  className="bg-[#0d1017] border border-amber-500/40 rounded-xl p-2.5 sm:p-3 space-y-1.5 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400 border-b border-[#1b202e] pb-1">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      #{idx + 1} · {d.title}
                    </span>
                  </div>
                  <div className="bg-[#141923] p-2 sm:p-3 rounded-lg border border-[#232a3c]">
                    <span className="text-xs sm:text-sm font-bold text-slate-200">{d.description}</span>
                  </div>
                </div>
              );
            }

            if (tradeType === 'swap' && trade.playerA && trade.playerB) {
              const teamAObj = findTeam(trade.playerA.fromTeamId);
              const teamBObj = findTeam(trade.playerA.toTeamId);
              const teamBFromObj = findTeam(trade.playerB.fromTeamId);
              const teamBToObj = findTeam(trade.playerB.toTeamId);

              return (
                <div
                  key={trade.id || idx}
                  className="bg-[#0d1017] border border-[#232834] hover:border-amber-500/40 rounded-xl p-2.5 sm:p-3 space-y-2 transition-all"
                >
                  {/* Header / Index */}
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400 border-b border-[#1b202e] pb-1">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      #{idx + 1} · 球员双向互换
                    </span>
                  </div>

                  {/* Swap Row / Cards */}
                  <div className="space-y-1.5">
                    {/* Player A row */}
                    <div className="flex items-center justify-between bg-[#141923] p-2 rounded-lg border border-[#232a3c] gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs sm:text-sm font-black text-amber-300 whitespace-normal">
                          {trade.playerA.name}
                        </span>
                        <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                          ({trade.playerA.position} · OVR {trade.playerA.ovr})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-[#0a0d14] p-1 rounded-lg border border-[#1c2233]" title={trade.playerA.fromTeamName}>
                          <TeamLogo team={teamAObj} teamId={trade.playerA.fromTeamId} name={trade.playerA.fromTeamName} className="w-6 h-6 shrink-0 object-contain" />
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div className="flex items-center bg-amber-500/10 p-1 rounded-lg border border-amber-500/30" title={trade.playerA.toTeamName}>
                          <TeamLogo team={teamBObj} teamId={trade.playerA.toTeamId} name={trade.playerA.toTeamName} className="w-6 h-6 shrink-0 object-contain" />
                        </div>
                      </div>
                    </div>

                    {/* Player B row */}
                    <div className="flex items-center justify-between bg-[#141923] p-2 rounded-lg border border-[#232a3c] gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs sm:text-sm font-black text-amber-300 whitespace-normal">
                          {trade.playerB.name}
                        </span>
                        <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                          ({trade.playerB.position} · OVR {trade.playerB.ovr})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-[#0a0d14] p-1 rounded-lg border border-[#1c2233]" title={trade.playerB.fromTeamName}>
                          <TeamLogo team={teamBFromObj} teamId={trade.playerB.fromTeamId} name={trade.playerB.fromTeamName} className="w-6 h-6 shrink-0 object-contain" />
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div className="flex items-center bg-amber-500/10 p-1 rounded-lg border border-amber-500/30" title={trade.playerB.toTeamName}>
                          <TeamLogo team={teamBToObj} teamId={trade.playerB.toTeamId} name={trade.playerB.toTeamName} className="w-6 h-6 shrink-0 object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (tradeType === 'three_way' && trade.threeWayMovesDetails) {
              const moveCount = trade.threeWayMovesDetails.length;
              const isMultiWay = moveCount >= 4;

              return (
                <div
                  key={trade.id || idx}
                  className="bg-[#0d1017] border border-cyan-500/40 hover:border-cyan-400 rounded-xl p-2.5 sm:p-3 space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400 border-b border-[#1b202e] pb-1">
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      #{idx + 1} · 多方交易
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {trade.threeWayMovesDetails.map((m, mIdx) => {
                      const fromTeamObj = findTeam(m.fromTeamId);
                      const toTeamObj = findTeam(m.toTeamId);
                      return (
                        <div
                          key={mIdx}
                          className="flex items-center justify-between bg-[#141923] p-2 rounded-lg border border-[#232a3c] gap-2"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs sm:text-sm font-black text-amber-300 whitespace-normal">
                              {m.playerName}
                            </span>
                            <span className="hidden sm:inline text-[10px] font-mono text-slate-400">
                              ({m.position} · OVR {m.ovr})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center bg-[#0a0d14] p-1 rounded-lg border border-[#1c2233]" title={m.fromTeamName}>
                              <TeamLogo team={fromTeamObj} teamId={m.fromTeamId} name={m.fromTeamName} className="w-6 h-6 shrink-0 object-contain" />
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <div className="flex items-center bg-cyan-500/10 p-1 rounded-lg border border-cyan-500/30" title={m.toTeamName}>
                              <TeamLogo team={toTeamObj} teamId={m.toTeamId} name={m.toTeamName} className="w-6 h-6 shrink-0 object-contain" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (tradeType === 'single_move' && trade.singleMoveDetail) {
              const d = trade.singleMoveDetail;
              const fromTeamObj = findTeam(d.fromTeamId);
              const toTeamObj = findTeam(d.toTeamId);

              return (
                <div
                  key={trade.id || idx}
                  className="bg-[#0d1017] border border-purple-500/40 hover:border-purple-400 rounded-xl p-2.5 sm:p-3 space-y-1.5 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400 border-b border-[#1b202e] pb-1">
                    <span className="font-bold text-purple-400 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      #{idx + 1} · 自由签约 / 转会
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#141923] p-2 rounded-lg border border-[#232a3c] gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs sm:text-sm font-black text-amber-300 whitespace-normal">
                        {d.playerName}
                      </span>
                      <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                        ({d.position} · OVR {d.ovr})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center bg-[#0a0d14] p-1 rounded-lg border border-[#1c2233]" title={d.fromTeamName}>
                        <TeamLogo team={fromTeamObj} teamId={d.fromTeamId} name={d.fromTeamName} className="w-6 h-6 shrink-0 object-contain" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <div className="flex items-center bg-purple-500/10 p-1 rounded-lg border border-purple-500/30" title={d.toTeamName}>
                        <TeamLogo team={toTeamObj} teamId={d.toTeamId} name={d.toTeamName} className="w-6 h-6 shrink-0 object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (tradeType === 'retire' && trade.retireDetail) {
              const r = trade.retireDetail;
              const fromTeamObj = findTeam(r.fromTeamId);

              return (
                <div
                  key={trade.id || idx}
                  className="bg-[#0d1017] border border-rose-500/40 hover:border-rose-400 rounded-xl p-2.5 sm:p-3 space-y-1.5 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-400 border-b border-[#1b202e] pb-1">
                    <span className="font-bold text-rose-400 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                      #{idx + 1} · 球员退役
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#141923] p-2 rounded-lg border border-[#232a3c] gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs sm:text-sm font-black text-rose-300 whitespace-normal">
                        {r.playerName}
                      </span>
                      <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                        ({r.position} · OVR {r.ovr})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1 pr-2 rounded-lg border border-[#1c2233] shrink-0" title={r.fromTeamName}>
                      <TeamLogo team={fromTeamObj} teamId={r.fromTeamId} name={r.fromTeamName} className="w-6 h-6 shrink-0 object-contain" />
                      <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 font-mono">退役</span>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Modal Footer / Confirm Button */}
        <div className="pt-2 border-t border-[#232834]">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs sm:text-sm uppercase tracking-tight shadow-xl transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>确认变动</span>
          </button>
        </div>
      </div>
    </div>
  );
};

