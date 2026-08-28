import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const baseUrl = process.env.LANDING_BASE_URL ?? 'http://127.0.0.1:3100';

test('homepage exposes the compact decision-defense contract', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  const html = await response.text();

  const requiredCopy = [
    'Подготовьте материал, который выдержит вопросы руководства.',
    'За три вопроса без регистрации увидите, где позиции не хватает цифр, выбора и ответственности за решение.',
    'Вопрос, который может сорвать защиту, лучше услышать до встречи.',
    'Выберите решение, которое нужно защитить на ближайшей встрече.',
    'От материала до позиции, которую можно защищать.',
    'Три вопроса бесплатно. Полная подготовка за 299 ₽.',
    'Это курс переговоров или тренировка выступлений?',
    'Не несите слабый ответ на сильную встречу.',
  ];

  for (const copy of requiredCopy) assert.ok(html.includes(copy), `Missing copy: ${copy}`);

  const requiredLinks = [
    'href="/simulation/guest"',
    'href="/billing?plan=per_session"',
    'href="/scenarios/budget-cut-q3"',
    'href="/scenarios/client-escalation"',
    'href="/scenarios/series-a-pitch"',
  ];

  for (const link of requiredLinks) assert.ok(html.includes(link), `Missing link: ${link}`);

  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  assert.doesNotMatch(html, /Новая логика PeakTalk/);
  assert.doesNotMatch(html, /На выходе не/);
  assert.doesNotMatch(html, /без учебной сцены/);
  assert.match(html, /FAQPage/);
  assert.match(html, /SoftwareApplication/);
});

test('homepage source preserves analytics and typography constraints', async () => {
  const [pageSource, layoutSource, filmSource, landingStyles] = await Promise.all([
    readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/landing/LandingPressureFilm.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/landing.module.css', import.meta.url), 'utf8'),
  ]);

  const locations = [
    'nav_desktop',
    'nav_mobile',
    'hero_primary',
    'pressure_fragment',
    'pricing_free',
    'pricing_paid',
    'footer_final',
  ];

  for (const location of locations) assert.match(pageSource, new RegExp(`'${location}'`));
  assert.match(pageSource, /landing_cta_clicked/);
  assert.match(pageSource, /source: 'landing'/);
  assert.doesNotMatch(`${pageSource}\n${layoutSource}`, /[—–]/);

  assert.match(pageSource, /lg:text-\[58px\]/, 'Hero must preserve the protected desktop type scale');
  assert.match(pageSource, /sm:flex sm:items-center sm:gap-4/, 'Hero CTAs must stay side by side from sm');
  assert.doesNotMatch(pageSource, /lg:grid-cols-3/, 'Process must not regress to three equal columns');
  assert.match(pageSource, /className=\{styles\.processStage\}/, 'Process stages must use the open-track layout');
  assert.match(landingStyles, /\.processStage/, 'Open process stages need responsive track styling');
  assert.match(landingStyles, /opacity:\s*1\s*!important/, 'Reduced motion must never leave process visuals hidden');
  assert.match(landingStyles, /transform:\s*none\s*!important/, 'Reduced motion must remove process transforms');
  assert.match(pageSource, /text-white\/65/, 'Small footer links must keep readable contrast');
  assert.match(pageSource, /pt-2 pb-6/, 'Expanded FAQ answers need breathing room below the question');
  assert.match(pageSource, /role="dialog"/, 'Mobile navigation must expose dialog semantics');
  assert.match(pageSource, /aria-modal="true"/, 'Mobile navigation must be announced as modal');
  assert.match(pageSource, /aria-label="Навигация по странице"/, 'Mobile navigation dialog needs a meaningful label');
  assert.match(pageSource, /mobileMenuOpenerRef/, 'Mobile navigation must retain its opener for focus restoration');
  assert.match(pageSource, /event\.key === 'Escape'/, 'Mobile navigation must support Escape dismissal');
  assert.match(pageSource, /document\.body\.style\.position/, 'Mobile navigation must lock background scrolling');

  assert.match(filmSource, /useRef<HTMLVideoElement>/, 'Film playback needs a stable video ref');
  assert.match(filmSource, /hasApproached/, 'Film source must mount persistently after first approach');
  assert.match(filmSource, /approachObserver\.disconnect\(\)/, 'Approach observer must stop after first mount');
  assert.match(filmSource, /visibilityObserver/, 'Film needs a separate viewport visibility observer');
  assert.match(filmSource, /video\.pause\(\)/, 'Film must pause outside the actual viewport');
  assert.match(filmSource, /video\.play\(\)/, 'Film must resume inside the actual viewport');
  assert.match(filmSource, /currentTime >= 10\.5/, 'Film must hold the meaningful 11.2s poster over low-information opening frames');
  assert.match(
    filmSource,
    /setHasMeaningfulFrame\(currentTime >= 10\.5\)/,
    'Film must restore the poster whenever playback rewinds below the meaningful-frame threshold',
  );
  assert.match(filmSource, /onSeeking=/, 'Film must hide low-information frames as soon as seeking begins');
  assert.match(filmSource, /onSeeked=/, 'Film must resync poster visibility after seeking completes');
  assert.match(
    filmSource,
    /hasMeaningfulFrame \? 'opacity-100 transition-opacity duration-300' : 'opacity-0'/,
    'Film must hide rewound frames immediately while retaining the meaningful-frame fade-in',
  );
});
