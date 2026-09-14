import { normalizeBranding } from '../utils/branding';
import { useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState } from 'react';
import type { Dispatch,SetStateAction } from 'react';
import { HISTORICAL_SEASONS,NBA_TEAMS_2008 } from '../data/nbaData2008';
import { GameState,MatchBoxScore,PlayerProfile,RosterPlayer,Team } from '../types';
import { calculateSeasonAwards, type SeasonAwards } from '../utils/awardsLogic';
import { mustRetireAtAge,shouldShowAgeDeclinePrompt,syncPlayerAgeDecay } from '../utils/calc2k';
import { ContractOffer } from '../utils/contractLogic';
import { calculateUserDraftPick } from '../utils/draftLogic';
import { progressLeagueForNewSeason } from '../utils/progressionLogic';
import { clearGameStorage,hydrateGameStorage,loadGameFromStorage,SavedData,saveGameToStorage,SaveSlotId } from '../utils/storage';
import { useAutoSave } from './useAutoSave';
import { usePlayerActions } from './usePlayerActions';
import { calculateDisposableSalary } from '../utils/economy';
import { useSeasonSimulation } from './useSeasonSimulation';

import { detectNewMilestones,MilestoneTrigger } from '../data/milestonesData';
import { executeHistoricalTradesForSeason,TradeModalData } from '../data/realTradesData';
import { executeRandomTradesForSeason, inviteStarToTeam } from '../utils/randomTradeLogic';
import { Accolade } from '../types';
import { scheduleRootScrollToTop } from '../utils/scroll';
import { GameMode } from '../gameMode';
import type { YearDraftData } from '../data/draftData';
import { generateParallelDraftData } from '../utils/randomDraftLogic';
import { evaluateTeamStrategies, initializeTeamStrategies } from '../utils/teamStrategyLogic';

export function useCareerGame(gameMode: GameMode, resumeOnMount = true) {
  const [phase, setPhaseState] = useState<GameState['phase']>('home');
  const setPhase: Dispatch<SetStateAction<GameState['phase']>> = useCallback((nextPhase) => {
    // Keep the phase in the same synchronous React batch as year, roster and
    // offseason state updates. Giving phase lower transition priority created
    // an intermediate frame with data from the next screen rendered inside the
    // previous screen, which some Android WebViews exposed as a full-page flash.
    setPhaseState(nextPhase);
  }, []);
  const [prevPhase, setPrevPhase] = useState<GameState['phase']>('regular_season');
  const [currentSaveSlot, setCurrentSaveSlot] = useState<SaveSlotId>('slot_1');
  const [isSaveSlotsOpen, setIsSaveSlotsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(2008);
  const [currentSeasonWeek, setCurrentSeasonWeek] = useState(1);
  const [isPlayoffs, setIsPlayoffs] = useState(false);
  const [activeTab, setActiveTabState] = useState<string>('season');
  const setActiveTab: Dispatch<SetStateAction<string>> = useCallback((nextTab) => {
    // Navigation is direct user input and must stay synchronous while the
    // background regular-season simulator is producing transition updates.
    setActiveTabState(nextTab);
  }, []);
  const [lastSavedAt, setLastSavedAt] = useState<string>('未保存');
  const [storageReady, setStorageReady] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLegendaryHofOpen, setIsLegendaryHofOpen] = useState(false);
  const [legendaryHofInitialMode, setLegendaryHofInitialMode] = useState<'local' | 'global'>('local');
  const [declinePromptYear, setDeclinePromptYear] = useState<number | null>(null);
  const [showAgeDeclineModal, setShowAgeDeclineModal] = useState<boolean>(false);
  const isLeavingRegularSeasonRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRegularSeasonAutoSimulating, setIsRegularSeasonAutoSimulating] = useState(false);

  // Automatically scroll to the top of the page when changing tabs or phases
  useEffect(() => {
    const animationFrame = scheduleRootScrollToTop();
    return () => cancelAnimationFrame(animationFrame);
  }, [activeTab, phase]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
      toastTimerRef.current = null;
    }, 3000);
  };

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

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
  const [seasonTradeHistory, setSeasonTradeHistory] = useState<Record<number, TradeModalData>>({});
  const [parallelDraftHistory, setParallelDraftHistory] = useState<Record<number, YearDraftData>>({});
  const [activeInSeasonTradeOffers, setActiveInSeasonTradeOffers] = useState<ContractOffer[]>([]);
  const [activeMilestoneModal, setActiveMilestoneModal] = useState<MilestoneTrigger | null>(null);

  useEffect(() => {
    if (gameMode !== 'random_trade' || phase !== 'offseason' || currentYear <= 2008 || parallelDraftHistory[currentYear]) return;
    const generated = generateParallelDraftData(teams, currentYear);
    if (generated) setParallelDraftHistory((previous) => ({ ...previous, [currentYear]: generated }));
  }, [gameMode, phase, currentYear, parallelDraftHistory, teams]);

  useEffect(() => {
    if (gameMode !== 'random_trade' || teams.length === 0 || teams.every((team) => team.strategyModelVersion === 2)) return;
    setTeams(initializeTeamStrategies(teams, currentYear));
  }, [gameMode, currentYear, teams]);

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
          ? `联盟 历史${t.catName}榜第 1 位 (登顶)`
          : `联盟 历史${t.catName}榜 Top 3`;

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

  const handleEnterOffseason = (championTeam?: Team, passedFmvpName?: string, settledSeasonAwards?: SeasonAwards) => {
    isLeavingRegularSeasonRef.current = true;
    setShowAgeDeclineModal(false);
    setIsPlayoffs(false);
    setShowDraftWaitingAnimation(true);

    // --- RECORD LEAGUE & CAREER HISTORY BEFORE INCREMENTING YEAR ---
    if (player) {
      const userTeam = teams.find((t) => t.id === player.currentTeamId) || teams[0];
      const seasonStr = `${currentYear}-${(currentYear + 1).toString().slice(-2)} 赛季`;
      
      // Calculate user accolades for this year from computedAwards
      // Reuse the exact regular-season result shown to the player. Recomputing
      // here can make the history page disagree with the settlement screen if
      // any roster or team object changed during the playoffs.
      const computedAwards = settledSeasonAwards ?? calculateSeasonAwards(teams, player, currentYear);
      const accoladesEarned: string[] = [];
      if (computedAwards.mvp.isUser) accoladesEarned.push('常规赛 MVP');
      if (computedAwards.scoringLeader.isUser) accoladesEarned.push('常规赛得分王');
      if (computedAwards.dpoy.isUser) accoladesEarned.push('最佳防守球员');
      if (computedAwards.sixthMan.isUser) accoladesEarned.push('最佳第六人');
      if (computedAwards.roy.isUser) accoladesEarned.push('最佳新秀');

      const allNbaSelection = computedAwards.allNbaTeams.find((team) =>
        team.players.some((awardPlayer) => awardPlayer.isUser),
      );
      if (allNbaSelection) accoladesEarned.push(allNbaSelection.label);

      const allDefenseSelection = computedAwards.allDefensiveTeams.find((team) =>
        team.players.some((awardPlayer) => awardPlayer.isUser),
      );
      if (allDefenseSelection) accoladesEarned.push(allDefenseSelection.label);

      const isUserAllStar =
        computedAwards.mvp.isUser ||
        computedAwards.dpoy.isUser ||
        computedAwards.sixthMan.isUser ||
        !!allNbaSelection ||
        (player.careerStats.games > 0 && player.careerStats.pts / player.careerStats.games >= 16) ||
        player.ovr >= 82;
      if (isUserAllStar) accoladesEarned.push('联盟 全明星');
      
      // Check if user's team won championship and if player won FMVP
      const isChamp = championTeam && championTeam.id === player.currentTeamId;
      const isFmvp = passedFmvpName === player.name || (player.accolades || []).some((a) => a.year === currentYear && a.type === 'FMVP');
      if (isChamp) {
        accoladesEarned.push('联盟总冠军');
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
        ovr: player.ovr,
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

    const upcomingYear = currentYear + 1;
    if (gameMode === 'random_trade' && upcomingYear > 2008) {
      setParallelDraftHistory((previous) => {
        if (previous[upcomingYear]) return previous;
        const generated = generateParallelDraftData(teams, upcomingYear);
        return generated ? { ...previous, [upcomingYear]: generated } : previous;
      });
    }
    setCurrentYear(upcomingYear); // Advance to next season year immediately when playoffs end
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
      setPlayer((latestPlayer) => {
        if (!latestPlayer) return latestPlayer;
        const updatedYearsLeft = Math.max(0, (latestPlayer.contract?.yearsLeft || 1) - 1);
        return {
          ...latestPlayer,
          contract: {
            ...latestPlayer.contract,
            yearsLeft: updatedYearsLeft,
          },
        };
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
      if (gameMode === 'random_trade' && currentYear <= 2008) return;
      if (!executedTradeYears.includes(currentYear)) {
        const { updatedTeams, modalData } = gameMode === 'random_trade'
          ? executeRandomTradesForSeason(teams, currentYear, {
              userPlayerId: player.id,
              userPlayerName: player.name,
              userTeamId: player.currentTeamId,
            })
          : executeHistoricalTradesForSeason(teams, currentYear);
        if (modalData && modalData.executedTrades.length > 0) {
          setTeams(updatedTeams);
          setTradeModalData(modalData);
          setSeasonTradeHistory((prev) => ({ ...prev, [currentYear]: modalData }));
          setExecutedTradeYears((prev) => [...prev, currentYear]);
        }
      }
    }
  }, [phase, currentYear, executedTradeYears, player, teams, gameMode]);

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

  // Age 38+ Physical Decline Modal trigger when entering regular season.
  // Mandatory retirement must never be suppressed by saved yearly UI state.
  useEffect(() => {
    if (phase !== 'regular_season') {
      // A 43-year-old player remains on the offseason screen while the
      // mandatory-retirement notice is shown. Younger veteran prompts still
      // belong exclusively to the regular-season screen.
      if (phase !== 'offseason' || !mustRetireAtAge(player?.age)) {
        setShowAgeDeclineModal(false);
      }
      isLeavingRegularSeasonRef.current = false;
      return;
    }
    if (player && shouldShowAgeDeclinePrompt(true, player.age, currentYear, declinePromptYear, isLeavingRegularSeasonRef.current)) {
      setShowAgeDeclineModal(true);
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
    if (mustRetireAtAge(player?.age)) {
      handleAgeDeclineRetire();
      return;
    }
    setDeclinePromptYear(currentYear);
    setShowAgeDeclineModal(false);
  };

  // Load saved game state on initial mount
  useEffect(() => {
    void hydrateGameStorage(gameMode).then(() => {
      const saved = loadGameFromStorage(undefined, gameMode);
      if (resumeOnMount && saved?.player) handleLoadSaveData(saved);
      setStorageReady(true);
    });
  }, [gameMode, resumeOnMount]);

  const saveSnapshot = useMemo<SavedData | null>(() => {
    if (!player) return null;
    const nowStr = new Date().toISOString();
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
      gameMode,
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
      seasonTradeHistory,
      parallelDraftHistory,
      activeInSeasonTradeOffers,
      declinePromptYear,
      uiState: {
        isInteractiveMatch,
        usedOffseasonEventIds: [...usedOffseasonEventIds],
        offseasonMonth,
        offseasonCompletedPlans,
        offseasonEventMonths,
        offseasonPhase,
        isDraftCompleted,
        isContractCompleted,
        contractStep,
        renewalOffer,
        freeAgencyOffers,
      },
    };
  }, [player, phase, gameMode, currentSaveSlot, currentYear, currentSeasonWeek, isPlayoffs, teams, schedule, tweets, careerHistory, leagueHistory, activeTab, executedTradeYears, seasonTradeHistory, parallelDraftHistory, activeInSeasonTradeOffers, declinePromptYear, isInteractiveMatch, usedOffseasonEventIds, offseasonMonth, offseasonCompletedPlans, offseasonEventMonths, offseasonPhase, isDraftCompleted, isContractCompleted, contractStep, renewalOffer, freeAgencyOffers]);

  const autoSave = useAutoSave(
    saveSnapshot,
    (time) => setLastSavedAt(new Date(time).toLocaleTimeString('zh-CN')),
    isRegularSeasonAutoSimulating,
  );
  const getCurrentSavedData = () => saveSnapshot ? { ...saveSnapshot, updatedAt: new Date().toISOString() } : null;
  const handleOpenSaveSlots = () => {
    autoSave.flush();
    setIsSaveSlotsOpen(true);
  };
  useLayoutEffect(() => {
    if (phase === 'home') autoSave.flush();
  }, [phase, autoSave]);

  const handleQuickSave = () => {
    const data = getCurrentSavedData();
    if (!data || !data.player) {
      showToast('⚠️ 当前没有可保存的球员状态，请先建立或载入生涯');
      return;
    }
    const nowStr = new Date().toISOString();
    data.updatedAt = nowStr;
    data.slotId = currentSaveSlot;
    const success = saveGameToStorage(data, currentSaveSlot, gameMode);
    if (success) autoSave.cancel();
    if (success) {
      setLastSavedAt(new Date(nowStr).toLocaleTimeString('zh-CN'));
      const slotNames: Record<string, string> = { slot_1: '存档 1', slot_2: '存档 2', slot_3: '存档 3', slot_4: '存档 4' };
      showToast(`💾 进度已写入 [${slotNames[currentSaveSlot] || '当前存档'}]！[${data.player.name} · ${nowStr}]`);
    } else {
      showToast('❌ 保存失败：浏览器本地存储错误');
    }
  };

  const handleLoadSaveData = (data: SavedData, loadedSlotId?: SaveSlotId) => {
    if (!data || !data.player) return;
    autoSave.flush();
    autoSave.cancel();
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
    setSeasonTradeHistory(data.seasonTradeHistory || {});
    setParallelDraftHistory(data.parallelDraftHistory || {});
    setActiveInSeasonTradeOffers((data.activeInSeasonTradeOffers || []).slice(0, 3));
    setDeclinePromptYear(data.declinePromptYear ?? null);
    setIsInteractiveMatch(data.uiState?.isInteractiveMatch ?? true);
    setUsedOffseasonEventIds(new Set(data.uiState?.usedOffseasonEventIds || []));
    setOffseasonMonth(data.uiState?.offseasonMonth ?? 1);
    setOffseasonCompletedPlans(data.uiState?.offseasonCompletedPlans || {});
    setOffseasonEventMonths(data.uiState?.offseasonEventMonths || []);
    setOffseasonPhase(data.uiState?.offseasonPhase ?? 'draft');
    setIsDraftCompleted(data.uiState?.isDraftCompleted ?? false);
    setIsContractCompleted(data.uiState?.isContractCompleted ?? false);
    setContractStep(data.uiState?.contractStep ?? 'decision');
    setRenewalOffer(data.uiState?.renewalOffer ?? null);
    setFreeAgencyOffers((data.uiState?.freeAgencyOffers ?? []).slice(0, 3));
    setShowAgeDeclineModal(false);
    // Always default activeTab to 'season' when loading/continuing career (or if activeTab was 'hof')
    const loadedTab = data.activeTab && data.activeTab !== 'hof' ? data.activeTab : 'season';
    setActiveTab(loadedTab);

    if (data.updatedAt) {
      const savedTime = new Date(data.updatedAt);
      setLastSavedAt(Number.isNaN(savedTime.getTime()) ? data.updatedAt : savedTime.toLocaleTimeString('zh-CN'));
    }

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
    autoSave.cancel();
    clearGameStorage(gameMode);
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
    setSeasonTradeHistory({});
    setParallelDraftHistory({});
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
    newPlayer = normalizeBranding(newPlayer);
    autoSave.flush();
    autoSave.cancel();
    // 1. Reset timeline & season progress to initial 2008 season start
    setCurrentYear(2008);
    setCurrentSeasonWeek(1);
    setIsPlayoffs(false);
    setActiveTab('season');
    setLastMatchResult(null);
    setIsInteractiveMatch(true);
    setShowSettingsModal(false);
    setIsLegendaryHofOpen(false);

    // 2. Reset career & league histories, trades, and active offers
    setCareerHistory([]);
    setLeagueHistory([]);
    setExecutedTradeYears([]);
    setSeasonTradeHistory({});
    setParallelDraftHistory({});
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
        salaryPerYear: 3800000,
        yearsLeft: 3,
        totalYears: 3,
        isRookieContract: true,
      },
      freeAgencyOfferRefreshUsed: false,
      tradeOfferRefreshUsed: false,
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
        author: 'Woj',
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
        author: 'Woj',
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
    setActiveTab('season');
    setPhase('regular_season');
  };

  // Helper to simulate a full league game week so all 30 NBA teams get win/loss updates using dynamic power ratings
  const { handleSimulateFullSeason, handleStartMatch, handleFinishMatch, handlePostMatchContinue, handleAdvanceInjury } = useSeasonSimulation({
    player,
    currentSeasonWeek,
    teams,
    schedule,
    currentYear,
    setTeams,
    setSchedule,
    setPlayer,
    setCurrentSeasonWeek,
    setIsPlayoffs,
    careerHistory,
    checkAndApplyMilestones,
    setActiveMilestoneModal,
    setIsInteractiveMatch,
    setPhase,
    setLastMatchResult,
    setTweets,
  });

  const { handleUpgradeAttribute, handleAddSkillPoints, handleWatchAttributeAd, handleAllInAttribute, handleResetAttribute, handleWorkout, handleRest, handleUnlockEndorsement, handleCreateSignatureShoe, handleBuyLuxuryItem, handleRequestTrade } = usePlayerActions(player, setPlayer, careerHistory.length, currentYear);

  // Advance to next season handler
  const handleNextSeason = () => {
    if (!player) return;
    if (mustRetireAtAge(player.age)) {
      // A legacy/offseason save may already contain a 43-year-old player.
      // Show the mandatory-retirement notice first; retirement is only
      // finalized after the player presses the confirmation button.
      setDeclinePromptYear(null);
      setShowAgeDeclineModal(true);
      return;
    }
    if (mustRetireAtAge((player.age || 19) + 1)) {
      setPlayer(syncPlayerAgeDecay({ ...player, age: (player.age || 19) + 1, isRookie: false }));
      setDeclinePromptYear(null);
      setShowAgeDeclineModal(true);
      return;
    }
    // A 42-year-old may finish the current season, but cannot enter another
    // regular season at 43. Advance the displayed retirement age once and go
    // directly to the retirement flow without briefly mounting a new season.
    if (mustRetireAtAge((player.age || 19) + 1)) {
      setPlayer(syncPlayerAgeDecay({ ...player, age: (player.age || 19) + 1, isRookie: false }));
      setDeclinePromptYear(currentYear);
      setShowAgeDeclineModal(false);
      setPrevPhase(phase);
      setActiveTab('hof');
      setPhase('hall_of_fame');
      return;
    }

    // Progress ages, dynamic OVRs, and team ratings across all 30 teams
    const { updatedTeams, updatedUserPlayer } = progressLeagueForNewSeason(teams, player);

    setCurrentSeasonWeek(1);
    setIsPlayoffs(false);
    setOffseasonMonth(1);
    setOffseasonCompletedPlans({});
    setOffseasonEventMonths([]);
    setActiveInSeasonTradeOffers([]);

    // Record the completed season before clearing standings. Strategy labels are
    // re-evaluated annually but use inertia to avoid implausible oscillation.
    const strategicallyUpdatedTeams = gameMode === 'random_trade'
      ? evaluateTeamStrategies(updatedTeams, currentYear)
      : updatedTeams;
    let resetTeams = strategicallyUpdatedTeams.map((t) => ({ ...t, wins: 0, losses: 0 }));

    // Execute historical real trades for the new season year (e.g. 2009 for 2009-2010 season)
    if (!executedTradeYears.includes(currentYear)) {
      const { updatedTeams: teamsAfterTrades, modalData } = gameMode === 'random_trade'
        ? executeRandomTradesForSeason(resetTeams, currentYear, {
            userPlayerId: player.id,
            userPlayerName: player.name,
            userTeamId: player.currentTeamId,
          })
        : executeHistoricalTradesForSeason(resetTeams, currentYear);
      if (modalData && modalData.executedTrades.length > 0) {
        resetTeams = teamsAfterTrades;
        setTradeModalData(modalData);
        setSeasonTradeHistory((prev) => ({ ...prev, [currentYear]: modalData }));
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

    // Contract value remains visible in full; 12% becomes spendable after taxes,
    // representation and normal living costs.
    const disposableSalary = calculateDisposableSalary(player.contract.salaryPerYear);
    const finalPlayer: PlayerProfile = {
      ...(updatedUserPlayer || player),
      money: player.money + disposableSalary,
      seasonStats: { games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, minutes: 0 },
      energy: 100,
      health: {
        status: 'healthy',
        cooldownGames: player.health.status === 'injured' ? 10 : (player.health.cooldownGames || 0),
        occurredThisSeason: false,
      },
      freeAgencyOfferRefreshUsed: false,
      tradeOfferRefreshUsed: false,
    };
    setPlayer(finalPlayer);

    setPhase('regular_season');
    if (mustRetireAtAge(finalPlayer.age)) {
      setDeclinePromptYear(null);
      setShowAgeDeclineModal(true);
    }
  };

  const handleViewSeasonTrades = () => {
    if (gameMode === 'random_trade') {
      const generated = seasonTradeHistory[currentYear];
      if (generated) setTradeModalData(generated);
      else showToast('本赛季平行联盟交易尚未生成');
      return;
    }
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

  const handleInviteStar = (sourceTeamId: string, starPlayerId: string) => {
    if (!player || gameMode !== 'random_trade') {
      return { success: false, message: '该功能仅在平行联盟模式开放' };
    }
    const invitationYears = player.starInvitationYears || (player.starInvitationUsedYear ? [player.starInvitationUsedYear] : []);
    const invitationCount = player.starInvitationCount ?? invitationYears.length;
    if (invitationCount >= 3) return { success: false, message: '本段生涯的3次球星邀请机会已全部使用' };
    const lastInvitationYear = invitationYears.length ? Math.max(...invitationYears) : null;
    if (lastInvitationYear !== null && currentYear - lastInvitationYear < 3) {
      return { success: false, message: `球星邀请处于冷却期，${lastInvitationYear + 3}赛季可再次使用` };
    }
    const userTeam = teams.find((team) => team.id === player.currentTeamId);
    if ((userTeam?.roster.filter((candidate) => candidate.ovr >= 90).length || 0) >= 3) {
      return { success: false, message: '当前球队已有3名90+球星，暂不可继续邀请' };
    }
    if ((player.invitedStarPlayerIds || []).includes(starPlayerId)) {
      return { success: false, message: '该球星已经在本段生涯中受邀过' };
    }

    const result = inviteStarToTeam(
      teams,
      player.currentTeamId,
      sourceTeamId,
      starPlayerId,
      currentYear,
      player.id,
      player.name,
    );
    if (result.error || !result.invitedPlayer) {
      return { success: false, message: result.error || '球星邀请失败' };
    }

    setTeams(result.updatedTeams);
    setPlayer((prev) => {
      if (!prev) return prev;
      const existingYears = prev.starInvitationYears || (prev.starInvitationUsedYear ? [prev.starInvitationUsedYear] : []);
      return {
        ...prev,
        starInvitationUsedYear: currentYear,
        starInvitationCount: (prev.starInvitationCount ?? existingYears.length) + 1,
        starInvitationYears: [...existingYears, currentYear],
        invitedStarPlayerIds: [...(prev.invitedStarPlayerIds || []), starPlayerId],
      };
    });
    const message = `${result.invitedPlayer.name}已接受邀请并加入球队`;
    showToast(`⭐ ${message}`);
    return { success: true, message };
  };

  const currentTeam = teams.find((t) => t.id === player?.currentTeamId) || teams[0];
  const oppTeam =
    teams.find((t) => t.id === schedule.find((s) => (s as any).gameNumber === currentSeasonWeek || s.week === currentSeasonWeek)?.opponentId) ||
    teams.find((t) => t.id === schedule[schedule.length - 1]?.opponentId) ||
    teams[1];

  const historicalSeason = HISTORICAL_SEASONS.find((h) => h.year === currentYear) || HISTORICAL_SEASONS[0];
  return {
    handleOpenSaveSlots,
    phase,
    setPhase,
    prevPhase,
    setPrevPhase,
    currentSaveSlot,
    isSaveSlotsOpen,
    setIsSaveSlotsOpen,
    toastMsg,
    currentYear,
    currentSeasonWeek,
    setCurrentSeasonWeek,
    isPlayoffs,
    setIsPlayoffs,
    activeTab,
    setActiveTab,
    lastSavedAt,
    storageReady,
    isRegularSeasonAutoSimulating,
    setIsRegularSeasonAutoSimulating,
    showSettingsModal,
    setShowSettingsModal,
    isLegendaryHofOpen,
    setIsLegendaryHofOpen,
    legendaryHofInitialMode,
    setLegendaryHofInitialMode,
    showAgeDeclineModal,
    showToast,
    teams,
    setTeams,
    player,
    setPlayer,
    isInteractiveMatch,
    lastMatchResult,
    schedule,
    tweets,
    careerHistory,
    leagueHistory,
    usedOffseasonEventIds,
    offseasonMonth,
    setOffseasonMonth,
    offseasonCompletedPlans,
    setOffseasonCompletedPlans,
    offseasonEventMonths,
    showDraftWaitingAnimation,
    setShowDraftWaitingAnimation,
    offseasonPhase,
    setOffseasonPhase,
    isDraftCompleted,
    setIsDraftCompleted,
    isContractCompleted,
    setIsContractCompleted,
    contractStep,
    setContractStep,
    renewalOffer,
    setRenewalOffer,
    freeAgencyOffers,
    setFreeAgencyOffers,
    tradeModalData,
    setTradeModalData,
    parallelDraftHistory,
    activeInSeasonTradeOffers,
    setActiveInSeasonTradeOffers,
    activeMilestoneModal,
    setActiveMilestoneModal,
    handleAddUsedEventId,
    handleEnterOffseason,
    handleSignNewContract,
    handleAgeDeclineRetire,
    handleAgeDeclineContinue,
    getCurrentSavedData,
    handleQuickSave,
    handleLoadSaveData,
    handleManualSave,
    handleResetGame,
    handleCurrentSlotDeleted,
    handlePlayerCreated,
    handleCompleteDraft,
    handleSignContract,
    handleStartMatch,
    handleFinishMatch,
    handlePostMatchContinue,
    handleAdvanceInjury,
    handleUpgradeAttribute,
    handleAddSkillPoints,
    handleWatchAttributeAd,
    handleAllInAttribute,
    handleResetAttribute,
    handleWorkout,
    handleRest,
    handleUnlockEndorsement,
    handleCreateSignatureShoe,
    handleBuyLuxuryItem,
    handleRequestTrade,
    handleNextSeason,
    handleViewSeasonTrades,
    handleInviteStar,
    currentTeam,
    oppTeam,
  };
}
