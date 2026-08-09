---
name: ui-quality
description: Use for PeakTalk screens, components, responsive behavior, visual reviews, and substantial frontend changes where usability and state coverage matter.
---

# UI Quality

Use this skill for interface work that users see or interact with. Read the relevant product and flow specifications before changing visual behavior; do not duplicate those facts here.

## Review and implementation pass

1. Name the user task and the primary action. Check that hierarchy, copy, controls, and feedback support that action rather than decorate it.
2. Cover the real states: loading, empty, error, success, long content, disabled or permission-limited states when applicable.
3. Check responsive layout at the supported desktop and mobile widths, keyboard/focus behavior, contrast, readable text, and touch targets.
4. Preserve the existing design language unless the task explicitly changes it. Avoid generic dashboards, decorative UI, and invented product behavior.
5. Use a browser or screenshot check for substantial UI changes, then run frontend lint/build and record the evidence. If a visual check is unavailable, report that limitation instead of calling it a pass.
