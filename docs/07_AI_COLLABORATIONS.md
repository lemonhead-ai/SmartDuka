# AI Collaboration and Runtime Record

## Purpose

This document separates the AI that helped build Smart Duka from the AI that currently powers its live educational content. It gives judges and contributors a clear, accurate record of both roles.

## Development Collaboration

Smart Duka was developed collaboratively by the project team with OpenAI Codex assistance.

Codex supported the implementation work across the repository, including:

- reviewing and evolving the FastAPI and Next.js architecture;
- creating typed API contracts, database foundations, gameplay services, and tests;
- connecting the gameplay frontend to live versioned REST endpoints;
- implementing live gameplay integrations and demo-readiness safeguards;
- improving basket validation, contextual learner feedback, animations, and accessibility-oriented interaction feedback; and
- validating changes through backend tests and frontend type and production-build checks.

The human team remains responsible for product direction, educational decisions, prompt approval, model credentials, deployment, and final review.

## Current Live Agent Runtime

The live Smart Duka agent runtime currently uses Fireworks AI (via the Featherless API proxy) with the `Qwen/Qwen3-32B` model.

Fireworks/Featherless is configured through server-side environment variables only. The browser never receives the provider API key. Qwen3 non-thinking mode is enabled (`enable_thinking=false`) for this short, structured educational-content workload. At application startup, the backend creates the configured agent bundle and injects the orchestrator into the gameplay and sync services through FastAPI dependencies.

The current runtime generates structured, validated content for:

- customer shopping scenarios;
- learner-friendly, hint-first tutor guidance; and
- customer responses when the requested stock is limited.

Mission selection is deterministic in the current demo runtime.

Gameplay rules, basket validation, scoring, progress, rewards, shop cash, and arithmetic answers remain deterministic backend responsibilities. Agent output is validated against the approved inventory and typed Pydantic contracts before it is used.

## Educational AI Boundary

Codex helped implement the typed ledger, adaptive difficulty progression, and tiered checkout challenges, including the corresponding automated checks and dashboard integration.

Qwen3-32B is valuable for the child-facing parts of those features: natural customer stories, conversational wording, and hint-first tutoring. It is not used to calculate prices, change, discounts, division answers, or shop cash. Those values are deterministic so learners receive accurate feedback every time and the demo remains responsive within Fireworks/Featherless concurrency limits. This separation ensures model inference errors never compromise the core arithmetic or ledger integrity.

## Active Agent Runtime Configuration

The active live runtime uses the `Qwen/Qwen3-32B` model hosted on Fireworks AI (via the Featherless API proxy). The provider abstraction keeps model configuration separate from the game engine, meaning other OpenAI-compatible endpoints or providers can be configured simply by editing server-side environment variables.

## Evidence in This Repository

| Area | Location |
|---|---|
| Runtime provider configuration | `backend/src/core/config.py` |
| Provider and agent-bundle creation | `backend/src/services/ai/factory.py`, `backend/src/services/ai/runtime.py` |
| Agent orchestration | `backend/src/services/ai/orchestrator.py` |
| Gameplay integration | `backend/src/services/gameplay/engine.py` |
| Prompt versions | `backend/src/prompts/` |
| Automated checks | `backend/tests/` |

No API keys, model credentials, learner data, or private prompts are recorded in this document.
