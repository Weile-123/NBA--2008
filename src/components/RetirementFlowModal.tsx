import { brandText } from '../utils/branding';
import React, { useState, useEffect, useRef } from 'react';
import { PlayerProfile, GameState, RetiredPlayerRecord } from '../types';
import { saveHallOfFameLegend } from '../utils/storage';
import { uploadToGlobalHallOfFame } from '../lib/globalLeaderboard';
import { flushPersistentWrites } from '../lib/persistentStorage';
import { formatLocalDateTime } from '../utils/dateTime';
import {
  calculateGoatScore,
  countExclusiveTeamSelections,
  getUserGoatRank,
  getHofSpeechInfo,
  getPlayerCareerPeakOvr,} from '../utils/calc2k';
import { TeamLogo } from './TeamLogo';
import { RetirementPosterShare } from './RetirementPosterShare';
import { NBA_TEAMS_2008 } from '../data/nbaData2008';
import {
  Trophy,
  Award,
  Crown,
  Star,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  X,
  Play,
  FastForward,
  Sparkles,
  Medal,
  CheckCircle2,
  Calendar,
  Flame,
  Shirt,
  User,
  Mic,
  Quote,} from 'lucide-react';
import { gameConfetti as confetti } from '../utils/gameConfetti';
import { DEFAULT_GAME_MODE, GameMode } from '../gameMode';

interface RetirementFlowModalProps {
  gameMode?: GameMode;
  player: PlayerProfile;
  careerHistory?: GameState['careerHistory'];
  leagueHistory?: GameState['leagueHistory'];
  currentYear: number;
  onClose: () => void;
  onResetGame: () => void;
  initialStep?: 'confirm' | 'timeline' | 'honors' | 'jersey_retirement' | 'hof_speech';
}

interface TimelineSeason {
  year: number;
  seasonStr: string;
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  ppg: number;
  rpg: number;
  apg: number;
  accolades: string[];
}

interface JerseyRetirementInfo {
  teamId: string;
  teamName: string;
  primaryColor?: string;
  secondaryColor?: string;
  seasonsCount: number;
  hasChampAndFmvp: boolean;
  reasons: string[];
}

// Helper to build timeline entries for all years from draftYear to currentYear
function buildFullCareerTimeline(
  player: PlayerProfile,
  careerHistory: GameState['careerHistory'] = [],
  leagueHistory: GameState['leagueHistory'] = [],
  currentYear: number
): TimelineSeason[] {
  const startYear = player.draftYear || 2008;
  const endYear = currentYear;
  const fullTimeline: TimelineSeason[] = [];

  for (let yr = startYear; yr <= endYear; yr++) {
    const seasonStr = `${yr}-${(yr + 1).toString().slice(-2)} 赛季`;
    const hist = careerHistory.find((h) => h.year === yr);
    const league = leagueHistory.find((l) => l.year === yr);

    let teamId = hist?.teamId || player.currentTeamId || 'LAL';
    let teamObj = NBA_TEAMS_2008.find((t) => t.id === teamId);
    let teamName = hist?.teamName || teamObj?.name || '洛杉矶湖人';
    let wins = hist?.wins ?? 48;
    let losses = hist?.losses ?? 34;

    let rawPpg = hist?.ppg ?? (player.careerStats.games > 0 ? player.careerStats.pts / player.careerStats.games : 22.5);
    let rawRpg = hist?.rpg ?? (player.careerStats.games > 0 ? player.careerStats.reb / player.careerStats.games : 5.5);
    let rawApg = hist?.apg ?? (player.careerStats.games > 0 ? player.careerStats.ast / player.careerStats.games : 5.2);

    let ppg = Number(Number(rawPpg).toFixed(1));
    let rpg = Number(Number(rawRpg).toFixed(1));
    let apg = Number(Number(rawApg).toFixed(1));

    let rawAccolades: string[] = hist?.accoladesEarned ? [...hist.accoladesEarned] : [];

    // Include accolades from player.accolades for this year
    const playerAccsForYr = (player.accolades || [])
      .filter((a) => a.year === yr)
      .map((a) => a.title);
    playerAccsForYr.forEach((t) => {
      if (!rawAccolades.includes(t)) {
        rawAccolades.push(t);
      }
    });

    if (league) {
      if (
        league.mvp === player.name &&
        !rawAccolades.some((a) => a.includes('常规赛') || (a.includes('MVP') && !a.includes('FMVP')))
      ) {
        rawAccolades.push('常规赛 MVP');
      }
      if (league.fmvp === player.name && !rawAccolades.some((a) => a.includes('FMVP'))) {
        rawAccolades.push('总决赛 FMVP');
      }
      if (league.dpoy === player.name && !rawAccolades.some((a) => a.includes('DPOY'))) {
        rawAccolades.push('最佳防守球员');
      }
      if (league.roy === player.name && !rawAccolades.some((a) => a.includes('ROY'))) {
        rawAccolades.push('最佳新秀');
      }
      if (league.championId === teamId && !rawAccolades.some((a) => a.includes('冠军'))) {
        rawAccolades.push('联盟总冠军');
      }
    }

    // Determine strictly whether user won FMVP in year yr
    const userWonFmvpInYr =
      (player.accolades || []).some((a) => a.year === yr && (a.type === 'FMVP' || a.title.includes('FMVP'))) ||
      (league ? league.fmvp === player.name : false);

    // Normalize and deduplicate accolades
    const cleanAccolades: string[] = [];

    rawAccolades.forEach((title) => {
      let norm = title;

      // Championship title normalization
      if (title.includes('冠军') || title.includes('Champion')) {
        norm = '联盟总冠军';
      }
      // FMVP title normalization
      else if (title.includes('FMVP') || title.includes('总决赛MVP') || title.includes('总决赛 MVP')) {
        if (!userWonFmvpInYr) {
          return; // Skip unearned FMVP
        }
        norm = '总决赛 FMVP';
      }

      if (!cleanAccolades.includes(norm)) {
        cleanAccolades.push(norm);
      }
    });

    // Ensure FMVP is present if user won FMVP
    if (userWonFmvpInYr && !cleanAccolades.includes('总决赛 FMVP')) {
      cleanAccolades.push('总决赛 FMVP');
    }

    fullTimeline.push({
      year: yr,
      seasonStr,
      teamId,
      teamName,
      wins,
      losses,
      ppg,
      rpg,
      apg,
      accolades: cleanAccolades.length > 0 ? cleanAccolades : ['平稳表现赛季'],
    });
  }

  return fullTimeline;
}

// Helper to calculate which teams qualify for jersey retirement
function calculateJerseyRetirements(
  player: PlayerProfile,
  timeline: TimelineSeason[],
  leagueHistory: GameState['leagueHistory'] = []
): JerseyRetirementInfo[] {
  const teamMap: Record<
    string,
    { teamName: string; seasons: number[]; champFmvpYears: number[] }
  > = {};

  timeline.forEach((entry) => {
    if (!teamMap[entry.teamId]) {
      teamMap[entry.teamId] = { teamName: entry.teamName, seasons: [], champFmvpYears: [] };
    }
    teamMap[entry.teamId].seasons.push(entry.year);

    const accolades = entry.accolades || [];
    const isChamp = accolades.some((a) => a.includes('冠军') || a.includes('Champion'));
    const isFmvp = accolades.some((a) => a.includes('FMVP') || a.includes('总决赛'));

    const league = leagueHistory.find((l) => l.year === entry.year);
    const isLeagueChamp = league?.championId === entry.teamId;
    const isLeagueFmvp = league?.fmvp === player.name;

    if ((isChamp || isLeagueChamp) && (isFmvp || isLeagueFmvp)) {
      teamMap[entry.teamId].champFmvpYears.push(entry.year);
    }
  });

  const results: JerseyRetirementInfo[] = [];

  Object.entries(teamMap).forEach(([teamId, data]) => {
    const seasonsCount = data.seasons.length;
    const hasChampAndFmvp = data.champFmvpYears.length > 0;
    const teamObj = NBA_TEAMS_2008.find((t) => t.id === teamId);

    // Condition 1: Won Champ & FMVP with team
    // Condition 2: Played 5+ years for team
    if (seasonsCount >= 5 || hasChampAndFmvp) {
      const reasons: string[] = [];
      if (seasonsCount >= 5) {
        reasons.push(`效力满 ${seasonsCount} 个赛季`);
      }
      if (hasChampAndFmvp) {
        reasons.push(
          `在 ${data.champFmvpYears.join('、')} 赛季率领球队夺得 联盟 总冠军并荣膺 FMVP`
        );
      }
      results.push({
        teamId,
        teamName: data.teamName,
        primaryColor: teamObj?.primaryColor || '#1e293b',
        secondaryColor: teamObj?.secondaryColor || '#fbbf24',
        seasonsCount,
        hasChampAndFmvp,
        reasons,
      });
    }
  });

  return results;
}

export const RetirementFlowModal: React.FC<RetirementFlowModalProps> = ({
  gameMode = DEFAULT_GAME_MODE,
  player,
  careerHistory = [],
  leagueHistory = [],
  currentYear,
  onClose,
  onResetGame,
  initialStep = 'confirm',
}) => {
  const [step, setStep] = useState<'confirm' | 'timeline' | 'honors' | 'jersey_retirement' | 'hof_speech'>(initialStep);


  // Timeline animation control
  const timelineData = useRef<TimelineSeason[]>(
    buildFullCareerTimeline(player, careerHistory, leagueHistory, currentYear)
  ).current;

  const [visibleIndex, setVisibleIndex] = useState<number>(0);
  const [isAnimationFinished, setIsAnimationFinished] = useState<boolean>(false);
  const [posterRecord, setPosterRecord] = useState<RetiredPlayerRecord | null>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const retirementMomentRef = useRef(new Date());
  const retirementRecordIdRef = useRef(`legend_${retirementMomentRef.current.getTime()}_${Math.random().toString(36).slice(2, 8)}`);

  // Helper to save retired player record to Hall of Fame storage
  const saveLegendToHof = async () => {
    try {
      const timeline = buildFullCareerTimeline(player, careerHistory, leagueHistory, currentYear);
      const jerseyRetirements = calculateJerseyRetirements(player, timeline, leagueHistory);
      const goatResult = calculateGoatScore(player);
      const goatScore = goatResult.score;
      const peakOvr = getPlayerCareerPeakOvr(player, careerHistory.map((season) => season.ovr || 0));

      let championships = 0;
      let mvps = 0;
      let fmvps = 0;
      let dpoys = 0;
      let roys = 0;
      let scoringTitles = 0;
      let allStarApps = 0;
      let allNbaFirsts = 0;
      let allNbaSeconds = 0;
      let allNbaThirds = 0;
      const allNbaBySeason = new Map<number, 1 | 2 | 3>();

      (player.accolades || []).forEach((acc) => {
        const title = acc.title || '';
        if (acc.type === 'CHAMPION' || title.includes('冠军')) championships++;
        if (acc.type === 'MVP' || (title.includes('MVP') && !title.includes('FMVP'))) mvps++;
        if (acc.type === 'FMVP' || title.includes('FMVP')) fmvps++;
        if (acc.type === 'DPOY' || title.includes('最佳防守球员') || (title.includes('DPOY') && !title.includes('阵') && !title.includes('阵容'))) dpoys++;
        if (acc.type === 'ROY' || title.includes('ROY') || title.includes('最佳新秀')) roys++;
        if (acc.type === 'SCORING_TITLE' || title.includes('得分王')) scoringTitles++;
        if (acc.type === 'ALL_STAR' || title.includes('全明星')) allStarApps++;
        let tier: 1 | 2 | 3 | null = null;
        if (title.includes('最佳阵容一阵') || acc.type === 'ALL_NBA_1ST') tier = 1;
        else if (title.includes('最佳阵容二阵') || acc.type === 'ALL_NBA_2ND' || acc.type === 'ALL_NBA') tier = 2;
        else if (title.includes('最佳阵容三阵') || acc.type === 'ALL_NBA_3RD') tier = 3;
        if (tier !== null) {
          const currentTier = allNbaBySeason.get(acc.year);
          if (currentTier === undefined || tier < currentTier) allNbaBySeason.set(acc.year, tier);
        }
      });
      allNbaFirsts = [...allNbaBySeason.values()].filter((tier) => tier === 1).length;
      allNbaSeconds = [...allNbaBySeason.values()].filter((tier) => tier === 2).length;
      allNbaThirds = [...allNbaBySeason.values()].filter((tier) => tier === 3).length;

      const legendRecord: RetiredPlayerRecord = {
        id: retirementRecordIdRef.current,
        retireDate: formatLocalDateTime(retirementMomentRef.current),
        player: {
          name: player.name,
          position: player.position,
          archetype: player.archetype,
          height: player.height,
          weight: player.weight,
          draftYear: player.draftYear || 2008,
          draftPick: player.draftPick || 1,
          birthplace: player.birthplace,
          jerseyNum: player.jerseyNum || 24,
        },
        retireAge: player.age || (currentYear - (player.draftYear || 2008) + 19),
        peakOvr,
        peakOvrTracked: true,
        finalOvr: player.ovr,
        goatScore,
        seasonsPlayed: timeline.length,
        startYear: player.draftYear || 2008,
        endYear: currentYear,
        totalGames: player.careerStats.games,
        totalPoints: player.careerStats.pts,
        totalRebounds: player.careerStats.reb,
        totalAssists: player.careerStats.ast,
        avgPpg: player.careerStats.games > 0 ? Number((player.careerStats.pts / player.careerStats.games).toFixed(1)) : 0,
        avgRpg: player.careerStats.games > 0 ? Number((player.careerStats.reb / player.careerStats.games).toFixed(1)) : 0,
        avgApg: player.careerStats.games > 0 ? Number((player.careerStats.ast / player.careerStats.games).toFixed(1)) : 0,
        careerAccolades: {
          championships,
          mvps,
          fmvps,
          dpoys,
          roys,
          scoringTitles,
          allStarApps,
          allNbaFirsts,
          allNbaSeconds,
          allNbaThirds,
          hallOfFame: true,
        },
        retiredJerseys: jerseyRetirements.map((j) => ({
          teamId: j.teamId,
          teamName: j.teamName,
          primaryColor: j.primaryColor,
          secondaryColor: j.secondaryColor,
          seasonsCount: j.seasonsCount,
          jerseyNum: player.jerseyNum || 24,
          reasons: j.reasons,
        })),
        timeline,
      };

      saveHallOfFameLegend(legendRecord, gameMode);
      await flushPersistentWrites();
      if (gameMode === 'classic') try {
        // Do not leave the retirement flow while the global submission is
        // still in flight. A failure is persisted as pending by the upload
        // helper and will be retried from the global leaderboard.
        await uploadToGlobalHallOfFame(legendRecord);
      } catch (error) {
        console.warn('全网传奇榜上传失败，本地记录已保留', error);
      }
      setPosterRecord(legendRecord);
    } catch (err) {
      console.error('Failed to save legend record:', err);
    }
  };
  const openPosterOrReturnHome = async () => {
    await saveLegendToHof();
    if (!window.ColorboxAI?.oss?.uploadFile || !window.ColorboxAI?.request?.bbs?.openPostEditor) onResetGame();
  };
  useEffect(() => {
    if (step === 'timeline' && !isAnimationFinished) {
      const revealTimer = setTimeout(() => {
        if (visibleIndex < timelineData.length - 1) {
          setVisibleIndex((prev) => prev + 1);
          return;
        }

        setIsAnimationFinished(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }, 700);

      return () => clearTimeout(revealTimer);
    }
  }, [step, isAnimationFinished, timelineData.length, visibleIndex]);

  // Trigger grand celebration confetti when opening HOF speech stage
  useEffect(() => {
    if (step === 'hof_speech') {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
    }
  }, [step]);

  // Scroll to bottom as timeline advances
  useEffect(() => {
    if (step === 'timeline') {
      timelineEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [visibleIndex, step]);

  const handleSkipAnimation = () => {
    setVisibleIndex(timelineData.length - 1);
    setIsAnimationFinished(true);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  // Calculate Honors & Totals
  const totalGames = Math.max(1, player.careerStats?.games || 1);
  const careerPpg = ((player.careerStats?.pts || 0) / totalGames).toFixed(1);
  const careerRpg = ((player.careerStats?.reb || 0) / totalGames).toFixed(1);
  const careerApg = ((player.careerStats?.ast || 0) / totalGames).toFixed(1);
  const careerSpg = ((player.careerStats?.stl || 0) / totalGames).toFixed(1);
  const careerBpg = ((player.careerStats?.blk || 0) / totalGames).toFixed(1);

  const accoladesList = player.accolades || [];

  const uniqueChampYears = new Set(
    accoladesList.filter((a) => a.type === 'CHAMPION' || a.title.includes('冠军')).map((a) => a.year)
  );
  const uniqueFmvpYears = new Set(
    accoladesList.filter((a) => a.type === 'FMVP' || a.title.includes('FMVP')).map((a) => a.year)
  );
  const champCount = uniqueChampYears.size;
  const fmvpCount = uniqueFmvpYears.size;
  const mvpCount = accoladesList.filter((a) => a.type === 'MVP' || (a.title.includes('MVP') && !a.title.includes('FMVP'))).length;
  const dpoyCount = accoladesList.filter((a) => a.type === 'DPOY' || a.title.includes('最佳防守球员') || (a.title.includes('DPOY') && !a.title.includes('阵') && !a.title.includes('阵容'))).length;
  const royCount = accoladesList.filter((a) => a.type === 'ROY' || a.title.includes('ROY')).length;
  const allStarCount = accoladesList.filter((a) => a.type === 'ALL_STAR' || a.title.includes('全明星')).length;
  const exclusiveTeamSelections = countExclusiveTeamSelections(accoladesList);

  // Granular All-NBA and All-Defensive counts
  const allNba1stCount = exclusiveTeamSelections.allNbaFirsts;
  const finalAllNba2nd3rdCount = exclusiveTeamSelections.allNbaSeconds + exclusiveTeamSelections.allNbaThirds;

  const allDef1stCount = accoladesList.filter(
    (a) =>
      a.type === 'ALL_DEFENSE_1ST' ||
      a.title.includes('最佳防守一阵') ||
      a.title.includes('防守一阵') ||
      (a.title.includes('最佳防守') && (a.title.includes('一阵') || a.title.includes('1队') || a.title.includes('一队')))
  ).length;

  const allDef2ndCount = accoladesList.filter(
    (a) =>
      a.type === 'ALL_DEFENSE_2ND' ||
      a.title.includes('最佳防守二阵') ||
      a.title.includes('防守二阵') ||
      (a.title.includes('最佳防守') && (a.title.includes('二阵') || a.title.includes('2队') || a.title.includes('二队')))
  ).length;

  // GOAT Rank & Speech Info
  const { rank: goatRank, isTop50, goatScore } = getUserGoatRank(player);
  const hofSpeech = getHofSpeechInfo(goatRank, player.name);

  // Peak OVR calculation
  const peakOvrDisplay = getPlayerCareerPeakOvr(player, careerHistory.map((season) => season.ovr || 0));

  // Jersey retirement list
  const jerseyRetirements = useRef<JerseyRetirementInfo[]>(
    calculateJerseyRetirements(player, timelineData, leagueHistory)
  ).current;

  // Unique teams served for summary
  const uniqueTeamsServed = useRef(
    Array.from(
      new Map(
        timelineData.map((item) => [
          item.teamId,
          { id: item.teamId, name: item.teamName },
        ])
      ).values()
    )
  ).current;
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-2 sm:p-6 animate-fade-in overflow-y-auto">
      {/* Step 1: Confirmation Modal */}
      {step === 'confirm' && (
        <div className="bg-[#0f131d] border border-amber-500/50 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-8 shadow-2xl text-center space-y-4 sm:space-y-6 relative overflow-hidden ring-1 ring-amber-500/20 my-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 text-2xl sm:text-3xl shadow-inner">
            🐐
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-wider">
              确定要宣布退役吗？
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              宣布退役后，你将正式结束辉煌的职业生涯。系统将为你自动生成全景生涯轨迹动画、结算荣誉与统计大满贯，并举行球队球衣退役仪式！
            </p>
          </div>

          <div className="bg-[#161c28] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-1.5 sm:space-y-2 text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-1.5 sm:pb-2">
              <span className="text-slate-400">球员名称:</span>
              <span className="font-bold text-white">{player.name} (#{player.jerseyNum})</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 sm:pb-2">
              <span className="text-slate-400">效力球队:</span>
              <div className="flex flex-wrap items-center justify-end gap-1">
                {uniqueTeamsServed.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 bg-slate-900 px-1.5 sm:px-2 py-0.5 rounded-lg border border-slate-800 text-white font-bold text-[10px] sm:text-[11px]"
                  >
                    <TeamLogo teamId={t.id} size="xs" />
                    <span>{t.name}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5 sm:pb-2">
              <span className="text-slate-400">效力时间:</span>
              <span className="font-bold text-amber-400">
                {player.draftYear || 2008} - {currentYear} 赛季 (共 {timelineData.length} 年)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">生涯总得分:</span>
              <span className="font-bold text-emerald-400">{player.careerStats.pts} 分 (场均 {careerPpg} 分)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1 sm:pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-all text-xs uppercase cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回继续游戏</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('timeline');
              }}
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>确认退役并开启总结</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Animated Career Trajectory Timeline */}
      {step === 'timeline' && (
        <div className="bg-[#0b0e14] border border-amber-500/40 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-3.5 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] relative ring-1 ring-amber-500/20 my-auto">
          {/* Timeline Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-base sm:text-xl shrink-0">
                ⏳
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-black text-white italic uppercase tracking-wider flex items-center gap-2">
                  <span>{player.name} 生涯轨迹</span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                  {player.draftYear || 2008} - {currentYear} 赛季 · {timelineData.length} 载岁月时光
                </p>
              </div>
            </div>

            {!isAnimationFinished && (
              <button
                type="button"
                onClick={handleSkipAnimation}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] sm:text-xs font-bold rounded-lg border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer shadow-sm shrink-0"
              >
                <FastForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>跳过</span>
              </button>
            )}
          </div>

          {/* Timeline Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-3 sm:py-5 pr-1 sm:pr-2 space-y-3 sm:space-y-4 my-1 sm:my-2 scrollbar-thin scrollbar-thumb-slate-800">
            {timelineData.slice(0, visibleIndex + 1).map((season, idx) => {
              const isLatest = idx === visibleIndex;
              const isChampSeason =
                season.accolades.some(
                  (a) => a.includes('总冠军') || a.includes('冠军') || a.includes('Champion')
                ) ||
                (leagueHistory &&
                  leagueHistory.some(
                    (l) => l.year === season.year && l.championId === season.teamId
                  ));

              return (
                <div
                  key={season.year}
                  className={`flex gap-2 sm:gap-4 items-start transition-all duration-500 transform ${
                    isLatest ? 'scale-[1.01] animate-fade-in' : 'opacity-90'
                  }`}
                >
                  {/* Left Column: Year & Node Indicator */}
                  <div className="flex flex-col items-center w-12 sm:w-20 pt-1 shrink-0">
                    <span
                      className={`text-[10px] sm:text-xs font-mono font-black px-1.5 sm:px-2 py-0.5 rounded text-center transition-all ${
                        isChampSeason
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/40 border border-amber-300 font-black scale-105'
                          : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                      }`}
                    >
                      {season.year}
                    </span>
                    <div
                      className={`w-0.5 h-full my-1 flex-1 min-h-[20px] sm:min-h-[30px] ${
                        isChampSeason ? 'bg-amber-500/60' : 'bg-slate-800'
                      }`}
                    />
                  </div>

                  {/* Right Column: Season Event Card */}
                  <div
                    className={`flex-1 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-md transition-all ${
                      isChampSeason
                        ? 'bg-gradient-to-r from-[#231b0b] via-[#151b28] to-[#231b0b] border border-amber-400 sm:border-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/40'
                        : 'bg-[#131824] border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <TeamLogo teamId={season.teamId} size="sm" className="w-5 h-5 sm:w-7 sm:h-7 object-contain shrink-0" />
                        <div>
                          <span className="text-[11px] sm:text-xs font-bold text-white flex items-center gap-1">
                            <span>{season.teamName}</span>
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                            {season.seasonStr} · {season.wins}胜{season.losses}负
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isChampSeason && (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center gap-0.5 sm:gap-1 shadow-md shrink-0 animate-pulse">
                            🏆 夺冠
                          </span>
                        )}
                        <div className="text-right font-mono">
                          <span className="text-[11px] sm:text-xs font-black text-emerald-400">{season.ppg.toFixed(1)}分</span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 block">
                            {season.rpg.toFixed(1)}板 {season.apg.toFixed(1)}助
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Accolades Badges */}
                    <div className="pt-1.5 sm:pt-2 flex flex-wrap gap-1 sm:gap-1.5 items-center">
                      {season.accolades.map((acc, aIdx) => {
                        const isChamp = acc.includes('总冠军') || acc.includes('冠军');
                        const isMvp = acc.includes('MVP') && !acc.includes('FMVP');
                        const isFmvp = acc.includes('FMVP');
                        const isRoy = acc.includes('ROY') || acc.includes('新秀');
                        const isDpoy = acc.includes('DPOY') || acc.includes('防守');

                        let badgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
                        if (isChamp) badgeBg = 'bg-amber-500/30 text-amber-300 border-amber-400 font-black shadow-sm';
                        else if (isFmvp || isMvp) badgeBg = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 font-bold';
                        else if (isDpoy) badgeBg = 'bg-blue-500/20 text-blue-300 border-blue-500/50';
                        else if (isRoy) badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/50';

                        return (
                          <span
                            key={aIdx}
                            className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full border ${badgeBg} flex items-center gap-0.5 shadow-sm`}
                          >
                            {isChamp && '🏆'}
                            {isFmvp && '👑'}
                            {isMvp && '🌟'}
                            {isDpoy && '🛡️'}
                            {isRoy && '👶'}
                            <span>{acc}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={timelineEndRef} />
          </div>

          {/* Timeline Bottom Action Bar */}
          <div className="pt-2.5 sm:pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[10px] sm:text-xs font-mono text-slate-400 flex items-center gap-1.5">
              {isAnimationFinished ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 轨迹展现完毕
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {timelineData[visibleIndex]?.seasonStr}...
                </span>
              )}
            </div>

            {isAnimationFinished && (
              <button
                type="button"
                onClick={() => setStep('honors')}
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 animate-bounce"
              >
                <span>继续查看荣誉</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Career Honors & Lifetime Totals Modal */}
      {step === 'honors' && (
        <div className="bg-[#0f131d] border border-amber-500/50 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3.5 sm:p-8 shadow-2xl relative ring-1 ring-amber-500/20 max-h-[90svh] overflow-hidden my-auto flex min-h-0 flex-col gap-3 sm:gap-5">
          <div className="shrink-0 text-center space-y-1 border-b border-slate-800 pb-3 sm:pb-4">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-[10px] sm:text-xs font-mono font-bold">
              👑 CAREER MILESTONES & STATS
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-wider">
              {player.name} · 传奇生涯荣誉大满贯
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
              #{player.jerseyNum} · {player.position} · 巅峰 Rating {peakOvrDisplay}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
            {/* Section 1: Career Honors Grid */}
            <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>生涯主要荣誉成就</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
              <div className="bg-[#151b28] border border-amber-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🏆</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-amber-400">{champCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">联盟 总冠军</div>
                </div>
              </div>

              <div className="bg-[#151b28] border border-yellow-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">👑</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-yellow-400">{fmvpCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">总决赛 FMVP</div>
                </div>
              </div>

              <div className="bg-[#151b28] border border-amber-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🌟</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-amber-300">{mvpCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">常规赛 MVP</div>
                </div>
              </div>

              <div className="bg-[#151b28] border border-blue-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🛡️</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-blue-400">{dpoyCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">最佳防守 DPOY</div>
                </div>
              </div>

              <div className="bg-[#151b28] border border-purple-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">👶</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-purple-400">{royCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">最佳新秀 ROY</div>
                </div>
              </div>

              <div className="bg-[#151b28] border border-emerald-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">⭐</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-emerald-400">{allStarCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">全明星阵容</div>
                </div>
              </div>

              <div className="bg-[#151b28] border border-cyan-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🥇</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-cyan-400">{allNba1stCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">最佳阵容一阵</div>
                </div>
              </div>

              <div className="bg-[#151b28] border border-teal-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🥈</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-teal-400">{finalAllNba2nd3rdCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">最佳阵容二/三阵</div>
                </div>
              </div>

              <div className="bg-[#151b28] border border-indigo-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🛡️🥇</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-indigo-400">{allDef1stCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">防守一阵</div>
                </div>
              </div>

              <div className="bg-[#151b28] border border-sky-500/30 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🛡️🥈</span>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-sky-400">{allDef2ndCount} 次</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400">防守二阵</div>
                </div>
              </div>
            </div>
            </div>

            {/* Section 2: Lifetime Totals & Averages */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>生涯总数据与场均均值</span>
            </h3>

            <div className="bg-[#131824] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-y-3 sm:gap-y-4 gap-x-2 text-xs font-mono">
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block">出战场次</span>
                <span className="text-sm sm:text-base font-black text-white">{player.careerStats.games} 场</span>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block">生涯总得分</span>
                <span className="text-sm sm:text-base font-black text-amber-400">{player.careerStats.pts} 分</span>
                <span className="text-[9px] sm:text-[10px] text-emerald-400 block">场均 {careerPpg} 分</span>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block">生涯总篮板</span>
                <span className="text-sm sm:text-base font-black text-blue-400">{player.careerStats.reb} 个</span>
                <span className="text-[9px] sm:text-[10px] text-blue-300 block">场均 {careerRpg} 板</span>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block">生涯总助攻</span>
                <span className="text-sm sm:text-base font-black text-purple-400">{player.careerStats.ast} 次</span>
                <span className="text-[9px] sm:text-[10px] text-purple-300 block">场均 {careerApg} 助</span>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block">生涯总抢断</span>
                <span className="text-sm sm:text-base font-black text-emerald-400">{player.careerStats.stl} 次</span>
                <span className="text-[9px] sm:text-[10px] text-emerald-300 block">场均 {careerSpg} 断</span>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block">生涯总盖帽</span>
                <span className="text-sm sm:text-base font-black text-rose-400">{player.careerStats.blk} 次</span>
                <span className="text-[9px] sm:text-[10px] text-rose-300 block">场均 {careerBpg} 帽</span>
              </div>
            </div>
            </div>
          </div>

          <div className="shrink-0 pt-2 sm:pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setStep('jersey_retirement')}
              className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>进入球队球衣退役仪式</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Jersey Retirement Ceremony */}
      {step === 'jersey_retirement' && (
        <div className="bg-[#0f131d] border border-amber-500/50 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3.5 sm:p-8 shadow-2xl space-y-4 sm:space-y-6 relative ring-1 ring-amber-500/20 max-h-[90vh] overflow-y-auto my-auto">
          <div className="text-center space-y-1.5 border-b border-slate-800 pb-3 sm:pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-[10px] sm:text-xs font-mono font-bold">
              👕 JERSEY RETIREMENT CEREMONY
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-wider">
              {player.name} 球队球衣退役仪式
            </h2>
          </div>

          {/* Hall of Fame Banner Banner */}
          {isTop50 && (
            <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/60 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center space-y-1.5 sm:space-y-2 shadow-xl ring-1 ring-amber-400/30">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-amber-500/30 rounded-full text-amber-300 text-[10px] sm:text-xs font-bold font-mono">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>成功入选奈史密斯篮球名人堂 （前50位巨星）</span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-200/90 font-mono">
                你在历史 50 大巨星榜单中荣登 <strong className="text-white text-xs sm:text-sm">第 #{goatRank} 位</strong>！请前往奈史密斯篮球名人堂发表你的终身入选演说。
              </p>
            </div>
          )}

          {jerseyRetirements.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-[11px] sm:text-xs font-mono text-emerald-400 text-center font-bold bg-emerald-500/10 p-2 sm:p-2.5 rounded-xl border border-emerald-500/30">
                🎉 共有 {jerseyRetirements.length} 支 联盟 球队决定退役 {player.name} 的 #{player.jerseyNum} 号球衣！
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {jerseyRetirements.map((item) => (
                  <div
                    key={item.teamId}
                    className="bg-[#151b28] border border-amber-500/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between space-y-2 sm:space-y-3 relative overflow-hidden shadow-lg group hover:border-amber-400 transition-all"
                  >
                    {/* Background Jersey Banner Accent */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <TeamLogo teamId={item.teamId} size="md" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1">
                          <span>{item.teamName}</span>
                        </h4>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          球衣退役号: #{player.jerseyNum}
                        </span>
                      </div>
                    </div>

                    {/* Hanging Jersey Graphic */}
                    <div className="bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shirt className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                        <div>
                          <span className="text-xs font-black font-mono text-white block">
                            #{player.jerseyNum} {player.name}
                          </span>
                          <span className="text-[9px] text-slate-400 block">永久挂于主场球馆上空</span>
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl">🏆</span>
                    </div>

                    {/* Reasons List */}
                    <div className="space-y-1">
                      {item.reasons.map((r, rIdx) => (
                        <div
                          key={rIdx}
                          className="text-[9px] sm:text-[10px] text-slate-300 font-mono flex items-center gap-1 bg-slate-900/60 p-1.5 rounded border border-slate-800"
                        >
                          <span className="text-amber-400 font-bold">✓</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#151b28] border border-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center space-y-2 sm:space-y-3">
              <div className="text-2xl sm:text-3xl">🏀</div>
              <h4 className="text-xs sm:text-sm font-bold text-white">未能满足单一球队球衣退役条件</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 max-w-sm mx-auto font-mono">
                要在单支球队退役球衣，需在该队效力满 5 个赛季 或 带领该队夺冠并荣膺 FMVP。你在 联盟 的伟大表现依然会被历史铭记！
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 sm:pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            {isTop50 ? (
              <button
                type="button"
                onClick={() => setStep('hof_speech')}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-xl text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ring-2 ring-amber-300/50"
              >
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                <span>进入奈史密斯篮球名人堂 · 发表演说</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              </button>
            ) : (
              <button
                type="button"
                onClick={openPosterOrReturnHome}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-xl text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ring-2 ring-amber-300/50"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
                <span>生成退役海报并发帖</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 5: Hall of Fame Speech Ceremony */}
      {step === 'hof_speech' && (
        <div className="bg-[#0c0f18] border-2 border-amber-400/80 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3.5 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-4 sm:space-y-6 relative ring-2 ring-amber-400/40 max-h-[92vh] overflow-y-auto animate-fade-in my-auto">
          {/* Top Golden Crest & Header */}
          <div className="text-center space-y-1.5 sm:space-y-2 border-b border-amber-500/30 pb-3 sm:pb-5">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-yellow-600 p-0.5 sm:p-1 mx-auto shadow-2xl flex items-center justify-center ring-4 ring-amber-400/30">
              <div className="w-full h-full rounded-full bg-[#111625] flex items-center justify-center text-2xl sm:text-4xl">
                🏛️
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1 bg-amber-500/10 border border-amber-400/40 rounded-full text-amber-300 text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>NAISMITH MEMORIAL BASKETBALL HALL OF FAME</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 italic uppercase tracking-wider">
              奈史密斯篮球名人堂 · 终身致词
            </h2>

            {/* Badges bar */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
              <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold ${hofSpeech.badgeBg}`}>
                🏆 历史排名 第 #{goatRank} 位
              </span>
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/50">
                {hofSpeech.tierTitle}
              </span>
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
                GOAT 积分: {goatScore} 分
              </span>
            </div>
          </div>

          {/* Golden Speech Podium Card */}
          <div className="bg-gradient-to-b from-[#161c2e] to-[#0f1422] border border-amber-500/40 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 relative overflow-hidden">
            {/* Spotlight Beam Visual Effect */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 bg-amber-400/10 blur-2xl rounded-full pointer-events-none" />

            {/* Stage Title */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 sm:pb-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px] sm:text-xs font-mono">
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
                <span>{player.name} 的名人堂感言</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-amber-400/80 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                {hofSpeech.rankRangeStr}
              </span>
            </div>

            {/* Speech Text Box */}
            <div className="relative bg-[#0a0d16]/90 p-3.5 sm:p-5 rounded-xl border border-amber-500/30 shadow-inner space-y-3">
              <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500/30 absolute top-2.5 left-2.5 -scale-x-100 pointer-events-none" />
              <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500/30 absolute bottom-2.5 right-2.5 pointer-events-none" />

              <p className="text-xs sm:text-base text-amber-100/90 leading-normal sm:leading-relaxed font-serif tracking-wide text-justify indent-4 relative z-10 py-1">
                {hofSpeech.speechText}
              </p>
            </div>

            {/* Accolades Summary Tags */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
              {champCount > 0 && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] sm:text-[11px] font-mono text-amber-300 font-bold">
                  🏆 {champCount} 次总冠军
                </span>
              )}
              {fmvpCount > 0 && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-[10px] sm:text-[11px] font-mono text-yellow-300 font-bold">
                  👑 {fmvpCount} 次FMVP
                </span>
              )}
              {mvpCount > 0 && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] sm:text-[11px] font-mono text-amber-200 font-bold">
                  🌟 {mvpCount} 次MVP
                </span>
              )}
              {allNba1stCount > 0 && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-[10px] sm:text-[11px] font-mono text-cyan-300 font-bold">
                  🥇 {allNba1stCount} 次最佳一阵
                </span>
              )}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={openPosterOrReturnHome}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-xl text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ring-2 ring-amber-300/50"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              <span>生成退役海报并发帖</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            </button>
          </div>
        </div>
      )}
      {posterRecord && <RetirementPosterShare record={posterRecord} onFinish={onResetGame} />}
    </div>
  );
};
