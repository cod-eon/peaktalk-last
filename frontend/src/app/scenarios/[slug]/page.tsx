'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getScenario } from '@/lib/scenarios-api'
import { getCaseSituationIdForScenario } from '@/lib/case-context'
import {
  START_PRESSURE_OPTIONS,
  enrichScenario,
  getFallbackScenarioBySlug,
  normalizeScenarioDisplayDifficulty,
  normalizeStartDifficulty,
  type ScenarioCatalogItem,
} from '@/lib/scenarios-catalog'
import {
  SCENARIO_ANALYTICS_EVENTS,
  trackScenarioEvent,
} from '@/lib/scenario-analytics'

const EXAMPLE_QUESTIONS: Record<string, string[]> = {
  budget: [
    'Что сломается, если мы урежем эту статью на 50%?',
    'Где доказательство, что эти расходы дают возврат?',
    'Что вы сами готовы сократить?',
  ],
  roadmap: [
    'Почему команда не может просто взять обе задачи?',
    'Что именно мы потеряем при переносе релиза?',
    'Что вы предлагаете вместо отказа?',
  ],
  investors: [
    'Почему этот рынок достаточно большой?',
    'Где доказательство, что рост не куплен скидками?',
    'Что в вашей модели сейчас не работает?',
  ],
  clients: [
    'Почему мы узнаём об этом только сейчас?',
    'Какие гарантии вы готовы дать?',
    'Почему нам не начать миграцию к другому подрядчику?',
  ],
  people: [
    'Почему именно это решение, а не мягкий вариант?',
    'Как вы отделяете факты от личного отношения?',
    'Какие риски вы берёте на себя?',
  ],
  crisis: [
    'Почему это не было предотвращено раньше?',
    'Кто владел риском до инцидента?',
    'Как мы поймём, что проблема действительно закрыта?',
  ],
}

const CATEGORY_META: Record<string, { label: string; role: string }> = {
  budget: { label: 'Бюджет', role: 'Финансы' },
  roadmap: { label: 'Roadmap', role: 'Руководство' },
  investors: { label: 'Инвесторы', role: 'Инвестор' },
  clients: { label: 'Клиенты', role: 'Эскалация клиента' },
  people: { label: 'Люди', role: 'HR / менеджмент' },
  crisis: { label: 'Кризис', role: 'Разбор инцидента' },
}

function DifficultyDots({ value }: { value: number }) {
  const safeValue = normalizeScenarioDisplayDifficulty(value)

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 ${
            i < safeValue ? 'bg-[#E8600A]' : 'bg-neutral-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function ScenarioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [scenario, setScenario] = useState<ScenarioCatalogItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<number>(5)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const viewedScenarioKeyRef = useRef<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      setIsUsingFallback(false)

      try {
        const data = await getScenario(slug)
        const enrichedScenario = enrichScenario(data)
        setScenario(enrichedScenario)
        setDifficulty(normalizeStartDifficulty(enrichedScenario.recommended_difficulty))
      } catch {
        const fallback = getFallbackScenarioBySlug(slug)
        if (fallback) {
          setScenario(fallback)
          setDifficulty(normalizeStartDifficulty(fallback.recommended_difficulty))
          setIsUsingFallback(true)
        } else {
          setError('Сценарий не найден')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) load()
  }, [slug])

  useEffect(() => {
    if (!scenario) return

    const key = `${scenario.slug}:${isUsingFallback ? 'fallback' : 'api'}`
    if (viewedScenarioKeyRef.current === key) return
    viewedScenarioKeyRef.current = key

    trackScenarioEvent(SCENARIO_ANALYTICS_EVENTS.detailViewed, scenario, {
      source: 'scenario_detail',
      using_fallback: isUsingFallback,
    })
  }, [isUsingFallback, scenario])

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-neutral-400" size={28} />
        </div>
      </Shell>
    )
  }

  if (error || !scenario) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <AlertCircle size={32} className="text-neutral-300" />
          <p className="font-inter text-sm text-neutral-500">
            {error ?? 'Сценарий не найден'}
          </p>
          <Link
            href="/scenarios"
            className="font-inter text-sm font-medium text-neutral-900 underline underline-offset-2"
          >
            Все сценарии
          </Link>
        </div>
      </Shell>
    )
  }

  const categoryMeta = CATEGORY_META[scenario.category] ?? {
    label: scenario.category,
    role: scenario.persona,
  }
  const exampleQuestions =
    scenario.sampleQuestions ?? EXAMPLE_QUESTIONS[scenario.category] ?? []
  const whatToPrepare = scenario.whatToPrepare ?? [
    'Документ, презентацию, квартальный отчёт, postmortem или тезисы встречи.',
    'Кто будет оппонентом и чего он хочет добиться.',
    'Вашу текущую позицию и ограничения.',
  ]
  const expectedOutput = scenario.expectedOutput ?? [
    'Критические вопросы по вашему материалу.',
    'Слабые места в ответах и логике защиты.',
    'Короткая памятка перед встречей.',
  ]
  const primaryOutput =
    expectedOutput.find((item) => /Defense Brief/i.test(item)) ??
    expectedOutput[0] ??
    'Defense Brief по слабым местам защиты.'
  const faq = scenario.faq ?? []
  const jsonLd =
    faq.length > 0
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Сценарии',
                item: 'https://peaktalk.ru/scenarios',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: scenario.title,
                item: `https://peaktalk.ru/scenarios/${scenario.slug}`,
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          },
        ]
      : null

  const handleStartScenario = async () => {
    if (!scenario || isStarting) {
      return;
    }

    const trackStart = (startMode: string) => {
      trackScenarioEvent(SCENARIO_ANALYTICS_EVENTS.startClicked, scenario, {
        source: 'scenario_detail',
        difficulty,
        using_fallback: isUsingFallback,
        start_mode: startMode,
      })
    }

    if (isUsingFallback) {
      localStorage.setItem('peaktalk_guest_context', scenario.situation || scenario.subtitle);
      trackStart('guest_fallback')
      router.push(`/simulation/guest?persona=${scenario.category}&difficulty=${difficulty}&from_scenario=true`);
      return;
    }

    setIsStarting(true);
    try {
      const sessionResponse = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' });
      const session = sessionResponse.ok ? await sessionResponse.json() as { isAuthenticated?: boolean } : null;
      if (!session?.isAuthenticated) {
        localStorage.setItem('peaktalk_guest_context', scenario.situation || scenario.subtitle);
        trackStart('guest_unauthenticated')
        router.push(`/simulation/guest?persona=${scenario.category}&difficulty=${difficulty}&from_scenario=true`);
        return;
      }

      trackStart('authenticated_upload')
      const caseId = getCaseSituationIdForScenario(scenario.category, scenario.slug)
      router.push(`/upload?case=${encodeURIComponent(caseId)}`)
    } catch {
      localStorage.setItem('peaktalk_guest_context', scenario.situation || scenario.subtitle);
      router.push(`/simulation/guest?persona=${scenario.category}&difficulty=${difficulty}&from_scenario=true`);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Shell>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <Link
          href="/scenarios"
          className="mb-8 inline-flex items-center gap-1.5 font-inter text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft size={15} />
          Все сценарии
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="min-w-0 lg:col-span-2">
            {isUsingFallback && (
              <div className="mb-6 flex items-start gap-3 border border-[#E8600A]/30 bg-[#E8600A]/[0.06] px-4 py-3 text-[#8F3705]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p className="font-inter text-sm leading-relaxed">
                  Показываем встроенное описание сценария, потому что API каталога сейчас недоступен.
                </p>
              </div>
            )}

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="min-w-0 border border-neutral-950 bg-neutral-950 p-6 text-white sm:p-8"
            >
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-block border border-white/20 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                  {categoryMeta.label}
                </span>
                <DifficultyDots value={scenario.difficulty} />
                <span className="font-mono text-xs text-white/40">
                  {scenario.persona}
                </span>
              </div>

              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FF8A3D]">
                Scenario pressure sheet
              </div>
              <h1 className="mt-4 max-w-3xl break-words font-display text-[34px] font-black leading-[1.05] text-white sm:text-[56px]">
                {scenario.title}
              </h1>
              <p className="mt-5 max-w-2xl font-inter text-[17px] leading-relaxed text-white/70">
                {scenario.subtitle}
              </p>
            </motion.section>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="my-8 grid border border-neutral-950 bg-white sm:grid-cols-3"
            >
              {[
                ['Оппонент', scenario.persona],
                ['Фокус', categoryMeta.role],
                ['Выход', primaryOutput],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-black/[0.08] p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                    {label}
                  </div>
                  <div className="mt-2 break-words font-inter text-[15px] font-bold leading-snug text-neutral-950">
                    {value}
                  </div>
                </div>
              ))}
            </motion.div>

            <div className="mb-10 lg:hidden">
              <StartBlock
                scenario={scenario}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                isStarting={isStarting}
                onStart={handleStartScenario}
              />
            </div>

            {(scenario.problem || scenario.pressure) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-12 space-y-8"
              >
                {scenario.problem && (
                  <TextBlock title="Суть проблемы" text={scenario.problem} />
                )}
                {scenario.pressure && (
                  <TextBlock title="Источник давления" text={scenario.pressure} tone="risk" />
                )}
              </motion.div>
            )}

            {scenario.situation && (
              <TextBlock title="Контекст встречи" text={scenario.situation} />
            )}

            <SectionList
              title="Что нужно для подготовки"
              items={whatToPrepare}
            />

            <SectionList
              title="Какие вопросы будем отрабатывать"
              items={exampleQuestions}
            />

            <SectionList
              title="Что вы получите на выходе"
              items={expectedOutput}
            />

            {faq.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-12"
              >
                <h2 className="mb-6 font-display text-[22px] font-bold text-neutral-950">
                  FAQ
                </h2>
                <div className="space-y-6">
                  {faq.map((item) => (
                    <div key={item.question}>
                      <h3 className="font-inter text-[17px] font-bold text-neutral-950">
                        {item.question}
                      </h3>
                      <p className="mt-2 font-inter text-[16px] leading-relaxed text-neutral-600">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-8">
              <StartBlock
                scenario={scenario}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                isStarting={isStarting}
                onStart={handleStartScenario}
              />
            </div>
          </div>
        </div>
      </main>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#FAF8F4]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/[0.08] bg-[#FAF8F4]/95 px-4 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-75"
          aria-label="PeakTalk"
        >
          <Image src="/logo_svg.svg" alt="PeakTalk" width={40} height={40} className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="brand-wordmark text-[16px] text-neutral-950 sm:text-[18px]">PeakTalk</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-neutral-950 sm:inline"
          >
            Вход
          </Link>
          <Link
            href="/simulation/guest"
            className="inline-flex min-h-[42px] items-center justify-center border border-neutral-950 bg-neutral-950 px-3 font-inter text-[13px] font-bold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A] sm:min-h-[44px] sm:px-5"
          >
            Проверить материал
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}

function TextBlock({ title, text, tone = 'default' }: { title: string; text: string; tone?: 'default' | 'risk' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
      className="mb-10"
    >
      <h2 className={`mb-4 font-display text-[22px] font-bold ${tone === 'risk' ? 'text-[#B74707]' : 'text-neutral-950'}`}>
        {title}
      </h2>
      <div className="space-y-4 font-inter text-[16px] leading-relaxed text-neutral-600">
        {text.split('\n\n').map((para) => (
          <p key={para}>{para}</p>
        ))}
      </div>
    </motion.div>
  )
}

function SectionList({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  if (items.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.14 }}
      className="mb-12"
    >
      <h2 className="mb-5 font-display text-[22px] font-bold text-neutral-950">
        {title}
      </h2>
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-4"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#E8600A]" />
            <span className="font-inter text-[16px] leading-relaxed text-neutral-600">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

interface StartBlockProps {
  scenario: ScenarioCatalogItem
  difficulty: number
  setDifficulty: (v: number) => void
  isStarting: boolean
  onStart: () => void
}

function StartBlock({
  scenario,
  difficulty,
  setDifficulty,
  isStarting,
  onStart,
}: StartBlockProps) {
  const recommendedPreset = normalizeStartDifficulty(scenario.recommended_difficulty)

  return (
    <div className="border border-neutral-950 bg-white p-5 sm:p-7">
      <div className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#B74707]">
        Material pressure scan
      </div>
      <h3 className="mb-4 font-display text-[24px] font-black leading-tight text-neutral-950">
        Проверить материал бесплатно
      </h3>

      <p className="mb-6 font-inter text-[15px] leading-relaxed text-neutral-600">
        Вставьте документ, презентацию, отчёт или тезисы. PeakTalk задаст первые критические вопросы как будущий оппонент.
      </p>

      <div className="mb-5">
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Уровень давления
        </div>
        <div className="flex flex-col gap-2">
          {START_PRESSURE_OPTIONS.map((opt) => {
            const isSelected = difficulty === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDifficulty(opt.value)}
                className={`flex items-center justify-between border px-3 py-2.5 text-left transition-all ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <span
                  className={`font-inter text-sm ${
                    isSelected
                      ? 'font-semibold text-neutral-900'
                      : 'text-neutral-500'
                  }`}
                >
                  {opt.label}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 font-mono text-[10px] ${
                      isSelected
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {opt.range}
                  </span>
                  {isSelected && (
                    <CheckCircle2 size={13} className="text-neutral-900" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {scenario.recommended_difficulty && (
        <div className="mb-4 flex items-center gap-1.5 font-inter text-xs text-neutral-400">
          <span className="h-1.5 w-1.5 bg-[#E8600A]" />
          Рекомендованный уровень:{' '}
          {START_PRESSURE_OPTIONS.find((d) => d.value === recommendedPreset)?.label}
        </div>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={isStarting}
        className="flex min-h-[56px] w-full items-center justify-center gap-3 border border-[#E8600A] bg-[#E8600A] font-inter text-[15px] font-bold text-white transition-colors duration-200 hover:border-[#B74707] hover:bg-[#B74707] disabled:opacity-50"
      >
        {isStarting ? 'Готовим scan...' : 'Проверить материал'}
        {isStarting ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
      </button>

      <p className="mt-2 text-center font-mono text-[11px] text-neutral-400">
        Без регистрации для первой проверки
      </p>
    </div>
  )
}
