import type { Position } from '../../types';
import type { DraftPickItem, YearDraftData } from '../draftData';

type ProspectSeed = [string, Position, string, number, number, string, string];

const TEAM_NAMES: Record<string, string> = {
  was: '华盛顿奇才', uta: '犹他爵士', mem: '孟菲斯灰熊', chi: '芝加哥公牛', lac: '洛杉矶快船',
  bkn: '布鲁克林篮网', sac: '萨克拉门托国王', atl: '亚特兰大老鹰', dal: '达拉斯独行侠', mil: '密尔沃基雄鹿',
  gsw: '金州勇士', okc: '俄克拉荷马雷霆', mia: '迈阿密热火', cha: '夏洛特黄蜂', tor: '多伦多猛龙',
  sas: '圣安东尼奥马刺', det: '底特律活塞', phi: '费城76人', nyk: '纽约尼克斯', lal: '洛杉矶湖人',
  den: '丹佛掘金', bos: '波士顿凯尔特人', min: '明尼苏达森林狼', cle: '克利夫兰骑士',
};

const TEAM_ORDER = ['was', 'uta', 'mem', 'chi', 'lac', 'bkn', 'sac', 'atl', 'dal', 'mil', 'gsw', 'okc', 'mia', 'cha', 'chi', 'mem', 'okc', 'cha', 'tor', 'sas', 'det', 'phi', 'atl', 'nyk', 'lal', 'den', 'bos', 'min', 'cle', 'dal'];

// 2026 official first-round class. OVR and development ceilings are game-balance values.
const PROSPECTS: ProspectSeed[] = [
  ['AJ·迪班萨', 'SF', '杨百翰大学', 82, 97, '攻防一体的头号侧翼', 'aj_dybantsa'],
  ['达林·彼得森', 'SG', '堪萨斯大学', 81, 96, '拥有顶级持球创造力的双能卫', 'darryn_peterson'],
  ['卡梅隆·布泽尔', 'PF', '杜克大学', 81, 95, '技术全面且成熟的锋线核心', 'cameron_boozer'],
  ['凯莱布·威尔逊', 'PF', '北卡罗来纳大学', 79, 92, '机动性与防守覆盖出色', 'caleb_wilson'],
  ['基顿·瓦格勒', 'SG', '伊利诺伊大学', 78, 89, '尺寸优秀的全能后卫', 'keaton_wagler'],
  ['米克尔·布朗二世', 'PG', '路易斯维尔大学', 79, 92, '速度与组织兼备的控卫', 'mikel_brown'],
  ['达里厄斯·阿库夫', 'PG', '阿肯色大学', 78, 90, '侵略性十足的持球手', 'darius_acuff'],
  ['金斯顿·弗莱明斯', 'PG', '休斯顿大学', 77, 89, '防守强硬的高大控卫', 'kingston_flemings'],
  ['莫雷兹·约翰逊二世', 'C', '密歇根大学', 76, 86, '篮板与护筐型内线', 'morez_johnson'],
  ['布雷登·伯里斯', 'SG', '亚利桑那大学', 77, 88, '得分手段丰富的侧翼后卫', 'brayden_burries'],
  ['亚克塞尔·伦德伯格', 'PF', '密歇根大学', 76, 86, '即战力出色的多面手', 'yaxel_lendeborg'],
  ['阿代·马拉', 'C', '密歇根大学', 76, 87, '拥有策应能力的高大中锋', 'aday_mara'],
  ['内特·阿门特', 'SF', '田纳西大学', 77, 90, '投射与尺寸兼备的前锋', 'nate_ament'],
  ['汉内斯·施泰因巴赫', 'C', '华盛顿大学', 75, 85, '强硬高效的禁区终结者', 'hannes_steinbach'],
  ['戴林·斯温', 'SF', '德克萨斯大学', 75, 85, '能换防多个位置的锋线', 'dailyn_swain'],
  ['本内特·斯蒂尔茨', 'PG', '爱荷华大学', 75, 84, '成熟稳健的挡拆组织者', 'bennett_stirtz'],
  ['埃布卡·奥科里', 'PG', '斯坦福大学', 74, 84, '突破能力突出的年轻后卫', 'ebuka_okorie'],
  ['克里斯蒂安·安德森', 'PG', '德州理工大学', 74, 83, '快速灵活的投射型控卫', 'christian_anderson'],
  ['阿伦·格雷夫斯', 'PF', '圣克拉拉大学', 74, 84, '空间与篮板兼备的前锋', 'allen_graves'],
  ['杰登·奎坦斯', 'C', '肯塔基大学', 76, 89, '运动能力突出的防守内线', 'jayden_quaintance'],
  ['卡里姆·洛佩斯', 'SF', '新西兰破坏者', 75, 88, '技术全面的国际锋线', 'karim_lopez'],
  ['拉巴伦·菲隆二世', 'PG', '阿拉巴马大学', 75, 86, '节奏感出色的突破手', 'labaron_philon'],
  ['祖比·埃吉奥福', 'PF', '圣约翰大学', 73, 82, '强硬可靠的蓝领内线', 'zuby_ejiofor'],
  ['卡梅隆·卡尔', 'SG', '贝勒大学', 74, 84, '兼具运动能力和投射的后卫', 'cameron_carr'],
  ['塞尔希奥·德拉雷亚', 'PG', '瓦伦西亚', 74, 86, '视野开阔的国际控卫', 'sergio_de_larrea'],
  ['塔里斯·里德二世', 'C', '康涅狄格大学', 73, 82, '篮板和掩护扎实的中锋', 'tarris_reed'],
  ['克里斯·塞纳克二世', 'C', '休斯顿大学', 76, 89, '具备空间潜力的长人', 'chris_cenac'],
  ['约书亚·杰弗森', 'PF', '爱荷华州立大学', 73, 83, '球风聪明的全能前锋', 'joshua_jefferson'],
  ['亚历克斯·卡拉班', 'SF', '康涅狄格大学', 73, 82, '经验丰富的空间型前锋', 'alex_karaban'],
  ['科阿·皮特', 'PF', '亚利桑那大学', 75, 88, '力量出众的锋线终结者', 'koa_peat'],
];

const draftPicks: DraftPickItem[] = PROSPECTS.map(([name, position, college, ovr, peakOvr, highlights, id], index) => {
  const teamId = TEAM_ORDER[index];
  return {
    pick: index + 1,
    teamId,
    teamName: TEAM_NAMES[teamId],
    player: { id: `${id}_26`, name, position, ovr, age: index < 15 ? 19 : 20, college, highlights, peakAge: 26, peakOvr, peakDuration: peakOvr >= 90 ? 6 : 4 },
  };
});

export const DRAFTS_2026: Record<number, YearDraftData> = {
  2026: {
    year: 2026,
    lotteryResults: draftPicks.slice(0, 14).map((item) => ({
      pick: item.pick,
      teamId: item.teamId,
      teamName: item.teamName,
      odds: '官方选秀顺位',
      projectName: item.player.name,
      projectPosition: item.player.position,
    })),
    draftPicks,
  },
};
