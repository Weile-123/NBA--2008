import { brandText, LEAGUE_LOGO } from '../utils/branding';
import React, { useState } from 'react';
import { NBA_TEAMS_2008 } from '../data/nbaData2008';

const ESPN_LOGO_MAP: Record<string, string> = {
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

const DEFAULT_LEAGUE_LOGO = LEAGUE_LOGO;

interface TeamLogoProps {
  team?: {
    id?: string;
    logo?: string;
    name?: string;
    abbrev?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  teamId?: string;
  logo?: string;
  name?: string;
  abbrev?: string;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  team,
  teamId,
  logo,
  name,
  abbrev,
  className,
  alt,
  size,
}) => {
  const [hasError, setHasError] = useState(false);

  const matchedTeam = (teamId || team?.id)
    ? NBA_TEAMS_2008.find(
      (t) =>
        t.id.toLowerCase() === (teamId || team?.id || '').toLowerCase() ||
        t.abbrev.toLowerCase() === (teamId || team?.id || '').toLowerCase()
    )
    : undefined;

  const finalLogo = logo || team?.logo || matchedTeam?.logo;
  const finalAbbrev = (
    abbrev ||
    team?.abbrev ||
    matchedTeam?.abbrev ||
    teamId ||
    team?.id ||
    ''
  ).toUpperCase();
  const finalAlt =
    alt || name || team?.name || matchedTeam?.name || finalAbbrev || '联盟球队图标';

  let sizeClass = 'w-8 h-8 object-contain';
  if (size === 'xs') sizeClass = 'w-5 h-5 object-contain shrink-0';
  else if (size === 'sm') sizeClass = 'w-6 h-6 object-contain shrink-0';
  else if (size === 'md') sizeClass = 'w-8 h-8 object-contain shrink-0';
  else if (size === 'lg') sizeClass = 'w-12 h-12 object-contain shrink-0';

  const finalClassName = className || sizeClass;

  // Primary source: team.logo or ESPN CDN matching abbrev
  let primarySource = finalLogo;
  if (!primarySource || primarySource.startsWith('./logos/')) {
    primarySource = ESPN_LOGO_MAP[finalAbbrev] || DEFAULT_LEAGUE_LOGO;
  }

  const currentSource = hasError
    ? ESPN_LOGO_MAP[finalAbbrev] || DEFAULT_LEAGUE_LOGO
    : primarySource;

  return (
    <img
      src={/\/nba\.(png|svg)([?#]|$)/i.test(currentSource || '') ? LEAGUE_LOGO : currentSource}
      alt={brandText(finalAlt)}
      className={finalClassName}
      referrerPolicy="no-referrer"
      onError={() => {
        if (!hasError) setHasError(true);
      }}
    />
  );
};
