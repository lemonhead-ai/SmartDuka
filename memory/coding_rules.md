# Coding Rules & Conventions

> Read this file at the start of every Codex session before writing a single line of code.
> Update `/memory/feature_status.md` and `/memory/changelog.md` after every session.

---

## Table of Contents

1. [General Principles](#1-general-principles)
2. [Memory & Session Protocol](#2-memory--session-protocol)
3. [Design System](#3-design-system)
4. [Frontend — Next.js](#4-frontend--nextjs)
5. [Backend — FastAPI](#5-backend--fastapi)
6. [Agent Rules — Qwen3-32B](#6-agent-rules--qwen3-32b)
7. [Offline-First Strategy](#7-offline-first-strategy)
8. [File & Folder Conventions](#8-file--folder-conventions)
9. [Git & PR Rules](#9-git--pr-rules)

---

## 1. General Principles

- This project is **Smart Duka** — an agentic AI education game for children aged 4–13 in East Africa.
- The stack is: **Next.js (frontend)** + **Python FastAPI (backend)** + **Qwen3-32B via Fireworks AI (agents)** + **OpenAI Codex (build tool)**.
- The product philosophy is: **offline-first, locally grounded, agent-personalised, minimalist UI**.
- When in doubt, do less and do it right. A smaller, clean, working feature beats a large broken one.
- Never make up functionality. If a spec is missing, leave a clearly labelled `// TODO:` and continue.
- TypeScript on the frontend, Python on the backend. No exceptions.

---

## 2. Memory & Session Protocol

After every significant Codex session, update the relevant files in `/memory/`:

| File | When to update |
|---|---|
| `feature_status.md` | Mark features: `not started` → `in progress` → `done` |
| `changelog.md` | One-line entry per session: what was built, what changed |
| `known_issues.md` | Log anything broken, incomplete, or behaving unexpectedly |
| `current_tasks.md` | Remove completed tasks, add what's next |
| `architecture_decisions.md` | Document any structural decisions made during the session |

At the start of every new Codex task, read:
1. `/memory/feature_status.md` — know what is and isn't built yet
2. `/memory/known_issues.md` — do not worsen existing bugs
3. `/memory/coding_rules.md` — this file

---

## 3. Design System

> This is the single source of truth for all visual decisions.
> Every frontend task must follow these rules exactly.

### 3.1 Philosophy

This app follows **Apple macOS Tahoe (macOS 26) design language**.
Radical minimalism. White surfaces. Light grey structure. Black typography.
No gradients. No decorative colour. No visual noise.
Every element should feel like it belongs on a clean macOS desktop.

### 3.2 Typography

- Font: **Montserrat** (Google Fonts) — the only typeface in this project.
- Import globally in `app/globals.css` and set on `html, body`.
- Never use Inter, Geist, system-ui, or any other font.

```css
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap');

html, body {
  font-family: 'Montserrat', sans-serif;
}
```

Font weight usage:
- `400` — body text, captions, labels, placeholder text
- `500` — subheadings, nav items, card titles, secondary CTAs
- `600` — primary headings, CTA button labels

### 3.3 Colour Palette

Strict three-tone system. No exceptions without explicit approval.

```css
--color-white:     #FFFFFF   /* primary surface, cards, panels */
--color-grey-soft: #F5F5F7   /* page background, secondary surfaces */
--color-grey-mid:  #E8E8ED   /* borders, dividers, inactive states */
--color-grey-text: #6E6E73   /* secondary text, placeholders, captions */
--color-black:     #1D1D1F   /* primary text, icons, headings */

/* Accent — use on ONE element per screen maximum */
--color-accent:    #0071E3   /* Apple blue — active states, primary CTAs only */
```

Rules:
- Never use red, orange, yellow, green, or purple as UI colours.
- Status indicators use greyscale with text labels only.
- Game elements (coins, badges, rewards) may use isolated illustrative colour inside their own contained component — never bleed into layout chrome.

### 3.4 Border Radius

Nothing in this app has a sharp corner. Minimum radius anywhere is `12px`.

| Element | Radius |
|---|---|
| Buttons | `14px` |
| Input fields | `14px` |
| Cards | `24px` |
| Modal / bottom sheet | `28px` |
| Sidebar container | `20px` |
| Small badges / chips | `99px` (full pill) |
| Avatar circles | `50%` |
| Icon containers | `16px` |
| Page sections | `20px` |

Never use Tailwind's `rounded-sm`, `rounded`, `rounded-md` — always use `rounded-2xl` minimum or explicit values via CSS. Prefer explicit values to guarantee correctness.

### 3.5 Icons — HugeIcons

Use **HugeIcons React** exclusively. No other icon library.

```bash
npm install hugeicons-react
```

```tsx
import { HomeIcon, ShoppingBagIcon, UserIcon } from 'hugeicons-react'

<HomeIcon size={24} color="currentColor" />
```

- Always use the **stroke (outline)** variant — never filled.
- Icon colour must inherit from parent (`color="currentColor"`). Never hardcode icon colour.
- Sizes: sidebar nav `24px` · card actions `20px` · inline/label `16px` · hero/empty state `48px`.
- Never use lucide-react, heroicons, phosphor, or any other icon library.

### 3.6 Animations — Framer Motion

Use **Framer Motion** for all motion. Never use CSS transitions or CSS animations.

```bash
npm install framer-motion
```

```tsx
import { motion, AnimatePresence } from 'framer-motion'
```

Animation tokens — apply these values consistently:

| Interaction | Animation |
|---|---|
| Page enter | `opacity: 0→1`, `y: 8→0`, duration `0.3s`, ease `easeOut` |
| Card hover | `scale: 1→1.015`, duration `0.2s`, ease `easeOut` |
| Button press | `scale: 1→0.97`, duration `0.1s` |
| Sidebar expand | `width` tween, duration `0.35s`, ease `[0.32, 0.72, 0, 1]` |
| Sidebar collapse | `width` tween, duration `0.28s`, ease `[0.32, 0.72, 0, 1]` |
| List item enter | `opacity: 0→1`, `x: -8→0`, stagger `0.05s` per item |
| Modal enter | `opacity: 0→1`, `scale: 0.96→1`, duration `0.25s` |
| Modal exit | `opacity: 1→0`, `scale: 1→0.96`, duration `0.2s` |

Rules:
- Wrap all conditionally rendered elements in `<AnimatePresence>`.
- Never use spring physics for layout animations — use `tween` with the durations above.
- Keep animations subtle. This is a minimalist app, not a showreel.

### 3.7 Sidebar — Glassmorphism / macOS Tahoe

The sidebar replicates macOS Tahoe's floating sidebar. It must:
- Float away from all screen edges (never flush).
- Support expand (240px) and collapse (68px) states.
- Animate smoothly with Framer Motion.
- Use glassmorphism — the page content must be visible through it.

```css
/* Sidebar container */
position: fixed;
top: 16px;
left: 16px;
height: calc(100vh - 32px);
border-radius: 20px;
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(24px) saturate(180%);
-webkit-backdrop-filter: blur(24px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.5);
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.08),
  0 2px 8px rgba(0, 0, 0, 0.04);
z-index: 50;
```

Nav item rules:
- Padding: `10px 14px`, border-radius `14px`.
- Gap between icon and label: `12px`.
- Active: `background: rgba(0,0,0,0.06)`, `font-weight: 500`.
- Hover: `background: rgba(0,0,0,0.04)`, transition via Framer Motion `0.15s`.
- No coloured backgrounds on active states — greyscale only.
- Labels animate opacity (`0→1` on expand, delayed `0.1s`; `1→0` on collapse, immediate).
- A chevron button at the sidebar bottom toggles expand/collapse.

### 3.8 Cards & Surfaces

```css
/* Standard card */
background: #FFFFFF;
border: 1px solid #E8E8ED;
border-radius: 24px;
padding: 24px;
/* No box-shadow on standard cards */

/* Elevated card — modals and popovers only */
box-shadow:
  0 4px 24px rgba(0, 0, 0, 0.08),
  0 1px 4px rgba(0, 0, 0, 0.04);
```

- Page background is always `#F5F5F7`. Never white.
- Never place white cards on a white page background.
- Never use coloured card backgrounds.

---

## 4. Frontend — Next.js

### 4.1 Core Rules

- TypeScript strictly — `strict: true` in `tsconfig.json`. No `any`. No `@ts-ignore`.
- Use the **App Router** (`/app` directory). Never use Pages Router.
- Tailwind CSS for utility classes — but always respect the design system values above.
  - When Tailwind defaults conflict with design system values, use inline styles or CSS variables.
- Zustand for all global state. React Query for all server-fetched state.
- Never use `useEffect` for data fetching — use React Query.

### 4.2 Component Rules

- Every component is a named export, not a default export (except page files which must be default exports per Next.js).
- Co-locate component styles, types, and logic in the same folder.
- Component folder structure:
  ```
  components/game/DukaShelf/
    index.tsx        ← the component
    types.ts         ← component-specific types
    hooks.ts         ← component-specific hooks (if needed)
  ```
- Keep components under 200 lines. Extract sub-components if longer.
- Use `'use client'` only when the component genuinely needs browser APIs or event handlers.

### 4.3 Styling Rules

- Use Tailwind for spacing, layout, and responsive behaviour.
- Use CSS variables (declared in `globals.css`) for all colours, radii, and shadows.
- Use Framer Motion for all transitions — never Tailwind's `transition-*` utilities.
- Glassmorphism styles (sidebar) must be written as CSS, not Tailwind — Tailwind's `backdrop-blur` does not support the `saturate` combination reliably.

### 4.4 Platform Target

- Build as a **responsive web application (PWA)** optimised for desktop browser testing during the hackathon.
- Mobile layout is a secondary concern for the hackathon demo — desktop first.
- Offline functionality is non-negotiable at all times regardless of platform target.

---

## 5. Backend — FastAPI

### 5.1 Core Rules

- All route handlers must be `async def`.
- Use **Pydantic v2** for all request and response schemas. No raw dicts.
- Database access uses **SQLAlchemy async sessions** (`AsyncSession`). Never use synchronous sessions.
- Use dependency injection (`Depends`) for database sessions and authentication.
- All endpoints return typed Pydantic response models — never return raw dicts.

### 5.2 Route Structure

```python
# Every route file follows this pattern
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.session import get_db
from src.schemas.gameplay import GameEventCreate, GameEventResponse

router = APIRouter(prefix="/gameplay", tags=["gameplay"])

@router.post("/events", response_model=GameEventResponse)
async def log_event(
    payload: GameEventCreate,
    db: AsyncSession = Depends(get_db)
) -> GameEventResponse:
    ...
```

### 5.3 Error Handling

- Use `HTTPException` with meaningful status codes and detail messages.
- Never let exceptions propagate unhandled to the client.
- Log errors with Python's `logging` module — never `print()`.

### 5.4 Environment Variables

- All secrets and config live in `.env` — never hardcode.
- Access via `pydantic_settings.BaseSettings` — never `os.environ.get()` directly.
- Required vars: `OPENAI_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`.

---

## 6. Agent Rules — Qwen3-32B

### 6.1 Model

Always use `Qwen/Qwen3-32B` as the model string. Never use any other model in this project.

```python
from openai import AsyncOpenAI

client = AsyncOpenAI()  # reads api key from env

response = await client.chat.completions.create(
    model="Qwen/Qwen3-32B",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ],
    temperature=0.7,
    max_tokens=1000
)
```

### 6.2 Agent Structure

Each agent lives in its own folder under `/backend/src/agents/`:

```
agents/
  customer_agent/
    __init__.py
    agent.py        ← the agent class
    schemas.py      ← input/output Pydantic models for this agent
```

Every agent class follows this interface:

```python
class CustomerAgent:
    def __init__(self, client: AsyncOpenAI):
        self.client = client
        self.system_prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        prompt_path = Path(__file__).parent.parent.parent / "prompts" / "customer.md"
        return prompt_path.read_text()

    async def generate(self, context: CustomerContext) -> list[CustomerScenario]:
        ...
```

### 6.3 Prompt Files

- All system prompts live in `/backend/src/prompts/` as `.md` files.
- Prompts are loaded from disk at runtime — never hardcode prompt text in Python files.
- Prompts are versioned through git — never edit a prompt without a commit message explaining why.
- Every prompt file must include: the agent's role, its output format (JSON schema), its constraints, and at least two examples.

### 6.4 Agent Output

- All agents must return structured JSON that matches a Pydantic schema.
- Instruct the model to return JSON in the system prompt.
- Parse with `json.loads()` inside a `try/except` — never trust raw model output.
- On parse failure: log the raw output, return a safe fallback, never crash the request.

### 6.5 The Seven Agents

| Agent | File | Responsibility |
|---|---|---|
| Customer Agent | `customer_agent/` | Generate NPC customers with shopping lists and personalities |
| Tutor Agent | `tutor_agent/` | Analyse error patterns, adjust difficulty, generate hints |
| Mission Agent | `mission_agent/` | Generate daily and weekly narrative quests |
| Localization Agent | `localization_agent/` | Ensure content uses Swahili, KES, local goods |
| Insight Agent | `insight_agent/` | Generate plain-language weekly reports for teachers/guardians |
| Difficulty Agent | `difficulty_agent/` | Calibrate macro difficulty tier per child per session |
| Reward Agent | `reward_agent/` | Determine personalised reward drops after milestones |

Agents do not call each other directly. They are orchestrated by the sync service in `/backend/src/services/sync/`.

---

## 7. Offline-First Strategy

Offline-first is a non-negotiable design constraint. The game must be fully playable with zero internet.

### 7.1 Frontend (IndexedDB)

- Use the `idb` library for all IndexedDB operations.
- The offline module lives at `/frontend/features/offline/`.
- Two stores must always exist:
  - `events` — logs all child gameplay actions with `{ id, childId, type, payload, timestamp, synced: boolean }`
  - `scenarios` — caches agent-generated content batches with `{ id, type, data, cachedAt, expiresAt }`

### 7.2 Sync Logic

- On connectivity detected: upload unsynced events → receive new scenario batch → mark events synced.
- Sync happens in the background — never block gameplay or show a loading state to the child.
- Connectivity detection: use `navigator.onLine` plus a lightweight ping to `/api/health`.
- Scenario cache must always hold a minimum of 5 scenarios. Never let the cache run empty.
- If the cache is below 5 and there is no connectivity, surface a soft "more adventures coming soon" message — never an error.

### 7.3 Backend (Sync Endpoint)

- `POST /api/sync/upload` accepts an event batch and returns a fresh scenario batch in a single response.
- The sync endpoint triggers the Difficulty Agent and Customer Agent in parallel (use `asyncio.gather`).
- Sync must complete in under 5 seconds — if agents are slow, return cached scenarios and regenerate async.

---

## 8. File & Folder Conventions

### Naming

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase | `DukaShelf.tsx` |
| Hooks | camelCase with `use` prefix | `useOfflineSync.ts` |
| Utilities | camelCase | `formatKES.ts` |
| Types / interfaces | PascalCase, no `I` prefix | `CustomerScenario.ts` |
| Python modules | snake_case | `customer_agent.py` |
| Python classes | PascalCase | `CustomerAgent` |
| API routes | kebab-case path segments | `/api/sync/upload` |
| Database tables | snake_case plural | `game_events`, `child_profiles` |

### Import Order (Frontend)

```tsx
// 1. React and Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { motion } from 'framer-motion'
import { HomeIcon } from 'hugeicons-react'

// 3. Internal — features and services
import { useOfflineSync } from '@/features/offline/hooks'

// 4. Internal — components
import { DukaCard } from '@/components/game/DukaCard'

// 5. Types
import type { CustomerScenario } from '@/types/agents'
```

---

## 9. Git & PR Rules

- Branch naming: `feat/feature-name`, `fix/bug-name`, `chore/task-name`.
- Every Codex-generated PR must include a description explaining what was built and which `/docs/` spec it implements.
- After merging a Codex PR, immediately update `/memory/feature_status.md`.
- Never merge a PR with TypeScript errors or failing tests.
- Commit messages: present tense, imperative mood — `Add CustomerAgent route`, not `Added customer agent`.
- After every Codex session: run `/feedback` in the Codex interface and save the Session ID in `/memory/changelog.md`.