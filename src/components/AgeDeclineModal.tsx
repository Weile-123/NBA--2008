import React from 'react';
import { PlayerProfile } from '../types';
import { Flame, Trophy, Activity, HeartPulse, ShieldAlert, Sparkles, Zap, ArrowRight } from 'lucide-react';

interface AgeDeclineModalProps {
  player: PlayerProfile;
  userTeamName: string;
  seasonsPlayed: number;
  currentYear: number;
  onRetire: () => void;
  onContinue: () => void;
}

export const AgeDeclineModal: React.FC<AgeDeclineModalProps> = ({
  player,
  userTeamName,
  seasonsPlayed,
  currentYear,
  onRetire,
  onContinue,
}) => {
  const age = player.age || 38;

  // Age-specific decline messages and titles
  const getDeclineContent = (playerAge: number) => {
    switch (playerAge) {
      case 38:
        return {
          badge: `老将赛季警告 · ${currentYear} 赛季揭幕`,
          title: '岁月的风暴 · 发现体能严重下滑',
          subtitle: `${player.name} 在新赛季常规赛训练营中感受到了岁月的残酷`,
          description:
            '新赛季季前训练与例行体检结束，你清晰地感受到双腿不再像年轻时那样充沛轻盈。赛后恢复周期显著延长，体能与运动爆发力面临不可逆的衰退衰减。',
          question: '38 岁已是绝大多数 联盟 传奇巨星挂靴解甲之年，你将做出何种抉择？',
        };
      case 39:
        return {
          badge: `暮年传奇挑战 · ${currentYear} 赛季揭幕`,
          title: '最后的舞蹈？ · 爆发力与膝盖告急',
          subtitle: `${player.name} 的 39 岁季前营，高强度对抗后体能急剧告警`,
          description:
            '39 岁的季前训练营里，你的膝盖在连续高强度攻防后发出阵阵酸痛信号。虽然你的篮球智商与大局观依然顶尖，但身体已经开始跟不上大脑的反应速度。',
          question: '39 岁的你已把青春全部奉献给这片赛场，是功成身退还是再拼最后一把？',
        };
      case 40:
        return {
          badge: `不朽常青不老 · ${currentYear} 赛季揭幕`,
          title: '四十不惑 · 身体极限的终极拷问',
          subtitle: `踏入 40 岁大关！${player.name} 迎来了极为罕见的四十岁赛季`,
          description:
            '踏入 40 岁大关，你成为了本赛季联盟中凤毛麟角的传奇老将。体能团队为你制定了严苛的限时轮休计划，每一次全力扣篮和极速冲刺都需要付出数倍于常人的恢复代价。',
          question: '40 岁里程碑高悬，名人堂的圣殿已向你敞开大门，你准备好告别赛场了吗？',
        };
      case 41:
        return {
          badge: `常青树神话 · ${currentYear} 赛季揭幕`,
          title: '不甘熄灭的火焰 · 体能恢复进入死角',
          subtitle: `${player.name} 在 41 岁的高龄依然屹立在 联盟 最高殿堂`,
          description:
            '41 岁的高龄让你每一次赛前热身都需要长达一个多小时的拉伸与理疗。体能消耗呈指数级上升，背靠背比赛对你的体能储备来说已是近乎不可能完成的考验。',
          question: '41 岁的传奇长青之路步履维艰，是带着所有荣耀优雅退役，还是继续燃烧最后的余温？',
        };
      case 42:
        return {
          badge: `联盟活化石 · ${currentYear} 赛季揭幕`,
          title: '向时光抗争 · 身体指标全线红灯',
          subtitle: `${player.name} 42 岁的躯体正在对抗整个物理规律`,
          description:
            '42 岁的年龄在 联盟 历史上屈指可数。训练师与医疗团队郑重提醒你：肌肉活性与关节劳损已达到警戒线，继续强行高强度征战将面临严重的身体损伤风险。',
          question: '42 岁的传奇之躯已经超越了无数前辈，你要选择荣耀挂靴还是挑战物理极限？',
        };
      default:
        // 43 and above
        return {
          badge: `强制退役关口 · ${currentYear} 赛季揭幕`,
          title: '荣耀挂靴',
          subtitle: `${player.name} 已达到 联盟规定的 43 岁最大参赛年龄上限`,
          description:
            `你在 联盟 赛场上征战了 ${seasonsPlayed} 个辉煌赛季，创造了无数神话与历史纪录。出于对老将身体健康的保护以及联盟 43 岁最大参赛年龄限制，你正式达到退役年龄上限。是时候挂起战靴，正式入选奈史密斯篮球名人堂！`,
          question: '传奇谢幕，荣耀永存！点击下方按钮直接开启你的退役仪式与名人堂大满贯结算。',
        };
    }
  };

  const declineContent = getDeclineContent(age);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none overflow-hidden">
      <div className="relative w-full max-w-md sm:max-w-lg overflow-hidden bg-[#11141b] border-2 border-amber-500/70 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.3)] text-center space-y-4 sm:space-y-5 animate-scale-up [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Background Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Warning Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-[11px] sm:text-xs font-bold tracking-wider uppercase">
          <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          <span>{declineContent.badge}</span>
        </div>

        {/* Central Physical Decline Icon */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-600 to-red-700 flex items-center justify-center shadow-xl shadow-rose-950/60 border-2 border-amber-300/80 shrink-0">
          <HeartPulse className="w-9 h-9 sm:w-11 sm:h-11 text-white animate-pulse" />
          <span className="absolute -bottom-2 -right-2 bg-black text-amber-400 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-lg border border-amber-400 font-mono">
            {age}岁
          </span>
        </div>

        {/* Title & Headline */}
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black italic uppercase text-white tracking-wide leading-snug">
            {declineContent.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            {declineContent.subtitle}
          </p>
        </div>

        {/* Main Alert Card */}
        <div className="bg-[#181d29] border border-amber-500/30 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-left space-y-3 shadow-inner">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {declineContent.description}
          </p>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>当前年龄: <strong className="text-amber-400">{age} 岁</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>生涯征战: <strong className="text-amber-400">{seasonsPlayed} 赛季</strong></span>
            </div>
          </div>
        </div>

        {/* Question Notice */}
        <p className="text-xs sm:text-sm text-amber-200/90 font-bold italic">
          {declineContent.question}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onRetire}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm uppercase italic tracking-wider shadow-lg shadow-red-950/60 hover:brightness-110 active:scale-95 transition-all cursor-pointer min-h-[46px] flex items-center justify-center gap-2 border border-red-400/50"
          >
            <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{age >= 43 ? '正式退役，荣入名人堂' : '选择退役 (前往名人堂)'}</span>
          </button>
          
          {age < 43 && (
            <button
              type="button"
              onClick={onContinue}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#1d2332] hover:bg-slate-800 text-amber-300 hover:text-amber-200 font-bold text-xs sm:text-sm border border-amber-500/40 hover:border-amber-400/80 transition-all cursor-pointer min-h-[46px] flex items-center justify-center gap-2 shadow-md group"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              <span>继续征战新赛季</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
