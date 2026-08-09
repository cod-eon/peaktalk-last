import type { Metadata } from 'next'
import { getFallbackScenarioBySlug } from '@/lib/scenarios-catalog'

interface ScenarioData {
  title: string
  subtitle: string
  persona: string
  problem?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const publicScenarioMeta: Record<string, { title: string; description: string }> = {
  'roadmap-budget-defense': {
    title: 'Защита плана и бюджета',
    description:
      'Подготовьте материал к вопросам про деньги, сроки, команду и компромиссы.',
  },
  'client-escalation': {
    title: 'Разговор с недовольным клиентом',
    description:
      'Подготовьте позицию, тон ответа и следующий шаг для клиентской эскалации.',
  },
  'qbr-renewal': {
    title: 'Квартальный обзор',
    description:
      'Соберите короткий обзор периода, доказательства ценности и ответы на вопросы клиента.',
  },
  'hr-hard-change': {
    title: 'Сложное кадровое объявление',
    description:
      'Подготовьте речь руководителя и ответы на сложную реакцию команды.',
  },
  'investor-pitch': {
    title: 'Презентация инвестору',
    description:
      'Проверьте рынок, рост, экономику и слабые места презентации до встречи.',
  },
  'academic-defense': {
    title: 'Защита диплома или исследования',
    description:
      'Сожмите большой материал в речь, выжимку, шпаргалку и вопросы комиссии.',
  },
}

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
  const publicMeta = publicScenarioMeta[slug]

  if (!metadataScenario && !publicMeta) {
    return {
      title: 'Сценарий не найден - PeakTalk',
      description: 'Сценарий подготовки не найден.',
    }
  }

  const persona = metadataScenario?.persona ?? 'оппонентом'
  const title = `${publicMeta?.title ?? metadataScenario?.title} - PeakTalk`
  const description =
    publicMeta?.description ||
    metadataScenario?.problem ||
    metadataScenario?.subtitle ||
    `Подготовьтесь к сложному рабочему разговору с ${persona}. Проверьте материал перед встречей.`

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
