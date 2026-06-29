# PeakTalk Pivot From 2026-06-24 Calls

Date: 2026-06-27

Sources:
- `docs/research/audio-transcripts/2026-06-24-call-1.openai-transcript.md`
- `docs/research/audio-transcripts/2026-06-24-call-2.openai-transcript.md`

## Executive Decision

The calls do **not** justify turning PeakTalk into a generic "AI for any text" product. They expose a useful correction to the current model:

**PeakTalk should become more material-first, but stay inside professional pressure-testing and decision defense.**

The user uploads or pastes meeting material: roadmap, budget note, client escalation memo, QBR outline, investor pitch, sales proposal, decision brief, or stakeholder update. PeakTalk detects weak spots, asks scenario-specific clarifying questions, improves the material, and can run a pressure rehearsal against likely objections.

The simulator stays, but it should be framed as the pressure-test step after the material is understood, not as an isolated "conversation trainer."

## Critical Insight

The strongest call insight is not "go broad." It is:

**A simple AI text wrapper will not sell to AI-literate product/IT users.**

At 00:11:46-00:12:01 in call 1, the analyst argues that IT/product people already use AI and will not pay meaningfully for a slightly faster wrapper. At 00:12:16-00:13:32, he reframes the target toward practical professionals, using event hosts as the concrete example.

This is a warning, not a complete ICP decision. For PeakTalk, the right answer is not to jump to weddings, diplomas, resumes, or mini-sites. The right answer is to make the existing professional wedge more defensible: sell adversarial pressure, structured intake, evidence gaps, and the Defense Brief artifact, not "we rewrite your text faster."

## New ICP

Keep the launch ICP narrow:

- Product Lead / Head of Product / CPO preparing roadmap or budget defense.
- Founder / operator preparing investor, board, sales, or client defense.
- Customer-facing leader preparing QBR, renewal, escalation, or proposal defense.

Rejected for P0:

- Wedding/event hosts.
- Diploma/student defense.
- Resume/interview prep.
- Generic presentation improvement.
- Mini-sites, mini-apps, and "create the whole project for me."

These appeared in the conversation as examples, not validated markets. Bringing them into the live product now would violate the project guardrails and dilute the pressure-testing narrative.

## Product Model

### Core Object

The core object should evolve from only a simulation session into a **meeting case**:

- Source material.
- Meeting / defense situation.
- Opponent / decision-maker role.
- Pressure scan and evidence gaps.
- Defense Brief tied to the source.
- Optional rerun / stress-test.

Call 1 at 00:01:23-00:02:16 explicitly describes a documents area where the original file and AI output stay connected.

### Core Flow

1. User chooses a situation before or during upload.
2. User uploads or pastes material.
3. AI analyzes the material and asks situation-specific clarifying questions.
4. AI produces a practical output:
   - pressure scan,
   - improved framing,
   - evidence gaps,
   - likely objections,
   - Defense Brief.
5. User runs a pressure rehearsal using that material.
6. Paid flow unlocks the full defense run and saved artifact.

### Functional Principle

The product should not invent an entire project for the user. It should transform and stress-test the user's own material.

Call 1 at 00:23:34-00:23:46 is the boundary: trying to invent the whole project creates too many details and failure modes.

## Packaging Direction

The second call proposes a three-level packaging model:

- Free: one or two test orders.
- Basic: analyze text and highlight narrow spots / weak places.
- Middle: correct the material and create a concise extract.
- Max: produce a richer artifact such as a compact presentation, optional mini-asset, or special-case output.

For PeakTalk P0, treat this as research input, not a billing migration. The current "3 questions free / 299 RUB full session" can stay while the product is validated. If packaging changes later, rename around **Meeting Defense Pack / Defense Brief**, not generic "orders."

## Landing Direction

The landing must answer immediately:

- What PeakTalk does.
- For whom.
- What the user uploads.
- What comes out.
- Why it is not just ChatGPT.

Recommended first-screen promise:

**AI pressure-test for your meeting material: find weak arguments, missing evidence, and the questions a CEO, CFO, client, investor, or board member will ask before the real meeting.**

Avoid:

- "professional pressure-testing" as the only framing,
- making Product/CFO/roadmap feel like "text rewriting",
- generic "communication coach",
- broad "AI assistant for everything",
- gamified progress/streak language.

## First Implementation Slice

Do now:

1. Do **not** start with the landing file while it is already dirty.
2. Reframe authenticated app surfaces around material preparation:
   - `/documents`: "Материалы" / source-linked preparation.
   - `/upload`: "Новый материал", not "engine".
   - `/analysis/[id]`: preparation workspace with weaknesses, improved version, and CTA to stress-test.
   - sidebar/mobile nav: "Материалы" and "Стресс-тесты".
3. Keep route names and API contracts unchanged.
4. Avoid backend schema changes in this slice.

Do later as a separate backend/schema track:

1. Introduce meeting cases / material projects and versions.
2. Store generated output artifacts separately from drafts.
3. Add situation-specific prompt templates.
4. Add typed evidence-gap and Defense Brief artifacts.
5. Add media/audio/video ingestion only after trust and retention semantics are clear.
6. Revisit pricing only after paid signals.

## Risk Controls

- Do not immediately build mini-sites or mini-apps. Treat them as the "Max" tier vision, not P0.
- Do not market diploma writing. The ethical wedge is preparation from existing material.
- Do not remove the simulation engine; reuse it as "rehearsal" after analysis.
- Do not change billing/auth/credits in the first slice.
- Do not claim the system can parse video/audio until implemented.
- Do not invent testimonials, cases, or usage numbers.
- Do not add wedding/event/resume/student landing sections until there is a deliberate product decision.

## Product Brief

PeakTalk helps professionals pressure-test meeting material before a high-stakes decision. It preserves the source, highlights weak arguments and missing evidence, improves framing, creates a Defense Brief, and rehearses likely questions from a CEO, CFO, client, investor, board member, or stakeholder.

The product is still about pressure and real-world readiness. The entry point becomes more **material-first**, but the category remains professional decision defense.
