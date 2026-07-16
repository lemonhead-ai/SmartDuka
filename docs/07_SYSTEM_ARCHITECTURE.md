# System Architecture

Smart Duka is a Next.js PWA with a FastAPI backend.

1. On first online launch, the PWA calls `POST /api/v1/sync/bootstrap`.
2. FastAPI runs Customer, Tutor, and Mission in one concurrent batch.
3. The response contains five validated scenarios and an active mission, cached in IndexedDB.
4. The shop can complete cached scenarios offline and queues events locally.
5. When connectivity returns, `POST /api/v1/sync/upload` stores each event idempotently, updates progress, and refills the cache.

The backend uses SQLite for the reliable hackathon demo. The service boundary is deliberately small: gameplay routes provide a deterministic online demo, while sync owns AI generation and offline cache refill. If an agent batch fails, the server logs the precise failure and returns a sync error instead of silently generating replacement content. The frontend service worker caches the app shell; IndexedDB holds playable content and unsynced events.
