# Current Tasks (Hackathon Build)

1. [x] **Task 1**: Scaffold the full Next.js project component tree and app structure.
   - [x] Create base `app/layout.tsx` and `tailwind.config.ts`.
   - [x] Create components (`MissionCard`, `ShopPreview`).
   - [x] Create `app/(game)/dashboard/page.tsx` integrating the components.
   - [x] Create `app/(game)/layout.tsx` for global navigation.
   - [x] Create `app/(game)/shop/page.tsx` for the core game route scaffold.
2. [x] **Task 2**: Write the IndexedDB offline event store and scenario cache in `/features/offline/`.
   - [x] Initialize IndexedDB schema in `features/offline/db.ts` (native IndexedDB).
3. [x] **Task 3**: Generate Customer Agent module and API route.
   - [x] Customer scenarios are generated through the cached Qwen gameplay batch and served through the versioned gameplay API.
4. [x] **Task 4**: Generate Tutor Agent difficulty adjustment pipeline.
   - [x] Tutor help runs on demand; the adaptive difficulty engine persists its recommended tier across gameplay challenges.
5. [x] **Task 5**: Generate Mission Agent module and `/adventure` screen.
   - [x] The agent framework and adventure UI are present; live mission selection is deterministic to preserve Featherless inference capacity.
6. [x] **Task 6**: Write the sync manager for connectivity detection and upload/download queuing.
7. [x] **Task 7**: Write SQLAlchemy models and seed data (demo gameplay scope).
8. [x] **Task 8**: Write unit tests for core logic.
9. [ ] **Task 9**: Insight Agent report template (Manual task by human team).
10.[x] **Task 10**: Integration pass (Wire agents to frontend).
11. [x] **Module 5**: Implement the persistent backend gameplay engine and judge-ready demo loop.
12. [x] **Module 6**: Consolidate REST API v1 and connect the Next.js gameplay scaffold to live endpoints.
13. [x] **Gameplay polish**: Add semantic basket validation, contextual tutoring, sensory feedback, and animated toasts.
14. [x] **Live agent integration**: Initialize and inject the Featherless GLM-5.2 orchestrator into gameplay requests.
15. [x] **Demo reliability pass**: Persist active gameplay state, reconcile offline events safely, and make a clean demo database start ready for judging.
16. [x] **Inventory management**: Restock products, expand the duka catalogue, and handle customer responses to limited stock.
17. [x] **Inference optimisation**: Replace the three-call runtime workflow with cached customer batches, on-demand tutoring, and deterministic mission selection.

## Active Product Backlog

18. [x] **Age-aware adaptive difficulty**: Track short-window accuracy and adjust the session challenge tier gradually.
19. [x] **Budget and shop ledger**: Add learner budget, restocking cost, revenue, expenses, and daily totals.
20. [x] **Advanced numeracy challenges**: Add discounts, bundles, division, and supplier decision scenarios.
21. [x] **Literacy gameplay**: Add customer-native word reading, shopping notes, spelling, and conversational English activities.
22. [x] **Persistent motivation**: Add real daily missions, streaks, badges, and milestone persistence.
   - [x] Persist daily goals, streaks, badges, and milestone completion on the learner profile.
   - [x] Expose live motivation in the dashboard and adventure screens.
23. [x] **Learning summaries**: Add parent- and teacher-facing insight summaries.
   - [x] Provide concise family celebrations, a next step, teacher strengths, and support guidance from real learner data.
   - [x] Show the live summary in the Profile screen.
24. [x] **Accessibility and performance**: Complete mobile, keyboard, audio preference, animation, and latency passes.
   - [x] Add a skip link, visible focus treatment, keyboard sidebar resizing, readable scrollbars, and live-region updates.
   - [x] Make large text, reduced motion, and sound preferences system-wide.
   - [x] Cache read queries and invalidate only the affected learner and shop views after gameplay changes.
25. [ ] **Authentication foundation**: Build secure login, sign-up, password reset, logout, protected routes, and session handling for shopkeepers.
   - [ ] Choose and configure the production authentication provider.
   - [ ] Ensure all auth screens meet the existing accessibility and mobile standards.

26. [ ] **Authenticated Duka creation**: Connect the Create Duka request flow to the authenticated shopkeeper identity.
   - [ ] Create, retrieve, and protect each shopkeeper's duka data.
   - [ ] Remove the remaining demo-only assumptions from duka ownership flows.

27. [ ] **Onboarding flow**: Finalise the first-run journey from account creation through duka creation into the dashboard.
   - [ ] Redirect returning shopkeepers directly to their dashboard.
   - [ ] Keep the flow short, clear, and child-friendly.

28. [ ] **Shopping-list hierarchy**: Make the active Shopping List the primary reference above available shelf items in the shop experience.
   - [ ] Preserve the customer conversation while the learner selects items.
   - [ ] Verify the layout on mobile and desktop.

29. [ ] **Systematic UI/UX revamp**: Review each screen in order and refine hierarchy, responsive behavior, accessibility, loading states, and child-friendly feedback.
   - [ ] Onboarding and authentication screens.
   - [ ] Dashboard, profile, missions, stock room, and shop gameplay screens.

30. [ ] **AI agent pipeline verification**: Verify the end-to-end Customer, Tutor, stock-offer, and shared-context paths with structured logs and integration tests.
   - [ ] Confirm graceful fallbacks preserve gameplay when an inference call fails.
   - [ ] Confirm real model responses are visible in the judge-ready flow without exposing credentials.

31. [ ] **OpenAI runtime validation (blocked on user key)**: Add a user-provided OpenAI API key, configure GPT-5.6 Terra as an optional provider, and validate agent orchestration against it.
   - [ ] Do not commit or expose the key; use local/deployment environment variables only.
   - [ ] Keep Featherless Qwen as the supported fallback until the OpenAI validation is complete.

32. [ ] **Deployment**: Deploy the FastAPI backend to Railway and the Next.js frontend to Vercel.
   - [ ] Configure production environment variables, CORS, health checks, and the frontend API URL.
   - [ ] Validate the deployed demo flow using a clean browser session.

33. [ ] **Insight Agent report template**: Human team task; finalise the submission-facing Insight Agent report template using real project evidence.

34. [ ] **Release rehearsal**: Update documentation and verify the complete judging flow end to end.
