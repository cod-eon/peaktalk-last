# PeakTalk implementation log

Last updated: 2026-06-16

Purpose: keep a running implementation record for applying the deep research report without losing P0/P1/P2 discipline.

Primary plan: [peaktalk-execution-map-2026-06-15.md](./peaktalk-execution-map-2026-06-15.md)

## How to use this file

- Append a new dated entry after every meaningful implementation session.
- Keep facts separate from plans: write what changed, what was verified, what remains risky.
- Do not mark a P0 item complete without fresh verification evidence.
- Keep PeakTalk positioned as scenario-driven professional pressure-testing before high-stakes work meetings.
- Do not let this log become a wishlist. If an item is not needed for validation sprint learning, push it to P1/P2.

## Current state

The execution map exists and core P0 implementation is underway. The only open P0 items now require real payment/auth QA rather than more speculative product work.

Completed P0 slice:

- Guest flow now gives 3 real AI questions before paywall.
- Guest paywall now sells `Meeting Defense Pack` / `Defense Brief` for this meeting, not abstract registration.
- Guest continuation from `/simulation/from-guest` now requires a paid `session_credit`; free simulation limit no longer bypasses the paywall.
- Billing route for `?plan=per_session` now actually renders the per-session card.
- P0 funnel events were added around landing, guest, paywall, billing, payment start, and payment success.
- `/billing` is now protected and preserves the original `return` target through login/register.
- Guest-to-paid migration is now expiry-aware and retry-safe: an expired unmigrated guest session is rejected before credit consumption, and a repeated migration returns the original full session without consuming another credit.
- Trust/privacy microcopy was added or tightened near the guest material input and upload action area without overclaiming SOC2/GDPR/security.
- High-impact speech-coach drift was removed from registration, upload, dashboard, analysis labels, FastAPI description, and core AI prompt framing.
- Defense Brief wording now matches the paid promise across paywall, report artifact UI, backend artifact messages, and prep-card generation prompt.
- A backend regression test now confirms paid sessions can access the full Defense Brief even when the user's remaining `session_credits` are already `0`.
- YooKassa webhook event normalization now accepts the official `payment.canceled` event from the merchant dashboard while preserving legacy/internal `payment.cancelled` handling.
- Visible Google OAuth entrypoints were removed locally from login/register; email/password remains as the temporary bridge until Logto replaces Supabase Auth.

Completed P1 slice:

- Paid/full Defense Brief now has copy-to-clipboard and `.md` export actions in addition to print/PDF.
- Defense Brief export includes opening move, key arguments, anchor phrases, danger zones, and key numbers.
- The full Defense Brief render was split from the data-loading wrapper so it can be visually checked without touching billing/auth/backend access logic.
- Artifact polling in `PrepCard` now handles the project's `ApiError.status` instead of an axios-shaped error object.
- The first scenario-specific wedge page now exists as `/scenarios/roadmap-budget-defense`.
- The scenario catalog now prioritizes Roadmap / Budget Defense instead of a random "scenario of the day".
- Scenario catalog/detail UI was tightened into a pressure-testing catalog and pressure sheet, with mobile overflow checked.
- Scenario metadata now points to working defense pressure tests instead of generic meeting preparation.
- Backend seed data now includes `roadmap-budget-defense`, so production scenario API does not have to rely only on frontend fallback.
- `/scenarios` and `/scenarios/[slug]` now emit scenario analytics events for catalog view, card/primary CTA clicks, detail view, and start clicks.
- Guest paywall now shows an example Defense Brief format before payment, clearly marked as an example and not analysis of the user's material.
- Paid Defense Brief reports now include a one-time same-material rerun action. The rerun creates a new active pressure-test from the original material without consuming another `session_credit`, and repeated clicks return the same rerun session instead of duplicating runs.
- The report page no longer launches confetti on high scores; the report tone is kept serious and operational.

Verification evidence from the implementation session:

- `cd frontend && npm run lint` exited 0. Existing warnings remain in generated/public and unrelated files.
- `cd frontend && npm run build` exited 0.
- `cd backend && pytest tests/test_simulation.py tests/test_billing.py` passed: 29 tests.
- Browser smoke with mocked guest API confirmed Q1/A1/Q2/A2/Q3/A3/paywall on `/simulation/guest`.
- Browser smoke confirmed mobile paywall CTA fits and no page/console errors were introduced, except the expected localhost hCaptcha warning on auth page.
- Browser smoke confirmed `/billing?plan=per_session&return=/simulation/from-guest` redirects to login with the billing return preserved.
- Alembic check confirmed one head: `0020_guest_migration_state`.
- Alembic SQL generation for `0019_add_utm:0020_guest_migration_state` rendered the expected nullable columns, index, and FK.
- `cd frontend && npm run lint` exited 0 after copy/trust/Defense Brief changes. Existing warnings remain.
- `cd frontend && npm run build` exited 0 after copy/trust/Defense Brief changes.
- `cd frontend && npm run build` exited 0 after the Roadmap/Budget Defense scenario/catalog slice.
- `cd backend && pytest tests/test_scenarios.py tests/test_simulation.py tests/test_billing.py` passed after backend seed/API parity and scenario analytics wiring: 34 tests.
- Typed frontend scenario tests for catalog metadata and analytics helpers passed through temporary `tsc` + `node` execution.
- `cd frontend && npm run lint` exited 0 after scenario analytics wiring. Existing warnings remain in generated/public and unrelated files.
- `cd frontend && npm run build` exited 0 after scenario analytics wiring.
- Browser/Playwright visual check of `/simulation/guest` desktop 1440px and mobile 390px showed no horizontal overflow or console/page errors.
- Playwright visual check of `/scenarios` and `/scenarios/roadmap-budget-defense` at 1440x1000 and 390x844 showed no horizontal overflow; local console errors were limited to expected `localhost:8000` API connection failures while fallback scenarios rendered.
- Mocked guest flow reached paywall on desktop 1440px and mobile 390px; paywall showed expected Metrika events, no horizontal overflow, and no console/page errors.
- TDD RED/GREEN for `frontend/src/lib/example-defense-brief.test.ts` confirmed the example Defense Brief module is clearly marked as a format example, not user-material analysis.
- `cd frontend && npm run lint` exited 0 after the example Defense Brief preview slice. Existing 107 warnings remain in generated/public and unrelated files.
- `cd frontend && npm run build` exited 0 after the example Defense Brief preview slice.
- Playwright visual check of `/simulation/guest` paywall with mocked guest API at 1440x1000 and 390x844 confirmed example preview text, `Defense Pack — 299 ₽` CTA, no horizontal overflow, and no console/page errors.
- TDD RED/GREEN for paid same-material rerun confirmed the missing endpoint failed first, then passed after implementation.
- `cd backend && pytest tests/test_simulation.py -k "rerun_paid_session or rerun_free_session"` passed: 2 tests.
- `cd backend && pytest tests/test_simulation.py tests/test_billing.py` passed: 32 tests.
- `cd backend && pytest tests/` passed after the same-material rerun slice: 65 tests.
- `cd frontend && npm run lint` exited 0 after report rerun UI. Existing 107 warnings remain in generated/public and unrelated files.
- `cd frontend && npm run build` exited 0 after report rerun UI.
- `cd frontend && npm run lint` exited 0 after CI/lint cleanup. Existing warnings are down to 105 and remain in generated/public and unrelated files.
- `cd frontend && npm run build` exited 0 after CI/lint cleanup.
- `git diff --check` exited 0 after CI/lint cleanup.

## Completed P0 that must not regress

### P0: make guest migration one-time and expiry-aware

Why it matters:

- `/simulation/from-guest` now requires paid credit, but the guest token can still potentially be reused.
- Reuse can create duplicate full sessions, consume multiple credits in retry scenarios, or make support/debugging messy.
- The route loads `GuestSession` directly and should be aligned with the same expiry discipline as guest endpoints.

Minimal expected changes:

- Reject expired guest sessions in `/simulation/from-guest`.
- Make migration idempotent or one-time:
  - either mark a guest session as migrated and reject repeat migration;
  - or store/link the resulting simulation session id and return it safely on retry without consuming another credit.
- Add backend regression tests:
  - expired guest session returns 410 or a clear 4xx error;
  - repeated migration does not create duplicate sessions or consume multiple credits;
  - valid paid migration still creates a full session and consumes exactly one credit.

Risk:

- High: guest-to-user conversion, credits, paid access, session persistence.
- Do not change general `/simulation/start` limits while doing this.
- Do not change YooKassa webhook behavior in the same changeset.

Implemented:

- Added `guest_sessions.migrated_session_id` and `guest_sessions.migrated_at`.
- Added Alembic migration `0020_guest_migration_state`.
- `/simulation/from-guest` now:
  - returns the existing full simulation for same-user retry;
  - rejects reuse if the token was migrated into another account;
  - rejects expired unmigrated guest sessions with `410 guest_session_expired`;
  - consumes `session_credit` only after idempotency and expiry checks.
- Added regression tests for expired guest sessions and retry-safe migration.

Verification:

- `cd backend && pytest tests/test_simulation.py tests/test_billing.py`
- `cd backend && alembic heads`
- `cd backend && alembic upgrade 0019_add_utm:0020_guest_migration_state --sql`

## Open P0 backlog

1. Manual QA of real YooKassa test flow, including success return and webhook confirmation.
2. Browser QA of `/upload` after logging into a real dev/test account; unauthenticated local route correctly redirects to `/login?return=/upload`.
3. Auth/legal compliance gate: visible Google OAuth removal is deployed; direct Logto replacement of Supabase-hosted Auth remains the next auth architecture track before broader launch.
4. YooKassa dashboard configuration: HTTP notification URL is currently absent in the shop UI screenshot. Configure `https://peaktalk.ru/webhooks/yookassa` and verify `payment.succeeded` delivery before considering payment QA closed.

## Next recommended work

1. Configure YooKassa HTTP notifications in the merchant dashboard.
2. Close P0 real YooKassa payment QA: checkout -> success return -> webhook -> DB/payment credit -> guest continuation.
3. Close P0 authenticated `/upload` browser QA with a real dev/test account.
4. Continue auth/legal compliance gate after P0 payment/upload checks: provision Logto on the separate Timeweb Cloud-80 RU server according to [logto-migration-gate-2026-06-16.md](./logto-migration-gate-2026-06-16.md). Existing user preservation is explicitly not required, but the local UUID user model must not be tied to Logto `sub`.
5. Finish authenticated browser QA when a real test account/session is available.
6. Defer team mode, aggregated analytics, custom scenarios, integrations, and enterprise admin until paid signals exist.

## P1 parking lot

- Additional reruns beyond the included one-time same-material rerun require an explicit pricing/product decision; do not silently create an infinite free rerun loop.
- Wire post-meeting feedback into the report/dashboard flow.
- Replace Supabase-hosted Auth with a controlled auth stack after the immediate Google OAuth removal/risk gate.
- Auth architecture decision: Logto is the preferred replacement direction over Keycloak for PeakTalk's current stage because it is lighter operationally, easier to reason about for email/magic-link and future Yandex ID, and avoids enterprise IAM complexity before paid validation signals. Since there is no meaningful production user base yet, user preservation is not a blocker; still, guest-to-paid conversion, billing user IDs, and backend auth middleware must be migrated deliberately.
- Logto migration research gate: before implementing Logto, study current official Logto docs and choose the best modern deployment/integration path for PeakTalk. Required topics: self-hosted production deployment, Docker/Compose architecture, Postgres/Redis requirements, reverse proxy/HTTPS, custom domain, email connector via REG.RU SMTP first, Next.js integration, FastAPI/JWT validation, user-id mapping, logout/session behavior, future Yandex ID connector, backups, upgrade path, and rollback. Do not start Logto code changes from stale assumptions.
- Auth replacement evaluation note: Yandex ID can be integrated later more directly in Logto via generic OAuth/OIDC connectors; Keycloak can broker OIDC/SAML easily, but pure OAuth 2.0 providers may require a custom/provider extension or extra mapping work.
- Logto migration gate doc: [logto-migration-gate-2026-06-16.md](./logto-migration-gate-2026-06-16.md). Key decisions: use Logto OSS self-hosted, deploy it on the separate Timeweb Cloud-80 RU server when credentials/DNS are available, separate local `users.id` from external Logto `sub` through `auth_provider/auth_subject`, start with REG.RU SMTP only after deliverability seed tests, and treat Yandex ID as a second connector spike after first Logto cutover. Existing users/auth can be reset if needed because there is no meaningful production user base.
- Auth email delivery note: current Supabase Auth sends sign-up/reset emails outside the PeakTalk backend. For Logto/Keycloak migration, configure an auth-provider SMTP connector using a domain mailbox or transactional email provider. REG.RU domain mail can work for low-volume auth links via SMTP (`mail.hosting.reg.ru`, SSL/TLS 465 or SMTP 587), but deliverability for magic links should be tested and likely moved to a dedicated transactional sender if validation traffic grows.
- Auth email provider decision note: use REG.RU Mail-1 for domain mailboxes and owner/support correspondence, but prefer UniSender Go or another transactional email transport for production auth/magic-link delivery. Reason: magic-link reliability needs delivery logs, DKIM/SPF/DMARC alignment, bounce visibility, API/SMTP transport, and provider reputation; mailbox hosting is acceptable only as a short validation fallback.
- Auth email provider comparison note: REG.RU Mail-1 is already paid and useful for `support@`, `hello@`, `noreply@`, and founder correspondence, but it is still mailbox hosting with account-level send limits and weaker operational visibility. UniSender Go is the better target for production auth emails because it is built as SMTP/API email transport, supports delivery/open tracking, operation logs, webhooks/statistics, and Russian hosting/compliance claims. Important pricing clarification: ordinary UniSender Free allows up to 1500 emails/month to 100 contacts, while UniSender Go free/test mode allows up to 100 emails/day only to addresses on confirmed owned domains; real magic-link delivery to arbitrary user emails requires a paid/activated UniSender Go setup, card binding, or another transactional sender. Before switching magic links, run a seed test to Gmail/Yandex/Mail.ru, verify SPF/DKIM/DMARC, and keep REG.RU as fallback only for validation-volume traffic.
- Supabase Storage/S3 audit: later decide whether PeakTalk should keep uploaded meeting materials in object storage at all. Inspect current document lifecycle, extraction pipeline, deletion semantics, retention/privacy copy, cost/ops overhead, and whether the validation product can store only extracted text plus metadata instead. Do not remove storage until upload/report flows and data retention promises are audited.
- Late GTM review after critical fixes: review the user's 10 startup marketing theses only after P0 payment/auth/upload gates are closed. Apply the useful parts narrowly to PeakTalk: sell/validate before building more product, founder-led CustDev, unit economics, scenario-intent SEO, real social proof, building-in-public, niche community participation, targeted outbound, partnerships, and channel mix. Reject or heavily adapt parts that conflict with PeakTalk: broad "for everyone" acquisition, generic public-speaking SEO, invented testimonials, mass-market gimmicks, playful gamification/streaks/badges, low-price dumping, loud guerrilla stunts, and push-notification mechanics before retention evidence. The review output should become a validation sprint GTM operating memo, not a new product roadmap.

## Do not build yet

- Team analytics.
- Enterprise admin.
- LMS/certification.
- Achievements, streaks, badges, avatars.
- Heavy integrations.
- Generic public-speaking SEO pages.
- Broad "AI communication coach" repositioning.

## Session log

### 2026-06-15 - P0 validation funnel slice

Scope:

- Guest simulation turn logic.
- Guest paywall positioning and CTA.
- Guest-to-paid continuation guard.
- Billing per-session visibility.
- Frontend analytics events for validation funnel.
- Auth middleware return preservation for billing.

Files changed:

- `backend/app/routers/guest_simulation.py`
- `backend/app/routers/simulation.py`
- `backend/tests/test_simulation.py`
- `frontend/src/lib/analytics.ts`
- `frontend/src/lib/guest-api.ts`
- `frontend/src/app/page.tsx`
- `frontend/src/app/simulation/guest/page.tsx`
- `frontend/src/app/simulation/from-guest/page.tsx`
- `frontend/src/app/(dashboard)/billing/page.tsx`
- `frontend/src/app/(dashboard)/billing/success/page.tsx`
- `frontend/src/components/billing/PerSessionCard.tsx`
- `frontend/src/lib/supabase/middleware.ts`

What changed:

- Fixed the off-by-one guest flow: paywall appears only after the answer to the third AI question.
- Persisted the final guest answer before paywall so paid continuation does not lose the last response.
- Reframed paywall around `Meeting Defense Pack` and `Defense Brief`.
- Added `session_credit_required` guard for `/simulation/from-guest`.
- Added regression tests for 3-question guest flow and paid-credit requirement.
- Added `trackEvent()` helper wrapping Yandex Metrika `reachGoal` and first-touch UTM props.
- Added core funnel events:
  - `landing_cta_clicked`
  - `guest_page_viewed`
  - `guest_started`
  - `guest_question_seen`
  - `guest_answer_submitted`
  - `guest_paywall_seen`
  - `billing_opened`
  - `payment_started`
  - `payment_succeeded`
- Rendered per-session card on billing for free/non-paid users.
- Changed YooKassa return path for guest payment to `/billing/success?return=/simulation/from-guest` so status confirmation happens before guest migration.
- Protected `/billing` in middleware and preserved original return URL cleanly.

Verification:

- TDD red checks were run for:
  - guest should receive third question before paywall;
  - `/simulation/from-guest` should reject users without `session_credit`.
- Final checks:
  - `cd frontend && npm run lint` -> exit 0.
  - `cd frontend && npm run build` -> exit 0.
  - `cd backend && pytest tests/test_simulation.py tests/test_billing.py` -> 26 passed.
  - Browser smoke with mocked guest API -> Q1/A1/Q2/A2/Q3/A3/paywall reached.
  - Browser smoke checked desktop/mobile paywall layout.
  - Browser smoke checked billing redirect to login with preserved return.

Known residual risks:

- Real YooKassa test payment/webhook path still needs manual QA before any deploy.
- Analytics events are frontend Metrika goals only; no backend event warehouse was added by design.
- Existing lint warnings outside this changeset remain.

### 2026-06-15 - P0 guest migration safety slice

Scope:

- Guest-to-paid migration route `/simulation/from-guest`.
- Guest session migration state.
- Alembic migration path.
- Backend regression tests.

Files changed:

- `backend/app/models/guest.py`
- `backend/app/routers/simulation.py`
- `backend/alembic/env.py`
- `backend/alembic/versions/0020_add_guest_migration_state.py`
- `backend/tests/test_simulation.py`
- `docs/peaktalk-implementation-log.md`

What changed:

- Added `migrated_session_id` and `migrated_at` to `guest_sessions`.
- Added migration `0020_guest_migration_state` with nullable columns, index, and FK to `simulation_sessions`.
- Added row-level lock intent with `with_for_update()` when loading the guest session for migration.
- Made repeat migration idempotent for the same user: returns the already-created full simulation id and does not consume another credit.
- Rejected reuse when a migrated guest token belongs to another account.
- Rejected expired unmigrated guest sessions with `410` and code `guest_session_expired` before consuming credit.
- Added Alembic env import for `app.models.guest` so future schema autogeneration sees guest models.

Verification:

- TDD RED:
  - expired guest test failed because old code returned `201` and consumed credit;
  - retry test failed because old code returned a different session id and consumed a second credit.
- Targeted GREEN:
  - `cd backend && pytest tests/test_simulation.py -k "expired_guest or retry_returns_existing or start_from_guest_uses_public_token or requires_session_credit"` -> 4 passed.
- Final checks:
  - `cd backend && pytest tests/test_simulation.py tests/test_billing.py` -> 28 passed.
  - `cd backend && alembic heads` -> `0020_guest_migration_state (head)`.
  - `cd backend && alembic upgrade 0019_add_utm:0020_guest_migration_state --sql` rendered expected SQL.

Known residual risks:

- Real YooKassa webhook/payment confirmation has not been manually tested in browser after this migration.
- No production migration was run.
- Concurrent double-click safety is improved by row-lock intent on PostgreSQL, but still depends on the production transaction behavior around this route.

### 2026-06-15 - P0 trust/privacy and category cleanup slice

Scope:

- Trust/privacy microcopy near material inputs.
- High-impact product category drift in registration/upload/dashboard/analysis copy.
- AI prompt framing that still called the product a speech coach or public-speaking flow.

Files changed:

- `frontend/src/app/(auth)/register/page.tsx`
- `frontend/src/app/(dashboard)/upload/page.tsx`
- `frontend/src/app/simulation/guest/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/app/(dashboard)/analysis/[id]/page.tsx`
- `frontend/src/app/(dashboard)/simulation/page.tsx`
- `frontend/src/lib/constants/personas.ts`
- `backend/app/main.py`
- `backend/app/services/cloud_ru_ai.py`
- `backend/app/services/simulation_ai.py`
- `docs/peaktalk-implementation-log.md`

What changed:

- Replaced registration subtitle about "выступления" with stress-test framing before a work meeting.
- Replaced upload demo text about fear of public speaking/corporate training with a Roadmap/Budget Defense-style material sample.
- Replaced upload placeholder/logs/draft title from speech/text-analysis language to meeting material, weak spots, and argumentation checks.
- Replaced vague "Ваши данные надежно защищены" with concrete guidance: do not paste passwords, personal data, commercial secrets, or NDA fragments; material is used for analysis/questions.
- Tightened guest material microcopy with the same privacy/trust standard and Defense Pack continuation context.
- Reframed dashboard/analysis labels away from "текст выступления" and "готов к выступлению".
- Reframed FastAPI description and AI prompts away from `speech coach`, `бизнес-коуч`, `выступающий`, and public-speaking prep toward stress-testing argumentation before work meetings.
- Replaced report/paywall artifact naming from "шпаргалка / Prep Card" to `Defense Brief`.
- Added backend regression coverage that a session marked `paid_access` can fetch its full Defense Brief even when `session_credits` is `0`.

Verification:

- Search over changed critical files found no remaining `speech coach`, `тренер по коммуникации`, `выступление`, `выступающий`, `спикер`, `уверенность`, `текст выступления`, `демо-спич`, `шпаргалка`, `Prep Card`, or vague `надежно защищены` drift.
- `cd backend && pytest tests/test_simulation.py -k "paid_session_can_access_prep_card_artifact"` -> 1 passed.
- `cd backend && pytest tests/test_simulation.py tests/test_billing.py` -> 29 passed.
- `cd frontend && npm run lint` -> exit 0; existing warnings remain.
- `cd frontend && npm run build` -> exit 0.
- Playwright visual check:
  - `/simulation/guest` at 1440x1000 -> no horizontal overflow, no console/page errors.
  - `/simulation/guest` at 390x844 -> no horizontal overflow, no console/page errors.
  - mocked `/simulation/guest` Q1/A1/Q2/A2/Q3/A3/paywall at 1440x1000 and 390x844 -> no horizontal overflow, no console/page errors; `guest_paywall_seen` fired.
  - `/upload` unauthenticated correctly redirected to `/login?return=/upload`; full visual QA of upload needs a real dev/test auth session.

Known residual risks:

- Upload page layout was build/lint-verified but not browser-verified in authenticated state.
- Legal/privacy pages still contain generic examples like presentations/documents; those are not core funnel positioning but can be cleaned later.

### 2026-06-15 - P0 YooKassa/upload QA feasibility audit

Scope:

- Billing/payment QA readiness.
- Authenticated `/upload` browser QA readiness.
- Existing autonomous backend coverage for billing/webhooks.

Files changed:

- `docs/peaktalk-implementation-log.md`

What changed:

- No product code changed in this audit.
- Confirmed autonomous checks available:
  - `cd backend && pytest tests/test_billing.py`;
  - unauthenticated browser redirect checks for `/billing?plan=per_session&return=/simulation/from-guest` and `/upload`;
  - synthetic dev-only `POST /webhooks/yookassa` can smoke internal webhook handling, but not provider redirect/delivery.
- Confirmed existing billing test coverage verifies:
  - payment method summary;
  - subscription activation from synthetic `payment.succeeded`;
  - recurrent `payment.cancelled` path to `past_due`.
- Confirmed real YooKassa payment QA remains blocked without `PAYMENTS_ENABLED=true`, YooKassa test credentials, and a reachable webhook URL.
- Confirmed authenticated `/upload` browser QA remains blocked without a real Supabase browser session or dev/test credentials; no local auth bypass was found.

Verification:

- Code inspection only via billing/upload/auth route and test files.
- No P0 item was marked complete from this audit.

Known residual risks:

- Real YooKassa redirect, success return, and webhook delivery are still unverified end-to-end.
- Full `/upload` visual/interaction QA after login is still unverified.

### 2026-06-15 - P1 Defense Brief copy/export slice

Scope:

- Paid/full Defense Brief UI.
- Defense Brief export formatter.
- Artifact polling error handling.
- One remaining backend artifact copy drift.

Files changed:

- `frontend/src/components/simulation/PrepCard.tsx`
- `frontend/src/lib/defense-brief-export.ts`
- `frontend/src/lib/defense-brief-export.test.ts`
- `backend/app/routers/simulation.py`
- `docs/peaktalk-implementation-log.md`

What changed:

- Added `formatDefenseBriefMarkdown()` and `buildDefenseBriefFilename()` for portable `.md` export.
- Added TDD coverage for markdown structure, filename sanitization, and sparse artifacts without `undefined`/`null`.
- Added copy-to-clipboard and `.md` download actions to the full paid Defense Brief branch.
- Kept export actions out of the teaser/paywall branch.
- Included backend-generated `anchor_phrases` in both UI and markdown export.
- Split `DefenseBriefCard` from `PrepCard` so the full artifact render can be visually checked without changing backend access logic.
- Fixed `PrepCard` polling to use `ApiError.status` for `404/409` artifact-not-ready responses.
- Replaced the last backend artifact route message that still called the artifact a "Шпаргалка".

Verification:

- TDD RED:
  - formatter test initially failed because `frontend/src/lib/defense-brief-export.ts` did not exist;
  - `anchor_phrases` test then failed because the type/export did not include the backend field.
- Targeted GREEN:
  - `cd frontend && ./node_modules/.bin/tsc --target ES2020 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck --rootDir . --outDir /tmp/peaktalk-defense-brief-export-test src/lib/defense-brief-export.test.ts src/lib/defense-brief-export.ts && node /tmp/peaktalk-defense-brief-export-test/src/lib/defense-brief-export.test.js`
  - `cd backend && pytest tests/test_simulation.py -k "artifact or prep_card"` -> 2 passed.
- Final checks:
  - `cd frontend && npm run lint` -> exit 0; existing 108 warnings remain.
  - `cd frontend && npm run build` -> exit 0.
  - Drift search over touched Defense Brief files found no remaining `шпаргалка`, `Prep Card`, `спич`, or motivational victory language.
- Visual QA:
  - Temporary local route `/qa-defense-brief` was added only to render `DefenseBriefCard` with a representative paid artifact, then deleted before final build.
  - Headless Chrome screenshots saved:
    - `/tmp/peaktalk-defense-brief-desktop-1440.png`
    - `/tmp/peaktalk-defense-brief-mobile-390.png`
  - Mobile DOM marker reported `data-overflow-x="false"` and `data-action-count="3"`.
  - Desktop/mobile screenshots showed the three actions (`Копировать`, `Скачать .md`, `PDF`) and no visible overlap.

Known residual risks:

- Real authenticated `/simulation/[id]/report` was not opened with a Supabase session; QA used the same extracted `DefenseBriefCard` render instead.
- Clipboard permission behavior was not browser-click-tested in the real authenticated route; formatter, compile, build, and visual action rendering were verified.

### 2026-06-15 - P1 Roadmap/Budget Defense scenario and catalog UI slice

Scope:

- Scenario-specific Roadmap / Budget Defense wedge.
- Public `/scenarios` catalog page.
- Public `/scenarios/roadmap-budget-defense` detail page.
- Scenario catalog metadata and SEO metadata.

Files changed:

- `frontend/src/lib/scenarios-catalog.ts`
- `frontend/src/lib/scenarios-catalog.test.ts`
- `frontend/src/app/scenarios/page.tsx`
- `frontend/src/app/scenarios/[slug]/page.tsx`
- `frontend/src/app/scenarios/layout.tsx`
- `docs/peaktalk-implementation-log.md`

What changed:

- Added `roadmap-budget-defense` as the first fallback scenario with ICP-specific copy for Head of Product / Product Lead / CPO defending roadmap and budget before CEO/CFO/founder/board.
- Added TDD coverage that the wedge scenario exists, belongs to `roadmap`, contains ICP/opponent language, has preparation inputs, sample hostile questions, FAQ, and promises Defense Brief.
- Replaced the random "scenario of the day" catalog emphasis with a fixed validation-sprint wedge around Roadmap / Budget Defense.
- Redesigned `/scenarios` into a denser pressure-testing catalog: wedge hero, Meeting Defense Pack panel, category filters, and cards that show pressure and output artifact instead of generic blurbs.
- Redesigned `/scenarios/[slug]` into a pressure sheet with dark scenario header, opponent/focus/output summary, and a cleaner start block.
- Moved the mobile scenario start block higher in the detail page, after the pressure summary instead of after all long content.
- Updated `/scenarios` metadata to focus on working defenses and Roadmap / Budget Defense instead of generic meeting preparation.
- Fixed duplicate "перед встречей перед встречей" copy in fallback outputs.

Verification:

- TDD RED:
  - `scenarios-catalog.test.ts` initially failed because `FALLBACK_SCENARIO_SLUGS` did not include `roadmap-budget-defense`.
- Targeted GREEN:
  - `cd frontend && ./node_modules/.bin/tsc -p /tmp/peaktalk-scenarios-catalog-tsconfig.json && node /tmp/peaktalk-scenarios-catalog-test/lib/scenarios-catalog.test.js`
- Final checks:
  - `cd frontend && npm run lint` -> exit 0; existing 107 warnings remain in generated/public and unrelated files.
  - `cd frontend && npm run build` -> exit 0.
- Visual QA:
  - Playwright screenshots saved:
    - `/tmp/peaktalk-scenarios-desktop-1440.png`
    - `/tmp/peaktalk-scenarios-mobile-390.png`
    - `/tmp/peaktalk-scenario-roadmap-desktop-1440.png`
    - `/tmp/peaktalk-scenario-roadmap-mobile-390.png`
  - Checked `/scenarios` at 1440x1000 and 390x844: `overflowX=false`, Roadmap/Budget and Defense Brief text present.
  - Checked `/scenarios/roadmap-budget-defense` at 1440x1000 and 390x844: `overflowX=false`, Roadmap/Budget, Defense Brief, and start copy present.
  - Local console errors were limited to expected `localhost:8000` API connection failures while frontend fallback scenarios rendered.

Known residual risks:

- Browser QA used fallback scenario data because the local backend scenario API was not running.
- The real backend/API scenario catalog may still need seeded `roadmap-budget-defense` data if production should avoid relying on frontend fallback.
- This slice does not add analytics events for clicks inside the scenario catalog; current funnel analytics still start from landing/guest/billing events.

### 2026-06-15 - P1 scenario API parity and analytics slice

Scope:

- Backend scenario seed parity for `roadmap-budget-defense`.
- Scenario persona display and AI persona alias.
- Frontend scenario analytics event helper.
- Scenario catalog/detail analytics wiring.

Files changed:

- `backend/app/seeds/scenarios.py`
- `backend/app/routers/scenarios.py`
- `backend/app/services/simulation_ai.py`
- `backend/tests/test_scenarios.py`
- `frontend/src/lib/scenario-analytics.ts`
- `frontend/src/lib/scenario-analytics.test.ts`
- `frontend/src/app/scenarios/page.tsx`
- `frontend/src/app/scenarios/[slug]/page.tsx`
- `docs/peaktalk-implementation-log.md`

What changed:

- Added `roadmap-budget-defense` to backend seed data with roadmap category, `CEO/CFO` persona, difficulty `5`, Head of Product ICP context, hostile question framing, and Defense Brief outcome.
- Added `ceo_cfo` persona display label in scenario API.
- Added `ceo_cfo -> cfo` AI persona alias so authenticated `start-from-scenario` does not degrade to a generic audience persona.
- Added backend regression coverage proving the seeded scenario is available from `/scenarios/roadmap-budget-defense` and appears in `/scenarios?category=roadmap`.
- Added `scenario-analytics.ts` with centralized event names and payload normalization.
- Added typed frontend coverage for scenario analytics events and props.
- Wired scenario events:
  - `scenario_catalog_viewed`
  - `scenario_card_clicked`
  - `scenario_primary_cta_clicked`
  - `scenario_detail_viewed`
  - `scenario_start_clicked`
- Kept analytics as frontend Metrika goals only; no backend event warehouse or team analytics was added.

Verification:

- TDD RED:
  - `cd backend && pytest tests/test_scenarios.py -k roadmap_budget_defense` failed with `404` for `/scenarios/roadmap-budget-defense`.
  - frontend typed test failed because `frontend/src/lib/scenario-analytics.ts` did not exist.
- Targeted GREEN:
  - `cd backend && pytest tests/test_scenarios.py -k roadmap_budget_defense` -> 1 passed.
  - temporary frontend `tsc` + `node` run for `scenario-analytics.test.ts` -> passed.
- Final checks:
  - `cd backend && pytest tests/test_scenarios.py tests/test_simulation.py tests/test_billing.py` -> 34 passed.
  - temporary frontend `tsc` + `node` run for `scenarios-catalog.test.ts` and `scenario-analytics.test.ts` -> passed.
  - `cd frontend && npm run lint` -> exit 0; existing 107 warnings remain in generated/public and unrelated files.
  - `cd frontend && npm run build` -> exit 0.

Known residual risks:

- Real production seed execution still needs deploy/ops handling; this slice only updates seed data and tests.
- Scenario analytics are Metrika frontend goals. There is still no backend analytics table for anonymous scenario views/clicks, by design for validation sprint speed.
- Rich scenario fields such as FAQ/expected output are still frontend fallback-only; backend API currently exposes only list fields plus `situation`.

Next recommended:

1. If YooKassa test credentials and a reachable webhook URL are available, close the remaining P0 billing QA.
2. Close authenticated `/upload` QA when a real dev/test browser session is available.
3. Implement rerun on the same material as a narrow Meeting Defense Pack value improvement.

### 2026-06-16 - Status checkpoint: P0/P1 course correction

Scope:

- Reconcile current work against the original execution map.
- Clarify YooKassa status without overclaiming.
- Keep next work anchored to validation sprint priorities.

What is already done:

- P0 guest value before paywall is implemented: guest flow reaches 3 AI questions before the paywall.
- P0 paywall framing is implemented: it sells `Meeting Defense Pack` / `Defense Brief`, not abstract registration.
- P0 paid continuation guard is implemented: `/simulation/from-guest` requires a paid `session_credit`.
- P0 guest migration safety is implemented: expired guest sessions are rejected, retries are idempotent, and duplicate credit consumption is covered by tests.
- P0 funnel analytics events are wired for landing, guest, paywall, billing, payment start, and payment success.
- P0 trust/privacy copy is tightened near material input/upload without fake compliance claims.
- P1 Defense Brief copy/export is implemented.
- P1 Roadmap/Budget Defense scenario/catalog slice is implemented in frontend and backend seed data.
- P1 scenario analytics are wired for catalog/detail/start interactions.

What is not yet closed:

- Real YooKassa end-to-end QA is not complete. Existing checks cover backend billing/webhook logic with tests and local redirect behavior, but not provider checkout, success return, and real webhook delivery.
- Local `backend/.env` and shell environment currently do not expose `PAYMENTS_ENABLED`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, or `YOOKASSA_WEBHOOK_SECRET`.
- VDS read-only audit on 2026-06-16 confirmed production has `PAYMENTS_ENABLED`, `YOOKASSA_SHOP_ID`, and `YOOKASSA_SECRET_KEY` set in `/opt/peaktalk/backend/.env` and in the running API container. `YOOKASSA_WEBHOOK_SECRET` is missing from the file.
- VDS DB aggregate showed 12 `succeeded` payment records. This proves historical payment processing exists, but does not replace a fresh checkout -> success return -> webhook QA pass.
- Authenticated `/upload` browser QA is not complete because no real browser auth session/test credentials are currently active in the local workspace.

Next recommended:

1. If YooKassa test credentials are available, add them locally without committing secrets, start backend/frontend, expose webhook if needed, and run real checkout -> success return -> webhook confirmation. This closes the remaining P0 billing risk.
2. In parallel or immediately after, run authenticated `/upload` QA with a real dev/test account.
3. If payment credentials are still unavailable, continue P1 with rerun on the same material because it strengthens the Meeting Defense Pack value without changing billing/auth/credits.
4. Keep P2 deferred: team analytics, custom scenarios, integrations, enterprise admin, and heavier architecture cleanup remain out of scope until paid signals exist.

### 2026-06-16 - P1 example Defense Brief preview and VDS payment access audit

Scope:

- Read-only check whether the current machine can inspect VDS payment env presence.
- Add example Defense Brief preview before guest paywall payment.
- Keep billing/auth/credits untouched.

Files changed:

- `frontend/src/lib/example-defense-brief.ts`
- `frontend/src/lib/example-defense-brief.test.ts`
- `frontend/src/app/simulation/guest/page.tsx`
- `docs/peaktalk-implementation-log.md`

What changed:

- Found local SSH alias `peaktalk-vds`, but read-only SSH audit failed with `Permission denied (publickey,password)`.
- Did not change VDS, env, deploy scripts, billing code, webhook logic, credits, auth, or migrations.
- Added a typed example Defense Brief artifact for Roadmap/Budget Defense with explicit placeholder fields such as `[ваша ключевая метрика]`.
- Added a clear context note: this is a format example, not analysis of the user's material.
- Replaced the old paywall skeleton/locked list with a concrete example Defense Brief preview and a separate payment panel.
- Kept paywall CTA pointing to the existing `defensePackHref`; no payment routing behavior changed.

Verification:

- TDD RED:
  - temporary frontend `tsc` for `example-defense-brief.test.ts` failed with missing `./example-defense-brief.js`.
- Targeted GREEN:
  - temporary frontend `tsc` + `node` for `example-defense-brief.test.ts` -> passed.
- Final checks:
  - temporary frontend `tsc` + `node` for `example-defense-brief.test.ts` and `defense-brief-export.test.ts` -> passed.
  - `cd frontend && npm run lint` -> exit 0; existing 107 warnings remain in generated/public and unrelated files.
  - `cd frontend && npm run build` -> exit 0.
- Browser/Playwright QA:
  - Started local frontend at `http://localhost:3000`.
  - Mocked `/simulation/guest-start` and `/simulation/guest-message`.
  - Reached paywall after Q1/A1/Q2/A2/Q3/A3.
  - Checked desktop 1440x1000 and mobile 390x844.
  - Confirmed example preview label, format disclaimer, `Defense Pack — 299 ₽` CTA, roadmap/budget context, placeholder fields, no horizontal overflow, and no console/page errors.
  - Screenshots saved:
    - `/tmp/peaktalk-guest-paywall-preview-desktop-1440-settled.png`
    - `/tmp/peaktalk-guest-paywall-preview-mobile-390-settled.png`

Known residual risks:

- Real YooKassa checkout, success return, and webhook delivery remain unverified from this workspace. The project may still have working YooKassa env on VDS, but current SSH access did not allow read-only confirmation.
- Authenticated `/upload` browser QA remains open until a real dev/test browser session or credentials are available.
- Example preview improves conversion clarity but is not a substitute for real payment QA.

Next recommended:

1. Close real YooKassa P0 QA once VDS SSH access or local test credentials are available.
2. Close authenticated `/upload` QA.
3. Implement rerun on the same material as the next P1 product-value slice.

### 2026-06-16 - VDS YooKassa read-only audit

Scope:

- Verify production/VDS payment configuration status without changing server state.
- Do not print or store secrets.

Commands/areas checked:

- SSH to VDS as non-root app user.
- `/opt/peaktalk` app directory, git branch/head.
- `backend/.env` variable presence only.
- `docker compose ps`.
- running API container env presence only.
- public `/health`.
- recent API log count for YooKassa/billing-related lines.
- read-only aggregate count from `payments`.

Findings:

- App dir: `/opt/peaktalk`.
- Branch/head: `main` / `ba8f6a2`.
- Containers: `api`, `beat`, `frontend`, `nginx`, `postgres`, `redis`, `worker` are running; `api`, `nginx`, `postgres`, `redis` report healthy.
- Health checks: `https://peaktalk.ru/health` -> `200`; `http://82.202.138.247/health` -> `200`.
- Payment env presence in file/container:
  - `PAYMENTS_ENABLED=set`
  - `YOOKASSA_SHOP_ID=set`
  - `YOOKASSA_SECRET_KEY=set`
  - `YOOKASSA_SEND_RECEIPT=set`
  - tax/vat config present in file
  - `YOOKASSA_WEBHOOK_SECRET=missing`
- Recent 72h billing/YooKassa-related API log lines count: `15`.
- DB aggregate: `payments.status=succeeded` count is `12`.

Interpretation:

- YooKassa is configured on VDS and historical successful payments exist.
- Remaining P0 is not “add YooKassa credentials”; it is fresh payment QA: checkout -> return to `/billing/success` -> webhook/DB status confirmation -> guest continuation.
- Missing `YOOKASSA_WEBHOOK_SECRET` should be treated as a security/ops hardening item, but changing it requires coordination with YooKassa webhook settings and must not be done casually.

### 2026-06-16 - YooKassa dashboard screenshot follow-up

Finding:

- Merchant dashboard screenshot shows no HTTP notification URL configured.
- Correct public endpoint from current nginx/backend routing is `https://peaktalk.ru/webhooks/yookassa`.
- UI event names include `payment.succeeded`, `payment.waiting_for_capture`, `payment.canceled`, `payment_method.active`, and `refund.succeeded`.
- Pre-fix backend explicitly handled `payment.succeeded`, `payment.cancelled`, and `refund.succeeded`; YooKassa UI uses `payment.canceled`, so backend needed to accept both spellings before enabling cancellation event as a reliable status path.

Recommended dashboard setup:

- URL: `https://peaktalk.ru/webhooks/yookassa`
- Required event: `payment.succeeded`
- Useful event after backend normalization patch is deployed: `payment.canceled`
- Optional/log-only event: `refund.succeeded`
- Do not enable `payment.waiting_for_capture` unless manual capture is introduced.
- Do not enable `payment_method.active` unless backend handling is added.

Risk:

- Without configured HTTP notifications, future paid guest continuation can fail to receive `session_credit` after checkout even if the user returns to `/billing/success`.

### 2026-06-16 - YooKassa canceled event normalization

Scope:

- Fix the YooKassa dashboard event-name mismatch without changing billing amounts, credits, subscriptions, or checkout creation.
- Keep existing internal/legacy `payment.cancelled` handling working.

Root cause:

- YooKassa merchant dashboard exposes the cancellation event as `payment.canceled`.
- Backend dispatch only handled `payment.cancelled`, so official cancellation notifications were acknowledged with `200` but logged as unhandled and did not mark recurrent subscription failures as `past_due`.

Files changed:

- `backend/app/routers/webhooks.py`
- `backend/tests/test_billing.py`
- `docs/peaktalk-implementation-log.md`

What changed:

- `_resolve_yookassa_event_type` now normalizes official `payment.canceled` to the existing internal `payment.cancelled` branch.
- Billing webhook regression test now covers both `payment.canceled` and `payment.cancelled`.
- Webhook setup comments now name the YooKassa dashboard event as `payment.canceled`.

Verification:

- RED: `cd backend && pytest tests/test_billing.py::test_yookassa_recurrent_canceled_marks_active_subscription_past_due` failed because `payment.canceled` was unhandled and subscription stayed `active`.
- GREEN: same targeted test passed after normalization.
- `cd backend && pytest tests/test_billing.py` passed: 5 tests.

Residual risk:

- This is implemented locally, not deployed here.
- Before enabling `payment.canceled` as a production-reliable notification, run the deploy gate and verify production webhook delivery.

### 2026-06-16 - Google OAuth removal and auth direction update

Scope:

- Remove visible Google authorization entrypoints from auth pages.
- Keep current email/password Supabase Auth as a temporary bridge until the Logto replacement changeset.
- Record that preserving existing users is not a constraint at this stage.
- Add a later Supabase Storage/S3 architecture audit to the backlog.

Files changed:

- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/register/page.tsx`
- `frontend/src/app/onboarding/page.tsx`
- `docs/peaktalk-implementation-log.md`

What changed:

- Removed Google OAuth buttons and `signInWithOAuth({ provider: 'google' })` calls from login and registration pages.
- Removed the outdated onboarding comment that referenced OAuth users.
- Kept email/password registration and login untouched.
- Confirmed Logto remains the preferred auth replacement path; user migration can be low priority because there is no meaningful production user base yet.
- Added a future Supabase Storage/S3 audit item: decide whether uploaded meeting files should remain in object storage or whether extracted text plus metadata is enough for the validation product.

Verification:

- `rg -n "signInWithOAuth|provider: 'google'|Войти через Google|Зарегистрироваться через Google|Или продолжить через|OAuth users" frontend/src` returned no matches.
- `cd frontend && npm run lint` exited 0. Existing 107 warnings remain in generated/public and unrelated files.
- `cd frontend && npm run build` exited 0.
- Playwright visual check of `/login` and `/register` at 1440x1000 and 390x844:
  - no Google/OAuth text in body;
  - no horizontal overflow;
  - screenshots saved to `/tmp/peaktalk-auth-login-desktop.png`, `/tmp/peaktalk-auth-login-mobile.png`, `/tmp/peaktalk-auth-register-desktop.png`, `/tmp/peaktalk-auth-register-mobile.png`.

Residual risk:

- This is local only until deployed.
- Supabase Auth still powers email/password and confirmation emails; Logto migration remains a separate changeset.
- `next/font/google` remains in the app and was not changed because it is not Google authorization; review separately only if legal/compliance scope expands beyond auth.

### 2026-06-16 - P0 validation flow deploy

Scope:

- Deploy the P0/P1 validation-flow changes already implemented in this workstream.
- Include guest paywall/value changes, guest-to-paid safety, scenario wedge, Defense Brief artifacts, analytics, YooKassa `payment.canceled` normalization, and visible Google OAuth removal.
- Do not rotate secrets, change YooKassa env, configure merchant dashboard webhooks, or run destructive DB operations.

Commit:

- `aec87d3` — `Prepare P0 validation flow`
- GitHub Actions run: `27642510582`

Pre-deploy verification:

- `cd backend && pytest tests/` passed: 63 tests.
- `cd backend && alembic heads` returned single head: `0020_guest_migration_state`.
- `cd backend && alembic upgrade 0019_add_utm:0020_guest_migration_state --sql` rendered expected nullable columns, index, FK, and version update.
- `cd frontend && npm run lint` exited 0. Existing warnings remain in generated/public and unrelated files.
- `cd frontend && npm run build` exited 0.
- `git diff --cached --check` exited 0 before commit.
- Staged secret scan found no secret values; only textual status notes such as `YOOKASSA_SECRET_KEY=set`.

Deploy evidence:

- `git push origin main` deployed through GitHub Actions.
- GitHub Actions:
  - Detect Changes: success.
  - Backend Tests: success.
  - Frontend Changed-File Lint: success, with existing warnings for `returnUrl` dependency and unused `isHovered`.
  - Deploy to VDS: success.
- VDS `/opt/peaktalk` head: `aec87d3`.
- Production Alembic version: `0020_guest_migration_state`.
- `https://peaktalk.ru/health` returned `200`.
- Public routes returned `200`: `/login`, `/register`, `/scenarios`, `/simulation/guest`.
- Docker Compose after deploy:
  - `api`, `nginx`, `postgres`, `redis` healthy;
  - `frontend`, `worker`, `beat` running.
- Recent production log scan found 0 lines matching `[ERROR]`, `[CRITICAL]`, `Traceback`, `Exception`, `Unhandled`, or `failed`.

Production UI verification:

- Playwright checked `/login` and `/register` at 1440x1000 and 390x844.
- No Google/OAuth text found in page body.
- No horizontal overflow found.
- Screenshots saved:
  - `/tmp/peaktalk-prod-auth-login-desktop.png`
  - `/tmp/peaktalk-prod-auth-login-mobile.png`
  - `/tmp/peaktalk-prod-auth-register-desktop.png`
  - `/tmp/peaktalk-prod-auth-register-mobile.png`

Residual risk:

- YooKassa merchant dashboard still needs HTTP notification URL configuration: `https://peaktalk.ru/webhooks/yookassa`.
- Real payment e2e remains open: guest paywall -> YooKassa checkout -> return -> webhook -> DB/payment credit -> guest continuation.
- Auth still uses Supabase email/password as a temporary bridge; Logto replacement requires the documented research gate first.
- Existing GitHub Actions warnings about Node 20 deprecation should be cleaned up before they become hard failures.
- Frontend lint warnings for `returnUrl` and `isHovered` should be removed in a small cleanup changeset.

### 2026-06-16 - P1 same-material rerun slice

Scope:

- Add a narrow same-material rerun path for completed paid Defense Pack sessions.
- Keep billing, YooKassa, auth, migrations, subscriptions, and document storage untouched.
- Remove playful confetti from the report surface.
- Keep Logto as a future auth migration gate, not part of this changeset.

Files changed:

- `backend/app/schemas/simulation.py`
- `backend/app/routers/simulation.py`
- `backend/tests/test_simulation.py`
- `frontend/src/app/(dashboard)/simulation/[id]/report/page.tsx`
- `docs/peaktalk-implementation-log.md`

What changed:

- Added `POST /simulation/{session_id}/rerun`.
- Rerun is available only for a completed source session with `persona_config.paid_access = true`.
- Rerun copies the original `document_id`/`draft_id` and persona config, generates a fresh first hostile question, and creates a new `active` simulation.
- Rerun does not call `consume_session_credit()` or `increment_simulation_counter()`.
- Rerun is one-time and idempotent: the source session stores `rerun_session_id`; repeated clicks return the existing rerun session.
- Rerun chaining is blocked via `rerun_source_session_id`, so a rerun cannot become an infinite free loop.
- Paid report page action now has a primary `Повторить по тем же материалам` button and a secondary `Новая сессия` button; free reports do not show the paid-only rerun action.
- Added frontend event `defense_rerun_started` with source and rerun session ids.
- Removed the report confetti animation on high scores.

Verification:

- TDD RED:
  - `cd backend && pytest tests/test_simulation.py -k "rerun_paid_session or rerun_free_session"` failed with `404` because `/simulation/{id}/rerun` did not exist.
- Targeted GREEN:
  - `cd backend && pytest tests/test_simulation.py -k "rerun_paid_session or rerun_free_session"` passed: 2 tests.
- Wider checks:
  - `cd backend && pytest tests/test_simulation.py tests/test_billing.py` passed: 32 tests.
  - `cd backend && pytest tests/` passed: 65 tests.
  - `cd frontend && npm run lint` exited 0. Existing 107 warnings remain in generated/public and unrelated files.
  - `cd frontend && npm run build` exited 0.

Known residual risks:

- Authenticated visual QA of the real `/simulation/{id}/report` route still needs a real Supabase browser session or test credentials; middleware redirects unauthenticated browsers to login.
- The complimentary rerun count is intentionally one per paid source session. More reruns require a pricing/product decision.
- Real YooKassa e2e and authenticated `/upload` QA remain open P0 gates.
- Logto migration remains separate: before any code changes, study current official Logto docs and select the best modern deployment/integration path for PeakTalk.

Deploy evidence:

- Commit deployed: `2717d1c` — `Add paid session rerun`.
- GitHub Actions run: `27643606062`.
- GitHub Actions result:
  - Detect Changes: success.
  - Frontend Changed-File Lint: success.
  - Backend Tests: success.
  - Deploy to VDS: success.
- Production public checks:
  - `https://peaktalk.ru/health` returned `200` with `{"status":"ok","service":"peaktalk-api"}`.
  - `/login`, `/register`, `/scenarios`, and `/simulation/guest` returned `200`.
- VDS verification:
  - `/opt/peaktalk` head is `2717d1c`.
  - Alembic current version is `0020_guest_migration_state (head)`.
  - Docker Compose: `api`, `nginx`, `postgres`, and `redis` healthy; `frontend`, `worker`, and `beat` running.
  - Fresh production log scan over `api`, `frontend`, `worker`, `beat`, and `nginx` found `recent_error_lines=0`.
- Workflow warning remains: GitHub Actions dependencies still emit Node.js 20 deprecation warnings and should be updated in a small CI maintenance changeset.

### 2026-06-16 - CI and lint cleanup before next P0 gates

Scope:

- Keep the implementation log aligned with the plan before continuing.
- Park the user's 10 startup-marketing theses as a late GTM review item after critical P0 payment/auth/upload gates, not as immediate product scope.
- Remove the two project-source frontend lint warnings called out by the previous deploy.
- Opt the GitHub Actions workflow into Node 24 execution for JavaScript actions to address the current Node 20 deprecation warning path.

Files changed:

- `.github/workflows/deploy.yml`
- `frontend/src/app/onboarding/page.tsx`
- `frontend/src/app/(dashboard)/analysis/[id]/page.tsx`
- `docs/peaktalk-implementation-log.md`

What changed:

- Added a late GTM parking-lot note:
  - use the useful parts of the marketing theses for validation sprint discipline, founder-led CustDev, unit economics, scenario-intent SEO, real social proof, content/outbound, partnerships, and channel mix;
  - reject/adapt broad acquisition, generic public-speaking SEO, invented testimonials, playful gamification, dumping, loud gimmicks, and premature push mechanics.
- Added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` at workflow level.
- Fixed the onboarding `returnUrl` effect dependency.
- Removed unused hover state/props from the analysis annotation text path. This does not remove the card hover UI; it removes only dead state that no longer drove visible behavior.

Verification:

- `cd frontend && npm run lint` exited 0. Existing warnings are now 105 and remain in generated/public and unrelated files.
- `cd frontend && npm run build` exited 0.
- `git diff --check` exited 0.
- `cd backend && alembic heads` returned single head: `0020_guest_migration_state (head)`.

Deploy evidence:

- Commit deployed: `00b432a` — `Clean up CI and lint warnings`.
- GitHub Actions run: `27644666126`.
- GitHub Actions result:
  - Detect Changes: success.
  - Backend Tests: success.
  - Frontend Changed-File Lint: success.
  - Deploy to VDS: success.
- Node 24 opt-in result: the workflow still emits a deprecation annotation, but the annotation now says affected JavaScript actions are being forced to run on Node 24. This removes the immediate runtime risk but does not remove the visible warning until upstream actions fully retarget away from Node 20.
- Production public checks:
  - `https://peaktalk.ru/health` returned `200` with `{"status":"ok","service":"peaktalk-api"}`.
  - `/login`, `/register`, `/scenarios`, and `/simulation/guest` returned `200`.
- VDS verification:
  - `/opt/peaktalk` head is `00b432a`.
  - Alembic current version is `0020_guest_migration_state (head)`.
  - Docker Compose: `api`, `nginx`, `postgres`, and `redis` healthy; `frontend`, `worker`, and `beat` running.
  - Fresh production log scan over `api`, `frontend`, `worker`, `beat`, and `nginx` found `recent_error_lines=0`.

Residual risk:

- Open P0 remains unchanged: real YooKassa e2e, YooKassa dashboard webhook configuration, authenticated `/upload` QA, and Logto research gate.

### 2026-06-16 - Logto migration research gate

Scope:

- Study current official Logto/Yandex docs before any auth migration code.
- Check current VDS capacity before proposing self-hosted auth.
- Map current PeakTalk Supabase Auth coupling across frontend/backend.
- Produce a narrow migration gate document, not a code changeset.

Files changed:

- `docs/logto-migration-gate-2026-06-16.md`
- `docs/peaktalk-implementation-log.md`

What changed:

- Created the Logto gate doc with recommended topology, SMTP plan, Yandex ID path, affected code map, required data model change, migration sequence, and verification matrix.
- Confirmed current VDS is not appropriate for Logto as-is:
  - 2 vCPU;
  - 3.8 GiB RAM total, no swap;
  - 30 GiB disk, 5.2 GiB free, 82% used.
- Compared this with Logto OSS docs, which list 2 vCPU, 8 GiB RAM, and 256 GiB disk as minimum recommended hosting resources.
- Identified a critical data-model issue: `users.id` currently matches Supabase Auth `sub` and is UUID, while Logto `sub` should be treated as an external string subject. Migration should add `auth_provider/auth_subject` and keep local `users.id` as the stable UUID for billing, documents, simulations, and payments.
- Confirmed Logto supports:
  - Next.js App Router SDK (`@logto/next`);
  - FastAPI JWT validation through OIDC/JWKS;
  - SMTP and HTTP email connectors;
  - generic OAuth 2.0 social connector, making Yandex ID feasible as a later connector spike.

Verification:

- Official docs checked:
  - Logto OSS get started/deployment/configuration.
  - Logto Next.js App Router.
  - Logto FastAPI API protection and access token validation.
  - Logto SMTP/HTTP email connectors.
  - Logto OAuth 2.0 connector.
  - Yandex ID OAuth docs.
- Repo search checked current Supabase Auth coupling in `frontend/src`, `backend/app`, env examples, Docker, and workflow files.
- VDS resource check completed read-only over SSH.

Next:

- Do not start Logto implementation on current VDS without infra decision.
- Keep P0 order: close YooKassa dashboard/e2e and authenticated upload QA first, then provision/upgrade auth infra and implement Logto behind a feature-gated branch.

### 2026-06-16 - Timeweb auth host note and P0 priority correction

Scope:

- Incorporate the user's new Timeweb Cloud-80 server input.
- Incorporate the user's explicit permission to reset/delete the existing auth/users state if that leads to a better auth architecture.
- Correct execution priority back to P0 YooKassa/payment before Logto implementation.

Files changed:

- `docs/logto-migration-gate-2026-06-16.md`
- `docs/peaktalk-implementation-log.md`

What changed:

- Updated the Logto gate: the separate Timeweb Cloud-80 RU server is now the preferred Logto host candidate.
- Captured available Timeweb capacity from the user's screenshot: 4 x 3.3 GHz CPU, 8 GiB RAM, 80 GiB NVMe.
- Noted the tradeoff: CPU/RAM are suitable for validation; 80 GiB disk is below Logto's 256 GiB recommendation, so backups/log retention must be controlled.
- Captured the destructive-auth stance: existing Supabase auth/users can be reset because there is no meaningful production user base.
- Kept the architecture quality bar: even with destructive reset allowed, PeakTalk should keep a local UUID `users.id` and map external auth subjects separately for billing, documents, simulations, guest-to-paid conversion, and future Yandex ID.
- Stopped the auth implementation detour before commit/deploy. Do not mix Logto/auth schema work into the YooKassa P0 changeset.

Next:

- Return to P0 step 1: configure YooKassa HTTP notifications in the merchant dashboard and run real payment e2e.
- User action needed in YooKassa dashboard: add notification URL `https://peaktalk.ru/webhooks/yookassa`, select `payment.succeeded` and `payment.canceled`, optionally `refund.succeeded`, then save.
- Do not select `payment.waiting_for_capture` or `payment_method.active` unless backend handling is intentionally added.
