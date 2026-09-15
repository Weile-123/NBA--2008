export interface FinalsGameStatLine {
  playerStats: {
    pts: number;
    reb: number;
    ast: number;
  };
}

export interface FinalsAverages {
  games: number;
  ppg: number;
  rpg: number;
  apg: number;
}

export function calculateFinalsAverages(games: FinalsGameStatLine[]): FinalsAverages | null {
  if (games.length === 0) return null;

  const totals = games.reduce(
    (sum, game) => ({
      pts: sum.pts + game.playerStats.pts,
      reb: sum.reb + game.playerStats.reb,
      ast: sum.ast + game.playerStats.ast,
    }),
    { pts: 0, reb: 0, ast: 0 },
  );

  return {
    games: games.length,
    ppg: totals.pts / games.length,
    rpg: totals.reb / games.length,
    apg: totals.ast / games.length,
  };
}
