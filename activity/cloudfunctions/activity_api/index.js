const http = require('http');
const zlib = require('zlib');
const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({ env: process.env.CLOUDBASE_ENV_ID, accessKey: process.env.COLORBOX__ACCESS_KEY });
const rdb = app.rdb({ database: 'public' });
const TABLE = 'leaderboard_entries';
const MAX_LEGENDS = 50;
const MAX_CAREER_AGE = 43;
let cachedRows = null;
let cacheUntil = 0;

function apiPath(req) { return (new URL(req.url, 'http://localhost').pathname || '/').replace(/^\/api(?=\/|$)/, '') || '/'; }
function rows(result) { return Array.isArray(result) ? result : result?.data || result?.rows || []; }
function send(res, statusCode, body) { res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CloudBase-Context' }); res.end(JSON.stringify(body)); }
function error(message, statusCode = 400) { const value = new Error(message); value.statusCode = statusCode; return value; }

function readPuid(req) {
  const raw = req.headers['x-cloudbase-context'];
  if (!raw) throw error('请先登录后再上传传奇记录', 401);
  let buffer = Buffer.from(String(raw).trim(), 'base64');
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) buffer = zlib.gunzipSync(buffer);
  const context = JSON.parse(buffer.toString('utf8'));
  const id = context.customUserId || context.userId || context.uid;
  if (!id) throw error('请先登录后再上传传奇记录', 401);
  return String(id);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 180000) reject(error('传奇记录内容过大')); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(error('请求格式不正确')); } });
    req.on('error', reject);
  });
}

function normalizeRecord(input, score, displayName) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw error('传奇记录格式不正确');
  if (Number(input.goatScore) !== score) throw error('传奇积分校验失败');
  if (!input.player || typeof input.player.name !== 'string') throw error('传奇球员信息不完整');
  if (!Number.isInteger(Number(input.retireAge)) || Number(input.retireAge) > MAX_CAREER_AGE) throw error('退役年龄超过比赛规则上限');
  if (JSON.stringify(input).length > 160000) throw error('传奇记录内容过大');
  return { ...input, goatScore: score, player: { ...input.player, name: displayName } };
}

function isEligibleLeaderboardRow(row) {
  const retireAge = Number(row?.record?.retireAge);
  return Number.isInteger(retireAge) && retireAge <= MAX_CAREER_AGE;
}

async function leaderboard() {
  if (cachedRows && Date.now() < cacheUntil) return cachedRows;
  const candidates = rows(await rdb.from(TABLE).select('id,display_name,score,record,updated_at').order('score', { ascending: false }).order('updated_at', { ascending: true }).order('id', { ascending: true }).limit(MAX_LEGENDS + 50));
  cachedRows = candidates.filter(isEligibleLeaderboardRow).slice(0, MAX_LEGENDS);
  cacheUntil = Date.now() + 5000;
  return cachedRows;
}

async function getRdbServiceToken() {
  const credential = await app.auth().getClientCredential();
  if (typeof credential === 'string' && credential.trim()) return credential.trim();
  if (credential?.access_token?.trim()) return credential.access_token.trim();
  const key = process.env.COLORBOX__ACCESS_KEY;
  if (typeof key === 'string' && key.trim()) return key.trim();
  throw error('数据库服务凭据不可用', 500);
}

async function submit(puid, displayName, score, record) {
  const serviceToken = await getRdbServiceToken();
  const envId = process.env.CLOUDBASE_ENV_ID || process.env.TCB_ENV;
  const response = await fetch(`https://${envId}.api.tcloudbasegateway.com/v1/rdb/rest/rpc/submit_legendary_leaderboard_record`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: serviceToken.startsWith('Bearer ') ? serviceToken : `Bearer ${serviceToken}`,
      'X-Db-Instance': 'default',
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
    },
    body: JSON.stringify({ p_puid: puid, p_display_name: displayName, p_score: score, p_record: record }),
  });
  const raw = await response.text();
  let result = null;
  try { result = raw ? JSON.parse(raw) : null; } catch { /* Keep the public error generic. */ }
  if (!response.ok) throw error('传奇记录暂时无法保存', 500);
  cachedRows = null;
  return Array.isArray(result) ? result[0] : result;
}

async function mine(puid) {
  const row = rows(await rdb.from(TABLE).select('display_name,score,record,updated_at').eq('puid', puid).limit(1))[0];
  if (!row || !isEligibleLeaderboardRow(row)) return null;
  const higher = rows(await rdb.from(TABLE).select('score,record').gt('score', Number(row.score)).limit(5000));
  return { rank: higher.filter(isEligibleLeaderboardRow).length + 1, displayName: row.display_name, score: Number(row.score), record: row.record, updatedAt: row.updated_at };
}

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    const target = apiPath(req);
    if (req.method === 'GET' && target === '/health') return send(res, 200, { code: 0, message: 'ok' });
    if (req.method === 'GET' && target === '/leaderboard') return send(res, 200, { code: 0, message: 'success', data: await leaderboard() });
    if (req.method === 'GET' && target === '/leaderboard/me') return send(res, 200, { code: 0, message: 'success', data: await mine(readPuid(req)) });
    if (req.method === 'POST' && target === '/leaderboard/submit') {
      const input = await readBody(req);
      const score = Number(input.score);
      if (!Number.isSafeInteger(score) || score < 0 || score > 2147483647) throw error('传奇积分格式不正确');
      const displayName = typeof input.displayName === 'string' && input.displayName.trim() ? input.displayName.trim().slice(0, 40) : '传奇球员';
      const result = await submit(readPuid(req), displayName, score, normalizeRecord(input.record, score, displayName));
      const message = result.accepted ? '上传成功' : '已保留更高的历史成绩';
      return send(res, 200, { code: 0, message, data: result });
    }
    return send(res, 404, { code: 404, message: 'not found' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return send(res, statusCode, { code: statusCode, message: statusCode < 500 ? err.message : '服务暂时不可用' });
  }
}).listen(process.env.PORT || 9000);
