import React from 'react';
import { PlayerProfile, Attributes } from '../types';
import {
  Flame,
  Sparkles,
  Zap,
  RotateCcw,
  X,
  Award,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  ChevronRight,
  ArrowUp,
  MonitorPlay,
} from 'lucide-react';
import { PERSONAL_ASSETS } from '../data/nbaData2008';
import { getPlayerBaseOvr, getUserPlayerAgePenalty } from '../utils/calc2k';

interface AttributesPanelProps {
  player: PlayerProfile;
  onUpgradeAttribute: (attrKey: keyof Attributes, amount?: number) => void;
  onWatchAd?: () => Promise<boolean>;
  onAllInAttribute?: (attrKey: keyof Attributes) => void;
  onResetAttribute?: (attrKey: keyof Attributes) => void;
}

type AttrCategory = 'shooting' | 'finishing' | 'playmaking' | 'defense' | 'physicals';

interface AttrItem {
  key: keyof Attributes;
  label: string;
  desc: string;
  icon: string;
  category: AttrCategory;
}

const attrList: AttrItem[] = [
  { key: 'midRange', label: '中投', desc: '提升中距离跳投与急停投篮命中率', icon: '🎯', category: 'shooting' },
  { key: 'threePoint', label: '三分', desc: '提升空位三分与后撤步远投命中率', icon: '🏹', category: 'shooting' },
  { key: 'freeThrow', label: '罚球', desc: '关键时刻罚球稳定度', icon: '🏀', category: 'shooting' },
  { key: 'layup', label: '上篮', desc: '突破抗对抗上篮与拉杆抛投', icon: '👟', category: 'finishing' },
  { key: 'dunk', label: '扣篮', desc: '快攻反击与隔人暴扣震撼度', icon: '💥', category: 'finishing' },
  { key: 'insideFinish', label: '终结', desc: '篮下禁区近距离得分与上篮巧劲', icon: '🧱', category: 'finishing' },
  { key: 'postMove', label: '背身', desc: '低位背身勾手、后仰跳投与晃步脚步', icon: '🏛️', category: 'finishing' },
  { key: 'ballHandle', label: '控球', desc: '减少被剥夺球，提升变向破防', icon: '💫', category: 'playmaking' },
  { key: 'passing', label: '传球', desc: '提升传球视野与战术助攻精准度', icon: '🧠', category: 'playmaking' },
  { key: 'perimeterDef', label: '外防', desc: '贴身死锁对位对手与干扰投篮', icon: '🛡️', category: 'defense' },
  { key: 'interiorDef', label: '内防', desc: '禁区死锁顶防、干扰篮下强攻与护框', icon: '🏰', category: 'defense' },
  { key: 'block', label: '盖帽', desc: '协防飞天排球大帽与护框起跳', icon: '🛑', category: 'defense' },
  { key: 'steal', label: '抢断', desc: '拦截传球线路与预判剥球', icon: '⚡', category: 'defense' },
  { key: 'rebounding', label: '篮板', desc: '拼抢进攻/防守篮板与卡位控制落点', icon: '🎯', category: 'defense' },
  { key: 'speed', label: '速度', desc: '快攻冲刺与防守端回追爆发力', icon: '🏃', category: 'physicals' },
  { key: 'vertical', label: '弹跳', desc: '垂直起跳高度、隔人暴扣与滞空争抢', icon: '🚀', category: 'physicals' },
  { key: 'strength', label: '力量', desc: '卡位篮板、背身顶防与身体对抗', icon: '💪', category: 'physicals' },
  { key: 'stamina', label: '耐力', desc: '降低每场比赛后的伤病概率', icon: '🫀', category: 'physicals' },
];

export const AttributesPanel: React.FC<AttributesPanelProps> = ({
  player,
  onUpgradeAttribute,
  onWatchAd,
  onAllInAttribute,
  onResetAttribute,
}) => {
  const { attributes, attributeCaps, skillPoints, position, archetype } = player;

  const [showBoostsModal, setShowBoostsModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'upgradable' | 'capped'>('all');

  const adUsesLeft = 3 - (player.adRewardUses || 0);
  const [isWatchingAd, setIsWatchingAd] = React.useState(false);
  const handleWatchAd = async () => {
    if (!onWatchAd || isWatchingAd || adUsesLeft <= 0) return;
    setIsWatchingAd(true);
    try { await onWatchAd(); }
    catch { /* Silently restore the button when the ad cannot be opened. */ }
    finally { setIsWatchingAd(false); }
  };

  // Get active purchased assets
  const activeAssets = PERSONAL_ASSETS.filter((a) => (player.purchasedAssetIds || []).includes(a.id));
  const age = player.age || 19;
  const agePenalty = getUserPlayerAgePenalty(age);
  const baseOvr = getPlayerBaseOvr(player);
  const maxOvr = 99 - agePenalty;
  const isOvrAtCap = baseOvr >= maxOvr;

  // Filter attributes list
  const filteredAttrs = attrList.filter((item) => {
    // 1. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const labelMatch = item.label.toLowerCase().includes(q);
      const descMatch = item.desc.toLowerCase().includes(q);
      if (!labelMatch && !descMatch) return false;
    }
    // 2. Upgradable / Capped filter
    const baseVal = attributes[item.key] || 50;
    const cap = attributeCaps && attributeCaps[item.key] ? attributeCaps[item.key] : 99;
    const isAtCap = baseVal >= cap || isOvrAtCap;

    if (filterType === 'upgradable' && isAtCap) return false;
    if (filterType === 'capped' && !isAtCap) return false;

    return true;
  });

  const handleAddFive = (key: keyof Attributes) => {
    const currentVal = attributes[key] || 50;
    const cap = attributeCaps && attributeCaps[key] ? attributeCaps[key] : 99;
    if (currentVal >= cap || skillPoints <= 0 || isOvrAtCap) return;

    const pointsToAdd = Math.min(5, cap - currentVal, skillPoints);
    onUpgradeAttribute(key, pointsToAdd);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 📱 Mobile Sticky Quick-Status Top Bar */}
      <div className="sticky top-0 z-30 bg-[#0d1017]/95 backdrop-blur-md border border-[#232834] rounded-xl p-2.5 shadow-xl flex items-center justify-between gap-2 sm:hidden">
        {/* Left: Original SP card (Click 10 times to unlock debug buttons) */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-[#11141b] border border-[#232834] px-3 py-1 rounded-xl select-none shadow-inner flex flex-col justify-center shrink-0">
            <span className="text-[9px] text-slate-400 font-bold leading-tight">可分配属性点</span>
            <span className="text-base font-black text-amber-400 font-mono italic leading-tight">{skillPoints}</span>
          </div>

        </div>

        {/* Right: Boosts button & "可加点" badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={handleWatchAd} disabled={!onWatchAd || adUsesLeft <= 0 || isWatchingAd} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-2 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1">
            <MonitorPlay className="w-3 h-3" /> {isWatchingAd ? '广告加载中…' : `+30属性点 ${adUsesLeft}/3`}
          </button>
          <button
            type="button"
            onClick={() => setShowBoostsModal(true)}
            className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>查看加成</span>
          </button>
        </div>
      </div>
      <p className="sm:hidden text-[10px] text-slate-500 px-1">
        未使用的属性点将计入 GOAT 分数统计
      </p>

      {/* Overview Banner Header */}
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3 sm:p-5 shadow-xl space-y-3 sm:space-y-4 hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-500 text-black flex flex-col items-center justify-center font-black shadow-lg relative shrink-0">
              <span className="text-xl sm:text-2xl italic leading-none">{baseOvr}</span>
              <span className="text-[8px] uppercase font-bold tracking-widest">OVR</span>
              {agePenalty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-rose-400 shadow-md">
                  -{agePenalty}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black italic uppercase text-white truncate">
                {player.name} · 属性特训与潜力
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                模板: <strong className="text-amber-400">{archetype}</strong> · 位置:{' '}
                <strong className="text-white">{position}</strong> · 年龄:{' '}
                <strong className="text-amber-300 font-mono">{age}岁</strong> · 身高体重:{' '}
                <strong className="text-amber-300 font-mono">{player.height} / {player.weight}</strong>
              </p>
              {agePenalty > 0 && (
                <p className="text-[10px] sm:text-[11px] text-rose-400 font-bold mt-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>老将效应：当前总评封顶上限 {99 - agePenalty}</span>
                </p>
              )}
            </div>
          </div>

          {/* Skill Points count & Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap justify-between sm:justify-end border-t sm:border-t-0 border-[#232834] pt-2.5 sm:pt-0">
            <button
              type="button"
              onClick={() => setShowBoostsModal(true)}
              className="hidden sm:flex bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 items-center gap-1.5 shadow-lg"
            >
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>查看场外加成</span>
            </button>

            <div className="bg-[#0d1017] border border-[#232834] px-4 py-1.5 sm:py-2 rounded-xl text-center select-none shadow-inner min-w-[120px]">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">可分配属性点</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono italic">{skillPoints}</span>
              <span className="text-[9px] text-slate-500 block mt-0.5 whitespace-nowrap">未使用的属性点将计入 GOAT 分数统计</span>
            </div>

            <button type="button" onClick={handleWatchAd} disabled={!onWatchAd || adUsesLeft <= 0 || isWatchingAd} className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-black text-xs rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap">
              <MonitorPlay className="w-3 h-3" /> {isWatchingAd ? '广告加载中…' : '+30属性点'} <span className="text-[10px]">{adUsesLeft}/3</span>
            </button>
          </div>
      </div>

      {/* Attributes Grid (Responsive & Mobile-Compact) */}
      {filteredAttrs.length === 0 ? (
        <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-8 text-center space-y-2">
          <div className="text-2xl">🔍</div>
          <p className="text-sm text-slate-300 font-bold">未找到匹配的特训属性</p>
          <p className="text-xs text-slate-500">请尝试清除搜索关键字或切换状态筛选</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
            className="mt-2 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold"
          >
            重置全部筛选
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {filteredAttrs.map(({ key, label, desc, icon }) => {
            const baseVal = attributes[key] || 50;
            const cap = attributeCaps && attributeCaps[key] ? attributeCaps[key] : 99;
            const isAtCap = baseVal >= cap || isOvrAtCap;

            // Build local list of boosts for this attribute
            const boostList: { source: string; val: number; type: 'endorsement' | 'asset' | 'shoe' }[] = [];

            // 1. Endorsement boosts
            (player.endorsements || []).forEach((end) => {
              if (end.rewardAttributes && end.rewardAttributes[key]) {
                boostList.push({
                  source: `${end.brand}代言`,
                  val: end.rewardAttributes[key]!,
                  type: 'endorsement',
                });
              }
            });

            // 2. Personal Asset boosts
            activeAssets.forEach((asset) => {
              if (asset.rewardAttributes && asset.rewardAttributes[key]) {
                boostList.push({
                  source: asset.name,
                  val: asset.rewardAttributes[key]!,
                  type: 'asset',
                });
              }
            });

            // 3. Signature Shoe boosts
            if (player.signatureShoe && player.signatureShoe.boostAttr === key) {
              boostList.push({
                source: `专属球鞋`,
                val: player.signatureShoe.boostVal,
                type: 'shoe',
              });
            }

            const boostSum = boostList.reduce((sum, b) => sum + b.val, 0);

            return (
              <div
                key={key}
                className="bg-[#11141b] border border-[#232834] hover:border-slate-700 p-2.5 sm:p-3.5 rounded-xl flex items-center justify-between gap-2.5 sm:gap-4 transition-all shadow-md"
              >
                <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base shrink-0">{icon}</span>
                    <span className="text-xs sm:text-xs font-bold text-white uppercase truncate">{label}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1 hidden sm:block">{desc}</p>

                  {/* Dual-color Progress bar (Base in amber, Boost in emerald) */}
                  <div className="w-full max-w-[200px] sm:max-w-xs bg-[#0d1017] h-1.5 sm:h-2 rounded-full overflow-hidden mt-1 border border-[#232834] relative flex">
                    {/* Base progress */}
                    <div
                      className="bg-amber-500 h-full rounded-l-full transition-all duration-300"
                      style={{ width: `${(baseVal / 99) * 100}%` }}
                    />
                    {/* Boost progress */}
                    {boostSum > 0 && (
                      <div
                        className="bg-emerald-500 h-full rounded-r-full transition-all duration-300"
                        style={{ width: `${((Math.min(99, baseVal + boostSum) - baseVal) / 99) * 100}%` }}
                      />
                    )}
                    {/* Cap Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-70"
                      style={{ left: `${(cap / 99) * 100}%` }}
                      title={`个人潜力上限: ${cap}`}
                    />
                  </div>
                </div>

                {/* Right Value & Upgrade Controls */}
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-black italic text-white flex items-center justify-end gap-1">
                      <span>{baseVal}</span>
                      {boostSum > 0 && (
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-400 font-mono">
                          (+{boostSum})
                        </span>
                      )}
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-slate-500">上限 {cap}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    {onResetAttribute && baseVal > 60 && (
                      <button
                        type="button"
                        onClick={() => onResetAttribute(key)}
                        className="p-1 sm:p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                        title={`重置此属性至 60，并返还 ${baseVal - 60} 个属性点`}
                      >
                        <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}

                    {/* +5 Quick Upgrade Button */}
                    <button
                      type="button"
                      onClick={() => handleAddFive(key)}
                      disabled={skillPoints <= 0 || isAtCap}
                      className="hidden sm:flex px-1.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 disabled:opacity-20 disabled:pointer-events-none text-amber-300 font-bold rounded-lg text-[10px] transition-all active:scale-95 items-center justify-center cursor-pointer whitespace-nowrap"
                      title="一次增加 5 点属性"
                    >
                      +5
                    </button>

                    {/* All-In Button */}
                    {onAllInAttribute && (
                      <button
                        type="button"
                        onClick={() => onAllInAttribute(key)}
                        disabled={skillPoints <= 0 || isAtCap}
                        className="px-1.5 sm:px-2 py-1 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 disabled:opacity-20 disabled:pointer-events-none text-amber-300 font-bold rounded-lg text-[10px] transition-all active:scale-95 flex items-center justify-center gap-0.5 cursor-pointer whitespace-nowrap"
                        title="拉满此属性"
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-400 hidden sm:inline" /> All
                      </button>
                    )}

                    {/* Primary +1 Button */}
                    <button
                      type="button"
                      onClick={() => onUpgradeAttribute(key)}
                      disabled={skillPoints <= 0 || isAtCap}
                      className="px-2 sm:px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-20 disabled:pointer-events-none text-black font-black italic rounded-lg text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-0.5 cursor-pointer uppercase whitespace-nowrap"
                    >
                      <Flame className="w-3 h-3 fill-black" />{' '}
                      {isOvrAtCap ? '综评封顶' : isAtCap ? '封顶' : '+1'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Off-court Boosts Modal */}
      {showBoostsModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#11141b] border border-[#232834] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="border-b border-[#232834] px-5 py-3.5 flex items-center justify-between bg-[#151922]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm sm:text-base font-black text-white">场外永久属性加成明细</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBoostsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar text-slate-200">
              {player.endorsements?.length === 0 && activeAssets.length === 0 && !player.signatureShoe ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 bg-[#1a1f2c] border border-[#2d3548] rounded-full flex items-center justify-center mx-auto text-2xl">
                    🏝️
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">暂无任何场外加成</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    您目前尚未获得任何场外永久加成。可以通过签署商业代言、购买私人资产、或打造专属球鞋，获得不可忽视的永久属性提升！
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    场外属性加成为<strong className="text-emerald-400">永久额外加成</strong>，在特训界面中以{' '}
                    <span className="text-emerald-400 font-bold">(+加成)</span>{' '}
                    的形式附加在基础属性上，不受职业上限限制，重置时也不会被扣除。
                  </p>

                  {/* 1. Endorsement Section */}
                  {player.endorsements && player.endorsements.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <Award className="w-4 h-4" />
                        <span>商业代言合同 ({player.endorsements.length})</span>
                      </div>
                      <div className="space-y-2">
                        {player.endorsements.map((end) => (
                          <div
                            key={end.id}
                            className="bg-[#0d1017] border border-[#232834] rounded-xl p-3 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold text-white">{end.brand} 代言人</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">代言薪资: {end.perSeasonPay} 万美元/年</div>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                              {end.rewardAttributes &&
                                Object.entries(end.rewardAttributes).map(([attr, val]) => {
                                  const attrObj = attrList.find((a) => a.key === attr);
                                  return (
                                    <span
                                      key={attr}
                                      className="inline-flex items-center bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                                    >
                                      {attrObj?.label.split(' ')[0]} +{val}
                                    </span>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Purchased Assets Section */}
                  {activeAssets.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        <ShoppingBag className="w-4 h-4" />
                        <span>私人奢华资产 ({activeAssets.length})</span>
                      </div>
                      <div className="space-y-2">
                        {activeAssets.map((asset) => (
                          <div
                            key={asset.id}
                            className="bg-[#0d1017] border border-[#232834] rounded-xl p-3 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold text-white">{asset.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">资产价格: {asset.cost} 万美元</div>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                              {asset.rewardAttributes &&
                                Object.entries(asset.rewardAttributes).map(([attr, val]) => {
                                  const attrObj = attrList.find((a) => a.key === attr);
                                  return (
                                    <span
                                      key={attr}
                                      className="inline-flex items-center bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                                    >
                                      {attrObj?.label.split(' ')[0]} +{val}
                                    </span>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Signature Shoe Section */}
                  {player.signatureShoe && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <span>👟</span>
                        <span>专属定制球鞋</span>
                      </div>
                      <div className="bg-[#0d1017] border border-[#232834] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{player.signatureShoe.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">属性加成款式</div>
                        </div>
                        <div>
                          {(() => {
                            const attrObj = attrList.find((a) => a.key === player.signatureShoe?.boostAttr);
                            return (
                              <span className="inline-flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                                {attrObj?.label.split(' ')[0]} +{player.signatureShoe.boostVal}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#232834] px-5 py-3 flex justify-end bg-[#151922]">
              <button
                type="button"
                onClick={() => setShowBoostsModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
