# AI Collaboration and Runtime Record

## Purpose

This document separates the AI that helped build Smart Duka from the AI that currently powers its live educational content. It gives judges and contributors a clear, accurate record of both roles.

## Development Collaboration

Smart Duka was developed collaboratively by the project team with OpenAI Codex and GPT-5.6 Terra assistance.

Codex supported the implementation work across the repository, including:

- reviewing and evolving the FastAPI and Next.js architecture;
- creating typed API contracts, database foundations, gameplay services, and tests;
- connecting the gameplay frontend to live versioned REST endpoints;
- implementing offline event storage, sync reconciliation, and demo-readiness safeguards;
- improving basket validation, contextual learner feedback, animations, and accessibility-oriented interaction feedback; and
- validating changes through backend tests and frontend type and production-build checks.

The human team remains responsible for product direction, educational decisions, prompt approval, model credentials, deployment, and final review.

## Current Live Agent Runtime

The live Smart Duka agent runtime currently uses Featherless AI with the `zai-org/GLM-5.2` model.

Featherless is configured through server-side environment variables only. The browser never receives the provider API key. At application startup, the backend creates the configured agent bundle and injects the orchestrator into the gameplay and sync services through FastAPI dependencies.

The current runtime generates structured, validated content for:

- customer shopping scenarios;
- learner-friendly, hint-first tutor guidance; and
- achievable mission guidance.

Gameplay rules, basket validation, scoring, progress, and rewards remain deterministic backend responsibilities. Agent output is validated against the approved inventory and typed Pydantic contracts before it is used.

## Planned OpenAI Runtime Migration

The team plans to obtain an OpenAI API key and then configure GPT-5.6 Terra as the live agent provider.

The provider abstraction already keeps model configuration separate from the game engine. The migration will require:

1. adding the OpenAI credential to the backend environment;
2. selecting the OpenAI provider and GPT-5.6 Terra model in server configuration;
3. running the existing agent, sync, gameplay, and smoke-test checks; and
4. updating this record to mark GPT-5.6 Terra as the active live runtime.

Until those steps are complete, Featherless AI with GLM-5.2 is the active production/demo agent provider.

## Evidence in This Repository

| Area | Location |
|---|---|
| Runtime provider configuration | `backend/src/core/config.py` |
| Provider and agent-bundle creation | `backend/src/services/ai/factory.py`, `backend/src/services/ai/runtime.py` |
| Agent orchestration | `backend/src/services/ai/orchestrator.py` |
| Gameplay integration | `backend/src/services/gameplay/engine.py` |
| Offline agent sync | `backend/src/services/sync/service.py` |
| Prompt versions | `backend/src/prompts/` |
| Automated checks | `backend/tests/` |

No API keys, model credentials, learner data, or private prompts are recorded in this document.
