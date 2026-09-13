import type { MatchBoxScore, Team } from '../types';

export interface InteractivePlayoffSeries {
  teamA: Team;
  teamB: Team;
  winsA: number;
  winsB: number;
  winnerId?: string;
  lastUserGame?: {
    teamAId: string;
    teamBId: string;
    teamAScore: number;
    teamBScore: number;
    playerStats: MatchBoxScore['playerStats'];
  };
}

export function getUserPlayoffStatus(
  seriesList: Pick<InteractivePlayoffSeries, 'teamA' | 'teamB' | 'winnerId'>[],
  userTeamId: string,
) {
  const userSeries = seriesList.filter(
    (series) => series.teamA.id === userTeamId || series.teamB.id === userTeamId
  );
  const madePlayoffs = userSeries.length > 0;
  const wasEliminated = userSeries.some(
    (series) => !!series.winnerId && series.winnerId !== userTeamId
  );

  return {
    madePlayoffs,
    wasEliminated,
    isAlive: madePlayoffs && !wasEliminated,
  };
}

export function settleInteractivePlayoffGame<T extends InteractivePlayoffSeries>(
  series: T,
  userTeamId: string,
  boxScore: MatchBoxScore,
): T {
  if (boxScore.userTeamScore === boxScore.opponentScore) return series;

  const userIsTeamA = series.teamA.id === userTeamId;
  const userWon = boxScore.userTeamScore > boxScore.opponentScore;
  const winsA = series.winsA + (userWon === userIsTeamA ? 1 : 0);
  const winsB = series.winsB + (userWon === userIsTeamA ? 0 : 1);

  return {
    ...series,
    winsA,
    winsB,
    winnerId: winsA >= 4 ? series.teamA.id : winsB >= 4 ? series.teamB.id : undefined,
    lastUserGame: {
      teamAId: series.teamA.id,
      teamBId: series.teamB.id,
      teamAScore: userIsTeamA ? boxScore.userTeamScore : boxScore.opponentScore,
      teamBScore: userIsTeamA ? boxScore.opponentScore : boxScore.userTeamScore,
      playerStats: boxScore.playerStats,
    },
  };
}
