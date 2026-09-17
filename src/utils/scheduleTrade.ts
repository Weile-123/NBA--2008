import type { ScheduleItem } from '../types';

/** Keep completed games intact and ensure the player's future opponents exclude their new team. */
export function retargetUnplayedSchedule(
  schedule: ScheduleItem[],
  newTeamId: string,
  replacementTeamId: string,
): ScheduleItem[] {
  return schedule.map((game) =>
    !game.isPlayed && game.opponentId === newTeamId
      ? { ...game, opponentId: replacementTeamId }
      : game,
  );
}
