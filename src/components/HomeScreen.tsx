import React, { useState, useEffect } from 'react';
import { Play, PlusCircle, Trophy, Sparkles, UserCheck, Flame, ArrowRight, AlertTriangle, Bell, Globe, Loader2, MessageSquareText } from 'lucide-react';
import { SaveSlotMeta, getAllSaveSlotsMeta } from '../utils/storage';
import { TeamLogo } from './TeamLogo';
import { loadGlobalHallOfFame, retryPendingGlobalHallOfFameUpload } from '../lib/globalLeaderboard';
import { UserFeedbackModal } from './UserFeedbackModal';
import { UpdateAnnouncementModal } from './UpdateAnnouncementModal';

interface HomeScreenProps {
  hasActiveSave: boolean;
  latestSaveMeta: SaveSlotMeta | null;
  onContinueGame: () => void;
  onStartNewCareer: () => void;
  onOpenSaveManager: () => void;
  onOpenSettings: () => void;
  onOpenHallOfFame: () => void;
  onOpenGlobalHallOfFame?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  hasActiveSave,
  latestSaveMeta,
  onContinueGame,
  onStartNewCareer,
  onOpenSaveManager,
  onOpenSettings,
  onOpenHallOfFame,
  onOpenGlobalHallOfFame,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [topLegendName, setTopLegendName] = useState<string>('');
  const [topLegendScore, setTopLegendScore] = useState<number | null>(null);
  const [isBannerLoading, setIsBannerLoading] = useState<boolean>(true);
  const [isBannerTimeout, setIsBannerTimeout] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let retryTimer: any = null;

    const loadTopLegend = () => {
      if (!isMounted) return;
      void retryPendingGlobalHallOfFameUpload().catch((error) => console.warn('全网传奇榜待上传记录暂未同步', error)).finally(() => loadGlobalHallOfFame()
        .then((records) => {
          if (isMounted) {
            if (records && records.length > 0 && records[0]?.player?.name) {
              setTopLegendName(records[0].player.name);
              setTopLegendScore(records[0].goatScore || null);
            } else { setTopLegendName(''); setTopLegendScore(null); }
            setIsBannerLoading(false);
            setIsBannerTimeout(false);
          }
        })
        .catch((err: any) => {
          if (isMounted) {
            const isTimeout = err?.name === 'GlobalHofTimeoutError' || err?.message?.includes('timed out');
            if (isTimeout) {
              // As requested: if global hall of fame request times out, keep showing loading state!
              setIsBannerLoading(true);
              setIsBannerTimeout(true);
              retryTimer = setTimeout(loadTopLegend, 3500);
            } else { setTopLegendName(''); setTopLegendScore(null); setIsBannerLoading(false); setIsBannerTimeout(false); }
          }
        }));
    };

    loadTopLegend();

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const displayTopName = topLegendName;
  const displayTopScore = topLegendScore;

  const handleNewCareerClick = () => {
    const hasAnySave = hasActiveSave || getAllSaveSlotsMeta().some((s) => !s.isEmpty);
    if (hasAnySave) {
      setShowConfirmModal(true);
    } else {
      onStartNewCareer();
    }
  };

  const handleConfirmOverwrite = () => {
    setShowConfirmModal(false);
    onStartNewCareer();
  };

  return (
    <div className="relative min-h-screen bg-[#0a0d14] text-white flex flex-col items-center justify-between p-0 overflow-hidden select-none">
      {/* Top Global Legend Scrolling Banner Ticker */}
      <div 
        onClick={onOpenGlobalHallOfFame || onOpenHallOfFame}
        className="safe-area-home-banner relative z-30 w-full bg-gradient-to-r from-amber-950/90 via-amber-900/95 to-amber-950/90 border-b border-amber-500/40 text-amber-200 text-xs py-2 overflow-hidden cursor-pointer group shadow-lg select-none transition-colors hover:bg-amber-900/95"
        title="点击查看全网传奇榜"
      >
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center overflow-hidden">
          <div className="shrink-0 flex items-center gap-1.5 pr-3 bg-gradient-to-r from-amber-950 via-amber-950 to-transparent z-10 font-black text-amber-400 text-xs tracking-wider uppercase border-r border-amber-500/30">
            <Trophy className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent font-extrabold">全网公告</span>
          </div>
          
          <div className="overflow-hidden whitespace-nowrap flex-1 relative pl-3">
            <div className="animate-ticker flex items-center gap-12 font-medium">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  {isBannerLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                      <span className="text-amber-200 font-bold">
                        {isBannerTimeout
                          ? '全网传奇榜接口响应超时，正在持续保持加载状态并自动重试中...'
                          : '正在同步全网传奇榜首数据...'}
                      </span>
                      <span className="text-amber-400/60 font-mono text-[10px]">⚡ CONNECTING</span>
                    </>
                  ) : (
                    <>
                      <span className="text-amber-100 font-bold">{displayTopName ? <>恭喜【<span className="text-amber-300 font-black text-sm italic">{displayTopName}</span>】登顶传奇榜！</> : '全网传奇榜等待首位传奇球员入榜'}</span>
                      {displayTopScore && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold">
                          GOAT 积分: {displayTopScore} 分
                        </span>
                      )}
                      <span className="text-amber-400/60 font-mono text-[10px]">👑 TOP 1 LEGEND</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Background Glows & Court Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/30 via-[#0a0d14] to-[#05070a] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />
      
      {/* Background Basketball Lines Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Page Layout Wrapper with Original Margins/Padding */}
      <div className="w-full flex-1 flex flex-col items-center justify-between p-4 sm:p-8 relative z-10">
        {/* Top Header Tag */}
        <header className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2 border-b border-amber-500/20 text-xs text-amber-300/80 uppercase font-mono tracking-widest">
          <div className="flex items-center gap-2 font-bold">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>篮坛传奇：重返2008</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px]">
              本地存档已就绪
            </span>
            <span className="hidden sm:inline text-slate-500">v2.50</span>
            <button
              type="button"
              onClick={() => setIsAnnouncementOpen(true)}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/35 bg-amber-500/10 text-amber-300 transition-colors hover:border-amber-400 hover:bg-amber-500/20"
              title="查看更新公告"
              aria-label="查看更新公告"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0a0d14] bg-red-500" />
            </button>
          </div>
        </header>

        {/* Hero Title & Subtitle Area */}
        <main className="relative z-10 w-full max-w-4xl flex flex-col items-center my-auto py-8 text-center">
          <img
            src="./game-logo.png"
            decoding="async"
            alt="篮坛传奇：重返2008"
            width={128}
            height={128}
            loading="eager"
            fetchPriority="high"
            className="w-24 h-24 sm:w-32 sm:h-32 mb-4 rounded-2xl border border-amber-400/40 object-cover shadow-2xl"
          />
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-widest uppercase shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>黄金时代 ·  2008-2025</span>
          </div>

          {/* Title Heading */}
          <h1 className="px-4 text-3xl sm:text-5xl lg:text-6xl leading-tight font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-100 to-amber-500 drop-shadow-[0_10px_20px_rgba(245,158,11,0.2)] mb-2">
            篮坛传奇：<span className="inline-block">重返2008</span>
          </h1>
          <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-widest text-slate-300 mb-6 drop-shadow">
            我的职业生涯 · <span className="text-amber-400">MY CAREER</span>
          </h2>

          {/* Active Save Quick Card (If exists) */}
          {hasActiveSave && latestSaveMeta && !latestSaveMeta.isEmpty && (
            <div className="w-full max-w-md mb-8 p-4 rounded-xl bg-gradient-to-r from-[#141923] via-[#1a2232] to-[#141923] border border-amber-500/40 shadow-2xl relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />
              <div className="flex items-center justify-between gap-3 text-left">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> 最新生涯存档
                  </div>
                  <div className="text-lg font-black text-white italic">
                    {latestSaveMeta.playerName} <span className="text-xs font-mono text-amber-400 font-bold">OVR {latestSaveMeta.playerOvr}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5 font-medium">
                    <TeamLogo
                      logo={latestSaveMeta.currentTeamLogo}
                      abbrev={latestSaveMeta.currentTeamAbbrev}
                      primaryColor={latestSaveMeta.currentTeamPrimaryColor}
                      secondaryColor={latestSaveMeta.currentTeamSecondaryColor}
                      className="w-4 h-4 object-contain inline-block shrink-0"
                      alt={latestSaveMeta.currentTeamName || ''}
                    />
                    <span>{latestSaveMeta.currentYear}-{latestSaveMeta.currentYear! + 1} 赛季</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    最近保存: {latestSaveMeta.updatedAt}
                  </div>
                </div>
                <button
                  onClick={onContinueGame}
                  className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-4 py-3 rounded-lg shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer text-sm uppercase italic"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>继续生涯</span>
                </button>
              </div>
            </div>
          )}

          {/* Primary Menu Options Grid */}
          <div className="w-full max-w-md flex flex-col gap-3">
            {/* Start New Career (If no active save) */}
            {!hasActiveSave && (
              <button
                onClick={handleNewCareerClick}
                className="w-full flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98] cursor-pointer text-base uppercase tracking-wider group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
                  <span>开始全新生涯</span>
                </div>
                <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* New Player (If save already exists) */}
            {hasActiveSave && (
              <button
                onClick={handleNewCareerClick}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#141822] hover:bg-[#1f2636] border border-[#232a3a] hover:border-amber-500/50 text-white font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer text-sm group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform" />
                  <span>新建球员</span>
                </div>
              </button>
            )}

            {/* Personal Hall of Fame */}
            <button
              onClick={onOpenHallOfFame}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#141822] hover:bg-[#1f2636] border border-[#232a3a] hover:border-amber-500/50 text-white font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer text-sm group"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>个人传奇榜</span>
              </div>
            </button>

            {/* Global Hall of Fame */}
            <button
              onClick={onOpenGlobalHallOfFame || onOpenHallOfFame}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#171e2e] to-[#121724] hover:from-[#1e273b] hover:to-[#171e2e] border border-amber-500/30 hover:border-amber-400 text-amber-300 font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer text-sm group"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>全网传奇榜</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase tracking-wider">
                GOAT Leaderboard
              </span>
            </button>

            {/* User Feedback */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#141822] hover:bg-[#1f2636] border border-[#232a3a] hover:border-sky-400/60 text-white font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer text-sm group"
            >
              <div className="flex items-center gap-3">
                <MessageSquareText className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span>用户反馈</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300 uppercase tracking-wider">
                Feedback
              </span>
            </button>
          </div>
        </main>

        {/* Bottom Footer Info */}
        <footer className="relative z-10 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-2 py-3 border-t border-[#1e2535] text-[11px] text-slate-500">
          <div>
            篮坛传奇：重返2008 · 提示：全过程自动本地快照，支持无网离线运行
          </div>
          <div className="flex items-center gap-4">
            <span>2008 - 2025 年真实赛季模拟</span>
          </div>
        </footer>
      </div>

      {/* Overwrite Save Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-[#121620] border border-red-500/40 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-6 text-slate-200 text-left space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white italic uppercase">⚠️ 覆盖旧存档确认</h3>
                <span className="text-[10px] font-mono text-red-400">OVERWRITE CAREER SAVE</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#181e2b] p-3.5 rounded-xl border border-[#263147]">
              检测到您本地已有 篮坛传奇：重返2008 的生涯存档数据。新建球员将<strong className="text-amber-400 font-bold">覆盖并清空旧的存档记录</strong>。是否确认继续新建？
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-[#202838] hover:bg-[#2b364c] text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmOverwrite}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer"
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
