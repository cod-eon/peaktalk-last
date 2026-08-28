# PeakTalk Landing Polish Specification

## Approved product decision

PeakTalk remains a professional pressure-testing product for defending a decision, initiative, roadmap, or budget before leadership. Investor Q&A stays a secondary scenario, not the homepage wedge.

The homepage should help a senior product or functional leader understand one job quickly: bring the material for an imminent high-stakes meeting, expose weak arguments through adversarial questions, and continue to a paid full session with a Defense Brief.

Integration note: the release target is current `main` on Next.js 16.3. The canonical one-time price is 990 RUB under `docs/decisions/0026-one-time-defense-brief-price-990-rub.md`; release handling follows `docs/decisions/0029-landing-polish-production-release.md`.

## User outcome

Within the first screen and the first proof section, a qualified visitor must understand:

- what material they can bring;
- that three questions are available without registration or a card;
- what PeakTalk tests: numbers, choice, risk, evidence, and ownership;
- that a full session and Defense Brief cost 990 RUB;
- that this is not public-speaking or confidence coaching.

## Information architecture

The final order is fixed:

1. Navigation and existing hero
2. Pressure proof
3. Scenarios
4. Combined process and Defense Brief
5. Price boundary
6. Compact FAQ
7. Existing contrast footer CTA and footer

Remove `CaseWorkspace`, `MethodSection`, and `OutputArtifacts` as separate repeated sections. Their useful content belongs in the combined process and Defense Brief section.

Preserve the existing navigation labels and anchor contract:

- `Кейс` points to `#case`, the combined process and Defense Brief section;
- `Давление` points to `#pressure`;
- `Сценарии` points to `#scenarios`;
- `Пакеты` points to `#pricing`;
- `FAQ` points to `#faq`.

## Design read

Redesign of a professional B2C SaaS landing for senior business decision-makers, using an editorial dossier-under-pressure language.

- `DESIGN_VARIANCE: 8`
- `MOTION_INTENSITY: 6`
- `VISUAL_DENSITY: 3`
- Foundation: existing Tailwind CSS v4, IBM Plex Sans, Unbounded, JetBrains Mono, and `framer-motion`
- Palette: existing paper `#FAF8F4`, ink, white, and one ember orange accent `#E8600A`
- Radius rule: the landing remains predominantly sharp-edged; interactive buttons and document surfaces follow the existing square system

The hero and footer are signature patterns and remain visually recognizable. Their copy may be corrected, and motion may be made accessible, but their composition, typography scale, product screenshot, background treatment, and CTA placement stay intact.

The approved visual language is `Red-pencil dossier`:

- real paper fibers, a binder clip, an orange pencil or marker, a chart clipping, and annotated working material;
- the generated still-life object crosses or interrupts one large process headline on desktop;
- on mobile the object becomes a normal full-width visual below the headline;
- no people, office stock photography, 3D blobs, glow fields, fake dashboards, carousels, marquees, smooth-scroll, cursor followers, or decorative particles;
- no repeated row of three equal cards;
- at least four layout families across the seven major sections.

## Motion and HyperFrames

Do not add GSAP, Spline, Rive, React Three Fiber, Magic UI, Aceternity, React Bits, or another runtime dependency.

Use the existing `framer-motion` package and native CSS only:

- hero retains its current staged entrance;
- pressure proof reveals question, weak answer, and missing proof in causal order;
- the process section lets one orange annotation line connect material, questions, and Defense Brief;
- scenario links receive restrained CSS hover and focus feedback;
- transforms and opacity only;
- no pinned scroll or scroll hijacking;
- all motion honors `prefers-reduced-motion` through `MotionConfig reducedMotion="user"` or an equivalent complete policy;
- replace the direct `window` scroll listener in the landing navigation with Motion scroll primitives or IntersectionObserver.

Reuse the existing PeakTalk HyperFrames render as a single below-fold product film:

- source: `/Users/codeon/Documents/peaktalk-ai-workspace/videos/peaktalk-smooth-motion-v6/renders/peaktalk-smooth-motion-v6-preview.mp4`;
- destination: `frontend/public/noprecache/landing/decision-defense-loop.mp4`;
- dimensions: 720 by 1280;
- duration: 17.066 seconds;
- current size: 1,108,261 bytes;
- poster source: `/Users/codeon/Documents/peaktalk-ai-workspace/videos/peaktalk-smooth-motion-v6/snapshots/qa-v2/frame-03-at-11.2s.png`;
- poster destination: `frontend/public/noprecache/landing/decision-defense-poster.png`.

The film is decorative. Essential claims remain semantic HTML. A dedicated client component must:

- render a fixed 9:16 poster immediately;
- mount the `<source>` only when the section approaches the viewport;
- never mount video sources below 768 pixels or when reduced motion is requested;
- use `muted`, `loop`, `playsInline`, `preload="none"`, and `aria-hidden="true"`;
- reserve intrinsic space and avoid CLS;
- pause when it leaves the viewport;
- keep a static poster if playback fails.

Keep the film under `public/noprecache` as a stable landing-media path. Current `main` does not generate a service worker; do not add one or preload this media in the initial page response.

## Generated visual asset

Use the built-in image generation tool once to create a project-bound transparent cutout. Prompt:

```text
Use case: photorealistic-natural
Asset type: responsive landing-page section object cutout
Primary request: a top-down editorial still life of a real working decision dossier
Scene/backdrop: genuinely transparent background
Subject: three slightly misaligned warm-white printed memo sheets with all writing represented only by soft illegible gray lines, one folded paper corner, one matte black binder clip, one burnt-orange carpenter pencil or felt marker placed diagonally, and one small torn chart fragment with no readable values
Style/medium: photorealistic studio product photography, not illustration and not 3D
Composition/framing: landscape 3:2 cluster with a clean silhouette, generous transparent margin, suitable for overlapping a large web headline
Lighting/mood: soft directional light from the top left, calm but investigative
Materials/textures: visible natural paper fibers, realistic metal clip, matte painted pencil, subtle contact shadows preserved inside the cutout
Constraints: transparent background with clean alpha; no hands; no people; no desk background; no logos; no readable text; no numbers; no watermark; no extra stationery
Avoid: stock-office look; glossy CGI; fake UI; gradients; purple; blue glow; dramatic cinematic shadows
```

Save the selected final asset as `frontend/public/noprecache/landing/decision-dossier.png`. Inspect it before use. If it contains readable hallucinated text, people, a non-transparent background, or an obviously synthetic shape, run one targeted correction. Do not ship an uninspected generation.

## Exact copy deck

Visible strings below use no em dash or en dash characters.

### Hero

Keep the existing H1 exactly:

> Подготовьте материал, который выдержит вопросы руководства.

Paragraph:

> Вставьте тезисы, коммерческое предложение или план разговора. За три вопроса без регистрации увидите, где позиции не хватает цифр, выбора и ответственности за решение.

Primary CTA: `Проверить материал бесплатно`

Secondary CTA: `Как устроена подготовка`

Microcopy: `Без регистрации / без карты / на своём материале`

### Pressure proof

Headline:

> Вопрос, который может сорвать защиту, лучше услышать до встречи.

Intro:

> PeakTalk проверяет, сможете ли вы объяснить выбор, назвать цену риска и взять ответственность за решение.

State 1:

- Label: `вопрос финансового директора`
- Title: `Если бюджет сократят на 30%, что вы уберёте первым и какую метрику не готовы потерять?`
- Body: `Проверяется не уверенность, а выбор между статьями расходов, последствия и критерий решения.`

State 2:

- Label: `слабый ответ`
- Title: `Сохраним ключевые активности без потери результата.`
- Body: `В ответе нет конкретного выбора, цены риска и условия, при котором план нужно менять.`

State 3:

- Label: `что усилить`
- Title: `Назовите сокращаемые статьи, цену риска, владельца решения и пороговую метрику.`
- Body: `Так позиция становится проверяемой до встречи, а не в момент давления.`

CTA: `Проверить свой материал`

### Scenarios

Headline:

> Выберите решение, которое нужно защитить на ближайшей встрече.

Intro:

> Начните с давления, которое встретите при защите бюджета, разговоре с клиентом или вопросах инвестора.

Primary scenario:

- Tag: `Бюджет`
- Title: `Защитить бюджет перед руководителем`
- Body: `Докажите, какие расходы нельзя сокращать без ущерба для результата.`
- Decision line: `Решение: что сохранить, что сократить и по какой метрике оценить риск.`
- CTA: `Разобрать сценарий`
- Route: `/scenarios/budget-cut-q3`

Secondary scenario:

- Tag: `Клиент`
- Title: `Подготовиться к клиентской эскалации`
- Body: `Объясните сбой и защитите план восстановления доверия.`
- Decision line: `Решение: что вы берёте на себя, что обещаете клиенту и какой следующий шаг предлагаете.`
- CTA: `Разобрать сценарий`
- Route: `/scenarios/client-escalation`

Tertiary scenario:

- Tag: `Инвестор`
- Title: `Выдержать вопросы инвестора`
- Body: `Подготовьте ответы о рынке, росте, экономике и реалистичности плана.`
- Decision line: `Решение: какие допущения подтверждают рост и при каком условии план нужно пересмотреть.`
- CTA: `Разобрать сценарий`
- Route: `/scenarios/series-a-pitch`

### Combined process and Defense Brief

Headline:

> От материала до позиции, которую можно защищать.

Body:

> Сначала пройдите бесплатный стресс-тест на своём материале. Если нужен полный разбор, продолжите сессию за 990 ₽ и получите Defense Brief перед встречей.

Stage 1:

- Label: `материал встречи`
- Title: `Вставьте то, что нужно защитить`
- Body: `Тезисы, коммерческое предложение или план разговора для бюджета, QBR, клиента или инвестора.`

Stage 2:

- Label: `три вопроса бесплатно`
- Title: `Ответьте на неудобные вопросы`
- Body: `Выберите роль оппонента и пройдите три вопроса без регистрации.`

Stage 3:

- Label: `полная сессия и Defense Brief`
- Title: `Соберите план защиты перед встречей`
- Body: `После оплаты сохраните материал и ответы, пройдите полный разбор и получите слабые места позиции, ожидаемые вопросы и следующий шаг.`

### Pricing

Headline:

> Три вопроса бесплатно. Полная подготовка за 990 ₽.

Intro:

> Бесплатный стресс-тест показывает давление на вашем материале. Полная сессия сохраняет разбор и собирает Defense Brief.

Free column:

- Label: `Бесплатный стресс-тест`
- Price: `0 ₽`
- Body: `Вставьте материал, выберите оппонента и ответьте на три вопроса.`
- Includes: `Три вопроса по вашему материалу`, `Без регистрации`, `Без карты`
- CTA: `Проверить материал бесплатно`
- Route: `/simulation/guest`

Paid column:

- Label: `Полная сессия и Defense Brief`
- Price: `990 ₽ / разбор`
- Body: `Полный разбор материала встречи с вопросами, ответами и планом защиты.`
- Includes: `Сохранённый материал и ответы`, `Слабые места позиции`, `Вопросы и короткий план защиты`
- CTA: `Собрать Defense Brief`
- Route: `/billing?plan=per_session`

### FAQ

1. `Что такое PeakTalk?`
   `PeakTalk проверяет аргументацию перед сложной рабочей встречей. Вы вставляете материал, отвечаете на вопросы оппонента и видите слабые места позиции.`
2. `Нужна ли регистрация?`
   `Нет. Три вопроса по вашему материалу доступны без регистрации. Для полной сессии и Defense Brief потребуется аккаунт.`
3. `Какой материал можно вставить?`
   `Тезисы защиты, коммерческое предложение, письмо клиенту, структуру презентации или план разговора. Не вставляйте пароли, персональные данные и конфиденциальные фрагменты.`
4. `Это курс переговоров или тренировка выступлений?`
   `Нет. PeakTalk не тренирует голос или харизму. Он помогает проверить конкретную позицию перед конкретной встречей.`
5. `Что входит в полную сессию?`
   `Материал и ответы сохраняются, разбор показывает слабые места позиции и собирает Defense Brief с ожидаемыми вопросами и планом защиты.`

### Footer CTA

Keep the existing headline exactly:

> Не несите слабый ответ на сильную встречу.

Body:

> За три вопроса увидите, где позиция требует доработки. За 990 ₽ продолжите разбор и соберёте Defense Brief перед встречей.

CTA: `Проверить материал бесплатно`

Microcopy: `Без регистрации / без карты / на своём материале`

### Metadata and structured data

Metadata title:

> PeakTalk - стресс-тест решения перед рабочей встречей

Metadata description:

> Проверьте аргументы перед защитой решения, бюджета или инициативы. Три вопроса без регистрации, полный разбор и Defense Brief за 990 ₽.

Open Graph description:

> Вставьте материал встречи, получите неудобные вопросы и найдите слабые места позиции до разговора с руководством.

Twitter description:

> Проверьте решение под давлением до реальной встречи.

The `SoftwareApplication` JSON-LD description must match the generalized decision-defense message. The visible FAQ and `FAQPage` JSON-LD must use the same `faqData` array.

## Stable technical contracts

Preserve:

- event name `landing_cta_clicked`;
- event `source: landing`;
- all existing `cta_location` values: `nav_desktop`, `nav_mobile`, `hero_primary`, `pressure_fragment`, `pricing_free`, `pricing_paid`, and `footer_final`;
- routes `/simulation/guest`, `/billing?plan=per_session`, all three scenario routes, `/login`, `/contacts`, `/personal-data`, and `/privacy`;
- one semantic H1;
- visible keyboard focus on every link and button;
- accordion `aria-expanded` behavior;
- logo, hero product screenshot, and their alt text semantics;
- the current off-white hero composition and black footer composition.

No auth, billing, guest-flow, API, schema, service-worker configuration, scenario-page, or analytics implementation changes are in scope.

## Acceptance criteria

1. The final page contains exactly the seven major sections defined in the information architecture and no standalone CaseWorkspace, MethodSection, OutputArtifacts, or signals column.
2. The hero and footer remain visually recognizable at 1440 by 1000 and 390 by 844.
3. The page explains the real order: three questions without registration, then a 990 RUB full session and Defense Brief.
4. Pressure proof is a causal sequence, not three equal feature cards.
5. Scenario layout is asymmetric: the budget defense scenario is visually primary, client and investor scenarios are secondary.
6. The dossier cutout is visibly integrated with the process headline on desktop and becomes a normal below-heading image on mobile.
7. The HyperFrames film source is lazy-mounted once, stays decorative, does not play on mobile or reduced motion, and remains under `public/noprecache`.
8. There is no horizontal overflow at 1440, 1024, 768, and 390 pixel widths.
9. At 1440 by 1000, full page scroll height is at most 6,200 pixels. At 390 by 844, it is at most 9,000 pixels.
10. Navigation and mobile menu work by keyboard and touch. FAQ accordion works by keyboard and touch.
11. All CTA routes and analytics locations remain intact.
12. Visible page copy and homepage metadata contain zero em dash or en dash characters.
13. No new npm dependency or lockfile change is introduced.
14. Frontend lint and production build pass on the final tree.
15. Desktop, tablet, mobile, reduced-motion, open mobile menu, and open FAQ screenshots receive independent visual review.

## Non-goals

- redesigning the hero composition;
- redesigning the footer composition;
- building a generic public-speaking, confidence, or delivery coach;
- making investor pitch the primary wedge;
- adding Spline, Three.js scenes, Rive, GSAP, scroll hijacking, or a component-effect library;
- creating a new HyperFrames composition in this pass;
- modifying auth, billing, guest conversion, service-worker configuration, API contracts, or scenario detail pages;
- removing unused dependencies as part of this redesign;
- deployment or production release.
