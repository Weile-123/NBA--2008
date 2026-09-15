import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDynamicOvr } from '../src/utils/progressionLogic';

test('superstar decline remains gradual but continues after age 36', () => {
  const lebron = [34, 36, 38, 40, 43].map((age) =>
    calculateDynamicOvr(age, 25, 99, 9, '勒布朗·詹姆斯'),
  );
  assert.deepEqual(lebron, [98, 97, 94, 91, 87]);
  assert.ok(lebron.every((ovr, index) => index === 0 || ovr <= lebron[index - 1]));
});

test('generated 90+ stars no longer keep a permanent late-career floor', () => {
  const at36 = calculateDynamicOvr(36, 27, 94, 5);
  const at43 = calculateDynamicOvr(43, 27, 94, 5);
  assert.ok(at43 < at36);
  assert.ok(at43 >= 72);
});
