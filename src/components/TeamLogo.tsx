import React, { useState } from 'react';
import { NBA_TEAMS_2008 } from '../data/nbaData2008';

const ESPN_LOGO_MAP: Record<string, string> = {
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

const DEFAULT_NBA_LOGO = 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png';

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
    alt || name || team?.name || matchedTeam?.name || finalAbbrev || 'NBA Team Logo';

  let sizeClass = 'w-8 h-8 object-contain';
  if (size === 'xs') sizeClass = 'w-5 h-5 object-contain shrink-0';
  else if (size === 'sm') sizeClass = 'w-6 h-6 object-contain shrink-0';
  else if (size === 'md') sizeClass = 'w-8 h-8 object-contain shrink-0';
  else if (size === 'lg') sizeClass = 'w-12 h-12 object-contain shrink-0';

  const finalClassName = className || sizeClass;

  // Primary source: team.logo or ESPN CDN matching abbrev
  let primarySource = finalLogo;
  if (!primarySource || primarySource.startsWith('/logos/')) {
    primarySource = ESPN_LOGO_MAP[finalAbbrev] || DEFAULT_NBA_LOGO;
  }

  const currentSource = hasError
    ? ESPN_LOGO_MAP[finalAbbrev] || DEFAULT_NBA_LOGO
    : primarySource;

  return (
    <img
      src={currentSource}
      alt={finalAlt}
      className={finalClassName}
      referrerPolicy="no-referrer"
      onError={() => {
        if (!hasError) setHasError(true);
      }}
    />
  );
};
