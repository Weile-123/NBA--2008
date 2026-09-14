import { RetiredPlayerRecord } from '../types';
import { flushPersistentWrites, getPersistentValue, setPersistentValue } from './persistentStorage';
import { MAX_CAREER_AGE, normalizeRetiredPlayerPeak } from '../utils/calc2k';
import { DEFAULT_GAME_MODE, type GameMode } from '../gameMode';

// This activity is permanently bound to app_a1c57bc9c2. Keep the gateway
// static so a stale host-injected ACTIVITY_API_BASE cannot send player data to
// the CloudBase environment that belonged to the previous project.
const API_BASE = 'https://app-a1c57bc9c2-d5glgsllk7b7bd845-1252166086.ap-shanghai.app.tcloudbase.com/api';
const ENV_ID = 'app-a1c57bc9c2-d5glgsllk7b7bd845';
const pendingUploadKey = (gameMode: GameMode) => `career.${gameMode === DEFAULT_GAME_MODE ? 'hof' : 'random-trade.hof'}.pending-global-upload.v2`;
const LEGACY_CLASSIC_PENDING_UPLOAD_KEY = 'career.hof.pending-global-upload.v1';
type CloudResponse = { statusCode?: number; code?: number; message?: string; data?: unknown };

export interface GlobalHallOfFameRank {
  rank: number;
  score: number;
  displayName: string;
  record: RetiredPlayerRecord;
  updatedAt?: string;
}

function envelope(response: CloudResponse): CloudResponse {
  const nested = response.data;
  // cloud.request can return either:
  // 1. { statusCode, code, data: businessData }, or
  // 2. { statusCode, data: { code, message, data: businessData } }.
  // Only unwrap form 2. Rank and submit results are themselves objects, so
  // blindly unwrapping every object-valued data field discards them.
  const hasTopLevelBusinessCode = response.code !== undefined;
  const isNestedEnvelope = nested && typeof nested === 'object' && !Array.isArray(nested)
    && ('code' in nested || 'statusCode' in nested);
  return !hasTopLevelBusinessCode && isNestedEnvelope
    ? { ...response, ...(nested as CloudResponse), data: (nested as CloudResponse).data }
    : response;
}

function ensureSuccess(response: CloudResponse) {
  const result = envelope(response);
  if (result.statusCode !== 200 || (result.code !== 0 && result.code !== 200)) throw new Error(result.message || '全网传奇榜暂时不可用');
  return result;
}

async function submit(record: RetiredPlayerRecord, gameMode: GameMode): Promise<void> {
  if (!window.ColorboxAI?.cloud?.request) throw new Error('请在虎扑 App 内登录后上传全网传奇榜');
  if (record.retireAge > MAX_CAREER_AGE) throw new Error(`退役年龄超过 ${MAX_CAREER_AGE} 岁上限，无法上传全网传奇榜`);
  const normalizedRecord = { ...normalizeRetiredPlayerPeak(record), gameMode };
  // Keep the SDK call direct so Colorbox's static reviewer can verify the
  // complete business-request chain in the production bundle.
  const response = ensureSuccess(await window.ColorboxAI.cloud.request({ url: `${API_BASE}/leaderboard/submit`, method: 'POST', envId: ENV_ID, auth: true, data: { gameMode, score: normalizedRecord.goatScore, displayName: normalizedRecord.player.name, record: normalizedRecord } }));
  if (response.code !== 0 && response.code !== 200) throw new Error(response.message || '全网传奇榜上传失败');
  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    const result = response.data as { accepted?: boolean; reason?: string };
    if (result.accepted === false && result.reason === 'below_top_50') {
      throw new Error('当前线上榜单仍在升级，退役记录已保留并将在升级后自动补报');
    }
  }
}

export async function loadGlobalHallOfFame(gameMode: GameMode = DEFAULT_GAME_MODE): Promise<RetiredPlayerRecord[]> {
  if (!window.ColorboxAI?.cloud?.request) return [];
  const response = ensureSuccess(await window.ColorboxAI.cloud.request({ url: `${API_BASE}/leaderboard?gameMode=${encodeURIComponent(gameMode)}`, method: 'GET', envId: ENV_ID, auth: false }));
  const rows = Array.isArray(response.data) ? response.data as Array<{ record?: RetiredPlayerRecord }> : [];
  const seenCareerIds = new Set<string>();
  const records: RetiredPlayerRecord[] = [];
  for (const row of rows) {
    const record = row.record;
    if (!record || record.retireAge > MAX_CAREER_AGE) continue;
    // A legacy career can exist under more than one historical account key.
    // Repeated React keys corrupt the DOM when detail/list views remount, so a
    // single career must appear only once in the rendered top-50 list.
    const careerId = typeof record.id === 'string' ? record.id.trim() : '';
    if (careerId && seenCareerIds.has(careerId)) continue;
    if (careerId) seenCareerIds.add(careerId);
    records.push({ ...normalizeRetiredPlayerPeak(record), gameMode });
  }
  return records;
}

export async function loadMyGlobalHallOfFameRank(gameMode: GameMode = DEFAULT_GAME_MODE): Promise<GlobalHallOfFameRank | null> {
  if (!window.ColorboxAI?.cloud?.request) throw new Error('请在虎扑 App 内登录后查看我的排名');
  const response = ensureSuccess(await window.ColorboxAI.cloud.request({ url: `${API_BASE}/leaderboard/me?gameMode=${encodeURIComponent(gameMode)}`, method: 'GET', envId: ENV_ID, auth: true }));
  if (response.data === null || response.data === undefined) return null;
  if (typeof response.data !== 'object' || Array.isArray(response.data)) throw new Error('我的排名数据格式异常');
  const row = response.data as Partial<GlobalHallOfFameRank>;
  if (!Number.isFinite(Number(row.rank)) || !Number.isFinite(Number(row.score)) || !row.record) {
    throw new Error('我的排名数据格式异常');
  }
  if (row.record.retireAge > MAX_CAREER_AGE) return null;
  return {
    rank: Number(row.rank),
    score: Number(row.score),
    displayName: typeof row.displayName === 'string' ? row.displayName : row.record.player.name,
    record: { ...normalizeRetiredPlayerPeak(row.record), gameMode },
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : undefined,
  };
}

export async function uploadToGlobalHallOfFame(record: RetiredPlayerRecord, gameMode: GameMode = record.gameMode || DEFAULT_GAME_MODE): Promise<void> {
  const key = pendingUploadKey(gameMode);
  try {
    await submit(record, gameMode);
    setPersistentValue(key, null);
    if (gameMode === DEFAULT_GAME_MODE) setPersistentValue(LEGACY_CLASSIC_PENDING_UPLOAD_KEY, null);
    await flushPersistentWrites();
  } catch (error) {
    setPersistentValue(key, { ...record, gameMode });
    await flushPersistentWrites();
    throw error;
  }
}

export async function retryPendingGlobalHallOfFameUpload(gameMode: GameMode = DEFAULT_GAME_MODE): Promise<void> {
  const pending = getPersistentValue<RetiredPlayerRecord>(pendingUploadKey(gameMode))
    || (gameMode === DEFAULT_GAME_MODE ? getPersistentValue<RetiredPlayerRecord>(LEGACY_CLASSIC_PENDING_UPLOAD_KEY) : null);
  if (!pending) return;
  await uploadToGlobalHallOfFame(pending, gameMode);
}

/**
 * Reconcile the best locally retired career before reading the current user's
 * global rank. The server keeps the higher score, so this is safe to repeat on
 * every leaderboard visit and also repairs records discarded by older builds.
 */
export async function syncLocalBestAndLoadMyRank(localRecords: RetiredPlayerRecord[], gameMode: GameMode = DEFAULT_GAME_MODE): Promise<GlobalHallOfFameRank | null> {
  const pending = getPersistentValue<RetiredPlayerRecord>(pendingUploadKey(gameMode))
    || (gameMode === DEFAULT_GAME_MODE ? getPersistentValue<RetiredPlayerRecord>(LEGACY_CLASSIC_PENDING_UPLOAD_KEY) : null);
  const candidates = [...localRecords, ...(pending ? [pending] : [])]
    .filter((record) => record.retireAge <= MAX_CAREER_AGE)
    .map(normalizeRetiredPlayerPeak)
    .sort((a, b) => b.goatScore - a.goatScore);
  if (candidates[0]) await uploadToGlobalHallOfFame(candidates[0], gameMode);

  // The write and authenticated read can land on different gateway workers.
  // Allow a short bounded convergence window before declaring the rank empty.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const mine = await loadMyGlobalHallOfFameRank(gameMode);
    if (mine) return mine;
    if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 350 * (attempt + 1)));
  }
  if (candidates[0]) throw new Error('检测到本地退役记录，但全网名次尚未返回，请点击重新同步');
  return null;
}
