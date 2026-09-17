import assert from 'node:assert/strict';
import test from 'node:test';
import { BODY_SHAPE_PRESETS, calculateAttributesAndCaps, POSITION_ARCHETYPES } from '../src/utils/attributeCalculator';
import { calculate2KOvr, getPlayerBaseOvr } from '../src/utils/calc2k';
import { getAttributePointStatus } from '../src/utils/attributeTraining';
import type { PlayerProfile, Position } from '../src/types';
import { calculateCreationTemplateAttributes, CREATION_POSITION_COMBINATIONS, getCreationSecondaryOptions, getCreationTemplate, getCreationTemplateScoutReport } from '../src/utils/creationTemplates';
import { CREATION_SCOUT_REPORTS } from '../src/data/creationScoutReports';

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

test('all available body-and-position templates have distinct profiles and balanced strength', () => {
  assert.equal(CREATION_POSITION_COMBINATIONS.length, 14);
  const names = new Set<string>();
  for (const combination of CREATION_POSITION_COMBINATIONS) {
    const [primary, secondary] = combination.split('/') as [Position, Position | undefined];
    assert.ok(getCreationSecondaryOptions(primary).includes(secondary || null));
    for (const shape of BODY_SHAPE_PRESETS) {
      const template = getCreationTemplate(primary, secondary || null, shape.id);
      const normal = calculateCreationTemplateAttributes(primary, secondary || null, shape.id, 0, 70);
      const boosted = calculateCreationTemplateAttributes(primary, secondary || null, shape.id, 10, 70);
      for (const base of [65, 75]) {
        for (const boost of [0, 10]) {
          const variant = calculateCreationTemplateAttributes(primary, secondary || null, shape.id, boost, base);
          assert.equal(variant.initialOvr, base + boost, `${template.id} ${base}+${boost}`);
          assert.equal(calculate2KOvr(primary, variant.attributes), variant.initialOvr);
        }
      }
      names.add(template.name);
      assert.ok(template.reference.includes('·'), `${template.id} reference should use a full player name`);
      assert.ok(!/便士|威少|麦迪|慈世平|上将/.test(template.reference), `${template.id} reference should not use a nickname`);
      assert.equal(normal.initialOvr, 70, template.id);
      assert.equal(boosted.initialOvr, 80, `${template.id} boosted`);
      assert.equal(Object.keys(normal.attributes).length, 18);
      assert.ok(new Set(Object.values(normal.attributes)).size >= 6, template.id);
      assert.equal(Object.values(normal.attributeCaps).reduce((sum, value) => sum + value, 0), 1500, template.id);
      const scout = getCreationTemplateScoutReport({
        archetype: template.name, position: primary, secondaryPosition: secondary, ovr: normal.initialOvr,
        attributes: normal.attributes,
      });
      assert.ok(scout, `${template.id} scout report`);
      assert.equal(scout.starName, template.reference);
      assert.equal(scout.starTitle, template.name);
      assert.ok(scout.grade.length > 0 && scout.scoutComment.length > 20);
      assert.equal(scout.strengths.length, 3);
      assert.equal(scout.weaknesses.length, 2);
      for (const [key, start, cap] of template.core) {
        assert.equal(normal.attributes[key], start, `${template.id} ${key} start`);
        assert.equal(normal.attributeCaps[key], cap, `${template.id} ${key} cap`);
      }
      for (const key of Object.keys(boosted.attributes) as Array<keyof typeof boosted.attributes>) {
        assert.ok(boosted.attributes[key] >= 50 && boosted.attributes[key] <= boosted.attributeCaps[key], `${template.id} ${key}`);
      }
    }
  }
  assert.equal(names.size, 42);
});

test('creation offers SF/PG but not PG/SF, and the heavy single-position SF uses the Melo template', () => {
  assert.ok(!getCreationSecondaryOptions('PG').includes('SF'));
  assert.ok(getCreationSecondaryOptions('SF').includes('PG'));
  const template = getCreationTemplate('SF', null, 'heavy');
  assert.equal(template.reference, '卡梅隆·安东尼');
  assert.equal(template.name, '强攻型小前锋');
  assert.equal(template.core[3][0], 'insideFinish');
});

test('all authored scout reports match their saved archetype and reference, including legacy SF/PG', () => {
  const combinations = CREATION_POSITION_COMBINATIONS;
  assert.equal(Object.keys(CREATION_SCOUT_REPORTS).length, 42);
  for (const combination of combinations) {
    const [primary, secondary] = combination.split('/') as [Position, Position | undefined];
    for (const shape of BODY_SHAPE_PRESETS) {
      const result = calculateCreationTemplateAttributes(primary, secondary || null, shape.id, 0, 69);
      const scout = getCreationTemplateScoutReport({
        archetype: result.template.name, position: primary, secondaryPosition: secondary,
        ovr: result.initialOvr, attributes: result.attributes,
      });
      assert.ok(scout, result.template.id);
      assert.deepEqual(scout.strengths, CREATION_SCOUT_REPORTS[result.template.id].strengths);
      assert.deepEqual(scout.weaknesses, CREATION_SCOUT_REPORTS[result.template.id].weaknesses);
      assert.equal(scout.scoutComment, CREATION_SCOUT_REPORTS[result.template.id].scoutComment);
      assert.equal(scout.starName, result.template.reference, result.template.id);
      assert.equal(scout.strengths.length, 3, result.template.id);
      assert.equal(scout.weaknesses.length, 2, result.template.id);
      assert.ok(scout.scoutComment.length > 35, result.template.id);
    }
  }
});
