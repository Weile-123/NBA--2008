import { Team, RosterPlayer, PlayerProfile, Position, SingleGamePlayerStats, MatchRosterStats, MatchBoxScore, CategoryRatings } from '../types';
import { getPlayerTotalAttributes } from './calc2k';

/**
 * Extracts short team nickname (without city prefix)
 * e.g., "克利夫兰骑士" -> "骑士", "洛杉矶湖人" -> "湖人"
 */
export function getShortTeamName(fullName: string): string {
  if (!fullName) return '';
  const cleanName = fullName.trim().replace(/队$/, '');
  const knownNicknames = [
    '凯尔特人', '76人', '尼克斯', '篮网', '猛龙',
    '雄鹿', '公牛', '骑士', '步行者', '活塞',
    '热火', '老鹰', '黄蜂', '山猫', '奇才', '魔术',
    '掘金', '森林狼', '雷霆', '开拓者', '爵士',
    '勇士', '快船', '湖人', '太阳', '国王',
    '独行侠', '火箭', '灰熊', '鹈鹕', '马刺', '网', '超音速'
  ];
  // 1. 优先根据结尾匹配（避免 菲尼克斯太阳 匹配到 尼克斯）
  for (const nick of knownNicknames) {
    if (cleanName.endsWith(nick)) return nick;
  }
  // 2. 备用：按包含匹配（优先匹配更长的词）
  const sortedNicknames = [...knownNicknames].sort((a, b) => b.length - a.length);
  for (const nick of sortedNicknames) {
    if (cleanName.includes(nick)) return nick;
  }
  return cleanName;
}

/**
 * Calculates a team's dynamic Power Rating (战力评估) using comprehensive weighted formula:
 * - Starters (top 5 by OVR): 70% weight
 * - Bench (6th to 10th players by OVR): 30% weight
 * - Superstar presence bonus (OVR >= 95 / 90 / 86)
 */
export function calculateTeamPowerRating(team: Team): number {
  if (!team.roster || team.roster.length === 0) return team.rating || 75;

  const sorted = [...team.roster].sort((a, b) => b.ovr - a.ovr);
  const starters = sorted.slice(0, 5);
  const bench = sorted.slice(5, 10);

  const avgStarter = starters.reduce((acc, p) => acc + p.ovr, 0) / (starters.length || 1);
  const avgBench = bench.length > 0 ? bench.reduce((acc, p) => acc + p.ovr, 0) / bench.length : avgStarter - 8;

  // Superstar bonus calculations
  let starBonus = 0;
  const numSuperstars = sorted.filter((p) => p.ovr >= 95).length;
  const numStars = sorted.filter((p) => p.ovr >= 90 && p.ovr < 95).length;
  const numBorderline = sorted.filter((p) => p.ovr >= 86 && p.ovr < 90).length;

  if (numSuperstars > 0) starBonus += 3.0 + (numSuperstars - 1) * 1.0;
  if (numStars > 0) starBonus += 1.8 + (numStars - 1) * 0.6;
  if (numBorderline > 0) starBonus += 0.8;

  const rating = Math.round(avgStarter * 0.70 + avgBench * 0.30 + starBonus);
  return Math.max(65, Math.min(99, rating));
}

export interface TeamUsageContext {
  congestionFactor: number;
  starCongestionTier: 'mega_congested' | 'super_congested' | 'congested' | 'balanced' | 'solo_carry' | 'normal' | 'solo_95_pure';
  boostFactor: number;
  num95Plus: number;
  num90Plus: number;
  num85Plus: number;
}

/**
 * Calculates team usage congestion context:
 * - Mega Congested (4+ 90+ players OR 3+ 90+ with 2+ 95+): Extreme ball-share dilution (e.g. Warriors 4-stars).
 * - Super Congested (>=2 95+ or >=3 90+ players): Intense ball-share competition (e.g. Heat Big 3).
 * - Congested (2 90+ players or >=4 85+ players): Moderate sharing.
 * - Solo Carry (1 90+ player, 2nd best < 83 OVR, or 1 95+ player and 2nd best < 86): High usage and scoring boost for the lone superstar.
 * - Solo 95 Pure (1 95+ player and no other player >= 90): Unaffected by usage congestion/dilution; keeps exact base PPG mapping.
 * - Balanced/Normal: Standard distribution.
 */
export function calculateTeamUsageContext(
  teamRoster: { id?: string; name?: string; ovr: number; isUser?: boolean }[]
): TeamUsageContext {
  if (!teamRoster || teamRoster.length === 0) {
    return {
      congestionFactor: 1.0,
      starCongestionTier: 'normal',
      boostFactor: 1.0,
      num95Plus: 0,
      num90Plus: 0,
      num85Plus: 0,
    };
  }

  // Deduplicate user player entries if present multiple times in teamRoster
  const uniqueRoster: { ovr: number; isUser?: boolean }[] = [];
  let userSeen = false;
  for (const p of teamRoster) {
    if (p.isUser) {
      if (!userSeen) {
        uniqueRoster.push(p);
        userSeen = true;
      }
    } else {
      uniqueRoster.push(p);
    }
  }

  const sortedOvr = uniqueRoster.map((p) => p.ovr || 75).sort((a, b) => b - a);
  const num95Plus = sortedOvr.filter((ovr) => ovr >= 95).length;
  const num90Plus = sortedOvr.filter((ovr) => ovr >= 90).length;
  const num85Plus = sortedOvr.filter((ovr) => ovr >= 85).length;

  const top1Ovr = sortedOvr[0] || 75;
  const top2Ovr = sortedOvr[1] || 70;

  // 0. Solo 95 Pure: 仅有一个 95+ 球员，且其他球员没有一个到达 90 综评
  if (num95Plus === 1 && num90Plus === 1) {
    return {
      congestionFactor: 1.0,
      starCongestionTier: 'solo_95_pure',
      boostFactor: 1.0,
      num95Plus,
      num90Plus,
      num85Plus,
    };
  }

  // 1. Mega Congested (四巨头 / 极端拥挤): 4+ 90+ 巨星 OR (3+ 90+ 巨星 且 2+ 95+ 超级巨星)
  if (num90Plus >= 4 || (num95Plus >= 2 && num90Plus >= 3)) {
    return {
      congestionFactor: 0.65,
      starCongestionTier: 'mega_congested',
      boostFactor: 1.0,
      num95Plus,
      num90Plus,
      num85Plus,
    };
  }

  // 2. Super Congested (三巨头 / 多巨星组团): 3+ 90+ 巨星 OR 2+ 95+ 超级巨星
  if (num95Plus >= 2 || num90Plus >= 3) {
    return {
      congestionFactor: 0.74,
      starCongestionTier: 'super_congested',
      boostFactor: 1.0,
      num95Plus,
      num90Plus,
      num85Plus,
    };
  }

  // 3. Congested (双核球队 / 准多核): 2个 90+ 巨星 OR 4+ 85+ 全明星
  if (num90Plus === 2 || num85Plus >= 4) {
    return {
      congestionFactor: 0.84,
      starCongestionTier: 'congested',
      boostFactor: 1.0,
      num95Plus,
      num90Plus,
      num85Plus,
    };
  }

  // 4. Solo Carry in Weak / Moderate team: top player is high OVR (>=89) and second player is far behind
  if (top1Ovr >= 90 && (top2Ovr <= 82 || top1Ovr - top2Ovr >= 10)) {
    const gap = top1Ovr - top2Ovr;
    const gapBonus = Math.min(0.18, Math.max(0.04, gap * 0.012));
    const ovrBonus = top1Ovr >= 95 ? (top1Ovr - 94) * 0.02 : 0;
    const carryBoost = 1.05 + gapBonus + ovrBonus;
    return {
      congestionFactor: 1.0,
      starCongestionTier: 'solo_carry',
      boostFactor: +carryBoost.toFixed(2),
      num95Plus,
      num90Plus,
      num85Plus,
    };
  }

  return {
    congestionFactor: 1.0,
    starCongestionTier: 'normal',
    boostFactor: 1.0,
    num95Plus,
    num90Plus,
    num85Plus,
  };
}

/**
 * Adjusts a player's expected PPG based on team usage congestion:
 * - Mega Congested (4-stars): Super scorers (30-35 PPG) fall to 23.5-25.5 PPG.
 * - Super Congested (3-stars): Super scorers fall to 25.0-26.5 PPG.
 * - Congested (2-stars): Super scorers fall to 27.0-28.5 PPG.
 * - Solo carry superstar: receives usage boost on scoring.
 */
export function applyUsageCongestionToPpg(
  rawPpg: number,
  playerOvr: number,
  isTopPlayerOnTeam: boolean,
  teamContext: TeamUsageContext,
  isSingleGame: boolean = false
): number {
  if (teamContext.starCongestionTier === 'solo_95_pure') {
    return rawPpg;
  }

  // 1. Mega Congested (e.g. 4 All-Stars / Warriors 4-stars):
  // Superstars drop from 30-35 PPG down to 23.5-25.5 PPG
  if (teamContext.starCongestionTier === 'mega_congested') {
    if (rawPpg <= 12.0) {
      return rawPpg;
    }
    const basePts = 12.0;
    const bracket1 = Math.max(0, Math.min(6.0, rawPpg - 12.0)); // 12-18 bracket
    const bracket2 = Math.max(0, Math.min(8.0, rawPpg - 18.0)); // 18-26 bracket
    const bracket3 = Math.max(0, rawPpg - 26.0);                // 26+ bracket

    const adjustedPpg = basePts + bracket1 * 0.72 + bracket2 * 0.50 + bracket3 * 0.30;
    return +adjustedPpg.toFixed(1);
  }

  // 2. Super Congested (e.g. 3 All-Stars / Heat Big 3):
  // Superstars drop from 30-35 PPG down to 25.0-26.5 PPG
  if (teamContext.starCongestionTier === 'super_congested') {
    if (rawPpg <= 14.0) {
      return rawPpg;
    }
    const basePts = 14.0;
    const bracket1 = Math.max(0, Math.min(6.0, rawPpg - 14.0)); // 14-20 bracket
    const bracket2 = Math.max(0, Math.min(6.0, rawPpg - 20.0)); // 20-26 bracket
    const bracket3 = Math.max(0, rawPpg - 26.0);                // 26+ bracket

    const adjustedPpg = basePts + bracket1 * 0.78 + bracket2 * 0.58 + bracket3 * 0.35;
    return +adjustedPpg.toFixed(1);
  }

  // 3. Congested (e.g. 2 Stars / Dual-Core):
  // Superstars drop from 30-35 PPG down to 27.0-28.5 PPG
  if (teamContext.starCongestionTier === 'congested') {
    if (rawPpg <= 16.0) {
      return rawPpg;
    }
    const basePts = 16.0;
    const bracket1 = Math.max(0, Math.min(8.0, rawPpg - 16.0)); // 16-24 bracket
    const bracket2 = Math.max(0, rawPpg - 24.0);                // 24+ bracket

    const adjustedPpg = basePts + bracket1 * 0.82 + bracket2 * 0.45;
    return +adjustedPpg.toFixed(1);
  }

  if (teamContext.starCongestionTier === 'solo_carry' && isTopPlayerOnTeam && playerOvr >= 90) {
    const boostedPpg = rawPpg * teamContext.boostFactor;
    const maxCap = isSingleGame ? 75.0 : 40.0;
    return +Math.min(maxCap, boostedPpg).toFixed(1);
  }

  return rawPpg;
}

/**
 * Calculates win probability between Team A and Team B based on dynamic power ratings.
 */
export function calcWinProbability(ratingA: number, ratingB: number): number {
  const diff = ratingA - ratingB;
  const prob = 1 / (1 + Math.pow(10, -diff / 22));
  return Math.max(0.12, Math.min(0.88, prob));
}

/**
 * Calculates realistic per-36 minute target scoring based on user OVR / scoring attributes.
 * Optimized Professional Scale:
 * - 60 评分: 2.0 PPG (饮水机/发展联盟)
 * - 70 评分: 5.5 PPG (替补拼图)
 * - 80 评分: 12.0 PPG (合格首发/优质第六人)
 * - 85 评分: 17.5 PPG (球队二当家/准全明星)
 * - 90 评分: 22.5 PPG (全明星首发核心主攻手)
 * - 95 评分: 27.5 PPG (最佳一阵级终结者)
 * - 97 评分: 30.5 PPG (常规赛MVP有力争夺者)
 * - 98 评分: 32.5 PPG (常规赛得分王级火力)
 * - 99 评分: 35.0 PPG (历史级主攻火力)
 */
export function calculateExpectedPpg36(rating: number): number {
  if (rating <= 60) return 2.0;
  if (rating <= 70) return 2.0 + (rating - 60) * 0.35; // 60->2.0, 70->5.5
  if (rating <= 80) return 5.5 + (rating - 70) * 0.65; // 70->5.5, 80->12.0
  if (rating <= 85) return 12.0 + (rating - 80) * 1.10; // 80->12.0, 85->17.5
  if (rating <= 90) return 17.5 + (rating - 85) * 1.00; // 85->17.5, 90->22.5
  if (rating <= 95) return 22.5 + (rating - 90) * 1.00; // 90->22.5, 95->27.5
  if (rating <= 97) return 27.5 + (rating - 95) * 1.50; // 95->27.5, 97->30.5
  if (rating <= 98) return 30.5 + (rating - 97) * 2.00; // 97->30.5, 98->32.5
  return 32.5 + (rating - 98) * 2.50;                   // 98->32.5, 99->35.0
}

/**
 * Calculates realistic per-36 minute target rebounding based on rebounding, physical attributes and position.
 * Scale:
 * Center/Power Forward:
 *   - 60: ~5.0 RPG
 *   - 75: ~8.0 RPG
 *   - 85: ~10.5 RPG
 *   - 90: ~12.0 RPG
 *   - 95: ~13.5 RPG
 *   - 98-99: ~15.0-16.0 RPG (Rebounding champion level, e.g. Howard/Drummond peak)
 * Small Forward / Guard:
 *   - 60: ~2.5 - 3.5 RPG
 *   - 75: ~4.5 - 5.5 RPG
 *   - 85: ~6.5 - 7.5 RPG
 *   - 95: ~8.5 - 10.0 RPG (e.g. Westbrook / LeBron triple-double tier)
 *   - 99: ~10.5 - 11.5 RPG
 */
export function calculateExpectedRpg36(effectiveRebRating: number, position: Position = 'SF'): number {
  if (position === 'C' || position === 'PF') {
    if (effectiveRebRating <= 60) return 5.0;
    if (effectiveRebRating <= 75) return 5.0 + (effectiveRebRating - 60) * 0.20; // 60->5.0, 75->8.0
    if (effectiveRebRating <= 85) return 8.0 + (effectiveRebRating - 75) * 0.25; // 75->8.0, 85->10.5
    if (effectiveRebRating <= 92) return 10.5 + (effectiveRebRating - 85) * 0.28; // 85->10.5, 92->12.46
    if (effectiveRebRating <= 97) return 12.46 + (effectiveRebRating - 92) * 0.35; // 92->12.46, 97->14.21
    return 14.21 + (effectiveRebRating - 97) * 0.85; // 97->14.21, 99->15.91
  } else if (position === 'SF') {
    if (effectiveRebRating <= 60) return 3.2;
    if (effectiveRebRating <= 75) return 3.2 + (effectiveRebRating - 60) * 0.16; // 60->3.2, 75->5.6
    if (effectiveRebRating <= 85) return 5.6 + (effectiveRebRating - 75) * 0.20; // 75->5.6, 85->7.6
    if (effectiveRebRating <= 95) return 7.6 + (effectiveRebRating - 85) * 0.22; // 85->7.6, 95->9.8
    return 9.8 + (effectiveRebRating - 95) * 0.35; // 95->9.8, 99->11.2
  } else {
    // PG / SG
    if (effectiveRebRating <= 60) return 2.4;
    if (effectiveRebRating <= 75) return 2.4 + (effectiveRebRating - 60) * 0.14; // 60->2.4, 75->4.5
    if (effectiveRebRating <= 85) return 4.5 + (effectiveRebRating - 75) * 0.18; // 75->4.5, 85->6.3
    if (effectiveRebRating <= 95) return 6.3 + (effectiveRebRating - 85) * 0.24; // 85->6.3, 95->8.7
    return 8.7 + (effectiveRebRating - 95) * 0.40; // 95->8.7, 99->10.3
  }
}

/**
 * Signature profile archetype adjustments for iconic NBA stars to ensure true-to-life ratings
 * (e.g. Stephen Curry's historic scoring, Westbrook's triple-double rebounding, Harden/LeBron/Jokic playmaking, etc.)
 */
const SIGNATURE_STAR_PRESETS: Record<string, Partial<CategoryRatings>> = {
  // 斯蒂芬·库里: 历史顶级射手/得分王 (得分99, 组织92, 抢断84, 篮板74, 盖帽45)
  '斯蒂芬·库里': { scoringRating: 99, playmakingRating: 92, reboundRating: 74, stealRating: 84, blockRating: 46 },
  '库里': { scoringRating: 99, playmakingRating: 92, reboundRating: 74, stealRating: 84, blockRating: 46 },
  // 克莱·汤普森: 顶级3D分卫 (得分92, 组织75, 篮板68, 抢断84, 盖帽62)
  '克莱·汤普森': { scoringRating: 92, playmakingRating: 75, reboundRating: 68, stealRating: 84, blockRating: 62 },
  '汤普森': { scoringRating: 92, playmakingRating: 75, reboundRating: 68, stealRating: 84, blockRating: 62 },
  // 拉塞尔·威斯布鲁克: 三双王/暴力冲击控卫 (得分93, 组织95, 篮板88, 抢断88, 盖帽60)
  '拉塞尔·威斯布鲁克': { scoringRating: 93, playmakingRating: 95, reboundRating: 88, stealRating: 88, blockRating: 60 },
  '威斯布鲁克': { scoringRating: 93, playmakingRating: 95, reboundRating: 88, stealRating: 88, blockRating: 60 },
  '威少': { scoringRating: 93, playmakingRating: 95, reboundRating: 88, stealRating: 88, blockRating: 60 },
  // 勒布朗·詹姆斯: 攻防全能组织前锋 (得分97, 篮板90, 组织96, 抢断88, 盖帽84)
  '勒布朗·詹姆斯': { scoringRating: 97, reboundRating: 90, playmakingRating: 96, stealRating: 88, blockRating: 84 },
  '詹姆斯': { scoringRating: 97, reboundRating: 90, playmakingRating: 96, stealRating: 88, blockRating: 84 },
  // 科比·布莱恩特: 历史级得分后卫/黑曼巴 (得分98, 篮板78, 组织86, 抢断90, 盖帽66)
  '科比·布莱恩特': { scoringRating: 98, reboundRating: 78, playmakingRating: 86, stealRating: 90, blockRating: 66 },
  '科比': { scoringRating: 98, reboundRating: 78, playmakingRating: 86, stealRating: 90, blockRating: 66 },
  // 凯文·杜兰特: 死神/四届得分王 (得分98, 篮板86, 组织82, 抢断78, 盖帽85)
  '凯文·杜兰特': { scoringRating: 98, reboundRating: 86, playmakingRating: 82, stealRating: 78, blockRating: 85 },
  '杜兰特': { scoringRating: 98, reboundRating: 86, playmakingRating: 82, stealRating: 78, blockRating: 85 },
  // 詹姆斯·哈登: 双能卫/得分王+助攻王 (得分98, 组织96, 篮板82, 抢断86, 盖帽62)
  '詹姆斯·哈登': { scoringRating: 98, playmakingRating: 96, reboundRating: 82, stealRating: 86, blockRating: 62 },
  '哈登': { scoringRating: 98, playmakingRating: 96, reboundRating: 82, stealRating: 86, blockRating: 62 },
  // 德维恩·韦德: 闪电侠 (得分97, 组织88, 篮板75, 抢断92, 盖帽82)
  '德维恩·韦德': { scoringRating: 97, playmakingRating: 88, reboundRating: 75, stealRating: 92, blockRating: 82 },
  '韦德': { scoringRating: 97, playmakingRating: 88, reboundRating: 75, stealRating: 92, blockRating: 82 },
  // 德克·诺维茨基: 金鸡独立 (得分96, 篮板88, 组织76, 抢断65, 盖帽76)
  '德克·诺维茨基': { scoringRating: 96, reboundRating: 88, playmakingRating: 76, stealRating: 65, blockRating: 76 },
  '诺维茨基': { scoringRating: 96, reboundRating: 88, playmakingRating: 76, stealRating: 65, blockRating: 76 },
  // 德怀特·霍华德: 魔兽 (得分88, 篮板98, 组织60, 抢断74, 盖帽98)
  '德怀特·霍华德': { scoringRating: 88, reboundRating: 98, playmakingRating: 60, stealRating: 74, blockRating: 98 },
  '霍华德': { scoringRating: 88, reboundRating: 98, playmakingRating: 60, stealRating: 74, blockRating: 98 },
  // 克里斯·保罗: 控卫之神 (得分88, 组织98, 篮板68, 抢断96, 盖帽45)
  '克里斯·保罗': { scoringRating: 88, playmakingRating: 98, reboundRating: 68, stealRating: 96, blockRating: 45 },
  '保罗': { scoringRating: 88, playmakingRating: 98, reboundRating: 68, stealRating: 96, blockRating: 45 },
  // 史蒂夫·纳什: 风之子 (得分86, 组织98, 篮板60, 抢断72, 盖帽42)
  '史蒂夫·纳什': { scoringRating: 86, playmakingRating: 98, reboundRating: 60, stealRating: 72, blockRating: 42 },
  '纳什': { scoringRating: 86, playmakingRating: 98, reboundRating: 60, stealRating: 72, blockRating: 42 },
  // 凯文·加内特: 狼王狼蛛 (得分92, 篮板96, 组织84, 抢断86, 盖帽94)
  '凯文·加内特': { scoringRating: 92, reboundRating: 96, playmakingRating: 84, stealRating: 86, blockRating: 94 },
  '加内特': { scoringRating: 92, reboundRating: 96, playmakingRating: 84, stealRating: 86, blockRating: 94 },
  // 蒂姆·邓肯: 大基本功 (得分92, 篮板96, 组织80, 抢断72, 盖帽95)
  '蒂姆·邓肯': { scoringRating: 92, reboundRating: 96, playmakingRating: 80, stealRating: 72, blockRating: 95 },
  '邓肯': { scoringRating: 92, reboundRating: 96, playmakingRating: 80, stealRating: 72, blockRating: 95 },
  // 扬尼斯·阿德托昆博: 字母哥 (得分96, 篮板95, 组织86, 抢断84, 盖帽92)
  '扬尼斯·阿德托昆博': { scoringRating: 96, reboundRating: 95, playmakingRating: 86, stealRating: 84, blockRating: 92 },
  '阿德托昆博': { scoringRating: 96, reboundRating: 95, playmakingRating: 86, stealRating: 84, blockRating: 92 },
  // 尼古拉·约基奇: 约老师 (得分95, 篮板96, 组织98, 抢断82, 盖帽76)
  '尼古拉·约基奇': { scoringRating: 95, reboundRating: 96, playmakingRating: 98, stealRating: 82, blockRating: 76 },
  '约基奇': { scoringRating: 95, reboundRating: 96, playmakingRating: 98, stealRating: 82, blockRating: 76 },
  // 卢卡·东契奇: 卢卡魔术 (得分97, 篮板92, 组织97, 抢断82, 盖帽62)
  '卢卡·东契奇': { scoringRating: 97, reboundRating: 92, playmakingRating: 97, stealRating: 82, blockRating: 62 },
  '东契奇': { scoringRating: 97, reboundRating: 92, playmakingRating: 97, stealRating: 82, blockRating: 62 },
  // 德里克·罗斯: 风城玫瑰 (得分95, 组织88, 篮板65, 抢断82, 盖帽55)
  '德里克·罗斯': { scoringRating: 95, playmakingRating: 88, reboundRating: 65, stealRating: 82, blockRating: 55 },
  '罗斯': { scoringRating: 95, playmakingRating: 88, reboundRating: 65, stealRating: 82, blockRating: 55 },
  // 凯里·欧文: 德鲁大叔 (得分96, 组织88, 篮板64, 抢断82, 盖帽50)
  '凯里·欧文': { scoringRating: 96, playmakingRating: 88, reboundRating: 64, stealRating: 82, blockRating: 50 },
  '欧文': { scoringRating: 96, playmakingRating: 88, reboundRating: 64, stealRating: 82, blockRating: 50 },
  // 达米安·利拉德: 表哥 (得分96, 组织88, 篮板66, 抢断78, 盖帽46)
  '达米安·利拉德': { scoringRating: 96, playmakingRating: 88, reboundRating: 66, stealRating: 78, blockRating: 46 },
  '利拉德': { scoringRating: 96, playmakingRating: 88, reboundRating: 66, stealRating: 78, blockRating: 46 },
  // 乔尔·恩比德: 大帝 (得分97, 篮板94, 组织76, 抢断74, 盖帽94)
  '乔尔·恩比德': { scoringRating: 97, reboundRating: 94, playmakingRating: 76, stealRating: 74, blockRating: 94 },
  '恩比德': { scoringRating: 97, reboundRating: 94, playmakingRating: 76, stealRating: 74, blockRating: 94 },
  // 科怀·伦纳德: 卡哇伊 (得分94, 篮板85, 组织78, 抢断96, 盖帽80)
  '科怀·伦纳德': { scoringRating: 94, reboundRating: 85, playmakingRating: 78, stealRating: 96, blockRating: 80 },
  '伦纳德': { scoringRating: 94, reboundRating: 85, playmakingRating: 78, stealRating: 96, blockRating: 80 },
  // 吉米·巴特勒: 硬汉 (得分92, 篮板82, 组织84, 抢断92, 盖帽72)
  '吉米·巴特勒': { scoringRating: 92, reboundRating: 82, playmakingRating: 84, stealRating: 92, blockRating: 72 },
  '巴特勒': { scoringRating: 92, reboundRating: 82, playmakingRating: 84, stealRating: 92, blockRating: 72 },
  // 安东尼·戴维斯: 浓眉哥 (得分94, 篮板95, 组织75, 抢断84, 盖帽96)
  '安东尼·戴维斯': { scoringRating: 94, reboundRating: 95, playmakingRating: 75, stealRating: 84, blockRating: 96 },
  '戴维斯': { scoringRating: 94, reboundRating: 95, playmakingRating: 75, stealRating: 84, blockRating: 96 },
  // 姚明: 移动长城 (得分94, 篮板94, 组织74, 抢断55, 盖帽95)
  '姚明': { scoringRating: 94, reboundRating: 94, playmakingRating: 74, stealRating: 55, blockRating: 95 },
  // 特雷西·麦克格雷迪: 麦迪 (得分96, 组织88, 篮板78, 抢断86, 盖帽75)
  '特雷西·麦克格雷迪': { scoringRating: 96, playmakingRating: 88, reboundRating: 78, stealRating: 86, blockRating: 75 },
  '麦迪': { scoringRating: 96, playmakingRating: 88, reboundRating: 78, stealRating: 86, blockRating: 75 },
  // 阿伦·艾弗森: 答案 (得分97, 组织88, 篮板62, 抢断96, 盖帽45)
  '阿伦·艾弗森': { scoringRating: 97, playmakingRating: 88, reboundRating: 62, stealRating: 96, blockRating: 45 },
  '艾弗森': { scoringRating: 97, playmakingRating: 88, reboundRating: 62, stealRating: 96, blockRating: 45 },
  // 卡梅隆·安东尼: 甜瓜 (得分96, 篮板84, 组织76, 抢断75, 盖帽68)
  '卡梅隆·安东尼': { scoringRating: 96, reboundRating: 84, playmakingRating: 76, stealRating: 75, blockRating: 68 },
  '安东尼': { scoringRating: 96, reboundRating: 84, playmakingRating: 76, stealRating: 75, blockRating: 68 },
  // 保罗·皮尔斯: 真理 (得分93, 篮板80, 组织82, 抢断80, 盖帽65)
  '保罗·皮尔斯': { scoringRating: 93, reboundRating: 80, playmakingRating: 82, stealRating: 80, blockRating: 65 },
  // 雷·阿伦: 君子雷 (得分93, 篮板68, 组织78, 抢断78, 盖帽50)
  '雷·阿伦': { scoringRating: 93, reboundRating: 68, playmakingRating: 78, stealRating: 78, blockRating: 50 },
  // 托尼·帕克: 法国小跑车 (得分91, 组织90, 篮板58, 抢断78, 盖帽42)
  '托尼·帕克': { scoringRating: 91, playmakingRating: 90, reboundRating: 58, stealRating: 78, blockRating: 42 },
  // 马努·吉诺比利: 妖刀 (得分91, 组织88, 篮板70, 抢断88, 盖帽58)
  '马努·吉诺比利': { scoringRating: 91, playmakingRating: 88, reboundRating: 70, stealRating: 88, blockRating: 58 },
  // 昌西·比卢普斯: 关键先生 (得分89, 组织92, 篮板64, 抢断82, 盖帽48)
  '昌西·比卢普斯': { scoringRating: 89, playmakingRating: 92, reboundRating: 64, stealRating: 82, blockRating: 48 },
  // 德隆·威廉姆斯: 吃饭睡觉打保罗 (得分91, 组织93, 篮板68, 抢断82, 盖帽52)
  '德隆·威廉姆斯': { scoringRating: 91, playmakingRating: 93, reboundRating: 68, stealRating: 82, blockRating: 52 },
  // 布兰登·罗伊: 黄曼巴 (得分94, 组织86, 篮板75, 抢断82, 盖帽60)
  '布兰登·罗伊': { scoringRating: 94, playmakingRating: 86, reboundRating: 75, stealRating: 82, blockRating: 60 },
  // 鲁迪·戈贝尔: 法国高塔 (得分78, 篮板97, 组织55, 抢断65, 盖帽98)
  '鲁迪·戈贝尔': { scoringRating: 78, reboundRating: 97, playmakingRating: 55, stealRating: 65, blockRating: 98 },
  // 多曼塔斯·萨博尼斯: 三双机器 (得分88, 篮板95, 组织92, 抢断74, 盖帽70)
  '多曼塔斯·萨博尼斯': { scoringRating: 88, reboundRating: 95, playmakingRating: 92, stealRating: 74, blockRating: 70 },
  // 杰森·塔图姆: 绿军领袖 (得分95, 篮板88, 组织84, 抢断82, 盖帽78)
  '杰森·塔图姆': { scoringRating: 95, reboundRating: 88, playmakingRating: 84, stealRating: 82, blockRating: 78 },
  // 维克托·文班亚马: 外星人 (得分90, 篮板94, 组织80, 抢断84, 盖帽99)
  '维克托·文班亚马': { scoringRating: 90, reboundRating: 94, playmakingRating: 80, stealRating: 84, blockRating: 99 },
  // 谢伊·吉尔杰斯-亚历山大: SGA (得分96, 组织88, 篮板78, 抢断92, 盖帽80)
  '谢伊·吉尔杰斯-亚历山大': { scoringRating: 96, playmakingRating: 88, reboundRating: 78, stealRating: 92, blockRating: 80 },
  // 安东尼·爱德华兹: 华子 (得分95, 组织82, 篮板80, 抢断86, 盖帽75)
  '安东尼·爱德华兹': { scoringRating: 95, playmakingRating: 82, reboundRating: 80, stealRating: 86, blockRating: 75 },
};

/**
 * Helper to get or derive all category ratings (scoring, rebound, playmaking, steal, block) for any player.
 * If not explicitly provided, it intelligently derives realistic values based on player's position, archetype, and OVR.
 */
export function getPlayerCategoryRatings(p: {
  id?: string;
  name?: string;
  ovr: number;
  position: Position;
  age?: number;
  peakAge?: number;
  peakOvr?: number;
  peakDuration?: number;
  scoringRating?: number;
  reboundRating?: number;
  playmakingRating?: number;
  stealRating?: number;
  blockRating?: number;
  categoryRatings?: CategoryRatings;
}, seasonIndex: number = 0): Required<CategoryRatings> {
  const explicit = p.categoryRatings || {};
  const baseOvr = p.ovr || 70;

  // Check if player matches a signature star preset
  let signatureMatch: Partial<CategoryRatings> | undefined;
  if (p.name) {
    const trimmedName = p.name.trim();
    if (SIGNATURE_STAR_PRESETS[trimmedName]) {
      signatureMatch = SIGNATURE_STAR_PRESETS[trimmedName];
    } else {
      for (const [key, preset] of Object.entries(SIGNATURE_STAR_PRESETS)) {
        if (trimmedName.includes(key) || key.includes(trimmedName)) {
          signatureMatch = preset;
          break;
        }
      }
    }
  }

  // Generate deterministic personality/archetype offsets based on player name & ID
  let pHash = 0;
  const pKey = (p.name || '') + (p.id || '') + p.position;
  for (let i = 0; i < pKey.length; i++) {
    pHash = (pHash << 5) - pHash + pKey.charCodeAt(i);
  }
  const traitSeed = Math.abs(pHash);
  
  // Style shifts (-6 to +6)
  const shift1 = ((traitSeed % 13) - 6);
  const shift2 = (((Math.floor(traitSeed / 13)) % 13) - 6);
  const shift3 = (((Math.floor(traitSeed / 169)) % 13) - 6);

  // 1. 得分综评 (scoringRating)
  let scoring = p.scoringRating || explicit.scoringRating || signatureMatch?.scoringRating;
  if (scoring === undefined) {
    if (p.position === 'SG') scoring = baseOvr + 4 + (shift1 > 0 ? 3 : -1);
    else if (p.position === 'SF') scoring = baseOvr + 2 + (shift1 > 0 ? 2 : -2);
    else if (p.position === 'PG') scoring = baseOvr - 2 + (shift1 > 2 ? 3 : -3);
    else if (p.position === 'PF') scoring = baseOvr - 3 + (shift1 > 0 ? 2 : -3);
    else scoring = baseOvr - 6 + (shift1 > 2 ? 2 : -4); // C
  }

  // 2. 篮板综评 (reboundRating)
  let rebound = p.reboundRating || explicit.reboundRating || signatureMatch?.reboundRating;
  if (rebound === undefined) {
    if (p.position === 'C') rebound = baseOvr + 6 + (shift2 > 0 ? 3 : 0);
    else if (p.position === 'PF') rebound = baseOvr + 4 + (shift2 > 0 ? 2 : -1);
    else if (p.position === 'SF') rebound = baseOvr - 4 + (shift2 > 1 ? 3 : -3);
    else if (p.position === 'SG') rebound = baseOvr - 12 + (shift2 > 0 ? 2 : -2);
    else rebound = baseOvr - 16 + (shift2 > 0 ? 2 : -3); // PG
  }

  // 3. 助攻/组织综评 (playmakingRating)
  let playmaking = p.playmakingRating || explicit.playmakingRating || signatureMatch?.playmakingRating;
  if (playmaking === undefined) {
    if (p.position === 'PG') playmaking = baseOvr + 7 + (shift3 > 0 ? 3 : 0);
    else if (p.position === 'SG') playmaking = baseOvr - 3 + (shift3 > 1 ? 3 : -3);
    else if (p.position === 'SF') playmaking = baseOvr - 6 + (shift3 > 2 ? 3 : -3);
    else if (p.position === 'PF') playmaking = baseOvr - 14 + (shift3 > 2 ? 2 : -2);
    else playmaking = baseOvr - 18 + (shift3 > 0 ? 2 : -3); // C
  }

  // 4. 抢断综评 (stealRating)
  let steal = p.stealRating || explicit.stealRating || signatureMatch?.stealRating;
  if (steal === undefined) {
    if (p.position === 'PG') steal = baseOvr + 2 + (shift1 > 1 ? 3 : -2);
    else if (p.position === 'SG') steal = baseOvr + 1 + (shift2 > 1 ? 3 : -2);
    else if (p.position === 'SF') steal = baseOvr - 2 + (shift1 > 0 ? 2 : -2);
    else if (p.position === 'PF') steal = baseOvr - 10 + (shift2 > 0 ? 2 : -3);
    else steal = baseOvr - 15 + (shift3 > 0 ? 2 : -3); // C
  }

  // 5. 盖帽综评 (blockRating)
  let block = p.blockRating || explicit.blockRating || signatureMatch?.blockRating;
  if (block === undefined) {
    if (p.position === 'C') block = baseOvr + 7 + (shift1 > 0 ? 3 : 0);
    else if (p.position === 'PF') block = baseOvr + 4 + (shift3 > 0 ? 3 : -1);
    else if (p.position === 'SF') block = baseOvr - 8 + (shift2 > 1 ? 3 : -3);
    else if (p.position === 'SG') block = baseOvr - 16 + (shift1 > 2 ? 2 : -2);
    else block = baseOvr - 20 + (shift2 > 0 ? 2 : -3); // PG
  }

  // Scale signature values with overall rating if player develops or regresses across years
  if (signatureMatch) {
    const peakOvr = p.peakOvr || 90.0;
    const currentOvr = p.ovr || baseOvr;
    const ovrRatio = currentOvr / peakOvr;
    const scaledRatio = Math.max(0.65, Math.min(1.10, ovrRatio));
    scoring = Math.round(scoring * scaledRatio);
    rebound = Math.round(rebound * scaledRatio);
    playmaking = Math.round(playmaking * scaledRatio);
    steal = Math.round(steal * scaledRatio);
    block = Math.round(block * scaledRatio);
  }

  return {
    scoringRating: Math.max(45, Math.min(99, Math.round(scoring))),
    reboundRating: Math.max(45, Math.min(99, Math.round(rebound))),
    playmakingRating: Math.max(45, Math.min(99, Math.round(playmaking))),
    stealRating: Math.max(45, Math.min(99, Math.round(steal))),
    blockRating: Math.max(45, Math.min(99, Math.round(block))),
  };
}

/**
 * Helper to compute high-precision 5-dimensional category ratings for the USER player
 * based on the user's detailed 18-attribute profile and endorsements/shoes/assets.
 */
export function getUserPlayerCategoryRatings(player: PlayerProfile): Required<CategoryRatings> {
  const attrs = getPlayerTotalAttributes(player);
  
  // 1. Scoring: 7 scoring weapons
  const midRangeAttr = attrs.midRange || 60;
  const threePointAttr = attrs.threePoint || 60;
  const layupAttr = attrs.layup || 60;
  const dunkAttr = attrs.dunk || 60;
  const insideFinishAttr = attrs.insideFinish || 60;
  const postMoveAttr = attrs.postMove || 60;
  const freeThrowAttr = attrs.freeThrow || 60;

  const scoringSeven = [
    midRangeAttr,
    threePointAttr,
    layupAttr,
    dunkAttr,
    insideFinishAttr,
    postMoveAttr,
    freeThrowAttr,
  ];
  const allSevenAvg = scoringSeven.reduce((a, b) => a + b, 0) / 7;
  const sortedWeapons = [...scoringSeven].sort((a, b) => b - a);
  const primaryWeaponsAvg = sortedWeapons[0] * 0.45 + sortedWeapons[1] * 0.35 + sortedWeapons[2] * 0.20;
  const rawScoringRating = primaryWeaponsAvg * 0.80 + allSevenAvg * 0.20;
  const playerOvr = player.ovr || 60;
  const scoringRating = Math.max(playerOvr, rawScoringRating);

  // 2. Rebound
  const rebAttr = attrs.rebounding || 60;
  const vertAttr = attrs.vertical || 60;
  const strAttr = attrs.strength || 60;
  const reboundRating = rebAttr * 0.75 + vertAttr * 0.15 + strAttr * 0.10;

  // 3. Playmaking
  const passAttr = attrs.passing || 60;
  const handleAttr = attrs.ballHandle || 60;
  const playmakingRating = passAttr * 0.80 + handleAttr * 0.20;

  // 4. Steal
  const stealAttr = attrs.steal || 60;
  const perimDefAttr = attrs.perimeterDef || 60;
  const speedAttr = attrs.speed || 60;
  const stealRating = stealAttr * 0.75 + perimDefAttr * 0.15 + speedAttr * 0.10;

  // 5. Block
  const blockAttr = attrs.block || 60;
  const intDefAttr = attrs.interiorDef || 60;
  const blockRating = blockAttr * 0.70 + intDefAttr * 0.15 + vertAttr * 0.15;

  return {
    scoringRating: Math.max(40, Math.min(99, Math.round(scoringRating))),
    reboundRating: Math.max(40, Math.min(99, Math.round(reboundRating))),
    playmakingRating: Math.max(40, Math.min(99, Math.round(playmakingRating))),
    stealRating: Math.max(40, Math.min(99, Math.round(stealRating))),
    blockRating: Math.max(40, Math.min(99, Math.round(blockRating))),
  };
}

/**
 * Calculates realistic per-36 minute target assists based on passing & ball-handling attributes and position.
 * Scale:
 * PG (Point Guard):
 *   - 60: ~3.5 APG
 *   - 75: ~5.8 APG
 *   - 85: ~8.2 APG
 *   - 92: ~10.0 APG
 *   - 97: ~11.5 APG (Assists leader / Chris Paul, Nash, Rondo tier)
 *   - 99: ~12.5 APG (Historical elite playmaker peak, e.g. Stockton)
 * SG / SF (Wing Playmakers):
 *   - 60: ~1.8 APG
 *   - 75: ~3.5 APG
 *   - 85: ~5.2 APG
 *   - 95: ~7.5 APG (LeBron / Harden / Kobe point-forward tier)
 *   - 99: ~9.2 APG
 * PF / C (Big Man Playmakers):
 *   - 60: ~1.0 APG
 *   - 75: ~2.2 APG
 *   - 85: ~3.8 APG
 *   - 95: ~6.5 APG (Jokic / Sabonis playmaking bigs)
 *   - 99: ~8.5 APG
 */
export function calculateExpectedApg36(effectivePlaymakingRating: number, position: Position = 'PG'): number {
  if (position === 'PG') {
    if (effectivePlaymakingRating <= 60) return 3.5;
    if (effectivePlaymakingRating <= 75) return 3.5 + (effectivePlaymakingRating - 60) * 0.153; // 60->3.5, 75->5.8
    if (effectivePlaymakingRating <= 85) return 5.8 + (effectivePlaymakingRating - 75) * 0.24; // 75->5.8, 85->8.2
    if (effectivePlaymakingRating <= 92) return 8.2 + (effectivePlaymakingRating - 85) * 0.26; // 85->8.2, 92->10.0
    if (effectivePlaymakingRating <= 97) return 10.0 + (effectivePlaymakingRating - 92) * 0.30; // 92->10.0, 97->11.5
    return 11.5 + (effectivePlaymakingRating - 97) * 0.50; // 97->11.5, 99->12.5
  } else if (position === 'SG' || position === 'SF') {
    if (effectivePlaymakingRating <= 60) return 1.8;
    if (effectivePlaymakingRating <= 75) return 1.8 + (effectivePlaymakingRating - 60) * 0.113; // 60->1.8, 75->3.5
    if (effectivePlaymakingRating <= 85) return 3.5 + (effectivePlaymakingRating - 75) * 0.17; // 75->3.5, 85->5.2
    if (effectivePlaymakingRating <= 95) return 5.2 + (effectivePlaymakingRating - 85) * 0.23; // 85->5.2, 95->7.5
    return 7.5 + (effectivePlaymakingRating - 95) * 0.425; // 95->7.5, 99->9.2
  } else {
    // PF / C
    if (effectivePlaymakingRating <= 60) return 1.0;
    if (effectivePlaymakingRating <= 75) return 1.0 + (effectivePlaymakingRating - 60) * 0.08; // 60->1.0, 75->2.2
    if (effectivePlaymakingRating <= 85) return 2.2 + (effectivePlaymakingRating - 75) * 0.16; // 75->2.2, 85->3.8
    if (effectivePlaymakingRating <= 95) return 3.8 + (effectivePlaymakingRating - 85) * 0.27; // 85->3.8, 95->6.5
    return 6.5 + (effectivePlaymakingRating - 95) * 0.50; // 95->6.5, 99->8.5
  }
}

/**
 * Calculates realistic per-36 minute target steals based on steal, perimeter defense, speed and position.
 * Scale:
 *   - 60: ~0.6 SPG
 *   - 75: ~1.1 SPG
 *   - 85: ~1.6 SPG
 *   - 92: ~2.1 SPG
 *   - 97: ~2.5 SPG (Steals leader / CP3, Rondo, Tony Allen tier)
 *   - 99: ~2.8 SPG (All-time defensive lockdown peak)
 */
export function calculateExpectedSpg36(effectiveStealRating: number, position: Position = 'PG'): number {
  const posModifier = (position === 'PG' || position === 'SG') ? 1.0 : (position === 'SF' ? 0.92 : 0.78);
  let baseSpg = 0.6;
  if (effectiveStealRating <= 60) baseSpg = 0.6;
  else if (effectiveStealRating <= 75) baseSpg = 0.6 + (effectiveStealRating - 60) * 0.033; // 60->0.6, 75->1.1
  else if (effectiveStealRating <= 85) baseSpg = 1.1 + (effectiveStealRating - 75) * 0.050; // 75->1.1, 85->1.6
  else if (effectiveStealRating <= 92) baseSpg = 1.6 + (effectiveStealRating - 85) * 0.071; // 85->1.6, 92->2.1
  else if (effectiveStealRating <= 97) baseSpg = 2.1 + (effectiveStealRating - 92) * 0.080; // 92->2.1, 97->2.5
  else baseSpg = 2.5 + (effectiveStealRating - 97) * 0.15; // 97->2.5, 99->2.8

  return +(baseSpg * posModifier).toFixed(2);
}

/**
 * Calculates realistic per-36 minute target blocks based on block, interior defense, vertical and position.
 * Scale:
 * C / PF:
 *   - 60: ~0.7 BPG
 *   - 75: ~1.3 BPG
 *   - 85: ~2.0 BPG
 *   - 92: ~2.6 BPG
 *   - 97: ~3.1 BPG (Blocks leader / Howard, Ibaka, Camby tier)
 *   - 99: ~3.6 BPG (Historic rim protection peak)
 * SF / SG / PG:
 *   - 60: ~0.2 BPG
 *   - 75: ~0.4 BPG
 *   - 85: ~0.8 BPG
 *   - 95: ~1.3 BPG (Elite chase-down / LeBron, Wade, Jordan tier)
 *   - 99: ~1.6 BPG
 */
export function calculateExpectedBpg36(effectiveBlockRating: number, position: Position = 'C'): number {
  if (position === 'C' || position === 'PF') {
    if (effectiveBlockRating <= 60) return 0.7;
    if (effectiveBlockRating <= 75) return 0.7 + (effectiveBlockRating - 60) * 0.040; // 60->0.7, 75->1.3
    if (effectiveBlockRating <= 85) return 1.3 + (effectiveBlockRating - 75) * 0.070; // 75->1.3, 85->2.0
    if (effectiveBlockRating <= 92) return 2.0 + (effectiveBlockRating - 85) * 0.085; // 85->2.0, 92->2.6
    if (effectiveBlockRating <= 97) return 2.6 + (effectiveBlockRating - 92) * 0.100; // 92->2.6, 97->3.1
    return 3.1 + (effectiveBlockRating - 97) * 0.25; // 97->3.1, 99->3.6
  } else {
    // Guards & Wings
    const wingFactor = position === 'SF' ? 1.0 : (position === 'SG' ? 0.85 : 0.65);
    let baseBpg = 0.2;
    if (effectiveBlockRating <= 60) baseBpg = 0.2;
    else if (effectiveBlockRating <= 75) baseBpg = 0.2 + (effectiveBlockRating - 60) * 0.013; // 60->0.2, 75->0.4
    else if (effectiveBlockRating <= 85) baseBpg = 0.4 + (effectiveBlockRating - 75) * 0.040; // 75->0.4, 85->0.8
    else if (effectiveBlockRating <= 95) baseBpg = 0.8 + (effectiveBlockRating - 85) * 0.050; // 85->0.8, 95->1.3
    else baseBpg = 1.3 + (effectiveBlockRating - 95) * 0.075; // 95->1.3, 99->1.6

    return +(baseBpg * wingFactor).toFixed(2);
  }
}

/**
 * Calculates complete 12-man roster for a team (including user player if assigned to this team)
 * based on positional ranking and player performance comparison.
 */
export function getCompleteTeamRoster(
  team: Team,
  userPlayer?: PlayerProfile | null,
  seasonIndex: number = 1
): { roster: (RosterPlayer & { isUser?: boolean })[]; userMinutes: number; userRole: string } {
  const isUserTeam = userPlayer && userPlayer.currentTeamId === team.id;

  if (!isUserTeam || !userPlayer) {
    const rawRoster = [...team.roster]
      .filter((p) => !(userPlayer && (p.id === userPlayer.id || p.name === userPlayer.name || (p as any).isUser)))
      .sort((a, b) => b.ovr - a.ovr)
      .slice(0, 15);
    
    // Calculate team usage congestion context
    const teamUsageContext = calculateTeamUsageContext(rawRoster);

    const enriched = rawRoster.map((p, idx) => {
      const item = enrichRosterPlayer(p, idx, seasonIndex, teamUsageContext);
      let roleTag: '战术核心' | '绝对首发' | '第六人' | '轮换替补' | '饮水机守门员' = '饮水机守门员';
      let mins = 8.0;
      if (idx === 0) { roleTag = '战术核心'; mins = 35.0; }
      else if (idx < 5) { roleTag = '绝对首发'; mins = 30.0; }
      else if (idx === 5) { roleTag = '第六人'; mins = 24.0; }
      else if (idx < 10) { roleTag = '轮换替补'; mins = 16.0; }
      else { roleTag = '饮水机守门员'; mins = 6.0; }
      return {
        ...item,
        age: p.age,
        peakAge: p.peakAge,
        peakOvr: p.peakOvr,
        peakDuration: p.peakDuration,
        minutes: mins,
        role: roleTag,
      };
    });

    return { roster: enriched, userMinutes: 0, userRole: '' };
  }

  // --- USER IS ON THIS TEAM ---
  const nonUserTeammates = team.roster.filter(
    (p) => !(p.id === userPlayer.id || p.name === userPlayer.name || (p as any).isUser)
  );
  const sortedTeammates = [...nonUserTeammates].sort((a, b) => b.ovr - a.ovr);
  
  // Calculate team usage congestion context with user player included
  const combinedTeamRosterForContext = [
    ...sortedTeammates.map((p) => ({ ovr: p.ovr, isUser: false })),
    { ovr: userPlayer.ovr, isUser: true },
  ];
  const userTeamUsageContext = calculateTeamUsageContext(combinedTeamRosterForContext);

  const teammates = sortedTeammates.slice(0, 14).map((p, idx) => {
    const enriched = enrichRosterPlayer(p, idx, seasonIndex, userTeamUsageContext);
    return {
      id: p.id,
      name: p.name,
      position: (p.position || 'PG') as Position,
      ovr: p.ovr,
      age: p.age,
      peakAge: p.peakAge,
      peakOvr: p.peakOvr,
      peakDuration: p.peakDuration,
      isStar: p.isStar,
      isUser: false,
      score: p.ovr,
      stats: enriched.stats,
    };
  });

  // Calculate user player stats & performance score
  const userGames = userPlayer.seasonStats?.games || 0;
  const userPpg = userGames > 0 ? +(userPlayer.seasonStats.pts / userGames).toFixed(1) : 0;
  const userRpg = userGames > 0 ? +(userPlayer.seasonStats.reb / userGames).toFixed(1) : 0;
  const userApg = userGames > 0 ? +(userPlayer.seasonStats.ast / userGames).toFixed(1) : 0;
  const userSpg = userGames > 0 ? +(userPlayer.seasonStats.stl / userGames).toFixed(1) : 0;
  const userBpg = userGames > 0 ? +(userPlayer.seasonStats.blk / userGames).toFixed(1) : 0;

  const userStatScore = userPpg * 1.2 + userRpg * 0.8 + userApg * 0.8 + userSpg * 1.0 + userBpg * 1.0;
  let userScore = userPlayer.ovr;
  if (userGames > 0) {
    // Expected stat score for player's current OVR rating
    const expectedStatScore = (userPlayer.ovr - 50) * 0.5;
    const diff = userStatScore - expectedStatScore;
    // Performance modifier bounded between -8 and +10
    const performanceMod = Math.max(-8, Math.min(10, diff * 0.5));
    userScore = userPlayer.ovr + performanceMod;
  }

  // Find position starters among teammates
  const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];
  const starterIds = new Set<string>();
  const teammateStartersMap: { [key in Position]?: typeof teammates[0] } = {};

  positions.forEach((pos) => {
    const candidatesAtPos = teammates.filter((t) => t.position === pos).sort((a, b) => b.score - a.score);
    if (candidatesAtPos.length > 0) {
      starterIds.add(candidatesAtPos[0].id);
      teammateStartersMap[pos] = candidatesAtPos[0];
    }
  });

  // Fill starters to 5 if needed
  if (starterIds.size < 5) {
    const sortedAll = [...teammates].sort((a, b) => b.score - a.score);
    for (const t of sortedAll) {
      if (starterIds.size >= 5) break;
      if (!starterIds.has(t.id)) {
        starterIds.add(t.id);
      }
    }
  }

  const starterTeammates = teammates.filter((t) => starterIds.has(t.id)).sort((a, b) => b.score - a.score);
  const benchTeammates = teammates.filter((t) => !starterIds.has(t.id)).sort((a, b) => b.score - a.score);

  const teammateSixthMan = benchTeammates.length > 0 ? benchTeammates[0] : null;

  // Starter at user's position
  const posStarter = teammateStartersMap[userPlayer.position] || starterTeammates[0];

  // Determine user role and minutes
  let userRole: '战术核心' | '绝对首发' | '第六人' | '轮换替补' | '饮水机守门员' = '饮水机守门员';
  let userMinutes = 8.0;

  if (userPlayer.ovr < 70) {
    userRole = '饮水机守门员';
    userMinutes = 8.0;
  } else if (userPlayer.ovr < 74) {
    userRole = '轮换替补';
    userMinutes = 12.0;
  } else {
    // userPlayer.ovr >= 74
    // Must qualify for Sixth Man benchmark first
    const qualifiesForSixthMan = teammateSixthMan ? (userScore >= teammateSixthMan.score) : true;

    if (!qualifiesForSixthMan) {
      userRole = '轮换替补';
      userMinutes = 16.0;
    } else {
      // Qualified for Sixth Man! Check if player ALSO qualifies for Starter
      const qualifiesForStarter = posStarter ? (userScore >= posStarter.score && userPlayer.ovr >= 78) : true;

      if (!qualifiesForStarter) {
        userRole = '第六人';
        userMinutes = 24.0;
      } else {
        // Promoted to Starter!
        // Check 成为战术核心条件: 1.位于绝对首发, 2.场均数据队内前3, 3.球员总评到达90
        const effectiveUserPpg = userGames > 0 ? userPpg : calculateExpectedPpg36(userPlayer.ovr) * (30 / 36);
        const teamPpgs = teammates.map((t) => t.stats?.ppg || 0);
        const sortedTeamPpgs = [...teamPpgs, effectiveUserPpg].sort((a, b) => b - a);
        const isTop3InStats = effectiveUserPpg >= (sortedTeamPpgs[2] || 0);

        const qualifiesForTacticalCore = userPlayer.ovr >= 90 && isTop3InStats;

        if (qualifiesForTacticalCore) {
          userRole = '战术核心';
          userMinutes = userTeamUsageContext.starCongestionTier === 'solo_carry' ? 37.5 : (userTeamUsageContext.starCongestionTier === 'solo_95_pure' ? 36.0 : 35.5);
        } else {
          userRole = '绝对首发';
          userMinutes = 30.0;
        }
      }
    }
  }

  // Adjust teammate demotions based on user role
  const demotedToSixthManId = (userRole === '绝对首发' || userRole === '战术核心') && posStarter ? posStarter.id : null;
  const demotedToRotationId = (userRole === '第六人' || demotedToSixthManId) && teammateSixthMan ? teammateSixthMan.id : null;

  const rosterMapped = teammates.map((t) => {
    let roleTag: '战术核心' | '绝对首发' | '第六人' | '轮换替补' | '饮水机守门员' = '饮水机守门员';
    let assignedMins = 8.0;

    if (t.id === demotedToSixthManId) {
      roleTag = '第六人';
      assignedMins = 24.0;
    } else if (t.id === demotedToRotationId) {
      roleTag = '轮换替补';
      assignedMins = 16.0;
    } else if (starterIds.has(t.id)) {
      if (t.isStar && t.ovr >= 82) {
        roleTag = '战术核心';
        assignedMins = 35.0;
      } else {
        roleTag = '绝对首发';
        assignedMins = 30.0;
      }
    } else if (t.id === teammateSixthMan?.id) {
      roleTag = '第六人';
      assignedMins = 24.0;
    } else if (benchTeammates.slice(1, 4).some((b) => b.id === t.id)) {
      roleTag = '轮换替补';
      assignedMins = 16.0;
    } else {
      roleTag = '饮水机守门员';
      assignedMins = 8.0;
    }

    const reEnriched = enrichRosterPlayer({ ...t, minutes: assignedMins, role: roleTag }, 0, seasonIndex, userTeamUsageContext);

    return {
      id: t.id,
      name: t.name,
      position: t.position,
      ovr: t.ovr,
      scoringRating: reEnriched.scoringRating,
      reboundRating: reEnriched.reboundRating,
      playmakingRating: reEnriched.playmakingRating,
      stealRating: reEnriched.stealRating,
      blockRating: reEnriched.blockRating,
      categoryRatings: reEnriched.categoryRatings,
      age: t.age,
      peakAge: t.peakAge,
      peakOvr: t.peakOvr,
      peakDuration: t.peakDuration,
      minutes: assignedMins,
      role: roleTag,
      isUser: false,
      stats: reEnriched.stats,
    };
  });

  // Calculate expected user stats when games === 0 (adjusted for team congestion)
  const userCatRatings = getUserPlayerCategoryRatings(userPlayer);
  const userTimeFactor = userMinutes / 36.0;
  const rawExpUserPpg = +(calculateExpectedPpg36(userCatRatings.scoringRating) * userTimeFactor).toFixed(1);
  const isUserTopScorer = userRole === '战术核心' || userPlayer.ovr >= (sortedTeammates[0]?.ovr || 0);
  const expUserPpg = applyUsageCongestionToPpg(rawExpUserPpg, userPlayer.ovr, isUserTopScorer, userTeamUsageContext);

  const expUserRpg = +(calculateExpectedRpg36(userCatRatings.reboundRating, userPlayer.position) * userTimeFactor).toFixed(1);
  let expUserApg = +(calculateExpectedApg36(userCatRatings.playmakingRating, userPlayer.position) * userTimeFactor).toFixed(1);
  if (userTeamUsageContext.starCongestionTier === 'super_congested' || userTeamUsageContext.starCongestionTier === 'mega_congested') {
    expUserApg = +(expUserApg + 0.6).toFixed(1);
  }
  const expUserSpg = +(calculateExpectedSpg36(userCatRatings.stealRating, userPlayer.position) * userTimeFactor).toFixed(1);
  const expUserBpg = +(calculateExpectedBpg36(userCatRatings.blockRating, userPlayer.position) * userTimeFactor).toFixed(1);
  let expUserFgPct = +(Math.min(62.0, Math.max(38.0, 42.0 + (userCatRatings.scoringRating - 65) * 0.35))).toFixed(1);
  if (userTeamUsageContext.starCongestionTier === 'super_congested' || userTeamUsageContext.starCongestionTier === 'mega_congested') {
    expUserFgPct = +Math.min(65.0, expUserFgPct + 1.5).toFixed(1);
  } else if (userTeamUsageContext.starCongestionTier === 'solo_carry' && isUserTopScorer) {
    expUserFgPct = +Math.max(39.0, expUserFgPct - 1.0).toFixed(1);
  }

  // Add User Player to mapped roster
  rosterMapped.push({
    id: 'user_player',
    name: userPlayer.name,
    position: userPlayer.position,
    ovr: userPlayer.ovr,
    scoringRating: userCatRatings.scoringRating,
    reboundRating: userCatRatings.reboundRating,
    playmakingRating: userCatRatings.playmakingRating,
    stealRating: userCatRatings.stealRating,
    blockRating: userCatRatings.blockRating,
    categoryRatings: userCatRatings,
    age: userPlayer.age || 19,
    peakAge: userPlayer.peakAge || 26,
    peakOvr: userPlayer.peakOvr || userPlayer.ovr,
    peakDuration: userPlayer.peakDuration || 8,
    minutes: userMinutes,
    role: userRole,
    isUser: true,
    stats: {
      ppg: userGames > 0 ? userPpg : expUserPpg,
      rpg: userGames > 0 ? userRpg : expUserRpg,
      apg: userGames > 0 ? userApg : expUserApg,
      spg: userGames > 0 ? userSpg : expUserSpg,
      bpg: userGames > 0 ? userBpg : expUserBpg,
      fgPct: userPlayer.seasonStats?.fga ? +((userPlayer.seasonStats.fgm / userPlayer.seasonStats.fga) * 100).toFixed(1) : expUserFgPct,
      mpg: userGames > 0 ? +(userPlayer.seasonStats.minutes / userGames).toFixed(1) : userMinutes,
    },
  });

  // Sort final roster by assigned minutes descending (tie-breaker: OVR)
  rosterMapped.sort((a, b) => b.minutes - a.minutes || b.ovr - a.ovr);

  return {
    roster: rosterMapped,
    userMinutes,
    userRole,
  };
}

/**
 * Convenience getter for user player's playing time and team role.
 */
export function getUserMinutesAndRole(
  teamOrCoachTrust: any,
  playerOrOvr?: any,
  ppg: number = 0,
  seasonIndex: number = 1
): { minutes: number; role: '战术核心' | '绝对首发' | '第六人' | '轮换替补' | '饮水机守门员' } {
  if (teamOrCoachTrust && typeof teamOrCoachTrust === 'object' && teamOrCoachTrust.roster) {
    const { userMinutes, userRole } = getCompleteTeamRoster(teamOrCoachTrust, playerOrOvr, seasonIndex);
    return { minutes: userMinutes, role: userRole as any };
  }

  // Fallback if raw numbers were passed
  const ovr = typeof playerOrOvr === 'number' ? playerOrOvr : (typeof teamOrCoachTrust === 'number' ? teamOrCoachTrust : 68);
  if (ovr < 70) return { minutes: 8.0, role: '饮水机守门员' };
  if (ovr < 75) return { minutes: 12.0, role: '轮换替补' };
  if (ovr < 80) return { minutes: 24.0, role: '第六人' };
  if (ovr < 85) return { minutes: 30.0, role: '绝对首发' };
  return { minutes: 35.0, role: '战术核心' };
}

/**
 * Realistic attribute-driven player match stats simulation.
 * Ensures shooting percentages, attempts, rebounds, assists, steals, blocks, and turnovers
 * are mathematically aligned with player attributes and position/archetype.
 */
export function simulatePlayerMatchStats(
  player: PlayerProfile,
  assignedMPG: number,
  teamContext?: TeamUsageContext
): {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  turnovers: number;
  minutes: number;
} {
  const attrs = getPlayerTotalAttributes(player);
  const timeFactor = assignedMPG / 36.0;
  const variance = 0.70 + Math.random() * 0.60; // 0.70 to 1.30 expanded probability range

  // 1. Three-Point Shooting Logic
  let tpa = 0;
  let tpm = 0;
  const tpAttr = attrs.threePoint || 50;

  if (tpAttr < 58) {
    // Non-shooter / traditional bigman (0 to 1 attempt max, low accuracy)
    if (Math.random() < 0.15 * timeFactor) {
      tpa = 1;
      const accuracy = Math.min(0.22, Math.max(0.10, tpAttr * 0.0035));
      if (Math.random() < accuracy) tpm = 1;
    }
  } else if (tpAttr < 75) {
    // Moderate shooter (58-74 3PT, e.g. 69 3PT)
    const baseAttempts = 1.8 + (tpAttr - 58) * 0.15;
    tpa = Math.max(1, Math.round(baseAttempts * timeFactor * variance));
    const accuracy = 0.28 + (tpAttr - 58) * 0.005 + (Math.random() * 0.06 - 0.03);
    const clampedAcc = Math.max(0.20, Math.min(0.42, accuracy));
    for (let i = 0; i < tpa; i++) {
      if (Math.random() < clampedAcc) {
        tpm++;
      }
    }
  } else {
    // Good / Elite shooter (75+)
    const baseAttempts = 4.0 + (tpAttr - 75) * 0.18;
    tpa = Math.max(2, Math.round(baseAttempts * timeFactor * variance));
    const accuracy = 0.35 + (tpAttr - 75) * 0.004 + (Math.random() * 0.06 - 0.03);
    const clampedAcc = Math.max(0.30, Math.min(0.52, accuracy));
    for (let i = 0; i < tpa; i++) {
      if (Math.random() < clampedAcc) {
        tpm++;
      }
    }
  }

  // 2. Free Throw Shooting Logic (罚球制造与命中)
  const ftAttr = attrs.freeThrow || 60;
  const ftPct = Math.max(0.40, Math.min(0.94, ftAttr * 0.0095 + (Math.random() * 0.06 - 0.03)));
  const ftaPer36 = 1.0 + ((attrs.layup || 60) * 0.015 + (attrs.dunk || 60) * 0.015 + (attrs.insideFinish || 60) * 0.015 + (attrs.postMove || 60) * 0.01 + ftAttr * 0.015);
  const fta = Math.max(0, Math.round(ftaPer36 * timeFactor * variance));
  let ftm = 0;
  for (let i = 0; i < fta; i++) {
    if (Math.random() < ftPct) {
      ftm++;
    }
  }

  // 3. Scoring & Field Goal Logic (以：中投、三分、上篮、扣篮、终结、背身、罚球 7项为计算基准)
  const midRangeAttr = attrs.midRange || 60;
  const threePointAttr = attrs.threePoint || 60;
  const layupAttr = attrs.layup || 60;
  const dunkAttr = attrs.dunk || 60;
  const insideFinishAttr = attrs.insideFinish || 60;
  const postMoveAttr = attrs.postMove || 60;
  const freeThrowAttr = attrs.freeThrow || 60;

  const scoringSeven = [
    midRangeAttr,
    threePointAttr,
    layupAttr,
    dunkAttr,
    insideFinishAttr,
    postMoveAttr,
    freeThrowAttr,
  ];

  // (1) 7项得分综合平均基准
  const allSevenAvg = (midRangeAttr + threePointAttr + layupAttr + dunkAttr + insideFinishAttr + postMoveAttr + freeThrowAttr) / 7;

  // (2) 球员主攻杀招加权 (前3项最擅长得分手段, 兼顾射手、突破手或内线单打手的专精得分爆发力)
  const sortedWeapons = [...scoringSeven].sort((a, b) => b - a);
  const primaryWeaponsAvg = sortedWeapons[0] * 0.45 + sortedWeapons[1] * 0.35 + sortedWeapons[2] * 0.20;

  // (3) 得分基准综合评分：主攻杀招(80%) + 7项全能进攻基准(20%)，至少不低于球员整体能力(ovr)
  const rawScoringRating = primaryWeaponsAvg * 0.80 + allSevenAvg * 0.20;
  const scoringRating = Math.max(player.ovr || 60, rawScoringRating);
  const ptsPer36 = calculateExpectedPpg36(scoringRating);
  let rawPts = Math.max(2, Math.round(ptsPer36 * timeFactor * variance));
  
  if (teamContext) {
    rawPts = Math.max(2, Math.round(applyUsageCongestionToPpg(rawPts, player.ovr, true, teamContext, true)));
  }
  const pts = rawPts;

  // Derive non-3pt & non-FT points
  const non3ptAndFtPts = Math.max(0, pts - ftm - tpm * 3);
  const fgm2 = Math.round(non3ptAndFtPts / 2);

  // Field goal percentage based on 终结, 扣篮, 上篮, 中投, 背身
  let fgPctBase = 0.36 + (insideFinishAttr * 0.06 + dunkAttr * 0.05 + layupAttr * 0.04 + midRangeAttr * 0.04 + postMoveAttr * 0.04) / 100;
  if (teamContext?.starCongestionTier === 'super_congested' || teamContext?.starCongestionTier === 'mega_congested') {
    fgPctBase += 0.015; // Better spacing
  }
  const fgPct = Math.max(0.38, Math.min(0.68, fgPctBase + (Math.random() * 0.06 - 0.03)));

  const fga2 = Math.max(fgm2, Math.round(fgm2 / fgPct));

  const fgm = fgm2 + tpm;
  const fga = fga2 + tpa;

  // Recalculate exact points scored from box score items
  const finalPts = ftm + tpm * 3 + fgm2 * 2;

  // 4. Rebounds Logic (以篮板属性为核心基准，结合弹跳与力量身体素质)
  const rebAttr = attrs.rebounding || 60;
  const vertAttr = attrs.vertical || 60;
  const strAttr = attrs.strength || 60;
  // 综合篮板能力：专精篮板属性(75%) + 弹跳(15%) + 力量对抗(10%)
  const effectiveRebRating = rebAttr * 0.75 + vertAttr * 0.15 + strAttr * 0.10;
  const rebPer36 = calculateExpectedRpg36(effectiveRebRating, player.position);

  const reb = Math.max(0, Math.round(rebPer36 * timeFactor * variance));

  // 5. Assists Logic (以传球、控球属性为核心基准)
  const passAttr = attrs.passing || 60;
  const handleAttr = attrs.ballHandle || 60;
  // 综合组织能力：传球属性(80%) + 控球视野与创造力(20%)
  const effectivePlaymakingRating = passAttr * 0.80 + handleAttr * 0.20;
  const astPer36 = calculateExpectedApg36(effectivePlaymakingRating, player.position);
  let astBoost = 0;
  if (teamContext?.starCongestionTier === 'super_congested' || teamContext?.starCongestionTier === 'mega_congested') {
    astBoost = 0.5;
  }
  const ast = Math.max(0, Math.round((astPer36 + astBoost) * timeFactor * variance));

  // 6. Steals Logic (以抢断、外线防守、速度属性为核心基准)
  const stealAttr = attrs.steal || 60;
  const perimDefAttr = attrs.perimeterDef || 60;
  const speedAttr = attrs.speed || 60;
  // 综合断球压迫能力：抢断(75%) + 外线贴身防守(15%) + 敏捷速度(10%)
  const effectiveStealRating = stealAttr * 0.75 + perimDefAttr * 0.15 + speedAttr * 0.10;
  const stlPer36 = calculateExpectedSpg36(effectiveStealRating, player.position);
  // 单场事件离散波动计算
  const stlVariance = 0.75 + Math.random() * 0.50;
  const stl = Math.max(0, Math.round(stlPer36 * timeFactor * stlVariance));

  // 7. Blocks Logic (以盖帽、内线防守、弹跳、力量属性为核心基准)
  const blockAttr = attrs.block || 60;
  const intDefAttr = attrs.interiorDef || 60;
  // 综合护筐盖帽能力：盖帽(70%) + 内线对抗防守(15%) + 弹跳(15%)
  const effectiveBlockRating = blockAttr * 0.70 + intDefAttr * 0.15 + vertAttr * 0.15;
  const blkPer36 = calculateExpectedBpg36(effectiveBlockRating, player.position);
  const blkVariance = 0.75 + Math.random() * 0.50;
  const blk = Math.max(0, Math.round(blkPer36 * timeFactor * blkVariance));

  // 8. Turnovers Logic (控球与传球越高，失误控制越出色)
  const safeHandleRating = (handleAttr * 0.65 + passAttr * 0.35);
  // 60控球->~3.2失误/36m, 80控球->~2.4失误/36m, 95控球->~1.6失误/36m, 99控球->~1.2失误/36m
  const tovPer36 = Math.max(1.0, 4.4 - (safeHandleRating * 0.032));
  const turnovers = Math.max(0, Math.round(tovPer36 * timeFactor * variance));

  return {
    pts: finalPts,
    reb,
    ast,
    stl,
    blk,
    fgm,
    fga,
    tpm,
    tpa,
    ftm,
    fta,
    turnovers,
    minutes: +assignedMPG.toFixed(1),
  };
}

/**
 * Enriches a roster player with auto-calculated role, coach assigned playing time (MPG), and realistic season stats.
 * Uses seasonIndex and player ID to ensure dynamic, distinct season-to-season progression and realistic stat changes.
 * Also adjusts scoring, assists, and shooting efficiency dynamically if the player is in a super congested star team or solo carrying.
 */
export function enrichRosterPlayer(
  p: RosterPlayer,
  index: number,
  seasonIndex: number = 0,
  teamContext?: TeamUsageContext
): RosterPlayer {
  let role: string = p.role || '';
  if (!role) {
    if (index === 0 || p.isStar || p.ovr >= 90) {
      role = '战术核心';
    } else if (index < 5) {
      role = '绝对首发';
    } else if (index === 5) {
      role = '第六人';
    } else if (index < 9) {
      role = '轮换替补';
    } else {
      role = '饮水机守门员';
    }
  }

  // Calculate coach assigned minutes
  let assignedMinutes = p.minutes || 8.0;
  if (!p.minutes) {
    if (role === '战术核心' || index === 0 || p.ovr >= 90) {
      assignedMinutes = 35.5 - index * 0.5;
    } else if (role === '绝对首发' || index < 5) {
      assignedMinutes = 32.0 - index * 1.0;
    } else if (role === '第六人' || index === 5) {
      assignedMinutes = 26.0;
    } else if (role === '轮换替补' || index < 9) {
      assignedMinutes = 18.0 - (index - 6) * 2.0;
    } else {
      assignedMinutes = 8.0 - (index - 9) * 1.5;
    }
    assignedMinutes = +Math.max(4.0, Math.min(38.0, assignedMinutes)).toFixed(1);
  }

  // Get or derive category ratings (scoring, rebound, playmaking, steal, block) for the player
  const catRatings = getPlayerCategoryRatings(p, seasonIndex);

  // Calculate realistic stats mathematically tied to category ratings, position, assigned minutes, and unique seasonal variance
  const timeFactor = assignedMinutes / 36.0;
  
  let pHash = 0;
  const pKey = `${p.name}_${p.id || ''}_s${seasonIndex}_ovr${p.ovr || 75}_age${p.age || 25}`;
  for (let i = 0; i < pKey.length; i++) {
    pHash = ((pHash << 5) - pHash + pKey.charCodeAt(i)) | 0;
  }
  const uHash = Math.abs(pHash);
  
  // Seasonal variation: each season has unique natural fluctuation (-8% to +8%)
  const seasonVariance = 0.92 + (uHash % 17) * 0.01;
  const rebVariance = 0.92 + (Math.floor(uHash / 17) % 17) * 0.01;
  const astVariance = 0.92 + (Math.floor(uHash / 289) % 17) * 0.01;
  const defVariance = 0.91 + (Math.floor(uHash / 4913) % 19) * 0.01;

  // 1. PPG based on scoringRating & calculateExpectedPpg36 & Usage congestion
  const expectedPpg36 = calculateExpectedPpg36(catRatings.scoringRating);
  const rawPpg = +(expectedPpg36 * timeFactor * seasonVariance).toFixed(1);
  let finalPpg = teamContext ? applyUsageCongestionToPpg(rawPpg, p.ovr, index === 0, teamContext) : rawPpg;
  if (teamContext?.starCongestionTier === 'solo_95_pure' && p.ovr >= 95) {
    finalPpg = calculateExpectedPpg36(p.ovr);
  }

  // 2. RPG based on reboundRating & calculateExpectedRpg36
  const expectedRpg36 = calculateExpectedRpg36(catRatings.reboundRating, p.position);
  const rpg = +(expectedRpg36 * timeFactor * rebVariance).toFixed(1);

  // 3. APG based on playmakingRating & calculateExpectedApg36 (with passing boost if in super congested team)
  const expectedApg36 = calculateExpectedApg36(catRatings.playmakingRating, p.position);
  let rawApg = +(expectedApg36 * timeFactor * astVariance).toFixed(1);
  if ((teamContext?.starCongestionTier === 'super_congested' || teamContext?.starCongestionTier === 'mega_congested') && (p.ovr >= 88 || catRatings.playmakingRating >= 80)) {
    // Sharing the ball generates more team assists
    rawApg = +(rawApg + 0.6).toFixed(1);
  }
  const apg = rawApg;

  // 4. SPG based on stealRating & calculateExpectedSpg36
  const expectedSpg36 = calculateExpectedSpg36(catRatings.stealRating, p.position);
  const spg = +(expectedSpg36 * timeFactor * defVariance).toFixed(1);

  // 5. BPG based on blockRating & calculateExpectedBpg36
  const expectedBpg36 = calculateExpectedBpg36(catRatings.blockRating, p.position);
  const bpg = +(expectedBpg36 * timeFactor * defVariance).toFixed(1);

  // 6. FG% based on scoringRating & position & season variance & team congestion efficiency bonus
  const fgPctBase = p.position === 'C' || p.position === 'PF' ? 48.0 : 43.0;
  const fgFloat = ((uHash % 11) - 5) * 0.45;
  let fgPct = +(Math.min(65.0, Math.max(38.0, fgPctBase + (catRatings.scoringRating - 65) * 0.32 + fgFloat))).toFixed(1);
  if ((teamContext?.starCongestionTier === 'super_congested' || teamContext?.starCongestionTier === 'mega_congested') && p.ovr >= 85) {
    // Better spacing and higher shot quality in star-studded teams (+1.5% FG)
    fgPct = +Math.min(65.0, fgPct + 1.5).toFixed(1);
  } else if (teamContext?.starCongestionTier === 'solo_carry' && index === 0 && p.ovr >= 90) {
    // Hard defensive double-teams slightly lower field goal percentage (-1.0% FG)
    fgPct = +Math.max(39.0, fgPct - 1.0).toFixed(1);
  }

  return {
    ...p,
    scoringRating: catRatings.scoringRating,
    reboundRating: catRatings.reboundRating,
    playmakingRating: catRatings.playmakingRating,
    stealRating: catRatings.stealRating,
    blockRating: catRatings.blockRating,
    categoryRatings: catRatings,
    role,
    minutes: assignedMinutes,
    stats: {
      ppg: finalPpg,
      rpg,
      apg,
      spg,
      bpg,
      fgPct,
      mpg: assignedMinutes,
    },
  };
}

export interface CalculatedMatchScores {
  strongTeamId: string;
  weakTeamId: string;
  strongBase: number;
  strongFinalScore: number;
  ratingDiff: number;
  pointMargin: number;
  weakFinalScore: number;
  teamAScore: number;
  teamBScore: number;
  isUserWin?: boolean;
}

/**
 * Calculates realistic 80-120 score range and point gap formula based on team power ratings:
 * 1. Determine stronger team.
 * 2. Strong team baseline randomly picked from [90, 100, 110].
 * 3. Strong team score = baseline + randInt(-10, 10) -> (80 to 120 range).
 * 4. Point margin distribution (+30 to -30) generated via formula mapped to rating difference.
 * 5. Weak team score = strong team score - point margin.
 */
export function calculateMatchScores(
  teamA: Team,
  teamB: Team,
  userTeamId?: string
): CalculatedMatchScores {
  const ratingA = calculateTeamPowerRating(teamA);
  const ratingB = calculateTeamPowerRating(teamB);

  const isAStronger = ratingA >= ratingB;
  const strongTeam = isAStronger ? teamA : teamB;
  const weakTeam = isAStronger ? teamB : teamA;
  const strongRating = isAStronger ? ratingA : ratingB;
  const weakRating = isAStronger ? ratingB : ratingA;

  // 1. Pick baseline for strong team from [90, 100, 110]
  const bases = [90, 100, 110];
  const strongBase = bases[Math.floor(Math.random() * bases.length)];

  // 2. Fluctuate within +-10
  const floatVal = Math.floor(Math.random() * 21) - 10;
  const strongFinalScore = Math.max(80, Math.min(125, strongBase + floatVal));

  // 3. Rating difference
  const ratingDiff = Math.max(0, strongRating - weakRating);

  // 4. Probability formula for score margin (+30 to -30)
  const meanMargin = Math.min(26, Math.max(1, 2 + ratingDiff * 0.65));
  const stdDev = 9.5;

  const margins: number[] = [];
  const probs: number[] = [];
  let sumProb = 0;

  for (let m = 30; m >= -30; m--) {
    margins.push(m);
    const prob = Math.exp(-Math.pow(m - meanMargin, 2) / (2 * Math.pow(stdDev, 2)));
    probs.push(prob);
    sumProb += prob;
  }

  let rand = Math.random() * sumProb;
  let selectedMargin = 0;
  for (let i = 0; i < margins.length; i++) {
    rand -= probs[i];
    if (rand <= 0) {
      selectedMargin = margins[i];
      break;
    }
  }

  // 5. Weak team final score
  let weakFinalScore = strongFinalScore - selectedMargin;
  weakFinalScore = Math.max(75, Math.min(125, weakFinalScore));

  const teamAScore = isAStronger ? strongFinalScore : weakFinalScore;
  const teamBScore = isAStronger ? weakFinalScore : strongFinalScore;

  return {
    strongTeamId: strongTeam.id,
    weakTeamId: weakTeam.id,
    strongBase,
    strongFinalScore,
    ratingDiff,
    pointMargin: selectedMargin,
    weakFinalScore,
    teamAScore,
    teamBScore,
    isUserWin: userTeamId ? (userTeamId === teamA.id ? teamAScore > teamBScore : teamBScore > teamAScore) : undefined,
  };
}

/**
 * Generates single-game player box score stats for home and away rosters
 * ensuring the sum of player points for each team EXACTLY matches the team's final score!
 */
export function generateFullMatchRosterStats(
  userTeam: Team,
  oppTeam: Team,
  userPlayer: PlayerProfile,
  userScore: number,
  oppScore: number,
  isHome: boolean,
  seasonIndex: number = 0,
  userBoxScore?: Omit<MatchBoxScore['playerStats'], 'ratingGrade'>,
  userDnpReason?: string
): MatchRosterStats {
  const homeTeam = isHome ? userTeam : oppTeam;
  const awayTeam = isHome ? oppTeam : userTeam;
  const homeScore = isHome ? userScore : oppScore;
  const awayScore = isHome ? oppScore : userScore;

  const buildTeamStats = (
    team: Team,
    teamScore: number,
    isUserTeam: boolean
  ): SingleGamePlayerStats[] => {
    const rosterInfo = getCompleteTeamRoster(team, isUserTeam ? userPlayer : ({} as any), seasonIndex);
    const players = rosterInfo.roster;

    let userAssignedPts = 0;
    let userStatsEntry: SingleGamePlayerStats | null = null;

    if (isUserTeam && userDnpReason) {
      userStatsEntry = {
        id: userPlayer.id || 'user_player',
        name: userPlayer.name,
        position: userPlayer.position,
        number: userPlayer.number || String(userPlayer.jerseyNum || '23'),
        ovr: userPlayer.ovr,
        isUser: true,
        dnpReason: userDnpReason,
        minutes: 0,
        pts: 0,
        reb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        tpa: 0,
        ftm: 0,
        fta: 0,
      };
    } else if (isUserTeam) {
      const uMinutes = rosterInfo.userMinutes || 25;
      if (userBoxScore) {
        userAssignedPts = userBoxScore.pts;
        userStatsEntry = {
          id: userPlayer.id || 'user_player',
          name: userPlayer.name,
          position: userPlayer.position,
          number: userPlayer.number || String(userPlayer.jerseyNum || '23'),
          ovr: userPlayer.ovr,
          isUser: true,
          minutes: userBoxScore.minutes,
          pts: userBoxScore.pts,
          reb: userBoxScore.reb,
          ast: userBoxScore.ast,
          stl: userBoxScore.stl,
          blk: userBoxScore.blk,
          fgm: userBoxScore.fgm,
          fga: userBoxScore.fga,
          tpm: userBoxScore.tpm,
          tpa: userBoxScore.tpa,
          ftm: userBoxScore.ftm,
          fta: userBoxScore.fta,
        };
      } else {
        const sim = simulatePlayerMatchStats(userPlayer, uMinutes);
        userAssignedPts = sim.pts;
        userStatsEntry = {
          id: userPlayer.id || 'user_player',
          name: userPlayer.name,
          position: userPlayer.position,
          number: userPlayer.number || String(userPlayer.jerseyNum || '23'),
          ovr: userPlayer.ovr,
          isUser: true,
          minutes: uMinutes,
          pts: sim.pts,
          reb: sim.reb,
          ast: sim.ast,
          stl: sim.stl,
          blk: sim.blk,
          fgm: sim.fgm,
          fga: sim.fga,
          tpm: sim.tpm,
          tpa: sim.tpa,
          ftm: sim.ftm,
          fta: sim.fta,
        };
      }
    }

    const aiPlayers = players.filter((p) => !p.isUser);
    const remainingPtsToDistribute = isUserTeam
      ? Math.max(0, teamScore - userAssignedPts)
      : teamScore;

    const playerWeights = aiPlayers.map((p) => {
      const targetPpg = p.stats?.ppg || (p.ovr >= 90 ? (p.ovr - 60) * 0.8 : (p.ovr / 70) * 15);
      const mins = p.minutes || 15;
      return Math.max(0.1, targetPpg * (mins / 36));
    });

    const totalWeight = playerWeights.reduce((a, b) => a + b, 0) || 1;

    const rawPts = playerWeights.map((w) => (remainingPtsToDistribute * w) / totalWeight);
    const floorPts = rawPts.map((r) => Math.floor(r));
    let sumAssigned = floorPts.reduce((a, b) => a + b, 0);

    const remainders = rawPts.map((r, idx) => ({ idx, rem: r - floorPts[idx] }));
    remainders.sort((a, b) => b.rem - a.rem);

    let diff = remainingPtsToDistribute - sumAssigned;
    let rIdx = 0;
    while (diff > 0 && aiPlayers.length > 0) {
      floorPts[remainders[rIdx % remainders.length].idx] += 1;
      diff--;
      rIdx++;
    }

    const aiStatsList: SingleGamePlayerStats[] = aiPlayers.map((p, idx) => {
      const pts = floorPts[idx];
      const mins = p.minutes || 15;

      let tpm = 0;
      if (pts >= 3 && (p.position === 'PG' || p.position === 'SG' || p.position === 'SF')) {
        tpm = Math.min(Math.floor(pts / 3), Math.floor(Math.random() * 3) + 1);
      }
      const ptsRemaining = pts - tpm * 3;
      const fgm2 = Math.floor(ptsRemaining / 2);
      const ftm = Math.max(0, ptsRemaining - fgm2 * 2);

      const fgm = fgm2 + tpm;
      const fga = fgm + Math.floor(Math.random() * 4) + 1;
      const tpa = tpm + (tpm > 0 ? Math.floor(Math.random() * 3) + 1 : (p.position === 'PG' || p.position === 'SG' ? Math.floor(Math.random() * 2) : 0));
      const fta = ftm + (ftm > 0 ? Math.floor(Math.random() * 2) : 0);

      // Use unified category rating & per-36 attribute mappings for AI match box score items
      const pCat = getPlayerCategoryRatings(p);
      const timeFactor = mins / 36.0;

      // Rebounds mapped from reboundRating
      const expRpg36 = calculateExpectedRpg36(pCat.reboundRating, p.position);
      const reb = Math.max(0, Math.round(expRpg36 * timeFactor * (0.80 + Math.random() * 0.40)));

      // Assists mapped from playmakingRating
      const expApg36 = calculateExpectedApg36(pCat.playmakingRating, p.position);
      const ast = Math.max(0, Math.round(expApg36 * timeFactor * (0.80 + Math.random() * 0.40)));

      // Steals mapped from stealRating
      const expSpg36 = calculateExpectedSpg36(pCat.stealRating, p.position);
      const stl = Math.max(0, Math.round(expSpg36 * timeFactor * (0.70 + Math.random() * 0.60)));

      // Blocks mapped from blockRating
      const expBpg36 = calculateExpectedBpg36(pCat.blockRating, p.position);
      const blk = Math.max(0, Math.round(expBpg36 * timeFactor * (0.70 + Math.random() * 0.60)));

      return {
        id: p.id || p.name,
        name: p.name,
        position: p.position,
        number: p.number || `${Math.floor(Math.random() * 90) + 1}`,
        ovr: p.ovr,
        isUser: false,
        isStar: p.isStar,
        minutes: mins,
        pts,
        reb,
        ast,
        stl,
        blk,
        fgm,
        fga,
        tpm,
        tpa,
        ftm,
        fta,
      };
    });

    const resultList: SingleGamePlayerStats[] = [];
    if (isUserTeam && userStatsEntry) {
      resultList.push(userStatsEntry);
    }
    resultList.push(...aiStatsList);

    return resultList;
  };

  const homePlayers = buildTeamStats(homeTeam, homeScore, isHome);
  const awayPlayers = buildTeamStats(awayTeam, awayScore, !isHome);

  return {
    homeTeamId: homeTeam.id,
    homeTeamName: homeTeam.name,
    homeScore,
    homePlayers,
    awayTeamId: awayTeam.id,
    awayTeamName: awayTeam.name,
    awayScore,
    awayPlayers,
  };
}
