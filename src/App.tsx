import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { GameState, PlayerProfile, Team, RosterPlayer, MatchBoxScore, SignatureShoe, PersonalAsset } from './types';
import { NBA_TEAMS_2008, HISTORICAL_SEASONS, INITIAL_ENDORSEMENTS, PERSONAL_ASSETS } from './data/nbaData2008';
import { calculate2KOvr, checkInjuryRisk, getPlayerTotalAttributes, getPlayerTotalOvr, getUserPlayerAgePenalty, syncPlayerAgeDecay } from './utils/calc2k';
import { generateTweets } from './utils/proceduralEngine';
import { loadGameFromStorage, saveGameToStorage, clearGameStorage, SavedData, getSaveSlotMeta, SaveSlotId } from './utils/storage';
import { calculateTeamPowerRating, calcWinProbability, getUserMinutesAndRole, simulatePlayerMatchStats, calculateMatchScores, generateFullMatchRosterStats, calculateTeamUsageContext } from './utils/leagueLogic';
import { progressLeagueForNewSeason } from './utils/progressionLogic';
import { ContractOffer } from './utils/contractLogic';
import { calculateUserDraftPick } from './utils/draftLogic';
import { calculateSeasonAwards } from './utils/awardsLogic';

import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { SaveSlotsModal } from './components/SaveSlotsModal';
import { CreationModal } from './components/CreationModal';
import { DraftNightModal } from './components/DraftNightModal';
import { RookieDraftAndScoutModal } from './components/RookieDraftAndScoutModal';
import { SeasonDashboard } from './components/SeasonDashboard';
import { MatchSimulator } from './components/MatchSimulator';
import { PostMatchModal } from './components/PostMatchModal';
import { AttributesPanel } from './components/AttributesPanel';
import { SocialAndLife } from './components/SocialAndLife';
import { RosterAndTransfers } from './components/RosterAndTransfers';
import { TimelinePage } from './components/TimelinePage';
import { HallOfFame } from './components/HallOfFame';
import { ContractSigningModal } from './components/ContractSigningModal';
import { DraftWaitingAnimationModal } from './components/DraftWaitingAnimationModal';
import { RealTradesModal } from './components/RealTradesModal';
import { executeHistoricalTradesForSeason, TradeModalData } from './data/realTradesData';
import { LeagueStandings } from './components/LeagueStandings';
import { RetirementFlowModal } from './components/RetirementFlowModal';
import { AgeDeclineModal } from './components/AgeDeclineModal';
import { YearSummaryModal } from './components/YearSummaryModal';
import { SettingsModal } from './components/SettingsModal';
import { LegendaryHallOfFameModal } from './components/LegendaryHallOfFameModal';
import { MilestonesView } from './components/MilestonesView';
import { MilestoneModal } from './components/MilestoneModal';
import { detectNewMilestones, MilestoneTrigger } from './data/milestonesData';
import { Accolade } from './types';

export default function App() {
  const [phase, setPhase] = useState<GameState['phase']>('home');
  const [prevPhase, setPrevPhase] = useState<GameState['phase']>('regular_season');
  const [currentSaveSlot, setCurrentSaveSlot] = useState<SaveSlotId>('slot_1');
  const [isSaveSlotsOpen, setIsSaveSlotsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(2008);
  const [currentSeasonWeek, setCurrentSeasonWeek] = useState(1);
  const [isPlayoffs, setIsPlayoffs] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('season');
  const [lastSavedAt, setLastSavedAt] = useState<string>('未保存');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLegendaryHofOpen, setIsLegendaryHofOpen] = useState(false);
  const [legendaryHofInitialMode, setLegendaryHofInitialMode] = useState<'local' | 'global'>('local');
  const [declinePromptYear, setDeclinePromptYear] = useState<number | null>(null);
  const [showAgeDeclineModal, setShowAgeDeclineModal] = useState<boolean>(false);

  // Automatically scroll to the top of the page when changing tabs or phases
  useLayoutEffect(() => {
    const resetScroll = () => {
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.scrollTop = 0;
        rootEl.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const timer = setTimeout(resetScroll, 0);
    const animFrame = requestAnimationFrame(resetScroll);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrame);
    };
  }, [activeTab, phase]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const [teams, setTeams] = useState<Team[]>(() =>
    NBA_TEAMS_2008.map((t) => ({ ...t, wins: 0, losses: 0 }))
  );
  const [player, setPlayer] = useState<PlayerProfile | null>(null);

  const [isInteractiveMatch, setIsInteractiveMatch] = useState(true);
  const [lastMatchResult, setLastMatchResult] = useState<MatchBoxScore | null>(null);
  const [schedule, setSchedule] = useState<GameState['schedule']>([]);
  const [tweets, setTweets] = useState<GameState['tweets']>([]);
  const [careerHistory, setCareerHistory] = useState<GameState['careerHistory']>([]);
  const [leagueHistory, setLeagueHistory] = useState<GameState['leagueHistory']>([]);

  const [usedOffseasonEventIds, setUsedOffseasonEventIds] = useState<Set<string>>(new Set());
  const [offseasonMonth, setOffseasonMonth] = useState<number>(1);
  const [offseasonCompletedPlans, setOffseasonCompletedPlans] = useState<Record<number, { id: string; title: string; desc: string }>>({});
  const [offseasonEventMonths, setOffseasonEventMonths] = useState<number[]>([]);
  const [showDraftWaitingAnimation, setShowDraftWaitingAnimation] = useState<boolean>(false);

  // Offseason flow state persistence across tab navigation
  const [offseasonPhase, setOffseasonPhase] = useState<'draft' | 'contract' | 'training'>('draft');
  const [isDraftCompleted, setIsDraftCompleted] = useState<boolean>(false);
  const [isContractCompleted, setIsContractCompleted] = useState<boolean>(false);
  const [contractStep, setContractStep] = useState<'decision' | 'renewal_offer' | 'free_agency'>('decision');
  const [renewalOffer, setRenewalOffer] = useState<ContractOffer | null>(null);
  const [freeAgencyOffers, setFreeAgencyOffers] = useState<ContractOffer[]>([]);
  const [tradeModalData, setTradeModalData] = useState<TradeModalData | null>(null);
  const [executedTradeYears, setExecutedTradeYears] = useState<number[]>([]);
  const [activeInSeasonTradeOffers, setActiveInSeasonTradeOffers] = useState<ContractOffer[]>([]);
  const [activeMilestoneModal, setActiveMilestoneModal] = useState<MilestoneTrigger | null>(null);

  const checkAndApplyMilestones = (
    oldCareerStats: PlayerProfile['careerStats'],
    newCareerStats: PlayerProfile['careerStats'],
    currentPlayer: PlayerProfile,
    year: number
  ): { updatedPlayer: PlayerProfile; triggeredMilestone: MilestoneTrigger | null } => {
    const triggers = detectNewMilestones(oldCareerStats, newCareerStats);
    if (triggers.length === 0) {
      return { updatedPlayer: currentPlayer, triggeredMilestone: null };
    }

    const sorted = [...triggers].sort((a, b) => {
      const priority = { NO1: 3, TOP3: 2, TOP10: 1 };
      return priority[b.type] - priority[a.type];
    });
    const topTrigger = sorted[0];

    const top3OrNo1 = triggers.filter((t) => t.type === 'NO1' || t.type === 'TOP3');
    let updatedAccolades = currentPlayer.accolades || [];

    if (top3OrNo1.length > 0) {
      const existingTitles = new Set(updatedAccolades.map((a) => a.title));
      const newAccs: Accolade[] = [];

      for (const t of top3OrNo1) {
        const title = t.type === 'NO1'
          ? `NBA 历史${t.catName}榜第 1 位 (登顶)`
          : `NBA 历史${t.catName}榜 Top 3`;

        if (!existingTitles.has(title)) {
          newAccs.push({
            year,
            seasonStr: `${year}-${(year + 1).toString().slice(-2)} 赛季`,
            title,
            type: t.type === 'NO1' ? ('MILESTONE_NO1' as any) : ('MILESTONE_TOP3' as any),
          });
        }
      }

      if (newAccs.length > 0) {
        updatedAccolades = [...updatedAccolades, ...newAccs];
      }
    }

    return {
      updatedPlayer: { ...currentPlayer, accolades: updatedAccolades },
      triggeredMilestone: topTrigger,
    };
  };

  const handleAddUsedEventId = (eventId: string) => {
    setUsedOffseasonEventIds((prev) => new Set([...prev, eventId]));
  };

  const handleEnterOffseason = (championTeam?: Team, passedFmvpName?: string) => {
    setIsPlayoffs(false);
    setShowDraftWaitingAnimation(true);

    // --- RECORD LEAGUE & CAREER HISTORY BEFORE INCREMENTING YEAR ---
    if (player) {
      const userTeam = teams.find((t) => t.id === player.currentTeamId) || teams[0];
      const seasonStr = `${currentYear}-${(currentYear + 1).toString().slice(-2)} 赛季`;
      
      // Calculate user accolades for this year from computedAwards
      const computedAwards = calculateSeasonAwards(teams, player, currentYear);
      const accoladesEarned: string[] = [];
      if (computedAwards.mvp.isUser) accoladesEarned.push('常规赛 MVP');
      if (computedAwards.dpoy.isUser) accoladesEarned.push('最佳防守球员 (DPOY)');
      if (computedAwards.sixthMan.isUser) accoladesEarned.push('最佳第六人 (6MOTY)');
      if (computedAwards.roy.isUser) accoladesEarned.push('最佳新秀 (ROY)');
      
      // Check if user's team won championship and if player won FMVP
      const isChamp = championTeam && championTeam.id === player.currentTeamId;
      const isFmvp = passedFmvpName === player.name || (player.accolades || []).some((a) => a.year === currentYear && a.type === 'FMVP');
      if (isChamp) {
        accoladesEarned.push('NBA总冠军');
      }
      if (isFmvp) {
        accoladesEarned.push('总决赛 FMVP');
      }
      
      // Calculate career stats for this year
      const games = player.seasonStats?.games || 0;
      const ppg = games > 0 ? Math.round((player.seasonStats.pts / games) * 10) / 10 : 0;
      const rpg = games > 0 ? Math.round((player.seasonStats.reb / games) * 10) / 10 : 0;
      const apg = games > 0 ? Math.round((player.seasonStats.ast / games) * 10) / 10 : 0;
      const spg = games > 0 ? Math.round((player.seasonStats.stl / games) * 10) / 10 : 0;
      const bpg = games > 0 ? Math.round((player.seasonStats.blk / games) * 10) / 10 : 0;
      const fgPct = player.seasonStats?.fga > 0 ? Math.round((player.seasonStats.fgm / player.seasonStats.fga) * 1000) / 10 : 45.0;

      const newHistoryItem = {
        year: currentYear,
        seasonStr,
        teamId: player.currentTeamId,
        teamName: userTeam.name,
        wins: userTeam.wins,
        losses: userTeam.losses,
        ppg,
        rpg,
        apg,
        spg,
        bpg,
        fgPct,
        accoladesEarned,
      };

      setCareerHistory((prev) => {
        const filtered = prev ? prev.filter((item) => item.year !== currentYear) : [];
        return [...filtered, newHistoryItem];
      });

      // Determine FMVP Winner
      let fmvpName = passedFmvpName || '待定';
      if (!passedFmvpName && championTeam) {
        if (championTeam.id === player.currentTeamId) {
          fmvpName = player.name;
        } else {
          // get highest OVR player of the champion team as FMVP
          const sortedRoster = [...championTeam.roster].sort((a, b) => b.ovr - a.ovr);
          fmvpName = sortedRoster[0]?.name || '未知球星';
        }
      }

      const newLeagueItem = {
        year: currentYear,
        seasonStr,
        champion: championTeam ? championTeam.name : '未知球队',
        championId: championTeam ? championTeam.id : '',
        mvp: computedAwards.mvp.name,
        scoringLeader: computedAwards.scoringLeader?.name,
        fmvp: fmvpName,
        dpoy: computedAwards.dpoy.name,
        roy: computedAwards.roy.name,
      };

      setLeagueHistory((prev) => {
        const filtered = prev ? prev.filter((item) => item.year !== currentYear) : [];
        return [...filtered, newLeagueItem];
      });
    }
    // -------------------------------------------------------------

    setCurrentYear((prev) => prev + 1); // Advance to next season year immediately when playoffs end
    setPhase('offseason');
    setOffseasonMonth(1);
    setOffseasonCompletedPlans({});
    const months = [1, 2, 3, 4].sort(() => Math.random() - 0.5).slice(0, 2).sort((a, b) => a - b);
    setOffseasonEventMonths(months);

    // Reset offseason flow persistence state
    setOffseasonPhase('draft');
    setIsDraftCompleted(false);
    setIsContractCompleted(false);
    setContractStep('decision');
    setRenewalOffer(null);
    setFreeAgencyOffers([]);

    // Update contract remaining years (decrement by 1)
    if (player) {
      const updatedYearsLeft = Math.max(0, (player.contract?.yearsLeft || 1) - 1);
      setPlayer({
        ...player,
        contract: {
          ...player.contract,
          yearsLeft: updatedYearsLeft,
        },
      });
    }
  };

  // Offseason / Free Agency contract signing & team roster swap handler
  const handleSignNewContract = (newTeamId: string, salaryPerYear: number, totalYears: number) => {
    if (!player) return;
    const oldTeamId = player.currentTeamId;

    setPlayer((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentTeamId: newTeamId,
        contract: {
          salaryPerYear,
          yearsLeft: totalYears,
          totalYears,
          isRookieContract: false,
        },
      };
    });

    // If transferred to a new team, swap the lowest OVR player from new team to old team
    if (newTeamId !== oldTeamId) {
      setTeams((prevTeams) => {
        const oldTeamObj = prevTeams.find((t) => t.id === oldTeamId);
        const newTeamObj = prevTeams.find((t) => t.id === newTeamId);
        if (!oldTeamObj || !newTeamObj) return prevTeams;

        const sortedRoster = [...newTeamObj.roster]
          .filter((p) => !(p.id === player.id || p.name === player.name || (p as any).isUser))
          .sort((a, b) => a.ovr - b.ovr);
        const lowestPlayer = sortedRoster[0];
        if (!lowestPlayer) return prevTeams;

        const userRosterPlayer: RosterPlayer = {
          id: player.id,
          name: player.name,
          position: player.position,
          ovr: player.ovr,
          age: player.age || 19,
          peakAge: player.peakAge || 26,
          peakOvr: player.peakOvr || Math.max(85, player.ovr + 10),
          peakDuration: player.peakDuration || 5,
          isStar: true,
          isRookie: player.isRookie,
          role: '战术核心',
        };

        return prevTeams.map((t) => {
          if (t.id === newTeamId) {
            const cleanNew = t.roster.filter((p) => p.id !== lowestPlayer.id && p.id !== player.id && p.name !== player.name);
            cleanNew.unshift(userRosterPlayer);
            if (cleanNew.length > 15) cleanNew.pop();
            return {
              ...t,
              roster: cleanNew,
            };
          }
          if (t.id === oldTeamId) {
            const cleanOld = t.roster.filter((p) => p.id !== player.id && p.name !== player.name && !(p as any).isUser);
            cleanOld.push(lowestPlayer);
            return {
              ...t,
              roster: cleanOld,
            };
          }
          return t;
        });
      });
    }
  };

  // Auto-execute real trades for current season when entering regular season if not yet executed
  useEffect(() => {
    if (phase === 'regular_season' && player) {
      if (!executedTradeYears.includes(currentYear)) {
        const { updatedTeams, modalData } = executeHistoricalTradesForSeason(teams, currentYear);
        if (modalData && modalData.executedTrades.length > 0) {
          setTeams(updatedTeams);
          setTradeModalData(modalData);
          setExecutedTradeYears((prev) => [...prev, currentYear]);
        }
      }
    }
  }, [phase, currentYear, executedTradeYears, player, teams]);

  const lastGamePhaseRef = useRef<GameState['phase']>('regular_season');

  // Track the latest non-transient gameplay phase
  useEffect(() => {
    const isTransient =
      phase === 'home' ||
      phase === 'hall_of_fame' ||
      phase === 'legendary_hof' ||
      phase === 'match_sim' ||
      phase === 'post_match';
    if (phase && !isTransient) {
      lastGamePhaseRef.current = phase;
    }
  }, [phase]);

  // Fallback to home phase if player is null and phase requires a player profile
  useEffect(() => {
    if (!player && phase !== 'home' && phase !== 'legendary_hof' && phase !== 'creation') {
      console.warn('Phase requires player profile but player is null. Auto-reverting to home.');
      setPhase('home');
    }
  }, [phase, player]);

  // Age 38+ Physical Decline Modal trigger when entering regular season
  useEffect(() => {
    if (phase === 'regular_season' && player && (player.age || 19) >= 38) {
      if (declinePromptYear !== currentYear) {
        setShowAgeDeclineModal(true);
      }
    }
  }, [phase, player?.age, currentYear, declinePromptYear]);

  const handleAgeDeclineRetire = () => {
    setDeclinePromptYear(currentYear);
    setShowAgeDeclineModal(false);
    setPrevPhase(phase);
    setActiveTab('hof');
    setPhase('hall_of_fame');
  };

  const handleAgeDeclineContinue = () => {
    setDeclinePromptYear(currentYear);
    setShowAgeDeclineModal(false);
  };

  // Load saved game state on initial mount
  useEffect(() => {
    const saved = loadGameFromStorage();
    if (saved && saved.player) {
      handleLoadSaveData(saved);
    }
  }, []);

  // Auto-save game state to localStorage whenever key data changes
  useEffect(() => {
    if (!player) return;
    const nowStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const isTransient =
      phase === 'home' ||
      phase === 'hall_of_fame' ||
      phase === 'legendary_hof' ||
      phase === 'match_sim' ||
      phase === 'post_match';
    const activeSavePhase = isTransient
      ? lastGamePhaseRef.current || 'regular_season'
      : phase;

    const success = saveGameToStorage({
      version: 1,
      slotId: currentSaveSlot,
      updatedAt: nowStr,
      phase: activeSavePhase,
      currentYear,
      currentSeasonWeek,
      isPlayoffs,
      playoffRound: 1,
      playoffSeriesWins: 0,
      playoffSeriesLosses: 0,
      playoffOpponentId: null,
      player,
      teams,
      schedule,
      tweets,
      careerHistory,
      leagueHistory,
      activeTab,
      executedTradeYears,
      activeInSeasonTradeOffers,
      declinePromptYear,
    }, currentSaveSlot);
    if (success) {
      setLastSavedAt(nowStr);
    }
  }, [player, phase, currentYear, currentSeasonWeek, isPlayoffs, teams, schedule, tweets, careerHistory, leagueHistory, activeTab, executedTradeYears, activeInSeasonTradeOffers, declinePromptYear, currentSaveSlot]);

  const getCurrentSavedData = (): SavedData | null => {
    if (!player) return null;
    const nowStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const isTransient =
      phase === 'home' ||
      phase === 'hall_of_fame' ||
      phase === 'legendary_hof' ||
      phase === 'match_sim' ||
      phase === 'post_match';
    const activeSavePhase = isTransient
      ? lastGamePhaseRef.current || 'regular_season'
      : phase;

    return {
      version: 1,
      slotId: currentSaveSlot,
      updatedAt: nowStr,
      phase: activeSavePhase,
      currentYear,
      currentSeasonWeek,
      isPlayoffs,
      playoffRound: 1,
      playoffSeriesWins: 0,
      playoffSeriesLosses: 0,
      playoffOpponentId: null,
      player,
      teams,
      schedule,
      tweets,
      careerHistory,
      leagueHistory,
      activeTab,
      executedTradeYears,
      activeInSeasonTradeOffers,
      declinePromptYear,
    };
  };

  const handleQuickSave = () => {
    const data = getCurrentSavedData();
    if (!data || !data.player) {
      showToast('⚠️ 当前没有可保存的球员状态，请先建立或载入生涯');
      return;
    }
    const nowStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    data.updatedAt = nowStr;
    data.slotId = currentSaveSlot;
    const success = saveGameToStorage(data, currentSaveSlot);
    if (success) {
      setLastSavedAt(nowStr);
      const slotNames: Record<string, string> = { slot_1: '存档 1', slot_2: '存档 2', slot_3: '存档 3', slot_4: '存档 4' };
      showToast(`💾 进度已写入 [${slotNames[currentSaveSlot] || '当前存档'}]！[${data.player.name} · ${nowStr}]`);
    } else {
      showToast('❌ 保存失败：浏览器本地存储错误');
    }
  };

  const handleLoadSaveData = (data: SavedData, loadedSlotId?: SaveSlotId) => {
    if (!data || !data.player) return;
    const activeSlot = loadedSlotId || data.slotId || 'slot_1';
    setCurrentSaveSlot(activeSlot);
    setCurrentYear(data.currentYear || 2008);
    const playedCount = (data.schedule || []).filter((s) => s.isPlayed).length;
    let loadedWeek = data.currentSeasonWeek || 1;
    if (playedCount >= 82 && loadedWeek <= 82) {
      loadedWeek = 83;
    }
    setCurrentSeasonWeek(loadedWeek);
    setIsPlayoffs(data.isPlayoffs || false);
    setTeams(data.teams || NBA_TEAMS_2008);
    const loadedPlayer = syncPlayerAgeDecay(data.player);
    setPlayer(loadedPlayer);
    setSchedule(data.schedule || []);
    setTweets(data.tweets || []);
    setCareerHistory(data.careerHistory || []);
    setLeagueHistory(data.leagueHistory || []);
    setExecutedTradeYears(data.executedTradeYears || []);
    if (data.activeInSeasonTradeOffers) setActiveInSeasonTradeOffers(data.activeInSeasonTradeOffers);
    setDeclinePromptYear(data.declinePromptYear ?? null);
    setShowAgeDeclineModal(false);
    // Always default activeTab to 'season' when loading/continuing career (or if activeTab was 'hof')
    const loadedTab = data.activeTab && data.activeTab !== 'hof' ? data.activeTab : 'season';
    setActiveTab(loadedTab);

    if (data.updatedAt) setLastSavedAt(data.updatedAt);

    // Sanitize targetPhase so transient phases ('home', 'legendary_hof', 'hall_of_fame', 'match_sim', 'post_match')
    // never get restored when clicking Continue Career!
    const isTransient =
      !data.phase ||
      data.phase === 'home' ||
      data.phase === 'legendary_hof' ||
      data.phase === 'hall_of_fame' ||
      data.phase === 'match_sim' ||
      data.phase === 'post_match';

    let targetPhase = !isTransient ? data.phase : (lastGamePhaseRef.current || 'regular_season');

    // Safety guard for existing save files:
    // If targetPhase evaluated to 'regular_season' or 'home', but schedule has 82 played games and isPlayoffs is false
    // AND careerHistory contains a record for (data.currentYear - 1),
    // then the previous season just ended and player is actually in offseason!
    const hasHistoryForPrevYear = (data.careerHistory || []).some((h) => h.year === ((data.currentYear || 2008) - 1));

    if ((targetPhase === 'regular_season' || targetPhase === 'home') && playedCount >= 82 && !data.isPlayoffs && hasHistoryForPrevYear) {
      targetPhase = 'offseason';
    }

    lastGamePhaseRef.current = targetPhase;
    setPhase(targetPhase);
  };

  const handleManualSave = () => {
    handleQuickSave();
  };

  const handleResetGame = () => {
    clearGameStorage();
    setPlayer(null);
    setPhase('home');
    setCurrentYear(2008);
    setCurrentSeasonWeek(1);
    setIsPlayoffs(false);
    setSchedule([]);
    setTweets([]);
    setCareerHistory([]);
    setLeagueHistory([]);
    setExecutedTradeYears([]);
    setTradeModalData(null);
    setActiveInSeasonTradeOffers([]);
    setTeams(NBA_TEAMS_2008.map((t) => ({ ...t, wins: 0, losses: 0 })));
    setShowSettingsModal(false);
    setDeclinePromptYear(null);
    setShowAgeDeclineModal(false);
  };

  const handleCurrentSlotDeleted = () => {
    handleResetGame();
    setPhase('home');
    showToast('⚠️ 当前正在游玩的存档已被删除，已自动返回首页大厅');
  };

  // Player creation handler
  const handlePlayerCreated = (newPlayer: PlayerProfile) => {
    // 1. Reset timeline & season progress to initial 2008 season start
    setCurrentYear(2008);
    setCurrentSeasonWeek(1);
    setIsPlayoffs(false);

    // 2. Reset career & league histories, trades, and active offers
    setCareerHistory([]);
    setLeagueHistory([]);
    setExecutedTradeYears([]);
    setTradeModalData(null);
    setActiveInSeasonTradeOffers([]);
    setDeclinePromptYear(null);
    setShowAgeDeclineModal(false);

    // 3. Reset offseason states
    setUsedOffseasonEventIds(new Set());
    setOffseasonMonth(1);
    setOffseasonCompletedPlans({});
    setOffseasonEventMonths([]);
    setOffseasonPhase('draft');
    setIsDraftCompleted(false);
    setIsContractCompleted(false);
    setContractStep('decision');
    setRenewalOffer(null);
    setFreeAgencyOffers([]);

    // 4. Initialize fresh 2008 team rosters and records
    const initialTeams: Team[] = NBA_TEAMS_2008.map((t) => ({
      ...t,
      wins: 0,
      losses: 0,
      roster: t.roster.map((r) => ({ ...r })),
    }));

    const userTeamId = newPlayer.favoriteTeamId || newPlayer.currentTeamId || 'lal';
    const assignedTeam = initialTeams.find((t) => t.id === userTeamId) || initialTeams[0];

    const updatedPlayer: PlayerProfile = syncPlayerAgeDecay({
      ...newPlayer,
      currentTeamId: userTeamId,
      favoriteTeamId: userTeamId,
      isRookie: true,
      draftPick: newPlayer.draftPick || calculateUserDraftPick(newPlayer.ovr),
      contract: {
        salaryPerYear: 3.8,
        yearsLeft: 3,
        totalYears: 3,
        isRookieContract: true,
      },
    });

    setPlayer(updatedPlayer);

    // Add user player to favorite team's roster in fresh 2008 teams
    const freshTeams = initialTeams.map((t) => {
      if (t.id === userTeamId) {
        const userRosterPlayer: RosterPlayer = {
          id: updatedPlayer.id,
          name: updatedPlayer.name,
          position: updatedPlayer.position,
          ovr: updatedPlayer.ovr,
          age: updatedPlayer.age || 19,
          peakAge: updatedPlayer.peakAge || 26,
          peakOvr: updatedPlayer.peakOvr || Math.max(85, updatedPlayer.ovr + 10),
          peakDuration: updatedPlayer.peakDuration || 5,
          isStar: true,
          isRookie: true,
          role: '战术核心',
        };
        const cleanRoster = t.roster.filter((m) => m.id !== updatedPlayer.id && m.name !== updatedPlayer.name);
        cleanRoster.unshift(userRosterPlayer);
        if (cleanRoster.length > 15) {
          cleanRoster.pop();
        }
        return {
          ...t,
          roster: cleanRoster,
        };
      }
      return t;
    });

    setTeams(freshTeams);

    // Generate fresh 82-game schedule with fresh opponent teams
    const newSchedule = Array.from({ length: 82 }, (_, i) => {
      const opp = freshTeams.filter((t) => t.id !== userTeamId)[i % (freshTeams.length - 1)];
      return {
        gameNumber: i + 1,
        week: i + 1,
        opponentId: opp.id,
        isHome: i % 2 === 0,
        isPlayed: false,
      };
    });
    setSchedule(newSchedule);

    // Initial tweets
    const draftTweets = [
      {
        id: 'tw_draft_1',
        author: 'Woj (Adrian Wojnarowski)',
        handle: '@wojespn',
        avatar: '💣',
        content: `🚨 联盟爆料！${assignedTeam.name} 正式与落选超级新星 ${updatedPlayer.name} 完成签约！新赛季蓄势待发！`,
        time: '刚刚',
        likes: 34000,
        retweets: 12000,
      },
      {
        id: 'tw_draft_2',
        author: 'Shaquille O\'Neal',
        handle: '@SHAQ',
        avatar: '👑',
        content: `期待新赛季！超级新星 ${updatedPlayer.name} 穿上了 ${assignedTeam.name} 的战袍，拭目以待！`,
        time: '5分钟前',
        likes: 56000,
        retweets: 18000,
      },
    ];
    setTweets(draftTweets);

    setPhase('scout_draft');
  };

  // 2008 Draft completion handler
  const handleCompleteDraft = (teamId: string, pick: number, selectedJerseyNum?: number) => {
    if (!player) return;

    const assignedTeam = teams.find((t) => t.id === teamId) || teams[0];

    const updatedPlayer: PlayerProfile = {
      ...player,
      currentTeamId: teamId,
      draftPick: pick,
      jerseyNum: selectedJerseyNum !== undefined ? selectedJerseyNum : player.jerseyNum || 24,
    };

    setPlayer(updatedPlayer);

    // Generate 82-game schedule with opponent teams
    const newSchedule = Array.from({ length: 82 }, (_, i) => {
      const opp = teams.filter((t) => t.id !== teamId)[i % (teams.length - 1)];
      return {
        gameNumber: i + 1,
        week: i + 1,
        opponentId: opp.id,
        isHome: i % 2 === 0,
        isPlayed: false,
      };
    });
    setSchedule(newSchedule);

    // Initial draft tweets
    const draftTweets = [
      {
        id: 'tw_draft_1',
        author: 'Woj (Adrian Wojnarowski)',
        handle: '@wojespn',
        avatar: '💣',
        content: `🚨 选秀爆料！${assignedTeam.name} 在第${pick}顺位选中了来自于草根营的新星 ${updatedPlayer.name}！令人期待！`,
        time: '刚刚',
        likes: 34000,
        retweets: 12000,
      },
      {
        id: 'tw_draft_2',
        author: 'Shaquille O\'Neal',
        handle: '@SHAQ',
        avatar: '👑',
        content: `2008届选秀太劲爆了！新秀 ${updatedPlayer.name} 穿上了 ${assignedTeam.name} 的球衣，期待新赛季的暴扣！`,
        time: '5分钟前',
        likes: 56000,
        retweets: 18000,
      },
    ];
    setTweets(draftTweets);

    setPhase('contract_signing');
  };

  // Sign contract handler
  const handleSignContract = (selectedJerseyNum?: number) => {
    if (player && selectedJerseyNum !== undefined) {
      setPlayer((prev) => (prev ? { ...prev, jerseyNum: selectedJerseyNum } : prev));
    }
    setPhase('regular_season');
  };

  // Helper to simulate a full league game week so all 30 NBA teams get win/loss updates using dynamic power ratings
  const simulateLeagueGameWeek = (
    prevTeams: Team[],
    userTeamId: string,
    userOpponentId: string,
    isUserWin: boolean
  ): Team[] => {
    const updated = prevTeams.map((t) => ({ ...t }));
    const userTeam = updated.find((t) => t.id === userTeamId);
    const oppTeam = updated.find((t) => t.id === userOpponentId);

    if (userTeam && oppTeam) {
      if (isUserWin) {
        userTeam.wins += 1;
        oppTeam.losses += 1;
      } else {
        userTeam.losses += 1;
        oppTeam.wins += 1;
      }
    }

    // Pair up remaining 28 teams using dynamic power ratings and win probability algorithm
    // Shuffle otherTeams every week so pairings vary dynamically throughout the season!
    const otherTeams = updated.filter((t) => t.id !== userTeamId && t.id !== userOpponentId);
    for (let i = otherTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherTeams[i], otherTeams[j]] = [otherTeams[j], otherTeams[i]];
    }

    for (let i = 0; i < otherTeams.length - 1; i += 2) {
      const teamA = otherTeams[i];
      const teamB = otherTeams[i + 1];

      const ratingA = calculateTeamPowerRating(teamA);
      const ratingB = calculateTeamPowerRating(teamB);
      const aWinProb = calcWinProbability(ratingA, ratingB);
      const aWins = Math.random() < aWinProb;

      if (aWins) {
        teamA.wins += 1;
        teamB.losses += 1;
      } else {
        teamA.losses += 1;
        teamB.wins += 1;
      }
    }

    return updated;
  };

  // Fast Full Season Simulation Handler (REQUIREMENT 3: 模拟全季 / 跳过常规赛)
  const handleSimulateFullSeason = () => {
    if (!player) return;
    let week = currentSeasonWeek;
    let curTeams = [...teams];
    let curSched = [...schedule];
    let curPlayer = { ...player };

    const seasonIdx = currentYear - 2007;

    while (week <= 82) {
      const userTeam = curTeams.find((t) => t.id === curPlayer.currentTeamId) || curTeams[0];
      const currentGameOpponentId = curSched[week - 1]?.opponentId;
      const oppTeam = curTeams.find((t) => t.id === currentGameOpponentId) || curTeams[1];

      const matchScores = calculateMatchScores(userTeam, oppTeam, userTeam.id);
      const userScore = matchScores.teamAScore;
      const oppScore = matchScores.teamBScore;
      const isUserWin = userScore > oppScore;

      curTeams = simulateLeagueGameWeek(curTeams, userTeam.id, oppTeam.id, isUserWin);

      // Update schedule item
      curSched[week - 1] = {
        ...curSched[week - 1],
        isPlayed: true,
        userWon: isUserWin,
        userScore,
        oppScore,
      };

      // Give player stats & XP for simulated game with team usage context & dynamic minutes
      const seasonIndex = currentYear - 2007;
      const { minutes: assignedMPG } = getUserMinutesAndRole(userTeam, curPlayer, seasonIndex);
      const nonUserRoster = (userTeam.roster || []).filter(
        (p) => !(p.id === curPlayer.id || p.name === curPlayer.name || (p as any).isUser)
      );
      const userTeamRoster = [
        ...nonUserRoster.map((p) => ({ ovr: p.ovr, isUser: false })),
        { ovr: curPlayer.ovr, isUser: true },
      ];
      const userTeamUsageContext = calculateTeamUsageContext(userTeamRoster);

      const simStats = simulatePlayerMatchStats(curPlayer, assignedMPG, userTeamUsageContext);
      curPlayer = {
        ...curPlayer,
        seasonStats: {
          ...curPlayer.seasonStats,
          games: curPlayer.seasonStats.games + 1,
          pts: curPlayer.seasonStats.pts + simStats.pts,
          reb: curPlayer.seasonStats.reb + simStats.reb,
          ast: curPlayer.seasonStats.ast + simStats.ast,
          stl: curPlayer.seasonStats.stl + simStats.stl,
          blk: curPlayer.seasonStats.blk + simStats.blk,
          fgm: curPlayer.seasonStats.fgm + simStats.fgm,
          fga: curPlayer.seasonStats.fga + simStats.fga,
          tpm: curPlayer.seasonStats.tpm + simStats.tpm,
          tpa: curPlayer.seasonStats.tpa + simStats.tpa,
          ftm: curPlayer.seasonStats.ftm + simStats.ftm,
          fta: curPlayer.seasonStats.fta + simStats.fta,
          minutes: curPlayer.seasonStats.minutes + simStats.minutes,
        },
      };

      week += 1;
    }

    setTeams(curTeams);
    setSchedule(curSched);
    setPlayer(curPlayer);
    setCurrentSeasonWeek(83);
    setIsPlayoffs(true);
  };

  // Match start handler
  const handleStartMatch = (isInteractive: boolean) => {
    if (!player) return;

    // Safety check: If all 82 games have been played, do not simulate further!
    const playedCount = schedule.filter((s) => s.isPlayed).length;
    if (playedCount >= 82 || currentSeasonWeek > 82) {
      setCurrentSeasonWeek(83);
      setIsPlayoffs(true);
      return;
    }

    if (!isInteractive) {
      // Quick Simulation Mode (Skip match modal, simulate game stats with realistic attribute-driven formula, advance game)
      const userTeam = teams.find((t) => t.id === player.currentTeamId) || teams[0];
      const currentGameOpponentId = schedule[currentSeasonWeek - 1]?.opponentId;
      const oppTeam = teams.find((t) => t.id === currentGameOpponentId) || teams[1];

      // Calculate realistic score using team power rating formula
      const matchScores = calculateMatchScores(userTeam, oppTeam, userTeam.id);
      const userScore = matchScores.teamAScore;
      const oppScore = matchScores.teamBScore;
      const isUserWin = userScore > oppScore;

      // Update team records for ALL teams in the league
      setTeams((prevTeams) =>
        simulateLeagueGameWeek(prevTeams, userTeam.id, oppTeam.id, isUserWin)
      );

      const seasonIndex = currentYear - 2007;
      const { minutes: assignedMPG, role: userRole } = getUserMinutesAndRole(userTeam, player, seasonIndex);
      const isStarter = userRole === '绝对首发' || userRole === '战术核心';

      // Calculate user team usage context to apply ball-share / solo carry logic to quick sim
      const nonUserRoster = (userTeam.roster || []).filter(
        (p) => !(p.id === player.id || p.name === player.name || (p as any).isUser)
      );
      const userTeamRoster = [
        ...nonUserRoster.map((p) => ({ ovr: p.ovr, isUser: false })),
        { ovr: player.ovr, isUser: true },
      ];
      const userTeamUsageContext = calculateTeamUsageContext(userTeamRoster);

      // Attribute-driven realistic game stats for Quick Sim
      const simStats = simulatePlayerMatchStats(player, assignedMPG, userTeamUsageContext);

      // Generate full match roster stats (sum of player pts == team score)
      const currentSchedItem = schedule[currentSeasonWeek - 1];
      const isHome = currentSchedItem?.isHome ?? true;
      const rosterStats = generateFullMatchRosterStats(
        userTeam,
        oppTeam,
        player,
        userScore,
        oppScore,
        isHome,
        seasonIndex
      );

      // Update schedule record
      setSchedule((prev) => {
        const next = [...prev];
        const idx = currentSeasonWeek - 1;
        if (next[idx]) {
          next[idx] = {
            ...next[idx],
            isPlayed: true,
            userWon: isUserWin,
            userScore,
            oppScore,
            rosterStats,
          };
        }
        return next;
      });

      const updatedSeasonStats = {
        ...player.seasonStats,
        games: player.seasonStats.games + 1,
        gamesStarted: isStarter ? (player.seasonStats.gamesStarted || 0) + 1 : player.seasonStats.gamesStarted || 0,
        pts: player.seasonStats.pts + simStats.pts,
        reb: player.seasonStats.reb + simStats.reb,
        ast: player.seasonStats.ast + simStats.ast,
        stl: player.seasonStats.stl + simStats.stl,
        blk: player.seasonStats.blk + simStats.blk,
        fgm: player.seasonStats.fgm + simStats.fgm,
        fga: player.seasonStats.fga + simStats.fga,
        tpm: player.seasonStats.tpm + simStats.tpm,
        tpa: player.seasonStats.tpa + simStats.tpa,
        ftm: player.seasonStats.ftm + simStats.ftm,
        fta: player.seasonStats.fta + simStats.fta,
        turnovers: (player.seasonStats.turnovers || 0) + simStats.turnovers,
        minutes: player.seasonStats.minutes + simStats.minutes,
      };

      const updatedCareerStats = {
        ...player.careerStats,
        games: player.careerStats.games + 1,
        gamesStarted: isStarter ? (player.careerStats.gamesStarted || 0) + 1 : player.careerStats.gamesStarted || 0,
        pts: player.careerStats.pts + simStats.pts,
        reb: player.careerStats.reb + simStats.reb,
        ast: player.careerStats.ast + simStats.ast,
        stl: player.careerStats.stl + simStats.stl,
        blk: player.careerStats.blk + simStats.blk,
        fgm: player.careerStats.fgm + simStats.fgm,
        fga: player.careerStats.fga + simStats.fga,
        tpm: player.careerStats.tpm + simStats.tpm,
        tpa: player.careerStats.tpa + simStats.tpa,
        ftm: player.careerStats.ftm + simStats.ftm,
        fta: player.careerStats.fta + simStats.fta,
        turnovers: (player.careerStats.turnovers || 0) + simStats.turnovers,
        minutes: player.careerStats.minutes + simStats.minutes,
      };

      // Award Quick Sim XP (~5 games per level up)
      const maxXp = player.maxXp || 500;
      const quickXp = Math.round(maxXp * 0.20); // ~100 XP per quick sim game (20% of max XP)
      let newXp = (player.xp || 0) + quickXp;
      let newLevel = player.level || 1;
      let newSp = player.skillPoints || 0;
      let newMaxXp = maxXp;

      // Regular match milestone SP: Season 1-3 -> every 2 games +1 SP; Season 4+ -> every 3 games +1 SP
      const isEarlySeasons = seasonIndex <= 2 || (careerHistory && careerHistory.length < 3);
      const isMilestone = isEarlySeasons
        ? updatedSeasonStats.games % 2 === 0
        : updatedSeasonStats.games % 3 === 0;
      if (isMilestone) {
        newSp += 1;
      }

      if (newXp >= maxXp) {
        newLevel += 1;
        newSp += 1;
        newXp = newXp - maxXp;
        newMaxXp = Math.round(maxXp * 1.15);
      }

      const playerUpdatedBase = {
        ...player,
        xp: newXp,
        maxXp: newMaxXp,
        level: newLevel,
        skillPoints: newSp,
        seasonStats: updatedSeasonStats,
        careerStats: updatedCareerStats,
      };

      const mRes = checkAndApplyMilestones(player.careerStats, updatedCareerStats, playerUpdatedBase, currentYear);
      setPlayer(mRes.updatedPlayer);
      if (mRes.triggeredMilestone) {
        setActiveMilestoneModal(mRes.triggeredMilestone);
      }

      // Advance to next game directly (up to 83 to mark regular season completion)
      if (currentSeasonWeek <= 82) {
        setCurrentSeasonWeek((prev) => Math.min(83, prev + 1));
      }
      return;
    }

    // Play Game manually (亲自出战) -> Opens MatchSimulator modal
    setIsInteractiveMatch(true);
    setPhase('match_sim');
  };

  // Match finish handler
  const handleFinishMatch = (boxScore: MatchBoxScore) => {
    if (!player) return;

    const { playerStats, userTeamScore, opponentScore } = boxScore;
    const isWin = userTeamScore > opponentScore;

    const seasonIndex = currentYear - 2007;
    const userTeam = teams.find((t) => t.id === player.currentTeamId) || teams[0];
    const { role: userRole } = getUserMinutesAndRole(userTeam, player, seasonIndex);
    const isStarter = userRole === '绝对首发' || userRole === '战术核心';

    // Update player season stats
    const updatedSeasonStats = { ...player.seasonStats };
    updatedSeasonStats.games += 1;
    if (isStarter) updatedSeasonStats.gamesStarted = (updatedSeasonStats.gamesStarted || 0) + 1;
    updatedSeasonStats.pts += playerStats.pts;
    updatedSeasonStats.reb += playerStats.reb;
    updatedSeasonStats.ast += playerStats.ast;
    updatedSeasonStats.stl += playerStats.stl;
    updatedSeasonStats.blk += playerStats.blk;
    updatedSeasonStats.fgm += playerStats.fgm;
    updatedSeasonStats.fga += playerStats.fga;
    updatedSeasonStats.tpm += playerStats.tpm;
    updatedSeasonStats.tpa += playerStats.tpa;
    updatedSeasonStats.ftm += playerStats.ftm;
    updatedSeasonStats.fta += playerStats.fta;
    updatedSeasonStats.minutes += playerStats.minutes;
    updatedSeasonStats.turnovers = (updatedSeasonStats.turnovers || 0) + (playerStats.turnovers || 0);

    const updatedCareerStats = { ...player.careerStats };
    updatedCareerStats.games += 1;
    if (isStarter) updatedCareerStats.gamesStarted = (updatedCareerStats.gamesStarted || 0) + 1;
    updatedCareerStats.pts += playerStats.pts;
    updatedCareerStats.reb += playerStats.reb;
    updatedCareerStats.ast += playerStats.ast;
    updatedCareerStats.stl += playerStats.stl;
    updatedCareerStats.blk += playerStats.blk;
    updatedCareerStats.fgm += playerStats.fgm;
    updatedCareerStats.fga += playerStats.fga;
    updatedCareerStats.tpm += playerStats.tpm;
    updatedCareerStats.tpa += playerStats.tpa;
    updatedCareerStats.ftm += playerStats.ftm;
    updatedCareerStats.fta += playerStats.fta;
    updatedCareerStats.minutes += playerStats.minutes;
    updatedCareerStats.turnovers = (updatedCareerStats.turnovers || 0) + (playerStats.turnovers || 0);

    // Injury system temporarily hidden
    const healthStatus: PlayerProfile['health'] = { status: 'healthy' };

    // Energy drain
    const newEnergy = Math.max(10, player.energy - 15);

    // Update Team Wins/Losses for ALL 30 teams in the league
    setTeams((prev) =>
      simulateLeagueGameWeek(prev, player.currentTeamId, boxScore.opponentTeamId, isWin)
    );

    const playerUpdatedBase = {
      ...player,
      energy: newEnergy,
      health: healthStatus,
      seasonStats: updatedSeasonStats,
      careerStats: updatedCareerStats,
    };

    const mRes = checkAndApplyMilestones(player.careerStats, updatedCareerStats, playerUpdatedBase, currentYear);
    setPlayer(mRes.updatedPlayer);
    if (mRes.triggeredMilestone) {
      setActiveMilestoneModal(mRes.triggeredMilestone);
    }

    // Generate full match roster stats (sum of player pts == team score)
    const oppTeam = teams.find((t) => t.id === boxScore.opponentTeamId) || teams[1];
    const currentSchedItem = schedule[currentSeasonWeek - 1];
    const isHome = currentSchedItem?.isHome ?? true;
    const rosterStats = generateFullMatchRosterStats(
      userTeam,
      oppTeam,
      player,
      userTeamScore,
      opponentScore,
      isHome,
      seasonIndex,
      playerStats
    );

    // Update schedule record
    setSchedule((prev) => {
      const next = [...prev];
      const idx = currentSeasonWeek - 1;
      if (next[idx]) {
        next[idx] = {
          ...next[idx],
          isPlayed: true,
          userWon: isWin,
          userScore: userTeamScore,
          oppScore: opponentScore,
          boxScore,
          rosterStats,
        };
      }
      return next;
    });

    setLastMatchResult(boxScore);

    // Generate Twitter reactions for this game
    const gameTweets = generateTweets(
      player,
      currentTeam,
      oppTeam,
      userTeamScore,
      opponentScore,
      playerStats.pts,
      playerStats.ast,
      playerStats.reb
    );
    setTweets((prev) => [...gameTweets, ...prev]);

    setPhase('post_match');
  };

  // Post match rewards handler with XP conversion
  const handlePostMatchContinue = (rewards: {
    xpEarned: number;
    moraleDelta: number;
    mediaRepDelta: number;
    fanDelta: number;
    skillPointsEarned?: number;
  }) => {
    if (!player) return;

    const currentXp = player.xp || 0;
    const maxXp = player.maxXp || 500;
    let newXp = currentXp + rewards.xpEarned;
    let newLevel = player.level || 1;
    let newSp = (player.skillPoints || 0) + (rewards.skillPointsEarned || 0);
    let newMaxXp = maxXp;

    if (newXp >= maxXp) {
      newLevel += 1;
      newSp += 1;
      newXp = newXp - maxXp;
      newMaxXp = Math.round(maxXp * 1.15);
    }

    setPlayer({
      ...player,
      xp: newXp,
      maxXp: newMaxXp,
      level: newLevel,
      skillPoints: newSp,
      morale: Math.min(100, Math.max(0, player.morale + rewards.moraleDelta)),
      mediaReputation: Math.min(100, Math.max(0, player.mediaReputation + rewards.mediaRepDelta)),
      fansCount: player.fansCount + rewards.fanDelta,
    });

    // Advance schedule game (up to 83 to mark regular season completed)
    if (currentSeasonWeek <= 82) {
      setCurrentSeasonWeek((prev) => Math.min(83, prev + 1));
    }
    setPhase('regular_season');
  };

  // Upgrade player attribute handler
  const handleUpgradeAttribute = (attrKey: keyof PlayerProfile['attributes']) => {
    if (!player || player.skillPoints <= 0) return;
    const agePenalty = getUserPlayerAgePenalty(player.age || 19);
    const maxOvr = 99 - agePenalty;
    if (player.ovr >= maxOvr) return;

    const newAttrs = {
      ...player.attributes,
      [attrKey]: player.attributes[attrKey] + 1,
    };
    const tempPlayer = {
      ...player,
      attributes: newAttrs,
    };
    const newOvr = getPlayerTotalOvr(tempPlayer);

    setPlayer({
      ...player,
      attributes: newAttrs,
      ovr: newOvr,
      peakOvr: Math.max(player.peakOvr || 0, newOvr),
      skillPoints: player.skillPoints - 1,
    });
  };

  const handleAddSkillPoints = (amount: number = 50) => {
    if (!player) return;
    setPlayer({
      ...player,
      skillPoints: (player.skillPoints || 0) + amount,
    });
  };

  const handleMaxAllAttributes = () => {
    if (!player) return;
    const newAttrs = { ...player.attributes };
    for (const key in newAttrs) {
      const k = key as keyof PlayerProfile['attributes'];
      const cap = (player.attributeCaps && player.attributeCaps[k]) ? player.attributeCaps[k] : 99;
      newAttrs[k] = cap;
    }
    const tempPlayer = {
      ...player,
      attributes: newAttrs,
    };
    const newOvr = getPlayerTotalOvr(tempPlayer);
    setPlayer({
      ...player,
      attributes: newAttrs,
      ovr: newOvr,
    });
  };

  const handleAllInAttribute = (attrKey: keyof PlayerProfile['attributes']) => {
    if (!player || player.skillPoints <= 0) return;
    const agePenalty = getUserPlayerAgePenalty(player.age || 19);
    const maxOvr = 99 - agePenalty;
    if (player.ovr >= maxOvr) return;

    const currentVal = player.attributes[attrKey] || 50;
    const cap = (player.attributeCaps && player.attributeCaps[attrKey]) ? player.attributeCaps[attrKey] : 99;
    const maxPointsToAdd = Math.min(cap - currentVal, player.skillPoints);
    if (maxPointsToAdd <= 0) return;

    let pointsAdded = 0;
    let tempAttrs = { ...player.attributes };

    for (let i = 1; i <= maxPointsToAdd; i++) {
      tempAttrs[attrKey] = currentVal + i;
      pointsAdded = i;
      const tempPlayer = {
        ...player,
        attributes: tempAttrs,
      };
      const tempOvr = getPlayerTotalOvr(tempPlayer);
      if (tempOvr >= maxOvr) {
        break; // Stop adding once max age-allowed OVR is reached
      }
    }

    const finalAttrs = {
      ...player.attributes,
      [attrKey]: currentVal + pointsAdded,
    };
    const finalPlayer = {
      ...player,
      attributes: finalAttrs,
    };
    const finalOvr = getPlayerTotalOvr(finalPlayer);

    setPlayer({
      ...player,
      attributes: finalAttrs,
      ovr: finalOvr,
      skillPoints: player.skillPoints - pointsAdded,
    });
  };

  const handleResetAttribute = (attrKey: keyof PlayerProfile['attributes']) => {
    if (!player) return;
    const currentVal = player.attributes[attrKey] || 50;
    if (currentVal <= 60) return;

    const refund = currentVal - 60;
    const newAttrs = {
      ...player.attributes,
      [attrKey]: 60,
    };
    const tempPlayer = {
      ...player,
      attributes: newAttrs,
    };
    const newOvr = getPlayerTotalOvr(tempPlayer);

    setPlayer({
      ...player,
      attributes: newAttrs,
      ovr: newOvr,
      skillPoints: (player.skillPoints || 0) + refund,
    });
  };

  // Workout handler with XP
  const handleWorkout = () => {
    if (!player || player.energy < 15) return;

    const currentXp = player.xp || 0;
    const maxXp = player.maxXp || 500;
    let newXp = currentXp + 100;
    let newLevel = player.level || 1;
    let newSp = player.skillPoints || 0;
    let newMaxXp = maxXp;

    if (newXp >= maxXp) {
      newLevel += 1;
      newSp += 1;
      newXp = newXp - maxXp;
      newMaxXp = Math.round(maxXp * 1.15);
    }

    setPlayer({
      ...player,
      energy: player.energy - 15,
      xp: newXp,
      maxXp: newMaxXp,
      level: newLevel,
      skillPoints: newSp,
      morale: Math.min(100, player.morale + 3),
    });
  };

  // Rest handler
  const handleRest = () => {
    if (!player) return;
    let newHealth = { ...player.health };
    if (newHealth.status === 'injured' && newHealth.daysRemaining) {
      const remaining = newHealth.daysRemaining - 7;
      if (remaining <= 0) {
        newHealth = { status: 'healthy' };
      } else {
        newHealth.daysRemaining = remaining;
      }
    }

    setPlayer({
      ...player,
      energy: Math.min(100, player.energy + 35),
      health: newHealth,
    });
  };

  // Endorsement handler
  const handleUnlockEndorsement = (endId: string) => {
    if (!player) return;

    const targetEnd = INITIAL_ENDORSEMENTS.find((e) => e.id === endId)!;
    
    // Check if we are signing a sneaker brand
    let updatedEndorsements = [...player.endorsements];
    
    if (targetEnd.category === 'sneaker') {
      // Find if there is an existing sneaker brand signed
      const existingSneakerIdx = updatedEndorsements.findIndex((e) => e.category === 'sneaker');
      if (existingSneakerIdx !== -1) {
        // Remove the existing sneaker endorsement from the list
        updatedEndorsements.splice(existingSneakerIdx, 1);
      }
    }
    
    // Add the new endorsement
    updatedEndorsements.push(targetEnd);
    
    // Calculate new OVR based on total attributes (using the total attributes helper)
    const tempPlayer = {
      ...player,
      endorsements: updatedEndorsements,
    };
    const newOvr = getPlayerTotalOvr(tempPlayer);
    
    // Apply financial reward and fan reward
    const fansReward = targetEnd.rewardFans || 0;
    
    setPlayer({
      ...player,
      money: player.money + targetEnd.perSeasonPay,
      fansCount: player.fansCount + fansReward,
      ovr: newOvr,
      endorsements: updatedEndorsements,
    });
  };

  // Signature shoe handler
  const handleCreateSignatureShoe = (shoe: SignatureShoe) => {
    if (!player) return;

    const tempPlayer = {
      ...player,
      signatureShoe: shoe,
    };
    const newOvr = getPlayerTotalOvr(tempPlayer);

    setPlayer({
      ...player,
      ovr: newOvr,
      signatureShoe: shoe,
    });
  };

  // Luxury/Asset purchase handler
  const handleBuyLuxuryItem = (cost: number, assetId: string) => {
    if (!player) return;
    const asset = PERSONAL_ASSETS.find((a) => a.id === assetId);
    if (!asset || player.money < asset.cost) return;

    const purchasedIds = player.purchasedAssetIds || [];
    if (purchasedIds.includes(assetId)) return;

    const updatedPurchasedIds = [...purchasedIds, assetId];

    // Calculate new OVR using the total attributes helper
    const tempPlayer = {
      ...player,
      purchasedAssetIds: updatedPurchasedIds,
    };
    const newOvr = getPlayerTotalOvr(tempPlayer);

    setPlayer({
      ...player,
      money: player.money - asset.cost,
      ovr: newOvr,
      purchasedAssetIds: updatedPurchasedIds,
      morale: Math.min(100, player.morale + 15),
    });
  };

  // Trade request handler
  const handleRequestTrade = (targetTeamId: string) => {
    if (!player) return;
    setPlayer({
      ...player,
      currentTeamId: targetTeamId,
    });
  };

  // Advance to next season handler
  const handleNextSeason = () => {
    if (!player) return;

    // Progress ages, dynamic OVRs, and team ratings across all 30 teams
    const { updatedTeams, updatedUserPlayer } = progressLeagueForNewSeason(teams, player);

    setCurrentSeasonWeek(1);
    setIsPlayoffs(false);
    setOffseasonMonth(1);
    setOffseasonCompletedPlans({});
    setOffseasonEventMonths([]);
    setActiveInSeasonTradeOffers([]);

    // Reset wins and losses for all 30 teams for the new season with updated rosters
    let resetTeams = updatedTeams.map((t) => ({ ...t, wins: 0, losses: 0 }));

    // Execute historical real trades for the new season year (e.g. 2009 for 2009-2010 season)
    if (!executedTradeYears.includes(currentYear)) {
      const { updatedTeams: teamsAfterTrades, modalData } = executeHistoricalTradesForSeason(resetTeams, currentYear);
      if (modalData && modalData.executedTrades.length > 0) {
        resetTeams = teamsAfterTrades;
        setTradeModalData(modalData);
        setExecutedTradeYears((prev) => [...prev, currentYear]);
      }
    }

    setTeams(resetTeams);

    // Generate new 82-game schedule
    const newSchedule = Array.from({ length: 82 }, (_, i) => {
      const opp = resetTeams.filter((t) => t.id !== player.currentTeamId)[i % (resetTeams.length - 1)];
      return {
        gameNumber: i + 1,
        week: i + 1,
        opponentId: opp.id,
        isHome: i % 2 === 0,
        isPlayed: false,
      };
    });
    setSchedule(newSchedule);

    // Season salary payout
    const finalPlayer: PlayerProfile = {
      ...(updatedUserPlayer || player),
      money: player.money + player.contract.salaryPerYear,
      seasonStats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, minutes: 0 },
      energy: 100,
    };
    setPlayer(finalPlayer);

    setPhase('regular_season');
  };

  const handleViewSeasonTrades = () => {
    let { modalData } = executeHistoricalTradesForSeason(teams, currentYear);
    if (!modalData && currentYear === 2008) {
      modalData = {
        year: 2008,
        seasonName: '2008-2009 赛季',
        executedTrades: [
          {
            id: 'info_2008',
            type: 'league_change',
            leagueChangeDetail: {
              title: '赛季初始状态公告',
              description: '当前处于 2008-2009 初始赛季，联盟30支球队已载入经典的2008全明星与主力真实大名单。真实历史交易与巨星变动将在 2009-2010 赛季（第二赛季）开始的每个新赛季前自动触发变动！',
            },
          },
        ],
      };
    }
    if (modalData) {
      setTradeModalData(modalData);
    }
  };

  const currentTeam = teams.find((t) => t.id === player?.currentTeamId) || teams[0];
  const oppTeam =
    teams.find((t) => t.id === schedule.find((s) => (s as any).gameNumber === currentSeasonWeek || s.week === currentSeasonWeek)?.opponentId) ||
    teams.find((t) => t.id === schedule[schedule.length - 1]?.opponentId) ||
    teams[1];

  const historicalSeason = HISTORICAL_SEASONS.find((h) => h.year === currentYear) || HISTORICAL_SEASONS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Draft Waiting Animation Modal */}
      {showDraftWaitingAnimation && (
        <DraftWaitingAnimationModal
          currentYear={currentYear + 1}
          onComplete={() => setShowDraftWaitingAnimation(false)}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs sm:text-sm shadow-2xl border border-amber-300 animate-bounce flex items-center gap-2 pointer-events-none">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title / Home Screen Phase */}
      {phase === 'home' && (() => {
        const slots: SaveSlotId[] = ['slot_1', 'slot_2', 'slot_3', 'slot_4'];
        const activeMetas = slots.map((s) => getSaveSlotMeta(s)).filter((m) => !m.isEmpty);
        const hasSave = !!player || activeMetas.length > 0;
        const latestMeta = activeMetas.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0] || getSaveSlotMeta('slot_1');

        return (
          <HomeScreen
            hasActiveSave={hasSave}
            latestSaveMeta={latestMeta}
            onContinueGame={() => {
              const latestSlot = activeMetas[0]?.slotId || 'slot_1';
              const saved = loadGameFromStorage(latestSlot) || loadGameFromStorage('slot_1');
              if (saved && saved.player) {
                handleLoadSaveData(saved);
              } else if (player) {
                setPhase('regular_season');
              } else {
                setPhase('creation');
              }
            }}
            onStartNewCareer={() => {
              setPhase('creation');
            }}
            onOpenSaveManager={() => setIsSaveSlotsOpen(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenHallOfFame={() => {
              setLegendaryHofInitialMode('local');
              setPrevPhase(phase);
              setPhase('legendary_hof');
            }}
            onOpenGlobalHallOfFame={() => {
              setLegendaryHofInitialMode('global');
              setPrevPhase(phase);
              setPhase('legendary_hof');
            }}
          />
        );
      })()}

      {/* Creation Phase */}
      {phase === 'creation' && (
        <CreationModal
          onComplete={handlePlayerCreated}
          onBackToHome={() => setPhase('home')}
        />
      )}

      {/* Scout Report & Spotlight Draft Selection Phase */}
      {phase === 'scout_draft' && player && (
        <RookieDraftAndScoutModal
          player={player}
          teams={teams}
          onProceedToContract={() => setPhase('contract_signing')}
        />
      )}

      {/* 2008 Draft Night Phase */}
      {phase === 'draft' && player && (
        <DraftNightModal player={player} teams={teams} onComplete={handleCompleteDraft} />
      )}

      {/* Contract Signing Phase */}
      {phase === 'contract_signing' && player && (
        <ContractSigningModal
          player={player}
          team={currentTeam}
          pick={player.draftPick || 1}
          onSignContract={handleSignContract}
        />
      )}

      {/* Main Game Interface (Header & Tabs) */}
      {player && phase !== 'home' && phase !== 'creation' && phase !== 'scout_draft' && phase !== 'draft' && phase !== 'contract_signing' && phase !== 'legendary_hof' && (
        <>
          <Header
            player={player}
            currentTeam={currentTeam}
            currentYear={currentYear}
            seasonWeek={currentSeasonWeek}
            isPlayoffs={isPlayoffs}
            onOpenAttributes={() => setActiveTab('attributes')}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenSaveManager={() => setIsSaveSlotsOpen(true)}
            onGoHome={() => setPhase('home')}
            onQuickSave={handleQuickSave}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 pb-20 md:pb-6">
            {activeTab === 'season' && (
              <SeasonDashboard
                gameState={{
                  currentYear,
                  currentGame: currentSeasonWeek,
                  currentSeasonWeek,
                  isPlayoffs,
                  playoffRound: 1,
                  playoffSeriesWins: 0,
                  playoffSeriesLosses: 0,
                  playoffOpponentId: null,
                  phase,
                  player,
                  teams,
                  schedule,
                  tweets,
                  lastMatchResult,
                  careerHistory,
                }}
                currentTeam={currentTeam}
                oppTeam={oppTeam}
                usedEventIds={usedOffseasonEventIds}
                offseasonMonth={offseasonMonth}
                offseasonCompletedPlans={offseasonCompletedPlans}
                offseasonEventMonths={offseasonEventMonths}
                offseasonPhase={offseasonPhase}
                isDraftCompleted={isDraftCompleted}
                isContractCompleted={isContractCompleted}
                contractStep={contractStep}
                renewalOffer={renewalOffer}
                freeAgencyOffers={freeAgencyOffers}
                onSetOffseasonPhase={setOffseasonPhase}
                onSetIsDraftCompleted={setIsDraftCompleted}
                onSetIsContractCompleted={setIsContractCompleted}
                onSetContractStep={setContractStep}
                onSetRenewalOffer={setRenewalOffer}
                onSetFreeAgencyOffers={setFreeAgencyOffers}
                onStartMatch={handleStartMatch}
                onWorkout={handleWorkout}
                onRest={handleRest}
                onAdvanceWeek={() => setCurrentSeasonWeek((prev) => Math.min(83, prev + 1))}
                onEnterPlayoffs={() => setIsPlayoffs(true)}
                onEnterOffseason={handleEnterOffseason}
                onNextSeason={handleNextSeason}
                onUpdatePlayer={(p) => setPlayer(p)}
                onUpdateTeams={(updatedTeams) => setTeams(updatedTeams)}
                onSetOffseasonMonth={setOffseasonMonth}
                onSetOffseasonCompletedPlans={setOffseasonCompletedPlans}
                onAddUsedEventId={handleAddUsedEventId}
                onSignContract={handleSignNewContract}
                onViewSeasonTrades={handleViewSeasonTrades}
                hasActiveMilestoneModal={!!activeMilestoneModal || showAgeDeclineModal}
              />
            )}

            {activeTab === 'standings' && (
              <LeagueStandings
                teams={teams}
                userTeamId={player.currentTeamId}
                player={player}
                currentYear={currentYear}
                careerHistory={careerHistory}
                schedule={schedule}
              />
            )}

            {activeTab === 'attributes' && (
              <AttributesPanel
                player={player}
                onUpgradeAttribute={handleUpgradeAttribute}
                onAddSkillPoints={handleAddSkillPoints}
                onMaxAllAttributes={handleMaxAllAttributes}
                onAllInAttribute={handleAllInAttribute}
                onResetAttribute={handleResetAttribute}
              />
            )}

            {activeTab === 'social' && (
              <SocialAndLife
                player={player}
                tweets={tweets}
                onUnlockEndorsement={handleUnlockEndorsement}
                onCreateSignatureShoe={handleCreateSignatureShoe}
                onBuyLuxuryItem={handleBuyLuxuryItem}
              />
            )}

            {activeTab === 'roster' && (
              <RosterAndTransfers
                player={player}
                currentTeam={currentTeam}
                allTeams={teams}
                onRequestTrade={handleRequestTrade}
                onSignContract={handleSignNewContract}
                currentYear={currentYear}
                activeInSeasonTradeOffers={activeInSeasonTradeOffers}
                onSetActiveInSeasonTradeOffers={setActiveInSeasonTradeOffers}
                currentGame={currentSeasonWeek}
                isPlayoffs={isPlayoffs}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelinePage
                player={player}
                careerHistory={careerHistory}
                leagueHistory={leagueHistory}
                currentYear={currentYear}
              />
            )}

            {activeTab === 'milestones' && (
              <MilestonesView player={player} />
            )}

            {activeTab === 'hof' && (
              <HallOfFame
                player={player}
                careerHistory={careerHistory}
                leagueHistory={leagueHistory}
                currentYear={currentYear}
                onRetireCareer={() => {
                  setPrevPhase(phase);
                  setPhase('hall_of_fame');
                }}
                onOpenLegendaryHof={() => {
                  setPrevPhase(phase);
                  setPhase('legendary_hof');
                }}
              />
            )}
          </main>
        </>
      )}

      {/* Match Simulator Modal */}
      {phase === 'match_sim' && player && (
        <MatchSimulator
          player={player}
          userTeam={currentTeam}
          oppTeam={oppTeam}
          isInteractive={isInteractiveMatch}
          isPlayoffs={isPlayoffs}
          currentYear={currentYear}
          onFinishMatch={handleFinishMatch}
        />
      )}

      {/* Post Match Modal */}
      {phase === 'post_match' && player && lastMatchResult && (
        <PostMatchModal
          player={player}
          userTeam={currentTeam}
          oppTeam={oppTeam}
          boxScore={lastMatchResult}
          currentYear={currentYear}
          careerHistory={careerHistory}
          onContinue={handlePostMatchContinue}
        />
      )}

      {/* Retirement Flow Modal */}
      {phase === 'hall_of_fame' && player && (
        <RetirementFlowModal
          player={player}
          careerHistory={careerHistory}
          leagueHistory={leagueHistory}
          currentYear={currentYear}
          onClose={() => setPhase(prevPhase && prevPhase !== 'hall_of_fame' ? prevPhase : 'regular_season')}
          onResetGame={handleResetGame}
        />
      )}

      {/* Age 38+ Physical Decline Choice Modal */}
      {showAgeDeclineModal && player && (
        <AgeDeclineModal
          player={player}
          userTeamName={currentTeam?.name || '球队'}
          seasonsPlayed={(careerHistory?.length || 0) + 1}
          currentYear={currentYear}
          onRetire={handleAgeDeclineRetire}
          onContinue={handleAgeDeclineContinue}
        />
      )}

      {/* Real Trades Popup Modal */}
      {tradeModalData && (
        <RealTradesModal
          modalData={tradeModalData}
          teams={teams}
          onConfirm={() => setTradeModalData(null)}
        />
      )}

      {/* System Settings & Auto-Save Modal */}
      {showSettingsModal && (
        <SettingsModal
          player={player}
          currentTeam={currentTeam}
          currentYear={currentYear}
          seasonWeek={currentSeasonWeek}
          lastSavedAt={lastSavedAt}
          currentSlotId={currentSaveSlot}
          onManualSave={handleManualSave}
          onOpenSaveManager={() => {
            setShowSettingsModal(false);
            setIsSaveSlotsOpen(true);
          }}
          onGoHome={() => {
            setShowSettingsModal(false);
            setPhase('home');
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Save Slots & File Manager Modal */}
      <SaveSlotsModal
        isOpen={isSaveSlotsOpen}
        onClose={() => setIsSaveSlotsOpen(false)}
        currentSaveData={getCurrentSavedData()}
        currentSlotId={currentSaveSlot}
        onLoadSaveData={handleLoadSaveData}
        onCurrentSlotDeleted={handleCurrentSlotDeleted}
        onShowToast={showToast}
      />

      {/* Legendary Hall of Fame Page */}
      {(phase === 'legendary_hof' || isLegendaryHofOpen) && (
        <LegendaryHallOfFameModal
          isOpen={true}
          initialMode={legendaryHofInitialMode}
          onClose={() => {
            setIsLegendaryHofOpen(false);
            if (phase === 'legendary_hof') setPhase(prevPhase || 'home');
          }}
          onGoHome={() => {
            setIsLegendaryHofOpen(false);
            setPhase('home');
          }}
        />
      )}

      {/* Milestone Modal */}
      {activeMilestoneModal && (
        <MilestoneModal
          milestone={activeMilestoneModal}
          playerName={player?.name || '球星'}
          onClose={() => setActiveMilestoneModal(null)}
          onViewMilestones={() => {
            setActiveMilestoneModal(null);
            if (phase === 'home' || phase === 'creation' || phase === 'scout_draft' || phase === 'draft' || phase === 'contract_signing') {
              setPhase('career');
            }
            setActiveTab('milestones');
          }}
        />
      )}
    </div>
  );
}
