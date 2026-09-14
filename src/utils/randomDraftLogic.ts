import { getHistoricalDraftData, type DraftPickItem, type YearDraftData } from '../data/draftData';
import type { Position, Team } from '../types';

export const PARALLEL_HISTORICAL_DRAFT_END_YEAR = 2009;

function shuffleWeightedLottery(teams: Team[], random: () => number): Team[] {
  const pool = [...teams];
  const winners: Team[] = [];
  // Only the first four picks are drawn; worse records receive larger weights.
  while (winners.length < Math.min(4, pool.length)) {
    const weights = pool.map((_, index) => Math.max(1, pool.length - index) ** 1.35);
    let draw = random() * weights.reduce((sum, value) => sum + value, 0);
    let selected = 0;
    for (; selected < weights.length - 1; selected += 1) {
      draw -= weights[selected];
      if (draw <= 0) break;
    }
    winners.push(pool.splice(selected, 1)[0]);
  }
  return [...winners, ...pool];
}

function needScore(team: Team, position: Position): number {
  const best = team.roster.filter((p) => p.position === position).reduce((max, p) => Math.max(max, p.ovr), 60);
  return 100 - best;
}

function talentScore(pick: DraftPickItem): number {
  const p = pick.player;
  return (p.peakOvr || p.ovr + 7) * 1.5 + p.ovr * 0.75 - Math.max(0, p.age - 20) * 1.5;
}

function maxFall(pick: DraftPickItem): number {
  const peak = pick.player.peakOvr || pick.player.ovr + 7;
  if (peak >= 95) return 5;
  if (peak >= 91) return 10;
  if (peak >= 87) return 16;
  return 30;
}

const FIRST_NAMES = ['杰伦', '卡梅隆', '马库斯', '德文', '泰勒', '以赛亚', '特雷', '乔丹', '凯登', '诺亚', '埃利斯', '安德烈', '迈尔斯', '达里厄斯', '贾登', '科尔', '马利克', '布兰登', '泽维尔', '昆西', '奥斯汀', '德里克', '贾马尔', '特伦斯', '凯文', '朱利安', '纳坦', '科迪', '兰登', '克里斯', '卡特', '米卡', '罗恩', '朱万', '埃文', '赛斯', '基扬', '尼克', '卢克', '凯尔', '罗伊', '马科', '乔纳森', '达伦', '肖恩', '以利亚', '扎伊尔', '阿隆', '托拜厄斯', '安东尼', '本杰明', '加布里埃尔', '特洛伊', '贾伦', '克里斯托弗', '乔治', '达米安', '德章泰', '斯潘塞', '马尔科姆'];
const LAST_NAMES = ['安德森', '威廉姆斯', '约翰逊', '罗宾逊', '汤普森', '刘易斯', '沃克', '哈里斯', '米切尔', '杨', '格林', '杰克逊', '库珀', '戴维斯', '摩尔', '克拉克', '马丁', '怀特', '布朗', '金', '史密斯', '贝克', '里德', '斯科特', '特纳', '格兰特', '霍尔', '亚当斯', '埃文斯', '沃德', '威尔逊', '米勒', '托马斯', '泰勒', '华盛顿', '卡特', '柯林斯', '斯图尔特', '莫里斯', '拉塞尔', '爱德华兹', '巴恩斯', '布莱恩特', '巴特勒', '西蒙斯', '福斯特', '鲍威尔', '理查德森', '布鲁克斯', '亨德森', '汉密尔顿', '霍华德', '詹金斯', '劳森', '马歇尔', '穆雷', '纽曼', '欧文斯', '帕特森', '波特'];
const COLLEGES = ['杜克大学', '肯塔基大学', '堪萨斯大学', '北卡罗来纳大学', '康涅狄格大学', 'UCLA', '冈萨加大学', '亚利桑那大学', '密歇根大学', '海外联赛'];
const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

function yearRandom(year: number): () => number {
  let value = (year * 2654435761) >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Creates a stable local rookie class for seasons beyond the maintained real data. */
export function generateSyntheticDraftClass(year: number): YearDraftData {
  const random = yearRandom(year);
  const draftPicks: DraftPickItem[] = Array.from({ length: 30 }, (_, index) => {
    const serial = Math.max(0, year - 2027) * 30 + index;
    // 61 is coprime with the 3,600 available combinations, so every class mixes
    // first and last names while a full career window never repeats a pair.
    const nameCode = (serial * 61) % (FIRST_NAMES.length * LAST_NAMES.length);
    const first = FIRST_NAMES[nameCode % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(nameCode / FIRST_NAMES.length) % LAST_NAMES.length];
    const position = POSITIONS[(index * 2 + Math.floor(random() * POSITIONS.length)) % POSITIONS.length];
    const [ovrMin, ovrMax, peakMin, peakMax] = index === 0
      ? [80, 82, 94, 97]
      : index < 3 ? [78, 81, 91, 95]
        : index < 10 ? [75, 79, 87, 92]
          : index < 20 ? [72, 76, 82, 88]
            : [68, 73, 77, 84];
    const ovr = ovrMin + Math.floor(random() * (ovrMax - ovrMin + 1));
    const peakOvr = Math.max(ovr + 5, peakMin + Math.floor(random() * (peakMax - peakMin + 1)));
    const teamId = `future_pick_${index + 1}`;
    return {
      pick: index + 1,
      teamId,
      teamName: `第${index + 1}顺位球队`,
      player: {
        id: `generated_${year}_${index + 1}`,
        name: `${first}·${last}`,
        position,
        ovr,
        age: 19 + Math.floor(random() * 4),
        college: COLLEGES[Math.floor(random() * COLLEGES.length)],
        highlights: index < 3 ? '本届最受关注的高潜力新秀' : index < 14 ? '具备稳定首轮前景' : '拥有值得培养的专项能力',
        peakAge: 25 + Math.floor(random() * 4),
        peakOvr: Math.min(99, peakOvr),
        peakDuration: 3 + Math.floor(random() * 4),
      },
    };
  });
  return {
    year,
    lotteryResults: draftPicks.slice(0, 14).map((pick) => ({ pick: pick.pick, teamId: pick.teamId, teamName: pick.teamName, odds: '平行联盟预测', projectName: pick.player.name, projectPosition: pick.player.position })),
    draftPicks,
  };
}

/** Keeps the 2008 and 2009 classes on their real draft order, then follows simulated records from 2010 onward. */
export function generateParallelDraftData(teams: Team[], year: number, random: () => number = Math.random): YearDraftData | null {
  const historical = getHistoricalDraftData(year) || (year > 2026 ? generateSyntheticDraftClass(year) : null);
  if (year <= PARALLEL_HISTORICAL_DRAFT_END_YEAR || !historical?.draftPicks?.length) return historical || null;

  const standings = [...teams].sort((a, b) => a.wins - b.wins || b.losses - a.losses || a.rating - b.rating);
  const lottery = shuffleWeightedLottery(standings.slice(0, 14), random);
  const draftOrder = [...lottery, ...standings.slice(14)];
  const prospects = [...historical.draftPicks].sort((a, b) => talentScore(b) - talentScore(a));
  const remaining = [...prospects];
  const draftPicks: DraftPickItem[] = [];

  for (let index = 0; index < Math.min(30, draftOrder.length, prospects.length); index += 1) {
    const pickNumber = index + 1;
    const team = draftOrder[index];
    const forced = remaining.filter((candidate) => maxFall(candidate) <= pickNumber);
    const window = forced.length ? forced : remaining.slice(0, Math.min(5, remaining.length));
    const selected = [...window].sort((a, b) => {
      const scoreA = talentScore(a) + needScore(team, a.player.position) * 0.18 + random() * 3;
      const scoreB = talentScore(b) + needScore(team, b.player.position) * 0.18 + random() * 3;
      return scoreB - scoreA;
    })[0];
    remaining.splice(remaining.indexOf(selected), 1);
    draftPicks.push({ ...selected, pick: pickNumber, teamId: team.id, teamName: team.name });
  }

  return {
    year,
    lotteryResults: draftPicks.slice(0, 14).map((pick) => ({
      pick: pick.pick,
      teamId: pick.teamId,
      teamName: pick.teamName,
      odds: '模拟战绩加权',
      projectName: pick.player.name,
      projectPosition: pick.player.position,
    })),
    draftPicks,
  };
}
