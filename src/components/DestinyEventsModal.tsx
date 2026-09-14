import { useMemo, useState } from 'react';
import { Check, ChevronRight, Clock3, Sparkles, X, XCircle } from 'lucide-react';
import type { GameState, Team } from '../types';
import {
  DESTINY_EVENT_VISIBLE_SEASONS,
  getVisibleDestinyEventEvaluations,
  type DestinyEventDefinition,
  type DestinyEventRecord,
  type DestinyEventStatus,
} from '../data/destinyEvents';

interface DestinyEventsModalProps {
  currentYear: number;
  teams: Team[];
  leagueHistory?: GameState['leagueHistory'];
  records: Record<string, DestinyEventRecord>;
  onTrigger: (event: DestinyEventDefinition, routeId?: string) => { success: boolean; message: string };
  onClose: () => void;
}

const STATUS_META: Record<DestinyEventStatus, { label: string; className: string }> = {
  available: { label: '可触发', className: 'border-amber-400/50 bg-amber-400/15 text-amber-300' },
  triggered: { label: '已触发', className: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300' },
  unavailable: { label: '条件不足', className: 'border-rose-400/30 bg-rose-400/10 text-rose-300' },
  expired: { label: '已失效', className: 'border-slate-600 bg-slate-800 text-slate-400' },
  upcoming: { label: '未到赛季', className: 'border-slate-600 bg-slate-800/80 text-slate-400' },
};

export function DestinyEventsModal({ currentYear, teams, leagueHistory, records, onTrigger, onClose }: DestinyEventsModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const evaluations = useMemo(
    () => getVisibleDestinyEventEvaluations(currentYear, teams, leagueHistory, records),
    [currentYear, teams, leagueHistory, records],
  );
  const ordered = useMemo(() => [...evaluations].sort((a, b) => (
    a.event.year - b.event.year || Number(b.status === 'available') - Number(a.status === 'available')
  )), [evaluations]);
  const selected = evaluations.find((item) => item.event.id === selectedId) || null;

  const handleTrigger = (routeId?: string) => {
    if (!selected) return;
    const response = onTrigger(selected.event, routeId);
    setResult(response.message);
    if (response.success) setSelectedId(null);
  };

  const conditionLine = (check: { label: string; met: boolean; required: boolean }) => (
    <div key={check.label} className={`flex items-start gap-1.5 text-[11px] leading-relaxed ${check.met ? 'text-emerald-300' : 'text-rose-300'}`}>
      {check.met ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
      <span>{check.label}{check.required ? '（必须）' : ''}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-4">
      <section className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-amber-500/35 bg-[#0d1119] shadow-[0_0_60px_rgba(245,158,11,0.15)]">
        <header className="flex items-center justify-between border-b border-[#293140] px-4 py-3.5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-white"><Sparkles className="h-4 w-4 text-amber-400" />命定事件</h2>
            <p className="mt-1 text-[11px] text-slate-400">只显示当前起 {DESTINY_EVENT_VISIBLE_SEASONS} 个赛季，事件仅能在指定赛季触发。</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-800 p-2 text-slate-400" aria-label="关闭"><X className="h-5 w-5" /></button>
        </header>

        <div className="overflow-y-auto p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">当前赛季</span>
            <strong className="font-mono text-cyan-300">{currentYear}-{currentYear + 1}</strong>
          </div>
          <div className="space-y-2">
            {ordered.map((item) => {
              const meta = STATUS_META[item.status];
              return (
                <button type="button" key={item.event.id} onClick={() => setSelectedId(item.event.id)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition active:scale-[0.99] ${item.status === 'available' ? 'border-amber-400/55 bg-amber-500/10' : 'border-[#283141] bg-[#111722]'}`}>
                  <div className="w-14 shrink-0 text-center font-mono text-xs font-black text-cyan-300">{item.event.year}<div className="text-[9px] font-normal text-slate-500">赛季</div></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-white">{item.event.title}</div>
                    <div className="mt-1 text-[10px] text-slate-500">{item.event.category}{item.event.routes?.length ? ` · ${item.event.routes.length} 条分支` : ''}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${meta.className}`}>{meta.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm">
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-amber-500/35 bg-[#111722] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div><div className="text-[10px] font-black text-amber-400">{selected.event.year}-{selected.event.year + 1} · {selected.event.category}</div><h3 className="mt-1 text-lg font-black text-white">{selected.event.title}</h3></div>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg bg-slate-800 p-1.5 text-slate-400" aria-label="返回事件列表"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 rounded-xl bg-[#0b1018] p-3 text-xs leading-relaxed text-slate-300">{selected.event.history}</p>

            <div className="mt-3 rounded-xl border border-[#2a3445] p-3">
              <div className="mb-2 text-[10px] font-black text-slate-400">触发条件</div>
              <div className="space-y-1.5">
                <div className={`flex items-center gap-1.5 text-[11px] ${currentYear === selected.event.year ? 'text-emerald-300' : 'text-slate-400'}`}><Clock3 className="h-3.5 w-3.5" />仅限 {selected.event.year}-{selected.event.year + 1} 赛季</div>
                {selected.checks.map(conditionLine)}
              </div>
            </div>

            {selected.routeEvaluations.length > 0 ? (
              <div className="mt-3 space-y-2">
                {selected.routeEvaluations.map((routeEvaluation) => {
                  const canTriggerRoute = selected.status === 'available' && routeEvaluation.available;
                  return (
                    <div key={routeEvaluation.route.id} className={`rounded-xl border p-3 ${canTriggerRoute ? 'border-amber-400/45 bg-amber-500/10' : 'border-slate-700 bg-slate-900/50'}`}>
                      <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-white">{routeEvaluation.route.title}</span><span className="text-[10px] font-black text-amber-300">{routeEvaluation.score}/{routeEvaluation.requiredScore}</span></div>
                      <div className="mt-2 space-y-1">{routeEvaluation.checks.map(conditionLine)}</div>
                      <div className="mt-2 border-t border-slate-700/70 pt-2 text-[11px] leading-relaxed text-cyan-100"><strong className="text-cyan-300">结果：</strong>{routeEvaluation.route.result}</div>
                      {canTriggerRoute && <button type="button" onClick={() => handleTrigger(routeEvaluation.route.id)} className="mt-2.5 w-full rounded-lg bg-amber-500 py-2 text-xs font-black text-black">选择“{routeEvaluation.route.title}”</button>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs leading-relaxed text-cyan-100"><strong className="text-cyan-300">结果：</strong>{selected.event.result}</div>
                {selected.status === 'available' && <button type="button" onClick={() => handleTrigger()} className="mt-3 w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-black">触发事件</button>}
              </>
            )}

            {selected.status !== 'available' && <div className={`mt-3 rounded-xl border px-3 py-2.5 text-center text-xs font-black ${STATUS_META[selected.status].className}`}>{selected.status === 'triggered' ? selected.record?.result || selected.event.result : STATUS_META[selected.status].label}</div>}
          </div>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-[#111722] p-5 text-center">
            <h3 className="text-lg font-black text-white">时间线已经改变</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{result}</p>
            <button type="button" onClick={() => setResult(null)} className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-black text-black">确认</button>
          </div>
        </div>
      )}
    </div>
  );
}
