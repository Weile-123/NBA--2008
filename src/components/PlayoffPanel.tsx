import React, { useState, useEffect, useRef } from 'react';
import { Team, PlayerProfile } from '../types';
import { TeamLogo } from './TeamLogo';
import { calculateMatchScores, getCompleteTeamRoster, calculateTeamPowerRating, getShortTeamName } from '../utils/leagueLogic';
import { Play, Pause, Trophy, Flame, ShieldAlert, ChevronRight, Sparkles, Crown, Award, Star, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface PlayoffSeries {
  id: string;
  round: 1 | 2 | 3 | 4; // 1: 1st Round, 2: Semis, 3: Conf Finals, 4: NBA Finals
  conference: 'East' | 'West' | 'Finals';
  teamA: Team;
  teamB: Team;
  winsA: number;
  winsB: number;
  winnerId?: string;
  seedA?: number; // Conference seed (1-8)
  seedB?: number; // Conference seed (1-8)
}

const PLAYOFF_STORAGE_KEY_PREFIX = 'nba2k2008_playoff_state_';

interface SavedPlayoffState {
  currentYear: number;
  currentRound: 1 | 2 | 3 | 4;
  seriesList: PlayoffSeries[];
  champion: Team | null;
}

function loadPlayoffState(year: number): SavedPlayoffState | null {
  try {
    const raw = localStorage.getItem(`${PLAYOFF_STORAGE_KEY_PREFIX}${year}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.seriesList) && parsed.seriesList.length > 0) {
      return {
        currentYear: parsed.currentYear || year,
        currentRound: parsed.currentRound || 1,
        seriesList: parsed.seriesList,
        champion: parsed.champion || null,
      };
    }
  } catch (err) {
    console.error('Failed to load playoff state:', err);
  }
  return null;
}

function savePlayoffState(year: number, currentRound: 1 | 2 | 3 | 4, seriesList: PlayoffSeries[], champion: Team | null) {
  try {
    if (seriesList.length === 0) return;
    const data: SavedPlayoffState = {
      currentYear: year,
      currentRound,
      seriesList,
      champion,
    };
    localStorage.setItem(`${PLAYOFF_STORAGE_KEY_PREFIX}${year}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save playoff state:', err);
  }
}

export function clearPlayoffStorage(year?: number) {
  try {
    if (year) {
      localStorage.removeItem(`${PLAYOFF_STORAGE_KEY_PREFIX}${year}`);
    } else {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PLAYOFF_STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (err) {
    console.error('Failed to clear playoff storage:', err);
  }
}

interface PlayoffPanelProps {
  userTeam: Team;
  teams: Team[];
  player: PlayerProfile;
  currentYear: number;
  onStartInteractiveMatch: () => void;
  onFinishPlayoffs: (championTeam: Team, fmvpName?: string) => void;
}

export const PlayoffPanel: React.FC<PlayoffPanelProps> = ({
  userTeam,
  teams,
  player,
  currentYear,
  onStartInteractiveMatch,
  onFinishPlayoffs,
}) => {
  const [currentRound, setCurrentRound] = useState<1 | 2 | 3 | 4>(() => {
    const saved = loadPlayoffState(currentYear);
    return saved ? saved.currentRound : 1;
  });
  const [seriesList, setSeriesList] = useState<PlayoffSeries[]>(() => {
    const saved = loadPlayoffState(currentYear);
    return saved ? saved.seriesList : [];
  });
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [champion, setChampion] = useState<Team | null>(() => {
    const saved = loadPlayoffState(currentYear);
    return saved ? saved.champion : null;
  });
  const [showHonorsModal, setShowHonorsModal] = useState(false);

  const autoSimTimerRef = useRef<NodeJS.Timeout | null>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Compute current/active series ID for user team in the bracket tree to focus properly
  const activeUserSeriesId = (() => {
    const userSeriesList = seriesList.filter(
      (s) => s.teamA.id === userTeam.id || s.teamB.id === userTeam.id
    );
    if (userSeriesList.length === 0) return null;

    // Prefer current active round series
    const currentRoundSeries = userSeriesList.find((s) => s.round === currentRound);
    if (currentRoundSeries) return currentRoundSeries.id;

    // Fallback to highest round series
    const sorted = [...userSeriesList].sort((a, b) => b.round - a.round);
    return sorted[0].id;
  })();

  const scrollToUserTeam = () => {
    const container = treeContainerRef.current;
    if (!container) return;

    const userSeriesEl = container.querySelector('[data-user-series="true"]') as HTMLElement | null;
    if (userSeriesEl) {
      const containerRect = container.getBoundingClientRect();
      const elRect = userSeriesEl.getBoundingClientRect();

      // Calculate target scrollLeft to center the active user series card within container
      const targetScrollLeft =
        container.scrollLeft +
        (elRect.left - containerRect.left) -
        containerRect.width / 2 +
        elRect.width / 2;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  };

  // Auto-save playoff state whenever seriesList, currentRound, or champion changes
  useEffect(() => {
    if (seriesList.length > 0) {
      savePlayoffState(currentYear, currentRound, seriesList, champion);
    }
  }, [currentYear, currentRound, seriesList, champion]);

  // Initialize Playoff Series on mount if no saved state exists for currentYear
  useEffect(() => {
    const saved = loadPlayoffState(currentYear);
    if (saved && saved.seriesList.length > 0) {
      setSeriesList(saved.seriesList);
      setCurrentRound(saved.currentRound);
      setChampion(saved.champion);
      return;
    }

    const sortTeams = (list: Team[]) =>
      [...list].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return calculateTeamPowerRating(b) - calculateTeamPowerRating(a);
      });

    let eastTeams = sortTeams(teams.filter((t) => t.conference === 'East')).slice(0, 8);
    let westTeams = sortTeams(teams.filter((t) => t.conference === 'West')).slice(0, 8);

    const initialSeries: PlayoffSeries[] = [
      // East Round 1: #1 vs #8, #4 vs #5, #3 vs #6, #2 vs #7
      { id: 'E_R1_1', round: 1, conference: 'East', teamA: eastTeams[0], teamB: eastTeams[7], winsA: 0, winsB: 0, seedA: 1, seedB: 8 },
      { id: 'E_R1_2', round: 1, conference: 'East', teamA: eastTeams[3], teamB: eastTeams[4], winsA: 0, winsB: 0, seedA: 4, seedB: 5 },
      { id: 'E_R1_3', round: 1, conference: 'East', teamA: eastTeams[2], teamB: eastTeams[5], winsA: 0, winsB: 0, seedA: 3, seedB: 6 },
      { id: 'E_R1_4', round: 1, conference: 'East', teamA: eastTeams[1], teamB: eastTeams[6], winsA: 0, winsB: 0, seedA: 2, seedB: 7 },

      // West Round 1: #1 vs #8, #4 vs #5, #3 vs #6, #2 vs #7
      { id: 'W_R1_1', round: 1, conference: 'West', teamA: westTeams[0], teamB: westTeams[7], winsA: 0, winsB: 0, seedA: 1, seedB: 8 },
      { id: 'W_R1_2', round: 1, conference: 'West', teamA: westTeams[3], teamB: westTeams[4], winsA: 0, winsB: 0, seedA: 4, seedB: 5 },
      { id: 'W_R1_3', round: 1, conference: 'West', teamA: westTeams[2], teamB: westTeams[5], winsA: 0, winsB: 0, seedA: 3, seedB: 6 },
      { id: 'W_R1_4', round: 1, conference: 'West', teamA: westTeams[1], teamB: westTeams[6], winsA: 0, winsB: 0, seedA: 2, seedB: 7 },
    ];

    setSeriesList(initialSeries);
    setCurrentRound(1);
    setChampion(null);
  }, [teams, currentYear]);

  // Check if user team made playoffs and is still alive in active series
  const userMadePlayoffs = seriesList.some((s) => s.teamA.id === userTeam.id || s.teamB.id === userTeam.id);
  
  const activeUserSeries = seriesList.find(
    (s) => s.round === currentRound && !s.winnerId && (s.teamA.id === userTeam.id || s.teamB.id === userTeam.id)
  );

  const isUserAliveInPlayoffs = userMadePlayoffs && !!activeUserSeries;

  // Auto-scroll bracket to focus on user team when entering playoff or changing rounds
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToUserTeam();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentRound, userTeam.id, seriesList.length, activeUserSeriesId]);

  /**
   * Helper to calculate single-game win probability for teamA in a playoff series
   * Strongly weights both:
   *  1. Regular season seed ranking difference (1 vs 8, 2 vs 7, etc.)
   *  2. Team power rating difference (1.5% single-game win rate boost per rating point)
   */
  const getPlayoffGameWinProbA = (series: PlayoffSeries): number => {
    const { round, seedA, seedB, teamA, teamB } = series;
    const sA = seedA || 4;
    const sB = seedB || 5;

    const ratingA = calculateTeamPowerRating(teamA);
    const ratingB = calculateTeamPowerRating(teamB);
    // Rating difference adjustment: 1 pt difference adds/subtracts 1.5% single-game win rate
    const ratingDiff = (ratingA - ratingB) * 0.015;

    let baseProbA = 0.50;

    // Round 1 enhanced seed difference gaps:
    if (round === 1) {
      if ((sA === 1 && sB === 8) || (sA === 8 && sB === 1)) {
        baseProbA = sA === 1 ? 0.88 : 0.12;
      } else if ((sA === 2 && sB === 7) || (sA === 7 && sB === 2)) {
        baseProbA = sA === 2 ? 0.85 : 0.15;
      } else if ((sA === 3 && sB === 6) || (sA === 6 && sB === 3)) {
        baseProbA = sA === 3 ? 0.72 : 0.28;
      } else if ((sA === 4 && sB === 5) || (sA === 5 && sB === 4)) {
        baseProbA = sA === 4 ? 0.58 : 0.42;
      } else {
        // Fallback based on seed difference
        const diff = sB - sA;
        if (diff >= 7) baseProbA = 0.88;
        else if (diff >= 5) baseProbA = 0.85;
        else if (diff >= 3) baseProbA = 0.72;
        else if (diff >= 1) baseProbA = 0.58;
        else if (diff <= -7) baseProbA = 0.12;
        else if (diff <= -5) baseProbA = 0.15;
        else if (diff <= -3) baseProbA = 0.28;
        else if (diff <= -1) baseProbA = 0.42;
      }
    } else if (round === 2) {
      // Conference Semifinals: Increased #1 seed and higher-seed advantages
      const diff = sB - sA;
      if (sA === 1) baseProbA = 0.76;
      else if (sB === 1) baseProbA = 0.24;
      else if (diff >= 4) baseProbA = 0.72;
      else if (diff >= 2) baseProbA = 0.65;
      else if (diff >= 1) baseProbA = 0.58;
      else if (diff <= -4) baseProbA = 0.28;
      else if (diff <= -2) baseProbA = 0.35;
      else if (diff <= -1) baseProbA = 0.42;
    } else if (round === 3) {
      // Conference Finals
      const diff = sB - sA;
      if (sA === 1) baseProbA = 0.72;
      else if (sB === 1) baseProbA = 0.28;
      else if (diff >= 3) baseProbA = 0.68;
      else if (diff >= 1) baseProbA = 0.58;
      else if (diff <= -3) baseProbA = 0.32;
      else if (diff <= -1) baseProbA = 0.42;
    } else if (round === 4) {
      // Finals: Seed 1 advantage + team power rating difference
      if (sA === 1 && sB !== 1) baseProbA = 0.56;
      else if (sB === 1 && sA !== 1) baseProbA = 0.44;
      else baseProbA = 0.50;
    }

    // Combine base seed probability with team strength rating difference, bounded safely
    return Math.max(0.05, Math.min(0.95, baseProbA + ratingDiff));
  };

  // Helper to simulate the next game in a playoff series with strict 3:0 -> 50% 4:0 / 50% 3:1 and 3:1 -> 100% 4:1 logic
  // and seed-based win probability weighting
  const simulateNextSeriesGame = (series: PlayoffSeries): { winsA: number; winsB: number; winnerId?: string } => {
    let { winsA, winsB, teamA, teamB } = series;
    if (winsA >= 4 || winsB >= 4) {
      return { winsA, winsB, winnerId: winsA >= 4 ? teamA.id : teamB.id };
    }

    // Requirement: 如果当一支球队3：0对方（唯一前提条件），那下一场，50%的概率3：1，50%的概率4：0，如果3：1，则再下一场100%概率4：1
    if (winsA === 3 && winsB === 0) {
      if (Math.random() < 0.5) {
        winsA = 4; // 4:0
      } else {
        winsB = 1; // 3:1
      }
    } else if (winsB === 3 && winsA === 0) {
      if (Math.random() < 0.5) {
        winsB = 4; // 0:4
      } else {
        winsA = 1; // 1:3
      }
    } else if (winsA === 3 && winsB === 1) {
      winsA = 4; // 3:1 -> 100% chance 4:1
    } else if (winsB === 3 && winsA === 1) {
      winsB = 4; // 1:3 -> 100% chance 1:4
    } else {
      const probA = getPlayoffGameWinProbA(series);
      const isTeamAWin = Math.random() < probA;

      if (isTeamAWin) {
        winsA += 1;
      } else {
        winsB += 1;
      }
    }

    let winnerId: string | undefined = undefined;
    if (winsA >= 4) winnerId = teamA.id;
    else if (winsB >= 4) winnerId = teamB.id;

    return { winsA, winsB, winnerId };
  };

  // Single step simulation for 1 game across active series
  const simulatePlayoffStep = () => {
    setSeriesList((prevList) => {
      const activeCurrentRoundSeries = prevList.filter((s) => s.round === currentRound && !s.winnerId);

      if (activeCurrentRoundSeries.length === 0) {
        return prevList;
      }

      const nextList = [...prevList];

      for (const series of activeCurrentRoundSeries) {
        const result = simulateNextSeriesGame(series);

        const idx = nextList.findIndex((s) => s.id === series.id);
        if (idx !== -1) {
          nextList[idx] = {
            ...nextList[idx],
            winsA: result.winsA,
            winsB: result.winsB,
            winnerId: result.winnerId,
          };
        }
      }

      return nextList;
    });
  };

  // Simulate an entire playoff round at once (Requirement 1: 模拟本轮)
  const simulateWholeRound = () => {
    setSeriesList((prevList) => {
      let currentList = [...prevList];
      let activeSeries = currentList.filter((s) => s.round === currentRound && !s.winnerId);

      while (activeSeries.length > 0) {
        for (const series of activeSeries) {
          const result = simulateNextSeriesGame(series);

          const idx = currentList.findIndex((s) => s.id === series.id);
          if (idx !== -1) {
            currentList[idx] = {
              ...currentList[idx],
              winsA: result.winsA,
              winsB: result.winsB,
              winnerId: result.winnerId,
            };
          }
        }
        activeSeries = currentList.filter((s) => s.round === currentRound && !s.winnerId);
      }

      return currentList;
    });
  };

  // Check if round is finished and advance to next round + AUTO PAUSE SIMULATION
  useEffect(() => {
    if (seriesList.length === 0 || champion) return;

    const currentRoundSeries = seriesList.filter((s) => s.round === currentRound);
    if (currentRoundSeries.length === 0) return;

    const allFinished = currentRoundSeries.every((s) => s.winnerId);

    if (allFinished) {
      // REQUIREMENT 4: Automatically pause simulation at the end of each round!
      setIsAutoSimulating(false);

      if (currentRound === 1) {
        // Advance to Semis (Round 2)
        const winnersWithSeeds = currentRoundSeries.map((s) => ({
          team: s.winnerId === s.teamA.id ? s.teamA : s.teamB,
          seed: s.winnerId === s.teamA.id ? s.seedA : s.seedB,
        }));
        const newSeries: PlayoffSeries[] = [
          { id: 'E_R2_1', round: 2, conference: 'East', teamA: winnersWithSeeds[0].team, teamB: winnersWithSeeds[1].team, winsA: 0, winsB: 0, seedA: winnersWithSeeds[0].seed, seedB: winnersWithSeeds[1].seed },
          { id: 'E_R2_2', round: 2, conference: 'East', teamA: winnersWithSeeds[2].team, teamB: winnersWithSeeds[3].team, winsA: 0, winsB: 0, seedA: winnersWithSeeds[2].seed, seedB: winnersWithSeeds[3].seed },
          { id: 'W_R2_1', round: 2, conference: 'West', teamA: winnersWithSeeds[4].team, teamB: winnersWithSeeds[5].team, winsA: 0, winsB: 0, seedA: winnersWithSeeds[4].seed, seedB: winnersWithSeeds[5].seed },
          { id: 'W_R2_2', round: 2, conference: 'West', teamA: winnersWithSeeds[6].team, teamB: winnersWithSeeds[7].team, winsA: 0, winsB: 0, seedA: winnersWithSeeds[6].seed, seedB: winnersWithSeeds[7].seed },
        ];
        setSeriesList((prev) => [...prev, ...newSeries]);
        setCurrentRound(2);
      } else if (currentRound === 2) {
        // Advance to Conference Finals (Round 3)
        const winnersWithSeeds = currentRoundSeries.map((s) => ({
          team: s.winnerId === s.teamA.id ? s.teamA : s.teamB,
          seed: s.winnerId === s.teamA.id ? s.seedA : s.seedB,
        }));
        const newSeries: PlayoffSeries[] = [
          { id: 'E_R3', round: 3, conference: 'East', teamA: winnersWithSeeds[0].team, teamB: winnersWithSeeds[1].team, winsA: 0, winsB: 0, seedA: winnersWithSeeds[0].seed, seedB: winnersWithSeeds[1].seed },
          { id: 'W_R3', round: 3, conference: 'West', teamA: winnersWithSeeds[2].team, teamB: winnersWithSeeds[3].team, winsA: 0, winsB: 0, seedA: winnersWithSeeds[2].seed, seedB: winnersWithSeeds[3].seed },
        ];
        setSeriesList((prev) => [...prev, ...newSeries]);
        setCurrentRound(3);
      } else if (currentRound === 3) {
        // Advance to NBA Finals (Round 4)
        let winnersWithSeeds = currentRoundSeries.map((s) => ({
          team: s.winnerId === s.teamA.id ? s.teamA : s.teamB,
          seed: s.winnerId === s.teamA.id ? s.seedA : s.seedB,
        }));
        const newSeries: PlayoffSeries[] = [
          { id: 'FINALS', round: 4, conference: 'Finals', teamA: winnersWithSeeds[0].team, teamB: winnersWithSeeds[1].team, winsA: 0, winsB: 0, seedA: winnersWithSeeds[0].seed, seedB: winnersWithSeeds[1].seed },
        ];
        setSeriesList((prev) => [...prev, ...newSeries]);
        setCurrentRound(4);
      } else if (currentRound === 4) {
        // Crown Champion & Pop up Playoff Honors Modal (REQUIREMENT 5)
        const finalsSeries = currentRoundSeries[0];
        const champ = finalsSeries.winnerId === finalsSeries.teamA.id ? finalsSeries.teamA : finalsSeries.teamB;
        setChampion(champ);
        setShowHonorsModal(true);

        if (champ.id === userTeam.id) {
          confetti({ particleCount: 250, spread: 140, origin: { y: 0.4 } });
        }
      }
    }
  }, [seriesList, currentRound, champion, userTeam.id]);

  // Auto-simulation timer loop
  useEffect(() => {
    if (isAutoSimulating && !champion) {
      autoSimTimerRef.current = setInterval(() => {
        simulatePlayoffStep();
      }, 750);
    } else {
      if (autoSimTimerRef.current) clearInterval(autoSimTimerRef.current);
    }

    return () => {
      if (autoSimTimerRef.current) clearInterval(autoSimTimerRef.current);
    };
  }, [isAutoSimulating, currentRound, champion]);

  const toggleAutoSim = () => {
    setIsAutoSimulating((prev) => !prev);
  };

  const getRoundLabel = (r: number) => {
    switch (r) {
      case 1:
        return '季后赛首轮';
      case 2:
        return '分区半决赛';
      case 3:
        return '分区决赛';
      case 4:
        return 'NBA 总决赛';
      default:
        return '季后赛';
    }
  };

  // Compute FMVP winner details according to strict logic:
  // 1. 必须首发 (Must be a starter: role === '战术核心' || role === '绝对首发')
  // 2. 必须是球队战术核心 (Tactical core: top starters sorted by OVR)
  // 3. 综评排名队内第一 90% 概率，排名队内第二 10% 概率；如果第一和第二差距大于 5，则第一 100% 概率拿 FMVP
  const getFmvpWinner = (champ: Team) => {
    const { roster } = getCompleteTeamRoster(champ, player, 1);

    // 1. Filter starters (roles: '战术核心' or '绝对首发')
    let starters = roster.filter((p) => p.role === '战术核心' || p.role === '绝对首发');
    if (starters.length === 0) {
      starters = roster.slice(0, 5);
    }

    // 2. Sort starters by OVR descending to find team's top core candidates
    const sortedStarters = [...starters].sort((a, b) => b.ovr - a.ovr);

    const p1 = sortedStarters[0]; // #1 starter in team by OVR
    const p2 = sortedStarters[1]; // #2 starter in team by OVR

    let winner = p1 || roster[0];

    if (p1 && p2) {
      const ovrDiff = p1.ovr - p2.ovr;
      if (ovrDiff > 5) {
        // 如果第一和第二差距大于5，则第一100%概率拿fmvp
        winner = p1;
      } else {
        // 综评排名队内第一90%概率，排名队内第二10%概率 (use a stable hash to keep it deterministic across re-renders)
        const nameHash = champ.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const seedVal = (champ.wins * 31 + nameHash + currentYear) % 100;
        winner = seedVal < 90 ? p1 : p2;
      }
    }

    const isUser = !!winner.isUser || winner.id === player.id || winner.name === player.name;

    if (isUser) {
      const ppg = player.seasonStats?.games > 0 ? (player.seasonStats.pts / player.seasonStats.games + 3.2).toFixed(1) : '26.5';
      const rpg = player.seasonStats?.games > 0 ? (player.seasonStats.reb / player.seasonStats.games + 1.2).toFixed(1) : '6.0';
      const apg = player.seasonStats?.games > 0 ? (player.seasonStats.ast / player.seasonStats.games + 1.5).toFixed(1) : '6.5';

      return {
        name: player.name,
        isUser: true,
        teamName: champ.name,
        position: player.position,
        ppg,
        rpg,
        apg,
        reason: `在总决赛绝境中强势爆发，以无解得分与致命助攻统治系列赛，率领【${champ.name}】加冕至高荣耀！`,
      };
    } else {
      const ppg = winner.stats?.ppg ? (winner.stats.ppg + 3.5).toFixed(1) : (winner.ovr * 0.29).toFixed(1);
      const rpg = winner.stats?.rpg ? (winner.stats.rpg + 1.2).toFixed(1) : '7.8';
      const apg = winner.stats?.apg ? (winner.stats.apg + 1.5).toFixed(1) : '6.4';

      return {
        name: winner.name,
        isUser: false,
        teamName: champ.name,
        position: winner.position,
        ppg,
        rpg,
        apg,
        reason: `在总决赛攻防两端大发神威，系列赛场均砍下 ${ppg} 分，统治攻防两端，荣膺总决赛最有价值球员 (FMVP)！`,
      };
    }
  };

  // Helper renderer for a single series card in the tree bracket (Requirement 3: logo在上面，下面显示队名(比分))
  const renderSeriesCard = (series?: PlayoffSeries, label?: string) => {
    if (!series) {
      return (
        <div className="p-2 sm:p-2.5 rounded-xl border border-dashed border-[#232834] bg-[#0d1017]/40 text-center text-[9px] sm:text-[10px] text-slate-600 font-mono italic">
          {label || '等待对阵'}
        </div>
      );
    }

    const isUserSeries = series.teamA.id === userTeam.id || series.teamB.id === userTeam.id;
    const isCurrentActiveUserSeries = series.id === activeUserSeriesId;
    const isFinished = !!series.winnerId;

    return (
      <div
        data-user-series={isCurrentActiveUserSeries ? 'true' : undefined}
        className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
          isCurrentActiveUserSeries
            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
            : isUserSeries
            ? 'bg-amber-500/5 border-amber-500/30'
            : 'bg-[#0d1017] border-[#232834]'
        }`}
      >
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-center items-center">
          {/* Team A */}
          <div
            className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all relative ${
              isFinished
                ? series.winnerId === series.teamA.id
                  ? 'font-black text-amber-300 bg-amber-500/15 ring-1 ring-amber-500/30'
                  : 'opacity-35 grayscale text-slate-500 line-through'
                : series.teamA.id === userTeam.id
                ? 'text-amber-300 font-bold bg-amber-500/10'
                : 'text-slate-200'
            }`}
          >
            {/* Logo on top */}
            <div className="relative">
              <TeamLogo
                logo={series.teamA.logo}
                abbrev={series.teamA.abbrev}
                primaryColor={series.teamA.primaryColor}
                secondaryColor={series.teamA.secondaryColor}
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain mb-0.5 sm:mb-1"
              />
              {series.seedA && (
                <span className="absolute -top-1 -right-1 text-[8px] sm:text-[9px] font-black px-1 py-0.2 rounded-full bg-slate-800/90 text-amber-400 border border-amber-400/40">
                  {series.seedA}
                </span>
              )}
            </div>
            {/* Team Name + (Score) below */}
            <span className="text-[10px] sm:text-[11px] font-bold leading-tight truncate w-full">
              {getShortTeamName(series.teamA.name)}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-mono font-black mt-0.5 ${series.winsA >= 4 ? 'text-emerald-400' : 'text-slate-400'}`}>
              ({series.winsA})
            </span>
          </div>

          {/* Team B */}
          <div
            className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all relative ${
              isFinished
                ? series.winnerId === series.teamB.id
                  ? 'font-black text-amber-300 bg-amber-500/15 ring-1 ring-amber-500/30'
                  : 'opacity-35 grayscale text-slate-500 line-through'
                : series.teamB.id === userTeam.id
                ? 'text-amber-300 font-bold bg-amber-500/10'
                : 'text-slate-200'
            }`}
          >
            {/* Logo on top */}
            <div className="relative">
              <TeamLogo
                logo={series.teamB.logo}
                abbrev={series.teamB.abbrev}
                primaryColor={series.teamB.primaryColor}
                secondaryColor={series.teamB.secondaryColor}
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain mb-0.5 sm:mb-1"
              />
              {series.seedB && (
                <span className="absolute -top-1 -right-1 text-[8px] sm:text-[9px] font-black px-1 py-0.2 rounded-full bg-slate-800/90 text-amber-400 border border-amber-400/40">
                  {series.seedB}
                </span>
              )}
            </div>
            {/* Team Name + (Score) below */}
            <span className="text-[10px] sm:text-[11px] font-bold leading-tight truncate w-full">
              {getShortTeamName(series.teamB.name)}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-mono font-black mt-0.5 ${series.winsB >= 4 ? 'text-emerald-400' : 'text-slate-400'}`}>
              ({series.winsB})
            </span>
          </div>
        </div>
      </div>
    );
  };

  const eastR1Series = seriesList.filter((s) => s.round === 1 && s.conference === 'East');
  const eastR2Series = seriesList.filter((s) => s.round === 2 && s.conference === 'East');
  const eastR3Series = seriesList.filter((s) => s.round === 3 && s.conference === 'East');

  const westR1Series = seriesList.filter((s) => s.round === 1 && s.conference === 'West');
  const westR2Series = seriesList.filter((s) => s.round === 2 && s.conference === 'West');
  const westR3Series = seriesList.filter((s) => s.round === 3 && s.conference === 'West');

  const finalsSeries = seriesList.find((s) => s.round === 4);

  return (
    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
      {/* Top Playoff Action Banner */}
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-5 shadow-2xl space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#232834] pb-3 sm:pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] sm:text-[10px] font-black uppercase">
              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" /> {currentYear}-{currentYear + 1} 季后赛模式 (PLAYOFFS)
            </div>
            <h3 className="text-base sm:text-xl font-black italic uppercase text-white mt-1">
              当前阶段: {getRoundLabel(currentRound)}
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {!champion ? (
              <>
                {/* Play/Pause Auto-Simulation Button */}
                <button
                  type="button"
                  onClick={toggleAutoSim}
                  className={`flex-1 sm:flex-none justify-center px-3.5 sm:px-5 py-2 sm:py-2.5 font-black italic rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs uppercase tracking-tight shadow-lg ${
                    isAutoSimulating
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20 animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                  }`}
                >
                  {isAutoSimulating ? (
                    <>
                      <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" /> 暂停模拟 (PAUSE)
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" /> 开始模拟 (SIM)
                    </>
                  )}
                </button>

                {/* Simulate Entire Round Button */}
                <button
                  type="button"
                  onClick={simulateWholeRound}
                  className="flex-1 sm:flex-none justify-center px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black italic rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs uppercase tracking-tight shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black fill-current shrink-0" />
                  模拟本轮 (ROUND)
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowHonorsModal(true)}
                className="w-full sm:w-auto justify-center px-4 sm:px-6 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 text-xs uppercase shadow-xl cursor-pointer"
              >
                <Trophy className="w-4 h-4 shrink-0" /> 荣誉盛典 & 休赛期 <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* User Playoff Status Note */}
        <div className="bg-[#0d1017] p-2.5 sm:p-3 rounded-xl border border-[#232834] flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] sm:text-xs font-mono gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-slate-400 font-bold">你的球队:</span>
            {userMadePlayoffs ? (
              isUserAliveInPlayoffs ? (
                <span className="text-emerald-400 font-black flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 【{userTeam.name}】角逐中 ({activeUserSeries?.winsA} - {activeUserSeries?.winsB})
                </span>
              ) : (
                <span className="text-rose-400 font-black flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" /> 【{userTeam.name}】已止步
                </span>
              )
            ) : (
              <span className="text-slate-500 font-bold">【{userTeam.name}】未进入季后赛</span>
            )}
          </div>

          <div className="text-amber-400 font-bold text-[10px] sm:text-xs">
            赛制: 七场四胜制 (BEST-OF-7)
          </div>
        </div>
      </div>

      {/* Champion Banner if crowned */}
      {champion && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-900/30 to-amber-500/20 border-2 border-amber-400 rounded-2xl p-4 sm:p-6 text-center space-y-2.5 sm:space-y-3 shadow-2xl animate-scaleIn flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500 text-black font-black text-[10px] sm:text-xs uppercase">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {currentYear}-{currentYear + 1} NBA 总冠军诞生！
          </div>
          <div className="flex items-center justify-center gap-2.5 sm:gap-4">
            <TeamLogo
              logo={champion.logo}
              abbrev={champion.abbrev}
              primaryColor={champion.primaryColor}
              secondaryColor={champion.secondaryColor}
              className="w-10 h-10 sm:w-16 sm:h-16 object-contain"
            />
            <h2 className="text-xl sm:text-3xl font-black italic uppercase text-white">{champion.name}</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowHonorsModal(true)}
            className="mt-1 sm:mt-2 px-4 sm:px-5 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] sm:text-xs rounded-xl shadow-lg flex items-center gap-1.5 sm:gap-2 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 查看荣誉盛典 & 结算休赛期
          </button>
        </div>
      )}

      {/* REQUIREMENT 4: Playoff Tree Bracket Diagram (季后赛树状图) */}
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between border-b border-[#232834] pb-2.5 sm:pb-3 gap-2">
          <h4 className="text-xs sm:text-xs font-black italic uppercase text-white flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> 季后赛树状图 (BRACKET TREE)
          </h4>
          <div className="flex items-center gap-2">
            {userMadePlayoffs && (
              <button
                type="button"
                onClick={scrollToUserTeam}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                title="点击自动平滑滚动聚焦到你的球队卡片"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" /> 聚焦我的球队
              </button>
            )}
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono hidden sm:inline">
              提示：被淘汰的队伍自动置灰打叉
            </span>
          </div>
        </div>

        {/* Scrollable Tree Bracket Layout */}
        <div ref={treeContainerRef} className="overflow-x-auto pb-2 sm:pb-4">
          <div className="min-w-[1100px] flex items-center justify-between gap-1 text-center py-2">
            
            {/* EAST SIDE */}
            
            {/* Col 1: East R1 */}
            <div className="flex flex-col space-y-3 w-40">
              <div className="text-[11px] font-black uppercase text-blue-400 bg-blue-500/10 py-1 rounded border border-blue-500/20">
                东首轮 (E-R1)
              </div>
              <div className="flex flex-col space-y-3">
                {renderSeriesCard(eastR1Series[0], '东部 1 vs 8')}
                {renderSeriesCard(eastR1Series[1], '东部 4 vs 5')}
                {renderSeriesCard(eastR1Series[2], '东部 3 vs 6')}
                {renderSeriesCard(eastR1Series[3], '东部 2 vs 7')}
              </div>
            </div>

            {/* East R1 -> East Semis Connectors */}
            <div className="flex flex-col justify-around h-[340px]">
              {/* Connector Pair 1 */}
              <div className="flex items-center h-32">
                <div className="w-2.5 border-t-2 border-r-2 border-b-2 border-slate-700 h-28 rounded-r-sm" />
                <div className="w-2.5 border-t-2 border-slate-700" />
              </div>
              {/* Connector Pair 2 */}
              <div className="flex items-center h-32">
                <div className="w-2.5 border-t-2 border-r-2 border-b-2 border-slate-700 h-28 rounded-r-sm" />
                <div className="w-2.5 border-t-2 border-slate-700" />
              </div>
            </div>

            {/* Col 2: East Semis */}
            <div className="flex flex-col space-y-3 w-40">
              <div className="text-[11px] font-black uppercase text-blue-400 bg-blue-500/10 py-1 rounded border border-blue-500/20">
                东半决 (E-R2)
              </div>
              <div className="flex flex-col justify-around space-y-12 my-auto">
                {renderSeriesCard(eastR2Series[0], '等待首轮胜者')}
                {renderSeriesCard(eastR2Series[1], '等待首轮胜者')}
              </div>
            </div>

            {/* East Semis -> East Finals Connector */}
            <div className="flex items-center justify-center h-[340px]">
              <div className="w-2.5 border-t-2 border-r-2 border-b-2 border-slate-700 h-52 rounded-r-sm" />
              <div className="w-2.5 border-t-2 border-slate-700" />
            </div>

            {/* Col 3: East Finals */}
            <div className="flex flex-col space-y-3 w-40 my-auto">
              <div className="text-[11px] font-black uppercase text-blue-400 bg-blue-500/10 py-1 rounded border border-blue-500/20">
                东决 (E-R3)
              </div>
              <div className="my-auto">{renderSeriesCard(eastR3Series[0], '等待半决胜者')}</div>
            </div>

            {/* East Finals -> NBA Finals Line */}
            <div className="w-4 border-t-2 border-slate-700 my-auto" />

            {/* CENTER: NBA Finals */}
            <div className="flex flex-col space-y-3 w-44 bg-amber-500/5 p-2 rounded-2xl border border-amber-500/30 my-auto shadow-xl">
              <div className="text-[11px] font-black uppercase text-amber-300 bg-amber-500/20 py-1 rounded border border-amber-500/40 flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> 总决赛 (FINALS)
              </div>
              <div>{renderSeriesCard(finalsSeries, '等待东西部冠军')}</div>
            </div>

            {/* West Finals <- NBA Finals Line */}
            <div className="w-4 border-t-2 border-slate-700 my-auto" />

            {/* Col 5: West Finals */}
            <div className="flex flex-col space-y-3 w-40 my-auto">
              <div className="text-[11px] font-black uppercase text-purple-400 bg-purple-500/10 py-1 rounded border border-purple-500/20">
                西决 (W-R3)
              </div>
              <div className="my-auto">{renderSeriesCard(westR3Series[0], '等待半决胜者')}</div>
            </div>

            {/* West Finals <- West Semis Connector */}
            <div className="flex items-center justify-center h-[340px]">
              <div className="w-2.5 border-t-2 border-slate-700" />
              <div className="w-2.5 border-t-2 border-l-2 border-b-2 border-slate-700 h-52 rounded-l-sm" />
            </div>

            {/* Col 6: West Semis */}
            <div className="flex flex-col space-y-3 w-40">
              <div className="text-[11px] font-black uppercase text-purple-400 bg-purple-500/10 py-1 rounded border border-purple-500/20">
                西半决 (W-R2)
              </div>
              <div className="flex flex-col justify-around space-y-12 my-auto">
                {renderSeriesCard(westR2Series[0], '等待首轮胜者')}
                {renderSeriesCard(westR2Series[1], '等待首轮胜者')}
              </div>
            </div>

            {/* West Semis <- West R1 Connectors */}
            <div className="flex flex-col justify-around h-[340px]">
              {/* Connector Pair 1 */}
              <div className="flex items-center h-32">
                <div className="w-2.5 border-t-2 border-slate-700" />
                <div className="w-2.5 border-t-2 border-l-2 border-b-2 border-slate-700 h-28 rounded-l-sm" />
              </div>
              {/* Connector Pair 2 */}
              <div className="flex items-center h-32">
                <div className="w-2.5 border-t-2 border-slate-700" />
                <div className="w-2.5 border-t-2 border-l-2 border-b-2 border-slate-700 h-28 rounded-l-sm" />
              </div>
            </div>

            {/* Col 7: West R1 */}
            <div className="flex flex-col space-y-3 w-40">
              <div className="text-[11px] font-black uppercase text-purple-400 bg-purple-500/10 py-1 rounded border border-purple-500/20">
                西首轮 (W-R1)
              </div>
              <div className="flex flex-col space-y-3">
                {renderSeriesCard(westR1Series[0], '西部 1 vs 8')}
                {renderSeriesCard(westR1Series[1], '西部 4 vs 5')}
                {renderSeriesCard(westR1Series[2], '西部 3 vs 6')}
                {renderSeriesCard(westR1Series[3], '西部 2 vs 7')}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* REQUIREMENT 5: Playoff Honors Modal (季后赛荣誉款弹窗: NBA总冠军、FMVP、进入休赛期按钮) */}
      {showHonorsModal && champion && (() => {
        const fmvp = getFmvpWinner(champion);

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn overflow-y-auto">
            <div className="bg-[#11141b] border-2 border-amber-500/60 rounded-3xl max-w-2xl w-full p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl relative my-auto">
              
              {/* Header Title */}
              <div className="text-center space-y-1.5 sm:space-y-2 border-b border-[#232834] pb-3 sm:pb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {currentYear}-{currentYear + 1} 季后赛总决赛荣誉盛典
                </div>
                <h2 className="text-xl sm:text-3xl font-black italic uppercase text-white tracking-tight">
                  🏆 荣耀巅峰 · 冠军之夜
                </h2>
              </div>

              {/* Champion Card */}
              <div className="bg-gradient-to-br from-amber-500/15 via-[#181e2b] to-[#0d1017] p-3.5 sm:p-5 rounded-2xl border border-amber-500/40 space-y-2 sm:space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 shrink-0" /> NBA 总冠军 (CHAMPION)
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono text-slate-400 font-bold">
                    {champion.conference === 'East' ? '东部冠军' : '西部冠军'}
                  </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <TeamLogo
                    logo={champion.logo}
                    abbrev={champion.abbrev}
                    primaryColor={champion.primaryColor}
                    secondaryColor={champion.secondaryColor}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0"
                  />
                  <div>
                    <h3 className="text-lg sm:text-2xl font-black italic uppercase text-white">{champion.name}</h3>
                    <p className="text-[11px] sm:text-xs text-amber-300 font-mono mt-0.5 sm:mt-1">
                      {champion.id === userTeam.id ? '🎉 恭喜玩家率领团队加冕 NBA 总冠军！' : `🎉 ${champion.name} 夺得本赛季总冠军！`}
                    </p>
                  </div>
                </div>
              </div>

              {/* FMVP Card */}
              <div className="bg-[#181e2b] p-3.5 sm:p-5 rounded-2xl border border-amber-500/30 space-y-2.5 sm:space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 shrink-0" /> 总决赛 MVP (FMVP)
                  </span>
                  <span className="text-[9px] sm:text-xs font-mono text-amber-400 font-bold px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                    FINALS MVP
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-xl sm:text-2xl font-black shrink-0">
                      {fmvp.isUser ? '👑' : '⭐'}
                    </div>
                    <div>
                      <h4 className={`text-base sm:text-xl font-black ${fmvp.isUser ? 'text-amber-300' : 'text-white'}`}>
                        {fmvp.isUser ? `👑 ${fmvp.name}` : fmvp.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                        {fmvp.teamName} · {fmvp.position}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <div className="text-sm sm:text-base font-black text-amber-400">{fmvp.ppg} PPG</div>
                    <div className="text-[10px] sm:text-xs text-slate-400">{fmvp.rpg} RPG · {fmvp.apg} APG</div>
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-300 bg-[#0d1017] p-2.5 sm:p-3 rounded-xl border border-[#232834] leading-relaxed">
                  {fmvp.reason}
                </p>
              </div>

              {/* Requirement 5 Bottom Action Button: 进入休赛期 */}
              <div className="pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (fmvp.isUser) {
                      const existingFmvp = player.accolades?.find((a) => a.year === currentYear && a.type === 'FMVP');
                      if (!existingFmvp) {
                        player.accolades = [
                          ...(player.accolades || []),
                          {
                            year: currentYear,
                            seasonStr: `${currentYear}-${currentYear + 1}`,
                            title: `总决赛 FMVP`,
                            type: 'FMVP',
                            description: `荣膺 ${currentYear}-${currentYear + 1} 赛季 NBA 总决赛 FMVP`,
                          },
                        ];
                      }
                    }
                    if (champion && champion.id === userTeam.id) {
                      const existingChamp = player.accolades?.find((a) => a.year === currentYear && a.type === 'CHAMPION');
                      if (!existingChamp) {
                        player.accolades = [
                          ...(player.accolades || []),
                          {
                            year: currentYear,
                            seasonStr: `${currentYear}-${currentYear + 1}`,
                            title: `NBA总冠军`,
                            type: 'CHAMPION',
                            description: `随【${champion.name}】夺得 ${currentYear}-${currentYear + 1} 赛季 NBA 总冠军`,
                          },
                        ];
                      }
                    }
                    clearPlayoffStorage(currentYear);
                    setShowHonorsModal(false);
                    onFinishPlayoffs(champion, fmvp.name);
                  }}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black italic text-xs sm:text-sm rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
                >
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> 进入休赛期 (ENTER OFFSEASON) <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
