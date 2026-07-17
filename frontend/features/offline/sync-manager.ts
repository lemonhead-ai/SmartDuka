import { getEventsByStatus, getPlayableScenarioCount, saveScenarios, setOfflineMeta, updateEventStatus } from "./db";
import type { CachedScenario, GameEvent } from "./types";

export type SyncResponse = {
  scenarios?: CachedScenario[];
  missions?: { title: string; briefing: string; targetValue: number }[];
  tutor?: { hint: string; encouragement: string; focusSkill: string };
  acceptedEventIds?: string[];
  conflicts?: { eventId: string; reason: string }[];
  syncedAt?: string;
};

type SyncManagerOptions = {
  endpoint?: string;
  fetcher?: typeof fetch;
  onSyncStateChange?: (state: "idle" | "syncing" | "error") => void;
};

export class OfflineSyncManager {
  private readonly endpoint: string;
  private readonly bootstrapEndpoint: string;
  private readonly fetcher: typeof fetch;
  private readonly onSyncStateChange?: SyncManagerOptions["onSyncStateChange"];
  private isSyncing = false;
  private started = false;

  constructor({ endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"}/sync/upload`, fetcher = fetch, onSyncStateChange }: SyncManagerOptions = {}) {
    this.endpoint = endpoint;
    this.bootstrapEndpoint = endpoint.replace(/\/upload$/, "/bootstrap");
    this.fetcher = fetcher;
    this.onSyncStateChange = onSyncStateChange;
  }

  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    window.addEventListener("online", this.handleOnline);
    if (navigator.onLine) void this.bootstrap().then(() => this.sync()).catch(() => undefined);
  }

  stop() {
    if (!this.started || typeof window === "undefined") return;
    this.started = false;
    window.removeEventListener("online", this.handleOnline);
  }

  private handleOnline = () => { void this.sync(); };

  async bootstrap(): Promise<SyncResponse | undefined> {
    if (typeof navigator === "undefined" || !navigator.onLine) return;
    if (await getPlayableScenarioCount() >= 5) return;
    this.onSyncStateChange?.("syncing");
    try {
      const response = await this.fetcher(this.bootstrapEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "browser" })
      });
      if (!response.ok) throw new Error(`Bootstrap failed with status ${response.status}.`);
      const result = await response.json() as SyncResponse;
      await this.cacheResponse(result);
      this.onSyncStateChange?.("idle");
      return result;
    } catch (error) {
      this.onSyncStateChange?.("error");
      throw error;
    }
  }

  async sync(): Promise<SyncResponse | undefined> {
    if (this.isSyncing || typeof navigator === "undefined" || !navigator.onLine) return;
    const events = [...await getEventsByStatus("pending"), ...await getEventsByStatus("failed")];
    if (!events.length) return;

    this.isSyncing = true;
    this.onSyncStateChange?.("syncing");
    const ids = events.map((event) => event.id);
    await updateEventStatus(ids, "syncing");

    try {
      const response = await this.fetcher(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: events.map(toSyncPayload) })
      });
      if (!response.ok) throw new Error(`Sync failed with status ${response.status}.`);

      const result = await response.json() as SyncResponse;
      await this.cacheResponse(result);
      const acceptedIds = result.acceptedEventIds ?? [];
      const conflicts = result.conflicts ?? [];
      const conflictIds = conflicts.map((conflict) => conflict.eventId);
      const unresolvedIds = ids.filter((id) => !acceptedIds.includes(id) && !conflictIds.includes(id));
      await updateEventStatus(acceptedIds, "synced");
      await Promise.all(conflicts.map((conflict) => updateEventStatus([conflict.eventId], "conflicted", conflict.reason)));
      await updateEventStatus(unresolvedIds, "failed");
      this.onSyncStateChange?.("idle");
      return result;
    } catch (error) {
      await updateEventStatus(ids, "failed");
      this.onSyncStateChange?.("error");
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async cacheResponse(result: SyncResponse): Promise<void> {
    if (result.scenarios?.length) {
      await saveScenarios(result.scenarios);
      await setOfflineMeta("active-child-id", result.scenarios[0].childId);
    }
    if (result.missions) await setOfflineMeta("active-missions", result.missions);
    if (result.tutor) await setOfflineMeta("tutor-guidance", result.tutor);
    await setOfflineMeta("last-successful-sync", Date.now());
  }
}

function toSyncPayload(event: GameEvent) {
  return { id: event.id, type: event.type, payload: event.payload, createdAt: event.createdAt, retryCount: event.retryCount };
}
