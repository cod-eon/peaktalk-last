# 0020 — Self-hosted admin console recovery and operations

Status: accepted for local implementation; production execution remains separately gated
Date: 2026-08-13

## Problem and affected user

The PeakTalk operator currently has a visually unstable private admin surface
and cannot reliably inspect or change access state. The recent admin rewrite
split the product-statistics API (`/admin/stats`) from the Better Auth control
API (`/admin/control`), while the browser does not expose the auth inventory
needed for operations. User list/detail failures are therefore hard to
diagnose, and action errors are reduced to generic copy.

The last font change also removed the deterministic `next/font` bindings for
IBM Plex Sans, Unbounded, and JetBrains Mono. The CSS variables now name fonts
that are not shipped by the browser and fall through to system fonts, changing
the typography across the product, including admin.

## Options considered

1. Keep the current pages and patch individual loaders and error messages.
   This is the smallest diff, but preserves the split API contract, lacks
   auth operations and real aggregate data, and cannot make the failure modes
   observable.
2. Build a PeakTalk-owned operational console over one server-authorized
   `/admin/control` contract, with `/admin`, `/admin/users`, and `/admin/auth`
   as separate views. Restore the previous font files deterministically and
   cover the flow with real-session and negative RBAC tests. This has the
   largest local implementation scope, but keeps sensitive data inside
   PeakTalk and gives operators one coherent contract.
3. Use Better Auth Infrastructure `dash()` or another external admin SaaS.
   This would reduce UI work, but violates the self-hosted boundary, creates
   an external data-transfer dependency, and does not provide acceptable
   control over PeakTalk audit and redaction rules.

## Decision

Choose option 2.

- The browser calls only PeakTalk routes. FastAPI remains the resource and
  authorization boundary, forwarding only the incoming Better Auth cookie to
  the private Better Auth handler. No session token is returned to the UI.
- The server contract is consolidated under `/admin/control` and includes
  overview metrics, auth metrics, paginated/searchable/sortable users, user
  detail, sessions, and allowlisted audit events. Legacy billing/marketing
  admin routes remain outside this console and are not used by the new UI.
- `/admin` is a calm operational overview with real counts for users,
  registrations over 24 hours/7 days/30 days, verified/unverified users,
  active sessions, banned users, role distribution, recent audit events, and
  auth errors where an authoritative source exists. Empty data is shown as
  empty, never as fabricated numbers or decorative charts.
- `/admin/auth` is a read-only access and Better Auth status surface: auth
  provider/runtime status, registration and verification counts, active
  sessions, banned users, role distribution, recent role/revoke/ban events,
  and safe configuration flags. It never renders secrets, cookies, session
  tokens, passwords, SMTP values, database URLs, private keys, or unnecessary
  full PII.
- `/admin/users` supports query, pagination, count, sorting, responsive
  table/detail drawer, keyboard/focus/ARIA behavior, long-email wrapping,
  loading/empty/error/retry states, session revoke, role change, and
  reasoned ban/unban. Mutations are pending-safe, explicitly confirmed,
  server-authorized, and append an audit event on success or rejection.
- The admin guard is navigation-only. Every read and mutation performs the
  Better Auth session and admin-role check server-side. Signed-out, forged, or
  invalid sessions receive 401; authenticated non-admins receive 403.
- The exact pre-regression PeakTalk font system is restored from the git
  history: IBM Plex Sans for body/headings, Unbounded for the brand/display
  utility, and JetBrains Mono for mono labels. Font files are shipped locally
  so CI does not change the visual result. The old sizes, weights,
  line-heights, and density remain the baseline; admin gets restrained scale,
  not oversized display headings.

## Allowed and prohibited operations

Allowed: read operational/auth inventory; revoke one session or all sessions;
change `admin`/`user` role with confirmation; ban/unban with a reason and
confirmation; inspect safe audit records.

Prohibited: Organizations, SSO, SCIM, impersonation, user deletion, changing
another user's password, secret/cookie/token/password/credential exposure,
editing Better Auth secret or database configuration, and arbitrary runtime
security settings. Any future dangerous setting requires a separate decision
with server enforcement, confirmation, audit, and rollback.

## Migration and environment review

No database schema migration, Better Auth provider migration, production
configuration change, or env change is part of this local release. The
existing `0024_add_better_auth_admin` schema is treated as the current
runtime boundary. If implementation discovers a missing durable field, stop
and open a separate migration gate; do not silently add a migration.

## Rollback plan

Rollback is an application rollback to the last verified commit before this
decision. No production data is deleted and no Better Auth tables are removed.
If a future release ever adds a schema migration, the migration must be
reviewed and backed up separately before production execution. Production
deploy, push, backup execution, and env mutation require explicit approval for
the exact new commit.

## Acceptance criteria

1. Real Better Auth admin session can open `/admin`, `/admin/users`, and
   `/admin/auth`; users and user detail load from real backend data.
2. API contract tests cover path, method, query/body schema, cookie forwarding,
   response redaction, 401/403 cases, mutations, and audit persistence.
3. Browser tests cover desktop/mobile, loading/empty/error/retry,
   long-email/no-overflow, keyboard navigation, detail, role change, ban,
   unban, one-session revoke, all-session revoke, and audit visibility.
4. The mandatory production-like E2E uses a real admin session to revoke a
   test session and proves that session is rejected afterward; an ordinary
   user cannot read admin data.
5. Homepage, auth, onboarding, and admin render the historical PeakTalk font
   stack and density in visual checks; no Arial/system-only workaround is
   accepted.
6. Fresh evidence exists for backend tests, frontend lint/typecheck/build,
   npm audit, pip-audit, migration review, negative RBAC, browser checks,
   harness checks, CodeGraph health (or documented recovery evidence), and
   `git diff --check`.

## Non-goals

Deploy, production push, production migration, production env changes,
Better Auth/Storage migration, external SaaS admin, fake data, mock-only
session flow, marketing dashboard charts, billing-plan mutation, and the
previously prohibited auth features are outside this task.
