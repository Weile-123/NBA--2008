/** ColorBox local storage adapter with an IndexedDB fallback for regular browsers. */
const DB_NAME = 'basketball-legend-local';
const STORE_NAME = 'values';
const cache = new Map<string, unknown>();
const MAX_COLORBOX_CHUNK_CHARS = 48_000;
type ColorBoxStorage = { getValue?: (key: string) => Promise<unknown>; setValue?: (value: Record<string, unknown>) => Promise<unknown> };
function bridge(): ColorBoxStorage | undefined { return window.ColorboxAI?.storage; }
function openDatabase(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function idbGet<T>(key: string): Promise<T | null> { const db = await openDatabase(); return new Promise((resolve, reject) => { const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key); request.onsuccess = () => resolve((request.result as T | undefined) ?? null); request.onerror = () => reject(request.error); }); }
async function idbSet(key: string, value: unknown): Promise<void> { const db = await openDatabase(); await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, key); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
async function idbDelete(key: string): Promise<void> { const db = await openDatabase(); await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
function unwrap<T>(key: string, value: unknown): T | null { return value && typeof value === 'object' && key in value ? (value as Record<string, T>)[key] : (value as T | null) ?? null; }
async function readBridgeValue(key: string): Promise<unknown> {
  const value = unwrap<Record<string, number>>(key, await bridge()!.getValue!(key));
  if (!value || typeof value !== 'object' || !('__chunks' in value)) return value;
  const parts = await Promise.all(Array.from({ length: value.__chunks }, (_, index) => bridge()!.getValue!(`${key}.chunk.${index}`).then((part) => unwrap<string>(`${key}.chunk.${index}`, part) || '')));
  return JSON.parse(parts.join(''));
}
export async function hydratePersistentValues(keys: string[]): Promise<void> { await Promise.all(keys.map(async (key) => { try { const value = bridge()?.getValue ? await readBridgeValue(key) : await idbGet(key); if (value !== null) cache.set(key, value); } catch (error) { console.warn(`Unable to read stored value: ${key}`, error); } })); }
export function getPersistentValue<T>(key: string): T | null { return (cache.get(key) as T | undefined) ?? null; }
export function setPersistentValue(key: string, value: unknown): void {
  cache.set(key, value);
  if (!bridge()?.setValue) { void idbSet(key, value).catch((error) => console.error(`Unable to save stored value: ${key}`, error)); return; }
  const serialized = JSON.stringify(value);
  if (serialized.length <= MAX_COLORBOX_CHUNK_CHARS) { void bridge()!.setValue!({ [key]: value }).catch((error) => console.error(`Unable to save stored value: ${key}`, error)); return; }
  const chunks = Array.from({ length: Math.ceil(serialized.length / MAX_COLORBOX_CHUNK_CHARS) }, (_, index) => serialized.slice(index * MAX_COLORBOX_CHUNK_CHARS, (index + 1) * MAX_COLORBOX_CHUNK_CHARS));
  void (async () => { for (let index = 0; index < chunks.length; index += 1) await bridge()!.setValue!({ [`${key}.chunk.${index}`]: chunks[index] }); await bridge()!.setValue!({ [key]: { __chunks: chunks.length } }); })().catch((error) => console.error(`Unable to save stored value: ${key}`, error));
}
export function removePersistentValue(key: string): void { cache.delete(key); if (bridge()?.setValue) void bridge()!.setValue!({ [key]: null }).catch((error) => console.error(`Unable to clear stored value: ${key}`, error)); else void idbDelete(key).catch((error) => console.error(`Unable to clear stored value: ${key}`, error)); }
