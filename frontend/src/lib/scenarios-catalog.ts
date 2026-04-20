import { type Scenario } from '@/lib/scenarios-api'

export interface ScenarioCatalogItem extends Scenario {
  situation?: string
}

export const START_PRESSURE_OPTIONS = [
  { value: 2, label: 'Мягко', range: '1–3' },
  { value: 5, label: 'Стандарт', range: '4–6' },
  { value: 8, label: 'Жёстко', range: '7–10' },
] as const

const FALLBACK_SCENARIOS: ScenarioCatalogItem[] = [
  {
    id: 'fallback-budget-cut-q3',
    slug: 'budget-cut-q3',
    title: 'Защита бюджета перед сокращением',
    subtitle: 'CFO требует урезать бюджет продукта на 30%',
    category: 'budget',
    persona: 'CFO',
    difficulty: 4,
    recommended_difficulty: 5,
    situation:
      'Конец квартала. CFO объявил об оптимизации расходов и требует сократить бюджет вашего подразделения на 30%. На встрече вам нужно защитить ключевые статьи расходов и доказать, что они критичны для достижения бизнес-целей.\n\nВам предстоит связать бюджет с выручкой, retention и скоростью исполнения. Давление будет идти на каждую статью затрат и на вашу способность предложить компромисс без удара по результату.',
  },
  {
    id: 'fallback-roadmap-reprioritization',
    slug: 'roadmap-reprioritization',
    title: 'Переприоритизация roadmap',
    subtitle: 'Совет директоров требует сдвинуть сроки ключевого релиза',
    category: 'roadmap',
    persona: 'Совет директоров',
    difficulty: 3,
    recommended_difficulty: 5,
    situation:
      'На квартальном обзоре совет директоров требует перенести релиз ключевой инициативы, чтобы срочно освободить команду под новый запрос. Вы считаете, что это разрушит стратегию и ухудшит качество исполнения.\n\nНужно защитить текущие приоритеты, показать стоимость срыва плана и предложить реалистичный компромисс, а не абстрактное “давайте всё успеем”.',
  },
  {
    id: 'fallback-series-a-pitch',
    slug: 'series-a-pitch',
    title: 'Питч перед Series A',
    subtitle: 'Инвестор жёстко давит на рынок, рост и unit-экономику',
    category: 'investors',
    persona: 'Инвестор',
    difficulty: 5,
    recommended_difficulty: 8,
    situation:
      'Вы выходите на встречу с потенциальным лид-инвестором раунда. Он не собирается слушать общие слова и сразу уходит в размер рынка, траекторию роста и экономику сделки.\n\nНужно выдержать темп вопросов, не потерять нить и доказать, что рост не куплен скидками, а модель масштабируема.',
  },
  {
    id: 'fallback-client-escalation',
    slug: 'client-escalation',
    title: 'Эскалация от ключевого клиента',
    subtitle: 'Крупный клиент угрожает заморозить контракт после сбоя',
    category: 'clients',
    persona: 'Клиент',
    difficulty: 4,
    recommended_difficulty: 5,
    situation:
      'После серьёзного сбоя ключевой клиент требует немедленного разговора с руководством. Его доверие просело, а команда закупки уже обсуждает альтернативных подрядчиков.\n\nВам нужно не просто извиниться, а показать контроль над ситуацией, план исправления и причины, почему продолжение работы с вами рационально.',
  },
  {
    id: 'fallback-team-restructuring',
    slug: 'team-restructuring',
    title: 'Сложный разговор о перестройке команды',
    subtitle: 'Нужно защитить болезненное решение по роли и ресурсам',
    category: 'people',
    persona: 'HR / менеджмент',
    difficulty: 3,
    recommended_difficulty: 5,
    situation:
      'Компания пересматривает структуру команды, и вам нужно объяснить тяжёлое кадровое решение без попытки спрятаться за общими формулировками. Будут спрашивать, почему именно так, какие есть альтернативы и как вы защитите людей и результат.\n\nРазговор проверит не только логику решения, но и вашу управленческую зрелость.',
  },
  {
    id: 'fallback-product-incident',
    slug: 'product-incident',
    title: 'Разбор продуктового инцидента',
    subtitle: 'Критический сбой задел заметную долю пользователей',
    category: 'crisis',
    persona: 'Руководство',
    difficulty: 5,
    recommended_difficulty: 8,
    situation:
      'В проде произошёл критический инцидент, который ударил по пользователям и репутации команды. Руководство ждёт объяснения: что сломалось, почему это не было предотвращено и что изменится системно.\n\nЗадача не сводится к статус-апдейту. Нужно выдержать давление, взять ответственность и показать, что это не повторится через две недели.',
  },
]

const FALLBACK_SCENARIOS_BY_SLUG = Object.fromEntries(
  FALLBACK_SCENARIOS.map((scenario) => [scenario.slug, scenario])
) as Record<string, ScenarioCatalogItem>

export function getFallbackScenarioBySlug(slug: string): ScenarioCatalogItem | null {
  return FALLBACK_SCENARIOS_BY_SLUG[slug] ?? null
}

export function getFallbackScenarios(category?: string): ScenarioCatalogItem[] {
  if (!category || category === 'all') {
    return FALLBACK_SCENARIOS
  }

  return FALLBACK_SCENARIOS.filter((scenario) => scenario.category === category)
}

export function enrichScenario(scenario: Scenario): ScenarioCatalogItem {
  const fallback = getFallbackScenarioBySlug(scenario.slug)

  return {
    ...(fallback ?? {}),
    ...scenario,
    title: scenario.title || fallback?.title || 'Сценарий без названия',
    subtitle:
      scenario.subtitle || fallback?.subtitle || 'Подготовьтесь к жёсткому разговору заранее.',
    persona: scenario.persona || fallback?.persona || 'Оппонент',
    category: scenario.category || fallback?.category || 'other',
    difficulty:
      typeof scenario.difficulty === 'number'
        ? scenario.difficulty
        : fallback?.difficulty || 3,
    recommended_difficulty:
      scenario.recommended_difficulty ?? fallback?.recommended_difficulty,
    situation: scenario.situation ?? fallback?.situation,
  }
}

export function normalizeScenarioDisplayDifficulty(value: number): number {
  if (!Number.isFinite(value)) {
    return 3
  }

  if (value <= 5) {
    return Math.min(5, Math.max(1, Math.round(value)))
  }

  return Math.min(5, Math.max(1, Math.round((value / 10) * 5)))
}

export function normalizeStartDifficulty(value?: number | null): number {
  const safeValue = Number.isFinite(value) ? Number(value) : 5
  const pressureValues = START_PRESSURE_OPTIONS.map((option) => option.value)

  return pressureValues.reduce((closest, optionValue) => {
    return Math.abs(optionValue - safeValue) < Math.abs(closest - safeValue)
      ? optionValue
      : closest
  }, pressureValues[1] ?? 5)
}

export function getScenarioOfTheDay(
  scenarios: ScenarioCatalogItem[]
): ScenarioCatalogItem | null {
  if (scenarios.length === 0) {
    return null
  }

  const dayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const seed = Array.from(dayKey).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return scenarios[seed % scenarios.length] ?? scenarios[0]
}
