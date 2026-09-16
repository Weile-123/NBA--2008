import React, { useState, useEffect } from 'react';
import { scheduleRootScrollToTop } from '../utils/scroll';
import { Team, PlayerProfile, GameState, MatchRosterStats, SingleGamePlayerStats } from '../types';
import { Trophy, Award, BarChart3, Sparkles, Target, Activity, Users, Crown, Zap, Eye, X, Star, Calendar, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { enrichRosterPlayer, getCompleteTeamRoster, generateFullMatchRosterStats, calculateMatchScores, calculateTeamPowerRating, getPlayerCategoryRatings, getUserPlayerCategoryRatings, calculateTeamUsageContext } from '../utils/leagueLogic';
import { TeamLogo } from './TeamLogo';
import type { GameMode } from '../gameMode';
import { getEffectiveTeamStrategy, getTeamStrategyDescription, getTeamStrategyLabel } from '../utils/teamStrategyLogic';

interface LeagueStandingsProps {
  gameMode?: GameMode;
  teams: Team[];
  userTeamId: string;
  player?: PlayerProfile;
  currentYear?: number;
  careerHistory?: GameState['careerHistory'];
}

interface RecentMatchBoxScoreModalProps {
  match: {
    week: number;
    opponentId: string;
    isHome: boolean;
    userWon?: boolean;
    userScore?: number;
    oppScore?: number;
    rosterStats?: MatchRosterStats;
  };
  userTeam: Team;
  oppTeam: Team;
  player?: PlayerProfile;
  seasonIndex: number;
  onClose: () => void;
}

const RecentMatchBoxScoreModal: React.FC<RecentMatchBoxScoreModalProps> = ({
  match,
  userTeam,
  oppTeam,
  player,
  seasonIndex,
  onClose,
}) => {
  const [sortBy, setSortBy] = useState<'position' | 'points'>('position');

  const userScore = match.userScore ?? 98;
  const oppScore = match.oppScore ?? 92;

  const rosterStats =
    match.rosterStats ||
    (player
      ? generateFullMatchRosterStats(
          userTeam,
          oppTeam,
          player,
          userScore,
          oppScore,
          match.isHome,
          seasonIndex
        )
      : null);

  if (!rosterStats) return null;

  const homeTeam = match.isHome ? userTeam : oppTeam;
  const awayTeam = match.isHome ? oppTeam : userTeam;

  const posRank: Record<string, number> = { PG: 1, SG: 2, SF: 3, PF: 4, C: 5 };

  const sortPlayers = (players: SingleGamePlayerStats[]) => {
    const list = [...players];
    if (sortBy === 'points') {
      list.sort((a, b) => b.pts - a.pts || a.minutes - b.minutes);
    } else {
      list.sort((a, b) => (posRank[a.position] || 9) - (posRank[b.position] || 9) || b.pts - a.pts);
    }
    return list;
  };

  const homePlayersSorted = sortPlayers(rosterStats.homePlayers);
  const awayPlayersSorted = sortPlayers(rosterStats.awayPlayers);

  const homeSumPts = rosterStats.homePlayers.reduce((s, p) => s + p.pts, 0);
  const homeSumReb = rosterStats.homePlayers.reduce((s, p) => s + p.reb, 0);
  const homeSumAst = rosterStats.homePlayers.reduce((s, p) => s + p.ast, 0);

  const awaySumPts = rosterStats.awayPlayers.reduce((s, p) => s + p.pts, 0);
  const awaySumReb = rosterStats.awayPlayers.reduce((s, p) => s + p.reb, 0);
  const awaySumAst = rosterStats.awayPlayers.reduce((s, p) => s + p.ast, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0d1017] border border-[#232834] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl relative my-auto animate-fadeIn overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#141822] border-b border-[#232834] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/30">
              第 {match.week} 场 · 比赛数据单
            </span>
            <h2 className="text-lg font-black italic uppercase text-white">单场比赛球员高精数据 (100%得分对应)</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#1a1f2c] p-1 rounded-xl border border-[#2d3446]">
              <button
                type="button"
                onClick={() => setSortBy('position')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'position'
                    ? 'bg-amber-500 text-black shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏀 按位置排序
              </button>
              <button
                type="button"
                onClick={() => setSortBy('points')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === 'points'
                    ? 'bg-amber-500 text-black shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔥 按得分排序
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1a1f2c] text-slate-400 hover:text-white border border-[#2d3446] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scoreboard Banner */}
        <div className="bg-[#0a0c12] border-b border-[#232834] py-3 px-6 flex items-center justify-center gap-8">
          <div className="flex items-center gap-3">
            <TeamLogo
              logo={homeTeam.logo}
              abbrev={homeTeam.abbrev}
              primaryColor={homeTeam.primaryColor}
              secondaryColor={homeTeam.secondaryColor}
              className="w-8 h-8 object-contain"
            />
            <div className="text-right">
              <span className="text-xs font-bold text-slate-300 block">{homeTeam.name} (主队)</span>
              <span className={`text-2xl font-black font-mono ${rosterStats.homeScore > rosterStats.awayScore ? 'text-amber-400' : 'text-slate-400'}`}>
                {rosterStats.homeScore}
              </span>
            </div>
          </div>

          <div className="text-slate-600 font-mono font-black italic text-lg px-2">VS</div>

          <div className="flex items-center gap-3">
            <div className="text-left">
              <span className="text-xs font-bold text-slate-300 block">{awayTeam.name} (客队)</span>
              <span className={`text-2xl font-black font-mono ${rosterStats.awayScore > rosterStats.homeScore ? 'text-amber-400' : 'text-slate-400'}`}>
                {rosterStats.awayScore}
              </span>
            </div>
            <TeamLogo
              logo={awayTeam.logo}
              abbrev={awayTeam.abbrev}
              primaryColor={awayTeam.primaryColor}
              secondaryColor={awayTeam.secondaryColor}
              className="w-8 h-8 object-contain"
            />
          </div>
        </div>

        {/* Modal Body: Split 2 Columns */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92vh-160px)] grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Left Column: Home Team */}
          <div className="bg-[#11141d] border border-[#232834] rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-[#232834] pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <TeamLogo
                  logo={homeTeam.logo}
                  abbrev={homeTeam.abbrev}
                  primaryColor={homeTeam.primaryColor}
                  secondaryColor={homeTeam.secondaryColor}
                  className="w-5 h-5 object-contain"
                />
                <span className="font-black text-sm text-white">{homeTeam.name} (主队)</span>
              </div>
              <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                总得分: {rosterStats.homeScore} 分
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#232834] text-[10px] text-slate-500 uppercase font-mono">
                    <th className="pb-2">球员</th>
                    <th className="pb-2 text-center">位置</th>
                    <th className="pb-2 text-center">时间</th>
                    <th className="pb-2 text-center text-amber-400 font-bold">得分</th>
                    <th className="pb-2 text-center">篮板</th>
                    <th className="pb-2 text-center">助攻</th>
                    <th className="pb-2 text-center">抢断</th>
                    <th className="pb-2 text-center">盖帽</th>
                    <th className="pb-2 text-right">投篮</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232834]/40">
                  {homePlayersSorted.map((p, pIdx) => (
                    <tr
                      key={`ls-home-p-${p.id || p.name}-${pIdx}`}
                      className={p.isUser ? 'bg-amber-500/15 font-bold text-amber-300' : 'hover:bg-[#181e2b]/50 text-slate-300'}
                    >
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={p.isUser ? 'text-amber-300 font-black' : 'text-white font-medium'}>
                            {p.isUser ? `👑 ${p.name}` : p.name}
                          </span>
                          {p.isUser && (
                            <span className="text-[9px] bg-amber-500 text-black px-1 rounded font-black italic">
                              玩家
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.position}</td>
                      <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.dnpReason ? 'DNP' : `${p.minutes}m`}</td>
                      <td className="py-2 text-center font-mono font-black text-amber-400 text-xs">{p.pts}</td>
                      <td className="py-2 text-center font-mono text-blue-300 text-[11px]">{p.reb}</td>
                      <td className="py-2 text-center font-mono text-emerald-300 text-[11px]">{p.ast}</td>
                      <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.stl}</td>
                      <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.blk}</td>
                      <td className="py-2 text-right font-mono text-slate-400 text-[11px]">{p.fgm}/{p.fga}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 pt-2 border-t border-[#232834] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>全队得分和对应</span>
              <span className="font-bold text-amber-400">
                {homeSumPts}分 · {homeSumReb}板 · {homeSumAst}助
              </span>
            </div>
          </div>

          {/* Right Column: Away Team */}
          <div className="bg-[#11141d] border border-[#232834] rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-[#232834] pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <TeamLogo
                  logo={awayTeam.logo}
                  abbrev={awayTeam.abbrev}
                  primaryColor={awayTeam.primaryColor}
                  secondaryColor={awayTeam.secondaryColor}
                  className="w-5 h-5 object-contain"
                />
                <span className="font-black text-sm text-white">{awayTeam.name} (客队)</span>
              </div>
              <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                总得分: {rosterStats.awayScore} 分
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#232834] text-[10px] text-slate-500 uppercase font-mono">
                    <th className="pb-2">球员</th>
                    <th className="pb-2 text-center">位置</th>
                    <th className="pb-2 text-center">时间</th>
                    <th className="pb-2 text-center text-amber-400 font-bold">得分</th>
                    <th className="pb-2 text-center">篮板</th>
                    <th className="pb-2 text-center">助攻</th>
                    <th className="pb-2 text-center">抢断</th>
                    <th className="pb-2 text-center">盖帽</th>
                    <th className="pb-2 text-right">投篮</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232834]/40">
                  {awayPlayersSorted.map((p, pIdx) => (
                    <tr
                      key={`ls-away-p-${p.id || p.name}-${pIdx}`}
                      className={p.isUser ? 'bg-amber-500/15 font-bold text-amber-300' : 'hover:bg-[#181e2b]/50 text-slate-300'}
                    >
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={p.isUser ? 'text-amber-300 font-black' : 'text-white font-medium'}>
                            {p.isUser ? `👑 ${p.name}` : p.name}
                          </span>
                          {p.isUser && (
                            <span className="text-[9px] bg-amber-500 text-black px-1 rounded font-black italic">
                              玩家
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.position}</td>
                      <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.dnpReason ? 'DNP' : `${p.minutes}m`}</td>
                      <td className="py-2 text-center font-mono font-black text-amber-400 text-xs">{p.pts}</td>
                      <td className="py-2 text-center font-mono text-blue-300 text-[11px]">{p.reb}</td>
                      <td className="py-2 text-center font-mono text-emerald-300 text-[11px]">{p.ast}</td>
                      <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.stl}</td>
                      <td className="py-2 text-center font-mono text-slate-400 text-[11px]">{p.blk}</td>
                      <td className="py-2 text-right font-mono text-slate-400 text-[11px]">{p.fgm}/{p.fga}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 pt-2 border-t border-[#232834] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>全队得分和对应</span>
              <span className="font-bold text-amber-400">
                {awaySumPts}分 · {awaySumReb}板 · {awaySumAst}助
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export const LeagueStandings: React.FC<LeagueStandingsProps> = ({
  gameMode = 'classic',
  teams,
  userTeamId,
  player,
  currentYear = 2008,
  careerHistory = [],
}) => {
  const seasonIndex = currentYear - 2007;
  const seasonStr = `${currentYear}-${(currentYear + 1).toString().slice(-2)} 赛季`;
  const [activeSubNav, setActiveSubNav] = useState<'standings' | 'userStats'>('userStats');

  useEffect(() => {
    const animationFrame = scheduleRootScrollToTop();
    return () => cancelAnimationFrame(animationFrame);
  }, [activeSubNav]);
  const [leaderCategory, setLeaderCategory] = useState<'ppg' | 'apg' | 'rpg' | 'spg' | 'bpg'>('ppg');
  const [selectedTeamForModal, setSelectedTeamForModal] = useState<Team | null>(null);
  const [showPowerRating, setShowPowerRating] = useState<boolean>(false);
  const [isAccoladesExpanded, setIsAccoladesExpanded] = useState<boolean>(false);
  const [teamModalViewMode, setTeamModalViewMode] = useState<'stats' | 'ratings'>('stats');
  const selectedTeamStrategy = selectedTeamForModal ? getEffectiveTeamStrategy(selectedTeamForModal, teams) : null;

  // Calculates team power rating incorporating user player if on user's team
  const getTeamPowerRatingScore = (team: Team) => {
    let roster = team.roster || [];
    if (player && team.id === userTeamId) {
      const userInRoster = roster.some((p) => p.id === 'user' || p.name === player.name);
      if (!userInRoster) {
        roster = [
          ...roster,
          {
            id: 'user',
            name: player.name,
            ovr: player.ovr,
            position: player.position,
            role: '战术核心',
            isStar: player.ovr >= 90,
          },
        ];
      }
    }
    return calculateTeamPowerRating({ ...team, roster });
  };

  // Sort helper function (sorts by Win Percentage, then Total Wins)
  const sortTeams = (teamList: Team[]) => {
    return [...teamList].sort((a, b) => {
      const aTotal = a.wins + a.losses;
      const bTotal = b.wins + b.losses;
      const aPct = aTotal > 0 ? a.wins / aTotal : 0;
      const bPct = bTotal > 0 ? b.wins / bTotal : 0;
      if (bPct !== aPct) return bPct - aPct;
      return b.wins - a.wins;
    });
  };

  const eastTeams = sortTeams(teams.filter((t) => t.conference === 'East'));
  const westTeams = sortTeams(teams.filter((t) => t.conference === 'West'));
  const userTeam = teams.find((t) => t.id === userTeamId);

  const getGb = (topTeam: Team, currentTeam: Team) => {
    if (topTeam.id === currentTeam.id) return '-';
    const diff = (topTeam.wins - currentTeam.wins + (currentTeam.losses - topTeam.losses)) / 2;
    return diff > 0 ? diff.toFixed(1) : '-';
  };

  // User stats calculations
  const career = player?.careerStats || {
    games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
    fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, turnovers: 0, minutes: 0
  };
  const season = player?.seasonStats || {
    games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
    fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, turnovers: 0, minutes: 0
  };

  const cGames = career.games || 1;
  const sGames = season.games || 1;

  const cPpg = (career.pts / cGames).toFixed(1);
  const cRpg = (career.reb / cGames).toFixed(1);
  const cApg = (career.ast / cGames).toFixed(1);
  const cSpg = (career.stl / cGames).toFixed(1);
  const cBpg = (career.blk / cGames).toFixed(1);

  const cFgPct = career.fga > 0 ? ((career.fgm / career.fga) * 100).toFixed(1) + '%' : '0.0%';
  const c3pPct = career.tpa > 0 ? ((career.tpm / career.tpa) * 100).toFixed(1) + '%' : '0.0%';
  const cFtPct = career.fta > 0 ? ((career.ftm / career.fta) * 100).toFixed(1) + '%' : '0.0%';

  const sPpg = (season.pts / sGames).toFixed(1);
  const sRpg = (season.reb / sGames).toFixed(1);
  const sApg = (season.ast / sGames).toFixed(1);
  const sSpg = (season.stl / sGames).toFixed(1);
  const sBpg = (season.blk / sGames).toFixed(1);

  // Aggregate ALL players from all teams + user player into candidate list
  const allLeaguePlayers: Array<{
    id: string;
    name: string;
    teamName: string;
    teamId: string;
    conference: 'East' | 'West';
    position: string;
    ovr: number;
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    fgPct: number;
    winPct: number;
    isUser: boolean;
    allStarVotes: number;
  }> = [];

  // Check total games played across league
  const totalLeagueGames = teams.reduce((acc, t) => acc + t.wins + t.losses, 0);

  // Add real roster players from all 30 teams
  teams.forEach((t) => {
    const totalG = t.wins + t.losses;
    const winPct = totalG > 0 ? t.wins / totalG : 0.5;
    const currentWeekGames = Math.max(1, totalG);
    const hasPlayed = totalG > 0;

    const teamUsageContext = calculateTeamUsageContext(t.roster || []);

    t.roster.forEach((p, idx) => {
      // Skip user player entries from team roster as user is added explicitly below
      if (player && (p.id === player.id || p.name === player.name || (p as any).isUser)) {
        return;
      }
      const enriched = enrichRosterPlayer(p, idx, seasonIndex, teamUsageContext);
      const st = enriched.stats!;
      
      // Calculate All-Star vote count dynamically based on stats, OVR, and week games
      const voteBase = Math.round((p.ovr * 1800 + st.ppg * 12000 + st.apg * 6000 + st.rpg * 5000) * (0.8 + winPct * 0.4));
      const allStarVotes = Math.max(15000, Math.round((voteBase * currentWeekGames) / 10));

      allLeaguePlayers.push({
        id: p.id,
        name: p.name,
        teamName: t.name,
        teamId: t.id,
        conference: t.conference || 'East',
        position: p.position,
        ovr: p.ovr,
        ppg: hasPlayed ? st.ppg : 0,
        rpg: hasPlayed ? st.rpg : 0,
        apg: hasPlayed ? st.apg : 0,
        spg: hasPlayed ? st.spg : 0,
        bpg: hasPlayed ? st.bpg : 0,
        fgPct: hasPlayed ? st.fgPct : 0,
        winPct: hasPlayed ? winPct : 0,
        isUser: false,
        allStarVotes: hasPlayed ? allStarVotes : 0,
      });
    });
  });

  // Add user player
  if (player && userTeam) {
    const totalG = userTeam.wins + userTeam.losses;
    const winPct = totalG > 0 ? userTeam.wins / totalG : 0.5;
    const currentWeekGames = Math.max(1, totalG);
    const hasPlayed = season.games > 0;

    const userRosterInfo = getCompleteTeamRoster(userTeam, player, seasonIndex);
    const userEntryInRoster = userRosterInfo.roster.find((r) => r.isUser);
    const userStats = userEntryInRoster?.stats || { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, fgPct: 0, mpg: 0 };

    const uPpg = hasPlayed ? parseFloat(sPpg) : 0;
    const uRpg = hasPlayed ? parseFloat(sRpg) : 0;
    const uApg = hasPlayed ? parseFloat(sApg) : 0;
    const uSpg = hasPlayed ? parseFloat(sSpg) : 0;
    const uBpg = hasPlayed ? parseFloat(sBpg) : 0;
    const uFgPct = hasPlayed && season.fga > 0 ? parseFloat(((season.fgm / season.fga) * 100).toFixed(1)) : 0;

    const userVoteBase = Math.round((player.ovr * 2200 + uPpg * 15000 + uApg * 7000 + uRpg * 6000) * (0.8 + winPct * 0.4));
    const userStarVotes = Math.max(25000, Math.round((userVoteBase * currentWeekGames) / 10));

    allLeaguePlayers.push({
      id: 'user_player',
      name: player.name,
      teamName: userTeam.name,
      teamId: userTeam.id,
      conference: userTeam.conference || 'East',
      position: player.position,
      ovr: player.ovr,
      ppg: uPpg,
      rpg: uRpg,
      apg: uApg,
      spg: uSpg,
      bpg: uBpg,
      fgPct: uFgPct,
      winPct: hasPlayed ? winPct : 0,
      isUser: true,
      allStarVotes: hasPlayed ? userStarVotes : 0,
    });
  }

  // Get Leaders for selected category
  const getCategoryLeaders = () => {
    return [...allLeaguePlayers].sort((a, b) => b[leaderCategory] - a[leaderCategory]).slice(0, 10);
  };

  // All-Star voting lists (East top 10 & West top 10)
  const eastAllStarLeaders = [...allLeaguePlayers]
    .filter((p) => p.conference === 'East')
    .sort((a, b) => b.allStarVotes - a.allStarVotes)
    .slice(0, 10);

  const westAllStarLeaders = [...allLeaguePlayers]
    .filter((p) => p.conference === 'West')
    .sort((a, b) => b.allStarVotes - a.allStarVotes)
    .slice(0, 10);

  // Render Standing Table
  const renderTable = (teamList: Team[], title: string) => {
    const topTeam = teamList[0];

    return (
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#232834] pb-2.5 sm:pb-3 gap-1.5 sm:gap-2">
          <h3 className="text-xs sm:text-base font-black italic uppercase text-white flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" /> {title}
          </h3>
          <button
            type="button"
            onClick={() => setShowPowerRating(!showPowerRating)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black italic uppercase transition-all flex items-center gap-2 border cursor-pointer ${
              showPowerRating
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-[#0d1017] hover:bg-[#181d29] text-amber-400 border-amber-500/40'
            }`}
          >
            🧪 {showPowerRating ? '隐藏球队实力评分' : '显示球队实力评分'}
          </button>
          <p className="w-full text-[10px] sm:text-[11px] text-slate-500 font-medium">
            点击球队查看球队阵容名单
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#232834] text-[9px] sm:text-[10px] text-slate-500 uppercase font-mono bg-[#0d1017]">
                <th className="py-2 sm:py-2.5 px-2 sm:px-3 whitespace-nowrap">排名</th>
                <th className="py-2 sm:py-2.5 px-2 sm:px-3 whitespace-nowrap">球队</th>
                {showPowerRating && (
                  <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-center whitespace-nowrap text-amber-400 font-black">
                    实力评分
                  </th>
                )}
                <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">胜</th>
                <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">负</th>
                <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-center whitespace-nowrap">胜率</th>
                <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-center whitespace-nowrap hidden sm:table-cell">胜场差</th>
                <th className="py-2 sm:py-2.5 px-2 sm:px-3 text-right whitespace-nowrap hidden sm:table-cell">阵容详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232834]/50">
              {teamList.map((team, idx) => {
                const isUserTeam = team.id === userTeamId;
                const total = team.wins + team.losses;
                const pct = total > 0 ? (team.wins / total).toFixed(3) : '.000';
                const gb = topTeam ? getGb(topTeam, team) : '-';
                const isPlayoffSpot = idx < 8;
                const powerRating = getTeamPowerRatingScore(team);

                return (
                  <tr
                    key={team.id}
                    onClick={() => setSelectedTeamForModal(team)}
                    className={`transition-colors cursor-pointer group ${
                      isUserTeam
                        ? 'bg-amber-500/15 border-l-4 border-amber-500 text-white font-bold'
                        : 'hover:bg-[#181d29] text-slate-300'
                    }`}
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-3 font-mono font-bold">
                      <span
                        className={`inline-block w-5 h-5 sm:w-6 sm:h-6 rounded text-center leading-5 sm:leading-6 text-[10px] sm:text-[11px] ${
                          isPlayoffSpot
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-[#0d1017] text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    <td className="py-2 sm:py-3 px-2 sm:px-3">
                      <div className="flex items-center gap-1.5 sm:gap-2.5">
                        <TeamLogo
                          logo={team.logo}
                          abbrev={team.abbrev}
                          primaryColor={team.primaryColor}
                          secondaryColor={team.secondaryColor}
                          className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                          alt={team.name}
                        />
                        <span className={`font-bold text-xs sm:text-sm ${isUserTeam ? 'text-amber-400 italic font-black' : 'text-white group-hover:text-amber-300'}`}>
                          {team.name}
                        </span>
                        {isUserTeam && (
                          <span className="text-[8px] sm:text-[9px] bg-amber-500 text-black px-1 sm:px-1.5 py-0.2 rounded font-black italic uppercase">
                            你的球队
                          </span>
                        )}
                      </div>
                    </td>

                    {showPowerRating && (
                      <td className="py-2 sm:py-3 px-2 sm:px-3 text-center font-mono font-black text-amber-300">
                        <span className="px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs">
                          ⭐️ {powerRating}
                        </span>
                      </td>
                    )}

                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-emerald-400 text-xs sm:text-sm">{team.wins}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-red-400 text-xs sm:text-sm">{team.losses}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-center font-mono font-bold text-amber-300 text-xs sm:text-sm">{pct}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-center font-mono text-slate-400 hidden sm:table-cell">{gb}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-right hidden sm:table-cell">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeamForModal(team);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0d1017] group-hover:bg-amber-500 group-hover:text-black text-slate-300 border border-[#232834] font-bold text-[10px] inline-flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3 h-3" /> 查看阵容
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-xl font-black italic uppercase text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" /> 数据面板
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            包含玩家生涯总数据和全联盟战绩排名
          </p>
        </div>

        {userTeam && (
          <div className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>效力: {userTeam.name} ({userTeam.wins}胜{userTeam.losses}负)</span>
          </div>
        )}
      </div>

      {/* Inner Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-[#11141b] p-1 sm:p-1.5 rounded-2xl border border-[#232834] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubNav('userStats')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeSubNav === 'userStats'
              ? 'bg-amber-500 text-black shadow-md italic font-black'
              : 'text-slate-400 hover:text-white hover:bg-[#181d28]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 玩家个人/生涯数据
        </button>

        <button
          type="button"
          onClick={() => setActiveSubNav('standings')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            activeSubNav === 'standings'
              ? 'bg-amber-500 text-black shadow-md italic font-black'
              : 'text-slate-400 hover:text-white hover:bg-[#181d28]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 联盟球队战绩榜
        </button>
      </div>

      {/* SUB-TAB 1: 玩家个人/生涯数据面板 */}
      {activeSubNav === 'userStats' && player && (
        <div className="bg-[#11141b] border border-[#232834] rounded-2xl p-3.5 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-[#232834] pb-3 sm:pb-4">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
            {!isAccoladesExpanded &&
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-black text-base sm:text-lg italic shadow-lg shrink-0">
                #{player.jerseyNum}
              </div>
            }
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black italic text-white text-nowrap">{player.name}</h3>
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold font-mono text-nowrap">
                    OVR {player.ovr}
                  </span>
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-nowrap">
                    Lv.{player.level || 1}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-mono">
                  位置: {player.position} · {player.archetype} · {player.height}/{player.weight}
                </div>
              </div>
            </div>

            {/* Honors/Accolades Preview (Collapsible) */}
            <div className="bg-[#0d1017]/80 border border-[#232834] rounded-xl p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span className="text-[11px] sm:text-xs text-slate-300 font-bold">
                    生涯荣誉斩获 ({player.accolades?.length || 0})
                  </span>
                </div>
                {player.accolades && player.accolades.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAccoladesExpanded(!isAccoladesExpanded)}
                    className="text-[10px] sm:text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded transition-all flex items-center gap-1"
                  >
                    {isAccoladesExpanded ? (
                      <>
                        <span>折叠收起</span>
                        <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>展开明细 ({player.accolades.length})</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {player.accolades && player.accolades.length > 0 ? (
                isAccoladesExpanded ? (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
                    {player.accolades.map((acc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      >
                        <span className="text-slate-400 font-bold">{acc.seasonStr || `${acc.year}`}</span>
                        <span className="font-bold">{acc.title}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[11px] sm:text-xs text-amber-300 font-mono font-bold truncate">
                      {player.accolades.slice(0, 3).map((a) => a.title).join(' · ')}
                      {player.accolades.length > 3 && (
                        <span className="text-slate-400 font-normal ml-1">
                          等共 {player.accolades.length} 项
                        </span>
                      )}
                    </span>
                  </div>
                )
              ) : (
                <div className="text-[10px] sm:text-xs text-slate-500 font-mono">
                  {seasonStr} 潜力新秀崛起中，暂未解锁个人最高荣誉
                </div>
              )}
            </div>
          </div>

          {/* Key Per-Game Averages Display Cards */}
          <div>
            <div className="text-[11px] sm:text-xs font-black uppercase text-slate-400 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> 生涯场均核心数据
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-3">
              <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834] text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block truncate">得分</span>
                <span className="text-base sm:text-xl font-black font-mono text-amber-400 mt-0.5 sm:mt-1 block">{cPpg}</span>
              </div>
              <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834] text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block truncate">篮板</span>
                <span className="text-base sm:text-xl font-black font-mono text-blue-400 mt-0.5 sm:mt-1 block">{cRpg}</span>
              </div>
              <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834] text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block truncate">助攻</span>
                <span className="text-base sm:text-xl font-black font-mono text-emerald-400 mt-0.5 sm:mt-1 block">{cApg}</span>
              </div>
              <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834] text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block truncate">抢断</span>
                <span className="text-base sm:text-xl font-black font-mono text-purple-400 mt-0.5 sm:mt-1 block">{cSpg}</span>
              </div>
              <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834] text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block truncate">盖帽</span>
                <span className="text-base sm:text-xl font-black font-mono text-cyan-400 mt-0.5 sm:mt-1 block">{cBpg}</span>
              </div>
              <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834] text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block truncate">投篮命中</span>
                <span className="text-base sm:text-xl font-black font-mono text-slate-200 mt-0.5 sm:mt-1 block">{cFgPct}</span>
              </div>
              <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834] text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block truncate">三分命中</span>
                <span className="text-base sm:text-xl font-black font-mono text-amber-300 mt-0.5 sm:mt-1 block">{c3pPct}</span>
              </div>
              <div className="bg-[#0d1017] p-2 sm:p-3 rounded-xl border border-[#232834] text-center">
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold block truncate">罚球命中</span>
                <span className="text-base sm:text-xl font-black font-mono text-emerald-300 mt-0.5 sm:mt-1 block">{cFtPct}</span>
              </div>
            </div>
          </div>

          {/* Experienced Seasons vs Career Stats Table */}
          {(() => {
            const currentSeasonStr = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
            const activeSeasonAvg = {
              seasonStr: currentSeasonStr,
              games: season.games,
              ppg: sPpg,
              rpg: sRpg,
              apg: sApg,
              spg: sSpg,
              bpg: sBpg,
              fgPct: season.fga > 0 ? ((season.fgm / season.fga) * 100).toFixed(1) + '%' : '0.0%',
              t3pPct: season.tpa > 0 ? ((season.tpm / season.tpa) * 100).toFixed(1) + '%' : '0.0%',
              ftPct: season.fta > 0 ? ((season.ftm / season.fta) * 100).toFixed(1) + '%' : '0.0%',
              mpg: (season.minutes / (season.games || 1)).toFixed(1),
            };

            const pastSeasonsList = (careerHistory || []).map((h) => ({
              seasonStr: h.seasonStr,
              games: h.games || 0,
              ppg: (h.ppg || 0).toFixed(1),
              rpg: (h.rpg || 0).toFixed(1),
              apg: (h.apg || 0).toFixed(1),
              spg: (h.spg || 0).toFixed(1),
              bpg: (h.bpg || 0).toFixed(1),
              fgPct: (h.fgPct || 45.0).toFixed(1) + '%',
              t3pPct: (h.t3pPct || 35.0).toFixed(1) + '%',
              ftPct: (h.ftPct || 75.0).toFixed(1) + '%',
              mpg: (h.mpg || 0).toFixed(1),
            }));

            const allSeasons = [...pastSeasonsList, activeSeasonAvg];

            return (
              <div className="overflow-x-auto pt-1">
                <div className="text-[11px] sm:text-xs font-black uppercase text-slate-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> 历经赛季与生涯对比
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-normal">已展示 {allSeasons.length} 赛季</span>
                </div>

                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#232834] text-[9px] sm:text-[10px] text-slate-500 uppercase font-mono bg-[#0d1017]">
                      <th className="py-2 px-2 sm:px-3">统计指标</th>
                      {allSeasons.map((s) => (
                        <th key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-amber-400/90 font-bold">
                          {s.seasonStr}
                        </th>
                      ))}
                      <th className="py-2 px-2 sm:px-3 text-center bg-amber-500/10 text-amber-300">生涯累计</th>
                      <th className="py-2 px-2 sm:px-3 text-center bg-amber-500/10 text-amber-300">生涯场均</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232834]/50 font-mono text-[11px] sm:text-xs">
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">出场数</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-slate-200">{s.games}场</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-amber-400 font-bold bg-amber-500/5">{career.games}场</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-slate-400 bg-amber-500/5">-</td>
                    </tr>
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">得分</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-amber-400 font-bold">{s.ppg}分</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-amber-400 font-bold bg-amber-500/5">{career.pts}分</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-amber-400 font-bold bg-amber-500/5">{cPpg}分</td>
                    </tr>
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">篮板</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-blue-400 font-bold">{s.rpg}个</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-blue-400 font-bold bg-amber-500/5">{career.reb}个</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-blue-400 font-bold bg-amber-500/5">{cRpg}个</td>
                    </tr>
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">助攻</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-emerald-400 font-bold">{s.apg}次</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-emerald-400 font-bold bg-amber-500/5">{career.ast}次</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-emerald-400 font-bold bg-amber-500/5">{cApg}次</td>
                    </tr>
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">抢断</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-purple-400 font-bold">{s.spg}次</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-purple-400 font-bold bg-amber-500/5">{career.stl}次</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-purple-400 font-bold bg-amber-500/5">{cSpg}次</td>
                    </tr>
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">盖帽</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-cyan-400 font-bold">{s.bpg}次</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-cyan-400 font-bold bg-amber-500/5">{career.blk}次</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-cyan-400 font-bold bg-amber-500/5">{cBpg}次</td>
                    </tr>
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">投篮命中</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-slate-200">{s.fgPct}</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-slate-300 bg-amber-500/5">{career.fgm}/{career.fga}</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-slate-300 bg-amber-500/5">{cFgPct}</td>
                    </tr>
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">三分命中</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-amber-300">{s.t3pPct}</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-amber-300 bg-amber-500/5">{career.tpm}/{career.tpa}</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-amber-300 bg-amber-500/5">{c3pPct}</td>
                    </tr>
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">罚球命中</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-emerald-300">{s.ftPct}</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-emerald-300 bg-amber-500/5">{career.ftm}/{career.fta}</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-emerald-300 bg-amber-500/5">{cFtPct}</td>
                    </tr>
                    <tr className="hover:bg-[#181d29]/50">
                      <td className="py-2 px-2 sm:px-3 font-bold text-slate-300">场均时间</td>
                      {allSeasons.map((s) => (
                        <td key={s.seasonStr} className="py-2 px-2 sm:px-3 text-center text-slate-300">{s.mpg}分</td>
                      ))}
                      <td className="py-2 px-2 sm:px-3 text-center text-slate-300 bg-amber-500/5">{career.minutes.toFixed(0)}分</td>
                      <td className="py-2 px-2 sm:px-3 text-center text-slate-300 bg-amber-500/5">{(career.minutes / cGames).toFixed(1)}分</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 2: 全联盟战绩榜 (保留全联盟总榜，左右两边为东西部) */}
      {activeSubNav === 'standings' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {renderTable(eastTeams, '东部联盟')}
            {renderTable(westTeams, '西部联盟')}
          </div>
        </div>
      )}



      {/* Team Roster Modal */}
      {selectedTeamForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-[#11141b] border border-[#232834] rounded-2xl max-w-4xl w-full p-3.5 sm:p-6 shadow-2xl relative space-y-3.5 sm:space-y-5 animate-fadeIn my-auto">
            <button
              type="button"
              onClick={() => setSelectedTeamForModal(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-xl bg-[#0d1017] text-slate-400 hover:text-white border border-[#232834] transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Team Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#232834] pb-3 sm:pb-4 pr-10 sm:pr-12">
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-base sm:text-lg text-white shadow-lg border border-white/10 p-1 bg-[#0d1017] shrink-0"
                  style={{ borderColor: selectedTeamForModal.primaryColor }}
                >
                  <TeamLogo
                    logo={selectedTeamForModal.logo}
                    abbrev={selectedTeamForModal.abbrev}
                    primaryColor={selectedTeamForModal.primaryColor}
                    secondaryColor={selectedTeamForModal.secondaryColor}
                    className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                    alt={selectedTeamForModal.name}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-lg font-black italic uppercase text-white">{selectedTeamForModal.name} 阵容</h3>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
                      {selectedTeamForModal.wins}胜 - {selectedTeamForModal.losses}负
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    球队评级 OVR {selectedTeamForModal.rating}
                  </p>
                  {gameMode === 'random_trade' && selectedTeamStrategy && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${selectedTeamStrategy === 'contender' ? 'border-amber-400/40 bg-amber-500/15 text-amber-300' : selectedTeamStrategy === 'playoff' ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : selectedTeamStrategy === 'rebuilding' ? 'border-violet-400/40 bg-violet-500/15 text-violet-300' : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'}`}>
                        球队方向：{getTeamStrategyLabel(selectedTeamStrategy)}
                      </span>
                      <span className="text-[10px] leading-relaxed text-slate-500">{getTeamStrategyDescription(selectedTeamStrategy)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Mode Toggle Button */}
              <div className="flex items-center bg-[#0d1017] p-1 rounded-xl border border-[#232834] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTeamModalViewMode('stats')}
                  className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    teamModalViewMode === 'stats'
                      ? 'bg-amber-500 text-black shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📊 预测数据
                </button>
                <button
                  type="button"
                  onClick={() => setTeamModalViewMode('ratings')}
                  className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    teamModalViewMode === 'ratings'
                      ? 'bg-amber-500 text-black shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ 五维综评
                </button>
              </div>
            </div>

            {/* Roster Table */}
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              {(() => {
                const modalRosterInfo = getCompleteTeamRoster(selectedTeamForModal, player, seasonIndex);
                return (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="sticky top-0 bg-[#0d1017] z-10">
                      <tr className="border-b border-[#232834] text-[9px] sm:text-[10px] text-slate-500 uppercase font-mono">
                        <th className="py-2 px-2 sm:px-3">球员</th>
                        <th className="py-2 px-2 sm:px-3 text-center">位置</th>
                        <th className="py-2 px-2 sm:px-3 text-center">定位</th>
                        <th className="py-2 px-2 sm:px-3 text-center text-amber-400 font-bold hidden sm:table-cell">时间</th>
                        <th className="py-2 px-2 sm:px-3 text-center">总评 OVR</th>
                        {teamModalViewMode === 'stats' ? (
                          <>
                            <th className="py-2 px-2 sm:px-3 text-center">得分</th>
                            <th className="py-2 px-2 sm:px-3 text-center">篮板</th>
                            <th className="py-2 px-2 sm:px-3 text-center">助攻</th>
                            <th className="py-2 px-2 sm:px-3 text-right hidden sm:table-cell">命中率</th>
                          </>
                        ) : (
                          <>
                            <th className="py-2 px-2 sm:px-3 text-center text-amber-400">得分综评</th>
                            <th className="py-2 px-2 sm:px-3 text-center text-blue-400">篮板综评</th>
                            <th className="py-2 px-2 sm:px-3 text-center text-emerald-400">助攻综评</th>
                            <th className="py-2 px-2 sm:px-3 text-center text-purple-400 hidden sm:table-cell">抢断综评</th>
                            <th className="py-2 px-2 sm:px-3 text-right text-cyan-400 hidden sm:table-cell">盖帽综评</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232834]/50 text-[11px] sm:text-xs">
                      {modalRosterInfo.roster.map((p) => {
                        const isUser = p.isUser;
                        const st = p.stats || { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, fgPct: 45.0, mpg: 15.0 };
                        const cat = isUser && player
                          ? getUserPlayerCategoryRatings(player)
                          : (p.categoryRatings || getPlayerCategoryRatings(p, seasonIndex));

                        return (
                          <tr
                            key={p.id}
                            className={`transition-colors ${
                              isUser
                                ? 'bg-amber-500/15 border-l-4 border-amber-500 font-bold text-white'
                                : 'hover:bg-[#181d29]/60 text-slate-300'
                            }`}
                          >
                            <td className="py-2.5 px-2 sm:px-3">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className={`font-bold ${isUser ? 'text-amber-300 italic font-black' : 'text-white'}`}>
                                  {isUser ? `👑 ${p.name}` : p.name}
                                </span>
                                {isUser && (
                                  <span className="text-[8px] bg-amber-500 text-black px-1 py-0.2 rounded font-black italic uppercase">
                                    玩家
                                  </span>
                                )}
                                {!isUser && p.isStar && <span className="text-[8px] text-amber-400 font-bold">⭐全明星</span>}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 sm:px-3 text-center font-mono text-slate-400">{p.position}{p.secondaryPosition ? ` / ${p.secondaryPosition}` : ''}</td>
                            <td className="py-2.5 px-2 sm:px-3 text-center font-mono font-bold text-slate-300">{p.role}</td>
                            <td className="py-2.5 px-2 sm:px-3 text-center font-mono font-black text-amber-400 text-xs hidden sm:table-cell">
                              {p.minutes} 分钟
                            </td>
                            <td className="py-2.5 px-2 sm:px-3 text-center font-mono font-bold italic text-amber-300">{p.ovr}</td>
                            
                            {teamModalViewMode === 'stats' ? (
                              <>
                                <td className="py-2.5 px-2 sm:px-3 text-center font-mono font-bold text-amber-400/90">{st.ppg}</td>
                                <td className="py-2.5 px-2 sm:px-3 text-center font-mono text-blue-300">{st.rpg}</td>
                                <td className="py-2.5 px-2 sm:px-3 text-center font-mono text-emerald-300">{st.apg}</td>
                                <td className="py-2.5 px-2 sm:px-3 text-right font-mono text-slate-300 hidden sm:table-cell">{st.fgPct}%</td>
                              </>
                            ) : (
                              <>
                                <td className="py-2.5 px-2 sm:px-3 text-center font-mono font-bold text-amber-400">{cat.scoringRating}</td>
                                <td className="py-2.5 px-2 sm:px-3 text-center font-mono font-bold text-blue-400">{cat.reboundRating}</td>
                                <td className="py-2.5 px-2 sm:px-3 text-center font-mono font-bold text-emerald-400">{cat.playmakingRating}</td>
                                <td className="py-2.5 px-2 sm:px-3 text-center font-mono font-bold text-purple-400 hidden sm:table-cell">{cat.stealRating}</td>
                                <td className="py-2.5 px-2 sm:px-3 text-right font-mono font-bold text-cyan-400 hidden sm:table-cell">{cat.blockRating}</td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
