# PeakTalk: Guest Simulation Page Redesign Specification (v2)

## 1. Understanding Summary
- **What:** Full redesign of `/simulation/guest` — all 3 states (input, chat, paywall)
- **Why:** Current dark theme (`bg-[#111111]`) is inconsistent with the rest of the project
- **Who:** Users arriving from landing page — need seamless visual transition
- **Constraints:** Light theme matching landing + scenarios pages. No new features, no API changes
- **Non-goals:** No gamification, no new functionality, no dark theme

## 2. Design Decisions
1. **Full redesign** of all 3 states (not just color swap)
2. **Chat layout:** Vertical stack (question top, answer bottom) instead of 2-column
3. **Paywall:** Inline block replacing chat (no overlay)
4. **Theme:** Light (`bg-white`, `text-neutral-950`, `border-neutral-200`)
5. **Header:** Same as `/scenarios` (white, PeakTalk + Войти + 3 вопроса)

## 3. Design System Reference
- Background: `bg-white` / `bg-[#faf8f4]`
- Text: `text-neutral-950` / `text-neutral-600` / `text-neutral-400`
- Borders: `border-neutral-200` / `border-neutral-300`
- Accent: `#E8600A` / `#B74707` / `#FF8A3D`
- CTA: `bg-neutral-950 text-white`, hover `bg-[#E8600A]`
- Labels: `font-mono text-[10px] uppercase tracking-[0.16em]`
- No border-radius

## 4. Implementation Notes
- Keep all existing state logic, API calls, timer, refs unchanged
- Only modify JSX/CSS (className props, structural layout)
- Keep framer-motion animations but simplify for stability
- Keep all constants (MAX_GUEST_TURNS, MAX_TEXT_LENGTH, etc.)
