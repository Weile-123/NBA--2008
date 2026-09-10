import { PlayerProfile, Team, MatchLog, SocialTweet } from '../types';

export function generatePlayByPlay(
  userTeam: Team,
  oppTeam: Team,
  player: PlayerProfile,
  quarter: number,
  isOnCourt: boolean = true
): MatchLog[] {
  const logs: MatchLog[] = [];
  const userStarName = player.name;
  const oppStarName = oppTeam.starPlayer.split('&')[0].trim();
  const ovr = player.ovr || 70;

  // Realistic actions depending on OVR & whether player is on court
  let userActions: string[];

  if (!isOnCourt) {
    // Teammate actions when player is on the bench resting
    userActions = [
      `${userTeam.name} 控卫突破弧顶分球，中锋顺下抛投取分。`,
      `${userTeam.name} 战术掩护，外线射手空位三分稳稳命中！`,
      `${userTeam.name} 禁区内线卡位强打，造成对手犯规站上罚球线。`,
      `${userTeam.name} 拼抢下前场篮板，补篮打进2分。`,
      `${userTeam.name} 抢断快速打反击，轻松前场上篮得分。`,
    ];
  } else if (ovr < 80) {
    // Rookie / Role player (~70 OVR) actions on court
    userActions = [
      `${userStarName} 积极战术跑位接球，弧顶中距离空位稳稳命中！`,
      `${userStarName} 与队友做掩护切入，接击地妙传低手上篮打进2分。`,
      `${userStarName} 突破吸引包夹后迅速分球给底角队友，送出精彩助攻！`,
      `${userStarName} 积极冲抢卡位，保护下后场防守篮板。`,
      `${userStarName} 快攻跟进，接队友传球轻松舔篮得分。`,
      `${userStarName} 造对手防守犯规，站上罚球线两罚命中。`,
      `${userStarName} 积极伸手干涉对手传球路线，破坏了对方的一场快攻。`,
      `${userStarName} 底角接球尝试试探步，中距离抛投弹框入网。`,
    ];
  } else {
    // Star player (80+ OVR) actions on court
    userActions = [
      `${userStarName} 运球变向突破，罚球线拔起中投，空心入网！`,
      `${userStarName} 与中锋做挡拆配合，击地妙传助攻队友双手暴扣！`,
      `${userStarName} 外线接球起跳，无视防守干拔三分——命中！`,
      `${userStarName} 预判传球路线抢断，快攻前场单臂扣篮！`,
      `${userStarName} 面对 ${oppStarName} 贴身防守，后撤步三分出手打进！`,
      `${userStarName} 杀入禁区抗住对抗，拉杆上篮打成 2+1！`,
    ];
  }

  const oppActions = [
    `${oppTeam.name} ${oppStarName} 借掩护干拔中投命中。`,
    `${oppTeam.name} 底角三分冷箭穿心，拉开分差。`,
    `${oppTeam.name} 禁区强打得手并造成犯规。`,
    `${oppTeam.name} 快速反击推前场，轻松轻松上篮拿到2分。`,
    `${oppTeam.name} ${oppStarName} 招牌背身单打，翻身跳投空心破网。`,
  ];

  const times = ['11:20', '09:45', '07:15', '04:30', '01:10', '00:05'];

  times.forEach((t, idx) => {
    const isUser = Math.random() > 0.45;
    if (isUser) {
      const act = userActions[Math.floor(Math.random() * userActions.length)];
      logs.push({
        id: `q${quarter}_${idx}`,
        quarter,
        time: t,
        text: act,
        type: act.includes('压哨') || act.includes('2+1') || act.includes('暴扣') ? 'highlight' : 'user',
        points: act.includes('三分') ? 3 : act.includes('2+1') ? 3 : 2,
      });
    } else {
      const act = oppActions[Math.floor(Math.random() * oppActions.length)];
      logs.push({
        id: `q${quarter}_${idx}`,
        quarter,
        time: t,
        text: act,
        type: 'away',
        points: act.includes('三分') ? 3 : 2,
      });
    }
  });

  return logs;
}

export function generateTweets(
  player: PlayerProfile,
  userTeam: Team,
  oppTeam: Team,
  userScore: number,
  oppScore: number,
  pts: number,
  ast: number,
  reb: number
): SocialTweet[] {
  const isWin = userScore > oppScore;

  const authors = [
    { author: 'Skip Bayless', handle: '@RealSkipBayless', avatar: '🎙️' },
    { author: 'Shaquille O\'Neal', handle: '@SHAQ', avatar: '👑' },
    { author: 'ESPN Stats & Info', handle: '@ESPNStatsInfo', avatar: '📊' },
    { author: 'Kobe Bryant', handle: '@kobebryant', avatar: '🐍' },
    { author: '联盟 Central', handle: '@The联盟Central', avatar: '🏀' },
    { author: 'Woj', handle: '@wojespn', avatar: '💣' },
  ];

  const tweets: SocialTweet[] = [];

  if (isWin) {
    tweets.push({
      id: `tw_${Date.now()}_1`,
      author: 'ESPN Stats & Info',
      handle: '@ESPNStatsInfo',
      avatar: '📊',
      content: `💥 统治级表现！${player.name} 今夜打出 ${pts}分 ${reb}篮板 ${ast}助攻，带领 ${userTeam.name} 以 ${userScore}-${oppScore} 战胜 ${oppTeam.name}！`,
      time: '10分钟前',
      likes: Math.floor(Math.random() * 20000) + 12000,
      retweets: Math.floor(Math.random() * 5000) + 3000,
    });

    if (pts >= 30) {
      tweets.push({
        id: `tw_${Date.now()}_2`,
        author: 'Shaquille O\'Neal',
        handle: '@SHAQ',
        avatar: '👑',
        content: `BBQ Chicken Alert! 狂砍${pts}分！这个来自2008届的新秀太狂暴了！曼巴精神传承者！🔥🔥🔥`,
        time: '25分钟前',
        likes: Math.floor(Math.random() * 45000) + 20000,
        retweets: Math.floor(Math.random() * 9000) + 4000,
      });
    } else {
      tweets.push({
        id: `tw_${Date.now()}_3`,
        author: 'Kobe Bryant',
        handle: '@kobebryant',
        avatar: '🐍',
        content: `@${player.name} 今晚掌控了比赛节奏，保持专注，工作还没有完成！#MambaMentality`,
        time: '40分钟前',
        likes: Math.floor(Math.random() * 89000) + 50000,
        retweets: Math.floor(Math.random() * 18000) + 9000,
      });
    }
  } else {
    tweets.push({
      id: `tw_${Date.now()}_4`,
      author: 'Skip Bayless',
      handle: '@RealSkipBayless',
      avatar: '🎙️',
      content: `别再吹捧 ${player.name} 了！虽然砍下${pts}分，但末节缺乏关键基因，眼睁睁看着 ${oppTeam.name} 拿走了胜利！Clutch Gene 在哪呢？`,
      time: '15分钟前',
      likes: Math.floor(Math.random() * 15000) + 8000,
      retweets: Math.floor(Math.random() * 4000) + 2000,
    });

    tweets.push({
      id: `tw_${Date.now()}_5`,
      author: '联盟 Central',
      handle: '@The联盟Central',
      avatar: '🏀',
      content: `💔 惜败！${userTeam.name} ${userScore}-${oppScore} 不敌 ${oppTeam.name}。${player.name} 拿下 ${pts}分 ${ast}助攻，球队防守端仍需提升。`,
      time: '30分钟前',
      likes: Math.floor(Math.random() * 9000) + 5000,
      retweets: Math.floor(Math.random() * 2000) + 1000,
    });
  }

  return tweets;
}

export interface PressConferenceOption {
  text: string;
  moraleChange: number;
  mediaRepChange: number;
  fanChange: number;
  responseQuote: string;
}

export function generatePressQuestion(pts: number, isWin: boolean): {
  question: string;
  options: PressConferenceOption[];
} {
  if (isWin) {
    return {
      question: `记者提问：“今晚你打出了爆棚的数据并带领球队取胜，你如何评价自己今晚的表现和队友的协作？”`,
      options: [
        {
          text: '团队至上：“胜利属于整支团队，没有队友的掩护和防守，我不可能得这么多分。”',
          moraleChange: +10,
          mediaRepChange: +8,
          fanChange: +1500,
          responseQuote: '队长和队友们在更衣室为你鼓掌，队内化学反应大增！',
        },
        {
          text: '霸气自信：“我从不怀疑自己的能力，只要我上场，对方根本没有人能防住我。”',
          moraleChange: -2,
          mediaRepChange: +12,
          fanChange: +4000,
          responseQuote: '全美各大体育头条争相报道你的狂傲宣言，粉丝急剧暴涨！',
        },
        {
          text: '保持饥渴：“比赛已经过去，我们还有更高的目标，明天的训练才是重点。”',
          moraleChange: +5,
          mediaRepChange: +10,
          fanChange: +2000,
          responseQuote: '黑曼巴式的专注态度赢得了全联盟名宿的认可！',
        },
      ],
    };
  } else {
    return {
      question: `记者提问：“今晚球队遗憾失利，末节进攻遭遇阻碍，作为核心你如何看待这场败仗？”`,
      options: [
        {
          text: '承担责任：“失利全在我，末节我的几个决策不够好，我会看录像吸取教训。”',
          moraleChange: +8,
          mediaRepChange: +10,
          fanChange: +1000,
          responseQuote: '媒体赞扬了你的担当与领袖气质。',
        },
        {
          text: '指出问题：“我们在防守端送了太多轻松得分，每个人都必须在防守端拿出拼劲。”',
          moraleChange: -5,
          mediaRepChange: +4,
          fanChange: +500,
          responseQuote: '更衣室出现微弱警示，但队友们感受到了紧迫感。',
        },
        {
          text: '向前看：“这只是82场常规赛中的一场，下一场我们会赢回来的。”',
          moraleChange: +2,
          mediaRepChange: +3,
          fanChange: +800,
          responseQuote: '平实的心态保证了球队士气稳定。',
        },
      ],
    };
  }
}
