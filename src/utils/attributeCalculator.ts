import { Position, Attributes, AttributeCaps } from '../types';
import { calculate2KOvr } from './calc2k';

export interface BodyShapePreset {
  id: 'slim' | 'balanced' | 'heavy';
  name: string;
  icon: string;
  heightCm: number;
  weightKg: number;
  desc: string;
}

export const BODY_SHAPE_PRESETS: BodyShapePreset[] = [
  {
    id: 'slim',
    name: '轻盈灵敏',
    icon: '⚡',
    heightCm: 188,
    weightKg: 78,
    desc: '移动极快，控球与投篮手感丝滑，灵活性顶尖',
  },
  {
    id: 'balanced',
    name: '标准匀称',
    icon: '⚖️',
    heightCm: 198,
    weightKg: 92,
    desc: '攻防兼备，身体素质均衡，适配多种打法',
  },
  {
    id: 'heavy',
    name: '强壮重型',
    icon: '🦍',
    heightCm: 208,
    weightKg: 110,
    desc: '对抗悍猛，禁区统治力强，力量与护框出众',
  },
];

export interface PositionArchetype {
  id: string;
  name: string;
  desc: string;
  icon: string;
  highlights: string;
  weights: Record<keyof Attributes, number>;
  baseCapBonus: Partial<Record<keyof Attributes, number>>;
}

export const POSITION_ARCHETYPES: Record<Position, PositionArchetype[]> = {
  PG: [
    {
      id: 'pg_playmaker',
      name: '组织大师',
      desc: '掌控球场大脑，拥有顶级视野与控球传球能力',
      icon: '🧠',
      highlights: '控球 / 传球 / 速度',
      weights: {
        ballHandle: 1.5, passing: 1.5, speed: 1.3, steal: 1.1,
        midRange: 1.0, threePoint: 1.0, freeThrow: 1.0, layup: 1.0,
        perimeterDef: 1.0, vertical: 1.0, stamina: 1.0, insideFinish: 0.8,
        rebounding: 0.5, dunk: 0.5, strength: 0.5, interiorDef: 0.4,
        postMove: 0.3, block: 0.3,
      },
      baseCapBonus: { ballHandle: 10, passing: 12, speed: 8 },
    },
    {
      id: 'pg_slasher',
      name: '爆破双能卫',
      desc: '撕裂防线，突破上篮与爆发速度极其狂暴',
      icon: '⚡',
      highlights: '速度 / 上篮 / 控球',
      weights: {
        speed: 1.5, layup: 1.4, vertical: 1.4, ballHandle: 1.3, insideFinish: 1.2,
        dunk: 1.0, steal: 1.0, midRange: 0.9, threePoint: 0.8,
        freeThrow: 0.9, perimeterDef: 0.9, stamina: 1.0, passing: 0.9,
        rebounding: 0.6, strength: 0.6, interiorDef: 0.4, postMove: 0.3, block: 0.3,
      },
      baseCapBonus: { speed: 12, layup: 10, dunk: 8, vertical: 10 },
    },
    {
      id: 'pg_sharpshooter',
      name: '顶级神射',
      desc: '冷血外线大杀器，挡拆干拔与超远三分手到擒来',
      icon: '🎯',
      highlights: '三分 / 中投 / 罚球',
      weights: {
        threePoint: 1.6, midRange: 1.4, freeThrow: 1.3, ballHandle: 1.0,
        passing: 1.0, speed: 1.0, vertical: 0.9, steal: 0.8, perimeterDef: 0.8,
        layup: 0.8, stamina: 1.0, insideFinish: 0.7, rebounding: 0.5,
        dunk: 0.4, strength: 0.5, interiorDef: 0.4, postMove: 0.3, block: 0.3,
      },
      baseCapBonus: { threePoint: 14, midRange: 10, freeThrow: 8 },
    },
  ],
  SG: [
    {
      id: 'sg_scorer',
      name: '顶级得分手',
      desc: '全景得分手段，中投、三分与突破终结样样精通',
      icon: '🔥',
      highlights: '中投 / 三分 / 上篮',
      weights: {
        midRange: 1.4, threePoint: 1.3, layup: 1.2, insideFinish: 1.1,
        ballHandle: 1.1, speed: 1.1, vertical: 1.1, freeThrow: 1.1, dunk: 1.0,
        perimeterDef: 0.9, stamina: 1.0, passing: 0.8, steal: 0.8,
        postMove: 0.8, rebounding: 0.7, strength: 0.7, interiorDef: 0.6, block: 0.4,
      },
      baseCapBonus: { midRange: 10, threePoint: 10, layup: 8 },
    },
    {
      id: 'sg_3d',
      name: '3D闸门',
      desc: '外线单防死锁对方核心，空位三分箭箭穿心',
      icon: '🛡️',
      highlights: '外防 / 抢断 / 三分',
      weights: {
        perimeterDef: 1.5, steal: 1.4, threePoint: 1.3, stamina: 1.1,
        speed: 1.1, vertical: 1.0, strength: 0.9, freeThrow: 0.9, midRange: 0.9,
        layup: 0.8, passing: 0.8, rebounding: 0.8, interiorDef: 0.8, ballHandle: 0.7, insideFinish: 0.7,
        block: 0.6, dunk: 0.6, postMove: 0.5,
      },
      baseCapBonus: { perimeterDef: 12, steal: 10, threePoint: 10 },
    },
    {
      id: 'sg_highflyer',
      name: '飞人扣将',
      desc: '暴力扣将，快攻反击与隔人暴扣震撼全场',
      icon: '💥',
      highlights: '扣篮 / 弹跳 / 速度',
      weights: {
        dunk: 1.6, vertical: 1.6, speed: 1.4, insideFinish: 1.3, layup: 1.2,
        strength: 1.0, ballHandle: 0.9, stamina: 1.0, perimeterDef: 0.8,
        rebounding: 0.8, midRange: 0.8, steal: 0.8, freeThrow: 0.7, threePoint: 0.6,
        postMove: 0.6, interiorDef: 0.6, block: 0.6, passing: 0.7,
      },
      baseCapBonus: { dunk: 15, vertical: 14, speed: 10, insideFinish: 8 },
    },
  ],
  SF: [
    {
      id: 'sf_allaround',
      name: '全能战士',
      desc: '无短板攻防万金油，掌控全局的锋线杀手',
      icon: '🌟',
      highlights: '全能均衡 / 攻防一体',
      weights: {
        midRange: 1.1, threePoint: 1.1, layup: 1.1, insideFinish: 1.1,
        perimeterDef: 1.1, speed: 1.1, vertical: 1.1, strength: 1.0, ballHandle: 1.0,
        passing: 1.0, dunk: 1.0, stamina: 1.0, postMove: 1.0, rebounding: 1.0, interiorDef: 1.0, steal: 0.9,
        block: 0.8, freeThrow: 0.9,
      },
      baseCapBonus: { midRange: 8, perimeterDef: 8, insideFinish: 8, speed: 8 },
    },
    {
      id: 'sf_pointforward',
      name: '组织前锋',
      desc: '锋线身材组织核心，擅长发动快攻与弧顶策应',
      icon: '🎩',
      highlights: '传球 / 控球 / 篮球智商',
      weights: {
        passing: 1.5, ballHandle: 1.3, speed: 1.1, midRange: 1.0,
        layup: 1.1, perimeterDef: 1.0, vertical: 1.0, strength: 1.0, stamina: 1.0,
        threePoint: 0.9, insideFinish: 0.9, postMove: 0.9, rebounding: 0.9, interiorDef: 0.9, steal: 0.9, dunk: 0.8,
        freeThrow: 0.9, block: 0.6,
      },
      baseCapBonus: { passing: 12, ballHandle: 10, midRange: 8 },
    },
    {
      id: 'sf_3dwing',
      name: '3D侧翼',
      desc: '顶级防守侧翼，强悍身体对抗与底角三分狙击',
      icon: '🏹',
      highlights: '三分 / 外防 / 力量',
      weights: {
        threePoint: 1.4, perimeterDef: 1.4, strength: 1.2, steal: 1.1,
        stamina: 1.1, interiorDef: 1.1, vertical: 1.0, rebounding: 1.0, block: 0.9, speed: 1.0, freeThrow: 0.9,
        midRange: 0.8, layup: 0.8, insideFinish: 0.8, postMove: 0.7, dunk: 0.7,
        passing: 0.7, ballHandle: 0.6,
      },
      baseCapBonus: { threePoint: 12, perimeterDef: 12, strength: 8 },
    },
  ],
  PF: [
    {
      id: 'pf_stretch4',
      name: '空间型4号位',
      desc: '外线高射炮，高位中投与三分拉开极佳进攻空间',
      icon: '🏹',
      highlights: '三分 / 中投 / 罚球',
      weights: {
        threePoint: 1.5, midRange: 1.4, freeThrow: 1.2, rebounding: 1.2, interiorDef: 1.1, postMove: 1.1, insideFinish: 1.0,
        vertical: 1.0, strength: 0.9, block: 0.9, perimeterDef: 0.8, stamina: 1.0,
        layup: 0.8, passing: 0.8, speed: 0.8, dunk: 0.7,
        ballHandle: 0.6, steal: 0.5,
      },
      baseCapBonus: { threePoint: 14, midRange: 12, freeThrow: 10 },
    },
    {
      id: 'pf_twoway',
      name: '攻防机动前锋',
      desc: '快速补防与快攻跟进，兼具爆发力与机动性',
      icon: '⚡',
      highlights: '速度 / 弹跳 / 盖帽',
      weights: {
        speed: 1.3, block: 1.3, rebounding: 1.3, interiorDef: 1.3, vertical: 1.3, dunk: 1.2, insideFinish: 1.2,
        postMove: 1.1, perimeterDef: 1.1, strength: 1.1, layup: 1.0, stamina: 1.1,
        midRange: 0.8, steal: 0.8, passing: 0.7, freeThrow: 0.7,
        threePoint: 0.6, ballHandle: 0.5,
      },
      baseCapBonus: { speed: 10, block: 10, vertical: 10, dunk: 10 },
    },
    {
      id: 'pf_beast',
      name: '内线野兽',
      desc: '力量碾压，背身单打、篮板暴扣与强力封盖',
      icon: '🦍',
      highlights: '力量 / 篮板 / 背身',
      weights: {
        strength: 1.5, rebounding: 1.5, postMove: 1.4, insideFinish: 1.4, interiorDef: 1.4, dunk: 1.3, vertical: 1.2, block: 1.2,
        layup: 1.1, stamina: 1.1, midRange: 0.7, freeThrow: 0.7,
        perimeterDef: 0.7, speed: 0.7, passing: 0.5, threePoint: 0.3,
        ballHandle: 0.3, steal: 0.4,
      },
      baseCapBonus: { strength: 15, rebounding: 14, postMove: 12, insideFinish: 12 },
    },
  ],
  C: [
    {
      id: 'c_rimprotector',
      name: '禁区守护者',
      desc: '禁区飞天排球大帽，防守篮板与护框绝对支柱',
      icon: '🛡️',
      highlights: '盖帽 / 内防 / 篮板',
      weights: {
        block: 1.6, interiorDef: 1.6, rebounding: 1.5, strength: 1.4, vertical: 1.3, insideFinish: 1.3, stamina: 1.2,
        postMove: 1.1, dunk: 1.1, layup: 1.0, perimeterDef: 0.6, freeThrow: 0.6,
        midRange: 0.5, speed: 0.5, passing: 0.4, steal: 0.4,
        threePoint: 0.2, ballHandle: 0.2,
      },
      baseCapBonus: { block: 15, interiorDef: 15, rebounding: 14, strength: 12 },
    },
    {
      id: 'c_anchor',
      name: '传统重型中锋',
      desc: '低位巨无霸，勾手背身、强力卡位篮板与力量碾压',
      icon: '🧱',
      highlights: '力量 / 背身 / 篮板',
      weights: {
        strength: 1.6, interiorDef: 1.6, postMove: 1.5, rebounding: 1.5, insideFinish: 1.5, layup: 1.2, block: 1.2,
        vertical: 1.0, dunk: 1.1, freeThrow: 0.8, stamina: 1.1, midRange: 0.6,
        speed: 0.4, perimeterDef: 0.5, passing: 0.5, steal: 0.3,
        threePoint: 0.2, ballHandle: 0.2,
      },
      baseCapBonus: { strength: 15, postMove: 14, interiorDef: 14, insideFinish: 14 },
    },
    {
      id: 'c_stretch',
      name: '现代空间中锋',
      desc: '拉开空间的高塔，兼具中远投射、篮板与护框',
      icon: '🎯',
      highlights: '三分 / 中投 / 篮板',
      weights: {
        midRange: 1.4, threePoint: 1.3, rebounding: 1.3, interiorDef: 1.2, freeThrow: 1.1, insideFinish: 1.1,
        block: 1.1, vertical: 1.0, strength: 1.0, stamina: 1.0, layup: 0.9, postMove: 1.0,
        passing: 0.6, speed: 0.6, perimeterDef: 0.6, dunk: 0.8,
        ballHandle: 0.4, steal: 0.3,
      },
      baseCapBonus: { midRange: 12, threePoint: 12, rebounding: 10 },
    },
  ],
};

/**
 * Calculate Initial Base Attributes and Caps based on:
 * - Position & Archetype
 * - Height (cm) & Weight (kg)
 * - Paid OVR Boost (+0 to +30 OVR points)
 */
export function calculateAttributesAndCaps(
  position: Position,
  archetypeId: string,
  heightCm: number,
  weightKg: number,
  paidBoostOvr: number = 0,
  baseOvr: number = 65
): { attributes: Attributes; attributeCaps: AttributeCaps; initialOvr: number } {
  // Find matching archetype
  const archetypesList = POSITION_ARCHETYPES[position] || POSITION_ARCHETYPES.PG;
  const arch = archetypesList.find((a) => a.id === archetypeId) || archetypesList[0];

  // Height and Weight modifiers relative to standard (198cm, 92kg)
  const heightDiff = heightCm - 198; // e.g., -18 to +27
  const weightDiff = weightKg - 92;  // e.g., -27 to +48

  // 1. Calculate Caps
  const defaultBaseCap: AttributeCaps = {
    midRange: 85,
    threePoint: 82,
    freeThrow: 80,
    layup: 85,
    dunk: 82,
    insideFinish: 85,
    postMove: 82,
    ballHandle: 82,
    passing: 82,
    perimeterDef: 82,
    interiorDef: 82,
    block: 80,
    steal: 80,
    rebounding: 82,
    speed: 85,
    vertical: 82,
    strength: 82,
    stamina: 88,
  };

  const attributeKeys: (keyof Attributes)[] = [
    'midRange', 'threePoint', 'freeThrow', 'layup', 'dunk', 'insideFinish',
    'postMove', 'ballHandle', 'passing', 'perimeterDef', 'interiorDef',
    'block', 'steal', 'rebounding', 'speed', 'vertical', 'strength', 'stamina',
  ];

  const caps: AttributeCaps = { ...defaultBaseCap };

  // Apply archetype cap bonuses
  attributeKeys.forEach((key) => {
    const bonus = arch.baseCapBonus[key] || 0;
    caps[key] += bonus;
  });

  // Apply height modifiers to caps
  if (heightDiff < 0) {
    const absH = Math.abs(heightDiff); // e.g. -18 for 180cm
    caps.speed = Math.min(99, caps.speed + Math.round(absH * 0.7));
    caps.vertical = Math.min(99, caps.vertical + Math.round(absH * 0.5));
    caps.ballHandle = Math.min(99, caps.ballHandle + Math.round(absH * 0.6));
    caps.threePoint = Math.min(99, caps.threePoint + Math.round(absH * 0.4));
    caps.steal = Math.min(99, caps.steal + Math.round(absH * 0.5));
    caps.perimeterDef = Math.min(99, caps.perimeterDef + Math.round(absH * 0.4));

    // Lower big-man traits for short guards
    caps.dunk = Math.max(50, caps.dunk - Math.round(absH * 1.5));
    caps.block = Math.max(50, caps.block - Math.round(absH * 1.2));
    caps.strength = Math.max(50, caps.strength - Math.round(absH * 0.8));
    caps.insideFinish = Math.max(50, caps.insideFinish - Math.round(absH * 0.6));
    caps.postMove = Math.max(50, caps.postMove - Math.round(absH * 0.8));
    caps.interiorDef = Math.max(50, caps.interiorDef - Math.round(absH * 0.8));
    caps.rebounding = Math.max(50, caps.rebounding - Math.round(absH * 0.8));
  } else if (heightDiff > 0) {
    caps.dunk = Math.min(99, caps.dunk + Math.round(heightDiff * 0.8));
    caps.block = Math.min(99, caps.block + Math.round(heightDiff * 1.0));
    caps.insideFinish = Math.min(99, caps.insideFinish + Math.round(heightDiff * 0.7));
    caps.strength = Math.min(99, caps.strength + Math.round(heightDiff * 0.5));
    caps.postMove = Math.min(99, caps.postMove + Math.round(heightDiff * 0.7));
    caps.interiorDef = Math.min(99, caps.interiorDef + Math.round(heightDiff * 0.8));
    caps.rebounding = Math.min(99, caps.rebounding + Math.round(heightDiff * 0.8));

    caps.speed = Math.max(50, caps.speed - Math.round(heightDiff * 0.8));
    caps.ballHandle = Math.max(50, caps.ballHandle - Math.round(heightDiff * 0.8));
    caps.threePoint = Math.max(50, caps.threePoint - Math.round(heightDiff * 0.4));
    caps.steal = Math.max(50, caps.steal - Math.round(heightDiff * 0.6));
    caps.perimeterDef = Math.max(50, caps.perimeterDef - Math.round(heightDiff * 0.5));
  }

  // Apply weight modifiers to caps
  if (weightDiff > 0) {
    caps.strength = Math.min(99, caps.strength + Math.round(weightDiff * 0.5));
    caps.postMove = Math.min(99, caps.postMove + Math.round(weightDiff * 0.4));
    caps.interiorDef = Math.min(99, caps.interiorDef + Math.round(weightDiff * 0.4));
    caps.insideFinish = Math.min(99, caps.insideFinish + Math.round(weightDiff * 0.3));
    caps.speed = Math.max(50, caps.speed - Math.round(weightDiff * 0.4));
    caps.vertical = Math.max(50, caps.vertical - Math.round(weightDiff * 0.3));
    caps.stamina = Math.max(55, caps.stamina - Math.round(weightDiff * 0.2));
  } else if (weightDiff < 0) {
    const absW = Math.abs(weightDiff);
    caps.speed = Math.min(99, caps.speed + Math.round(absW * 0.3));
    caps.vertical = Math.min(99, caps.vertical + Math.round(absW * 0.3));
    caps.stamina = Math.min(99, caps.stamina + Math.round(absW * 0.2));
    caps.strength = Math.max(50, caps.strength - Math.round(absW * 0.5));
  }

  // Ensure all caps are bounded between 50 and 99
  attributeKeys.forEach((key) => {
    caps[key] = Math.min(99, Math.max(50, caps[key]));
  });

  // 2. Calculate Base Attributes so Average matches targetOvr via calculate2KOvr solver
  const targetOvr = baseOvr + paidBoostOvr;

  // Helper to generate attributes for a given trial average
  const generateWithTrialAvg = (trialAvg: number) => {
    const targetTotalSum = Math.round(trialAvg * attributeKeys.length);

    // Compute raw weights for each attribute
    const rawWeights: Record<keyof Attributes, number> = {} as any;

    attributeKeys.forEach((key) => {
      let w = arch.weights[key] || 1.0;

      // Apply gentle height/weight bias
      if (key === 'dunk' || key === 'block' || key === 'insideFinish' || key === 'strength' || key === 'postMove' || key === 'interiorDef' || key === 'rebounding') {
        if (heightDiff > 0) w *= 1 + (heightDiff / 90);
        else if (heightDiff < 0) w *= Math.max(0.7, 1 + (heightDiff / 70));
      }
      if (key === 'speed' || key === 'ballHandle' || key === 'steal' || key === 'threePoint' || key === 'vertical') {
        if (heightDiff < 0) w *= 1 + (Math.abs(heightDiff) / 70);
        else if (heightDiff > 0) w *= Math.max(0.7, 1 - (heightDiff / 90));
      }
      if (key === 'strength' || key === 'postMove' || key === 'interiorDef') {
        if (weightDiff > 0) w *= 1 + (weightDiff / 90);
      }

      rawWeights[key] = w;
    });

    // Moderate spread multiplier so primary advantages get ~72-76 max, weak traits get ~54-58
    const spreadMultiplier = 14;
    const trialAttrs: Attributes = {} as any;
    let currentSum = 0;

    attributeKeys.forEach((key) => {
      const w = rawWeights[key];
      let val = Math.round(trialAvg + (w - 1.0) * spreadMultiplier);
      // Clamp val between min 50 and caps[key]
      val = Math.min(caps[key], Math.max(50, val));
      trialAttrs[key] = val;
      currentSum += val;
    });

    // Fine-tune exact total sum to equal targetTotalSum
    let diff = targetTotalSum - currentSum;
    let attempts = 0;
    while (diff !== 0 && attempts < 100) {
      attempts++;
      const step = diff > 0 ? 1 : -1;
      const sortedKeys = [...attributeKeys].sort((a, b) => {
        if (diff > 0) {
          return (rawWeights[b] - (trialAttrs[b] >= caps[b] ? 99 : 0)) -
                 (rawWeights[a] - (trialAttrs[a] >= caps[a] ? 99 : 0));
        } else {
          return (rawWeights[a] + (trialAttrs[a] <= 50 ? 99 : 0)) -
                 (rawWeights[b] + (trialAttrs[b] <= 50 ? 99 : 0));
        }
      });

      let adjusted = false;
      for (const key of sortedKeys) {
        const nextVal = trialAttrs[key] + step;
        if (nextVal >= 50 && nextVal <= caps[key]) {
          trialAttrs[key] = nextVal;
          diff -= step;
          adjusted = true;
          break;
        }
      }
      if (!adjusted) break;
    }

    const initialOvr = calculate2KOvr(position, trialAttrs);
    return { trialAttrs, initialOvr, rawWeights };
  };

  // Search for the best trial average to get as close to targetOvr as possible in terms of calculate2KOvr
  const startSearch = Math.max(40, targetOvr - 25);
  const endSearch = Math.min(99, targetOvr + 5);

  let bestTrialAvg = targetOvr;
  let bestAttrs: Attributes = {} as any;
  let bestOvr = 60;
  let minDiff = 999;
  let bestWeights: Record<keyof Attributes, number> = {} as any;

  for (let t = startSearch; t <= endSearch; t += 0.5) {
    const { trialAttrs, initialOvr, rawWeights } = generateWithTrialAvg(t);
    const d = Math.abs(initialOvr - targetOvr);
    if (d < minDiff) {
      minDiff = d;
      bestTrialAvg = t;
      bestAttrs = trialAttrs;
      bestOvr = initialOvr;
      bestWeights = rawWeights;
    } else if (d === minDiff) {
      if (Math.abs(initialOvr - targetOvr) < Math.abs(bestOvr - targetOvr) || t > bestTrialAvg) {
        bestTrialAvg = t;
        bestAttrs = trialAttrs;
        bestOvr = initialOvr;
        bestWeights = rawWeights;
      }
    }
  }

  // Fine-tune attributes so finalOvr matches targetOvr EXACTLY
  let finalAttrs = { ...bestAttrs };
  let finalOvr = bestOvr;
  let fineTuneAttempts = 0;

  while (finalOvr !== targetOvr && fineTuneAttempts < 40) {
    fineTuneAttempts++;
    const step = targetOvr > finalOvr ? 1 : -1;

    // Sort attributes by weight
    const sortedKeys = [...attributeKeys].sort((a, b) => {
      const wA = bestWeights[a] || 1.0;
      const wB = bestWeights[b] || 1.0;
      return step > 0 ? (wB - wA) : (wA - wB);
    });

    let adjusted = false;
    for (const key of sortedKeys) {
      const nextVal = finalAttrs[key] + step;
      if (nextVal >= 50 && nextVal <= caps[key]) {
        const testAttrs = { ...finalAttrs, [key]: nextVal };
        const testOvr = calculate2KOvr(position, testAttrs);
        if (step > 0 ? (testOvr >= finalOvr && testOvr <= targetOvr) : (testOvr <= finalOvr && testOvr >= targetOvr)) {
          finalAttrs[key] = nextVal;
          finalOvr = testOvr;
          adjusted = true;
          break;
        }
      }
    }

    if (!adjusted) {
      for (const key of attributeKeys) {
        const nextVal = finalAttrs[key] + step;
        if (nextVal >= 50 && nextVal <= caps[key]) {
          finalAttrs[key] = nextVal;
          finalOvr = calculate2KOvr(position, finalAttrs);
          adjusted = true;
          break;
        }
      }
    }

    if (!adjusted) break;
  }

  return {
    attributes: finalAttrs,
    attributeCaps: caps,
    initialOvr: finalOvr,
  };
}

