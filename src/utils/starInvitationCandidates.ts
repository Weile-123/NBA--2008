import type { PlayerProfile, Position, RosterPlayer, Team } from '../types';

export interface StarInvitationCandidate { team: Team; player: RosterPlayer }

const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

function invitationOrder(key: string, year: number): number {
  let hash = year * 2654435761;
  for (let index = 0; index < key.length; index += 1) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
  return hash >>> 0;
}

/** A missing starter matters more than depth; the user's own position counts as filled. */
export function rankTeamPositionNeeds(team: Team, player: Pick<PlayerProfile, 'id' | 'name' | 'position' | 'secondaryPosition' | 'ovr'>): Position[] {
  const roster = team.roster.filter((candidate) => candidate.id !== player.id && candidate.name !== player.name);
  const scores = POSITIONS.map((position) => {
    const ratings = roster
      .filter((candidate) => candidate.position === position || candidate.secondaryPosition === position)
      .map((candidate) => candidate.ovr);
    if (player.position === position || player.secondaryPosition === position) ratings.push(player.ovr);
    ratings.sort((a, b) => b - a);
    const starter = ratings[0] ?? 50;
    const backup = ratings[1] ?? 50;
    return { position, need: Math.max(0, 86 - starter) * 2 + Math.max(0, 76 - backup) };
  });
  return scores.sort((a, b) => b.need - a.need || POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position))
    .map(({ position }) => position);
}

export function getStarInvitationCandidates(
  currentTeam: Team,
  allTeams: Team[],
  player: Pick<PlayerProfile, 'id' | 'name' | 'position' | 'secondaryPosition' | 'ovr' | 'invitedStarPlayerIds'>,
  currentYear: number,
): StarInvitationCandidate[] {
  const eligible = allTeams
    .filter((team) => team.id !== currentTeam.id)
    .flatMap((team) => team.roster
      .filter((candidate) => candidate.ovr >= 86 && candidate.id !== player.id && candidate.name !== player.name
        && !(player.invitedStarPlayerIds || []).includes(candidate.id))
      .map((candidate) => ({ team, player: candidate })));
  const needs = rankTeamPositionNeeds(currentTeam, player);
  const byNeed = needs.map((position) => eligible
    .filter(({ player: candidate }) => candidate.position === position)
    .sort((a, b) => b.player.ovr - a.player.ovr
      || invitationOrder(`${a.team.id}:${a.player.id}`, currentYear) - invitationOrder(`${b.team.id}:${b.player.id}`, currentYear)));
  const selected: StarInvitationCandidate[] = [];
  const seen = new Set<string>();
  // Fill the two weakest positions first, alternating so a single position
  // cannot consume all six invitations. Widen only when candidates run out.
  for (const pool of [byNeed.slice(0, 2), byNeed.slice(2)]) {
    let found = true;
    while (selected.length < 6 && found) {
      found = false;
      for (const candidates of pool) {
        const next = candidates.find(({ player: candidate }) => !seen.has(candidate.id));
        if (!next) continue;
        selected.push(next);
        seen.add(next.player.id);
        found = true;
        if (selected.length === 6) break;
      }
    }
    if (selected.length === 6) break;
  }
  return selected;
}
