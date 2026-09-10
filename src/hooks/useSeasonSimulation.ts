import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../types';
import { MatchBoxScore,PlayerProfile,Team } from '../types';
import { calculateMatchScores,calculateTeamPowerRating,calculateTeamUsageContext,calcWinProbability,generateFullMatchRosterStats,getUserMinutesAndRole,simulatePlayerMatchStats } from '../utils/leagueLogic';
import { generateTweets } from '../utils/proceduralEngine';

import { MilestoneTrigger } from '../data/milestonesData';


interface SeasonSimulationContext {
  player: PlayerProfile | null;
  currentSeasonWeek: number;
  teams: Team[];
  schedule: GameState['schedule'];
  currentYear: number;
  setTeams: Dispatch<SetStateAction<Team[]>>;
  setSchedule: Dispatch<SetStateAction<GameState['schedule']>>;
  setPlayer: Dispatch<SetStateAction<PlayerProfile | null>>;
  setCurrentSeasonWeek: Dispatch<SetStateAction<number>>;
  setIsPlayoffs: Dispatch<SetStateAction<boolean>>;
  careerHistory: GameState['careerHistory'];
  checkAndApplyMilestones: (oldStats: PlayerProfile['careerStats'], newStats: PlayerProfile['careerStats'], player: PlayerProfile, year: number) => { updatedPlayer: PlayerProfile; triggeredMilestone: MilestoneTrigger | null };
  setActiveMilestoneModal: Dispatch<SetStateAction<MilestoneTrigger | null>>;
  setIsInteractiveMatch: Dispatch<SetStateAction<boolean>>;
  setPhase: Dispatch<SetStateAction<GameState['phase']>>;
  setLastMatchResult: Dispatch<SetStateAction<MatchBoxScore | null>>;
  setTweets: Dispatch<SetStateAction<GameState['tweets']>>;
}

export function useSeasonSimulation({
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
}: SeasonSimulationContext) {
  const currentTeam = teams.find((team) => team.id === player?.currentTeamId) || teams[0];
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


  return { handleSimulateFullSeason, handleStartMatch, handleFinishMatch, handlePostMatchContinue };
}
