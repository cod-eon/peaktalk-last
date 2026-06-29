import assert from 'node:assert/strict';
import {
  buildBillingSuccessPath,
  isGuestPaywallReturnPath,
  normalizeInternalReturnPath,
  normalizeOptionalInternalReturnPath,
} from './return-path.js';

const guestBillingReturn = '/billing?plan=per_session&return=/simulation/from-guest';

assert.equal(
  normalizeInternalReturnPath(guestBillingReturn),
  guestBillingReturn,
);

assert.equal(
  buildBillingSuccessPath('/simulation/from-guest'),
  '/billing/success?return=%2Fsimulation%2Ffrom-guest',
);

assert.equal(isGuestPaywallReturnPath('/simulation/from-guest'), true);
assert.equal(isGuestPaywallReturnPath('/simulation'), false);

assert.equal(normalizeInternalReturnPath(null), '/dashboard');
assert.equal(normalizeInternalReturnPath(''), '/dashboard');
assert.equal(normalizeInternalReturnPath('billing'), '/dashboard');
assert.equal(normalizeInternalReturnPath('https://evil.example/billing'), '/dashboard');
assert.equal(normalizeInternalReturnPath('//evil.example/billing'), '/dashboard');
assert.equal(normalizeInternalReturnPath('/admin'), '/dashboard');

assert.equal(normalizeOptionalInternalReturnPath('/upload'), '/upload');
assert.equal(
  normalizeOptionalInternalReturnPath('/onboarding?return=/billing?plan=per_session&return=/simulation/from-guest'),
  '/onboarding?return=/billing?plan=per_session&return=/simulation/from-guest',
);
assert.equal(normalizeOptionalInternalReturnPath('/analysis/abc123?tab=brief'), '/analysis/abc123?tab=brief');
assert.equal(normalizeOptionalInternalReturnPath('/auth/callback?next=/billing'), null);
