# Changelog

## 2026-07-18

- Added persistent daily missions, learning streaks, badges, and milestone completion to learner progress, with a typed gameplay motivation API and live dashboard/adventure views.
- Kept motivation deterministic and local so it remains immediate and does not consume Featherless's limited concurrent inference capacity.
- Added typed parent and teacher learning summaries drawn from saved attempts, accuracy, hints, literacy moments, streaks, badges, and learner level; surfaced them in Profile.
- Completed the accessibility and performance pass: shared large-text/reduced-motion/sound preferences, system-level focus and skip navigation, keyboard sidebar resizing, accessible status updates, and bounded React Query caching with targeted invalidation.
- Added subtle global interaction audio, distinct customer chat send/receive sounds, a hover-expanding conversation scrollbar with message preview, and a slimmer mobile navigation bar; all sounds honour the learner's sound preference.
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
- Wired the startup-created Fireworks AI Qwen3-32B agent bundle into gameplay dependencies, switched Fireworks/Featherless to Chat Completions, and verified a live structured completion.
- Completed the selected demo reliability work: persisted active sessions, real checkout summary/reward feedback, idempotent offline event reconciliation with conflicts, clean SQLite upgrades, and automatic demo-shop setup.
- Added an AI collaboration record covering Codex development assistance and the current Fireworks AI Qwen3-32B runtime.
- Updated the setup route so learners with an existing duka are directed to the dashboard; only learners without a shop see the setup form.
- Switched the live Featherless configuration to `Qwen/Qwen3-32B` with non-thinking mode, added provider support for Featherless chat-template settings, and verified a live completion.
- Added dashboard inventory management, expanded the catalogue, typed restock and product-addition APIs, and AI-backed customer decisions for limited-stock offers.
- Consolidated Qwen orchestration into cached five-customer Gameplay Agent batches and explicit Tutor interventions, removing Mission Agent calls from the live path.
- Added session-aware adaptive difficulty with a bounded accuracy window, typed state tracking, progress-level updates, and unit coverage.
- Added the persisted duka cash ledger, supplier-cost-aware restocking, daily money totals, and dashboard ledger view.
- Added tiered checkout questions for multiplication, 10% bundle discounts, and equal-sharing division, with skill-specific hints and feedback.
# Authentication foundation

- Added first-party shopkeeper registration, sign-in, sign-out, current-session, and password-reset contracts under `/api/v1/auth`.
- Added opaque HttpOnly cookies backed by server-side token fingerprints, scrypt password hashes, session revocation, and one-time reset token storage.
- Added responsive, accessible sign-in, sign-up, forgot-password, and reset-password screens. The existing demo learner remains available until authenticated duka ownership is implemented.
- Large language models are intentionally not used for authentication: identity, password hashing, and session revocation require deterministic security controls. Codex assisted by integrating the contracts, API, persistence, screens, and verification tests across the existing stack.

# Authenticated Duka creation

- New accounts now receive a private learner profile. The existing Duka APIs scope creation, retrieval, stock, and ledger data to the signed-in shopkeeper; logged-out judges continue using the isolated demo Duka.
- Landing-page login and sign-up actions now lead to the account flow, and a new sign-up continues directly to Duka setup.

# Landing-page account journey

- Reworked the landing composition around the supplied visual reference with SmartDuka branding, a child-friendly bottom card gallery, and clear Log in, Sign up, and Create my duka routes.
- Create my duka intentionally starts at account creation so every real Duka begins with an authenticated owner; the next screen is Duka setup.
- AI models are not required for this deterministic navigation and UI work. Codex translated the visual direction into a responsive Next.js implementation while preserving the product flow.

# First-run onboarding

- Rebuilt Duka setup as a focused, account-protected first-run flow with clear starter-shelf choices and no gameplay navigation.
- New shopkeepers move from sign-up to setup to dashboard; returning shopkeepers are routed to their dashboard or back to setup if their Duka is incomplete.
- AI models are not required for deterministic account routing and product selection. Codex implemented the guarded route, responsive UI, and validation using the existing API contracts.

# Shopping-list hierarchy

- Promoted the customer shopping list to the primary gameplay reference above the available shelf, with live selected-versus-required counts and an explicit basket-ready state.
- Kept the customer conversation persistent beside the shelf on desktop and after it on mobile, so the list remains the first task cue for young learners.
- AI models are not required for this deterministic layout and basket-state presentation. Codex extracted a reusable, typed shopping-list component and integrated it into live and stock-negotiation flows.

# Systematic UI/UX revamp

- Completed the screen-level polish pass: account/onboarding flow, dashboard action hierarchy and recovery feedback, profile and mission presentation, stock-room inventory actions, and gameplay shopping-list priority.
- The stock room now foregrounds available cash, low-stock status, responsive restock actions, and useful loading/error states; the dashboard provides a clear route into the shop without blocking play on partial data failures.
- AI models are not required for deterministic visual hierarchy or resilient UI states. Codex performed the component-level refactor and preserved existing live API contracts.

# Authentication form feedback

- Added password confirmation and accessible show/hide controls to account creation.
- Surface field-specific API validation messages instead of only the generic request-validation heading; sign-up now explains the required 6-character password and mismatched-password cases before sending the request.
- AI models are not required for deterministic form validation. Codex traced the API error contract through the frontend request layer and improved the form feedback.
