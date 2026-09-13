import { Position } from '../types';
import { DRAFTS_2011_TO_2015 } from './drafts/draft2011_2015';
import { DRAFTS_2016_TO_2020 } from './drafts/draft2016_2020';
import { DRAFTS_2021_TO_2025 } from './drafts/draft2021_2025';
import { DRAFTS_2026 } from './drafts/draft2026';

export interface DraftPickItem {
  pick: number;
  teamId: string;
  teamName: string;
  player: {
    id: string;
    name: string;
    position: Position;
    ovr: number;
    age: number;
    college: string;
    highlights: string;
    peakAge?: number;
    peakOvr?: number;
    peakDuration?: number;
  };
}

export interface LotteryItem {
  pick: number;
  teamId: string;
  teamName: string;
  odds: string;
  projectName: string;
  projectPosition: Position;
}

export interface YearDraftData {
  year: number;
  lotteryResults: LotteryItem[];
  draftPicks: DraftPickItem[];
}

export const HISTORICAL_DRAFTS: Record<number, YearDraftData> = {
  2008: {
    year: 2008,
    lotteryResults: [
      { pick: 1, teamId: 'chi', teamName: '芝加哥公牛', odds: '1.7%', projectName: '德里克·罗斯', projectPosition: 'PG' },
      { pick: 2, teamId: 'mia', teamName: '迈阿密热火', odds: '25.0%', projectName: '迈克尔·比斯利', projectPosition: 'PF' },
      { pick: 3, teamId: 'min', teamName: '明尼苏达森林狼', odds: '19.9%', projectName: 'O.J. 梅奥', projectPosition: 'SG' },
      { pick: 4, teamId: 'okc', teamName: '俄克拉荷马雷霆', odds: '13.8%', projectName: '拉塞尔·威斯布鲁克', projectPosition: 'PG' },
      { pick: 5, teamId: 'mem', teamName: '孟菲斯灰熊', odds: '13.7%', projectName: '凯文·乐福', projectPosition: 'PF' },
      { pick: 6, teamId: 'nyk', teamName: '纽约尼克斯', odds: '7.6%', projectName: '达尼洛·加里纳利', projectPosition: 'SF' },
      { pick: 7, teamId: 'lac', teamName: '洛杉矶快船', odds: '4.3%', projectName: '埃里克·戈登', projectPosition: 'SG' },
      { pick: 8, teamId: 'mil', teamName: '密尔沃基雄鹿', odds: '2.8%', projectName: '乔·亚历山大', projectPosition: 'SF' },
      { pick: 9, teamId: 'cha', teamName: '夏洛特山猫', odds: '1.7%', projectName: 'D.J. 奥古斯丁', projectPosition: 'PG' },
      { pick: 10, teamId: 'bkn', teamName: '布鲁克林篮网', odds: '1.0%', projectName: '布鲁克·洛佩斯', projectPosition: 'C' },
      { pick: 11, teamId: 'ind', teamName: '印第安纳步行者', odds: '0.8%', projectName: '杰里德·贝勒斯', projectPosition: 'PG' },
      { pick: 12, teamId: 'sac', teamName: '萨克拉门托国王', odds: '0.7%', projectName: '杰森·汤普森', projectPosition: 'PF' },
      { pick: 13, teamId: 'por', teamName: '波特兰开拓者', odds: '0.6%', projectName: '布兰登·拉什', projectPosition: 'SG' },
      { pick: 14, teamId: 'gsw', teamName: '金州勇士', odds: '0.5%', projectName: '安东尼·兰多夫', projectPosition: 'PF' },
    ],
    draftPicks: [
      { pick: 1, teamId: 'chi', teamName: '芝加哥公牛', player: { id: 'd_rose_08', name: '德里克·罗斯', position: 'PG', ovr: 80, age: 19, college: '孟菲斯大学', highlights: '状元秀，超凡爆发力与闪电变向', peakAge: 23, peakOvr: 95, peakDuration: 3 } },
      { pick: 2, teamId: 'mia', teamName: '迈阿密热火', player: { id: 'm_beasley_08', name: '迈克尔·比斯利', position: 'PF', ovr: 78, age: 19, college: '堪萨斯州立', highlights: '榜眼秀，单打能力极强的得分机器', peakAge: 25, peakOvr: 84, peakDuration: 4 } },
      { pick: 3, teamId: 'min', teamName: '明尼苏达森林狼', player: { id: 'oj_mayo_08', name: 'O.J. 梅奥', position: 'SG', ovr: 77, age: 20, college: '南加州大学', highlights: '探花秀，成熟的外线跳投和得分技巧', peakAge: 25, peakOvr: 83, peakDuration: 4 } },
      { pick: 4, teamId: 'okc', teamName: '俄克拉荷马雷霆', player: { id: 'r_westbrook_08', name: '拉塞尔·威斯布鲁克', position: 'PG', ovr: 79, age: 19, college: 'UCLA', highlights: '第4顺位，历史级身体素质与冲击力', peakAge: 28, peakOvr: 95, peakDuration: 5 } },
      { pick: 5, teamId: 'mem', teamName: '孟菲斯灰熊', player: { id: 'k_love_08', name: '凯文·乐福', position: 'PF', ovr: 78, age: 19, college: 'UCLA', highlights: '第5顺位，顶级篮板嗅觉与三分离向', peakAge: 26, peakOvr: 91, peakDuration: 6 } },
      { pick: 6, teamId: 'nyk', teamName: '纽约尼克斯', player: { id: 'd_gallinari_08', name: '达尼洛·加里纳利', position: 'SF', ovr: 74, age: 19, college: '意大利', highlights: '第6顺位，高大且投射精准的高位炮台', peakAge: 27, peakOvr: 84, peakDuration: 5 } },
      { pick: 7, teamId: 'lac', teamName: '洛杉矶快船', player: { id: 'e_gordon_08', name: '埃里克·戈登', position: 'SG', ovr: 75, age: 19, college: '印第安纳', highlights: '第7顺位，强壮的攻防一体分卫', peakAge: 26, peakOvr: 85, peakDuration: 5 } },
      { pick: 8, teamId: 'mil', teamName: '密尔沃基雄鹿', player: { id: 'j_alexander_08', name: '乔·亚历山大', position: 'SF', ovr: 71, age: 21, college: '西弗吉尼亚', highlights: '第8顺位，身体素质劲爆的侧翼', peakAge: 25, peakOvr: 76, peakDuration: 3 } },
      { pick: 9, teamId: 'cha', teamName: '夏洛特山猫', player: { id: 'dj_augustin_08', name: 'D.J. 奥古斯丁', position: 'PG', ovr: 73, age: 20, college: '德克萨斯', highlights: '第9顺位，稳健的控球与三分好手', peakAge: 27, peakOvr: 81, peakDuration: 5 } },
      { pick: 10, teamId: 'bkn', teamName: '布鲁克林篮网', player: { id: 'b_lopez_08', name: '布鲁克·洛佩斯', position: 'C', ovr: 77, age: 20, college: '斯坦福', highlights: '第10顺位，扎实的低位技术与护筐能力', peakAge: 28, peakOvr: 88, peakDuration: 7 } },
      { pick: 11, teamId: 'ind', teamName: '印第安纳步行者', player: { id: 'j_bayless_08', name: '杰里德·贝勒斯', position: 'PG', ovr: 73, age: 19, college: '亚利桑那', highlights: '第11顺位，速度飞快的双能卫', peakAge: 26, peakOvr: 80, peakDuration: 4 } },
      { pick: 12, teamId: 'sac', teamName: '萨克拉门托国王', player: { id: 'j_thompson_08', name: '杰森·汤普森', position: 'PF', ovr: 72, age: 21, college: '莱德大学', highlights: '第12顺位，高大的机动型内线', peakAge: 26, peakOvr: 79, peakDuration: 4 } },
      { pick: 13, teamId: 'por', teamName: '波特兰开拓者', player: { id: 'b_rush_08', name: '布兰登·拉什', position: 'SG', ovr: 72, age: 22, college: '堪萨斯', highlights: '第13顺位，优秀的3D侧翼球员', peakAge: 27, peakOvr: 79, peakDuration: 4 } },
      { pick: 14, teamId: 'gsw', teamName: '金州勇士', player: { id: 'a_randolph_08', name: '安东尼·兰多夫', position: 'PF', ovr: 72, age: 18, college: 'LSU', highlights: '第14顺位，天赋异禀的长臂大前锋', peakAge: 24, peakOvr: 80, peakDuration: 4 } },
      { pick: 15, teamId: 'phx', teamName: '菲尼克斯太阳', player: { id: 'r_lopez_08', name: '罗宾·洛佩斯', position: 'C', ovr: 72, age: 20, college: '斯坦福', highlights: '第15顺位，凶悍的挡拆护筐中锋', peakAge: 28, peakOvr: 82, peakDuration: 6 } },
      { pick: 16, teamId: 'phi', teamName: '费城76人', player: { id: 'm_speights_08', name: '马里斯·斯贝茨', position: 'C', ovr: 72, age: 20, college: '佛罗里达', highlights: '第16顺位，拥有柔和投射的中远投大个子', peakAge: 27, peakOvr: 81, peakDuration: 5 } },
      { pick: 17, teamId: 'tor', teamName: '多伦多猛龙', player: { id: 'r_hibbert_08', name: '罗伊·希伯特', position: 'C', ovr: 73, age: 21, college: '乔治城', highlights: '第17顺位，黑姚明，垂直防守神塔', peakAge: 27, peakOvr: 86, peakDuration: 4 } },
      { pick: 18, teamId: 'was', teamName: '华盛顿奇才', player: { id: 'j_mcgee_08', name: '贾维尔·麦基', position: 'C', ovr: 72, age: 20, college: '内华达', highlights: '第18顺位，超强弹跳与吃饼盖帽悍将', peakAge: 28, peakOvr: 82, peakDuration: 5 } },
      { pick: 19, teamId: 'cle', teamName: '克利夫兰骑士', player: { id: 'jj_hickson_08', name: 'J.J. 希克森', position: 'PF', ovr: 71, age: 19, college: '北卡州立', highlights: '第19顺位，能量十足的禁区飞人', peakAge: 25, peakOvr: 80, peakDuration: 4 } },
      { pick: 20, teamId: 'den', teamName: '丹佛掘金', player: { id: 'a_ajinca_08', name: '阿莱克西·阿金萨', position: 'C', ovr: 70, age: 20, college: '法国', highlights: '第20顺位，臂展惊人的高大内线', peakAge: 26, peakOvr: 77, peakDuration: 3 } },
      { pick: 21, teamId: 'dal', teamName: '达拉斯小牛', player: { id: 'r_anderson_08', name: '莱恩·安德森', position: 'PF', ovr: 72, age: 20, college: '加州大学', highlights: '第21顺位，顶级高炮台高产三分手', peakAge: 27, peakOvr: 84, peakDuration: 5 } },
      { pick: 22, teamId: 'orl', teamName: '奥兰多魔术', player: { id: 'c_lee_08', name: '考特尼·李', position: 'SG', ovr: 73, age: 22, college: '西肯塔基', highlights: '第22顺位，冷血三分与锁头防守者', peakAge: 28, peakOvr: 82, peakDuration: 5 } },
      { pick: 23, teamId: 'uta', teamName: '犹他爵士', player: { id: 'k_koufos_08', name: '科斯塔·库佛斯', position: 'C', ovr: 71, age: 19, college: '俄亥俄州立', highlights: '第23顺位，传统勾手与篮板肉盾', peakAge: 27, peakOvr: 79, peakDuration: 4 } },
      { pick: 24, teamId: 'okc', teamName: '俄克拉荷马雷霆', player: { id: 's_ibaka_08', name: '塞尔吉·伊巴卡', position: 'PF', ovr: 75, age: 18, college: '刚果/西班牙', highlights: '第24顺位，盖帽狂人，盖帽王级护筐', peakAge: 26, peakOvr: 88, peakDuration: 6 } },
      { pick: 25, teamId: 'hou', teamName: '休斯顿火箭', player: { id: 'n_batum_08', name: '尼古拉斯·巴图姆', position: 'SF', ovr: 74, age: 19, college: '法国', highlights: '第25顺位，全能法国皮蓬', peakAge: 27, peakOvr: 85, peakDuration: 6 } },
      { pick: 26, teamId: 'sas', teamName: '圣安东尼奥马刺', player: { id: 'g_hill_08', name: '乔治·希尔', position: 'PG', ovr: 74, age: 22, college: '印第安纳波利斯', highlights: '第26顺位，马刺出品，冷静的大心脏控卫', peakAge: 28, peakOvr: 84, peakDuration: 6 } },
      { pick: 27, teamId: 'por', teamName: '波特兰开拓者', player: { id: 'd_arthur_08', name: '达雷尔·亚瑟', position: 'PF', ovr: 71, age: 20, college: '堪萨斯', highlights: '第27顺位，中投精准的矮角内线', peakAge: 26, peakOvr: 78, peakDuration: 4 } },
      { pick: 28, teamId: 'lal', teamName: '洛杉矶湖人', player: { id: 'd_greene_08', name: '丹特·格林', position: 'SF', ovr: 70, age: 20, college: '雪城大学', highlights: '第28顺位，手感柔和的高大前锋', peakAge: 24, peakOvr: 76, peakDuration: 3 } },
      { pick: 29, teamId: 'det', teamName: '底特律活塞', player: { id: 'dj_white_08', name: 'D.J. 怀特', position: 'PF', ovr: 70, age: 21, college: '印第安纳', highlights: '第29顺位，强硬的内线终结者', peakAge: 25, peakOvr: 76, peakDuration: 3 } },
      { pick: 30, teamId: 'bos', teamName: '波士顿凯尔特人', player: { id: 'jr_giddens_08', name: 'J.R. 吉登斯', position: 'SG', ovr: 70, age: 23, college: '新墨西哥', highlights: '第30顺位，身体素质顶级的二号位', peakAge: 25, peakOvr: 75, peakDuration: 3 } },
    ],
  },
  2009: {
    year: 2009,
    lotteryResults: [
      { pick: 1, teamId: 'lac', teamName: '洛杉矶快船', odds: '17.7%', projectName: '布莱克·格里芬', projectPosition: 'PF' },
      { pick: 2, teamId: 'mem', teamName: '孟菲斯灰熊', odds: '13.8%', projectName: '哈希姆·塔比特', projectPosition: 'C' },
      { pick: 3, teamId: 'okc', teamName: '俄克拉荷马雷霆', odds: '13.7%', projectName: '詹姆斯·哈登', projectPosition: 'SG' },
      { pick: 4, teamId: 'sac', teamName: '萨克拉门托国王', odds: '22.5%', projectName: '泰瑞克·埃文斯', projectPosition: 'SG' },
      { pick: 5, teamId: 'min', teamName: '明尼苏达森林狼', odds: '7.6%', projectName: '瑞奇·卢比奥', projectPosition: 'PG' },
      { pick: 6, teamId: 'min', teamName: '明尼苏达森林狼', odds: '7.5%', projectName: '乔尼·弗林', projectPosition: 'PG' },
      { pick: 7, teamId: 'gsw', teamName: '金州勇士', odds: '4.3%', projectName: '斯蒂芬·库里', projectPosition: 'PG' },
      { pick: 8, teamId: 'nyk', teamName: '纽约尼克斯', odds: '2.8%', projectName: '乔丹·希尔', projectPosition: 'PF' },
      { pick: 9, teamId: 'tor', teamName: '多伦多猛龙', odds: '1.7%', projectName: '德玛尔·德罗赞', projectPosition: 'SG' },
      { pick: 10, teamId: 'mil', teamName: '密尔沃基雄鹿', odds: '1.0%', projectName: '布兰登·詹宁斯', projectPosition: 'PG' },
      { pick: 11, teamId: 'bkn', teamName: '布鲁克林篮网', odds: '0.8%', projectName: '特伦斯·威廉姆斯', projectPosition: 'SG' },
      { pick: 12, teamId: 'cha', teamName: '夏洛特山猫', odds: '0.7%', projectName: '杰拉德·亨德森', projectPosition: 'SG' },
      { pick: 13, teamId: 'ind', teamName: '印第安纳步行者', odds: '0.6%', projectName: '泰勒·汉斯布鲁', projectPosition: 'PF' },
      { pick: 14, teamId: 'phx', teamName: '菲尼克斯太阳', odds: '0.5%', projectName: '厄尔·克拉克', projectPosition: 'SF' },
    ],
    draftPicks: [
      { pick: 1, teamId: 'lac', teamName: '洛杉矶快船', player: { id: 'b_griffin_09', name: '布莱克·格里芬', position: 'PF', ovr: 81, age: 20, college: '俄克拉荷马大学', highlights: '状元秀，野兽级弹跳与扣篮之王', peakAge: 25, peakOvr: 93, peakDuration: 5 } },
      { pick: 2, teamId: 'mem', teamName: '孟菲斯灰熊', player: { id: 'h_thabeet_09', name: '哈希姆·塔比特', position: 'C', ovr: 72, age: 22, college: '康涅狄格', highlights: '榜眼秀，高大的封盖专家', peakAge: 25, peakOvr: 78, peakDuration: 3 } },
      { pick: 3, teamId: 'okc', teamName: '俄克拉荷马雷霆', player: { id: 'j_harden_09', name: '詹姆斯·哈登', position: 'SG', ovr: 78, age: 19, college: '亚利桑那州立', highlights: '探花秀，后撤步与节奏变向造犯规大师', peakAge: 28, peakOvr: 96, peakDuration: 6 } },
      { pick: 4, teamId: 'sac', teamName: '萨克拉门托国王', player: { id: 't_evans_09', name: '泰瑞克·埃文斯', position: 'SG', ovr: 77, age: 19, college: '孟菲斯', highlights: '第4顺位，重型突破分卫，20+5+5新秀表现', peakAge: 25, peakOvr: 86, peakDuration: 4 } },
      { pick: 5, teamId: 'min', teamName: '明尼苏达森林狼', player: { id: 'r_rubio_09', name: '瑞奇·卢比奥', position: 'PG', ovr: 76, age: 18, college: '西班牙', highlights: '第5顺位，金童卢比奥，魔幻传球大师', peakAge: 26, peakOvr: 86, peakDuration: 5 } },
      { pick: 6, teamId: 'min', teamName: '明尼苏达森林狼', player: { id: 'j_flynn_09', name: '乔尼·弗林', position: 'PG', ovr: 74, age: 20, college: '雪城', highlights: '第6顺位，爆发力出色的矮个控卫', peakAge: 24, peakOvr: 79, peakDuration: 3 } },
      { pick: 7, teamId: 'gsw', teamName: '金州勇士', player: { id: 's_curry_09', name: '斯蒂芬·库里', position: 'PG', ovr: 80, age: 21, college: '戴维森学院', highlights: '第7顺位，历史级三分神射，改变时代的超级巨星', peakAge: 28, peakOvr: 98, peakDuration: 6 } },
      { pick: 8, teamId: 'nyk', teamName: '纽约尼克斯', player: { id: 'j_hill_09', name: '乔丹·希尔', position: 'PF', ovr: 72, age: 21, college: '亚利桑那', highlights: '第8顺位，勤勉的前场篮板抓手', peakAge: 26, peakOvr: 79, peakDuration: 4 } },
      { pick: 9, teamId: 'tor', teamName: '多伦多猛龙', player: { id: 'd_derozan_09', name: '德玛尔·德罗赞', position: 'SG', ovr: 76, age: 19, college: 'USC', highlights: '第9顺位，中距离复古单打王', peakAge: 28, peakOvr: 92, peakDuration: 6 } },
      { pick: 10, teamId: 'mil', teamName: '密尔沃基雄鹿', player: { id: 'b_jennings_09', name: '布兰登·詹宁斯', position: 'PG', ovr: 76, age: 19, college: '罗马', highlights: '第10顺位，单场55分超级新秀', peakAge: 25, peakOvr: 85, peakDuration: 4 } },
      { pick: 11, teamId: 'bkn', teamName: '布鲁克林篮网', player: { id: 't_williams_09', name: '特伦斯·威廉姆斯', position: 'SG', ovr: 73, age: 21, college: '路易斯维尔', highlights: '第11顺位，全能型劲爆飞人', peakAge: 25, peakOvr: 79, peakDuration: 3 } },
      { pick: 12, teamId: 'cha', teamName: '夏洛特山猫', player: { id: 'g_henderson_09', name: '杰拉德·亨德森', position: 'SG', ovr: 73, age: 21, college: '杜克', highlights: '第12顺位，体能出色的3D侧翼', peakAge: 27, peakOvr: 81, peakDuration: 5 } },
      { pick: 13, teamId: 'ind', teamName: '印第安纳步行者', player: { id: 't_hansbrough_09', name: '泰勒·汉斯布鲁', position: 'PF', ovr: 72, age: 23, college: '北卡罗来纳', highlights: '第13顺位，大学传说“Psycho T”', peakAge: 26, peakOvr: 79, peakDuration: 4 } },
      { pick: 14, teamId: 'phx', teamName: '菲尼克斯太阳', player: { id: 'e_clark_09', name: '厄尔·克拉克', position: 'SF', ovr: 71, age: 21, college: '路易斯维尔', highlights: '第14顺位，机动型侧翼前锋', peakAge: 26, peakOvr: 78, peakDuration: 3 } },
      { pick: 15, teamId: 'det', teamName: '底特律活塞', player: { id: 'a_daye_09', name: '奥斯汀·达耶', position: 'SF', ovr: 71, age: 21, college: '冈萨加', highlights: '第15顺位，高瘦型投手前锋', peakAge: 26, peakOvr: 77, peakDuration: 3 } },
      { pick: 16, teamId: 'chi', teamName: '芝加哥公牛', player: { id: 'j_johnson_09', name: '詹姆斯·约翰逊', position: 'SF', ovr: 72, age: 22, college: '维克森林', highlights: '第16顺位，防守硬汉，跆拳道黑带', peakAge: 28, peakOvr: 81, peakDuration: 5 } },
      { pick: 17, teamId: 'phi', teamName: '费城76人', player: { id: 'j_holiday_09', name: '朱·霍勒迪', position: 'PG', ovr: 75, age: 19, college: 'UCLA', highlights: '第17顺位，冠军大闸，顶级防守与关键控卫', peakAge: 28, peakOvr: 89, peakDuration: 6 } },
      { pick: 18, teamId: 'min', teamName: '明尼苏达森林狼', player: { id: 't_lawson_09', name: '泰·劳森', position: 'PG', ovr: 74, age: 21, college: '北卡罗来纳', highlights: '第18顺位，小钢炮速度型控卫', peakAge: 26, peakOvr: 86, peakDuration: 4 } },
      { pick: 19, teamId: 'atl', teamName: '亚特兰大老鹰', player: { id: 'j_teague_09', name: '杰夫·蒂格', position: 'PG', ovr: 74, age: 21, college: '维克森林', highlights: '第19顺位，全明星控卫，挡拆加速专家', peakAge: 27, peakOvr: 85, peakDuration: 5 } },
      { pick: 20, teamId: 'uta', teamName: '犹他爵士', player: { id: 'e_maynor_09', name: '埃里克·梅诺', position: 'PG', ovr: 72, age: 22, college: 'VCU', highlights: '第20顺位，稳健的第二阵容指挥官', peakAge: 26, peakOvr: 79, peakDuration: 4 } },
      { pick: 21, teamId: 'noh', teamName: '新奥尔良黄蜂', player: { id: 'd_collison_09', name: '达伦·科里森', position: 'PG', ovr: 73, age: 21, college: 'UCLA', highlights: '第21顺位，速度飞快的指挥官', peakAge: 27, peakOvr: 83, peakDuration: 5 } },
      { pick: 22, teamId: 'por', teamName: '波特兰开拓者', player: { id: 'v_claver_09', name: '维克多·克拉夫', position: 'SF', ovr: 70, age: 20, college: '西班牙', highlights: '第22顺位，西班牙高大前锋', peakAge: 26, peakOvr: 76, peakDuration: 3 } },
      { pick: 23, teamId: 'sac', teamName: '萨克拉门托国王', player: { id: 'o_casspi_09', name: '欧米尔·卡斯比', position: 'SF', ovr: 72, age: 20, college: '以色列', highlights: '第23顺位，以色列三分神射', peakAge: 27, peakOvr: 80, peakDuration: 5 } },
      { pick: 24, teamId: 'dal', teamName: '达拉斯小牛', player: { id: 'b_mullens_09', name: 'B.J. 穆伦斯', position: 'C', ovr: 71, age: 20, college: '俄亥俄州立', highlights: '第24顺位，具备三分投射的七尺大个', peakAge: 25, peakOvr: 78, peakDuration: 3 } },
      { pick: 25, teamId: 'okc', teamName: '俄克拉荷马雷霆', player: { id: 'r_beaubois_09', name: '罗德里格·布博瓦', position: 'PG', ovr: 72, age: 21, college: '法国', highlights: '第25顺位，臂展惊人的法国闪电', peakAge: 25, peakOvr: 81, peakDuration: 3 } },
      { pick: 26, teamId: 'chi', teamName: '芝加哥公牛', player: { id: 't_gibson_09', name: '泰·吉布森', position: 'PF', ovr: 74, age: 23, college: 'USC', highlights: '第26顺位，铁血硬汉，防守与中投大前锋', peakAge: 28, peakOvr: 83, peakDuration: 6 } },
      { pick: 27, teamId: 'mem', teamName: '孟菲斯灰熊', player: { id: 'd_carroll_09', name: '德马尔·卡罗尔', position: 'SF', ovr: 72, age: 22, college: '密苏里', highlights: '第27顺位，真汉子“卡罗尔”，顶级3D锁头', peakAge: 28, peakOvr: 83, peakDuration: 5 } },
      { pick: 28, teamId: 'min', teamName: '明尼苏达森林狼', player: { id: 'w_ellington_09', name: '韦恩·艾灵顿', position: 'SG', ovr: 71, age: 21, college: '北卡罗来纳', highlights: '第28顺位，无球跑位三分神射手', peakAge: 28, peakOvr: 80, peakDuration: 5 } },
      { pick: 29, teamId: 'lal', teamName: '洛杉矶湖人', player: { id: 't_douglas_09', name: '托尼·道格拉斯', position: 'PG', ovr: 71, age: 23, college: '佛罗里达州立', highlights: '第29顺位，防守凶悍的替补双能卫', peakAge: 26, peakOvr: 78, peakDuration: 4 } },
      { pick: 30, teamId: 'cle', teamName: '克利夫兰骑士', player: { id: 'd_green_09', name: '丹尼·格林', position: 'SG', ovr: 72, age: 22, college: '北卡罗来纳大学', highlights: '第46顺位大逆袭！丹尼·格林！三冠3D神射手，外线铁闸与冷血三分', peakAge: 27, peakOvr: 85, peakDuration: 6 } },
    ],
  },
  2010: {
    year: 2010,
    lotteryResults: [
      { pick: 1, teamId: 'was', teamName: '华盛顿奇才', odds: '10.3%', projectName: '约翰·沃尔', projectPosition: 'PG' },
      { pick: 2, teamId: 'phi', teamName: '费城76人', odds: '5.3%', projectName: '埃文·特纳', projectPosition: 'SG' },
      { pick: 3, teamId: 'bkn', teamName: '布鲁克林篮网', odds: '25.0%', projectName: '德里克·费沃斯', projectPosition: 'PF' },
      { pick: 4, teamId: 'min', teamName: '明尼苏达森林狼', odds: '19.9%', projectName: '韦斯利·约翰逊', projectPosition: 'SF' },
      { pick: 5, teamId: 'sac', teamName: '萨克拉门托国王', odds: '13.8%', projectName: '德马库斯·考辛斯', projectPosition: 'C' },
      { pick: 6, teamId: 'gsw', teamName: '金州勇士', odds: '7.6%', projectName: '埃佩·尤度', projectPosition: 'C' },
      { pick: 7, teamId: 'det', teamName: '底特律活塞', odds: '4.3%', projectName: '葛雷格·门罗', projectPosition: 'C' },
      { pick: 8, teamId: 'lac', teamName: '洛杉矶快船', odds: '2.8%', projectName: '艾尔-法鲁克·阿米努', projectPosition: 'SF' },
      { pick: 9, teamId: 'uta', teamName: '犹他爵士', odds: '1.7%', projectName: '戈登·海沃德', projectPosition: 'SF' },
      { pick: 10, teamId: 'ind', teamName: '印第安纳步行者', odds: '1.0%', projectName: '保罗·乔治', projectPosition: 'SF' },
      { pick: 11, teamId: 'noh', teamName: '新奥尔良黄蜂', odds: '0.8%', projectName: '科尔·阿尔德里奇', projectPosition: 'C' },
      { pick: 12, teamId: 'lac', teamName: '洛杉矶快船', odds: '0.7%', projectName: '埃里克·布莱索', projectPosition: 'PG' },
      { pick: 13, teamId: 'tor', teamName: '多伦多猛龙', odds: '0.6%', projectName: '埃德·戴维斯', projectPosition: 'PF' },
      { pick: 14, teamId: 'hou', teamName: '休斯顿火箭', odds: '0.5%', projectName: '帕特里克·帕特森', projectPosition: 'PF' },
    ],
    draftPicks: [
      { pick: 1, teamId: 'was', teamName: '华盛顿奇才', player: { id: 'j_wall_10', name: '约翰·沃尔', position: 'PG', ovr: 81, age: 19, college: '肯塔基大学', highlights: '状元秀，全联盟最快的闪电控卫', peakAge: 26, peakOvr: 92, peakDuration: 5 } },
      { pick: 2, teamId: 'phi', teamName: '费城76人', player: { id: 'e_turner_10', name: '埃文·特纳', position: 'SG', ovr: 76, age: 21, college: '俄亥俄州立', highlights: '榜眼秀，大学全能MVP', peakAge: 26, peakOvr: 83, peakDuration: 4 } },
      { pick: 3, teamId: 'bkn', teamName: '布鲁克林篮网', player: { id: 'd_favors_10', name: '德里克·费沃斯', position: 'PF', ovr: 76, age: 18, college: '佐治亚理工', highlights: '探花秀，防守坚实的大前锋', peakAge: 26, peakOvr: 86, peakDuration: 6 } },
      { pick: 4, teamId: 'min', teamName: '明尼苏达森林狼', player: { id: 'w_johnson_10', name: '韦斯利·约翰逊', position: 'SF', ovr: 73, age: 22, college: '雪城', highlights: '第4顺位，运动型侧翼', peakAge: 26, peakOvr: 80, peakDuration: 4 } },
      { pick: 5, teamId: 'sac', teamName: '萨克拉门托国王', player: { id: 'd_cousins_10', name: '德马库斯·考辛斯', position: 'C', ovr: 79, age: 19, college: '肯塔基', highlights: '第5顺位，表妹！统治级低位与全能中锋', peakAge: 26, peakOvr: 93, peakDuration: 5 } },
      { pick: 6, teamId: 'gsw', teamName: '金州勇士', player: { id: 'e_udoh_10', name: '埃佩·尤度', position: 'C', ovr: 72, age: 23, college: '贝勒', highlights: '第6顺位，盖帽专家', peakAge: 26, peakOvr: 78, peakDuration: 3 } },
      { pick: 7, teamId: 'det', teamName: '底特律活塞', player: { id: 'g_monroe_10', name: '葛雷格·门罗', position: 'C', ovr: 76, age: 20, college: '乔治城', highlights: '第7顺位，左手低位得分与传球策应内线', peakAge: 25, peakOvr: 86, peakDuration: 5 } },
      { pick: 8, teamId: 'lac', teamName: '洛杉矶快船', player: { id: 'a_aminu_10', name: '艾尔-法鲁克·阿米努', position: 'SF', ovr: 73, age: 19, college: '维克森林', highlights: '第8顺位，长臂防守防守专家', peakAge: 27, peakOvr: 82, peakDuration: 5 } },
      { pick: 9, teamId: 'uta', teamName: '犹他爵士', player: { id: 'g_hayward_10', name: '戈登·海沃德', position: 'SF', ovr: 76, age: 20, college: '巴特勒大学', highlights: '第9顺位，白人帅哥全能小前锋', peakAge: 27, peakOvr: 90, peakDuration: 5 } },
      { pick: 10, teamId: 'ind', teamName: '印第安纳步行者', player: { id: 'p_george_10', name: '保罗·乔治', position: 'SF', ovr: 78, age: 20, college: '弗雷斯诺州立', highlights: '第10顺位，PG13！攻防一体超级巨星', peakAge: 28, peakOvr: 94, peakDuration: 6 } },
      { pick: 11, teamId: 'noh', teamName: '新奥尔良黄蜂', player: { id: 'c_aldrich_10', name: '科尔·阿尔德里奇', position: 'C', ovr: 71, age: 21, college: '堪萨斯', highlights: '第11顺位，护筐型大个子', peakAge: 26, peakOvr: 77, peakDuration: 3 } },
      { pick: 12, teamId: 'lac', teamName: '洛杉矶快船', player: { id: 'e_bledsoe_10', name: '埃里克·布莱索', position: 'PG', ovr: 74, age: 20, college: '肯塔基', highlights: '第12顺位，血布！小勒布朗重型控卫', peakAge: 28, peakOvr: 87, peakDuration: 5 } },
      { pick: 13, teamId: 'tor', teamName: '多伦多猛龙', player: { id: 'e_davis_10', name: '埃德·戴维斯', position: 'PF', ovr: 73, age: 21, college: '北卡罗来纳', highlights: '第13顺位，二次进攻与篮板机器', peakAge: 27, peakOvr: 81, peakDuration: 5 } },
      { pick: 14, teamId: 'hou', teamName: '休斯顿火箭', player: { id: 'p_patterson_10', name: '帕特里克·帕特森', position: 'PF', ovr: 72, age: 21, college: '肯塔基', highlights: '第14顺位，空间型大前锋', peakAge: 27, peakOvr: 80, peakDuration: 4 } },
      { pick: 15, teamId: 'mil', teamName: '密尔沃基雄鹿', player: { id: 'l_sanders_10', name: '拉里·桑德斯', position: 'C', ovr: 73, age: 21, college: 'VCU', highlights: '第15顺位，盖帽天王“诗人和盖帽狂”', peakAge: 25, peakOvr: 85, peakDuration: 3 } },
      { pick: 16, teamId: 'min', teamName: '明尼苏达森林狼', player: { id: 'l_babbitt_10', name: '卢克·巴比特', position: 'SF', ovr: 71, age: 21, college: '内华达', highlights: '第16顺位，高位三分神射', peakAge: 26, peakOvr: 77, peakDuration: 3 } },
      { pick: 17, teamId: 'chi', teamName: '芝加哥公牛', player: { id: 'k_seraphin_10', name: '凯文·塞拉芬', position: 'PF', ovr: 71, age: 20, college: '法国', highlights: '第17顺位，法国低位硬汉', peakAge: 25, peakOvr: 78, peakDuration: 4 } },
      { pick: 18, teamId: 'mia', teamName: '迈阿密热火', player: { id: 'd_pittman_10', name: '德克斯特·皮特曼', position: 'C', ovr: 69, age: 22, college: '德克萨斯', highlights: '第18顺位，重型肉盾中锋', peakAge: 25, peakOvr: 74, peakDuration: 2 } },
      { pick: 19, teamId: 'bos', teamName: '波士顿凯尔特人', player: { id: 'a_bradley_10', name: '埃弗里·布拉德利', position: 'SG', ovr: 74, age: 19, college: '德克萨斯', highlights: '第19顺位，死亡缠绕防守全明星分卫', peakAge: 27, peakOvr: 85, peakDuration: 6 } },
      { pick: 20, teamId: 'sas', teamName: '圣安东尼奥马刺', player: { id: 'j_anderson_10', name: '詹姆斯·安德森', position: 'SG', ovr: 71, age: 21, college: '俄克拉荷马州立', highlights: '第20顺位，马刺选中体能型侧翼', peakAge: 25, peakOvr: 78, peakDuration: 3 } },
      { pick: 21, teamId: 'okc', teamName: '俄克拉荷马雷霆', player: { id: 'c_craig_10', name: '克雷格·布莱金斯', position: 'PF', ovr: 70, age: 22, college: '爱荷华州立', highlights: '第21顺位，空间大前锋', peakAge: 25, peakOvr: 76, peakDuration: 3 } },
      { pick: 22, teamId: 'por', teamName: '波特兰开拓者', player: { id: 'e_elliott_10', name: '埃利奥特·威廉姆斯', position: 'SG', ovr: 70, age: 21, college: '孟菲斯', highlights: '第22顺位，爆发力极强的后卫', peakAge: 25, peakOvr: 76, peakDuration: 3 } },
      { pick: 23, teamId: 'min', teamName: '明尼苏达森林狼', player: { id: 't_booker_10', name: '特雷沃·布克', position: 'PF', ovr: 72, age: 22, college: '克莱姆森', highlights: '第23顺位，强硬暴力扣将与盖帽手', peakAge: 27, peakOvr: 81, peakDuration: 5 } },
      { pick: 24, teamId: 'atl', teamName: '亚特兰大老鹰', player: { id: 'd_james_10', name: '达米安·詹姆斯', position: 'SF', ovr: 70, age: 22, college: '德克萨斯', highlights: '第24顺位，全能型大前锋/小前锋', peakAge: 25, peakOvr: 76, peakDuration: 3 } },
      { pick: 25, teamId: 'mem', teamName: '孟菲斯灰熊', player: { id: 'g_vasquez_10', name: '德芒特·多齐尔', position: 'PG', ovr: 72, age: 23, college: '马里兰', highlights: '第25顺位，高大助攻型控卫', peakAge: 27, peakOvr: 82, peakDuration: 4 } },
      { pick: 26, teamId: 'okc', teamName: '俄克拉荷马雷霆', player: { id: 'q_pondexter_10', name: '昆西·庞德塞特', position: 'SF', ovr: 71, age: 22, college: '华盛顿', highlights: '第26顺位，稳定3D功臣', peakAge: 27, peakOvr: 79, peakDuration: 5 } },
      { pick: 27, teamId: 'njn', teamName: '布鲁克林篮网', player: { id: 'j_crawford_10', name: '乔丹·克劳福德', position: 'SG', ovr: 72, age: 21, college: '泽维尔', highlights: '第27顺位，神经刀级神经质神射手', peakAge: 26, peakOvr: 82, peakDuration: 4 } },
      { pick: 28, teamId: 'mem', teamName: '孟菲斯灰熊', player: { id: 'g_vasquez_mem_10', name: '格雷维斯·瓦斯奎兹', position: 'PG', ovr: 72, age: 23, college: '马里兰', highlights: '第28顺位，高智商高传球控卫', peakAge: 27, peakOvr: 82, peakDuration: 4 } },
      { pick: 29, teamId: 'orl', teamName: '奥兰多魔术', player: { id: 'd_orton_10', name: '丹尼尔·欧顿', position: 'C', ovr: 69, age: 19, college: '肯塔基', highlights: '第29顺位，防守型蓝领内线', peakAge: 24, peakOvr: 75, peakDuration: 3 } },
      { pick: 30, teamId: 'was', teamName: '华盛顿奇才', player: { id: 'l_hayward_10', name: '拉扎尔·海沃德', position: 'SF', ovr: 69, age: 23, college: '马凯特', highlights: '第30顺位，体能型前锋', peakAge: 25, peakOvr: 75, peakDuration: 3 } },
    ],
  },
  ...DRAFTS_2011_TO_2015,
  ...DRAFTS_2016_TO_2020,
  ...DRAFTS_2021_TO_2025,
  ...DRAFTS_2026,
};

/**
 * Gets draft data for a given draft year (e.g. 2008, 2009, 2010...)
 * Returns null if no draft data exists for that year.
 */
export function getHistoricalDraftData(year: number): YearDraftData | null {
  if (!HISTORICAL_DRAFTS[year]) {
    return null;
  }
  const rawData = HISTORICAL_DRAFTS[year];

  // Normalize 'nop' teamId to 'noh' because Pelicans keep the 'noh' team ID in the active roster data
  return {
    ...rawData,
    lotteryResults: rawData.lotteryResults.map((item) => ({
      ...item,
      teamId: item.teamId === 'nop' ? 'noh' : item.teamId,
    })),
    draftPicks: rawData.draftPicks.map((item) => ({
      ...item,
      teamId: item.teamId === 'nop' ? 'noh' : item.teamId,
    })),
  };
}
