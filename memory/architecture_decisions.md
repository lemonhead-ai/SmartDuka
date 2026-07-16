# Architecture Decisions

## 2026-07-16 — Frontend foundation

- The application uses Next.js App Router route groups to separate child gameplay from marketing/auth flows without changing their public URLs.
- Shared gameplay layout and dashboard presentation components live under `frontend/components/`; page files compose them and carry no presentation duplication.
- The initial dashboard uses static local data only. Agent content and persistence will be introduced through the offline feature modules, so gameplay remains functional without a network connection.

## 2026-07-16 — Offline persistence boundary

- Browser persistence uses native IndexedDB instead of a wrapper library to keep the critical offline path dependency-light and transparent.
- Events are append-only records with explicit sync states; cached scenarios are independently replaceable and have expiry timestamps so stale agent output is never surfaced as playable content.

## 2026-07-16 — Connectivity recovery

- Sync is triggered by the browser `online` event and is safe to call repeatedly. It only transmits pending or failed events, locks each selected event while in flight, and marks failures for retry instead of blocking the child-facing game.

## 2026-07-16 - Backend boundary design

- FastAPI contracts live in `backend/src/contracts/`, separate from ORM models and application services. This keeps the offline sync API stable while database implementation and agents evolve independently.
- The sync contract accepts a bounded batch of discriminated gameplay events and returns customer scenarios, missions, and a difficulty snapshot in one typed response.

## 2026-07-16 - Backend foundation

- The FastAPI application uses `src/core` for cross-cutting concerns, `src/dependencies` for dependency injection, and `src/api/v1` for every HTTP route.
- AI orchestration, sync, and storage are independent service boundaries. Only interfaces are present until their later implementation modules.
