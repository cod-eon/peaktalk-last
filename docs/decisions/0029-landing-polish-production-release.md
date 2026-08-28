# Landing polish production release

Status: accepted

Date: 2026-08-28

Approved by: product owner in the task confirming the proposed landing and explicitly requesting push and production deployment

## Problem and affected user

The approved homepage polish was implemented from commit `7c533af`, while the
current `main` branch contains 40 later commits with Better Auth, Next.js 16.3,
canonical 990 RUB pricing, and hardened production deployment. Deploying the
feature snapshot directly would remove those later changes. Visitors need the
approved decision-defense homepage without a regression in authentication,
billing, or the production release path.

## Options considered

1. Deploy the feature snapshot without integrating current `main`. This is
   rejected because it would revert production application and infrastructure
   changes.
2. Integrate current `main`, preserve its auth, billing, pricing, and deployment
   behavior, re-run the complete release gate, open a pull request, then merge
   and let the existing `main` workflow deploy the exact merged commit. This is
   the selected option.
3. Dispatch a production deployment from the reconciled feature branch before
   merge. The workflow supports it, but production would temporarily be ahead
   of `main`, and a later `main` release could revert the landing. This is
   rejected for normal release flow.

## Decision

- Reconcile the landing branch with current `origin/main` before any external
  release action.
- Keep the approved homepage composition, motion, accessibility behavior,
  routes, and analytics contract.
- Preserve the accepted one-time Defense Brief price of 990 RUB everywhere,
  including metadata and structured data, as defined by decision 0026.
- Do not change auth, billing implementation, backend APIs, database schema,
  migrations, storage, or deployment workflow behavior.
- Push the reconciled feature branch, create a pull request, merge only after
  required checks pass, and use the existing `main` release workflow for
  production.

## Success criteria

- The feature branch contains current `origin/main` and no unresolved merge
  conflict.
- Landing contract, lint, typecheck, production build, desktop and mobile UI
  checks, auth negative checks, and release preflight pass on the reconciled
  tree.
- No active landing or structured data advertises 299 RUB.
- The pull request is merged only with green required checks.
- The production workflow activates the merged SHA, public `/health` is green,
  and `/`, `/login`, `/register`, `/scenarios`, `/simulation/guest`, and
  `/billing` pass smoke checks.

## Release and rollback

The existing GitHub Actions release builds immutable images, creates a database
backup, runs the migration check, activates the exact SHA on the VDS, and can
restore the previous runtime images when health fails. This landing change adds
no migration, so no data rollback is required.

If the post-deploy landing, auth entry, billing entry, or health smoke fails,
re-run the last successful release for the previous `main` SHA or revert the
merge commit and let the same workflow deploy that revert. Do not perform a
manual frontend-only container replacement because it would break the release
manifest and drift from the supported deployment path.
