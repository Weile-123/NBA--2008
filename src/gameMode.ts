export type GameMode = 'classic' | 'random_trade';

export const DEFAULT_GAME_MODE: GameMode = 'classic';

export const GAME_MODE_CONFIG: Record<GameMode, {
  name: string;
  shortName: string;
  description: string;
}> = {
  classic: {
    name: '经典历史模式',
    shortName: '经典模式',
    description: '沿用现有真实选秀与历史交易变动，完整保留已经上线的游戏体验。',
  },
  random_trade: {
    name: '平行联盟模式',
    shortName: '随机交易',
    description: '每个赛季由联盟环境动态生成交易，创造独一无二的生涯时间线。',
  },
};
