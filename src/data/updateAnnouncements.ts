export interface UpdateSection {
  title: string;
  items: string[];
}

export interface UpdateVersion {
  version: string;
  sections: UpdateSection[];
}

export interface UpdateAnnouncement {
  id: string;
  publishedAt: string;
  title: string;
  introduction: string[];
  versions: UpdateVersion[];
}

// Maintenance rule: keep the newest player-facing announcement first, and
// include completed features, optimizations and bug fixes in concise wording.
export const UPDATE_ANNOUNCEMENTS: UpdateAnnouncement[] = [
  {
    id: '20260913-1518',
    publishedAt: '2026-09-13 15:18',
    title: '第六次更新说明',
    introduction: [
      '所有玩家的反馈都已收到并查看，当前仍在持续修复问题并优化游戏体验。',
      '关于可选加入年代、新模式、随机交易、新增荣誉、难度调整、季后赛数据、奥运会、场外关系及更多剧情等建议，均已纳入后续更新的规划与评估。',
      '现阶段将优先维护并完善原有模式，待基础体验更加稳定后，再逐步推进新模式开发。感谢所有玩家的支持与理解！',
    ],
    versions: [
      {
        version: 'v6',
        sections: [
          {
            title: '季后赛信息优化',
            items: [
              '季后赛页面新增上一场比赛比分及玩家数据统计。',
              '修复系列赛晋级后错误显示“已止步”的问题。',
            ],
          },
        ],
      },
      {
        version: 'v5',
        sections: [
          {
            title: '亲自出战优化',
            items: [
              '修复玩家数据及单节比分异常。',
              '修复部分生涯场均盖帽或抢断显示为0的问题。',
              '修复常规时间战平后错误判负的问题，并加入加时比分结算。',
              '调整绝杀时刻的触发条件与出现时机。',
            ],
          },
          {
            title: '阵容定位优化',
            items: [
              '修复高能力球员错误降为轮换、低能力球员担任第六人的问题。',
              '优化新赛季前10场的角色定位，降低少量比赛对阵容身份造成的波动。',
            ],
          },
          {
            title: '稳定性修复',
            items: ['持续优化可能导致页面崩溃、白屏及闪烁的问题。'],
          },
        ],
      },
      {
        version: 'v4',
        sections: [
          {
            title: '性能优化',
            items: [
              '减少动画粒子数量，降低设备渲染压力。',
              '简化常规赛模拟、弹窗等场景的动画效果。',
            ],
          },
          {
            title: '页面 UI 优化',
            items: [
              '为主要游戏流程页面及弹窗加入三段式布局，使关键操作按钮始终保持可见。',
              '简化创建角色、季后赛、常规赛等页面的布局与信息展示。',
              '修复排行榜个人荣誉中最佳阵容次数显示异常的问题。',
            ],
          },
        ],
      },
      {
        version: 'v3',
        sections: [
          {
            title: '全网排行榜',
            items: [
              '修复退役记录上传及“我的全网排名”显示异常。',
              '支持将本地有效退役记录重新同步至全网排行榜。',
              '榜单展示前50名，所有有效记录均参与全网排名计算。',
              '清理超龄异常记录，并将退役年龄上限限制为43岁。',
            ],
          },
          {
            title: '亲自出战优化',
            items: [
              '缩小亲自出战与快速模拟之间的数据差距。',
              '修复高篮板属性球员篮板数异常偏低的问题。',
              '优化赛后评分及篮板、助攻、抢断、盖帽等事件生成逻辑。',
            ],
          },
        ],
      },
      {
        version: 'v2',
        sections: [
          {
            title: '新增伤病系统',
            items: [
              '伤病概率与耐力属性相关，耐力越高，赛季受伤风险越低。',
              '伤病将导致球员缺席1至4场比赛，每名球员每赛季最多受伤一次。',
              '养伤期间赛程正常推进，缺席比赛记为 DNP。',
            ],
          },
          {
            title: '个人资产调整',
            items: [
              '按合同收入结算可支配资金，并重新设计资产的分级解锁与购买规则。',
              '高级及传奇资产将根据生涯年限、能力与荣誉逐步解锁。',
              '已购资产的永久属性加成继续生效，并与基础训练能力分别计算。',
            ],
          },
          {
            title: '新增反馈入口',
            items: ['首页新增用户反馈入口，用于提交游戏问题与改进建议。'],
          },
        ],
      },
    ],
  },
];
