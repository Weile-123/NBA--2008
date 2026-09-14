import { useMemo, useState } from 'react';
import { Check, ChevronRight, Clock3, LockKeyhole, ShieldCheck, Sparkles, X, XCircle } from 'lucide-react';
import type { GameState, Team } from '../types';
import {
  getDestinyEventEvaluations,
  type DestinyEventDefinition,
  type DestinyEventRecord,
  type DestinyEventStatus,
} from '../data/destinyEvents';

interface DestinyEventsModalProps {
  currentYear: number;
  teams: Team[];
  leagueHistory?: GameState['leagueHistory'];
  records: Record<string, DestinyEventRecord>;
  onTrigger: (event: DestinyEventDefinition) => { success: boolean; message: string };
  onClose: () => void;
}

const STATUS_META: Record<DestinyEventStatus, { label: string; className: string }> = {
  available: { label: '可触发', className: 'border-amber-400/60 bg-amber-400/15 text-amber-300' },
  triggered: { label: '已触发', className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
  unavailable: { label: '条件未满足', className: 'border-rose-400/35 bg-rose-400/10 text-rose-300' },
  expired: { label: '已失效', className: 'border-slate-600 bg-slate-800/70 text-slate-400' },
  upcoming: { label: '尚未到来', className: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' },
};

export function DestinyEventsModal({ currentYear, teams, leagueHistory, records, onTrigger, onClose }: DestinyEventsModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const evaluations = useMemo(
    () => getDestinyEventEvaluations(currentYear, teams, leagueHistory, records),
    [currentYear, teams, leagueHistory, records],
  );
  const ordered = useMemo(() => [...evaluations].sort((a, b) => {
    const priority: Record<DestinyEventStatus, number> = { available: 0, unavailable: 1, upcoming: 2, triggered: 3, expired: 4 };
    return priority[a.status] - priority[b.status] || Math.abs(a.event.year - currentYear) - Math.abs(b.event.year - currentYear);
  }), [evaluations, currentYear]);
  const selected = evaluations.find((item) => item.event.id === selectedId) || null;

  const handleTrigger = () => {
    if (!selected) return;
    const response = onTrigger(selected.event);
    setResult(response.message);
    if (response.success) setSelectedId(null);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-md">
      <section className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-amber-500/35 bg-[#0d1119] shadow-[0_0_70px_rgba(245,158,11,0.18)]">
        <header className="flex items-center justify-between border-b border-[#293140] bg-gradient-to-r from-amber-500/15 via-[#111824] to-cyan-500/10 px-4 py-4 sm:px-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-amber-400">
              <Sparkles className="h-4 w-4" /> 平行时空核心玩法
            </div>
            <h2 className="mt-1 text-xl font-black italic text-white">命定事件</h2>
            <p className="mt-1 text-[11px] text-slate-400">历史只在正确的赛季打开一次窗口，由你决定是否让它重演。</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:text-white" aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-3 py-2">
            <span className="text-xs font-bold text-slate-300">当前赛季</span>
            <span className="font-mono text-sm font-black text-cyan-300">{currentYear}-{currentYear + 1}</span>
          </div>
          <div className="space-y-2.5">
            {ordered.map((item) => {
              const meta = STATUS_META[item.status];
              return (
                <button
                  type="button"
                  key={item.event.id}
                  onClick={() => setSelectedId(item.event.id)}
                  className={`w-full rounded-xl border p-3 text-left transition active:scale-[0.99] ${item.status === 'available' ? 'border-amber-400/55 bg-gradient-to-r from-amber-500/15 to-[#111722] shadow-[0_0_20px_rgba(245,158,11,0.08)]' : 'border-[#283141] bg-[#111722] hover:border-slate-600'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border ${meta.className}`}>
                      <span className="text-[9px] font-bold">赛季</span><span className="font-mono text-sm font-black">{item.event.year}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-black text-white">{item.event.title}</h3>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black ${meta.className}`}>{meta.label}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{item.event.history}</p>
                    </div>
                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#111722] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div><span className="text-[10px] font-black tracking-wider text-amber-400">{selected.event.year}-{selected.event.year + 1} · {selected.event.category}</span><h3 className="mt-1 text-xl font-black italic text-white">{selected.event.title}</h3></div>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg bg-slate-800 p-1.5 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{selected.event.history}</p>
            <div className="mt-4 rounded-xl border border-[#2a3445] bg-[#0b1018] p-3">
              <div className="mb-2 text-[10px] font-black tracking-wider text-slate-400">触发条件</div>
              <div className="space-y-2">
                {selected.checks.map((check) => <div key={check.label} className={`flex items-center gap-2 text-xs ${check.met ? 'text-emerald-300' : 'text-rose-300'}`}>{check.met ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}<span>{check.label}</span></div>)}
                <div className={`flex items-center gap-2 text-xs ${currentYear === selected.event.year ? 'text-emerald-300' : 'text-slate-400'}`}><Clock3 className="h-4 w-4" /><span>仅限 {selected.event.year}-{selected.event.year + 1} 赛季</span></div>
              </div>
            </div>
            {selected.status === 'triggered' && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-200"><ShieldCheck className="mr-1 inline h-4 w-4" />{selected.record?.result || selected.event.result}</div>}
            {selected.status === 'available' ? (
              <button type="button" onClick={handleTrigger} className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-3 text-sm font-black text-black shadow-lg shadow-amber-500/20">触发命定事件</button>
            ) : (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-xs font-bold text-slate-400"><LockKeyhole className="h-4 w-4" />{STATUS_META[selected.status].label}</div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/45 bg-[#111722] p-5 text-center shadow-2xl">
            <Sparkles className="mx-auto h-9 w-9 text-amber-400" />
            <h3 className="mt-2 text-lg font-black text-white">时间线已经改变</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{result}</p>
            <button type="button" onClick={() => setResult(null)} className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-black text-black">确认结果</button>
          </div>
        </div>
      )}
    </div>
  );
}
