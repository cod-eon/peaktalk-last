import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Сценарии стресс-тестов — PeakTalk',
  description:
    'Готовые рабочие ситуации для подготовки к сложным переговорам: защита бюджета, QBR, эскалации, инвест-питчи и другие high-stakes разговоры.',
  openGraph: {
    title: 'Сценарии стресс-тестов — PeakTalk',
    description:
      'Готовые рабочие ситуации для подготовки к сложным переговорам: защита бюджета, QBR, эскалации, инвест-питчи и другие high-stakes разговоры.',
    type: 'website',
  },
}

export default function ScenariosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
