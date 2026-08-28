'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, FileText, Loader2, Target } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  getScenarios,
  getScenarioCategories,
  type ScenarioCategory,
} from '@/lib/scenarios-api'
import {
  enrichScenario,
  getFallbackScenarioBySlug,
  getFallbackScenarios,
  normalizeScenarioDisplayDifficulty,
  type ScenarioCatalogItem,
} from '@/lib/scenarios-catalog'
import {
  SCENARIO_ANALYTICS_EVENTS,
  trackScenarioCatalogEvent,
  trackScenarioEvent,
} from '@/lib/scenario-analytics'

const WEDGE_SCENARIO_SLUG = 'roadmap-budget-defense'

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { label: string; accent: string }
> = {
  all: { label: 'Все', accent: 'Все сценарии' },
  budget: { label: 'Бюджет', accent: 'Финансы' },
  roadmap: { label: 'Roadmap', accent: 'CEO / CFO' },
  investors: { label: 'Инвесторы', accent: 'Инвестор' },
  clients: { label: 'Клиенты', accent: 'Эскалация' },
  people: { label: 'Люди', accent: 'HR / менеджмент' },
  crisis: { label: 'Кризис', accent: 'Разбор инцидента' },
}

function prioritizeWedgeScenario(
  items: ScenarioCatalogItem[],
  category = 'all'
): ScenarioCatalogItem[] {
  const wedge = getFallbackScenarioBySlug(WEDGE_SCENARIO_SLUG)

  if (!wedge || (category !== 'all' && category !== wedge.category)) {
    return items
  }

  const existing = items.find((item) => item.slug === WEDGE_SCENARIO_SLUG)
  const preferredScenario = existing ?? wedge

  return [
    preferredScenario,
    ...items.filter((item) => item.slug !== WEDGE_SCENARIO_SLUG),
  ]
}

// ─── Scenario card ────────────────────────────────────────────────────────────

function DifficultyDots({ value }: { value: number }) {
  const max = 5
  const safeValue = normalizeScenarioDisplayDifficulty(value)

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Сложность ${safeValue} из ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 ${
            i < safeValue ? 'bg-[#E8600A]' : 'bg-neutral-300'
          }`}
        />
      ))}
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.all

  return (
    <span className="inline-flex min-h-7 items-center border border-neutral-300 bg-[#FAF8F4] px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-600">
      {meta.label}
    </span>
  )
}

function ScenarioCard({
  scenario,
  position,
}: {
  scenario: ScenarioCatalogItem
  position: number
}) {
  const pressure = scenario.pressure ?? scenario.problem ?? scenario.subtitle
  const output =
    scenario.expectedOutput?.find((item) => /Defense Brief/i.test(item)) ??
    scenario.expectedOutput?.[0] ??
    'Первые критические вопросы и слабые места до встречи.'

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group border border-black/[0.08] border-l-neutral-950 bg-white transition-colors hover:border-neutral-950"
    >
      <Link
        href={`/scenarios/${scenario.slug}`}
        onClick={() =>
          trackScenarioEvent(SCENARIO_ANALYTICS_EVENTS.cardClicked, scenario, {
            source: 'scenario_catalog',
            card_position: position,
          })
        }
        className="flex min-h-[310px] flex-col p-5 sm:p-6"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <CategoryBadge category={scenario.category} />
          <DifficultyDots value={scenario.difficulty} />
        </div>

        <h3 className="font-display text-[21px] font-black leading-tight text-neutral-950">
          {scenario.title}
        </h3>
        <p className="mt-3 font-inter text-[14px] leading-relaxed text-neutral-600 line-clamp-2">
          {scenario.subtitle}
        </p>

        <div className="mt-6 space-y-4 border-t border-black/[0.08] pt-5">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
              Давление
            </div>
            <p className="mt-1.5 font-inter text-[13px] leading-relaxed text-neutral-700 line-clamp-3">
              {pressure}
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
              Выход
            </div>
            <p className="mt-1.5 font-inter text-[13px] leading-relaxed text-neutral-700 line-clamp-2">
              {output}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
            {scenario.persona}
          </span>
          <span className="flex h-9 w-9 items-center justify-center border border-neutral-200 bg-[#FAF8F4] text-neutral-950 transition-colors group-hover:border-[#E8600A] group-hover:bg-[#E8600A] group-hover:text-white">
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}

function WedgePanel({ scenario }: { scenario: ScenarioCatalogItem }) {
  return (
    <section className="mb-10 grid border border-neutral-950 bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <div className="min-w-0 border-b border-neutral-950 bg-neutral-950 p-6 text-white sm:p-8 lg:border-b-0 lg:border-r">
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FF8A3D]">
          Основной сценарий validation sprint
        </div>
        <h2 className="mt-5 font-display text-[30px] font-black leading-tight sm:text-[40px]">
          {scenario.title}
        </h2>
        <p className="mt-5 max-w-xl font-inter text-[15px] leading-relaxed text-white/70">
          {scenario.subtitle}. Это не общий тренажёр переговоров, а проверка
          конкретной защиты перед дорогой управленческой встречей.
        </p>
        <Link
          href={`/scenarios/${scenario.slug}`}
          onClick={() =>
            trackScenarioEvent(SCENARIO_ANALYTICS_EVENTS.primaryCtaClicked, scenario, {
              source: 'scenario_catalog',
              cta_location: 'wedge_panel',
            })
          }
          className="mt-7 inline-flex min-h-[46px] items-center justify-center gap-2 border border-[#E8600A] bg-[#E8600A] px-5 font-inter text-[14px] font-bold text-white transition-colors hover:border-[#B74707] hover:bg-[#B74707]"
        >
          Открыть сценарий
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid divide-y divide-black/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          ['ICP', 'Head of Product / Product Lead / CPO'],
          ['Оппонент', scenario.persona],
          ['Артефакт', 'Defense Brief'],
        ].map(([label, value]) => (
          <div key={label} className="p-5 sm:p-6">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
              {label}
            </div>
            <p className="mt-3 break-words font-inter text-[15px] font-bold leading-snug text-neutral-950">
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScenariosPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [scenarios, setScenarios] = useState<ScenarioCatalogItem[]>([])
  const [catalog, setCatalog] = useState<ScenarioCatalogItem[]>([])
  const [categories, setCategories] = useState<ScenarioCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [loadNotice, setLoadNotice] = useState<string | null>(null)
  const hasInitializedCategoryFilter = useRef(false)
  const catalogViewKeyRef = useRef<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setLoadNotice(null)

      try {
        const [scenariosRes, categoriesRes] = await Promise.allSettled([
          getScenarios(),
          getScenarioCategories(),
        ])

        if (scenariosRes.status === 'fulfilled' && Array.isArray(scenariosRes.value?.items)) {
          const items = prioritizeWedgeScenario(
            scenariosRes.value.items.map(enrichScenario)
          )

          if (items.length > 0) {
            setCatalog(items)
            setScenarios(items)
            setIsUsingFallback(false)
          } else {
            const fallbackItems = prioritizeWedgeScenario(getFallbackScenarios())
            setCatalog(fallbackItems)
            setScenarios(fallbackItems)
            setIsUsingFallback(true)
            setLoadNotice('Каталог временно работает на встроенных сценариях. Запуск стресс-теста остаётся доступным.')
          }
        } else {
          const fallbackItems = prioritizeWedgeScenario(getFallbackScenarios())
          setCatalog(fallbackItems)
          setScenarios(fallbackItems)
          setIsUsingFallback(true)
          setLoadNotice('Каталог временно работает на встроенных сценариях. Запуск стресс-теста остаётся доступным.')
        }

        if (
          categoriesRes.status === 'fulfilled' &&
          Array.isArray(categoriesRes.value) &&
          categoriesRes.value.length > 0
        ) {
          setCategories(categoriesRes.value)
        }
      } catch {
        const fallbackItems = prioritizeWedgeScenario(getFallbackScenarios())
        setCatalog(fallbackItems)
        setScenarios(fallbackItems)
        setIsUsingFallback(true)
        setLoadNotice('Каталог временно работает на встроенных сценариях. Запуск стресс-теста остаётся доступным.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (isLoading) return

    if (!hasInitializedCategoryFilter.current) {
      hasInitializedCategoryFilter.current = true
      return
    }

    if (isUsingFallback) {
      // Recompute the embedded catalog when its category changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScenarios(
        prioritizeWedgeScenario(
          getFallbackScenarios(activeCategory),
          activeCategory
        )
      )
      return
    }

    let isCancelled = false

    async function filterScenarios() {
      try {
        const res = await getScenarios(
          activeCategory !== 'all' ? activeCategory : undefined
        )

        if (isCancelled) return

        const items = prioritizeWedgeScenario(
          res.items.map(enrichScenario),
          activeCategory
        )

        if (items.length > 0) {
          setScenarios(items)
        } else {
          setScenarios(
            prioritizeWedgeScenario(
              getFallbackScenarios(activeCategory),
              activeCategory
            )
          )
          setIsUsingFallback(true)
          setLoadNotice('Для этой категории временно показываем встроенные сценарии.')
        }
      } catch {
        if (isCancelled) return

        setScenarios(
          prioritizeWedgeScenario(
            getFallbackScenarios(activeCategory),
            activeCategory
          )
        )
        setIsUsingFallback(true)
        setLoadNotice('API сценариев недоступен, поэтому фильтр временно работает на встроенном каталоге.')
      }
    }

    filterScenarios()

    return () => {
      isCancelled = true
    }
  }, [activeCategory, isLoading, isUsingFallback])

  const tabs = useMemo(
    () => [
      { id: 'all', label: 'Все', count: null as number | null },
      ...(categories.length > 0
        ? categories.map((c) => ({
            id: c.id,
            label: CATEGORY_META[c.id]?.label ?? c.label,
            count: c.count,
          }))
        : Object.entries(CATEGORY_META)
            .filter(([id]) => id !== 'all')
            .map(([id, meta]) => ({ id, label: meta.label, count: null }))),
    ],
    [categories]
  )

  const featuredScenario =
    catalog.find((item) => item.slug === WEDGE_SCENARIO_SLUG) ??
    getFallbackScenarioBySlug(WEDGE_SCENARIO_SLUG)

  useEffect(() => {
    if (isLoading) return

    const key = `${activeCategory}:${isUsingFallback}:${scenarios.length}:${featuredScenario?.slug ?? ''}`
    if (catalogViewKeyRef.current === key) return
    catalogViewKeyRef.current = key

    trackScenarioCatalogEvent({
      category: activeCategory,
      result_count: scenarios.length,
      using_fallback: isUsingFallback,
      featured_slug: featuredScenario?.slug ?? null,
    })
  }, [activeCategory, featuredScenario?.slug, isLoading, isUsingFallback, scenarios.length])

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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <section className="mb-8 grid gap-8 border-b border-neutral-950 pb-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:items-end">
          <div className="min-w-0">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[#B74707] sm:tracking-[0.16em]">
              <span className="sm:hidden">Scenario catalog</span>
              <span className="hidden sm:inline">
                Scenario catalog / professional pressure-testing
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl break-words font-display text-[34px] font-black leading-[1.04] text-neutral-950 sm:text-[60px] sm:leading-[1.02]">
              Сценарии рабочих защит
            </h1>
            <p className="mt-6 max-w-2xl font-inter text-[17px] leading-relaxed text-neutral-600">
              Каталог не для “прокачки общения”. Выберите конкретную дорогую
              встречу, вставьте материал и проверьте, где защита не выдержит
              CEO, CFO, board, инвестора или ключевого клиента.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/scenarios/${WEDGE_SCENARIO_SLUG}`}
                onClick={() => {
                  if (!featuredScenario) return
                  trackScenarioEvent(SCENARIO_ANALYTICS_EVENTS.primaryCtaClicked, featuredScenario, {
                    source: 'scenario_catalog',
                    cta_location: 'hero',
                  })
                }}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 font-inter text-[14px] font-bold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]"
              >
                Начать с Roadmap / Budget Defense
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/simulation/guest"
                className="inline-flex min-h-[48px] items-center justify-center border border-neutral-300 bg-white px-5 font-inter text-[14px] font-bold text-neutral-950 transition-colors hover:border-neutral-950"
              >
                Быстрый pressure scan
              </Link>
            </div>
          </div>

          <div className="min-w-0 border border-neutral-950 bg-neutral-950 p-5 text-white sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FF8A3D]">
                Defense Brief
              </div>
              <Target size={18} className="text-[#FF8A3D]" />
            </div>
            <p className="break-words font-display text-[24px] font-black leading-tight sm:text-[26px]">
              Roadmap, budget, weak spots, hostile questions, Defense Brief.
            </p>
            <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
              {[
                ['Материал', 'Roadmap, budget memo, KPI, risks'],
                ['Оппонент', 'CEO / CFO / founder / board'],
                ['Цель', 'Защитить приоритеты и деньги до реальной встречи'],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[96px_1fr] sm:gap-4">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                    {label}
                  </span>
                  <span className="break-words font-inter text-[13px] font-semibold leading-relaxed text-white/80">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {featuredScenario && <WedgePanel scenario={featuredScenario} />}

        {loadNotice && (
          <div className="mb-6 flex items-start gap-3 border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p className="font-inter text-sm leading-relaxed">{loadNotice}</p>
          </div>
        )}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-[28px] font-black text-neutral-950">
              Каталог pressure tests
            </h2>
            <p className="mt-2 max-w-2xl font-inter text-[14px] leading-relaxed text-neutral-500">
              Фильтры оставлены для выбора контекста, но validation sprint
              начинается с roadmap/budget защиты для product leaders.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400">
            <FileText size={14} />
            {scenarios.length || catalog.length} сценариев
          </div>
        </div>

        <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`flex min-h-[40px] shrink-0 items-center gap-1.5 border px-3.5 font-mono text-xs font-bold transition-colors ${
                  isActive
                    ? 'border-neutral-950 bg-neutral-950 text-white'
                    : 'border-neutral-300 bg-white text-neutral-500 hover:border-neutral-950 hover:text-neutral-950'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={isActive ? 'opacity-75' : 'opacity-50'}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="animate-spin text-neutral-400" size={28} />
          </div>
        ) : scenarios.length === 0 ? (
          <div className="border border-dashed border-neutral-300 bg-white py-16 text-center">
            <p className="font-inter text-sm text-neutral-400">
              Сценариев в этой категории пока нет
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {scenarios.map((scenario, index) => (
              <ScenarioCard key={scenario.id} scenario={scenario} position={index + 1} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
