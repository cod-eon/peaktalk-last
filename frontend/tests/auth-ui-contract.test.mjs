import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const authPages = [
  'src/app/(auth)/login/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'src/app/(auth)/forgot-password/page.tsx',
  'src/app/(auth)/reset-password/page.tsx',
];

test('credential forms expose labels, autocomplete, busy and alert states', () => {
  for (const path of authPages) {
    const source = read(path);
    assert.match(source, /auth-panel/);
    assert.match(source, /auth-heading/);
  }
  for (const path of authPages.slice(0, 3)) assert.match(read(path), /aria-busy=\{busy\}/);
  for (const path of authPages) assert.match(read(path), /role="alert"/);
  assert.match(read(authPages[0]), /autoComplete="email"/);
  assert.match(read(authPages[0]), /autoComplete="current-password"/);
  assert.match(read(authPages[1]), /autoComplete="new-password"/);
});

test('auth state surfaces have status semantics and safe recovery actions', () => {
  assert.match(read('src/app/loading.tsx'), /role="status"/);
  assert.match(read('src/app/(auth)/error.tsx'), /role="alert"/);
  assert.match(read('src/app/unauthorized.tsx'), /href="\/login"/);
  assert.match(read('src/app/(auth)/reset-password/page.tsx'), /Ссылка истекла/);
  assert.match(read('src/app/verify-email/page.tsx'), /aria-live="polite"/);
  assert.match(read('src/app/verify-email/page.tsx'), /sendVerificationEmail/);
  assert.match(read('src/app/verify-email/page.tsx'), /Отправить письмо ещё раз/);
  assert.match(read('src/app/(auth)/forgot-password/page.tsx'), /result\.error/);
  const serverAuth = read('src/lib/auth.ts');
  const mail = read('src/lib/mail.ts');
  assert.doesNotMatch(serverAuth, /void sendAuthMail/);
  assert.equal((serverAuth.match(/await sendAuthMail/g) ?? []).length, 2);
  assert.match(mail, /AUTH_SMTP_HOST/);
  assert.match(mail, /transport\.sendMail/);
  assert.match(mail, /RESEND_API_KEY/);
});

test('return paths and reduced-motion styling remain explicit security and accessibility contracts', () => {
  const returns = read('src/lib/return-path.ts');
  assert.match(returns, /raw\.startsWith\('\/\/\'\)/);
  assert.match(returns, /raw\.includes\('\\\\'\)/);
  assert.match(returns, /url\.origin !== RETURN_PATH_ORIGIN/);
  const css = read('src/app/globals.css');
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /overflow: hidden/);
  assert.match(css, /focus-visible/);
  assert.match(css, /\.auth-field input:focus-visible\{outline:2px solid #e8600a !important/);
});
