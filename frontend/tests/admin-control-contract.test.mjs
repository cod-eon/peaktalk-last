import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin pages use the PeakTalk control API and expose action states', () => {
  const layout = read('src/app/admin/layout.tsx');
  const overview = read('src/app/admin/page.tsx');
  const users = read('src/app/admin/users/page.tsx');
  const userPage = read('src/app/admin/users/[userId]/page.tsx');
  const actions = read('src/components/admin/AdminActionDialog.tsx');
  const auth = read('src/app/admin/auth/page.tsx');
  const primitives = read('src/components/admin/AdminPrimitives.tsx');
  assert.match(layout, /\/admin\/control\/overview/);
  assert.match(overview, /\/admin\/control\/overview/);
  assert.match(users, /\/admin\/control\/users/);
  assert.match(auth, /\/admin\/control\/auth/);
  assert.doesNotMatch(overview, /fake|mock|placeholder/i);
  assert.match(users, /href={`\/admin\/users\/\$\{encodeURIComponent\(user.id\)\}`}/);
  assert.match(userPage, /useParams/);
  assert.match(userPage, /\/admin\/control\/users\//);
  assert.match(actions, /confirm: true/);
  assert.match(actions, /mutation\.isPending/);
  assert.match(primitives, /Повторить/);
  assert.doesNotMatch(users, /UserDetailCard|selectedId|Карточка пользователя/);
});

test('admin font contract is deterministic and self-hosted', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /url\("\/fonts\/ibm-plex\.woff2"\)/);
  assert.match(css, /url\("\/fonts\/unbounded\.woff2"\)/);
  assert.match(css, /url\("\/fonts\/jetbrains-mono\.woff2"\)/);
  assert.match(css, /--font-body: "IBM Plex Sans"/);
  assert.doesNotMatch(css, /--font-body:.*Arial/);
});
