import { PlayerProfile } from '../types';
import { TacticalOption } from './matchEvents';

export const generateTacticalOptions = (player: PlayerProfile, quarter: number): TacticalOption[] => {
  const pos = player.position || 'PG';
  const attrs = player.attributes;
  const morale = player.morale || 70;
  const name = player.name;

  const clampProb = (val: number) => {
    const mBonus = (morale - 50) * 0.001;
    return Math.min(0.88, Math.max(0.22, val + mBonus));
  };

  const pgPool: TacticalOption[] = [
    {
      id: 'pg_pnr_drive',
      title: '⚡ 挡拆极速突破拉杆上篮',
      desc: '借中锋高位掩护第一步爆发刺穿防线，直杀禁区打高板拉杆！',
      prob: clampProb((attrs.ballHandle * 0.4 + attrs.layup * 0.4 + attrs.speed * 0.2) / 100),
      statType: 'pts2',
      fanReward: 220,
      xpReward: 80,
      successText: `⚡ 变向极速撕裂！${name} 第一步刺穿防线拉杆避开封盖将球挑入网窝！`,
      failText: `❌ ${name} 强行突破深入遭到内线收缩包夹，抛投砸在后沿弹开。`,
    },
    {
      id: 'pg_pnr_pullup3',
      title: '🎯 挡拆弧顶拔起三分',
      desc: '防守者选择绕后防守，果断在三分线外弧顶干拔冷血出手！',
      prob: clampProb((attrs.threePoint * 0.7 + attrs.ballHandle * 0.2 + attrs.freeThrow * 0.1) / 100),
      statType: 'pts3',
      fanReward: 320,
      xpReward: 100,
      successText: `🎯 惩罚绕后防守！${name} 抓准一丝空隙弧顶干拔三分空心落网，引爆全场！`,
      failText: `❌ ${name} 弧顶干拔三分受到长臂干扰，砸筐弹出。`,
    },
    {
      id: 'pg_needle_pass',
      title: '🎯 手术刀击地击穿分球',
      desc: '吸引两人包夹后，不看人击地手术刀妙传底角空位！',
      prob: clampProb((attrs.passing * 0.7 + attrs.ballHandle * 0.3) / 100),
      statType: 'ast',
      fanReward: 200,
      xpReward: 75,
      successText: `🎯 大脑级视野！${name} 击地妙传穿透两人防线，队友空位三分手起刀落！`,
      failText: `❌ ${name} 的分球意图被对手防守预判破坏打出界外。`,
    },
    {
      id: 'pg_press_steal',
      title: '⚡ 全场高位死亡缠绕抢断',
      desc: '贴身死磕对手控卫，精准预判运球轨迹下手生剥断球！',
      prob: clampProb((attrs.steal * 0.5 + attrs.perimeterDef * 0.3 + attrs.speed * 0.2) / 100),
      statType: 'stl',
      fanReward: 250,
      xpReward: 90,
      successText: `⚡ 死亡缠绕生剥！${name} 快如闪电抢断成功，一条龙快攻单手暴扣！`,
      failText: `❌ ${name} 上抢过于凶狠被吹罚防守犯规。`,
    },
    {
      id: 'pg_stepback_mid',
      title: '🔥 招牌交叉步后撤步中投',
      desc: '连续体前变向点飞防守重心，拉开空间后撤步后仰跳投！',
      prob: clampProb((attrs.midRange * 0.6 + attrs.ballHandle * 0.4) / 100),
      statType: 'pts2',
      fanReward: 260,
      xpReward: 85,
      successText: `🔥 晃开两米空间！${name} 招牌后撤步中距离美如画跳投打进！`,
      failText: `❌ ${name} 后撤步幅度过大导致跳投出手失去平衡。`,
    },
    {
      id: 'pg_deep_logo_3',
      title: '🎯 Logo超远穿云箭三分',
      desc: '刚过半场中圈Logo位置不减速，抬手轰出超远穿云箭三分！',
      prob: clampProb((attrs.threePoint * 0.8 + attrs.ballHandle * 0.2) / 100),
      statType: 'pts3',
      fanReward: 400,
      xpReward: 120,
      successText: `🎯 库里式超远射程！${name} 在Logo标志区刚过半场直接出手，三分空心穿针！`,
      failText: `❌ ${name} 超远三分距离过远，打在筐前沿弹开。`,
    },
  ];

  const sgPool: TacticalOption[] = [
    {
      id: 'sg_catch_shoot_3',
      title: '🎯 卷切无球接球三分',
      desc: '通过底线双掩护无球跑位，接球瞬间毫不犹豫扬手就射！',
      prob: clampProb((attrs.threePoint * 0.75 + attrs.speed * 0.25) / 100),
      statType: 'pts3',
      fanReward: 300,
      xpReward: 95,
      successText: `🎯 顶级无球神射！${name} 甩开追防接球即投，三分如利箭穿心！`,
      failText: `❌ ${name} 跑位受阻接球稍慢，强行拔起三分偏出。`,
    },
    {
      id: 'sg_fastbreak_dunk',
      title: '⚡ 反击前场双手劈扣',
      desc: '抢下反击第一点全速下钻，前场腾空双手战斧劈扣！',
      prob: clampProb((attrs.layup * 0.5 + attrs.speed * 0.3 + attrs.insideFinish * 0.2) / 100),
      statType: 'pts2',
      fanReward: 280,
      xpReward: 90,
      successText: `⚡ 暴力血扣！${name} 前场一飞冲天，双手战斧劈扣炸响篮筐！`,
      failText: `❌ ${name} 冲筐被追身回防破坏未直接打进。`,
    },
    {
      id: 'sg_transition_3',
      title: '🎯 转换快攻急停追魂三分',
      desc: '快攻转换中不减速，三分线外追魂急停拔起就射！',
      prob: clampProb((attrs.threePoint * 0.75 + attrs.speed * 0.25) / 100),
      statType: 'pts3',
      fanReward: 330,
      xpReward: 105,
      successText: `🎯 追魂三分！${name} 快攻转换追魂急停三分手起刀落，百步穿杨！`,
      failText: `❌ ${name} 追魂三分出手过急打在后沿弹开。`,
    },
  ];

  const sfPool: TacticalOption[] = [
    {
      id: 'sf_iso_drive',
      title: '⚡ 45度单打碾压冲框',
      desc: '45度角持球单打，身体强行卡开防守者开路冲向篮筐！',
      prob: clampProb((attrs.layup * 0.4 + attrs.strength * 0.3 + attrs.ballHandle * 0.3) / 100),
      statType: 'pts2',
      fanReward: 250,
      xpReward: 85,
      successText: `⚡ 坦克推进！${name} 身体开路碾压防守，空中硬抗对抗上篮打进！`,
      failText: `❌ ${name} 强强撞击后失衡上篮弹偏。`,
    },
    {
      id: 'sf_chasedown_block',
      title: '🛡️ 追身飞身钉板大帽',
      desc: '对手快攻反击，全速回追从后方高高跃起送出钉板血帽！',
      prob: clampProb((attrs.block * 0.5 + attrs.speed * 0.3 + attrs.perimeterDef * 0.2) / 100),
      statType: 'blk',
      fanReward: 300,
      xpReward: 100,
      successText: `🛡️ 排球式钉板血帽！${name} 从天而降将对手上篮扇飞出底线！全场欢呼！`,
      failText: `❌ ${name} 追身打在对手手臂上被吹犯规。`,
    },
    {
      id: 'sf_corner_dagger',
      title: '🎯 底角杀人诛心三分',
      desc: '底角静候战术转移，接球冷血扬手发射三分！',
      prob: clampProb((attrs.threePoint * 0.85 + attrs.freeThrow * 0.15) / 100),
      statType: 'pts3',
      fanReward: 310,
      xpReward: 100,
      successText: `🎯 冷血杀手！${name} 底角三分手起刀落，比分瞬间拉开！`,
      failText: `❌ ${name} 底角三分弹在前沿砸偏。`,
    },
  ];

  const pfPool: TacticalOption[] = [
    {
      id: 'pf_pnr_dunk',
      title: '⚡ 挡拆顺下战斧双手暴扣',
      desc: '高位挡拆后极速下钻顺下，接球无缝腾空双手战斧劈扣！',
      prob: clampProb(((attrs.insideFinish || 60) * 0.4 + (attrs.vertical || 60) * 0.3 + attrs.strength * 0.3) / 100),
      statType: 'pts2',
      fanReward: 270,
      xpReward: 90,
      successText: `⚡ 战斧轰炸！${name} 空中接球起飞，双手暴扣把篮筐砸得巨响！`,
      failText: `❌ ${name} 顺下接球被内线强硬顶住切球。`,
    },
    {
      id: 'pf_post_fadeaway',
      title: '🏛️ 低位背身晃步后仰中投',
      desc: '背身顶开防守人，标志性晃步后仰跳投高弧线命中！',
      prob: clampProb(((attrs.postMove || 60) * 0.5 + attrs.midRange * 0.3 + attrs.strength * 0.2) / 100),
      statType: 'pts2',
      fanReward: 280,
      xpReward: 90,
      successText: `🏛️ 美如画后仰！${name} 背身脚步戏耍防守，标志性后仰跳投空心入网！`,
      failText: `❌ ${name} 低位背身转身角度偏小，跳投砸在前沿。`,
    },
    {
      id: 'pf_pick_pop_3',
      title: '🎯 挡拆外弹弧顶三分破密防',
      desc: '高位掩护后外弹弧顶三分线，接球惩罚沉退防守！',
      prob: clampProb((attrs.threePoint * 0.8 + attrs.midRange * 0.2) / 100),
      statType: 'pts3',
      fanReward: 320,
      xpReward: 100,
      successText: `🎯 空间大前杀招！${name} 挡拆后外弹弧顶，三分命中破沉退防守！`,
      failText: `❌ ${name} 外弹三分稍慢受封盖偏出。`,
    },
  ];

  const cPool: TacticalOption[] = [
    {
      id: 'c_post_hook',
      title: '🔥 低位背打招牌天勾',
      desc: '低位靠住防守队员，转过身来伸出长臂招牌勾手投篮！',
      prob: clampProb(((attrs.postMove || 60) * 0.6 + (attrs.insideFinish || 60) * 0.2 + attrs.strength * 0.2) / 100),
      statType: 'pts2',
      fanReward: 260,
      xpReward: 85,
      successText: `🔥 无法阻挡的天勾！${name} 低位背打转身勾手，高弧线空心落网！`,
      failText: `❌ ${name} 勾手出手弧线欠佳砸筐。`,
    },
    {
      id: 'c_rim_protection_block',
      title: '🛡️ 禁区遮天蔽日原地血帽',
      desc: '正面迎战对方攻筐，高高举起长臂在空中直接按死！',
      prob: clampProb((attrs.block * 0.4 + (attrs.interiorDef || 60) * 0.4 + (attrs.vertical || 60) * 0.2) / 100),
      statType: 'blk',
      fanReward: 320,
      xpReward: 100,
      successText: `🛡️ 遮天蔽日！${name} 原地起飞单手把对手的扣篮硬按死在空中！`,
      failText: `❌ ${name} 护筐动作稍慢，身体接触后被吹罚普通犯规。`,
    },
    {
      id: 'c_reb_putback',
      title: '💥 冲抢前场篮板二次补扣',
      desc: '在卡位人群中预判落点腾空起跳，力压群雄双手暴力补扣得分！',
      prob: clampProb(((attrs.rebounding || 60) * 0.5 + (attrs.vertical || 60) * 0.3 + attrs.strength * 0.2) / 100),
      statType: 'reb',
      fanReward: 290,
      xpReward: 95,
      successText: `💥 禁区统治者！${name} 在人群头顶高高跃起抓下前场篮板，顺势双手暴力补扣打进！`,
      failText: `❌ ${name} 拼抢前场篮板时卡位失误，皮球弹出底线。`,
    },
  ];

  let rawPool = pgPool;
  if (pos === 'SG') rawPool = sgPool;
  if (pos === 'SF') rawPool = sfPool;
  if (pos === 'PF') rawPool = pfPool;
  if (pos === 'C') rawPool = cPool;

  const shuffled = [...rawPool].sort(() => Math.random() - 0.5);
  const pickedThree = shuffled.slice(0, 3);

  const neutralOption: TacticalOption = {
    id: 'neutral_safe_play',
    title: '🛡️ 稳健导球遵从战术 (100% 成功)',
    desc: '遵从主教练安排，稳稳将球传给受应队友，不强打风险球，保持团队战术纪律与攻防阵型。',
    prob: 1.0,
    isNeutral: true,
    fanReward: 50,
    xpReward: 40,
    statType: 'none',
    successText: `✅ 【团队战术稳健执行】 ${name} 遵从教练指示稳稳推进战术，保持了良好的团队攻防阵型。`,
    failText: '',
  };

  return [...pickedThree, neutralOption];
};

