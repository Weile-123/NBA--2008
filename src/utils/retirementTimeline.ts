import type { RetiredPlayerRecord } from '../types';

export function resolveCompletedCareerEndYear(
  startYear: number,
  currentYear: number,
  careerHistoryYears: number[],
  leagueHistoryYears: number[],
): number {
  const recordedYears = Array.from(new Set([...careerHistoryYears, ...leagueHistoryYears]))
    .filter((year) => year >= startYear && year <= currentYear);
  return recordedYears.length > 0 ? Math.max(...recordedYears) : currentYear;
}

/**
 * Repairs the extra offseason placeholder written by older builds. Players
 * enter at 19 and cannot start another season at 43, so retireAge - 19 is the
 * maximum number of completed seasons without changing the saved GOAT score.
 */
export function sanitizeRetirementTimeline(record: RetiredPlayerRecord): {
  timeline: RetiredPlayerRecord['timeline'];
  seasonsPlayed: number;
  endYear: number;
} {
  const maximumCompletedSeasons = Math.max(1, (record.retireAge || 19) - 19);
  const timeline = (record.timeline || []).slice(0, maximumCompletedSeasons);
  return {
    timeline,
    seasonsPlayed: timeline.length || record.seasonsPlayed,
    endYear: timeline[timeline.length - 1]?.year ?? record.endYear,
  };
}
