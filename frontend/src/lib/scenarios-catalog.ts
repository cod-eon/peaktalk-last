import { type Scenario } from '@/lib/scenarios-api'

export interface ScenarioCatalogItem extends Scenario {
  situation?: string
  problem?: string
  pressure?: string
  whatToPrepare?: string[]
  sampleQuestions?: string[]
  expectedOutput?: string[]
  faq?: Array<{
    question: string
    answer: string
  }>
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
    problem:
      'Вы защищаете не строку в таблице, а управленческое решение: что нельзя резать без потери результата.',
    pressure:
      'CFO будет давить на payback, альтернативы, необязательные расходы и вашу готовность самому назвать, что можно убрать.',
    whatToPrepare: [
      'Суммы по ключевым статьям и причина, почему они нужны именно сейчас.',
      'Связь расходов с выручкой, retention, сроками или операционным риском.',
      'Компромиссный вариант: что можно отложить без разрушения результата.',
    ],
    sampleQuestions: [
      'Что сломается, если мы урежем эту статью на 50%?',
      'Где доказательство, что эти расходы дают возврат?',
      'Почему это важнее других инициатив компании?',
      'Что вы сами готовы сократить?',
    ],
    expectedOutput: [
      'Список слабых мест в аргументации бюджета.',
      'Формулировки для защиты критичных статей.',
      'Короткая prep-card перед встречей с CFO.',
    ],
    faq: [
      {
        question: 'Подойдёт ли сценарий, если у меня нет финмодели?',
        answer:
          'Да. Достаточно списка статей, ожидаемого эффекта и ограничений. PeakTalk будет давить на причинно-следственную связь, а не на формат документа.',
      },
      {
        question: 'Можно ли тренировать сокращение, а не защиту бюджета?',
        answer:
          'Да. В guest-режиме можно описать, что вы сами предлагаете урезать, и проверить, выдерживает ли это объяснение вопросы руководства.',
      },
    ],
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
    problem:
      'Вам нужно объяснить trade-offs так, чтобы это звучало как управление приоритетами, а не сопротивление новому запросу.',
    pressure:
      'Board будет спрашивать, почему нельзя ускориться, что вы готовы снять с плана и какую цену компания платит за перенос.',
    whatToPrepare: [
      'Текущий roadmap с зависимостями и критическими сроками.',
      'Стоимость переноса: клиенты, выручка, технический долг, команда.',
      'Один-два реалистичных варианта компромисса.',
    ],
    sampleQuestions: [
      'Почему команда не может просто взять обе задачи?',
      'Что именно мы потеряем при переносе релиза?',
      'Какие метрики подтверждают этот приоритет?',
      'Что вы предлагаете вместо отказа?',
    ],
    expectedOutput: [
      'Карта уязвимых мест в защите roadmap.',
      'Более жёсткие формулировки trade-offs.',
      'Черновик ответа на давление по срокам.',
    ],
    faq: [
      {
        question: 'Нужно ли загружать весь roadmap?',
        answer:
          'Нет. Лучше дать фрагмент с инициативой, зависимостями и причиной конфликта. Чем конкретнее контекст, тем полезнее вопросы.',
      },
      {
        question: 'Сценарий подходит для product managers?',
        answer:
          'Да, особенно если встреча касается приоритетов, сроков, ресурсов и защиты продуктового решения перед руководством.',
      },
    ],
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
    problem:
      'Инвестор проверяет не красоту pitch deck, а вашу способность защищать рынок, рост и экономику под давлением.',
    pressure:
      'Давление пойдёт на TAM/SAM/SOM, качество роста, churn, CAC, payback и слабые места команды.',
    whatToPrepare: [
      'Pitch deck или короткий fundraising memo.',
      'Ключевые цифры по росту, retention, CAC, payback и pipeline.',
      'Честное объяснение главного риска раунда.',
    ],
    sampleQuestions: [
      'Почему этот рынок достаточно большой именно для венчурного кейса?',
      'Где доказательство, что рост не куплен скидками?',
      'Что в вашей модели сейчас не работает?',
      'Почему конкурент не заберёт этот рынок быстрее?',
    ],
    expectedOutput: [
      'Список инвесторских вопросов, на которых pitch проседает.',
      'Более точные ответы по рынку и экономике.',
      'Prep-card с рисками, которые лучше признать заранее.',
    ],
    faq: [
      {
        question: 'Можно использовать сценарий до готового pitch deck?',
        answer:
          'Да. Можно вставить тезисы, memo или структуру рассказа. Сценарий поможет понять, какие части нужно докрутить до встречи.',
      },
      {
        question: 'PeakTalk заменяет инвесторского консультанта?',
        answer:
          'Нет. Это тренировка давления и слабых мест аргументации перед разговором, а не стратегический advisory.',
      },
    ],
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
    problem:
      'Клиент хочет понять, контролируете ли вы ситуацию, или ему пора снижать зависимость от вас.',
    pressure:
      'Давление будет на причины сбоя, сроки исправления, компенсации, гарантии и персональную ответственность.',
    whatToPrepare: [
      'Краткую хронологию инцидента без лишней внутренней кухни.',
      'План исправления с владельцами и сроками.',
      'Позицию по компенсации, SLA или следующим шагам.',
    ],
    sampleQuestions: [
      'Почему мы узнаём об этом только сейчас?',
      'Что конкретно вы поменяете, чтобы это не повторилось?',
      'Какие гарантии вы готовы дать?',
      'Почему нам не начать миграцию к другому подрядчику?',
    ],
    expectedOutput: [
      'Неприятные вопросы клиента до реальной встречи.',
      'Более спокойная структура ответа на эскалацию.',
      'Список формулировок, которые звучат защитно или размыто.',
    ],
    faq: [
      {
        question: 'Можно ли вставить письмо клиента?',
        answer:
          'Да. Вставьте письмо, тезисы или краткое описание конфликта. Не добавляйте лишние персональные данные, если они не нужны для подготовки.',
      },
      {
        question: 'Это только для sales?',
        answer:
          'Нет. Сценарий подходит founder, account manager, customer success, product lead или любому, кто выходит на сложный клиентский разговор.',
      },
    ],
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
    problem:
      'Нужно защитить болезненное решение так, чтобы оно не выглядело импульсивным, личным или плохо просчитанным.',
    pressure:
      'HR и менеджмент будут давить на критерии, альтернативы, влияние на команду, коммуникацию и риски после изменения.',
    whatToPrepare: [
      'Причину изменения роли, структуры или ресурсов.',
      'Критерии решения и рассмотренные альтернативы.',
      'План коммуникации и контроля рисков после решения.',
    ],
    sampleQuestions: [
      'Почему именно это решение, а не мягкий вариант?',
      'Как вы отделяете факты от личного отношения?',
      'Что будет с мотивацией команды после разговора?',
      'Какие риски вы берёте на себя?',
    ],
    expectedOutput: [
      'Проверка управленческой логики решения.',
      'Формулировки без канцелярита и ухода от ответственности.',
      'Список вопросов, к которым стоит подготовиться заранее.',
    ],
    faq: [
      {
        question: 'Подходит ли сценарий для разговора один на один?',
        answer:
          'Да. Он полезен и перед встречей с руководством, и перед личным разговором, если нужно держать ясную позицию.',
      },
      {
        question: 'Это юридическая консультация?',
        answer:
          'Нет. PeakTalk помогает подготовить аргументацию и коммуникацию. Юридические вопросы нужно проверять с профильным специалистом.',
      },
    ],
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
    problem:
      'Вам нужно показать контроль и системные выводы, не превращая разбор в поиск виноватого или сухой status update.',
    pressure:
      'Руководство будет давить на root cause, профилактику, владельцев, коммуникацию и стоимость повторения.',
    whatToPrepare: [
      'Краткий postmortem: impact, timeline, root cause, mitigation.',
      'Что уже исправлено и что требует отдельного решения.',
      'План системных изменений с владельцами.',
    ],
    sampleQuestions: [
      'Почему это не было предотвращено раньше?',
      'Кто владел риском до инцидента?',
      'Как мы поймём, что проблема действительно закрыта?',
      'Что вы перестанете делать после этого разбора?',
    ],
    expectedOutput: [
      'Список дыр в postmortem до встречи с руководством.',
      'Ответы на вопросы про ответственность и профилактику.',
      'Короткая prep-card для разбора инцидента.',
    ],
    faq: [
      {
        question: 'Можно использовать черновик postmortem?',
        answer:
          'Да. Лучше вставить краткий черновик с timeline, impact и root cause. Сценарий проверит, где объяснение выглядит слабым.',
      },
      {
        question: 'Сценарий подходит для технических лидов?',
        answer:
          'Да. Он рассчитан на разговор, где техническое объяснение нужно перевести в управленческую ответственность и план действий.',
      },
    ],
  },
]

export const FALLBACK_SCENARIO_SLUGS = FALLBACK_SCENARIOS.map(
  (scenario) => scenario.slug
)

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
