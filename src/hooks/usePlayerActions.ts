import { Dispatch,SetStateAction } from 'react';
import { INITIAL_ENDORSEMENTS,PERSONAL_ASSETS } from '../data/nbaData2008';
import { PlayerProfile,SignatureShoe } from '../types';
import { getPlayerTotalOvr,getUserPlayerAgePenalty } from '../utils/calc2k';

export function usePlayerActions(player: PlayerProfile | null, setPlayer: Dispatch<SetStateAction<PlayerProfile | null>>) {
  // Upgrade player attribute handler
  const handleUpgradeAttribute = (attrKey: keyof PlayerProfile['attributes']) => {
    if (!player || player.skillPoints <= 0) return;
    const agePenalty = getUserPlayerAgePenalty(player.age || 19);
    const maxOvr = 99 - agePenalty;
    if (player.ovr >= maxOvr) return;

    const newAttrs = {
      ...player.attributes,
      [attrKey]: player.attributes[attrKey] + 1,
    };
    const tempPlayer = {
      ...player,
      attributes: newAttrs,
    };
    const newOvr = getPlayerTotalOvr(tempPlayer);

    setPlayer({
      ...player,
      attributes: newAttrs,
      ovr: newOvr,
      peakOvr: Math.max(player.peakOvr || 0, newOvr),
      skillPoints: player.skillPoints - 1,
    });
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
    const result = await window.ColorboxAI?.ad?.watchRewardedVideo?.();
    if (!result || (result.code !== undefined && result.code !== 200)) return false;
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
    const newOvr = getPlayerTotalOvr(tempPlayer);
    setPlayer({
      ...player,
      attributes: newAttrs,
      ovr: newOvr,
    });
  };

  const handleAllInAttribute = (attrKey: keyof PlayerProfile['attributes']) => {
    if (!player || player.skillPoints <= 0) return;
    const agePenalty = getUserPlayerAgePenalty(player.age || 19);
    const maxOvr = 99 - agePenalty;
    if (player.ovr >= maxOvr) return;

    const currentVal = player.attributes[attrKey] || 50;
    const cap = (player.attributeCaps && player.attributeCaps[attrKey]) ? player.attributeCaps[attrKey] : 99;
    const maxPointsToAdd = Math.min(cap - currentVal, player.skillPoints);
    if (maxPointsToAdd <= 0) return;

    let pointsAdded = 0;
    let tempAttrs = { ...player.attributes };

    for (let i = 1; i <= maxPointsToAdd; i++) {
      tempAttrs[attrKey] = currentVal + i;
      pointsAdded = i;
      const tempPlayer = {
        ...player,
        attributes: tempAttrs,
      };
      const tempOvr = getPlayerTotalOvr(tempPlayer);
      if (tempOvr >= maxOvr) {
        break; // Stop adding once max age-allowed OVR is reached
      }
    }

    const finalAttrs = {
      ...player.attributes,
      [attrKey]: currentVal + pointsAdded,
    };
    const finalPlayer = {
      ...player,
      attributes: finalAttrs,
    };
    const finalOvr = getPlayerTotalOvr(finalPlayer);

    setPlayer({
      ...player,
      attributes: finalAttrs,
      ovr: finalOvr,
      skillPoints: player.skillPoints - pointsAdded,
    });
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
    const newOvr = getPlayerTotalOvr(tempPlayer);

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
    
    // Calculate new OVR based on total attributes (using the total attributes helper)
    const tempPlayer = {
      ...player,
      endorsements: updatedEndorsements,
    };
    const newOvr = getPlayerTotalOvr(tempPlayer);
    
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
    const newOvr = getPlayerTotalOvr(tempPlayer);

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
    if (!asset || player.money < asset.cost) return;

    const purchasedIds = player.purchasedAssetIds || [];
    if (purchasedIds.includes(assetId)) return;

    const updatedPurchasedIds = [...purchasedIds, assetId];

    // Calculate new OVR using the total attributes helper
    const tempPlayer = {
      ...player,
      purchasedAssetIds: updatedPurchasedIds,
    };
    const newOvr = getPlayerTotalOvr(tempPlayer);

    setPlayer({
      ...player,
      money: player.money - asset.cost,
      ovr: newOvr,
      purchasedAssetIds: updatedPurchasedIds,
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
