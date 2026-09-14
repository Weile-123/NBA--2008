import { useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Clock3, Sparkles, X, XCircle } from 'lucide-react';
import type { GameState, Team } from '../types';
import {
  getDestinyEventEvaluations,
  type DestinyEventDefinition,
  type DestinyEventRecord,
  type DestinyEventStatus,
} from '../data/destinyEvents';
import { MobilePersistentScrollbar } from './MobilePersistentScrollbar';

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
  const [showAll, setShowAll] = useState(false);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const evaluations = useMemo(
    () => getDestinyEventEvaluations(currentYear, teams, leagueHistory, records),
    [currentYear, teams, leagueHistory, records],
  );
  const ordered = useMemo(() => [...evaluations].sort((a, b) => {
    const timeGroup = (year: number) => year === currentYear ? 0 : year > currentYear ? 1 : 2;
    const groupDifference = timeGroup(a.event.year) - timeGroup(b.event.year);
    if (groupDifference !== 0) return groupDifference;
    if (a.event.year !== b.event.year) {
      return a.event.year > currentYear ? a.event.year - b.event.year : b.event.year - a.event.year;
    }
    const statusPriority: Record<DestinyEventStatus, number> = { available: 0, triggered: 1, unavailable: 2, upcoming: 3, expired: 4 };
    return statusPriority[a.status] - statusPriority[b.status];
  }), [evaluations, currentYear]);
  const displayedEvents = showAll ? ordered : ordered.slice(0, 5);
  const selected = evaluations.find((item) => item.event.id === selectedId) || null;
  const availableRoutes = selected?.routeEvaluations.filter((route) => selected.status === 'available' && route.available) || [];

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
      <section className="flex h-[94dvh] max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-amber-500/35 bg-[#0d1119] shadow-[0_0_60px_rgba(245,158,11,0.15)]">
        <header className="flex items-center justify-between border-b border-[#293140] px-4 py-3.5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-white"><Sparkles className="h-4 w-4 text-amber-400" />命定事件</h2>
            <p className="mt-1 text-[11px] text-slate-400">事件仅能在指定赛季触发。</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-800 p-2 text-slate-400" aria-label="关闭"><X className="h-5 w-5" /></button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={listScrollRef} className="absolute inset-0 overflow-y-auto p-3 pr-5 sm:p-4">
          <div className="mb-3 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-slate-300">
            命定事件取材于现实中真实发生或曾有可能发生的联盟事件。当前置条件达成后，你可以决定是否触发，并在关键事件中选择时间线的走向。
          </div>
          <div className="mb-3 text-xs text-slate-400">
            当前赛季：<strong className="font-mono text-cyan-300">{currentYear}-{currentYear + 1}</strong>
          </div>
          <div className="space-y-2">
            {displayedEvents.map((item) => {
              const meta = STATUS_META[item.status];
              return (
                <button type="button" key={item.event.id} onClick={() => setSelectedId(item.event.id)} className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-3 text-left transition active:scale-[0.99] sm:gap-3 sm:px-3 ${item.status === 'available' ? 'border-amber-400/55 bg-amber-500/10' : 'border-[#283141] bg-[#111722]'}`}>
                  <div className="w-10 shrink-0 text-center font-mono text-[11px] font-black text-cyan-300 sm:w-12 sm:text-xs">{item.event.year}<div className="text-[8px] font-normal text-slate-500">赛季</div></div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[13px] font-black leading-snug text-white sm:text-sm">{item.event.title}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${meta.className}`}>{meta.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
                </button>
              );
            })}
          </div>
          {ordered.length > 5 && (
            <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 text-xs font-black text-slate-300">
              {showAll ? '收起事件' : `展开其余 ${ordered.length - 5} 个事件`}
            </button>
          )}
        </div>
        <MobilePersistentScrollbar scrollRef={listScrollRef} />
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm">
          <div className="flex h-[92dvh] max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-amber-500/35 bg-[#111722] shadow-2xl">
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-700/70 p-4">
              <div><div className="text-[10px] font-black text-amber-400">{selected.event.year}-{selected.event.year + 1} · {selected.event.category}</div><h3 className="mt-1 text-lg font-black text-white">{selected.event.title}</h3></div>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg bg-slate-800 p-1.5 text-slate-400" aria-label="返回事件列表"><X className="h-4 w-4" /></button>
            </header>

            <div className="relative min-h-0 flex-1 overflow-hidden">
            <div ref={detailScrollRef} className="absolute inset-0 overflow-y-auto p-4 pr-6">
            <p className="text-xs leading-relaxed text-slate-300">{selected.event.history}</p>

            {selected.status === 'triggered' ? (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="text-[10px] font-black text-emerald-300">事件已完成{selected.record?.routeTitle ? ` · ${selected.record.routeTitle}` : ''}</div>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100">{selected.record?.result || selected.event.result}</p>
              </div>
            ) : (
              <>
                <div className="mt-4 border-y border-slate-700/70 py-3">
                  <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black text-slate-400">
                    <span>触发条件</span>
                    {selected.routeEvaluations.length === 0 && selected.requiredScore > 0 && <span className="text-amber-300">条件 {selected.score}/{selected.requiredScore}</span>}
                  </div>
                  <div className="space-y-1.5">
                    <div className={`flex items-center gap-1.5 text-[11px] ${currentYear === selected.event.year ? 'text-emerald-300' : 'text-slate-400'}`}><Clock3 className="h-3.5 w-3.5" />仅限 {selected.event.year}-{selected.event.year + 1} 赛季</div>
                    {selected.checks.map(conditionLine)}
                  </div>
                </div>

                {selected.routeEvaluations.length > 0 ? (
                  <div className="divide-y divide-slate-700/70">
                    {selected.routeEvaluations.map((routeEvaluation) => {
                      return (
                        <section key={routeEvaluation.route.id} className="py-3">
                          <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-white">{routeEvaluation.route.title}</span><span className="text-[10px] font-black text-amber-300">条件 {routeEvaluation.score}/{routeEvaluation.requiredScore}</span></div>
                          <div className="mt-2 space-y-1">{routeEvaluation.checks.map(conditionLine)}</div>
                          <p className="mt-2 text-[11px] leading-relaxed text-cyan-100"><strong className="text-cyan-300">结果：</strong>{routeEvaluation.route.result}</p>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <p className="mt-3 text-xs leading-relaxed text-cyan-100"><strong className="text-cyan-300">结果：</strong>{selected.event.result}</p>
                  </>
                )}
              </>
            )}
            </div>
            <MobilePersistentScrollbar scrollRef={detailScrollRef} />
            </div>

            <footer className="shrink-0 border-t border-slate-700/70 bg-[#0d121b] p-3">
              {selected.status === 'triggered' ? (
                <button type="button" onClick={() => setSelectedId(null)} className="w-full rounded-xl border border-emerald-500/35 bg-emerald-500/10 py-2.5 text-sm font-black text-emerald-300">返回事件列表</button>
              ) : availableRoutes.length > 0 ? (
                <div className="grid gap-2">
                  {availableRoutes.map((route) => <button key={route.route.id} type="button" onClick={() => handleTrigger(route.route.id)} className="w-full rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-black text-black">选择“{route.route.title}”</button>)}
                </div>
              ) : selected.status === 'available' ? (
                <button type="button" onClick={() => handleTrigger()} className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-black">触发事件</button>
              ) : (
                <div className={`rounded-xl border px-3 py-2.5 text-center text-xs font-black ${STATUS_META[selected.status].className}`}>{STATUS_META[selected.status].label}</div>
              )}
            </footer>
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
