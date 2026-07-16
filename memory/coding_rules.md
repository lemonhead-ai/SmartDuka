# Coding Rules & Conventions

## General
- Update the `/memory/` files after every significant Codex session.
- Document any architectural decisions in `architecture_decisions.md`.

## Frontend (Next.js)
- Use TypeScript strictly.
- Use Tailwind CSS for styling.
- Use Zustand for global state management.
- Offline-first is non-negotiable. All critical game loops must function without internet connectivity.
- **Platform Target:** Build as a responsive web application optimized for desktop browser testing.

## Backend (FastAPI)
- Use async handlers (`async def`).
- Use Pydantic for data validation.
- Database access uses SQLAlchemy with async sessions.
- Agent interactions use the OpenAI SDK.
