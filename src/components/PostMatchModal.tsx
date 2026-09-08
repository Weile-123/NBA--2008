import React, { useState } from 'react';
import { PlayerProfile, Team, MatchBoxScore } from '../types';
import { generatePressQuestion, PressConferenceOption } from '../utils/proceduralEngine';
import { Award, Zap, Flame, MessageSquare, Twitter, Sparkles, CheckCircle2, TrendingUp, Trophy } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface PostMatchModalProps {
  player: PlayerProfile;
  userTeam: Team;
  oppTeam: Team;
  boxScore: MatchBoxScore;
  currentYear?: number;
  careerHistory?: any[];
  onContinue: (rewards: {
    xpEarned: number;
    moraleDelta: number;
    mediaRepDelta: number;
    fanDelta: number;
    skillPointsEarned?: number;
  }) => void;
}

export const PostMatchModal: React.FC<PostMatchModalProps> = ({
  player,
  userTeam,
  oppTeam,
  boxScore,
  currentYear = 2008,
  careerHistory = [],
  onContinue,
}) => {
  const { playerStats, userTeamScore, opponentScore } = boxScore;
  const isWin = userTeamScore > opponentScore;

  // Milestone calculation: Season 1-3 -> +1 SP every 2 games; Season 4+ -> +1 SP every 3 games
  const seasonIndex = currentYear - 2007;
  const isEarlySeasons = seasonIndex <= 2 || (careerHistory && careerHistory.length < 3);
  const gamesPlayed = player.seasonStats.games;
  const isMatchMilestone = isEarlySeasons ? (gamesPlayed % 2 === 0) : (gamesPlayed % 3 === 0);
  const milestoneSp = isMatchMilestone ? 1 : 0;

  // XP Award calculation based on 2 live matches per level up (~50% of maxXp per game)
  const currentXp = player.xp || 0;
  const maxXp = player.maxXp || 500;
  const baseMatchXp = Math.round(maxXp * 0.50);

  let gradeMult = 1.0;
  if (playerStats.ratingGrade === 'S+') gradeMult = 1.15;
  else if (playerStats.ratingGrade === 'S') gradeMult = 1.10;
  else if (playerStats.ratingGrade === 'A+') gradeMult = 1.05;
  else if (playerStats.ratingGrade === 'A') gradeMult = 1.0;
  else if (playerStats.ratingGrade === 'B') gradeMult = 0.9;
  else gradeMult = 0.8;

  const xpEarned = Math.round(baseMatchXp * gradeMult);
  const tacticalSp = boxScore.rewardSkillPoints || 0;
  const totalSkillPointsEarned = tacticalSp + milestoneSp;

  const nextTotalXp = currentXp + xpEarned;
  const isLevelUp = nextTotalXp >= maxXp;

  const [pressQuestion] = useState(generatePressQuestion(playerStats.pts, isWin));
  const [selectedPressOpt, setSelectedPressOpt] = useState<PressConferenceOption | null>(null);

  const handleFinish = () => {
    let moraleDelta = selectedPressOpt?.moraleChange || 0;
    let mediaRepDelta = selectedPressOpt?.mediaRepChange || 0;
    let baseFanDelta = selectedPressOpt?.fanChange || 500;

    // Apply 3x Fan multiplier if Buzzer Beater Win
    let fanDelta = boxScore.isBuzzerBeaterWin ? baseFanDelta * 3 : baseFanDelta;

    onContinue({
      xpEarned,
      moraleDelta,
      mediaRepDelta,
      fanDelta,
      skillPointsEarned: totalSkillPointsEarned,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#11141b] border border-[#232834] rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-6">
        {/* Match Result Banner */}
        <div className="text-center">
          <div className="inline-block px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase mb-1">
            赛后数据与总结 (POST-MATCH RECAP)
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white">
            {isWin ? '🏆 取得精彩胜利！' : '💔 遗憾惜败'}
          </h2>
          <div className="text-base font-black font-mono italic mt-1.5 text-slate-300 flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              <TeamLogo
                logo={userTeam.logo}
                abbrev={userTeam.abbrev}
                primaryColor={userTeam.primaryColor}
                secondaryColor={userTeam.secondaryColor}
                className="w-5 h-5 object-contain"
                alt={userTeam.name}
              />
              <span>{userTeam.name}</span>
            </div>
            <span className="text-amber-400 font-bold">{userTeamScore}</span>
            <span>-</span>
            <span>{opponentScore}</span>
            <div className="flex items-center gap-1.5">
              <span>{oppTeam.name}</span>
              <TeamLogo
                logo={oppTeam.logo}
                abbrev={oppTeam.abbrev}
                primaryColor={oppTeam.primaryColor}
                secondaryColor={oppTeam.secondaryColor}
                className="w-5 h-5 object-contain"
                alt={oppTeam.name}
              />
            </div>
          </div>
        </div>

        {/* Buzzer Beater Reward Banner */}
        {boxScore.isBuzzerBeaterWin && (
          <div className="bg-gradient-to-r from-amber-500/20 via-red-500/20 to-amber-500/20 border-2 border-amber-500 p-3.5 rounded-xl flex items-center gap-3 animate-pulse shadow-lg">
            <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <div className="text-amber-300 font-black text-sm uppercase italic flex items-center gap-1.5">
                🔥 终场压哨绝杀爆火成功！(BUZZER BEATER REWARD)
              </div>
              <div className="text-xs text-amber-100/90 mt-0.5">
                做到了！终场哨响压哨绝杀带走比赛！结算获得 <span className="font-bold text-emerald-400">3倍粉丝积累加成</span> 以及 <span className="font-bold text-amber-300">+3 点属性点</span>！
              </div>
            </div>
          </div>
        )}

        {/* Player Game Grade & Box Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0d1017] p-4 rounded-xl border border-[#232834]">
          <div className="flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-[#232834] pb-3 sm:pb-0">
            <span className="text-[10px] text-slate-500 font-bold uppercase">本场表现评级</span>
            <div className="text-3xl font-black text-amber-400 font-mono italic my-0.5">
              {playerStats.ratingGrade}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">表现评分</span>
          </div>

          <div className="sm:col-span-2 grid grid-cols-4 gap-2 text-center text-xs font-mono my-auto">
            <div className="bg-[#11141b] p-2 rounded border border-[#232834]">
              <span className="text-slate-500 text-[9px] block font-bold uppercase">得分</span>
              <span className="text-base font-black text-amber-400">{playerStats.pts}</span>
            </div>
            <div className="bg-[#11141b] p-2 rounded border border-[#232834]">
              <span className="text-slate-500 text-[9px] block font-bold uppercase">篮板</span>
              <span className="text-base font-black text-cyan-400">{playerStats.reb}</span>
            </div>
            <div className="bg-[#11141b] p-2 rounded border border-[#232834]">
              <span className="text-slate-500 text-[9px] block font-bold uppercase">助攻</span>
              <span className="text-base font-black text-emerald-400">{playerStats.ast}</span>
            </div>
            <div className="bg-[#11141b] p-2 rounded border border-[#232834]">
              <span className="text-slate-500 text-[9px] block font-bold uppercase">抢/盖</span>
              <span className="text-base font-black text-purple-400">{playerStats.stl}/{playerStats.blk}</span>
            </div>
          </div>
        </div>

        {/* XP Progress & Level Up Notification (Requirement 5) */}
        <div className="bg-[#0d1017] p-4 rounded-xl border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> 本场比赛经验值收益 (MATCH XP)
            </span>
            <span className="text-amber-400 font-mono">+{xpEarned} XP</span>
          </div>

          {/* XP Bar */}
          <div className="w-full h-3 bg-[#11141b] rounded-full overflow-hidden border border-[#232834] relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (nextTotalXp / maxXp) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>当前经验值: {nextTotalXp} / {maxXp} XP</span>
            <span>等级: Lv.{player.level || 1}</span>
          </div>

          {/* Milestone SP Reward */}
          {isMatchMilestone && (
            <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>🏀 赛季历练成长 ({isEarlySeasons ? '前3赛季每2场+1' : '每3场+1'} · 已出战 {gamesPlayed} 场)</span>
              </span>
              <span className="font-mono text-amber-400 font-black">+ 1 属性点 (SP)</span>
            </div>
          )}

          {tacticalSp > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>⚡ 战术抉择奖励</span>
              </span>
              <span className="font-mono text-amber-400 font-black">+ {tacticalSp} 属性点 (SP)</span>
            </div>
          )}

          {isLevelUp && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>🎉 经验满格等级提升！额外解锁 +1 属性升级点 (SP)！</span>
            </div>
          )}
        </div>

        {/* Press Conference Section */}
        <div className="bg-[#0d1017] p-4 rounded-xl border border-[#232834] space-y-2">
          <h4 className="text-xs font-black italic text-white uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> 赛后新闻发布会 (PRESS CONFERENCE)
          </h4>
          <p className="text-xs text-slate-300 italic">{pressQuestion.question}</p>

          <div className="space-y-1.5 pt-1">
            {pressQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPressOpt(opt)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                  selectedPressOpt === opt
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#11141b] border-[#232834] text-slate-300 hover:bg-[#181d29]'
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>

          {selectedPressOpt && (
            <div className="p-2.5 bg-[#11141b] border border-amber-500/30 rounded-lg text-xs text-amber-300 font-mono">
              💡 {selectedPressOpt.responseQuote}
            </div>
          )}
        </div>

        {/* Finish button */}
        <button
          onClick={handleFinish}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs uppercase tracking-tight shadow-xl transition-transform active:scale-95"
        >
          领取代言与经验收益 · 返回赛季大厅 (CONTINUE) →
        </button>
      </div>
    </div>
  );
};
