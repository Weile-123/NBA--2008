import React, { useState, useEffect } from 'react';
import { PlayerProfile, SocialTweet, Endorsement, SignatureShoe } from '../types';
import { INITIAL_ENDORSEMENTS, PERSONAL_ASSETS } from '../data/nbaData2008';
import { MessageSquare, Twitter, DollarSign, Award, Sparkles, CheckCircle, Flame, Footprints, Lock } from 'lucide-react';

interface SocialAndLifeProps {
  player: PlayerProfile;
  tweets: SocialTweet[];
  onUnlockEndorsement: (endorsementId: string) => void;
  onCreateSignatureShoe: (shoe: SignatureShoe) => void;
  onBuyLuxuryItem: (cost: number, benefit: string) => void;
}

export const SocialAndLife: React.FC<SocialAndLifeProps> = ({
  player,
  tweets,
  onUnlockEndorsement,
  onCreateSignatureShoe,
  onBuyLuxuryItem,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'endorsements' | 'lifestyle'>('endorsements');

  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [activeSubTab]);

  const [selectedCategory, setSelectedCategory] = useState<'fashion_electronics' | 'sneaker' | 'sports_lifestyle'>('fashion_electronics');

  const filteredEndorsements = INITIAL_ENDORSEMENTS.filter((e) => e.category === selectedCategory);

  const activeSneaker = player.endorsements.find((e) => e.category === 'sneaker');

  const [selectedAssetCategory, setSelectedAssetCategory] = useState<'device' | 'project' | 'team' | 'life' | 'investment'>('device');

  const filteredAssets = PERSONAL_ASSETS.filter((a) => a.category === selectedAssetCategory);

  // Check signable endorsements & purchasable assets
  const hasSignableEndorsements = INITIAL_ENDORSEMENTS.some((end) => {
    const isUnlocked = player.endorsements.some((e) => e.id === end.id);
    if (isUnlocked) return false;

    const canUnlock = player.ovr >= end.requiredOvr && player.fansCount >= end.requiredFans;
    if (!canUnlock) return false;

    // Sneaker category is mutually exclusive - if player already signed a sneaker brand, no new sneaker endorsement
    if (end.category === 'sneaker') {
      const hasSneakerBrand = player.endorsements.some((e) => e.category === 'sneaker');
      if (hasSneakerBrand) return false;
    }

    return true;
  });

  const hasPurchasableAssets = PERSONAL_ASSETS.some((asset) => {
    const isPurchased = (player.purchasedAssetIds || []).includes(asset.id);
    return !isPurchased && player.money >= asset.cost;
  });

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center space-x-1 border-b border-[#232834] pb-2 overflow-x-auto">
        {[
          { id: 'endorsements', label: '💼 商业代言', hasDot: hasSignableEndorsements },
          { id: 'lifestyle', label: '🏎️ 个人资产', hasDot: hasPurchasableAssets },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            className={`relative px-3 py-1.5 rounded text-xs font-bold uppercase tracking-tight transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === t.id
                ? 'bg-amber-500 text-black italic shadow-md'
                : 'bg-[#11141b] text-slate-400 hover:text-white border border-[#232834]'
            }`}
          >
            <span>{t.label}</span>
            {t.hasDot && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d1017] shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse z-10 pointer-events-none" />
            )}
          </button>
        ))}
      </div>

      {/* Subtab 2: Endorsements */}
      {activeSubTab === 'endorsements' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-[#11141b] border border-[#232834] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> 巨星商业代言中心
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                通过提升你的 2K 赛场评级与积累粉丝数，解锁高额商业合同与专属定制加成！
              </p>
            </div>
            <div className="flex items-center gap-4 bg-[#181d28] px-3.5 py-2 rounded-lg border border-[#232834] self-start md:self-auto font-mono text-[11px]">
              <div>
                <span className="text-[9px] text-slate-500 block">当前综评 (OVR)</span>
                <span className="font-bold text-white text-xs">{player.ovr}</span>
              </div>
              <div className="h-6 w-px bg-[#232834]" />
              <div>
                <span className="text-[9px] text-slate-500 block">全网粉丝数</span>
                <span className="font-bold text-amber-400 text-xs">{(player.fansCount / 10000).toFixed(1)}万</span>
              </div>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0e1117] p-1 rounded-lg border border-[#232834]">
            {[
              { id: 'fashion_electronics', label: '🎧 时尚与电子' },
              { id: 'sneaker', label: '👟 球鞋品牌' },
              { id: 'sports_lifestyle', label: '🥤 运动产品' },
            ].map((cat) => {
              const catHasSignable = INITIAL_ENDORSEMENTS.filter((e) => e.category === cat.id).some((end) => {
                const isUnlocked = player.endorsements.some((e) => e.id === end.id);
                if (isUnlocked) return false;

                const canUnlock = player.ovr >= end.requiredOvr && player.fansCount >= end.requiredFans;
                if (!canUnlock) return false;

                if (end.category === 'sneaker') {
                  const hasSneakerBrand = player.endorsements.some((e) => e.category === 'sneaker');
                  if (hasSneakerBrand) return false;
                }

                return true;
              });

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`relative px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-black shadow-sm font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span>{cat.label}</span>
                  {catHasSignable && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d1017] shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse z-10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sneaker Rule & Info Warning */}
          {selectedCategory === 'sneaker' && (
            <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#232834]/60 pb-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" /> 球鞋代言核心规则
                </div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className="text-slate-400">统一签约门槛:</span>
                  <span className={`px-1.5 py-0.5 rounded border font-bold ${
                    player.ovr >= 75
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    OVR 75
                  </span>
                  <span className={`px-1.5 py-0.5 rounded border font-bold ${
                    player.fansCount >= 50000
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    5万 粉丝
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                球鞋品牌代言具有<strong>排他性（只能选一个）</strong>。各个球鞋品牌开出的代言费完全相同（每赛季固定
                <span className="text-emerald-400 font-mono font-bold"> $180万 </span>），但签约后赠予的
                <strong>专属签名战靴属性加成各有侧重</strong>。签约新球鞋品牌将自动解约旧品牌并替换属性加成。
              </p>
              {activeSneaker ? (
                <div className="text-[11px] bg-amber-500/10 px-2.5 py-1.5 rounded border border-amber-500/20 text-amber-300 font-mono flex items-center justify-between">
                  <span>👟 当前已签球鞋品牌: <strong>{activeSneaker.brand}</strong></span>
                  <span>加成效果: {activeSneaker.rewardDesc}</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 font-mono">
                  👟 当前尚未签约任何球鞋品牌。
                </div>
              )}
            </div>
          )}

          {/* Brands List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredEndorsements.map((end) => {
              const isUnlocked = player.endorsements.some((e) => e.id === end.id);
              const canUnlock = player.ovr >= end.requiredOvr && player.fansCount >= end.requiredFans;
              const isSneakerCategory = end.category === 'sneaker';
              
              // Determine if we show a "switch" or "sign" button
              const showSwitchBtn = isSneakerCategory && !isUnlocked && activeSneaker !== undefined;

              return (
                <div
                  key={end.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all relative overflow-hidden ${
                    isUnlocked
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.06)]'
                      : 'bg-[#11141b] border-[#232834] hover:border-slate-700/60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Logo, Brand, Pay */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {end.logoUrl ? (
                          <div className="w-12 h-12 flex items-center justify-center">
                            <img
                              src={end.logoUrl}
                              className={`brand-logo h-10 max-w-full object-contain ${
                                ['nike', 'adidas', 'jordan', 'underarmour', 'puma', 'anta', 'lining'].includes(end.id)
                                  ? 'brightness-0 invert'
                                  : ''
                              }`}
                              alt={end.brand}
                            />
                          </div>
                        ) : (
                          <span className="text-3xl">{end.logo}</span>
                        )}
                        <div>
                          <h5 className="font-bold text-xs text-white uppercase flex items-center gap-1.5">
                            {end.brand}
                            {isUnlocked && (
                              <span className="bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase px-1 py-0.5 rounded tracking-wide">
                                ACTIVE
                              </span>
                            )}
                          </h5>
                          <span className="text-[9px] font-bold text-slate-400 bg-[#1e2330] px-1.5 py-0.5 rounded border border-[#232834] uppercase tracking-wider block mt-1 w-max">
                            {end.categoryLabel || '商业代言'}
                          </span>
                        </div>
                      </div>

                      {!isSneakerCategory ? (
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
                            赛季代言费 / 门槛
                          </span>
                          <span className="text-xs font-black font-mono text-emerald-400">
                            +${(end.perSeasonPay / 10000).toFixed(0)}万
                          </span>

                          {/* Combined Requirements Info on Top Right */}
                          <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px]">
                            <span className={`px-1 py-0.5 rounded border ${
                              player.ovr >= end.requiredOvr
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              OVR {end.requiredOvr}
                            </span>
                            <span className={`px-1 py-0.5 rounded border ${
                              player.fansCount >= end.requiredFans
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              {(end.requiredFans / 10000).toFixed(0)}万粉丝
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          {/* Reward Box inline with Logo/Name */}
                          <div className="bg-[#161a23] px-3 py-1.5 rounded-lg border border-[#232834]/85 text-[11px] text-right hidden sm:block">
                            <span className="text-[9px] text-emerald-400 font-bold block">专属签约收益</span>
                            <span className="text-slate-200 font-medium font-sans block whitespace-normal">
                              {end.rewardDesc}
                            </span>
                          </div>

                          <div className="shrink-0">
                            {isUnlocked ? (
                              <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-500/20 px-2.5 py-1.5 rounded border border-amber-500/20">
                                <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> 已签约
                              </span>
                            ) : (
                              <button
                                onClick={() => onUnlockEndorsement(end.id)}
                                disabled={!canUnlock}
                                className={`px-3 py-1.5 text-black font-black italic rounded text-[11px] uppercase transition-all transform active:scale-95 ${
                                  !canUnlock
                                    ? 'bg-[#202533] text-slate-500 cursor-not-allowed opacity-60'
                                    : showSwitchBtn
                                    ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                                    : 'bg-amber-500 hover:bg-amber-400 text-black'
                                }`}
                              >
                                {canUnlock ? (showSwitchBtn ? '切换签约' : '签约代言') : '未达门槛'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reward Box with embedded Action button for non-sneakers only */}
                    {!isSneakerCategory ? (
                      <div className="bg-[#161a23] p-2.5 rounded-lg border border-[#232834]/80 text-[11px] flex items-center justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="font-bold text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" /> 专属签约收益:
                          </div>
                          <div className="text-slate-200 font-medium font-sans">
                            {end.rewardDesc}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isUnlocked ? (
                            <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-500/20 px-2.5 py-1.5 rounded border border-amber-500/20">
                              <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> 已签约
                            </span>
                          ) : (
                            <button
                              onClick={() => onUnlockEndorsement(end.id)}
                              disabled={!canUnlock}
                              className={`px-3 py-1.5 text-black font-black italic rounded text-[11px] uppercase transition-all transform active:scale-95 ${
                                !canUnlock
                                  ? 'bg-[#202533] text-slate-500 cursor-not-allowed opacity-60'
                                  : showSwitchBtn
                                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                                  : 'bg-amber-500 hover:bg-amber-400 text-black'
                              }`}
                            >
                              {canUnlock ? (showSwitchBtn ? '切换签约' : '签约代言') : '未达门槛'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Mobile-friendly fallback block for sneakers: Only visible on extra small screens */
                      <div className="block sm:hidden bg-[#161a23] p-2 rounded-lg border border-[#232834]/80 text-[11px]">
                        <span className="text-[9px] text-emerald-400 font-bold block">专属签约收益</span>
                        <span className="text-slate-200 font-medium font-sans">{end.rewardDesc}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 4: Luxury Lifestyle / Personal Assets */}
      {activeSubTab === 'lifestyle' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-[#11141b] border border-[#232834] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" /> 巨星个人资产配置中心
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                投资顶级设备、慈善项目、私人保障团队与高端商业，解锁阶梯式属性收益，构建你的商业帝国！
              </p>
            </div>
            <div className="flex items-center gap-4 bg-[#181d28] px-3.5 py-2 rounded-lg border border-[#232834] self-start md:self-auto font-mono text-[11px]">
              <div>
                <span className="text-[9px] text-slate-500 block">当前可支配资金</span>
                <span className="font-bold text-emerald-400 text-xs">${(player.money).toLocaleString()}</span>
              </div>
              <div className="h-6 w-px bg-[#232834]" />
              <div>
                <span className="text-[9px] text-slate-500 block">已购资产数</span>
                <span className="font-bold text-amber-400 text-xs">
                  {(player.purchasedAssetIds || []).length} / {PERSONAL_ASSETS.length}
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Buttons for Assets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0e1117] p-1 rounded-lg border border-[#232834]">
            {[
              { id: 'device', label: '🎯 专业设备' },
              { id: 'project', label: '🤝 慈善项目' },
              { id: 'team', label: '👥 私人团队' },
              { id: 'life', label: '🌇 生活资产' },
              { id: 'investment', label: '📈 商业投资' },
            ].map((cat) => {
              const catAssets = PERSONAL_ASSETS.filter((a) => a.category === cat.id);
              const purchasedCount = catAssets.filter((a) => (player.purchasedAssetIds || []).includes(a.id)).length;
              const catHasPurchasable = catAssets.some((asset) => {
                const isPurchased = (player.purchasedAssetIds || []).includes(asset.id);
                return !isPurchased && player.money >= asset.cost;
              });

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedAssetCategory(cat.id as any)}
                  className={`relative px-2.5 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedAssetCategory === cat.id
                      ? 'bg-amber-500 text-black shadow-sm font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[9px] px-1 rounded font-mono ${
                      selectedAssetCategory === cat.id ? 'bg-black/10 text-black' : 'bg-[#1b212f] text-slate-400'
                    }`}
                  >
                    {purchasedCount}/{catAssets.length}
                  </span>
                  {catHasPurchasable && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d1017] shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse z-10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Assets List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAssets.map((asset) => {
              const isPurchased = (player.purchasedAssetIds || []).includes(asset.id);
              const hasMoney = player.money >= asset.cost;
              const canBuy = !isPurchased && hasMoney;

              return (
                <div
                  key={asset.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    isPurchased
                      ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.04)]'
                      : 'bg-[#11141b] border-[#232834] hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Logo, Asset Name, Cost */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{asset.logo}</span>
                        <div>
                          <h5 className="font-bold text-xs text-white uppercase flex items-center gap-1.5">
                            {asset.name}
                            {isPurchased && (
                              <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-1 py-0.5 rounded tracking-wide">
                                OWNED
                              </span>
                            )}
                          </h5>
                          <span className="text-[9px] font-bold text-slate-400 bg-[#1e2330] px-1.5 py-0.5 rounded border border-[#232834] uppercase tracking-wider block mt-1 w-max">
                            {asset.categoryLabel}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
                          置办价格
                        </span>
                        <span className={`text-xs font-black font-mono ${(!isPurchased && !hasMoney) ? 'text-rose-500 font-bold' : 'text-emerald-400'}`}>
                          ${asset.cost.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Reward Attributes Box with Embedded Action Button */}
                    <div className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between gap-3 ${
                      isPurchased 
                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                        : 'bg-[#161a23] border-[#232834]/80'
                    }`}>
                      <div className="space-y-1 flex-1">
                        <div className={`font-bold flex items-center gap-1 ${isPurchased ? 'text-emerald-400' : 'text-amber-400'}`}>
                          <Sparkles className="w-3 h-3" /> 专属属性加成收益:
                        </div>
                        <div className="text-slate-200 font-medium font-sans">
                          {asset.rewardDesc}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isPurchased ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2.5 py-1.5 rounded border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 已置办
                          </span>
                        ) : (
                          <button
                            onClick={() => onBuyLuxuryItem(asset.cost, asset.id)}
                            disabled={!canBuy}
                            className={`px-3 py-1.5 disabled:opacity-40 text-black font-black italic rounded text-[11px] uppercase transition-all transform active:scale-95 ${
                              !hasMoney
                                ? 'bg-[#202533] text-slate-500 cursor-not-allowed opacity-60'
                                : 'bg-amber-500 hover:bg-amber-400'
                            }`}
                          >
                            {hasMoney ? '点击购置' : '资金不足'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
