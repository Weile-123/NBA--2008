import assert from 'node:assert/strict';
import test from 'node:test';
import type { PlayerProfile } from '../src/types';
import { get15LifeSimulationEvents } from '../src/data/lifeSimulationData';
import { applyPlayoffPostMatchRewards, applyPostMatchRewards } from '../src/utils/postMatchRewards';

const player = {
  xp: 40,
  maxXp: 100,
  level: 2,
  skillPoints: 3,
  morale: 50,
  mediaReputation: 20,
  fansCount: 1000,
} as PlayerProfile;
const rewards = { xpEarned: 70, skillPointsEarned: 2, moraleDelta: 5, mediaRepDelta: 3, fanDelta: 100 };

test('regular-season and playoff interactive games grant the same match rewards', () => {
  const regular = applyPostMatchRewards(player, rewards);
  const playoff = applyPlayoffPostMatchRewards(player, 'FINALS:G1', rewards);
  assert.equal(playoff.xp, regular.xp);
  assert.equal(playoff.level, regular.level);
  assert.equal(playoff.skillPoints, regular.skillPoints);
  assert.equal(playoff.fansCount, regular.fansCount);
  assert.equal(playoff.skillPoints, 6); // 2 direct and 1 from leveling up
  assert.deepEqual(playoff.playoffRewardGameIds, ['FINALS:G1']);
  assert.equal(applyPlayoffPostMatchRewards(playoff, 'FINALS:G1', rewards), playoff);
  assert.equal(applyPlayoffPostMatchRewards(playoff, 'FINALS:G2', rewards).skillPoints, 8);
});

test('new nationality options feed the life story without treating China as a US city', () => {
  const domestic = get15LifeSimulationEvents('中国', '普通人');
  const overseas = get15LifeSimulationEvents('海外', '普通人');
  assert.equal(domestic.length, 15);
  assert.equal(overseas.length, 15);
  assert.deepEqual(domestic.map((event) => event.stage), overseas.map((event) => event.stage));
  domestic.forEach((event, index) => {
    assert.deepEqual(
      event.options.map((option) => option.scoreDelta).sort(),
      overseas[index].options.map((option) => option.scoreDelta).sort()
    );
    assert.notEqual(event.title, overseas[index].title);
  });
  assert.match(domestic[0].story, /国内/);
  assert.match(domestic[9].timeLabel, /CBA/);
  assert.match(domestic[14].story, /CBA/);
  assert.match(overseas[0].story, /海外/);
  assert.doesNotMatch(domestic[0].story, /纽约/);
  assert.doesNotMatch(domestic.map((event) => `${event.title} ${event.story}`).join(' '), /NCAA|全美高中/);
});
