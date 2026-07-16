import type { CachedScenario, EventStatus, GameEvent, GameEventType, OfflineMeta } from "./types";

const DB_NAME = "smart-duka-offline";
const DB_VERSION = 1;
const EVENTS_STORE = "events";
const SCENARIOS_STORE = "scenarios";
const META_STORE = "metadata";
type StoreName = typeof EVENTS_STORE | typeof SCENARIOS_STORE | typeof META_STORE;

function isBrowser() { return typeof window !== "undefined" && "indexedDB" in window; }
function requestToPromise<T>(request: IDBRequest<T>) { return new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed.")); }); }
function transactionDone(transaction: IDBTransaction) { return new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted.")); transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed.")); }); }
function createEventId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export async function openOfflineDatabase(): Promise<IDBDatabase> {
  if (!isBrowser()) throw new Error("Offline storage is only available in the browser.");
  const request = window.indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(EVENTS_STORE)) { const events = database.createObjectStore(EVENTS_STORE, { keyPath: "id" }); events.createIndex("by-status", "status", { unique: false }); events.createIndex("by-created-at", "createdAt", { unique: false }); }
    if (!database.objectStoreNames.contains(SCENARIOS_STORE)) { const scenarios = database.createObjectStore(SCENARIOS_STORE, { keyPath: "id" }); scenarios.createIndex("by-child", "childId", { unique: false }); scenarios.createIndex("by-expiry", "expiresAt", { unique: false }); }
    if (!database.objectStoreNames.contains(META_STORE)) database.createObjectStore(META_STORE, { keyPath: "key" });
  };
  return requestToPromise(request);
}

async function useStore<T>(name: StoreName, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(name, mode);
  try { const result = await operation(transaction.objectStore(name)); await transactionDone(transaction); return result; } finally { database.close(); }
}

export async function queueGameEvent<TPayload = Record<string, unknown>>(type: GameEventType, payload: TPayload): Promise<GameEvent<TPayload>> {
  const event: GameEvent<TPayload> = { id: createEventId(), type, payload, createdAt: Date.now(), status: "pending", retryCount: 0 };
  await useStore(EVENTS_STORE, "readwrite", async (store) => requestToPromise(store.put(event)));
  return event;
}

export async function getEventsByStatus(status: EventStatus): Promise<GameEvent[]> { return useStore(EVENTS_STORE, "readonly", async (store) => requestToPromise(store.index("by-status").getAll(status))); }

export async function updateEventStatus(ids: string[], status: EventStatus): Promise<void> {
  if (!ids.length) return;
  await useStore(EVENTS_STORE, "readwrite", async (store) => { await Promise.all(ids.map(async (id) => { const event = await requestToPromise(store.get(id)) as GameEvent | undefined; if (event) await requestToPromise(store.put({ ...event, status, retryCount: status === "failed" ? event.retryCount + 1 : event.retryCount })); })); });
}

export async function saveScenarios(scenarios: CachedScenario[]): Promise<void> { if (scenarios.length) await useStore(SCENARIOS_STORE, "readwrite", async (store) => { await Promise.all(scenarios.map((scenario) => requestToPromise(store.put(scenario)))); }); }

export async function getPlayableScenarios(childId: string, now = Date.now()): Promise<CachedScenario[]> {
  const scenarios = await useStore(SCENARIOS_STORE, "readonly", async (store) => requestToPromise(store.index("by-child").getAll(childId)));
  return (scenarios as CachedScenario[]).filter((scenario) => !scenario.completedAt && scenario.expiresAt > now).sort((a, b) => a.difficultyTier - b.difficultyTier || a.cachedAt - b.cachedAt);
}

export async function getPlayableScenarioCount(now = Date.now()): Promise<number> {
  const scenarios = await useStore(SCENARIOS_STORE, "readonly", async (store) => requestToPromise(store.getAll()));
  return (scenarios as CachedScenario[]).filter((scenario) => !scenario.completedAt && scenario.expiresAt > now).length;
}

export async function completeScenario(id: string): Promise<void> { await useStore(SCENARIOS_STORE, "readwrite", async (store) => { const scenario = await requestToPromise(store.get(id)) as CachedScenario | undefined; if (scenario) await requestToPromise(store.put({ ...scenario, completedAt: Date.now() })); }); }

export async function removeExpiredScenarios(now = Date.now()): Promise<number> {
  const scenarios = await useStore(SCENARIOS_STORE, "readonly", async (store) => requestToPromise(store.getAll()));
  const expiredIds = (scenarios as CachedScenario[]).filter((scenario) => scenario.expiresAt <= now).map((scenario) => scenario.id);
  if (!expiredIds.length) return 0;
  await useStore(SCENARIOS_STORE, "readwrite", async (store) => { await Promise.all(expiredIds.map((id) => requestToPromise(store.delete(id)))); });
  return expiredIds.length;
}

export async function setOfflineMeta(key: string, value: unknown): Promise<void> { const meta: OfflineMeta = { key, value, updatedAt: Date.now() }; await useStore(META_STORE, "readwrite", async (store) => requestToPromise(store.put(meta))); }
export async function getOfflineMeta<T>(key: string): Promise<T | undefined> { const meta = await useStore(META_STORE, "readonly", async (store) => requestToPromise(store.get(key))) as OfflineMeta | undefined; return meta?.value as T | undefined; }
