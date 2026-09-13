import type { ExecutedTradeDetail, TradeModalData } from '../data/realTradesData';
import type { Position, RosterPlayer, Team, TeamStrategy } from '../types';
import { calculateTeamPowerRating } from './leagueLogic';

export interface RandomTradeOptions {
  random?: () => number;
  minTrades?: number;
  maxTrades?: number;
  userPlayerId?: string;
  userPlayerName?: string;
  userTeamId?: string;
}

const keyOf = (player: RosterPlayer) => player.id || player.name;
const strategyOf = (team: Team): TeamStrategy => team.strategy || (team.rating >= 84 ? 'contender' : team.rating >= 78 ? 'playoff' : team.rating >= 73 ? 'retooling' : 'rebuilding');

function isUser(player: RosterPlayer, options: RandomTradeOptions): boolean {
  return Boolean((options.userPlayerId && player.id === options.userPlayerId) ||
    (options.userPlayerName && player.name === options.userPlayerName) ||
    (player as RosterPlayer & { isUser?: boolean }).isUser);
}

function valueOf(player: RosterPlayer): number {
  const age = player.age || 27;
  const upside = Math.max(0, (player.peakOvr || player.ovr) - player.ovr);
  const youth = Math.max(-5, Math.min(7, 28 - age));
  return player.ovr + upside * 0.42 + youth * 0.48;
}

function positionNeed(team: Team, position: Position, excluded?: RosterPlayer): number {
  const best = team.roster.filter((p) => p !== excluded && p.position === position).reduce((max, p) => Math.max(max, p.ovr), 60);
  return 100 - best;
}

function refreshTeam(team: Team): void {
  team.roster.sort((a, b) => b.ovr - a.ovr);
  team.roster.forEach((p, index) => {
    p.role = index === 0 ? '战术核心' : index < 5 ? '绝对首发' : index === 5 ? '第六人' : index < 10 ? '轮换替补' : '饮水机守门员';
    p.isStar = index < 3 || p.ovr >= 86;
  });
  team.starPlayer = team.roster[0]?.name || team.starPlayer;
  team.rating = calculateTeamPowerRating(team);
}

interface Pair { playerA: RosterPlayer; playerB: RosterPlayer; score: number; category: 'blockbuster' | 'starter' | 'rotation' }

function eligible(team: Team, year: number, moved: Set<string>, options: RandomTradeOptions): RosterPlayer[] {
  return team.roster.filter((p) => p.ovr >= 66 && (p.tradeProtectionUntilYear || 0) < year && !isUser(p, options) && !moved.has(keyOf(p)));
}

function findPair(teamA: Team, teamB: Team, year: number, moved: Set<string>, options: RandomTradeOptions, random: () => number, allowBlockbuster: boolean): Pair | null {
  let best: Pair | null = null;
  const strategyA = strategyOf(teamA);
  const strategyB = strategyOf(teamB);
  for (const playerA of eligible(teamA, year, moved, options)) {
    for (const playerB of eligible(teamB, year, moved, options)) {
      const aValue = valueOf(playerA);
      const bValue = valueOf(playerB);
      const valueGap = Math.abs(aValue - bValue);
      const isBlockbuster = Math.max(playerA.ovr, playerB.ovr) >= 89;
      if (isBlockbuster ? (!allowBlockbuster || valueGap > 11) : valueGap > 5.5) continue;

      // Rebuilding teams prefer youth/upside; contenders prefer immediate OVR and positional need.
      const fit = (positionNeed(teamA, playerB.position, playerA) - positionNeed(teamA, playerA.position, playerA)) +
        (positionNeed(teamB, playerA.position, playerB) - positionNeed(teamB, playerB.position, playerB));
      const directionA = strategyA === 'rebuilding' ? (28 - (playerB.age || 27)) * 1.6 + ((playerB.peakOvr || playerB.ovr) - playerB.ovr) : playerB.ovr - playerA.ovr;
      const directionB = strategyB === 'rebuilding' ? (28 - (playerA.age || 27)) * 1.6 + ((playerA.peakOvr || playerA.ovr) - playerA.ovr) : playerA.ovr - playerB.ovr;
      const complementary = (strategyA === 'rebuilding' && (strategyB === 'contender' || strategyB === 'playoff')) ||
        (strategyB === 'rebuilding' && (strategyA === 'contender' || strategyA === 'playoff')) ? 12 : 0;
      const score = fit + directionA + directionB + complementary - valueGap * 1.8 + random() * 8 + (isBlockbuster ? 8 : 0);
      const category = isBlockbuster ? 'blockbuster' : Math.max(playerA.ovr, playerB.ovr) >= 78 ? 'starter' : 'rotation';
      if (!best || score > best.score) best = { playerA, playerB, score, category };
    }
  }
  return best;
}

/** First season remains historical. From 2009 onward, generates 14–20 real roster moves and only stores headline deals. */
export function executeRandomTradesForSeason(currentTeams: Team[], year: number, options: RandomTradeOptions = {}): { updatedTeams: Team[]; modalData: TradeModalData | null } {
  if (year <= 2008 || currentTeams.length < 2) return { updatedTeams: currentTeams, modalData: null };
  const random = options.random || Math.random;
  const minTrades = Math.max(1, options.minTrades ?? 14);
  const maxTrades = Math.max(minTrades, options.maxTrades ?? 20);
  const target = minTrades + Math.floor(random() * (maxTrades - minTrades + 1));
  const teams = currentTeams.map((team) => ({ ...team, roster: team.roster.map((p) => ({ ...p })) }));
  const moved = new Set<string>();
  const counts = new Map<string, number>();
  const trades: ExecutedTradeDetail[] = [];
  let blockbusterCount = 0;

  for (let attempt = 0; attempt < 1600 && trades.length < target; attempt += 1) {
    const available = teams.filter((t) => (counts.get(t.id) || 0) < 3);
    if (available.length < 2) break;
    const leastUsed = Math.min(...available.map((t) => counts.get(t.id) || 0));
    const preferred = available.filter((t) => (counts.get(t.id) || 0) === leastUsed);
    const teamA = preferred[Math.floor(random() * preferred.length)] || available[0];
    const opponents = available.filter((t) => t.id !== teamA.id);
    const teamB = opponents[Math.floor(random() * opponents.length)];
    if (!teamB) continue;
    const allowBlockbuster = blockbusterCount < 2 && random() < 0.3;
    const pair = findPair(teamA, teamB, year, moved, options, random, allowBlockbuster);
    if (!pair) continue;
    const indexA = teamA.roster.indexOf(pair.playerA);
    const indexB = teamB.roster.indexOf(pair.playerB);
    if (indexA < 0 || indexB < 0) continue;
    const oldA = teamA.rating || calculateTeamPowerRating(teamA);
    const oldB = teamB.rating || calculateTeamPowerRating(teamB);
    teamA.roster[indexA] = pair.playerB;
    teamB.roster[indexB] = pair.playerA;
    refreshTeam(teamA); refreshTeam(teamB);
    teamA.lastTradeYear = year; teamB.lastTradeYear = year;
    moved.add(keyOf(pair.playerA)); moved.add(keyOf(pair.playerB));
    counts.set(teamA.id, (counts.get(teamA.id) || 0) + 1);
    counts.set(teamB.id, (counts.get(teamB.id) || 0) + 1);
    if (pair.category === 'blockbuster') blockbusterCount += 1;
    const importance = Math.max(pair.playerA.ovr, pair.playerB.ovr) * 2 + Math.abs(teamA.rating - oldA) * 5 + Math.abs(teamB.rating - oldB) * 5 + (pair.category === 'blockbuster' ? 40 : pair.category === 'starter' ? 16 : 0);
    trades.push({
      id: `parallel_${year}_${trades.length + 1}`, type: 'swap', tradeCategory: pair.category, importanceScore: importance,
      playerA: { name: pair.playerA.name, position: pair.playerA.position, ovr: pair.playerA.ovr, fromTeamId: teamA.id, fromTeamName: teamA.name, toTeamId: teamB.id, toTeamName: teamB.name },
      playerB: { name: pair.playerB.name, position: pair.playerB.position, ovr: pair.playerB.ovr, fromTeamId: teamB.id, fromTeamName: teamB.name, toTeamId: teamA.id, toTeamName: teamA.name },
      teamAOldRating: oldA, teamANewRating: teamA.rating, teamBOldRating: oldB, teamBNewRating: teamB.rating,
    });
  }
  if (!trades.length) return { updatedTeams: currentTeams, modalData: null };
  const userDeals = trades.filter((t) => t.playerA?.fromTeamId === options.userTeamId || t.playerB?.fromTeamId === options.userTeamId);
  const headlineTarget = Math.min(trades.length, Math.max(6, Math.min(10, Math.round(trades.length * 0.5))));
  const headlines = [...userDeals, ...trades.filter((t) => !userDeals.includes(t)).sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0))]
    .filter((trade, index, array) => array.findIndex((candidate) => candidate.id === trade.id) === index)
    .slice(0, headlineTarget);
  return { updatedTeams: teams, modalData: { year, seasonName: `${year}-${year + 1} 赛季 · 平行联盟`, tradeSource: 'random', totalTransactions: trades.length, hiddenTransactions: trades.length - headlines.length, executedTrades: headlines } };
}

export interface StarInvitationResult { updatedTeams: Team[]; invitedPlayer?: RosterPlayer; outgoingPlayer?: RosterPlayer; error?: string }

export function inviteStarToTeam(currentTeams: Team[], userTeamId: string, sourceTeamId: string, starPlayerId: string, currentYear: number, userPlayerId?: string, userPlayerName?: string): StarInvitationResult {
  if (userTeamId === sourceTeamId) return { updatedTeams: currentTeams, error: '该球星已在当前球队' };
  const teams = currentTeams.map((team) => ({ ...team, roster: team.roster.map((p) => ({ ...p })) }));
  const userTeam = teams.find((t) => t.id === userTeamId);
  const sourceTeam = teams.find((t) => t.id === sourceTeamId);
  const invitedIndex = sourceTeam?.roster.findIndex((p) => p.id === starPlayerId) ?? -1;
  if (!userTeam || !sourceTeam || invitedIndex < 0) return { updatedTeams: currentTeams, error: '球星当前阵容发生变化，请重新选择' };
  const invitedPlayer = sourceTeam.roster[invitedIndex];
  const outgoingPlayer = [...userTeam.roster].filter((p) => p.id !== userPlayerId && p.name !== userPlayerName && (p.tradeProtectionUntilYear || 0) < currentYear).sort((a, b) => a.ovr - b.ovr)[0];
  if (!outgoingPlayer) return { updatedTeams: currentTeams, error: '当前球队没有可调整的阵容名额' };
  const outgoingIndex = userTeam.roster.findIndex((p) => p.id === outgoingPlayer.id);
  if (outgoingIndex < 0) return { updatedTeams: currentTeams, error: '阵容调整失败，请稍后重试' };
  sourceTeam.roster[invitedIndex] = { ...outgoingPlayer };
  userTeam.roster[outgoingIndex] = { ...invitedPlayer, acquisitionSource: 'star_invitation', tradeProtectionUntilYear: currentYear + 1 };
  refreshTeam(sourceTeam); refreshTeam(userTeam);
  return { updatedTeams: teams, invitedPlayer: userTeam.roster.find((p) => p.id === invitedPlayer.id), outgoingPlayer };
}
