export const GAME_NAME = '篮坛传奇：重返2008';
export const LEAGUE_LOGO = './logos/league.svg';

/** Normalize historic copy and generated stories without changing save identifiers. */
export function brandText(text: string): string {
  return text
    .replace(/NBA\s*2K\s*2008(?:\s*MyCareer(?:\s*(?:Simulation Engine|Web Engine|Simulator))?)?/gi, GAME_NAME)
    .replace(/NBA\s*2K/gi, GAME_NAME)
    .replace(/NBA\s*联盟/gi, '联盟')
    .replace(/NBA/gi, '联盟');
}

export function normalizeBranding<T>(value: T): T {
  const visit = (item: unknown, key = ''): unknown => {
    if (typeof item === 'string') {
      if (item === './logos/lal.svg') return './logos/lal.png';
      if (/\/(?:nba)\.(?:png|svg)(?:[?#]|$)/i.test(item)) return LEAGUE_LOGO;
      // IDs, paths and award enums must keep their original values for compatibility.
      if (/^(?:id|type|key|handle|avatar|logo|logoUrl|currentTeamId|teamId)$/.test(key)) return item;
      if (/^[a-z0-9_]+$/i.test(item) && key !== 'name') return item;
      return brandText(item);
    }
    if (Array.isArray(item)) return item.map(entry => visit(entry, key));
    if (item && typeof item === 'object') {
      return Object.fromEntries(Object.entries(item).map(([name, entry]) => [name, visit(entry, name)]));
    }
    return item;
  };
  return visit(value) as T;
}
