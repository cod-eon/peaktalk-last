import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Сценарии рабочих защит — PeakTalk',
  description:
    'Каталог pressure tests для защиты roadmap, бюджета, инвест-питча, клиентской эскалации и других дорогих рабочих встреч. Начните с Roadmap / Budget Defense для Head of Product.',
  alternates: {
    canonical: '/scenarios',
  },
  openGraph: {
    title: 'Сценарии рабочих защит — PeakTalk',
    description:
      'Выберите конкретную встречу, вставьте материал и проверьте аргументацию под давлением будущего оппонента до реального разговора.',
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
