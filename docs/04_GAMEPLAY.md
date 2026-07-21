# 04 · Gameplay Specification

---

## Overview

Smart Duka's gameplay is built around one core loop: **running a corner shop**. Every learning interaction — numeracy, literacy, financial reasoning — is embedded in a natural shop transaction. There is no separate quiz mode. There is no "now let's do maths" moment. The maths is the game.

---

## Core Gameplay Loop

```
Open shop
    ↓
Mission briefing (Mission Agent)
    ↓
Customer arrives (Customer Agent)
    ↓
Read shopping list → select items → calculate total → give change
    ↓
Transaction result (correct / needs retry)
    ↓
Stock check → reorder if needed
    ↓
Next customer
    ↓
[Repeat until end-of-day trigger or session end]
    ↓
End-of-day ledger → tally profit/loss
    ↓
Rewards + progress update (Reward Agent)
    ↓
New mission briefing for next session (Mission Agent)
```

---

## Session Structure

### Session Start
1. Child opens the app and lands on their **Dashboard**.
2. Dashboard shows: current streak, coins, today's active mission, leaderboard rank.
3. Child taps "Open the Duka" to begin a session.
4. An animated opening sequence plays (door unlocking, sign flipping to "OPEN").
5. The Mission Agent's daily mission is displayed as a character dialogue — not a notification.

### Mid-Session
6. Customers arrive at a natural pace — never overwhelming, never too slow.
7. Each transaction is a full interaction: greeting → list → selection → total → change → farewell.
8. Between customers, the child can check stock levels and reorder if needed.
9. The Tutor Agent silently monitors errors and adjusts subsequent customer difficulty.
10. Hints appear only after three consecutive identical mistakes — never proactively.

### Session End
11. End-of-day is triggered when the mission is complete or the child taps "Close the Duka."
12. The **End-of-Day Ledger** screen appears: total revenue, total expenses (stock bought), profit/loss.
13. The child sees a simple visual summary — a bar showing profit vs expenses.
14. The Reward Agent determines what reward to drop based on session performance.
15. Rewards are animated and celebrated — coins, badges, shop upgrades, avatar items.
16. The session is logged and queued for sync.

---

## Customer Interaction — Detailed Flow

This is the primary learning mechanic. Every step maps to at least one learning domain.

### Step 1: Customer Arrival
- A customer NPC walks up to the counter (animated entrance).
- The customer has a name, an appearance, and a personality communicated through their dialogue.
- Examples: "Mama Akinyi — she always double-checks her change." / "Juma — a student in a hurry, buying one item."
- *Learning domain: Social reading, anticipation.*

### Step 2: Shopping List
- The customer presents a shopping list — shown as a handwritten-style card on screen.
- The list has 1–5 items depending on the child's level and current difficulty setting.
- Items are shown with illustrations. Names are in Swahili (with English available via toggle).
- *Learning domain: Literacy — reading item names and quantities.*

### Step 3: Item Selection
- The child selects items from the shelf by tapping.
- The shelf shows stock quantities. If an item is out of stock, the child must substitute or tell the customer.
- Selected items appear on the counter.
- *Learning domain: Matching, visual scanning, stock awareness.*

### Step 4: Calculate Total
- A price board is visible showing current prices for all items.
- The child must calculate the total. At lower levels, a coin-counting aid is shown.
- At higher levels, the child types in the total with a number pad.
- *Learning domain: Numeracy — addition, multiplication (quantities × price).*

### Step 5: Give Change
- The customer hands over money (shown as Kenyan currency on screen).
- The child must calculate and select the correct change from coin/note illustrations.
- At lower levels: drag-and-drop coin selection with running total shown.
- At higher levels: number pad entry only.
- *Learning domain: Numeracy — subtraction, money handling.*

### Step 6: Transaction Result
- **Correct:** Customer smiles, dialogue of thanks, coins added to daily total with satisfying animation.
- **Incorrect (first or second attempt):** Customer looks confused, gentle prompt — "Are you sure that's right?" No penalty, just retry.
- **Incorrect (third attempt):** Hint from Tutor Agent appears. Customer is patient. No shame mechanics.
- *Learning domain: Immediate feedback loop, error correction.*

### Step 7: Customer Farewell
- Customer exits with a unique farewell line matching their personality.
- Brief pause before the next customer arrives.

---

## Stock Management

Between customers, the child can access the **Stock Room**.

### How it works
- Each product has a current quantity and a minimum threshold.
- When quantity drops below the threshold, a visual warning appears on the shelf.
- Child can open the Stock Room to see all items, current quantities, and supplier prices.
- Child selects quantity to order. Cost is deducted from the day's float (starting budget).
- Stock arrives "by next customer" — no real-time waiting.

### Learning mapped
- Multiplication: quantity × price per unit.
- Budgeting: remaining float — cost of order.
- Comparison (higher levels): two suppliers offering different prices per unit.
- Forecasting (highest levels): estimate how much stock is needed for the day based on mission.

### Supplier Mechanics (Ages 10–13)
At higher difficulty tiers, two suppliers appear for each product:
- **Supplier A:** Lower price per unit, minimum order quantity of 10.
- **Supplier B:** Higher price per unit, no minimum order.
- The child must decide which to use based on their current budget and expected sales.

---

## End-of-Day Ledger

The ledger is the financial literacy anchor of the game.

### What it shows
- **Revenue:** Total money received from customers.
- **Expenses:** Total money spent on stock restocking.
- **Profit / Loss:** Revenue minus expenses. Shown as a coloured indicator (not red/green — monochrome with +/- text to avoid colour dependency).
- **Best-selling item:** The item sold most times today.
- **Missed sales:** Customers who left because an item was out of stock (shown gently — not as a failure).

### Learning mapped
- Subtraction: profit = revenue − expenses.
- Reading financial summaries (literacy).
- Understanding that running a business requires managing money in, money out.
- Concept of profit motive without explicit teaching.

### Ledger progression by age band
- **Ages 4–6:** Not shown. Session ends with a coin shower animation.
- **Ages 7–9:** Simplified — just "you made KES X today" with a visual coin stack.
- **Ages 10–13:** Full ledger with revenue, expenses, profit/loss, and best-selling item.

---

## Missions

Missions are the narrative spine of the game. They are generated daily by the Mission Agent.

### Mission Types

| Type | Description | Duration |
|---|---|---|
| **Daily Mission** | A specific goal for today's session. E.g. "Serve 5 customers without any mistakes." | 1 session |
| **Weekly Mission** | A story arc that unfolds over 5–7 days. E.g. "Help Mama Wanjiku prepare for the Nairobi market fair." | 7 days |
| **Community Mission** | A mission tied to a neighbourhood event. E.g. "The school fundraiser needs snacks — supply 10 packets of biscuits." | 2–3 sessions |
| **Challenge Mission** | A hard, timed challenge for advanced players. E.g. "Serve 10 customers in a row with zero errors." | 1 session |

### Mission Structure
Every mission has:
1. **Briefing:** A character appears and explains the mission in natural dialogue (Swahili default). Maximum 3 sentences.
2. **Goal:** A specific, measurable condition (serve X customers, earn KES Y profit, restock before running out).
3. **Progress indicator:** A subtle progress bar at the top of the screen — not intrusive.
4. **Completion:** A celebration screen with the mission character reappearing to congratulate the child.
5. **Reward:** Determined by the Reward Agent based on difficulty and performance.

### Mission Agent constraints
- Missions must be achievable in one session for daily missions.
- Mission difficulty is capped at the child's current difficulty tier.
- Mission narrative must use local names, local goods, and locally recognisable scenarios.
- Never generate missions that involve conflict, danger, or adult themes.

---

## Rewards System

### Currency: Duka Coins
- Earned on every correct transaction.
- Bonus coins for: mission completion, streak milestone, first-time achievement.
- Coins are the primary in-game currency — used to unlock shop upgrades and avatar items.

### Shop Upgrades
The shop itself can be upgraded with coins:
- New shelf designs.
- New flooring and wall colours.
- A sign with the child's custom shop name.
- Decorative items (plants, fans, posters).

The shop is the child's personal space — upgrades make them feel ownership.

### Avatar Items
- New hairstyles, outfits, and accessories for the child's avatar.
- Unlocked by coins or special achievements.

### Badges
- One-time achievements: "First Profit," "Change Master," "10-Day Streak," "100 Customers Served."
- Displayed on the child's profile page.
- Shared in the parent report ("Amina earned her first profit badge this week").

### Leaderboard Points
- Separate from coins — earned by serving customers correctly.
- Used for class and national leaderboard ranking.
- Reset weekly to keep competition fresh and accessible to all skill levels.

---

## Difficulty Progression

The difficulty system is managed by two agents working together: the **Difficulty Agent** (macro calibration) and the **Tutor Agent** (micro adjustment).

### Difficulty Tiers

| Tier | Age target | Customer lists | Price range | Change complexity |
|---|---|---|---|---|
| 1 — Beginner | 4–6 | 1 item, icon only | KES 5–20 | Coins only, shown on screen |
| 2 — Early | 7–8 | 1–2 items, Swahili names | KES 10–50 | Coins, drag-and-drop |
| 3 — Developing | 8–9 | 2–3 items, written list | KES 20–100 | Notes and coins, number pad |
| 4 — Intermediate | 9–10 | 3–4 items, quantities | KES 50–200 | Notes, mental calculation |
| 5 — Proficient | 10–11 | 4–5 items, with quantities | KES 100–500 | Notes, complex change |
| 6 — Advanced | 11–13 | 5 items, discounts | KES 200–2000 | Large notes, percentage discount |
| 7 — Expert | 12–13 | Bulk orders, credit | KES 500–10000 | Multi-transaction, credit tracking |

### Tier transition rules
- A child moves up a tier when they achieve >85% accuracy across 20 consecutive transactions.
- A child moves down a tier when they achieve <50% accuracy across 10 consecutive transactions.
- Tier transitions happen at session boundaries — never mid-session.
- The child is never told their tier number — they just notice the game getting easier or harder.

---

## Age Band Summary

| Band | Ages | Mode | Key features |
|---|---|---|---|
| Sprout | 4–6 | Visual only | Icon shopping lists, coin counting on screen, no reading required |
| Grower | 7–9 | Early literacy | Written Swahili lists, addition/subtraction, drag-and-drop change |
| Trader | 10–11 | Full numeracy | Multi-item orders, number pad, stock management, simple ledger |
| Entrepreneur | 12–13 | Business thinking | Supplier comparison, percentage discounts, credit customers, full ledger |
