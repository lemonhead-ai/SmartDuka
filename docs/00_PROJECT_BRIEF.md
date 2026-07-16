# Smart Duka — Hackathon Brief

Smart Duka is an offline-first learning game for Kenyan children. A child runs a virtual duka to practise counting, reading short shopping lists, addition, and change in a familiar KES-based setting.

## Build Week MVP

The Education-track demo is deliberately focused:

- Five playable scenarios are cached locally before play.
- The child completes transactions with or without connectivity.
- Completed offline transactions are queued and synced later.
- A single GPT-5.6 batch concurrently runs Customer, Tutor, and Mission agents to refill content.
- Unsafe or invalid AI output falls back to approved Kenyan inventory and safe local scenarios.

The MVP does not include parent/teacher dashboards, leaderboards, social rewards, avatar customisation, or multi-country localisation. Those are future work, not part of the judgeable core loop.

## Core constraints

- Never exceed three concurrent model calls.
- Never require AI or connectivity to complete a cached scenario.
- Use KES, Kenyan names, and approved inventory items.
- Keep all agent output Pydantic-validated.
- Use a public, runnable demo with clear setup instructions for judges.
