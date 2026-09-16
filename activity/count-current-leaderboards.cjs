// Read-only counts for the current NBA--2008 leaderboard project.
// Do not use the first-generation activity migration credentials here.
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const CURRENT_ENV_ID = 'app-a1c57bc9c2-d5glgsllk7b7bd845';
const MODES = [
  ['classic', '经典模式'],
  ['random_trade', '平行时空'],
];

async function countMode(envId, apiKey, mode) {
  const url = new URL(`https://${envId}.api.tcloudbasegateway.com/v1/rdb/rest/leaderboard_entries`);
  url.searchParams.set('select', 'id');
  url.searchParams.set('game_mode', `eq.${mode}`);
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
      'X-Db-Instance': 'default',
      'Accept-Profile': 'public',
      Prefer: 'count=exact',
    },
  });
  if (!response.ok) throw new Error(`${mode} 查询失败（HTTP ${response.status}）`);

  const range = response.headers.get('content-range');
  const count = range && /\/(\d+)$/.exec(range)?.[1];
  if (count === undefined) throw new Error(`${mode} 查询结果缺少精确人数`);
  return Number(count);
}

async function main() {
  const { envId, apiKey } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  if (envId !== CURRENT_ENV_ID) throw new Error('凭据不是当前正式服活动环境，已停止查询');
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('当前正式服凭据缺少 apiKey');

  const counts = [];
  for (const [mode, label] of MODES) {
    counts.push([label, await countMode(envId, apiKey.trim(), mode)]);
  }
  const total = counts.reduce((sum, [, count]) => sum + count, 0);

  console.log('榜单\t人数');
  for (const [label, count] of counts) console.log(`${label}\t${count.toLocaleString('en-US')}`);
  console.log(`两榜相加\t${total.toLocaleString('en-US')}`);
  console.log('注：两榜相加为参榜人次，跨模式参与者可能重复。');
}

main().catch((error) => {
  console.error(`排行榜人数查询失败：${error.message}`);
  process.exitCode = 1;
});
