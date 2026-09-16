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

export interface FinalsMvpCandidate {
  id: string;
  ovr: number;
  isUser?: boolean;
  stats?: { ppg: number; rpg: number; apg: number };
}

/** 27+ Finals PPG guarantees the user FMVP; otherwise retain the old OVR draw. */
export function selectFinalsMvp<T extends FinalsMvpCandidate>(
  candidates: T[], userId: string, userFinals: FinalsAverages | null, draw: number = 0,
): T | undefined {
  if (!candidates.length) return undefined;
  const user = candidates.find((candidate) => candidate.isUser || candidate.id === userId);
  if (user && userFinals && userFinals.games >= 4 && userFinals.ppg >= 27) return user;
  const [first, second] = [...candidates].sort((a, b) => b.ovr - a.ovr);
  if (!second || first.ovr - second.ovr > 5) return first;
  return draw < 90 ? first : second;
}
