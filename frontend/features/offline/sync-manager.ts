import { getEventsByStatus, saveScenarios, setOfflineMeta, updateEventStatus } from "./db";
import type { CachedScenario, GameEvent } from "./types";

export type SyncResponse = {
  scenarios?: CachedScenario[];
  missions?: { title: string; briefing: string; targetValue: number }[];
  acceptedEventIds?: string[];
  syncedAt?: string;
};

type SyncManagerOptions = {
  endpoint?: string;
  fetcher?: typeof fetch;
  onSyncStateChange?: (state: "idle" | "syncing" | "error") => void;
};

export class OfflineSyncManager {
  private readonly endpoint: string;
  private readonly fetcher: typeof fetch;
  private readonly onSyncStateChange?: SyncManagerOptions["onSyncStateChange"];
  private isSyncing = false;
  private started = false;

  constructor({ endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"}/sync/upload`, fetcher = fetch, onSyncStateChange }: SyncManagerOptions = {}) {
    this.endpoint = endpoint;
    this.fetcher = fetcher;
    this.onSyncStateChange = onSyncStateChange;
  }

  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    window.addEventListener("online", this.handleOnline);
    if (navigator.onLine) void this.sync();
  }

  stop() {
    if (!this.started || typeof window === "undefined") return;
    this.started = false;
    window.removeEventListener("online", this.handleOnline);
  }

  private handleOnline = () => { void this.sync(); };

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
      if (result.scenarios?.length) await saveScenarios(result.scenarios);
      if (result.missions) await setOfflineMeta("active-missions", result.missions);
      await setOfflineMeta("last-successful-sync", Date.now());
      await updateEventStatus(ids, "synced");
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
}

function toSyncPayload(event: GameEvent) {
  return { id: event.id, type: event.type, payload: event.payload, createdAt: event.createdAt, retryCount: event.retryCount };
}
