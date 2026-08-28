# 0018 — Self-hosted Better Auth Admin dashboard

Status: accepted for implementation; bootstrap identity approved out-of-band
Date: 2026-08-13

## Decision

PeakTalk will use the official Better Auth Admin plugin as the authorization
source for the private admin surface, while keeping the dashboard and all admin
data inside PeakTalk. The implementation must use `admin()` from
`better-auth/plugins` on the server and the corresponding Better Auth admin
client plugin in the frontend. Better Auth Infrastructure `dash()` and any
external admin SaaS/data transfer are explicitly out of scope.

The dashboard will be server-authorized. A frontend guard is only a navigation
convenience: every admin read and mutation must check the Better Auth session
and the Admin plugin role on the server and return a denial without loading
admin data for non-admin callers.

## Options considered

### A. Keep the current email allow-list guard and extend the existing pages

This is the smallest code change, but it duplicates identity/role state outside
Better Auth, cannot provide the Admin plugin's session and ban semantics, and
keeps role changes and auditability ad hoc. It is rejected for this task.

### B. Use Better Auth Admin plugin plus a PeakTalk-owned dashboard and API

This gives one auth role/session/ban control plane, keeps sensitive data
self-hosted, and supports the requested server-side negative tests. It requires
a schema migration, explicit bootstrap handling, and a rollback plan. This is
the recommended option.

### C. Use Better Auth Infrastructure `dash()`

This could reduce UI work, but it violates the self-hosting boundary, creates an
external data-transfer and availability dependency, and provides no acceptable
reason to expose PeakTalk user data outside the product. It is rejected.

## Fixed scope and allowed actions

The private routes are `/admin` and `/admin/users`. The dashboard supports:

- searching and paginating users;
- viewing email, verification state, role, ban state, and active sessions;
- revoking one session or all sessions for a user;
- changing a role only after explicit confirmation;
- banning or unbanning only with a required reason and explicit confirmation;
- an audit log for every administrative action.

Impersonation, deleting users, changing another user's password,
Organizations, SSO, SCIM, and Better Auth Infrastructure are disabled/non-goals.
The existing PeakTalk visual system remains the UI boundary; the surface should
be calm and operational rather than an "AI dashboard".

## Bootstrap admin and unresolved gate

The first admin is assigned exactly once by a bootstrap operation that accepts a
specific identity from a protected runtime/VDS environment variable or from an
explicit user-approved identity. The operation must:

1. fail closed when the identity is missing or ambiguous;
2. normalize and match the verified Better Auth user without guessing by email;
3. be idempotent when repeated for the same identity;
4. refuse to silently replace an already assigned first admin; and
5. be removable after the first admin is assigned.

No bootstrap email, password, token, or secret may be committed to Git or
printed in logs/evidence. The user has now explicitly approved the concrete
first-admin identity out-of-band. Its value is intentionally omitted from this
Git-tracked decision and must be supplied only through a protected runtime
variable when the one-time bootstrap operation is executed. The implementation
must fail closed if that variable is absent, ambiguous, or does not match a
verified Better Auth user.

## Audit trail requirements

Every successful or rejected administrative mutation must record a durable,
append-only audit event with actor, target, action, timestamp, outcome, and safe
metadata. Metadata is allowlisted and must not contain cookies, session tokens,
passwords, SMTP values, secrets, raw request headers, or unnecessary PII.
Audit writes must be authorized server-side and must not be bypassed by a
client-only route or forged session.

## Migration and rollback

The Better Auth Admin schema must be generated from the pinned Better Auth
version, reviewed against the existing core Better Auth schema, and added as a
separate Alembic migration with a reversible downgrade. The upgrade must be
validated on a clean database and against an upgrade path from the current
schema. Rollback means stopping the release, restoring the database backup if
the migration has made incompatible state changes, reverting the application
to the prior commit, and applying the reviewed downgrade only when it is safe
for the actual deployed state. No production migration or deploy is authorized
by this decision.

## Consequences and non-goals

- The current email-list admin guard is not sufficient as the final RBAC model
  and must not remain the only enforcement point.
- Logto containers and legacy auth data are not removed by this change.
- Production/VDS access, environment mutation, Git push, and deploy require a
  separate explicit target approval.
- Completion requires real session-flow evidence; mocked session responses are
  insufficient for the revocation E2E.
