export interface OffseasonEvent {
  id: string;
  title: string;
  category: '交际' | '商业' | '公益' | '训练' | '社会' | '家庭';
  story: string;
  rewardText: string;
  reward: {
    skillPoints?: number;
    attrCapBonus?: number;
    money?: number;
    fans?: number;
    morale?: number;
    mediaReputation?: number;
  };
}

export const OFFSEASON_EVENTS: OffseasonEvent[] = [
  {
    id: 'kobe_camp',
    title: '科比大吉岛封闭特训',
    category: '训练',
    story: '受科比·布莱恩特亲笔邀请，你前往太平洋私人岛屿基地进行为期一周的脚步与中投封闭式特训。凌晨四点的汗水洗礼让你的技术与意志得到升华！',
    rewardText: '属性点 +3 · 全属性上限 +1 · 粉丝 +15,000',
    reward: { skillPoints: 3, attrCapBonus: 1, fans: 15000, morale: 10 }
  },
  {
    id: 'nike_design',
    title: '耐克总部设计专属联名战靴',
    category: '商业',
    story: '飞往俄勒冈耐克全球总部，与首席球鞋设计师探讨你的个人专属签名鞋配色与Logo。独一无二的先锋科技将为你带来极大的市场轰动。',
    rewardText: '代言资金 +$300,000 · 粉丝 +40,000 · 媒体声望 +5',
    reward: { money: 300000, fans: 40000, mediaReputation: 5 }
  },
  {
    id: 'court_cut',
    title: '家乡社区篮球场剪彩',
    category: '公益',
    story: '你回到成长的街区，出资数十万全额翻新了童年打球破旧的露天篮球场，并举办了免费青少年公益训练营。全镇街坊聚在一起为你欢呼！',
    rewardText: '粉丝 +50,000 · 媒体声望 +10 · 士气 +10',
    reward: { fans: 50000, mediaReputation: 10, morale: 10 }
  },
  {
    id: 'taco_tuesday',
    title: '勒布朗·詹姆斯私人派对',
    category: '交际',
    story: '受邀参加詹姆斯举办的夏季私人庄园派对，与联盟众多顶级全明星巨星围坐一堂交流赛季心得，并在欢声笑语中结下深厚友谊。',
    rewardText: '商业合作 +$100,000 · 粉丝 +30,000 · 士气 +15',
    reward: { money: 100000, fans: 30000, morale: 15 }
  },
  {
    id: 'gq_cover',
    title: '登顶《GQ》杂志时尚封面',
    category: '社会',
    story: '受邀拍摄夏季时尚大片，以先锋街头美学造型登上国际顶尖时尚杂志封面，打破体育与时尚的边界，引爆全球热议。',
    rewardText: '资金 +$250,000 · 粉丝 +60,000 · 媒体声望 +8',
    reward: { money: 250000, fans: 60000, mediaReputation: 8 }
  },
  {
    id: 'ocean_villa',
    title: '为家人置办海景度假别墅',
    category: '家庭',
    story: '利用休赛期陪伴父母家人前往迈阿密海滩度假，并用自己的努力成果购置了一栋温馨舒适的海景别墅，全家人为你感到骄傲。',
    rewardText: '士气 +20 · 品牌赞助补贴 +$100,000 · 粉丝 +10,000',
    reward: { morale: 20, money: 100000, fans: 10000 }
  },
  {
    id: 'dream_shake',
    title: '奥拉朱旺梦幻脚步大师班',
    category: '训练',
    story: '拜师“大梦”哈基姆·奥拉朱旺，在德州农场深入领悟低位假动作晃动与篮下虚晃精髓，你的低位攻击武器库获得质的飞跃。',
    rewardText: '属性点 +4 · 全属性上限 +1',
    reward: { skillPoints: 4, attrCapBonus: 1 }
  },
  {
    id: 'paris_fashion',
    title: '巴黎时装周前排观秀',
    category: '商业',
    story: '作为头牌头排嘉宾出席巴黎夏季时尚周，与全球顶级奢侈品设计师交流潮流观点，成为秀场内外最亮眼的体育巨星。',
    rewardText: '代言费用 +$350,000 · 粉丝 +45,000',
    reward: { money: 350000, fans: 45000 }
  },
  {
    id: 'unicef_ambassador',
    title: '联合国儿童基金会亲善大使',
    category: '公益',
    story: '受邀成为亲善大使前往贫困地区，捐赠千套专业篮球装备并呼吁关注青少年身体健康，温暖举动赢得全球赞誉。',
    rewardText: '粉丝 +80,000 · 媒体声望 +15 · 士气 +10',
    reward: { fans: 80000, mediaReputation: 15, morale: 10 }
  },
  {
    id: 'drew_league',
    title: '德鲁联赛压轴战',
    category: '商业',
    story: '在洛杉矶德鲁联赛压轴登场，展现碾压级统治力狂砍48分并完成压哨超远三分绝杀，全场球迷冲入球场狂欢！',
    rewardText: '奖金 +$200,000 · 粉丝 +70,000',
    reward: { money: 200000, fans: 70000 }
  },
  {
    id: 'national_team_camp',
    title: '国家男篮预备队集训',
    category: '训练',
    story: '入选国家队夏季预备集训营，在国际名帅指导下打磨攻防战术细节，战术修养与对抗强度得到全方位强化。',
    rewardText: '属性点 +3 · 全属性上限 +1 · 士气 +10',
    reward: { skillPoints: 3, attrCapBonus: 1, morale: 10 }
  },
  {
    id: 'documentary_crew',
    title: '顶级流媒体纪录片跟拍',
    category: '社会',
    story: '知名流媒体平台为你量身打造休赛期个人纪录片，拍摄团队记录你日复一日的艰苦训练与真实生活，播出后好评如潮。',
    rewardText: '版权收入 +$400,000 · 粉丝 +50,000 · 媒体声望 +10',
    reward: { money: 400000, fans: 50000, mediaReputation: 10 }
  },
  {
    id: 'silicon_valley_angel',
    title: '硅谷高科技初创公司天使投资',
    category: '商业',
    story: '参加硅谷科技风投晚宴，以极优惠的早期投资者身分参股一家高增长人工智能科技初创公司，财务版图大幅拓展。',
    rewardText: '投资分红 +$500,000 · 粉丝 +20,000',
    reward: { money: 500000, fans: 20000 }
  },
  {
    id: 'curry_3pt_challenge',
    title: '库里三分慈善对决',
    category: '公益',
    story: '与斯蒂芬·库里同台竞技，进行三场跨界三分球连投大战，电视转播筹集的百万元善款全数捐赠给儿童医院。',
    rewardText: '属性点 +2 · 粉丝 +60,000 · 媒体声望 +8',
    reward: { skillPoints: 2, fans: 60000, mediaReputation: 8 }
  },
  {
    id: 'altitude_training',
    title: '科罗拉多高海拔极限拉练',
    category: '训练',
    story: '前往海拔3000米的科罗拉多高山训练营进行极限肺活量与心肺耐力训，突破人体生理屏障，储备恐怖体能。',
    rewardText: '全属性上限 +2 · 士气 +15',
    reward: { attrCapBonus: 2, morale: 15 }
  },
  {
    id: 'youth_camp_host',
    title: '主办首届免费青少年夏令营',
    category: '公益',
    story: '面向低收入家庭青少年免费开放为期三天的篮球夏令营，你亲自担任总教练指导滑步与投篮基本功，深受孩子们喜爱。',
    rewardText: '粉丝 +40,000 · 媒体声望 +12 · 属性点 +2',
    reward: { fans: 40000, mediaReputation: 12, skillPoints: 2 }
  },
  {
    id: 'rap_collab',
    title: '与说唱巨星跨界合作单曲',
    category: '社会',
    story: '在录音棚与格莱美获奖说唱歌手录制跨界单曲并拍摄MV，你的押韵Verse一经发布便迅速登顶全网流行榜单。',
    rewardText: '版税收入 +$300,000 · 粉丝 +80,000',
    reward: { money: 300000, fans: 80000 }
  },
  {
    id: 'sibling_grad',
    title: '陪伴弟弟妹妹高中毕业典礼',
    category: '家庭',
    story: '暂缓繁忙的商业日程，重返家乡高中见证弟弟妹妹的毕业重要时刻，为他们颁发优秀毕业礼，享受温馨家庭时光。',
    rewardText: '士气 +25 · 粉丝 +10,000',
    reward: { morale: 25, fans: 10000 }
  },
  {
    id: 'fishing_trip',
    title: '保罗·乔治豪华出海钓鱼',
    category: '交际',
    story: '与保罗·乔治等联盟好友租下豪华游艇出海钓鱼，在蔚蓝大海与欢声笑语中彻底释放高强度赛季带来的心理压力。',
    rewardText: '士气 +20 · 属性点 +1 · 粉丝 +15,000',
    reward: { morale: 20, skillPoints: 1, fans: 15000 }
  },
  {
    id: 'gatorade_ad',
    title: '佳得乐全球电视广告大片',
    category: '商业',
    story: '拍摄高科技水感运动饮料电视广告，你的招牌流汗与扣篮特写在全世界主流体育频道高频播放。',
    rewardText: '代言广告费 +$450,000 · 粉丝 +50,000',
    reward: { money: 450000, fans: 50000 }
  },
  {
    id: 'german_physio',
    title: '德国高科技物理康复疗程',
    category: '训练',
    story: '聘请前德国国家队顶级理疗团队，采用最新的液氮冷疗与超声波微创修复技术，彻底消除全身微小关节慢性疲劳。',
    rewardText: '全属性上限 +1 · 士气 +10',
    reward: { attrCapBonus: 1, morale: 10 }
  },
  {
    id: 'college_hall_of_fame',
    title: '母校退役球衣预热晚宴',
    category: '社会',
    story: '受邀回到大学母校参加杰出校友晚宴，校方隆重宣布将在不久的将来正式把你的大学号码挂在体育馆穹顶！',
    rewardText: '粉丝 +35,000 · 媒体声望 +10 · 属性点 +2',
    reward: { fans: 35000, mediaReputation: 10, skillPoints: 2 }
  },
  {
    id: 'golf_celebrity',
    title: '好莱坞慈善高尔夫名人赛冠军',
    category: '公益',
    story: '在加州高尔夫名人邀请赛中挥杆打出一杆进洞的神级表演，惊艳全场并赢得数十万美元慈善基金全数捐出。',
    rewardText: '奖金赞助 +$250,000 · 粉丝 +45,000 · 媒体声望 +6',
    reward: { money: 250000, fans: 45000, mediaReputation: 6 }
  },
  {
    id: 'luxury_watch',
    title: '瑞士顶级奢华名表全球代言',
    category: '商业',
    story: '与瑞士百年奢华制表大厂达成代言合作，成为该品牌百年来最年轻的全球形象大使，获得限量编号定制金表。',
    rewardText: '代言费 +$600,000 · 粉丝 +30,000',
    reward: { money: 600000, fans: 30000 }
  },
  {
    id: 'asian_culture_fest',
    title: '多元体育文化节特别嘉宾',
    category: '社会',
    story: '出席跨国文化交流晚宴与论坛，公开发表关于多元包容与青少年体育平等的演讲，引起社会热烈反响。',
    rewardText: '粉丝 +55,000 · 媒体声望 +8 · 资金 +$150,000',
    reward: { fans: 55000, mediaReputation: 8, money: 150000 }
  },
  {
    id: 'metta_defense',
    title: '防守大师阿泰斯特特训',
    category: '训练',
    story: '在洛杉矶高强度对抗营中接受阿泰斯特（慈世平）的撕咬式贴身防守高压洗礼，学会了如何在极限身体碰撞下稳住重心。',
    rewardText: '属性点 +3 · 全属性上限 +1',
    reward: { skillPoints: 3, attrCapBonus: 1 }
  },
  {
    id: 'organic_farm',
    title: '私人有机餐饮农场建成',
    category: '家庭',
    story: '与私人高级营养师团队合作，在郊区搭建了专属有机食材直供农场，全面升级你的休赛期高级定制膳食方案。',
    rewardText: '全属性上限 +1 · 士气 +15',
    reward: { attrCapBonus: 1, morale: 15 }
  },
  {
    id: 'esports_showmatch',
    title: '顶尖电竞战队明星表演赛',
    category: '商业',
    story: '与职业电竞巨星组队参加游戏季中表演赛，你精准的临场战术指挥与骚操作引得百万电竞玩家疯狂弹幕打Call。',
    rewardText: '出场费 +$200,000 · 粉丝 +65,000',
    reward: { money: 200000, fans: 65000 }
  },
  {
    id: 'espn_time_interview',
    title: 'ESPN 专访与《时代周刊》报道',
    category: '社会',
    story: 'ESPN 黄金时段为你播出90分钟休赛期特别专题片，《时代周刊》将你评选为最具影响力的30位30岁以下精英之一。',
    rewardText: '粉丝 +75,000 · 媒体声望 +15',
    reward: { fans: 75000, mediaReputation: 15 }
  },
  {
    id: 'superstar_1v1',
    title: '巨星私人训练营 1v1 挑战',
    category: '交际',
    story: '在非公开的巨星训练营中进行单挑轮换赛，你凭借无解的步法连续击败多位同位置现役全明星，现场气氛沸腾！',
    rewardText: '属性点 +4 · 粉丝 +40,000 · 士气 +15',
    reward: { skillPoints: 4, fans: 40000, morale: 15 }
  },
  {
    id: 'wwf_initiative',
    title: '野生动物保护公益倡议',
    category: '公益',
    story: '飞赴非洲国家公园拍摄野生动物保护公益宣传片，呼吁全球球迷共同抵制非法盗猎，展现出崇高社会责任感。',
    rewardText: '粉丝 +50,000 · 媒体声望 +12',
    reward: { fans: 50000, mediaReputation: 12 }
  },
  {
    id: 'healthy_restaurant',
    title: '投资主打运动营养的连锁餐饮',
    category: '商业',
    story: '在全美核心城市参股投资10家主打高蛋白健康轻食的健身餐厅，开业首月全线爆满，获得丰厚红利回报。',
    rewardText: '投资分红 +$380,000 · 粉丝 +25,000',
    reward: { money: 380000, fans: 25000 }
  },
  {
    id: 'redbull_extreme',
    title: '红牛高空跳伞与赛车漂移',
    category: '社会',
    story: '在专业教练陪同下挑战4000米高空跳伞与专业赛车漂移，极速的肾上腺素飙升让你彻底破除对高压环境的心理恐惧。',
    rewardText: '士气 +25 · 粉丝 +30,000 · 属性点 +2',
    reward: { morale: 25, fans: 30000, skillPoints: 2 }
  },
  {
    id: 'vintage_jersey_auction',
    title: '经典绝版球衣慈善拍卖',
    category: '公益',
    story: '拿出你新秀赛季最具纪念意义的一件绝版实战球衣进行线上公开拍卖，善款达数十万美元全数捐建乡村学校。',
    rewardText: '粉丝 +60,000 · 媒体声望 +10 · 资金 +$200,000',
    reward: { fans: 60000, mediaReputation: 10, money: 200000 }
  },
  {
    id: 'shooting_3000',
    title: '投篮名师 3000 球肌肉记忆特训',
    category: '训练',
    story: '聘请传奇投篮教练，每天完成3000次定点投篮肌肉记忆微调，你的出手速度与弧线轨迹已提升至极其精准的境界。',
    rewardText: '属性点 +3 · 全属性上限 +1',
    reward: { skillPoints: 3, attrCapBonus: 1 }
  },
  {
    id: 'supercar_drive',
    title: '赛道体验超跑与家族聚会',
    category: '家庭',
    story: '包下专业赛车场带全家人体验顶级超跑过弯，晚上举办露天海鲜烧烤派对，全家其乐融融享受无忧休赛期。',
    rewardText: '士气 +20 · 资金 +$100,000 · 粉丝 +20,000',
    reward: { morale: 20, money: 100000, fans: 20000 }
  },
  {
    id: 'legend_visit',
    title: '拜访队史退役名宿',
    category: '交际',
    story: '登门拜访球队名誉老团长与传奇老巨星，聆听他们当年季后赛抢七绝杀的故事与豪门风骨，深受精神洗礼。',
    rewardText: '属性点 +2 · 媒体声望 +10 · 士气 +15',
    reward: { skillPoints: 2, mediaReputation: 10, morale: 15 }
  },
  {
    id: 'nba2k_cover_preview',
    title: '2K 动态捕捉与封面预热',
    category: '商业',
    story: '前往2K工作中心录制最新的招牌动作动态捕捉，并在游戏中体验到了自己高达90+的超强综合属性评级！',
    rewardText: '商业报酬 +$500,000 · 粉丝 +80,000',
    reward: { money: 500000, fans: 80000 }
  },
  {
    id: 'reading_room_donation',
    title: '爱心图书室捐建计划',
    category: '公益',
    story: '联合慈善基金会在全国贫困山区学校捐建了100间“爱心阳光图书室”与篮球角，陪伴万千乡村儿童阅读成长。',
    rewardText: '粉丝 +70,000 · 媒体声望 +15',
    reward: { fans: 70000, mediaReputation: 15 }
  },
  {
    id: 'city_key',
    title: '家乡市长颁发“城市之匙”',
    category: '社会',
    story: '家乡市政府在市政厅为你举办盛大嘉奖仪式，市长亲自将城市最高荣誉“城市钥匙”交到你手中，全城张灯结彩为你庆祝。',
    rewardText: '粉丝 +90,000 · 媒体声望 +20 · 士气 +20',
    reward: { fans: 90000, mediaReputation: 20, morale: 20 }
  }
];

export function getRandomOffseasonEvent(usedIds: Set<string>): OffseasonEvent {
  const available = OFFSEASON_EVENTS.filter((e) => !usedIds.has(e.id));
  if (available.length === 0) {
    // Fallback if all 40 have been used in past long career seasons
    const randomIndex = Math.floor(Math.random() * OFFSEASON_EVENTS.length);
    return OFFSEASON_EVENTS[randomIndex];
  }
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}
