const fs = require('fs');
const path = require('path');
const { createClient, readToolText } = require('./cloudbase-mcp-tools.cjs');

const ROOT = path.resolve(__dirname, '..');
const FUNCTION_ROOT = path.join(__dirname, 'cloudfunctions');
const MIGRATIONS = [
  ['20260914180000', 'split_leaderboard_by_game_mode'],
  ['20260914190000', 'read_leaderboard_by_game_mode'],
];
const API_BASE = process.env.ACTIVITY_API_BASE || 'https://app-a1c57bc9c2-d5glgsllk7b7bd845-1252166086.ap-shanghai.app.tcloudbase.com/api';

function parseToolResult(result) {
  const text = readToolText(result);
  try { return JSON.parse(text); } catch { return { success: !result?.isError, message: text }; }
}

function assertSuccess(label, result) {
  const parsed = parseToolResult(result);
  if (result?.isError || parsed?.success === false) {
    throw new Error(`${label}失败：${parsed?.message || readToolText(result) || '未知错误'}`);
  }
  process.stdout.write(`✓ ${label}\n`);
  return parsed;
}

async function call(client, label, name, args, timeout = 120000) {
  return assertSuccess(label, await client.callTool(name, args, timeout));
}

async function applyMigration(client) {
  for (const [migrationVersion, migrationName] of MIGRATIONS) {
    const migrationFile = path.join(__dirname, 'migrations', `${migrationVersion}_${migrationName}.sql`);
    const sql = fs.readFileSync(migrationFile, 'utf8');
    await call(client, `排行榜数据库迁移 ${migrationName}`, 'managePgDatabase', {
      action: 'applyMigration',
      migrationName,
      migrationVersion,
      sql,
      confirm: true,
    }, 660000);
  }
}

async function deployFunction(client) {
  await call(client, '更新 activity_api 云函数代码', 'manageFunctions', {
    action: 'updateFunctionCode',
    functionName: 'activity_api',
    functionRootPath: FUNCTION_ROOT,
  }, 660000);
}

async function ensureRoutes(client) {
  const listed = await call(client, '读取现有网关路由', 'queryGateway', { action: 'listRoutes' });
  const routes = listed?.data?.routes || [];
  const httpServiceRoute = routes.find((item) => (item.DomainType || item.domainType) === 'HTTPSERVICE') || routes[0];
  const domain = httpServiceRoute?.Domain || httpServiceRoute?.domain;
  if (!domain) throw new Error('未找到可用的 HTTPSERVICE 网关域名');
  const desired = [
    { path: '/api/health', auth: false },
    { path: '/api/leaderboard', auth: false },
    { path: '/api/leaderboard/me', auth: true },
    { path: '/api/leaderboard/submit', auth: true },
  ];
  for (const route of desired) {
    const exists = routes.some((item) => (item.Path || item.path) === route.path);
    await call(client, `${exists ? '更新' : '创建'}路由 ${route.path}`, 'manageGateway', {
      action: exists ? 'updateRoute' : 'createRoute',
      domain,
      path: route.path,
      targetName: 'activity_api',
      upstreamResourceType: 'WEB_SCF',
      auth: route.auth,
      enablePathTransmission: true,
      enable: true,
    });
  }
}

async function verifyCloud(client) {
  const table = await call(client, '验证排行榜数据表', 'queryPgDatabase', {
    action: 'sql',
    sql: 'select count(*)::integer as total from public.leaderboard_entries',
  });
  const total = table?.data?.rows?.[0]?.total ?? table?.data?.[0]?.total ?? 0;
  process.stdout.write(`  当前云端榜单记录：${total}\n`);

  const health = await fetch(`${API_BASE}/health`);
  const healthBody = await health.json();
  if (!health.ok || healthBody.code !== 0) throw new Error(`健康检查失败（HTTP ${health.status}）`);
  process.stdout.write('✓ 线上健康检查\n');

  const leaderboard = await fetch(`${API_BASE}/leaderboard`);
  const leaderboardBody = await leaderboard.json();
  if (!leaderboard.ok || leaderboardBody.code !== 0 || !Array.isArray(leaderboardBody.data)) {
    throw new Error(`公开榜单读取失败（HTTP ${leaderboard.status}）`);
  }
  if (leaderboardBody.data.length > 50) throw new Error('公开榜单返回超过 50 条');
  process.stdout.write(`✓ 线上公开榜单读取（${leaderboardBody.data.length} 条）\n`);

  const classicBoard = await fetch(`${API_BASE}/leaderboard?gameMode=classic`).then((response) => response.json());
  const parallelBoard = await fetch(`${API_BASE}/leaderboard?gameMode=random_trade`).then((response) => response.json());
  if (!Array.isArray(classicBoard.data) || classicBoard.data.some((row) => row.game_mode !== 'classic')) {
    throw new Error('经典模式排行榜隔离验证失败');
  }
  if (!Array.isArray(parallelBoard.data) || parallelBoard.data.some((row) => row.game_mode !== 'random_trade')) {
    throw new Error('平行模式排行榜隔离验证失败');
  }
  if (JSON.stringify(leaderboardBody.data) !== JSON.stringify(classicBoard.data)) {
    throw new Error('旧版缺省排行榜不再等同于经典模式');
  }
  process.stdout.write(`✓ 双模式榜单隔离（经典 ${classicBoard.data.length} 条，平行 ${parallelBoard.data.length} 条）\n`);

  const rejected = await fetch(`${API_BASE}/leaderboard/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (rejected.status !== 401 && rejected.status !== 403) {
    throw new Error(`写接口匿名访问未被拦截（HTTP ${rejected.status}）`);
  }
  process.stdout.write('✓ 写接口登录保护\n');
}

async function main() {
  const credentialsPath = process.env.CLOUDBASE_CREDENTIALS_PATH
    ? path.resolve(process.env.CLOUDBASE_CREDENTIALS_PATH)
    : path.join(ROOT, 'credentials.json');
  if (!fs.existsSync(credentialsPath)) throw new Error('缺少 credentials.json');
  const phase = process.argv[2] || process.env.DEPLOY_PHASE || 'all';
  const client = await createClient();
  try {
    await client.login();
    process.stdout.write('✓ CloudBase MCP 鉴权\n');
    if (phase === 'all' || phase === 'migration') await applyMigration(client);
    if (phase === 'all' || phase === 'function') await deployFunction(client);
    if (phase === 'all' || phase === 'routes') await ensureRoutes(client);
    if (phase === 'all' || phase === 'verify') await verifyCloud(client);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
