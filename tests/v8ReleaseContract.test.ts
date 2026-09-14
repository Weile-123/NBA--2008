import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UPDATE_ANNOUNCEMENTS } from '../src/data/updateAnnouncements';

const homeSource = readFileSync(resolve('src/components/HomeScreen.tsx'), 'utf8');
const migrationSource = readFileSync(resolve('activity/migrate-legendary-data.cjs'), 'utf8');
const postMatchSource = readFileSync(resolve('src/components/PostMatchModal.tsx'), 'utf8');

test('v8 announcement leads with parallel league and omits removed release notes', () => {
  const v8 = UPDATE_ANNOUNCEMENTS[0].versions.find((version) => version.version === 'v8');
  assert.equal(v8?.sections[0]?.title, '新模式——平行联盟');
  assert.ok(v8?.sections[0]?.items.some((item) => item.includes('独立存档')));
  assert.ok(v8?.sections[0]?.items.some((item) => item.includes('随机交易')));
  assert.ok(v8?.sections[0]?.items.some((item) => item.includes('命定事件')));
  assert.equal(v8?.sections.some((section) => section.title === '运行稳定性修复'), false);
  assert.equal(v8?.sections.flatMap((section) => section.items).some((item) => item.includes('两后卫、两前锋和一中锋')), false);
});

test('homepage announcement loads and labels both global leaderboards', () => {
  assert.match(homeSource, /loadGlobalHallOfFame\(mode\)/);
  assert.match(homeSource, /isClassic \? '经典模式' : '平行联盟'/);
  assert.match(homeSource, /登顶\{modeName\}传奇榜/);
});

test('first-generation migration cannot be mistaken for a v7-to-v8 release monitor', () => {
  assert.match(migrationSource, /first-generation activity project/);
  assert.match(migrationSource, /legacy-project-backup/);
  assert.match(migrationSource, /new-project-bootstrap/);
  assert.doesNotMatch(migrationSource, /--monitor-sync/);
});

test('post-match summary keeps header and action visible without exposing raw XP totals', () => {
  assert.match(postMatchSource, /<header className="[^"]*shrink-0/);
  assert.match(postMatchSource, /min-h-0 flex-1[^\"]*overflow-y-auto/);
  assert.match(postMatchSource, /<footer className="[^"]*shrink-0/);
  assert.match(postMatchSource, /成长进度/);
  assert.doesNotMatch(postMatchSource, /\+\{xpEarned\} XP/);
  assert.doesNotMatch(postMatchSource, /当前经验值:/);
});
