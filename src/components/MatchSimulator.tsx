import React, { useState, useEffect, useRef } from 'react';
import { PlayerProfile, Team, MatchLog, MatchBoxScore } from '../types';
import { getUserMinutesAndRole, simulatePlayerMatchStats, calculateMatchScores, calculateTeamUsageContext } from '../utils/leagueLogic';
import { Play, Sparkles, Flame, UserCheck, Pause, FastForward } from 'lucide-react';

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
    turnovers?: number;
    minutes?: number;
  };
  isTacticalTrigger?: boolean;
  isBuzzerBeaterTrigger?: boolean;
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
  isBuzzerBeaterGame: boolean = false
): ScheduledQuarterEvent[] {
  const events: ScheduledQuarterEvent[] = [];
  const userStarName = player.name;
  const oppStarName = oppTeam.starPlayer ? oppTeam.starPlayer.split('&')[0].trim() : '对位球星';
  const attrs = player.attributes;

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
  const calculatedMatch = calculateMatchScores(userTeam, oppTeam, player.currentTeamId);
  const targetUserScore = calculatedMatch.teamAScore;
  const targetOppScore = calculatedMatch.teamBScore;

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
  const userActionProb = Math.min(0.65, Math.max(0.08, (qTargetFga + qTargetAst + qTargetTov) / Math.max(2, onCourtSlotsInQ * 0.5)));

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
        const tot = Math.max(0.1, qTargetFga + qTargetAst + qTargetTov);
        const p3 = qTarget3pa / tot;
        const p2 = (qTargetFga - qTarget3pa) / tot;
        const pAst = qTargetAst / tot;
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

        if (pRebUser && teamRoll < 0.15) {
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

      if (pStlUser && oppRoll < 0.12) {
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
      } else if (pBlkUser && oppRoll < 0.22) {
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

const generateTacticalOptions = (player: PlayerProfile, quarter: number): TacticalOption[] => {
  const pos = player.position || 'PG';
  const attrs = player.attributes;
  const morale = player.morale || 70;
  const name = player.name;

  const clampProb = (val: number) => {
    const mBonus = (morale - 50) * 0.001;
    return Math.min(0.88, Math.max(0.22, val + mBonus));
  };

  const pgPool: TacticalOption[] = [
    {
      id: 'pg_pnr_drive',
      title: '⚡ 挡拆极速突破拉杆上篮',
      desc: '借中锋高位掩护第一步爆发刺穿防线，直杀禁区打高板拉杆！',
      prob: clampProb((attrs.ballHandle * 0.4 + attrs.layup * 0.4 + attrs.speed * 0.2) / 100),
      statType: 'pts2',
      fanReward: 220,
      xpReward: 80,
      successText: `⚡ 变向极速撕裂！${name} 第一步刺穿防线拉杆避开封盖将球挑入网窝！`,
      failText: `❌ ${name} 强行突破深入遭到内线收缩包夹，抛投砸在后沿弹开。`,
    },
    {
      id: 'pg_pnr_pullup3',
      title: '🎯 挡拆弧顶拔起三分',
      desc: '防守者选择绕后防守，果断在三分线外弧顶干拔冷血出手！',
      prob: clampProb((attrs.threePoint * 0.7 + attrs.ballHandle * 0.2 + attrs.freeThrow * 0.1) / 100),
      statType: 'pts3',
      fanReward: 320,
      xpReward: 100,
      successText: `🎯 惩罚绕后防守！${name} 抓准一丝空隙弧顶干拔三分空心落网，引爆全场！`,
      failText: `❌ ${name} 弧顶干拔三分受到长臂干扰，砸筐弹出。`,
    },
    {
      id: 'pg_needle_pass',
      title: '🎯 手术刀击地击穿分球',
      desc: '吸引两人包夹后，不看人击地手术刀妙传底角空位！',
      prob: clampProb((attrs.passing * 0.7 + attrs.ballHandle * 0.3) / 100),
      statType: 'ast',
      fanReward: 200,
      xpReward: 75,
      successText: `🎯 大脑级视野！${name} 击地妙传穿透两人防线，队友空位三分手起刀落！`,
      failText: `❌ ${name} 的分球意图被对手防守预判破坏打出界外。`,
    },
    {
      id: 'pg_press_steal',
      title: '⚡ 全场高位死亡缠绕抢断',
      desc: '贴身死磕对手控卫，精准预判运球轨迹下手生剥断球！',
      prob: clampProb((attrs.steal * 0.5 + attrs.perimeterDef * 0.3 + attrs.speed * 0.2) / 100),
      statType: 'stl',
      fanReward: 250,
      xpReward: 90,
      successText: `⚡ 死亡缠绕生剥！${name} 快如闪电抢断成功，一条龙快攻单手暴扣！`,
      failText: `❌ ${name} 上抢过于凶狠被吹罚防守犯规。`,
    },
    {
      id: 'pg_stepback_mid',
      title: '🔥 招牌交叉步后撤步中投',
      desc: '连续体前变向点飞防守重心，拉开空间后撤步后仰跳投！',
      prob: clampProb((attrs.midRange * 0.6 + attrs.ballHandle * 0.4) / 100),
      statType: 'pts2',
      fanReward: 260,
      xpReward: 85,
      successText: `🔥 晃开两米空间！${name} 招牌后撤步中距离美如画跳投打进！`,
      failText: `❌ ${name} 后撤步幅度过大导致跳投出手失去平衡。`,
    },
    {
      id: 'pg_deep_logo_3',
      title: '🎯 Logo超远穿云箭三分',
      desc: '刚过半场中圈Logo位置不减速，抬手轰出超远穿云箭三分！',
      prob: clampProb((attrs.threePoint * 0.8 + attrs.ballHandle * 0.2) / 100),
      statType: 'pts3',
      fanReward: 400,
      xpReward: 120,
      successText: `🎯 库里式超远射程！${name} 在Logo标志区刚过半场直接出手，三分空心穿针！`,
      failText: `❌ ${name} 超远三分距离过远，打在筐前沿弹开。`,
    },
  ];

  const sgPool: TacticalOption[] = [
    {
      id: 'sg_catch_shoot_3',
      title: '🎯 卷切无球接球三分',
      desc: '通过底线双掩护无球跑位，接球瞬间毫不犹豫扬手就射！',
      prob: clampProb((attrs.threePoint * 0.75 + attrs.speed * 0.25) / 100),
      statType: 'pts3',
      fanReward: 300,
      xpReward: 95,
      successText: `🎯 顶级无球神射！${name} 甩开追防接球即投，三分如利箭穿心！`,
      failText: `❌ ${name} 跑位受阻接球稍慢，强行拔起三分偏出。`,
    },
    {
      id: 'sg_fastbreak_dunk',
      title: '⚡ 反击前场双手劈扣',
      desc: '抢下反击第一点全速下钻，前场腾空双手战斧劈扣！',
      prob: clampProb((attrs.layup * 0.5 + attrs.speed * 0.3 + attrs.insideFinish * 0.2) / 100),
      statType: 'pts2',
      fanReward: 280,
      xpReward: 90,
      successText: `⚡ 暴力血扣！${name} 前场一飞冲天，双手战斧劈扣炸响篮筐！`,
      failText: `❌ ${name} 冲筐被追身回防破坏未直接打进。`,
    },
    {
      id: 'sg_transition_3',
      title: '🎯 转换快攻急停追魂三分',
      desc: '快攻转换中不减速，三分线外追魂急停拔起就射！',
      prob: clampProb((attrs.threePoint * 0.75 + attrs.speed * 0.25) / 100),
      statType: 'pts3',
      fanReward: 330,
      xpReward: 105,
      successText: `🎯 追魂三分！${name} 快攻转换追魂急停三分手起刀落，百步穿杨！`,
      failText: `❌ ${name} 追魂三分出手过急打在后沿弹开。`,
    },
  ];

  const sfPool: TacticalOption[] = [
    {
      id: 'sf_iso_drive',
      title: '⚡ 45度单打碾压冲框',
      desc: '45度角持球单打，身体强行卡开防守者开路冲向篮筐！',
      prob: clampProb((attrs.layup * 0.4 + attrs.strength * 0.3 + attrs.ballHandle * 0.3) / 100),
      statType: 'pts2',
      fanReward: 250,
      xpReward: 85,
      successText: `⚡ 坦克推进！${name} 身体开路碾压防守，空中硬抗对抗上篮打进！`,
      failText: `❌ ${name} 强强撞击后失衡上篮弹偏。`,
    },
    {
      id: 'sf_chasedown_block',
      title: '🛡️ 追身飞身钉板大帽',
      desc: '对手快攻反击，全速回追从后方高高跃起送出钉板血帽！',
      prob: clampProb((attrs.block * 0.5 + attrs.speed * 0.3 + attrs.perimeterDef * 0.2) / 100),
      statType: 'blk',
      fanReward: 300,
      xpReward: 100,
      successText: `🛡️ 排球式钉板血帽！${name} 从天而降将对手上篮扇飞出底线！全场欢呼！`,
      failText: `❌ ${name} 追身打在对手手臂上被吹犯规。`,
    },
    {
      id: 'sf_corner_dagger',
      title: '🎯 底角杀人诛心三分',
      desc: '底角静候战术转移，接球冷血扬手发射三分！',
      prob: clampProb((attrs.threePoint * 0.85 + attrs.freeThrow * 0.15) / 100),
      statType: 'pts3',
      fanReward: 310,
      xpReward: 100,
      successText: `🎯 冷血杀手！${name} 底角三分手起刀落，比分瞬间拉开！`,
      failText: `❌ ${name} 底角三分弹在前沿砸偏。`,
    },
  ];

  const pfPool: TacticalOption[] = [
    {
      id: 'pf_pnr_dunk',
      title: '⚡ 挡拆顺下战斧双手暴扣',
      desc: '高位挡拆后极速下钻顺下，接球无缝腾空双手战斧劈扣！',
      prob: clampProb(((attrs.insideFinish || 60) * 0.4 + (attrs.vertical || 60) * 0.3 + attrs.strength * 0.3) / 100),
      statType: 'pts2',
      fanReward: 270,
      xpReward: 90,
      successText: `⚡ 战斧轰炸！${name} 空中接球起飞，双手暴扣把篮筐砸得巨响！`,
      failText: `❌ ${name} 顺下接球被内线强硬顶住切球。`,
    },
    {
      id: 'pf_post_fadeaway',
      title: '🏛️ 低位背身晃步后仰中投',
      desc: '背身顶开防守人，标志性晃步后仰跳投高弧线命中！',
      prob: clampProb(((attrs.postMove || 60) * 0.5 + attrs.midRange * 0.3 + attrs.strength * 0.2) / 100),
      statType: 'pts2',
      fanReward: 280,
      xpReward: 90,
      successText: `🏛️ 美如画后仰！${name} 背身脚步戏耍防守，标志性后仰跳投空心入网！`,
      failText: `❌ ${name} 低位背身转身角度偏小，跳投砸在前沿。`,
    },
    {
      id: 'pf_pick_pop_3',
      title: '🎯 挡拆外弹弧顶三分破密防',
      desc: '高位掩护后外弹弧顶三分线，接球惩罚沉退防守！',
      prob: clampProb((attrs.threePoint * 0.8 + attrs.midRange * 0.2) / 100),
      statType: 'pts3',
      fanReward: 320,
      xpReward: 100,
      successText: `🎯 空间大前杀招！${name} 挡拆后外弹弧顶，三分命中破沉退防守！`,
      failText: `❌ ${name} 外弹三分稍慢受封盖偏出。`,
    },
  ];

  const cPool: TacticalOption[] = [
    {
      id: 'c_post_hook',
      title: '🔥 低位背打招牌天勾',
      desc: '低位靠住防守队员，转过身来伸出长臂招牌勾手投篮！',
      prob: clampProb(((attrs.postMove || 60) * 0.6 + (attrs.insideFinish || 60) * 0.2 + attrs.strength * 0.2) / 100),
      statType: 'pts2',
      fanReward: 260,
      xpReward: 85,
      successText: `🔥 无法阻挡的天勾！${name} 低位背打转身勾手，高弧线空心落网！`,
      failText: `❌ ${name} 勾手出手弧线欠佳砸筐。`,
    },
    {
      id: 'c_rim_protection_block',
      title: '🛡️ 禁区遮天蔽日原地血帽',
      desc: '正面迎战对方攻筐，高高举起长臂在空中直接按死！',
      prob: clampProb((attrs.block * 0.4 + (attrs.interiorDef || 60) * 0.4 + (attrs.vertical || 60) * 0.2) / 100),
      statType: 'blk',
      fanReward: 320,
      xpReward: 100,
      successText: `🛡️ 遮天蔽日！${name} 原地起飞单手把对手的扣篮硬按死在空中！`,
      failText: `❌ ${name} 护筐动作稍慢被打进吹犯规。`,
    },
    {
      id: 'c_reb_putback',
      title: '💥 冲抢前场篮板二次补扣',
      desc: '在卡位人群中预判落点腾空起跳，力压群雄双手暴力补扣得分！',
      prob: clampProb(((attrs.rebounding || 60) * 0.5 + (attrs.vertical || 60) * 0.3 + attrs.strength * 0.2) / 100),
      statType: 'pts2',
      fanReward: 290,
      xpReward: 95,
      successText: `💥 禁区统治者！${name} 在人群头顶高高跃起抓下前场篮板，顺势双手暴力补扣打进！`,
      failText: `❌ ${name} 拼抢前场篮板时卡位失误，皮球弹出底线。`,
    },
  ];

  let rawPool = pgPool;
  if (pos === 'SG') rawPool = sgPool;
  if (pos === 'SF') rawPool = sfPool;
  if (pos === 'PF') rawPool = pfPool;
  if (pos === 'C') rawPool = cPool;

  const shuffled = [...rawPool].sort(() => Math.random() - 0.5);
  const pickedThree = shuffled.slice(0, 3);

  const neutralOption: TacticalOption = {
    id: 'neutral_safe_play',
    title: '🛡️ 稳健导球遵从战术 (100% 成功)',
    desc: '遵从主教练安排，稳稳将球传给受应队友，不强打风险球，保持团队战术纪律与攻防阵型。',
    prob: 1.0,
    isNeutral: true,
    fanReward: 50,
    xpReward: 40,
    statType: 'none',
    successText: `✅ 【团队战术稳健执行】 ${name} 遵从教练指示将球稳稳分出，队友空位接球打进！保持了良好的团队战术纪律。(粉丝 +50 / 经验 +40)`,
    failText: '',
  };

  return [...pickedThree, neutralOption];
};

interface MatchSimulatorProps {
  player: PlayerProfile;
  userTeam: Team;
  oppTeam: Team;
  isInteractive: boolean;
  isPlayoffs: boolean;
  currentYear?: number;
  onFinishMatch: (boxScore: MatchBoxScore) => void;
}

export const MatchSimulator: React.FC<MatchSimulatorProps> = ({
  player,
  userTeam,
  oppTeam,
  isInteractive,
  isPlayoffs,
  currentYear = 2008,
  onFinishMatch,
}) => {
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
  const { minutes: assignedMPG, role: userRole } = getUserMinutesAndRole(userTeam, player);

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
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    const intervalTimeMs = 100; // Tick every 100ms

    const timer = setInterval(() => {
      setRemainingSeconds((prevSecs) => {
        if (prevSecs <= 0) {
          setQuarterSimulated(true);
          setIsSimulating(false);
          return 0;
        }

        const nextSecs = Math.max(0, prevSecs - speedMultiplier);

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
    }, intervalTimeMs);

    return () => clearInterval(timer);
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
    let ratingGrade: MatchBoxScore['playerStats']['ratingGrade'] = 'B';
    if (pts >= 35) ratingGrade = 'S+';
    else if (pts >= 28) ratingGrade = 'S';
    else if (pts >= 22) ratingGrade = 'A+';
    else if (pts >= 16) ratingGrade = 'A';
    else if (pts < 10) ratingGrade = 'C';

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
      isBuzzerBeaterWin,
    };

    onFinishMatch(boxScore);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#11141b] border-2 border-amber-500/40 rounded-2xl p-3 sm:p-6 max-w-4xl w-full shadow-2xl relative space-y-2.5 sm:space-y-4 max-h-[95vh] overflow-y-auto">
        {/* Header Title */}
        <div className="flex items-center gap-2 border-b border-[#232834] pb-2 sm:pb-3">
          <span className="p-1.5 sm:p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-black italic uppercase text-white tracking-tight truncate">
              <span className="hidden sm:inline">比赛现场实况 (LIVE MATCH MODAL)</span>
              <span className="sm:hidden">比赛现场实况</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              {userTeam.name} VS {oppTeam.name}
            </p>
          </div>
        </div>

        {/* PROMINENT CENTER PIECE: QUARTER & COUNTDOWN TIMER PANEL */}
        <div className="bg-gradient-to-b from-[#161a24] to-[#0d1017] border-2 border-amber-500/50 rounded-2xl p-3 sm:p-5 shadow-2xl relative overflow-hidden text-center space-y-2 sm:space-y-3">
          {/* Status Indicator Bar */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs border-b border-[#232834] pb-1.5 sm:pb-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-slate-400 font-bold hidden sm:inline">对阵赛事:</span>
              <span className="text-amber-400 font-bold">
                {isPlayoffs ? `${currentYear} 季后赛` : `${currentYear} 常规赛`}
              </span>
            </div>

            {/* Live Simulation Status Badge */}
            <div className="flex items-center gap-2">
              {!hasStarted ? (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] sm:text-[11px] font-bold border border-slate-700">
                  ⏳ 等待跳球
                </span>
              ) : showQuarterEvent ? (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] sm:text-[11px] font-bold border border-amber-500/40 animate-pulse">
                  ⏸️ 战术决策
                </span>
              ) : isSimulating ? (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  🟢 推进中 ({speedMultiplier}x)
                </span>
              ) : quarterSimulated ? (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] sm:text-[11px] font-bold border border-blue-500/40">
                  🏁 第 {currentQuarter} 节结束
                </span>
              ) : (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] sm:text-[11px] font-bold border border-slate-700">
                  ⏸️ 已暂停
                </span>
              )}
            </div>
          </div>

          {/* MAIN CENTER DISPLAY: QUARTER & COUNTDOWN CLOCK */}
          <div className="py-1 sm:py-2 flex flex-col items-center justify-center space-y-1">
            <div className="text-xs sm:text-sm font-black italic uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <span className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-mono shadow-inner text-[10px] sm:text-xs">
                第 {currentQuarter} 节<span className="hidden sm:inline"> (QUARTER {currentQuarter} / 4)</span>
              </span>
            </div>

            {/* COUNTDOWN CLOCK */}
            <div className="text-3xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(245,158,11,0.4)] bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-transparent py-0.5 sm:py-1">
              {formatTime(remainingSeconds)}
            </div>

            {/* TEAM SCORES */}
            <div className="flex items-center justify-center gap-4 sm:gap-14 pt-1 sm:pt-2">
              <div className="text-center">
                <span className="text-[11px] sm:text-xs text-slate-400 font-bold block">{userTeam.name}</span>
                <span className="text-2xl sm:text-5xl font-black font-mono text-amber-400 drop-shadow">{userScore}</span>
              </div>
              <span className="text-xs sm:text-base font-black italic text-slate-600">VS</span>
              <div className="text-center">
                <span className="text-[11px] sm:text-xs text-slate-400 font-bold block">{oppTeam.name}</span>
                <span className="text-2xl sm:text-5xl font-black font-mono text-cyan-400 drop-shadow">{oppScore}</span>
              </div>
            </div>
          </div>

          {/* SIMULATION SPEED & CONTROLS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 sm:pt-3 border-t border-[#232834] gap-2">
            <div className="flex items-center justify-center sm:justify-start gap-1">
              <span className="text-[10px] text-slate-400 font-bold mr-1">倍速:</span>
              {[
                { label: '1x', mult: 1 },
                { label: '2x', mult: 2 },
                { label: '4x', mult: 4 },
                { label: '8x', mult: 8 },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSpeedMultiplier(s.mult)}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] font-mono font-bold rounded-lg border transition-all ${
                    speedMultiplier === s.mult
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                      : 'bg-[#11141b] text-slate-400 border-[#232834] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* ACTION / CONTROL BUTTONS */}
            <div className="flex items-center justify-center gap-2">
              {!hasStarted ? (
                <button
                  onClick={startMatchSimulation}
                  className="w-full sm:w-auto justify-center px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black italic rounded-xl text-xs uppercase tracking-wider shadow-xl flex items-center gap-1.5 transition-transform active:scale-95 animate-bounce"
                >
                  <Play className="w-4 h-4 fill-black shrink-0" />
                  <span>🏀 开始比赛<span className="hidden sm:inline"> (JUMP BALL)</span></span>
                </button>
              ) : quarterSimulated ? (
                <button
                  onClick={handleNextQuarterOrFinish}
                  className="w-full sm:w-auto justify-center px-4 sm:px-6 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs uppercase tracking-wider shadow-xl flex items-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>
                    {currentQuarter < 4
                      ? `进入第 ${currentQuarter + 1} 节`
                      : '查看全场战报'}
                  </span>
                  <Play className="w-4 h-4 fill-black shrink-0" />
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    disabled={showQuarterEvent}
                    className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-1.5 bg-[#11141b] hover:bg-[#1a202c] text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>暂停</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span>继续</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={quickSimulateCurrentQuarter}
                    disabled={showQuarterEvent}
                    className="flex-1 sm:flex-initial justify-center px-3 sm:px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="一键快速推导本节剩余日志"
                  >
                    <FastForward className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>⚡ 快速完成本节</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ON-COURT / ON-BENCH STATUS BANNER */}
        {currentlyOnCourt ? (
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border border-emerald-500/80 rounded-2xl flex items-center justify-between text-emerald-300 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="px-2.5 sm:px-3 py-1 bg-emerald-500 text-black rounded-xl font-black text-[11px] sm:text-xs flex items-center gap-1 shadow-md shrink-0">
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black shrink-0" /> 🏀 【登场比赛】
              </span>
              <div>
                <div className="text-xs sm:text-sm font-black text-white">
                  场上比赛中 ({userRole} · {assignedMPG}分钟/场)
                </div>
                <div className="hidden sm:block text-[11px] text-emerald-300">
                  第 {currentQuarter} 节进球、抢断与战术抉择将直接决定比赛胜负与个人数据。
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 rounded-2xl flex items-center justify-between text-amber-300 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="px-2.5 sm:px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1 shrink-0">
                🪑 【替补席】
              </span>
              <div>
                <div className="text-xs sm:text-sm font-black text-amber-300">
                  替补席休整 (当前角色: {userRole})
                </div>
                <div className="hidden sm:block text-[11px] text-slate-400">
                  提升个人能力值与同位置表现，可进一步增加你的轮换上场时间。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player Personal Stats Bar */}
        <div className="bg-[#0d1017] border border-[#232834] p-2.5 sm:p-3 rounded-xl border-amber-500/20">
          <div className="flex items-center justify-between text-xs mb-1.5 sm:mb-2">
            <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px] sm:text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {player.name} 个人数据:
            </span>
            <span className="font-mono text-slate-400 text-[10px] sm:text-[11px]">
              {playedMinutes}m · 粉丝+{earnedFans} · XP+{earnedXp}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5 sm:gap-2 text-center text-xs">
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">得分</span>
              <span className="font-black text-amber-400 text-xs sm:text-sm font-mono">{pts}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">篮板</span>
              <span className="font-black text-blue-400 text-xs sm:text-sm font-mono">{reb}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">助攻</span>
              <span className="font-black text-emerald-400 text-xs sm:text-sm font-mono">{ast}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">抢断</span>
              <span className="font-black text-purple-400 text-xs sm:text-sm font-mono">{stl}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834]">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">盖帽</span>
              <span className="font-black text-cyan-400 text-xs sm:text-sm font-mono">{blk}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834] hidden sm:block">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">命中</span>
              <span className="font-bold text-slate-200 font-mono text-xs">{fgm}/{fga}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834] hidden sm:block">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">三分</span>
              <span className="font-bold text-slate-200 font-mono text-xs">{tpm}/{tpa}</span>
            </div>
            <div className="bg-[#11141b] p-1 sm:p-1.5 rounded border border-[#232834] hidden sm:block">
              <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase font-bold">失误</span>
              <span className="font-bold text-red-400 font-mono text-xs">{turnovers}</span>
            </div>
          </div>
        </div>

        {/* BUZZER BEATER POPUP MODAL */}
        {showBuzzerBeaterModal && (
          <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[#11141b] border-2 border-red-500 rounded-2xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-3 sm:space-y-4 relative">
              <div className="flex items-center justify-between border-b border-[#232834] pb-2 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="p-1.5 sm:p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
                    <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 animate-bounce" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-lg font-black italic text-red-400 uppercase tracking-tight flex items-center gap-2">
                      🚨 终场绝杀时刻 (BUZZER BEATER)
                    </h3>
                    <span className="text-[11px] sm:text-xs text-amber-300 font-mono font-bold">
                      全场剩余: 00:04 · 实时比分: {userTeam.name} {userScore} - {oppScore} {oppTeam.name}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs bg-red-500/20 text-red-300 border border-red-500/40 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold shrink-0">
                  绝杀事件
                </span>
              </div>

              <div className="p-3 sm:p-3.5 bg-gradient-to-r from-red-950/40 via-[#0d1017] to-red-950/40 border border-red-500/30 rounded-xl text-xs text-slate-200 leading-relaxed">
                🚨 全场仅剩 <span className="text-red-400 font-black font-mono">4.0秒</span>！球队落后 1 分！选择你的绝杀出手方式（<span className="text-amber-400 font-bold">成功率 30%</span>，获 <span className="text-emerald-400 font-bold">+3倍粉丝</span> & <span className="text-amber-400 font-bold">+3属性点</span>）：
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleBuzzerBeaterChoice('3pt')}
                  className="p-3 sm:p-4 rounded-xl border-2 border-amber-500/50 hover:border-amber-400 bg-gradient-to-r from-amber-950/30 to-[#161a24] hover:from-amber-900/40 transition-all text-left group shadow-lg flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-black text-amber-300 group-hover:text-amber-200 flex items-center gap-2">
                      🎯 1. 弧顶强行干拔三分绝杀
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">
                      顶着两人死缠包夹强行拔树跳投，向死而生高高弧线轰向篮筐！
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2 sm:ml-3">
                    <span className="text-[10px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 block">
                      30% 成功率
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono block mt-0.5 sm:mt-1 font-bold">
                      +3倍粉丝 & +3属性点
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleBuzzerBeaterChoice('mid')}
                  className="p-3 sm:p-4 rounded-xl border-2 border-amber-500/50 hover:border-amber-400 bg-gradient-to-r from-amber-950/30 to-[#161a24] hover:from-amber-900/40 transition-all text-left group shadow-lg flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-black text-amber-300 group-hover:text-amber-200 flex items-center gap-2">
                      🔥 2. 招牌后撤步中距离漂移绝杀
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">
                      连续交叉步晃开重心，后撤步极限滞空漂移中距离压哨！
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2 sm:ml-3">
                    <span className="text-[10px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 block">
                      30% 成功率
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono block mt-0.5 sm:mt-1 font-bold">
                      +3倍粉丝 & +3属性点
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleBuzzerBeaterChoice('layup')}
                  className="p-3 sm:p-4 rounded-xl border-2 border-amber-500/50 hover:border-amber-400 bg-gradient-to-r from-amber-950/30 to-[#161a24] hover:from-amber-900/40 transition-all text-left group shadow-lg flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs sm:text-sm font-black text-amber-300 group-hover:text-amber-200 flex items-center gap-2">
                      🚀 3. 强突禁区抗人拉杆抛投绝杀
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">
                      第一步刺穿第一道防线直钻内线，空中强抗对抗打高板抛投！
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2 sm:ml-3">
                    <span className="text-[10px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 block">
                      30% 成功率
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono block mt-0.5 sm:mt-1 font-bold">
                      +3倍粉丝 & +3属性点
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quarterly Tactical Event POPUP MODAL */}
        {showQuarterEvent && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
            <div className="bg-[#11141b] border-2 border-amber-500/80 rounded-2xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-3 sm:space-y-4 relative">
              <div className="flex items-center justify-between border-b border-[#232834] pb-2 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-base font-black italic text-white uppercase tracking-tight">
                      第 {currentQuarter} 节战术抉择
                    </h3>
                    <span className="text-[10px] sm:text-[11px] text-amber-400 font-mono font-bold">
                      比分: {userTeam.name} {userScore} - {oppScore} {oppTeam.name}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold shrink-0">
                  关键决策
                </span>
              </div>

              {!eventProcessed ? (
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="p-2.5 sm:p-3 bg-[#0d1017] border border-[#232834] rounded-xl text-xs text-slate-300 leading-relaxed">
                    🏀 第 <span className="text-amber-400 font-bold">{currentQuarter}</span> 节关键回合！选择战术选项，成功可获 <span className="text-amber-400 font-bold">属性点 +1</span> 与额外粉丝收益：
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {currentTacticalOptions.map((opt) => {
                      const isHighProb = opt.prob >= 0.75;
                      const isMedProb = opt.prob >= 0.50;

                      let borderStyle = 'border-amber-500/30 hover:border-amber-400';
                      let badgeStyle = 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                      if (opt.isNeutral) {
                        borderStyle = 'border-blue-500/30 hover:border-blue-400 bg-[#121826]';
                        badgeStyle = 'text-blue-300 bg-blue-500/10 border-blue-500/30';
                      } else if (isHighProb) {
                        borderStyle = 'border-emerald-500/30 hover:border-emerald-400';
                        badgeStyle = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                      } else if (isMedProb) {
                        borderStyle = 'border-amber-500/30 hover:border-amber-400';
                        badgeStyle = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                      } else {
                        borderStyle = 'border-purple-500/30 hover:border-purple-400';
                        badgeStyle = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleTacticalChoiceOption(opt)}
                          className={`p-2.5 sm:p-3.5 rounded-xl border bg-[#161a24] hover:bg-[#1f2535] transition-all text-left group shadow-md ${borderStyle}`}
                        >
                          <div className="flex justify-between items-center mb-1 gap-1.5">
                            <span className="text-xs font-black text-amber-300 group-hover:text-amber-200 truncate">
                              {opt.title}
                            </span>
                            <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded border shrink-0 ${badgeStyle}`}>
                              成功率 {(opt.prob * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {opt.desc}
                          </p>
                          <div className="mt-1.5 text-[9px] sm:text-[10px] text-amber-400/80 font-mono flex items-center gap-2">
                            <span>奖励: {!opt.isNeutral ? '属性点+1 / ' : ''}粉丝+{opt.fanReward}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-[#0d1017] p-3 sm:p-4 rounded-xl border border-amber-500/40 text-xs text-amber-300 font-bold leading-relaxed shadow-lg">
                    {eventFeedback}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowQuarterEvent(false);
                      setEventProcessed(false);
                      setEventFeedback(null);
                      setIsSimulating(true); // Resume simulation
                    }}
                    className="w-full py-3 sm:py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs uppercase tracking-tight shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>确认战术结果，继续比赛</span>
                    <Play className="w-4 h-4 fill-black shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Play-by-Play Logs */}
        <div className="bg-[#0d1017] border border-[#232834] rounded-2xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
          <div className="text-xs font-black italic uppercase text-slate-300 flex items-center justify-between border-b border-[#232834] pb-1.5 sm:pb-2">
            <span>
              <span className="hidden sm:inline">比赛解说实时日志 (LIVE PLAY-BY-PLAY)</span>
              <span className="sm:hidden">比赛解说实时日志</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400">已推演 {logs.length} 条</span>
          </div>

          <div className="max-h-36 sm:max-h-52 overflow-y-auto space-y-1 sm:space-y-1.5 text-xs pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-[11px] flex items-center justify-between transition-all ${
                  log.type === 'highlight'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold shadow-sm'
                    : log.type === 'user'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : log.type === 'system'
                    ? 'bg-blue-950/20 border-blue-500/30 text-blue-300 font-bold'
                    : 'bg-[#11141b] border-[#232834] text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="font-mono text-amber-400/80 text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 bg-black/40 rounded border border-[#232834] shrink-0">
                    Q{log.quarter} {log.time}
                  </span>
                  <span className="truncate">{log.text}</span>
                </div>
                {log.points && (
                  <span className="font-mono font-black text-amber-400 text-[9px] sm:text-[10px] shrink-0 ml-1.5 sm:ml-2">
                    +{log.points}分
                  </span>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
