---
name: peaktalk-ui-quality-gate
description: "Use for PeakTalk UI work. Enforces code-first UI changes with mandatory desktop/mobile screenshot review and visual QA."
risk: safe
source: project
---

# PeakTalk UI Quality Gate

## When To Use

Use for any change to pages, layouts, components, Tailwind classes, responsive behavior, visual hierarchy, empty/loading/error states, motion, icons, or landing/scenario/dashboard screens.

## UI Quality Baseline

PeakTalk has no mandatory visual style, palette, font pairing, radius system, aesthetic label, or preset design direction that agents must follow.

- Use the current code, task goal, supplied mockups/references, and the specific screen context to choose the visual direction.
- Preserve consistency with nearby UI unless the task explicitly asks for a redesign or a better direction is technically/product-wise justified.
- Keep layout, hierarchy, spacing, state clarity, responsiveness, and accessibility at production quality.
- Avoid treating any external design skill, generated recommendation, old design doc, palette, or aesthetic category as mandatory unless the user explicitly says so for the task.

## Review Focus

Reject and fix objective UI quality problems:

- text overflow, clipped labels, unstable hover/focus layout, overlapping controls
- mobile layouts that are just squeezed desktop layouts
- unclear interaction states, missing focus states, low contrast, inaccessible controls
- layout shifts caused by hover/loading/dynamic content

## Mandatory Visual Review

After implementation:

1. Start or reuse the local dev server.
2. Open the affected route in Browser/Playwright.
3. Capture desktop and mobile screenshots.
4. Inspect for spacing, hierarchy, overflow, responsive behavior, loading/error states, and interaction affordances.
5. Fix visible issues before final response.

For non-visual frontend changes, at least verify the affected route still renders.

## Final Response Evidence

Mention viewport(s), route(s), and checks performed. Do not say the UI is polished without visual evidence.
