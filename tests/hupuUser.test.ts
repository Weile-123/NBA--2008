import assert from 'node:assert/strict';
import test from 'node:test';
import { createRandomChineseName, getHupuUserInfo, getPlayerIdentity } from '../src/lib/hupuUser';

function setWindow(value: unknown) {
  Object.defineProperty(globalThis, 'window', { configurable: true, value });
}

test('returns the logged-in Hupu user nickname', async () => {
  setWindow({ ColorboxAI: { auth: { getUserInfo: async () => ({
    code: 200,
    data: { islogin: 1, puid: '123', nickname: '虎扑用户' },
  }) } } });
  const user = await getHupuUserInfo(true);
  assert.equal(user.nickname, '虎扑用户');
});

test('uses the API message when the request fails', async () => {
  setWindow({ ColorboxAI: { auth: { getUserInfo: async () => ({
    code: 500,
    message: '服务暂时不可用',
  }) } } });
  await assert.rejects(getHupuUserInfo(true), /服务暂时不可用/);
});

test('requires a logged-in account with a nickname', async () => {
  setWindow({ ColorboxAI: { auth: { getUserInfo: async () => ({
    code: 200,
    data: { islogin: 0, nickname: null },
  }) } } });
  await assert.rejects(getHupuUserInfo(true), /请先登录虎扑账号/);
});

test('shows an App-specific message when Colorbox is unavailable', async () => {
  setWindow({});
  await assert.rejects(getHupuUserInfo(true), /请在虎扑 App 内打开/);
});

test('creates a Chinese fallback name without an App environment', async () => {
  setWindow({});
  const identity = await getPlayerIdentity(true);
  assert.equal(identity.source, 'random');
  assert.match(identity.name, /^[\u3400-\u9fff]{2,4}$/);
  assert.match(identity.reason || '', /虎扑 App/);
});

test('keeps the current random name when retrying outside the App', async () => {
  setWindow({});
  const identity = await getPlayerIdentity(true, '赵星河');
  assert.deepEqual(identity.name, '赵星河');
  assert.equal(identity.source, 'random');
});

test('random Chinese names use the supplied random source', () => {
  assert.equal(createRandomChineseName(() => 0), '赵子轩');
});
