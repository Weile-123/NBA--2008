import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Flame,
  Globe,
  Loader2,
  MessageSquareText,
  Play,
  PlusCircle,
  Shuffle,
  Sparkles,
  Trophy,
  UserCheck,
  X,
} from 'lucide-react';
import { GameMode, GAME_MODE_CONFIG } from '../gameMode';
import { loadGlobalHallOfFame, retryPendingGlobalHallOfFameUpload } from '../lib/globalLeaderboard';
import { getSaveMeta, hydrateGameStorage, SaveMeta } from '../utils/storage';
import { TeamLogo } from './TeamLogo';
import { UpdateAnnouncementModal } from './UpdateAnnouncementModal';
import { UserFeedbackModal } from './UserFeedbackModal';

interface HomeScreenProps {
  onLaunchMode: (mode: GameMode, action: 'new' | 'continue') => void;
  onOpenHallOfFame: () => void;
  onOpenGlobalHallOfFame?: () => void;
}

const MODES: GameMode[] = ['classic', 'random_trade'];

function formatSavedAt(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onLaunchMode,
  onOpenHallOfFame,
  onOpenGlobalHallOfFame,
}) => {
  const [topLegendName, setTopLegendName] = useState('');
  const [topLegendScore, setTopLegendScore] = useState<number | null>(null);
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [isBannerTimeout, setIsBannerTimeout] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [saveRevision, setSaveRevision] = useState(0);
  const [modeSavesReady, setModeSavesReady] = useState(false);
  const [pendingNewMode, setPendingNewMode] = useState<GameMode | null>(null);
  const [isParallelInfoOpen, setIsParallelInfoOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all(MODES.map((mode) => hydrateGameStorage(mode))).finally(() => {
      if (!active) return;
      setSaveRevision((value) => value + 1);
      setModeSavesReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const loadTopLegend = () => {
      if (!isMounted) return;
      void retryPendingGlobalHallOfFameUpload()
        .catch((error) => console.warn('全网传奇榜待上传记录暂未同步', error))
        .finally(() => loadGlobalHallOfFame()
          .then((records) => {
            if (!isMounted) return;
            const first = records?.[0];
            setTopLegendName(first?.player?.name || '');
            setTopLegendScore(first?.goatScore || null);
            setIsBannerLoading(false);
            setIsBannerTimeout(false);
          })
          .catch((error: Error) => {
            if (!isMounted) return;
            const timedOut = error?.name === 'GlobalHofTimeoutError' || error?.message?.includes('timed out');
            if (timedOut) {
              setIsBannerLoading(true);
              setIsBannerTimeout(true);
              retryTimer = setTimeout(loadTopLegend, 3500);
            } else {
              setTopLegendName('');
              setTopLegendScore(null);
              setIsBannerLoading(false);
              setIsBannerTimeout(false);
            }
          }));
    };

    loadTopLegend();
    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const savesByMode = useMemo<Record<GameMode, SaveMeta>>(() => ({
    classic: getSaveMeta('classic'),
    random_trade: getSaveMeta('random_trade'),
  }), [saveRevision]);

  const renderModeCard = (mode: GameMode) => {
    const isClassic = mode === 'classic';
    const meta = savesByMode[mode];
    const hasSave = modeSavesReady && !meta.isEmpty;
    const accent = isClassic ? 'amber' : 'cyan';

    return (
      <article
        key={mode}
        className={`relative flex min-h-[224px] flex-col overflow-hidden rounded-2xl border p-3.5 text-left shadow-2xl sm:min-h-[250px] sm:p-5 ${
          isClassic
            ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/15 via-[#151922] to-[#0d1118] shadow-amber-950/30'
            : 'border-cyan-400/45 bg-gradient-to-br from-cyan-500/15 via-[#121925] to-violet-500/10 shadow-cyan-950/30'
        }`}
      >
        <div className={`absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl ${isClassic ? 'bg-amber-400/10' : 'bg-cyan-400/10'}`} />

        <div className="relative flex items-start justify-between gap-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border sm:h-12 sm:w-12 ${
            isClassic ? 'border-amber-400/40 bg-amber-500/15' : 'border-cyan-300/40 bg-cyan-400/10'
          }`}>
            {isClassic
              ? <Trophy className="h-5 w-5 text-amber-300 sm:h-6 sm:w-6" />
              : <Shuffle className="h-5 w-5 text-cyan-300 sm:h-6 sm:w-6" />}
          </div>
          {!isClassic && (
            <button
              type="button"
              onClick={() => setIsParallelInfoOpen(true)}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-cyan-300/70 bg-gradient-to-r from-cyan-400/30 to-violet-400/20 px-2.5 py-1.5 text-[9px] font-black text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.22)] transition-all hover:border-cyan-200 hover:bg-cyan-400/40 active:scale-95 sm:text-[10px]"
              aria-label="查看平行联盟模式介绍"
            >
              新模式：玩法说明
            </button>
          )}
        </div>

        <div className="relative mt-3">
          <h3 className="text-sm font-black italic text-white sm:text-lg">{GAME_MODE_CONFIG[mode].name}</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-400 sm:text-xs">
            {isClassic
              ? '还原历史真实选秀与交易，沿真实联盟轨迹开启生涯。'
              : '联盟交易独立生成，每次生涯都会形成不同的球队格局。'}
          </p>
        </div>

        <div className="relative mt-auto pt-3">
          {hasSave ? (
            <div className={`mb-2.5 rounded-xl border p-2.5 ${isClassic ? 'border-amber-500/25 bg-black/20' : 'border-cyan-400/20 bg-black/20'}`}>
              <div className="flex min-w-0 items-center gap-2">
                <TeamLogo
                  logo={meta.currentTeamLogo}
                  abbrev={meta.currentTeamAbbrev}
                  primaryColor={meta.currentTeamPrimaryColor}
                  secondaryColor={meta.currentTeamSecondaryColor}
                  className="h-7 w-7 shrink-0 object-contain sm:h-8 sm:w-8"
                  alt={meta.currentTeamName || ''}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-black text-white sm:text-sm">
                    {meta.playerName} <span className={`font-mono text-[9px] sm:text-[10px] ${isClassic ? 'text-amber-300' : 'text-cyan-300'}`}>OVR {meta.playerOvr}</span>
                  </div>
                  <div className="truncate text-[9px] text-slate-400 sm:text-[10px]">
                    {meta.currentYear}-{(meta.currentYear || 0) + 1} 赛季 · {formatSavedAt(meta.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-2.5 flex h-[50px] items-center text-[10px] text-slate-500 sm:text-xs">
              {modeSavesReady ? '暂无生涯存档' : '正在读取独立存档…'}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              disabled={!modeSavesReady}
              onClick={() => onLaunchMode(mode, hasSave ? 'continue' : 'new')}
              className={`flex min-w-0 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-1.5 py-2.5 text-[10px] font-black transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-50 sm:text-sm ${
                isClassic
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
                  : 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950'
              }`}
            >
              {hasSave ? <Play className="h-3.5 w-3.5 shrink-0 fill-current sm:h-4 sm:w-4" /> : <Sparkles className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />}
              <span>{hasSave ? '继续生涯' : `开启${isClassic ? '经典' : '新'}模式`}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            </button>
            {hasSave && (
              <button
                type="button"
                onClick={() => setPendingNewMode(mode)}
                className="flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-transparent py-1 text-[9px] font-bold text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200 active:bg-slate-800 sm:text-[11px]"
              >
                <PlusCircle className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                <span>重新开档</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="relative flex min-h-screen select-none flex-col items-center justify-between overflow-hidden bg-[#0a0d14] p-0 text-white">
      <button
        type="button"
        onClick={onOpenGlobalHallOfFame || onOpenHallOfFame}
        className="safe-area-home-banner group relative z-30 w-full cursor-pointer overflow-hidden border-b border-amber-500/40 bg-gradient-to-r from-amber-950/90 via-amber-900/95 to-amber-950/90 py-2 text-xs text-amber-200 shadow-lg"
        title="点击查看全网传奇榜"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center overflow-hidden px-4">
          <div className="z-10 flex shrink-0 items-center gap-1.5 border-r border-amber-500/30 bg-gradient-to-r from-amber-950 via-amber-950 to-transparent pr-3 text-xs font-black uppercase tracking-wider text-amber-400">
            <Trophy className="h-4 w-4 shrink-0 text-amber-400" />
            <span>全网公告</span>
          </div>
          <div className="relative flex-1 overflow-hidden whitespace-nowrap pl-3">
            <div className="animate-ticker flex items-center gap-12 font-medium">
              {[1, 2, 3, 4].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  {isBannerLoading ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />{isBannerTimeout ? '排行榜连接超时，正在重试…' : '正在同步全网传奇榜…'}</>
                  ) : topLegendName ? (
                    <>恭喜【<b className="text-amber-300">{topLegendName}</b>】登顶传奇榜！ <em className="font-mono text-[10px] not-italic text-amber-300">GOAT {topLegendScore}</em></>
                  ) : '全网传奇榜等待首位传奇球员入榜'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </button>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/30 via-[#0a0d14] to-[#05070a]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-[0.03] [background-size:24px_24px]" />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-between p-4 sm:p-8">
        <header className="flex w-full max-w-5xl items-center justify-between border-b border-amber-500/20 py-2 font-mono text-xs uppercase tracking-widest text-amber-300/80">
          <div className="flex items-center gap-2 font-bold"><Flame className="h-4 w-4 text-amber-500" />篮坛传奇：重返2008</div>
          <button
            type="button"
            onClick={() => setIsAnnouncementOpen(true)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/35 bg-amber-500/10 text-amber-300"
            aria-label="查看更新公告"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0a0d14] bg-red-500" />
          </button>
        </header>

        <main className="my-auto flex w-full max-w-4xl flex-col items-center py-5 text-center sm:py-8">
          <img
            src="./game-logo.png"
            decoding="async"
            alt="篮坛传奇：重返2008"
            width={128}
            height={128}
            loading="eager"
            fetchPriority="high"
            className="mb-3 h-20 w-20 rounded-2xl border border-amber-400/40 object-cover shadow-2xl sm:h-28 sm:w-28"
          />
          <h1 className="mb-1 bg-gradient-to-br from-white via-amber-100 to-amber-500 bg-clip-text px-4 text-3xl font-black leading-tight tracking-tight text-transparent sm:text-5xl">
            篮坛传奇：重返2008
          </h1>
          <p className="mb-5 text-xs font-black tracking-widest text-slate-400 sm:text-base">选择你的生涯轨迹 · MY CAREER</p>

          <section className="grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:gap-4" aria-label="选择游戏模式">
            {MODES.map(renderModeCard)}
          </section>

          <div className="mt-3 grid w-full max-w-2xl grid-cols-3 gap-2">
            <button type="button" onClick={onOpenHallOfFame} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#283148] bg-[#141822] px-2 py-2.5 text-[10px] font-bold text-white sm:text-xs">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />个人传奇榜
            </button>
            <button type="button" onClick={onOpenGlobalHallOfFame || onOpenHallOfFame} className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-[#141822] px-2 py-2.5 text-[10px] font-bold text-amber-300 sm:text-xs">
              <Globe className="h-3.5 w-3.5" />全网传奇榜
            </button>
            <button type="button" onClick={() => setIsFeedbackOpen(true)} className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-[#141822] px-2 py-2.5 text-[10px] font-bold text-sky-300 sm:text-xs">
              <MessageSquareText className="h-3.5 w-3.5" />用户反馈
            </button>
          </div>
        </main>

        <footer className="w-full max-w-4xl border-t border-[#1e2535] py-3 text-center text-[10px] text-slate-500 sm:text-[11px]">
          两种模式的生涯存档与个人传奇记录完全独立
        </footer>
      </div>

      {pendingNewMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-red-500/40 bg-[#121620] p-5 text-left text-slate-200 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black italic text-white">覆盖旧存档确认</h3>
                <span className="text-[10px] font-mono text-red-400">NEW CAREER</span>
              </div>
            </div>
            <p className="rounded-xl border border-[#263147] bg-[#181e2b] p-3.5 text-xs leading-relaxed text-slate-300">
              重新开启“{GAME_MODE_CONFIG[pendingNewMode].name}”将覆盖该模式当前生涯存档，另一模式的存档不会受到影响。是否继续？
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPendingNewMode(null)}
                className="rounded-xl bg-[#202838] px-4 py-2 text-xs font-bold text-slate-300"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetMode = pendingNewMode;
                  setPendingNewMode(null);
                  onLaunchMode(targetMode, 'new');
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-red-600/30 active:scale-95"
              >
                确认覆盖并新建
              </button>
            </div>
          </div>
        </div>
      )}

      {isParallelInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="presentation"
          onClick={() => setIsParallelInfoOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="parallel-mode-title"
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90svh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#101621] text-left shadow-2xl shadow-cyan-950/40"
          >
            <header className="flex items-center justify-between border-b border-cyan-400/20 bg-gradient-to-r from-cyan-500/15 to-violet-500/10 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-400/10">
                  <Shuffle className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <div className="text-[9px] font-black tracking-widest text-cyan-300">NEW GAME MODE</div>
                  <h2 id="parallel-mode-title" className="text-base font-black italic text-white">平行联盟玩法说明</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsParallelInfoOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/70 text-slate-400 active:scale-95"
                aria-label="关闭玩法说明"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 text-xs leading-relaxed text-slate-300 sm:p-5">
              <p className="text-slate-400">生涯比赛、属性养成和退役流程与经典模式一致；联盟的交易、选秀和球队发展会走向全新的时间线。两个模式的存档与个人传奇记录完全独立。</p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3">
                  <div className="mb-2 flex items-center gap-1.5 font-black text-amber-300">
                    <Trophy className="h-3.5 w-3.5" />经典模式
                  </div>
                  <ul className="space-y-1.5 text-[10px] text-slate-400 sm:text-[11px]">
                    <li>• 还原历史真实交易</li>
                    <li>• 沿用历史选秀名单与归属</li>
                    <li>• 球队格局贴近真实时间线</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.07] p-3">
                  <div className="mb-2 flex items-center gap-1.5 font-black text-cyan-300">
                    <Shuffle className="h-3.5 w-3.5" />平行联盟
                  </div>
                  <ul className="space-y-1.5 text-[10px] text-slate-300 sm:text-[11px]">
                    <li>• 后续赛季动态生成交易</li>
                    <li>• 生成新秀，选秀归属随战绩变化</li>
                    <li>• 球队方向随联盟发展调整</li>
                    <li>• 可选择是否重演命定事件</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-400/20 bg-[#151d2a] px-3 py-2.5 text-[10px] text-slate-400 sm:text-[11px]">
                2008 年首个赛季保持原有阵容；从后续赛季开始，交易、选秀和球队格局将进入平行时间线。球队会根据战绩、阵容实力、核心年龄与发展趋势决定发展方向。
              </div>

              <div className="rounded-xl border border-slate-700/80 bg-[#151d2a] p-3">
                <div className="mb-2 font-black text-white">在哪里查看球队方向</div>
                <ol className="space-y-1.5 text-[10px] text-slate-400 sm:text-[11px]">
                  <li><span className="font-bold text-cyan-300">自己的球队：</span>进入底部导航“球队”，在球队信息卡中查看“球队方向”。</li>
                  <li><span className="font-bold text-cyan-300">其他球队：</span>进入底部导航“数据” → “联盟球队战绩榜”，点击任意球队，在阵容详情中查看。</li>
                  <li><span className="font-bold text-cyan-300">赛季交易：</span>常规赛页面点击“查看赛季变动”，可回顾本赛季的重要交易。</li>
                </ol>
              </div>

              <div className="rounded-xl border border-amber-400/35 bg-amber-500/[0.08] p-3">
                <div className="mb-2 flex items-center gap-1.5 font-black text-amber-200">
                  <Sparkles className="h-3.5 w-3.5" />核心玩法：命定事件
                </div>
                <p className="text-[10px] text-slate-400 sm:text-[11px]">
                  进入常规赛页面，在赛程上方打开“命定事件”。真实历史事件只会在指定赛季出现；满足当前时间线条件后可自行触发，错过赛季便会失效。涉及名单变化的主角将获得 2 至 3 年交易保护。
                </p>
              </div>

              <div className="rounded-xl border border-violet-400/25 bg-violet-500/[0.07] p-3">
                <div className="mb-2 flex items-center gap-1.5 font-black text-violet-200">
                  <UserCheck className="h-3.5 w-3.5" />新增：球星邀请计划
                </div>
                <p className="text-[10px] text-slate-400 sm:text-[11px]">
                  进入底部导航“球队”，在球队信息下方找到“球星邀请计划”。每段生涯最多邀请 3 次，每次至少间隔 3 个赛季，并需在交易截止日前完成；球队已有 3 名 90+ 球星时不可继续邀请。成功加盟的球星将获得交易保护。
                </p>
              </div>
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.08] px-3 py-2.5 text-[10px] font-bold text-amber-200 sm:text-[11px]">
                新模式仍在测试，退役记录暂不计入全网排行榜；平行联盟全网榜将在后续开放。
              </div>
            </div>

            <footer className="border-t border-slate-800 bg-[#0d121b] p-3">
              <button
                type="button"
                onClick={() => setIsParallelInfoOpen(false)}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 py-2.5 text-xs font-black text-slate-950 active:scale-[0.99]"
              >
                了解了
              </button>
            </footer>
          </section>
        </div>
      )}

      <UserFeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <UpdateAnnouncementModal isOpen={isAnnouncementOpen} onClose={() => setIsAnnouncementOpen(false)} />
    </div>
  );
};
