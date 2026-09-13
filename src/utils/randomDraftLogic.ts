import { getHistoricalDraftData, type DraftPickItem, type YearDraftData } from '../data/draftData';
import type { Position, Team } from '../types';

function shuffleWeightedLottery(teams: Team[], random: () => number): Team[] {
  const pool = [...teams];
  const winners: Team[] = [];
  // Only the first four picks are drawn; worse records receive larger weights.
  while (winners.length < Math.min(4, pool.length)) {
    const weights = pool.map((_, index) => Math.max(1, pool.length - index) ** 1.35);
    let draw = random() * weights.reduce((sum, value) => sum + value, 0);
    let selected = 0;
    for (; selected < weights.length - 1; selected += 1) {
      draw -= weights[selected];
      if (draw <= 0) break;
    }
    winners.push(pool.splice(selected, 1)[0]);
  }
  return [...winners, ...pool];
}

function needScore(team: Team, position: Position): number {
  const best = team.roster.filter((p) => p.position === position).reduce((max, p) => Math.max(max, p.ovr), 60);
  return 100 - best;
}

function talentScore(pick: DraftPickItem): number {
  const p = pick.player;
  return (p.peakOvr || p.ovr + 7) * 1.5 + p.ovr * 0.75 - Math.max(0, p.age - 20) * 1.5;
}

function maxFall(pick: DraftPickItem): number {
  const peak = pick.player.peakOvr || pick.player.ovr + 7;
  if (peak >= 95) return 5;
  if (peak >= 91) return 10;
  if (peak >= 87) return 16;
  return 30;
}

/** Builds a draft owned by this save: order follows simulated records while the real rookie class and elite talent hierarchy remain intact. */
export function generateParallelDraftData(teams: Team[], year: number, random: () => number = Math.random): YearDraftData | null {
  const historical = getHistoricalDraftData(year);
  if (year <= 2008 || !historical?.draftPicks?.length) return historical || null;

  const standings = [...teams].sort((a, b) => a.wins - b.wins || b.losses - a.losses || a.rating - b.rating);
  const lottery = shuffleWeightedLottery(standings.slice(0, 14), random);
  const draftOrder = [...lottery, ...standings.slice(14)];
  const prospects = [...historical.draftPicks].sort((a, b) => talentScore(b) - talentScore(a));
  const remaining = [...prospects];
  const draftPicks: DraftPickItem[] = [];

  for (let index = 0; index < Math.min(30, draftOrder.length, prospects.length); index += 1) {
    const pickNumber = index + 1;
    const team = draftOrder[index];
    const forced = remaining.filter((candidate) => maxFall(candidate) <= pickNumber);
    const window = forced.length ? forced : remaining.slice(0, Math.min(5, remaining.length));
    const selected = [...window].sort((a, b) => {
      const scoreA = talentScore(a) + needScore(team, a.player.position) * 0.18 + random() * 3;
      const scoreB = talentScore(b) + needScore(team, b.player.position) * 0.18 + random() * 3;
      return scoreB - scoreA;
    })[0];
    remaining.splice(remaining.indexOf(selected), 1);
    draftPicks.push({ ...selected, pick: pickNumber, teamId: team.id, teamName: team.name });
  }

  return {
    year,
    lotteryResults: draftPicks.slice(0, 14).map((pick) => ({
      pick: pick.pick,
      teamId: pick.teamId,
      teamName: pick.teamName,
      odds: '模拟战绩加权',
      projectName: pick.player.name,
      projectPosition: pick.player.position,
    })),
    draftPicks,
  };
}
