import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { UPDATE_ANNOUNCEMENTS } from '../src/data/updateAnnouncements';

const homeSource = readFileSync(resolve('src/components/HomeScreen.tsx'), 'utf8');
const appSource = readFileSync(resolve('src/App.tsx'), 'utf8');
const seasonDashboardSource = readFileSync(resolve('src/components/SeasonDashboard.tsx'), 'utf8');
const globalStyles = readFileSync(resolve('src/index.css'), 'utf8');
const migrationSource = readFileSync(resolve('activity/migrate-legendary-data.cjs'), 'utf8');
const postMatchSource = readFileSync(resolve('src/components/PostMatchModal.tsx'), 'utf8');

test('v8 announcement leads with parallel league and omits removed release notes', () => {
  const v8 = UPDATE_ANNOUNCEMENTS.flatMap((announcement) => announcement.versions).find((version) => version.version === 'v8');
  assert.equal(v8?.sections[0]?.title, '新模式——平行联盟');
  assert.ok(v8?.sections[0]?.items.some((item) => item.includes('独立存档')));
  assert.ok(v8?.sections[0]?.items.some((item) => item.includes('随机交易')));
  assert.ok(v8?.sections[0]?.items.some((item) => item.includes('命定事件')));
  assert.equal(v8?.sections.some((section) => section.title === '运行稳定性修复'), false);
  assert.equal(v8?.sections.flatMap((section) => section.items).some((item) => item.includes('两后卫、两前锋和一中锋')), false);
});

test('homepage announcement loads and labels both global leaderboards', () => {
  assert.match(homeSource, /loadGlobalHallOfFame\(mode\)/);
  assert.match(homeSource, /isClassic \? '经典' : '平行'/);
  assert.match(homeSource, /\{modeName\}传奇榜TOP1/);
});

test('homepage announcement loops downward with longer holds', () => {
  assert.match(homeSource, /className="announcement-vertical-track/);
  assert.match(homeSource, /className="announcement-vertical-item"/);
  assert.match(homeSource, /\[\.\.\.MODES, MODES\[0\]\]/);
  assert.match(globalStyles, /animation: announcement-vertical-switch 6s/);
  assert.match(globalStyles, /0%, 41\.666%[\s\S]*translateY\(-66\.666%\)/);
  assert.match(globalStyles, /50%, 91\.666%[\s\S]*translateY\(-33\.333%\)/);
  assert.match(globalStyles, /100%[\s\S]*translateY\(0\)/);
  assert.doesNotMatch(globalStyles, /ticker-scroll|translateX\(-50%\)/);
});

test('parallel season entry announces every unresolved destiny event after offseason', () => {
  assert.match(appSource, /previousPhase !== 'offseason' \|\| phase !== 'regular_season'/);
  assert.match(appSource, /event\.year === currentYear && !destinyEventRecords\[event\.id\]/);
  assert.match(appSource, /本赛季有命定事件/);
  assert.match(appSource, /setIsDestinyEventsOpen\(true\)/);
});

test('destiny entry counts unavailable current-season events as decisions', () => {
  assert.match(seasonDashboardSource, /item\.status === 'available' \|\| item\.status === 'unavailable'/);
  assert.match(seasonDashboardSource, /\{unresolvedDestinyEvents\.length\} 个可决定/);
  assert.doesNotMatch(seasonDashboardSource, /个可触发/);
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
