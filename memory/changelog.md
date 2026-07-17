# Changelog

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
