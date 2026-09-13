import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPercentage, normalizePercentage } from '../src/utils/statsFormat';

test('normalizes legacy ratio shooting percentages', () => {
  assert.equal(normalizePercentage(0.456), 45.6);
  assert.equal(formatPercentage(0.456), '45.6%');
});

test('keeps current percentage shooting values unchanged', () => {
  assert.equal(normalizePercentage(45.6), 45.6);
  assert.equal(formatPercentage(45.6), '45.6%');
});
