import { RetiredPlayerRecord } from '../types';

const API_BASE = 'https://app-0f7b7f394c-d8gy4o4bpcde2aff7-1252166086.ap-shanghai.app.tcloudbase.com/api';
const ENV_ID = 'app-0f7b7f394c-d8gy4o4bpcde2aff7';

function ensureSuccess(response: { statusCode?: number; code?: number; message?: string }) {
  if (response.statusCode !== 200 || (response.code !== 0 && response.code !== 200)) throw new Error(response.message || '全网传奇榜暂时不可用');
}

export async function fetchGlobalHallOfFame(): Promise<RetiredPlayerRecord[]> {
  const request = window.ColorboxAI?.cloud?.request;
  if (!request) return [];
  const response = await request({ url: `${API_BASE}/leaderboard` });
  ensureSuccess(response);
  const rows = Array.isArray(response.data) ? response.data as Array<{ record?: RetiredPlayerRecord }> : [];
  return rows.map((row) => row.record).filter((record): record is RetiredPlayerRecord => !!record);
}

export async function uploadToGlobalHallOfFame(record: RetiredPlayerRecord): Promise<void> {
  const request = window.ColorboxAI?.cloud?.request;
  if (!request) return;
  const response = await request({ url: `${API_BASE}/leaderboard/submit`, method: 'POST', envId: ENV_ID, auth: true, data: { score: record.goatScore, displayName: record.player.name, record } });
  ensureSuccess(response);
}
