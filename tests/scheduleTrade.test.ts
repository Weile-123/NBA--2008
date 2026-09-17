import assert from 'node:assert/strict';
import test from 'node:test';
import type { ScheduleItem } from '../src/types';
import { retargetUnplayedSchedule } from '../src/utils/scheduleTrade';

test('trading to a scheduled opponent never creates a self match and preserves past results', () => {
  const schedule: ScheduleItem[] = [
    { week: 1, opponentId: 'LAL', isHome: true, isPlayed: true, userScore: 101, oppScore: 98 },
    { week: 2, opponentId: 'LAL', isHome: false, isPlayed: false },
    { week: 3, opponentId: 'BOS', isHome: true, isPlayed: false },
  ];
  const updated = retargetUnplayedSchedule(schedule, 'LAL', 'ORL');
  assert.strictEqual(updated[0], schedule[0]);
  assert.equal(updated[1].opponentId, 'ORL');
  assert.equal(updated[1].isHome, false);
  assert.strictEqual(updated[2], schedule[2]);
});
