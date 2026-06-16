import assert from 'node:assert/strict';
import {
  buildDefenseBriefFilename,
  formatDefenseBriefMarkdown,
  type DefenseBriefArtifact,
} from './defense-brief-export.js';

const artifact: DefenseBriefArtifact = {
  opening_move: 'Начните с trade-off: рост retention важнее расширения roadmap.',
  top_arguments: [
    {
      text: 'Удержать roadmap scope',
      strength: 'high',
      anchor_phrase: 'Мы защищаем не список задач, а фокус квартала.',
    },
  ],
  anchor_phrases: [
    'Мы защищаем не список задач, а фокус квартала.',
    'Бюджет нужен не на инициативы, а на снижение churn.',
  ],
  danger_zones: [
    {
      topic: 'ROI',
      risk: 'CFO спросит, где окупаемость в деньгах.',
      suggested_response: 'Привязать инициативу к churn, expansion и support cost.',
    },
  ],
  key_numbers: ['retention +4 п.п.', 'support cost -12%'],
};

const markdown = formatDefenseBriefMarkdown(artifact);

assert.match(markdown, /^# Defense Brief/);
assert.match(markdown, /## Рекомендуемый старт\nНачните с trade-off/);
assert.match(markdown, /## Ключевые тезисы/);
assert.match(markdown, /1\. Удержать roadmap scope/);
assert.match(markdown, /\*\*Опорная формулировка:\*\* "Мы защищаем не список задач, а фокус квартала\."/);
assert.match(markdown, /## Формулировки, которые стоит забрать на встречу/);
assert.match(markdown, /- "Бюджет нужен не на инициативы, а на снижение churn\."/);
assert.match(markdown, /## Зоны риска и возражения/);
assert.match(markdown, /### 1\. ROI/);
assert.match(markdown, /## Цифры, которые нужно запомнить/);
assert.match(markdown, /- retention \+4 п\.п\./);

const sparse = formatDefenseBriefMarkdown({
  opening_move: '',
  top_arguments: [],
  anchor_phrases: [],
  danger_zones: [],
  key_numbers: [],
});

assert.ok(!sparse.includes('undefined'));
assert.ok(!sparse.includes('null'));
assert.equal(buildDefenseBriefFilename('session:abc/def'), 'peaktalk-defense-brief-session_abc_def.md');
