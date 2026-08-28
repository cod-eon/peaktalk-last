# PeakTalk Landing Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repetitive middle of the PeakTalk homepage with a compact editorial decision-defense narrative while preserving the approved hero, footer, routes, analytics, and guest-flow facts.

**Architecture:** Keep the existing homepage as a client route to avoid an unrelated server/client refactor. Consolidate its middle sections in `page.tsx`, isolate lazy decorative video behavior in one landing client component, keep complex editorial styling scoped to a CSS module, and use public no-precache assets for the generated dossier and existing HyperFrames film.

**Tech Stack:** Next.js 16.1.6 App Router, React 19.2.3, TypeScript, Tailwind CSS v4, CSS Modules, existing `framer-motion` 12.35.x, native IntersectionObserver, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-landing-polish.md`

## Global Constraints

- Preserve the hero and footer visual compositions; only approved copy and reduced-motion behavior may change there.
- Final IA is Hero, Pressure proof, Scenarios, combined Process and Defense Brief, Pricing, compact FAQ, Footer.
- Product focus is decision, initiative, roadmap, or budget defense before leadership; investor Q&A is secondary.
- The factual free flow is exactly three questions without registration or a card; a full session and Defense Brief cost 299 RUB.
- Add no runtime dependency and make no lockfile change.
- Use existing `framer-motion` and native CSS only; no GSAP, Spline, Rive, Three scene, scroll hijack, or effect-component library.
- Reuse the approved HyperFrames render only as a lazy decorative film under `public/noprecache`.
- Preserve CTA event name, `source`, all seven `cta_location` values, routes, navigation labels, and anchor IDs from the spec.
- Do not modify auth, billing, guest conversion, PWA configuration, API contracts, or scenario detail pages.
- Visible homepage copy and homepage metadata use zero em dash or en dash characters.
- Every automatic animation honors reduced motion; mobile uses a static film poster.
- Verification uses the exact package-lock install. Do not run `pnpm install` or `pnpm run`; the environment command is described below.

---

### Task 1: Implement and verify the compact editorial landing

**Files:**

- Create: `frontend/scripts/landing-contract.test.mjs`
- Create: `frontend/src/components/landing/LandingPressureFilm.tsx`
- Create: `frontend/src/app/landing.module.css`
- Create: `frontend/public/noprecache/landing/decision-defense-loop.mp4`
- Create: `frontend/public/noprecache/landing/decision-defense-poster.png`
- Create: `frontend/public/noprecache/landing/decision-dossier.png`
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/components/HeroVisual.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Test: `frontend/scripts/landing-contract.test.mjs`

**Interfaces:**

- Consumes: the exact copy, IA, route, tracking, motion, asset, and responsive contracts in `docs/superpowers/specs/2026-08-28-landing-polish.md`.
- Produces: `LandingPressureFilm(): React.JSX.Element`, a decorative fixed-ratio media component with a poster-first fallback and lazy source mount.
- Produces: homepage anchors `#case`, `#pressure`, `#scenarios`, `#pricing`, and `#faq` with the existing navigation labels.
- Produces: a homepage that still calls `trackLandingCta` with all seven existing `LandingCtaLocation` values.

- [ ] **Step 1: Add the failing homepage contract test**

Create `frontend/scripts/landing-contract.test.mjs` with this content:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const baseUrl = process.env.LANDING_BASE_URL ?? 'http://127.0.0.1:3100';

test('homepage exposes the compact decision-defense contract', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  const html = await response.text();

  const requiredCopy = [
    'Подготовьте материал, который выдержит вопросы руководства.',
    'За три вопроса без регистрации увидите, где позиции не хватает цифр, выбора и ответственности за решение.',
    'Вопрос, который может сорвать защиту, лучше услышать до встречи.',
    'Выберите решение, которое нужно защитить на ближайшей встрече.',
    'От материала до позиции, которую можно защищать.',
    'Три вопроса бесплатно. Полная подготовка за 299 ₽.',
    'Это курс переговоров или тренировка выступлений?',
    'Не несите слабый ответ на сильную встречу.',
  ];

  for (const copy of requiredCopy) assert.ok(html.includes(copy), `Missing copy: ${copy}`);

  const requiredLinks = [
    'href="/simulation/guest"',
    'href="/billing?plan=per_session"',
    'href="/scenarios/budget-cut-q3"',
    'href="/scenarios/client-escalation"',
    'href="/scenarios/series-a-pitch"',
  ];

  for (const link of requiredLinks) assert.ok(html.includes(link), `Missing link: ${link}`);

  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  assert.doesNotMatch(html, /Новая логика PeakTalk/);
  assert.doesNotMatch(html, /На выходе не/);
  assert.doesNotMatch(html, /без учебной сцены/);
  assert.match(html, /FAQPage/);
  assert.match(html, /SoftwareApplication/);
});

test('homepage source preserves analytics and typography constraints', async () => {
  const [pageSource, layoutSource] = await Promise.all([
    readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8'),
  ]);

  const locations = [
    'nav_desktop',
    'nav_mobile',
    'hero_primary',
    'pressure_fragment',
    'pricing_free',
    'pricing_paid',
    'footer_final',
  ];

  for (const location of locations) assert.match(pageSource, new RegExp(`'${location}'`));
  assert.match(pageSource, /landing_cta_clicked/);
  assert.match(pageSource, /source: 'landing'/);
  assert.doesNotMatch(`${pageSource}\n${layoutSource}`, /[—–]/);
});
```

- [ ] **Step 2: Verify the contract test fails for the current landing**

Start the current app from `frontend/` in a persistent terminal:

```bash
PATH=/Users/codeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH node node_modules/next/dist/bin/next dev --webpack -p 3100
```

Then run:

```bash
LANDING_BASE_URL=http://127.0.0.1:3100 PATH=/Users/codeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH node --test scripts/landing-contract.test.mjs
```

Expected: FAIL because at least the new pressure-proof headline is absent. Record the exact expected assertion failure in the task report.

- [ ] **Step 3: Add and inspect the real visual assets**

Create `frontend/public/noprecache/landing/`. Copy the existing approved HyperFrames film and poster exactly:

```bash
cp /Users/codeon/Documents/peaktalk-ai-workspace/videos/peaktalk-smooth-motion-v6/renders/peaktalk-smooth-motion-v6-preview.mp4 frontend/public/noprecache/landing/decision-defense-loop.mp4
cp /Users/codeon/Documents/peaktalk-ai-workspace/videos/peaktalk-smooth-motion-v6/snapshots/qa-v2/frame-03-at-11.2s.png frontend/public/noprecache/landing/decision-defense-poster.png
```

Use the built-in image generation tool with the exact prompt from the spec. Inspect the generated bitmap, perform at most one targeted correction if it violates a named constraint, and save the selected final with transparency at `frontend/public/noprecache/landing/decision-dossier.png`.

Verify exact media facts without printing binary content:

```bash
test -s frontend/public/noprecache/landing/decision-defense-loop.mp4
test -s frontend/public/noprecache/landing/decision-defense-poster.png
test -s frontend/public/noprecache/landing/decision-dossier.png
file frontend/public/noprecache/landing/decision-defense-loop.mp4 frontend/public/noprecache/landing/decision-defense-poster.png frontend/public/noprecache/landing/decision-dossier.png
```

- [ ] **Step 4: Implement the poster-first HyperFrames film component**

Create `LandingPressureFilm.tsx` as a client leaf. Its public interface is deliberately prop-free:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'framer-motion';

export default function LandingPressureFilm(): React.JSX.Element {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || !wrapperRef.current) return;

    const media = window.matchMedia('(min-width: 768px)');
    const wrapper = wrapperRef.current;
    let isNearViewport = false;

    const sync = () => setShowVideo(isNearViewport && media.matches);
    const observer = new IntersectionObserver(
      ([entry]) => {
        isNearViewport = entry.isIntersecting;
        sync();
      },
      { rootMargin: '240px 0px', threshold: 0.01 },
    );

    observer.observe(wrapper);
    media.addEventListener('change', sync);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', sync);
    };
  }, [prefersReducedMotion]);

  return (
    <div ref={wrapperRef} className="relative aspect-[9/16] overflow-hidden bg-[#FAF8F4]">
      <Image
        src="/noprecache/landing/decision-defense-poster.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 420px, (min-width: 768px) 38vw, 100vw"
        className="object-cover"
        aria-hidden="true"
      />
      {showVideo && !prefersReducedMotion ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/noprecache/landing/decision-defense-poster.png"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setShowVideo(false)}
        >
          <source src="/noprecache/landing/decision-defense-loop.mp4" type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
```

Use `/noprecache/landing/decision-defense-poster.png` and `/noprecache/landing/decision-defense-loop.mp4`. Do not add playback controls, captions, audio, or essential text inside the media.

- [ ] **Step 5: Recompose the homepage and metadata from the exact spec**

In `page.tsx`:

```tsx
export default function Page() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-screen overflow-x-clip selection:bg-[#E8600A] selection:text-white">
        <JsonLd />
        <Nav />
        <Hero />
        <PressureProof />
        <ScenarioEntrances />
        <DecisionProcess />
        <PricingCTA />
        <FAQAndBoundaries />
        <FooterCTA />
      </main>
    </MotionConfig>
  );
}
```

Implement these exact structural decisions:

- keep `Hero` DOM hierarchy and visual classes, change only the approved paragraph, secondary CTA label/anchor, and microcopy;
- remove `CaseWorkspace`, `MethodSection`, and `OutputArtifacts` functions and their obsolete data arrays;
- render `PressureProof` as a two-column editorial composition on desktop: HTML question sequence on the left, `LandingPressureFilm` on the right; collapse to one column with static poster on mobile;
- render `ScenarioEntrances` as one large budget-defense dossier plus a vertical stack of the two secondary scenarios; never render three equal columns;
- create `DecisionProcess` with `id="case"`, the generated dossier crossing the large headline on desktop, and three named states connected by one orange annotation path; place the image below the heading and remove the connecting motion on mobile;
- keep `PricingCTA` as one section with two choices but remove duplicated outcome prose and use the exact pricing copy;
- simplify `FAQAndBoundaries` to one compact accordion column; remove the four-signal icon column entirely;
- keep `FooterCTA` and `Footer` visual DOM/classes, updating only the approved body and microcopy capitalization;
- use the exact copy deck from the spec and no alternative synonyms;
- import the scoped `landing.module.css` for the annotation line, dossier overlap, and reduced-motion CSS only;
- replace `useScrolled`'s direct window scroll listener with `useScroll` and `useMotionValueEvent`, updating state only when the threshold boolean changes;
- keep all existing focus states or improve them without changing CTA intent;
- use one H1 only;
- keep the `faqData` array as the only source for visible FAQ and JSON-LD;
- update `SoftwareApplication` JSON-LD and `layout.tsx` metadata with the exact strings from the spec;
- remove now-unused icon imports and data constants;
- add no dependency.

In `HeroVisual.tsx`, keep its rendered visual exactly the same. Ensure its existing entrance inherits the page reduced-motion policy and does not create a second independent transform sequence when reduced motion is requested.

- [ ] **Step 6: Make the contract test pass**

With the same development server running, rerun:

```bash
LANDING_BASE_URL=http://127.0.0.1:3100 PATH=/Users/codeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH node --test scripts/landing-contract.test.mjs
```

Expected: 2 tests pass, 0 fail.

- [ ] **Step 7: Run static and production checks**

Run from `frontend/` without `pnpm run`:

```bash
PATH=/Users/codeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH node node_modules/eslint/bin/eslint.js .
PATH=/Users/codeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH node node_modules/next/dist/bin/next build --webpack
```

Expected: lint exits 0; Next production build exits 0 and prerenders `/`.

Verify no dependency or PWA config drift:

```bash
git diff --exit-code -- frontend/package.json frontend/package-lock.json frontend/next.config.ts
rg -n "decision-defense-loop|decision-dossier" frontend/public/sw.js frontend/public/workbox-*.js 2>/dev/null && exit 1 || true
```

Expected: no package, lockfile, or `next.config.ts` diff; generated service-worker files contain neither heavy asset name.

- [ ] **Step 8: Perform desktop, tablet, mobile, interaction, and reduced-motion visual QA**

Use the running local route `/` and capture at least:

- 1440 by 1000 full page;
- 1024 by 900 full page;
- 390 by 844 full page;
- 390 by 844 with mobile menu open;
- 390 by 844 with a non-first FAQ item open;
- 1440 by 1000 with reduced motion enabled.

Record for each viewport:

- `document.documentElement.scrollWidth <= window.innerWidth`;
- full scroll height, with desktop at most 6,200 pixels and mobile at most 9,000 pixels;
- hero and footer composition remain recognizable;
- dossier object does not cover readable copy;
- pressure sequence order is clear;
- film is poster-only on mobile and reduced motion;
- all CTA labels fit on one line at desktop;
- navigation, CTA, scenario links, mobile menu, and FAQ have usable focus states.

Fix any visible overlap, clipping, low contrast, accidental equal-card rhythm, excessive blank space, or mobile squeeze before reporting completion.

- [ ] **Step 9: Self-review and commit**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Review every visible string against the spec and run:

```bash
rg -n '[—–]' frontend/src/app/page.tsx frontend/src/app/layout.tsx frontend/src/components/HeroVisual.tsx
```

Expected: no output.

Commit only the landing implementation, assets, tests, spec, and plan:

```bash
git add docs/superpowers/specs/2026-08-28-landing-polish.md docs/superpowers/plans/2026-08-28-landing-polish.md frontend/scripts/landing-contract.test.mjs frontend/src/app/page.tsx frontend/src/app/landing.module.css frontend/src/app/layout.tsx frontend/src/components/HeroVisual.tsx frontend/src/components/landing/LandingPressureFilm.tsx frontend/public/noprecache/landing/decision-defense-loop.mp4 frontend/public/noprecache/landing/decision-defense-poster.png frontend/public/noprecache/landing/decision-dossier.png
git commit -m "feat: polish decision defense landing"
```

The task report must list the commit, red and green contract evidence, lint/build output, exact screenshot paths and viewport measurements, generated-image prompt and saved path, media file sizes, accessibility behavior, and any concern.
