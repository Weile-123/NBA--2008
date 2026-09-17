import React, { useEffect, useState } from 'react';
import { PlayerProfile, Team, Accolade } from '../types';
import { calculateSeasonAwards, SeasonAwards, AwardWinner, AllTeamSelection } from '../utils/awardsLogic';
import { gameConfetti as confetti } from '../utils/gameConfetti';
import { Trophy, Award, Crown, Sparkles, ChevronRight, ShieldCheck, Flame } from 'lucide-react';
import { TeamLogo } from './TeamLogo';

interface SeasonSummaryModalProps {
  player: PlayerProfile;
  teams: Team[];
  currentYear: number;
  onUpdatePlayer?: (player: PlayerProfile) => void;
  onAwardsSettled?: (awards: SeasonAwards) => void;
  onProceedToPlayoffs: () => void;
}

export const SeasonSummaryModal: React.FC<SeasonSummaryModalProps> = ({
  player,
  teams,
  currentYear,
  onUpdatePlayer,
  onAwardsSettled,
  onProceedToPlayoffs,
}) => {
  // The modal is mounted for one finished season. Compute its immutable
  // snapshot once instead of recalculating after every parent identity change.
  const [awards] = useState<SeasonAwards>(() => calculateSeasonAwards(teams, player, currentYear));
  const [activeTab, setActiveTab] = useState<'major' | 'allNba' | 'defense'>('major');

  useEffect(() => {
    onAwardsSettled?.(awards);
  }, [awards, onAwardsSettled]);

  useEffect(() => {
    // Sync season awards won by user into player.accolades
    let newAccolades = [...(player.accolades || [])];
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

    if (awards.mvp.isUser) {
      addAccoladeIfMissing('MVP', '常规赛 MVP', `荣膺 ${seasonStr} 赛季 联盟 常规赛最有价值球员`);
    }
    if (awards.scoringLeader.isUser) {
      addAccoladeIfMissing('SCORING_TITLE', '常规赛得分王', `以常规赛场均狂轰 ${awards.scoringLeader.ppg} 分加冕 ${seasonStr} 赛季 联盟 得分王`);
    }
    const statHonors = [
      ['REBOUND_LEADER', '常规赛篮板王', awards.reboundLeader, 'rpg', '篮板'],
      ['ASSIST_LEADER', '常规赛助攻王', awards.assistLeader, 'apg', '助攻'],
      ['THREE_POINT_LEADER', '常规赛三分王', awards.threePointLeader, 'tpm', '三分'],
      ['BLOCK_LEADER', '常规赛盖帽王', awards.blockLeader, 'bpg', '盖帽'],
      ['STEAL_LEADER', '常规赛抢断王', awards.stealLeader, 'spg', '抢断'],
    ] as const;
    for (const [type, title, winner, stat, label] of statHonors) {
      if (winner.isUser) addAccoladeIfMissing(type, title, `以场均 ${winner[stat]} 次${label}领跑 ${seasonStr} 赛季联盟`);
    }
    if (awards.dpoy.isUser) {
      addAccoladeIfMissing('DPOY', '最佳防守球员', `荣膺 ${seasonStr} 赛季 联盟 最佳防守球员`);
    }
    if (awards.sixthMan.isUser) {
      addAccoladeIfMissing('SIXTH_MAN', '最佳第六人', `荣膺 ${seasonStr} 赛季 联盟 最佳第六人`);
    }
    if (awards.roy.isUser) {
      addAccoladeIfMissing('ROY', '最佳新秀', `荣膺 ${seasonStr} 赛季 联盟 年度最佳新秀`);
    }

    const syncExclusiveSelection = (
      groupTypes: Accolade['type'][],
      selected: { type: Accolade['type']; title: string; description: string } | null,
    ) => {
      const existing = newAccolades.filter((a) => a.year === currentYear && groupTypes.includes(a.type));
      if (selected && existing.length === 1 && existing[0].type === selected.type) return;
      if (!selected && existing.length === 0) return;

      newAccolades = newAccolades.filter((a) => !(a.year === currentYear && groupTypes.includes(a.type)));
      if (selected) {
        newAccolades.push({ year: currentYear, seasonStr, ...selected });
      }
      updated = true;
    };

    // A player can belong to exactly one All-NBA and one All-Defensive team
    // per season. Keep the highest team if malformed input marks more than one.
    const allNbaSelection = awards.allNbaTeams.find((team) => team.players.some((p) => p.isUser));
    syncExclusiveSelection(
      ['ALL_NBA_1ST', 'ALL_NBA_2ND', 'ALL_NBA_3RD', 'ALL_NBA'],
      allNbaSelection
        ? {
            type: `ALL_NBA_${allNbaSelection.teamIndex === 1 ? '1ST' : allNbaSelection.teamIndex === 2 ? '2ND' : '3RD'}` as Accolade['type'],
            title: `最佳阵容${allNbaSelection.teamIndex === 1 ? '一' : allNbaSelection.teamIndex === 2 ? '二' : '三'}阵`,
            description: `入选 ${seasonStr} 赛季 联盟 最佳阵容第${allNbaSelection.teamIndex === 1 ? '一' : allNbaSelection.teamIndex === 2 ? '二' : '三'}阵容`,
          }
        : null,
    );

    const allDefenseSelection = awards.allDefensiveTeams.find((team) => team.players.some((p) => p.isUser));
    syncExclusiveSelection(
      ['ALL_DEFENSE_1ST', 'ALL_DEFENSE_2ND'],
      allDefenseSelection
        ? {
            type: allDefenseSelection.teamIndex === 1 ? 'ALL_DEFENSE_1ST' : 'ALL_DEFENSE_2ND',
            title: `最佳防守${allDefenseSelection.teamIndex === 1 ? '一' : '二'}阵`,
            description: `入选 ${seasonStr} 赛季 联盟 最佳防守阵容第${allDefenseSelection.teamIndex === 1 ? '一' : '二'}阵容`,
          }
        : null,
    );

    // All-Star Selection
    const isUserAllStar =
      awards.mvp.isUser ||
      awards.dpoy.isUser ||
      awards.sixthMan.isUser ||
      awards.allNbaTeams.some((t) => t.players.some((p) => p.isUser)) ||
      (player.careerStats && player.careerStats.games > 0 && (player.careerStats.pts / player.careerStats.games) >= 16) ||
      player.ovr >= 82;

    if (isUserAllStar) {
      addAccoladeIfMissing('ALL_STAR', '联盟 全明星', `入选 ${seasonStr} 赛季 联盟 全明星正赛阵容`);
    }

    if (updated) {
      onUpdatePlayer?.({ ...player, accolades: newAccolades });
    }
  }, [awards, currentYear, onUpdatePlayer, player]);

  useEffect(() => {
    // Trigger confetti if user won any major honor
    const isUserMajorWinner =
      awards.mvp.isUser ||
      awards.dpoy.isUser ||
      awards.sixthMan.isUser ||
      awards.roy.isUser ||
      awards.userMadePlayoffs;

    if (!isUserMajorWinner) return;
    const animationFrame = requestAnimationFrame(() => {
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [awards]);

  const userTeam = teams.find((t) => t.id === player.currentTeamId);
  const compactAwards: Array<{ title: string; winner: AwardWinner; value: number; unit: string; color: string; stats?: Array<[number, string]> }> = [
    { title: '最佳第六人', winner: awards.sixthMan, value: awards.sixthMan.ppg, unit: '分', color: 'text-violet-400', stats: [[awards.sixthMan.ppg, '分'], [awards.sixthMan.apg, '助'], [awards.sixthMan.rpg, '板']] },
    { title: '最佳新秀', winner: awards.roy, value: awards.roy.ppg, unit: '分', color: 'text-emerald-400', stats: [[awards.roy.ppg, '分'], [awards.roy.apg, '助'], [awards.roy.rpg, '板']] },
    { title: '得分王', winner: awards.scoringLeader, value: awards.scoringLeader.ppg, unit: '分', color: 'text-rose-400' },
    { title: '篮板王', winner: awards.reboundLeader, value: awards.reboundLeader.rpg, unit: '板', color: 'text-sky-400' },
    { title: '助攻王', winner: awards.assistLeader, value: awards.assistLeader.apg, unit: '助', color: 'text-teal-400' },
    { title: '三分王', winner: awards.threePointLeader, value: awards.threePointLeader.tpm, unit: '三分', color: 'text-amber-400' },
    { title: '盖帽王', winner: awards.blockLeader, value: awards.blockLeader.bpg, unit: '帽', color: 'text-cyan-400' },
    { title: '抢断王', winner: awards.stealLeader, value: awards.stealLeader.spg, unit: '断', color: 'text-purple-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0d1017] border border-[#232834] rounded-2xl max-w-4xl w-full max-h-[92svh] p-4 sm:p-7 shadow-2xl relative my-auto overflow-hidden flex min-h-0 flex-col gap-4 sm:gap-6">
        
        {/* Header */}
        <div className="text-center space-y-2 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" /> {currentYear}-{currentYear + 1} 赛季常规赛总结与颁奖盛典
          </div>
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tight">
            常规赛荣誉
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 space-y-4 sm:space-y-6">
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
            <Crown className="w-3.5 h-3.5" /> 赛季奖项
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
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            
            {/* MVP */}
            <div className={`relative min-w-0 rounded-xl border px-2.5 py-2 sm:px-4 sm:py-2.5 transition-all ${
              awards.mvp.isUser ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50' : 'bg-[#11141b] border-[#232834]'
            }`}>
              <div className="text-[10px] sm:text-xs font-black text-amber-400">常规赛MVP</div>
              <div className="mt-1.5 min-w-0 pr-14">
                <div className="min-w-0">
                  <span className={`block truncate text-xs sm:text-base font-black ${awards.mvp.isUser ? 'text-amber-300' : 'text-white'}`} title={awards.mvp.name}>
                    {awards.mvp.name}
                  </span>
                  <div className="mt-0.5 truncate text-[10px] text-slate-500" title={awards.mvp.teamName}>
                    {awards.mvp.teamAbbrev} · {awards.mvp.position}{awards.mvp.isUser ? ' · 你' : ''}
                  </div>
                </div>
                <div className="absolute right-2.5 top-6 sm:top-[30px] text-center font-mono text-[10px] sm:text-xs font-black leading-[11px] sm:leading-[12px] text-amber-400">
                  <div>{awards.mvp.ppg} 分</div>
                  <div>{awards.mvp.rpg} 板</div>
                  <div>{awards.mvp.apg} 助</div>
                </div>
              </div>
            </div>

            {/* DPOY */}
            <div className={`relative min-w-0 rounded-xl border px-2.5 py-2 sm:px-4 sm:py-2.5 transition-all ${
              awards.dpoy.isUser ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50' : 'bg-[#11141b] border-[#232834]'
            }`}>
              <div className="text-[10px] sm:text-xs font-black text-blue-400">DPOY</div>
              <div className="mt-1.5 min-w-0 pr-14">
                <div className="min-w-0">
                  <span className={`block truncate text-xs sm:text-base font-black ${awards.dpoy.isUser ? 'text-amber-300' : 'text-white'}`} title={awards.dpoy.name}>
                    {awards.dpoy.name}
                  </span>
                  <div className="mt-0.5 truncate text-[10px] text-slate-500" title={awards.dpoy.teamName}>
                    {awards.dpoy.teamAbbrev} · {awards.dpoy.position}{awards.dpoy.isUser ? ' · 你' : ''}
                  </div>
                </div>
                <div className="absolute right-2.5 top-6 sm:top-[30px] text-center font-mono text-[10px] sm:text-xs font-black leading-[11px] sm:leading-[12px] text-blue-400">
                  <div>{awards.dpoy.spg} 断</div>
                  <div>{awards.dpoy.bpg} 帽</div>
                  <div>{awards.dpoy.rpg} 板</div>
                </div>
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-2 sm:gap-3">
              {compactAwards.map(({ title, winner, value, unit, color, stats }) => (
                <div
                  key={title}
                  className={`relative min-w-0 rounded-xl border px-2.5 py-2 sm:px-4 sm:py-2.5 ${winner.isUser ? 'bg-amber-500/10 border-amber-400/70' : 'bg-[#11141b] border-[#232834]'}`}
                >
                  <div className={`text-[10px] sm:text-xs font-black whitespace-nowrap ${color}`}>{title}</div>
                  <div className="mt-1.5 min-w-0 pr-14">
                    <div className="min-w-0">
                      <span className={`block truncate text-xs sm:text-base font-black ${winner.isUser ? 'text-amber-300' : 'text-white'}`} title={winner.name}>
                        {winner.name}
                      </span>
                      <div className="mt-0.5 truncate text-[10px] text-slate-500" title={winner.teamName}>
                        {winner.teamAbbrev} · {winner.position}{winner.isUser ? ' · 你' : ''}
                      </div>
                    </div>
                    {stats ? (
                      <div className={`absolute right-2.5 top-6 sm:top-[30px] text-center text-[10px] sm:text-xs font-black font-mono leading-[11px] sm:leading-[12px] ${color}`}>
                        {stats.map(([statValue, statUnit]) => <div key={statUnit}>{statValue.toFixed(1)} {statUnit}</div>)}
                      </div>
                    ) : (
                      <span className={`absolute right-2.5 top-[29px] sm:top-[36px] text-[10px] sm:text-sm font-black font-mono whitespace-nowrap ${color}`}>
                        {value.toFixed(1)} {unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
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
        </div>

        {/* Bottom Playoff Entrance Status Banner & Action Button */}
        <div className="shrink-0 bg-[#11141b] border border-[#232834] rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
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
