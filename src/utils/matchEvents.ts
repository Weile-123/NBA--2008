import { PlayerProfile,Team } from '../types';
import { calculateMatchScores,calculateTeamUsageContext,simulatePlayerMatchStats } from './leagueLogic';
import { getPlayerTotalAttributes } from './calc2k';
export interface TacticalOption {
  id: string;
  title: string;
  desc: string;
  prob: number; // 0.0 - 1.0
  isNeutral?: boolean;
  fanReward: number;
  xpReward: number;
  statType: 'pts3' | 'pts2' | 'ast' | 'stl' | 'blk' | 'reb' | 'none';
  successText: string;
  failText: string;
}

export interface ScheduledQuarterEvent {
  id: string;
  quarter: number;
  targetSeconds: number; // 720 down to 0
  timeStr: string; // "12:00"
  text: string;
  type: 'system' | 'user' | 'away' | 'highlight';
  userPtsDelta: number;
  oppPtsDelta: number;
  playerStatsDelta?: {
    pts?: number;
    reb?: number;
    ast?: number;
    stl?: number;
    blk?: number;
    fgm?: number;
    fga?: number;
    tpm?: number;
    tpa?: number;
    ftm?: number;
    fta?: number;
    turnovers?: number;
    minutes?: number;
  };
  isTacticalTrigger?: boolean;
  isBuzzerBeaterTrigger?: boolean;
}

export interface InteractiveMatchScorePlan {
  finalUserScore: number;
  finalOppScore: number;
  quarters: Array<{ user: number; opp: number }>;
}

export type BuzzerBeaterShotType = '3pt' | 'mid' | 'layup';

/** Keep the displayed final-shot odds and the actual roll on one formula. */
export function calculateBuzzerBeaterSuccessRate(
  player: Pick<PlayerProfile, 'attributes'>,
  shotType: BuzzerBeaterShotType,
): number {
  const { attributes } = player;
  const shotRating = shotType === '3pt'
    ? attributes.threePoint * 0.8 + attributes.ballHandle * 0.2
    : shotType === 'mid'
      ? attributes.midRange * 0.8 + attributes.ballHandle * 0.2
      : attributes.layup * 0.55 + attributes.insideFinish * 0.3 + attributes.strength * 0.15;
  const baseRate = shotType === 'layup' ? 0.36 : shotType === 'mid' ? 0.34 : 0.32;
  const rate = baseRate + (shotRating - 70) * 0.006;
  return Math.min(shotType === 'layup' ? 0.58 : 0.54, Math.max(0.25, rate));
}

function distributeScoreAcrossQuarters(total: number): number[] {
  const scores: number[] = [];
  let remaining = total;
  for (let quarter = 0; quarter < 3; quarter += 1) {
    const quartersLeft = 4 - quarter;
    const lower = Math.max(14, remaining - 40 * (quartersLeft - 1));
    const upper = Math.min(40, remaining - 14 * (quartersLeft - 1));
    const variedAverage = Math.round(remaining / quartersLeft + (Math.random() * 9 - 4));
    const score = Math.max(lower, Math.min(upper, variedAverage));
    scores.push(score);
    remaining -= score;
  }
  scores.push(remaining);
  return scores;
}

export function createInteractiveMatchScorePlan(userTeam: Team, oppTeam: Team): InteractiveMatchScorePlan {
  const target = calculateMatchScores(userTeam, oppTeam, userTeam.id);
  const userQuarters = distributeScoreAcrossQuarters(target.teamAScore);
  const oppQuarters = distributeScoreAcrossQuarters(target.teamBScore);
  return {
    finalUserScore: target.teamAScore,
    finalOppScore: target.teamBScore,
    quarters: userQuarters.map((user, index) => ({ user, opp: oppQuarters[index] })),
  };
}

export function shouldTriggerBuzzerBeater(isSelectedGame: boolean, userScore: number, oppScore: number): boolean {
  return isSelectedGame && oppScore - userScore === 1;
}

export function resolveInteractiveFinalScore(
  userScore: number,
  oppScore: number,
  plannedUserWin: boolean,
): { userScore: number; oppScore: number; wentToOvertime: boolean } {
  if (userScore !== oppScore) return { userScore, oppScore, wentToOvertime: false };
  const overtimeMargin = 1 + Math.floor(Math.random() * 6);
  return plannedUserWin
    ? { userScore: userScore + overtimeMargin, oppScore, wentToOvertime: true }
    : { userScore, oppScore: oppScore + overtimeMargin, wentToOvertime: true };
}

function hasPersonalScoringStats(event: ScheduledQuarterEvent): boolean {
  const stats = event.playerStatsDelta;
  return !!stats && !!(stats.pts || stats.fgm || stats.fga || stats.tpm || stats.tpa || stats.ftm || stats.fta || stats.ast);
}

/** Keep the visible play-by-play on the same team-strength result as quick sim. */
export function reconcileQuarterTeamScore(
  events: ScheduledQuarterEvent[],
  quarter: number,
  side: 'user' | 'opp',
  targetPoints: number,
  teamName: string,
): ScheduledQuarterEvent[] {
  const scoreKey = side === 'user' ? 'userPtsDelta' : 'oppPtsDelta';
  let current = events.reduce((sum, event) => sum + event[scoreKey], 0);

  if (current > targetPoints) {
    const removable = [...events].reverse().filter((event) =>
      event.quarter === quarter && event[scoreKey] > 0 && (side === 'opp' || !hasPersonalScoringStats(event)),
    );
    for (const event of removable) {
      if (current <= targetPoints) break;
      const reduction = Math.min(event[scoreKey], current - targetPoints);
      event[scoreKey] -= reduction;
      current -= reduction;
      event.text = event[scoreKey] > 0
        ? `${teamName}制造犯规后通过罚球得到 ${event[scoreKey]} 分。`
        : `${teamName}本次进攻受到严密干扰，投篮偏出。`;
    }
  }

  let eventNumber = 0;
  while (current < targetPoints) {
    const remaining = targetPoints - current;
    const points = remaining >= 3 ? (Math.random() < 0.35 ? 3 : 2) : remaining;
    const targetSeconds = Math.max(12, 690 - eventNumber * 22);
    events.push({
      id: `q${quarter}_${side}_score_reconcile_${eventNumber}`,
      quarter,
      targetSeconds,
      timeStr: `${Math.floor(targetSeconds / 60).toString().padStart(2, '0')}:${(targetSeconds % 60).toString().padStart(2, '0')}`,
      text: points === 3
        ? `${teamName}通过团队配合命中三分。`
        : points === 2
          ? `${teamName}完成一次稳健的两分进攻。`
          : `${teamName}站上罚球线命中一球。`,
      type: side === 'user' ? 'user' : 'away',
      userPtsDelta: side === 'user' ? points : 0,
      oppPtsDelta: side === 'opp' ? points : 0,
    });
    current += points;
    eventNumber += 1;
  }
  return events;
}

const MISSED_SHOT_TEXT = /偏出|打铁|砸筐|未能命中|受干扰/;

/**
 * Interactive play-by-play is event based, while quick simulation starts from
 * a per-game statistical target. Reconcile rebound events to that same target
 * so elite rebounders do not lose most of their production merely because the
 * user chose to watch the game.
 */
export function reconcileQuarterRebounds(
  events: ScheduledQuarterEvent[],
  quarter: number,
  assignedMPG: number,
  target: number,
  playerName: string,
): ScheduledQuarterEvent[] {
  const desired = Math.max(0, Math.round(target));
  let current = events.reduce((sum, event) => sum + (event.playerStatsDelta?.reb || 0), 0);
  if (current >= desired) return events;

  const missedShots = events.filter((event) =>
    event.quarter === quarter
    && event.userPtsDelta === 0
    && event.oppPtsDelta === 0
    && !!event.playerStatsDelta
    && isPlayerOnCourt(quarter, event.targetSeconds, assignedMPG)
    && MISSED_SHOT_TEXT.test(event.text)
    && !event.playerStatsDelta?.reb
  );

  // Spread the additions across the quarter instead of clustering them at the
  // beginning of the event list.
  missedShots.sort((a, b) => a.targetSeconds - b.targetSeconds);
  while (current < desired && missedShots.length > 0) {
    const slot = Math.floor(((current + 0.5) / desired) * missedShots.length);
    const [event] = missedShots.splice(Math.min(slot, missedShots.length - 1), 1);
    event.playerStatsDelta = { ...event.playerStatsDelta, reb: 1 };
    event.text += event.type === 'away'
      ? ` ${playerName}牢牢卡住身位，保护下后场篮板。`
      : ` ${playerName}冲入禁区，拼下前场篮板。`;
    current += 1;
  }
  return events;
}

export function addQuarterFreeThrows(
  events: ScheduledQuarterEvent[],
  quarter: number,
  assignedMPG: number,
  attempts: number,
  made: number,
  playerName: string,
): ScheduledQuarterEvent[] {
  const fta = Math.max(0, Math.round(attempts));
  const ftm = Math.max(0, Math.min(fta, Math.round(made)));
  if (fta === 0) return events;
  const event = events.find((candidate) =>
    candidate.quarter === quarter
    && candidate.type === 'user'
    && !!candidate.playerStatsDelta
    && isPlayerOnCourt(quarter, candidate.targetSeconds, assignedMPG)
    && candidate.userPtsDelta === 0
    && candidate.oppPtsDelta === 0
  ) || events.find((candidate) =>
    candidate.quarter === quarter
    && !!candidate.playerStatsDelta
    && isPlayerOnCourt(quarter, candidate.targetSeconds, assignedMPG)
  );
  if (!event) return events;
  event.userPtsDelta += ftm;
  event.playerStatsDelta = {
    ...event.playerStatsDelta,
    pts: (event.playerStatsDelta.pts || 0) + ftm,
    ftm: (event.playerStatsDelta.ftm || 0) + ftm,
    fta: (event.playerStatsDelta.fta || 0) + fta,
  };
  event.text = `${playerName}强攻造成犯规，站上罚球线 ${fta} 罚 ${ftm} 中。`;
  return events;
}

export function calculateInteractiveGrade(stats: {
  pts: number; reb: number; ast: number; stl: number; blk: number;
  fgm: number; fga: number; ftm: number; fta: number; turnovers: number;
}): 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D' {
  const missedFieldGoals = Math.max(0, stats.fga - stats.fgm);
  const missedFreeThrows = Math.max(0, stats.fta - stats.ftm);
  const impact = stats.pts
    + stats.reb * 1.2
    + stats.ast * 1.5
    + stats.stl * 3
    + stats.blk * 3
    - stats.turnovers * 1.5
    - missedFieldGoals * 0.5
    - missedFreeThrows * 0.25;
  if (impact >= 50) return 'S+';
  if (impact >= 40) return 'S';
  if (impact >= 32) return 'A+';
  if (impact >= 24) return 'A';
  if (impact >= 16) return 'B';
  if (impact >= 8) return 'C';
  return 'D';
}

/**
  * Realistic rotation schedule helper.
  * Calculates whether player is on court at time `remainingSecs` in quarter `q`
  * based on assigned minutes per game (assignedMPG out of 48 total game minutes).
  */
export function isPlayerOnCourt(q: number, remainingSecs: number, assignedMPG: number): boolean {
  if (assignedMPG >= 34) {
    // Star player (34-38 mins): Sits middle/late Q2 (6m to 3m) and early Q4 (12m to 9m)
    if (q === 1 || q === 3) return true;
    if (q === 2) return remainingSecs > 360 || remainingSecs < 180;
    if (q === 4) return remainingSecs < 540;
    return true;
  }
  if (assignedMPG >= 28) {
    // Standard starter (~28-33 mins): Plays 7.5 mins per quarter = ~30 mins total
    // Q1 & Q3: Plays 12:00 down to 4:00 (720s -> 240s) = 8 mins
    // Q2 & Q4: Plays 7:00 down to 0:00 (420s -> 0s) = 7 mins
    if (q === 1 || q === 3) return remainingSecs >= 240;
    if (q === 2 || q === 4) return remainingSecs <= 420;
    return false;
  }
  if (assignedMPG >= 20) {
    // Key rotation / 6th Man (~20-27 mins): Plays 6 mins per quarter = ~24 mins total
    // Q1 & Q3: Plays 6:00 down to 0:00 (360s -> 0s) = 6 mins
    // Q2 & Q4: Plays 12:00 down to 6:00 (720s -> 360s) = 6 mins
    if (q === 1 || q === 3) return remainingSecs <= 360;
    if (q === 2 || q === 4) return remainingSecs >= 360;
    return false;
  }
  if (assignedMPG >= 12) {
    // Rotation bench (~12-19 mins): Plays 7 mins in Q2 and Q4 = ~14 mins total
    if (q === 2 || q === 4) return remainingSecs <= 540 && remainingSecs >= 120; // 9:00 -> 2:00
    return false;
  }
  // Deep bench (< 12 mins): Plays 4 mins in Q2 and Q4 = ~8 mins total
  if (q === 2 || q === 4) return remainingSecs <= 420 && remainingSecs >= 180; // 7:00 -> 3:00
  return false;
}

export function buildQuarterEvents(
  q: number,
  userTeam: Team,
  oppTeam: Team,
  player: PlayerProfile,
  assignedMPG: number,
  playerFormFactor: number = 1.0,
  currentScores?: { userScore: number; oppScore: number },
  hasTacticalTrigger: boolean = true,
  isBuzzerBeaterGame: boolean = false,
  scorePlan?: InteractiveMatchScorePlan,
): ScheduledQuarterEvent[] {
  const events: ScheduledQuarterEvent[] = [];
  const userStarName = player.name;
  const oppStarName = oppTeam.starPlayer ? oppTeam.starPlayer.split('&')[0].trim() : '对位球星';
  const attrs = getPlayerTotalAttributes(player);

  // 1. Initial Quarter Start Event (720s = 12:00)
  events.push({
    id: `q${q}_start`,
    quarter: q,
    targetSeconds: 720,
    timeStr: '12:00',
    text: q === 1 
      ? `🏀 比赛正式跳球！主裁判将球高高抛起，双方中锋高高跃起争顶，${userTeam.name} 抢下首攻发车！`
      : `🏀 第 ${q} 节比赛开始！裁判鸣哨发球，双方换上轮换阵型继续厮杀！`,
    type: 'system',
    userPtsDelta: 0,
    oppPtsDelta: 0,
  });

  // Calculate user team usage context to pass to simulation
  const nonUserRoster = (userTeam.roster || []).filter(
    (p) => !(p.id === player.id || p.name === player.name || (p as any).isUser)
  );
  const userTeamRoster = [
    ...nonUserRoster.map((p) => ({ ovr: p.ovr, isUser: false })),
    { ovr: player.ovr, isUser: true },
  ];
  const userTeamUsageContext = calculateTeamUsageContext(userTeamRoster);

  // Calculate full game expected baseline stats from player attributes & coach assigned minutes
  const expectedGameStats = simulatePlayerMatchStats(player, assignedMPG, userTeamUsageContext);

  // Apply daily form factor to target stats
  const targetGameFga = Math.max(1, Math.round(expectedGameStats.fga * playerFormFactor));
  const targetGame3pa = Math.round(expectedGameStats.tpa * playerFormFactor);
  const targetGameAst = Math.round(expectedGameStats.ast * playerFormFactor);
  const targetGameReb = Math.round(expectedGameStats.reb * playerFormFactor);
  const targetGameStl = Math.round(expectedGameStats.stl * playerFormFactor);
  const targetGameBlk = Math.round(expectedGameStats.blk * playerFormFactor);
  const targetGameTov = Math.round(expectedGameStats.turnovers * playerFormFactor);
  const targetGameFta = Math.round(expectedGameStats.fta * playerFormFactor);
  const targetGameFtm = Math.min(targetGameFta, Math.round(expectedGameStats.ftm * playerFormFactor));

  // Per quarter targets
  const qTargetFga = targetGameFga / 4;
  const qTarget3pa = targetGame3pa / 4;
  const qTargetAst = targetGameAst / 4;
  const qTargetReb = targetGameReb / 4;
  const qTargetStl = targetGameStl / 4;
  const qTargetBlk = targetGameBlk / 4;
  const qTargetTov = targetGameTov / 4;

  // Realistic shot make probabilities based on attributes + form
  const midLayupAvg = (attrs.layup + attrs.midRange + attrs.insideFinish) / 3;
  const pMake2 = Math.min(0.65, Math.max(0.35, (0.40 + (midLayupAvg - 50) * 0.004) * (0.9 + playerFormFactor * 0.1)));
  const pMake3 = Math.min(0.50, Math.max(0.24, (0.30 + (attrs.threePoint - 50) * 0.004) * (0.9 + playerFormFactor * 0.1)));

  // Dynamic score pacing mapped to team power ratings formula (80-120 total game score range)
  const calculatedMatch = scorePlan || createInteractiveMatchScorePlan(userTeam, oppTeam);
  const targetUserScore = calculatedMatch.finalUserScore;
  const targetOppScore = calculatedMatch.finalOppScore;

  const expectedUserBase = Math.round(((q - 1) / 4) * targetUserScore);
  const expectedOppBase = Math.round(((q - 1) / 4) * targetOppScore);

  const userCur = currentScores?.userScore ?? expectedUserBase;
  const oppCur = currentScores?.oppScore ?? expectedOppBase;

  let userScale = 1.0;
  if (q > 1) {
    if (userCur > expectedUserBase + 8) userScale = 0.70;
    else if (userCur > expectedUserBase + 4) userScale = 0.85;
    else if (userCur < expectedUserBase - 8) userScale = 1.30;
    else if (userCur < expectedUserBase - 4) userScale = 1.15;
  }

  let oppScale = 1.0;
  if (q > 1) {
    if (oppCur > expectedOppBase + 8) oppScale = 0.70;
    else if (oppCur > expectedOppBase + 4) oppScale = 0.85;
    else if (oppCur < expectedOppBase - 8) oppScale = 1.30;
    else if (oppCur < expectedOppBase - 4) oppScale = 1.15;
  }

  // Count on-court event slots in this quarter to calculate smooth played minutes increments
  let secScan = 705;
  let onCourtSlotsInQ = 0;
  while (secScan > 10) {
    if (isPlayerOnCourt(q, secScan, assignedMPG)) {
      onCourtSlotsInQ++;
    }
    secScan -= 20;
  }
  onCourtSlotsInQ = Math.max(1, onCourtSlotsInQ);
  const minIncrement = +((assignedMPG / 4) / onCourtSlotsInQ).toFixed(1);

  // User player action probability per possession when ON COURT
  const qTargetAstAttempts = qTargetAst / 0.65;
  const userActionProb = Math.min(0.65, Math.max(0.08, (qTargetFga + qTargetAstAttempts + qTargetTov) / Math.max(2, onCourtSlotsInQ * 0.5)));

  let currentSec = 705;
  let eventCount = 0;
  const tacticalTriggerSec = 360;
  let tacticalTriggerAdded = false;

  while (currentSec > 10) {
    const isOnCourtNow = isPlayerOnCourt(q, currentSec, assignedMPG);

    // Insert tactical trigger if passing 360s and quarter is allowed
    if (hasTacticalTrigger && currentSec <= tacticalTriggerSec && !tacticalTriggerAdded) {
      tacticalTriggerAdded = true;
      events.push({
        id: `q${q}_tactical`,
        quarter: q,
        targetSeconds: tacticalTriggerSec,
        timeStr: '06:00',
        text: isOnCourtNow
          ? `⚡ 【关键战术抉择】 第 ${q} 节中段比分胶着，教练在场边高喊调整战术！${userStarName} 迎来了决定本节走向的关键单打/防守回合！`
          : `⚡ 【替补席观战】 第 ${q} 节中段比赛拉锯，场上双方快速转换打出高潮，你在替补席蓄势待发。`,
        type: 'highlight',
        userPtsDelta: 0,
        oppPtsDelta: 0,
        isTacticalTrigger: isOnCourtNow,
      });
    }

    const mins = Math.floor(currentSec / 60).toString().padStart(2, '0');
    const secs = (currentSec % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    const isUserTurn = Math.random() > 0.48;

    if (isUserTurn) {
      // User Team possession
      const isUserPlayerAction = isOnCourtNow && Math.random() < userActionProb;

      if (isUserPlayerAction) {
        // Decide action: 3PT, 2PT, Assist, Turnover based on user target weights
        const tot = Math.max(0.1, qTargetFga + qTargetAstAttempts + qTargetTov);
        const p3 = qTarget3pa / tot;
        const p2 = (qTargetFga - qTarget3pa) / tot;
        const pAst = qTargetAstAttempts / tot;
        const actionRoll = Math.random();

        if (actionRoll < p3) {
          // 3PT Shot
          const isMake = Math.random() < pMake3;
          if (isMake) {
            events.push({
              id: `q${q}_play_${eventCount}`,
              quarter: q,
              targetSeconds: currentSec,
              timeStr,
              text: `${userStarName} 弧顶接球不假思索干拔三分，手起刀落划出优美弧线穿心入网！`,
              type: 'highlight',
              userPtsDelta: 3,
              oppPtsDelta: 0,
              playerStatsDelta: { pts: 3, fgm: 1, fga: 1, tpm: 1, tpa: 1, minutes: minIncrement },
            });
          } else {
            events.push({
              id: `q${q}_play_${eventCount}`,
              quarter: q,
              targetSeconds: currentSec,
              timeStr,
              text: `${userStarName} 侧翼迎着强力防守后撤步三分飚射——弹筐而出！`,
              type: 'user',
              userPtsDelta: 0,
              oppPtsDelta: 0,
              playerStatsDelta: { fgm: 0, fga: 1, tpm: 0, tpa: 1, minutes: minIncrement },
            });
          }
        } else if (actionRoll < p3 + p2) {
          // 2PT Shot
          const isMake = Math.random() < pMake2;
          if (isMake) {
            events.push({
              id: `q${q}_play_${eventCount}`,
              quarter: q,
              targetSeconds: currentSec,
              timeStr,
              text: `${userStarName} 运球第一步加速刺穿防线，罚球线急停抛投打板稳稳命中！`,
              type: 'user',
              userPtsDelta: 2,
              oppPtsDelta: 0,
              playerStatsDelta: { pts: 2, fgm: 1, fga: 1, minutes: minIncrement },
            });
          } else {
            events.push({
              id: `q${q}_play_${eventCount}`,
              quarter: q,
              targetSeconds: currentSec,
              timeStr,
              text: `${userStarName} 强行突破禁区遭两人合围对抗打铁，未能命中。`,
              type: 'user',
              userPtsDelta: 0,
              oppPtsDelta: 0,
              playerStatsDelta: { fgm: 0, fga: 1, minutes: minIncrement },
            });
          }
        } else if (actionRoll < p3 + p2 + pAst) {
          // Assist attempt
          const astMake = Math.random() < 0.65;
          if (astMake) {
            events.push({
              id: `q${q}_play_${eventCount}`,
              quarter: q,
              targetSeconds: currentSec,
              timeStr,
              text: `${userStarName} 吸引双人防守收缩，不看人妙传底角空位队友，助攻队友三分空心命中！`,
              type: 'user',
              userPtsDelta: 3,
              oppPtsDelta: 0,
              playerStatsDelta: { ast: 1, minutes: minIncrement },
            });
          } else {
            events.push({
              id: `q${q}_play_${eventCount}`,
              quarter: q,
              targetSeconds: currentSec,
              timeStr,
              text: `${userStarName} 精准分球给高位队友，队友直接拔起中投可惜砸筐偏出。`,
              type: 'user',
              userPtsDelta: 0,
              oppPtsDelta: 0,
              playerStatsDelta: { minutes: minIncrement },
            });
          }
        } else {
          // Turnover
          events.push({
            id: `q${q}_play_${eventCount}`,
            quarter: q,
            targetSeconds: currentSec,
            timeStr,
            text: `${userStarName} 高位运球遭夹击传球失误，被对手预判抢断！`,
            type: 'user',
            userPtsDelta: 0,
            oppPtsDelta: 0,
            playerStatsDelta: { turnovers: 1, minutes: minIncrement },
          });
        }
      } else {
        // Teammate action
        const teamRoll = Math.random();
        const pRebUser = isOnCourtNow && Math.random() < (qTargetReb / Math.max(1, onCourtSlotsInQ * 0.4));

        if (pRebUser) {
          events.push({
            id: `q${q}_play_${eventCount}`,
            quarter: q,
            targetSeconds: currentSec,
            timeStr,
            text: `${userTeam.name} 投篮偏出，${userStarName} 预判落点高高跃起抓下前场篮板！`,
            type: 'user',
            userPtsDelta: 0,
            oppPtsDelta: 0,
            playerStatsDelta: { reb: 1, minutes: minIncrement },
          });
        } else if (teamRoll < 0.28 * userScale) {
          events.push({
            id: `q${q}_play_${eventCount}`,
            quarter: q,
            targetSeconds: currentSec,
            timeStr,
            text: `${userTeam.name} 队友接球晃开防守，中距离拔起稳稳破网！`,
            type: 'user',
            userPtsDelta: 2,
            oppPtsDelta: 0,
            playerStatsDelta: isOnCourtNow ? { minutes: minIncrement } : undefined,
          });
        } else if (teamRoll < 0.42 * userScale) {
          events.push({
            id: `q${q}_play_${eventCount}`,
            quarter: q,
            targetSeconds: currentSec,
            timeStr,
            text: `${userTeam.name} 传导球出空位，队友底角三分破网！`,
            type: 'user',
            userPtsDelta: 3,
            oppPtsDelta: 0,
            playerStatsDelta: isOnCourtNow ? { minutes: minIncrement } : undefined,
          });
        } else {
          events.push({
            id: `q${q}_play_${eventCount}`,
            quarter: q,
            targetSeconds: currentSec,
            timeStr,
            text: `${userTeam.name} 战术配合进攻拉开，可惜抛投打板砸筐打铁。`,
            type: 'user',
            userPtsDelta: 0,
            oppPtsDelta: 0,
            playerStatsDelta: isOnCourtNow ? { minutes: minIncrement } : undefined,
          });
        }
      }
    } else {
      // Away team possession (Opponent action)
      const oppRoll = Math.random();
      const pStlUser = isOnCourtNow && Math.random() < (qTargetStl / Math.max(1, onCourtSlotsInQ * 0.4));
      const pBlkUser = isOnCourtNow && Math.random() < (qTargetBlk / Math.max(1, onCourtSlotsInQ * 0.4));

      if (pStlUser) {
        events.push({
          id: `q${q}_play_${eventCount}`,
          quarter: q,
          targetSeconds: currentSec,
          timeStr,
          text: `对手传球路线被预判！${userStarName} 横空杀出飞身抢断推进快攻！`,
          type: 'highlight',
          userPtsDelta: 0,
          oppPtsDelta: 0,
          playerStatsDelta: { stl: 1, minutes: minIncrement },
        });
      } else if (pBlkUser) {
        events.push({
          id: `q${q}_play_${eventCount}`,
          quarter: q,
          targetSeconds: currentSec,
          timeStr,
          text: `对手强突上篮，${userStarName} 补防拔地而起送出火辣大帽！`,
          type: 'highlight',
          userPtsDelta: 0,
          oppPtsDelta: 0,
          playerStatsDelta: { blk: 1, minutes: minIncrement },
        });
      } else if (oppRoll < 0.28 * oppScale) {
        events.push({
          id: `q${q}_play_${eventCount}`,
          quarter: q,
          targetSeconds: currentSec,
          timeStr,
          text: `${oppTeam.name} 挡拆后高位急停跳投得手。`,
          type: 'away',
          userPtsDelta: 0,
          oppPtsDelta: 2,
          playerStatsDelta: isOnCourtNow ? { minutes: minIncrement } : undefined,
        });
      } else if (oppRoll < 0.42 * oppScale) {
        events.push({
          id: `q${q}_play_${eventCount}`,
          quarter: q,
          targetSeconds: currentSec,
          timeStr,
          text: `${oppTeam.name} 外线接球果断出手，三分空心入网。`,
          type: 'away',
          userPtsDelta: 0,
          oppPtsDelta: 3,
          playerStatsDelta: isOnCourtNow ? { minutes: minIncrement } : undefined,
        });
      } else {
        events.push({
          id: `q${q}_play_${eventCount}`,
          quarter: q,
          targetSeconds: currentSec,
          timeStr,
          text: `${oppTeam.name} 强行攻筐受干扰偏出。`,
          type: 'away',
          userPtsDelta: 0,
          oppPtsDelta: 0,
          playerStatsDelta: isOnCourtNow ? { minutes: minIncrement } : undefined,
        });
      }
    }

    eventCount++;
    const interval = Math.floor(Math.random() * 7) + 16;
    currentSec -= interval;
  }

  // Distribute the full-game target across four quarters. The previous logic
  // counted rebounds only on a narrow subset of teammate possessions and then
  // multiplied by another 15% gate, while recording no defensive rebounds.
  const baseQuarterRebounds = Math.floor(targetGameReb / 4);
  const quarterReboundTarget = baseQuarterRebounds + (q <= targetGameReb % 4 ? 1 : 0);
  reconcileQuarterRebounds(events, q, assignedMPG, quarterReboundTarget, userStarName);
  const baseQuarterFta = Math.floor(targetGameFta / 4);
  const quarterFta = baseQuarterFta + (q <= targetGameFta % 4 ? 1 : 0);
  const baseQuarterFtm = Math.floor(targetGameFtm / 4);
  const quarterFtm = Math.min(quarterFta, baseQuarterFtm + (q <= targetGameFtm % 4 ? 1 : 0));
  addQuarterFreeThrows(events, q, assignedMPG, quarterFta, quarterFtm, userStarName);

  const quarterTarget = calculatedMatch.quarters[q - 1];
  if (quarterTarget) {
    reconcileQuarterTeamScore(events, q, 'user', quarterTarget.user, userTeam.name);
    reconcileQuarterTeamScore(events, q, 'opp', quarterTarget.opp, oppTeam.name);
  }

  // Insert Buzzer Beater Event at 00:04 in Q4 if triggered
  if (q === 4 && isBuzzerBeaterGame) {
    events.push({
      id: `q4_buzzer_beater`,
      quarter: 4,
      targetSeconds: 4,
      timeStr: '00:04',
      text: `🚨【终场压哨绝杀时刻！】全场比赛仅剩 4.0 秒，${userTeam.name} 暂落后 1 分！主教练单手拍桌高呼暂停，全场两万名球迷全体起立呐喊！作为球队绝对战术核心，全队的胜负与命运交到了你的手中！`,
      type: 'highlight',
      userPtsDelta: 0,
      oppPtsDelta: 0,
      isBuzzerBeaterTrigger: true,
    });
  }

  // Sort events descending by targetSeconds (720 -> 0)
  events.sort((a, b) => b.targetSeconds - a.targetSeconds);

  return events;
}
