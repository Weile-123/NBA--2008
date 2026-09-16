import type { Attributes, PlayerProfile, Position } from '../types';
import { calculate2KOvr } from './calc2k';
import { calculateAttributesAndCaps } from './attributeCalculator';

export type BodyShape = 'slim' | 'balanced' | 'heavy';
type Attribute = keyof Attributes;
type Core = readonly [Attribute, number, number];
type TemplateRow = readonly [string, string, readonly [Core, Core, Core, Core]];

// Each row is [player-facing template name, style reference, four core
// [attribute, starting value at 70 OVR, ceiling]]. Rows are ordered slim,
// balanced, heavy. References never affect ratings or saved player names.
const TEMPLATES: Record<string, readonly [TemplateRow, TemplateRow, TemplateRow]> = {
  PG: [
    ['投射型控卫', '斯蒂芬·库里', [['threePoint', 78, 99], ['ballHandle', 76, 97], ['passing', 74, 95], ['speed', 73, 94]]],
    ['组织型控卫', '克里斯·保罗', [['passing', 79, 99], ['ballHandle', 77, 97], ['steal', 75, 95], ['midRange', 73, 94]]],
    ['攻防型控卫', '昌西·比卢普斯', [['passing', 77, 97], ['threePoint', 76, 96], ['strength', 75, 95], ['perimeterDef', 74, 94]]],
  ],
  SG: [
    ['无球投射分卫', '雷吉·米勒', [['threePoint', 79, 99], ['stamina', 77, 97], ['freeThrow', 76, 97], ['speed', 73, 94]]],
    ['攻防型分卫', '科比·布莱恩特', [['midRange', 79, 99], ['layup', 77, 97], ['perimeterDef', 75, 96], ['ballHandle', 74, 95]]],
    ['冲击型分卫', '迈克尔·乔丹', [['dunk', 80, 99], ['vertical', 79, 99], ['midRange', 76, 97], ['steal', 74, 95]]],
  ],
  SF: [
    ['投防型小前锋', '保罗·乔治', [['threePoint', 77, 97], ['perimeterDef', 77, 98], ['steal', 75, 95], ['speed', 74, 94]]],
    ['全能型小前锋', '斯科蒂·皮蓬', [['perimeterDef', 79, 99], ['passing', 77, 97], ['steal', 76, 97], ['rebounding', 74, 94]]],
    ['技巧型小前锋', '保罗·皮尔斯', [['midRange', 79, 98], ['strength', 77, 97], ['postMove', 76, 96], ['threePoint', 74, 94]]],
  ],
  PF: [
    ['空间型大前锋', '德克·诺维茨基', [['midRange', 80, 99], ['threePoint', 79, 99], ['freeThrow', 77, 97], ['postMove', 74, 95]]],
    ['攻防型大前锋', '蒂姆·邓肯', [['interiorDef', 79, 99], ['postMove', 78, 98], ['rebounding', 77, 97], ['block', 75, 96]]],
    ['强攻型大前锋', '卡尔·马龙', [['strength', 80, 99], ['rebounding', 78, 98], ['insideFinish', 78, 97], ['midRange', 74, 94]]],
  ],
  C: [
    ['机动防守中锋', '比尔·拉塞尔', [['block', 80, 99], ['rebounding', 79, 99], ['interiorDef', 78, 98], ['vertical', 76, 97]]],
    ['技术型中锋', '哈基姆·奥拉朱旺', [['postMove', 80, 99], ['block', 79, 99], ['interiorDef', 78, 98], ['steal', 74, 95]]],
    ['强力型中锋', '沙奎尔·奥尼尔', [['strength', 82, 99], ['dunk', 81, 99], ['insideFinish', 80, 99], ['rebounding', 76, 97]]],
  ],
  'PG/SG': [
    ['持球型双能卫', '凯里·欧文', [['ballHandle', 79, 99], ['layup', 78, 98], ['midRange', 76, 96], ['speed', 74, 95]]],
    ['高大型双能卫', '安芬尼·哈达威', [['ballHandle', 78, 97], ['passing', 78, 98], ['layup', 76, 96], ['rebounding', 73, 94]]],
    ['冲击型双能卫', '拉塞尔·威斯布鲁克', [['speed', 80, 99], ['dunk', 78, 98], ['passing', 76, 96], ['strength', 74, 95]]],
  ],
  'SG/PG': [
    ['突破型双能卫', '阿伦·艾弗森', [['speed', 80, 99], ['ballHandle', 79, 99], ['layup', 77, 97], ['steal', 74, 94]]],
    ['策应型双能卫', '马努·吉诺比利', [['passing', 78, 98], ['layup', 77, 97], ['ballHandle', 76, 96], ['threePoint', 75, 95]]],
    ['强攻型双能卫', '德维恩·韦德', [['insideFinish', 79, 99], ['layup', 78, 98], ['dunk', 76, 96], ['perimeterDef', 75, 95]]],
  ],
  'SG/SF': [
    ['持球得分侧翼', '特雷西·麦克格雷迪', [['midRange', 80, 99], ['ballHandle', 77, 97], ['dunk', 76, 97], ['threePoint', 74, 95]]],
    ['全能得分侧翼', '文斯·卡特', [['dunk', 80, 99], ['vertical', 79, 99], ['threePoint', 76, 96], ['layup', 74, 95]]],
    ['投防型侧翼', '克莱·汤普森', [['threePoint', 80, 99], ['perimeterDef', 79, 99], ['midRange', 76, 96], ['stamina', 75, 96]]],
  ],
  'SF/PG': [
    ['突破组织前锋', '格兰特·希尔', [['passing', 79, 99], ['ballHandle', 77, 97], ['layup', 76, 96], ['speed', 74, 95]]],
    ['投射组织前锋', '拉里·伯德', [['threePoint', 79, 99], ['passing', 79, 99], ['midRange', 77, 97], ['rebounding', 75, 95]]],
    ['强攻组织前锋', '勒布朗·詹姆斯', [['insideFinish', 80, 99], ['passing', 79, 99], ['strength', 79, 99], ['speed', 75, 96]]],
  ],
  'SF/SG': [
    ['运动型侧翼', '安德鲁·威金斯', [['vertical', 79, 99], ['dunk', 78, 98], ['speed', 76, 96], ['perimeterDef', 75, 95]]],
    ['攻防型侧翼', '吉米·巴特勒', [['perimeterDef', 80, 99], ['steal', 77, 97], ['insideFinish', 76, 96], ['strength', 75, 95]]],
    ['强攻型侧翼', '杰伦·布朗', [['strength', 79, 99], ['dunk', 79, 99], ['midRange', 76, 96], ['perimeterDef', 75, 95]]],
  ],
  'SF/PF': [
    ['空间型锋线', '凯文·杜兰特', [['midRange', 81, 99], ['threePoint', 79, 99], ['ballHandle', 76, 96], ['insideFinish', 75, 95]]],
    ['技巧型锋线', '保罗·皮尔斯', [['midRange', 80, 99], ['threePoint', 77, 97], ['postMove', 77, 97], ['strength', 74, 95]]],
    ['防守型锋线', '罗恩·阿泰斯特', [['perimeterDef', 80, 99], ['strength', 80, 99], ['steal', 76, 96], ['threePoint', 73, 94]]],
  ],
  'PF/C': [
    ['空间型内线', '克里斯·波什', [['midRange', 79, 99], ['block', 77, 97], ['rebounding', 76, 96], ['insideFinish', 75, 95]]],
    ['机动型内线', '安东尼·戴维斯', [['block', 80, 99], ['interiorDef', 79, 99], ['vertical', 78, 98], ['insideFinish', 76, 96]]],
    ['强攻型内线', '阿玛雷·斯塔德迈尔', [['dunk', 81, 99], ['insideFinish', 80, 99], ['strength', 78, 98], ['rebounding', 75, 95]]],
  ],
  'PF/SF': [
    ['空间型前锋', '安托万·贾米森', [['threePoint', 78, 98], ['layup', 77, 97], ['rebounding', 76, 96], ['speed', 74, 95]]],
    ['策应型前锋', '拉马尔·奥多姆', [['passing', 79, 99], ['rebounding', 77, 97], ['ballHandle', 76, 96], ['insideFinish', 75, 95]]],
    ['防守型前锋', '肖恩·马里昂', [['rebounding', 79, 99], ['perimeterDef', 78, 98], ['steal', 76, 96], ['block', 75, 95]]],
  ],
  'C/PF': [
    ['空间型中锋', '卡尔-安东尼·唐斯', [['threePoint', 80, 99], ['midRange', 79, 99], ['rebounding', 76, 96], ['insideFinish', 75, 95]]],
    ['机动型中锋', '大卫·罗宾逊', [['block', 80, 99], ['interiorDef', 79, 99], ['vertical', 78, 98], ['midRange', 75, 95]]],
    ['低位策应中锋', '德马库斯·考辛斯', [['postMove', 81, 99], ['strength', 80, 99], ['rebounding', 78, 98], ['passing', 74, 95]]],
  ],
};

export const CREATION_POSITION_COMBINATIONS = Object.keys(TEMPLATES);
const SHAPES: BodyShape[] = ['slim', 'balanced', 'heavy'];
const POSITION_BODY_MEASUREMENTS: Record<Position, readonly [readonly [number, number], readonly [number, number], readonly [number, number]]> = {
  PG: [[183, 76], [190, 87], [194, 98]],
  SG: [[190, 82], [198, 94], [202, 106]],
  SF: [[198, 88], [204, 100], [208, 112]],
  PF: [[205, 96], [211, 110], [214, 123]],
  C: [[211, 102], [216, 118], [220, 132]],
};

export function getTemplateBodyMeasurements(position: Position, shape: BodyShape) {
  const [heightCm, weightKg] = POSITION_BODY_MEASUREMENTS[position][SHAPES.indexOf(shape)];
  return { heightCm, weightKg };
}
const ATTRIBUTE_KEYS = Object.keys({
  midRange: 0, threePoint: 0, freeThrow: 0, layup: 0, dunk: 0, insideFinish: 0,
  postMove: 0, ballHandle: 0, passing: 0, perimeterDef: 0, interiorDef: 0,
  block: 0, steal: 0, rebounding: 0, speed: 0, vertical: 0, strength: 0, stamina: 0,
}) as Attribute[];

export function getCreationTemplate(position: Position, secondary: Position | null, shape: BodyShape) {
  const key = secondary ? `${position}/${secondary}` : position;
  const row = TEMPLATES[key]?.[SHAPES.indexOf(shape)];
  if (!row) throw new Error(`Unsupported creation template: ${key}/${shape}`);
  return { id: `${key}_${shape}`, name: row[0], reference: row[1], core: row[2] };
}

const SCOUT_TRAITS: Record<Attribute, [string, string]> = {
  midRange: ['中距离脚步与稳定出手', '中距离出手选择还需磨练'],
  threePoint: ['外线射程与空间牵制', '三分投射稳定性仍可提升'],
  freeThrow: ['造犯规后的罚球把握', '罚球手感需要持续训练'],
  layup: ['突破上篮的节奏变化', '对抗下的上篮终结有待加强'],
  dunk: ['空切冲筐与篮下爆发力', '扣篮时机与篮下爆发力仍需打磨'],
  insideFinish: ['禁区对抗后的终结能力', '高强度对抗下的终结仍需提升'],
  postMove: ['低位脚步与背身处理', '低位背身技术尚有提升空间'],
  ballHandle: ['持球变向与推进控制', '高压逼抢下的控球仍需磨练'],
  passing: ['传球视野与进攻组织', '复杂防守下的传球判断需要积累'],
  perimeterDef: ['外线领防与换防覆盖', '外线防守站位仍需完善'],
  interiorDef: ['禁区协防与护筐站位', '禁区协防站位需要打磨'],
  block: ['护筐时机与封盖威慑', '封盖时机与犯规控制有待改进'],
  steal: ['预判传球线路与抢断', '抢断尝试与防守纪律需要平衡'],
  rebounding: ['卡位意识与篮板保护', '篮板卡位和对抗仍需加强'],
  speed: ['转换推进与第一步速度', '转换跑动速度尚可提高'],
  vertical: ['纵向起跳与空中对抗', '起跳爆发力仍可加强'],
  strength: ['身体对抗与阵地战支撑', '身体对抗能力需要继续强化'],
  stamina: ['持续跑动与高强度续航', '长时间高强度比赛的体能需加强'],
};

export function getCreationTemplateScoutReport(player: Pick<PlayerProfile, 'archetype' | 'position' | 'secondaryPosition' | 'ovr' | 'attributes'>) {
  for (const [combination, rows] of Object.entries(TEMPLATES)) {
    const row = rows.find(([name]) => name === player.archetype);
    if (!row) continue;
    const [name, starName, core] = row;
    const coreKeys = new Set(core.map(([key]) => key));
    const weakest = ATTRIBUTE_KEYS.filter((key) => !coreKeys.has(key))
      .sort((a, b) => player.attributes[a] - player.attributes[b] || a.localeCompare(b))
      .slice(0, 2);
    const weaknesses = weakest.map((key) => SCOUT_TRAITS[key][1]);
    const strengths = core.slice(0, 3).map(([key]) => SCOUT_TRAITS[key][0]);
    const grade = player.ovr >= 80 ? 'A+（顶级新秀）' : player.ovr >= 75 ? 'A（重点培养）' : player.ovr >= 70 ? 'A-（潜力新秀）' : 'B+（发展型新秀）';
    const [firstKey, secondKey] = core;
    return {
      starName,
      starTitle: name,
      avatar: ({ PG: '🏀', SG: '🎯', SF: '⭐', PF: '💪', C: '🛡️' } as const)[player.position],
      similarity: 93,
      grade,
      strengths,
      weaknesses,
      scoutComment: `这名${combination}球员以${SCOUT_TRAITS[firstKey[0]][0]}和${SCOUT_TRAITS[secondKey[0]][0]}建立比赛影响力，展现出${name}的鲜明球风。球探同时指出：${weaknesses[0]}；若能持续训练，有望形成稳定的个人优势。`,
    };
  }
  return null;
}

export function getCreationSecondaryOptions(position: Position): Array<Position | null> {
  return [null, ...(['PG', 'SG', 'SF', 'PF', 'C'] as Position[]).filter((secondary) => `${position}/${secondary}` in TEMPLATES)];
}

export function calculateCreationTemplateAttributes(
  position: Position, secondary: Position | null, shape: BodyShape,
  paidBoostOvr = 0, baseOvr = 70,
) {
  const template = getCreationTemplate(position, secondary, shape);
  const preset = getTemplateBodyMeasurements(position, shape);
  const legacyStyle = { PG: ['pg_sharpshooter', 'pg_playmaker', 'pg_slasher'], SG: ['sg_scorer', 'sg_3d', 'sg_highflyer'], SF: ['sf_pointforward', 'sf_allaround', 'sf_3dwing'], PF: ['pf_stretch4', 'pf_twoway', 'pf_beast'], C: ['c_stretch', 'c_rimprotector', 'c_anchor'] }[position][SHAPES.indexOf(shape)];
  const result = calculateAttributesAndCaps(position, legacyStyle, preset.heightCm, preset.weightKg, paidBoostOvr, baseOvr);
  const attributes = { ...result.attributes };
  const attributeCaps = { ...result.attributeCaps };
  const coreKeys = new Set(template.core.map(([key]) => key));
  const targetOvr = baseOvr + paidBoostOvr;

  for (const [key, start, cap] of template.core) {
    attributeCaps[key] = cap;
    attributes[key] = Math.min(cap, Math.max(50, start + Math.round((baseOvr - 70) * 1.6) + paidBoostOvr));
  }

  // Normalize the total ceiling budget without flattening each position's
  // non-core strengths and weaknesses. Core ceilings remain exactly as shown.
  const nonCore = ATTRIBUTE_KEYS.filter((key) => !coreKeys.has(key));
  const styleOffsets: Partial<Record<Attribute, number>> = {};
  const bias = (key: Attribute, amount: number) => { styleOffsets[key] = (styleOffsets[key] || 0) + amount; };
  if (secondary === 'PG') { bias('passing', 3); bias('ballHandle', 2); bias('postMove', -2); }
  if (secondary === 'SG') { bias('midRange', 2); bias('threePoint', 2); bias('passing', -1); }
  if (secondary === 'SF') { bias('perimeterDef', 2); bias('rebounding', 2); bias('insideFinish', 1); }
  if (secondary === 'PF') { bias('rebounding', 3); bias('interiorDef', 2); bias('speed', -1); }
  if (secondary === 'C') { bias('block', 3); bias('strength', 2); bias('ballHandle', -2); }
  if (/投射|空间|狙击/.test(template.name)) { bias('freeThrow', 3); bias('stamina', 2); bias('postMove', -2); }
  if (/组织|策应/.test(template.name)) { bias('passing', 3); bias('ballHandle', 2); bias('dunk', -2); }
  if (/防守|投防|攻防/.test(template.name)) { bias('perimeterDef', 2); bias('interiorDef', 2); bias('steal', 1); }
  if (/冲击|突破|强攻|强力/.test(template.name)) { bias('layup', 2); bias('insideFinish', 2); bias('strength', 1); bias('threePoint', -2); }
  if (/机动|运动/.test(template.name)) { bias('speed', 2); bias('vertical', 2); bias('postMove', -2); }
  if (/技巧|技术|低位/.test(template.name)) { bias('postMove', 2); bias('midRange', 2); bias('speed', -2); }
  for (const key of nonCore) {
    const offset = styleOffsets[key] || 0;
    attributeCaps[key] = Math.max(60, Math.min(99, attributeCaps[key] + Math.round(offset / 2)));
    attributes[key] = Math.max(50, Math.min(attributeCaps[key], attributes[key] + offset));
  }
  let capDifference = 1500 - ATTRIBUTE_KEYS.reduce((sum, key) => sum + attributeCaps[key], 0);
  while (capDifference !== 0) {
    const step = Math.sign(capDifference);
    const key = nonCore.find((candidate) => step > 0 ? attributeCaps[candidate] < 99 : attributeCaps[candidate] > Math.max(60, attributes[candidate]));
    if (!key) break;
    attributeCaps[key] += step;
    capDifference -= step;
    nonCore.push(nonCore.shift()!);
  }

  // Keep the four signature starting values, distributing any OVR correction
  // only over the other 14 attributes. Higher-impact attributes are chosen
  // first, making each template land on the same life-simulation OVR.
  let currentOvr = calculate2KOvr(position, attributes);
  for (let attempt = 0; attempt < 600 && currentOvr !== targetOvr; attempt += 1) {
    const step = Math.sign(targetOvr - currentOvr);
    const candidates = nonCore
      .filter((key) => step > 0 ? attributes[key] < attributeCaps[key] : attributes[key] > 50)
      .map((key) => {
        const next = { ...attributes, [key]: attributes[key] + step };
        return { key, ovr: calculate2KOvr(position, next), gap: Math.abs(targetOvr - calculate2KOvr(position, next)) };
      })
      .sort((a, b) => a.gap - b.gap || (step > 0 ? b.ovr - a.ovr : a.ovr - b.ovr));
    const best = candidates[0];
    if (!best) break;
    attributes[best.key] += step;
    currentOvr = best.ovr;
  }

  return { attributes, attributeCaps, initialOvr: currentOvr, template };
}
