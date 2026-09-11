import { Dispatch,SetStateAction } from 'react';
import { INITIAL_ENDORSEMENTS,PERSONAL_ASSETS } from '../data/nbaData2008';
import { PlayerProfile,SignatureShoe } from '../types';
import { getPlayerBaseOvr, getPlayerCareerPeakOvr, getUserPlayerAgePenalty } from '../utils/calc2k';
import { completeRewardedAd } from '../lib/rewardedAd';
import { getAssetPurchaseState } from '../utils/economy';

export function usePlayerActions(
  player: PlayerProfile | null,
  setPlayer: Dispatch<SetStateAction<PlayerProfile | null>>,
  careerSeasons: number,
  currentYear: number,
) {
  const spendAttributePoints = (
    attrKey: keyof PlayerProfile['attributes'],
    requestedPoints: number,
  ) => {
    setPlayer((currentPlayer) => {
      if (!currentPlayer || currentPlayer.skillPoints <= 0 || requestedPoints <= 0) return currentPlayer;

      const maxOvr = 99 - getUserPlayerAgePenalty(currentPlayer.age || 19);
      if (getPlayerBaseOvr(currentPlayer) >= maxOvr) return currentPlayer;

      const currentValue = currentPlayer.attributes[attrKey] ?? 50;
      const attributeCap = currentPlayer.attributeCaps?.[attrKey] ?? 99;
      const availablePoints = Math.min(
        requestedPoints,
        currentPlayer.skillPoints,
        Math.max(0, attributeCap - currentValue),
      );
      if (availablePoints <= 0) return currentPlayer;

      let pointsSpent = 0;
      let nextValue = currentValue;
      let nextOvr = getPlayerBaseOvr(currentPlayer);

      while (pointsSpent < availablePoints && nextOvr < maxOvr) {
        nextValue += 1;
        pointsSpent += 1;
        nextOvr = getPlayerBaseOvr({
          ...currentPlayer,
          attributes: { ...currentPlayer.attributes, [attrKey]: nextValue },
        });
      }

      if (pointsSpent === 0) return currentPlayer;
      const nextAttributes = { ...currentPlayer.attributes, [attrKey]: nextValue };
      return {
        ...currentPlayer,
        attributes: nextAttributes,
        ovr: nextOvr,
        peakOvr: Math.max(getPlayerCareerPeakOvr(currentPlayer), nextOvr),
        peakOvrTracked: true,
        skillPoints: currentPlayer.skillPoints - pointsSpent,
      };
    });
  };

  // Upgrade player attribute handler
  const handleUpgradeAttribute = (
    attrKey: keyof PlayerProfile['attributes'],
    amount: number = 1,
  ) => {
    spendAttributePoints(attrKey, amount);
  };

  const handleAddSkillPoints = (amount: number = 50) => {
    if (!player) return;
    setPlayer({
      ...player,
      skillPoints: (player.skillPoints || 0) + amount,
    });
  };

  const handleWatchAttributeAd = async (): Promise<boolean> => {
    if (!player || (player.adRewardUses || 0) >= 3) return false;
    if (!await completeRewardedAd()) return false;
    setPlayer({ ...player, skillPoints: (player.skillPoints || 0) + 30, adRewardUses: (player.adRewardUses || 0) + 1 });
    return true;
  };

  const handleMaxAllAttributes = () => {
    if (!player) return;
    const newAttrs = { ...player.attributes };
    for (const key in newAttrs) {
      const k = key as keyof PlayerProfile['attributes'];
      const cap = (player.attributeCaps && player.attributeCaps[k]) ? player.attributeCaps[k] : 99;
      newAttrs[k] = cap;
    }
    const tempPlayer = {
      ...player,
      attributes: newAttrs,
    };
    const newOvr = getPlayerBaseOvr(tempPlayer);
    setPlayer({
      ...player,
      attributes: newAttrs,
      ovr: newOvr,
      peakOvr: Math.max(getPlayerCareerPeakOvr(player), newOvr),
      peakOvrTracked: true,
    });
  };

  const handleAllInAttribute = (attrKey: keyof PlayerProfile['attributes']) => {
    if (!player) return;
    spendAttributePoints(attrKey, player.skillPoints);
  };

  const handleResetAttribute = (attrKey: keyof PlayerProfile['attributes']) => {
    if (!player) return;
    const currentVal = player.attributes[attrKey] || 50;
    if (currentVal <= 60) return;

    const refund = currentVal - 60;
    const newAttrs = {
      ...player.attributes,
      [attrKey]: 60,
    };
    const tempPlayer = {
      ...player,
      attributes: newAttrs,
    };
    const newOvr = getPlayerBaseOvr(tempPlayer);

    setPlayer({
      ...player,
      attributes: newAttrs,
      ovr: newOvr,
      skillPoints: (player.skillPoints || 0) + refund,
    });
  };

  // Workout handler with XP
  const handleWorkout = () => {
    if (!player || player.energy < 15) return;

    const currentXp = player.xp || 0;
    const maxXp = player.maxXp || 500;
    let newXp = currentXp + 100;
    let newLevel = player.level || 1;
    let newSp = player.skillPoints || 0;
    let newMaxXp = maxXp;

    if (newXp >= maxXp) {
      newLevel += 1;
      newSp += 1;
      newXp = newXp - maxXp;
      newMaxXp = Math.round(maxXp * 1.15);
    }

    setPlayer({
      ...player,
      energy: player.energy - 15,
      xp: newXp,
      maxXp: newMaxXp,
      level: newLevel,
      skillPoints: newSp,
      morale: Math.min(100, player.morale + 3),
    });
  };

  // Rest handler
  const handleRest = () => {
    if (!player) return;
    let newHealth = { ...player.health };
    if (newHealth.status === 'injured' && newHealth.daysRemaining) {
      const remaining = newHealth.daysRemaining - 7;
      if (remaining <= 0) {
        newHealth = { status: 'healthy' };
      } else {
        newHealth.daysRemaining = remaining;
      }
    }

    setPlayer({
      ...player,
      energy: Math.min(100, player.energy + 35),
      health: newHealth,
    });
  };

  // Endorsement handler
  const handleUnlockEndorsement = (endId: string) => {
    if (!player) return;

    const targetEnd = INITIAL_ENDORSEMENTS.find((e) => e.id === endId)!;
    
    // Check if we are signing a sneaker brand
    let updatedEndorsements = [...player.endorsements];
    
    if (targetEnd.category === 'sneaker') {
      // Find if there is an existing sneaker brand signed
      const existingSneakerIdx = updatedEndorsements.findIndex((e) => e.category === 'sneaker');
      if (existingSneakerIdx !== -1) {
        // Remove the existing sneaker endorsement from the list
        updatedEndorsements.splice(existingSneakerIdx, 1);
      }
    }
    
    // Add the new endorsement
    updatedEndorsements.push(targetEnd);
    
    // Off-court attribute rewards do not alter the trainable/card OVR.
    const tempPlayer = {
      ...player,
      endorsements: updatedEndorsements,
    };
    const newOvr = getPlayerBaseOvr(tempPlayer);
    
    // Apply financial reward and fan reward
    const fansReward = targetEnd.rewardFans || 0;
    
    setPlayer({
      ...player,
      money: player.money + targetEnd.perSeasonPay,
      fansCount: player.fansCount + fansReward,
      ovr: newOvr,
      endorsements: updatedEndorsements,
    });
  };

  // Signature shoe handler
  const handleCreateSignatureShoe = (shoe: SignatureShoe) => {
    if (!player) return;

    const tempPlayer = {
      ...player,
      signatureShoe: shoe,
    };
    const newOvr = getPlayerBaseOvr(tempPlayer);

    setPlayer({
      ...player,
      ovr: newOvr,
      signatureShoe: shoe,
    });
  };

  // Luxury/Asset purchase handler
  const handleBuyLuxuryItem = (cost: number, assetId: string) => {
    if (!player) return;
    const asset = PERSONAL_ASSETS.find((a) => a.id === assetId);
    if (!asset) return;

    const purchasedIds = player.purchasedAssetIds || [];
    if (purchasedIds.includes(assetId)) return;

    const purchaseState = getAssetPurchaseState(asset, player, careerSeasons, currentYear);
    if (!purchaseState.canPurchase) return;

    const updatedPurchasedIds = [...purchasedIds, assetId];

    // Asset boosts stay separate from the player's trainable/card OVR.
    const tempPlayer = {
      ...player,
      purchasedAssetIds: updatedPurchasedIds,
    };
    const newOvr = getPlayerBaseOvr(tempPlayer);

    setPlayer({
      ...player,
      money: player.money - asset.cost,
      ovr: newOvr,
      purchasedAssetIds: updatedPurchasedIds,
      majorAssetPurchaseYear: purchaseState.isMajor ? currentYear : player.majorAssetPurchaseYear,
      morale: Math.min(100, player.morale + 15),
    });
  };

  // Trade request handler
  const handleRequestTrade = (targetTeamId: string) => {
    if (!player) return;
    setPlayer({
      ...player,
      currentTeamId: targetTeamId,
    });
  };


  return { handleUpgradeAttribute, handleAddSkillPoints, handleWatchAttributeAd, handleAllInAttribute, handleResetAttribute, handleWorkout, handleRest, handleUnlockEndorsement, handleCreateSignatureShoe, handleBuyLuxuryItem, handleRequestTrade };
}
