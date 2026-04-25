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
      className="group flex min-h-[280px] flex-col border border-neutral-200 bg-white transition-colors hover:border-neutral-950"
    >
      <div className="flex h-full flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <CategoryBadge category={scenario.category} />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
            {scenario.persona}
          </span>
        </div>

        <h3 className="font-inter text-[21px] font-bold leading-[1.1] text-neutral-950">
          {scenario.title}
        </h3>
        <p className="mt-3 font-inter text-sm leading-relaxed text-neutral-600">
          {scenario.problem ?? scenario.subtitle}
        </p>

        <div className="mt-auto border-t border-neutral-200 pt-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
              Давление
            </span>
            <DifficultyDots value={scenario.difficulty} />
          </div>
          <Link
            href={`/scenarios/${scenario.slug}`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-4 font-inter text-sm font-bold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]"
          >
            Разобрать сценарий
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function ScenarioOfTheDay({ scenario }: { scenario: ScenarioCatalogItem }) {
  return (
    <section className="mb-8 border border-neutral-950 bg-neutral-950 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
        <div className="p-6 sm:p-8">
          <div className="mb-4 inline-flex border border-[#E8600A]/40 bg-[#E8600A]/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF8A3D]">
            Сценарий дня
          </div>
          <h2 className="font-inter text-2xl font-black leading-tight tracking-tight sm:text-[2.4rem]">
            {scenario.title}
          </h2>
          <p className="mt-4 max-w-2xl font-inter text-sm leading-relaxed text-white/68 sm:text-base">
            {scenario.problem ?? scenario.subtitle}
          </p>
          <div className="mb-6 mt-6 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <CategoryBadge category={scenario.category} />
            <span className="font-mono uppercase tracking-[0.12em] text-neutral-400">
              {scenario.persona}
            </span>
            <DifficultyDots value={scenario.difficulty} />
          </div>
          <Link
            href={`/scenarios/${scenario.slug}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-white bg-white px-5 font-inter text-sm font-bold text-neutral-950 transition-colors hover:border-[#E8600A] hover:bg-[#E8600A] hover:text-white"
          >
            Открыть сценарий
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="border-t border-white/12 bg-white/[0.035] p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF8A3D]">
            Что проверит PeakTalk
          </div>
          <ul className="space-y-3 font-inter text-sm text-neutral-200 leading-relaxed">
            {(scenario.expectedOutput ?? [
              'Слабые места в материале до реальной встречи.',
              'Вопросы, которые неприятно услышать без подготовки.',
              'Короткую prep-card для ответа под давлением.',
            ]).map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 bg-[#E8600A]" />
                <span>{item}</span>
              </li>
            ))}
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
            href="/simulation/guest"
            className="border border-neutral-950 bg-neutral-950 px-4 py-2 font-inter text-xs font-semibold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]"
          >
            3 вопроса
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        {/* Page header */}
        <div className="mb-8">
          <div className="mb-4 inline-block border border-neutral-200 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Сценарии PeakTalk
          </div>
          <h1 className="max-w-3xl font-inter text-[32px] font-black leading-[1.04] text-neutral-950 sm:text-[46px]">
            Подготовка к конкретной рабочей встрече, а не тренажёр речи вообще.
          </h1>
          <p className="mt-5 max-w-2xl font-inter text-base leading-relaxed text-neutral-600">
            Выберите сценарий, вставьте документ, презентацию, отчёт или тезисы и проверьте, где аргументация не держит давление руководителя, клиента, инвестора или CFO.
          </p>
          <Link
            href="/simulation/guest"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-5 text-sm font-bold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]"
          >
            Проверить свой материал
            <ArrowRight size={16} />
          </Link>
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
