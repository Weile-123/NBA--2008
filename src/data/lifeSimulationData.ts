export interface LifeOption {
  text: string;
  scoreDelta: number; // e.g. +0.67, +0.33, +0.00
  effectDesc: string;
  tag?: string;
}

export interface LifeEvent {
  stage: number;
  timeLabel: string;
  title: string;
  story: string;
  options: [LifeOption, LifeOption, LifeOption];
}

export function get15LifeSimulationEvents(
  birthplace: string = '纽约',
  familyBackground: string = '街头球手'
): LifeEvent[] {
  const city = birthplace || '纽约';
  const bg = familyBackground || '街头球手';

  // Helper background context strings
  let originIntro = '';
  if (bg === '篮球世家') {
    originIntro = `作为来自${city}的篮球世家传人，你从小在曾是联盟职业球员的父辈与私人名师严格调教下长大，血液里淌着职业篮球DNA。`;
  } else if (bg === '学霸') {
    originIntro = `作为来自${city}的学霸球员，你不仅GPA保持全A，更将运动科学与战术数据分析融会贯通，拥有同龄人难以企及的极高球商。`;
  } else if (bg === '普通人') {
    originIntro = `你出生于${city}普通的打工家庭，没有球星光环与特权基因，仅凭对篮球极致的热爱与每天百倍的汗水一步步走向全美视野。`;
  } else {
    // 街头球手
    originIntro = `你在${city}最硬核的街头露天铁笼球场一路从野战打到轰动全城，身上带着狂暴野性、窒息撕咬感与高压下的不屈狠劲。`;
  }

  // 1. Stage 1: High School Selection (4 sets according to background!)
  let stage1Options: [LifeOption, LifeOption, LifeOption];
  let stage1Title = '';
  let stage1Story = '';

  if (bg === '篮球世家') {
    stage1Title = `${city}世家少爷 · 全美名校特权邀请`;
    stage1Story = `${originIntro}15岁那年，全美数家高中篮球圣地同时为你抛出橄榄枝。你可以凭借世家资源做出抉择：`;
    stage1Options = [
      {
        text: '加盟橡树山高中：全美封闭篮球圣地，接受最严苛的职业级战术与纪律磨砺',
        scoreDelta: 0.67,
        effectDesc: '基本功与战术执行力达到同龄全美顶级！球探报告提升！',
        tag: '严律学徒',
      },
      {
        text: '加盟父辈母校圣玛丽高中：继承父辈传奇背号，担负起绝对核心的战术重任',
        scoreDelta: 0.50,
        effectDesc: '领袖气质与单打自信大幅增强！',
        tag: '世家继承人',
      },
      {
        text: '加盟加州私立预科高中：兼顾好莱坞聚光灯曝光与全套私人体能训练团队',
        scoreDelta: 0.33,
        effectDesc: '商业话题度爆棚，建立全美知名度与媒体关注！',
        tag: '聚光灯新星',
      },
    ];
  } else if (bg === '学霸') {
    stage1Title = `${city}学霸智将 · 顶级名校实验室邀请`;
    stage1Story = `${originIntro}15岁那年，全美顶级名校被你的高球商比赛录像与全A学业成绩所震惊。你的高中选择是：`;
    stage1Options = [
      {
        text: '加盟塞拉峡谷高中：引入全套战术数据分析实验室与顶级运动科学特训',
        scoreDelta: 0.67,
        effectDesc: '比赛阅读能力与战术分析水平达到顶级！',
        tag: '战术大脑',
      },
      {
        text: '加盟菲利普斯埃克塞特学院：顶级名门学府，获得常春藤联盟保送名额',
        scoreDelta: 0.50,
        effectDesc: '战术素养严谨克制，高压下情绪控制极其出色！',
        tag: '学府智将',
      },
      {
        text: '留守${city}重点公立高中：兼顾GPA 4.0与校队队长统帅地位',
        scoreDelta: 0.33,
        effectDesc: '全面彰显学业与球场双重领袖统治力！',
        tag: '全A队长',
      },
    ];
  } else if (bg === '普通人') {
    stage1Title = `${city}普通少年 · 逆袭起步的考验`;
    stage1Story = `${originIntro}15岁那年，你没有任何特权与名气，只能在高中试训中靠拼命干活打动选拔人员。你的选择是：`;
    stage1Options = [
      {
        text: '加盟家乡小镇公立高中：从预备队饮水机和看台打起，靠每一分汗水抢到主力首发',
        scoreDelta: 0.67,
        effectDesc: '意志品质极其坚韧！展现惊人的草根逆袭抗压能力！',
        tag: '草根逆袭',
      },
      {
        text: '加盟跨州寄宿私立高中：依靠全额助学金独自打拼，顶住异乡同龄人的竞争',
        scoreDelta: 0.50,
        effectDesc: '极度独立且心理素质极强！',
        tag: '孤勇斗士',
      },
      {
        text: '加盟社区职业高中：白天咬牙苦练篮球基本功，晚上参与社区青少年篮球训练班',
        scoreDelta: 0.33,
        effectDesc: '踏实笃定，基本功打得无比扎实！',
        tag: '踏实苦干',
      },
    ];
  } else {
    // 街头球手
    stage1Title = `${city}街头霸主 · 铁笼暴徒冲击高中赛场`;
    stage1Story = `${originIntro}15岁那年，你称霸了${city}所有露天水泥球场，全美高中球探被你狂野撕咬的打法所震撼。你的选择是：`;
    stage1Options = [
      {
        text: '加盟纽约林肯高中：街头硬核篮球圣地，在黑网铁笼对抗中磨炼肉搏单打',
        scoreDelta: 0.67,
        effectDesc: '攻防两端极具狂暴撕咬性！身体对抗能力暴涨！',
        tag: '街头铁笼王者',
      },
      {
        text: '加盟洛杉矶克伦肖高中：融入极致跑轰快攻，用飞人扣篮轰炸全场',
        scoreDelta: 0.50,
        effectDesc: '快攻推进与爆发力炸裂，球风极其吸睛！',
        tag: '快攻飞人',
      },
      {
        text: '留守本土社区高中：扛起整座街区球迷的期望，享受绝对无限开火权',
        scoreDelta: 0.33,
        effectDesc: '得分爆发力极强，成为全街区追捧的球场英雄！',
        tag: '街头独核',
      },
    ];
  }

  // 2. Stage 6: College Choice (3 Distinct Styled Colleges)
  const stage6Options: [LifeOption, LifeOption, LifeOption] = [
    {
      text: '加盟杜克大学 · 蓝魔战术大本营：在顶级名帅麾下锤炼顶尖战术素养、防守纪律与比赛阅读',
      scoreDelta: 0.67,
      effectDesc: '战术执行力与球场防守智商达到联盟级别！',
      tag: '蓝魔战术基石',
    },
    {
      text: '加盟肯塔基大学 · 野猫造星工厂：汇聚全美顶尖天才，在极高压力的1v1单打竞争中淬炼死角杀招',
      scoreDelta: 0.50,
      effectDesc: '单打爆破能力与高压适应性达到极佳状态！',
      tag: '野猫单打杀手',
    },
    {
      text: '加盟冈萨加大学 · 团队黑马圣地：融入极致无私传球与团队战术，成长为全场进攻大脑',
      scoreDelta: 0.33,
      effectDesc: '助攻与团队串联能力出众，战术适应力强。',
      tag: '团队战术大脑',
    },
  ];

  // 15 Dynamic Stages
  const rawEvents: LifeEvent[] = [
    // Stage 1
    {
      stage: 1,
      timeLabel: '高中一年级 · 启蒙与择校',
      title: stage1Title,
      story: stage1Story,
      options: stage1Options,
    },

    // Stage 2: 训练与特训
    {
      stage: 2,
      timeLabel: '高中二年级 · 苦练与信仰',
      title: `${city}深夜11点球馆灯光熄灭`,
      story: `深夜11点，高中球馆大门即将关闭。队友们都已回宿舍休息。作为${bg}出身的你，看着空无一人的球馆，决定如何度过这个夜晚？`,
      options: [
        {
          text: '加练1000次投篮与防守脚步直至午夜，把肌肉记忆练到极致',
          scoreDelta: 0.67,
          effectDesc: '投篮手感与意志耐力极大提升！',
          tag: '苦练狂魔',
        },
        {
          text: '前往健身房做力量与核心稳定性特训，增强身体对抗耐受度',
          scoreDelta: 0.50,
          effectDesc: '身体对抗耐受度与核心力量显著增强！',
          tag: '核心硬汉',
        },
        {
          text: '提早休息保养身体，用平板电脑仔细研究下一个对手的战术录像',
          scoreDelta: 0.33,
          effectDesc: '身体恢复充沛，储备了对手核心进攻习惯情报！',
          tag: '战术储备',
        },
      ],
    },

    // Stage 3: 州锦标赛生死时刻
    {
      stage: 3,
      timeLabel: '高中二年级 · 州锦标赛',
      title: '决赛最后4.2秒压哨生死时刻',
      story: `全美ESPN直播州锦标赛决赛，球队落后1分，最后4.2秒暂停。战术板画出绝杀安排，来自${city}的你站在聚光灯中央。`,
      options: [
        {
          text: '主动请缨要球：在两人包夹下拉开空间迎面干拔跳投',
          scoreDelta: 0.67,
          effectDesc: '皮球划出完美弧线绝杀入网！展现超级大心脏！',
          tag: '关键绝杀先生',
        },
        {
          text: '强行突破吸引三人防守，空中秒传底角空位队友跳投',
          scoreDelta: 0.50,
          effectDesc: '队友空位绝杀成功！展现无私顶级球商！',
          tag: '绝妙串联',
        },
        {
          text: '遵照战术跑位在弱侧拉开空间，全力拉扯防守注意力',
          scoreDelta: 0.33,
          effectDesc: '完美吸引对方防守侧翼，助力主力战术轻松得分！',
          tag: '拉扯牵制',
        },
      ],
    },

    // Stage 4: 社交与自律
    {
      stage: 4,
      timeLabel: '高中三年级 · 名气与自律',
      title: '好莱坞网红派对与清晨6点特训',
      story: `你在社交平台拥有百万粉丝，网红与知名说唱歌手邀请你参加通宵派对。而明早6点就是球队的魔鬼体能特训。面对【${bg}】的身份，你如何选择？`,
      options: [
        {
          text: '婉拒派对邀请：晚上10点按时休息，清晨6点第一个出现在球馆投篮',
          scoreDelta: 0.67,
          effectDesc: '极度自律职业态度令所有联盟高管肃然起敬！',
          tag: '极度自律',
        },
        {
          text: '参加派对露面打卡1小时，凌晨5点赶去球馆做恢复与拉伸特训',
          scoreDelta: 0.50,
          effectDesc: '社交影响力与比赛状态兼顾，展现惊人体能恢复！',
          tag: '高能达人',
        },
        {
          text: '在社交平台直播为球队拉赞助与宣传，兼顾社交影响力与品牌建设',
          scoreDelta: 0.33,
          effectDesc: '商业价值与人气大涨，建立极高品牌关注度！',
          tag: '品牌新星',
        },
      ],
    },

    // Stage 5: 麦当劳全美全明星赛
    {
      stage: 5,
      timeLabel: '高中四年级 · 麦当劳全美全明星',
      title: '芝加哥全美五星高中生对决',
      story: `你作为${city}代表入选麦当劳全美全明星赛。看台上云集了全美所有联盟总经理与传奇巨星球探。`,
      options: [
        {
          text: '开启全攻全守模式：在攻防两端全面展现个人单打与领防统治力',
          scoreDelta: 0.67,
          effectDesc: '狂轰35分斩获MVP！升至全美五星高中生前三行列！',
          tag: '全美MVP',
        },
        {
          text: '专注于全场领防与战术串联，撕咬对方顶尖得分手并梳理全队',
          scoreDelta: 0.50,
          effectDesc: '全能润滑剂角色打动老派总经理！',
          tag: '全能基石',
        },
        {
          text: '展示华丽球风：与队内顶尖后卫频繁演练空中接力与表演性扣篮',
          scoreDelta: 0.33,
          effectDesc: '球风极具观赏性，征服全场观众与媒体镜头！',
          tag: '华丽表演家',
        },
      ],
    },

    // Stage 6: NCAA大学择校
    {
      stage: 6,
      timeLabel: '毕业季 · NCAA重磅择校',
      title: '杜克、肯塔基与冈萨加发来全额奖学金',
      story: `毕业季降临，全美NCAA 3所不同风格名校为你开出全额奖学金承诺。作为${bg}出身的球员，你做出决定：`,
      options: stage6Options,
    },

    // Stage 7: NCAA菜鸟揭幕战
    {
      stage: 7,
      timeLabel: 'NCAA大一 · 菜鸟揭幕战',
      title: '客场全场嘘声与手感冰冻',
      story: 'NCAA全美直播揭幕战对阵前五豪门。上半场你手感冰冻5投0中，主场球迷齐声对你高喊“过气水货”。',
      options: [
        {
          text: '冷静调整战术：改用领防、拼抢前场篮板与制造犯规掌控节奏',
          scoreDelta: 0.67,
          effectDesc: '下半场独得20分6抢断带队逆转！逆境抗压满格！',
          tag: '逆境抗压专家',
        },
        {
          text: '坚持坚决信念：下半场继续果断选择在外线坚决拔起出手',
          scoreDelta: 0.50,
          effectDesc: '下半场连续干拔拔进3记三分！展现极强射手自信！',
          tag: '神射爆发',
        },
        {
          text: '改打团队策应：积极设立高位掩护并弧顶分球，帮助队友撕开防线',
          scoreDelta: 0.33,
          effectDesc: '展现极佳战术适应力，靠5次助攻盘活全队攻势！',
          tag: '团队润滑剂',
        },
      ],
    },

    // Stage 8: 更衣室老将碰撞
    {
      stage: 8,
      timeLabel: 'NCAA大一 · 更衣室磨合',
      title: '大三队长的正面质疑',
      story: '大三队长在训练赛后对你作为大一新生占据大量持球权极为不满，并在更衣室里当众向你叫板挑战。',
      options: [
        {
          text: '主动私下沟通：分析战术互补方案，共同带领全队争胜',
          scoreDelta: 0.67,
          effectDesc: '更衣室凝聚力满格，领袖高情商口碑大爆！',
          tag: '更衣室领袖',
        },
        {
          text: '接受单挑对决：在1v1队内对抗中展示实力，用硬实力赢取尊重',
          scoreDelta: 0.50,
          effectDesc: '单挑大胜对手，确立绝对球场威望与单打地位！',
          tag: '实力制霸',
        },
        {
          text: '主动承担防守脏活：在训练赛中主动领防对方核心，用防守态度征服全队',
          scoreDelta: 0.33,
          effectDesc: '用无私的防守态度赢得了队长与教练组的信任！',
          tag: '防守大闸',
        },
      ],
    },

    // Stage 9: 伤病与复健考验
    {
      stage: 9,
      timeLabel: 'NCAA赛季中期 · 伤病考验',
      title: '脚踝II级扭伤与全美焦点战',
      story: '全美天王山大战前夕，你在训练中不慎脚踝扭伤。队医建议休战，但全美焦点之战就在下周。',
      options: [
        {
          text: '听从科学复健：遵医嘱休战并加练上肢力量与战术录像分析',
          scoreDelta: 0.67,
          effectDesc: '完全康复且力量大增，长远职业规划备受赞誉！',
          tag: '科学自律',
        },
        {
          text: '进行理疗高压氧与局部防护：在医疗保障下带伤出战关键天王山',
          scoreDelta: 0.50,
          effectDesc: '带伤出战关键球场得分！铁血精神感动全场！',
          tag: '铁血硬汉',
        },
        {
          text: '采用中西医结合与水疗复健：在不伤及韧带的前提下进行高强度水下跑步恢复',
          scoreDelta: 0.33,
          effectDesc: '康复速度远超预期，展现惊人的身体恢复天赋！',
          tag: '极速复苏',
        },
      ],
    },

    // Stage 10: 战术体系更迭
    {
      stage: 10,
      timeLabel: 'NCAA赛季中后期 · 战术转型',
      title: '极速小球体系与换防要求',
      story: '球队决定改组为极速小球体系，要求你增加无球掩护跑动，甚至在防守端跨位置换防对方内线巨兽。',
      options: [
        {
          text: '全力配合战术转型：苦练无球跑位与多位置错位换防',
          scoreDelta: 0.67,
          effectDesc: '转型为现代联盟最青睐的顶级全能战士！',
          tag: '全能防守战士',
        },
        {
          text: '提议保留持球解球权：在保持小球速度的同时承担战术硬解重任',
          scoreDelta: 0.50,
          effectDesc: '保持绝对单打威胁，成为球队解球核心！',
          tag: '硬解持球核',
        },
        {
          text: '转型为空间型无球神射：利用无球跑动与快速释放牵制对手内线防守',
          scoreDelta: 0.33,
          effectDesc: '成为小球体系中最具威慑力的外线空间炮台！',
          tag: '空间炮台',
        },
      ],
    },

    // Stage 11: 疯狂三月 32强关头
    {
      stage: 11,
      timeLabel: '疯狂三月 · 32强',
      title: '疯狂三月一败即淘汰生死线',
      story: '疯狂三月32强战，比赛最后45秒平分。对方主力后卫强行突破内线，你正处于补防协防关键位置。',
      options: [
        {
          text: '站稳预判脚跟：看准对方突破路线提前预判站位制造进攻犯规',
          scoreDelta: 0.67,
          effectDesc: '造犯规成功！球探惊呼防守智商超群！',
          tag: '高球商防守',
        },
        {
          text: '飞身腾空起跳：高高跃起冲向篮筐尝试送出追身大帽',
          scoreDelta: 0.50,
          effectDesc: '送出遮天蔽日钉板大帽！预定疯三最佳十佳球！',
          tag: '追帽狂人',
        },
        {
          text: '迅速横移封堵传球路线：抢先切入传球轨道预判抢断',
          scoreDelta: 0.33,
          effectDesc: '精准预判完成抢断！打出经典转换快攻得分！',
          tag: '预判神偷',
        },
      ],
    },

    // Stage 12: Final Four 最终四强
    {
      stage: 12,
      timeLabel: 'Final Four 最终四强 · 天王山',
      title: '7万观众前面的Final Four总决赛',
      story: `在超级巨型球馆7万名观众面前，NCAA总决赛最后1.5分钟球队落后2分。全美所有联盟总经理都在看台上屏息注视来自${city}的你。`,
      options: [
        {
          text: '果断干拔跳投：后撤步拉开空间超远三分拔起出手',
          scoreDelta: 0.67,
          effectDesc: '皮球划出完美弧线绝杀入网！疯三历史级神级名场面！',
          tag: '疯三神射手',
        },
        {
          text: '杀入禁区强攻：硬抗对方内线巨兽冲击篮筐拉杆上篮',
          scoreDelta: 0.50,
          effectDesc: '空中挺身打成高难度2+1！对抗与韧性征服全场球探！',
          tag: '关键2+1',
        },
        {
          text: '突分妙传空位：吸引三人包夹后跳起突分底角空位队友',
          scoreDelta: 0.33,
          effectDesc: '助攻队友命中准绝杀！展现极其冷静的顶级球商！',
          tag: '冷静大脑',
        },
      ],
    },

    // Stage 13: NBA 选秀联合体测 Combine
    {
      stage: 13,
      timeLabel: '联盟 选秀联合体测 · Combine',
      title: '芝加哥选秀联合体测聚光灯',
      story: `你来到了芝加哥联盟选秀联合体测现场。在臂展、助跑弹跳与三分投篮测试中，球探报告特别标注了你的出身故事：【${city} · ${bg}】。`,
      options: [
        {
          text: '全力冲刺助跑弹跳测试：在垂直与助跑弹跳测试中展现炸裂身体天赋',
          scoreDelta: 0.67,
          effectDesc: '助跑弹跳高达42英寸破纪录！体测报告被评为A+超级运动天才！',
          tag: '身体素质怪兽',
        },
        {
          text: '参与百投定点三分测试：在定点与移动三分投篮测试中全力施展',
          scoreDelta: 0.50,
          effectDesc: '100投92中！展现历史级投篮手感与稳定性报告！',
          tag: '神射精英',
        },
        {
          text: '出战高强度5v5全场实战对抗：在体测对抗赛中担任全场控场核心',
          scoreDelta: 0.33,
          effectDesc: '送出12次助攻0失误！凭借顶尖球商与比赛阅读征服球探！',
          tag: '控场大师',
        },
      ],
    },

    // Stage 14: 选秀前试训博弈
    {
      stage: 14,
      timeLabel: '选秀前一周 · 试训与经纪人博弈',
      title: '联盟乐透区球队单独试训',
      story: '顶级经纪人为你争取到了多支手握首轮乐透签球队的单独试训邀请。面对高压1v1单挑对抗，你如何应对？',
      options: [
        {
          text: '接受乐透球队单独试训：在1v1高强度单挑与防守对抗中全力出击',
          scoreDelta: 0.67,
          effectDesc: '试训表现统治级，选秀行情稳居首轮高顺位！',
          tag: '试训统治者',
        },
        {
          text: '与经纪人深度配合：重点针对心仪的目标主队进行多轮深度试训',
          scoreDelta: 0.50,
          effectDesc: '主队管理层极其满意，获得选秀承诺！',
          tag: '主队承诺',
        },
        {
          text: '参加多队联合对抗试训：在5v5实战对抗中同时展示单打与战术串联',
          scoreDelta: 0.33,
          effectDesc: '展现极高战术兼容性，多家首轮球队给出极高评价！',
          tag: '全面兼容',
        },
      ],
    },

    // Stage 15: 选秀前夜麦迪逊花园表态
    {
      stage: 15,
      timeLabel: '2008 选秀前夜 · 麦迪逊花园',
      title: '选秀前夜纽约红毯表态',
      story: `选秀前夜，纽约麦迪逊广场花园红毯上，TNT记者将麦克风递到你面前：“从${city}走到2008 联盟选秀大会，作为【${bg}】的代表，你对新秀赛季有什么话想对全世界说？”`,
      options: [
        {
          text: '“我不只是来适应这个联盟的，我是来建立属于我的传奇时代的！”',
          scoreDelta: 0.67,
          effectDesc: '霸气宣言轰动全美！开启极高期待的巨星生涯！',
          tag: '霸气传奇',
        },
        {
          text: '“无论哪支球队选中我，我都会付出100%的汗水，帮助球队赢下总冠军！”',
          scoreDelta: 0.50,
          effectDesc: '踏实沉稳的态度深受管理层与球迷喜爱！',
          tag: '基石之才',
        },
        {
          text: '“用球场上的实际行动与每一场胜利说话，向全联盟证明自己的真正价值！”',
          scoreDelta: 0.33,
          effectDesc: '展现极佳的职业成熟度与必胜信念，深得老派管理层赞赏！',
          tag: '实干战术家',
        },
      ],
    },
  ];

  // Shuffle options order for EVERY stage so option 1 is not always the best one
  return rawEvents.map((ev) => {
    const shuffledOptions = [...ev.options].sort(() => Math.random() - 0.5) as [LifeOption, LifeOption, LifeOption];
    return {
      ...ev,
      options: shuffledOptions,
    };
  });
}
