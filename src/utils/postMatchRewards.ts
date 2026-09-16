import type { PlayerProfile } from '../types';

export interface PostMatchRewards {
  xpEarned: number;
  moraleDelta: number;
  mediaRepDelta: number;
  fanDelta: number;
  skillPointsEarned?: number;
}

/** Shared by regular-season and playoff interactive post-match settlement. */
export function applyPostMatchRewards(player: PlayerProfile, rewards: PostMatchRewards): PlayerProfile {
  const maxXp = player.maxXp || 500;
  let nextXp = (player.xp || 0) + rewards.xpEarned;
  let nextLevel = player.level || 1;
  let nextSkillPoints = (player.skillPoints || 0) + (rewards.skillPointsEarned || 0);
  let nextMaxXp = maxXp;

  if (nextXp >= maxXp) {
    nextLevel += 1;
    nextSkillPoints += 1;
    nextXp -= maxXp;
    nextMaxXp = Math.round(maxXp * 1.15);
  }

  return {
    ...player,
    xp: nextXp,
    maxXp: nextMaxXp,
    level: nextLevel,
    skillPoints: nextSkillPoints,
    morale: Math.min(100, Math.max(0, player.morale + rewards.moraleDelta)),
    mediaReputation: Math.min(100, Math.max(0, player.mediaReputation + rewards.mediaRepDelta)),
    fansCount: player.fansCount + rewards.fanDelta,
  };
}

/** A resumed playoff result may be shown again, but its reward is only granted once. */
export function applyPlayoffPostMatchRewards(player: PlayerProfile, gameId: string, rewards: PostMatchRewards): PlayerProfile {
  if ((player.playoffRewardGameIds || []).includes(gameId)) return player;
  const rewarded = applyPostMatchRewards(player, rewards);
  return {
    ...rewarded,
    playoffRewardGameIds: [...(player.playoffRewardGameIds || []), gameId],
  };
}
