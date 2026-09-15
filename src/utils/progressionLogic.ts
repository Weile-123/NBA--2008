import { Team, RosterPlayer, PlayerProfile } from '../types';
import { syncPlayerAgeDecay } from './calc2k';
import { calculateTeamPowerRating } from './leagueLogic';

export interface SuperstarAgingConfig {
  slowDeclineRate: number; // Annual OVR decline rate past peak
  minFloorOvr: number;     // Minimum rating floor
}

export const SUPERSTAR_AGING_MAP: Record<string, SuperstarAgingConfig> = {
  '勒布朗·詹姆斯': { slowDeclineRate: 0.6, minFloorOvr: 89 },
  '斯蒂芬·库里': { slowDeclineRate: 0.7, minFloorOvr: 87 },
  '凯文·杜兰特': { slowDeclineRate: 0.7, minFloorOvr: 87 },
  '科比·布莱恩特': { slowDeclineRate: 0.8, minFloorOvr: 86 },
  '蒂姆·邓肯': { slowDeclineRate: 0.8, minFloorOvr: 85 },
  '德克·诺维茨基': { slowDeclineRate: 0.9, minFloorOvr: 84 },
  '尼古拉·约基奇': { slowDeclineRate: 0.7, minFloorOvr: 88 },
  '扬尼斯·阿德托昆博': { slowDeclineRate: 0.7, minFloorOvr: 88 },
  '卢卡·东契奇': { slowDeclineRate: 0.7, minFloorOvr: 88 },
  '詹姆斯·哈登': { slowDeclineRate: 0.8, minFloorOvr: 85 },
  '科怀·伦纳德': { slowDeclineRate: 0.8, minFloorOvr: 86 },
  '安东尼·戴维斯': { slowDeclineRate: 0.8, minFloorOvr: 86 },
  '克里斯·保罗': { slowDeclineRate: 0.9, minFloorOvr: 83 },
  '维克托·文班亚马': { slowDeclineRate: 0.7, minFloorOvr: 88 },
  '乔尔·恩比德': { slowDeclineRate: 0.8, minFloorOvr: 85 },
  '凯文·加内特': { slowDeclineRate: 0.9, minFloorOvr: 84 },
  '保罗·皮尔斯': { slowDeclineRate: 1.0, minFloorOvr: 82 },
  '德维恩·韦德': { slowDeclineRate: 1.0, minFloorOvr: 83 },
  '卡梅隆·安东尼': { slowDeclineRate: 1.0, minFloorOvr: 82 },
  '保罗·乔治': { slowDeclineRate: 1.0, minFloorOvr: 83 },
  '达米安·利拉德': { slowDeclineRate: 0.9, minFloorOvr: 84 },
  '凯里·欧文': { slowDeclineRate: 0.8, minFloorOvr: 81 },
  '亚历山大': { slowDeclineRate: 0.7, minFloorOvr: 88 },
  '阿伦·艾弗森': { slowDeclineRate: 0.8, minFloorOvr: 85 },
  '史蒂夫·纳什': { slowDeclineRate: 0.8, minFloorOvr: 85 },
  '安东尼·爱德华兹': { slowDeclineRate: 0.7, minFloorOvr: 88 },
};

/**
 * Calculates a player's dynamic OVR based on age, peakAge, peakOvr, and peakDuration.
 * - Pre-peak: Grows smoothly as age approaches peakAge
 * - Peak era (peakAge <= age <= peakAge + peakDuration - 1): Holds peakOvr
 * - Post-peak: Declines gradually based on years past peak, with superstar protection
 */
export function calculateDynamicOvr(
  age: number = 25,
  peakAge: number = 27,
  peakOvr: number = 75,
  peakDuration: number = 5,
  playerName?: string
): number {
  const safeAge = Math.max(18, age || 25);
  const safePeakAge = Math.max(20, peakAge || 27);
  const safePeakOvr = Math.min(99, Math.max(60, peakOvr || 75));
  const safePeakDuration = Math.max(1, peakDuration || 5);

  const peakEndAge = safePeakAge + safePeakDuration - 1;

  if (safeAge <= peakEndAge) {
    if (safeAge >= safePeakAge) {
      return safePeakOvr;
    } else {
      const diff = safePeakAge - safeAge;
      const growthDrop = Math.pow(diff, 1.05) * 2.0;
      return Math.min(99, Math.max(60, Math.round(safePeakOvr - growthDrop)));
    }
  } else {
    const yearsPast = safeAge - peakEndAge;

    // Check if player has explicit superstar aging config or qualifies by peak rating
    let superstarConfig = playerName ? SUPERSTAR_AGING_MAP[playerName] : undefined;

    if (!superstarConfig) {
      if (safePeakOvr >= 90) {
        superstarConfig = {
          slowDeclineRate: 1.2,
          minFloorOvr: Math.max(80, safePeakOvr - 12),
        };
      } else if (safePeakOvr >= 85) {
        superstarConfig = {
          slowDeclineRate: 1.6,
          minFloorOvr: Math.max(75, safePeakOvr - 14),
        };
      }
    }

    if (superstarConfig) {
      // The old floor was permanent, which could leave a 40-43 year-old star
      // at virtually peak level. After age 36, both the target rating and the
      // protection floor now decline gradually while elite longevity remains.
      const lateCareerYears = Math.max(0, safeAge - 36);
      const declineDrop = yearsPast * superstarConfig.slowDeclineRate + lateCareerYears * 0.9;
      const targetOvr = Math.round(safePeakOvr - declineDrop);
      const ageAdjustedFloor = Math.max(72, Math.round(superstarConfig.minFloorOvr - lateCareerYears * 1.5));
      return Math.min(99, Math.max(ageAdjustedFloor, targetOvr));
    } else {
      const declineDrop = Math.pow(yearsPast, 1.2) * 2.3;
      return Math.min(99, Math.max(60, Math.round(safePeakOvr - declineDrop)));
    }
  }
}

export type DevelopmentStage = '上升成长期' | '巅峰统治期' | '老将下滑期';

export function getDevelopmentStage(
  age: number = 25,
  peakAge: number = 27,
  peakDuration: number = 5
): DevelopmentStage {
  const safeAge = age || 25;
  const safePeakAge = peakAge || 27;
  const safePeakDuration = peakDuration || 5;
  const peakEndAge = safePeakAge + safePeakDuration - 1;

  if (safeAge < safePeakAge) {
    return '上升成长期';
  } else if (safeAge <= peakEndAge) {
    return '巅峰统治期';
  } else {
    return '老将下滑期';
  }
}

export function getStageBadgeColor(stage: DevelopmentStage): string {
  switch (stage) {
    case '上升成长期':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case '巅峰统治期':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case '老将下滑期':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }
}

/**
 * Progresses all players in the league into the new season:
 * Increments age by 1 and updates OVR dynamically according to age/peak formula.
 */
export function progressLeagueForNewSeason(
  teams: Team[],
  userPlayer: PlayerProfile | null
): {
  updatedTeams: Team[];
  updatedUserPlayer: PlayerProfile | null;
  userOvrChange: number;
} {
  let userOvrChange = 0;

  // 1. Update user player if exists (age increments by 1; OVR is calculated with age penalty)
  let updatedUserPlayer = userPlayer;
  if (userPlayer) {
    const currentAge = userPlayer.age || 19;
    const nextAge = currentAge + 1;

    updatedUserPlayer = syncPlayerAgeDecay({
      ...userPlayer,
      age: nextAge,
      isRookie: false,
    });

    userOvrChange = updatedUserPlayer.ovr - userPlayer.ovr;
  }

  // 2. Update all NBA teams
  const updatedTeams = teams.map((team) => {
    const newRoster: RosterPlayer[] = team.roster.map((player) => {
      const currentAge = player.age || 25;
      const nextAge = currentAge + 1;
      const isUser = userPlayer && (player.id === userPlayer.id || player.name === userPlayer.name);

      if (isUser) {
        // User player's OVR is strictly controlled by user attributes, not peak curve
        return {
          ...player,
          age: nextAge,
          ovr: updatedUserPlayer ? updatedUserPlayer.ovr : player.ovr,
          isRookie: false,
        };
      }

      // Non-user players use the dynamic age/peak/decline formula
      let peakAge = player.peakAge || 27;
      let peakOvr = player.peakOvr || player.ovr || 75;
      let peakDuration = player.peakDuration || 5;

      if (player.name === '德马库斯·考辛斯' && nextAge >= 27) {
        peakOvr = 89;
        peakDuration = 1;
        peakAge = 26;
      }

      let newOvr = calculateDynamicOvr(nextAge, peakAge, peakOvr, peakDuration, player.name);

      if (player.name === '德马库斯·考辛斯') {
        if (nextAge === 27) {
          newOvr = 89;
        } else if (nextAge > 27) {
          newOvr = Math.max(60, Math.round(89 - (nextAge - 27) * 2.5));
        }
      }

      return {
        ...player,
        age: nextAge,
        peakAge,
        peakOvr,
        peakDuration,
        ovr: newOvr,
        isRookie: false,
      };
    });

    // Sort roster by OVR and reassign roles
    newRoster.sort((a, b) => b.ovr - a.ovr);
    newRoster.forEach((p, idx) => {
      if (idx === 0) p.role = '战术核心';
      else if (idx < 5) p.role = '绝对首发';
      else if (idx === 5) p.role = '第六人';
      else if (idx < 10) p.role = '轮换替补';
      else p.role = '饮水机守门员';
    });

    const updatedTeam = {
      ...team,
      roster: newRoster,
    };
    return { ...updatedTeam, rating: calculateTeamPowerRating(updatedTeam) };
  });

  return {
    updatedTeams,
    updatedUserPlayer,
    userOvrChange,
  };
}
