import type { Team, TeamStrategy } from '../types';

const STRATEGY_LABELS: Record<TeamStrategy, string> = {
  contender: '争冠',
  playoff: '季后赛竞争',
  retooling: '观望调整',
  rebuilding: '重建',
};

const STRATEGY_ORDER: TeamStrategy[] = ['rebuilding', 'retooling', 'playoff', 'contender'];
const MIN_STRATEGY_TENURE = 3;

function strategyForRank(index: number, total: number): TeamStrategy {
  const percentile = index / Math.max(1, total);
  if (percentile < 0.2) return 'contender';
  if (percentile < 0.5) return 'playoff';
  if (percentile < 0.8) return 'retooling';
  return 'rebuilding';
}

function stepToward(previous: TeamStrategy | undefined, target: TeamStrategy): TeamStrategy {
  if (!previous) return target;
  const from = STRATEGY_ORDER.indexOf(previous);
  const to = STRATEGY_ORDER.indexOf(target);
  if (Math.abs(from - to) <= 1) return target;
  return STRATEGY_ORDER[from + Math.sign(to - from)];
}

function withGuaranteedExtremes(teams: Team[], year: number): Team[] {
  const result = teams.map((team) => ({ ...team }));
  if (!result.some((team) => team.strategy === 'contender')) result[0] = { ...result[0], strategy: 'contender', strategySinceYear: year };
  if (!result.some((team) => team.strategy === 'rebuilding')) result[result.length - 1] = { ...result[result.length - 1], strategy: 'rebuilding', strategySinceYear: year };
  return result;
}

export function initializeTeamStrategies(teams: Team[], year: number): Team[] {
  const sorted = [...teams].sort((a, b) => b.rating - a.rating);
  const strategyById = new Map(sorted.map((team, index) => [team.id, strategyForRank(index, sorted.length)]));
  return teams.map((team) => ({
    ...team,
    strategy: strategyById.get(team.id) || 'retooling',
    strategyScore: team.rating,
    strategySinceYear: year,
    strategyUpdatedYear: year,
    strategyModelVersion: 2,
  }));
}

/** Re-evaluates every team after a completed season while avoiding one-year label oscillation. */
export function evaluateTeamStrategies(teams: Team[], nextSeasonYear: number): Team[] {
  const scored = teams.map((team) => {
    const games = Math.max(1, (team.wins || 0) + (team.losses || 0));
    const winScore = Math.min(100, Math.max(0, (team.wins / games) * 100));
    const ratingScore = Math.min(100, Math.max(0, ((team.rating - 65) / 34) * 100));
    const core = [...team.roster].sort((a, b) => b.ovr - a.ovr).slice(0, 6);
    const coreAge = core.reduce((sum, player) => sum + (player.age || 25), 0) / Math.max(1, core.length);
    const timelineScore = coreAge <= 24 ? 66 : coreAge <= 29 ? 92 : coreAge <= 31 ? 68 : 42;
    const winTrend = team.previousSeasonWins === undefined ? 0 : team.wins - team.previousSeasonWins;
    const ratingTrend = team.previousSeasonRating === undefined ? 0 : team.rating - team.previousSeasonRating;
    const trendScore = Math.min(100, Math.max(0, 50 + winTrend * 3 + ratingTrend * 6));
    const score = Math.round(winScore * 0.45 + ratingScore * 0.3 + timelineScore * 0.15 + trendScore * 0.1);
    return { team, score };
  });
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const targetById = new Map(sorted.map((item, index) => [item.team.id, strategyForRank(index, sorted.length)]));
  const updated = sorted.map(({ team, score }) => {
    const tenure = nextSeasonYear - (team.strategySinceYear ?? (nextSeasonYear - MIN_STRATEGY_TENURE));
    const strategy = team.strategy && tenure < MIN_STRATEGY_TENURE
      ? team.strategy
      : stepToward(team.strategy, targetById.get(team.id) || 'retooling');
    return { ...team, strategy, strategyScore: score, strategySinceYear: team.strategy === strategy ? (team.strategySinceYear || nextSeasonYear) : nextSeasonYear, strategyUpdatedYear: nextSeasonYear, strategyModelVersion: 2, previousSeasonWins: team.wins, previousSeasonRating: team.rating };
  });
  const guaranteed = withGuaranteedExtremes(updated, nextSeasonYear);
  const byId = new Map(guaranteed.map((team) => [team.id, team]));
  return teams.map((team) => byId.get(team.id) || team);
}

export function getTeamStrategyLabel(strategy?: TeamStrategy): string {
  return strategy ? STRATEGY_LABELS[strategy] : '观望调整';
}

export function getEffectiveTeamStrategy(team: Team, leagueTeams?: Team[]): TeamStrategy {
  if (team.strategy) return team.strategy;
  if (leagueTeams?.length) {
    const sorted = [...leagueTeams].sort((a, b) => b.rating - a.rating);
    const rank = Math.max(0, sorted.findIndex((candidate) => candidate.id === team.id));
    return strategyForRank(rank, sorted.length);
  }
  return team.rating >= 88 ? 'contender' : team.rating >= 84 ? 'playoff' : team.rating >= 78 ? 'retooling' : 'rebuilding';
}

export function getTeamStrategyDescription(strategy: TeamStrategy): string {
  switch (strategy) {
    case 'contender': return '围绕成熟核心补强，即战力与季后赛表现优先';
    case 'playoff': return '保持竞争力，并针对阵容短板进行升级';
    case 'retooling': return '评估现有核心，在即战力与年轻资产间保持平衡';
    case 'rebuilding': return '优先培养年轻球员与未来天赋，老将可能进入交易市场';
  }
}
