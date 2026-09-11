import React, { useState } from 'react';
import { PlayerProfile, Team } from '../types';
import { TeamLogo } from './TeamLogo';
import {
  Trophy,
  Zap,
  Heart,
  DollarSign,
  Award,
  Medal,
  Flame,
  AlertCircle,
  Settings,
  Save,
  Home,
  FolderOpen,
  Calendar,
  BarChart3,
  Users,
  MessageSquare,
  Grid,
  X,
} from 'lucide-react';
import { INITIAL_ENDORSEMENTS, PERSONAL_ASSETS } from '../data/nbaData2008';
import { getPlayerBaseOvr, getUserPlayerAgePenalty } from '../utils/calc2k';
import { getAssetPurchaseState } from '../utils/economy';

interface HeaderProps {
  player: PlayerProfile;
  currentTeam: Team;
  currentYear: number;
  careerSeasons: number;
  seasonWeek: number;
  isPlayoffs: boolean;
  onOpenAttributes: () => void;
  onOpenSettings: () => void;
  onOpenSaveManager?: () => void;
  onGoHome?: () => void;
  onQuickSave?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  currentTeam,
  currentYear,
  careerSeasons,
  seasonWeek,
  isPlayoffs,
  onOpenAttributes,
  onOpenSettings,
  onGoHome,
  activeTab,
  setActiveTab,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Check if player has any signable endorsement or purchasable asset
  const hasSignableEndorsements = INITIAL_ENDORSEMENTS.some((end) => {
    const isUnlocked = player.endorsements.some((e) => e.id === end.id);
    if (isUnlocked) return false;

    const canUnlock = player.ovr >= end.requiredOvr && player.fansCount >= end.requiredFans;
    if (!canUnlock) return false;

    // Sneaker category is mutually exclusive - if player already signed a sneaker brand, no new sneaker endorsement
    if (end.category === 'sneaker') {
      const hasSneakerBrand = player.endorsements.some((e) => e.category === 'sneaker');
      if (hasSneakerBrand) return false;
    }

    return true;
  });

  const hasPurchasableAssets = PERSONAL_ASSETS.some((asset) => {
    return getAssetPurchaseState(asset, player, careerSeasons, currentYear).canPurchase;
  });

  const hasSocialNotification = hasSignableEndorsements || hasPurchasableAssets;
  const maxPlayerOvr = 99 - getUserPlayerAgePenalty(player.age || 19);
  const hasUpgradableAttributes = player.skillPoints > 0
    && getPlayerBaseOvr(player) < maxPlayerOvr
    && (
    Object.keys(player.attributes) as Array<keyof PlayerProfile['attributes']>
  ).some((key) => {
    const currentValue = player.attributes[key] ?? 50;
    const cap = player.attributeCaps?.[key] ?? 99;
    return currentValue < cap;
  });

  const getOvrColor = (ovr: number) => {
    if (ovr >= 95) return 'from-amber-400 to-amber-600 text-black border-amber-300';
    if (ovr >= 90) return 'from-purple-500 to-indigo-600 text-white border-purple-400';
    if (ovr >= 80) return 'from-blue-500 to-cyan-600 text-white border-blue-400';
    return 'from-emerald-500 to-teal-700 text-white border-emerald-400';
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  return (
    <header className="safe-area-game-header bg-[#11141b] border-b border-[#232834] sticky top-0 z-40 shadow-2xl select-none">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Left: Player Profile & Team */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
          {/* OVR Badge */}
          <div
            className={`w-8 h-8 sm:w-11 sm:h-11 shrink-0 rounded-lg bg-gradient-to-br ${getOvrColor(
              player.ovr
            )} flex flex-col items-center justify-center font-black shadow-md border`}
          >
            <span className="text-xs sm:text-lg italic font-black leading-none">{player.ovr}</span>
            <span className="text-[6px] sm:text-[7.5px] uppercase tracking-widest font-bold opacity-80 leading-none mt-0.5 hidden sm:block">
              OVR
            </span>
          </div>

          {/* Player Main Info Column */}
          <div className="min-w-0 flex flex-col justify-center">
            {/* Top Row: Name & Age/Jersey Pill */}
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap min-w-0">
              <h1 className="text-xs sm:text-base font-black italic text-white tracking-tight uppercase truncate shrink min-w-0">
                {player.name}
              </h1>

              {/* Jersey & Age Pill */}
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0d1017] text-slate-300 border border-[#232834] whitespace-nowrap shrink-0">
                #{player.jerseyNum} · {player.age || 19}岁
                <span className="hidden sm:inline">
                  {' '}
                  · {player.position} · {player.birthplace || player.nationality || '北京'}
                </span>
              </span>

              {/* Desktop-only badges */}
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0">
                {player.archetype}
              </span>
              {player.familyBackground && (
                <span className="hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 whitespace-nowrap shrink-0">
                  {player.familyBackground}
                </span>
              )}
              {player.basketballIdol && (
                <span className="hidden lg:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 whitespace-nowrap shrink-0">
                  {player.basketballIdol}
                </span>
              )}
            </div>

            {/* Bottom Row: Team & Season Info */}
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-slate-400 mt-0.5 whitespace-nowrap min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <TeamLogo
                  logo={currentTeam.logo}
                  abbrev={currentTeam.abbrev}
                  primaryColor={currentTeam.primaryColor}
                  secondaryColor={currentTeam.secondaryColor}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain inline-block shrink-0"
                  alt={currentTeam.name}
                />
                <span style={{ color: '#ffffff' }} className="font-bold text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                  {currentTeam.name}
                </span>
              </div>
              <span className="text-[#232834] hidden sm:inline">|</span>
              <span className="text-slate-300 font-mono text-[10px] sm:text-[11px] hidden sm:inline">
                {currentYear}-{currentYear + 1} 赛季
              </span>
              {isPlayoffs && (
                <>
                  <span className="text-[#232834] hidden sm:inline">|</span>
                  <span className="text-amber-400 font-bold uppercase text-[9px] sm:text-[11px] hidden sm:inline">
                    季后赛 第{seasonWeek - 20}轮
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions & Stats */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Skill Points & Special Training Entry Button */}
          <button
            onClick={onOpenAttributes}
            className={`relative flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black font-black italic px-2 py-1 sm:px-3 sm:py-1.5 rounded transition-all text-[10px] sm:text-xs uppercase shadow-md active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
              hasUpgradableAttributes ? 'animate-training-reminder' : ''
            }`}
            title="点击进入 ⚡ 属性特训"
          >
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-black animate-pulse shrink-0" />
            <span className="hidden sm:inline">⚡ 属性特训 (SP: {player.skillPoints})</span>
            <span className="sm:hidden">特训({player.skillPoints})</span>
            {hasUpgradableAttributes && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#11141b] shadow-[0_0_8px_rgba(239,68,68,0.95)] animate-pulse pointer-events-none" />
            )}
          </button>

          {/* System Settings & Storage Menu Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 bg-[#161b26] hover:bg-[#202736] border border-[#2e374d] text-slate-200 hover:text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all text-[10px] sm:text-xs font-bold shrink-0 whitespace-nowrap cursor-pointer shadow active:scale-95"
            title="打开系统设置与生涯存档"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>设置</span>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="bg-[#0d1017] border-t border-[#232834] px-1.5 sm:px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-0.5 sm:py-1 text-xs no-scrollbar">
          {[
            { id: 'season', label: '🏀 赛季中心' },
            { id: 'standings', label: '📊 数据面板' },
            { id: 'roster', label: '🔄 球队与交易' },
            { id: 'social', label: '📲 场外社交与代言', hasDot: hasSocialNotification },
            { id: 'timeline', label: '📅 联盟 时间线' },
            { id: 'milestones', label: '🎖️ 历史里程碑' },
            { id: 'hof', label: '🏆 名人堂与纪录' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative px-2 py-1 sm:px-3 sm:py-1.5 rounded transition-all text-[11px] sm:text-xs font-bold uppercase tracking-tight whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black italic shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#11141b]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.hasDot && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d1017] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse z-10 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Fixed Navigation Bar (Option 1) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1017]/95 backdrop-blur-md border-t border-[#232834] px-1.5 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {/* 1. 赛季 */}
          <button
            onClick={() => handleTabClick('season')}
            className={`flex min-h-12 flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'season'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-[11px] tracking-tight leading-none font-bold">赛季</span>
          </button>

          {/* 2. 数据 */}
          <button
            onClick={() => handleTabClick('standings')}
            className={`flex min-h-12 flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'standings'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-6 h-6 mb-1" />
            <span className="text-[11px] tracking-tight leading-none font-bold">数据</span>
          </button>

          {/* 3. 球队 */}
          <button
            onClick={() => handleTabClick('roster')}
            className={`flex min-h-12 flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-[11px] tracking-tight leading-none font-bold">球队</span>
          </button>

          {/* 4. 社交 (带有闪烁绿点提示) */}
          <button
            onClick={() => handleTabClick('social')}
            className={`relative flex min-h-12 flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'social'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-6 h-6 mb-1" />
            <span className="text-[11px] tracking-tight leading-none font-bold">社交</span>
            {hasSocialNotification && (
              <span className="absolute top-1 right-2.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d1017] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse pointer-events-none" />
            )}
          </button>

          {/* 5. 更多 (抽屉入口) */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`relative flex min-h-12 flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
              isMoreMenuOpen || ['timeline', 'milestones', 'hof', 'attributes'].includes(activeTab)
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-6 h-6 mb-1" />
            <span className="text-[11px] tracking-tight leading-none font-bold">更多</span>
            {hasUpgradableAttributes ? (
              <span className="absolute top-1 right-2.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d1017] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse pointer-events-none" />
            ) : ['timeline', 'milestones', 'hof', 'attributes'].includes(activeTab) ? (
              <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-amber-400 pointer-events-none" />
            ) : null}
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Sheet Drawer for "更多" */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMoreMenuOpen(false)}
          />

          {/* Sheet Container */}
          <div className="relative bg-[#11141b] border-t-2 border-amber-500/60 rounded-t-2xl p-4 pb-6 z-50 max-w-md w-full mx-auto shadow-2xl animate-slide-up">
            {/* Handle Indicator */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3 opacity-80" />

            <div className="flex items-center justify-between mb-4 border-b border-[#232834] pb-2.5">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black italic text-white uppercase">更多功能与全貌</h3>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of options */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* NBA 时间线 */}
              <button
                onClick={() => {
                  handleTabClick('timeline');
                  setIsMoreMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 font-bold'
                    : 'bg-[#161b26] border-[#2e374d] text-slate-200 hover:bg-[#202736]'
                }`}
              >
                <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">📅 联盟 时间线</div>
                  <div className="text-[10px] text-slate-400">大事件与巨星轨迹</div>
                </div>
              </button>

              {/* 名人堂与纪录 */}
              <button
                onClick={() => {
                  handleTabClick('hof');
                  setIsMoreMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'hof'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 font-bold'
                    : 'bg-[#161b26] border-[#2e374d] text-slate-200 hover:bg-[#202736]'
                }`}
              >
                <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">🏆 名人堂与纪录</div>
                  <div className="text-[10px] text-slate-400">GOAT 积分与荣誉榜</div>
                </div>
              </button>

              {/* 历史里程碑 */}
              <button
                onClick={() => {
                  handleTabClick('milestones');
                  setIsMoreMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'milestones'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 font-bold'
                    : 'bg-[#161b26] border-[#2e374d] text-slate-200 hover:bg-[#202736]'
                }`}
              >
                <Medal className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">🎖️ 历史里程碑</div>
                  <div className="text-[10px] text-slate-400">历史单项总榜与纪录</div>
                </div>
              </button>

              {/* 属性特训 */}
              <button
                onClick={() => {
                  handleTabClick('attributes');
                  setIsMoreMenuOpen(false);
                }}
                className={`relative flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'attributes'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 font-bold'
                    : 'bg-[#161b26] border-[#2e374d] text-slate-200 hover:bg-[#202736]'
                }`}
              >
                <Flame className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <div className="text-xs font-bold">⚡ 属性特训</div>
                  <div className="text-[10px] text-amber-300">SP 点: {player.skillPoints}</div>
                </div>
                {hasUpgradableAttributes && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#161b26] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse pointer-events-none" />
                )}
              </button>
            </div>

            {/* Return Home button */}
            {onGoHome && (
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onGoHome();
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#1a202c] border border-[#2e374d] text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-400" />
                <span>返回模式主页</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
