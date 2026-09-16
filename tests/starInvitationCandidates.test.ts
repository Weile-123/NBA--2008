import assert from 'node:assert/strict';
import test from 'node:test';
import type { PlayerProfile, Position, RosterPlayer, Team } from '../src/types';
import { getStarInvitationCandidates, rankTeamPositionNeeds } from '../src/utils/starInvitationCandidates';
import { inviteStarToTeam } from '../src/utils/randomTradeLogic';

const player = { id: 'user', name: '用户', position: 'PG', ovr: 95, invitedStarPlayerIds: [] } as PlayerProfile;
const makePlayer = (id: string, position: Position, ovr: number): RosterPlayer => ({ id, name: id, position, ovr });
const makeTeam = (id: string, roster: RosterPlayer[]): Team => ({
  id, name: id, city: id, abbrev: id, primaryColor: '#000', secondaryColor: '#fff', rating: 80,
  conference: 'East', starPlayer: '', wins: 0, losses: 0, roster,
});

test('star invitations prioritize the two weakest positions and count the user as a starter', () => {
  const home = makeTeam('home', [
    makePlayer('pg', 'PG', 90), makePlayer('sg', 'SG', 88), makePlayer('sf', 'SF', 60),
    makePlayer('pf', 'PF', 61), makePlayer('c', 'C', 91),
  ]);
  const away = makeTeam('away', [
    makePlayer('sf1', 'SF', 93), makePlayer('sf2', 'SF', 89), makePlayer('sf3', 'SF', 87),
    makePlayer('pf1', 'PF', 94), makePlayer('pf2', 'PF', 90), makePlayer('pf3', 'PF', 86),
    makePlayer('pg1', 'PG', 99), makePlayer('sg1', 'SG', 98),
  ]);
  assert.deepEqual(rankTeamPositionNeeds(home, player).slice(0, 2), ['SF', 'PF']);
  const candidates = getStarInvitationCandidates(home, [home, away], player, 2008);
  assert.equal(candidates.length, 6);
  assert.ok(candidates.every(({ player: candidate }) => candidate.position === 'SF' || candidate.position === 'PF'));
  assert.equal(candidates.filter(({ player: candidate }) => candidate.position === 'SF').length, 3);
  assert.equal(candidates.filter(({ player: candidate }) => candidate.position === 'PF').length, 3);
});

test('invited positional star replaces an eligible player at the same position', () => {
  const home = makeTeam('home', [makePlayer('low-pg', 'PG', 50), makePlayer('sf', 'SF', 65)]);
  const away = makeTeam('away', [makePlayer('star-sf', 'SF', 92)]);
  const result = inviteStarToTeam([home, away], home.id, away.id, 'star-sf', 2008, player.id, player.name);
  assert.equal(result.outgoingPlayer?.id, 'sf');
  assert.equal(result.invitedPlayer?.position, 'SF');
});
