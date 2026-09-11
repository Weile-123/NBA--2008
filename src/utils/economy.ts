import { PERSONAL_ASSETS } from '../data/nbaData2008';
import { PersonalAsset, PlayerProfile } from '../types';

export const SALARY_DISPOSABLE_RATE = 0.12;

const MAJOR_ASSET_IDS = new Set([
  'holographic_court',
  'ocean_yacht',
  'gulfstream_jet',
  'team_ownership',
]);

export interface AssetPurchaseState {
  canPurchase: boolean;
  unlocked: boolean;
  hasMoney: boolean;
  isMajor: boolean;
  tier: 1 | 2 | 3 | 4;
  tierLabel: string;
  reason: string;
}

function hasAccolade(player: PlayerProfile, types: string[], words: string[]): boolean {
  return player.accolades.some((accolade) => {
    const type = String(accolade.type || '').toUpperCase();
    const title = String(accolade.title || '');
    return types.includes(type) || words.some((word) => title.includes(word));
  });
}

function getTier(asset: PersonalAsset): 1 | 2 | 3 | 4 {
  const categoryAssets = PERSONAL_ASSETS.filter((item) => item.category === asset.category);
  return (Math.min(4, categoryAssets.findIndex((item) => item.id === asset.id) + 1) || 1) as 1 | 2 | 3 | 4;
}

export function calculateDisposableSalary(salaryPerYear: number): number {
  return Math.max(0, Math.round(salaryPerYear * SALARY_DISPOSABLE_RATE));
}

export function getAssetPurchaseState(
  asset: PersonalAsset,
  player: PlayerProfile,
  careerSeasons: number,
  currentYear: number,
): AssetPurchaseState {
  const purchasedIds = player.purchasedAssetIds || [];
  const purchased = purchasedIds.includes(asset.id);
  const categoryAssets = PERSONAL_ASSETS.filter((item) => item.category === asset.category);
  const assetIndex = categoryAssets.findIndex((item) => item.id === asset.id);
  const prerequisite = assetIndex > 0 ? categoryAssets[assetIndex - 1] : undefined;
  const tier = getTier(asset);
  const tierLabel = ['起步级', '成长期', '巨星期', '传奇级'][tier - 1];
  const hasMoney = player.money >= asset.cost;
  const isMajor = MAJOR_ASSET_IDS.has(asset.id);

  if (purchased) return { canPurchase: false, unlocked: true, hasMoney, isMajor, tier, tierLabel, reason: '已置办' };
  if (prerequisite && !purchasedIds.includes(prerequisite.id)) {
    return { canPurchase: false, unlocked: false, hasMoney, isMajor, tier, tierLabel, reason: `需先置办「${prerequisite.name}」` };
  }

  const isAllStarOrChampion = hasAccolade(player, ['ALL_STAR', 'CHAMPION'], ['全明星', '总冠军']);
  const isMvpOrFmvp = hasAccolade(player, ['MVP', 'FMVP'], ['常规赛 MVP', '总决赛 FMVP']);
  if (tier === 2 && careerSeasons < 3 && player.ovr < 75) {
    return { canPurchase: false, unlocked: false, hasMoney, isMajor, tier, tierLabel, reason: '需达到75综评或完成3个赛季' };
  }
  if (tier === 3 && (careerSeasons < 5 || (player.ovr < 85 && !isAllStarOrChampion))) {
    return { canPurchase: false, unlocked: false, hasMoney, isMajor, tier, tierLabel, reason: '需完成5个赛季，并达到85综评、入选全明星或夺冠' };
  }
  if (tier === 4 && (careerSeasons < 8 || !isMvpOrFmvp)) {
    return { canPurchase: false, unlocked: false, hasMoney, isMajor, tier, tierLabel, reason: '需完成8个赛季，并获得MVP或FMVP' };
  }
  if (isMajor && player.majorAssetPurchaseYear === currentYear) {
    return { canPurchase: false, unlocked: false, hasMoney, isMajor, tier, tierLabel, reason: '本赛季的大型资产购置机会已使用' };
  }
  if (!hasMoney) return { canPurchase: false, unlocked: true, hasMoney, isMajor, tier, tierLabel, reason: '资金不足' };
  return { canPurchase: true, unlocked: true, hasMoney, isMajor, tier, tierLabel, reason: '可置办' };
}
