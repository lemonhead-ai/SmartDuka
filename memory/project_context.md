# Project Context: Smart Duka

Smart Duka is an agentic AI educational game for children aged 4–13 in East Africa. The core gameplay revolves around running a virtual corner shop (duka) to teach numeracy, literacy, and financial literacy.

**Important Platform Change:** While the original brief specified a mobile-first PWA, we are prioritizing a **web-based application** for this hackathon build to ensure easy testing on desktop browsers (Windows/Chrome). The UI should be responsive, but desktop/web testing is the primary target.

The project is split into a Next.js frontend (offline-first capability) and a Python FastAPI backend powered by GPT-5.6 Sol agents.

## Current State
- The foundational folder structure is in place.
- Dependencies, `docker-compose.yml`, and GitHub Actions CI/CD workflows have been defined.
- Codex handoff preparation is complete.

## How to Proceed (Instructions for Codex)
You have full authorization to begin building the project based on the specs in the `/docs` folder and the `00_PROJECT_BRIEF.md`. Please refer to `current_tasks.md` for the sequential checklist. 

Start by scaffolding the Next.js component tree in the `frontend/` directory (Task 1), followed by the IndexedDB offline event store (Task 2). Read the requirements from the `docs/` folder if you need detailed specifications for any feature.
