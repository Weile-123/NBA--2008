import { useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Clock3, MonitorPlay, Sparkles, X, XCircle } from 'lucide-react';
import type { GameState, Team } from '../types';
import {
  DESTINY_EVENT_DEADLINE_GAME,
  getDestinyEventEvaluations,
  type DestinyEventDefinition,
  type DestinyEventRecord,
  type DestinyEventStatus,
} from '../data/destinyEvents';
import { MobilePersistentScrollbar } from './MobilePersistentScrollbar';

interface DestinyEventsModalProps {
  currentYear: number;
  currentGame: number;
  teams: Team[];
  leagueHistory?: GameState['leagueHistory'];
  records: Record<string, DestinyEventRecord>;
  adUnlocks?: Record<string, string[]>;
  onTrigger: (event: DestinyEventDefinition, routeId?: string) => { success: boolean; message: string };
  onIgnore: (event: DestinyEventDefinition) => { success: boolean; message: string };
  onUnlockCondition: (eventId: string, unlockKey: string) => Promise<boolean>;
  onClose: () => void;
}

const STATUS_META: Record<DestinyEventStatus, { label: string; className: string }> = {
  available: { label: '可触发', className: 'border-amber-400/50 bg-amber-400/15 text-amber-300' },
  triggered: { label: '已触发', className: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300' },
  ignored: { label: '已忽略', className: 'border-slate-600 bg-slate-800 text-slate-400' },
  unavailable: { label: '条件不足', className: 'border-rose-400/30 bg-rose-400/10 text-rose-300' },
  expired: { label: '已失效', className: 'border-slate-600 bg-slate-800 text-slate-400' },
  upcoming: { label: '未到赛季', className: 'border-slate-600 bg-slate-800/80 text-slate-400' },
};

export function DestinyEventsModal({ currentYear, currentGame, teams, leagueHistory, records, adUnlocks = {}, onTrigger, onIgnore, onUnlockCondition, onClose }: DestinyEventsModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [unlockingKey, setUnlockingKey] = useState<string | null>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const evaluations = useMemo(
    () => getDestinyEventEvaluations(currentYear, teams, leagueHistory, records, adUnlocks),
    [currentYear, teams, leagueHistory, records, adUnlocks],
  );
  const ordered = useMemo(() => evaluations.filter((item) => item.status !== 'triggered' && item.status !== 'ignored').sort((a, b) => {
    const timeGroup = (year: number) => year === currentYear ? 0 : year > currentYear ? 1 : 2;
    const groupDifference = timeGroup(a.event.year) - timeGroup(b.event.year);
    if (groupDifference !== 0) return groupDifference;
    if (a.event.year !== b.event.year) {
      return a.event.year > currentYear ? a.event.year - b.event.year : b.event.year - a.event.year;
    }
    const statusPriority: Record<DestinyEventStatus, number> = { available: 0, unavailable: 1, upcoming: 2, expired: 3, triggered: 4, ignored: 5 };
    return statusPriority[a.status] - statusPriority[b.status];
  }), [evaluations, currentYear]);
  const handled = useMemo(() => evaluations
    .filter((item) => item.status === 'triggered' || item.status === 'ignored')
    .sort((a, b) => b.event.year - a.event.year), [evaluations]);
  const displayedEvents = showAll ? ordered : ordered.slice(0, 5);
  const selected = evaluations.find((item) => item.event.id === selectedId) || null;
  const deadlinePassed = currentGame > DESTINY_EVENT_DEADLINE_GAME;
  const selectedDeadlinePassed = deadlinePassed && selected?.event.year === currentYear;

  const handleTrigger = (routeId?: string) => {
    if (!selected) return;
    const response = onTrigger(selected.event, routeId);
    setResult(response.message);
    if (response.success) setSelectedId(null);
  };

  const handleIgnore = () => {
    if (!selected) return;
    const response = onIgnore(selected.event);
    setResult(response.message);
    if (response.success) setSelectedId(null);
  };

  const handleAdUnlock = async (eventId: string, unlockKey: string) => {
    if (unlockingKey) return;
    setUnlockingKey(unlockKey);
    await onUnlockCondition(eventId, unlockKey);
    setUnlockingKey(null);
  };

  const conditionLine = (check: { label: string; met: boolean; required: boolean; points: number; unlockKey: string }, canUnlock = false) => (
    <div key={check.unlockKey || check.label} className={`flex items-start gap-1.5 text-[11px] leading-relaxed ${check.met ? 'text-emerald-300' : 'text-rose-300'}`}>
      {check.met ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
      <span className="min-w-0 flex-1">{check.label}{check.required ? '（必须）' : ''}</span>
      {canUnlock && !check.met && !check.required && check.points === 1 && (
        <button
          type="button"
          disabled={unlockingKey !== null}
          onClick={() => void handleAdUnlock(selected!.event.id, check.unlockKey)}
          className="ml-1 flex shrink-0 items-center gap-1 rounded-md border border-violet-400/40 bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-black text-violet-200 disabled:opacity-50"
          aria-label="看广告解锁该条件"
        >
          <MonitorPlay className={`h-3 w-3 ${unlockingKey === check.unlockKey ? 'animate-pulse' : ''}`} />解锁
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-4">
      <section className="flex h-[94dvh] max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-amber-500/35 bg-[#0d1119] shadow-[0_0_60px_rgba(245,158,11,0.15)]">
        <header className="flex items-center justify-between border-b border-[#293140] px-4 py-3.5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-white"><Sparkles className="h-4 w-4 text-amber-400" />命定事件</h2>
            <p className="mt-1 text-[11px] text-slate-400">当季事件须在第 {DESTINY_EVENT_DEADLINE_GAME} 场结束前处理。</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-800 p-2 text-slate-400" aria-label="关闭"><X className="h-5 w-5" /></button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={listScrollRef} className="absolute inset-0 overflow-y-auto p-3 pr-5 sm:p-4">
          <div className="mb-3 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-slate-300">
            命定事件取材于现实历史。请在当季交易截止日（第 {DESTINY_EVENT_DEADLINE_GAME} 场结束前）作出选择；未处理的事件会在第 {DESTINY_EVENT_DEADLINE_GAME + 1} 场自动按“忽略”结算并失效。
          </div>
          <div className="mb-3 text-xs text-slate-400">
            当前赛季：<strong className="font-mono text-cyan-300">{currentYear}-{currentYear + 1}</strong>
          </div>
          {handled.length > 0 && (
            <section className="mb-4 overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04]">
              <div className="border-b border-emerald-500/20 px-3 py-2 text-[11px] font-black text-emerald-300">已完成与已忽略事件</div>
              <div className="divide-y divide-slate-700/60">
                {handled.map((item) => (
                  <button key={item.event.id} type="button" onClick={() => setSelectedId(item.event.id)} className="grid w-full grid-cols-[42px_1fr_auto] items-center gap-2 px-3 py-2.5 text-left">
                    <span className="font-mono text-[10px] text-cyan-300">{item.event.year}</span>
                    <span className="min-w-0 text-xs font-bold text-slate-100">{item.event.title}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${STATUS_META[item.status].className}`}>{item.record?.autoIgnored ? '截止日失效' : STATUS_META[item.status].label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="mb-2 text-[11px] font-black text-slate-400">待处理与未来事件</div>
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

            {selected.status === 'triggered' || selected.status === 'ignored' ? (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="text-[10px] font-black text-emerald-300">{selected.status === 'ignored' ? '事件已忽略' : '事件已完成'}{selected.record?.routeTitle ? ` · ${selected.record.routeTitle}` : ''}</div>
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
                    {selected.checks.map((check) => conditionLine(
                      check,
                      currentYear === selected.event.year && !selectedDeadlinePassed && selected.routeEvaluations.length === 0
                        && selected.checks.filter((item) => item.required).every((item) => item.met)
                        && selected.score === selected.requiredScore - 1,
                    ))}
                  </div>
                </div>

                {selected.routeEvaluations.length > 0 ? (
                  <div className="divide-y divide-slate-700/70">
                    {selected.routeEvaluations.filter((routeEvaluation) => !routeEvaluation.route.fallback).map((routeEvaluation) => {
                      return (
                        <section key={routeEvaluation.route.id} className="py-3">
                          <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-white">{routeEvaluation.route.title}</span><span className="text-[10px] font-black text-amber-300">条件 {routeEvaluation.score}/{routeEvaluation.requiredScore}</span></div>
                          <div className="mt-2 space-y-1">{routeEvaluation.checks.map((check) => conditionLine(
                            check,
                            currentYear === selected.event.year && !selectedDeadlinePassed
                              && selected.checks.filter((item) => item.required).every((item) => item.met)
                              && routeEvaluation.checks.filter((item) => item.required).every((item) => item.met)
                              && routeEvaluation.score === routeEvaluation.requiredScore - 1,
                          ))}</div>
                          <p className="mt-2 text-[11px] leading-relaxed text-cyan-100"><strong className="text-cyan-300">结果：</strong>{routeEvaluation.route.result}</p>
                          <button
                            type="button"
                            disabled={!routeEvaluation.available || selectedDeadlinePassed}
                            onClick={() => handleTrigger(routeEvaluation.route.id)}
                            className="primary-action-text mt-2.5 w-full rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-black text-black disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-100"
                          >
                            {selectedDeadlinePassed ? '交易截止日已过' : routeEvaluation.available ? `选择“${routeEvaluation.route.title}”` : selected.status === 'upcoming' ? '未到赛季' : '条件未满足'}
                          </button>
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
              {selected.status === 'triggered' || selected.status === 'ignored' ? (
                <button type="button" onClick={() => setSelectedId(null)} className="w-full rounded-xl border border-emerald-500/35 bg-emerald-500/10 py-2.5 text-sm font-black text-emerald-300">返回事件列表</button>
              ) : (
                <div className="grid gap-2">
                  {selected.status === 'available' && selected.routeEvaluations.length === 0 && <button type="button" disabled={selectedDeadlinePassed} onClick={() => handleTrigger()} className="primary-action-text w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-black disabled:bg-slate-800 disabled:text-slate-500">{selectedDeadlinePassed ? '交易截止日已过' : '触发事件'}</button>}
                  {selected.event.year === currentYear && !selectedDeadlinePassed && (
                    <button type="button" onClick={handleIgnore} className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-black text-slate-200">
                      忽略
                    </button>
                  )}
                  {(selected.event.year !== currentYear || selectedDeadlinePassed) && <div className={`rounded-xl border px-3 py-2.5 text-center text-xs font-black ${STATUS_META[selectedDeadlinePassed ? 'expired' : selected.status].className}`}>{selectedDeadlinePassed ? '交易截止日后事件失效' : STATUS_META[selected.status].label}</div>}
                </div>
              )}
            </footer>
          </div>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-[#111722] p-5 text-center">
            <h3 className="text-lg font-black text-white">选择已记录</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{result}</p>
            <button type="button" onClick={() => setResult(null)} className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-black text-black">确认</button>
          </div>
        </div>
      )}
    </div>
  );
}
