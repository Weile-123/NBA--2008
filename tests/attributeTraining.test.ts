import assert from 'node:assert/strict';
import test from 'node:test';
import type { Attributes, PlayerProfile } from '../src/types';
import { resetPlayerAttribute, spendPlayerAttributePoints } from '../src/utils/attributeTraining';

const highAttributes: Attributes = {
  layup: 99, dunk: 99, insideFinish: 99, midRange: 60, threePoint: 99, freeThrow: 99,
  postMove: 99, ballHandle: 99, passing: 99, perimeterDef: 99, interiorDef: 99,
  steal: 99, block: 99, rebounding: 99, speed: 99, strength: 99, vertical: 99, stamina: 99,
};

function cappedVeteran(): PlayerProfile {
  return {
    age: 40,
    position: 'SG',
    attributes: { ...highAttributes },
    attributeCaps: Object.fromEntries(Object.keys(highAttributes).map((key) => [key, 99])) as unknown as PlayerProfile['attributeCaps'],
    skillPoints: 0,
    peakOvr: 99,
  } as PlayerProfile;
}

test('a capped veteran can spend refunded points on another attribute', () => {
  const reset = resetPlayerAttribute(cappedVeteran(), 'threePoint');
  assert.equal(reset.skillPoints, 39);
  assert.equal(reset.attributeRedistributionPoints, 39);

  const redistributed = spendPlayerAttributePoints(reset, 'midRange', 10);
  assert.equal(redistributed.attributes.midRange, 70);
  assert.equal(redistributed.skillPoints, 29);
  assert.equal(redistributed.attributeRedistributionPoints, 29);
});

test('ordinary new points cannot bypass the veteran OVR ceiling', () => {
  const player = { ...cappedVeteran(), skillPoints: 10, attributeRedistributionPoints: 0 };
  const unchanged = spendPlayerAttributePoints(player, 'midRange', 10);
  assert.equal(unchanged.attributes.midRange, 60);
  assert.equal(unchanged.skillPoints, 10);
});
