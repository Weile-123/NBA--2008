import React, { useState } from 'react';
import { PlayerProfile } from '../types';
import { MILESTONE_CATEGORIES, MilestoneCategory, getPlayerRankInCategory } from '../data/milestonesData';
import { Trophy, Award, Medal, Crown, Sparkles, TrendingUp, Target, Flame } from 'lucide-react';

interface MilestonesViewProps {
  player: PlayerProfile;
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({ player }) => {
  const [selectedCatId, setSelectedCatId] = useState<MilestoneCategory['id']>('pts');

  const currentCategory = MILESTONE_CATEGORIES.find((c) => c.id === selectedCatId) || MILESTONE_CATEGORIES[0];

  // Helper to extract player's career stat for a category
  const getPlayerStat = (catId: MilestoneCategory['id']) => {
    const stats = player.careerStats || { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tpm: 0 };
    switch (catId) {
      case 'pts': return stats.pts || 0;
      case 'reb': return stats.reb || 0;
      case 'ast': return stats.ast || 0;
      case 'stl': return stats.stl || 0;
      case 'blk': return stats.blk || 0;
      case 'tpm': return stats.tpm || 0;
      default: return 0;
    }
  };

  const currentPlayerStat = getPlayerStat(currentCategory.id);
  const rankResult = getPlayerRankInCategory(currentCategory.id, currentPlayerStat);
  const userRank = rankResult.rank; // number 1..10 or null if not in top 10

  const tenthLeader = currentCategory.leaders[currentCategory.leaders.length - 1];
  const diffToTenth = Math.max(0, tenthLeader.value - currentPlayerStat);
  const progressToTenth = Math.min(100, (currentPlayerStat / tenthLeader.value) * 100);

  // Construct table list including or excluding user based on rank
  // If user is in top 10, insert user into top 10 ranking list
  const displayLeaders = (() => {
    if (userRank === null) {
      // User not in top 10 -> show official 10 leaders as rank 1..10
      return currentCategory.leaders.map((l) => ({ ...l, isUser: false }));
    } else {
      // User IS in top 10 -> insert user at userRank, keep list size 10 or 11
      const combined = currentCategory.leaders.map((l) => ({ ...l, isUser: false }));
      const userLeaderItem = {
        rank: userRank,
        name: `${player.name} (你)`,
        team: player.currentTeamId || 'USER',
        value: currentPlayerStat,
        note: '👑 现役玩家新纪录',
        isUser: true,
      };

      // Insert and re-rank
      combined.splice(userRank - 1, 0, userLeaderItem);
      // Re-assign ranks
      return combined.slice(0, 10).map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));
    }
  })();

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-3.5 sm:space-y-6 text-slate-100 select-none">
      {/* Top Header Banner */}
      <div className="relative bg-gradient-to-r from-[#11141b] via-[#1a202c] to-[#11141b] border border-amber-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
                <Medal className="w-4 h-4 sm:w-6 sm:h-6" />
              </span>
              <h2 className="text-sm sm:text-2xl font-black italic uppercase text-white tracking-wide">
                🎖️ 联盟 历史数据里程碑榜单
              </h2>
            </div>
            <p className="text-[11px] sm:text-sm text-slate-400 font-medium hidden sm:block">
              追逐传奇音符，将你的名字永久烙印于 联盟 75 年历史得分、篮板、助攻神殿总榜。
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 bg-[#0d1017] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[#232834] shrink-0">
            <div className="text-center px-3 border-r border-[#232834] flex-1 sm:flex-initial">
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold">已出战</div>
              <div className="text-xs sm:text-base font-black font-mono text-white">
                {player.careerStats?.games || 0} <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal">场</span>
              </div>
            </div>
            <div className="text-center px-3 flex-1 sm:flex-initial">
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold">历史Top 3荣誉</div>
              <div className="text-xs sm:text-base font-black font-mono text-amber-400">
                {(player.accolades || []).filter((a) => a.title?.includes('历史') || a.type?.startsWith('MILESTONE')).length} <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal">项</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs Bar - 3 Columns Grid on Mobile (2 rows of 3), 6 Columns on Desktop. ALL visible without scrolling */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
        {MILESTONE_CATEGORIES.map((cat) => {
          const isSelected = cat.id === selectedCatId;
          const statVal = getPlayerStat(cat.id);
          const rRes = getPlayerRankInCategory(cat.id, statVal);

          const shortTitleMap: Record<string, string> = {
            pts: '得分',
            reb: '篮板',
            ast: '助攻',
            stl: '抢断',
            blk: '盖帽',
            tpm: '三分',
          };

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`flex items-center gap-1 sm:gap-2 p-1.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer min-w-0 justify-center sm:justify-start ${
                isSelected
                  ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/20 border-amber-400 scale-[1.02]'
                  : 'bg-[#11141b] border-[#232834] text-slate-300 hover:text-white hover:bg-[#181d29]'
              }`}
            >
              <span className="text-xs sm:text-base shrink-0">{cat.icon}</span>
              <div className="text-left min-w-0">
                <div className="text-[10px] sm:text-xs font-black uppercase leading-none truncate">
                  <span className="sm:hidden">{shortTitleMap[cat.id] || cat.name}</span>
                  <span className="hidden sm:inline">{cat.name}</span>
                </div>
                <div className={`text-[9px] sm:text-[10px] font-mono leading-none mt-1 truncate ${isSelected ? 'text-black/80 font-bold' : 'text-slate-400'}`}>
                  {statVal.toLocaleString()}
                  {rRes.rank && <span className="ml-0.5 font-black underline">#{rRes.rank}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Category Player Status Banner */}
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3 sm:p-5 space-y-3 sm:space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-[#232834] pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="text-lg sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-[#181d29] border border-[#2e374d]">
              {currentCategory.icon}
            </span>
            <div>
              <h3 className="text-sm sm:text-lg font-black italic uppercase text-white flex items-center gap-1.5">
                <span>{currentCategory.name}历史总榜</span>
                <span className="text-[10px] sm:text-xs font-mono font-normal text-slate-400">前10名</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                单位：{currentCategory.unit}
              </p>
            </div>
          </div>

          {/* Player status card */}
          {userRank !== null ? (
            <div className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-lg animate-pulse">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                高居历史第 <strong className="text-amber-400 text-sm font-black">{userRank}</strong> 位 (生涯: <strong className="text-white font-mono font-black">{currentPlayerStat.toLocaleString()}</strong>)
              </span>
            </div>
          ) : (
            <div className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-[#181d29] border border-[#2e374d] text-slate-300 font-bold text-xs flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>累计：<strong className="text-amber-400 font-mono">{currentPlayerStat.toLocaleString()}</strong> {currentCategory.unit}</span>
              </div>
              <span className="text-slate-500 text-[10px] font-normal">未入前10</span>
            </div>
          )}
        </div>

        {/* Progress towards Top 10 (when player is NOT in Top 10) */}
        {userRank === null && (
          <div className="bg-[#0d1017] p-2.5 sm:p-3.5 rounded-xl border border-[#232834] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
              <span className="text-slate-400 flex items-center gap-1 truncate">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                前10门槛 ({tenthLeader.name} {tenthLeader.value.toLocaleString()})
              </span>
              <span className="text-amber-400 font-mono font-black shrink-0 ml-1">
                还差 {diffToTenth.toLocaleString()} {currentCategory.unit}
              </span>
            </div>
            <div className="w-full h-2 bg-[#181d29] rounded-full overflow-hidden border border-[#232834]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${progressToTenth}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Leaderboard Table - Streamlined for Mobile */}
        <div className="overflow-x-auto rounded-xl border border-[#232834]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161b26] border-b border-[#232834] text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2 px-2 sm:px-3 text-center w-10 sm:w-14">排名</th>
                <th className="py-2 px-2 sm:px-3">球员</th>
                <th className="hidden sm:table-cell py-2 px-3 text-center">代表球队</th>
                <th className="py-2 px-2 sm:px-3 text-right">生涯总计 ({currentCategory.unit})</th>
                <th className="hidden sm:table-cell py-2 px-3 text-center">备注与地位</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232834] font-mono">
              {displayLeaders.map((item) => {
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;
                const isUser = item.isUser;

                return (
                  <tr
                    key={`leader-${currentCategory.id}-${item.rank}-${item.name}`}
                    className={`transition-colors ${
                      isUser
                        ? 'bg-amber-500/15 border-l-4 border-amber-400 text-white font-bold'
                        : 'bg-[#0d1017] hover:bg-[#141924] text-slate-200'
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-2 sm:py-2.5 px-1.5 sm:px-3 text-center">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-black font-black text-[10px] sm:text-xs shadow-md mx-auto">
                          1
                        </span>
                      ) : isTop2 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-300 text-black font-black text-[10px] sm:text-xs shadow-md mx-auto">
                          2
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-700 text-white font-black text-[10px] sm:text-xs shadow-md mx-auto">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold text-[11px] sm:text-xs">#{item.rank}</span>
                      )}
                    </td>

                    {/* Player Name */}
                    <td className="py-2 sm:py-2.5 px-2 sm:px-3">
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          {isUser && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />}
                          <span className={`text-xs sm:text-sm font-black font-sans ${isUser ? 'text-amber-300' : 'text-white'}`}>
                            {item.name}
                          </span>
                          {isUser && (
                            <span className="px-1 py-0.2 text-[8px] sm:text-[9px] rounded bg-amber-500 text-black font-black uppercase shrink-0">
                              你
                            </span>
                          )}
                        </div>
                        {/* Subtitle team on mobile so team info is preserved without extra column */}
                        <span className="text-[9px] text-slate-400 font-normal sm:hidden block mt-0.5">
                          {item.team} {item.note ? `· ${item.note}` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Team (hidden on mobile) */}
                    <td className="hidden sm:table-cell py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-[#181d29] border border-[#2e374d] text-[10px] font-bold text-slate-300 uppercase">
                        {item.team}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-right">
                      <span className={`text-xs sm:text-base font-black font-mono ${isUser ? 'text-amber-400' : isTop1 ? 'text-amber-300' : 'text-slate-200'}`}>
                        {item.value.toLocaleString()}
                      </span>
                    </td>

                    {/* Note (hidden on mobile) */}
                    <td className="hidden sm:table-cell py-2.5 px-3 text-center">
                      {item.note ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold ${isUser ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-[#181d29] text-slate-400'}`}>
                          {item.note}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-sans">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

