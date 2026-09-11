/** ColorBox storage adapter with an IndexedDB recovery copy for regular browsers. */
const DB_NAME = 'basketball-legend-local';
const STORE_NAME = 'values';
const cache = new Map<string, unknown>();
const activeChunkBanks = new Map<string, 0 | 1>();
const writeQueues = new Map<string, Promise<void>>();
const MAX_COLORBOX_CHUNK_CHARS = 48_000;

type ColorBoxStorage = {
  getValue?: (key: string) => Promise<unknown>;
  setValue?: (value: Record<string, unknown>) => Promise<unknown>;
};

type ChunkMarker = { __chunks: number; __bank?: 0 | 1 };
type HydratedValueValidator = (key: string, value: unknown) => boolean;

function bridge(): ColorBoxStorage | undefined {
  return window.ColorboxAI?.storage;
}

async function waitForBridge(timeoutMs = 2000): Promise<ColorBoxStorage | undefined> {
  const ready = bridge();
  if (ready?.getValue && ready?.setValue) return ready;
  const isLocalBrowser = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!window.ColorboxAI && isLocalBrowser) return undefined;
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const current = bridge();
      if (current?.getValue && current?.setValue) {
        window.clearInterval(timer);
        resolve(current);
      } else if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer);
        resolve(undefined);
      }
    }, 50);
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function unwrap<T>(key: string, value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') return value as T;
  const object = value as Record<string, unknown>;
  if (key in object) return object[key] as T;
  if ('data' in object) {
    if (object.data && typeof object.data === 'object' && key in (object.data as Record<string, unknown>)) {
      return (object.data as Record<string, T>)[key];
    }
    return object.data as T;
  }
  if ('value' in object) return object.value as T;
  return value as T;
}

/**
 * ColorBox returns stored objects and arrays as JSON text. Convert only text
 * that looks like a complete object/array so ordinary string values such as a
 * save-slot id remain unchanged.
 */
export function coerceStored(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text || (text[0] !== '{' && text[0] !== '[')) return value;
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

function assertBridgeWrite(result: unknown): void {
  if (!result || typeof result !== 'object') return;
  const response = result as Record<string, unknown>;
  const nested = response.data && typeof response.data === 'object'
    ? response.data as Record<string, unknown>
    : undefined;
  if (response.ok === false || nested?.ok === false) {
    throw new Error(String(response.message || nested?.message || 'ColorBox 存储写入失败'));
  }
}

async function setBridgeValue(storage: ColorBoxStorage, key: string, value: unknown): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      assertBridgeWrite(await storage.setValue!({ [key]: value }));
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
  throw lastError;
}

function chunkKey(key: string, bank: 0 | 1 | undefined, index: number): string {
  return bank === undefined ? `${key}.chunk.${index}` : `${key}.chunk.${bank}.${index}`;
}

async function readBridgeValue(storage: ColorBoxStorage, key: string): Promise<unknown> {
  const value = coerceStored(unwrap<unknown>(key, await storage.getValue!(key))) as ChunkMarker | unknown;
  if (!value || typeof value !== 'object' || !('__chunks' in value)) return value;
  const marker = value as ChunkMarker;
  if (!Number.isSafeInteger(marker.__chunks) || marker.__chunks < 1 || marker.__chunks > 100) {
    throw new Error(`存储分片信息无效：${key}`);
  }
  const bank = marker.__bank === 0 || marker.__bank === 1 ? marker.__bank : undefined;
  const parts = await Promise.all(Array.from({ length: marker.__chunks }, async (_, index) => {
    const physicalKey = chunkKey(key, bank, index);
    const part = unwrap<unknown>(physicalKey, await storage.getValue!(physicalKey));
    if (typeof part !== 'string') throw new Error(`存储分片内容无效：${physicalKey}`);
    return part;
  }));
  const parsed = JSON.parse(parts.join(''));
  if (bank !== undefined) activeChunkBanks.set(key, bank);
  return parsed;
}

function enqueueBridgeWrite(key: string, value: unknown): Promise<void> {
  const previous = writeQueues.get(key) || Promise.resolve();
  const current = previous.catch(() => undefined).then(async () => {
    const storage = await waitForBridge();
    if (!storage?.setValue) return;
    const serialized = JSON.stringify(value);
    if (serialized.length <= MAX_COLORBOX_CHUNK_CHARS) {
      await setBridgeValue(storage, key, value);
      return;
    }

    const bank: 0 | 1 = activeChunkBanks.get(key) === 1 ? 0 : 1;
    const chunks = Array.from(
      { length: Math.ceil(serialized.length / MAX_COLORBOX_CHUNK_CHARS) },
      (_, index) => serialized.slice(index * MAX_COLORBOX_CHUNK_CHARS, (index + 1) * MAX_COLORBOX_CHUNK_CHARS),
    );
    for (let index = 0; index < chunks.length; index += 1) {
      await setBridgeValue(storage, chunkKey(key, bank, index), chunks[index]);
    }
    await setBridgeValue(storage, key, { __chunks: chunks.length, __bank: bank });
    activeChunkBanks.set(key, bank);
  });
  writeQueues.set(key, current);
  current.finally(() => {
    if (writeQueues.get(key) === current) writeQueues.delete(key);
  }).catch(() => undefined);
  return current;
}

export async function hydratePersistentValues(keys: string[], isValid?: HydratedValueValidator): Promise<void> {
  const storage = await waitForBridge();
  await Promise.all(keys.map(async (key) => {
    try {
      const bridgeValue = storage?.getValue ? await readBridgeValue(storage, key) : null;
      if (bridgeValue !== null && bridgeValue !== undefined && (!isValid || isValid(key, bridgeValue))) {
        cache.set(key, bridgeValue);
        return;
      }
      const fallback = await idbGet(key);
      if (fallback !== null && (!isValid || isValid(key, fallback))) cache.set(key, fallback);
      else cache.delete(key);
    } catch (error) {
      try {
        const fallback = await idbGet(key);
        if (fallback !== null && (!isValid || isValid(key, fallback))) cache.set(key, fallback);
        else cache.delete(key);
      } catch {
        console.warn(`Unable to read stored value: ${key}`, error);
        cache.delete(key);
      }
    }
  }));
}

export function getPersistentValue<T>(key: string): T | null {
  return (cache.get(key) as T | undefined) ?? null;
}

export function setPersistentValue(key: string, value: unknown): void {
  cache.set(key, value);
  void idbSet(key, value).catch((error) => console.error(`Unable to save IndexedDB recovery value: ${key}`, error));
  void enqueueBridgeWrite(key, value).catch((error) => console.error(`Unable to save ColorBox value: ${key}`, error));
}

export function removePersistentValue(key: string): void {
  cache.delete(key);
  activeChunkBanks.delete(key);
  void idbDelete(key).catch((error) => console.error(`Unable to clear IndexedDB value: ${key}`, error));
  void enqueueBridgeWrite(key, null).catch((error) => console.error(`Unable to clear ColorBox value: ${key}`, error));
}

export async function flushPersistentWrites(): Promise<void> {
  await Promise.all([...writeQueues.values()].map((pending) => pending.catch(() => undefined)));
}
