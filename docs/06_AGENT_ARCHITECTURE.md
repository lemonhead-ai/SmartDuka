# Agent Architecture

Smart Duka uses exactly three GLM 5.2 agents. They run once, concurrently, during a sync/bootstrap request. This stays below the four-task inference limit and keeps gameplay independent of network availability. Runtime content is temporarily English-only; the learner language field remains in the context for future localization.

| Agent | Output | Purpose |
|---|---|---|
| Customer | Five validated customer scenarios | Refills the offline shop cache |
| Tutor | Focus skill and non-revealing hint | Personalises the next cache refill |
| Mission | One achievable local mission | Gives the session narrative purpose |

The sync service supplies the learner context and approved inventory names. It validates every generated shopping item against the active inventory and verifies that payment covers the total. Any failed agent call, invalid JSON, unapproved item, or unavailable model is logged and returned as a clear sync error for investigation; it is not silently replaced.

Agents are never called by gameplay routes. The device plays from IndexedDB and uploads compact completion events when connected.
