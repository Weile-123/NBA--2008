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
} from 'lucide-react';
import { GameMode, GAME_MODE_CONFIG } from '../gameMode';
import { loadGlobalHallOfFame, retryPendingGlobalHallOfFameUpload } from '../lib/globalLeaderboard';
import { getSaveSlotMeta, hydrateGameStorage, SaveSlotMeta } from '../utils/storage';
import { TeamLogo } from './TeamLogo';
import { UpdateAnnouncementModal } from './UpdateAnnouncementModal';
import { UserFeedbackModal } from './UserFeedbackModal';

interface HomeScreenProps {
  gameMode: GameMode;
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
  gameMode,
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

  const savesByMode = useMemo<Record<GameMode, SaveSlotMeta>>(() => ({
    classic: getSaveSlotMeta('slot_1', 'classic'),
    random_trade: getSaveSlotMeta('slot_1', 'random_trade'),
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
          <span className={`rounded border px-1.5 py-0.5 text-[8px] font-black sm:text-[9px] ${
            gameMode === mode
              ? isClassic ? 'border-amber-400/40 bg-amber-500/20 text-amber-300' : 'border-cyan-300/40 bg-cyan-400/15 text-cyan-200'
              : 'border-slate-600/50 bg-slate-800/70 text-slate-500'
          }`}>
            {gameMode === mode ? '当前模式' : '独立存档'}
          </span>
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

          <div className={hasSave ? 'grid grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] gap-2' : ''}>
            {hasSave && (
              <button
                type="button"
                onClick={() => setPendingNewMode(mode)}
                className="flex min-w-0 items-center justify-center gap-1 rounded-xl border border-slate-600/70 bg-slate-800/80 px-1.5 py-2.5 text-[9px] font-black text-slate-200 transition-transform active:scale-[0.98] sm:text-xs"
              >
                <PlusCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>重新开档</span>
              </button>
            )}
            <button
              type="button"
              disabled={!modeSavesReady}
              onClick={() => onLaunchMode(mode, hasSave ? 'continue' : 'new')}
              className={`flex min-w-0 w-full items-center justify-center gap-1 rounded-xl px-1.5 py-2.5 text-[10px] font-black transition-transform active:scale-[0.98] disabled:cursor-wait disabled:opacity-50 sm:text-sm ${
                isClassic
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black'
                  : 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950'
              }`}
            >
              {hasSave ? <Play className="h-3.5 w-3.5 shrink-0 fill-current sm:h-4 sm:w-4" /> : <Sparkles className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />}
              <span>{hasSave ? '继续生涯' : `开启${isClassic ? '经典' : '新'}模式`}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            </button>
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
          两种模式均为单一存档，生涯进度与个人传奇记录完全独立
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

      <UserFeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <UpdateAnnouncementModal isOpen={isAnnouncementOpen} onClose={() => setIsAnnouncementOpen(false)} />
    </div>
  );
};
