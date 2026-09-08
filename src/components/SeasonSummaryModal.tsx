import React, { useEffect, useState } from 'react';
import { PlayerProfile, Team, Accolade } from '../types';
import { calculateSeasonAwards, SeasonAwards, AwardWinner, AllTeamSelection } from '../utils/awardsLogic';
import confetti from 'canvas-confetti';
import { Trophy, Award, Crown, Sparkles, ChevronRight, ShieldCheck, UserCheck, Flame, Star } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface SeasonSummaryModalProps {
  player: PlayerProfile;
  teams: Team[];
  currentYear: number;
  onProceedToPlayoffs: () => void;
}

export const SeasonSummaryModal: React.FC<SeasonSummaryModalProps> = ({
  player,
  teams,
  currentYear,
  onProceedToPlayoffs,
}) => {
  const [awards, setAwards] = useState<SeasonAwards | null>(null);
  const [activeTab, setActiveTab] = useState<'major' | 'allNba' | 'defense'>('major');

  useEffect(() => {
    const computedAwards = calculateSeasonAwards(teams, player, currentYear);
    setAwards(computedAwards);

    // Sync season awards won by user into player.accolades
    const newAccolades = [...(player.accolades || [])];
    let updated = false;
    const seasonStr = `${currentYear}-${currentYear + 1}`;

    const addAccoladeIfMissing = (type: Accolade['type'], title: string, description: string) => {
      const exists = newAccolades.some((a) => a.year === currentYear && (a.type === type || a.title === title));
      if (!exists) {
        newAccolades.push({
          year: currentYear,
          seasonStr,
          title,
          type,
          description,
        });
        updated = true;
      }
    };

    if (computedAwards.mvp.isUser) {
      addAccoladeIfMissing('MVP', '常规赛 MVP', `荣膺 ${seasonStr} 赛季 NBA 常规赛最有价值球员(MVP)`);
    }
    if (computedAwards.scoringLeader.isUser) {
      addAccoladeIfMissing('SCORING_TITLE', '常规赛得分王', `以常规赛场均狂轰 ${computedAwards.scoringLeader.ppg} 分加冕 ${seasonStr} 赛季 NBA 得分王 (Scoring Leader)`);
    }
    if (computedAwards.dpoy.isUser) {
      addAccoladeIfMissing('DPOY', '最佳防守球员 (DPOY)', `荣膺 ${seasonStr} 赛季 NBA 最佳防守球员`);
    }
    if (computedAwards.sixthMan.isUser) {
      addAccoladeIfMissing('SIXTH_MAN', '最佳第六人 (6MOTY)', `荣膺 ${seasonStr} 赛季 NBA 最佳第六人`);
    }
    if (computedAwards.roy.isUser) {
      addAccoladeIfMissing('ROY', '最佳新秀 (ROY)', `荣膺 ${seasonStr} 赛季 NBA 年度最佳新秀`);
    }

    // All-NBA 1st, 2nd & 3rd
    if (computedAwards.allNbaTeams[0]?.players.some((p) => p.isUser)) {
      addAccoladeIfMissing('ALL_NBA_1ST', '最佳阵容一阵', `入选 ${seasonStr} 赛季 NBA 最佳阵容第一阵容`);
    }
    if (computedAwards.allNbaTeams[1]?.players.some((p) => p.isUser)) {
      addAccoladeIfMissing('ALL_NBA_2ND', '最佳阵容二阵', `入选 ${seasonStr} 赛季 NBA 最佳阵容第二阵容`);
    }
    if (computedAwards.allNbaTeams[2]?.players.some((p) => p.isUser)) {
      addAccoladeIfMissing('ALL_NBA_3RD', '最佳阵容三阵', `入选 ${seasonStr} 赛季 NBA 最佳阵容第三阵容`);
    }

    // All-Defensive 1st & 2nd
    if (computedAwards.allDefensiveTeams[0]?.players.some((p) => p.isUser)) {
      addAccoladeIfMissing('ALL_DEFENSE_1ST', '最佳防守一阵', `入选 ${seasonStr} 赛季 NBA 最佳防守阵容第一阵容`);
    }
    if (computedAwards.allDefensiveTeams[1]?.players.some((p) => p.isUser)) {
      addAccoladeIfMissing('ALL_DEFENSE_2ND', '最佳防守二阵', `入选 ${seasonStr} 赛季 NBA 最佳防守阵容第二阵容`);
    }

    // All-Star Selection
    const isUserAllStar =
      computedAwards.mvp.isUser ||
      computedAwards.dpoy.isUser ||
      computedAwards.sixthMan.isUser ||
      computedAwards.allNbaTeams.some((t) => t.players.some((p) => p.isUser)) ||
      (player.careerStats && player.careerStats.games > 0 && (player.careerStats.pts / player.careerStats.games) >= 16) ||
      player.ovr >= 82;

    if (isUserAllStar) {
      addAccoladeIfMissing('ALL_STAR', 'NBA 全明星', `入选 ${seasonStr} 赛季 NBA 全明星正赛阵容`);
    }

    if (updated) {
      player.accolades = newAccolades;
    }

    // Trigger confetti if user won any major honor
    const isUserMajorWinner =
      computedAwards.mvp.isUser ||
      computedAwards.dpoy.isUser ||
      computedAwards.sixthMan.isUser ||
      computedAwards.roy.isUser ||
      computedAwards.userMadePlayoffs;

    if (isUserMajorWinner) {
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.5 },
      });
    }
  }, [teams, player, currentYear]);

  if (!awards) return null;

  const userTeam = teams.find((t) => t.id === player.currentTeamId);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0d1017] border border-[#232834] rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-6 relative my-auto animate-fadeIn overflow-hidden">
        
        {/* Header */}
        <div className="text-center space-y-2 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" /> {currentYear}-{currentYear + 1} 赛季常规赛总结与颁奖盛典
          </div>
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tight">
            常规赛荣誉
          </h2>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 bg-[#141822] p-1.5 rounded-xl border border-[#232834]">
          <button
            type="button"
            onClick={() => setActiveTab('major')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'major'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" /> 五大年度单项大奖
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('allNba')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'allNba'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> 最佳阵容
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('defense')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'defense'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> 最佳防守阵容
          </button>
        </div>

        {/* Tab 1: Major Individual Awards (MVP, Scoring Leader, DPOY, 6th Man, ROY) */}
        {activeTab === 'major' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* MVP */}
            <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
              awards.mvp.isUser ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50' : 'bg-[#11141b] border-[#232834]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400" /> 常规赛最有价值球员 (MVP)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-lg font-black ${awards.mvp.isUser ? 'text-amber-300' : 'text-white'}`}>
                    {awards.mvp.isUser ? `👑 ${awards.mvp.name} (玩家)` : awards.mvp.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {awards.mvp.teamName} · {awards.mvp.position}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-black text-amber-400">{awards.mvp.ppg} PPG</div>
                  <div className="text-[11px] text-slate-400">{awards.mvp.rpg} RPG · {awards.mvp.apg} APG</div>
                </div>
              </div>
            </div>

            {/* DPOY */}
            <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
              awards.dpoy.isUser ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50' : 'bg-[#11141b] border-[#232834]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" /> 最佳防守球员 (DPOY)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-lg font-black ${awards.dpoy.isUser ? 'text-amber-300' : 'text-white'}`}>
                    {awards.dpoy.isUser ? `🛡️ ${awards.dpoy.name} (玩家)` : awards.dpoy.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {awards.dpoy.teamName} · {awards.dpoy.position}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-black text-blue-400">{awards.dpoy.spg} SPG · {awards.dpoy.bpg} BPG</div>
                  <div className="text-[11px] text-slate-400">{awards.dpoy.rpg} RPG</div>
                </div>
              </div>
            </div>

            {/* 得分王 (Scoring Title) */}
            <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
              awards.scoringLeader?.isUser ? 'bg-rose-500/15 border-rose-400 ring-2 ring-rose-400/50' : 'bg-[#11141b] border-[#232834]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-400 fill-rose-400" /> 常规赛得分王
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-lg font-black ${awards.scoringLeader?.isUser ? 'text-rose-300' : 'text-white'}`}>
                    {awards.scoringLeader?.isUser ? `🔥 ${awards.scoringLeader.name} (玩家)` : awards.scoringLeader?.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {awards.scoringLeader?.teamName} · {awards.scoringLeader?.position}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-base font-black text-rose-400">{awards.scoringLeader?.ppg} PPG</div>
                  <div className="text-[11px] text-slate-400">{awards.scoringLeader?.rpg} RPG · {awards.scoringLeader?.apg} APG</div>
                </div>
              </div>
            </div>

            {/* 6th Man */}
            <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
              awards.sixthMan.isUser ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50' : 'bg-[#11141b] border-[#232834]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-purple-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-400" /> 最佳第六人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-lg font-black ${awards.sixthMan.isUser ? 'text-amber-300' : 'text-white'}`}>
                    {awards.sixthMan.isUser ? `⚡ ${awards.sixthMan.name} (玩家)` : awards.sixthMan.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {awards.sixthMan.teamName} · {awards.sixthMan.position}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-black text-purple-400">{awards.sixthMan.ppg} PPG</div>
                  <div className="text-[11px] text-slate-400">{awards.sixthMan.apg} APG</div>
                </div>
              </div>
            </div>

            {/* ROY */}
            <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
              awards.roy.isUser ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50' : 'bg-[#11141b] border-[#232834]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" /> 最佳新秀 (ROY)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-lg font-black ${awards.roy.isUser ? 'text-amber-300' : 'text-white'}`}>
                    {awards.roy.isUser ? `⭐ ${awards.roy.name} (玩家)` : awards.roy.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {awards.roy.teamName} · {awards.roy.position}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-black text-emerald-400">{awards.roy.ppg} PPG</div>
                  <div className="text-[11px] text-slate-400">{awards.roy.rpg} RPG · {awards.roy.apg} APG</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: All-NBA Teams (1st, 2nd, 3rd) */}
        {activeTab === 'allNba' && (
          <div className="space-y-4">
            {awards.allNbaTeams.map((teamSel) => {
              const row1 = teamSel.players.slice(0, 3);
              const row2 = teamSel.players.slice(3, 5);
              return (
                <div key={teamSel.label} className="bg-[#11141b] border border-[#232834] rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" /> {teamSel.label}
                  </h4>
                  <div className="space-y-2.5 sm:space-y-3">
                    {/* Row 1: 3 players */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      {row1.map((p) => (
                        <div
                          key={p.id}
                          className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            p.isUser
                              ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold shadow-lg ring-1 ring-amber-400/50'
                              : 'bg-[#0d1017] border-[#232834] hover:border-slate-700'
                          }`}
                        >
                          <TeamLogo
                            abbrev={p.teamAbbrev}
                            name={p.teamName}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0 mb-2 drop-shadow-md"
                          />
                          <div className="flex flex-col items-center justify-center min-w-0 w-full">
                            <span className={`text-[10px] sm:text-xs font-black leading-tight break-words text-center w-full ${p.isUser ? 'text-amber-300' : 'text-white'}`}>
                              {p.isUser ? `👑 ${p.name}` : p.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Row 2: 2 players */}
                    <div className="flex justify-center gap-2.5 sm:gap-3">
                      {row2.map((p) => (
                        <div
                          key={p.id}
                          className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all w-[calc((100%-1.25rem)/3)] sm:w-[calc((100%-1.5rem)/3)] ${
                            p.isUser
                              ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold shadow-lg ring-1 ring-amber-400/50'
                              : 'bg-[#0d1017] border-[#232834] hover:border-slate-700'
                          }`}
                        >
                          <TeamLogo
                            abbrev={p.teamAbbrev}
                            name={p.teamName}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0 mb-2 drop-shadow-md"
                          />
                          <div className="flex flex-col items-center justify-center min-w-0 w-full">
                            <span className={`text-[10px] sm:text-xs font-black leading-tight break-words text-center w-full ${p.isUser ? 'text-amber-300' : 'text-white'}`}>
                              {p.isUser ? `👑 ${p.name}` : p.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: All-Defensive Teams (1st, 2nd) */}
        {activeTab === 'defense' && (
          <div className="space-y-4">
            {awards.allDefensiveTeams.map((teamSel) => {
              const row1 = teamSel.players.slice(0, 3);
              const row2 = teamSel.players.slice(3, 5);
              return (
                <div key={teamSel.label} className="bg-[#11141b] border border-[#232834] rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-wide flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" /> {teamSel.label}
                  </h4>
                  <div className="space-y-2.5 sm:space-y-3">
                    {/* Row 1: 3 players */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      {row1.map((p) => (
                        <div
                          key={p.id}
                          className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            p.isUser
                              ? 'bg-blue-500/20 border-blue-500/80 text-blue-300 font-bold shadow-lg ring-1 ring-blue-400/50'
                              : 'bg-[#0d1017] border-[#232834] hover:border-slate-700'
                          }`}
                        >
                          <TeamLogo
                            abbrev={p.teamAbbrev}
                            name={p.teamName}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0 mb-2 drop-shadow-md"
                          />
                          <div className="flex flex-col items-center justify-center min-w-0 w-full">
                            <span className={`text-[10px] sm:text-xs font-black leading-tight break-words text-center w-full ${p.isUser ? 'text-blue-300' : 'text-white'}`}>
                              {p.isUser ? `🛡️ ${p.name}` : p.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Row 2: 2 players */}
                    <div className="flex justify-center gap-2.5 sm:gap-3">
                      {row2.map((p) => (
                        <div
                          key={p.id}
                          className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all w-[calc((100%-1.25rem)/3)] sm:w-[calc((100%-1.5rem)/3)] ${
                            p.isUser
                              ? 'bg-blue-500/20 border-blue-500/80 text-blue-300 font-bold shadow-lg ring-1 ring-blue-400/50'
                              : 'bg-[#0d1017] border-[#232834] hover:border-slate-700'
                          }`}
                        >
                          <TeamLogo
                            abbrev={p.teamAbbrev}
                            name={p.teamName}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0 mb-2 drop-shadow-md"
                          />
                          <div className="flex flex-col items-center justify-center min-w-0 w-full">
                            <span className={`text-[10px] sm:text-xs font-black leading-tight break-words text-center w-full ${p.isUser ? 'text-blue-300' : 'text-white'}`}>
                              {p.isUser ? `🛡️ ${p.name}` : p.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Playoff Entrance Status Banner & Action Button */}
        <div className="bg-[#11141b] border border-[#232834] rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
                {awards.userMadePlayoffs ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold">
                    季后赛#{awards.userTeamSeed}号种子
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono font-bold">
                    未能进入季后赛
                  </span>
                )}
              <h3 className="text-sm font-black italic uppercase text-white flex items-center justify-center sm:justify-start gap-2 mt-1">
                {userTeam?.name} · {userTeam?.wins} 胜 {userTeam?.losses} 负
              </h3>
            </div>

          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={onProceedToPlayoffs}
            className={`w-full py-3.5 font-black italic rounded-xl text-sm uppercase tracking-tight shadow-xl flex items-center justify-center gap-2 transition-all ${
              awards.userMadePlayoffs
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {awards.userMadePlayoffs ? (
              <>
                <Flame className="w-5 h-5 fill-black" /> 开始季后赛
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5 text-amber-300" /> 模拟季后赛
              </>
            )}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
