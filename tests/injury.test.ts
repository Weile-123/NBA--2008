import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePerGameInjuryChance,
  calculateSeasonInjuryChance,
  evaluatePostGameHealth,
  MAX_CAREER_AGE,
  mustRetireAtAge,
} from '../src/utils/calc2k';

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 1;
}

test('stamina lowers the simplified per-game injury probability', () => {
  const lowStamina = evaluatePostGameHealth(
    { status: 'healthy' },
    59,
    sequenceRandom([0.006, 0.10, 0])
  );
  const highStamina = evaluatePostGameHealth(
    { status: 'healthy' },
    90,
    sequenceRandom([0.006])
  );

  assert.equal(lowStamina.status, 'injured');
  assert.equal(lowStamina.gamesRemaining, 1);
  assert.equal(highStamina.status, 'healthy');
});

test('82-game injury targets follow a linear 50-to-10 percent stamina curve', () => {
  assert.ok(Math.abs(calculateSeasonInjuryChance(50) - 0.50) < 1e-12);
  assert.ok(Math.abs(calculateSeasonInjuryChance(99) - 0.10) < 1e-12);
  assert.ok(Math.abs(calculateSeasonInjuryChance(74.5) - 0.30) < 1e-12);

  for (const stamina of [50, 59, 70, 80, 90, 99]) {
    const perGame = calculatePerGameInjuryChance(stamina);
    const reconstructedSeasonChance = 1 - Math.pow(1 - perGame, 82);
    assert.ok(Math.abs(reconstructedSeasonChance - calculateSeasonInjuryChance(stamina)) < 1e-12);
  }
});

test('short injuries keep the agreed 60/30/10 split after the moderate-injury slice', () => {
  const oneGame = evaluatePostGameHealth({ status: 'healthy' }, 50, sequenceRandom([0, 0.08 + 0.92 * 0.59, 0]));
  const twoGames = evaluatePostGameHealth({ status: 'healthy' }, 50, sequenceRandom([0, 0.08 + 0.92 * 0.60, 0]));
  const threeGames = evaluatePostGameHealth({ status: 'healthy' }, 50, sequenceRandom([0, 0.08 + 0.92 * 0.90, 0]));

  assert.equal(oneGame.gamesRemaining, 1);
  assert.equal(twoGames.gamesRemaining, 2);
  assert.equal(threeGames.gamesRemaining, 3);
});

test('eight percent of injury events become a roughly one-week four-game absence', () => {
  const moderate = evaluatePostGameHealth(
    { status: 'healthy' },
    50,
    sequenceRandom([0, 0.079, 0])
  );

  assert.equal(moderate.status, 'injured');
  assert.equal(moderate.severity, 'moderate');
  assert.equal(moderate.gamesRemaining, 4);
  assert.match(moderate.injuryName || '', /中度|拉伤/);
});

test('season cap and post-recovery cooldown suppress additional injury rolls', () => {
  const seasonCapped = evaluatePostGameHealth(
    { status: 'healthy', occurredThisSeason: true },
    50,
    sequenceRandom([0])
  );
  const coolingDown = evaluatePostGameHealth(
    { status: 'healthy', cooldownGames: 2, occurredThisSeason: false },
    50,
    sequenceRandom([0])
  );

  assert.equal(seasonCapped.status, 'healthy');
  assert.equal(coolingDown.status, 'healthy');
  assert.equal(coolingDown.cooldownGames, 1);
});

test('career retirement becomes mandatory at age 43', () => {
  assert.equal(MAX_CAREER_AGE, 43);
  assert.equal(mustRetireAtAge(42), false);
  assert.equal(mustRetireAtAge(43), true);
  assert.equal(mustRetireAtAge(62), true);
});
