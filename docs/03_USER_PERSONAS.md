# 03 · User Personas

---

## Overview

Smart Duka serves three distinct user groups. Every product decision should be tested against at least one of these personas. If a feature does not make Amina's experience better, Teacher Grace's job easier, or Mama Wanjiku more informed — reconsider it.

---

## Persona 1: Amina — The Learner (Age 9, Primary User)

### Background
Amina is 9 years old and lives in Kibera, Nairobi. She attends a public primary school where her Grade 3 class has 54 students and one teacher. She shares a smartphone with her older brother. The family has mobile data but it runs out frequently. She speaks Swahili at home and English at school.

### Motivations
- She wants to be "the best" at something — she loves competition and notices the leaderboard immediately.
- She is proud when she helps her family — completing missions that involve helping fictional community members motivates her deeply.
- She enjoys collecting things — badges, avatar items, and shop upgrades hold her attention.

### Frustrations
- Apps that feel "like school" — she puts them down immediately if they feel like a worksheet.
- Confusing English instructions — she understands conversational English but struggles with formal written English.
- Losing progress — if the app crashes or she loses her data, she does not come back.

### Behaviour Patterns
- Plays in short sessions (10–20 minutes), usually in the evening or on weekend mornings.
- Will replay the same scenario multiple times if she feels she "got it wrong."
- Responds strongly to audio feedback — a satisfying coin sound or applause keeps her engaged.
- Shares progress with her brother and friends — social proof matters.

### What Smart Duka Gives Her
- A shop that feels like a real Nairobi duka, with goods she recognises (unga, sukari, mandazi).
- Customers in Swahili who feel like her neighbours.
- Missions that feel like stories, not exercises.
- A leaderboard she can show her brother.
- An experience that works even when the data runs out.

### Design Implications
- UI must be immediately understandable with minimal text — icons and illustrations lead.
- Swahili must be the default, with English as a toggle, not the other way around.
- Feedback must be immediate, visual, and audible — no silent correct/incorrect states.
- Progress must persist reliably between sessions — loss of progress is a retention killer.

---

## Persona 2: Kofi — The Advanced Learner (Age 12, Primary User)

### Background
Kofi is 12 years old and lives in Kisumu. He is in Grade 6. His school has a tablet lab that the class uses twice a week. He has good maths foundations but gets bored easily with content that feels too easy. He is competitive and naturally curious about how businesses work.

### Motivations
- He wants to understand "real" things — he is drawn to the ledger, profit/loss, and supplier mechanics.
- He likes the leaderboard because he is currently number 2 in his class and wants to be number 1.
- He is interested in how things scale — "what if I had two shops?" is the kind of question he asks.

### Frustrations
- Content that is too easy — he disengages within minutes if the challenge is below him.
- Repetition without variation — the same customer type five times in a row loses him.
- Being treated like a younger child — he notices patronising UI and ignores it.

### Behaviour Patterns
- Plays longer sessions (30–45 minutes) when the difficulty is right.
- Reads everything — he will read the supplier invoice carefully before making a decision.
- Experiments with pricing — he will try setting prices above market rate to see what happens.
- Wants to understand the *why*, not just the *what*.

### What Smart Duka Gives Him
- Full ledger mode with profit/loss tracking.
- Multi-item orders with bulk discounts and percentage calculations.
- Stock management with supplier comparison (multiple suppliers, different prices).
- Seasonal demand mechanics (price of unga rises during a drought scenario).
- A difficulty curve that keeps pace with him — the Difficulty Agent prevents boredom.

### Design Implications
- The difficulty ceiling must be high enough that Kofi is never bored.
- Financial mechanics (credit customers, interest, supplier relationships) should unlock progressively — give him something to work toward.
- Supplier comparison UI must show the numbers clearly — he will use it analytically.
- The leaderboard must be real-time enough that competition feels alive.

---

## Persona 3: Teacher Grace — The Champion (Age 34, Secondary User)

### Background
Grace teaches Grade 4 at a rural primary school in Nakuru County. Her class has 48 students. She has a smartphone and basic digital literacy. She does not use data analytics tools and would not know how to interpret a dashboard. She genuinely cares about her students but has no time — she teaches six subjects and has marking to do every evening.

### Motivations
- She wants to help students who are falling behind, but she does not know which ones.
- She appreciates anything that saves her time — if something requires more than 5 minutes of setup, she will not use it.
- She is proud when her class performs well — she will champion Smart Duka to parents if she sees results.

### Frustrations
- Apps that require training to use — she has been sent three EdTech tools this year, used none of them.
- Data she cannot act on — "your class average is 67%" tells her nothing useful.
- Anything that feels like extra work — she will not build a new habit without clear, immediate value.

### Behaviour Patterns
- Checks her phone for 10–15 minutes in the morning before class.
- Responds immediately to specific, actionable information.
- Shares news with the staff room — word of mouth is her primary discovery channel.
- Will advocate loudly for things that work and quietly drop things that don't.

### What Smart Duka Gives Her
- A Monday morning report in plain Swahili (or English) that says exactly which students are struggling and with what skill.
- A specific suggestion for Tuesday's lesson based on class-wide error patterns.
- A leaderboard she can show the class to motivate participation.
- Zero setup required — she approves a parent link, that is it.

### Design Implications
- The teacher dashboard must have a single primary view: "This is what needs your attention this week."
- No graphs, no percentages, no data tables — plain sentences only.
- Reports must be short enough to read in 3 minutes on a phone.
- Onboarding must be completable in under 2 minutes with no required training.

---

## Persona 4: Mama Wanjiku — The Guardian (Age 38, Tertiary User)

### Background
Wanjiku is Amina's mother. She runs a small food stall in Kibera. She has a basic smartphone. She completed primary school but did not attend secondary. She is deeply invested in her children's education — it is the family's most important financial priority — but she does not understand what "Grade 3 numeracy outcomes" means.

### Motivations
- She wants to know her child is learning — not data, just reassurance and specific positive signals.
- She is proud when Amina progresses — milestone notifications matter to her.
- She wants to feel involved without needing to do anything technically difficult.

### Frustrations
- Educational language she cannot understand — "phonemic awareness" and "formative assessment" are not part of her vocabulary.
- Being ignored by school systems — she is used to being treated as outside the education loop.
- Anything that requires her to log in regularly — she will not maintain a new app habit for herself.

### Behaviour Patterns
- Reads WhatsApp messages immediately and thoroughly.
- Responds well to specific named achievements: "Amina got her first profit badge."
- Will share good news about her child immediately — she is a word-of-mouth distribution channel.
- Does not distinguish between the app and a notification — to her, it is all "the school thing on the phone."

### What Smart Duka Gives Her
- A weekly WhatsApp-style notification summarising Amina's week in two sentences.
- Named milestone alerts ("Amina earned her first 5-day streak!").
- A simple parent view she can open with a PIN to see Amina's progress without needing to understand data.
- The feeling that she knows what her child is doing and that it is good.

### Design Implications
- The parent view must be readable in under 1 minute.
- Language must be at a Grade 6 reading level — simple, warm, specific.
- The most important information (skill being practised, improvement signal) must be in the first two sentences.
- PIN-based access for the parent view — no account creation, no passwords to remember.

---

## Persona Summary Table

| Dimension | Amina (9) | Kofi (12) | Teacher Grace | Mama Wanjiku |
|---|---|---|---|---|
| Primary language | Swahili | Swahili/English | English/Swahili | Swahili |
| Session length | 10–20 min | 30–45 min | 3–5 min (weekly) | 1–2 min (weekly) |
| Key motivation | Competition, collecting | Challenge, business | Student outcomes | Child's progress |
| Key friction | Feels like school | Too easy | Requires time | Hard to understand |
| Critical feature | Swahili customers, accessible play | Ledger, difficulty ceiling | Plain-language report | Milestone alerts |
| Design priority | Icons lead, audio feedback | Numbers visible, high ceiling | Single focus view | 2 sentences max |
