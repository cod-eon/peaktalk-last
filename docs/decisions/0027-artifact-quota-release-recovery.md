# Artifact quota release recovery

Status: accepted for this release

Date: 2026-08-27

Approved by: product owner in the task authorizing a fresh push and manual
production deployment if GitHub Actions remains blocked

## Context

PeakTalk release commit `c3a1fdbb9da99c919a537d1a472551f98d167417`
passed harness, backend, frontend, dependency, Compose, image-build, and checksum
gates. GitHub Actions attempts 1–3 failed only when `actions/upload-artifact`
rejected the release archive because account artifact storage had not yet been
recalculated. The VDS deploy job was skipped each time.

Twenty-two artifacts already marked expired were deleted with explicit user
approval. Active rollback artifacts were not deleted.

## Decision

1. Create a fresh commit containing only this recovery decision and push it to
   `main`. This produces a new GitHub Actions run after artifact cleanup.
2. Prefer the normal immutable-artifact workflow. If upload and automatic deploy
   succeed, do not perform any manual production action.
3. If the new run again fails only because of artifact quota, the product owner
   authorizes a manual deployment of the exact new commit.
4. Manual deployment may proceed only through the existing `deploy.sh` safety
   contract: exact commit/image identity, preserved production env and TLS,
   pre-deploy database backup, previous image availability, Nginx validation,
   migrations command, local health verification, and automatic runtime rollback.
5. If the available SSH identity cannot satisfy those existing preconditions,
   stop rather than bypassing them.

## Non-goals

- No application-code, workflow, infrastructure, secret, database-schema, Auth,
  Storage, billing-contract, or migration change.
- No direct replacement of containers without backup and rollback.
- No editing or exposing production environment values.
- No deletion of active GitHub artifacts without separate explicit approval.

## Verification

- The release SHA on `origin/main` matches the deployed image tag and recorded
  deploy state.
- `https://peaktalk.ru/health` returns success.
- The public landing returns 200, shows the restored version 11 design and the
  one-time price `990 ₽`, and no longer presents `299 ₽` as current pricing.
- Desktop and mobile smoke checks show no broken landing assets or horizontal
  overflow.

## Rollback

The existing deploy script must retain the previous runtime tag and invoke its
automatic rollback if health fails. A post-deploy regression is rolled back to
the previous recorded images, followed by the same public health and landing
checks. This recovery adds no database migration, so no schema rollback is
required.
