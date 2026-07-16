# 06 · Agent Architecture

---

## Overview

Smart Duka is powered by seven specialised GPT-5.6 Sol agents. Each agent has a single, clearly scoped responsibility. They do not call each other directly — all orchestration goes through the sync service at `/backend/src/services/sync/`.

**Core rule:** Agents never block gameplay. They pre-generate and cache content during sync windows. If an agent fails, the system falls back to cached content gracefully.

---

## Agent Model

All agents use `gpt-5.6` exclusively. All agents:
- Load their system prompt from `/backend/src/prompts/*.md` at runtime (never hardcoded).
- Return structured JSON matching a Pydantic schema.
- Are called via the async OpenAI client.
- Handle parse failures with a safe fallback — never crash the request.

```python
from openai import AsyncOpenAI
from pathlib import Path
import json

client = AsyncOpenAI()  # reads OPENAI_API_KEY from env

async def call_agent(prompt_file: str, user_message: str) -> dict:
    system_prompt = (Path("src/prompts") / prompt_file).read_text()
    response = await client.chat.completions.create(
        model="gpt-5.6",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.7,
        max_tokens=1000
    )
    try:
        return json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        return {}  # caller handles fallback
```

---

## Agent 01 — Customer Agent

**File:** `/backend/src/agents/customer_agent/`
**Prompt:** `/backend/src/prompts/customer.md`
**Triggered by:** Sync upload — called after session events are processed.

### Responsibility
Generate a batch of NPC customer scenarios personalised to the child's current difficulty tier and language preference. Scenarios are cached on the device for offline gameplay.

### Input
```python
class CustomerContext(BaseModel):
    child_id: str
    difficulty_tier: int          # 1–7
    language: str                 # "sw" | "en"
    weak_skills: list[str]        # e.g. ["change_above_100", "multiplication"]
    goods_region: str             # "nairobi" | "kisumu" | "mombasa" | "rural_kenya"
    batch_size: int               # default 20
```

### Output
```python
class CustomerScenario(BaseModel):
    scenario_id: str
    customer_name: str
    customer_personality: str     # one sentence describing behaviour
    greeting: str                 # in target language
    shopping_list: list[ShoppingItem]
    payment_amount: int           # in KES — always >= total
    farewell: str                 # in target language
    targets_skill: str            # which skill this scenario is designed to practise

class ShoppingItem(BaseModel):
    item_name: str                # in target language
    item_name_en: str             # English always provided
    quantity: int
    unit_price: int               # in KES
    illustration_key: str         # maps to /public/illustrations/{key}.svg
```

### Generation rules
- Names must be Kenyan/East African — never Western names.
- Goods must be from the approved local goods list (see `11_LOCALIZATION.md`).
- All prices in KES, realistic to current market rates.
- At least 30% of scenarios in a batch must target the child's identified weak skills.
- Personality must be warm — no hostile, impatient, or shaming customer personalities.
- Generate exactly `batch_size` scenarios per call.

---

## Agent 02 — Tutor Agent

**File:** `/backend/src/agents/tutor_agent/`
**Prompt:** `/backend/src/prompts/tutor.md`
**Triggered by:** Sync upload — analyses session events after upload.

### Responsibility
Analyse the child's error patterns from the most recent session events. Output a skill profile and a set of targeted hint templates. Adjust scenario selection weights for the Customer Agent.

### Input
```python
class TutorContext(BaseModel):
    child_id: str
    session_events: list[SessionEvent]   # from offline event log
    current_skill_profile: SkillProfile  # from database
    difficulty_tier: int

class SessionEvent(BaseModel):
    event_type: str        # "transaction_attempt" | "change_error" | "item_error" | "hint_used"
    skill_domain: str      # "addition" | "subtraction" | "change_giving" | "reading" | etc.
    correct: bool
    value: int | None      # the amount involved (e.g. change amount)
    timestamp: str
```

### Output
```python
class TutorOutput(BaseModel):
    updated_skill_profile: SkillProfile
    weak_skills: list[str]              # skills below 70% accuracy
    hint_templates: list[HintTemplate]  # for use when child makes 3 consecutive errors
    scenario_weights: dict[str, float]  # skill → weight for Customer Agent

class HintTemplate(BaseModel):
    skill: str
    trigger_condition: str   # e.g. "change_error_3_consecutive"
    hint_text: str           # in Swahili — warm, non-shaming
    hint_text_en: str
```

### Rules
- Hints must never make the child feel stupid — use encouraging, curious framing.
- Hints should give a strategy, not the answer: "Try counting up from the price to the amount paid."
- A hint is only surfaced after 3 consecutive identical errors on the same skill — never proactively.
- Skill profile updates must be conservative — one bad session should not collapse a mastered skill.

---

## Agent 03 — Mission Agent

**File:** `/backend/src/agents/mission_agent/`
**Prompt:** `/backend/src/prompts/missions.md`
**Triggered by:** Sync upload — generates next 3 daily missions and current weekly mission.

### Responsibility
Generate narrative missions — daily and weekly — scoped to the child's difficulty tier and designed as story quests, not exercise prompts.

### Input
```python
class MissionContext(BaseModel):
    child_id: str
    difficulty_tier: int
    language: str
    completed_missions: list[str]   # mission_ids already completed
    weak_skills: list[str]          # from Tutor Agent output
    current_streak: int
    goods_region: str
```

### Output
```python
class Mission(BaseModel):
    mission_id: str
    mission_type: str              # "daily" | "weekly" | "community" | "challenge"
    title: str                     # in target language
    briefing_character: str        # name of the character giving the mission
    briefing_dialogue: str         # max 3 sentences, in target language
    briefing_dialogue_en: str
    goal_type: str                 # "serve_customers" | "earn_profit" | "restock" | "accuracy"
    goal_value: int                # e.g. serve 5 customers
    target_skill: str              # which skill this mission emphasises
    reward_hint: str               # vague teaser of the reward — not the reward itself
    difficulty_tier: int
```

### Rules
- Missions must be achievable in a single session (daily) or 5–7 sessions (weekly).
- Mission narrative must reference local Kenyan community scenarios — market days, school events, neighbourhood characters.
- Never generate missions that involve danger, conflict, or adult themes.
- Mission briefing character must be warm and encouraging, never authoritative or demanding.
- Weak skills identified by the Tutor Agent must be the target skill for at least 2 of the 3 daily missions.

---

## Agent 04 — Localization Agent

**File:** `/backend/src/agents/localization_agent/`
**Prompt:** `/backend/src/prompts/localization.md`
**Triggered by:** Sync upload — reviews all generated content from other agents before caching.

### Responsibility
Review all agent-generated content (customer scenarios, missions, hints) and ensure it is culturally accurate, linguistically correct, and appropriate for the target region. Flag anything that fails cultural review.

### Input
```python
class LocalizationReviewInput(BaseModel):
    content_batch: list[dict]      # mixed batch of scenarios and missions
    target_language: str           # "sw" | "en"
    target_region: str             # "nairobi" | "rural_kenya" | "kisumu" | etc.
    currency: str                  # "KES" — always KES for Kenya
```

### Output
```python
class LocalizationReviewOutput(BaseModel):
    approved: list[dict]           # content that passed review (returned as-is)
    flagged: list[FlaggedItem]     # content with issues
    auto_corrected: list[dict]     # content that was corrected and approved

class FlaggedItem(BaseModel):
    content_id: str
    issue: str                     # description of the cultural or linguistic issue
    suggested_fix: str | None
```

### Approved goods list (Kenya)
The following goods are pre-approved for use in Kenyan scenarios. The Localization Agent must flag any goods not on this list.

**Grains & Staples:** unga (maize flour), unga wa ngano (wheat flour), mchele (rice), maharagwe (beans), dengu (lentils), ndizi (bananas)
**Snacks & Bakery:** mandazi, chapati, mahamri, mkate (bread), biskuti (biscuits), keki (cake)
**Beverages:** chai (tea), uji (porridge), maji (water), soda, juice
**Fresh produce:** nyanya (tomatoes), vitunguu (onions), pilipili (pepper), sukuma wiki (kale), karoti (carrots), viazi (potatoes)
**Household:** sabuni (soap), mafuta ya kupikia (cooking oil), sukari (sugar), chumvi (salt), dawa (medicine)
**School supplies:** kalamu (pen), penseli (pencil), daftari (notebook), kitabu (book), rula (ruler)

### Rules
- All prices must be in KES and realistic to current Kenyan market rates.
- Swahili text must follow standard Swahili grammar — not English translated word-for-word.
- Names must be East African: Amina, Wanjiku, Otieno, Kamau, Akinyi, Juma, Fatuma, Kofi, Grace, etc.
- Content set in Nairobi must feel like Nairobi. Content set in a rural context must feel rural.
- Any Western cultural references (pizza, dollars, school buses, etc.) must be flagged and corrected.

---

## Agent 05 — Insight Agent

**File:** `/backend/src/agents/insight_agent/`
**Prompt:** `/backend/src/prompts/insights.md`
**Triggered by:** Weekly cron job (every Monday at 06:00 EAT) and on-demand from teacher dashboard.

### Responsibility
Generate plain-language weekly reports for teachers and guardians. Two report types: individual child report (for parent/guardian) and classroom summary report (for teacher).

### Input
```python
class InsightContext(BaseModel):
    report_type: str              # "individual" | "classroom"
    child_id: str | None          # required for individual
    class_id: str | None          # required for classroom
    period_start: str             # ISO date
    period_end: str               # ISO date
    language: str                 # "sw" | "en"
    session_summary: SessionSummary
```

### Output
```python
class IndividualReport(BaseModel):
    child_name: str
    report_period: str
    headline: str                 # one sentence — the most important thing this week
    strengths: list[str]          # max 2 items — specific skills
    areas_to_practise: list[str]  # max 2 items — specific skills with suggested activities
    engagement_note: str          # when and how much the child plays
    milestone_unlocked: str | None
    encouragement: str            # closing warm sentence for the parent/guardian

class ClassroomReport(BaseModel):
    class_name: str
    teacher_name: str
    report_period: str
    class_headline: str
    students_excelling: list[str]    # names only, max 3
    students_needing_support: list[str]  # names only, max 3
    common_weak_skill: str
    suggested_lesson_focus: str      # specific, actionable suggestion for this week
    engagement_summary: str
```

### Rules
- Never use educational jargon — write at a Grade 6 reading level.
- Individual reports must be readable in under 2 minutes on a phone.
- Classroom reports must be readable in under 3 minutes.
- Never mention a child's struggles without also mentioning something they are doing well.
- Suggested lesson focus must be specific: not "practise maths" but "try counting change exercises with real coins."
- All monetary examples must use KES.

---

## Agent 06 — Difficulty Agent

**File:** `/backend/src/agents/difficulty_agent/`
**Prompt:** `/backend/src/prompts/difficulty.md`
**Triggered by:** Sync upload — runs after Tutor Agent, before Customer Agent and Mission Agent.

### Responsibility
Determine the correct difficulty tier for the child's next session based on their full performance history. Output a difficulty profile that all other agents read as a constraint.

### Input
```python
class DifficultyContext(BaseModel):
    child_id: str
    current_tier: int
    session_history: list[SessionSummary]   # last 10 sessions
    skill_profile: SkillProfile
    consecutive_sessions_at_tier: int
```

### Output
```python
class DifficultyProfile(BaseModel):
    recommended_tier: int             # 1–7
    tier_change_direction: str        # "up" | "down" | "stable"
    tier_change_reason: str           # one sentence explanation (not shown to child)
    session_challenge_level: str      # "gentle" | "standard" | "push"
    max_items_per_list: int
    max_price: int                    # in KES
    change_complexity: str            # "coins_only" | "notes_coins" | "mental"
    enable_stock_management: bool
    enable_ledger: bool
    enable_supplier_comparison: bool
    enable_credit_customers: bool
```

### Tier transition rules
- Move up when: >85% accuracy across 20 consecutive transactions.
- Move down when: <50% accuracy across 10 consecutive transactions.
- Stay stable when: accuracy is between 50–85%.
- Never change tier mid-session — only at session boundaries.
- After a tier change down, require 5 sessions at the new tier before considering moving up again.
- The `session_challenge_level` field allows fine-grained adjustment within a tier without changing the tier number.

---

## Agent 07 — Reward Agent

**File:** `/backend/src/agents/reward_agent/`
**Prompt:** (inline — reward logic is deterministic with AI personalisation layer)
**Triggered by:** Mission completion and end-of-session events.

### Responsibility
Determine what reward a child receives after completing a mission or reaching a milestone. Learn over time whether the child responds more to social rewards (leaderboard, sharing) or personal rewards (shop upgrades, avatar items).

### Input
```python
class RewardContext(BaseModel):
    child_id: str
    trigger: str                  # "mission_complete" | "streak_milestone" | "accuracy_achievement"
    trigger_value: int | None     # e.g. streak day 10
    session_performance: float    # accuracy score 0–1
    reward_history: list[str]     # reward_ids already given
    preference_signal: str        # "social" | "personal" | "unknown"
    coins_earned_today: int
```

### Output
```python
class RewardDrop(BaseModel):
    reward_id: str
    reward_type: str              # "coins" | "badge" | "shop_upgrade" | "avatar_item" | "story_unlock"
    reward_name: str
    reward_description: str       # shown to child
    coin_value: int               # 0 if reward_type is not "coins"
    asset_key: str                # maps to /public/badges/{key}.svg or similar
    celebration_message: str      # shown in celebration screen, in Swahili default
    celebration_message_en: str
    share_text: str | None        # text for parent notification if social reward
```

### Reward calibration rules
- Never repeat a badge the child already has.
- Shop upgrades must unlock in a coherent visual progression — not random.
- After 3 personal rewards in a row, offer a social reward (leaderboard boost, shareable achievement).
- After 3 social rewards in a row, offer a personal reward.
- Coins must always be included as a secondary reward even when the primary is a badge or upgrade.
- Celebration messages must be warm, specific, and in Swahili by default.

---

## Orchestration Flow

```
Sync window opens
    ↓
POST /api/sync/upload
    ↓
1. Store session events → database
    ↓
2. Difficulty Agent → compute difficulty profile
    ↓
3. Tutor Agent → analyse errors, update skill profile (runs parallel with step 2)
    ↓
4. Customer Agent → generate scenario batch (uses difficulty profile + tutor output)
    ↓
5. Mission Agent → generate next 3 missions (uses difficulty profile + tutor output)
    ↓
6. Localization Agent → review all generated content (customer + missions)
    ↓
7. Reward Agent → process any pending reward triggers
    ↓
8. Package response: scenarios + missions + rewards + difficulty profile
    ↓
Return to device → cache in IndexedDB
    ↓
Sync window closes
```

Steps 2 and 3 run in parallel via `asyncio.gather`. Steps 4 and 5 run in parallel after steps 2+3 complete. Step 6 runs after steps 4+5. Total target: under 5 seconds end-to-end.

---

## Fallback Strategy

If any agent fails:
1. Log the error with full context to the server log.
2. Return whatever content is already cached on the device.
3. Do not surface the failure to the child — gameplay continues from cache.
4. Queue a retry for the next connectivity window.
5. If cache drops below 3 scenarios, surface a soft "Loading more adventures..." message — never an error state.