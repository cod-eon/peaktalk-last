import type { Metadata } from 'next'
import { getFallbackScenarioBySlug } from '@/lib/scenarios-catalog'

interface ScenarioData {
  title: string
  subtitle: string
  persona: string
  problem?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchScenario(
  slug: string,
): Promise<ScenarioData | null> {
  try {
    const res = await fetch(`${API_BASE}/scenarios/${slug}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const scenario = await fetchScenario(slug)
  const fallbackScenario = getFallbackScenarioBySlug(slug)
  const metadataScenario = scenario ?? fallbackScenario

  if (!metadataScenario) {
    return {
      title: 'Сценарий не найден — PeakTalk',
      description: 'Сценарий стресс-теста не найден.',
    }
  }

  const title = `${metadataScenario.title} — PeakTalk`
  const description =
    metadataScenario.problem ||
    metadataScenario.subtitle ||
    `Подготовьтесь к сложному рабочему разговору с ${metadataScenario.persona}. Запустите 3 вопроса в guest-режиме.`

  return {
    title,
    description,
    alternates: {
      canonical: `/scenarios/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/scenarios/${slug}`,
    },
  }
}

export default function ScenarioDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
