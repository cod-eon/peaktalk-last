'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import {
  getScenarios,
  getScenarioCategories,
  type ScenarioCategory,
} from '@/lib/scenarios-api'
import {
  enrichScenario,
  getFallbackScenarios,
  getScenarioOfTheDay,
  normalizeScenarioDisplayDifficulty,
  type ScenarioCatalogItem,
} from '@/lib/scenarios-catalog'

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { label: string; accent: string }
> = {
  all: { label: 'Все', accent: 'Все сценарии' },
  budget: { label: 'Бюджет', accent: 'Финансы' },
  roadmap: { label: 'Roadmap', accent: 'Руководство' },
  investors: { label: 'Инвесторы', accent: 'Инвестор' },
  clients: { label: 'Клиенты', accent: 'Эскалация' },
  people: { label: 'Люди', accent: 'HR / менеджмент' },
  crisis: { label: 'Кризис', accent: 'Разбор инцидента' },
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
            i < safeValue ? 'bg-[#E8600A]' : 'bg-neutral-200'
          }`}
        />
      ))}
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META['all']
  return (
    <span className="inline-block border border-neutral-200 bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-600">
      {meta.label}
    </span>
  )
}

function ScenarioCard({ scenario }: { scenario: ScenarioCatalogItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col border border-black/[0.08] bg-white transition-all hover:border-neutral-950 hover:shadow-sm"
    >
      <Link href={`/scenarios/${scenario.slug}`} className="flex h-full flex-col p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <CategoryBadge category={scenario.category} />
          <DifficultyDots value={scenario.difficulty} />
        </div>

        <h3 className="font-display text-[22px] font-black leading-tight text-neutral-950">
          {scenario.title}
        </h3>
        <p className="mt-4 font-inter text-[15px] leading-relaxed text-neutral-500 line-clamp-2">
          {scenario.problem ?? scenario.subtitle}
        </p>

        <div className="mt-8 flex items-center justify-between border-t border-black/[0.04] pt-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400 transition-colors group-hover:text-neutral-950">
            {scenario.persona}
          </span>
          <div className="flex h-8 w-8 items-center justify-center bg-neutral-100 text-neutral-950 transition-colors group-hover:bg-[#E8600A] group-hover:text-white">
            <ArrowRight size={16} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function ScenarioOfTheDay({ scenario }: { scenario: ScenarioCatalogItem }) {
  return (
    <section className="mb-12 border border-neutral-950 bg-neutral-950 p-6 sm:p-10 text-white transition-colors hover:border-[#E8600A]">
      <Link href={`/scenarios/${scenario.slug}`} className="group block">
        <div className="mb-6 inline-flex border border-[#E8600A]/40 bg-[#E8600A]/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#FF8A3D]">
          Сценарий дня
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-[28px] font-black leading-tight tracking-tight sm:text-[42px]">
              {scenario.title}
            </h2>
            <div className="mt-8 flex items-center gap-4 text-xs">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#FF8A3D]">
                {scenario.persona}
              </span>
              <DifficultyDots value={scenario.difficulty} />
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <p className="font-inter text-[16px] leading-relaxed text-white/70">
              {scenario.problem ?? scenario.subtitle}
            </p>
            <div className="mt-8 flex items-center gap-3 text-[14px] font-bold text-white transition-colors group-hover:text-[#FF8A3D]">
              Открыть сценарий <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </Link>
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

  // Load categories and scenarios
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
          const items = scenariosRes.value.items.map(enrichScenario)
          if (items.length > 0) {
            setCatalog(items)
            setScenarios(items)
            setIsUsingFallback(false)
          } else {
            const fallbackItems = getFallbackScenarios()
            setCatalog(fallbackItems)
            setScenarios(fallbackItems)
            setIsUsingFallback(true)
            setLoadNotice('Каталог временно работает на встроенных сценариях. Запуск симуляции остаётся доступным.')
          }
        } else {
          const fallbackItems = getFallbackScenarios()
          setCatalog(fallbackItems)
          setScenarios(fallbackItems)
          setIsUsingFallback(true)
          setLoadNotice('Каталог временно работает на встроенных сценариях. Запуск симуляции остаётся доступным.')
        }

        if (
          categoriesRes.status === 'fulfilled' &&
          Array.isArray(categoriesRes.value) &&
          categoriesRes.value.length > 0
        ) {
          setCategories(categoriesRes.value)
        }
      } catch {
        const fallbackItems = getFallbackScenarios()
        setCatalog(fallbackItems)
        setScenarios(fallbackItems)
        setIsUsingFallback(true)
        setLoadNotice('Каталог временно работает на встроенных сценариях. Запуск симуляции остаётся доступным.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Reload when category filter changes
  useEffect(() => {
    if (isLoading) return

    if (!hasInitializedCategoryFilter.current) {
      hasInitializedCategoryFilter.current = true
      return
    }

    if (isUsingFallback) {
      setScenarios(getFallbackScenarios(activeCategory))
      return
    }

    let isCancelled = false

    async function filterScenarios() {
      try {
        const res = await getScenarios(
          activeCategory !== 'all' ? activeCategory : undefined
        )

        if (isCancelled) return

        const items = res.items.map(enrichScenario)
        if (items.length > 0) {
          setScenarios(items)
        } else {
          setScenarios(getFallbackScenarios(activeCategory))
          setIsUsingFallback(true)
          setLoadNotice('Для этой категории временно показываем встроенные сценарии.')
        }
      } catch {
        if (isCancelled) return

        setScenarios(getFallbackScenarios(activeCategory))
        setIsUsingFallback(true)
        setLoadNotice('API сценариев недоступен, поэтому фильтр временно работает на встроенном каталоге.')
      }
    }

    filterScenarios()

    return () => {
      isCancelled = true
    }
  }, [activeCategory, isLoading, isUsingFallback])

  // Build tab list — always include "Все", then API categories or fallback
  const tabs = [
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
  ]
  const dailyScenario = getScenarioOfTheDay(catalog)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal public header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/[0.08] bg-white px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-75"
          aria-label="PeakTalk"
        >
          <Image src="/logo_svg.svg" alt="PeakTalk" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" />
          <span className="brand-wordmark text-[18px] text-neutral-950">PeakTalk</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-neutral-950"
          >
            Вход
          </Link>
          <Link
            href="/simulation/guest"
            className="inline-flex min-h-[44px] items-center justify-center border border-neutral-950 bg-neutral-950 px-5 font-inter text-[13px] font-bold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]"
          >
            3 вопроса
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        {/* Page header */}
        <div className="mb-12 max-w-3xl">
          <h1 className="font-display text-[42px] font-black leading-[1.05] text-neutral-950 sm:text-[56px]">
            Сценарии проверок
          </h1>
          <p className="mt-6 font-inter text-[18px] leading-relaxed text-neutral-500">
            Каталог типовых рабочих ситуаций для стресс-теста аргументации. Выберите сценарий и проверьте свой материал на прочность до реальной встречи.
          </p>
        </div>

        {dailyScenario && <ScenarioOfTheDay scenario={dailyScenario} />}

        {loadNotice && (
          <div className="mb-6 flex items-start gap-3 border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="font-inter text-sm leading-relaxed">{loadNotice}</p>
          </div>
        )}

        {/* Category filter tabs */}
        <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 border px-3.5 py-2 font-mono text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span
                    className={`text-[10px] ${
                      isActive ? 'opacity-75' : 'opacity-50'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="animate-spin text-neutral-400" size={28} />
          </div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-inter text-neutral-400 text-sm">
              Сценариев в этой категории пока нет
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
