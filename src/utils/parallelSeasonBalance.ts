import type { GameMode } from '../gameMode';
import type { Team } from '../types';
import { calculateTeamPowerRating } from './leagueLogic';

const PRE_DECISION_CAVALIERS_PENALTY = 2;

export function getSeasonSimulationPowerRating(team: Team, gameMode: GameMode, currentYear: number): number {
  const rating = calculateTeamPowerRating(team);
  if (gameMode === 'random_trade' && team.id === 'cle' && currentYear >= 2008 && currentYear <= 2009) {
    return Math.max(65, rating - PRE_DECISION_CAVALIERS_PENALTY);
  }
  return rating;
}
