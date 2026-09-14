const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const credentials = JSON.parse(fs.readFileSync(path.join(root, 'credentials.json'), 'utf8'));
const apiBase = 'https://app-a1c57bc9c2-d5glgsllk7b7bd845-1252166086.ap-shanghai.app.tcloudbase.com/api';
const token = String(credentials.apiKey).startsWith('Bearer ')
  ? String(credentials.apiKey)
  : `Bearer ${credentials.apiKey}`;
const smokeId = `parallel-leaderboard-smoke-${Date.now()}`;

async function gateway(pathname, options = {}) {
  const response = await fetch(`${apiBase}${pathname}`, {
    ...options,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || (body?.code !== 0 && body?.code !== 200)) {
    throw new Error(`${pathname} 验证失败（HTTP ${response.status}）：${body?.message || '未知错误'}`);
  }
  return body;
}

async function cleanup() {
  const url = new URL(`https://${credentials.envId}.api.tcloudbasegateway.com/v1/rdb/rest/leaderboard_entries`);
  url.searchParams.set('game_mode', 'eq.random_trade');
  url.searchParams.set('record->>id', `eq.${smokeId}`);
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: token,
      'X-Db-Instance': 'default',
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      Prefer: 'return=representation',
    },
  });
  const rows = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(rows) || rows.length !== 1) {
    throw new Error(`测试记录清理失败（HTTP ${response.status}）`);
  }
}

async function main() {
  const existing = await gateway('/leaderboard/me?gameMode=random_trade');
  if (existing.data) throw new Error('测试身份已存在平行时空成绩，停止写入以避免覆盖');

  try {
    await gateway('/leaderboard/submit', {
      method: 'POST',
      body: JSON.stringify({
        gameMode: 'random_trade',
        score: 0,
        displayName: '排行榜隔离测试',
        record: {
          id: smokeId,
          gameMode: 'random_trade',
          goatScore: 0,
          retireAge: 43,
          player: { name: '排行榜隔离测试' },
        },
      }),
    });
    const parallel = await gateway('/leaderboard/me?gameMode=random_trade');
    if (parallel.data?.record?.id !== smokeId || parallel.data?.record?.gameMode !== 'random_trade') {
      throw new Error('平行时空成绩写入后无法在对应榜单读取');
    }
    const classic = await gateway('/leaderboard/me?gameMode=classic');
    if (classic.data?.record?.id === smokeId) throw new Error('平行时空测试成绩泄漏到经典榜');
    process.stdout.write('✓ 平行时空写入、读取及经典榜隔离验证通过\n');
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
