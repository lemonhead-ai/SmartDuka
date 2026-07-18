# Changelog

## 2026-07-18

- Added persistent daily missions, learning streaks, badges, and milestone completion to learner progress, with a typed gameplay motivation API and live dashboard/adventure views.
- Kept motivation deterministic and local so it remains immediate and does not consume Featherless's limited concurrent inference capacity.
- Added typed parent and teacher learning summaries drawn from saved attempts, accuracy, hints, literacy moments, streaks, badges, and learner level; surfaced them in Profile.
- Completed the accessibility and performance pass: shared large-text/reduced-motion/sound preferences, system-level focus and skip navigation, keyboard sidebar resizing, accessible status updates, and bounded React Query caching with targeted invalidation.
- Added adaptive customer-native literacy gameplay: English/Kiswahili shelf-word recognition, shopping-note comprehension, basket-linked spelling tiles, and age-gated conversational English.
- Reused the existing learning-attempt, reward, progress, and adaptive-difficulty paths so literacy improves the learner profile alongside numeracy.
- Restyled Milo feedback as an undismissable rounded speech bubble and kept the full stock-substitution conversation visible while the customer updates their order.
- Added regression coverage to ensure post-substitution basket feedback follows the revised request rather than the unavailable product.
- Guarded basket updates from an older customer request so a late response cannot overwrite the accepted substitution in the shop UI.
- Versioned persisted customer requests and basket responses to make substitution state atomic across the SQLite backend and browser UI.

## 2026-07-16

- Established the initial Next.js/Tailwind frontend runtime configuration.
- Added a responsive gameplay shell, reusable navigation, stat/progress cards, mission card, shop preview, and dashboard route.
- Recorded the routing and offline-boundary architecture decisions.
- Added all planned App Router route scaffolds and a static shop transaction screen.
- Implemented IndexedDB event/scenario persistence and a connectivity-aware sync manager.
- Reviewed the backend scaffold, documented the FastAPI target architecture, and added the first API-contract module.
- Implemented and verified the FastAPI backend foundation with versioned routing, health checks, configuration, logging, exception handling, dependencies, tests, and backend CI.
- Added persistent demo gameplay models, startup seed data, and judge-facing session, question, answer, and progress endpoints.
- Implemented the typed seven-agent framework, prompt loader, OpenAI provider abstraction, parallel orchestrator, and unit tests.
- Added educational behavior constraints, richer prompt examples, a stubbed seven-agent loop script, and agent behavior tests.
- Implemented the persistent Module 5 gameplay engine, demo inventory, typed gameplay API, customer checkout loop, rewards, progress tracking, and end-to-end tests.
- Consolidated Module 6 REST API v1 routes, standardized errors and OpenAPI metadata, and connected the Next.js shop/dashboard to live backend data.
- Added exact basket validation, contextual checkout and change feedback, a single animated toast system, and safe browser haptic and sound feedback.
- Wired the startup-created Featherless GLM-5.2 agent bundle into gameplay dependencies, switched Featherless to Chat Completions, and verified a live structured completion.
- Completed the selected demo reliability work: persisted active sessions, real checkout summary/reward feedback, idempotent offline event reconciliation with conflicts, clean SQLite upgrades, and automatic demo-shop setup.
- Added an AI collaboration record covering Codex/GPT-5.6 Terra development assistance, the current Featherless GLM-5.2 runtime, and the planned OpenAI migration.
- Updated the setup route so learners with an existing duka are directed to the dashboard; only learners without a shop see the setup form.
- Switched the live Featherless configuration to `Qwen/Qwen3-32B` with non-thinking mode, added provider support for Featherless chat-template settings, and verified a live completion.
- Added dashboard inventory management, expanded the catalogue, typed restock and product-addition APIs, and AI-backed customer decisions for limited-stock offers.
- Consolidated Qwen orchestration into cached five-customer Gameplay Agent batches and explicit Tutor interventions, removing Mission Agent calls from the live path.
- Added session-aware adaptive difficulty with a bounded accuracy window, typed state tracking, progress-level updates, and unit coverage.
- Added the persisted duka cash ledger, supplier-cost-aware restocking, daily money totals, and dashboard ledger view.
- Added tiered checkout questions for multiplication, 10% bundle discounts, and equal-sharing division, with skill-specific hints and feedback.
