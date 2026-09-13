import React from 'react';
import { PlayerProfile, Team } from '../types';
import { Users, Lock, Sparkles, ShieldAlert, HeartHandshake, Clock, X, Building2, HelpCircle } from 'lucide-react';
import { getCompleteTeamRoster, getPlayerCategoryRatings, getUserPlayerCategoryRatings } from '../utils/leagueLogic';
import { TeamLogo } from './TeamLogo';
import { ContractOffer, generateFreeAgencyOffers, regenerateFreeAgencyOffers } from '../utils/contractLogic';
import { completeRewardedAd } from '../lib/rewardedAd';
import { RewardedRefreshButton } from './RewardedRefreshButton';

interface RosterAndTransfersProps {
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
}

const TRADE_DEADLINE_GAME = 55;

export const RosterAndTransfers: React.FC<RosterAndTransfersProps> = ({
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
}) => {
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isRefreshingOffers, setIsRefreshingOffers] = React.useState(false);
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

                    {/* Accept Action */}
                    <button
                      type="button"
                      onClick={() => handleAcceptTradeOffer(offer)}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black italic text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer self-stretch sm:self-auto justify-center shadow-md"
                    >
                      <span>🤝 确认交易并加盟</span>
                    </button>
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
                              {p.position}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono sm:hidden flex items-center gap-1">
                            <span>{p.minutes || st.mpg || 15.0}分</span>
                            <span>·</span>
                            <span className={getRoleBadgeColor(p.role || '轮换替补')}>{p.role || '轮换替补'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-slate-300 hidden sm:table-cell">{p.position}</td>
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
