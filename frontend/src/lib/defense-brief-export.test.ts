import assert from 'node:assert/strict';
import {
  buildDefenseBriefFilename,
  formatAnalysisDefenseBriefMarkdown,
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
  evidence_gaps: ['Нет owner на риск задержки roadmap.'],
  pressure_questions: ['Что вы урежете первым при минус 30% бюджета?'],
  next_moves: ['Добавить пороговую метрику и дату решения.'],
};

const markdown = formatDefenseBriefMarkdown(artifact);

assert.match(markdown, /^# Defense Brief/);
assert.match(markdown, /## Рекомендуемый старт\nНачните с trade-off/);
assert.match(markdown, /## Дыры в позиции/);
assert.match(markdown, /- Нет owner на риск задержки roadmap\./);
assert.match(markdown, /## Вопросы, которые стоит ждать/);
assert.match(markdown, /- Что вы урежете первым при минус 30% бюджета\?/);
assert.match(markdown, /## Что поправить до встречи/);
assert.match(markdown, /- Добавить пороговую метрику и дату решения\./);
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

const analysisMarkdown = formatAnalysisDefenseBriefMarkdown({
  title: 'Roadmap memo',
  evidence_gaps: ['Нет цифры по стоимости задержки.'],
  pressure_questions: ['Почему нельзя урезать scope без потери результата?'],
  next_moves: ['Добавить owner, метрику и дату решения.'],
  improved_text: 'Я защищаю core-интеграцию, потому что задержка бьёт по retention.',
});

assert.match(analysisMarkdown, /Материал: Roadmap memo/);
assert.match(analysisMarkdown, /## Дыры в позиции/);
assert.match(analysisMarkdown, /- Нет цифры по стоимости задержки\./);
assert.match(analysisMarkdown, /## Вопросы, которые стоит ждать/);
assert.match(analysisMarkdown, /## Усиленная версия материала/);
