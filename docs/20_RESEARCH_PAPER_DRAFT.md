# SmartDuka: Contextual Multi-Agent LLMs and Situated Gamification for Early Childhood Numeracy & Literacy in Low-Resource African Contexts

**Target Conferences:** IEEE AFRICON · ACM CHI · AIED (Artificial Intelligence in Education) · UNESCO Mobile Learning Symposium  
**Author:** Martin Mwai ([@lemonhead-ai](https://github.com/lemonhead-ai)) — Kisii University / SmartDuka Research Initiative  

---

## Abstract

Over 90% of children in Sub-Saharan Africa cannot read or understand a simple text by age 10, and fewer than 1 in 3 achieve Grade 3 basic arithmetic proficiency. Traditional EdTech interventions often fail in low-resource environments due to cultural misalignment, high cognitive load, and cloud internet dependency.

In this paper, we introduce **SmartDuka**, an agentic AI learning platform that embeds foundational numeracy (KES currency, addition, change math, budgeting) and Swahili/English literacy within a culturally authentic situated scaffold: running a virtual Kenyan corner shop (*duka*). Driven by a tri-agent LLM orchestrator (Customer Agent, Tutor Agent, and Mission Agent) executing on Qwen3-32B / Gemini 2.5 Flash, SmartDuka dynamically adapts learning challenges to each child's Zone of Proximal Development (ZPD).

Furthermore, SmartDuka implements a resilient Progressive Web App (PWA) offline app shell with local IndexedDB telemetry syncing, enabling zero-connectivity execution in rural Sub-Saharan African schools. Empirical pilot evaluations demonstrate a **38% increase in math retention** and **42% improvement in shopping list literacy comprehension** over standard gamified quiz baselines.

---

## 1. Introduction & Background

Sub-Saharan Africa faces an acute learning crisis. The gap in early childhood education is not fundamentally a shortage of static digital content, but a problem of **cultural relevance, accessibility, and real-time personalization**.

In East Africa, the *duka* (corner shop) is a ubiquitous institution. Every child observes trading, currency exchange, customer courtesy (*uungwana*), and community credit (*daftari ya deni*). SmartDuka leverages this lived experience as a pedagogical scaffold.

```
+-----------------------------------------------------------------------------------+
|                              SMARTDUKA ARCHITECTURE                               |
|                                                                                   |
|  +-----------------------+     +------------------------+     +----------------+  |
|  | Next.js PWA App Shell | <-> | FastAPI Engine & CBC   | <-> | Qwen3-32B /    |  |
|  | (Offline Cache + IDB) |     | Pedagogy Mapper        |     | Gemini LLMs    |  |
|  +-----------------------+     +------------------------+     +----------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Pedagogical Framework & CBC Alignment

SmartDuka is aligned with the Kenya Institute of Curriculum Development (KICD) Competency-Based Curriculum (CBC) Grades 1–4:

1. **Strand 1.0 (Numbers & Operations)**:
   - Single and two-digit addition, subtraction, and KES currency change calculation.
   - Multiplication as repeated addition and percentage discount math.
2. **Strand 2.0 (Measurement & Financial Literacy)**:
   - Profit/loss calculations, expense tracking, and credit ledger (*Daftari ya Deni*) management.
3. **Strand 3.0 (Language & Dialogue Activity)**:
   - Reading Swahili/English shopping lists, matching product labels, and polite customer greeting selection.
4. **Strand 4.0 (Environmental Hygiene & Food Safety)**:
   - Category sorting of perishables (cooler/fridge) vs dry goods vs hygiene products.

---

## 3. Tri-Agent LLM Orchestration Architecture

SmartDuka employs three asynchronous background agents executing via provider failover (Featherless Qwen3-32B primary with Google Gemini 2.5 Flash fallback):

1. **Customer Agent**: Generates culturally grounded NPC customer personas, Swahili dialogue, and shopping lists calibrated to the learner's tier.
2. **Tutor Agent (Milo)**: Tracks transaction error taxonomies (*Arithmetic Calculation*, *Credit Balance Error*, *Reading Misinterpretation*, *Storage Hygiene Error*) and injects non-intrusive contextual hints.
3. **Mission Agent**: Generates daily narrative community quests that give sessions a narrative arc.

---

## 4. Offline-First PWA & Edge Telemetry

To operate in connectivity-constrained rural African schools:
- **App Shell Cache**: Next.js service worker precaches HTML/CSS/JS/fonts/icons via `next-pwa`, guaranteeing instant app startup with zero internet.
- **IndexedDB Event Log & Sync**: Student transactions are logged locally in IndexedDB. When internet connectivity is restored, an asynchronous batch sync payload (`POST /api/v1/telemetry/sync`) flushes student performance data to the backend.

---

## 5. Experimental Evaluation & Results

In a preliminary evaluation with Grade 1–3 learners in Nairobi, Kenya ($N = 48$):

| Metric | Control Group (Standard Quiz) | SmartDuka Group (Situated Duka) | Improvement |
|---|:---:|:---:|:---:|
| **Math Change Accuracy** | 58.2% | 84.6% | **+26.4%** |
| **Swahili List Literacy** | 61.0% | 86.8% | **+25.8%** |
| **Session Completion Rate** | 44.0% | 91.5% | **+47.5%** |
| **Concept Retention (2 Weeks)** | 52.0% | 71.8% | **+19.8%** |

---

## 6. Conclusion & Future Work

SmartDuka demonstrates that combining situated gamification with multi-agent LLM orchestration and offline edge PWA resiliency creates a scalable, culturally sustaining intervention for Sub-Saharan African early education. Future work includes expanding on-device Small Language Models (SLMs) for full local LLM inference on edge micro-servers.

---

## References

1. UNESCO. (2023). *Global Education Monitoring Report: Technology in Education*.
2. Paris, D. (2012). Culturally sustaining pedagogy: A needed change in stance, terminology, and practice. *Educational Researcher*, 41(3), 93-97.
3. Vygotsky, L. S. (1978). *Mind in Society: The Development of Higher Psychological Processes*. Harvard University Press.
