# Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Project Scaffolding | Done | Basic dependencies and config files set up |
| Next.js App Shell | Done | Responsive game shell, dashboard, shop route, navigation, shared components, and placeholder routes are in place. |
| Offline Storage (IndexedDB) | Done | Event queue, scenario cache, expiry cleanup, persisted replay status, and server conflict handling are implemented with native IndexedDB. |
| Agent Orchestration Pipeline | Done | Featherless-backed Qwen3-32B uses one cached Gameplay Agent batch plus on-demand Tutor interventions; mission selection is deterministic and does not spend live inference. |
| Sync Manager | Done | Syncs pending events on connectivity restoration, acknowledges idempotent retries, surfaces non-retryable conflicts, and caches returned agent content safely. |
| Database Models & Seed | Done | Demo-ready async SQLite models and persistent startup seed cover student, session, question, attempt, and progress. |
| Unit Tests | Done | Backend suite covers foundations, agents, and the persistent gameplay loop. |
| Backend API Contracts | Done | Pydantic v2 contracts define typed gameplay-event and offline-sync request/response boundaries. |
| Backend Foundation | Done | FastAPI application factory, versioned health endpoint, configuration, logging, exception handling, dependency injection, tests, and CI are ready. |
| Demo Gameplay API | Done | Judges can start a seeded learner session, retrieve a stored question, submit an answer, and read persisted progress. |
| Agent System Framework | Done | Tutor, Customer, Difficulty, Mission, Reward, Insight, and Localization agents have typed outputs, versioned prompts, provider abstraction, orchestration, and tests. |
| AI Educational Behaviors | Done | Agent prompts and contracts now enforce encouraging hints, gradual difficulty, achievable missions, improvement-based rewards, concise insights, and Kenyan localization. |
| Gameplay Engine | Done | Persistent demo sessions now support customers, inventory, basket math, hints, checkout challenges, rewards, missions, achievements, and player progress. |
| REST API v1 & Frontend Integration | Done | Consolidated typed gameplay REST API, consistent error contracts, OpenAPI docs, and live React Query frontend integration. |
| Context-Aware Gameplay Validation | Done | Checkout now requires an exact requested basket match, with contextual tutor feedback and animated sensory feedback in the game UI. |
| Demo Loop Recovery & Readiness | Done | Session state survives browser reloads, checkout shows real reward and mission progress, clean demo databases auto-upgrade, and the seeded duka is ready immediately. |
| AI Collaboration Record | Done | A judge-friendly record distinguishes Codex/GPT-5.6 Terra development collaboration from the current Featherless GLM-5.2 live runtime and its planned OpenAI migration. |
| Setup Route Guard | Done | The setup page checks the live shop record first and redirects existing learners to the dashboard instead of presenting setup again. |
| Inventory Management & Customer Stock Offers | Done | Learners can restock and add catalogue products from the dashboard; limited-stock requests pause for an AI customer accept-or-replace response. |
| Session-Aware Adaptive Difficulty | Done | A forgiving three-attempt accuracy window adjusts the recommended tier between 1 and 7 and carries it into challenges, progress, and the next Qwen scenario batch. |
| Shop Cash Ledger | Done | Persisted shop cash records sales, stock purchases, current balance, daily revenue, expenses, and profit; stock purchases are blocked when funds are insufficient. |
| Adaptive Checkout Numeracy | Done | Learners progress from change to quantity multiplication, 10% bundle discounts, and equal-sharing division challenges as their session tier grows. |
