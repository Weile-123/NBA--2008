import { useEffect,useRef,useState } from 'react';
import { MatchBoxScore,MatchLog,PlayerProfile,Team } from '../types';
import { getUserMinutesAndRole } from '../utils/leagueLogic';

import { ScheduledQuarterEvent,TacticalOption,buildQuarterEvents,calculateInteractiveGrade,isPlayerOnCourt } from '../utils/matchEvents';
import { generateTacticalOptions } from '../utils/matchTactics';
export interface MatchSimulatorProps {
  player: PlayerProfile;
  userTeam: Team;
  oppTeam: Team;
  isInteractive: boolean;
  isPlayoffs: boolean;
  currentYear?: number;
  onFinishMatch: (boxScore: MatchBoxScore) => void;
}

export function useMatchSimulation({
  player,
  userTeam,
  oppTeam,
  isInteractive,
  isPlayoffs,
  currentYear = 2008,
  onFinishMatch,
}: MatchSimulatorProps) {
  // Live Simulation state
  const [hasStarted, setHasStarted] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2); // 1x, 2x, 4x, 8x

  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [remainingSeconds, setRemainingSeconds] = useState(720); // 12:00 = 720s
  const [quarterSimulated, setQuarterSimulated] = useState(false);

  const [quarterQueue, setQuarterQueue] = useState<ScheduledQuarterEvent[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const queueIndexRef = useRef(0);

  const updateQueueIndex = (val: number) => {
    queueIndexRef.current = val;
    setQueueIndex(val);
  };

  const [logs, setLogs] = useState<MatchLog[]>([
    { id: 'init', quarter: 1, time: '12:00', text: '比赛准备就绪，双方球队各自就位，等待裁判抛球发车！', type: 'system' },
  ]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Scores
  const [userScore, setUserScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);

  // Player Stats
  const [pts, setPts] = useState(0);
  const [reb, setReb] = useState(0);
  const [ast, setAst] = useState(0);
  const [stl, setStl] = useState(0);
  const [blk, setBlk] = useState(0);
  const [fgm, setFgm] = useState(0);
  const [fga, setFga] = useState(0);
  const [tpm, setTpm] = useState(0);
  const [tpa, setTpa] = useState(0);
  const [ftm, setFtm] = useState(0);
  const [fta, setFta] = useState(0);
  const [turnovers, setTurnovers] = useState(0);
  const [playedMinutes, setPlayedMinutes] = useState(0);
  const [earnedFans, setEarnedFans] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [earnedSkillPoints, setEarnedSkillPoints] = useState(0);

  // Rotation & Role
  const { minutes: assignedMPG, role: userRole } = getUserMinutesAndRole(userTeam, player, 0, currentYear - 2007);

  // Daily Form Factor (10% hot hand, 10% cold hand, 80% normal form)
  const [playerFormFactor] = useState(() => {
    const rand = Math.random();
    if (rand < 0.10) return 1.25;
    if (rand < 0.20) return 0.75;
    return 0.90 + Math.random() * 0.20;
  });

  const currentlyOnCourt = isPlayerOnCourt(currentQuarter, remainingSeconds, assignedMPG);

  // Requirement 1: 1-2 random tactical choice triggers per match
  const [tacticalTriggerQuarters] = useState<number[]>(() => {
    const count = Math.random() < 0.5 ? 1 : 2;
    const quarters = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    return quarters.slice(0, count);
  });

  // Requirement 3: Buzzer Beater Event
  // Trigger condition: 1. Role is 战术核心, 2. Interactive simulation, 3. 3/82 probability per season match
  const [isBuzzerBeaterGame] = useState<boolean>(() => {
    const isTacticalCore = userRole === '战术核心';
    return isInteractive && isTacticalCore && Math.random() < (3 / 82);
  });

  const [showBuzzerBeaterModal, setShowBuzzerBeaterModal] = useState(false);
  const [isBuzzerBeaterWin, setIsBuzzerBeaterWin] = useState(false);

  // Tactical Modal
  const [showQuarterEvent, setShowQuarterEvent] = useState(false);
  const [currentTacticalOptions, setCurrentTacticalOptions] = useState<TacticalOption[]>([]);
  const [eventProcessed, setEventProcessed] = useState(false);
  const [eventFeedback, setEventFeedback] = useState<string | null>(null);

  // Format MM:SS for display
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Auto-scroll logs to bottom
  useEffect(() => {
    // Events can arrive faster than a smooth-scroll animation finishes. An
    // immediate scroll prevents a growing queue of compositor animations.
    logsEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [logs]);

  // Start Match Handler (Click Start Match / Jump Ball)
  const startMatchSimulation = () => {
    setHasStarted(true);
    setCurrentQuarter(1);
    setRemainingSeconds(720);
    setQuarterSimulated(false);

    const hasTacticalTrigger = tacticalTriggerQuarters.includes(1);
    const events = buildQuarterEvents(
      1,
      userTeam,
      oppTeam,
      player,
      assignedMPG,
      playerFormFactor,
      { userScore: 0, oppScore: 0 },
      hasTacticalTrigger,
      isBuzzerBeaterGame
    );
    setQuarterQueue(events);
    updateQueueIndex(0);
    setIsSimulating(true);
  };

  // Next Quarter or Finish Game Handler
  const handleNextQuarterOrFinish = () => {
    if (currentQuarter < 4) {
      const nextQ = currentQuarter + 1;
      setCurrentQuarter(nextQ);
      setRemainingSeconds(720);
      setQuarterSimulated(false);

      const hasTacticalTrigger = tacticalTriggerQuarters.includes(nextQ);
      const events = buildQuarterEvents(
        nextQ,
        userTeam,
        oppTeam,
        player,
        assignedMPG,
        playerFormFactor,
        { userScore, oppScore },
        hasTacticalTrigger,
        isBuzzerBeaterGame
      );
      setQuarterQueue(events);
      updateQueueIndex(0);
      setIsSimulating(true);
    } else {
      finishGame();
    }
  };

  // Smooth Second-by-Second Countdown Ticker Effect
  useEffect(() => {
    if (!hasStarted || !isSimulating || showQuarterEvent || quarterSimulated) {
      return;
    }

    // Five visual updates per second are enough for the accelerated game clock
    // and cut full MatchSimulator re-renders in half on mobile WebViews.
    const intervalTimeMs = 200;
    let lastTickAt = performance.now();
    let animationFrame = 0;

    const tick = (now: number) => {
      if (now - lastTickAt < intervalTimeMs) {
        animationFrame = requestAnimationFrame(tick);
        return;
      }
      lastTickAt = now;
      setRemainingSeconds((prevSecs) => {
        if (prevSecs <= 0) {
          setQuarterSimulated(true);
          setIsSimulating(false);
          return 0;
        }

        const nextSecs = Math.max(0, prevSecs - speedMultiplier * 2);

        // Check and process scheduled events between prevSecs and nextSecs
        let currIdx = queueIndexRef.current;
        while (currIdx < quarterQueue.length) {
          const ev = quarterQueue[currIdx];
          if (ev.targetSeconds >= nextSecs) {
            // Process this event!
            setLogs((prev) => [
              ...prev,
              {
                id: ev.id,
                quarter: ev.quarter,
                time: ev.timeStr,
                text: ev.text,
                type: ev.type,
                points: ev.userPtsDelta || ev.oppPtsDelta || undefined,
              },
            ]);

            if (ev.userPtsDelta) setUserScore((prev) => prev + ev.userPtsDelta);
            if (ev.oppPtsDelta) setOppScore((prev) => prev + ev.oppPtsDelta);

            if (ev.playerStatsDelta) {
              const d = ev.playerStatsDelta;
              if (d.pts) setPts((p) => p + d.pts);
              if (d.reb) setReb((p) => p + d.reb);
              if (d.ast) setAst((p) => p + d.ast);
              if (d.stl) setStl((p) => p + d.stl);
              if (d.blk) setBlk((p) => p + d.blk);
              if (d.fgm) setFgm((p) => p + d.fgm);
              if (d.fga) setFga((p) => p + d.fga);
              if (d.tpm) setTpm((p) => p + d.tpm);
              if (d.tpa) setTpa((p) => p + d.tpa);
              if (d.ftm) setFtm((p) => p + d.ftm);
              if (d.fta) setFta((p) => p + d.fta);
              if (d.turnovers) setTurnovers((p) => p + d.turnovers);
              if (d.minutes) setPlayedMinutes((p) => +(p + d.minutes).toFixed(1));
            }

            currIdx++;
            queueIndexRef.current = currIdx; // MUTATE REF IMMEDIATELY

            // Check if Buzzer Beater trigger hit -> PAUSE immediately!
            if (ev.isBuzzerBeaterTrigger && isInteractive) {
              setIsSimulating(false);
              setShowBuzzerBeaterModal(true);
              setQueueIndex(currIdx);
              return ev.targetSeconds;
            }

            // Check if tactical trigger hit -> PAUSE immediately!
            if (ev.isTacticalTrigger && isInteractive && isPlayerOnCourt(ev.quarter, ev.targetSeconds, assignedMPG)) {
              setIsSimulating(false);
              const options = generateTacticalOptions(player, ev.quarter);
              setCurrentTacticalOptions(options);
              setShowQuarterEvent(true);
              setQueueIndex(currIdx);
              return ev.targetSeconds; // Snap clock to trigger second
            }
          } else {
            break;
          }
        }

        setQueueIndex(currIdx);
        return nextSecs;
      });
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [
    hasStarted,
    isSimulating,
    showQuarterEvent,
    quarterSimulated,
    quarterQueue,
    speedMultiplier,
    player,
    isInteractive,
    assignedMPG,
  ]);

  // Quick simulate remaining events of current quarter
  const quickSimulateCurrentQuarter = () => {
    let currIdx = queueIndexRef.current;
    let localUserScore = 0;
    let localOppScore = 0;
    let localPts = 0;
    let localReb = 0;
    let localAst = 0;
    let localStl = 0;
    let localBlk = 0;
    let localFgm = 0;
    let localFga = 0;
    let localTpm = 0;
    let localTpa = 0;
    let localFtm = 0;
    let localFta = 0;
    let localTurnovers = 0;
    let localMins = 0;

    const newLogs: MatchLog[] = [];

    while (currIdx < quarterQueue.length) {
      const ev = quarterQueue[currIdx];

      // Check if Buzzer Beater trigger hit
      if (ev.isBuzzerBeaterTrigger && isInteractive) {
        if (localUserScore) setUserScore((prev) => prev + localUserScore);
        if (localOppScore) setOppScore((prev) => prev + localOppScore);
        if (localPts) setPts((prev) => prev + localPts);
        if (localReb) setReb((prev) => prev + localReb);
        if (localAst) setAst((prev) => prev + localAst);
        if (localStl) setStl((prev) => prev + localStl);
        if (localBlk) setBlk((prev) => prev + localBlk);
        if (localFgm) setFgm((prev) => prev + localFgm);
        if (localFga) setFga((prev) => prev + localFga);
        if (localTpm) setTpm((prev) => prev + localTpm);
        if (localTpa) setTpa((prev) => prev + localTpa);
        if (localFtm) setFtm((prev) => prev + localFtm);
        if (localFta) setFta((prev) => prev + localFta);
        if (localTurnovers) setTurnovers((prev) => prev + localTurnovers);
        if (localMins) setPlayedMinutes((prev) => +(prev + localMins).toFixed(1));

        if (newLogs.length) setLogs((prev) => [...prev, ...newLogs]);

        setRemainingSeconds(ev.targetSeconds);
        updateQueueIndex(currIdx + 1);
        setIsSimulating(false);
        setShowBuzzerBeaterModal(true);
        return;
      }

      // Check if tactical trigger hit
      if (ev.isTacticalTrigger && isInteractive && isPlayerOnCourt(ev.quarter, ev.targetSeconds, assignedMPG)) {
        // Apply accumulated deltas so far
        if (localUserScore) setUserScore((prev) => prev + localUserScore);
        if (localOppScore) setOppScore((prev) => prev + localOppScore);
        if (localPts) setPts((prev) => prev + localPts);
        if (localReb) setReb((prev) => prev + localReb);
        if (localAst) setAst((prev) => prev + localAst);
        if (localStl) setStl((prev) => prev + localStl);
        if (localBlk) setBlk((prev) => prev + localBlk);
        if (localFgm) setFgm((prev) => prev + localFgm);
        if (localFga) setFga((prev) => prev + localFga);
        if (localTpm) setTpm((prev) => prev + localTpm);
        if (localTpa) setTpa((prev) => prev + localTpa);
        if (localFtm) setFtm((prev) => prev + localFtm);
        if (localFta) setFta((prev) => prev + localFta);
        if (localTurnovers) setTurnovers((prev) => prev + localTurnovers);
        if (localMins) setPlayedMinutes((prev) => +(prev + localMins).toFixed(1));

        if (newLogs.length) setLogs((prev) => [...prev, ...newLogs]);

        setRemainingSeconds(ev.targetSeconds);
        updateQueueIndex(currIdx + 1);
        setIsSimulating(false);

        const options = generateTacticalOptions(player, ev.quarter);
        setCurrentTacticalOptions(options);
        setShowQuarterEvent(true);
        return;
      }

      newLogs.push({
        id: ev.id,
        quarter: ev.quarter,
        time: ev.timeStr,
        text: ev.text,
        type: ev.type,
        points: ev.userPtsDelta || ev.oppPtsDelta || undefined,
      });

      if (ev.userPtsDelta) localUserScore += ev.userPtsDelta;
      if (ev.oppPtsDelta) localOppScore += ev.oppPtsDelta;

      if (ev.playerStatsDelta) {
        const d = ev.playerStatsDelta;
        if (d.pts) localPts += d.pts;
        if (d.reb) localReb += d.reb;
        if (d.ast) localAst += d.ast;
        if (d.stl) localStl += d.stl;
        if (d.blk) localBlk += d.blk;
        if (d.fgm) localFgm += d.fgm;
        if (d.fga) localFga += d.fga;
        if (d.tpm) localTpm += d.tpm;
        if (d.tpa) localTpa += d.tpa;
        if (d.ftm) localFtm += d.ftm;
        if (d.fta) localFta += d.fta;
        if (d.turnovers) localTurnovers += d.turnovers;
        if (d.minutes) localMins += d.minutes;
      }

      currIdx++;
    }

    // Finished all events
    if (localUserScore) setUserScore((prev) => prev + localUserScore);
    if (localOppScore) setOppScore((prev) => prev + localOppScore);
    if (localPts) setPts((prev) => prev + localPts);
    if (localReb) setReb((prev) => prev + localReb);
    if (localAst) setAst((prev) => prev + localAst);
    if (localStl) setStl((prev) => prev + localStl);
    if (localBlk) setBlk((prev) => prev + localBlk);
    if (localFgm) setFgm((prev) => prev + localFgm);
    if (localFga) setFga((prev) => prev + localFga);
    if (localTpm) setTpm((prev) => prev + localTpm);
    if (localTpa) setTpa((prev) => prev + localTpa);
    if (localFtm) setFtm((prev) => prev + localFtm);
    if (localFta) setFta((prev) => prev + localFta);
    if (localTurnovers) setTurnovers((prev) => prev + localTurnovers);
    if (localMins) setPlayedMinutes((prev) => +(prev + localMins).toFixed(1));

    if (newLogs.length) setLogs((prev) => [...prev, ...newLogs]);

    setRemainingSeconds(0);
    updateQueueIndex(quarterQueue.length);
    setQuarterSimulated(true);
    setIsSimulating(false);
  };

  // Tactical Choice Option Selection
  const handleTacticalChoiceOption = (opt: TacticalOption) => {
    const isSuccess = Math.random() < opt.prob;

    if (isSuccess) {
      setEarnedFans((prev) => prev + opt.fanReward);
      setEarnedXp((prev) => prev + opt.xpReward);
      if (!opt.isNeutral) {
        setEarnedSkillPoints((prev) => prev + 1);
      }
      setEventFeedback(
        `✅ 【战术执行成功】 ${opt.successText} (${!opt.isNeutral ? '属性点 +1 / ' : ''}粉丝 +${opt.fanReward} / 经验 +${opt.xpReward})`
      );

      if (opt.statType === 'pts3') {
        setUserScore((prev) => prev + 3);
        setPts((prev) => prev + 3);
        setFga((prev) => prev + 1);
        setFgm((prev) => prev + 1);
        setTpa((prev) => prev + 1);
        setTpm((prev) => prev + 1);
      } else if (opt.statType === 'pts2') {
        setUserScore((prev) => prev + 2);
        setPts((prev) => prev + 2);
        setFga((prev) => prev + 1);
        setFgm((prev) => prev + 1);
      } else if (opt.statType === 'ast') {
        setUserScore((prev) => prev + 2);
        setAst((prev) => prev + 1);
      } else if (opt.statType === 'stl') {
        setStl((prev) => prev + 1);
      } else if (opt.statType === 'blk') {
        setBlk((prev) => prev + 1);
      } else if (opt.statType === 'reb') {
        setReb((prev) => prev + 1);
        setUserScore((prev) => prev + 2);
        setPts((prev) => prev + 2);
        setFga((prev) => prev + 1);
        setFgm((prev) => prev + 1);
      }
    } else {
      setEventFeedback(`⚠️ 【战术执行失败】 ${opt.failText}`);
      if (opt.statType === 'pts3' || opt.statType === 'pts2') {
        setFga((prev) => prev + 1);
      }
      setOppScore((prev) => prev + 2);
    }

    setEventProcessed(true);
  };

  // Buzzer Beater Choice Handler
  const handleBuzzerBeaterChoice = (shotType: '3pt' | 'mid' | 'layup') => {
    // Requirement: 30% success rate
    const isSuccess = Math.random() < 0.30;

    if (isSuccess) {
      const ptsEarned = shotType === '3pt' ? 3 : 2;
      // Ensure user team wins
      setUserScore((prev) => Math.max(prev + ptsEarned, oppScore + 1));
      setPts((prev) => prev + ptsEarned);
      setFgm((prev) => prev + 1);
      setFga((prev) => prev + 1);
      if (shotType === '3pt') {
        setTpm((prev) => prev + 1);
        setTpa((prev) => prev + 1);
      }
      setEarnedSkillPoints((prev) => prev + 3); // +3 点属性点
      setIsBuzzerBeaterWin(true);

      const successLog: MatchLog = {
        id: `buzzer_success_${Date.now()}`,
        quarter: 4,
        time: '00:00',
        text: `🏀【压哨绝杀爆火全场！】${player.name} 在两万名球迷屏息注视下高高跃起干拔…… 篮球划过天际在终场哨响中空心唰入网窝！压哨绝杀！！全场陷入狂热！`,
        type: 'highlight',
        points: ptsEarned,
      };
      setLogs((prev) => [...prev, successLog]);
      setEventFeedback("🔥【压哨绝杀爆火成功！】完美终场打进！获得 +3 倍粉丝加成 & +3 点属性点！");
    } else {
      setFga((prev) => prev + 1);
      setOppScore((prev) => Math.max(prev, userScore + 1));
      const failLog: MatchLog = {
        id: `buzzer_fail_${Date.now()}`,
        quarter: 4,
        time: '00:00',
        text: `💔【绝杀弹筐而出！】${player.name} 强行高难度拉杆绝杀出手——篮球砸在篮筐后沿重重弹偏！终场哨声响起，比赛结束，遗憾惜败。`,
        type: 'away',
      };
      setLogs((prev) => [...prev, failLog]);
      setEventFeedback("💔 绝杀球遗憾弹筐偏出，比赛结束。");
    }

    setShowBuzzerBeaterModal(false);
    setRemainingSeconds(0);
    setQuarterSimulated(true);
  };

  const finishGame = () => {
    const ratingGrade = calculateInteractiveGrade({ pts, reb, ast, stl, blk, fgm, fga, ftm, fta, turnovers });

    const boxScore: MatchBoxScore = {
      playerStats: {
        pts,
        reb,
        ast,
        stl,
        blk,
        fgm,
        fga,
        tpm,
        tpa,
        ftm,
        fta,
        minutes: playedMinutes,
        turnovers,
        ratingGrade,
      },
      userTeamScore: userScore,
      opponentScore: oppScore,
      userTeamId: userTeam.id,
      opponentTeamId: oppTeam.id,
      isPlayoffs,
      logs,
      challengesCompleted: pts >= 20 ? ['20+ PTS'] : [],
      rewardSkillPoints: earnedSkillPoints,
      rewardMoney: 0,
      rewardFans: earnedFans,
      rewardXp: earnedXp,
      isBuzzerBeaterWin,
    };

    onFinishMatch(boxScore);
  };
  return {
    hasStarted,
    isSimulating,
    setIsSimulating,
    speedMultiplier,
    setSpeedMultiplier,
    currentQuarter,
    remainingSeconds,
    quarterSimulated,
    logs,
    logsEndRef,
    userScore,
    oppScore,
    pts,
    reb,
    ast,
    stl,
    blk,
    fgm,
    fga,
    tpm,
    tpa,
    ftm,
    fta,
    turnovers,
    playedMinutes,
    earnedFans,
    earnedXp,
    assignedMPG,
    userRole,
    currentlyOnCourt,
    showBuzzerBeaterModal,
    showQuarterEvent,
    setShowQuarterEvent,
    currentTacticalOptions,
    eventProcessed,
    setEventProcessed,
    eventFeedback,
    setEventFeedback,
    formatTime,
    startMatchSimulation,
    handleNextQuarterOrFinish,
    quickSimulateCurrentQuarter,
    handleTacticalChoiceOption,
    handleBuzzerBeaterChoice,
  };
}
