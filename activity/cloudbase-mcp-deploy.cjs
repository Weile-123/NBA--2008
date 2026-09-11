const fs = require('fs');
const path = require('path');
const { createClient, readToolText } = require('./cloudbase-mcp-tools.cjs');

const ROOT = path.resolve(__dirname, '..');
const FUNCTION_ROOT = path.join(__dirname, 'cloudfunctions');
const MIGRATION_VERSION = '20260911120100';
const MIGRATION_NAME = 'create_legendary_leaderboard';
const MIGRATION_FILE = path.join(__dirname, 'migrations', `${MIGRATION_VERSION}_${MIGRATION_NAME}.sql`);
const API_BASE = 'https://app-0f7b7f394c-d8gy4o4bpcde2aff7-1252166086.ap-shanghai.app.tcloudbase.com/api';

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
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  await call(client, '排行榜数据库迁移', 'managePgDatabase', {
    action: 'applyMigration',
    migrationName: MIGRATION_NAME,
    migrationVersion: MIGRATION_VERSION,
    sql,
    confirm: true,
  }, 660000);
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
  const desired = [
    { path: '/api/health', auth: false },
    { path: '/api/leaderboard', auth: false },
    { path: '/api/leaderboard/me', auth: true },
    { path: '/api/leaderboard/submit', auth: true },
  ];
  for (const route of desired) {
    const exists = routes.some((item) => item.Path === route.path);
    await call(client, `${exists ? '更新' : '创建'}路由 ${route.path}`, 'manageGateway', {
      action: exists ? 'updateRoute' : 'createRoute',
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
  if (!fs.existsSync(path.join(ROOT, 'credentials.json'))) throw new Error('缺少 credentials.json');
  const phase = process.env.DEPLOY_PHASE || 'all';
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
