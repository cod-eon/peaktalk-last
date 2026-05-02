# PeakTalk Landing Page Redesign: Scenarios & Pipeline

## 1. Understanding Summary
- **Goal:** Strengthen the product storytelling on the landing page, replacing "dry" text-heavy sections with an engaging, visual narrative using custom SVG illustrations.
- **Vibe:** Strict, premium B2B SaaS (e.g., Stripe, Linear). Fast, clear, without visual noise or "gamification".
- **Focus:** Show the user exactly what the tool does (the scenarios it handles and the 3-step preparation pipeline) before they hit the CTA.

## 2. Assumptions
- The SVG illustrations in `public/illustrations/` scale cleanly and look good against a light technical background (`#faf8f4` or similar).
- The redesign targets `frontend/src/app/page.tsx` (specifically replacing `Scenarios` and `ActionFlow` components).
- Performance is paramount: Framer Motion is used only for lightweight transforms/opacity and `layoutId` transitions to avoid frame drops.

## 3. Decision Log
- **DL-1: Interactive "Bento Split" for Scenarios.** Selected over scroll-jacking or a basic grid to provide an interactive, premium showcase of the personas without forcing the user to scroll.
- **DL-2: 3-Step Pipeline.** Consolidated the previous 4 steps into 3 to perfectly map the user journey to the available visual assets (`upload`, `ai-chat`, `report`).
- **DL-3: Pipeline Copy & Micro-UX.** Enforced strong action verbs ("Загрузите спич") and added an explicit "Результат:" line to each card to maximize clarity.
- **DL-4: Desktop vs Mobile Flow.** Desktop will use a seamless 3-column grid with horizontal connectors (arrows/lines). Mobile will switch to a vertical timeline UI to maintain the process metaphor instead of just dumping stacked cards.

## 4. Final Design Specification

### Component A: InteractiveScenarios
- **Container:** Wide block with a strict 1px border.
- **Desktop Layout:** Left column = Navigation; Right column = Visual Showcase.
- **Navigation (Left):** Vertical list of scenarios (CFO, Client, Investor, Initiative). Active item gets a subtle background tint and a smoothly animated vertical accent line (orange).
- **Showcase (Right):** Light technical background. The corresponding SVG (`cfo-negotiation.svg`, etc.) renders here with a fast `AnimatePresence` fade-in. A direct CTA button ("Разобрать этот сценарий") is placed here.
- **Mobile Layout:** Horizontal scrollable tabs on top, visual showcase below.

### Component B: ActionFlow Pipeline
- **Desktop Layout:** 3 equal columns (`grid-cols-3`) with zero gap, separated by internal 1px borders. A visual connector (e.g., a thin line with an arrow `01 → 02 → 03`) spans across the top text area or between the cards.
- **Card Structure:** 
  - **Top Area:** Background `#faf8f4`. Contains the SVG centered/bottom-aligned. Hovering the card lifts the SVG by 2px (spring animation).
  - **Bottom Area:** White background. 
    - **Header:** "Загрузите спич" / "Пройдите симуляцию" / "Получите план улучшений".
    - **Details:** Step 3 explicitly lists what's inside (Аргументы, риски, возражения, формулировки, следующий шаг).
    - **Outcome:** A small, distinct line at the bottom: "Результат: [текст]".
- **Mobile Layout:** Transforms into a vertical timeline. A continuous vertical line runs down the left side, connecting the step numbers and content blocks.
