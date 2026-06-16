# PeakTalk: execution map для применения deep research report

Дата: 2026-06-15

Репозиторий: `/Users/codeon/peaktalk-last`

Главный источник: `/Users/codeon/Downloads/deep-research-report-cleaned.md`

Режим: сначала карта исполнения, без немедленных кодовых изменений.

## 1. Критическое чтение

1. Отчет прав в главном: широкий запуск сейчас опасен. Нужен 21-30 day validation sprint.
2. Стартовый wedge должен быть узким: Product Lead / Head of Product / CPO, сценарий `Roadmap / Budget Defense`, оффер `Meeting Defense Pack`.
3. Самый большой риск: рынок увидит PeakTalk как LLM wrapper. Защита от этого - жесткая сценарная логика, быстрый prep-flow и рабочий артефакт.
4. PeakTalk нельзя развивать как generic AI communication coach, EdTech, speech trainer или confidence app.
5. Первая покупка должна продаваться как подготовка к одной конкретной встрече, а не как подписка или регистрация.
6. Главный paid artifact - Defense Brief, а не абстрактный отчет, score или progress dashboard.
7. Trust layer нужен до масштабирования, потому что пользователь будет вставлять roadmap, budget memo, QBR, escalation note или коммерческое предложение.
8. UTM в проекте уже есть, но событийная аналитика воронки выглядит неполной: события описаны в планах, но не выглядят полноценно подключенными в пользовательском flow.
9. В коде остается старый speech-coach язык. Это не косметика, а коммерческий риск: маркетинг зовет в одну категорию, продукт внутри местами ведет в другую.
10. Начинать с контента или архитектуры до P0 product-gate нельзя: можно привести людей в воронку, которая недодает value, не продает правильный next step и не измеряет отвал.
11. Team analytics, enterprise admin, integrations, LMS, achievements, avatars и тяжелая B2B-платформа до первых paid signals являются отвлечением.
12. Первый sprint должен доказывать не "людям интересно", а "люди вставляют реальный материал, получают aha, доходят до paywall и платят за конкретную подготовку".

## 2. Inventory текущего состояния

### Уже реализовано

- Fullstack-контур: landing, guest simulation, registration/paywall, billing через YooKassa, dashboard, documents, simulation sessions, meetings, personas, reports/prep-card, admin, scenario catalog.
- Публичный вход: главная страница, `/simulation/guest`, `/scenarios`, страницы сценариев.
- Guest flow: ввод материала, выбор оппонента, уровень давления, AI-вопросы, paywall state.
- Billing: `per_session`, Personal, PRO, Team, YooKassa payment creation, webhooks, session credits.
- UTM: first-touch capture в `frontend/src/lib/utm.ts`, сохранение в Supabase metadata при регистрации, `/me/utm`, admin UTM stats.
- Yandex Metrika: init в `frontend/src/app/layout.tsx`.
- Prep-card artifact: backend artifact endpoint, frontend `PrepCard`, PDF через print.
- Post-meeting feedback: backend router/model и frontend component есть, но компонент не выглядит подключенным в основной report flow.
- Legal/trust pages: privacy/personal-data pages есть, guest textarea уже предупреждает не вставлять пароли, персональные данные и коммерческие тайны.

### Частично реализовано

- Per-session модель технически есть, но billing UI все еще называется "Подписка и лимиты" и продает subscription grid как существенную часть выбора.
- Guest paywall есть, но продает регистрацию/отчет, а не Meeting Defense Pack или full defense run.
- Prep-card близок к Defense Brief, но не упакован как главный товар: не хватает naming, copy, copy/export и явного before-payment artifact preview.
- Scenario pages есть, но стартовый wedge не сфокусирован достаточно жестко на Roadmap / Budget Defense для Product Lead / CPO.
- Trust copy есть, но нужна более явная формулировка рядом с вводом материала: redaction guidance, no model training by default, retention, delete/export где реально поддержано.
- Analytics events описаны в admin marketing page, но фактических `reachGoal` вызовов по core funnel не видно.

### Противоречит отчету

- Guest backend обещает 3 вопроса, но логика вокруг `GUEST_MAX_TURNS = 3` может фактически дать только 2 AI-вопроса после первого старта и ответа до paywall.
- Registration page содержит старый framing: "Умная подготовка к выступлениям за 3 шага".
- Backend prompt в `cloud_ru_ai.py` начинается со speech coach / тренер по коммуникации.
- Upload flow использует старые формулировки про выступления, текст речи, риторические уязвимости.
- Simulation completion copy говорит "Тренировка завершена" и "отчет по навыкам".
- Report flow содержит confetti при высоком score, что конфликтует с серьезным pressure-testing продуктом.
- Billing/pro plans и team dashboard могут выглядеть слишком важными до первых paid signals.

### Что критично проверить руками / Browser / Playwright

- Сколько реальных AI-вопросов получает guest user до paywall.
- `POST /simulation/guest-start` без 422/500.
- `POST /simulation/guest-message` после каждого ответа.
- Путь guest -> paywall -> register/login -> onboarding -> `/simulation/from-guest`.
- Путь guest -> billing `plan=per_session` -> YooKassa -> success -> продолжение сессии.
- Сценарные страницы и `/scenarios`: не пустые, без slug/category расхождений.
- Metrika network calls и будущие `reachGoal` events.
- UTM сохраняется до регистрации и попадает в user metadata/admin stats.
- Desktop/mobile screenshots для landing, guest input/chat/paywall, billing, report/prep-card.

### Где риск для billing/auth/guest simulation/data

- Guest-to-user conversion: localStorage token, return path, onboarding redirect, `/simulation/from-guest`.
- Billing/YooKassa: payment creation, return URL, webhook success, session credit increment, duplicate payment handling.
- Session credits: credit should be consumed once, and paid per-session should not be blocked by hidden document/free limits.
- Guest simulation: turn counting, message persistence, AI call count, paywall transition.
- Data trust: uploaded/inserted materials, deletion semantics, storage/retention wording.
- Auth: registration after guest flow, email confirmation path, onboarding redirect.

## 3. Current product gap map

| Area | Current state | Target state | Risk | Priority |
|---|---|---|---|---|
| Guest flow | Backend and UI promise 3 questions; current logic can paywall before third generated follow-up | 3 honest AI questions before paywall plus clear weak-spot teaser | Trust breaks before payment | P0 |
| Paywall | Guest paywall sells registration and "unlock report" | Paywall sells full defense run / Meeting Defense Pack for one meeting | Hot pain moment wasted | P0 |
| Billing | Per-session and YooKassa exist, but subscription UI remains prominent | One-meeting purchase is primary; subscriptions are secondary | User thinks product is tariff/subscription, not meeting prep | P0 |
| Analytics | UTM and Metrika exist; explicit funnel events appear incomplete | Landing -> guest -> answer -> paywall -> billing -> payment is measurable | No learning from validation sprint | P0 |
| Trust/privacy | Microcopy and legal pages exist | Clear redaction/no-training/retention/delete wording near material input | Users avoid real materials | P0 |
| Landing | Pressure-testing language mostly strong | First screen and scenario focus sharpened around Product Lead / roadmap/budget defense | Broad positioning | P0/P1 |
| Registration/upload copy | Old "выступления", speech coach and skills language remain | Decision defense, pressure-testing, weak spots, Defense Brief | Category drift | P0 |
| Defense Brief | Prep-card exists and can print PDF | Named Defense Brief, copy/export, artifact preview | Paid value unclear | P1 |
| Post-meeting feedback | Backend/component exist, likely not wired in report flow | Feedback prompt after real meeting | Weak learning loop | P1 |
| UI quality | Industrial base exists, but report has playful confetti/reward feel | Serious operational artifact UI | Weak product trust | P1 |
| Architecture/backlog | Many possible directions exist | P0/P1/P2 discipline tied to paid validation | Scope creep | P0 governance |

## 4. P0 / P1 / P2 backlog

### P0 - без этого нельзя начинать validation sprint

1. Исправить guest flow так, чтобы пользователь получил 3 реальных AI-вопроса до paywall.
2. Переписать guest paywall: продавать `Meeting Defense Pack` / полный defense run, а не регистрацию.
3. Добавить события аналитики:
   - `landing_cta_clicked`
   - `guest_page_viewed`
   - `guest_started`
   - `guest_question_seen`
   - `guest_answer_submitted`
   - `guest_paywall_seen`
   - `billing_opened`
   - `payment_started`
   - `payment_succeeded`
4. Проверить, что UTM сохраняется от первого визита до регистрации и оплаты.
5. Усилить trust/privacy copy рядом с guest textarea и document input.
6. Сфокусировать landing/hero/scenario copy на pressure-testing перед конкретной встречей.
7. Убрать очевидный speech-coach/category drift из registration, upload, simulation completion и ключевых AI prompt surfaces.
8. Аудит per-session pricing/credits/document limits: разовая покупка не должна упираться в скрытый free document limit или недоступный report/prep-card.

### P1 - усиление после P0

1. Repackage prep-card into Defense Brief.
2. Добавить copy/export Defense Brief, не только print/PDF.
3. Добавить rerun по тому же материалу.
4. Сделать scenario-specific landing pages для Roadmap Defense и Budget Defense.
5. Подключить post-meeting feedback к report/dashboard flow.
6. Показать example artifact before payment.
7. Добавить paywall teaser, который показывает структуру будущего Defense Brief без фейковых claims.

### P2 - только после paid signals

1. Team pilot mode.
2. Aggregated team weak spots.
3. Custom scenarios.
4. Integrations.
5. Heavier analytics.
6. Voice/avatars только если конкретный winning scenario требует этого.

### Не делать сейчас

- Mobile app.
- Leaderboard, achievements, streaks, badges.
- LMS/SCORM/certification.
- Marketplace сценариев.
- Dynamic avatars.
- Deep integrations.
- Heavy admin.
- Team analytics до первых team pilots.
- Generic progress dashboard ради "полноты".
- Broad SEO по public speaking / soft skills / confidence.

## 5. Независимые треки работ

### Трек 1. Product / positioning / copy cleanup

Цель: убрать category drift и привести core funnel к narrative "professional pressure-testing before a real meeting".

Затронутые зоны:

- `frontend/src/app/page.tsx`
- `frontend/src/app/(auth)/register/page.tsx`
- `frontend/src/app/(dashboard)/upload/page.tsx`
- `frontend/src/app/(dashboard)/simulation/page.tsx`
- `frontend/src/app/(dashboard)/simulation/[id]/page.tsx`
- `frontend/src/app/(dashboard)/simulation/[id]/report/page.tsx`
- `backend/app/services/cloud_ru_ai.py`
- `backend/app/services/simulation_ai.py`

Риски:

- Можно случайно заменить работающий product language на абстрактный маркетинг.
- Prompt-level changes могут изменить качество AI output.
- Чистка copy может затронуть onboarding/auth flow.

Skills/MCP:

- `peaktalk-product-guard`
- `peaktalk-copy-seo-guard`
- `peaktalk-autonomous-dev-gate` для prompt/UI flow изменений
- Browser для визуальной проверки core pages

Проверки:

- `cd frontend && npm run lint && npm run build`
- Browser screenshots для register/upload/simulation completion/report
- Targeted backend tests, если менялись prompts or schemas

Done:

- В core funnel нет "выступления", "ораторство", "уверенность", "тренер коммуникации", "навыки" как главной рамки.
- Тексты говорят про проверку позиции, слабые места аргументов, конкретную встречу, Defense Brief.

Не делать:

- Не переписывать все старые docs.
- Не менять legal wording без проверки фактических возможностей.
- Не добавлять broad ICP.

### Трек 2. Guest simulation / paywall / billing flow

Цель: user получает честный value до paywall и покупает продолжение подготовки к этой встрече.

Затронутые зоны:

- `backend/app/routers/guest_simulation.py`
- `backend/tests/test_simulation.py`
- `frontend/src/app/simulation/guest/page.tsx`
- `frontend/src/lib/guest-api.ts`
- `frontend/src/app/simulation/from-guest/page.tsx`
- `frontend/src/app/(dashboard)/billing/page.tsx`
- `frontend/src/components/billing/PerSessionCard.tsx`
- `backend/app/routers/billing.py`
- `backend/app/services/limits.py`
- `backend/app/routers/webhooks.py`

Риски:

- High risk: guest-to-user conversion, billing, credits.
- Можно создать off-by-one в turn counting.
- Можно сломать return flow после оплаты.
- Можно дважды списать или дважды consume credit, если трогать limits неаккуратно.

Skills/MCP:

- `peaktalk-autonomous-dev-gate`
- `peaktalk-product-guard`
- `peaktalk-deploy-gate` перед продом
- Browser/Playwright для full funnel

Проверки:

- `cd backend && pytest tests/test_simulation.py tests/test_billing.py`
- `cd frontend && npm run lint && npm run build`
- Browser path: `/simulation/guest` -> start -> answer 1 -> question 2 -> answer 2 -> question 3 -> answer 3 -> paywall
- Browser path: paywall -> register/login -> onboarding -> from-guest
- Billing path: `/billing?plan=per_session&return=/simulation/from-guest`

Done:

- 3 AI-вопроса подтверждены в браузере.
- Paywall primary CTA ведет к полной подготовке / оплате per-session.
- Registration остается вторичным technical step, а не главным товаром.
- Paid session unlock не конфликтует с document/report limits.

Не делать:

- Не менять тарифную модель целиком.
- Не поднимать цену в коде без отдельного pricing decision.
- Не трогать YooKassa webhook без тестов.

### Трек 3. Analytics / UTM / events

Цель: validation sprint должен быть измеримым от первого клика до оплаты.

Затронутые зоны:

- `frontend/src/lib/utm.ts`
- `frontend/src/app/layout.tsx`
- CTA components on landing/scenarios/guest/paywall/billing
- `frontend/src/app/(auth)/register/page.tsx`
- `frontend/src/app/onboarding/page.tsx`
- `frontend/src/app/(dashboard)/billing/success/page.tsx`
- `backend/app/routers/users.py`
- `backend/app/routers/admin.py`

Риски:

- Много мелких event calls могут расползтись без единого helper.
- Слишком большой analytics abstraction может быть лишним.
- Payment success нельзя считать только frontend success page, webhook должен оставаться источником истины для денег.

Skills/MCP:

- `peaktalk-autonomous-dev-gate`
- Browser network inspector
- Context7 только если нужна актуальная документация Next/React API

Проверки:

- Metrika init есть и не падает.
- `reachGoal` calls видны в browser/network.
- UTM сохраняется в localStorage.
- UTM попадает в Supabase metadata on signup.
- OAuth users отправляют UTM через `/me/utm`.

Done:

- Все P0 события реально fire.
- События содержат минимальные props: source, campaign, cta_location, persona, difficulty, turn, plan_context.
- Admin UTM stats не сломаны.

Не делать:

- Не строить warehouse.
- Не добавлять сложную event ingestion backend систему до доказанного спроса.
- Не считать vanity metrics успехом.

### Трек 4. Trust / privacy / data handling

Цель: снизить страх ввода реального материала без выдуманных compliance claims.

Затронутые зоны:

- `frontend/src/app/simulation/guest/page.tsx`
- `frontend/src/app/(dashboard)/upload/page.tsx`
- `frontend/src/app/privacy/page.tsx`
- `frontend/src/app/personal-data/page.tsx`
- `backend/app/routers/users.py`
- `backend/app/routers/documents.py`
- `backend/app/routers/admin.py`

Риски:

- Нельзя обещать no training, deletion, retention или storage behavior, если это не подтверждено кодом/провайдером.
- Legal pages могут требовать аккуратной формулировки.
- Delete session для guest может потребовать новый endpoint.

Skills/MCP:

- `peaktalk-product-guard`
- `peaktalk-copy-seo-guard`
- `peaktalk-autonomous-dev-gate`, если добавляются endpoints
- `peaktalk-deploy-gate`, если меняется data handling behavior

Проверки:

- Copy рядом с textarea.
- Upload copy.
- Existing delete account/document behavior.
- Browser screenshots.
- Backend tests if endpoint added.

Done:

- Пользователь ясно понимает: что не вставлять, как обезличить, что хранится, где искать delete/export behavior.
- Нет SOC2/GDPR/security overclaims.

Не делать:

- Не писать "полная конфиденциальность".
- Не обещать enterprise compliance.
- Не строить SSO/DPA/admin controls до team pilot.

### Трек 5. UI / landing / scenario pages

Цель: привести first impression и core flow к serious operational tool для pressure-testing.

Затронутые зоны:

- `frontend/src/app/page.tsx`
- `frontend/src/app/scenarios/page.tsx`
- `frontend/src/app/scenarios/[slug]/page.tsx`
- `frontend/src/app/simulation/guest/page.tsx`
- `frontend/src/app/(dashboard)/billing/page.tsx`
- `frontend/src/components/simulation/PrepCard.tsx`

Риски:

- Можно сделать generic SaaS redesign вместо product-specific UI.
- Можно ухудшить mobile text fit.
- Можно перепилить слишком много без данных.

Skills/MCP:

- `peaktalk-ui-quality-gate`
- `peaktalk-product-guard`
- Browser/Playwright screenshots desktop/mobile

Проверки:

- `cd frontend && npm run lint && npm run build`
- Desktop screenshots: `/`, `/simulation/guest`, `/billing`, report.
- Mobile screenshots: same routes.
- Visual scan: no overlap, no overflow, no playful/confetti UI in report.

Done:

- Hero/guest/paywall/billing/report feel serious, dense, professional.
- Copy and visual hierarchy support one-meeting defense flow.

Не делать:

- No Figma unless explicit.
- No generic purple gradients, blobs, oversized SaaS cards.
- No decorative dashboard-first story.

### Трек 6. Founder-led content / outbound system

Цель: подготовить GTM-operating system для validation sprint, не создавать контент ради охвата.

Затронутые зоны:

- New docs/templates under `docs/` if needed.
- UTM templates.
- Founder scripts.
- Content calendar.

Риски:

- Можно уйти в vanity posting.
- Можно вести людей в неготовую воронку.
- Можно размыть ICP слишком широкими темами.

Skills/MCP:

- `peaktalk-copy-seo-guard`
- `peaktalk-product-guard`
- `avoid-ai-writing`, если нужен humanization pass для постов

Проверки:

- Every post/script maps to scenario, pain, CTA and UTM.
- No claims, testimonials, logos, guarantees.
- No broad AI productivity language.

Done:

- 50-account target list criteria.
- 5 outbound scripts.
- 14-day Telegram/VC content kit.
- UTM naming convention.
- Interview tags.

Не делать:

- Не открывать 6 каналов.
- Не запускать paid ads до P0 gate.
- Не писать general AI/self-improvement content.

### Трек 7. Architecture / backlog cleanup

Цель: превратить report в управляемый backlog без scope creep.

Затронутые зоны:

- `docs/`
- Issue/task descriptions.
- Possibly roadmap docs.

Риски:

- Можно переписать стратегию вместо исполнения.
- Можно смешать P0/P1/P2.
- Можно начать enterprise roadmap до proof.

Skills/MCP:

- `peaktalk-product-guard`
- `peaktalk-autonomous-dev-gate` for code-affecting tasks

Проверки:

- Each backlog item has route/files/risk/verification.
- P0 limited to validation-critical changes.

Done:

- Clear first 14-day execution order.
- Subagent prompts ready.
- Verification matrix ready.

Не делать:

- Не строить новую архитектуру без конкретного bottleneck.
- Не добавлять abstractions "на будущее".

## 6. План выполнения на первые 14 дней

### День 1-2: technical/product launch gate

Задачи:

- Проверить guest flow: число AI-вопросов, 422/500, paywall transition.
- Проверить `/scenarios` и top scenario pages.
- Проверить guest -> register/login -> onboarding -> from-guest.
- Проверить `/billing?plan=per_session`.
- Проверить UTM capture и Metrika init.
- Зафиксировать старые category-drift строки в core funnel.
- Составить red/yellow/green memo перед P0 implementation.

Артефакт:

- Launch gate memo с файлами, рисками, командами проверки и решением, что чинить первым.

### День 3-5: P0 guest/paywall/analytics fixes

Задачи:

- Исправить 3 честных AI-вопроса в guest flow.
- Переписать guest paywall под full defense run / Meeting Defense Pack.
- Добавить P0 analytics events.
- Добавить billing opened / payment started / payment success tracking.
- Проверить per-session document/report access.

Артефакт:

- Рабочая P0 воронка: guest value -> paywall -> billing, измеримая через events.

### День 6-8: landing/scenario/trust copy

Задачи:

- Сфокусировать hero и CTA на "проверить позицию перед дорогой рабочей встречей".
- Roadmap/Budget Defense для Product Lead/CPO как основной wedge.
- Усилить trust microcopy рядом с material input.
- Убрать speech-coach language из register/upload/simulation completion.
- Проверить desktop/mobile визуально.

Артефакт:

- Core funnel не конфликтует с report positioning.

### День 9-11: Defense Brief / value artifact

Задачи:

- Repackage prep-card as Defense Brief.
- Добавить copy/export или четкий MVP-путь копирования.
- Показать структуру artifact before payment без fake data.
- Убрать playful/confetti reward feel из report.
- Проверить PDF/print behavior.

Артефакт:

- Paid value выглядит как рабочий документ перед встречей.

### День 12-14: browser QA, metrics QA, founder outreach/content kit

Задачи:

- Full browser walkthrough desktop/mobile.
- Network QA for API/events/Metrika.
- Smoke checks for auth/billing/from-guest.
- Подготовить founder outbound scripts.
- Подготовить 14-day Telegram/VC content kit.
- Подготовить UTM templates.

Артефакт:

- Validation sprint ready checklist.

## 7. P0 implementation candidates

### Candidate 1. Guest 3-question fix

Почему первый:

- Это обещанный value before paywall.
- Если пользователь получает меньше обещанного, trust ломается до оплаты.
- Это проверяется тестами и Browser.

Минимальный changeset:

- Backend turn-count logic.
- Backend tests for exactly 3 assistant questions before paywall.
- Guest UI progress/paywall state if needed.

Риск:

- High: guest simulation behavior.

Проверка:

- `pytest tests/test_simulation.py`
- Browser: start -> Q1 -> A1 -> Q2 -> A2 -> Q3 -> A3 -> paywall.

### Candidate 2. Paywall rewrite to Meeting Defense Pack

Почему второй:

- Текущий paywall продает регистрацию/отчет, а не следующий шаг по боли.
- В момент боли user должен покупать "полный разбор этой встречи".

Минимальный changeset:

- `frontend/src/app/simulation/guest/page.tsx`
- Possibly backend `_PAYWALL_RESPONSE` text.
- CTA to per-session billing / register flow depending auth requirement.

Риск:

- Medium/high: guest-to-user conversion and billing route.

Проверка:

- Browser paywall screenshot desktop/mobile.
- Link flow to `/register?return=/simulation/from-guest` or `/billing?plan=per_session&return=/simulation/from-guest`.

### Candidate 3. Analytics event layer for validation funnel

Почему третий:

- Без событий validation sprint слепой.
- UTM уже есть, значит не надо строить с нуля, нужно закрыть funnel events.

Минимальный changeset:

- Small frontend helper for Metrika goal calls or direct guarded calls.
- Events in landing CTAs, guest start/answer/paywall, billing open/payment start/success.

Риск:

- Medium: many small surfaces, but low data/model risk.

Проверка:

- Browser network sees Metrika calls.
- No SSR/window errors.
- UTM remains stable.

## 8. Промпты для под-агентов

### Общий пролог для каждого под-агента

```text
Ты работаешь в /Users/codeon/peaktalk-last.
Текущая дата: 2026-06-15.

PeakTalk - scenario-driven professional pressure-testing tool before high-stakes work meetings.
Это не speech coaching, не EdTech, не public speaking trainer, не confidence app, не generic AI communication assistant.

Работай сначала как аудитор. Не делай массовые правки. Сначала:
1. Прочитай AGENTS.md.
2. Прочитай релевантные project skills в .agents/skills.
3. Осмотри только нужные файлы через rg/sed.
4. Дай risk gate: что меняется, какие флоу/файлы затрагиваются, чем проверять.
5. Предложи узкий changeset.

Не трогай auth, billing, credits, migrations, guest-to-user conversion или simulation engine без отдельного gate.
Не обещай SOC2/GDPR/security/compliance, если этого реально нет.
Не придумывай testimonials, цифры, логотипы или гарантии результата.
```

### Technical Flow Auditor

```text
Роль: Technical Flow Auditor для PeakTalk.

Задача:
Проверь core validation funnel:
landing -> /simulation/guest -> guest answers -> paywall -> register/login -> onboarding -> /simulation/from-guest -> /billing?plan=per_session -> billing success -> продолжение подготовки.

Обязательные зоны:
- backend/app/routers/guest_simulation.py
- backend/app/routers/simulation.py
- backend/app/routers/billing.py
- backend/app/services/limits.py
- frontend/src/app/simulation/guest/page.tsx
- frontend/src/app/simulation/from-guest/page.tsx
- frontend/src/app/(auth)/register/page.tsx
- frontend/src/app/onboarding/page.tsx
- frontend/src/app/(dashboard)/billing/page.tsx
- frontend/src/components/billing/PerSessionCard.tsx
- backend/tests/test_simulation.py
- backend/tests/test_billing.py

Вывод:
1. Что уже работает.
2. Где возможен broken flow.
3. Где риск billing/auth/guest/data.
4. Минимальный P0 changeset.
5. Тесты и Browser checks.

Не реализуй правки без risk gate.
```

### Analytics / UTM Auditor

```text
Роль: Analytics / UTM Auditor для PeakTalk.

Задача:
Проверь, можно ли измерить validation funnel:
landing_cta_clicked -> guest_page_viewed -> guest_started -> guest_question_seen -> guest_answer_submitted -> guest_paywall_seen -> billing_opened -> payment_started -> payment_succeeded.

Обязательные зоны:
- frontend/src/lib/utm.ts
- frontend/src/app/layout.tsx
- frontend/src/components/providers/auth-provider.tsx
- frontend/src/app/(auth)/register/page.tsx
- frontend/src/app/onboarding/page.tsx
- frontend/src/app/page.tsx
- frontend/src/app/scenarios/*
- frontend/src/app/simulation/guest/page.tsx
- frontend/src/app/(dashboard)/billing/page.tsx
- frontend/src/app/(dashboard)/billing/success/page.tsx
- backend/app/routers/users.py
- backend/app/routers/admin.py

Вывод:
1. Какие UTM mechanics уже есть.
2. Какие events реально отсутствуют.
3. Где лучше поставить event calls.
4. Какие props нужны для каждого event.
5. Как проверить через Browser/network.

Не строй новый analytics backend. Начни с минимального Metrika/event helper, если он нужен.
```

### Product Copy Cleanup Agent

```text
Роль: Product Copy Cleanup Agent для PeakTalk.

Задача:
Найди и предложи замену для category drift в core funnel.

Ищи:
- выступления
- публичные выступления
- уверенность
- soft skills
- навыки общения
- speech coach
- тренер коммуникации
- тренировка речи
- коуч
- харизма
- generic AI assistant

Обязательные зоны:
- frontend/src/app/(auth)/register/page.tsx
- frontend/src/app/(dashboard)/upload/page.tsx
- frontend/src/app/(dashboard)/dashboard/page.tsx
- frontend/src/app/(dashboard)/simulation/page.tsx
- frontend/src/app/(dashboard)/simulation/[id]/page.tsx
- frontend/src/app/(dashboard)/simulation/[id]/report/page.tsx
- frontend/src/app/simulation/guest/page.tsx
- backend/app/services/cloud_ru_ai.py
- backend/app/services/simulation_ai.py

Целевая лексика:
- проверка позиции
- stress-test аргументации
- pressure-testing
- защита решения
- слабые места аргументов
- неудобные вопросы
- конкретная рабочая встреча
- Defense Brief
- подготовка перед встречей

Вывод:
1. Таблица file / current copy / replacement / risk.
2. Узкий P0 changeset.
3. Что оставить на P1.

Не переписывай весь продукт. Сначала только core funnel.
```

### UI Quality Agent

```text
Роль: UI Quality Agent для PeakTalk.

Задача:
Проверь визуальное качество и серьезность core funnel:
- /
- /simulation/guest
- guest paywall state
- /billing?plan=per_session
- report/prep-card page
- /scenarios and top scenario page

Критерии:
- industrial modernism + utilitarian editorial
- paper / graphite / ember orange / AI violet
- low-radius controls
- no generic SaaS gradients/blobs
- no playful reward UI
- no confetti/achievements/streaks/badges
- no text overflow
- stable mobile layout

Вывод:
1. Route / issue / severity / fix recommendation.
2. Какие screenshots нужны.
3. Минимальный changeset.

Не делай Figma. Не делай redesign ради красоты. Только то, что повышает trust и conversion in validation funnel.
```

### Founder Content / Outbound Agent

```text
Роль: Founder Content / Outbound Agent для PeakTalk.

Задача:
Подготовь founder-led validation sprint kit, но только после фикса P0 product gates.

Стартовый ICP:
Product Lead / Head of Product / CPO в B2B SaaS, IT-сервисах, digital-продуктах, 20-300 сотрудников.

Стартовый сценарий:
Roadmap / Budget Defense перед CEO/CFO/founder/board.

Оффер:
Meeting Defense Pack - одна встреча, один документ, один оппонент, один Defense Brief.

Каналы:
Личный outbound основателя, Telegram founder-led distribution, VC.ru.

Вывод:
1. Criteria для 50 target accounts.
2. 5 DM scripts.
3. 14 Telegram/VC post topics.
4. UTM templates.
5. Interview tags.
6. Weekly review metrics.

Запреты:
- Не писать broad AI productivity content.
- Не писать про self-improvement/confidence.
- Не обещать результаты.
- Не придумывать testimonials.
- Не запускать paid ads до P0 gate.
```

## 9. Verification matrix

| Зона | Проверки |
|---|---|
| Frontend static | `cd frontend && npm run lint && npm run build` |
| Backend guest/billing | `cd backend && pytest tests/test_simulation.py tests/test_billing.py` |
| Guest API | `POST /simulation/guest-start`, `POST /simulation/guest-message` без 422/500 |
| Guest value | Browser: start -> Q1 -> A1 -> Q2 -> A2 -> Q3 -> A3 -> paywall |
| Guest-to-user | Browser: paywall -> register/login -> onboarding -> `/simulation/from-guest` |
| Billing | Browser: `/billing?plan=per_session&return=/simulation/from-guest` -> payment init |
| Payment | Verify `POST /billing/payment`, YooKassa redirect, success page, webhook behavior in test mode |
| Session credits | Credit increments on payment success and consumes once on full session start |
| Document/report access | Per-session user can access promised report/prep-card without hidden free-plan document limit conflict |
| UTM | UTM captured in localStorage, preserved through register/onboarding, visible in admin stats |
| Metrika | Yandex Metrika init loads, `reachGoal` calls visible in Browser network |
| Analytics events | `landing_cta_clicked`, `guest_started`, `guest_answer_submitted`, `guest_paywall_seen`, `billing_opened`, `payment_started`, `payment_succeeded` fire with props |
| Landing UI | Desktop 1440 and mobile 390 screenshots |
| Guest UI | Input, chat and paywall screenshots desktop/mobile |
| Billing UI | Per-session highlighted route desktop/mobile |
| Report/Defense Brief UI | Completed report/prep-card screenshot desktop/mobile, no playful reward state |
| Scenario pages | `/scenarios`, top scenario slug, title/description/CTA/canonical if relevant |
| Trust copy | Guest textarea and upload page show accurate redaction/data handling guidance |
| No overclaims | No SOC2/GDPR/security/testimonial/result guarantee claims unless verified |
| Deploy | `peaktalk-deploy-gate` before production: diff, lint/build/tests, env, migrations, smoke, rollback |

## 10. Рекомендуемые первые 1-3 P0 задачи

### 1. Guest 3-question fix

Это первая задача, потому что она защищает value before paywall. Если PeakTalk обещает 3 вопроса, пользователь должен получить 3 ощутимых AI-вопроса. Иначе он чувствует недодачу до оплаты.

Риск:

- High: guest simulation behavior and turn counting.

Почему все равно первой:

- Без нее нельзя честно вести трафик.
- Это легко проверить тестом и Browser walkthrough.

### 2. Paywall rewrite to Meeting Defense Pack

Это вторая задача, потому что текущий paywall продает регистрацию/отчет, а не продолжение подготовки к конкретной встрече.

Правильный момент:

- Пользователь уже ответил на жесткие вопросы.
- Он должен купить full defense run / Defense Brief, а не "создать аккаунт".

Риск:

- Medium/high: guest-to-user and billing path.

Почему важно:

- Это напрямую влияет на paywall-to-paid conversion.

### 3. Analytics event layer for validation funnel

Это третья задача, потому что без событий sprint будет слепым.

Что нужно измерить:

- Кто нажал CTA.
- Кто начал guest.
- Кто ответил.
- Кто увидел paywall.
- Кто открыл billing.
- Кто начал оплату.
- Кто оплатил.

Риск:

- Medium: много мелких frontend surfaces.

Почему важно:

- Без этого нельзя отличить плохой трафик от плохого guest flow, плохого paywall или плохого billing path.

## 11. Почему не начинать с контента или архитектуры

Если начать с контента:

- Ты приведешь людей в воронку, где guest value может быть недодан.
- Paywall может продавать не тот next step.
- Не будет понятно, где люди отваливаются.
- Основатель получит шум вместо learning.

Если начать с архитектуры:

- Проект потратит время на внутреннюю аккуратность без доказательства paid demand.
- Есть риск построить team/admin/analytics platform до первых сигналов.
- Architecture work должен следовать за bottleneck, а не заменять commercial validation.

Правильная последовательность:

1. Честный value before paywall.
2. Правильный paid offer.
3. Измеримая воронка.
4. Только потом founder-led content/outbound.
5. Только после paid/repeat/team signals - P1/P2 расширения.
