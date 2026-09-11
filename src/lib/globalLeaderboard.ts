import { RetiredPlayerRecord } from '../types';
import { getPersistentValue, setPersistentValue } from './persistentStorage';
import { normalizeRetiredPlayerPeak } from '../utils/calc2k';

// 活动宿主发布时可注入网关地址；本地预览仍使用已绑定活动环境。
const API_BASE = (window.ACTIVITY_API_BASE || 'https://app-0f7b7f394c-d8gy4o4bpcde2aff7-1252166086.ap-shanghai.app.tcloudbase.com/api').replace(/\/+$/, '');
const ENV_ID = 'app-0f7b7f394c-d8gy4o4bpcde2aff7';
const PENDING_UPLOAD_KEY = 'career.hof.pending-global-upload.v1';
type CloudResponse = { statusCode?: number; code?: number; message?: string; data?: unknown };

function envelope(response: CloudResponse): CloudResponse {
  return response.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? { ...response, ...(response.data as CloudResponse), data: (response.data as CloudResponse).data }
    : response;
}

function ensureSuccess(response: CloudResponse) {
  const result = envelope(response);
  if (result.statusCode !== 200 || (result.code !== 0 && result.code !== 200)) throw new Error(result.message || '全网传奇榜暂时不可用');
  return result;
}

async function submit(record: RetiredPlayerRecord): Promise<void> {
  const request = window.ColorboxAI?.cloud?.request;
  if (!request) throw new Error('请在虎扑 App 内登录后上传全网传奇榜');
  const normalizedRecord = normalizeRetiredPlayerPeak(record);
  const response = ensureSuccess(await request({ url: `${API_BASE}/leaderboard/submit`, method: 'POST', envId: ENV_ID, auth: true, data: { score: normalizedRecord.goatScore, displayName: normalizedRecord.player.name, record: normalizedRecord } }));
  if (response.code !== 0 && response.code !== 200) throw new Error(response.message || '全网传奇榜上传失败');
}

export async function fetchGlobalHallOfFame(): Promise<RetiredPlayerRecord[]> {
  const request = window.ColorboxAI?.cloud?.request;
  if (!request) return [];
  const response = ensureSuccess(await request({ url: `${API_BASE}/leaderboard`, method: 'GET', envId: ENV_ID, auth: false }));
  const rows = Array.isArray(response.data) ? response.data as Array<{ record?: RetiredPlayerRecord }> : [];
  return rows.map((row) => row.record).filter((record): record is RetiredPlayerRecord => !!record).map(normalizeRetiredPlayerPeak);
}

export async function uploadToGlobalHallOfFame(record: RetiredPlayerRecord): Promise<void> {
  try {
    await submit(record);
    setPersistentValue(PENDING_UPLOAD_KEY, null);
  } catch (error) {
    setPersistentValue(PENDING_UPLOAD_KEY, record);
    throw error;
  }
}

export async function retryPendingGlobalHallOfFameUpload(): Promise<void> {
  const pending = getPersistentValue<RetiredPlayerRecord>(PENDING_UPLOAD_KEY);
  if (!pending) return;
  await uploadToGlobalHallOfFame(pending);
}
