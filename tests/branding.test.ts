import assert from 'node:assert/strict';
import test from 'node:test';
import { brandText, GAME_NAME, LEAGUE_LOGO, normalizeBranding } from '../src/utils/branding';

test('legacy game names and league phrases use the new branding', () => {
  assert.equal(brandText('NBA 2K2008 MyCareer Web Engine'), GAME_NAME);
  assert.equal(brandText('NBA 联盟总裁：NBA总冠军'), '联盟总裁：联盟总冠军');
  assert.equal(brandText('重返nba赛场'), '重返联盟赛场');
});

test('loaded data keeps identifiers and award enums while updating displayed copy and logos', () => {
  const legacy = {
    id: 'nba2k_cover_preview',
    player: { name: 'NBA球员', accolades: [{ type: 'ALL_NBA_1ST', title: 'NBA最佳阵容' }] },
    teams: [{ id: 'lal', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png' }],
    epilogueStory: '他夺得NBA总冠军。',
  };
  const updated = normalizeBranding(legacy);
  assert.equal(updated.id, legacy.id);
  assert.equal(updated.player.accolades[0].type, 'ALL_NBA_1ST');
  assert.equal(updated.player.accolades[0].title, '联盟最佳阵容');
  assert.equal(updated.player.name, '联盟球员');
  assert.equal(updated.teams[0].logo, LEAGUE_LOGO);
  assert.equal(updated.epilogueStory, '他夺得联盟总冠军。');
  assert.equal(legacy.player.name, 'NBA球员');
});
