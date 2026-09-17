import type { PlayerProfile, PlayerStats } from '../types';

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

const emptyStats = (): PlayerStats => ({
  games: 0, gamesStarted: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
  fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
  minutes: 0, turnovers: 0, offReb: 0, defReb: 0,
});

function addGame(totals: PlayerStats, game: CareerPlayoffGame): void {
  const stats = game.playerStats;
  totals.games += 1;
  totals.gamesStarted = (totals.gamesStarted || 0) + (game.started ? 1 : 0);
  for (const key of ['pts', 'reb', 'ast', 'stl', 'blk', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'turnovers', 'minutes', 'offReb', 'defReb'] as const) {
    totals[key] = (totals[key] || 0) + (stats[key] || 0);
  }
}

/** Assign playoff games from a cached in-progress legacy bracket to the current year without re-adding them to career totals. */
export function migrateLegacyPlayoffGamesForYear(player: PlayerProfile, cachedGames: CareerPlayoffGame[], year: number): PlayerProfile {
  if (player.playoffStatsByYear?.[year] || cachedGames.length === 0) return player;
  const settledIds = new Set(player.playoffStatGameIds || []);
  const legacyGames = cachedGames.filter((game) => settledIds.has(game.id) && !settledIds.has(`${year}:${game.id}`));
  if (legacyGames.length === 0) return player;
  const seasonStats = emptyStats();
  for (const game of legacyGames) {
    addGame(seasonStats, game);
    settledIds.add(`${year}:${game.id}`);
  }
  return {
    ...player,
    playoffStatsByYear: { ...(player.playoffStatsByYear || {}), [year]: seasonStats },
    playoffStatGameIds: [...settledIds],
  };
}

export function applyPlayoffGamesToCareer(player: PlayerProfile, games: CareerPlayoffGame[], year?: number): PlayerProfile {
  const settledIds = new Set(player.playoffStatGameIds || []);
  const unsettled = games.filter((game) => game.id && !settledIds.has(year === undefined ? game.id : `${year}:${game.id}`));
  if (unsettled.length === 0) return player;

  const careerStats = { ...player.careerStats };
  const playoffStatsByYear = { ...(player.playoffStatsByYear || {}) };
  const seasonStats = year === undefined ? null : { ...(playoffStatsByYear[year] || emptyStats()) };
  for (const game of unsettled) {
    for (const totals of [careerStats, seasonStats].filter((item): item is PlayerStats => item !== null)) {
      addGame(totals, game);
    }
    settledIds.add(year === undefined ? game.id : `${year}:${game.id}`);
  }
  if (year !== undefined && seasonStats) playoffStatsByYear[year] = seasonStats;
  return { ...player, careerStats, playoffStatsByYear, playoffStatGameIds: [...settledIds] };
}
