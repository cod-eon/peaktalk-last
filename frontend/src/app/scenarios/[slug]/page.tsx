'use client'

import React, { useEffect, useState } from 'react'
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
import { getScenario, startFromScenario } from '@/lib/scenarios-api'
import { createClient } from '@/lib/supabase/client'
import {
  START_PRESSURE_OPTIONS,
  enrichScenario,
  getFallbackScenarioBySlug,
  normalizeScenarioDisplayDifficulty,
  normalizeStartDifficulty,
  type ScenarioCatalogItem,
} from '@/lib/scenarios-catalog'

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
    'Короткая prep-card перед встречей.',
  ]
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
    if (!scenario || isStarting || isUsingFallback) {
      router.push('/simulation/guest')
      return
    }

    setIsStarting(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        router.push('/simulation/guest')
        return
      }

      const started = await startFromScenario(scenario.id, difficulty, token)
      router.push(`/simulation/${started.id}`)
    } catch {
      router.push('/simulation/guest')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Shell>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <Link
          href="/scenarios"
          className="mb-8 inline-flex items-center gap-1.5 font-inter text-sm text-neutral-400 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft size={15} />
          Все сценарии
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            {isUsingFallback && (
              <div className="mb-6 flex items-start gap-3 border border-[#E8600A]/30 bg-[#E8600A]/[0.06] px-4 py-3 text-[#8F3705]">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p className="font-inter text-sm leading-relaxed">
                  Показываем встроенное описание сценария, потому что API каталога сейчас недоступен.
                </p>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-block border border-neutral-200 bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-600">
                  {categoryMeta.label}
                </span>
                <DifficultyDots value={scenario.difficulty} />
                <span className="font-mono text-xs text-neutral-400">
                  {scenario.persona}
                </span>
              </div>

              <h1 className="font-inter text-[32px] font-black leading-[1.04] text-neutral-950 sm:text-[46px]">
                {scenario.title}
              </h1>
              <p className="mt-5 max-w-2xl font-inter text-base leading-relaxed text-neutral-600">
                {scenario.subtitle}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="my-8 grid border border-neutral-200 bg-white sm:grid-cols-3"
            >
              {[
                ['Оппонент', scenario.persona],
                ['Фокус', categoryMeta.role],
                ['Результат', 'вопросы / риски / prep-card'],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={`p-4 ${
                    index > 0
                      ? 'border-t border-neutral-200 sm:border-l sm:border-t-0'
                      : ''
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                    {label}
                  </div>
                  <div className="mt-1 text-sm font-bold text-neutral-950">
                    {value}
                  </div>
                </div>
              ))}
            </motion.div>

            {(scenario.problem || scenario.pressure) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-8 grid gap-4 sm:grid-cols-2"
              >
                {scenario.problem && (
                  <InfoPanel label="Проблема" text={scenario.problem} />
                )}
                {scenario.pressure && (
                  <InfoPanel label="Кто давит" text={scenario.pressure} tone="risk" />
                )}
              </motion.div>
            )}

            {scenario.situation && (
              <TextBlock title="Контекст встречи" text={scenario.situation} />
            )}

            <SectionList
              title="Что вставить в PeakTalk"
              items={whatToPrepare}
              marker="мат"
            />

            <SectionList
              title="Примеры вопросов"
              items={exampleQuestions}
              marker="вопр"
            />

            <SectionList
              title="Что получите"
              items={expectedOutput}
              marker="итог"
            />

            {faq.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-8"
              >
                <h2 className="mb-3 border-b border-neutral-200 pb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                  FAQ
                </h2>
                <div className="grid gap-3">
                  {faq.map((item) => (
                    <div
                      key={item.question}
                      className="border border-neutral-200 bg-white p-4"
                    >
                      <h3 className="font-inter text-sm font-bold text-neutral-950">
                        {item.question}
                      </h3>
                      <p className="mt-2 font-inter text-sm leading-relaxed text-neutral-600">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="lg:hidden">
              <StartBlock
                scenario={scenario}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                isStarting={isStarting}
                onStart={handleStartScenario}
              />
            </div>
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
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-75"
        >
          <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
          <span className="brand-wordmark text-[15px] text-neutral-900">
            PeakTalk
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-mono text-xs uppercase tracking-widest text-neutral-400 transition-colors hover:text-neutral-900"
          >
            Войти
          </Link>
          <Link
            href="/simulation/guest"
            className="border border-neutral-950 bg-neutral-950 px-4 py-2 font-inter text-xs font-semibold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]"
          >
            3 вопроса
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}

function InfoPanel({
  label,
  text,
  tone = 'default',
}: {
  label: string
  text: string
  tone?: 'default' | 'risk'
}) {
  return (
    <div
      className={`border p-5 ${
        tone === 'risk'
          ? 'border-[#E8600A]/30 bg-[#E8600A]/[0.04]'
          : 'border-neutral-200 bg-white'
      }`}
    >
      <div
        className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
          tone === 'risk' ? 'text-[#B74707]' : 'text-neutral-400'
        }`}
      >
        {label}
      </div>
      <p className="mt-3 font-inter text-sm leading-relaxed text-neutral-700">
        {text}
      </p>
    </div>
  )
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
      className="mb-8"
    >
      <h2 className="mb-3 border-b border-neutral-200 pb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
        {title}
      </h2>
      <div className="space-y-3 font-inter text-sm leading-relaxed text-neutral-700">
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
  marker,
}: {
  title: string
  items: string[]
  marker: string
}) {
  if (items.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.14 }}
      className="mb-8"
    >
      <h2 className="mb-3 border-b border-neutral-200 pb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
        {title}
      </h2>
      <div className="grid gap-2">
        {items.map((item, i) => (
          <div
            key={item}
            className="flex items-start gap-3 border border-neutral-200 bg-white p-3.5"
          >
            <span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#B74707]">
              {marker} {String(i + 1).padStart(2, '0')}
            </span>
            <span className="font-inter text-sm leading-relaxed text-neutral-700">
              {item}
            </span>
          </div>
        ))}
      </div>
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
    <div className="border border-neutral-950 bg-white p-5 sm:p-6">
      <h3 className="mb-4 font-inter text-xl font-black leading-tight text-neutral-950">
        Проверить свой материал в бесплатном режиме
      </h3>

      <p className="mb-5 font-inter text-sm leading-relaxed text-neutral-600">
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
        className="flex h-12 w-full items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 font-inter text-sm font-bold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]"
      >
        {isStarting ? 'Запускаем...' : 'Запустить сценарий'}
        {isStarting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
      </button>

      <p className="mt-2 text-center font-mono text-[11px] text-neutral-400">
        Без регистрации для первой проверки
      </p>
    </div>
  )
}
