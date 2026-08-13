# Decision 0023: Repair admin user detail authorization and restore the historical hero type

Date: 2026-08-13
Status: accepted for implementation; production release requires approval of the exact new commit

## Diagnosis

The admin user list and user detail use the same server-side `require_admin` guard, but the detail endpoint makes an additional Better Auth Admin request: `admin/list-user-sessions` is a cookie-authenticated `POST`. A browser navigation/query to the detail API is a `GET` and commonly has neither `Origin` nor `Referer`. The backend forwarded the missing origin to Better Auth, whose CSRF protection rejected the internal `POST` with `403`. The UI then reduced that backend response to “Недостаточно прав для просмотра пользователя.” Existing detail tests mocked the Better Auth client and therefore did not assert the real origin header contract.

The typography regression is also explicit in git history. Commit `32be02d` used the local `Unbounded` display font through `font-display`, `font-black`, `34/56/58/64px`, and `line-height: 1.03` for the main hero. The current implementation changed that treatment to `font-bold`, `30/42/48/52px`, tighter tracking, and forced line breaks. The local font files are already deterministic and correct; the regression is the component treatment, not a reason to substitute a system font.

## Decision

1. Keep the outer FastAPI `require_admin` guard and Better Auth session validation unchanged.
2. For internal Better Auth Admin calls, forward a browser `Origin` when it is present. If a read-only outer request has no browser origin, use the configured, allowlisted PeakTalk frontend origin (`frontend_url`) as the server-side origin of the internal read. Do not use this fallback for state-changing outer requests.
3. Add regression coverage that asserts the detail request supplies the configured trusted origin and continues to redact session tokens, while retaining signed-out and ordinary-user negative cases.
4. Restore the historical hero class and natural wrapping from `32be02d`; keep only the existing width/overflow safeguards needed for responsive rendering. Do not change the local font files or replace them with Arial/system fonts.

## Alternatives rejected

- Removing the Better Auth Admin request or weakening the frontend-only guard would make the detail data easier to bypass.
- Returning detail data directly from an unscoped database query would duplicate Better Auth ownership and expand the migration surface.
- Always falling back to `frontend_url`, including for mutations, could mask a missing CSRF origin. The fallback is therefore limited to read-only outer requests.
- Replacing `Unbounded` with a system font would hide CI/runtime loading concerns while changing the PeakTalk visual identity.

## Access and safety rules

- Signed-out requests remain `401`; verified ordinary users remain `403`; forged sessions remain `401`.
- Session tokens, cookies, passwords, secrets, and credentials never enter an admin response or audit metadata.
- No organizations, SSO, SCIM, impersonation, deletion, password changes, migrations, or environment changes are included.

## Rollback plan

The release is a single fast-forward commit with no schema or environment changes. If health, login, admin list, or user detail regresses after deployment, redeploy the previous production commit `3261b702a9d6ef8c2987c749f288b3097fb135fa` through the existing GitHub Actions workflow. The rollback trigger is any new 5xx on health/login/admin routes, a renewed admin detail 403 for an authorized admin, or a typography regression visible on the homepage/auth/admin surfaces.

## Acceptance criteria

- An authorized admin can load a user detail page, its active sessions, and per-user audit history.
- The detail API remains server-authorized and has negative coverage for signed-out, ordinary-user, and forged-session requests.
- The hero uses the historical local `Unbounded`/`font-black` treatment and the restored size/line-height scale without horizontal overflow.
- Backend, frontend, security, build, audit, harness, and production health evidence is fresh before release handoff.
