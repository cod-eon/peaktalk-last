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
  const [pageSource, layoutSource] = await Promise.all([
    readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/app/layout.tsx', import.meta.url), 'utf8'),
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
});
