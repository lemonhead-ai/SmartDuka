# 07 · System Architecture

---

## High-Level Overview

Smart Duka is a monorepo containing a Next.js PWA frontend and a Python FastAPI backend. The frontend is offline-first — it runs a full gameplay loop from a local IndexedDB cache and syncs to the backend when connectivity is available. The backend orchestrates seven GPT-5.6 agents and serves a REST API.

```
┌─────────────────────────────────────────────────────────────┐
│                     Child's Device                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Next.js PWA (offline-first)                 │   │
│  │                                                      │   │
│  │  ┌─────────────────┐   ┌──────────────────────────┐  │   │
│  │  │  Game UI        │   │  Offline Store (idb)     │  │   │
│  │  │  React + Zustand│   │  events / scenarios      │  │   │
│  │  └────────┬────────┘   └──────────────────────────┘  │   │
│  │           │                         ▲                 │   │
│  │           ▼                         │ cache hit       │   │
│  │  ┌─────────────────┐   ┌──────────────────────────┐  │   │
│  │  │  Sync Manager   │◄──│  Connectivity Detector   │  │   │
│  │  └────────┬────────┘   └──────────────────────────┘  │   │
│  └───────────┼────────────────────────────────────────── ┘   │
└──────────────┼──────────────────────────────────────────────┘
               │ HTTPS (when online)
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                           │
│                                                             │
│  ┌──────────┐  ┌────────────┐  ┌───────────────────────┐   │
│  │  Auth    │  │  REST API  │  │  Sync Service         │   │
│  │  (JWT)   │  │  Routes    │  │  (agent orchestrator) │   │
│  └──────────┘  └─────┬──────┘  └──────────┬────────────┘   │
│                      │                     │                 │
│            ┌─────────▼─────────────────────▼──────────┐     │
│            │           Service Layer                   │     │
│            │  auth · gameplay · missions · rewards     │     │
│            │  leaderboard · progress · parents         │     │
│            └──────────┬──────────────────────┬─────────┘     │
│                       │                      │               │
│            ┌──────────▼──────┐    ┌──────────▼──────────┐   │
│            │   PostgreSQL    │    │   Redis Cache       │   │
│            │   (primary DB)  │    │   (agent output     │   │
│            └─────────────────┘    │    + sessions)      │   │
│                                   └─────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              GPT-5.6 Agent Layer                     │   │
│  │  Customer · Tutor · Mission · Localization           │   │
│  │  Insight · Difficulty · Reward                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
               │
               ▼
        OpenAI API (GPT-5.6)
```

---

## Frontend Architecture

### Technology
- **Next.js 15** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS** for utility styling
- **Framer Motion** for all animations
- **Zustand** for global state
- **React Query** for server state
- **idb** for IndexedDB offline storage

### App Router Structure

```
frontend/app/
├── (marketing)/
│   ├── page.tsx               ← Landing page
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   └── privacy/page.tsx
│
├── (auth)/
│   ├── sign-in/page.tsx       ← PIN entry for children
│   ├── sign-up/page.tsx       ← New account (guardian creates)
│   ├── onboarding/page.tsx    ← Age band selection, name, avatar
│   └── select-avatar/page.tsx
│
├── (game)/
│   ├── layout.tsx             ← Game shell: sidebar + main area
│   ├── dashboard/page.tsx     ← Home: streak, coins, mission, leaderboard rank
│   ├── adventure/page.tsx     ← Mission narrative mode
│   ├── shop/page.tsx          ← MAIN: duka gameplay screen
│   ├── backpack/page.tsx      ← Earned items and collectibles
│   ├── rewards/page.tsx       ← Badges and achievements showcase
│   ├── leaderboard/page.tsx   ← Class and national boards
│   ├── streak/page.tsx        ← Streak calendar view
│   ├── achievements/page.tsx  ← All badges, locked and unlocked
│   ├── profile/page.tsx       ← Avatar, shop name, stats
│   ├── settings/page.tsx      ← Language, sound, account
│   └── parents/page.tsx       ← Guardian dashboard (PIN-protected)
│
├── layout.tsx                 ← Root layout: fonts, providers
├── globals.css                ← CSS variables, Montserrat import
└── page.tsx                   ← Root redirect to /dashboard or /sign-in
```

### Component Structure

```
frontend/components/
├── ui/                        ← Base design system: Button, Card, Input, Badge, Modal
├── buttons/                   ← Specialised button variants
├── cards/                     ← Card variants (game card, stat card, mission card)
├── dialogs/                   ← Modal, BottomSheet, Popover
├── forms/                     ← Input, PinEntry, NumberPad, Toggle
├── navigation/                ← Sidebar, TopBar, BottomNav (mobile)
├── layout/                    ← PageShell, ContentArea, SidebarLayout
├── animations/                ← AnimatedCoin, CelebrationScreen, PageTransition
├── game/                      ← DukaShelf, DukaCounter, StockRoom, Ledger
├── customer/                  ← CustomerNPC, ShoppingList, PaymentScreen
├── tutor/                     ← HintOverlay, SkillProgress, ErrorFeedback
├── inventory/                 ← BackpackGrid, ItemCard, UpgradePreview
├── leaderboard/               ← LeaderboardTable, RankBadge, ScoreRow
├── profile/                   ← AvatarDisplay, ShopNameTag, StatsSummary
├── rewards/                   ← BadgeCard, CoinDisplay, UnlockAnimation
├── charts/                    ← ProgressBar, SkillRadar (parent dashboard only)
└── common/                    ← LoadingSpinner, EmptyState, ErrorBoundary
```

### Feature Module Structure

Each feature is self-contained with its own hooks, types, and service calls.

```
frontend/features/
├── authentication/            ← PIN auth, JWT storage, session management
├── onboarding/                ← Age band selection flow, avatar creation
├── gameplay/                  ← Core game loop state, transaction logic
├── shopping/                  ← Item selection, price calculation, change-giving
├── inventory/                 ← Stock management, reorder logic
├── learning/                  ← Skill tracking, accuracy calculation
├── tutoring/                  ← Error counting, hint trigger, tutor state
├── rewards/                   ← Coin animations, badge unlock, reward queue
├── achievements/              ← Badge catalogue, unlock tracking
├── streaks/                   ← Daily streak logic, calendar tracking
├── leaderboard/               ← Score submission, board fetching
├── parents/                   ← Guardian report display, PIN protection
├── localization/              ← Language toggle, KES formatting, Swahili/English
└── offline/                   ← IndexedDB store, sync manager, connectivity detector
```

### Global State (Zustand)

```typescript
// store/index.ts — top-level store slices

interface AppState {
  child: ChildProfile | null
  session: GameSession | null
  settings: AppSettings
  offline: OfflineState
}

interface GameSession {
  active: boolean
  currentScenario: CustomerScenario | null
  transactionHistory: Transaction[]
  coinsEarned: number
  missionProgress: number
  difficultyTier: number
}

interface OfflineState {
  isOnline: boolean
  scenarioCache: CustomerScenario[]
  pendingEvents: GameEvent[]
  lastSyncAt: string | null
}
```

---

## Backend Architecture

### Technology
- **Python 3.12**
- **FastAPI** (async throughout)
- **SQLAlchemy** async ORM
- **PostgreSQL** primary database
- **Redis** for caching and session state
- **Alembic** for migrations
- **Pydantic v2** for all schemas
- **OpenAI SDK** (async) for GPT-5.6

### Directory Structure

```
backend/src/
├── main.py                    ← FastAPI app, CORS, router registration, lifespan
│
├── api/
│   ├── auth/                  ← POST /auth/login, POST /auth/register, POST /auth/refresh
│   ├── gameplay/              ← POST /gameplay/events, GET /gameplay/session
│   ├── missions/              ← GET /missions/active, POST /missions/complete
│   ├── leaderboard/           ← GET /leaderboard/class, GET /leaderboard/national
│   ├── rewards/               ← GET /rewards/pending, POST /rewards/claim
│   ├── progress/              ← GET /progress/{child_id}, GET /progress/skills
│   ├── parents/               ← GET /parents/report/{child_id}
│   ├── localization/          ← GET /localization/content
│   ├── sync/                  ← POST /sync/upload (main sync endpoint)
│   └── analytics/             ← Internal analytics endpoints
│
├── agents/
│   ├── customer_agent/        ← CustomerAgent class + schemas
│   ├── tutor_agent/           ← TutorAgent class + schemas
│   ├── mission_agent/         ← MissionAgent class + schemas
│   ├── localization_agent/    ← LocalizationAgent class + schemas
│   ├── insight_agent/         ← InsightAgent class + schemas
│   ├── difficulty_agent/      ← DifficultyAgent class + schemas
│   └── reward_agent/          ← RewardAgent class + schemas
│
├── prompts/
│   ├── customer.md
│   ├── tutor.md
│   ├── missions.md
│   ├── localization.md
│   ├── difficulty.md
│   └── insights.md
│
├── services/
│   ├── ai/                    ← OpenAI client wrapper, retry logic, rate limiting
│   ├── auth/                  ← JWT creation, PIN hashing, token validation
│   ├── leaderboard/           ← Score calculation, board aggregation
│   ├── rewards/               ← Reward trigger logic, inventory management
│   ├── missions/              ← Mission state, completion detection
│   ├── sync/                  ← Sync orchestration — calls all agents in order
│   ├── cache/                 ← Redis wrapper for agent output caching
│   └── storage/               ← S3 asset management
│
├── database/
│   ├── models/                ← SQLAlchemy ORM models (see 09_DATABASE_DESIGN.md)
│   ├── repositories/          ← Data access layer — one repo per model
│   ├── migrations/            ← Alembic migration files
│   └── seed/                  ← Dev seed data
│
├── middleware/
│   ├── auth.py                ← JWT validation middleware
│   ├── rate_limit.py          ← Rate limiting per child_id
│   └── logging.py             ← Request logging
│
├── schemas/                   ← Shared Pydantic schemas (not agent-specific)
├── config/                    ← Settings, environment config via pydantic-settings
├── utils/                     ← Shared utilities: date formatting, KES formatting
└── types/                     ← Shared Python type aliases
```

### main.py structure

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.api.auth import router as auth_router
from src.api.gameplay import router as gameplay_router
from src.api.sync import router as sync_router
# ... all routers

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: init DB, Redis, OpenAI client
    yield
    # shutdown: close connections

app = FastAPI(title="Smart Duka API", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(gameplay_router, prefix="/api/gameplay")
app.include_router(sync_router, prefix="/api/sync")
# ... all routers
```

---

## Data Flow — Sync Cycle

```
1. Child plays offline
   ↓ All actions → IndexedDB event log (synced: false)

2. Connectivity detected
   ↓ Sync manager fires

3. POST /api/sync/upload
   Body: { child_id, events: [...], current_cache_size: 3 }
   ↓

4. Backend sync service:
   a. Store events → PostgreSQL
   b. asyncio.gather(difficulty_agent.run(), tutor_agent.run())
   c. asyncio.gather(customer_agent.generate(), mission_agent.generate())
   d. localization_agent.review(scenarios + missions)
   e. reward_agent.process(pending_triggers)
   ↓

5. Response:
   {
     scenarios: [...],      ← 20–30 new customer scenarios
     missions: [...],       ← next 3 daily missions
     rewards: [...],        ← any pending reward drops
     difficulty_profile: {} ← updated difficulty settings
   }
   ↓

6. Frontend:
   a. Replace IndexedDB scenario cache
   b. Mark uploaded events as synced: true
   c. Apply rewards and update Zustand state
   d. Update difficulty profile in Zustand
```

---

## Environment Variables

```bash
# Backend .env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/smartduka
REDIS_URL=redis://host:6379
SECRET_KEY=...                    # JWT signing key
ALLOWED_ORIGINS=http://localhost:3000,https://smartduka.app
S3_BUCKET=smartduka-assets
S3_REGION=af-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

---

## Infrastructure

| Service | Provider | Notes |
|---|---|---|
| Frontend | Vercel | Auto PWA, edge CDN, preview deployments |
| Backend | Railway | Dockerised FastAPI, auto-scaling |
| Database | Railway PostgreSQL | Managed, daily backups |
| Cache | Railway Redis | Session and agent output cache |
| Assets | Cloudflare R2 | S3-compatible, low-latency for Africa |
| CI/CD | GitHub Actions | frontend.yml, backend.yml, deploy.yml |

---

## Local Development

```bash
# Clone and install
git clone https://github.com/your-org/smartduka-ai
cd smartduka-ai
pnpm install

# Start all services
docker-compose up -d   # PostgreSQL + Redis
pnpm run dev           # Next.js on :3000
cd backend && uvicorn src.main:app --reload  # FastAPI on :8000

# Seed database
python scripts/seed.py
```