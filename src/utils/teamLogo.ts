/**
 * Official Real Team Logo Mapping for NBA Teams
 */

export const REAL_TEAM_LOGO_MAP: Record<string, string> = {
  BOS: './logos/bos.png',
  LAL: './logos/lal.png',
  CLE: './logos/cle.png',
  ORL: './logos/orl.png',
  HOU: './logos/hou.png',
  SAS: './logos/sas.png',
  DEN: './logos/den.png',
  POR: './logos/por.png',
  DAL: './logos/dal.png',
  PHX: './logos/phx.png',
  UTA: './logos/utah.png',
  NOH: './logos/nop.png',
  NOP: './logos/nop.png',
  ATL: './logos/atl.png',
  MIA: './logos/mia.png',
  CHI: './logos/chi.png',
  PHI: './logos/phi.png',
  DET: './logos/det.png',
  TOR: './logos/tor.png',
  NJN: './logos/bkn.png',
  BKN: './logos/bkn.png',
  IND: './logos/ind.png',
  MIL: './logos/mil.png',
  WAS: './logos/wsh.png',
  WSH: './logos/wsh.png',
  SAC: './logos/sac.png',
  CHA: './logos/cha.png',
  LAC: './logos/lac.png',
  MEM: './logos/mem.png',
  MIN: './logos/min.png',
  OKC: './logos/okc.png',
  NYK: './logos/ny.png',
  GSW: './logos/gsw.png',
};

export function getRealTeamLogoUrl(abbrev: string): string {
  const safeAbbrev = (abbrev || '').toUpperCase();
  return REAL_TEAM_LOGO_MAP[safeAbbrev] || './logos/league.svg';
}

export function getTeamLogoSvgDataUrl(
  abbrev: string,
  _primaryColor?: string,
  _secondaryColor?: string
): string {
  return getRealTeamLogoUrl(abbrev);
}
