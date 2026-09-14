import React, { useState, useEffect } from 'react';
import { PlayerProfile, Team, Position } from '../types';
import { TeamLogo } from './TeamLogo';
import { resolveUserDraftTeam } from '../utils/draftLogic';
import { gameConfetti as confetti } from '../utils/gameConfetti';
import { Award, Sparkles, CheckCircle2, ChevronRight, Zap, Target, Shield, Flame, Radio } from 'lucide-react';

interface RookieDraftAndScoutModalProps {
  player: PlayerProfile;
  teams: Team[];
  onProceedToContract: () => void;
}

interface ScoutTemplate {
  starName: string;
  starTitle: string;
  avatar: string;
  similarity: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  scoutComment: string;
}

function getScoutTemplate(position: Position, archetype: string, ovr: number): ScoutTemplate {
  const archLower = (archetype || '').toLowerCase();

  if (position === 'PG') {
    if (archLower.includes('突破') || archLower.includes('冲击') || archLower.includes('扣篮')) {
      return {
        starName: '德里克·罗斯',
        starTitle: '暴风冲击型控卫 · 极速第一步',
        avatar: '🌹',
        similarity: 95,
        grade: 'A+ (状元热门)',
        strengths: ['历史级变向起步爆发力', '高压下杀入禁区终结能力', '大心脏关键球决断'],
        weaknesses: ['外线三分稳定性仍需雕琢', '防守端经验需适应联盟对抗'],
        scoutComment: '拥有罕见的双腿爆发力与持球突破破坏力，在试训中展现出全场顶级领袖气质，是乐透区球队建队核心首选。',
      };
    }
    return {
      starName: '斯蒂芬·库里',
      starTitle: '战术大脑与精细射手',
      avatar: '🎯',
      similarity: 93,
      grade: 'A+ (核心控卫)',
      strengths: ['无死角投射射程与手感', '顶尖战术视野与助攻比', '极高篮球智商与挡拆拆解'],
      weaknesses: ['身体对抗处于同位置均值', '防守端需要体系协防支持'],
      scoutComment: '投射手感极其柔和，拥有改写对方防守阵型的战术威胁，挡拆发起效率在选秀训练营中高居榜首。',
    };
  }

  if (position === 'SG') {
    if (archLower.includes('防守') || archLower.includes('3d') || archLower.includes('三分')) {
      return {
        starName: '克莱·汤普森',
        starTitle: '顶尖3D分卫 · 外线冷酷神射手',
        avatar: '🏹',
        similarity: 94,
        grade: 'A (即战力首选)',
        strengths: ['冷酷无球跑位与快速接球投', '外线单兵领防撕咬能力', '不占球权极强战术适配'],
        weaknesses: ['持球自主硬解能力尚待开发', '禁区杀伤罚球率需提升'],
        scoutComment: '外线投射技术极其规范纯粹，防守端专注度高，是任何冠军争夺战术体系中最完美的侧翼基石。',
      };
    }
    return {
      starName: '科比·布莱恩特',
      starTitle: '黑曼巴式全能侧翼 · 单打得分兵器',
      avatar: '🐍',
      similarity: 96,
      grade: 'A+ (建队基石)',
      strengths: ['无死角中距离与后仰跳投', '好胜心与强悍防守撕咬', '高压环境下单打硬解'],
      weaknesses: ['需要大量球权掌控比赛', '投篮选择偶尔过于坚决'],
      scoutComment: '攻防兼备的顶级侧翼天才，脚步技术极其扎实，好胜心与训练态度深受各队总经理与主教练青睐。',
    };
  }

  if (position === 'SF') {
    if (archLower.includes('全能') || archLower.includes('组织')) {
      return {
        starName: '勒布朗·詹姆斯',
        starTitle: '全能坦克重炮 · 战术指挥官',
        avatar: '👑',
        similarity: 95,
        grade: 'A+ (超级天才)',
        strengths: ['历史级身体素质与冲击力', '全场掌控力与顶级传球视野', '攻防两端统治级战术影响力'],
        weaknesses: ['中远投稳定性需持续打磨', '罚球命中率需保持平稳'],
        scoutComment: '兼具重炮身体与控卫视野的现象级新星，快攻反击破坏力无解，具备新赛季立即打出准三双的惊人潜质。',
      };
    }
    return {
      starName: '凯文·杜兰特',
      starTitle: '高射炮得分机器 · 无解单打手感',
      avatar: '⚡',
      similarity: 94,
      grade: 'A+ (得分王潜质)',
      strengths: ['夸张臂展与超高出手点', '无死角三层面得分手段', '无视防守高位拔起跳投'],
      weaknesses: ['核心力量仍需强化挂肉', '高强度对抗下体能分配'],
      scoutComment: '拥有内线身高的外线得分兵器，投篮出手点极高令防守球员无可奈何，被评为本届选秀最纯粹的得分天赋。',
    };
  }

  if (position === 'PF') {
    return {
      starName: '凯文·加内特',
      starTitle: '空间型狼王内线 · 攻防全能大前',
      avatar: '🐺',
      similarity: 93,
      grade: 'A (内线基石)',
      strengths: ['中距离翻身跳投准度', '防守端大面积补防扫荡', '激情领袖气质与篮板保护'],
      weaknesses: ['重型低位对抗稍吃亏', '犯规控制需要积累经验'],
      scoutComment: '机动性极强的新时代内线，防守覆盖面广大，兼具中远投射能力，能完美缝合任何现代战术阵容。',
    };
  }

  // C Center
  return {
    starName: '沙奎尔·奥尼尔',
    starTitle: '禁区怪兽·内线守护神',
    avatar: '💥',
    similarity: 95,
    grade: 'A+ (禁区统治)',
    strengths: ['野兽级护框盖帽与篮板控制', '二次进攻暴扣与吃饼威力', '禁区单兵防守威慑力'],
    weaknesses: ['罚球命中率有待练习', '射程受限于禁区3米内'],
    scoutComment: '拥有无可匹敌的禁区身体威慑力，篮板与护框盖帽能力立竿见影，是建队最稳固的防守大闸。',
  };
}

export const RookieDraftAndScoutModal: React.FC<RookieDraftAndScoutModalProps> = ({
  player,
  teams,
  onProceedToContract,
}) => {
  const [stage, setStage] = useState<'scout' | 'spotlight'>('scout');
  const [spotlightRevealed, setSpotlightRevealed] = useState(false);

  // Target team chosen during character creation
  const draftTeam = resolveUserDraftTeam(teams, player, 'lal');

  const pick = player.draftPick || 1;
  const getPickOrdinal = (n: number) => {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };
  const pickLabel =
    pick === 1
      ? '2008 选秀状元'
      : pick === 2
      ? '2008 选秀榜眼'
      : pick === 3
      ? '2008 选秀探花'
      : pick <= 30
      ? `2008 首轮第 ${pick} 顺位`
      : `2008 次轮第 ${pick - 30} 顺位`;

  // Scout comparison object
  const scout = getScoutTemplate(player.position, player.archetype, player.ovr);

  // Spotlight reveal timer & confetti
  useEffect(() => {
    if (stage === 'spotlight') {
      const timer = setTimeout(() => {
        setSpotlightRevealed(true);
        try {
          confetti({
            particleCount: 120,
            spread: 100,
            origin: { y: 0.4 },
            colors: [draftTeam.primaryColor || '#f59e0b', '#ffffff', '#fbbf24', '#38bdf8'],
          });
        } catch (e) {}
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [stage, draftTeam]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto text-slate-100 font-sans">
      <div className={`bg-[#11141b] border-2 border-amber-500/50 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative my-auto overflow-hidden ${stage === 'scout' ? 'max-h-[92svh] flex min-h-0 flex-col' : 'space-y-5'}`}>
        
        {/* STAGE 1: NBA SCOUT REPORT & PLAYER COMPARISON TEMPLATE */}
        {stage === 'scout' && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 animate-fadeIn">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-[#232834] pb-3 sm:pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-lg">
                  📋
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Sparkles className="w-3.5 h-3.5" /> 2008 OFFICIAL SCOUTING REPORT
                  </div>
                  <h2 className="text-lg sm:text-xl font-black italic uppercase text-white mt-0.5">
                    官方球探模板与选秀分析报告
                  </h2>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
              {/* Prospect Card */}
              <div className="bg-[#0d1017] p-4 rounded-xl border border-[#232834] flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/40 flex items-center justify-center text-3xl shrink-0 shadow-lg">
                    🏀
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white">{player.name}</h3>
                      <span className="bg-amber-500 text-black font-black text-[10px] px-2 py-0.5 rounded font-mono">
                        {player.ovr} OVR
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      {player.position} · {player.archetype} · {player.height} / {player.weight}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      来自: {player.birthplace || '纽约'}
                    </p>
                  </div>
              </div>

              {/* NBA Player Comparison Scout Template */}
              <div className="bg-gradient-to-br from-[#121722] to-[#0a0d13] p-4.5 rounded-2xl border-2 border-amber-500/40 space-y-3.5 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between border-b border-[#232a3c] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{scout.avatar}</span>
                  <div>
                    <span className="text-[10px] text-amber-400 font-mono uppercase font-black tracking-wider block">
                      联盟 球星发展模板
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-white italic">
                      {scout.starName}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Scout Grade */}
              <div className="flex items-center justify-between bg-[#0b0e14] px-3.5 py-2 rounded-xl border border-[#232834]">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> 球探评级:
                </span>
                <span className="text-xs font-black text-amber-300 font-mono">{scout.grade}</span>
              </div>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#0a0d14] p-3 rounded-xl border border-emerald-500/30 space-y-1.5">
                  <span className="text-[11px] font-black text-emerald-400 flex items-center gap-1.5 uppercase">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" /> 核心优点与球场特质
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {scout.strengths.map((st, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#0a0d14] p-3 rounded-xl border border-amber-500/30 space-y-1.5">
                  <span className="text-[11px] font-black text-amber-400 flex items-center gap-1.5 uppercase">
                    <Target className="w-3.5 h-3.5 text-amber-400" /> 需调整与提升短板
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {scout.weaknesses.map((wk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{wk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Scout Comment */}
              <p className="text-xs text-slate-300 bg-[#090b10] p-3 rounded-xl border border-[#1e2535] leading-relaxed italic">
                “{scout.scoutComment}”
              </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="shrink-0 border-t border-[#232834] pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setStage('spotlight')}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black italic rounded-xl text-xs uppercase tracking-tight shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ring-2 ring-amber-300"
              >
                <span>进入选秀现场 · 等待球队指名</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: DRAFT NIGHT SPOTLIGHT SELECTION ANIMATION */}
        {stage === 'spotlight' && (
          <div className="space-y-6 text-center animate-fadeIn relative">
            {/* Animated Light Beams Background */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 blur-3xl rounded-full pointer-events-none animate-pulse" />

            <div className="space-y-1 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-ping" /> 2008 联盟选秀 LIVE · MADISON SQUARE GARDEN
              </div>
              <h2 className="text-2xl sm:text-3xl font-black italic text-white uppercase tracking-tight">
                选秀大会聚光灯舞台
              </h2>
              <p className="text-xs text-slate-400">
                联盟总裁大卫·斯特恩走进发言台，全场闪光灯聚焦于绿室！
              </p>
            </div>

            {/* David Stern Announcement Box */}
            <div className="bg-gradient-to-b from-[#161c28] to-[#0c0f16] p-5 sm:p-6 rounded-2xl border-2 border-amber-500/60 shadow-2xl space-y-5 relative z-10 overflow-hidden">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-lg">
                  🎙️
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-amber-400 font-mono uppercase block font-bold">
                    联盟总裁讲话
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    “ With the {getPickOrdinal(pick)} Pick in the 2008 联盟 Draft, the {draftTeam.name} select... ”
                  </span>
                </div>
              </div>

              {/* Reveal Box with Spotlight Animation */}
              {!spotlightRevealed ? (
                <div className="py-12 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
                  <p className="text-sm font-black italic text-amber-300 animate-pulse font-mono">
                    聚光灯正在绿室中寻觅... 揭晓指名结果中...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-scaleUp">
                  {/* Spotlight Jersey & Team Card */}
                  <div
                    className="p-5 rounded-2xl border-2 shadow-2xl relative overflow-hidden space-y-3"
                    style={{
                      backgroundColor: '#0d111a',
                      borderColor: draftTeam.secondaryColor || '#f59e0b',
                    }}
                  >
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full opacity-10 bg-amber-500 pointer-events-none" />

                    <div className="flex items-center justify-center gap-4">
                      <TeamLogo
                        logo={draftTeam.logo}
                        abbrev={draftTeam.abbrev}
                        primaryColor={draftTeam.primaryColor}
                        secondaryColor={draftTeam.secondaryColor}
                        className="w-16 h-16 object-contain drop-shadow-2xl"
                        alt={draftTeam.name}
                      />
                      <div className="text-left">
                        <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-black uppercase font-mono">
                          {pickLabel}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black italic text-white mt-1">
                          {player.name}
                        </h3>
                        <p className="text-xs font-bold text-amber-400">
                          正式被【{draftTeam.name}】于{pick <= 30 ? `首轮第 ${pick}` : `次轮第 ${pick - 30}`} 顺位指名选中！
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#232834]">
                      <div className="bg-[#11141b] p-2 rounded-lg border border-[#232834]">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">效力球队</span>
                        <span className="text-xs font-black text-white">{draftTeam.name}</span>
                      </div>
                      <div className="bg-[#11141b] p-2 rounded-lg border border-[#232834]">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">签约身价</span>
                        <span className="text-xs font-black text-emerald-400 font-mono">$3.80M / 年</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    🧢 帽子已戴上！现场欢呼雷动，接下来你将走上舞台握手并出席加盟签约仪式。
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {spotlightRevealed && (
              <div className="pt-2 flex justify-center animate-fadeIn relative z-10">
                <button
                  type="button"
                  onClick={onProceedToContract}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black italic rounded-xl text-xs uppercase tracking-tight shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ring-2 ring-amber-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>前往签约仪式 · 签署新秀保障合同 →</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
