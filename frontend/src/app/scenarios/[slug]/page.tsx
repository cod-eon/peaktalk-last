'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import {
  getScenario,
  startFromScenario,
} from '@/lib/scenarios-api'
import { createClient } from '@/lib/supabase/client'
import {
  enrichScenario,
  getFallbackScenarioBySlug,
  normalizeScenarioDisplayDifficulty,
  normalizeStartDifficulty,
  START_PRESSURE_OPTIONS,
  type ScenarioCatalogItem,
} from '@/lib/scenarios-catalog'

// ─── Hardcoded example questions by category ─────────────────────────────────

const EXAMPLE_QUESTIONS: Record<string, string[]> = {
  budget: [
    'Покажите unit-экономику',
    'Что будет, если мы срежем это на 50%?',
    'Какая альтернатива?',
  ],
  roadmap: [
    'Почему именно сейчас?',
    'Что вы не сделаете ради этого?',
    'Как это влияет на текущий план?',
  ],
  investors: [
    'Почему этот рынок?',
    'Что не работает в вашей модели?',
    'Почему вы, а не конкурент?',
  ],
  clients: [
    'Что конкретно пошло не так?',
    'Почему мы должны вам доверять?',
    'Какие гарантии?',
  ],
  people: [
    'Почему именно такое решение?',
    'Что изменится после?',
    'Как вы это измерите?',
  ],
  crisis: [
    'Кто виноват?',
    'Почему это не было предотвращено?',
    'Что конкретно изменится?',
  ],
}

// ─── Category meta ────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { label: string; color: string; textColor: string }
> = {
  budget: { label: 'Бюджет', color: 'bg-blue-50', textColor: 'text-blue-700' },
  roadmap: { label: 'Roadmap', color: 'bg-violet-50', textColor: 'text-violet-700' },
  investors: { label: 'Инвесторы', color: 'bg-amber-50', textColor: 'text-amber-700' },
  clients: { label: 'Клиенты', color: 'bg-emerald-50', textColor: 'text-emerald-700' },
  people: { label: 'Люди', color: 'bg-pink-50', textColor: 'text-pink-700' },
  crisis: { label: 'Кризис', color: 'bg-red-50', textColor: 'text-red-700' },
}

// ─── Difficulty selector ──────────────────────────────────────────────────────

function DifficultyDots({ value }: { value: number }) {
  const safeValue = normalizeScenarioDisplayDifficulty(value)

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < safeValue ? 'bg-neutral-700' : 'bg-neutral-200'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScenarioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [scenario, setScenario] = useState<ScenarioCatalogItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<number>(5)
  const [isStarting, setIsStarting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  // Check auth state
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user)
    })
  }, [])

  // Load scenario
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      setStartError(null)
      setIsUsingFallback(false)
      try {
        const data = await getScenario(slug)
        const enrichedScenario = enrichScenario(data)
        setScenario(enrichedScenario)
        setDifficulty(normalizeStartDifficulty(enrichedScenario.recommended_difficulty))
        setIsUsingFallback(false)
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

  const handleStart = async () => {
    if (!scenario || isStarting) return

    setStartError(null)

    if (!isLoggedIn) {
      router.push(`/register?return=/scenarios/${slug}`)
      return
    }

    setIsStarting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setIsStarting(false)
        router.push(`/register?return=/scenarios/${slug}`)
        return
      }

      const res = await startFromScenario(scenario.id, difficulty, session.access_token)
      if (res?.id) {
        router.push(`/simulation/${res.id}`)
      } else {
        throw new Error('Не удалось получить ID симуляции')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка запуска'
      setStartError(msg)
      setIsStarting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="h-14 border-b border-neutral-200 flex items-center px-5">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
            <span className="brand-wordmark text-neutral-900 text-[15px]">PeakTalk</span>
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-neutral-400" size={28} />
        </div>
      </div>
    )
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="h-14 border-b border-neutral-200 flex items-center px-5">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
            <span className="brand-wordmark text-neutral-900 text-[15px]">PeakTalk</span>
          </Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <AlertCircle size={32} className="text-neutral-300" />
          <p className="font-inter text-neutral-500 text-sm">
            {error ?? 'Сценарий не найден'}
          </p>
          <Link
            href="/scenarios"
            className="font-inter text-sm font-medium text-neutral-900 underline underline-offset-2"
          >
            Все сценарии
          </Link>
        </div>
      </div>
    )
  }

  const categoryMeta = CATEGORY_META[scenario.category] ?? {
    label: scenario.category,
    color: 'bg-neutral-100',
    textColor: 'text-neutral-700',
  }
  const exampleQuestions = EXAMPLE_QUESTIONS[scenario.category] ?? []

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-neutral-200 flex items-center justify-between px-5 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
          <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
          <span className="brand-wordmark text-neutral-900 text-[15px]">PeakTalk</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-mono text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="bg-[#171717] hover:bg-black text-white font-inter font-semibold text-xs px-4 py-2 transition-colors"
          >
            Начать
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href="/scenarios"
          className="inline-flex items-center gap-1.5 font-inter text-sm text-neutral-400 hover:text-neutral-900 transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Все сценарии
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main content */}
          <div className="lg:col-span-2">
            {isUsingFallback && (
              <div className="mb-6 flex items-start gap-3 border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p className="font-inter text-sm leading-relaxed">
                  Показываем встроенное описание сценария, потому что API каталога сейчас недоступен.
                </p>
              </div>
            )}

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Category + difficulty + persona row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-none ${categoryMeta.color} ${categoryMeta.textColor}`}
                >
                  {categoryMeta.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <DifficultyDots value={scenario.difficulty} />
                </div>
                <span className="font-mono text-xs text-neutral-400">
                  {scenario.persona}
                </span>
              </div>

              <h1 className="font-inter font-bold text-2xl sm:text-3xl text-neutral-900 leading-tight tracking-tight mb-2">
                {scenario.title}
              </h1>
              <p className="font-inter text-neutral-500 text-sm mb-6">
                {scenario.subtitle}
              </p>
            </motion.div>

            {/* Situation block */}
            {scenario.situation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-8"
              >
                <h2 className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3 border-b border-neutral-200 pb-2">
                  Ситуация
                </h2>
                <div className="font-inter text-sm text-neutral-700 leading-relaxed space-y-3">
                  {scenario.situation.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Example questions */}
            {exampleQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="mb-8"
              >
                <h2 className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3 border-b border-neutral-200 pb-2">
                  Типичные вопросы на этой встрече
                </h2>
                <div className="flex flex-col gap-2">
                  {exampleQuestions.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 bg-neutral-50 border border-neutral-200"
                    >
                      <span className="font-mono text-[10px] text-neutral-400 shrink-0 mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-inter text-sm text-neutral-700">
                        {q}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Mobile CTA (shown below content) */}
            <div className="lg:hidden">
              <StartBlock
                scenario={scenario}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                isLoggedIn={isLoggedIn}
                isStarting={isStarting}
                onStart={handleStart}
                slug={slug}
                startError={startError}
              />
            </div>
          </div>

          {/* Sidebar: Start block (desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <StartBlock
                scenario={scenario}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                isLoggedIn={isLoggedIn}
                isStarting={isStarting}
                onStart={handleStart}
                slug={slug}
                startError={startError}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Start block ──────────────────────────────────────────────────────────────

interface StartBlockProps {
  scenario: ScenarioCatalogItem
  difficulty: number
  setDifficulty: (v: number) => void
  isLoggedIn: boolean | null
  isStarting: boolean
  onStart: () => void
  slug: string
  startError: string | null
}

function StartBlock({
  scenario,
  difficulty,
  setDifficulty,
  isLoggedIn,
  isStarting,
  onStart,
  slug,
  startError,
}: StartBlockProps) {
  const recommendedPreset = normalizeStartDifficulty(scenario.recommended_difficulty)

  return (
    <div className="bg-white border border-neutral-200 p-5 sm:p-6">
      <h3 className="font-inter font-semibold text-sm text-neutral-900 mb-4">
        Начать стресс-тест по этому сценарию
      </h3>

      <p className="font-inter text-sm text-neutral-500 leading-relaxed mb-5">
        Сценарий уже настроит контекст разговора. Остаётся выбрать уровень давления и запустить сессию.
      </p>

      {/* Difficulty selector */}
      <div className="mb-5">
        <div className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-2.5">
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
                className={`flex items-center justify-between px-3 py-2.5 border text-left transition-all ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <span
                  className={`font-inter text-sm ${
                    isSelected ? 'font-semibold text-neutral-900' : 'text-neutral-500'
                  }`}
                >
                  {opt.label}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 ${
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

      {/* Recommended badge */}
      {scenario.recommended_difficulty && (
        <div className="flex items-center gap-1.5 mb-4 text-xs text-neutral-400 font-inter">
          <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full" />
          Рекомендованный уровень:{' '}
          {START_PRESSURE_OPTIONS.find((d) => d.value === recommendedPreset)?.label}
        </div>
      )}

      {/* CTA */}
      {isLoggedIn === false ? (
        <Link
          href={`/register?return=/scenarios/${slug}`}
          className="w-full bg-[#171717] hover:bg-black text-white font-inter font-semibold text-sm h-12 flex items-center justify-center gap-2 transition-colors"
        >
          Зарегистрироваться и начать
          <ChevronRight size={16} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting || isLoggedIn === null}
          className="w-full bg-[#171717] hover:bg-black text-white font-inter font-semibold text-sm h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Начать стресс-тест
              <ChevronRight size={16} />
            </>
          )}
        </button>
      )}

      {isLoggedIn === false && (
        <p className="text-center font-mono text-[11px] text-neutral-400 mt-2">
          Первые 3 сессии — бесплатно
        </p>
      )}

      {startError && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span className="font-inter leading-relaxed">{startError}</span>
        </div>
      )}
    </div>
  )
}
