import type { Metadata } from 'next'

interface ScenarioData {
  title: string
  subtitle: string
  persona: string
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

  if (!scenario) {
    return {
      title: 'Сценарий не найден — PeakTalk',
      description: 'Сценарий стресс-теста не найден.',
    }
  }

  const title = `${scenario.title} — PeakTalk: стресс-тест аргументации`
  const description =
    scenario.subtitle ||
    `Подготовьтесь к сложному разговору с ${scenario.persona}. Попробуйте 3 вопроса бесплатно.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
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
