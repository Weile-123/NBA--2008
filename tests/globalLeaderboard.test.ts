import assert from 'node:assert/strict';
import test from 'node:test';
import { loadGlobalHallOfFame, loadMyGlobalHallOfFameRank } from '../src/lib/globalLeaderboard';
import type { RetiredPlayerRecord } from '../src/types';

const record = {
  id: 'legend-response-test',
  player: { name: '测试球员' },
  goatScore: 1234,
} as RetiredPlayerRecord;

function setCloudResponse(response: unknown) {
  const runtimeWindow = {
    ColorboxAI: {
      cloud: {
        request: async () => response,
      },
    },
  };
  Object.assign(globalThis, { window: runtimeWindow });
}

test('reads an object-valued rank from the flat cloud.request response', async () => {
  setCloudResponse({
    statusCode: 200,
    code: 0,
    message: 'success',
    data: { rank: 72, score: 1234, displayName: '测试球员', record },
  });

  const mine = await loadMyGlobalHallOfFameRank();
  assert.equal(mine?.rank, 72);
  assert.equal(mine?.score, 1234);
});

test('reads an object-valued rank from the nested cloud.request response', async () => {
  setCloudResponse({
    statusCode: 200,
    data: {
      code: 0,
      message: 'success',
      data: { rank: 18, score: 1234, displayName: '测试球员', record },
    },
  });

  const mine = await loadMyGlobalHallOfFameRank();
  assert.equal(mine?.rank, 18);
  assert.equal(mine?.score, 1234);
});

test('hides legacy global records above the mandatory retirement age', async () => {
  setCloudResponse({
    statusCode: 200,
    code: 0,
    data: [
      { record: { ...record, id: 'valid', retireAge: 43, finalOvr: 90, peakOvr: 90 } },
      { record: { ...record, id: 'invalid', retireAge: 62, finalOvr: 99, peakOvr: 99 } },
    ],
  });

  const records = await loadGlobalHallOfFame();
  assert.deepEqual(records.map((item) => item.id), ['valid']);
});

test('does not expose an over-age legacy record as my current rank', async () => {
  setCloudResponse({
    statusCode: 200,
    code: 0,
    data: { rank: 1, score: 99999, displayName: '超龄记录', record: { ...record, retireAge: 62 } },
  });

  assert.equal(await loadMyGlobalHallOfFameRank(), null);
});
