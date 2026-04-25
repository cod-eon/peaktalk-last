import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Сценарии подготовки к рабочим встречам — PeakTalk',
  description:
    'Сценарные посадочные страницы PeakTalk для подготовки к защите бюджета, roadmap, инвест-питчу, клиентской эскалации и другим сложным рабочим встречам.',
  alternates: {
    canonical: '/scenarios',
  },
  openGraph: {
    title: 'Сценарии подготовки к рабочим встречам — PeakTalk',
    description:
      'Выберите сценарий, вставьте рабочий материал и проверьте аргументацию под давлением будущего оппонента.',
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
