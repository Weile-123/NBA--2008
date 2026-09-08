import { Team, RosterPlayer, PlayerProfile, Position } from '../types';
import { getHistoricalDraftData, DraftPickItem } from '../data/draftData';

/**
 * Dynamically calculates realistic user draft pick based on player overall rating (OVR).
 * 85+ OVR -> high probability for #1 pick
 * 80-84 OVR -> lottery / top 10 pick
 * 75-79 OVR -> mid to late 1st round
 * 70-74 OVR -> late 1st round / 2nd round
 * <70 OVR -> late 1st or 2nd round
 */
export function calculateUserDraftPick(ovr: number): number {
  const rand = Math.random();
  if (ovr <= 70) {
    // 65-70 OVR: 25% 乐透区 (4-10), 75% 首轮 (11-20)
    if (rand < 0.25) {
      return Math.floor(4 + Math.random() * 7); // 4 to 10
    } else {
      return Math.floor(11 + Math.random() * 10); // 11 to 20
    }
  } else if (ovr <= 75) {
    // 71-75 OVR: 8% 前三 (1-3), 52% 乐透区 (4-10), 40% 首轮 (11-20)
    if (rand < 0.08) {
      return Math.floor(1 + Math.random() * 3); // 1 to 3
    } else if (rand < 0.60) { // 8% + 52% = 60%
      return Math.floor(4 + Math.random() * 7); // 4 to 10
    } else {
      return Math.floor(11 + Math.random() * 10); // 11 to 20
    }
  } else if (ovr <= 80) {
    // 76-80 OVR: 30% 前三 (1-3), 50% 乐透区 (4-10), 20% 首轮 (11-20)
    if (rand < 0.30) {
      return Math.floor(1 + Math.random() * 3); // 1 to 3
    } else if (rand < 0.80) {
      return Math.floor(4 + Math.random() * 7); // 4 to 10
    } else {
      return Math.floor(11 + Math.random() * 10); // 11 to 20
    }
  } else {
    // 81+ OVR: 70% #1 顺位, 20% 前三 (#2-#3), 10% 乐透区 (4-10)
    if (rand < 0.70) {
      return 1;
    } else if (rand < 0.90) {
      return Math.random() < 0.5 ? 2 : 3;
    } else {
      return Math.floor(4 + Math.random() * 7);
    }
  }
}

/**
 * Applies draft results for a given year to all 30 teams in the league:
 * 1. Adds each drafted rookie to their drafting team's roster with `isRookie: true`.
 * 2. Removes the lowest OVR player at the same position (or lowest overall if no position match)
 *    to maintain the strict 15-player roster limit.
 * 3. Re-sorts roster and re-assigns team roles and team ratings.
 */
export function applyDraftRookiesToTeams(
  teams: Team[],
  year: number,
  userPlayer: PlayerProfile | null
): Team[] {
  const draftData = getHistoricalDraftData(year);
  const picks: DraftPickItem[] = draftData.draftPicks;

  // Clone teams array
  const updatedTeams = teams.map((team) => ({
    ...team,
    roster: [...team.roster],
  }));

  for (const pickItem of picks) {
    const teamIndex = updatedTeams.findIndex((t) => t.id === pickItem.teamId);
    if (teamIndex === -1) continue;

    const team = updatedTeams[teamIndex];
    const p = pickItem.player;

    // Check if player is already on roster or is user
    const isUserPlayer = userPlayer && (userPlayer.name === p.name || p.id === userPlayer.id);
    if (isUserPlayer) continue; // User player managed separately

    const alreadyInRoster = team.roster.some((m) => m.name === p.name);
    if (alreadyInRoster) continue;

    // Create rookie player object
    const rookieRosterPlayer: RosterPlayer = {
      id: `rookie_${year}_${p.name}`,
      name: p.name,
      position: p.position,
      ovr: p.ovr,
      age: p.age,
      peakAge: p.peakAge || 26,
      peakOvr: p.peakOvr || Math.max(80, p.ovr + 8),
      peakDuration: p.peakDuration || 5,
      isStar: p.ovr >= 78,
      isRookie: true, // FLAG SET TO TRUE
      role: '轮换替补',
    };

    // Add rookie to roster
    team.roster.push(rookieRosterPlayer);

    // Filter out user player and the newly added rookie from removal candidates
    const candidates = team.roster.filter(
      (m) =>
        !(userPlayer && (m.id === userPlayer.id || m.name === userPlayer.name)) &&
        m.id !== rookieRosterPlayer.id
    );

    let playerToRemove: RosterPlayer | null = null;

    if (candidates.length > 0) {
      // Sort ascending by OVR to find the lowest rated player on the team
      candidates.sort((a, b) => a.ovr - b.ovr);
      playerToRemove = candidates[0];
    }

    // Remove player if roster length exceeds 15
    if (team.roster.length > 15 && playerToRemove) {
      const remIdx = team.roster.findIndex((m) => m.id === playerToRemove!.id);
      if (remIdx !== -1) {
        team.roster.splice(remIdx, 1);
      }
    }

    // Re-sort roster by OVR and reassign roles
    team.roster.sort((a, b) => b.ovr - a.ovr);
    team.roster.forEach((m, idx) => {
      if (idx === 0) m.role = '战术核心';
      else if (idx < 5) m.role = '绝对首发';
      else if (idx === 5) m.role = '第六人';
      else if (idx < 10) m.role = '轮换替补';
      else m.role = '饮水机守门员';
    });

    // Recalculate top 10 team average rating
    const top10Avg = Math.round(
      team.roster.slice(0, 10).reduce((sum, m) => sum + m.ovr, 0) / Math.min(10, team.roster.length)
    );
    team.rating = top10Avg;
  }

  return updatedTeams;
}
