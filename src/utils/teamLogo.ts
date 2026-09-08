/**
 * Official Real Team Logo Mapping for NBA Teams
 */

export const REAL_TEAM_LOGO_MAP: Record<string, string> = {
  BOS: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
  LAL: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg',
  CLE: 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png',
  ORL: 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png',
  HOU: 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png',
  SAS: 'https://a.espncdn.com/i/teamlogos/nba/500/sas.png',
  DEN: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
  POR: 'https://a.espncdn.com/i/teamlogos/nba/500/por.png',
  DAL: 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png',
  PHX: 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png',
  UTA: 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png',
  NOH: 'https://a.espncdn.com/i/teamlogos/nba/500/no.png',
  NOP: 'https://a.espncdn.com/i/teamlogos/nba/500/no.png',
  ATL: 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png',
  MIA: 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png',
  CHI: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png',
  PHI: 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png',
  DET: 'https://a.espncdn.com/i/teamlogos/nba/500/det.png',
  TOR: 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png',
  NJN: 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png',
  BKN: 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png',
  IND: 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png',
  MIL: 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png',
  WAS: 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png',
  WSH: 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png',
  SAC: 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png',
  CHA: 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png',
  LAC: 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png',
  MEM: 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png',
  MIN: 'https://a.espncdn.com/i/teamlogos/nba/500/min.png',
  OKC: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
  NYK: 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png',
  GSW: 'https://a.espncdn.com/i/teamlogos/nba/500/gsw.png',
};

export function getRealTeamLogoUrl(abbrev: string): string {
  const safeAbbrev = (abbrev || '').toUpperCase();
  return REAL_TEAM_LOGO_MAP[safeAbbrev] || 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png';
}

export function getTeamLogoSvgDataUrl(
  abbrev: string,
  _primaryColor?: string,
  _secondaryColor?: string
): string {
  return getRealTeamLogoUrl(abbrev);
}
