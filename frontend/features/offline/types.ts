export type EventStatus = "pending" | "syncing" | "synced" | "failed" | "conflicted";

export type GameEventType = "session_started" | "item_selected" | "transaction_completed" | "mission_progressed" | "mission_completed" | "session_ended";

export type GameEvent<TPayload = Record<string, unknown>> = {
  id: string;
  type: GameEventType;
  payload: TPayload;
  createdAt: number;
  status: EventStatus;
  retryCount: number;
  conflictReason?: string;
};

export type CachedScenario = {
  id: string;
  childId: string;
  title: string;
  customerName: string;
  customerMood: "calm" | "rushed" | "curious";
  difficultyTier: number;
  payload: Record<string, unknown>;
  cachedAt: number;
  expiresAt: number;
  completedAt?: number;
};

export type OfflineMeta = { key: string; value: unknown; updatedAt: number };
