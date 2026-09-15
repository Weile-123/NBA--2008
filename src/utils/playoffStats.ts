import type { PlayerProfile } from '../types';

export interface CareerPlayoffGame {
  id: string;
  started?: boolean;
  playerStats: {
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    fgm: number;
    fga: number;
    tpm: number;
    tpa: number;
    ftm: number;
    fta: number;
    turnovers: number;
    minutes: number;
    offReb?: number;
    defReb?: number;
  };
}

export function applyPlayoffGamesToCareer(player: PlayerProfile, games: CareerPlayoffGame[]): PlayerProfile {
  const settledIds = new Set(player.playoffStatGameIds || []);
  const unsettled = games.filter((game) => game.id && !settledIds.has(game.id));
  if (unsettled.length === 0) return player;

  const careerStats = { ...player.careerStats };
  for (const game of unsettled) {
    const stats = game.playerStats;
    careerStats.games += 1;
    careerStats.gamesStarted = (careerStats.gamesStarted || 0) + (game.started ? 1 : 0);
    careerStats.pts += stats.pts;
    careerStats.reb += stats.reb;
    careerStats.ast += stats.ast;
    careerStats.stl += stats.stl;
    careerStats.blk += stats.blk;
    careerStats.fgm += stats.fgm;
    careerStats.fga += stats.fga;
    careerStats.tpm += stats.tpm;
    careerStats.tpa += stats.tpa;
    careerStats.ftm += stats.ftm;
    careerStats.fta += stats.fta;
    careerStats.turnovers = (careerStats.turnovers || 0) + stats.turnovers;
    careerStats.minutes = (careerStats.minutes || 0) + stats.minutes;
    careerStats.offReb = (careerStats.offReb || 0) + (stats.offReb || 0);
    careerStats.defReb = (careerStats.defReb || 0) + (stats.defReb || 0);
    settledIds.add(game.id);
  }

  return { ...player, careerStats, playoffStatGameIds: [...settledIds] };
}
