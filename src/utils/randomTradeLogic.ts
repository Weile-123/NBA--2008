import { applyHistoricalTeamIdentityUpdates, HISTORICAL_REAL_TRADES, type ExecutedTradeDetail, type TradeModalData } from '../data/realTradesData';
import type { Position, RosterPlayer, Team, TeamStrategy } from '../types';
import { calculateTeamPowerRating, selectBalancedStarterIds } from './leagueLogic';
import { getSecondaryPosition } from './playerPositions';

export interface RandomTradeOptions {
  random?: () => number;
  minTrades?: number;
  maxTrades?: number;
  userPlayerId?: string;
  userPlayerName?: string;
  userTeamId?: string;
  defendingChampionTeamId?: string;
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
  const best = team.roster.filter((p) => p !== excluded && (p.position === position || getSecondaryPosition(p) === position))
    .reduce((max, p) => Math.max(max, p.ovr), 60);
  return 100 - best;
}

function bestAtPosition(roster: RosterPlayer[], position: Position): number {
  return roster.reduce((best, player) => player.position === position || getSecondaryPosition(player) === position
    ? Math.max(best, player.ovr) : best, 0);
}

function refreshTeam(team: Team): void {
  team.roster.sort((a, b) => b.ovr - a.ovr);
  const starters = selectBalancedStarterIds(team.roster.map((p) => ({
    id: p.id, name: p.name, position: p.position, secondaryPosition: p.secondaryPosition, score: p.ovr,
  })));
  const coreId = team.roster.find((p) => starters.has(p.id))?.id;
  const bench = team.roster.filter((p) => !starters.has(p.id));
  const sixthId = bench[0]?.id;
  const rotationIds = new Set(bench.slice(1, 5).map((p) => p.id));
  team.roster.forEach((p, index) => {
    p.role = p.id === coreId ? '战术核心' : starters.has(p.id) ? '绝对首发'
      : p.id === sixthId ? '第六人' : rotationIds.has(p.id) ? '轮换替补' : '饮水机守门员';
    p.isStar = index < 3 || p.ovr >= 86;
  });
  team.starPlayer = team.roster[0]?.name || team.starPlayer;
  team.rating = calculateTeamPowerRating(team);
}

interface Pair { playerA: RosterPlayer; playerB: RosterPlayer; score: number; category: 'blockbuster' | 'starter' | 'rotation' }

function eligible(team: Team, year: number, moved: Set<string>, options: RandomTradeOptions): RosterPlayer[] {
  return team.roster.filter((p) =>
    p.ovr >= 66 &&
    (p.tradeProtectionUntilYear || 0) < year &&
    !isUser(p, options) &&
    !moved.has(keyOf(p)) &&
    !(team.id === options.defendingChampionTeamId && p.ovr >= 90),
  );
}

function ratingAfterSwap(team: Team, outgoing: RosterPlayer, incoming: RosterPlayer): number {
  const roster = team.roster.map((player) => player === outgoing ? incoming : player);
  return calculateTeamPowerRating({ ...team, roster });
}

function preservesPositionCoverage(team: Team, outgoing: RosterPlayer, incoming: RosterPlayer, floors: Record<Position, number>): boolean {
  const remaining = team.roster.filter((p) => p !== outgoing);
  for (const position of DEPTH_POSITIONS) {
    const before = bestAtPosition(team.roster, position);
    const after = bestAtPosition([...remaining, incoming], position);
    // A season-long floor stops three separate trades from each stripping a
    // little more quality from the same slot. Existing weak slots cannot worsen.
    if (after < Math.max(floors[position], before >= 76 ? 76 : before)) return false;
  }
  return true;
}

function acceptsDirection(
  strategy: TeamStrategy,
  outgoing: RosterPlayer,
  incoming: RosterPlayer,
  oldRating: number,
  newRating: number,
): boolean {
  const ratingDelta = newRating - oldRating;
  const valueDelta = valueOf(incoming) - valueOf(outgoing);
  const currentOvrDelta = incoming.ovr - outgoing.ovr;

  if (strategy === 'contender') return ratingDelta >= -1 && currentOvrDelta >= -4;
  if (strategy === 'playoff') return ratingDelta >= -2 && currentOvrDelta >= -5 && valueDelta >= -3;
  if (strategy === 'rebuilding') return valueDelta >= -1.5;
  return ratingDelta >= -2 && valueDelta >= -2;
}

function directionUtility(
  strategy: TeamStrategy,
  outgoing: RosterPlayer,
  incoming: RosterPlayer,
  ratingDelta: number,
): number {
  const valueDelta = valueOf(incoming) - valueOf(outgoing);
  const currentOvrDelta = incoming.ovr - outgoing.ovr;
  if (strategy === 'contender') return ratingDelta * 5 + currentOvrDelta * 1.5;
  if (strategy === 'playoff') return ratingDelta * 4 + currentOvrDelta + valueDelta * 0.5;
  if (strategy === 'rebuilding') return valueDelta * 2 + (28 - (incoming.age || 27)) * 0.4;
  return ratingDelta * 2.5 + valueDelta;
}

function findPair(teamA: Team, teamB: Team, year: number, moved: Set<string>, options: RandomTradeOptions, random: () => number, allowBlockbuster: boolean, requireBlockbuster: boolean, floors: Map<string, Record<Position, number>>): Pair | null {
  let best: Pair | null = null;
  const strategyA = strategyOf(teamA);
  const strategyB = strategyOf(teamB);
  for (const playerA of eligible(teamA, year, moved, options)) {
    for (const playerB of eligible(teamB, year, moved, options)) {
      const aValue = valueOf(playerA);
      const bValue = valueOf(playerB);
      const valueGap = Math.abs(aValue - bValue);
      const isBlockbuster = Math.max(playerA.ovr, playerB.ovr) >= 89;
      if (requireBlockbuster && !isBlockbuster) continue;
      if (isBlockbuster ? (!allowBlockbuster || valueGap > 5 || Math.abs(playerA.ovr - playerB.ovr) > 4) : valueGap > 5.5) continue;
      if (!preservesPositionCoverage(teamA, playerA, playerB, floors.get(teamA.id)!) || !preservesPositionCoverage(teamB, playerB, playerA, floors.get(teamB.id)!)) continue;

      const oldRatingA = calculateTeamPowerRating(teamA);
      const oldRatingB = calculateTeamPowerRating(teamB);
      const newRatingA = ratingAfterSwap(teamA, playerA, playerB);
      const newRatingB = ratingAfterSwap(teamB, playerB, playerA);
      if (!acceptsDirection(strategyA, playerA, playerB, oldRatingA, newRatingA)) continue;
      if (!acceptsDirection(strategyB, playerB, playerA, oldRatingB, newRatingB)) continue;

      // Rebuilding teams prefer youth/upside; contenders prefer immediate OVR and positional need.
      const fit = (positionNeed(teamA, playerB.position, playerA) - positionNeed(teamA, playerA.position, playerA)) +
        (positionNeed(teamB, playerA.position, playerB) - positionNeed(teamB, playerB.position, playerB));
      const directionA = directionUtility(strategyA, playerA, playerB, newRatingA - oldRatingA);
      const directionB = directionUtility(strategyB, playerB, playerA, newRatingB - oldRatingB);
      const complementary = (strategyA === 'rebuilding' && (strategyB === 'contender' || strategyB === 'playoff')) ||
        (strategyB === 'rebuilding' && (strategyA === 'contender' || strategyA === 'playoff')) ? 12 : 0;
      const score = fit + directionA + directionB + complementary - valueGap * 1.8 + random() * 8 + (isBlockbuster ? 8 : 0);
      const category = isBlockbuster ? 'blockbuster' : Math.max(playerA.ovr, playerB.ovr) >= 78 ? 'starter' : 'rotation';
      if (!best || score > best.score) best = { playerA, playerB, score, category };
    }
  }
  return best;
}

const DEPTH_FIRST_NAMES = ['安托万', '拉蒙', '达奎恩', '德肖恩', '马奎斯', '泰里克', '贾维恩', '肯德里克', '德安吉洛', '泰伦', '马肖恩', '阿米尔', '杰迈克尔', '拉沙德', '戴蒙', '凯文特', '蒙特雷兹', '安芬尼', '贾希尔', '德隆', '马库尔', '奎因', '泰肖恩', '雷吉', '达柳斯', '马库尔斯', '德米特里', '贾维斯', '罗德尼', '考特尼', '拉沃伊', '阿朗佐', '达米尔', '杰梅因', '梅尔文', '泰厄斯', '温德尔', '德安德烈', '贾斯蒂斯', '朗尼'];
const DEPTH_LAST_NAMES = ['普莱斯', '沃特金斯', '桑德斯', '伍兹', '贝尔', '科尔曼', '弗洛伊德', '休斯', '佩里', '鲍威尔', '霍顿', '麦克莱恩', '布里奇斯', '麦基', '福斯特', '班克斯', '桑顿', '亨特', '惠特克', '帕克斯', '考德威尔', '钱德勒', '丹尼尔斯', '菲尔兹', '盖恩斯', '哈迪', '英格拉姆', '杰弗里斯', '奈特', '兰姆', '梅森', '诺埃尔', '奥尼尔', '普林斯', '雷诺兹', '谢泼德', '塔克', '沃恩', '韦尔', '齐格勒'];
const DEPTH_POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

function createDepthPlayer(team: Team, year: number, index: number, usedNames: Set<string>): RosterPlayer {
  const seed = year * 31 + team.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + index * 17;
  const nameSpace = DEPTH_FIRST_NAMES.length * DEPTH_LAST_NAMES.length;
  let name = '';
  for (let offset = 0; offset < nameSpace; offset += 1) {
    const nameCode = (Math.abs(seed) * 41 + offset * 43) % nameSpace;
    const first = DEPTH_FIRST_NAMES[nameCode % DEPTH_FIRST_NAMES.length];
    const last = DEPTH_LAST_NAMES[Math.floor(nameCode / DEPTH_FIRST_NAMES.length) % DEPTH_LAST_NAMES.length];
    const candidate = `${first}·${last}`;
    if (!usedNames.has(candidate)) {
      name = candidate;
      usedNames.add(candidate);
      break;
    }
  }
  if (!name) name = `训练营球员·${year}-${team.abbrev}-${index + 1}`;
  const ovr = 66 + (Math.abs(seed) % 6);
  const position = [...DEPTH_POSITIONS].sort((a, b) => {
    const depth = (slot: Position) => team.roster.filter((p) => p.position === slot || getSecondaryPosition(p) === slot).length;
    return depth(a) - depth(b) || bestAtPosition(team.roster, a) - bestAtPosition(team.roster, b);
  })[0];
  return {
    id: `parallel_depth_${year}_${team.id}_${index}`,
    name,
    position,
    ovr,
    age: 22 + (Math.abs(seed) % 6),
    peakAge: 26,
    peakOvr: Math.min(80, ovr + 7),
    peakDuration: 3,
    isStar: false,
    role: '饮水机守门员',
  };
}

function retirePlayers(teams: Team[], year: number, options: RandomTradeOptions): { all: ExecutedTradeDetail[]; visible: ExecutedTradeDetail[] } {
  const scheduled = new Set(
    (HISTORICAL_REAL_TRADES[year]?.trades || [])
      .filter((trade) => trade.type === 'retire' && trade.retiredPlayerName)
      .map((trade) => trade.retiredPlayerName as string),
  );
  const all: ExecutedTradeDetail[] = [];
  const visible: ExecutedTradeDetail[] = [];
  for (const team of teams) {
    const retained: RosterPlayer[] = [];
    for (const player of team.roster) {
      const shouldRetire = !isUser(player, options) && (scheduled.has(player.name) || (player.age || 0) >= 43);
      if (!shouldRetire) {
        retained.push(player);
        continue;
      }
      const detail: ExecutedTradeDetail = {
        id: `parallel_retire_${year}_${player.id || player.name}`,
        type: 'retire',
        importanceScore: (player.peakOvr || player.ovr) * 2,
        retireDetail: { playerName: player.name, position: player.position, ovr: player.ovr, fromTeamId: team.id, fromTeamName: team.name },
      };
      all.push(detail);
      if ((player.peakOvr || player.ovr) >= 88) visible.push(detail);
    }
    team.roster = retained;
  }
  return { all, visible };
}

/** First season remains historical. From 2009 onward, generates 14–20 real roster moves and only stores headline deals. */
export function executeRandomTradesForSeason(currentTeams: Team[], year: number, options: RandomTradeOptions = {}): { updatedTeams: Team[]; modalData: TradeModalData | null } {
  if (year <= 2008 || currentTeams.length < 2) return { updatedTeams: currentTeams, modalData: null };
  const random = options.random || Math.random;
  const minTrades = Math.max(1, options.minTrades ?? 14);
  const maxTrades = Math.max(minTrades, options.maxTrades ?? 20);
  const target = minTrades + Math.floor(random() * (maxTrades - minTrades + 1));
  const teams = applyHistoricalTeamIdentityUpdates(
    currentTeams.map((team) => ({ ...team, roster: team.roster.map((p) => ({ ...p })) })),
    year,
  );
  const rosterTargets = new Map(teams.map((team) => [team.id, team.roster.length]));
  const retirements = retirePlayers(teams, year, options);
  const positionFloors = new Map(teams.map((team) => [team.id, Object.fromEntries(DEPTH_POSITIONS.map((position) => {
    const best = bestAtPosition(team.roster, position);
    return [position, best >= 76 ? Math.max(76, best - 6) : best];
  })) as Record<Position, number>]));
  const moved = new Set<string>();
  const counts = new Map<string, number>();
  const trades: ExecutedTradeDetail[] = [];
  let blockbusterCount = 0;
  const blockbusterRoll = random();
  const blockbusterTarget = blockbusterRoll < 0.08 ? 2 : blockbusterRoll < 0.38 ? 1 : 0;

  for (let attempt = 0; attempt < 1600 && trades.length < target; attempt += 1) {
    const available = teams.filter((t) => {
      const limit = t.id === options.defendingChampionTeamId ? 1 : 3;
      return (counts.get(t.id) || 0) < limit;
    });
    if (available.length < 2) break;
    const leastUsed = Math.min(...available.map((t) => counts.get(t.id) || 0));
    const preferred = available.filter((t) => (counts.get(t.id) || 0) === leastUsed);
    const teamA = preferred[Math.floor(random() * preferred.length)] || available[0];
    const opponents = available.filter((t) => t.id !== teamA.id);
    const teamB = opponents[Math.floor(random() * opponents.length)];
    if (!teamB) continue;
    const seekBlockbuster = blockbusterCount < blockbusterTarget && attempt < 600;
    const allowBlockbuster = seekBlockbuster;
    const pair = findPair(teamA, teamB, year, moved, options, random, allowBlockbuster, seekBlockbuster, positionFloors);
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
  const usedNames = new Set(teams.flatMap((team) => team.roster.map((player) => player.name)));
  for (const team of teams) {
    const targetSize = rosterTargets.get(team.id) || 15;
    while (team.roster.length < targetSize) team.roster.push(createDepthPlayer(team, year, team.roster.length, usedNames));
    refreshTeam(team);
  }
  if (!trades.length && !retirements.all.length) return { updatedTeams: teams, modalData: null };
  const userDeals = trades.filter((t) => t.playerA?.fromTeamId === options.userTeamId || t.playerB?.fromTeamId === options.userTeamId);
  const importantDeals = trades.filter((trade) => trade.tradeCategory !== 'rotation');
  const headlines = [...userDeals, ...importantDeals, ...retirements.visible]
    .filter((trade, index, array) => array.findIndex((candidate) => candidate.id === trade.id) === index)
    .sort((a, b) => (b.importanceScore || 0) - (a.importanceScore || 0))
    .slice(0, 10);
  const totalTransactions = trades.length + retirements.all.length;
  return { updatedTeams: teams, modalData: { year, seasonName: `${year}-${year + 1} 赛季 · 平行联盟`, tradeSource: 'random', totalTransactions, hiddenTransactions: totalTransactions - headlines.length, executedTrades: headlines } };
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
  const replaceable = userTeam.roster.filter((p) => p.id !== userPlayerId && p.name !== userPlayerName && (p.tradeProtectionUntilYear || 0) < currentYear);
  // Replace a player at the same position when possible, so a positional
  // reinforcement does not leave the roster more unbalanced than before.
  const samePosition = replaceable.filter((p) => p.position === invitedPlayer.position || p.secondaryPosition === invitedPlayer.position);
  const outgoingPlayer = [...(samePosition.length ? samePosition : replaceable)].sort((a, b) => a.ovr - b.ovr)[0];
  if (!outgoingPlayer) return { updatedTeams: currentTeams, error: '当前球队没有可调整的阵容名额' };
  const outgoingIndex = userTeam.roster.findIndex((p) => p.id === outgoingPlayer.id);
  if (outgoingIndex < 0) return { updatedTeams: currentTeams, error: '阵容调整失败，请稍后重试' };
  sourceTeam.roster[invitedIndex] = { ...outgoingPlayer };
  userTeam.roster[outgoingIndex] = { ...invitedPlayer, acquisitionSource: 'star_invitation', tradeProtectionUntilYear: currentYear + 1 };
  refreshTeam(sourceTeam); refreshTeam(userTeam);
  return { updatedTeams: teams, invitedPlayer: userTeam.roster.find((p) => p.id === invitedPlayer.id), outgoingPlayer };
}
