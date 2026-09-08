const fs = require('fs');

function calculateDynamicOvr(age, peakAge, peakOvr, peakDuration) {
  const safeAge = age || 25;
  const safePeakAge = peakAge || 27;
  const safePeakOvr = peakOvr || 75;
  const safePeakDuration = peakDuration || 5;

  const peakEndAge = safePeakAge + safePeakDuration - 1;

  if (safeAge >= safePeakAge && safeAge <= peakEndAge) {
    return Math.min(99, Math.max(60, Math.round(safePeakOvr)));
  } else if (safeAge < safePeakAge) {
    const diff = safePeakAge - safeAge;
    const growthDrop = Math.pow(diff, 1.05) * 2.0;
    return Math.min(99, Math.max(60, Math.round(safePeakOvr - growthDrop)));
  } else {
    const yearsPast = safeAge - peakEndAge;
    const declineDrop = Math.pow(yearsPast, 1.2) * 2.3;
    return Math.min(99, Math.max(60, Math.round(safePeakOvr - declineDrop)));
  }
}

// Complete 30 NBA Teams in 2008-09 season with 15 real historical players each
const TEAMS_DATA = [
  {
    id: 'bos', name: '波士顿凯尔特人', city: 'Boston', abbrev: 'BOS', logo: '/logos/bos.png', primaryColor: '#008348', secondaryColor: '#BB9753', rating: 93, conference: 'East', starPlayer: '加内特 & 皮尔斯 & 雷·阿伦', wins: 62, losses: 20,
    roster: [
      { id: 'b1', name: '凯文·加内特', position: 'PF', age: 32, peakAge: 27, peakOvr: 98, peakDuration: 6, isStar: true },
      { id: 'b2', name: '保罗·皮尔斯', position: 'SF', age: 31, peakAge: 28, peakOvr: 93, peakDuration: 5, isStar: true },
      { id: 'b3', name: '雷·阿伦', position: 'SG', age: 33, peakAge: 27, peakOvr: 93, peakDuration: 6, isStar: true },
      { id: 'b4', name: '拉简·隆多', position: 'PG', age: 22, peakAge: 26, peakOvr: 89, peakDuration: 6 },
      { id: 'b5', name: '肯德里克·帕金斯', position: 'C', age: 24, peakAge: 26, peakOvr: 80, peakDuration: 5 },
      { id: 'b6', name: '托尼·阿伦', position: 'SG', age: 26, peakAge: 28, peakOvr: 80, peakDuration: 6 },
      { id: 'b7', name: '莱昂·鲍威', position: 'PF', age: 24, peakAge: 26, peakOvr: 77, peakDuration: 4 },
      { id: 'b8', name: '埃迪·豪斯', position: 'PG', age: 30, peakAge: 28, peakOvr: 77, peakDuration: 5 },
      { id: 'b9', name: '萨姆·卡塞尔', position: 'PG', age: 39, peakAge: 28, peakOvr: 88, peakDuration: 6 },
      { id: 'b10', name: '布莱恩·斯卡拉布莱恩', position: 'PF', age: 30, peakAge: 27, peakOvr: 73, peakDuration: 5 },
      { id: 'b11', name: '米基·摩尔', position: 'C', age: 33, peakAge: 29, peakOvr: 76, peakDuration: 4 },
      { id: 'b12', name: 'J.R. 吉登斯', position: 'SG', age: 23, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'b13', name: '帕特里克·奥布莱恩特', position: 'C', age: 22, peakAge: 25, peakOvr: 74, peakDuration: 4 },
      { id: 'b14', name: '加布·普鲁伊特', position: 'PG', age: 22, peakAge: 25, peakOvr: 72, peakDuration: 4 },
      { id: 'b15', name: '比尔·沃克', position: 'SF', age: 21, peakAge: 26, peakOvr: 75, peakDuration: 5 }
    ]
  },
  {
    id: 'lal', name: '洛杉矶湖人', city: 'Los Angeles', abbrev: 'LAL', logo: '/logos/lal.png', primaryColor: '#552583', secondaryColor: '#FDB927', rating: 94, conference: 'West', starPlayer: '科比·布莱恩特', wins: 65, losses: 17,
    roster: [
      { id: 'l1', name: '科比·布莱恩特', position: 'SG', age: 30, peakAge: 27, peakOvr: 98, peakDuration: 6, isStar: true },
      { id: 'l2', name: '保罗·加索尔', position: 'PF', age: 28, peakAge: 28, peakOvr: 92, peakDuration: 6, isStar: true },
      { id: 'l3', name: '拉马尔·奥多姆', position: 'SF', age: 29, peakAge: 26, peakOvr: 87, peakDuration: 5 },
      { id: 'l4', name: '安德鲁·拜纳姆', position: 'C', age: 21, peakAge: 24, peakOvr: 88, peakDuration: 4 },
      { id: 'l5', name: '德里克·费舍尔', position: 'PG', age: 34, peakAge: 28, peakOvr: 82, peakDuration: 6 },
      { id: 'l6', name: '特雷沃·阿里扎', position: 'SF', age: 23, peakAge: 27, peakOvr: 83, peakDuration: 6 },
      { id: 'l7', name: '卢克·沃顿', position: 'SF', age: 28, peakAge: 27, peakOvr: 77, peakDuration: 4 },
      { id: 'l8', name: '萨沙·武贾西奇', position: 'SG', age: 24, peakAge: 26, peakOvr: 77, peakDuration: 5 },
      { id: 'l9', name: '乔丹·法玛尔', position: 'PG', age: 22, peakAge: 26, peakOvr: 79, peakDuration: 5 },
      { id: 'l10', name: '香农·布朗', position: 'SG', age: 23, peakAge: 26, peakOvr: 78, peakDuration: 5 },
      { id: 'l11', name: '约什·鲍威尔', position: 'PF', age: 25, peakAge: 27, peakOvr: 74, peakDuration: 4 },
      { id: 'l12', name: '德杰文·姆本加', position: 'C', age: 28, peakAge: 27, peakOvr: 72, peakDuration: 4 },
      { id: 'l13', name: '孙悦', position: 'PG', age: 23, peakAge: 25, peakOvr: 73, peakDuration: 4 },
      { id: 'l14', name: '亚当·莫里森', position: 'SF', age: 24, peakAge: 26, peakOvr: 75, peakDuration: 4 },
      { id: 'l15', name: '约什·平克斯', position: 'SG', age: 22, peakAge: 25, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'cle', name: '克利夫兰骑士', city: 'Cleveland', abbrev: 'CLE', logo: '/logos/cle.png', primaryColor: '#860038', secondaryColor: '#FDBB30', rating: 92, conference: 'East', starPlayer: '勒布朗·詹姆斯', wins: 66, losses: 16,
    roster: [
      { id: 'c1', name: '勒布朗·詹姆斯', position: 'SF', age: 24, peakAge: 25, peakOvr: 99, peakDuration: 9, isStar: true },
      { id: 'c2', name: '莫·威廉姆斯', position: 'PG', age: 26, peakAge: 26, peakOvr: 85, peakDuration: 5, isStar: true },
      { id: 'c3', name: '德隆特·韦斯特', position: 'SG', age: 25, peakAge: 26, peakOvr: 81, peakDuration: 5 },
      { id: 'c4', name: '兹德鲁纳斯·伊尔戈斯卡斯', position: 'C', age: 33, peakAge: 28, peakOvr: 87, peakDuration: 6 },
      { id: 'c5', name: '安德森·瓦莱乔', position: 'PF', age: 26, peakAge: 28, peakOvr: 81, peakDuration: 6 },
      { id: 'c6', name: '乔·史密斯', position: 'PF', age: 33, peakAge: 26, peakOvr: 84, peakDuration: 6 },
      { id: 'c7', name: '丹尼尔·吉布森', position: 'PG', age: 22, peakAge: 26, peakOvr: 79, peakDuration: 5 },
      { id: 'c8', name: '沃利·斯泽比亚克', position: 'SF', age: 31, peakAge: 28, peakOvr: 84, peakDuration: 5 },
      { id: 'c9', name: '本·华莱士', position: 'C', age: 34, peakAge: 28, peakOvr: 92, peakDuration: 6 },
      { id: 'c10', name: '雅肖恩·希克斯', position: 'PF', age: 20, peakAge: 26, peakOvr: 77, peakDuration: 5 },
      { id: 'c11', name: '达内尔·杰克逊', position: 'PF', age: 23, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'c12', name: '萨沙·帕夫洛维奇', position: 'SG', age: 25, peakAge: 26, peakOvr: 76, peakDuration: 4 },
      { id: 'c13', name: '塔伦斯·金西', position: 'SG', age: 24, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'c14', name: '罗伦岑·赖特', position: 'C', age: 33, peakAge: 27, peakOvr: 78, peakDuration: 5 },
      { id: 'c15', name: '麦克·维尔克斯', position: 'PG', age: 29, peakAge: 27, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'orl', name: '奥兰多魔术', city: 'Orlando', abbrev: 'ORL', logo: '/logos/orl.png', primaryColor: '#0077C0', secondaryColor: '#C4CED4', rating: 90, conference: 'East', starPlayer: '德怀特·霍华德', wins: 59, losses: 23,
    roster: [
      { id: 'o1', name: '德怀特·霍华德', position: 'C', age: 23, peakAge: 25, peakOvr: 95, peakDuration: 6, isStar: true },
      { id: 'o2', name: '希达耶特·特科格鲁', position: 'SF', age: 29, peakAge: 28, peakOvr: 87, peakDuration: 5, isStar: true },
      { id: 'o3', name: '拉沙德·刘易斯', position: 'PF', age: 29, peakAge: 28, peakOvr: 86, peakDuration: 5, isStar: true },
      { id: 'o4', name: '贾米尔·尼尔森', position: 'PG', age: 26, peakAge: 26, peakOvr: 85, peakDuration: 5 },
      { id: 'o5', name: '考特尼·李', position: 'SG', age: 23, peakAge: 27, peakOvr: 81, peakDuration: 6 },
      { id: 'o6', name: 'J.J. 雷迪克', position: 'SG', age: 24, peakAge: 28, peakOvr: 82, peakDuration: 6 },
      { id: 'o7', name: '马尔钦·戈塔特', position: 'C', age: 24, peakAge: 28, peakOvr: 81, peakDuration: 6 },
      { id: 'o8', name: '迈克尔·皮特鲁斯', position: 'SF', age: 26, peakAge: 27, peakOvr: 79, peakDuration: 5 },
      { id: 'o9', name: '安东尼·约翰逊', position: 'PG', age: 34, peakAge: 28, peakOvr: 77, peakDuration: 5 },
      { id: 'o10', name: '托尼·巴蒂', position: 'C', age: 32, peakAge: 27, peakOvr: 77, peakDuration: 5 },
      { id: 'o11', name: '泰伦·卢', position: 'PG', age: 31, peakAge: 28, peakOvr: 78, peakDuration: 4 },
      { id: 'o12', name: '阿多尼斯·弗尔利', position: 'PF', age: 26, peakAge: 27, peakOvr: 74, peakDuration: 4 },
      { id: 'o13', name: '基斯·博甘斯', position: 'SG', age: 28, peakAge: 27, peakOvr: 76, peakDuration: 4 },
      { id: 'o14', name: '查理·沃德', position: 'PG', age: 38, peakAge: 28, peakOvr: 78, peakDuration: 5 },
      { id: 'o15', name: '吉里·塞切克', position: 'C', age: 23, peakAge: 26, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'hou', name: '休斯顿火箭', city: 'Houston', abbrev: 'HOU', logo: '/logos/hou.png', primaryColor: '#CE1141', secondaryColor: '#C4CED4', rating: 91, conference: 'West', starPlayer: '姚明 & 麦迪', wins: 53, losses: 29,
    roster: [
      { id: 'h1', name: '姚明', position: 'C', age: 28, peakAge: 27, peakOvr: 93, peakDuration: 4, isStar: true },
      { id: 'h2', name: '特雷西·麦克格雷迪', position: 'SG', age: 29, peakAge: 24, peakOvr: 96, peakDuration: 5, isStar: true },
      { id: 'h3', name: '罗恩·阿泰斯特', position: 'SF', age: 29, peakAge: 25, peakOvr: 89, peakDuration: 6 },
      { id: 'h4', name: '路易斯·斯科拉', position: 'PF', age: 28, peakAge: 28, peakOvr: 84, peakDuration: 5 },
      { id: 'h5', name: '肖恩·巴蒂尔', position: 'SF', age: 30, peakAge: 28, peakOvr: 83, peakDuration: 5 },
      { id: 'h6', name: '凯尔·洛瑞', position: 'PG', age: 22, peakAge: 28, peakOvr: 88, peakDuration: 7 },
      { id: 'h7', name: '卡尔·兰德里', position: 'PF', age: 25, peakAge: 27, peakOvr: 80, peakDuration: 5 },
      { id: 'h8', name: '亚伦·布鲁克斯', position: 'PG', age: 23, peakAge: 26, peakOvr: 82, peakDuration: 5 },
      { id: 'h9', name: '查尔斯·海耶斯', position: 'C', age: 25, peakAge: 27, peakOvr: 76, peakDuration: 5 },
      { id: 'h10', name: '沃恩·韦弗', position: 'SG', age: 23, peakAge: 26, peakOvr: 77, peakDuration: 4 },
      { id: 'h11', name: '迪肯贝·穆托姆博', position: 'C', age: 42, peakAge: 28, peakOvr: 93, peakDuration: 8 },
      { id: 'h12', name: '布伦特·巴里', position: 'SG', age: 37, peakAge: 28, peakOvr: 83, peakDuration: 6 },
      { id: 'h13', name: '乔伊·多西', position: 'C', age: 24, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'h14', name: '詹姆斯·怀特', position: 'SG', age: 26, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'h15', name: '布莱恩·库克', position: 'PF', age: 28, peakAge: 27, peakOvr: 74, peakDuration: 4 }
    ]
  },
  {
    id: 'sas', name: '圣安东尼奥马刺', city: 'San Antonio', abbrev: 'SAS', logo: '/logos/sas.png', primaryColor: '#C4CED4', secondaryColor: '#000000', rating: 92, conference: 'West', starPlayer: '蒂姆·邓肯 & 帕克 & 吉诺比利', wins: 54, losses: 28,
    roster: [
      { id: 's1', name: '蒂姆·邓肯', position: 'PF', age: 32, peakAge: 26, peakOvr: 98, peakDuration: 7, isStar: true },
      { id: 's2', name: '托尼·帕克', position: 'PG', age: 26, peakAge: 26, peakOvr: 90, peakDuration: 6, isStar: true },
      { id: 's3', name: '马努·吉诺比利', position: 'SG', age: 31, peakAge: 28, peakOvr: 91, peakDuration: 5, isStar: true },
      { id: 's4', name: '迈克尔·芬利', position: 'SF', age: 35, peakAge: 27, peakOvr: 88, peakDuration: 6 },
      { id: 's5', name: '布鲁斯·鲍文', position: 'SF', age: 37, peakAge: 30, peakOvr: 83, peakDuration: 6 },
      { id: 's6', name: '罗杰·梅森', position: 'SG', age: 28, peakAge: 28, peakOvr: 79, peakDuration: 5 },
      { id: 's7', name: '马特·邦纳', position: 'PF', age: 28, peakAge: 28, peakOvr: 78, peakDuration: 5 },
      { id: 's8', name: '乔治·希尔', position: 'PG', age: 22, peakAge: 27, peakOvr: 83, peakDuration: 6 },
      { id: 's9', name: '法布里西奥·奥贝托', position: 'C', age: 33, peakAge: 29, peakOvr: 77, peakDuration: 5 },
      { id: 's10', name: '库特·托马斯', position: 'C', age: 36, peakAge: 28, peakOvr: 81, peakDuration: 6 },
      { id: 's11', name: '德鲁·古登', position: 'PF', age: 27, peakAge: 27, peakOvr: 82, peakDuration: 5 },
      { id: 's12', name: '雅克·沃恩', position: 'PG', age: 33, peakAge: 28, peakOvr: 75, peakDuration: 5 },
      { id: 's13', name: '安东尼·托利弗', position: 'PF', age: 23, peakAge: 27, peakOvr: 76, peakDuration: 5 },
      { id: 's14', name: '伊恩·马辛米', position: 'C', age: 22, peakAge: 27, peakOvr: 77, peakDuration: 5 },
      { id: 's15', name: '马里克·海尔斯顿', position: 'SG', age: 21, peakAge: 25, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'den', name: '丹佛掘金', city: 'Denver', abbrev: 'DEN', logo: '/logos/den.png', primaryColor: '#0E2240', secondaryColor: '#FEC524', rating: 91, conference: 'West', starPlayer: '卡梅隆·安东尼 & 比卢普斯', wins: 54, losses: 28,
    roster: [
      { id: 'dn1', name: '卡梅隆·安东尼', position: 'SF', age: 24, peakAge: 26, peakOvr: 94, peakDuration: 7, isStar: true },
      { id: 'dn2', name: '昌西·比卢普斯', position: 'PG', age: 32, peakAge: 29, peakOvr: 91, peakDuration: 5, isStar: true },
      { id: 'dn3', name: '内内·希拉里奥', position: 'C', age: 26, peakAge: 27, peakOvr: 84, peakDuration: 6 },
      { id: 'dn4', name: '肯扬·马丁', position: 'PF', age: 31, peakAge: 26, peakOvr: 87, peakDuration: 5 },
      { id: 'dn5', name: 'J.R. 史密斯', position: 'SG', age: 23, peakAge: 27, peakOvr: 84, peakDuration: 6 },
      { id: 'dn6', name: '克里斯·安德森', position: 'C', age: 30, peakAge: 29, peakOvr: 80, peakDuration: 5 },
      { id: 'dn7', name: '林纳斯·克莱扎', position: 'SF', age: 24, peakAge: 26, peakOvr: 78, peakDuration: 5 },
      { id: 'dn8', name: '丹泰·琼斯', position: 'SG', age: 28, peakAge: 28, peakOvr: 76, peakDuration: 4 },
      { id: 'dn9', name: '雷纳尔多·巴尔克曼', position: 'SF', age: 24, peakAge: 26, peakOvr: 75, peakDuration: 4 },
      { id: 'dn10', name: '安东尼·卡特', position: 'PG', age: 33, peakAge: 28, peakOvr: 77, peakDuration: 5 },
      { id: 'dn11', name: '史蒂文·亨特', position: 'C', age: 27, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'dn12', name: '索尼·威姆斯', position: 'SG', age: 22, peakAge: 26, peakOvr: 76, peakDuration: 5 },
      { id: 'dn13', name: '楚基·阿特金斯', position: 'PG', age: 34, peakAge: 28, peakOvr: 79, peakDuration: 4 },
      { id: 'dn14', name: '朱万·霍华德', position: 'PF', age: 35, peakAge: 26, peakOvr: 86, peakDuration: 6 },
      { id: 'dn15', name: '切克·萨姆布', position: 'C', age: 24, peakAge: 25, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'por', name: '波特兰开拓者', city: 'Portland', abbrev: 'POR', logo: '/logos/por.png', primaryColor: '#E03A3E', secondaryColor: '#000000', rating: 89, conference: 'West', starPlayer: '布兰登·罗利 & 阿尔德里奇', wins: 54, losses: 28,
    roster: [
      { id: 'pt1', name: '布兰登·罗伊', position: 'SG', age: 24, peakAge: 25, peakOvr: 92, peakDuration: 4, isStar: true },
      { id: 'pt2', name: '拉马库斯·阿尔德里奇', position: 'PF', age: 23, peakAge: 27, peakOvr: 90, peakDuration: 7, isStar: true },
      { id: 'pt3', name: '格雷格·奥登', position: 'C', age: 20, peakAge: 24, peakOvr: 86, peakDuration: 4 },
      { id: 'pt4', name: '鲁迪·费尔南德斯', position: 'SG', age: 23, peakAge: 26, peakOvr: 81, peakDuration: 5 },
      { id: 'pt5', name: '尼古拉·巴图姆', position: 'SF', age: 20, peakAge: 27, peakOvr: 84, peakDuration: 7 },
      { id: 'pt6', name: '乔尔·普尔兹比拉', position: 'C', age: 29, peakAge: 28, peakOvr: 79, peakDuration: 5 },
      { id: 'pt7', name: '莫里斯·威廉姆斯', position: 'PG', age: 26, peakAge: 27, peakOvr: 80, peakDuration: 5 },
      { id: 'pt8', name: '特拉维斯·奥特洛', position: 'SF', age: 24, peakAge: 26, peakOvr: 79, peakDuration: 5 },
      { id: 'pt9', name: '马特尔·韦伯斯特', position: 'SF', age: 22, peakAge: 26, peakOvr: 77, peakDuration: 5 },
      { id: 'pt10', name: '杰里·贝勒斯', position: 'PG', age: 20, peakAge: 25, peakOvr: 79, peakDuration: 5 },
      { id: 'pt11', name: '塞尔吉奥·罗德里格斯', position: 'PG', age: 22, peakAge: 26, peakOvr: 76, peakDuration: 5 },
      { id: 'pt12', name: '沙夫力克·兰多夫', position: 'PF', age: 25, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'pt13', name: '伊克·迪奥古', position: 'PF', age: 25, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'pt14', name: '迈克尔·鲁芬', position: 'C', age: 31, peakAge: 27, peakOvr: 72, peakDuration: 4 },
      { id: 'pt15', name: '卢克·杰克逊', position: 'SG', age: 27, peakAge: 26, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'dal', name: '达拉斯独行侠', city: 'Dallas', abbrev: 'DAL', logo: '/logos/dal.png', primaryColor: '#00538C', secondaryColor: '#0066B3', rating: 90, conference: 'West', starPlayer: '德克·诺维茨基', wins: 50, losses: 32,
    roster: [
      { id: 'd1', name: '德克·诺维茨基', position: 'PF', age: 30, peakAge: 27, peakOvr: 96, peakDuration: 6, isStar: true },
      { id: 'd2', name: '贾森·特里', position: 'SG', age: 31, peakAge: 28, peakOvr: 87, peakDuration: 6, isStar: true },
      { id: 'd3', name: '约什·霍华德', position: 'SF', age: 28, peakAge: 27, peakOvr: 86, peakDuration: 5 },
      { id: 'd4', name: '贾森·基德', position: 'PG', age: 35, peakAge: 26, peakOvr: 95, peakDuration: 6 },
      { id: 'd5', name: '埃里克·丹皮尔', position: 'C', age: 33, peakAge: 28, peakOvr: 81, peakDuration: 5 },
      { id: 'd6', name: 'J.J. 巴里亚', position: 'PG', age: 24, peakAge: 27, peakOvr: 80, peakDuration: 6 },
      { id: 'd7', name: '布兰登·巴斯', position: 'PF', age: 23, peakAge: 27, peakOvr: 80, peakDuration: 6 },
      { id: 'd8', name: '安托万·赖特', position: 'SG', age: 24, peakAge: 26, peakOvr: 76, peakDuration: 4 },
      { id: 'd9', name: '莱恩·霍林斯', position: 'C', age: 24, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'd10', name: '杰里·斯塔克豪斯', position: 'SG', age: 34, peakAge: 26, peakOvr: 89, peakDuration: 6 },
      { id: 'd11', name: '德萨盖纳·迪奥普', position: 'C', age: 26, peakAge: 26, peakOvr: 75, peakDuration: 5 },
      { id: 'd12', name: '杰拉德·格林', position: 'SG', age: 22, peakAge: 27, peakOvr: 79, peakDuration: 5 },
      { id: 'd13', name: '詹姆斯·辛格尔顿', position: 'SF', age: 27, peakAge: 27, peakOvr: 74, peakDuration: 4 },
      { id: 'd14', name: '德文·乔治', position: 'SF', age: 31, peakAge: 27, peakOvr: 76, peakDuration: 4 },
      { id: 'd15', name: '马特·卡罗尔', position: 'SG', age: 28, peakAge: 27, peakOvr: 75, peakDuration: 4 }
    ]
  },
  {
    id: 'phx', name: '菲尼克斯太阳', city: 'Phoenix', abbrev: 'PHX', logo: '/logos/phx.png', primaryColor: '#1D1160', secondaryColor: '#E56020', rating: 89, conference: 'West', starPlayer: '斯塔德迈尔 & 史蒂夫·纳什', wins: 46, losses: 36,
    roster: [
      { id: 'p1', name: '阿玛雷·斯塔德迈尔', position: 'PF', age: 26, peakAge: 26, peakOvr: 92, peakDuration: 5, isStar: true },
      { id: 'p2', name: '史蒂夫·纳什', position: 'PG', age: 34, peakAge: 31, peakOvr: 96, peakDuration: 5, isStar: true },
      { id: 'p3', name: '沙奎尔·奥尼尔', position: 'C', age: 36, peakAge: 27, peakOvr: 98, peakDuration: 5 },
      { id: 'p4', name: '贾森·理查德森', position: 'SG', age: 27, peakAge: 26, peakOvr: 87, peakDuration: 6 },
      { id: 'p5', name: '格兰特·希尔', position: 'SF', age: 36, peakAge: 26, peakOvr: 96, peakDuration: 6 },
      { id: 'p6', name: '贾里德·杜德利', position: 'SF', age: 23, peakAge: 27, peakOvr: 80, peakDuration: 6 },
      { id: 'p7', name: '莱昂德罗·巴博萨', position: 'SG', age: 26, peakAge: 26, peakOvr: 83, peakDuration: 5 },
      { id: 'p8', name: '克利福德·罗宾逊', position: 'PF', age: 30, peakAge: 28, peakOvr: 77, peakDuration: 4 },
      { id: 'p9', name: '罗宾·洛佩兹', position: 'C', age: 20, peakAge: 27, peakOvr: 82, peakDuration: 6 },
      { id: 'p10', name: '戈兰·德拉季奇', position: 'PG', age: 22, peakAge: 28, peakOvr: 87, peakDuration: 6 },
      { id: 'p11', name: '斯特罗迈尔·斯威夫特', position: 'PF', age: 29, peakAge: 25, peakOvr: 79, peakDuration: 4 },
      { id: 'p12', name: '阿兰多·塔克', position: 'SF', age: 24, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'p13', name: '马库斯·班克斯', position: 'PG', age: 27, peakAge: 26, peakOvr: 75, peakDuration: 4 },
      { id: 'p14', name: '路易斯·阿曼德森', position: 'PF', age: 26, peakAge: 27, peakOvr: 75, peakDuration: 4 },
      { id: 'p15', name: '考特尼·西姆斯', position: 'C', age: 24, peakAge: 25, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'uta', name: '犹他爵士', city: 'Utah', abbrev: 'UTA', logo: '/logos/uta.png', primaryColor: '#002B5C', secondaryColor: '#F9A01B', rating: 89, conference: 'West', starPlayer: '德隆·威廉姆斯 & 布泽尔', wins: 48, losses: 34,
    roster: [
      { id: 'u1', name: '德隆·威廉姆斯', position: 'PG', age: 24, peakAge: 25, peakOvr: 92, peakDuration: 5, isStar: true },
      { id: 'u2', name: '卡洛斯·布泽尔', position: 'PF', age: 27, peakAge: 26, peakOvr: 89, peakDuration: 5, isStar: true },
      { id: 'u3', name: '梅米特·奥库', position: 'C', age: 29, peakAge: 27, peakOvr: 85, peakDuration: 5 },
      { id: 'u4', name: '安德烈·基里连科', position: 'SF', age: 27, peakAge: 25, peakOvr: 88, peakDuration: 5 },
      { id: 'u5', name: '保罗·米尔萨普', position: 'PF', age: 23, peakAge: 28, peakOvr: 88, peakDuration: 7 },
      { id: 'u6', name: '凯尔·科沃尔', position: 'SG', age: 27, peakAge: 28, peakOvr: 81, peakDuration: 6 },
      { id: 'u7', name: '罗尼·布鲁尔', position: 'SG', age: 23, peakAge: 26, peakOvr: 80, peakDuration: 5 },
      { id: 'u8', name: 'C.J. 迈尔斯', position: 'SF', age: 21, peakAge: 26, peakOvr: 78, peakDuration: 5 },
      { id: 'u9', name: '罗尼·普莱斯', position: 'PG', age: 25, peakAge: 27, peakOvr: 75, peakDuration: 4 },
      { id: 'u10', name: '科斯塔·库佛斯', position: 'C', age: 19, peakAge: 26, peakOvr: 78, peakDuration: 5 },
      { id: 'u11', name: '布雷文·奈特', position: 'PG', age: 33, peakAge: 28, peakOvr: 80, peakDuration: 5 },
      { id: 'u12', name: '贾莱德·费森', position: 'C', age: 30, peakAge: 27, peakOvr: 74, peakDuration: 5 },
      { id: 'u13', name: '莫里斯·阿尔蒙德', position: 'SG', age: 23, peakAge: 25, peakOvr: 73, peakDuration: 4 },
      { id: 'u14', name: '柯特尼斯·菲森', position: 'PF', age: 24, peakAge: 26, peakOvr: 72, peakDuration: 4 },
      { id: 'u15', name: '莱斯特·哈德森', position: 'PG', age: 24, peakAge: 26, peakOvr: 73, peakDuration: 4 }
    ]
  },
  {
    id: 'noh', name: '新奥尔良黄蜂', city: 'New Orleans', abbrev: 'NOH', logo: '/logos/noh.png', primaryColor: '#00778B', secondaryColor: '#280071', rating: 90, conference: 'West', starPlayer: '克里斯·保罗 & 大卫·韦斯特', wins: 49, losses: 33,
    roster: [
      { id: 'no1', name: '克里斯·保罗', position: 'PG', age: 23, peakAge: 24, peakOvr: 96, peakDuration: 7, isStar: true },
      { id: 'no2', name: '大卫·韦斯特', position: 'PF', age: 28, peakAge: 27, peakOvr: 88, peakDuration: 5, isStar: true },
      { id: 'no3', name: '泰森·钱德勒', position: 'C', age: 26, peakAge: 28, peakOvr: 86, peakDuration: 6 },
      { id: 'no4', name: '佩贾·斯托亚科维奇', position: 'SF', age: 31, peakAge: 26, peakOvr: 90, peakDuration: 5 },
      { id: 'no5', name: '詹姆斯·波西', position: 'SF', age: 31, peakAge: 28, peakOvr: 81, peakDuration: 5 },
      { id: 'no6', name: '拉斯尔·巴特勒', position: 'SG', age: 29, peakAge: 28, peakOvr: 78, peakDuration: 5 },
      { id: 'no7', name: '安东尼奥·丹尼尔斯', position: 'PG', age: 33, peakAge: 28, peakOvr: 80, peakDuration: 5 },
      { id: 'no8', name: '希尔顿·阿姆斯特朗', position: 'C', age: 24, peakAge: 26, peakOvr: 75, peakDuration: 4 },
      { id: 'no9', name: '朱利安·赖特', position: 'SF', age: 21, peakAge: 26, peakOvr: 76, peakDuration: 5 },
      { id: 'no10', name: '德文·布朗', position: 'SG', age: 30, peakAge: 27, peakOvr: 76, peakDuration: 4 },
      { id: 'no11', name: '肖恩·马克斯', position: 'PF', age: 33, peakAge: 28, peakOvr: 72, peakDuration: 4 },
      { id: 'no12', name: '梅尔文·埃利', position: 'C', age: 30, peakAge: 27, peakOvr: 75, peakDuration: 4 },
      { id: 'no13', name: '赖恩·鲍文', position: 'PF', age: 33, peakAge: 28, peakOvr: 73, peakDuration: 4 },
      { id: 'no14', name: '考特尼·亚历山大', position: 'SG', age: 31, peakAge: 26, peakOvr: 76, peakDuration: 4 },
      { id: 'no15', name: '加里·福布斯', position: 'SF', age: 23, peakAge: 26, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'atl', name: '亚特兰大老鹰', city: 'Atlanta', abbrev: 'ATL', logo: '/logos/atl.png', primaryColor: '#E13A3E', secondaryColor: '#C4D600', rating: 88, conference: 'East', starPlayer: '乔·约翰逊 & 约什·史密斯', wins: 47, losses: 35,
    roster: [
      { id: 'a1', name: '乔·约翰逊', position: 'SG', age: 27, peakAge: 27, peakOvr: 89, peakDuration: 6, isStar: true },
      { id: 'a2', name: '约什·史密斯', position: 'PF', age: 23, peakAge: 26, peakOvr: 87, peakDuration: 5, isStar: true },
      { id: 'a3', name: '艾尔·霍福德', position: 'C', age: 22, peakAge: 27, peakOvr: 89, peakDuration: 7 },
      { id: 'a4', name: '麦克·毕比', position: 'PG', age: 30, peakAge: 26, peakOvr: 88, peakDuration: 5 },
      { id: 'a5', name: '马文·威廉姆斯', position: 'SF', age: 22, peakAge: 27, peakOvr: 82, peakDuration: 6 },
      { id: 'a6', name: '扎扎·帕楚里亚', position: 'C', age: 24, peakAge: 28, peakOvr: 79, peakDuration: 6 },
      { id: 'a7', name: '莫里斯·埃文斯', position: 'SG', age: 30, peakAge: 28, peakOvr: 77, peakDuration: 4 },
      { id: 'a8', name: '弗利普·默里', position: 'PG', age: 29, peakAge: 27, peakOvr: 78, peakDuration: 4 },
      { id: 'a9', name: '阿西·劳', position: 'PG', age: 23, peakAge: 25, peakOvr: 75, peakDuration: 4 },
      { id: 'a10', name: '索罗门·琼斯', position: 'C', age: 24, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'a11', name: '兰多夫·莫里斯', position: 'C', age: 22, peakAge: 25, peakOvr: 72, peakDuration: 4 },
      { id: 'a12', name: '奥瑟洛·亨特', position: 'PF', age: 22, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'a13', name: '马里奥·韦斯特', position: 'SG', age: 24, peakAge: 26, peakOvr: 71, peakDuration: 4 },
      { id: 'a14', name: '托马斯·加德里奇', position: 'C', age: 28, peakAge: 27, peakOvr: 73, peakDuration: 4 },
      { id: 'a15', name: '莱斯特·赫德', position: 'SG', age: 23, peakAge: 25, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'mia', name: '迈阿密热火', city: 'Miami', abbrev: 'MIA', logo: '/logos/mia.png', primaryColor: '#98002E', secondaryColor: '#F9A01B', rating: 88, conference: 'East', starPlayer: '德维恩·韦德', wins: 43, losses: 39,
    roster: [
      { id: 'm1', name: '德维恩·韦德', position: 'SG', age: 26, peakAge: 26, peakOvr: 97, peakDuration: 6, isStar: true },
      { id: 'm2', name: '肖恩·马里昂', position: 'SF', age: 30, peakAge: 27, peakOvr: 91, peakDuration: 5, isStar: true },
      { id: 'm3', name: '迈克尔·比斯利', position: 'PF', age: 19, peakAge: 24, peakOvr: 85, peakDuration: 5 },
      { id: 'm4', name: '马里奥·查尔默斯', position: 'PG', age: 22, peakAge: 27, peakOvr: 81, peakDuration: 6 },
      { id: 'm5', name: '尤多尼斯·哈斯勒姆', position: 'PF', age: 28, peakAge: 28, peakOvr: 82, peakDuration: 6 },
      { id: 'm6', name: '乔尔·安东尼', position: 'C', age: 26, peakAge: 28, peakOvr: 76, peakDuration: 5 },
      { id: 'm7', name: '戴奎恩·库克', position: 'SG', age: 21, peakAge: 26, peakOvr: 78, peakDuration: 5 },
      { id: 'm8', name: '克里斯·奎因', position: 'PG', age: 25, peakAge: 26, peakOvr: 75, peakDuration: 4 },
      { id: 'm9', name: '贾马尔·马格洛伊尔', position: 'C', age: 30, peakAge: 26, peakOvr: 82, peakDuration: 5 },
      { id: 'm10', name: '詹姆斯·琼斯', position: 'SF', age: 28, peakAge: 28, peakOvr: 77, peakDuration: 5 },
      { id: 'm11', name: '亚库巴·迪亚瓦拉', position: 'SF', age: 26, peakAge: 27, peakOvr: 74, peakDuration: 4 },
      { id: 'm12', name: '加雷特·赫德', position: 'PG', age: 24, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'm13', name: '戴夫·里查德森', position: 'SG', age: 23, peakAge: 25, peakOvr: 72, peakDuration: 4 },
      { id: 'm14', name: '多雷尔·赖特', position: 'SF', age: 23, peakAge: 27, peakOvr: 78, peakDuration: 5 },
      { id: 'm15', name: '马库斯·海斯利普', position: 'PF', age: 28, peakAge: 27, peakOvr: 73, peakDuration: 4 }
    ]
  },
  {
    id: 'chi', name: '芝加哥公牛', city: 'Chicago', abbrev: 'CHI', logo: '/logos/chi.png', primaryColor: '#CE1141', secondaryColor: '#000000', rating: 87, conference: 'East', starPlayer: '德里克·罗斯 (新秀)', wins: 41, losses: 41,
    roster: [
      { id: 'ch1', name: '德里克·罗斯', position: 'PG', age: 20, peakAge: 23, peakOvr: 94, peakDuration: 4, isStar: true },
      { id: 'ch2', name: '罗尔·邓', position: 'SF', age: 23, peakAge: 26, peakOvr: 86, peakDuration: 6 },
      { id: 'ch3', name: '本·戈登', position: 'SG', age: 25, peakAge: 26, peakOvr: 85, peakDuration: 5, isStar: true },
      { id: 'ch4', name: '约翰·萨尔蒙斯', position: 'SG', age: 29, peakAge: 28, peakOvr: 82, peakDuration: 4 },
      { id: 'ch5', name: '乔金·诺阿', position: 'C', age: 23, peakAge: 28, peakOvr: 88, peakDuration: 6 },
      { id: 'ch6', name: '泰鲁斯·托马斯', position: 'PF', age: 22, peakAge: 25, peakOvr: 81, peakDuration: 4 },
      { id: 'ch7', name: '布拉德·米勒', position: 'C', age: 32, peakAge: 28, peakOvr: 86, peakDuration: 5 },
      { id: 'ch8', name: '柯克·辛里奇', position: 'PG', age: 27, peakAge: 26, peakOvr: 83, peakDuration: 5 },
      { id: 'ch9', name: '亚伦·格雷', position: 'C', age: 24, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'ch10', name: '林赛·亨特', position: 'PG', age: 38, peakAge: 28, peakOvr: 80, peakDuration: 5 },
      { id: 'ch11', name: '塞德里克·西蒙斯', position: 'C', age: 22, peakAge: 25, peakOvr: 73, peakDuration: 4 },
      { id: 'ch12', name: '安东尼·罗伯森', position: 'PG', age: 25, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'ch13', name: '提姆·托马斯', position: 'SF', age: 31, peakAge: 27, peakOvr: 81, peakDuration: 5 },
      { id: 'ch14', name: '林顿·约翰逊', position: 'PF', age: 28, peakAge: 27, peakOvr: 72, peakDuration: 4 },
      { id: 'ch15', name: '德里克·布朗', position: 'SF', age: 21, peakAge: 25, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'phi', name: '费城76人', city: 'Philadelphia', abbrev: 'PHI', logo: '/logos/phi.png', primaryColor: '#006BB6', secondaryColor: '#ED174C', rating: 87, conference: 'East', starPlayer: '安德烈·伊古达拉', wins: 41, losses: 41,
    roster: [
      { id: 'ph1', name: '安德烈·伊古达拉', position: 'SF', age: 24, peakAge: 27, peakOvr: 89, peakDuration: 6, isStar: true },
      { id: 'ph2', name: '安德烈·米勒', position: 'PG', age: 32, peakAge: 27, peakOvr: 87, peakDuration: 6, isStar: true },
      { id: 'ph3', name: '埃尔顿·布兰德', position: 'PF', age: 29, peakAge: 26, peakOvr: 91, peakDuration: 5 },
      { id: 'ph4', name: '萨穆埃尔·戴勒姆波特', position: 'C', age: 27, peakAge: 27, peakOvr: 81, peakDuration: 5 },
      { id: 'ph5', name: '赛迪斯·杨', position: 'PF', age: 20, peakAge: 26, peakOvr: 83, peakDuration: 6 },
      { id: 'ph6', name: '路易斯·威廉姆斯', position: 'PG', age: 22, peakAge: 28, peakOvr: 85, peakDuration: 6 },
      { id: 'ph7', name: '威利·格林', position: 'SG', age: 27, peakAge: 27, peakOvr: 78, peakDuration: 5 },
      { id: 'ph8', name: '马拉契·斯贝茨', position: 'C', age: 21, peakAge: 27, peakOvr: 80, peakDuration: 5 },
      { id: 'ph9', name: '雷吉·埃文斯', position: 'PF', age: 28, peakAge: 28, peakOvr: 77, peakDuration: 5 },
      { id: 'ph10', name: '罗亚尔·艾维', position: 'PG', age: 27, peakAge: 27, peakOvr: 74, peakDuration: 4 },
      { id: 'ph11', name: '卡里姆·拉什', position: 'SG', age: 28, peakAge: 26, peakOvr: 75, peakDuration: 4 },
      { id: 'ph12', name: '德尼·马绍尔', position: 'PF', age: 35, peakAge: 28, peakOvr: 83, peakDuration: 6 },
      { id: 'ph13', name: '贾森·史密斯', position: 'PF', age: 22, peakAge: 27, peakOvr: 76, peakDuration: 5 },
      { id: 'ph14', name: '西奥·拉特利夫', position: 'C', age: 35, peakAge: 28, peakOvr: 84, peakDuration: 5 },
      { id: 'ph15', name: '威利·里德', position: 'SF', age: 23, peakAge: 26, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'det', name: '底特律活塞', city: 'Detroit', abbrev: 'DET', logo: '/logos/det.png', primaryColor: '#C8102E', secondaryColor: '#006BB6', rating: 88, conference: 'East', starPlayer: '阿伦·艾弗森 & 汉密尔顿', wins: 39, losses: 43,
    roster: [
      { id: 'dt1', name: '阿伦·艾弗森', position: 'PG', age: 33, peakAge: 26, peakOvr: 97, peakDuration: 6, isStar: true },
      { id: 'dt2', name: '理查德·汉密尔顿', position: 'SG', age: 30, peakAge: 28, peakOvr: 88, peakDuration: 5, isStar: true },
      { id: 'dt3', name: '泰肖恩·普林斯', position: 'SF', age: 28, peakAge: 27, peakOvr: 85, peakDuration: 5 },
      { id: 'dt4', name: '拉希德·华莱士', position: 'PF', age: 34, peakAge: 28, peakOvr: 91, peakDuration: 6 },
      { id: 'dt5', name: '安东尼奥·麦克戴斯', position: 'PF', age: 34, peakAge: 26, peakOvr: 89, peakDuration: 6 },
      { id: 'dt6', name: '罗德尼·斯塔基', position: 'PG', age: 22, peakAge: 26, peakOvr: 83, peakDuration: 5 },
      { id: 'dt7', name: '阿隆·阿夫拉罗', position: 'SG', age: 23, peakAge: 27, peakOvr: 82, peakDuration: 6 },
      { id: 'dt8', name: '夸梅·布朗', position: 'C', age: 26, peakAge: 25, peakOvr: 77, peakDuration: 4 },
      { id: 'dt9', name: '威尔·拜纳姆', position: 'PG', age: 25, peakAge: 27, peakOvr: 78, peakDuration: 4 },
      { id: 'dt10', name: '阿米尔·约翰逊', position: 'PF', age: 21, peakAge: 27, peakOvr: 80, peakDuration: 6 },
      { id: 'dt11', name: '沃尔特·赫尔曼', position: 'SF', age: 29, peakAge: 27, peakOvr: 74, peakDuration: 4 },
      { id: 'dt12', name: '查尔斯·夏普', position: 'PF', age: 22, peakAge: 25, peakOvr: 71, peakDuration: 4 },
      { id: 'dt13', name: '科奈尔·桑普森', position: 'C', age: 28, peakAge: 27, peakOvr: 72, peakDuration: 4 },
      { id: 'dt14', name: '亚历克斯·阿克', position: 'SG', age: 25, peakAge: 26, peakOvr: 72, peakDuration: 4 },
      { id: 'dt15', name: '萨姆·麦基', position: 'SF', age: 24, peakAge: 26, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'tor', name: '多伦多猛龙', city: 'Toronto', abbrev: 'TOR', logo: '/logos/tor.png', primaryColor: '#CE1141', secondaryColor: '#000000', rating: 86, conference: 'East', starPlayer: '克里斯·波什', wins: 33, losses: 49,
    roster: [
      { id: 'tr1', name: '克里斯·波什', position: 'PF', age: 24, peakAge: 26, peakOvr: 92, peakDuration: 6, isStar: true },
      { id: 'tr2', name: '安德里亚·巴尔尼亚尼', position: 'C', age: 23, peakAge: 26, peakOvr: 84, peakDuration: 5, isStar: true },
      { id: 'tr3', name: '何塞·卡尔德隆', position: 'PG', age: 27, peakAge: 27, peakOvr: 85, peakDuration: 5 },
      { id: 'tr4', name: '安东尼·帕克', position: 'SG', age: 33, peakAge: 28, peakOvr: 81, peakDuration: 5 },
      { id: 'tr5', name: '贾马里奥·穆恩', position: 'SF', age: 28, peakAge: 28, peakOvr: 78, peakDuration: 4 },
      { id: 'tr6', name: '贾森·卡波诺', position: 'SF', age: 27, peakAge: 27, peakOvr: 78, peakDuration: 4 },
      { id: 'tr7', name: '克里斯·汉弗莱斯', position: 'PF', age: 23, peakAge: 27, peakOvr: 80, peakDuration: 5 },
      { id: 'tr8', name: '罗尼·索罗门', position: 'PG', age: 30, peakAge: 27, peakOvr: 76, peakDuration: 4 },
      { id: 'tr9', name: '杰克·沃斯库尔', position: 'C', age: 31, peakAge: 27, peakOvr: 74, peakDuration: 4 },
      { id: 'tr10', name: '昆西·杜比', position: 'PG', age: 24, peakAge: 25, peakOvr: 73, peakDuration: 4 },
      { id: 'tr11', name: '内森·贾瓦伊', position: 'C', age: 22, peakAge: 26, peakOvr: 72, peakDuration: 4 },
      { id: 'tr12', name: '帕特里克·奥布莱恩特', position: 'C', age: 22, peakAge: 25, peakOvr: 73, peakDuration: 4 },
      { id: 'tr13', name: '罗伦·伍兹', position: 'C', age: 30, peakAge: 27, peakOvr: 72, peakDuration: 4 },
      { id: 'tr14', name: '普波斯·索诺戈', position: 'PF', age: 25, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'tr15', name: '哈桑·亚当斯', position: 'SG', age: 24, peakAge: 26, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'bkn', name: '新泽西网', city: 'New Jersey', abbrev: 'NJN', logo: '/logos/bkn.png', primaryColor: '#000000', secondaryColor: '#FFFFFF', rating: 85, conference: 'East', starPlayer: '文斯·卡特 & 德文·哈里斯', wins: 34, losses: 48,
    roster: [
      { id: 'bk1', name: '文斯·卡特', position: 'SG', age: 31, peakAge: 24, peakOvr: 94, peakDuration: 6, isStar: true },
      { id: 'bk2', name: '德文·哈里斯', position: 'PG', age: 25, peakAge: 25, peakOvr: 87, peakDuration: 5, isStar: true },
      { id: 'bk3', name: '布鲁克·洛佩斯', position: 'C', age: 20, peakAge: 27, peakOvr: 89, peakDuration: 7 },
      { id: 'bk4', name: '易建联', position: 'PF', age: 21, peakAge: 25, peakOvr: 82, peakDuration: 5 },
      { id: 'bk5', name: '鲍比·西蒙斯', position: 'SF', age: 28, peakAge: 27, peakOvr: 78, peakDuration: 4 },
      { id: 'bk6', name: '莱恩·安德森', position: 'PF', age: 20, peakAge: 27, peakOvr: 84, peakDuration: 6 },
      { id: 'bk7', name: '克里斯·道格拉斯-罗伯茨', position: 'SG', age: 21, peakAge: 26, peakOvr: 77, peakDuration: 4 },
      { id: 'bk8', name: '特伦顿·哈塞尔', position: 'SF', age: 29, peakAge: 27, peakOvr: 75, peakDuration: 5 },
      { id: 'bk9', name: '爱德华多·纳胡拉', position: 'PF', age: 32, peakAge: 28, peakOvr: 76, peakDuration: 4 },
      { id: 'bk10', name: '西恩·威廉姆斯', position: 'PF', age: 22, peakAge: 25, peakOvr: 74, peakDuration: 4 },
      { id: 'bk11', name: '贾维斯·海耶斯', position: 'SF', age: 27, peakAge: 27, peakOvr: 75, peakDuration: 4 },
      { id: 'bk12', name: '毛里斯·阿格尔', position: 'SG', age: 24, peakAge: 26, peakOvr: 72, peakDuration: 4 },
      { id: 'bk13', name: '查尔斯·多布森', position: 'C', age: 23, peakAge: 25, peakOvr: 72, peakDuration: 4 },
      { id: 'bk14', name: '键恩·海耶斯', position: 'SF', age: 27, peakAge: 27, peakOvr: 74, peakDuration: 4 },
      { id: 'bk15', name: '埃迪·吉尔', position: 'PG', age: 30, peakAge: 27, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'ind', name: '印第安纳步行者', city: 'Indiana', abbrev: 'IND', logo: '/logos/ind.png', primaryColor: '#002D62', secondaryColor: '#FDBB30', rating: 85, conference: 'East', starPlayer: '丹尼·格兰杰', wins: 36, losses: 46,
    roster: [
      { id: 'in1', name: '丹尼·格兰杰', position: 'SF', age: 25, peakAge: 25, peakOvr: 89, peakDuration: 5, isStar: true },
      { id: 'in2', name: '特洛伊·墨菲', position: 'PF', age: 28, peakAge: 28, peakOvr: 83, peakDuration: 5 },
      { id: 'in3', name: 'T.J. 福特', position: 'PG', age: 25, peakAge: 25, peakOvr: 82, peakDuration: 5 },
      { id: 'in4', name: '罗伊·希伯特', position: 'C', age: 22, peakAge: 27, peakOvr: 86, peakDuration: 6 },
      { id: 'in5', name: '贾莱特·杰克', position: 'PG', age: 25, peakAge: 27, peakOvr: 81, peakDuration: 5 },
      { id: 'in6', name: '马基斯·丹尼尔斯', position: 'SG', age: 27, peakAge: 27, peakOvr: 78, peakDuration: 5 },
      { id: 'in7', name: '布兰登·拉什', position: 'SG', age: 23, peakAge: 26, peakOvr: 78, peakDuration: 5 },
      { id: 'in8', name: '拉多斯拉夫·内斯特洛维奇', position: 'C', age: 32, peakAge: 28, peakOvr: 78, peakDuration: 5 },
      { id: 'in9', name: '杰夫·福斯特', position: 'C', age: 31, peakAge: 28, peakOvr: 78, peakDuration: 5 },
      { id: 'in10', name: '邓台·琼斯', position: 'SG', age: 28, peakAge: 28, peakOvr: 76, peakDuration: 4 },
      { id: 'in11', name: '约什·麦克罗伯茨', position: 'PF', age: 21, peakAge: 27, peakOvr: 77, peakDuration: 5 },
      { id: 'in12', name: '斯蒂芬·格拉汉姆', position: 'SF', age: 26, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'in13', name: '马齐奥·巴斯顿', position: 'PF', age: 32, peakAge: 28, peakOvr: 73, peakDuration: 4 },
      { id: 'in14', name: '吉米·麦克金尼', position: 'PG', age: 25, peakAge: 26, peakOvr: 71, peakDuration: 4 },
      { id: 'in15', name: '拉里·欧文斯', position: 'SF', age: 25, peakAge: 26, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'mil', name: '密尔沃基雄鹿', city: 'Milwaukee', abbrev: 'MIL', logo: '/logos/mil.png', primaryColor: '#00471B', secondaryColor: '#EEE1C6', rating: 85, conference: 'East', starPlayer: '迈克尔·里德', wins: 34, losses: 48,
    roster: [
      { id: 'mk1', name: '迈克尔·里德', position: 'SG', age: 29, peakAge: 27, peakOvr: 89, peakDuration: 5, isStar: true },
      { id: 'mk2', name: '理查德·杰弗森', position: 'SF', age: 28, peakAge: 27, peakOvr: 86, peakDuration: 5, isStar: true },
      { id: 'mk3', name: '安德鲁·博古特', position: 'C', age: 24, peakAge: 26, peakOvr: 86, peakDuration: 6 },
      { id: 'mk4', name: '查理·维拉纽瓦', position: 'PF', age: 24, peakAge: 25, peakOvr: 82, peakDuration: 5 },
      { id: 'mk5', name: '拉蒙·塞申斯', position: 'PG', age: 22, peakAge: 26, peakOvr: 81, peakDuration: 5 },
      { id: 'mk6', name: '卢克·里德诺', position: 'PG', age: 27, peakAge: 27, peakOvr: 79, peakDuration: 5 },
      { id: 'mk7', name: '露克·理查德·巴莫特', position: 'PF', age: 22, peakAge: 28, peakOvr: 80, peakDuration: 6 },
      { id: 'mk8', name: '基斯·博甘斯', position: 'SG', age: 28, peakAge: 27, peakOvr: 76, peakDuration: 4 },
      { id: 'mk9', name: '丹·加祖里奇', position: 'C', age: 30, peakAge: 27, peakOvr: 75, peakDuration: 4 },
      { id: 'mk10', name: '弗朗西斯科·埃尔森', position: 'C', age: 32, peakAge: 28, peakOvr: 75, peakDuration: 4 },
      { id: 'mk11', name: '马里克·艾伦', position: 'PF', age: 30, peakAge: 28, peakOvr: 74, peakDuration: 4 },
      { id: 'mk12', name: '查理·贝尔', position: 'SG', age: 29, peakAge: 27, peakOvr: 76, peakDuration: 4 },
      { id: 'mk13', name: '乔·亚历山大', position: 'SF', age: 22, peakAge: 25, peakOvr: 74, peakDuration: 4 },
      { id: 'mk14', name: '萨利姆·斯塔德迈尔', position: 'PG', age: 26, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'mk15', name: '达蒙·琼斯', position: 'PG', age: 32, peakAge: 28, peakOvr: 76, peakDuration: 4 }
    ]
  },
  {
    id: 'was', name: '华盛顿奇才', city: 'Washington', abbrev: 'WAS', logo: '/logos/was.png', primaryColor: '#002B5C', secondaryColor: '#E31837', rating: 84, conference: 'East', starPlayer: '吉尔伯特·阿里纳斯', wins: 19, losses: 63,
    roster: [
      { id: 'ws1', name: '吉尔伯特·阿里纳斯', position: 'PG', age: 26, peakAge: 25, peakOvr: 93, peakDuration: 5, isStar: true },
      { id: 'ws2', name: '卡隆·巴特勒', position: 'SF', age: 28, peakAge: 27, peakOvr: 87, peakDuration: 5, isStar: true },
      { id: 'ws3', name: '安托万·贾米森', position: 'PF', age: 32, peakAge: 28, peakOvr: 88, peakDuration: 6 },
      { id: 'ws4', name: '尼克·杨', position: 'SG', age: 23, peakAge: 27, peakOvr: 81, peakDuration: 6 },
      { id: 'ws5', name: '贾维尔·麦基', position: 'C', age: 20, peakAge: 27, peakOvr: 82, peakDuration: 6 },
      { id: 'ws6', name: '布兰登·海伍德', position: 'C', age: 29, peakAge: 28, peakOvr: 80, peakDuration: 5 },
      { id: 'ws7', name: '安德烈·布拉切', position: 'PF', age: 22, peakAge: 26, peakOvr: 80, peakDuration: 5 },
      { id: 'ws8', name: '德肖恩·史蒂文森', position: 'SG', age: 27, peakAge: 27, peakOvr: 77, peakDuration: 4 },
      { id: 'ws9', name: '达柳斯·桑盖拉', position: 'PF', age: 30, peakAge: 28, peakOvr: 76, peakDuration: 4 },
      { id: 'ws10', name: '埃坦·托马斯', position: 'C', age: 30, peakAge: 27, peakOvr: 77, peakDuration: 5 },
      { id: 'ws11', name: '麦克·詹姆斯', position: 'PG', age: 33, peakAge: 30, peakOvr: 81, peakDuration: 4 },
      { id: 'ws12', name: '克里斯坦特', position: 'PG', age: 25, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'ws13', name: '多米尼克·麦克奎尔', position: 'SF', age: 23, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'ws14', name: '胡安·卡洛斯·纳瓦罗', position: 'SG', age: 28, peakAge: 27, peakOvr: 77, peakDuration: 4 },
      { id: 'ws15', name: '迪布朗·迪克森', position: 'PG', age: 24, peakAge: 26, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'sac', name: '萨克拉门托国王', city: 'Sacramento', abbrev: 'SAC', logo: '/logos/sac.png', primaryColor: '#5A2D81', secondaryColor: '#63666A', rating: 84, conference: 'West', starPlayer: '凯文·马丁', wins: 17, losses: 65,
    roster: [
      { id: 'sc1', name: '凯文·马丁', position: 'SG', age: 25, peakAge: 26, peakOvr: 88, peakDuration: 5, isStar: true },
      { id: 'sc2', name: '约翰·萨尔蒙斯', position: 'SF', age: 29, peakAge: 28, peakOvr: 82, peakDuration: 4 },
      { id: 'sc3', name: '比诺·尤德里', position: 'PG', age: 26, peakAge: 27, peakOvr: 80, peakDuration: 5 },
      { id: 'sc4', name: '斯宾塞·霍伊斯', position: 'C', age: 20, peakAge: 26, peakOvr: 81, peakDuration: 6 },
      { id: 'sc5', name: '贾森·汤普森', position: 'PF', age: 22, peakAge: 26, peakOvr: 80, peakDuration: 5 },
      { id: 'sc6', name: '弗朗西斯科·加西亚', position: 'SF', age: 27, peakAge: 27, peakOvr: 78, peakDuration: 5 },
      { id: 'sc7', name: '拉沙德·麦坎茨', position: 'SG', age: 24, peakAge: 26, peakOvr: 78, peakDuration: 4 },
      { id: 'sc8', name: '鲍比·杰克逊', position: 'PG', age: 35, peakAge: 28, peakOvr: 83, peakDuration: 5 },
      { id: 'sc9', name: '丹特·格林', position: 'SF', age: 20, peakAge: 26, peakOvr: 77, peakDuration: 5 },
      { id: 'sc10', name: '希尔顿·阿姆斯特朗', position: 'C', age: 24, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'sc11', name: '伊克·迪奥古', position: 'PF', age: 25, peakAge: 26, peakOvr: 75, peakDuration: 4 },
      { id: 'sc12', name: '肯尼·托马斯', position: 'PF', age: 31, peakAge: 27, peakOvr: 78, peakDuration: 4 },
      { id: 'sc13', name: '查尔斯·海耶斯', position: 'C', age: 25, peakAge: 27, peakOvr: 76, peakDuration: 5 },
      { id: 'sc14', name: '西德尼·布朗', position: 'SG', age: 23, peakAge: 25, peakOvr: 72, peakDuration: 4 },
      { id: 'sc15', name: '科德尔·亨利', position: 'PG', age: 24, peakAge: 26, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'cha', name: '夏洛特山猫', city: 'Charlotte', abbrev: 'CHA', logo: '/logos/cha.png', primaryColor: '#1D1160', secondaryColor: '#00859B', rating: 85, conference: 'East', starPlayer: '杰拉德·华莱士 & 奥卡福', wins: 35, losses: 47,
    roster: [
      { id: 'ch1', name: '杰拉德·华莱士', position: 'SF', age: 26, peakAge: 27, peakOvr: 87, peakDuration: 5, isStar: true },
      { id: 'ch2', name: '埃梅卡·奥卡福', position: 'C', age: 26, peakAge: 26, peakOvr: 85, peakDuration: 5, isStar: true },
      { id: 'ch3', name: '雷蒙德·费尔顿', position: 'PG', age: 24, peakAge: 26, peakOvr: 83, peakDuration: 5 },
      { id: 'ch4', name: '鲍里斯·迪奥', position: 'PF', age: 26, peakAge: 26, peakOvr: 83, peakDuration: 5 },
      { id: 'ch5', name: '拉贾·贝尔', position: 'SG', age: 32, peakAge: 29, peakOvr: 82, peakDuration: 5 },
      { id: 'ch6', name: 'D.J. 奥古斯丁', position: 'PG', age: 21, peakAge: 26, peakOvr: 81, peakDuration: 6 },
      { id: 'ch7', name: '纳兹尔·穆罕默德', position: 'C', age: 31, peakAge: 28, peakOvr: 78, peakDuration: 5 },
      { id: 'ch8', name: '马特·卡罗尔', position: 'SG', age: 28, peakAge: 27, peakOvr: 76, peakDuration: 4 },
      { id: 'ch9', name: '亚当·莫里森', position: 'SF', age: 24, peakAge: 26, peakOvr: 76, peakDuration: 4 },
      { id: 'ch10', name: '亚力克西斯·阿金萨', position: 'C', age: 20, peakAge: 26, peakOvr: 74, peakDuration: 5 },
      { id: 'ch11', name: '尚恩·梅', position: 'PF', age: 24, peakAge: 25, peakOvr: 75, peakDuration: 4 },
      { id: 'ch12', name: '杜万·布莱尔', position: 'C', age: 19, peakAge: 25, peakOvr: 78, peakDuration: 5 },
      { id: 'ch13', name: '尚恩·辛格尔特里', position: 'PG', age: 23, peakAge: 25, peakOvr: 73, peakDuration: 4 },
      { id: 'ch14', name: '德维恩·琼斯', position: 'C', age: 25, peakAge: 26, peakOvr: 72, peakDuration: 4 },
      { id: 'ch15', name: '卡尔·里奇', position: 'SG', age: 23, peakAge: 25, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'lac', name: '洛杉矶快船', city: 'Los Angeles', abbrev: 'LAC', logo: '/logos/lac.png', primaryColor: '#C8102E', secondaryColor: '#1D428A', rating: 85, conference: 'West', starPlayer: '拜伦·戴维斯 & 埃里克·戈登', wins: 19, losses: 63,
    roster: [
      { id: 'lc1', name: '拜伦·戴维斯', position: 'PG', age: 29, peakAge: 28, peakOvr: 89, peakDuration: 5, isStar: true },
      { id: 'lc2', name: '埃里克·戈登', position: 'SG', age: 20, peakAge: 26, peakOvr: 87, peakDuration: 6, isStar: true },
      { id: 'lc3', name: '扎克·兰多夫', position: 'PF', age: 27, peakAge: 28, peakOvr: 88, peakDuration: 6 },
      { id: 'lc4', name: '马库斯·坎比', position: 'C', age: 34, peakAge: 28, peakOvr: 88, peakDuration: 6 },
      { id: 'lc5', name: '克里斯·卡曼', position: 'C', age: 26, peakAge: 27, peakOvr: 85, peakDuration: 5 },
      { id: 'lc6', name: '里基·戴维斯', position: 'SG', age: 29, peakAge: 25, peakOvr: 84, peakDuration: 5 },
      { id: 'lc7', name: '艾尔·桑顿', position: 'SF', age: 25, peakAge: 26, peakOvr: 81, peakDuration: 5 },
      { id: 'lc8', name: '塞巴斯蒂安·特尔费尔', position: 'PG', age: 23, peakAge: 25, peakOvr: 78, peakDuration: 4 },
      { id: 'lc9', name: '史蒂夫·诺瓦克', position: 'SF', age: 25, peakAge: 27, peakOvr: 76, peakDuration: 5 },
      { id: 'lc10', name: '布赖恩·斯金纳', position: 'C', age: 32, peakAge: 28, peakOvr: 75, peakDuration: 4 },
      { id: 'lc11', name: '德安德烈·乔丹', position: 'C', age: 20, peakAge: 27, peakOvr: 86, peakDuration: 7 },
      { id: 'lc12', name: '弗雷德·琼斯', position: 'SG', age: 29, peakAge: 26, peakOvr: 76, peakDuration: 4 },
      { id: 'lc13', name: '马克·马德森', position: 'PF', age: 32, peakAge: 27, peakOvr: 73, peakDuration: 4 },
      { id: 'lc14', name: '保罗·戴维斯', position: 'C', age: 24, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'lc15', name: '麦克·泰勒', position: 'PG', age: 22, peakAge: 25, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'mem', name: '孟菲斯灰熊', city: 'Memphis', abbrev: 'MEM', logo: '/logos/mem.png', primaryColor: '#5D76A9', secondaryColor: '#12173F', rating: 85, conference: 'West', starPlayer: '鲁迪·盖伊 & O.J. 梅奥', wins: 24, losses: 58,
    roster: [
      { id: 'me1', name: '鲁迪·盖伊', position: 'SF', age: 22, peakAge: 26, peakOvr: 88, peakDuration: 6, isStar: true },
      { id: 'me2', name: 'O.J. 梅奥', position: 'SG', age: 21, peakAge: 22, peakOvr: 86, peakDuration: 4, isStar: true },
      { id: 'me3', name: '马克·加索尔', position: 'C', age: 23, peakAge: 28, peakOvr: 90, peakDuration: 7 },
      { id: 'me4', name: '迈克·康利', position: 'PG', age: 21, peakAge: 27, peakOvr: 88, peakDuration: 7 },
      { id: 'me5', name: '达里克·亚瑟', position: 'PF', age: 21, peakAge: 26, peakOvr: 78, peakDuration: 5 },
      { id: 'me6', name: '哈基姆·瓦里克', position: 'PF', age: 26, peakAge: 26, peakOvr: 80, peakDuration: 5 },
      { id: 'me7', name: '凯尔·洛瑞', position: 'PG', age: 22, peakAge: 28, peakOvr: 88, peakDuration: 7 },
      { id: 'me8', name: '贾瓦里·克里坦顿', position: 'PG', age: 21, peakAge: 25, peakOvr: 75, peakDuration: 4 },
      { id: 'me9', name: '哈姆德·哈达迪', position: 'C', age: 23, peakAge: 27, peakOvr: 74, peakDuration: 4 },
      { id: 'me10', name: '葛雷格·巴克纳', position: 'SG', age: 32, peakAge: 28, peakOvr: 74, peakDuration: 4 },
      { id: 'me11', name: '安托万·沃克', position: 'PF', age: 32, peakAge: 26, peakOvr: 87, peakDuration: 5 },
      { id: 'me12', name: '马尔科·雅里奇', position: 'SG', age: 30, peakAge: 27, peakOvr: 76, peakDuration: 4 },
      { id: 'me13', name: '达科·米里西奇', position: 'C', age: 23, peakAge: 24, peakOvr: 77, peakDuration: 4 },
      { id: 'me14', name: '奎因特尔·伍兹', position: 'SF', age: 27, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'me15', name: '吉尔·杰克逊', position: 'SG', age: 24, peakAge: 26, peakOvr: 72, peakDuration: 4 }
    ]
  },
  {
    id: 'min', name: '明尼苏达森林狼', city: 'Minnesota', abbrev: 'MIN', logo: '/logos/min.png', primaryColor: '#0C2340', secondaryColor: '#236192', rating: 84, conference: 'West', starPlayer: '艾尔·杰弗森 & 乐福', wins: 24, losses: 58,
    roster: [
      { id: 'mn1', name: '艾尔·杰弗森', position: 'C', age: 23, peakAge: 25, peakOvr: 89, peakDuration: 5, isStar: true },
      { id: 'mn2', name: '凯文·乐福', position: 'PF', age: 20, peakAge: 26, peakOvr: 92, peakDuration: 6, isStar: true },
      { id: 'mn3', name: '兰迪·弗耶', position: 'PG', age: 25, peakAge: 26, peakOvr: 82, peakDuration: 5 },
      { id: 'mn4', name: '迈克·米勒', position: 'SG', age: 28, peakAge: 27, peakOvr: 84, peakDuration: 5 },
      { id: 'mn5', name: '莱恩·戈麦斯', position: 'SF', age: 26, peakAge: 26, peakOvr: 80, peakDuration: 5 },
      { id: 'mn6', name: '塞巴斯蒂安·特尔费尔', position: 'PG', age: 23, peakAge: 25, peakOvr: 78, peakDuration: 4 },
      { id: 'mn7', name: '罗德尼·卡尼', position: 'SF', age: 24, peakAge: 26, peakOvr: 76, peakDuration: 4 },
      { id: 'mn8', name: '克雷格·史密斯', position: 'PF', age: 25, peakAge: 26, peakOvr: 78, peakDuration: 4 },
      { id: 'mn9', name: '拉沙德·麦坎茨', position: 'SG', age: 24, peakAge: 26, peakOvr: 78, peakDuration: 4 },
      { id: 'mn10', name: '简埃罗·帕尔戈', position: 'PG', age: 29, peakAge: 28, peakOvr: 76, peakDuration: 4 },
      { id: 'mn11', name: '鲍比·布朗', position: 'PG', age: 24, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'mn12', name: '卡迪尔·马丁', position: 'SF', age: 28, peakAge: 27, peakOvr: 75, peakDuration: 4 },
      { id: 'mn13', name: '马基斯·卡尔维特', position: 'C', age: 29, peakAge: 27, peakOvr: 73, peakDuration: 4 },
      { id: 'mn14', name: '贾里德·莱内', position: 'PF', age: 26, peakAge: 26, peakOvr: 72, peakDuration: 4 },
      { id: 'mn15', name: '卡尔·史密斯', position: 'SG', age: 23, peakAge: 25, peakOvr: 71, peakDuration: 4 }
    ]
  },
  {
    id: 'okc', name: '俄克拉荷马雷霆', city: 'Oklahoma City', abbrev: 'OKC', logo: '/logos/okc.png', primaryColor: '#007AC1', secondaryColor: '#EF3B24', rating: 85, conference: 'West', starPlayer: '凯文·杜兰特 & 威斯布鲁克', wins: 23, losses: 59,
    roster: [
      { id: 'ok1', name: '凯文·杜兰特', position: 'SF', age: 20, peakAge: 25, peakOvr: 97, peakDuration: 8, isStar: true },
      { id: 'ok2', name: '拉塞尔·威斯布鲁克', position: 'PG', age: 20, peakAge: 26, peakOvr: 94, peakDuration: 7, isStar: true },
      { id: 'ok3', name: '杰夫·格林', position: 'PF', age: 22, peakAge: 26, peakOvr: 84, peakDuration: 6 },
      { id: 'ok4', name: '萨博·塞弗罗萨', position: 'SG', age: 24, peakAge: 27, peakOvr: 81, peakDuration: 6 },
      { id: 'ok5', name: '内纳德·科斯蒂奇', position: 'C', age: 25, peakAge: 26, peakOvr: 80, peakDuration: 5 },
      { id: 'ok6', name: '尼克·科里森', position: 'PF', age: 28, peakAge: 28, peakOvr: 79, peakDuration: 5 },
      { id: 'ok7', name: '厄尔·沃特森', position: 'PG', age: 29, peakAge: 28, peakOvr: 78, peakDuration: 4 },
      { id: 'ok8', name: '戴奎恩·库克', position: 'SG', age: 21, peakAge: 26, peakOvr: 78, peakDuration: 5 },
      { id: 'ok9', name: '戴斯蒙德·梅森', position: 'SF', age: 31, peakAge: 27, peakOvr: 81, peakDuration: 5 },
      { id: 'ok10', name: '约翰·佩特罗', position: 'C', age: 22, peakAge: 25, peakOvr: 75, peakDuration: 4 },
      { id: 'ok11', name: '达米安·威尔金斯', position: 'SG', age: 29, peakAge: 28, peakOvr: 76, peakDuration: 4 },
      { id: 'ok12', name: 'D.J. 怀特', position: 'PF', age: 22, peakAge: 26, peakOvr: 74, peakDuration: 4 },
      { id: 'ok13', name: '查克·莫斯利', position: 'PG', age: 24, peakAge: 26, peakOvr: 72, peakDuration: 4 },
      { id: 'ok14', name: '莫里斯·泰勒', position: 'PF', age: 32, peakAge: 27, peakOvr: 80, peakDuration: 5 },
      { id: 'ok15', name: '罗伯特·斯威夫特', position: 'C', age: 23, peakAge: 25, peakOvr: 73, peakDuration: 4 }
    ]
  },
  {
    id: 'nyk', name: '纽约尼克斯', city: 'New York', abbrev: 'NYK', logo: '/logos/nyk.png', primaryColor: '#006BB6', secondaryColor: '#F58426', rating: 85, conference: 'East', starPlayer: '扎克·兰多夫 & 贾马尔·克劳福德', wins: 32, losses: 50,
    roster: [
      { id: 'ny1', name: '扎克·兰多夫', position: 'PF', age: 27, peakAge: 28, peakOvr: 88, peakDuration: 6, isStar: true },
      { id: 'ny2', name: '贾马尔·克劳福德', position: 'SG', age: 28, peakAge: 28, peakOvr: 86, peakDuration: 6, isStar: true },
      { id: 'ny3', name: '大卫·李', position: 'C', age: 25, peakAge: 27, peakOvr: 86, peakDuration: 6 },
      { id: 'ny4', name: '内特·罗宾逊', position: 'PG', age: 24, peakAge: 26, peakOvr: 83, peakDuration: 5 },
      { id: 'ny5', name: '威尔森·钱德勒', position: 'SF', age: 21, peakAge: 26, peakOvr: 82, peakDuration: 6 },
      { id: 'ny6', name: '达尼洛·加里纳利', position: 'SF', age: 20, peakAge: 27, peakOvr: 86, peakDuration: 7 },
      { id: 'ny7', name: '艾尔·哈灵顿', position: 'PF', age: 28, peakAge: 28, peakOvr: 83, peakDuration: 5 },
      { id: 'ny8', name: '克里斯·杜洪', position: 'PG', age: 26, peakAge: 27, peakOvr: 80, peakDuration: 5 },
      { id: 'ny9', name: '昆廷·理查德森', position: 'SG', age: 28, peakAge: 26, peakOvr: 80, peakDuration: 5 },
      { id: 'ny10', name: '杰罗姆·詹姆斯', position: 'C', age: 33, peakAge: 28, peakOvr: 74, peakDuration: 4 },
      { id: 'ny11', name: '马里克·罗斯', position: 'PF', age: 34, peakAge: 28, peakOvr: 77, peakDuration: 5 },
      { id: 'ny12', name: '埃迪·库里', position: 'C', age: 26, peakAge: 25, peakOvr: 82, peakDuration: 4 },
      { id: 'ny13', name: '马尔科姆·托马斯', position: 'PF', age: 22, peakAge: 26, peakOvr: 73, peakDuration: 4 },
      { id: 'ny14', name: '乔·克劳福德', position: 'SG', age: 22, peakAge: 25, peakOvr: 72, peakDuration: 4 },
      { id: 'ny15', name: '米尔特·帕拉西奥', position: 'PG', age: 30, peakAge: 27, peakOvr: 73, peakDuration: 4 }
    ]
  },
  {
    id: 'gsw', name: '金州勇士', city: 'Golden State', abbrev: 'GSW', logo: '/logos/gsw.png', primaryColor: '#1D428A', secondaryColor: '#FFC72C', rating: 86, conference: 'West', starPlayer: '斯蒂芬·杰克逊 & 蒙塔·埃利斯', wins: 29, losses: 53,
    roster: [
      { id: 'gw1', name: '斯蒂芬·杰克逊', position: 'SF', age: 30, peakAge: 28, peakOvr: 87, peakDuration: 5, isStar: true },
      { id: 'gw2', name: '蒙塔·埃利斯', position: 'SG', age: 23, peakAge: 25, peakOvr: 88, peakDuration: 6, isStar: true },
      { id: 'gw3', name: '科里·马盖蒂', position: 'SF', age: 29, peakAge: 27, peakOvr: 85, peakDuration: 5 },
      { id: 'gw4', name: '安德里斯·贝德林斯', position: 'C', age: 22, peakAge: 24, peakOvr: 83, peakDuration: 5 },
      { id: 'gw5', name: '安东尼·莫罗', position: 'SG', age: 23, peakAge: 26, peakOvr: 80, peakDuration: 5 },
      { id: 'gw6', name: '卡里姆·拉什', position: 'SG', age: 28, peakAge: 26, peakOvr: 76, peakDuration: 4 },
      { id: 'gw7', name: '科姆·贝里内里', position: 'SG', age: 22, peakAge: 27, peakOvr: 82, peakDuration: 6 },
      { id: 'gw8', name: '罗尼·图里亚夫', position: 'C', age: 25, peakAge: 27, peakOvr: 78, peakDuration: 5 },
      { id: 'gw9', name: 'CJ·沃特森', position: 'PG', age: 24, peakAge: 27, peakOvr: 78, peakDuration: 5 },
      { id: 'gw10', name: '布兰登·赖特', position: 'PF', age: 21, peakAge: 26, peakOvr: 78, peakDuration: 5 },
      { id: 'gw11', name: '安东尼·兰多夫', position: 'PF', age: 19, peakAge: 24, peakOvr: 79, peakDuration: 5 },
      { id: 'gw12', name: '德玛库斯·尼尔森', position: 'SG', age: 23, peakAge: 25, peakOvr: 73, peakDuration: 4 },
      { id: 'gw13', name: '马库斯·威廉姆斯', position: 'PG', age: 22, peakAge: 25, peakOvr: 75, peakDuration: 4 },
      { id: 'gw14', name: '罗伯·库兹马', position: 'C', age: 27, peakAge: 27, peakOvr: 73, peakDuration: 4 },
      { id: 'gw15', name: '理查德·亨德里克斯', position: 'PF', age: 22, peakAge: 25, peakOvr: 72, peakDuration: 4 }
    ]
  }
];

// Enrich each team roster player with roles and dynamically calculated OVR
TEAMS_DATA.forEach(t => {
  t.roster.forEach(p => {
    p.ovr = calculateDynamicOvr(p.age, p.peakAge, p.peakOvr, p.peakDuration);
  });

  // Sort roster by OVR descending
  t.roster.sort((a, b) => b.ovr - a.ovr);

  // Assign roles based on OVR rank
  t.roster.forEach((p, idx) => {
    if (idx === 0) p.role = '战术核心';
    else if (idx < 5) p.role = '绝对首发';
    else if (idx === 5) p.role = '第六人';
    else if (idx < 10) p.role = '轮换替补';
    else p.role = '饮水机守门员';
  });
});

console.log('Total teams:', TEAMS_DATA.length);
TEAMS_DATA.forEach(t => console.log(t.id, t.name, 'roster count:', t.roster.length));

// Load historical seasons and initial endorsements from existing file
const existingContent = fs.readFileSync('./src/data/nbaData2008.ts', 'utf8');
const tailPart = existingContent.slice(existingContent.indexOf('export const HISTORICAL_SEASONS'));

const outputCode = `import { Team, HistoricalSeason, Endorsement } from '../types';

export const NBA_TEAMS_2008: Team[] = ${JSON.stringify(TEAMS_DATA, null, 2)};

${tailPart}`;

fs.writeFileSync('./src/data/nbaData2008.ts', outputCode, 'utf8');
console.log('Successfully written full 15-player rosters to src/data/nbaData2008.ts');
