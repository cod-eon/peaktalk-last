'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Loader2, AlertCircle, Sparkles } from 'lucide-react'
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
  { label: string; color: string; textColor: string }
> = {
  all: { label: 'Все', color: 'bg-neutral-100', textColor: 'text-neutral-700' },
  budget: { label: 'Бюджет', color: 'bg-blue-50', textColor: 'text-blue-700' },
  roadmap: { label: 'Roadmap', color: 'bg-violet-50', textColor: 'text-violet-700' },
  investors: { label: 'Инвесторы', color: 'bg-amber-50', textColor: 'text-amber-700' },
  clients: { label: 'Клиенты', color: 'bg-emerald-50', textColor: 'text-emerald-700' },
  people: { label: 'Люди', color: 'bg-pink-50', textColor: 'text-pink-700' },
  crisis: { label: 'Кризис', color: 'bg-red-50', textColor: 'text-red-700' },
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
          className={`w-1.5 h-1.5 rounded-full ${
            i < safeValue ? 'bg-neutral-700' : 'bg-neutral-200'
          }`}
        />
      ))}
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META['all']
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-none ${meta.color} ${meta.textColor}`}
    >
      {meta.label}
    </span>
  )
}

function ScenarioCard({ scenario }: { scenario: ScenarioCatalogItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 hover:border-neutral-400 transition-all group"
    >
      <div className="p-5">
        {/* Top row: category + persona */}
        <div className="flex items-center justify-between mb-3">
          <CategoryBadge category={scenario.category} />
          <span className="font-mono text-xs text-neutral-400">
            {scenario.persona}
          </span>
        </div>

        {/* Title + subtitle */}
        <h3 className="font-inter font-semibold text-sm text-neutral-900 mb-1 leading-snug">
          {scenario.title}
        </h3>
        <p className="font-inter text-xs text-neutral-500 leading-relaxed mb-4">
          {scenario.subtitle}
        </p>

        {/* Bottom row: difficulty + CTA */}
        <div className="flex items-center justify-between">
          <DifficultyDots value={scenario.difficulty} />
          <Link
            href={`/scenarios/${scenario.slug}`}
            className="inline-flex items-center gap-1.5 font-inter text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors group-hover:underline"
          >
            Начать подготовку
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function ScenarioOfTheDay({ scenario }: { scenario: ScenarioCatalogItem }) {
  return (
    <section className="mb-8 border border-neutral-900 bg-neutral-900 text-white overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
        <div className="p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-300 mb-4">
            <Sparkles size={12} />
            Scenario of the day
          </div>
          <h2 className="font-inter font-bold text-2xl sm:text-[2rem] leading-tight tracking-tight mb-3">
            {scenario.title}
          </h2>
          <p className="font-inter text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed mb-6">
            {scenario.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm mb-6">
            <CategoryBadge category={scenario.category} />
            <span className="font-mono uppercase tracking-[0.12em] text-neutral-400">
              {scenario.persona}
            </span>
            <DifficultyDots value={scenario.difficulty} />
          </div>
          <Link
            href={`/scenarios/${scenario.slug}`}
            className="inline-flex items-center gap-2 bg-white text-neutral-900 px-4 py-3 font-inter text-sm font-semibold hover:bg-neutral-100 transition-colors"
          >
            Начать с этого сценария
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-white/10 p-6 sm:p-8 bg-white/[0.03]">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-400 mb-3">
            Зачем открыть именно его
          </div>
          <ul className="space-y-3 font-inter text-sm text-neutral-200 leading-relaxed">
            <li>Сценарий уже готов к запуску без настройки роли и контекста вручную.</li>
            <li>Подходит как быстрый вход в продукт, если нужно потренироваться сегодня.</li>
            <li>Помогает увидеть формат стресс-теста до загрузки собственных материалов.</li>
          </ul>
        </div>
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

        setScenarios(res.items.map(enrichScenario))
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
      <header className="h-14 border-b border-neutral-200 flex items-center justify-between px-5 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
        >
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
        {/* Page header */}
        <div className="mb-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500 border border-neutral-200 px-3 py-1.5 inline-block mb-4">
            Библиотека сценариев
          </div>
          <h1 className="font-inter font-bold text-2xl sm:text-3xl text-neutral-900 leading-tight tracking-tight mb-2">
            Сценарии стресс-тестов
          </h1>
          <p className="font-inter text-neutral-500 text-sm max-w-xl">
            Готовые рабочие ситуации — начни подготовку в 2 клика
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
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 border text-xs font-mono font-medium transition-all ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
