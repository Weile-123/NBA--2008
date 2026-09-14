import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('career flow does not request component chunks after the game has started', () => {
  const appSource = readFileSync(resolve('src/App.tsx'), 'utf8');
  const playoffSource = readFileSync(resolve('src/components/PlayoffPanel.tsx'), 'utf8');
  assert.equal(/\blazy\s*\(/.test(appSource), false);
  assert.equal(/\bimport\s*\(/.test(appSource), false);
  assert.equal(/\blazy\s*\(/.test(playoffSource), false);
  assert.equal(/\bimport\s*\(/.test(playoffSource), false);
});

test('fatal recovery exits Hupu WebView instead of navigating to a stale release URL', () => {
  const boundarySource = readFileSync(resolve('src/components/ErrorBoundary.tsx'), 'utf8');
  assert.equal(boundarySource.includes('window.location.replace('), false);
  assert.equal(boundarySource.includes("closeWebview({ channel: 'bridge' })"), true);
  assert.equal(boundarySource.includes('response?.code !== 200'), true);
});
