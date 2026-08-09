import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Сценарии подготовки - PeakTalk',
  description:
    'Выберите ситуацию, загрузите материал и получите речь, выжимку, тайминг, памятку и вопросы перед встречей.',
  alternates: {
    canonical: '/scenarios',
  },
  openGraph: {
    title: 'Сценарии подготовки - PeakTalk',
    description:
      'Выберите конкретную ситуацию и начните подготовку с вашего материала.',
    type: 'website',
    url: '/scenarios',
  },
}

export default function ScenariosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
