# Smart Duka — Hackathon Brief

Smart Duka is an online learning game for Kenyan children. A child runs a virtual duka to practise counting, reading short shopping lists, addition, and change in a familiar KES-based setting.

## Build Week MVP

The Education-track demo is deliberately focused:

- The child completes live, AI-supported shop transactions.
- Customer and Tutor agents provide adaptive scenarios and guidance.
- Unsafe or invalid AI output is rejected and logged at the agent/provider boundary.

The MVP does not include parent/teacher dashboards, leaderboards, social rewards, avatar customisation, or multi-country localisation. Those are future work, not part of the judgeable core loop.

## Core constraints

- Never exceed three concurrent model calls.
- The current web experience requires an internet connection for live gameplay.
- Use KES, Kenyan names, and approved inventory items.
- Keep all agent output Pydantic-validated.
- Use a public, runnable demo with clear setup instructions for judges.
