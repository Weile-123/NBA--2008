import { Team, PlayerProfile, Position, RosterPlayer } from '../types';
import { calculateExpectedPpg36, enrichRosterPlayer, getCompleteTeamRoster } from './leagueLogic';
import { getHistoricalDraftData } from '../data/draftData';

export interface AwardWinner {
  id: string;
  name: string;
  position: Position;
  teamName: string;
  teamAbbrev: string;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  isUser: boolean;
  probabilityPct?: number;
  reason?: string;
}

export interface AllTeamSelection {
  teamIndex: 1 | 2 | 3;
  label: string; // e.g. "最佳阵容一阵"
  players: AwardWinner[];
}

export interface SeasonAwards {
  mvp: AwardWinner;
  scoringLeader: AwardWinner;
  dpoy: AwardWinner;
  sixthMan: AwardWinner;
  roy: AwardWinner;
  allNbaTeams: AllTeamSelection[];
  allDefensiveTeams: AllTeamSelection[];
  allRookieTeams: AllTeamSelection[];
  userMadePlayoffs: boolean;
  userTeamSeed?: number;
  userTeamConference?: 'East' | 'West';
  playoffTeams: {
    east: Team[];
    west: Team[];
  };
}

export interface EvaluatedPlayer {
  id: string;
  name: string;
  position: Position;
  teamId: string;
  teamName: string;
  teamAbbrev: string;
  conference: 'East' | 'West';
  teamWins: number;
  teamConferenceRank: number;
  isPlayoffTeam: boolean;
  isTop5Seed: boolean;
  ovr: number;
  role: string;
  isUser: boolean;
  isRookie: boolean;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  minutes: number;
  // Score metrics
  statScore: number;
  mvpScore: number;
  defensiveScore: number;
  sixthManScore: number;
  rookieScore: number;
}

/**
 * Hash string to derive a stable pseudo-random float between 0.80 and 1.20
 */
function getPlayerVariance(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const norm = (Math.abs(hash) % 11) / 100; // 0.00 to 0.10
  return 0.95 + norm; // 0.95 to 1.05
}

let currentSeed = 12345;

function setSeed(val: number) {
  currentSeed = val;
}

function seededRandom(): number {
  let t = (currentSeed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Weighted random selector from an array of items with weights
 */
function weightedRandomSelect<T>(items: { item: T; weight: number }[]): { selected: T; probPct: number } {
  if (!items || items.length === 0) {
    return { selected: null as unknown as T, probPct: 0 };
  }
  const totalWeight = items.reduce((sum, i) => sum + Math.max(0.001, i.weight), 0);
  let rand = seededRandom() * totalWeight;

  for (const entry of items) {
    const w = Math.max(0.001, entry.weight);
    rand -= w;
    if (rand <= 0) {
      return {
        selected: entry.item,
        probPct: +((w / totalWeight) * 100).toFixed(1),
      };
    }
  }

  const fallback = items[0];
  const w = Math.max(0.001, fallback.weight);
  return {
    selected: fallback.item,
    probPct: +((w / totalWeight) * 100).toFixed(1),
  };
}

/**
 * Evaluates all players across all 30 NBA teams and user player
 */
export function evaluateAllLeaguePlayers(
  teams: Team[],
  userPlayer: PlayerProfile,
  currentYear: number = 2008
): {
  allPlayers: EvaluatedPlayer[];
  playoffTeamIds: Set<string>;
  eastPlayoffTeams: Team[];
  westPlayoffTeams: Team[];
} {
  const seasonIndex = currentYear - 2007;

  // Determine conference playoff teams (Top 8 in East & Top 8 in West by wins)
  const eastTeams = teams.filter((t) => t.conference === 'East').sort((a, b) => b.wins - a.wins || b.rating - a.rating);
  const westTeams = teams.filter((t) => t.conference === 'West').sort((a, b) => b.wins - a.wins || b.rating - a.rating);

  const eastPlayoffTeams = eastTeams.slice(0, 8);
  const westPlayoffTeams = westTeams.slice(0, 8);

  const eastTop6Teams = eastTeams.slice(0, 6);
  const westTop6Teams = westTeams.slice(0, 6);

  const playoffTeamIds = new Set<string>([
    ...eastPlayoffTeams.map((t) => t.id),
    ...westPlayoffTeams.map((t) => t.id),
  ]);

  const top6TeamIds = new Set<string>([
    ...eastTop6Teams.map((t) => t.id),
    ...westTop6Teams.map((t) => t.id),
  ]);

  // Fetch current year historical draft data for strictly identifying true rookies
  const currentDraftData = getHistoricalDraftData(currentYear);
  const currentDraftRookieNames = new Set<string>();
  if (currentDraftData && currentDraftData.draftPicks) {
    currentDraftData.draftPicks.forEach((item) => currentDraftRookieNames.add(item.player.name));
  }

  const allPlayers: EvaluatedPlayer[] = [];

  for (const team of teams) {
    const isUserTeam = userPlayer.currentTeamId === team.id;
    const isPlayoffTeam = playoffTeamIds.has(team.id);
    const isTop5Seed = top6TeamIds.has(team.id);

    const confRankList = team.conference === 'East' ? eastTeams : westTeams;
    const teamConferenceRank = confRankList.findIndex((t) => t.id === team.id) + 1 || 8;

    // Get roster
    const { roster } = getCompleteTeamRoster(team, userPlayer, seasonIndex);

    for (const p of roster) {
      const isUser = !!p.isUser || p.id === userPlayer.id;

      let ppg = p.stats?.ppg || 10;
      let rpg = p.stats?.rpg || 3;
      let apg = p.stats?.apg || 2;
      let spg = p.stats?.spg || 0.8;
      let bpg = p.stats?.bpg || 0.4;
      let fgPct = p.stats?.fgPct || 45;
      let minutes = p.minutes || 20;

      if (isUser && userPlayer.seasonStats && userPlayer.seasonStats.games > 0) {
        const gp = userPlayer.seasonStats.games;
        ppg = +(userPlayer.seasonStats.pts / gp).toFixed(1);
        rpg = +(userPlayer.seasonStats.reb / gp).toFixed(1);
        apg = +(userPlayer.seasonStats.ast / gp).toFixed(1);
        spg = +(userPlayer.seasonStats.stl / gp).toFixed(1);
        bpg = +(userPlayer.seasonStats.blk / gp).toFixed(1);
        fgPct = userPlayer.seasonStats.fga > 0 ? +((userPlayer.seasonStats.fgm / userPlayer.seasonStats.fga) * 100).toFixed(1) : 45.0;
        minutes = +(userPlayer.seasonStats.minutes / gp).toFixed(1);
      } else {
        // Add unique player variance for this specific season
        const v = getPlayerVariance(`${p.name}_${p.id || ''}_s${seasonIndex}`);
        ppg = +(ppg * v).toFixed(1);
        rpg = +(rpg * (0.9 + (v - 0.81) * 0.5)).toFixed(1);
        apg = +(apg * (0.9 + (1.20 - v) * 0.5)).toFixed(1);
      }

      // Calculate Scores
      const winFactor = team.wins / 82.0;

      // Basic stat score
      const statScore = ppg * 2.0 + rpg * 0.8 + apg * 1.0 + spg * 1.2 + bpg * 1.2;

      // MVP score: High scoring weight + team success (heavily rewards high scorers on winning teams)
      const mvpScore = ppg * 2.5 + rpg * 0.7 + apg * 1.1 + spg * 1.0 + bpg * 1.0 + winFactor * 22.0;

// Defensive score calculation - highly optimized and realistic
      const eliteDefenders = [
        '凯文·加内特', '蒂姆·邓肯', '德怀特·霍华德', '本·华莱士', '罗恩·阿泰斯特', '慈善·世界和平', '慈世平',
        '肖恩·巴蒂尔', '泰肖恩·普林斯', '安德烈·基里连科', '拉简·隆多', '托尼·阿伦', '克里斯·保罗', '科比·布莱恩特',
        '勒布朗·詹姆斯', '德维恩·韦德', '德拉蒙德·格林', '科怀·莱昂纳德', '鲁迪·戈贝尔', '安东尼·戴维斯',
        '扬尼斯·阿德托昆博', '保罗·乔治', '安德烈·伊格达拉', '朱·霍勒迪', '马库斯·斯玛特', '帕特里克·贝弗利',
        '埃弗里·布拉德利', '塞布尔', '马蒂斯·塞布尔', '德章泰·穆雷', '亚历克斯·卡鲁索', '德里克·怀特',
        '杰森·基德', '萨博·塞福罗萨', '乔金·诺阿', '马克·加索尔', '塞尔吉·伊巴卡', '德安德烈·乔丹',
        '哈桑·怀特塞德', '罗伯特·考文顿', 'P.J. 塔克', '米卡尔·布里奇斯', 'O.G. 阿努诺比', '阿努诺比',
        '巴姆·阿德巴约', '杰登·麦克丹尼尔斯', '麦克丹尼尔斯', '埃文·莫布里', '莫布里', '赫伯·琼斯', '赫伯特·琼斯',
        '肯德里克·帕金斯', '詹姆斯·波西', '尤杜尼斯·哈斯勒姆', '泰森·钱德勒'
      ];

      const defensiveLiabilities = [
        '斯蒂芬·库里', '库里', '詹姆斯·哈登', '哈登', '凯里·欧文', '欧文', '史蒂夫·纳什', '纳什',
        '达米安·利拉德', '利拉德', '卢卡·东契奇', '东契奇', '特雷·杨', '尼古拉·约基奇', '约基奇',
        '阿伦·艾弗森', '艾弗森', '德里克·罗斯', '罗斯', '卡梅隆·安东尼', '卡尔-安东尼·唐斯', '唐斯',
        '多曼塔斯·萨博尼斯', '萨博尼斯', '德玛尔·德罗赞', '德罗赞', '扎克·拉文', '拉文',
        '贾·莫兰特', '莫兰特', '布拉德利·比尔', '比尔', 'C.J. 麦科勒姆', '麦科勒姆',
        '阿玛雷·斯塔德迈尔', '小斯', '斯塔德迈尔', '克里斯·波什', '波什', '安德里亚·巴尔尼亚尼', '巴尔尼亚尼',
        '凯文·马丁', '贾马尔·克劳福德', '克劳福德', '路易斯·威廉姆斯', '路威'
      ];

      const isDefensiveLiability = defensiveLiabilities.some(n => p.name.includes(n)) && !p.name.includes('安东尼·戴维斯');
      const isEliteDefender = eliteDefenders.some(n => p.name.includes(n));

      const baseDefensiveScore = spg * 4.5 + bpg * 5.0 + rpg * 1.0;
      const teamDefensiveFactor = winFactor * 10.0;
      const ovrDefBonus = (p.ovr >= 85 && !isDefensiveLiability) ? 6 : 0;

      let defMultiplier = 1.0;
      if (isUser) {
        const avgDefAttr = (userPlayer.attributes.perimeterDef + userPlayer.attributes.interiorDef) / 2;
        if (avgDefAttr >= 85) defMultiplier = 1.45;
        else if (avgDefAttr >= 75) defMultiplier = 1.15;
        else if (avgDefAttr < 65) defMultiplier = 0.5;
        else if (avgDefAttr < 70) defMultiplier = 0.75;
      } else {
        if (isEliteDefender) {
          defMultiplier = 1.45;
        } else if (isDefensiveLiability) {
          defMultiplier = 0.45;
        }
      }

      const defensiveScore = (baseDefensiveScore + teamDefensiveFactor + ovrDefBonus) * defMultiplier;

      // Sixth man score
      const sixthManScore = ppg * 2.0 + rpg * 0.8 + apg * 1.1 + winFactor * 10.0;

      // Rookie score (Filtered strictly by current season draft class or isRookie flag)
      const isRookie = isUser
        ? (userPlayer.isRookie ?? (currentYear === 2008))
        : (p.isRookie === true || currentDraftRookieNames.has(p.name));
      const rookieScore = ppg * 1.8 + rpg * 0.8 + apg * 1.0 + spg * 1.0 + bpg * 1.0;

      allPlayers.push({
        id: p.id || p.name,
        name: p.name,
        position: p.position || 'PG',
        teamId: team.id,
        teamName: team.name,
        teamAbbrev: team.abbrev,
        conference: team.conference,
        teamWins: team.wins,
        teamConferenceRank,
        isPlayoffTeam,
        isTop5Seed,
        ovr: p.ovr,
        role: p.role || '轮换替补',
        isUser,
        isRookie,
        ppg,
        rpg,
        apg,
        spg,
        bpg,
        fgPct,
        minutes,
        statScore,
        mvpScore,
        defensiveScore,
        sixthManScore,
        rookieScore,
      });
    }
  }

  return {
    allPlayers,
    playoffTeamIds,
    eastPlayoffTeams,
    westPlayoffTeams,
  };
}

/**
 * Calculates complete season awards based on strict probability formulas and conditions
 */
export function calculateSeasonAwards(
  teams: Team[],
  userPlayer: PlayerProfile,
  currentYear: number = 2008
): SeasonAwards {
  // Set stable random seed based on currentYear, user player name, team wins sum, and player stats
  const teamWinsSum = teams.reduce((acc, t) => acc + t.wins, 0);
  const seedStr = `${currentYear}_${userPlayer.name}_${teamWinsSum}_${userPlayer.seasonStats?.pts || 0}`;
  setSeed(hashString(seedStr));

  const currentDraftData = getHistoricalDraftData(currentYear);
  const { allPlayers, playoffTeamIds, eastPlayoffTeams, westPlayoffTeams } = evaluateAllLeaguePlayers(teams, userPlayer, currentYear);

  const userMadePlayoffs = playoffTeamIds.has(userPlayer.currentTeamId);

  // Helper to map evaluated player to AwardWinner
  const toWinner = (p: EvaluatedPlayer | null | undefined, probPct?: number, reason?: string): AwardWinner => {
    const safeP = p || allPlayers[0];
    return {
      id: safeP?.id || 'p_default',
      name: safeP?.name || '未知球员',
      position: safeP?.position || 'PG',
      teamName: safeP?.teamName || 'NBA联盟',
      teamAbbrev: safeP?.teamAbbrev || 'NBA',
      ppg: safeP?.ppg || 0,
      rpg: safeP?.rpg || 0,
      apg: safeP?.apg || 0,
      spg: safeP?.spg || 0,
      bpg: safeP?.bpg || 0,
      fgPct: safeP?.fgPct || 0,
      isUser: safeP?.isUser || false,
      probabilityPct: probPct,
      reason,
    };
  };

  // 1. MVP: Must be from a Conference Top 5 seed -> Directly award to highest calculated mvpScore (no random roll)
  let mvpTop5Candidates = allPlayers
    .filter((p) => p.isTop5Seed)
    .sort((a, b) => b.mvpScore - a.mvpScore);

  // Fallback to playoff teams or all players if exceptional circumstances
  if (mvpTop5Candidates.length === 0) {
    mvpTop5Candidates = allPlayers.filter((p) => p.isPlayoffTeam).sort((a, b) => b.mvpScore - a.mvpScore);
  }
  if (mvpTop5Candidates.length === 0) {
    mvpTop5Candidates = [...allPlayers].sort((a, b) => b.mvpScore - a.mvpScore);
  }

  const safeMvp = mvpTop5Candidates[0] || allPlayers[0];
  const mvp = toWinner(
    safeMvp,
    100,
    safeMvp
      ? `率领【${safeMvp.teamName}】位列${safeMvp.conference === 'East' ? '东部' : '西部'}第${safeMvp.teamConferenceRank}（${safeMvp.teamWins}胜），常规赛场均狂轰 ${safeMvp.ppg}分 ${safeMvp.rpg}板 ${safeMvp.apg}助，以绝对实力荣膺常规赛 MVP！`
      : '常规赛最杰出的统治级球星！'
  );

  // 1.5. 得分王 (Scoring Title): 全联盟常规赛场均得分第一名
  const sortedByPpg = [...allPlayers].sort((a, b) => b.ppg - a.ppg);
  const safeScoringLeader = sortedByPpg[0] || allPlayers[0];
  const scoringLeader = toWinner(
    safeScoringLeader,
    100,
    safeScoringLeader
      ? `常规赛以场均 ${safeScoringLeader.ppg} 分领跑全联盟，火力全开加冕 NBA 得分王 (Scoring Leader)！`
      : '全联盟最高单季得分火力！'
  );

  // 2. DPOY: Top 10 defensive candidates from playoff teams -> Probability roll
  let dpoyCandidates = allPlayers
    .filter((p) => p.isPlayoffTeam)
    .sort((a, b) => b.defensiveScore - a.defensiveScore)
    .slice(0, 10);

  if (dpoyCandidates.length === 0) {
    dpoyCandidates = [...allPlayers].sort((a, b) => b.defensiveScore - a.defensiveScore).slice(0, 10);
  }

  const minDpoyScore = dpoyCandidates.length > 0 ? dpoyCandidates[dpoyCandidates.length - 1].defensiveScore : 0;
  const dpoyWeightedItems = dpoyCandidates.map((p) => ({
    item: p,
    weight: Math.pow(Math.max(1, p.defensiveScore - minDpoyScore + 3), 2.0),
  }));

  const { selected: dpoyPlayer, probPct: dpoyProb } = weightedRandomSelect(dpoyWeightedItems);
  const safeDpoy = dpoyPlayer || dpoyCandidates[0] || allPlayers[0];
  const dpoy = toWinner(
    safeDpoy,
    dpoyProb,
    safeDpoy
      ? `防守端建起禁飞区，场均 ${safeDpoy.spg}抢断 ${safeDpoy.bpg}盖帽 ${safeDpoy.rpg}篮板，筑牢球队防线！`
      : '最佳防守核心！'
  );

  // 3. 最佳第六人: ONLY from 6th man role on playoff teams -> Probability roll
  let sixthManCandidates = allPlayers
    .filter((p) => p.isPlayoffTeam && (p.role === '第六人' || p.minutes <= 27))
    .sort((a, b) => b.sixthManScore - a.sixthManScore)
    .slice(0, 10);

  if (sixthManCandidates.length === 0) {
    sixthManCandidates = allPlayers
      .filter((p) => p.role === '第六人' || p.minutes <= 27)
      .sort((a, b) => b.sixthManScore - a.sixthManScore)
      .slice(0, 10);
  }

  if (sixthManCandidates.length === 0) {
    sixthManCandidates = [...allPlayers].slice(0, 10);
  }

  const minSixthScore = sixthManCandidates.length > 0 ? sixthManCandidates[sixthManCandidates.length - 1].sixthManScore : 0;
  const sixthWeightedItems = sixthManCandidates.map((p) => ({
    item: p,
    weight: Math.pow(Math.max(1, p.sixthManScore - minSixthScore + 2), 2.0),
  }));

  const { selected: sixthPlayer, probPct: sixthProb } = weightedRandomSelect(sixthWeightedItems);
  const safeSixth = sixthPlayer || sixthManCandidates[0] || allPlayers[0];
  const sixthMan = toWinner(
    safeSixth,
    sixthProb,
    safeSixth
      ? `替补出场轰下场均 ${safeSixth.ppg}分 ${safeSixth.apg}助，第二阵容的最强攻坚特种兵！`
      : '第二阵容最强火炮！'
  );

  // 4. 最佳新秀: ONLY rookies -> Probability roll
  let rookieCandidates = allPlayers
    .filter((p) => p.isRookie)
    .sort((a, b) => b.rookieScore - a.rookieScore)
    .slice(0, 10);

  if (rookieCandidates.length === 0 && currentDraftData && currentDraftData.draftPicks && currentDraftData.draftPicks.length > 0) {
    const topDraft = currentDraftData.draftPicks[0].player;
    const defaultTeam = teams.find((t) => t.id === currentDraftData.draftPicks[0].teamId) || teams[0];
    rookieCandidates = [
      {
        id: topDraft.id || topDraft.name,
        name: topDraft.name,
        position: topDraft.position || 'PG',
        teamId: defaultTeam.id,
        teamName: defaultTeam.name,
        teamAbbrev: defaultTeam.abbrev,
        conference: defaultTeam.conference,
        teamWins: defaultTeam.wins,
        teamConferenceRank: 8,
        isPlayoffTeam: true,
        isTop5Seed: false,
        ovr: topDraft.ovr,
        role: '绝对首发',
        isUser: false,
        isRookie: true,
        ppg: 18.5,
        rpg: 4.5,
        apg: 6.2,
        spg: 1.2,
        bpg: 0.4,
        fgPct: 46.5,
        minutes: 32,
        statScore: 30,
        mvpScore: 25,
        defensiveScore: 12,
        sixthManScore: 15,
        rookieScore: 35,
      },
    ];
  }

  if (rookieCandidates.length === 0) {
    // If no draft data or rookies exist in current year, fallback to youngest / lowest ovr non-user player
    const fallbackRookie = allPlayers.find((p) => !p.isUser) || allPlayers[0];
    if (fallbackRookie) {
      rookieCandidates = [
        {
          ...fallbackRookie,
          isRookie: true,
          rookieScore: 30,
        },
      ];
    }
  }

  const minRookieScore = rookieCandidates.length > 0 ? rookieCandidates[rookieCandidates.length - 1].rookieScore : 0;
  const rookieWeightedItems = rookieCandidates.map((p) => ({
    item: p,
    weight: Math.pow(Math.max(1, p.rookieScore - minRookieScore + 2), 2.0),
  }));

  const { selected: royPlayer, probPct: royProb } = weightedRandomSelect(rookieWeightedItems);
  const safeRoy = royPlayer || rookieCandidates[0] || allPlayers[0];
  const roy = toWinner(
    safeRoy,
    royProb,
    safeRoy
      ? `新秀赛季打出轰动表现，场均 ${safeRoy.ppg}分 ${safeRoy.rpg}板 ${safeRoy.apg}助，未来不可限量！`
      : '最具潜力的年度最佳新秀！'
  );

  // Position order comparator helper
  const posOrder: Record<Position, number> = { PG: 1, SG: 2, SF: 3, PF: 4, C: 5 };

  // 5. 最佳阵容 (All-NBA 1st, 2nd, 3rd) - 1 player per position (PG, SG, SF, PF, C)
  const sortedAllNba = [...allPlayers].sort((a, b) => b.statScore - a.statScore);
  const selectedAllNbaIds = new Set<string>();
  const mvpPlayerCandidate = allPlayers.find((p) => p.id === mvp.id || p.name === mvp.name);

  const pickAllNbaTeam = (teamIndex: 1 | 2 | 3, label: string): AllTeamSelection => {
    const pool = sortedAllNba.filter((p) => !selectedAllNbaIds.has(p.id));
    const selected: EvaluatedPlayer[] = [];
    const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

    // MVP MUST be included in All-NBA 1st Team
    if (teamIndex === 1 && mvpPlayerCandidate && !selectedAllNbaIds.has(mvpPlayerCandidate.id)) {
      selected.push(mvpPlayerCandidate);
    }

    for (const pos of positions) {
      if (selected.some((s) => s.position === pos)) continue;
      const bestForPos = pool.find((p) => p.position === pos && !selected.some((s) => s.id === p.id));
      if (bestForPos) selected.push(bestForPos);
    }

    while (selected.length < 5) {
      const next = pool.find((p) => !selected.some((s) => s.id === p.id));
      if (next) selected.push(next);
      else break;
    }

    selected.sort((a, b) => posOrder[a.position] - posOrder[b.position]);

    const teamPlayers: AwardWinner[] = [];
    selected.forEach((p) => {
      selectedAllNbaIds.add(p.id);
      teamPlayers.push(toWinner(p));
    });

    return { teamIndex, label, players: teamPlayers };
  };

  const allNbaTeams = [
    pickAllNbaTeam(1, '最佳阵容一阵 (All-NBA 1st)'),
    pickAllNbaTeam(2, '最佳阵容二阵 (All-NBA 2nd)'),
    pickAllNbaTeam(3, '最佳阵容三阵 (All-NBA 3rd)'),
  ];

  // 6. 最佳防守阵容 (All-Defensive 1st, 2nd) - 2 Guards + 3 Frontcourt
  const sortedDefensive = [...allPlayers].sort((a, b) => b.defensiveScore - a.defensiveScore);
  const selectedDefIds = new Set<string>();
  const dpoyPlayerCandidate = allPlayers.find((p) => p.id === dpoy.id || p.name === dpoy.name);

  const pickDefTeam = (teamIndex: 1 | 2 | 3, label: string): AllTeamSelection => {
    const pool = sortedDefensive.filter((p) => !selectedDefIds.has(p.id));
    const selected: EvaluatedPlayer[] = [];

    // DPOY MUST be automatically included in All-Defensive 1st Team
    if (teamIndex === 1 && dpoyPlayerCandidate && !selectedDefIds.has(dpoyPlayerCandidate.id)) {
      selected.push(dpoyPlayerCandidate);
    }

    const isGuard = (pos: Position) => pos === 'PG' || pos === 'SG';
    const isFrontcourt = (pos: Position) => pos === 'SF' || pos === 'PF' || pos === 'C';

    const currentGuards = selected.filter((s) => isGuard(s.position)).length;
    const currentFrontcourt = selected.filter((s) => isFrontcourt(s.position)).length;

    const availableGuards = pool.filter((p) => isGuard(p.position) && !selected.some((s) => s.id === p.id));
    const availableFrontcourt = pool.filter((p) => isFrontcourt(p.position) && !selected.some((s) => s.id === p.id));

    const needGuards = Math.max(0, 2 - currentGuards);
    const needFrontcourt = Math.max(0, 3 - currentFrontcourt);

    for (let i = 0; i < needGuards; i++) {
      if (availableGuards[i]) selected.push(availableGuards[i]);
    }
    for (let i = 0; i < needFrontcourt; i++) {
      if (availableFrontcourt[i]) selected.push(availableFrontcourt[i]);
    }

    while (selected.length < 5) {
      const next = pool.find((p) => !selected.some((s) => s.id === p.id));
      if (next) selected.push(next);
      else break;
    }

    selected.sort((a, b) => posOrder[a.position] - posOrder[b.position]);

    const teamPlayers: AwardWinner[] = [];
    selected.forEach((p) => {
      selectedDefIds.add(p.id);
      teamPlayers.push(toWinner(p));
    });

    return { teamIndex, label, players: teamPlayers };
  };

  const allDefensiveTeams = [
    pickDefTeam(1, '最佳防守一阵 (All-Defensive 1st)'),
    pickDefTeam(2, '最佳防守二阵 (All-Defensive 2nd)'),
  ];

  // 7. 最佳新秀阵容 (All-Rookie 1st, 2nd) - strictly rookies first
  let sortedRookie = [...allPlayers].filter((p) => p.isRookie).sort((a, b) => b.rookieScore - a.rookieScore);
  if (sortedRookie.length < 10) {
    sortedRookie = [...allPlayers].filter((p) => p.isRookie || p.ovr <= 80).sort((a, b) => b.rookieScore - a.rookieScore);
  }
  const selectedRookIds = new Set<string>();
  const royPlayerCandidate = allPlayers.find((p) => p.id === roy.id || p.name === roy.name);

  const pickRookieTeam = (teamIndex: 1 | 2 | 3, label: string): AllTeamSelection => {
    const pool = sortedRookie.filter((p) => !selectedRookIds.has(p.id));
    const selected: EvaluatedPlayer[] = [];
    const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

    // ROY MUST be automatically included in All-Rookie 1st Team
    if (teamIndex === 1 && royPlayerCandidate && !selectedRookIds.has(royPlayerCandidate.id)) {
      selected.push(royPlayerCandidate);
    }

    for (const pos of positions) {
      if (selected.some((s) => s.position === pos)) continue;
      const bestForPos = pool.find((p) => p.position === pos && !selected.some((s) => s.id === p.id));
      if (bestForPos) selected.push(bestForPos);
    }

    while (selected.length < 5) {
      const next = pool.find((p) => !selected.some((s) => s.id === p.id));
      if (next) selected.push(next);
      else break;
    }

    selected.sort((a, b) => posOrder[a.position] - posOrder[b.position]);

    const teamPlayers: AwardWinner[] = [];
    selected.forEach((p) => {
      selectedRookIds.add(p.id);
      teamPlayers.push(toWinner(p));
    });

    return { teamIndex, label, players: teamPlayers };
  };

  const allRookieTeams = [
    pickRookieTeam(1, '最佳新秀一阵 (All-Rookie 1st)'),
    pickRookieTeam(2, '最佳新秀二阵 (All-Rookie 2nd)'),
  ];

  // Find user team seed
  const userTeam = teams.find((t) => t.id === userPlayer.currentTeamId);
  let userTeamSeed: number | undefined;
  if (userTeam) {
    const confTeams = userTeam.conference === 'East' ? eastPlayoffTeams : westPlayoffTeams;
    const idx = confTeams.findIndex((t) => t.id === userTeam.id);
    if (idx !== -1) {
      userTeamSeed = idx + 1;
    }
  }

  return {
    mvp,
    scoringLeader,
    dpoy,
    sixthMan,
    roy,
    allNbaTeams,
    allDefensiveTeams,
    allRookieTeams,
    userMadePlayoffs,
    userTeamSeed,
    userTeamConference: userTeam?.conference,
    playoffTeams: {
      east: eastPlayoffTeams,
      west: westPlayoffTeams,
    },
  };
}
