import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin pages use the PeakTalk control API and expose action states', () => {
  const layout = read('src/app/admin/layout.tsx');
  const overview = read('src/app/admin/page.tsx');
  const users = read('src/app/admin/users/page.tsx');
  const auth = read('src/app/admin/auth/page.tsx');
  const primitives = read('src/components/admin/AdminPrimitives.tsx');
  assert.match(layout, /\/admin\/control\/overview/);
  assert.match(overview, /\/admin\/control\/overview/);
  assert.match(users, /\/admin\/control\/users/);
  assert.match(auth, /\/admin\/control\/auth/);
  assert.doesNotMatch(overview, /fake|mock|placeholder/i);
  assert.match(users, /role="dialog"/);
  assert.match(users, /confirm: true/);
  assert.match(primitives, /Повторить/);
  assert.match(users, /aria-label={`Открыть карточку/);
});

test('admin font contract is deterministic and self-hosted', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /url\("\/fonts\/ibm-plex\.woff2"\)/);
  assert.match(css, /url\("\/fonts\/unbounded\.woff2"\)/);
  assert.match(css, /url\("\/fonts\/jetbrains-mono\.woff2"\)/);
  assert.match(css, /--font-inter: "IBM Plex Sans"/);
  assert.doesNotMatch(css, /--font-inter:.*Arial/);
});
