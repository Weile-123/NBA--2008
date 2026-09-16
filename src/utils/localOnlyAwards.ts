/** Season stat titles shown in the live career, but not in retired leaderboard records. */
export const LOCAL_ONLY_STAT_TITLES = [
  '常规赛篮板王',
  '常规赛助攻王',
  '常规赛三分王',
  '常规赛盖帽王',
  '常规赛抢断王',
] as const;

export function isLocalOnlyStatTitle(title: string): boolean {
  return (LOCAL_ONLY_STAT_TITLES as readonly string[]).includes(title);
}

export function leaderboardAccoladeTitles(titles: string[]): string[] {
  return titles.filter((title) => !isLocalOnlyStatTitle(title));
}
