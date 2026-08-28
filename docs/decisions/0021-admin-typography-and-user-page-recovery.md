# 0021: PeakTalk typography and admin user page recovery

Status: accepted for local implementation; production execution remains separately gated
Date: 2026-08-13

## Problem

PeakTalk currently shows raw Better Auth error text in the main login and
registration flows. The admin users screen opens a fragile inline detail card,
so a failed detail request becomes a generic card error and the operator loses
the list context. The current admin presentation also uses decorative section
labels, a dense collection of bordered panels, and oversized display treatment
that make routine work harder to scan.

The historical type system is known from the pre-198907f layout: IBM Plex Sans
for body and normal headings, Unbounded for the brand and deliberately selected
display text, and JetBrains Mono for technical labels. The local font files are
the deterministic delivery mechanism, but their application must preserve the
historical role of each family and the earlier scale.

## Options considered

1. Patch only the visible error string and keep the inline user card. This is
   the smallest change, but it keeps the broken navigation and makes future
   detail errors difficult to diagnose.
2. Keep the existing routes and backend contract, move detail to
   `/admin/users/[userId]`, simplify the list around search and table scanning,
   centralize auth error translation, and restore the historical font roles and
   scale. This changes the UI structure while keeping the server authorization
   boundary and existing action endpoints stable.
3. Replace the console with a third-party admin design system or external
   Better Auth console. This adds dependency and data-transfer risk and is
   outside the self-hosted PeakTalk boundary.

## Decision

Choose option 2.

- `/admin/users` is the list and `/admin/users/[userId]` is the user record.
  The list navigates with normal links so browser history, reload, deep links,
  keyboard navigation, and mobile navigation work without a drawer state.
- The user page reads the existing server endpoint and exposes only the current
  operational fields: email, verification, role, ban state, activity, active
  sessions, per-session revoke, revoke-all, and audit history.
- Existing mutations keep confirmation, pending protection, clear success and
  error feedback, server-side admin checks, and audit writes. No frontend guard
  is treated as authorization.
- Authentication errors are translated in one small client-side boundary. Known
  provider messages get plain Russian copy; unknown messages use a safe generic
  Russian fallback and never expose secrets, cookies, tokens, or credentials.
- The historical font roles are explicit: IBM Plex Sans is the default body and
  UI family, Unbounded is limited to the wordmark and intentional display
  utilities, and JetBrains Mono is limited to technical metadata. The local
  files remain self-hosted and no Arial or system-only workaround is introduced.
- The admin visual language is calm and operational: one warm paper surface,
  one accent, modest headings, sparse dividers, restrained controls, and no
  decorative gradients, fake metrics, numbered eyebrows, or AI-dashboard copy.

## Allowed and prohibited operations

Allowed: read the real user inventory and user detail; change an allowed role;
ban or unban with a reason; revoke one session; revoke all sessions; inspect
safe audit records.

Prohibited: user deletion, password changes, impersonation, Organizations, SSO,
SCIM, secret or cookie display, session-token display, SMTP or database
configuration, and arbitrary security-setting edits.

## Rollback and release boundary

Rollback is an application rollback to the last verified commit before this
decision. This local change includes no schema migration, environment change,
production push, or deploy. If the backend contract requires a schema change,
stop and open a separate migration decision. Production execution requires
separate approval for the exact new commit.

## Acceptance criteria

1. Historical typography is visible on homepage, auth, onboarding, and admin:
   IBM Plex Sans is the normal UI family, Unbounded is not used as a blanket
   heading font, and the previous scale and density are restored.
2. Main auth pages show Russian messages for invalid credentials, verification,
   duplicate email, rate limits, password rules, and unknown failures.
3. The users list has real search, sorting, pagination, count, loading, empty,
   error, retry, long-email wrapping, keyboard access, and no horizontal page
   overflow.
4. A user opens at `/admin/users/[userId]`, and the page loads real detail data
   or exposes the backend error with a retry action.
5. Role change, ban or unban, single-session revoke, and revoke-all retain
   confirmation, pending state, success feedback, error feedback, server RBAC,
   and audit behavior.
6. Fresh targeted tests, frontend lint/typecheck/build, relevant security and
   harness checks, and `git diff --check` are recorded. No production action is
   taken in this iteration.

## Non-goals

No production deployment, production migration, environment mutation, external
admin SaaS, mock session flow, fake data, marketing redesign, or new auth
feature is part of this decision.
