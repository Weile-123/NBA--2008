const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OLD_CREDENTIALS = path.join(__dirname, 'legacy-project-backup', 'credentials.json');
const NEW_CREDENTIALS = path.join(__dirname, 'new-project-bootstrap', 'credentials.json');
const TABLE = 'leaderboard_entries';
const MAX_CAREER_AGE = 43;
const EXECUTE = process.argv.includes('--execute');

function credentials(file) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!value.envId || !value.apiKey) throw new Error(`迁移凭据不完整：${file}`);
  return value;
}

function headers(creds, extra = {}) {
  const token = String(creds.apiKey).trim();
  return {
    Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    'X-Db-Instance': 'default',
    'Accept-Profile': 'public',
    'Content-Profile': 'public',
    ...extra,
  };
}

function tableUrl(creds, query = '') {
  return `https://${creds.envId}.api.tcloudbasegateway.com/v1/rdb/rest/${TABLE}${query ? `?${query}` : ''}`;
}

async function readAll(creds) {
  const result = [];
  for (let offset = 0; ; offset += 500) {
    const query = new URLSearchParams({
      select: 'id,puid,display_name,score,record,created_at,updated_at',
      order: 'score.desc,updated_at.asc',
      limit: '500',
      offset: String(offset),
    });
    const response = await fetch(tableUrl(creds, query.toString()), { headers: headers(creds) });
    const body = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(body)) throw new Error(`读取旧排行榜失败（HTTP ${response.status}）`);
    result.push(...body);
    if (body.length < 500) return result;
  }
}

async function writeBatch(creds, rows) {
  const query = new URLSearchParams({ on_conflict: 'puid' });
  const response = await fetch(tableUrl(creds, query.toString()), {
    method: 'POST',
    headers: headers(creds, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify(rows.map(({ puid, display_name, score, record, created_at, updated_at }) => ({
      puid, display_name, score, record, created_at, updated_at,
    }))),
  });
  if (!response.ok) throw new Error(`写入新排行榜失败（HTTP ${response.status}）`);
}

function isOverAge(row) {
  return Number(row?.record?.retireAge) > MAX_CAREER_AGE;
}

async function deleteRows(creds, invalidRows) {
  for (const row of invalidRows) {
    if (typeof row.puid !== 'string' || !row.puid.trim()) throw new Error('异常记录缺少有效玩家标识，已停止清理');
    const query = new URLSearchParams({ puid: `eq.${row.puid}` });
    const response = await fetch(tableUrl(creds, query.toString()), {
      method: 'DELETE',
      headers: headers(creds, { Prefer: 'return=representation' }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(body) || body.length !== 1) {
      throw new Error(`清理异常记录失败（HTTP ${response.status}，玩家 ${row.puid}）`);
    }
  }
}

async function main() {
  const oldCreds = credentials(OLD_CREDENTIALS);
  const newCreds = credentials(NEW_CREDENTIALS);
  if (oldCreds.envId === newCreds.envId) throw new Error('新旧排行榜目标相同，已停止迁移');

  const [sourceRows, existingTargetRows] = await Promise.all([readAll(oldCreds), readAll(newCreds)]);
  const sourceInvalidRows = sourceRows.filter(isOverAge);
  const targetInvalidRows = existingTargetRows.filter(isOverAge);
  const sourceValidRows = sourceRows.filter((row) => !isOverAge(row));
  const targetValidRows = existingTargetRows.filter((row) => !isOverAge(row));
  const bestByUser = new Map();
  for (const row of [...targetValidRows, ...sourceValidRows]) {
    if (!row?.puid || !Number.isSafeInteger(Number(row.score)) || !row.record) {
      throw new Error('旧排行榜存在格式不完整的记录，已停止迁移');
    }
    const prior = bestByUser.get(row.puid);
    if (!prior || Number(row.score) > Number(prior.score)) bestByUser.set(row.puid, row);
  }
  const rows = [...bestByUser.values()];
  const targetScores = new Map(targetValidRows.map((row) => [row.puid, Number(row.score)]));
  const rowsToWrite = rows.filter((row) => !targetScores.has(row.puid) || Number(row.score) > targetScores.get(row.puid));
  process.stdout.write(`旧榜 ${sourceRows.length} 条（超龄 ${sourceInvalidRows.length}），新榜已有 ${existingTargetRows.length} 条（超龄 ${targetInvalidRows.length}），需补迁移有效记录 ${rowsToWrite.length} 条\n`);

  if (!EXECUTE) {
    process.stdout.write('只读检查完成；使用 --execute 才会迁移并清理异常记录\n');
    return;
  }

  for (let index = 0; index < rowsToWrite.length; index += 25) {
    await writeBatch(newCreds, rowsToWrite.slice(index, index + 25));
  }

  const afterMigrationRows = await readAll(newCreds);
  const invalidAfterMigration = afterMigrationRows.filter(isOverAge);
  await deleteRows(newCreds, invalidAfterMigration);

  const targetRows = await readAll(newCreds);
  const remainingInvalidRows = targetRows.filter(isOverAge);
  if (remainingInvalidRows.length > 0) throw new Error(`清理后仍有 ${remainingInvalidRows.length} 条超龄记录`);
  const finalScores = new Map(targetRows.map((row) => [row.puid, Number(row.score)]));
  const missingRows = rows.filter((row) => !finalScores.has(row.puid) || finalScores.get(row.puid) < Number(row.score));
  if (missingRows.length > 0) {
    throw new Error(`迁移校验失败：仍缺少 ${missingRows.length} 条有效玩家记录`);
  }
  process.stdout.write(`新排行榜迁移完成：有效记录 ${targetRows.length} 条，已删除超龄异常记录 ${invalidAfterMigration.length} 条\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
