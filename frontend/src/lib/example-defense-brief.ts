import type { DefenseBriefArtifact } from './defense-brief-export';

const EXAMPLE_OPENING_MOVE =
  'Защита roadmap/budget перед CEO/CFO: начните с trade-off. Покажите, какую бизнес-цель вы защищаете, что будет с [ваша ключевая метрика], если срезать scope или бюджет сейчас, и где проходит граница компромисса.';

export const EXAMPLE_DEFENSE_BRIEF_CONTEXT_NOTE =
  'Это пример формата, не анализ вашего материала. Персональный Defense Brief собирается после полного стресс-теста на базе ваших вводных и ответов.';

export const EXAMPLE_DEFENSE_BRIEF: DefenseBriefArtifact = {
  opening_move: EXAMPLE_OPENING_MOVE,
  top_arguments: [
    {
      text: 'Сохранить фокус roadmap на outcome, а не на списке фич.',
      strength: 'high',
      anchor_phrase:
        'Я защищаю не набор задач, а способность команды довести [ваш business outcome] до результата в этом квартале.',
    },
    {
      text: 'Связать бюджет с ценой задержки и риском для ключевого сегмента.',
      strength: 'medium',
      anchor_phrase:
        'Если мы режем бюджет сейчас, важно честно зафиксировать цену: [стоимость задержки] и риск по [критичный клиент/сегмент].',
    },
  ],
  anchor_phrases: [
    'Компромисс возможен по scope, но не по цели встречи: [ваш измеримый outcome].',
    'Давайте сравнивать не стоимость инициативы, а стоимость отказа от нее в этом квартале.',
  ],
  danger_zones: [
    {
      topic: 'ROI и окупаемость',
      risk: 'CEO/CFO может спросить, почему этот бюджет должен пережить сокращение именно сейчас.',
      suggested_response:
        'Привяжите ответ к [ваша цифра по revenue/churn/retention], сроку влияния и альтернативной цене задержки.',
    },
    {
      topic: 'Перегруз команды',
      risk: 'Founder может атаковать план как слишком широкий и попросить выбрать одно направление.',
      suggested_response:
        'Сразу назовите, что вы готовы выкинуть из scope, и что нельзя трогать без потери результата.',
    },
  ],
  key_numbers: [
    '[ваша цифра по churn / retention]',
    '[стоимость задержки релиза]',
    '[доля revenue или клиентов, которых затрагивает решение]',
  ],
};

export function isExampleDefenseBrief(artifact: DefenseBriefArtifact): boolean {
  return artifact.opening_move === EXAMPLE_OPENING_MOVE;
}
