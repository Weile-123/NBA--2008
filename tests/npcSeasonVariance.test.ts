import assert from 'node:assert/strict';
import test from 'node:test';
import type { RosterPlayer } from '../src/types';
import { calculateTeamUsageContext, enrichRosterPlayer } from '../src/utils/leagueLogic';

test('a solo superstar has stable stats within a season but varying scoring across seasons', () => {
  const star = { id: 'james', name: '勒布朗·詹姆斯', position: 'SF', ovr: 99 } as RosterPlayer;
  const context = calculateTeamUsageContext([star, { id: 'teammate', ovr: 78 }]);
  const ppg = (year: number) => enrichRosterPlayer(star, 0, year, context).stats?.ppg;
  assert.equal(ppg(1), ppg(1));
  assert.ok(new Set([1, 2, 3, 4, 5].map(ppg)).size > 1);
  assert.ok([1, 2, 3, 4, 5].some((year) => (ppg(year) || 0) < 35));
});
