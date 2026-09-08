export interface MilestoneLeader {
  rank: number;
  name: string;
  team: string;
  value: number;
  note?: string;
}

export interface MilestoneCategory {
  id: 'pts' | 'reb' | 'ast' | 'stl' | 'blk' | 'tpm';
  name: string;
  unit: string;
  icon: string;
  color: string;
  accentBg: string;
  leaders: MilestoneLeader[];
}

export const MILESTONE_CATEGORIES: MilestoneCategory[] = [
  {
    id: 'pts',
    name: '历史总得分',
    unit: '分',
    icon: '🔥',
    color: 'text-amber-400',
    accentBg: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    leaders: [
      { rank: 1, name: '勒布朗·詹姆斯', team: 'LAL', value: 40474, note: '现役历史得分王' },
      { rank: 2, name: '卡里姆·阿卜杜勒-贾巴尔', team: 'LAL', value: 38387, note: '天勾传奇' },
      { rank: 3, name: '卡尔·马龙', team: 'UTA', value: 36928, note: '邮差' },
      { rank: 4, name: '科比·布莱恩特', team: 'LAL', value: 33643, note: '黑曼巴' },
      { rank: 5, name: '迈克尔·乔丹', team: 'CHI', value: 32292, note: '篮球之神' },
      { rank: 6, name: '德克·诺维茨基', team: 'DAL', value: 31560, note: '诺天王' },
      { rank: 7, name: '威尔特·张伯伦', team: 'PHI', value: 31419, note: '篮球皇帝' },
      { rank: 8, name: '凯文·杜兰特', team: 'PHX', value: 28924, note: '死神' },
      { rank: 9, name: '沙奎尔·奥尼尔', team: 'LAL', value: 28596, note: '大鲨鱼' },
      { rank: 10, name: '卡梅隆·安东尼', team: 'DEN', value: 28289, note: '甜瓜' },
    ],
  },
  {
    id: 'reb',
    name: '历史总篮板',
    unit: '个',
    icon: '🛡️',
    color: 'text-blue-400',
    accentBg: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    leaders: [
      { rank: 1, name: '威尔特·张伯伦', team: 'PHI', value: 23924, note: '单场55篮板神迹' },
      { rank: 2, name: '比尔·拉塞尔', team: 'BOS', value: 21620, note: '指环王' },
      { rank: 3, name: '卡里姆·阿卜杜勒-贾巴尔', team: 'LAL', value: 17440 },
      { rank: 4, name: '埃尔文·海耶斯', team: 'WAS', value: 16279 },
      { rank: 5, name: '摩西·马龙', team: 'PHI', value: 16212, note: '前场篮板之王' },
      { rank: 6, name: '罗伯特·帕里什', team: 'BOS', value: 14715 },
      { rank: 7, name: '凯文·加内特', team: 'MIN', value: 14662, note: '狼王' },
      { rank: 8, name: '德怀特·霍华德', team: 'ORL', value: 14627, note: '魔兽' },
      { rank: 9, name: '内特·瑟蒙德', team: 'GSW', value: 14464 },
      { rank: 10, name: '威斯·昂塞尔德', team: 'WAS', value: 13769 },
    ],
  },
  {
    id: 'ast',
    name: '历史总助攻',
    unit: '次',
    icon: '🎯',
    color: 'text-purple-400',
    accentBg: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    leaders: [
      { rank: 1, name: '约翰·斯托克顿', team: 'UTA', value: 15806, note: '历史助攻王尘封记录' },
      { rank: 2, name: '贾森·基德', team: 'NJN', value: 12091, note: '大师级控卫' },
      { rank: 3, name: '克里斯·保罗', team: 'LAC', value: 11894, note: '控卫之神' },
      { rank: 4, name: '勒布朗·詹姆斯', team: 'LAL', value: 11009 },
      { rank: 5, name: '史蒂夫·纳什', team: 'PHX', value: 10335, note: '7秒或更少风暴' },
      { rank: 6, name: '马克·杰克逊', team: 'IND', value: 10334 },
      { rank: 7, name: '埃尔文·约翰逊', team: 'LAL', value: 10141, note: '魔术师' },
      { rank: 8, name: '奥斯卡·罗伯特森', team: 'SAC', value: 9887, note: '大三元鼻祖' },
      { rank: 9, name: '拉塞尔·威斯布鲁克', team: 'LAC', value: 9468, note: '三双王' },
      { rank: 10, name: '伊赛亚·托马斯', team: 'DET', value: 9061, note: '微笑刺客' },
    ],
  },
  {
    id: 'stl',
    name: '历史总抢断',
    unit: '次',
    icon: '⚡',
    color: 'text-emerald-400',
    accentBg: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    leaders: [
      { rank: 1, name: '约翰·斯托克顿', team: 'UTA', value: 3265, note: '抢断榜王座' },
      { rank: 2, name: '贾森·基德', team: 'NJN', value: 2684 },
      { rank: 3, name: '克里斯·保罗', team: 'LAC', value: 2614 },
      { rank: 4, name: '迈克尔·乔丹', team: 'CHI', value: 2514 },
      { rank: 5, name: '加里·佩顿', team: 'SEA', value: 2445, note: '手套' },
      { rank: 6, name: '莫里斯·奇克斯', team: 'PHI', value: 2310 },
      { rank: 7, name: '斯科蒂·皮蓬', team: 'CHI', value: 2307 },
      { rank: 8, name: '勒布朗·詹姆斯', team: 'LAL', value: 2275 },
      { rank: 9, name: '克莱德·德雷克斯勒', team: 'POR', value: 2207, note: '滑翔机' },
      { rank: 10, name: '哈基姆·奥拉朱旺', team: 'HOU', value: 2162, note: '大梦全能防守' },
    ],
  },
  {
    id: 'blk',
    name: '历史总盖帽',
    unit: '次',
    icon: '🚫',
    color: 'text-cyan-400',
    accentBg: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    leaders: [
      { rank: 1, name: '哈基姆·奥拉朱旺', team: 'HOU', value: 3830, note: '历史盖帽王' },
      { rank: 2, name: '迪肯贝·穆托姆博', team: 'ATL', value: 3289, note: '摇手指禁飞区' },
      { rank: 3, name: '卡里姆·阿卜杜勒-贾巴尔', team: 'LAL', value: 3189 },
      { rank: 4, name: '马克·伊顿', team: 'UTA', value: 3064, note: '猛犸象' },
      { rank: 5, name: '蒂姆·邓肯', team: 'SAS', value: 3020, note: '石佛' },
      { rank: 6, name: '大卫·罗宾逊', team: 'SAS', value: 2954, note: '海军上将' },
      { rank: 7, name: '帕特里克·尤因', team: 'NYK', value: 2894, note: '纽约之王' },
      { rank: 8, name: '沙奎尔·奥尼尔', team: 'LAL', value: 2732 },
      { rank: 9, name: '罗伯特·帕里什', team: 'BOS', value: 2361 },
      { rank: 10, name: '阿隆佐·莫宁', team: 'MIA', value: 2356, note: '铁血硬汉' },
    ],
  },
  {
    id: 'tpm',
    name: '历史三分命中数',
    unit: '个',
    icon: '🏹',
    color: 'text-rose-400',
    accentBg: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    leaders: [
      { rank: 1, name: '斯蒂芬·库里', team: 'GSW', value: 3747, note: '历史三分第一人' },
      { rank: 2, name: '雷·阿伦', team: 'BOS', value: 2973, note: '君子雷' },
      { rank: 3, name: '詹姆斯·哈登', team: 'LAC', value: 2940, note: '后撤步三分开创者' },
      { rank: 4, name: '达米安·利拉德', team: 'MIL', value: 2607, note: '表哥' },
      { rank: 5, name: '克雷·汤普森', team: 'DAL', value: 2481, note: '神射手' },
      { rank: 6, name: '雷吉·米勒', team: 'IND', value: 2560, note: '米勒时刻' },
      { rank: 7, name: '凯尔·科沃尔', team: 'ATL', value: 2450, note: '神射手' },
      { rank: 8, name: '勒布朗·詹姆斯', team: 'LAL', value: 2410 },
      { rank: 9, name: '文斯·卡特', team: 'TOR', value: 2290 },
      { rank: 10, name: '贾森·特里', team: 'DAL', value: 2282, note: '喷气机' },
    ],
  },
];

/**
 * Calculates player's numerical rank (1..10) in a category if stat >= 10th spot value.
 * Returns null if player is not in Top 10 (stat < 10th spot value).
 */
export function getPlayerRankInCategory(
  catId: MilestoneCategory['id'],
  playerStat: number
): { rank: number | null; passedLeaderName?: string } {
  const category = MILESTONE_CATEGORIES.find((c) => c.id === catId);
  if (!category) return { rank: null };

  const leaders = category.leaders;
  const top10Min = leaders[leaders.length - 1].value;

  if (playerStat < top10Min) {
    return { rank: null };
  }

  // Determine rank 1..10
  for (let i = 0; i < leaders.length; i++) {
    if (playerStat >= leaders[i].value) {
      return {
        rank: i + 1,
        passedLeaderName: leaders[i].name,
      };
    }
  }

  return { rank: 10, passedLeaderName: leaders[9].name };
}

export interface MilestoneTrigger {
  catId: MilestoneCategory['id'];
  catName: string;
  unit: string;
  icon: string;
  oldRank: number | null;
  newRank: number;
  newStat: number;
  passedLeaderName: string;
  type: 'TOP10' | 'TOP3' | 'NO1';
}

/**
 * Detects new milestone achievements when career stats increase.
 */
export function detectNewMilestones(
  oldCareerStats: { pts: number; reb: number; ast: number; stl: number; blk: number; tpm: number },
  newCareerStats: { pts: number; reb: number; ast: number; stl: number; blk: number; tpm: number }
): MilestoneTrigger[] {
  const triggers: MilestoneTrigger[] = [];

  const catKeys: Array<MilestoneCategory['id']> = ['pts', 'reb', 'ast', 'stl', 'blk', 'tpm'];

  for (const catId of catKeys) {
    const oldVal = oldCareerStats[catId] || 0;
    const newVal = newCareerStats[catId] || 0;

    if (newVal <= oldVal) continue;

    const category = MILESTONE_CATEGORIES.find((c) => c.id === catId);
    if (!category) continue;

    const oldRes = getPlayerRankInCategory(catId, oldVal);
    const newRes = getPlayerRankInCategory(catId, newVal);

    const oldRank = oldRes.rank; // number or null
    const newRank = newRes.rank; // number or null

    if (newRank === null) continue; // Still not in Top 10

    // Check level of achievement
    // 1. Crowned #1 All-time
    if ((oldRank === null || oldRank > 1) && newRank === 1) {
      triggers.push({
        catId,
        catName: category.name,
        unit: category.unit,
        icon: category.icon,
        oldRank,
        newRank: 1,
        newStat: newVal,
        passedLeaderName: category.leaders[0].name,
        type: 'NO1',
      });
    }
    // 2. Entered Top 3
    else if ((oldRank === null || oldRank > 3) && newRank <= 3) {
      triggers.push({
        catId,
        catName: category.name,
        unit: category.unit,
        icon: category.icon,
        oldRank,
        newRank,
        newStat: newVal,
        passedLeaderName: newRes.passedLeaderName || category.leaders[newRank - 1].name,
        type: 'TOP3',
      });
    }
    // 3. Entered Top 10
    else if (oldRank === null && newRank <= 10) {
      triggers.push({
        catId,
        catName: category.name,
        unit: category.unit,
        icon: category.icon,
        oldRank,
        newRank,
        newStat: newVal,
        passedLeaderName: newRes.passedLeaderName || category.leaders[newRank - 1].name,
        type: 'TOP10',
      });
    }
  }

  return triggers;
}
