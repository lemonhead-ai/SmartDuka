# Agent Architecture

Smart Duka uses one Featherless-hosted Qwen3-32B model through two focused runtime roles. This avoids a slow multi-agent chain and remains well within the subscription's three-concurrent-task limit.

| Role | When it runs | Output | Purpose |
|---|---|---|---|
| Gameplay Agent | When a five-customer batch is needed | Validated customer scenarios | Creates locally grounded shopping stories, requests, and change prompts. |
| Tutor Agent | Only after a learner requests help | Hint, encouragement, focus skill | Gives a short, hint-first intervention without revealing the answer. |

Missions are selected by the deterministic gameplay engine from real progress. Basket validation, prices, stock, arithmetic, rewards, and mission completion remain backend rules rather than model decisions.

The Gameplay Agent's five scenarios are persisted in session state and reused across consecutive customers, so the child does not wait for a model request between normal transactions. A separate Customer Stock Offer prompt is invoked only when an item is unavailable. Insight generation is deliberately deferred from the live gameplay path.

The sync service supplies learner context and approved inventory names. It validates every generated shopping item against active inventory and verifies that payment covers the total. Invalid model output or a failed request is logged; the game falls back to local, approved customer content.
