import assert from 'node:assert/strict';
import test from 'node:test';
import type { Team } from '../src/types';
import { createFutureRookieAwardPool } from '../src/utils/awardsLogic';
import { getHistoricalDraftData } from '../src/data/draftData';
import { generateParallelDraftData, generateSyntheticDraftClass } from '../src/utils/randomDraftLogic';
import { applyDraftRookiesToTeams } from '../src/utils/draftLogic';

const teams = Array.from({ length: 30 }, (_, index) => ({
  id: `team_${index}`,
  name: `球队${index}`,
  abbrev: `T${index}`,
  conference: index < 15 ? 'East' : 'West',
  wins: index,
  losses: 82 - index,
  rating: 70 + (index % 10),
  roster: [],
})) as Team[];

test('future rookie award pools are stable, varied and never reuse an existing veteran', () => {
  const pool2027 = createFutureRookieAwardPool(teams, 2027);
  const pool2028 = createFutureRookieAwardPool(teams, 2028);
  assert.equal(pool2027.length, 10);
  assert.equal(new Set(pool2027.map((player) => player.name)).size, 10);
  assert.ok(pool2027.every((player) => player.isRookie));
  assert.ok(pool2027.every((player) => player.name !== '杰森·塔图姆'));
  assert.notDeepEqual(pool2027.map((player) => player.name), pool2028.map((player) => player.name));
  assert.deepEqual(createFutureRookieAwardPool(teams, 2027), pool2027);
});

test('2026 uses the maintained class and later drafts add 30 unique rookies to league rosters', () => {
  assert.equal(getHistoricalDraftData(2026)?.draftPicks.length, 30);
  const futureDraft = generateParallelDraftData(teams, 2027, () => 0.5);
  assert.equal(futureDraft?.draftPicks.length, 30);
  assert.equal(new Set(futureDraft?.draftPicks.map((pick) => pick.player.name)).size, 30);

  const updatedTeams = applyDraftRookiesToTeams(teams, 2027, null, futureDraft);
  assert.equal(updatedTeams.reduce((total, team) => total + team.roster.length, 0), 30);
  assert.ok(updatedTeams.flatMap((team) => team.roster).every((player) => player.isRookie));
});

test('the 60-by-60 name pool avoids duplicate full names throughout a 25-season career', () => {
  const names = Array.from({ length: 25 }, (_, index) => generateSyntheticDraftClass(2027 + index))
    .flatMap((draft) => draft.draftPicks.map((pick) => pick.player.name));
  assert.equal(names.length, 750);
  assert.equal(new Set(names).size, 750);
});
