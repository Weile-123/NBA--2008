import type { PlayerProfile } from '../types';
import { getPlayerBaseOvr, getPlayerCareerPeakOvr, getUserPlayerAgePenalty } from './calc2k';

export interface AttributePointStatus {
  baseOvr: number;
  maxOvr: number;
  redistributionPoints: number;
  hasUpgradableAttributes: boolean;
  isOvrAtCap: boolean;
  isOverflowing: boolean;
  overflowGoatBonus: number;
  overflowProgress: number;
}

export function getAttributePointStatus(player: PlayerProfile): AttributePointStatus {
  const skillPoints = Math.max(0, player.skillPoints || 0);
  const redistributionPoints = Math.min(skillPoints, Math.max(0, player.attributeRedistributionPoints || 0));
  const baseOvr = getPlayerBaseOvr(player);
  const maxOvr = 99 - getUserPlayerAgePenalty(player.age || 19);
  const isOvrAtCap = baseOvr >= maxOvr;
  const hasAttributeRoom = (Object.keys(player.attributes) as Array<keyof PlayerProfile['attributes']>).some((key) => {
    const currentValue = player.attributes[key] ?? 50;
    const cap = player.attributeCaps?.[key] ?? 99;
    return currentValue < cap;
  });
  const hasUpgradableAttributes = skillPoints > 0
    && hasAttributeRoom
    && (!isOvrAtCap || redistributionPoints > 0);
  const isOverflowing = skillPoints > 0 && isOvrAtCap && redistributionPoints === 0;

  return {
    baseOvr,
    maxOvr,
    redistributionPoints,
    hasUpgradableAttributes,
    isOvrAtCap,
    isOverflowing,
    overflowGoatBonus: Math.floor(skillPoints / 100) * 10,
    overflowProgress: skillPoints % 100,
  };
}

export function spendPlayerAttributePoints(
  player: PlayerProfile,
  attrKey: keyof PlayerProfile['attributes'],
  requestedPoints: number,
): PlayerProfile {
  if (player.skillPoints <= 0 || requestedPoints <= 0) return player;

  const maxOvr = 99 - getUserPlayerAgePenalty(player.age || 19);
  const redistributionPoints = Math.max(0, player.attributeRedistributionPoints || 0);
  const isOvrAtCap = getPlayerBaseOvr(player) >= maxOvr;
  if (isOvrAtCap && redistributionPoints <= 0) return player;

  const currentValue = player.attributes[attrKey] ?? 50;
  const attributeCap = player.attributeCaps?.[attrKey] ?? 99;
  const availablePoints = Math.min(
    requestedPoints,
    player.skillPoints,
    Math.max(0, attributeCap - currentValue),
    isOvrAtCap ? redistributionPoints : Number.POSITIVE_INFINITY,
  );
  if (availablePoints <= 0) return player;

  let pointsSpent = 0;
  let nextValue = currentValue;
  let nextOvr = getPlayerBaseOvr(player);
  while (pointsSpent < availablePoints) {
    const isUsingRedistributionPoint = pointsSpent < redistributionPoints;
    if (!isUsingRedistributionPoint && nextOvr >= maxOvr) break;
    nextValue += 1;
    pointsSpent += 1;
    nextOvr = getPlayerBaseOvr({
      ...player,
      attributes: { ...player.attributes, [attrKey]: nextValue },
    });
  }
  if (pointsSpent === 0) return player;

  return {
    ...player,
    attributes: { ...player.attributes, [attrKey]: nextValue },
    ovr: nextOvr,
    peakOvr: Math.max(getPlayerCareerPeakOvr(player), nextOvr),
    peakOvrTracked: true,
    skillPoints: player.skillPoints - pointsSpent,
    attributeRedistributionPoints: Math.max(0, redistributionPoints - pointsSpent),
  };
}

export function resetPlayerAttribute(
  player: PlayerProfile,
  attrKey: keyof PlayerProfile['attributes'],
): PlayerProfile {
  const currentValue = player.attributes[attrKey] ?? 50;
  if (currentValue <= 60) return player;

  const refund = currentValue - 60;
  const attributes = { ...player.attributes, [attrKey]: 60 };
  return {
    ...player,
    attributes,
    ovr: getPlayerBaseOvr({ ...player, attributes }),
    skillPoints: (player.skillPoints || 0) + refund,
    attributeRedistributionPoints: (player.attributeRedistributionPoints || 0) + refund,
  };
}
