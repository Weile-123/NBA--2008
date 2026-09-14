export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export type Archetype = string;

export interface Attributes {
  midRange: number;      // 中投
  threePoint: number;    // 三分
  freeThrow: number;     // 罚球
  layup: number;         // 上篮
  dunk: number;          // 扣篮
  insideFinish: number;  // 终结
  postMove: number;      // 背身
  ballHandle: number;    // 控球
  passing: number;       // 传球
  perimeterDef: number;  // 外线防守
  interiorDef: number;   // 内线防守
  block: number;         // 盖帽
  steal: number;         // 抢断
  rebounding: number;    // 篮板
  speed: number;         // 速度
  vertical: number;      // 弹跳
  strength: number;      // 力量
  stamina: number;       // 耐力/体能
}

export interface AttributeCaps {
  midRange: number;
  threePoint: number;
  freeThrow: number;
  layup: number;
  dunk: number;
  insideFinish: number;
  postMove: number;
  ballHandle: number;
  passing: number;
  perimeterDef: number;
  interiorDef: number;
  block: number;
  steal: number;
  rebounding: number;
  speed: number;
  vertical: number;
  strength: number;
  stamina: number;
}

export interface Accolade {
  year: number;
  seasonStr: string;
  title: string;
  type:
    | 'ROY'
    | 'MVP'
    | 'FMVP'
    | 'CHAMPION'
    | 'ALL_NBA'
    | 'ALL_STAR'
    | 'DPOY'
    | 'SCORING_TITLE'
    | 'SIXTH_MAN'
    | 'ALL_NBA_1ST'
    | 'ALL_NBA_2ND'
    | 'ALL_NBA_3RD'
    | 'ALL_DEFENSE_1ST'
    | 'ALL_DEFENSE_2ND'
    | 'MILESTONE_NO1'
    | 'MILESTONE_TOP3'
    | string;
  description?: string;
}

export interface Contract {
  salaryPerYear: number;
  yearsLeft: number;
  totalYears: number;
  isRookieContract: boolean;
}

export interface PlayerStats {
  games: number;
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
  minutes: number;
  gamesStarted: number;
  turnovers: number;
  offReb: number;
  defReb: number;
}

export interface Endorsement {
  id: string;
  brand: string;
  category: string;
  categoryLabel?: string;
  perSeasonPay: number;
  requiredOvr: number;
  requiredFans: number;
  unlocked: boolean;
  description: string;
  logo: string;
  logoUrl?: string;
  rewardDesc: string;
  rewardAttributes?: Partial<Attributes>;
  rewardFans?: number;
}

export interface SignatureShoe {
  name: string;
  brand: string;
  color1: string;
  color2: string;
  boostAttr: keyof Attributes;
  boostVal: number;
}

export interface InjuryStatus {
  status: 'healthy' | 'injured';
  injuryName?: string;
  /** Remaining scheduled games the player must miss. */
  gamesRemaining?: number;
  /** Prevents another injury roll for this many played games after returning. */
  cooldownGames?: number;
  /** The simplified system allows at most one injury per season. */
  occurredThisSeason?: boolean;
  // Legacy save fields kept optional so older saves continue to load safely.
  severity?: 'minor' | 'moderate' | 'severe';
  daysRemaining?: number;
  attrPenalty?: number;
}

export interface PersonalAsset {
  id: string;
  name: string;
  category: 'device' | 'project' | 'team' | 'life' | 'investment';
  categoryLabel: string;
  cost: number;
  requiredOvr?: number;
  requiredFans?: number;
  description: string;
  logo: string;
  rewardDesc: string;
  rewardAttributes?: Partial<Attributes>;
}

export interface PlayerProfile {
  id?: string;
  name: string;
  number?: string;
  nationality?: string;
  birthplace?: string;
  familyBackground?: string;
  basketballIdol?: string;
  jerseyNum: number;
  height: string;
  weight: string;
  position: Position;
  archetype: Archetype;
  attributes: Attributes;
  attributeCaps: AttributeCaps;
  ovr: number;
  skillPoints: number;
  /** Refunded attribute points that may be reassigned even while the age-based OVR cap is reached. */
  attributeRedistributionPoints?: number;
  xp: number;
  maxXp: number;
  level: number;
  money: number;
  energy: number;       // 0-100
  morale: number;       // 0-100
  health: InjuryStatus;
  currentTeamId: string;
  favoriteTeamId?: string;
  draftPick: number;
  draftYear: number;
  contract: Contract;
  careerStats: PlayerStats;
  seasonStats: PlayerStats;
  accolades: Accolade[];
  endorsements: Endorsement[];
  signatureShoe: SignatureShoe | null;
  fansCount: number;
  mediaReputation: number; // 0-100
  purchasedAssetIds?: string[];
  majorAssetPurchaseYear?: number;
  lastAgePenalty?: number;
  age?: number;
  peakAge?: number;
  peakOvr?: number;
  peakOvrTracked?: boolean;
  peakDuration?: number;
  adRewardUses?: number;
  freeAgencyOfferRefreshUsed?: boolean;
  tradeOfferRefreshUsed?: boolean;
  starInvitationUsedYear?: number;
  starInvitationCount?: number;
  starInvitationYears?: number[];
  invitedStarPlayerIds?: string[];
  isRookie?: boolean;
}

export interface CategoryRatings {
  scoringRating?: number;     // 得分综评
  reboundRating?: number;     // 篮板综评
  playmakingRating?: number;  // 助攻/组织综评
  stealRating?: number;       // 抢断/外防综评
  blockRating?: number;       // 盖帽/护筐综评
}

export interface RosterPlayer {
  id: string;
  name: string;
  position: Position;
  number?: string;
  ovr: number;
  // 专项综评（可选，未填时自动按球员位置和总评智能衍生）
  scoringRating?: number;     // 得分综评
  reboundRating?: number;     // 篮板综评
  playmakingRating?: number;  // 助攻/组织综评
  stealRating?: number;       // 抢断综评
  blockRating?: number;       // 盖帽综评
  categoryRatings?: CategoryRatings;
  age?: number;
  peakAge?: number;
  peakOvr?: number;
  peakDuration?: number;
  isStar?: boolean;
  isHallOfFamer?: boolean;
  isRookie?: boolean;
  role?: '战术核心' | '绝对首发' | '第六人' | '轮换替补' | '饮水机守门员' | string;
  minutes?: number;
  tradeProtectionUntilYear?: number;
  acquisitionSource?: 'star_invitation' | 'destiny_event';
  stats?: {
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    fgPct: number;
    mpg?: number;
  };
}

export type TeamStrategy = 'contender' | 'playoff' | 'retooling' | 'rebuilding';

export interface Team {
  id: string;
  name: string;
  city: string;
  abbrev: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  rating: number;
  conference: 'East' | 'West';
  starPlayer: string;
  wins: number;
  losses: number;
  roster: RosterPlayer[];
  strategy?: TeamStrategy;
  strategyScore?: number;
  strategySinceYear?: number;
  strategyUpdatedYear?: number;
  strategyModelVersion?: number;
  previousSeasonWins?: number;
  previousSeasonRating?: number;
  lastTradeYear?: number;
}

export interface MatchLog {
  id: string;
  quarter: number;
  time: string;
  text: string;
  type: 'home' | 'away' | 'user' | 'clutch' | 'highlight' | 'injury';
  points?: number;
}

export interface MatchBoxScore {
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
    minutes: number;
    turnovers: number;
    ratingGrade: 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D';
  };
  userTeamScore: number;
  opponentScore: number;
  userTeamId: string;
  opponentTeamId: string;
  isPlayoffs: boolean;
  playoffRound?: string;
  logs: MatchLog[];
  challengesCompleted: string[];
  rewardSkillPoints: number;
  rewardMoney: number;
  rewardFans?: number;
  rewardXp?: number;
  isBuzzerBeaterWin?: boolean;
}

export interface SocialTweet {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  retweets: number;
  userReplied?: boolean;
}

export interface HistoricalSeason {
  year: number;
  seasonStr: string;
  headline: string;
  realChampion: string;
  realMVP: string;
  realROY: string;
  description: string;
  majorEvents: string[];
}

export interface SingleGamePlayerStats {
  id: string;
  name: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  number?: string;
  ovr: number;
  isUser?: boolean;
  isStar?: boolean;
  dnpReason?: string;
  minutes: number;
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
}

export interface MatchRosterStats {
  homeTeamId: string;
  homeTeamName: string;
  homeScore: number;
  homePlayers: SingleGamePlayerStats[];
  awayTeamId: string;
  awayTeamName: string;
  awayScore: number;
  awayPlayers: SingleGamePlayerStats[];
}

export interface ScheduleItem {
  week: number;
  gameNumber?: number;
  opponentId: string;
  isHome: boolean;
  isPlayed: boolean;
  userWon?: boolean;
  userScore?: number;
  oppScore?: number;
  boxScore?: MatchBoxScore;
  rosterStats?: MatchRosterStats;
}

export interface GameState {
  currentYear: number;       // Start 2008
  currentSeasonWeek: number; // 1 to 24 (Week 1-20 Regular season, 21-24 Playoffs)
  currentGame?: number;      // Game 1..82
  isPlayoffs: boolean;
  playoffRound: number;      // 1: First round, 2: Semis, 3: Conf Finals, 4: Finals
  playoffSeriesWins: number;
  playoffSeriesLosses: number;
  playoffOpponentId: string | null;
  phase: 'home' | 'creation' | 'scout_draft' | 'draft' | 'contract_signing' | 'regular_season' | 'match_sim' | 'post_match' | 'season_end' | 'offseason' | 'hall_of_fame' | 'legendary_hof';
  player: PlayerProfile;
  teams: Team[];
  schedule: ScheduleItem[];
  tweets: SocialTweet[];
  lastMatchResult: MatchBoxScore | null;
  careerHistory: {
    year: number;
    seasonStr: string;
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    fgPct: number;
    ovr?: number;
    accoladesEarned: string[];
  }[];
  leagueHistory?: {
    year: number;
    seasonStr: string;
    champion: string;
    championId: string;
    mvp: string;
    scoringLeader?: string;
    fmvp: string;
    dpoy: string;
    roy: string;
    championRosterPlayerIds?: string[];
    championRosterPlayerNames?: string[];
  }[];
}

export interface RetiredPlayerRecord {
  id: string;
  /** Missing on legacy records; those records always belong to classic mode. */
  gameMode?: 'classic' | 'random_trade';
  unlockedDestinyEvents?: {
    eventId: string;
    title: string;
    year: number;
    result: string;
    routeTitle?: string;
  }[];
  retireDate: string;
  player: {
    name: string;
    position: Position;
    archetype?: string;
    height?: number;
    weight?: number;
    draftYear?: number;
    draftPick?: number;
    birthplace?: string;
    jerseyNum?: number;
  };
  retireAge: number;
  peakOvr: number;
  peakOvrTracked?: boolean;
  finalOvr: number;
  goatScore: number;
  seasonsPlayed: number;
  startYear: number;
  endYear: number;
  totalGames: number;
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  avgPpg: number;
  avgRpg: number;
  avgApg: number;
  careerAccolades: {
    championships: number;
    mvps: number;
    fmvps: number;
    dpoys: number;
    roys: number;
    scoringTitles: number;
    allStarApps: number;
    allNbaFirsts: number;
    allNbaSeconds: number;
    allNbaThirds: number;
    hallOfFame: boolean;
  };
  retiredJerseys: {
    teamId: string;
    teamName: string;
    primaryColor?: string;
    secondaryColor?: string;
    seasonsCount: number;
    jerseyNum: number;
    reasons: string[];
  }[];
  timeline: {
    year: number;
    seasonStr: string;
    teamId: string;
    teamName: string;
    wins: number;
    losses: number;
    ppg: number;
    rpg: number;
    apg: number;
    accolades: string[];
  }[];
  /** Legacy imported records may contain this field; it is no longer rendered. */
  epilogueStory?: string;
}
