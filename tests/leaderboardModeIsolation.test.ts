import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const splitMigration = readFileSync(resolve('activity/migrations/20260914180000_split_leaderboard_by_game_mode.sql'), 'utf8');
const readMigration = readFileSync(resolve('activity/migrations/20260914190000_read_leaderboard_by_game_mode.sql'), 'utf8');
const deduplicateMigration = readFileSync(resolve('activity/migrations/20260914234000_deduplicate_legendary_careers.sql'), 'utf8');
const apiSource = readFileSync(resolve('activity/cloudfunctions/activity_api/index.js'), 'utf8');

test('existing leaderboard rows and legacy clients remain classic by default', () => {
  assert.match(splitMigration, /game_mode text not null default 'classic'/);
  assert.match(splitMigration, /submit_legendary_leaderboard_record\(p_puid, p_display_name, p_score, p_record, 'classic'\)/);
  assert.match(splitMigration, /get_legendary_leaderboard_rank\(p_puid, p_max_age, 'classic'\)/);
  assert.match(apiSource, /value == null[^\n]+\? 'classic'/);
});

test('classic and parallel leaderboard records use independent uniqueness and reads', () => {
  assert.match(splitMigration, /unique index[^;]+\(puid, game_mode\)/s);
  assert.match(splitMigration, /game_mode in \('classic', 'random_trade'\)/);
  assert.match(readMigration, /where entry\.game_mode = coalesce/);
  assert.match(apiSource, /cachedBoards\.get\(gameMode\)/);
  assert.match(apiSource, /p_game_mode: gameMode/);
});

test('duplicate historical career ids are removed by both SQL and the API fallback', () => {
  assert.match(deduplicateMigration, /partition by coalesce\(nullif\(btrim\(entry\.record->>'id'\)/);
  assert.match(deduplicateMigration, /where career_row = 1/);
  assert.match(deduplicateMigration, /higher\.career_row = 1/);
  assert.match(apiSource, /function deduplicateLeaderboardRows/);
  assert.match(apiSource, /seenCareerIds\.has\(careerId\)/);
});
