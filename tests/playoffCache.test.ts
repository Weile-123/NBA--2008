import assert from 'node:assert/strict';
import test from 'node:test';
import { isPlayoffCacheCompatible } from '../src/components/PlayoffPanel';

test('playoff cache only restores a signed result for the same career', () => {
  assert.equal(isPlayoffCacheCompatible('id:career-a', true, 'id:career-a', true), true);
  assert.equal(isPlayoffCacheCompatible('id:career-a', true, 'id:career-b', true), false);
});

test('legacy completed champion cannot leak into another career', () => {
  assert.equal(isPlayoffCacheCompatible(undefined, true, 'legacy:player', false), false);
  assert.equal(isPlayoffCacheCompatible(undefined, false, 'legacy:player', false), true);
  assert.equal(isPlayoffCacheCompatible(undefined, false, 'id:new-career', true), false);
});
