# One-time Defense Brief price: 990 RUB

Status: accepted

Date: 2026-08-27

Approved by: product owner in the task authorizing the 990 RUB price and production deployment

## Problem and affected user

PeakTalk currently advertises and charges 299 RUB for a one-time `per_session`
Defense Brief. The product owner has changed that price to 990 RUB. A partial
copy-only update would be unsafe: users could see one price while YooKassa
receives another amount, or different entry points could disagree.

The affected users are guests and signed-in users who buy one Defense Brief
without a subscription.

## Options considered

1. Keep 299 RUB. This avoids a release but contradicts the approved commercial
   decision.
2. Set one canonical one-time price of 990 RUB everywhere. This keeps the
   existing billing model and aligns checkout, plan metadata, paywalls,
   structured data, and visible UI. This is the selected option.
3. Introduce dynamic pricing, discounts, or a new tier. This would broaden the
   billing contract, require additional product rules, and create unnecessary
   migration and testing risk. It is rejected for this release.

## Decision

- The one-time `per_session` / Defense Brief price is 990 RUB.
- The canonical YooKassa amount is 99,000 kopecks.
- The billing plan catalogue reports 990 RUB.
- All active landing, billing, guest-flow, and backend paywall copy uses
  `990 ₽`.
- Existing subscription prices remain unchanged.
- Existing completed payments retain their recorded amount; there is no data
  rewrite or migration.

## Success criteria

- A `per_session` payment request sends `990.00` RUB to YooKassa.
- Billing plan metadata reports `price: 990` for `per_session`.
- No active PeakTalk source still presents 299 RUB as the current one-time
  product price.
- Backend tests, frontend lint/typecheck/build, and desktop/mobile browser checks
  pass with fresh evidence.
- The verified commit is deployed through the existing GitHub Actions workflow
  triggered by a push to `main`, then public health and UI are verified.

## Non-goals

- No subscription repricing, pricing experiment, coupon, discount, or dynamic
  pricing implementation.
- No change to payment webhook semantics, credits, API shapes, auth, storage,
  admin, database schema, migrations, or simulation behavior.
- No deploy workflow or infrastructure change and no manual production mutation.

## Release and rollback

The release uses the existing immutable GitHub Actions artifact and VDS deploy
script. The script records the previous image tag, takes the configured database
backup, and automatically restores the previous runtime images if the health
check fails.

If a post-deploy pricing or UI regression is found, revert the exact release
commit, push the revert to `main`, and let the same workflow deploy the prior
price/copy. No database rollback is required because this decision adds no
migration and does not rewrite completed payment records.
