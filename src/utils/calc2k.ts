import { Attributes, AttributeCaps, Position, PlayerProfile } from '../types';
import { PERSONAL_ASSETS } from '../data/nbaData2008';

const PHYSICAL_ATTRS: (keyof Attributes)[] = ['speed', 'vertical', 'stamina', 'layup', 'dunk', 'insideFinish'];
const DEFENSIVE_ATTRS: (keyof Attributes)[] = ['perimeterDef', 'interiorDef', 'steal', 'block', 'strength', 'rebounding'];
const SKILL_ATTRS: (keyof Attributes)[] = ['ballHandle', 'passing', 'threePoint', 'midRange', 'freeThrow', 'postMove'];

const ALL_ATTR_KEYS: (keyof Attributes)[] = [
  'layup', 'dunk', 'insideFinish', 'midRange', 'threePoint', 'freeThrow',
  'postMove', 'ballHandle', 'passing', 'perimeterDef', 'interiorDef',
  'steal', 'block', 'rebounding', 'speed', 'strength', 'vertical', 'stamina'
];

export const DEFAULT_ATTRS: Attributes = {
  layup: 60, dunk: 50, insideFinish: 60, midRange: 60, threePoint: 60, freeThrow: 70,
  postMove: 50, ballHandle: 60, passing: 60, perimeterDef: 60, interiorDef: 50,
  steal: 50, block: 50, rebounding: 50, speed: 60, strength: 50, vertical: 60, stamina: 70
};

export function getPlayerTotalAttributes(player: PlayerProfile): Attributes {
  if (!player) return { ...DEFAULT_ATTRS };
  const totalAttrs = { ...DEFAULT_ATTRS, ...(player.attributes || {}) };
  const activeAssets = PERSONAL_ASSETS.filter(a => (player.purchasedAssetIds || []).includes(a.id));

  // 1. Endorsement boosts
  (player.endorsements || []).forEach(end => {
    if (end.rewardAttributes) {
      Object.entries(end.rewardAttributes).forEach(([attr, val]) => {
        const key = attr as keyof Attributes;
        if (totalAttrs[key] !== undefined) {
          totalAttrs[key] = Math.min(99, (totalAttrs[key] || 50) + (val as number));
        }
      });
    }
  });

  // 2. Personal Asset boosts
  activeAssets.forEach(asset => {
    if (asset.rewardAttributes) {
      Object.entries(asset.rewardAttributes).forEach(([attr, val]) => {
        const key = attr as keyof Attributes;
        if (totalAttrs[key] !== undefined) {
          totalAttrs[key] = Math.min(99, (totalAttrs[key] || 50) + (val as number));
        }
      });
    }
  });

  // 3. Signature Shoe boosts
  if (player.signatureShoe) {
    const key = player.signatureShoe.boostAttr;
    if (totalAttrs[key] !== undefined) {
      totalAttrs[key] = Math.min(99, (totalAttrs[key] || 50) + player.signatureShoe.boostVal);
    }
  }

  return totalAttrs;
}

export function getUserPlayerAgePenalty(age: number = 19): number {
  if (age < 33) return 0;
  if (age === 33 || age === 34) return 1;
  if (age === 35) return 2;
  if (age === 36 || age === 37) return 4;
  if (age === 38) return 5;
  if (age === 39) return 7;
  return 8; // 40+
}

export function syncPlayerAgeDecay(player: PlayerProfile): PlayerProfile {
  if (!player) return player;

  const age = player.age || 19;
  const newPenalty = getUserPlayerAgePenalty(age);
  const recordedPenalty = player.lastAgePenalty ?? 0;

  // Calculate penalty difference to apply to attributes
  const penaltyToApply = Math.max(0, newPenalty - recordedPenalty);
  const maxCapForAge = 99 - newPenalty;

  // 1. Update attribute caps (clamped to maxCapForAge)
  const currentCaps = player.attributeCaps || {} as AttributeCaps;
  const newCaps: AttributeCaps = { ...currentCaps };

  ALL_ATTR_KEYS.forEach((k) => {
    const existingCap = currentCaps[k] ?? 99;
    newCaps[k] = Math.min(existingCap, maxCapForAge);
  });

  // 2. Clamp current attributes to new caps
  const newAttrs: Attributes = { ...DEFAULT_ATTRS, ...(player.attributes || {}) };
  ALL_ATTR_KEYS.forEach((k) => {
    if (newAttrs[k] > newCaps[k]) {
      newAttrs[k] = newCaps[k];
    }
  });

  // 3. Apply attribute decay if there is new age penalty to apply
  if (penaltyToApply > 0) {
    const startBaseOvr = calculate2KOvr(player.position, newAttrs);
    const targetBaseOvr = Math.max(40, startBaseOvr - penaltyToApply);

    let attempts = 0;
    while (calculate2KOvr(player.position, newAttrs) > targetBaseOvr && attempts < 200) {
      attempts++;
      let reduced = false;

      // Group 1: Physical / Athleticism decay first
      const physCandidates = PHYSICAL_ATTRS
        .filter((k) => newAttrs[k] > 50)
        .sort((a, b) => newAttrs[b] - newAttrs[a]);

      if (physCandidates.length > 0) {
        newAttrs[physCandidates[0]]--;
        reduced = true;
      } else {
        // Group 2: Defense / Physical contact decay second
        const defCandidates = DEFENSIVE_ATTRS
          .filter((k) => newAttrs[k] > 50)
          .sort((a, b) => newAttrs[b] - newAttrs[a]);

        if (defCandidates.length > 0) {
          newAttrs[defCandidates[0]]--;
          reduced = true;
        } else {
          // Group 3: Skill / Shooting decay last
          const skillCandidates = SKILL_ATTRS
            .filter((k) => newAttrs[k] > 50)
            .sort((a, b) => newAttrs[b] - newAttrs[a]);

          if (skillCandidates.length > 0) {
            newAttrs[skillCandidates[0]]--;
            reduced = true;
          }
        }
      }

      if (!reduced) break;
    }
  }

  const updatedPlayer: PlayerProfile = {
    ...player,
    attributes: newAttrs,
    attributeCaps: newCaps,
    lastAgePenalty: newPenalty,
  };

  updatedPlayer.ovr = getPlayerTotalOvr(updatedPlayer);

  return updatedPlayer;
}

export function getPlayerTotalOvr(player: PlayerProfile): number {
  const totalAttrs = getPlayerTotalAttributes(player);
  const rawOvr = calculate2KOvr(player.position, totalAttrs);
  const agePenalty = getUserPlayerAgePenalty(player.age || 19);
  const maxCap = 99 - agePenalty;
  return Math.min(maxCap, Math.max(40, rawOvr));
}

export const POSITION_WEIGHTS: Record<Position, Record<keyof Attributes, number>> = {
  PG: {
    ballHandle: 1.5,
    passing: 1.5,
    speed: 1.4,
    threePoint: 1.3,
    midRange: 1.2,
    layup: 1.2,
    steal: 1.2,
    perimeterDef: 1.1,
    vertical: 1.0,
    freeThrow: 1.0,
    stamina: 1.0,
    insideFinish: 0.7,
    rebounding: 0.5,
    dunk: 0.5,
    strength: 0.5,
    interiorDef: 0.4,
    postMove: 0.3,
    block: 0.3,
  },
  SG: {
    midRange: 1.4,
    threePoint: 1.4,
    layup: 1.3,
    ballHandle: 1.3,
    speed: 1.3,
    perimeterDef: 1.2,
    vertical: 1.1,
    dunk: 1.1,
    insideFinish: 1.0,
    freeThrow: 1.0,
    steal: 1.0,
    stamina: 1.0,
    passing: 0.8,
    rebounding: 0.6,
    strength: 0.6,
    interiorDef: 0.5,
    postMove: 0.5,
    block: 0.4,
  },
  SF: {
    midRange: 1.3,
    threePoint: 1.3,
    layup: 1.2,
    insideFinish: 1.2,
    perimeterDef: 1.3,
    speed: 1.2,
    dunk: 1.2,
    vertical: 1.1,
    rebounding: 1.0,
    interiorDef: 1.0,
    ballHandle: 1.0,
    strength: 1.0,
    stamina: 1.0,
    steal: 1.0,
    postMove: 0.9,
    passing: 0.9,
    freeThrow: 0.9,
    block: 0.7,
  },
  PF: {
    rebounding: 1.5,
    interiorDef: 1.4,
    insideFinish: 1.4,
    strength: 1.4,
    postMove: 1.3,
    dunk: 1.3,
    block: 1.3,
    vertical: 1.1,
    midRange: 1.1,
    layup: 1.0,
    perimeterDef: 1.0,
    stamina: 1.0,
    threePoint: 0.8,
    freeThrow: 0.8,
    steal: 0.7,
    speed: 0.7,
    passing: 0.6,
    ballHandle: 0.4,
  },
  C: {
    rebounding: 1.6,
    interiorDef: 1.6,
    block: 1.5,
    strength: 1.5,
    insideFinish: 1.5,
    postMove: 1.4,
    dunk: 1.3,
    vertical: 1.1,
    layup: 1.0,
    stamina: 1.0,
    midRange: 0.7,
    freeThrow: 0.7,
    perimeterDef: 0.5,
    speed: 0.5,
    passing: 0.4,
    steal: 0.4,
    threePoint: 0.2,
    ballHandle: 0.2,
  },
};

/**
 * Calculates raw weighted score based on position core/secondary attribute weights
 */
export function calculateRawScore(position: Position, attrs: Attributes): number {
  if (!attrs) return 60;
  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.SF;
  let weightedSum = 0;
  let weightSum = 0;

  for (const key in weights) {
    const k = key as keyof Attributes;
    const w = weights[k];
    const val = attrs[k] ?? 50;
    weightedSum += val * w;
    weightSum += w;
  }

  return weightSum > 0 ? weightedSum / weightSum : 60;
}

/**
 * Calculates final OVR from position and attributes using weighted position score and non-linear scaling.
 * Threshold: RawScore ~90+ maps to 99 OVR.
 */
export function calculate2KOvr(position: Position, attrs: Attributes): number {
  if (!attrs) return 65;

  const rawScore = calculateRawScore(position, attrs);

  // Piecewise non-linear scaling curve:
  // Raw <= 40 -> Math.max(40, Raw)
  // Raw 40..65 -> OVR 50..72
  // Raw 65..91 -> OVR 72..99
  // Raw >= 91 -> 99
  let ovr = 60;

  if (rawScore <= 40) {
    ovr = Math.max(40, Math.round(rawScore));
  } else if (rawScore <= 65) {
    ovr = 50 + ((rawScore - 40) * (72 - 50)) / (65 - 40);
  } else if (rawScore <= 91) {
    ovr = 72 + ((rawScore - 65) * (99 - 72)) / (91 - 65);
  } else {
    ovr = 99;
  }

  return Math.min(99, Math.max(40, Math.round(ovr)));
}

export interface GoatScoreResult {
  score: number;
  rankTitle: string;
  sHonor: number;
  sAllNba: number;
  sEfficiency: number;
  sTotals: number;
  sSkillPoints: number;
  ppgReset: number;
  details: {
    mvp: number;
    fmvp: number;
    champion: number;
    dpoy: number;
    scoringTitle: number;
    allNba1st: number;
    allNba2nd3rd: number;
    allDef1st: number;
    allDef2nd: number;
    allStar: number;
    unusedSkillPoints: number;
  };
}

export function calculateGoatScore(player: PlayerProfile): GoatScoreResult {
  const accolades = player.accolades || [];
  const careerStats = player.careerStats || {
    pts: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    turnovers: 0,
    games: 0,
  };

  let mvp = 0;
  let fmvp = 0;
  let champion = 0;
  let dpoy = 0;
  let scoringTitle = 0;

  let allNba1st = 0;
  let allNba2nd3rd = 0;
  let allDef1st = 0;
  let allDef2nd = 0;
  let allStar = 0;

  accolades.forEach((a) => {
    const title = a.title || '';
    const type = a.type;

    // 1. 统治荣誉分
    if (type === 'MVP' || (title.includes('MVP') && !title.includes('FMVP'))) {
      mvp++;
    } else if (type === 'FMVP' || title.includes('FMVP')) {
      fmvp++;
    }

    if (type === 'CHAMPION' || title.includes('冠军')) {
      champion++;
    }

    if (type === 'DPOY' || title.includes('最佳防守球员') || (title.includes('DPOY') && !title.includes('阵') && !title.includes('阵容'))) {
      dpoy++;
    }

    if (
      type === 'SCORING_TITLE' ||
      title.includes('得分王') ||
      title.includes('Scoring Leader') ||
      title.includes('Scoring Champion')
    ) {
      scoringTitle++;
    }

    // 2. 阵容与防守分
    if (
      type === 'ALL_NBA_1ST' ||
      title.includes('最佳一阵') ||
      title.includes('最佳阵容一阵') ||
      (title.includes('最佳阵容') && title.includes('一阵') && !title.includes('防守'))
    ) {
      allNba1st++;
    } else if (
      type === 'ALL_NBA_2ND' ||
      type === 'ALL_NBA_3RD' ||
      type === 'ALL_NBA' ||
      title.includes('最佳二阵') ||
      title.includes('最佳三阵') ||
      title.includes('最佳阵容二阵') ||
      title.includes('最佳阵容三阵') ||
      (title.includes('最佳阵容') && !title.includes('一阵') && !title.includes('防守'))
    ) {
      allNba2nd3rd++;
    }

    if (
      type === 'ALL_DEFENSE_1ST' ||
      title.includes('最佳一防') ||
      title.includes('最佳防守阵容一阵') ||
      (title.includes('防守') && title.includes('一阵'))
    ) {
      allDef1st++;
    } else if (
      type === 'ALL_DEFENSE_2ND' ||
      title.includes('最佳二防') ||
      title.includes('最佳防守阵容二阵') ||
      (title.includes('防守') && (title.includes('二阵') || title.includes('三阵') || title.includes('二防')) && title.includes('阵容'))
    ) {
      allDef2nd++;
    }

    if (type === 'ALL_STAR' || title.includes('全明星')) {
      allStar++;
    }
  });

  // 【1. 统治荣誉分 (S_honor)】
  // 常规赛 MVP: 每个 +350 分
  // 总决赛 FMVP: 每个 +280 分
  // 总冠军: 每个 +120 分
  // 最佳防守球员 DPOY: 每个 +100 分
  // 得分王: 每个 +80 分
  const sHonor = (mvp * 350) + (fmvp * 280) + (champion * 120) + (dpoy * 100) + (scoringTitle * 80);

  // 【2. 阵容与防守分 (S_all_nba)】
  // 最佳阵容一阵: 每个 +60 分
  // 最佳二/三阵: 每个 +30 分
  // 最佳防守一阵: 每个 +45 分
  // 最佳防守二阵: 每个 +20 分
  // 全明星: 每个 +15 分
  const sAllNba = (allNba1st * 60) + (allNba2nd3rd * 30) + (allDef1st * 45) + (allDef2nd * 20) + (allStar * 15);

  // 【3. 巅峰效率分 (S_efficiency)】
  // PPG_reset = 得分×1.2 + 篮板×1.0 + 助攻×1.2 + 抢断×2.0 + 盖帽×2.0 - 失误×1.5
  // S_efficiency = PPG_reset × 8
  const games = Math.max(1, careerStats.games || 0);
  const ppg = (careerStats.pts || 0) / games;
  const rpg = (careerStats.reb || 0) / games;
  const apg = (careerStats.ast || 0) / games;
  const spg = (careerStats.stl || 0) / games;
  const bpg = (careerStats.blk || 0) / games;
  const topg = (careerStats.turnovers || 0) / games;

  const ppgReset = (ppg * 1.2) + (rpg * 1.0) + (apg * 1.2) + (spg * 2.0) + (bpg * 2.0) - (topg * 1.5);
  const sEfficiency = Math.round(ppgReset * 8);

  // 【4. 累计数据分 (S_totals)】
  // 总得分: (总得分 / 1000) × 10
  // 总篮板: (总篮板 / 1000) × 6
  // 总助攻: (总助攻 / 1000) × 8
  // 抢断与盖帽: ((总抢断 + 总盖帽) / 500) × 5
  const pts = careerStats.pts || 0;
  const reb = careerStats.reb || 0;
  const ast = careerStats.ast || 0;
  const stl = careerStats.stl || 0;
  const blk = careerStats.blk || 0;

  const sTotals = ((pts / 1000) * 10) + ((reb / 1000) * 6) + ((ast / 1000) * 8) + (((stl + blk) / 500) * 5);

  // 【5. 未使用属性点加成 (S_skill_points)】
  // 玩家每多出未使用的100属性点，分数 +10
  const unusedSkillPoints = player.skillPoints || 0;
  const sSkillPoints = Math.floor(unusedSkillPoints / 100) * 10;

  // 总分 = 统治荣誉分 + 阵容与防守分 + 巅峰效率分 + 累计数据分 + 属性点加成
  const totalScore = Math.round(sHonor + sAllNba + sEfficiency + sTotals + sSkillPoints);

  let rankTitle = 'NBA角色球员';
  if (totalScore >= 4500) rankTitle = 'GOAT (历史至尊神级)';
  else if (totalScore >= 3000) rankTitle = '历史前10传奇巨星';
  else if (totalScore >= 2000) rankTitle = '历史级名人堂球星';
  else if (totalScore >= 1300) rankTitle = '全明星常客 / 冠军功臣';
  else if (totalScore >= 700) rankTitle = '优质首发球星';
  else if (totalScore >= 250) rankTitle = '合格轮换球员';

  return {
    score: totalScore,
    rankTitle,
    sHonor,
    sAllNba,
    sEfficiency,
    sTotals: Math.round(sTotals),
    sSkillPoints,
    ppgReset: Number(ppgReset.toFixed(1)),
    details: {
      mvp,
      fmvp,
      champion,
      dpoy,
      scoringTitle,
      allNba1st,
      allNba2nd3rd,
      allDef1st,
      allDef2nd,
      allStar,
      unusedSkillPoints,
    },
  };
}

export function checkInjuryRisk(energy: number, staminaAttr: number): { isInjured: boolean; name?: string; durationDays?: number } {
  // Fatigue increases injury chance
  const fatigueFactor = (100 - energy) / 100;
  const durabilityFactor = (100 - staminaAttr) / 100;
  const baseChance = 0.02 + fatigueFactor * 0.08 + durabilityFactor * 0.05;

  if (Math.random() < baseChance) {
    const injuries = [
      { name: '脚踝扭伤 (Ankle Sprain)', duration: 7 },
      { name: '腿筋拉伤 (Hamstring Strain)', duration: 14 },
      { name: '膝盖挫伤 (Knee Contusion)', duration: 10 },
      { name: '手指脱脱 (Finger Sprain)', duration: 4 },
      { name: '足底筋膜炎 (Plantar Fasciitis)', duration: 21 },
      { name: '半月板轻微损伤 (Meniscus Tear)', duration: 45 },
    ];
    const picked = injuries[Math.floor(Math.random() * injuries.length)];
    return { isInjured: true, name: picked.name, durationDays: picked.duration };
  }
  return { isInjured: false };
}

// TOP 50 NBA Historical Legends Data (Updated for GOAT Score Formula v2.0)
export const TOP_50_LEGENDS = [
  { name: '迈克尔·乔丹 (Michael Jordan)', score: 7145, rings: 6, mvps: 5, scoringTitles: 10, avatar: '🐐' },
  { name: '勒布朗·詹姆斯 (LeBron James)', score: 6980, rings: 4, mvps: 4, scoringTitles: 1, avatar: '👑' },
  { name: '卡里姆·阿卜杜尔-贾巴尔 (Kareem Abdul-Jabbar)', score: 6480, rings: 6, mvps: 6, scoringTitles: 2, avatar: '👑' },
  { name: '威尔特·张伯伦 (Wilt Chamberlain)', score: 6150, rings: 2, mvps: 4, scoringTitles: 7, avatar: '⚡' },
  { name: '比尔·拉塞尔 (Bill Russell)', score: 5920, rings: 11, mvps: 5, scoringTitles: 0, avatar: '💍' },
  { name: '魔术师约翰逊 (Magic Johnson)', score: 5580, rings: 5, mvps: 3, scoringTitles: 0, avatar: '🪄' },
  { name: '蒂姆·邓肯 (Tim Duncan)', score: 5450, rings: 5, mvps: 2, scoringTitles: 0, avatar: '🧱' },
  { name: '科比·布莱恩特 (Kobe Bryant)', score: 5380, rings: 5, mvps: 1, scoringTitles: 2, avatar: '🐍' },
  { name: '拉里·伯德 (Larry Bird)', score: 5220, rings: 3, mvps: 3, scoringTitles: 0, avatar: '🏹' },
  { name: '沙奎尔·奥尼尔 (Shaquille O\'Neal)', score: 5110, rings: 4, mvps: 1, scoringTitles: 2, avatar: '💥' },
  { name: '斯蒂芬·库里 (Stephen Curry)', score: 4950, rings: 4, mvps: 2, scoringTitles: 2, avatar: '🎯' },
  { name: '凯文·杜兰特 (Kevin Durant)', score: 4780, rings: 2, mvps: 1, scoringTitles: 4, avatar: '🗡️' },
  { name: '阿基姆·奥拉朱旺 (Hakeem Olajuwon)', score: 4620, rings: 2, mvps: 1, scoringTitles: 0, avatar: '💫' },
  { name: '奥斯卡·罗伯特森 (Oscar Robertson)', score: 4280, rings: 1, mvps: 1, scoringTitles: 1, avatar: '📊' },
  { name: '杰里·韦斯特 (Jerry West)', score: 4180, rings: 1, mvps: 0, scoringTitles: 1, avatar: '🏀' },
  { name: '朱利叶斯·欧文 (Julius Erving)', score: 3920, rings: 1, mvps: 1, scoringTitles: 0, avatar: '🦅' },
  { name: '卡尔·马龙 (Karl Malone)', score: 3820, rings: 0, mvps: 2, scoringTitles: 0, avatar: '📮' },
  { name: '凯文·加内特 (Kevin Garnett)', score: 3750, rings: 1, mvps: 1, scoringTitles: 0, avatar: '🐺' },
  { name: '德维恩·韦德 (Dwyane Wade)', score: 3720, rings: 3, mvps: 0, scoringTitles: 1, avatar: '⚡' },
  { name: '德克·诺维茨基 (Dirk Nowitzki)', score: 3680, rings: 1, mvps: 1, scoringTitles: 0, avatar: '🦩' },
  { name: '查尔斯·巴克利 (Charles Barkley)', score: 3550, rings: 0, mvps: 1, scoringTitles: 0, avatar: '🍕' },
  { name: '乔治·格文 (George Gervin)', score: 3480, rings: 0, mvps: 0, scoringTitles: 4, avatar: '🧊' },
  { name: '克里斯·保罗 (Chris Paul)', score: 3400, rings: 0, mvps: 0, scoringTitles: 0, avatar: '🧠' },
  { name: '阿伦·艾弗森 (Allen Iverson)', score: 3380, rings: 0, mvps: 1, scoringTitles: 4, avatar: '👟' },
  { name: '埃尔文·托马斯 (Isiah Thomas)', score: 3350, rings: 2, mvps: 0, scoringTitles: 0, avatar: '🗡️' },
  { name: '约翰·斯托克顿 (John Stockton)', score: 3300, rings: 0, mvps: 0, scoringTitles: 0, avatar: '🎯' },
  { name: '约翰·哈夫利切克 (John Havlicek)', score: 3250, rings: 8, mvps: 0, scoringTitles: 0, avatar: '🍀' },
  { name: '大卫·罗宾逊 (David Robinson)', score: 3220, rings: 2, mvps: 1, scoringTitles: 1, avatar: '⚓' },
  { name: '詹姆斯·哈登 (James Harden)', score: 3210, rings: 0, mvps: 1, scoringTitles: 3, avatar: '🧔' },
  { name: '斯科蒂·皮蓬 (Scottie Pippen)', score: 3200, rings: 6, mvps: 0, scoringTitles: 0, avatar: '🛡️' },
  { name: '埃尔金·贝勒 (Elgin Baylor)', score: 3150, rings: 0, mvps: 0, scoringTitles: 0, avatar: '🪶' },
  { name: '帕特里克·尤因 (Patrick Ewing)', score: 3050, rings: 0, mvps: 0, scoringTitles: 0, avatar: '🏙️' },
  { name: '拉塞尔·威斯布鲁克 (Russell Westbrook)', score: 3040, rings: 0, mvps: 1, scoringTitles: 2, avatar: '🚀' },
  { name: '史蒂夫·纳什 (Steve Nash)', score: 3000, rings: 0, mvps: 2, scoringTitles: 0, avatar: '🏎️' },
  { name: '贾森·基德 (Jason Kidd)', score: 2950, rings: 1, mvps: 0, scoringTitles: 0, avatar: '👁️' },
  { name: '尼古拉·约基奇 (Nikola Jokic)', score: 2950, rings: 1, mvps: 3, scoringTitles: 0, avatar: '🃏' },
  { name: '扬尼斯·阿德托昆博 (Giannis Antetokounmpo)', score: 2900, rings: 1, mvps: 2, scoringTitles: 0, avatar: '🦌' },
  { name: '科怀·伦纳德 (Kawhi Leonard)', score: 2850, rings: 2, mvps: 0, scoringTitles: 0, avatar: '🤖' },
  { name: '乔尔·恩比德 (Joel Embiid)', score: 2840, rings: 0, mvps: 1, scoringTitles: 2, avatar: '👑' },
  { name: '特雷西·麦克格雷迪 (Tracy McGrady)', score: 2790, rings: 0, mvps: 0, scoringTitles: 2, avatar: '✨' },
  { name: '卢卡·东契奇 (Luka Doncic)', score: 2520, rings: 0, mvps: 0, scoringTitles: 1, avatar: '🪄' },
  { name: '安东尼·戴维斯 (Anthony Davis)', score: 2500, rings: 1, mvps: 0, scoringTitles: 0, avatar: '🦚' },
  { name: '文斯·卡特 (Vince Carter)', score: 2400, rings: 0, mvps: 0, scoringTitles: 0, avatar: '✈️' },
  { name: '雷·阿伦 (Ray Allen)', score: 2350, rings: 2, mvps: 0, scoringTitles: 0, avatar: '🏹' },
  { name: '卡梅隆·安东尼 (Carmelo Anthony)', score: 2320, rings: 0, mvps: 0, scoringTitles: 1, avatar: '🎯' },
  { name: '雷吉·米勒 (Reggie Miller)', score: 2300, rings: 0, mvps: 0, scoringTitles: 0, avatar: '⏳' },
  { name: '保罗·皮尔斯 (Paul Pierce)', score: 2250, rings: 1, mvps: 0, scoringTitles: 0, avatar: '☘️' },
  { name: '保罗·加索尔 (Pau Gasol)', score: 2150, rings: 2, mvps: 0, scoringTitles: 0, avatar: '🇪🇸' },
  { name: '多米尼克·威尔金斯 (Dominique Wilkins)', score: 2120, rings: 0, mvps: 0, scoringTitles: 1, avatar: '🦅' },
  { name: '丹尼斯·罗德曼 (Dennis Rodman)', score: 2100, rings: 5, mvps: 0, scoringTitles: 0, avatar: '🎨' },
  { name: '克莱德·德雷克斯勒 (Clyde Drexler)', score: 2050, rings: 1, mvps: 0, scoringTitles: 0, avatar: '🛩️' },
  { name: '詹姆斯·沃西 (James Worthy)', score: 1950, rings: 3, mvps: 0, scoringTitles: 0, avatar: '🕶️' },
  { name: '比尔·沃顿 (Bill Walton)', score: 1900, rings: 2, mvps: 1, scoringTitles: 0, avatar: '🎙️' },
];

export function getUserGoatRank(player: PlayerProfile): { rank: number; isTop50: boolean; goatScore: number } {
  const result = calculateGoatScore(player);
  const score = result.score;
  const championCount = (player.accolades || []).filter((a) => a.type === 'CHAMPION' || a.title.includes('冠军')).length;
  const mvpCount = (player.accolades || []).filter((a) => a.type === 'MVP' || (a.title.includes('MVP') && !a.title.includes('FMVP'))).length;

  const userEntry = {
    name: player.name,
    score,
    rings: championCount,
    mvps: mvpCount,
    avatar: '⭐',
    isUser: true,
  };

  const combined = [...TOP_50_LEGENDS.map((l) => ({ ...l, isUser: false })), userEntry].sort(
    (a, b) => b.score - a.score
  );

  const idx = combined.findIndex((item) => item.isUser);
  const rank = idx + 1;
  return {
    rank,
    isTop50: idx < 50,
    goatScore: score,
  };
}

export interface HofSpeechInfo {
  tierTitle: string;
  rankRangeStr: string;
  speechText: string;
  badgeBg: string;
}

export function getHofSpeechInfo(rank: number, playerName: string): HofSpeechInfo {
  if (rank >= 1 && rank <= 5) {
    return {
      tierTitle: '旷世至尊 · GOAT级传奇演说',
      rankRangeStr: '历史 Top 1-5 顶级巨星',
      badgeBg: 'bg-[#d97706]/20 text-amber-300 border border-amber-400 font-black',
      speechText: `“今天站在奈史密斯篮球名人堂的最高圣殿上，凝视着属于历史前 5 巨星的至高勋章，我的内心满怀震撼与崇高敬畏。从当初步入联盟时的懵懂少年，到如今将自己的名字永恒刻在篮球这项伟大运动的最巅峰，我经历了无数绝境中的死战与破局。多枚沉甸甸的总冠军戒指、MVP 与 FMVP 奖杯，绝非我一人的独舞，而是所有相信奇迹的战友与球迷共同铸就的神话。篮球赐予了我生命中最璀璨的光芒，今天，我 ${playerName} 将这无上的终极荣光献给整个篮球世界！”`,
    };
  } else if (rank >= 6 && rank <= 10) {
    return {
      tierTitle: '黄金丰碑 · 史诗巨星演说',
      rankRangeStr: '历史 Top 6-10 史诗巨星',
      badgeBg: 'bg-[#b45309]/20 text-yellow-300 border border-yellow-400 font-bold',
      speechText: `“能够跻身 NBA 历史前十的伟大传奇行列，是我 ${playerName} 整个职业生涯梦寐以求的至高荣耀！在这漫长的岁月里，每一次踏上赛场，我都怀着用汗水与血性铸就伟大的绝对信念。感谢那些与我并肩厮杀的战友、宿命中的强敌，以及无条件支持我的无数球迷。位列历史前十，是对我数十年如一日卓越统治力的最好褒奖。这尊名人堂金杯，将永远记录我们在篮球长河中书写的惊世传奇！”`,
    };
  } else if (rank >= 11 && rank <= 15) {
    return {
      tierTitle: '时代巨擘 · 巅峰霸主演说',
      rankRangeStr: '历史 Top 11-15 巅峰霸主',
      badgeBg: 'bg-[#15803d]/20 text-emerald-300 border border-emerald-400 font-bold',
      speechText: `“跻身 NBA 历史前 15 名的超级巨星之列，我 ${playerName} 感到无比自豪与荣幸！在那个竞争极其惨烈的时代，我和我的球队用一次次硬仗中的血性防御与绝杀，向世界诠释了什么是真正的领袖风范。名人堂的这件金黄夹克，凝结了我无尽的汗水、伤痛与无悔的青春岁月。感谢篮球这项伟大的运动，让我的名字能够与那些名垂青史的伟大前辈们并肩高悬！”`,
    };
  } else if (rank >= 16 && rank <= 20) {
    return {
      tierTitle: '殿堂名宿 · 一方霸主演说',
      rankRangeStr: '历史 Top 16-20 殿堂名宿',
      badgeBg: 'bg-[#1d4ed8]/20 text-blue-300 border border-blue-400 font-bold',
      speechText: `“荣登 NBA 历史前 20 名的顶级名宿席位，这是对我 ${playerName} 职业生涯最高级别的肯定！从新人赛季的锋芒初露，到巅峰期横扫赛场的威名，我们克服了伤病与低谷，捧起了辉煌的总冠军与多项重量级荣誉。今天站在名人堂讲台上，我知道所有的付出与牺牲都是值得的。希望我的故事能化作一束火苗，激励下一代年轻球员勇敢去追寻属于你们的伟大！”`,
    };
  } else if (rank >= 21 && rank <= 25) {
    return {
      tierTitle: '荣耀中流 · 时代巨星演说',
      rankRangeStr: '历史 Top 21-25 时代巨星',
      badgeBg: 'bg-[#0369a1]/20 text-sky-300 border border-sky-400 font-bold',
      speechText: `“成功冲入历史前 25 名并正式入选奈史密斯篮球名人堂，是我 ${playerName} 职业生涯最圆满的终点线。多年来，我始终将极致的敬业与拼搏置于首位，在 NBA 最高的舞台上与无数历史级对手正面对决。感谢家人无微不至的陪伴，感谢球队与队友的信任。如今我的球衣已挂在球馆上空，我的名字留在了名人堂之中，我的篮球生涯了无遗憾！”`,
    };
  } else if (rank >= 26 && rank <= 30) {
    return {
      tierTitle: '赛场中坚 · 砥柱之光演说',
      rankRangeStr: '历史 Top 26-30 赛场中坚',
      badgeBg: 'bg-[#0f766e]/20 text-teal-300 border border-teal-400 font-bold',
      speechText: `“在这项拥有数千名天之骄子的篮球历史长河中，能占据前 30 名的辉煌席位，我 ${playerName} 深感荣幸与感恩。每一个致命封盖、每一次精妙绝伦的助攻、每一个绝平绝杀，都构成了我独一无二的传奇征程。今天站在这里，这座沉甸甸的名人堂奖杯不仅属于我，更属于所有伴我一路走来、永不言弃的队友与球迷！”`,
    };
  } else if (rank >= 31 && rank <= 35) {
    return {
      tierTitle: '璀璨之星 · 精英典范演说',
      rankRangeStr: '历史 Top 31-35 精英典范',
      badgeBg: 'bg-[#6d28d9]/20 text-purple-300 border border-purple-400 font-bold',
      speechText: `“历史第 31 至 35 名的这份殊荣沉甸甸的。回首来时路，从踏入联盟的第一天起，我 ${playerName} 就立志要在 NBA 的历史版图上留下不可磨灭的印记。经历了无数次的挫折、打磨与沉淀，我终于站上了这片篮球最高圣殿！感谢这项伟大的运动，不仅带给我荣誉，更教会了我坚韧、忠诚与永不低头的灵魂。”`,
    };
  } else if (rank >= 36 && rank <= 40) {
    return {
      tierTitle: '殿堂名将 · 辉煌烙印演说',
      rankRangeStr: '历史 Top 36-40 殿堂名将',
      badgeBg: 'bg-[#be185d]/20 text-rose-300 border border-rose-400 font-bold',
      speechText: `“能够在 NBA 历史 50 大巨星的璀璨星空中，荣登第 36 至 40 名的赫赫席位，是我 ${playerName} 一生最大的骄傲！在漫长的职业生涯中，面对严酷的竞争与外界的怀疑，我从来没有退缩过半步。名人堂这片聚光灯，是对我多年汗水与无私奉献的终极见证。篮球改变了我的人生，我也会将这份热爱与正能量永远传递下去！”`,
    };
  } else if (rank >= 41 && rank <= 45) {
    return {
      tierTitle: '不朽群英 · 铁血中坚演说',
      rankRangeStr: '历史 Top 41-45 铁血中坚',
      badgeBg: 'bg-[#374151]/40 text-slate-200 border border-slate-400 font-bold',
      speechText: `“成功杀入 NBA 历史前 45 名，站在奈史密斯名人堂的聚光灯下，我的内心久久不能平静。这不是凭空而降的幸运，而是无数个清晨与夜晚苦练、无数场生死对决血拼换来的尊严。感谢所有始终相信我 ${playerName} 的人，能够将自己的名字永恒刻在篮球历史的丰碑上，我这趟壮丽的职业生涯之旅彻底圆满了！”`,
    };
  } else {
    // 46 - 50
    return {
      tierTitle: '守门巨星 · 压轴名宿演说',
      rankRangeStr: '历史 Top 46-50 压轴名宿',
      badgeBg: 'bg-[#b45309]/10 text-amber-200 border border-amber-500/40 font-bold',
      speechText: `“成功守住 NBA 历史 50 大巨星的黄金席位，顺利叩开奈史密斯篮球名人堂的神圣大门！在这个高手如云、天骄辈出的最高殿堂里，每一分、每一个荣誉都来之不易。能够作为历史前 50 名的一员站在这个讲台上，为我 ${playerName} 的职业生涯画上最绚烂的句号，我感到万分幸运与无比自豪。感谢篮球，感谢大家！”`,
    };
  }
}

export function generateFallbackEpilogueStory(player: PlayerProfile, goatRank: number): string {
  const totalGames = Math.max(1, player.careerStats?.games || 1);
  const ppg = ((player.careerStats?.pts || 0) / totalGames).toFixed(1);
  const rpg = ((player.careerStats?.reb || 0) / totalGames).toFixed(1);
  const apg = ((player.careerStats?.ast || 0) / totalGames).toFixed(1);

  const accoladesList = player.accolades || [];
  const champCount = accoladesList.filter((a) => a.type === 'CHAMPION' || a.title.includes('总冠军')).length;
  const fmvpCount = accoladesList.filter((a) => a.type === 'FMVP' || a.title.includes('FMVP')).length;
  const mvpCount = accoladesList.filter((a) => a.type === 'MVP' || (a.title.includes('MVP') && !a.title.includes('FMVP'))).length;

  const name = player.name;
  const draftStr = `${player.draftYear || 2008}年第${player.draftPick || 1}顺位`;

  let chapter2Role = '篮球事务总裁与球队股东';
  if (champCount >= 3) {
    chapter2Role = '王朝球会幕后掌舵人与球队老板';
  } else if (mvpCount >= 1 || fmvpCount >= 1) {
    chapter2Role = '顶尖体育解说员与青年训练营总设计师';
  } else {
    chapter2Role = '知名篮球评论员与社区公益大使';
  }

  return `### 【第一章：告别赛场 · 挂靴时刻】
在退役新闻发布会那闪光灯如雨落下的瞬间，${name} 缓缓合上了球衣上的最后一颗扣子。从${draftStr}踏入联盟，到如今出战 ${totalGames} 场比赛，生涯斩获 ${player.careerStats.pts} 分、${player.careerStats.reb} 篮板、${player.careerStats.ast} 助攻，场均 ${ppg}分 ${rpg}板 ${apg}助。当战靴挂上更衣室木柜的那一刻，那些曾让你彻夜难眠的体能拉练、季后赛生死时刻的沉重呼吸，都化作了释怀的微笑。你微笑着向全场镜头挥手，赛场上少了一位无可匹敌的绝对巨星，但篮球史上多了一座永恒的丰碑。

### 【第二章：新的人生赛道 —— ${chapter2Role}】
离开球场后的第一年，${name} 并没有远离这项他深爱一生的运动。凭借在赛场积累的敏锐大局观与极高声望，你正式转型为 ${chapter2Role}。你不仅在转播席上用独到专业的战术视角折服了千万球迷，更出资成立了专属的青年球员选拔基金。在各大球会的管理层会议室里，你的出谋划策依然保留着当年赛场绝杀般的果断与魄力，以另一种方式继续主导着联盟的格局。

### 【第三章：球场之外与精神传承】
某个微凉的清晨，洛杉矶或纽约的一座街头露天球场上，几位十几岁的年轻人在练习三分球。一位戴着鸭舌帽、穿着休闲服的高大身影悄然走过，耐心地为孩子们纠正投篮姿势。当孩子们认出这位就是当年在 NBA 呼风唤雨、职业生涯荣获 ${champCount} 枚总冠军戒指、${mvpCount} 座MVP、历史排名第 #${goatRank} 位的传奇超级巨星 ${name} 时，整个球场爆发出了无比震撼的惊呼。你微笑着与孩子们合影，告诉他们：“伟大不是天赋，而是每一个清晨无人看见时的坚持。”

### 【第四章：不朽的传奇烙印】
岁月流逝，后辈新人层出不穷，但球馆穹顶高悬的 #${player.jerseyNum} 号球衣与奈史密斯名人堂中的雕像，时刻提醒着人们曾经有一个名字统治过这个时代。无论是在老球迷口口相传的故事里，还是在年轻一代观看的经典比赛录像回放中，${name} 这个名字都已经超越了胜负本身，成为了一代人关于热血、拼搏与荣耀的青春代名词。传奇永不熄灭，致敬 ${name}！`;
}


