import React from 'react';
import { PlayerProfile, Team } from '../types';
import { Users, Lock, Sparkles, ShieldAlert, HeartHandshake, Clock, X, Building2, HelpCircle, UserPlus, MonitorPlay, Eye } from 'lucide-react';
import { getCompleteTeamRoster, getPlayerCategoryRatings, getUserPlayerCategoryRatings } from '../utils/leagueLogic';
import { TeamLogo } from './TeamLogo';
import { ContractOffer, generateFreeAgencyOffers, regenerateFreeAgencyOffers } from '../utils/contractLogic';
import { completeRewardedAd } from '../lib/rewardedAd';
import { RewardedRefreshButton } from './RewardedRefreshButton';
import { DEFAULT_GAME_MODE, GameMode } from '../gameMode';
import { getEffectiveTeamStrategy, getTeamStrategyDescription, getTeamStrategyLabel } from '../utils/teamStrategyLogic';
import { getStarInvitationCandidates, rankTeamPositionNeeds } from '../utils/starInvitationCandidates';

interface RosterAndTransfersProps {
  gameMode?: GameMode;
  player: PlayerProfile;
  currentTeam: Team;
  allTeams: Team[];
  onRequestTrade: (targetTeamId: string) => void;
  onSignContract?: (newTeamId: string, salaryPerYear: number, totalYears: number) => void;
  onUpdatePlayer: (updatedPlayer: PlayerProfile) => void;
  currentYear?: number;
  activeInSeasonTradeOffers: ContractOffer[];
  onSetActiveInSeasonTradeOffers: (offers: ContractOffer[]) => void;
  currentGame?: number;
  isPlayoffs?: boolean;
  onInviteStar?: (sourceTeamId: string, starPlayerId: string) => { success: boolean; message: string };
}

const TRADE_DEADLINE_GAME = 55;

export const RosterAndTransfers: React.FC<RosterAndTransfersProps> = ({
  gameMode = DEFAULT_GAME_MODE,
  player,
  currentTeam,
  allTeams = [],
  onSignContract,
  onUpdatePlayer,
  currentYear = 2008,
  activeInSeasonTradeOffers,
  onSetActiveInSeasonTradeOffers,
  currentGame = 1,
  isPlayoffs = false,
  onInviteStar,
}) => {
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isRefreshingOffers, setIsRefreshingOffers] = React.useState(false);
  const [isStarInviteOpen, setIsStarInviteOpen] = React.useState(false);
  const [selectedStarKey, setSelectedStarKey] = React.useState('');
  const [isInvitingStar, setIsInvitingStar] = React.useState(false);
  const [starInviteMessage, setStarInviteMessage] = React.useState('');
  const [viewingOfferRosterTeam, setViewingOfferRosterTeam] = React.useState<Team | null>(null);
  const requestTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (requestTimerRef.current) clearTimeout(requestTimerRef.current);
  }, []);

  React.useEffect(() => {
    if (activeInSeasonTradeOffers.length > 3) {
      onSetActiveInSeasonTradeOffers(activeInSeasonTradeOffers.slice(0, 3));
    }
  }, [activeInSeasonTradeOffers, onSetActiveInSeasonTradeOffers]);

  const seasonIndex = currentYear - 2007;

  const [viewMode, setViewMode] = React.useState<'stats' | 'ratings'>('stats');

  // Compute complete 15-man roster sorted by minutes descending
  const { roster: fullRoster, userMinutes, userRole } = getCompleteTeamRoster(currentTeam, player, seasonIndex);

  // Check if player is in rookie contract or first contract year
  const isRookieContract = Boolean(player.contract?.isRookieContract);
  const isFirstContractYear = player.contract
    ? player.contract.yearsLeft === player.contract.totalYears
    : true;
  const isTradeLocked = isRookieContract || isFirstContractYear;

  // Trade deadline: locked after Game 55 of regular season, or during playoffs
  const isTradeDeadlinePassed = Boolean(isPlayoffs || currentGame > TRADE_DEADLINE_GAME);
  const teamStrategy = getEffectiveTeamStrategy(currentTeam, allTeams);
  const teamStrategyColor = teamStrategy === 'contender'
    ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
    : teamStrategy === 'playoff'
      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
      : teamStrategy === 'rebuilding'
        ? 'border-violet-400/40 bg-violet-500/15 text-violet-300'
        : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300';
  const invitationYears = player.starInvitationYears || (player.starInvitationUsedYear ? [player.starInvitationUsedYear] : []);
  const invitationCount = player.starInvitationCount ?? invitationYears.length;
  const remainingInvitations = Math.max(0, 3 - invitationCount);
  const lastInvitationYear = invitationYears.length ? Math.max(...invitationYears) : null;
  const isInvitationCoolingDown = lastInvitationYear !== null && currentYear - lastInvitationYear < 3;
  const hasTooManyStars = currentTeam.roster.filter((candidate) => candidate.ovr >= 90).length >= 3;
  const isInvitationUnavailable = remainingInvitations === 0 || isInvitationCoolingDown || hasTooManyStars;
  const invitationStatus = remainingInvitations === 0
    ? '生涯机会已用完'
    : hasTooManyStars
      ? '球队已有3名90+球星'
      : isInvitationCoolingDown
        ? `${lastInvitationYear! + 3}赛季可再次邀请`
        : `生涯剩余${remainingInvitations}次`;
  const neededPositions = rankTeamPositionNeeds(currentTeam, player).slice(0, 2);
  const starInvitationCandidates = getStarInvitationCandidates(currentTeam, allTeams, player, currentYear);

  const handleConfirmStarInvitation = async () => {
    if (!selectedStarKey || !onInviteStar || isInvitingStar || isInvitationUnavailable || isTradeDeadlinePassed) return;
    const selected = starInvitationCandidates.find(({ team, player: candidate }) => `${team.id}:${candidate.id}` === selectedStarKey);
    if (!selected) return;

    setIsInvitingStar(true);
    setStarInviteMessage('');
    try {
      if (!await completeRewardedAd()) {
        setStarInviteMessage('广告未完整播放，暂未消耗本赛季邀请机会');
        return;
      }
      const result = onInviteStar(selected.team.id, selected.player.id);
      setStarInviteMessage(result.message);
      if (result.success) {
        setSelectedStarKey('');
        setIsStarInviteOpen(false);
      }
    } finally {
      setIsInvitingStar(false);
    }
  };

  const handleRequestTrade = () => {
    if (isTradeDeadlinePassed) return;

    if (activeInSeasonTradeOffers.length > 0) {
      // If offers already exist, don't regenerate them, just open the modal directly!
      setIsModalOpen(true);
      return;
    }

    setIsRequesting(true);
    requestTimerRef.current = setTimeout(() => {
      // Exclude the current team from receiving offers
      const offers = generateFreeAgencyOffers(player.ovr, currentTeam.id, allTeams);
      onSetActiveInSeasonTradeOffers(offers);
      setIsRequesting(false);
      setIsModalOpen(true); // Open the modal once offers are generated
      requestTimerRef.current = null;
    }, 600); // 600ms immersive simulation delay
  };

  const handleAcceptTradeOffer = (offer: ContractOffer) => {
    if (isTradeDeadlinePassed) {
      setIsModalOpen(false);
      return;
    }
    if (onSignContract) {
      onSignContract(offer.team.id, offer.salaryPerYear, offer.totalYears);
    }
    onSetActiveInSeasonTradeOffers([]);
    setIsModalOpen(false);
  };

  const handleCancelTradeRequest = () => {
    // This just closes the modal, keeping the current generated offers intact!
    setIsModalOpen(false);
  };

  const handleRefreshTradeOffers = async () => {
    if (isRefreshingOffers || player.tradeOfferRefreshUsed) return;
    setIsRefreshingOffers(true);
    try {
      if (!await completeRewardedAd()) {
        return;
      }
      onSetActiveInSeasonTradeOffers(regenerateFreeAgencyOffers(player.ovr, currentTeam.id, allTeams, activeInSeasonTradeOffers));
      onUpdatePlayer({ ...player, tradeOfferRefreshUsed: true });
    } catch {
      // Silently restore the button when the ad cannot be opened.
    } finally {
      setIsRefreshingOffers(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case '战术核心':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case '绝对首发':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case '第六人':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case '轮换替补':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      default:
        return 'bg-slate-900 text-slate-500 border-slate-800';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current Team Header Banner */}
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#232834] pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg border border-white/10 p-1 bg-[#0d1017] shrink-0"
              style={{ borderColor: currentTeam.primaryColor }}
            >
              <TeamLogo
                logo={currentTeam.logo}
                abbrev={currentTeam.abbrev}
                primaryColor={currentTeam.primaryColor}
                secondaryColor={currentTeam.secondaryColor}
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                alt={currentTeam.name}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-black italic uppercase text-white truncate">{currentTeam.name}</h3>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold shrink-0">
                  {currentTeam.wins}胜 - {currentTeam.losses}负
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-mono">
                球队评级 OVR <span className="text-amber-400 font-bold">{currentTeam.rating}</span>
              </p>
              {gameMode === 'random_trade' && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-black ${teamStrategyColor}`}>
                    <Building2 className="h-3 w-3" /> 球队方向：{getTeamStrategyLabel(teamStrategy)}
                  </span>
                  <span className="hidden text-[10px] text-slate-500 sm:inline">{getTeamStrategyDescription(teamStrategy)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3 Playing Time & Tactical Status Indicator Cards (3-column grid) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-0.5">
          {/* 1. Position & OVR */}
          <div className="bg-[#0d1017] border border-[#232834] rounded-xl p-2 sm:p-3 flex flex-col items-center sm:items-start justify-center gap-0.5 sm:gap-1 shadow-inner text-center sm:text-left">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-400 shrink-0 hidden sm:inline" />
              <span>位置/评级</span>
            </span>
            <div className="flex items-baseline gap-0.5 sm:gap-1 flex-wrap justify-center sm:justify-start">
              <span className="text-xs sm:text-base font-black font-mono text-amber-400">
                【{player.position}】
              </span>
              <span className="text-xs sm:text-sm font-bold text-white font-mono">
                {player.ovr}
              </span>
              <span className="text-[9px] sm:text-xs text-slate-400 font-mono hidden sm:inline">
                ({player.age || 19}岁)
              </span>
            </div>
          </div>

          {/* 2. Assigned MPG */}
          <div className="bg-[#0d1017] border border-[#232834] rounded-xl p-2 sm:p-3 flex flex-col items-center sm:items-start justify-center gap-0.5 sm:gap-1 shadow-inner text-center sm:text-left">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400 shrink-0 hidden sm:inline" />
              <span>场均时间</span>
            </span>
            <div className="flex items-baseline gap-0.5 justify-center sm:justify-start">
              <span className="text-xs sm:text-xl font-black font-mono text-amber-400">
                {userMinutes}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-normal">分钟</span>
            </div>
          </div>

          {/* 3. Team Tactical Role */}
          <div className="bg-[#0d1017] border border-[#232834] rounded-xl p-2 sm:p-3 flex flex-col items-center sm:items-start justify-center gap-0.5 sm:gap-1 shadow-inner text-center sm:text-left">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0 hidden sm:inline" />
              <span>战术定位</span>
            </span>
            <div className="flex justify-center sm:justify-start">
              <span className={`text-[10px] sm:text-xs font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg border inline-flex items-center gap-1 ${getRoleBadgeColor(userRole)}`}>
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {gameMode === 'random_trade' && (
        <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 via-[#111722] to-violet-500/10 p-3.5 shadow-xl sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="flex items-center gap-1.5 text-xs font-black italic text-cyan-200 sm:text-sm">
                <UserPlus className="h-4 w-4 shrink-0 text-cyan-300" /> 球星邀请计划
              </h4>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400 sm:text-[11px]">
                每段生涯最多邀请3次，每次间隔3个赛季；受邀球星享有交易保护。
              </p>
            </div>
            <button
              type="button"
              disabled={isInvitationUnavailable || isTradeDeadlinePassed || starInvitationCandidates.length === 0}
              onClick={() => {
                setStarInviteMessage('');
                setIsStarInviteOpen(true);
              }}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-cyan-400 px-3 py-2 text-[10px] font-black text-slate-950 shadow-lg shadow-cyan-950/30 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:text-xs"
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              {isTradeDeadlinePassed ? '窗口已关闭' : isInvitationUnavailable ? invitationStatus : `选择球星 · 剩${remainingInvitations}次`}
            </button>
          </div>
          {starInviteMessage && <p className="mt-2 text-[10px] font-bold text-amber-300">{starInviteMessage}</p>}
        </div>
      )}

      {/* 🔄 Trade Request Hub */}
      {isTradeLocked ? (
        <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-2.5 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232834] pb-2.5">
            <h4 className="text-xs font-black italic uppercase text-slate-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" /> 转会与交易申请中心
            </h4>
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-black uppercase font-mono self-start sm:self-auto">
              {isRookieContract ? '新秀合同 · 交易锁定' : '合同首年 · 交易保护'}
            </span>
          </div>

          <div className="p-3 sm:p-4 bg-[#0d1017] border border-[#232834] rounded-xl flex items-start gap-2.5 sm:gap-3">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-300 leading-relaxed space-y-1">
              <p className="font-bold text-amber-400">【管理层通知】暂不可主动交易</p>
              {isRookieContract ? (
                <p className="text-[11px] text-slate-400">
                  处于<span className="text-amber-400 font-bold">新秀保障合同</span>期间不可申请转会，履行完新秀期后自动开放。
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  当前处于新合同<span className="text-amber-400 font-bold">第 1 年</span>（剩余 {player.contract?.yearsLeft || 3} 年 / 共 {player.contract?.totalYears || 3} 年），第 2 年起自动开放向全联盟询价。
                </p>
              )}
            </div>
          </div>
        </div>
      ) : isTradeDeadlinePassed ? (
        <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-2.5 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232834] pb-2.5">
            <h4 className="text-xs font-black italic uppercase text-slate-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-red-400 shrink-0" /> 转会与交易申请中心
            </h4>
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-black uppercase font-mono self-start sm:self-auto">
              🔒 交易截止日已过
            </span>
          </div>

          <div className="p-3 sm:p-4 bg-[#0d1017] border border-[#232834] rounded-xl flex items-start gap-2.5 sm:gap-3">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-amber-400">【交易窗口关闭】本赛季交易通道已封闭</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                目前处于<span className="text-amber-400 font-bold">{isPlayoffs ? '季后赛阶段' : `常规赛第 ${currentGame} 场`}</span>（截止日为第 {TRADE_DEADLINE_GAME} 场），下赛季开启后重新开放。
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={true}
            className="w-full py-2.5 bg-[#181d28] border border-[#232834] text-slate-500 font-bold text-xs rounded-xl uppercase opacity-75 flex items-center justify-center gap-2 cursor-not-allowed shadow-inner"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>🔒 交易已关停 ({isPlayoffs ? '季后赛期间禁止交易' : `常规赛第 ${TRADE_DEADLINE_GAME} 场后关闭`})</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-2.5 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232834] pb-2.5">
            <h4 className="text-xs font-black italic uppercase text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" /> 转会与交易申请中心
            </h4>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black uppercase font-mono self-start sm:self-auto">
              窗口开放中 (截止: 第 {TRADE_DEADLINE_GAME} 场)
            </span>
          </div>

          <div className="p-3 sm:p-4 bg-[#0d1017] border border-[#232834] rounded-xl flex items-start gap-2.5 sm:gap-3">
            <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-emerald-400">【交易准许】可发起联盟询价</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                当前合同第 <span className="text-emerald-400 font-bold">{player.contract ? (player.contract.totalYears - player.contract.yearsLeft + 1) : 2}</span> 年（还剩 <span className="text-emerald-400 font-bold">{player.contract?.yearsLeft}</span> 年），距截止日还剩 <span className="text-amber-400 font-bold">{Math.max(0, TRADE_DEADLINE_GAME - currentGame + 1)}</span> 场比赛。提交后可获取 <span className="text-amber-400 font-bold">3 支球队</span> 报价！
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestTrade}
            disabled={isRequesting}
            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 text-black disabled:text-slate-500 font-black italic text-xs rounded-xl uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {isRequesting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>正在向全联盟 29 支球队发送意向书...</span>
              </>
            ) : activeInSeasonTradeOffers.length > 0 ? (
              <>
                <span>✉️ 查看已收到的 3 支球队交易报价单</span>
              </>
            ) : (
              <>
                <span>✉️ 提交主动交易申请 (向全联盟询价)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 📥 交易与转会报价弹窗 (TRADE OFFERS POPUP MODAL) */}
      {isModalOpen && activeInSeasonTradeOffers.length > 0 && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#11141b] border border-[#232834] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0d1017] p-4.5 border-b border-[#232834] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-black italic uppercase text-white text-base">联盟交易与转会报价单</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">TRADE REQUEST REPORT & OFFERS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelTradeRequest}
                className="text-slate-400 hover:text-white bg-[#181d28] p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Alert Tips */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
                <HelpCircle className="w-4.5 h-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <p className="font-bold text-amber-300">💡 交易提示</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    以下 3 支追求球队已同意支付相应的筹码，并为您奉上全新的合同保障。接受任一报价后，您将正式被交易并换签对应的新合同。本赛季的申请结果将终身保留。
                  </p>
                </div>
              </div>

              {/* Offers List */}
              <div className="space-y-3">
                {activeInSeasonTradeOffers.map((offer) => (
                  <div
                    key={offer.team.id}
                    className="bg-[#0b0e14] hover:bg-[#151b27] border border-[#232a3c] hover:border-emerald-500/40 p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
                  >
                    {/* Team Info */}
                    <div className="flex items-center gap-3">
                        <TeamLogo
                          logo={offer.team.logo}
                          abbrev={offer.team.abbrev}
                          primaryColor={offer.team.primaryColor}
                          secondaryColor={offer.team.secondaryColor}
                          className="w-10 h-10 object-contain"
                        />
                      <div>
                        <div className="">
                          <h4 className="text-sm font-black text-white">
                            {offer.team.name}
                          </h4>
                          <span className="text-[9px] font-bold font-mono text-slate-400 bg-[#161d2b] px-1.5 py-0.5 rounded border border-[#263248] mt-2">
                            ⭐️ {offer.team.rating} OVR
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Terms */}
                    <div className="flex items-center gap-4 bg-[#141a27] px-3.5 py-2 rounded-lg border border-[#222c40] self-start sm:self-auto">
                      <div className="text-center">
                        <span className="text-[9px] text-slate-500 font-bold block leading-none mb-1">平均年薪</span>
                        <span className="text-xs font-mono font-black text-emerald-400">
                          ${(offer.salaryPerYear / 10000).toFixed(0)}万 / 年
                        </span>
                      </div>
                      <div className="w-px h-6 bg-slate-800" />
                      <div className="text-center">
                        <span className="text-[9px] text-slate-500 font-bold block leading-none mb-1">年限</span>
                        <span className="text-xs font-mono font-black text-amber-400">
                          {offer.totalYears}年
                        </span>
                      </div>
                      <div className="w-px h-6 bg-slate-800" />
                      <div className="text-center">
                        <span className="text-[9px] text-slate-500 font-bold block leading-none mb-1">总额</span>
                        <span className="text-xs font-mono font-black text-cyan-400">
                          ${(offer.totalValue / 10000).toFixed(0)}万
                        </span>
                      </div>
                    </div>

                    {/* Roster and accept actions */}
                    <div className="flex gap-2 self-stretch sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setViewingOfferRosterTeam(offer.team)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-3 py-2.5 text-xs font-black text-cyan-300 transition-colors hover:bg-cyan-500/20 sm:flex-none"
                      >
                        <Eye className="h-4 w-4" />查看阵容
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAcceptTradeOffer(offer)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-xs font-black italic text-black shadow-md transition-all hover:from-emerald-400 hover:to-emerald-500 sm:flex-none"
                      >
                        <span>🤝 确认交易并加盟</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#0d1017] p-4 border-t border-[#232834] flex items-center justify-between gap-3">
              <RewardedRefreshButton
                loading={isRefreshingOffers}
                disabled={Boolean(player.tradeOfferRefreshUsed)}
                onClick={handleRefreshTradeOffers}
              />
              <button
                type="button"
                onClick={handleCancelTradeRequest}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingOfferRosterTeam && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-500/35 bg-[#111722] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#293140] p-4">
              <div className="flex items-center gap-3">
                <TeamLogo team={viewingOfferRosterTeam} size="md" />
                <div>
                  <h3 className="text-sm font-black text-white">{viewingOfferRosterTeam.city} {viewingOfferRosterTeam.name} 当前阵容</h3>
                  <p className="mt-0.5 text-[10px] font-mono text-cyan-300">球队 OVR {viewingOfferRosterTeam.rating}</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewingOfferRosterTeam(null)} className="rounded-lg bg-slate-800 p-2 text-slate-400" aria-label="关闭阵容">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-[42px_1fr_76px_54px] gap-2 px-2 pb-2 text-[9px] font-black text-slate-500">
                <span>位置</span><span>球员</span><span className="text-center">定位</span><span className="text-right">综评</span>
              </div>
              <div className="space-y-1.5">
                {getCompleteTeamRoster(viewingOfferRosterTeam, null, seasonIndex).roster.map((candidate) => (
                  <div key={candidate.id} className="grid grid-cols-[42px_1fr_76px_54px] items-center gap-2 rounded-lg border border-[#253047] bg-[#0b1019] px-2 py-2.5 text-xs">
                    <span className="font-mono font-black text-amber-300">{candidate.position}</span>
                    <span className="min-w-0 truncate font-bold text-white">{candidate.name}</span>
                    <span className="text-center text-[10px] text-slate-400">{candidate.role}</span>
                    <span className="text-right font-mono font-black text-cyan-300">{candidate.ovr}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-[#293140] p-3">
              <button type="button" onClick={() => setViewingOfferRosterTeam(null)} className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-black text-white">返回报价</button>
            </div>
          </div>
        </div>
      )}

      {isStarInviteOpen && gameMode === 'random_trade' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md">
          <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-cyan-400/35 bg-[#111722] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#263047] p-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-black italic text-white">
                  <UserPlus className="h-5 w-5 text-cyan-300" /> 选择邀请球星
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-400">优先补强 {neededPositions.join(' / ')} · 剩余 {remainingInvitations} 次</p>
              </div>
              <button type="button" onClick={() => setIsStarInviteOpen(false)} className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto p-3">
              {starInvitationCandidates.map(({ team, player: candidate }) => {
                const key = `${team.id}:${candidate.id}`;
                const selected = selectedStarKey === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setSelectedStarKey(key)}
                    className={`rounded-xl border p-2.5 text-left transition-colors ${selected ? 'border-cyan-300 bg-cyan-400/15' : 'border-[#283249] bg-[#0b1019] hover:border-cyan-500/40'}`}
                  >
                    <div className="flex items-center gap-2">
                      <TeamLogo team={team} className="h-8 w-8 shrink-0 object-contain" />
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-black text-white sm:text-xs">{candidate.name}</div>
                        <div className="mt-0.5 text-[9px] font-mono text-cyan-300">{candidate.position} · OVR {candidate.ovr}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[#263047] p-3">
              {starInviteMessage && <p className="mb-2 text-center text-[10px] font-bold text-amber-300">{starInviteMessage}</p>}
              <button
                type="button"
                disabled={!selectedStarKey || isInvitingStar}
                onClick={handleConfirmStarInvitation}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan-400 py-2.5 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                <MonitorPlay className="h-4 w-4" />
                {isInvitingStar ? '广告加载中…' : '观看广告并确认邀请'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Players List Table */}
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5 sm:mb-3">
            <div className="text-[11px] sm:text-xs font-black uppercase text-slate-400 flex items-center gap-1.5 sm:gap-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> 球队15人完整花名册
            </div>
            
            {/* View Mode Toggle: 预测数据 vs 专项综评 */}
            <div className="flex items-center bg-[#0d1017] p-1 rounded-xl border border-[#232834] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('stats')}
                className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'stats'
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 赛季预测数据
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ratings')}
                className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'ratings'
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ 五维评分
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#232834] text-[9px] sm:text-[10px] text-slate-500 uppercase font-mono bg-[#0d1017]">
                  <th className="py-2 px-2 sm:px-3">球员</th>
                  <th className="py-2 px-2 sm:px-3 text-center hidden sm:table-cell">位置</th>
                  <th className="py-2 px-2 sm:px-3 text-center hidden md:table-cell">年龄</th>
                  <th className="py-2 px-2 sm:px-3 text-center hidden lg:table-cell">球队定位</th>
                  <th className="py-2 px-2 sm:px-3 text-center text-amber-400 font-bold hidden sm:table-cell">安排时间</th>
                  <th className="py-2 px-2 sm:px-3 text-center">总评 OVR</th>
                  {viewMode === 'stats' ? (
                    <>
                      <th className="py-2 px-2 sm:px-3 text-center">得分</th>
                      <th className="py-2 px-2 sm:px-3 text-center">篮板</th>
                      <th className="py-2 px-2 sm:px-3 text-center">助攻</th>
                      <th className="py-2 px-2 sm:px-3 text-center hidden md:table-cell">抢断</th>
                      <th className="py-2 px-2 sm:px-3 text-center hidden md:table-cell">盖帽</th>
                      <th className="py-2 px-2 sm:px-3 text-right hidden lg:table-cell">命中率</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-2 sm:px-3 text-center text-amber-400">得分综评</th>
                      <th className="py-2 px-2 sm:px-3 text-center text-blue-400">篮板综评</th>
                      <th className="py-2 px-2 sm:px-3 text-center text-emerald-400">助攻综评</th>
                      <th className="py-2 px-2 sm:px-3 text-center text-purple-400 hidden md:table-cell">抢断综评</th>
                      <th className="py-2 px-2 sm:px-3 text-center text-cyan-400 hidden md:table-cell">盖帽综评</th>
                      <th className="py-2 px-2 sm:px-3 text-right hidden lg:table-cell text-slate-400">主要定位</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232834]/50">
                {fullRoster.map((p) => {
                  const isUser = p.isUser;
                  const st = p.stats || { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, fgPct: 45.0, mpg: 15.0 };
                  const age = p.age || (isUser ? (player.age || 19) : 25);
                  
                  // Extract category ratings
                  const cat = isUser
                    ? getUserPlayerCategoryRatings(player)
                    : (p.categoryRatings || getPlayerCategoryRatings(p, seasonIndex));

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isUser
                          ? 'bg-amber-500/15 border-l-4 border-amber-500 font-bold text-white'
                          : 'hover:bg-[#181d29]/60 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold ${isUser ? 'text-amber-300 italic font-black text-xs sm:text-sm' : 'text-white text-xs sm:text-sm'}`}>
                              {isUser ? `👑 ${p.name}` : p.name}
                            </span>
                            {isUser && (
                              <span className="text-[8px] sm:text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-black italic uppercase">
                                玩家
                              </span>
                            )}
                            {!isUser && p.isStar && <span className="text-[8px] sm:text-[9px] text-amber-400 font-bold">⭐全明星</span>}
                            <span className="text-[9px] font-mono font-bold text-slate-400 sm:hidden bg-slate-800 px-1 py-0.2 rounded">
                              {p.position}{p.secondaryPosition ? ` / ${p.secondaryPosition}` : ''}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono sm:hidden flex items-center gap-1">
                            <span>{p.minutes || st.mpg || 15.0}分</span>
                            <span>·</span>
                            <span className={getRoleBadgeColor(p.role || '轮换替补')}>{p.role || '轮换替补'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-slate-300 hidden sm:table-cell">{p.position}{p.secondaryPosition ? ` / ${p.secondaryPosition}` : ''}</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-slate-200 hidden md:table-cell">{age} 岁</td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center hidden lg:table-cell">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeColor(p.role || '轮换替补')}`}>
                          {p.role || '轮换替补'}
                        </span>
                      </td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-black text-amber-400 text-xs hidden sm:table-cell">
                        {p.minutes || st.mpg || 15.0} 分钟
                      </td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-black italic text-amber-300 text-xs sm:text-sm">{p.ovr}</td>
                      
                      {viewMode === 'stats' ? (
                        <>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-amber-400/90 text-xs sm:text-sm">{st.ppg}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono text-blue-300 text-xs sm:text-sm">{st.rpg}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono text-emerald-300 text-xs sm:text-sm">{st.apg}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono text-purple-300 hidden md:table-cell">{st.spg}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono text-cyan-300 hidden md:table-cell">{st.bpg}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-right font-mono text-slate-300 hidden lg:table-cell">{st.fgPct}%</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-amber-400 text-xs sm:text-sm">{cat.scoringRating}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-blue-400 text-xs sm:text-sm">{cat.reboundRating}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-emerald-400 text-xs sm:text-sm">{cat.playmakingRating}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-purple-400 hidden md:table-cell">{cat.stealRating}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-cyan-400 hidden md:table-cell">{cat.blockRating}</td>
                          <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-right font-mono text-slate-400 hidden lg:table-cell text-[10px]">{p.role}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
