import assert from 'node:assert/strict';
import test from 'node:test';
import { BODY_SHAPE_PRESETS, calculateAttributesAndCaps, POSITION_ARCHETYPES } from '../src/utils/attributeCalculator';
import { calculate2KOvr, getPlayerBaseOvr } from '../src/utils/calc2k';
import { getAttributePointStatus } from '../src/utils/attributeTraining';
import type { PlayerProfile, Position } from '../src/types';

test('creation OVR boost stays inside trainable attribute caps', () => {
  const positions = Object.keys(POSITION_ARCHETYPES) as Position[];

  for (const position of positions) {
    for (const archetype of POSITION_ARCHETYPES[position]) {
      for (const body of BODY_SHAPE_PRESETS) {
        for (const baseOvr of [65, 75]) {
          const normal = calculateAttributesAndCaps(position, archetype.id, body.heightCm, body.weightKg, 0, baseOvr);
          const boosted = calculateAttributesAndCaps(position, archetype.id, body.heightCm, body.weightKg, 10, baseOvr);

          assert.equal(boosted.initialOvr, baseOvr + 10);
          assert.equal(boosted.initialOvr - normal.initialOvr, 10);
          assert.equal(calculate2KOvr(position, boosted.attributes), boosted.initialOvr);
          for (const key of Object.keys(boosted.attributes) as Array<keyof typeof boosted.attributes>) {
            assert.ok(boosted.attributes[key] >= 50);
            assert.ok(boosted.attributes[key] <= boosted.attributeCaps[key]);
          }

          const player = {
            position,
            attributes: boosted.attributes,
            attributeCaps: boosted.attributeCaps,
            age: 19,
            ovr: boosted.initialOvr,
            skillPoints: 25,
          } as PlayerProfile;
          assert.equal(getPlayerBaseOvr(player), boosted.initialOvr);
          const status = getAttributePointStatus(player);
          assert.equal(status.isOvrAtCap, false);
          assert.equal(status.isOverflowing, false);
          assert.equal(status.hasUpgradableAttributes, true);
        }
      }
    }
  }
});
