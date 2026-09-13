import React, { useState, useEffect } from 'react';
import { PlayerProfile, Team, RosterPlayer, Attributes } from '../types';
import { getRandomOffseasonEvent, OffseasonEvent } from '../data/offseasonEvents';
import { ContractOffer, generateContractOfferForTeam, generateFreeAgencyOffers, regenerateFreeAgencyOffers } from '../utils/contractLogic';
import { TeamLogo } from './TeamLogo';
import { DraftNightModal } from './DraftNightModal';
import { getHistoricalDraftData } from '../data/draftData';
import { getPlayerBaseOvr, getUserPlayerAgePenalty } from '../utils/calc2k';
import { PERSONAL_ASSETS } from '../data/nbaData2008';
import {
  Dumbbell,
  Flame,
  Trophy,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Star,
  Zap,
  DollarSign,
  Users,
  Award,
  Calendar,
  AlertCircle,
  FileText,
  ArrowRightLeft,
  Eye,
  Shield,
  X,
  Building2,
  User,
  Dices,
  Check,
} from 'lucide-react';
import { gameConfetti as confetti } from '../utils/gameConfetti';
import { completeRewardedAd } from '../lib/rewardedAd';
import { RewardedRefreshButton } from './RewardedRefreshButton';
import type { YearDraftData } from '../data/draftData';
import type { GameMode } from '../gameMode';

const REMAKE_ATTR_OPTIONS: { key: keyof Attributes; label: string; cat: string; icon: string }[] = [
  { key: 'midRange', label: '中投', cat: '投篮', icon: '🎯' },
  { key: 'threePoint', label: '三分', cat: '投篮', icon: '🏹' },
  { key: 'freeThrow', label: '罚球', cat: '投篮', icon: '🏀' },
  { key: 'layup', label: '上篮', cat: '进攻', icon: '👟' },
  { key: 'dunk', label: '扣篮', cat: '进攻', icon: '💥' },
  { key: 'insideFinish', label: '终结', cat: '进攻', icon: '🧱' },
  { key: 'postMove', label: '背身', cat: '进攻', icon: '🏛️' },
  { key: 'ballHandle', label: '控球', cat: '组织', icon: '💫' },
  { key: 'passing', label: '传球', cat: '组织', icon: '🧠' },
  { key: 'perimeterDef', label: '外防', cat: '防守', icon: '🛡️' },
  { key: 'interiorDef', label: '内防', cat: '防守', icon: '🏰' },
  { key: 'block', label: '盖帽', cat: '防守', icon: '🛑' },
  { key: 'steal', label: '抢断', cat: '防守', icon: '⚡' },
  { key: 'rebounding', label: '篮板', cat: '防守', icon: '🎯' },
  { key: 'speed', label: '速度', cat: '身体', icon: '🏃' },
  { key: 'vertical', label: '弹跳', cat: '身体', icon: '🚀' },
  { key: 'strength', label: '力量', cat: '身体', icon: '💪' },
  { key: 'stamina', label: '耐力', cat: '身体', icon: '🫀' },
];

const ALL_ATTR_KEYS: (keyof Attributes)[] = [
  'midRange', 'threePoint', 'freeThrow', 'layup', 'dunk', 'insideFinish',
  'postMove', 'ballHandle', 'passing', 'perimeterDef', 'interiorDef',
  'steal', 'block', 'rebounding', 'speed', 'strength', 'vertical', 'stamina'
];

interface OffseasonDashboardProps {
  player: PlayerProfile;
  currentTeam: Team;
  teams: Team[];
  currentYear: number;
  gameMode?: GameMode;
  parallelDraftData?: YearDraftData | null;
  offseasonMonth: number;
  offseasonCompletedPlans: Record<number, { id: string; title: string; desc: string }>;
  offseasonEventMonths: number[];
  usedEventIds: Set<string>;
  offseasonPhase?: 'draft' | 'contract' | 'training';
  isDraftCompleted?: boolean;
  isContractCompleted?: boolean;
  contractStep?: 'decision' | 'renewal_offer' | 'free_agency';
  renewalOffer?: ContractOffer | null;
  freeAgencyOffers?: ContractOffer[];
  onSetOffseasonPhase?: (phase: 'draft' | 'contract' | 'training') => void;
  onSetIsDraftCompleted?: (completed: boolean) => void;
  onSetIsContractCompleted?: (completed: boolean) => void;
  onSetContractStep?: (step: 'decision' | 'renewal_offer' | 'free_agency') => void;
  onSetRenewalOffer?: (offer: ContractOffer | null) => void;
  onSetFreeAgencyOffers?: (offers: ContractOffer[]) => void;
  onUpdatePlayer: (updatedPlayer: PlayerProfile) => void;
  onUpdateTeams?: (updatedTeams: Team[]) => void;
  onSetOffseasonMonth: (month: number) => void;
  onSetOffseasonCompletedPlans: (plans: Record<number, { id: string; title: string; desc: string }>) => void;
  onAddUsedEventId: (eventId: string) => void;
  onNextSeason: () => void;
  onSignContract: (newTeamId: string, salaryPerYear: number, totalYears: number) => void;
}

export const OffseasonDashboard: React.FC<OffseasonDashboardProps> = ({
  player,
  currentTeam,
  teams,
  currentYear,
  gameMode = 'classic',
  parallelDraftData,
  offseasonMonth,
  offseasonCompletedPlans,
  offseasonEventMonths,
  usedEventIds,
  offseasonPhase = 'draft',
  isDraftCompleted = false,
  isContractCompleted = false,
  contractStep = 'decision',
  renewalOffer = null,
  freeAgencyOffers = [],
  onSetOffseasonPhase,
  onSetIsDraftCompleted,
  onSetIsContractCompleted,
  onSetContractStep,
  onSetRenewalOffer,
  onSetFreeAgencyOffers,
  onUpdatePlayer,
  onUpdateTeams,
  onSetOffseasonMonth,
  onSetOffseasonCompletedPlans,
  onAddUsedEventId,
  onNextSeason,
  onSignContract,
}) => {
  // Check if contract is expired
  const isContractExpired = (player.contract?.yearsLeft || 0) <= 0;

  // Check if current year has draft data
  const historicalDraftData = getHistoricalDraftData(currentYear);
  const currentYearDraftData = gameMode === 'random_trade' ? parallelDraftData : historicalDraftData;
  const hasDraftForCurrentYear = !!(currentYearDraftData && currentYearDraftData.draftPicks && currentYearDraftData.draftPicks.length > 0);
  const isWaitingForParallelDraft = gameMode === 'random_trade' && currentYear > 2008 && !parallelDraftData;

  // Use state setter wrappers to update parent persistent state
  const setOffseasonPhase = (p: 'draft' | 'contract' | 'training') => onSetOffseasonPhase?.(p);
  const setIsDraftCompleted = (c: boolean) => onSetIsDraftCompleted?.(c);
  const setIsContractCompleted = (c: boolean) => onSetIsContractCompleted?.(c);
  const setContractStep = (s: 'decision' | 'renewal_offer' | 'free_agency') => onSetContractStep?.(s);
  const setRenewalOffer = (o: ContractOffer | null) => onSetRenewalOffer?.(o);
  const setFreeAgencyOffers = (o: ContractOffer[]) => onSetFreeAgencyOffers?.(o);

  useEffect(() => {
    if (freeAgencyOffers.length > 3) {
      setFreeAgencyOffers(freeAgencyOffers.slice(0, 3));
    }
  }, [freeAgencyOffers]);

  useEffect(() => {
    if (!hasDraftForCurrentYear && !isDraftCompleted && !isWaitingForParallelDraft) {
      setIsDraftCompleted(true);
      setOffseasonPhase(isContractExpired && !isContractCompleted ? 'contract' : 'training');
    }
  }, [hasDraftForCurrentYear, isDraftCompleted, isContractExpired, isContractCompleted, isWaitingForParallelDraft]);

  // Modals for Contract view
  const [viewingRosterTeam, setViewingRosterTeam] = useState<Team | null>(null);
  const [pendingSignOffer, setPendingSignOffer] = useState<ContractOffer | null>(null);
  const [isRefreshingOffers, setIsRefreshingOffers] = useState(false);

  // Random Offseason Event Modal
  const [activeEvent, setActiveEvent] = useState<OffseasonEvent | null>(null);

  // 1. Handle Attempt Renewal with Current Team
  const handleAttemptRenewal = () => {
    if (renewalOffer) {
      setContractStep('renewal_offer');
      return;
    }
    const offer = generateContractOfferForTeam(currentTeam, player.ovr);
    setRenewalOffer(offer);
    setContractStep('renewal_offer');
  };

  // 2. Handle Enter Free Agency
  const handleEnterFreeAgency = () => {
    if (freeAgencyOffers.length > 0) {
      setContractStep('free_agency');
      return;
    }
    const offers = generateFreeAgencyOffers(player.ovr, currentTeam.id, teams);
    setFreeAgencyOffers(offers);
    setContractStep('free_agency');
  };

  const handleRefreshFreeAgencyOffers = async () => {
    if (isRefreshingOffers || player.freeAgencyOfferRefreshUsed) return;
    setIsRefreshingOffers(true);
    try {
      if (!await completeRewardedAd()) {
        return;
      }
      setFreeAgencyOffers(regenerateFreeAgencyOffers(player.ovr, currentTeam.id, teams, freeAgencyOffers));
      onUpdatePlayer({ ...player, freeAgencyOfferRefreshUsed: true });
    } catch {
      // Silently restore the button when the ad cannot be opened.
    } finally {
      setIsRefreshingOffers(false);
    }
  };

  // 3. Open Contract Signing Confirmation Modal
  const handleOpenSigningPage = (offer: ContractOffer) => {
    setPendingSignOffer(offer);
  };

  // 4. Confirm Contract Signing
  const handleConfirmSignContract = () => {
    if (!pendingSignOffer) return;

    onSignContract(pendingSignOffer.team.id, pendingSignOffer.salaryPerYear, pendingSignOffer.totalYears);
    setPendingSignOffer(null);
    setRenewalOffer(null);
    setFreeAgencyOffers([]);
    setIsContractCompleted(true);
    setOffseasonPhase('training');

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } catch (e) {}
  };

  // Fitness cap selection modal state
  const [isFitnessModalOpen, setIsFitnessModalOpen] = useState<boolean>(false);
  const [selectedFitnessAttrs, setSelectedFitnessAttrs] = useState<(keyof Attributes)[]>([]);

  // OVR Cap limit check for 专项训练 (Skill Workout)
  const agePenalty = getUserPlayerAgePenalty(player.age || 19);
  const maxOvrCap = 99 - agePenalty;
  const availableFitnessAttrsCount = REMAKE_ATTR_OPTIONS.filter((item) => {
    const cap = (player.attributeCaps && player.attributeCaps[item.key] !== undefined)
      ? player.attributeCaps[item.key]
      : 90;
    return cap < maxOvrCap;
  }).length;
  const allAttrsAtCap = ALL_ATTR_KEYS.every((k) => {
    const val = player.attributes[k] || 50;
    const cap = (player.attributeCaps && player.attributeCaps[k]) ? player.attributeCaps[k] : maxOvrCap;
    return val >= cap;
  });

  const isTrainingDisabled = getPlayerBaseOvr(player) >= maxOvrCap || allAttrsAtCap;

  // Handle 4-Month Plan Selection
  const handleSelectPlan = (planId: 'training' | 'fitness' | 'tournament' | 'commercial') => {
    if (offseasonMonth > 4) return;

    if (planId === 'fitness') {
      if (availableFitnessAttrsCount === 0) return;
      setSelectedFitnessAttrs([]);
      setIsFitnessModalOpen(true);
      return;
    }

    let updatedPlayer = { ...player };
    let planTitle = '';
    let planDesc = '';

    if (planId === 'training') {
      if (isTrainingDisabled) return;
      planTitle = '专项训练';
      planDesc = '获得了 +4 点可分配属性点数';
      updatedPlayer.skillPoints = (updatedPlayer.skillPoints || 0) + 4;
    } else if (planId === 'tournament') {
      planTitle = '参与邀请赛';
      planDesc = '粉丝 +10,000';
      updatedPlayer.fansCount = (updatedPlayer.fansCount || 0) + 10000;
    } else if (planId === 'commercial') {
      planTitle = '出席商业活动';
      planDesc = '资金 +$250,000';
      updatedPlayer.money = (updatedPlayer.money || 0) + 250000;
    }

    onUpdatePlayer(updatedPlayer);

    onSetOffseasonCompletedPlans({
      ...offseasonCompletedPlans,
      [offseasonMonth]: { id: planId, title: planTitle, desc: planDesc },
    });

    // Temporarily disabled random offseason events as requested
    const nextM = offseasonMonth + 1;
    onSetOffseasonMonth(nextM);
    if (nextM > 4) {
      try {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
    }
  };

  // Confirm Fitness 3-attribute Cap Boost Selection
  const handleConfirmFitnessCapBoost = () => {
    const targetRequiredCount = Math.min(3, availableFitnessAttrsCount);

    if (selectedFitnessAttrs.length !== targetRequiredCount || targetRequiredCount === 0 || offseasonMonth > 4) return;

    let updatedPlayer = { ...player };
    const newCaps = { ...(updatedPlayer.attributeCaps || {}) };

    selectedFitnessAttrs.forEach((attrKey) => {
      const currentCap = newCaps[attrKey] ?? 90;
      newCaps[attrKey] = Math.min(maxOvrCap, currentCap + 2);
    });

    updatedPlayer.attributeCaps = newCaps;

    const attrLabels = selectedFitnessAttrs
      .map((k) => REMAKE_ATTR_OPTIONS.find((o) => o.key === k)?.label || k)
      .join('、');

    const planTitle = '重造突破';
    const planDesc = `提升了 ${attrLabels} 的上限 (+2)`;

    onUpdatePlayer(updatedPlayer);

    onSetOffseasonCompletedPlans({
      ...offseasonCompletedPlans,
      [offseasonMonth]: { id: 'fitness', title: planTitle, desc: planDesc },
    });

    setIsFitnessModalOpen(false);

    const nextM = offseasonMonth + 1;
    onSetOffseasonMonth(nextM);
    if (nextM > 4) {
      try {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
    }
  };

  const handleAcceptEventReward = () => {
    if (!activeEvent) return;

    let updatedPlayer = { ...player };
    const r = activeEvent.reward;

    if (r.skillPoints) {
      updatedPlayer.skillPoints = (updatedPlayer.skillPoints || 0) + r.skillPoints;
    }
    if (r.attrCapBonus) {
      const newCaps = { ...updatedPlayer.attributeCaps };
      for (const k in newCaps) {
        const key = k as keyof typeof newCaps;
        newCaps[key] = Math.min(99, (newCaps[key] || 90) + r.attrCapBonus);
      }
      updatedPlayer.attributeCaps = newCaps;
    }
    if (r.money) {
      updatedPlayer.money = (updatedPlayer.money || 0) + r.money;
    }
    if (r.fans) {
      updatedPlayer.fansCount = (updatedPlayer.fansCount || 0) + r.fans;
    }
    if (r.morale) {
      updatedPlayer.morale = Math.min(100, Math.max(0, (updatedPlayer.morale || 80) + r.morale));
    }
    if (r.mediaReputation) {
      updatedPlayer.mediaReputation = Math.min(100, Math.max(0, (updatedPlayer.mediaReputation || 80) + r.mediaReputation));
    }

    onUpdatePlayer(updatedPlayer);
    setActiveEvent(null);

    const nextM = offseasonMonth + 1;
    onSetOffseasonMonth(nextM);
    if (nextM > 4) {
      try {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
    }
  };

  const isAllMonthsComplete = offseasonMonth > 4;

  const monthNames = [
    { index: 1, name: '6月 (阶段一)', label: '初夏打磨' },
    { index: 2, name: '7月 (阶段二)', label: '盛夏破局' },
    { index: 3, name: '8月 (阶段三)', label: '仲夏特训' },
    { index: 4, name: '9月 (阶段四)', label: '秋季蓄力' },
  ];

  const getCategoryBadgeColor = (cat: OffseasonEvent['category']) => {
    switch (cat) {
      case '训练': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case '商业': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case '公益': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case '交际': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case '社会': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case '家庭': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Find lowest OVR player for pending sign offer to show trade detail
  const lowestPlayerForPending = pendingSignOffer
    ? [...pendingSignOffer.team.roster].sort((a, b) => a.ovr - b.ovr)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Offseason Header Banner (Desktop Full / Mobile Streamlined) */}
      <div className="bg-gradient-to-r from-[#121622] via-[#1a2133] to-[#121622] border border-[#2d364d] rounded-2xl p-3 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Mobile-first Target Action Header */}
        <div className="block sm:hidden space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TeamLogo team={currentTeam} size="xs" />
              <span className="text-xs font-black text-white">{currentTeam.name}</span>
              <span className="text-[10px] font-mono text-slate-400">· {currentYear}-{currentYear + 1} 休赛期</span>
            </div>
            {!isContractExpired ? (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                合同剩余 {player.contract.yearsLeft} 年
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 animate-pulse">
                合同已到期
              </span>
            )}
          </div>

          {/* Direct Task Guidance Banner on Mobile */}
          {!isContractExpired && offseasonPhase === 'training' && (
            <div className="mt-1">
              {!isAllMonthsComplete ? (
                <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>当前任务：选择【{monthNames[offseasonMonth - 1]?.name}】计划推进行程</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">({offseasonMonth}/4 月)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onNextSeason}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-black italic text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase ring-2 ring-amber-300 animate-pulse"
                >
                  <Trophy className="w-4 h-4 text-black fill-black" />
                  <span>🎉 备战全部完成！点击进入下赛季</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5 mb-1 sm:mb-1.5 flex-wrap">
              <span className="px-2 sm:px-2.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" /> OFFSEASON
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-mono font-bold">
                {currentYear}-{currentYear + 1} 休赛期 <span>· 深度备战与合同中心</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black italic uppercase text-white tracking-tight flex items-center gap-2">
              休赛期大本营 <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </h1>

            {/* Current Team & Contract Status Bar */}
            <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#090d16] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-[#232a3c]">
                <TeamLogo team={currentTeam} size="xs" />
                <span className="text-xs font-black text-white">{currentTeam.city} {currentTeam.name}</span>
              </div>

              {!isContractExpired ? (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-500/10 border border-emerald-500/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-emerald-300 text-[11px] sm:text-xs font-mono font-bold">
                  <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>合同生效中: 剩 {player.contract.yearsLeft} 年 <span className="hidden sm:inline">(${(player.contract.salaryPerYear / 10000).toFixed(0)}万/年)</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-rose-500/20 border border-rose-500/40 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-rose-300 text-[11px] sm:text-xs font-mono font-bold animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>合同已到期: 请先选择续约或签约新球队</span>
                </div>
              )}
            </div>
          </div>

          {/* Top Right "进入下赛季" Button */}
          <div className="w-full sm:w-auto pt-1 sm:pt-0">
            <button
              type="button"
              disabled={isContractExpired || !isAllMonthsComplete}
              onClick={onNextSeason}
              className={`w-full sm:w-auto justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black italic text-xs uppercase tracking-wide transition-all flex items-center gap-2 shadow-xl cursor-pointer ${
                !isContractExpired && isAllMonthsComplete
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black shadow-amber-500/30 ring-2 ring-amber-300'
                  : 'bg-[#181d29] text-slate-500 border border-[#2b3346] cursor-not-allowed opacity-60'
              }`}
            >
              <Trophy className={`w-4 h-4 shrink-0 ${!isContractExpired && isAllMonthsComplete ? 'text-black fill-black' : 'text-slate-500'}`} />
              <span>进入下赛季 </span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
            {(isContractExpired || !isAllMonthsComplete) && (
              <p className="text-[10px] text-slate-400 text-center sm:text-right mt-1 font-mono flex items-center justify-center sm:justify-end gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                {isContractExpired ? '需要先处理合同' : '需完成4个月休赛期计划'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Offseason Navigation Stepper Tabs (Hidden on mobile if in training and no expired contract) */}
      {(!isDraftCompleted || isContractExpired) && (
        <div className={`grid ${isContractExpired ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 sm:gap-2 bg-[#0c0f17] p-1.5 sm:p-2 rounded-2xl border border-[#232a3c]`}>
          {/* 1. DRAFT TAB */}
          <button
            type="button"
            disabled={isDraftCompleted || !hasDraftForCurrentYear}
            onClick={() => !isDraftCompleted && hasDraftForCurrentYear && setOffseasonPhase('draft')}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-[11px] sm:text-xs font-black italic uppercase transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              !hasDraftForCurrentYear || isDraftCompleted
                ? 'bg-[#080b12] text-slate-500 border border-[#1d2433] cursor-not-allowed opacity-80'
                : offseasonPhase === 'draft'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 cursor-pointer'
                : 'bg-[#121622] text-slate-400 hover:text-white hover:bg-[#1a2030] cursor-pointer'
            }`}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">
              {!hasDraftForCurrentYear
                ? '✓ 1.选秀大会 (已跳过)'
                : isDraftCompleted
                ? '✓ 1.选秀大会 (已完成)'
                : '1.选秀大会'}

            </span>
          </button>

          {/* 2. CONTRACT TAB (Only shown if contract is expired) */}
          {isContractExpired && (
            <button
              type="button"
              disabled={!isDraftCompleted || isContractCompleted}
              onClick={() => isDraftCompleted && !isContractCompleted && setOffseasonPhase('contract')}
              className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-[11px] sm:text-xs font-black italic uppercase transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                isContractCompleted
                  ? 'bg-[#080b12] text-slate-500 border border-[#1d2433] cursor-not-allowed opacity-80'
                  : !isDraftCompleted
                  ? 'bg-[#080b12] text-slate-600 border border-[#1a202c] cursor-not-allowed opacity-60'
                  : offseasonPhase === 'contract'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 cursor-pointer'
                  : 'bg-[#121622] text-slate-400 hover:text-white hover:bg-[#1a2030] cursor-pointer'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">
                {isContractCompleted
                  ? '✓ 2.合同处理'
                  : !isDraftCompleted
                  ? '🔒 2.合同处理'
                  : '2.合同处理'}
                <span className="hidden sm:inline"> (合同到期)</span>
              </span>
            </button>
          )}

          {/* 3. TRAINING PLAN TAB */}
          {(() => {
            const isTrainingLocked = !isDraftCompleted || (isContractExpired && !isContractCompleted);
            return (
              <button
                type="button"
                disabled={isTrainingLocked}
                onClick={() => !isTrainingLocked && setOffseasonPhase('training')}
                className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-[11px] sm:text-xs font-black italic uppercase transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                  isTrainingLocked
                    ? 'bg-[#080b12] text-slate-600 border border-[#1a202c] cursor-not-allowed opacity-60'
                    : offseasonPhase === 'training'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 cursor-pointer'
                    : 'bg-[#121622] text-slate-400 hover:text-white hover:bg-[#1a2030] cursor-pointer'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">
                  {isTrainingLocked
                    ? `🔒 ${isContractExpired ? '3.休赛期计划' : '2.休赛期计划'}`
                    : `${isContractExpired ? '3.休赛期计划' : '2.休赛期计划'}`}

                </span>
              </button>
            );
          })()}
        </div>
      )}

      {/* PHASE 1: DRAFT NIGHT MODAL / BOARD */}
      {offseasonPhase === 'draft' && !isDraftCompleted && (
        <DraftNightModal
          player={player}
          teams={teams}
          currentYear={currentYear}
          suppliedDraftData={currentYearDraftData}
          isOffseasonFlow={true}
          onComplete={(updatedTeams) => {
            if (updatedTeams && onUpdateTeams) {
              onUpdateTeams(updatedTeams);
            }
            setIsDraftCompleted(true);
            setOffseasonPhase(isContractExpired && !isContractCompleted ? 'contract' : 'training');
          }}
        />
      )}

      {/* PHASE 2: CONTRACT PROCESSING MODULE */}
      {offseasonPhase === 'contract' && (
        <div className="bg-[#11151e] border-2 border-amber-500/40 rounded-2xl p-3 sm:p-6 shadow-2xl space-y-3 sm:space-y-5">
          <div className="border-b border-[#232a3c] pb-2.5 sm:pb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-rose-400" /> 合同处理中心
                </span>
                <span className="text-[10px] sm:text-xs text-amber-400 font-mono font-bold">
                  {isContractExpired ? '自由市场 / 续约阶段' : '合同生效中'}
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-black italic text-white mt-1">
                {isContractExpired ? '合同已到期，请决定你的未来归宿' : '当前合同依然生效中'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                {!isContractExpired && `你在 ${currentTeam.name} 的合同还剩 ${player.contract?.yearsLeft || 1} 年。`}
              </p>
            </div>

            {!isContractExpired && (
              <button
                type="button"
                onClick={() => {
                  setIsContractCompleted(true);
                  setOffseasonPhase('training');
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <span>进入下一个阶段：休赛期备战计划</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {contractStep !== 'decision' && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setContractStep('decision')}
                className="px-2.5 py-1 bg-[#1a2130] hover:bg-[#253046] text-slate-300 text-xs font-bold rounded-lg border border-[#2b354b] transition-all flex items-center gap-1 cursor-pointer"
              >
                ← 返回选项
              </button>
              {contractStep === 'free_agency' && (
                <RewardedRefreshButton
                  loading={isRefreshingOffers}
                  disabled={Boolean(player.freeAgencyOfferRefreshUsed)}
                  onClick={handleRefreshFreeAgencyOffers}
                />
              )}
            </div>
          )}

          {/* STEP A: Decision Options (续约 / 自由市场) */}
          {contractStep === 'decision' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Option 1: 尝试与原球队续约 */}
              <div className="bg-[#0e121a] hover:bg-[#151b27] border border-[#2d364d] hover:border-amber-500/60 p-3 sm:p-4 rounded-xl transition-all flex flex-col justify-between space-y-3 shadow-lg group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <TeamLogo team={currentTeam} size="sm" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                        与 {currentTeam.name} 谈判续约
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">
                        原母队 · {player.ovr} OVR 优先谈判
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                    母队优先
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAttemptRenewal}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black italic text-xs rounded-lg uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>与 {currentTeam.name} 谈判续约</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Option 2: 进入自由球员市场 */}
              <div className="bg-[#0e121a] hover:bg-[#151b27] border border-[#2d364d] hover:border-cyan-500/60 p-3 sm:p-4 rounded-xl transition-all flex flex-col justify-between space-y-3 shadow-lg group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                        进入自由球员市场
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">
                        全联盟试水 · 接收 3 队报价
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shrink-0">
                    自由球员
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleEnterFreeAgency}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-black italic text-xs rounded-lg uppercase transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>开启自由市场报价</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP B: Renewal Offer Details View */}
          {contractStep === 'renewal_offer' && renewalOffer && (
            <div className="bg-[#0b0e14] border border-[#252f44] rounded-xl p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#232a3c] pb-2">
                <div className="flex items-center gap-2.5">
                  <TeamLogo team={renewalOffer.team} size="sm" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white">
                      {renewalOffer.team.city} {renewalOffer.team.name} 续约报价单
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      评估实力: {player.ovr} OVR
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 shrink-0">
                  母队提案
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#121722] p-2.5 rounded-lg border border-[#232a3c]">
                  <span className="text-[10px] text-slate-400 font-bold block">年薪</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-emerald-400">
                    ${(renewalOffer.salaryPerYear / 10000).toFixed(0)}万/年
                  </span>
                </div>

                <div className="bg-[#121722] p-2.5 rounded-lg border border-[#232a3c]">
                  <span className="text-[10px] text-slate-400 font-bold block">年限</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-amber-400">
                    {renewalOffer.totalYears} 年
                  </span>
                </div>

                <div className="bg-[#121722] p-2.5 rounded-lg border border-[#232a3c]">
                  <span className="text-[10px] text-slate-400 font-bold block">总额</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-cyan-400">
                    ${(renewalOffer.totalValue / 10000).toFixed(0)}万
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleEnterFreeAgency}
                  className="px-3 py-2 bg-[#1c2333] hover:bg-[#283248] text-slate-300 font-bold text-xs rounded-lg border border-[#2d3850] transition-all cursor-pointer"
                >
                  试水自由市场
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSigningPage(renewalOffer)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black italic text-xs rounded-lg uppercase transition-all shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> 接受续约提案
                </button>
              </div>
            </div>
          )}

          {/* STEP C: Free Agency Market View (5 Teams Offer List) */}
          {contractStep === 'free_agency' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black italic text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" /> 自由市场 3 队报价列表
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  共 {freeAgencyOffers.length} 份提案
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {freeAgencyOffers.map((offer) => (
                  <div
                    key={offer.team.id}
                    className="bg-[#0b0e14] hover:bg-[#111622] border border-[#232a3c] hover:border-cyan-500/50 p-2.5 sm:p-3 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md"
                  >
                    {/* Team Info & Contract Numbers */}
                    <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TeamLogo team={offer.team} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-black text-white truncate">
                              {offer.team.city} {offer.team.name}
                            </h4>
                            <span className="text-[9px] font-bold font-mono text-slate-400 bg-[#161d2b] px-1.5 py-0.5 rounded border border-[#263248] shrink-0">
                              ⭐️ {offer.team.rating}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5 flex items-center gap-2">
                            <span>${(offer.salaryPerYear / 10000).toFixed(0)}万/年</span>
                            <span className="text-amber-400">· {offer.totalYears}年</span>
                            <span className="text-cyan-400 text-[10px]"> (总计 ${(offer.totalValue / 10000).toFixed(0)}万)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() => setViewingRosterTeam(offer.team)}
                        className="px-2.5 py-1.5 bg-[#18202e] hover:bg-[#232f45] text-slate-200 text-xs font-bold rounded-lg border border-[#2c3852] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>阵容</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSigningPage(offer)}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black italic text-xs rounded-lg uppercase transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <span>选择此合同</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 4-MONTH OFFSEASON PLAN MODULE (Shown when in training phase)           */}
      {/* ========================================================================= */}
      {offseasonPhase === 'training' && (
        <div className="space-y-4 sm:space-y-6">
          {/* 4-Month Progress Timeline Stepper (Responsive Mobile Compact Bar + Desktop Grid) */}
          <div className="bg-[#11151e] border border-[#232a3c] rounded-2xl p-3 sm:p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> 休赛期进度 (6月 - 9月)
              </h3>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                进度: {Math.min(4, offseasonMonth - 1)} / 4 月
              </span>
            </div>

            {/* Mobile 1-Line Slepper Bar */}
            <div className="grid grid-cols-4 gap-1 sm:hidden">
              {monthNames.map((m) => {
                const isDone = offseasonMonth > m.index;
                const isCurrent = offseasonMonth === m.index;
                const completedInfo = offseasonCompletedPlans[m.index];

                return (
                  <div
                    key={m.index}
                    className={`py-1.5 px-1 rounded-lg border text-center transition-all ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : isCurrent
                        ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 ring-1 ring-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-[#080b12] border-[#1d2433] text-slate-500'
                    }`}
                  >
                    <div className="text-[11px] font-black italic flex items-center justify-center gap-0.5">
                      <span>{m.name.split('(')[0]}</span>
                      {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                    </div>
                    <div className="text-[8px] font-mono leading-none mt-0.5">
                      {isDone ? (
                        <span className="text-emerald-400 font-bold truncate block">{completedInfo?.title || '已完成'}</span>
                      ) : isCurrent ? (
                        <span className="text-amber-400 font-bold animate-pulse">进行中</span>
                      ) : (
                        <span className="text-slate-600">未开始</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Full 4-Column Grid */}
            <div className="hidden sm:grid grid-cols-4 gap-2.5">
              {monthNames.map((m) => {
                const isDone = offseasonMonth > m.index;
                const isCurrent = offseasonMonth === m.index;
                const completedInfo = offseasonCompletedPlans[m.index];

                return (
                  <div
                    key={m.index}
                    className={`p-3 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : isCurrent
                        ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                        : 'bg-[#0b0e14]/50 border-[#232a3c] text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black italic">{m.name}</span>
                      {isDone ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> 已完成
                        </span>
                      ) : isCurrent ? (
                        <span className="text-[10px] font-bold text-amber-400 animate-pulse">
                          进行中
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">未开始</span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono">{m.label}</p>

                    {completedInfo && (
                      <div className="mt-1.5 pt-1.5 border-t border-emerald-500/20 text-[10px] font-bold text-emerald-300 truncate">
                        ✅ {completedInfo.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content Area: Plan Selection or All-Complete Banner */}
          {!isAllMonthsComplete ? (
            <div className="bg-[#11151e] border border-[#232a3c] rounded-2xl p-3 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#232a3c] pb-2">
                <h2 className="text-xs sm:text-sm font-black italic text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>选择【{monthNames[offseasonMonth - 1]?.name.split('(')[0]}】备战计划</span>
                </h2>
                <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 shrink-0">
                  {offseasonMonth} / 4 月
                </span>
              </div>

              {/* 4 Core Plan Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Plan 1: 专项训练 */}
                <div className={`bg-[#0e121a] border p-2.5 sm:p-3 rounded-xl transition-all flex flex-col justify-between shadow-md ${
                  isTrainingDisabled
                    ? 'border-[#232a3c] opacity-80'
                    : 'hover:bg-[#151b27] border-[#232a3c] hover:border-amber-500/50'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        isTrainingDisabled
                          ? 'bg-slate-800 border-slate-700 text-slate-500'
                          : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                      }`}>
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-white truncate">1. 专项训练</h3>
                        <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                          <Zap className="w-3 h-3 fill-amber-400 shrink-0" />
                          <span>+4 点 SP 属性点</span>
                        </p>
                      </div>
                    </div>
                    {isTrainingDisabled && (
                      <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 shrink-0">
                        已达上限
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isTrainingDisabled}
                    onClick={() => handleSelectPlan('training')}
                    className={`w-full py-2 font-black italic text-xs rounded-lg transition-all uppercase flex items-center justify-center gap-1 cursor-pointer ${
                      isTrainingDisabled
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                    }`}
                  >
                    <span>{isTrainingDisabled ? '综评已达上限' : '确定选择'}</span>
                    {!isTrainingDisabled && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>

                {/* Plan 2: 重造突破 */}
                <div className="bg-[#0e121a] hover:bg-[#151b27] border border-[#232a3c] hover:border-cyan-500/50 p-2.5 sm:p-3 rounded-xl transition-all flex flex-col justify-between shadow-md">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-white truncate">2. 重造突破</h3>
                        <p className="text-[11px] font-bold text-cyan-400 flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span>自选 3 项上限 +2</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={availableFitnessAttrsCount === 0}
                    onClick={() => handleSelectPlan('fitness')}
                    className={`w-full py-2 font-black italic text-xs rounded-lg transition-all uppercase flex items-center justify-center gap-1 shadow-md ${
                      availableFitnessAttrsCount === 0
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-black cursor-pointer'
                    }`}
                  >
                    <span>{availableFitnessAttrsCount === 0 ? '当前年龄上限已满' : '确定选择'}</span>
                    {availableFitnessAttrsCount > 0 && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>

                {/* Plan 3: 参与邀请赛 */}
                <div className="bg-[#0e121a] hover:bg-[#151b27] border border-[#232a3c] hover:border-purple-500/50 p-2.5 sm:p-3 rounded-xl transition-all flex flex-col justify-between shadow-md">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-white truncate">3. 参与邀请赛</h3>
                        <p className="text-[11px] font-bold text-purple-300 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>粉丝量 +10,000</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan('tournament')}
                    className="w-full py-2 bg-purple-500 hover:bg-purple-400 text-white font-black italic text-xs rounded-lg transition-all uppercase cursor-pointer flex items-center justify-center gap-1 shadow-md"
                  >
                    <span>确定选择</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Plan 4: 出席商业活动 */}
                <div className="bg-[#0e121a] hover:bg-[#151b27] border border-[#232a3c] hover:border-emerald-500/50 p-2.5 sm:p-3 rounded-xl transition-all flex flex-col justify-between shadow-md">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-white truncate">4. 出席商业活动</h3>
                        <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                          <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>商业收入 +$250,000</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan('commercial')}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black italic text-xs rounded-lg transition-all uppercase cursor-pointer flex items-center justify-center gap-1 shadow-md"
                  >
                    <span>确定选择</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* All 4 Months Completed Banner */
            <div className="bg-gradient-to-r from-emerald-500/15 via-amber-500/15 to-emerald-500/15 border border-amber-500/40 rounded-2xl p-6 text-center space-y-3 shadow-2xl relative overflow-hidden">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-xl font-black italic text-amber-300 uppercase">
                  🎉 4个月休赛期计划已圆满完成！
                </h2>
                <p className="text-xs text-slate-200 mt-1 max-w-xl mx-auto leading-relaxed">
                  经过 6月-9月 的专项打磨与备战，你的属性与状态已调整至最佳。点击下方按钮进入新赛季！
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNextSeason}
                  className="px-7 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black italic text-xs rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 uppercase cursor-pointer mx-auto ring-2 ring-amber-300 scale-105"
                >
                  <Trophy className="w-4 h-4 text-black fill-black" />
                  <span>进入下赛季</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 1: VIEW TEAM ROSTER MODAL                                           */}
      {/* ========================================================================= */}
      {viewingRosterTeam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121622] border border-[#2d364d] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#232a3c] pb-3">
              <div className="flex items-center gap-3">
                <TeamLogo team={viewingRosterTeam} size="md" />
                <div>
                  <h3 className="text-base font-black text-white">
                    {viewingRosterTeam.city} {viewingRosterTeam.name} 当前阵容
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {viewingRosterTeam.conference}区 · 战力评级 ⭐️ {viewingRosterTeam.rating} OVR
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRosterTeam(null)}
                className="w-8 h-8 rounded-lg bg-[#1a2130] hover:bg-[#283248] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              <div className="grid grid-cols-12 text-[10px] font-black uppercase text-slate-500 px-3 py-1 font-mono">
                <div className="col-span-1">位置</div>
                <div className="col-span-5">球员姓名</div>
                <div className="col-span-3 text-center">战术定位</div>
                <div className="col-span-3 text-right">综合评级</div>
              </div>

              {[...viewingRosterTeam.roster]
                .sort((a, b) => b.ovr - a.ovr)
                .map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="grid grid-cols-12 items-center bg-[#090c12] p-2.5 rounded-xl border border-[#1e2535] text-xs"
                  >
                    <div className="col-span-1 font-mono font-bold text-amber-400">
                      {p.position}
                    </div>
                    <div className="col-span-5 font-bold text-white flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {p.isStar && (
                        <span className="text-[9px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                          全明星
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 text-center text-[11px] font-mono text-slate-400">
                      {p.role || '轮换成员'}
                    </div>
                    <div className="col-span-3 text-right font-mono font-black text-cyan-400">
                      {p.ovr} OVR
                    </div>
                  </div>
                ))}
            </div>

            <button
              type="button"
              onClick={() => setViewingRosterTeam(null)}
              className="w-full py-2.5 bg-[#1b2230] hover:bg-[#263145] text-slate-200 font-bold text-xs rounded-xl border border-[#2b364d] transition-all cursor-pointer"
            >
              关闭阵容列表
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONTRACT SIGNING FORMAL PAGE                                     */}
      {/* ========================================================================= */}
      {pendingSignOffer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121622] border-2 border-amber-500/50 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#232a3c] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black italic text-white uppercase tracking-wider">
                  正式签约协议
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingSignOffer(null)}
                className="w-8 h-8 rounded-lg bg-[#1a2130] hover:bg-[#283248] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#090d14] p-4 rounded-xl border border-[#232a3c] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1c2436] pb-3">
                <div className="flex items-center gap-3">
                  <TeamLogo team={pendingSignOffer.team} size="md" />
                  <div>
                    <h4 className="text-base font-black text-white">
                      {pendingSignOffer.team.city} {pendingSignOffer.team.name}
                    </h4>
                    <span className="text-xs text-slate-400 font-mono">
                      加盟球队 · {pendingSignOffer.team.conference}区
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">签约球员</span>
                  <span className="text-sm font-black text-amber-400">{player.name}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[#182030]">
                  <span className="text-slate-400">平均年薪：</span>
                  <span className="font-bold text-emerald-400">
                    ${(pendingSignOffer.salaryPerYear / 10000).toFixed(0)} 万美元 / 年
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#182030]">
                  <span className="text-slate-400">合同年限：</span>
                  <span className="font-bold text-amber-400">{pendingSignOffer.totalYears} 年</span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#182030]">
                  <span className="text-slate-400">合同总计金额：</span>
                  <span className="font-bold text-cyan-400">
                    ${(pendingSignOffer.totalValue / 10000).toFixed(0)} 万美元
                  </span>
                </div>
              </div>

              {/* Roster Swap Notice */}
              {pendingSignOffer.team.id !== currentTeam.id && lowestPlayerForPending && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2.5 text-xs">
                  <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">球员交换条款</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      签约完成后，{pendingSignOffer.team.name} 阵中评级最低的球员{' '}
                      <span className="font-bold text-white">{lowestPlayerForPending.name} ({lowestPlayerForPending.ovr} OVR)</span>{' '}
                      将与原球队 ({currentTeam.name}) 进行对等交换。
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingSignOffer(null)}
                className="px-4 py-2.5 bg-[#1b2230] hover:bg-[#263145] text-slate-300 font-bold text-xs rounded-xl border border-[#2b364d] transition-all cursor-pointer"
              >
                取消
              </button>

              <button
                type="button"
                onClick={handleConfirmSignContract}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black italic text-xs rounded-xl uppercase transition-all shadow-xl flex items-center gap-1.5 cursor-pointer ring-2 ring-amber-300/50"
              >
                <CheckCircle2 className="w-4 h-4 text-black fill-black" />
                <span>✍️ 签署合同并加盟</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OFFSEASON RANDOM EVENT POPUP                                     */}
      {/* ========================================================================= */}
      {activeEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121622] border-2 border-amber-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#242c3d] pb-2.5">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${getCategoryBadgeColor(activeEvent.category)}`}>
                  休赛期事件 · {activeEvent.category}
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 随机触发
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-lg font-black italic text-white">
                【{activeEvent.title}】
              </h3>

              <div className="bg-[#090c12] p-3.5 rounded-xl border border-[#232a3c] text-xs text-slate-200 leading-relaxed">
                <p>{activeEvent.story}</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/40 p-3 rounded-xl space-y-1">
              <div className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 事件特别奖励
              </div>
              <div className="text-xs font-mono font-black text-amber-300">
                ✨ {activeEvent.rewardText}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcceptEventReward}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black italic text-xs rounded-xl transition-all uppercase tracking-wide cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> 确认收下奖励
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: FITNESS CAP SELECTION MODAL                                      */}
      {/* ========================================================================= */}
      {isFitnessModalOpen && (() => {
        const targetRequiredCount = Math.min(3, availableFitnessAttrsCount);

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#121622] border-2 border-cyan-500/50 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-[#232a3c] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black italic text-white uppercase tracking-wider">
                      重造突破
                    </h3>
                    <p className="text-xs text-slate-400">
                      选择{targetRequiredCount}项属性提升上限(+2点)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFitnessModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[#1a2130] hover:bg-[#283248] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#090d14] p-3 rounded-xl border border-[#232a3c] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">已选择属性提升：</span>
                <span className={`font-black px-2.5 py-0.5 rounded border ${
                  targetRequiredCount > 0 && selectedFitnessAttrs.length === targetRequiredCount
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {selectedFitnessAttrs.length} / {targetRequiredCount} 项
                </span>
              </div>

              <div className="overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 max-h-[50vh]">
                {REMAKE_ATTR_OPTIONS.map((item) => {
                  const isSelected = selectedFitnessAttrs.includes(item.key);
                  const baseVal = player.attributes[item.key] || 50;
                  const currentCap = (player.attributeCaps && player.attributeCaps[item.key] !== undefined)
                    ? player.attributeCaps[item.key]
                    : 90;
                  const isAtMaxCap = currentCap >= maxOvrCap;

                  const activeAssets = PERSONAL_ASSETS.filter(a => (player.purchasedAssetIds || []).includes(a.id));
                  let boostSum = 0;
                  (player.endorsements || []).forEach(end => {
                    if (end.rewardAttributes && end.rewardAttributes[item.key]) {
                      boostSum += end.rewardAttributes[item.key]!;
                    }
                  });
                  activeAssets.forEach(asset => {
                    if (asset.rewardAttributes && asset.rewardAttributes[item.key]) {
                      boostSum += asset.rewardAttributes[item.key]!;
                    }
                  });
                  if (player.signatureShoe && player.signatureShoe.boostAttr === item.key) {
                    boostSum += player.signatureShoe.boostVal;
                  }

                  const toggleAttr = () => {
                    if (isAtMaxCap) return;
                    if (isSelected) {
                      setSelectedFitnessAttrs(selectedFitnessAttrs.filter((k) => k !== item.key));
                    } else {
                      if (selectedFitnessAttrs.length >= targetRequiredCount) return;
                      setSelectedFitnessAttrs([...selectedFitnessAttrs, item.key]);
                    }
                  };

                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={isAtMaxCap}
                      onClick={toggleAttr}
                      className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                        isAtMaxCap
                          ? 'bg-[#080b10] border-[#181f2e] text-slate-600 opacity-50 cursor-not-allowed select-none'
                          : isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50 cursor-pointer'
                          : selectedFitnessAttrs.length >= targetRequiredCount
                          ? 'bg-[#0a0d14] border-[#1b2232] text-slate-500 opacity-60 cursor-not-allowed'
                          : 'bg-[#0e121a] hover:bg-[#161c28] border-[#222a3a] text-slate-300 hover:border-slate-500 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 flex items-center gap-1">
                          <span>{item.icon}</span>
                          <span>{item.cat}</span>
                        </span>
                        {isAtMaxCap ? (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                            已达上限
                          </span>
                        ) : isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <div className={`text-xs font-black ${isAtMaxCap ? 'text-slate-500' : 'text-white'}`}>{item.label}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between items-center">
                          <span className="flex items-center gap-0.5">
                            基础: <strong className={isAtMaxCap ? 'text-slate-400' : 'text-white'}>{baseVal}</strong>
                            {boostSum > 0 && <span className="text-emerald-400 font-bold">(+{boostSum})</span>}
                          </span>
                          {isAtMaxCap ? (
                            <span className="font-bold text-amber-500/90 bg-amber-500/10 px-1 rounded text-[9px]">(已满)</span>
                          ) : (
                            <span className="font-bold text-cyan-300">上限: {currentCap}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex gap-3 border-t border-[#232a3c]">
                <button
                  type="button"
                  onClick={() => setIsFitnessModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#1b2230] hover:bg-[#263145] text-slate-300 font-bold text-xs rounded-xl border border-[#2b364d] transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={selectedFitnessAttrs.length !== targetRequiredCount || targetRequiredCount === 0}
                  onClick={handleConfirmFitnessCapBoost}
                  className={`flex-1 py-2.5 font-black italic text-xs rounded-xl transition-all uppercase flex items-center justify-center gap-1.5 shadow-xl ${
                    selectedFitnessAttrs.length === targetRequiredCount && targetRequiredCount > 0
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black cursor-pointer shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {targetRequiredCount === 0
                      ? '所有属性上限均已达99满值'
                      : `确认提升`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
