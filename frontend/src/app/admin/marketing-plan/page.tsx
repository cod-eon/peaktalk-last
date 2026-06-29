'use client';

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Flag,
  Link2,
  MessageSquareText,
  MousePointerClick,
  RadioTower,
  Search,
  Target,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
} from '@/components/admin/AdminPrimitives';

const COLORS = {
  ember: '#E8600A',
  ink: '#111827',
  violet: '#8B5CF6',
  blue: '#2563EB',
  green: '#059669',
  amber: '#D97706',
  red: '#DC2626',
  steel: '#73706A',
};

const targetMetrics = [
  {
    metric: 'Threads',
    day30: 400,
    day60: 1200,
    display30: '200–400',
    display60: '600–1200',
    note: 'релевантная аудитория',
  },
  {
    metric: 'Telegram',
    day30: 120,
    day60: 300,
    display30: '50–120',
    display60: '150–300',
    note: 'база доверия',
  },
  {
    metric: 'Instagram',
    day30: 150,
    day60: 400,
    display30: '50–150',
    display60: '150–400',
    note: 'витрина доверия',
  },
  {
    metric: 'Пробные сессии',
    day30: 60,
    day60: 180,
    display30: '30–60',
    display60: '100–180',
    note: 'главный сигнал спроса',
  },
  {
    metric: '2+ ответа',
    day30: 30,
    day60: 90,
    display30: '15–30',
    display60: '50–90',
    note: 'value moment',
  },
  {
    metric: 'Feedback',
    day30: 15,
    day60: 40,
    display30: '10–15',
    display60: '25–40',
    note: 'качественные разговоры',
  },
  {
    metric: 'Оплаты / intent',
    day30: 7,
    day60: 20,
    display30: '3–7',
    display60: '8–20',
    note: 'качество аудитории',
  },
  {
    metric: 'SEO-страницы',
    day30: 5,
    day60: 12,
    display30: '3–5',
    display60: '8–12',
    note: 'сценарный фундамент',
  },
];

const channelData = [
  {
    name: 'Threads',
    value: 38,
    color: COLORS.ember,
    role: 'ежедневная проверка формулировок и быстрый спрос',
    cadence: '2–4 поста + 15–20 комментариев в день',
  },
  {
    name: 'Telegram',
    value: 24,
    color: COLORS.ink,
    role: 'операционный штаб, доверие, архив разборов',
    cadence: '1 пост в день',
  },
  {
    name: 'SEO / linkbuilding',
    value: 22,
    color: COLORS.blue,
    role: 'сценарные входы и долгий поисковый хвост',
    cadence: '8–12 страниц за 60 дней',
  },
  {
    name: 'Instagram-lite',
    value: 10,
    color: COLORS.violet,
    role: 'визуальная проверка живости проекта',
    cadence: '2–3 публикации в неделю',
  },
  {
    name: 'Yandex Direct',
    value: 6,
    color: COLORS.amber,
    role: 'малый тест high-intent спроса после launch gate',
    cadence: 'до 10 000 ₽ тестового бюджета',
  },
];

const funnelData = [
  { step: 'Пост', value: 100, label: 'короткий острый тезис' },
  { step: 'Подписка', value: 45, label: 'доверие к founder-led каналу' },
  { step: 'Telegram', value: 26, label: 'глубокий разбор' },
  { step: 'Guest flow', value: 14, label: 'открыл сценарий' },
  { step: 'Pressure scan', value: 8, label: 'value moment' },
  { step: 'Feedback', value: 4, label: 'качественный сигнал' },
  { step: 'Оплата', value: 2, label: 'payment intent' },
];

const psychologyLevers = [
  { lever: 'Loss aversion', score: 14, action: 'увидеть слабое место до встречи' },
  { lever: 'Specificity', score: 13, action: 'узнать себя в конкретном сценарии' },
  { lever: 'Risk reversal', score: 12, action: 'проверить материал без страха' },
  { lever: 'Commitment ladder', score: 12, action: 'плавно дойти до feedback / оплаты' },
  { lever: 'Transparency', score: 11, action: 'поверить founder-led запуску' },
];

const blockerData = [
  {
    blocker: 'Guest start 422',
    reason: 'главная воронка не доходит до value moment',
    check: 'CTA → /simulation/guest → первый вопрос без 422/500',
    status: 'P0',
  },
  {
    blocker: 'Пустой /scenarios',
    reason: 'SEO и контент ведут в тупик',
    check: '/scenarios показывает карточки сценариев',
    status: 'P0',
  },
  {
    blocker: 'Цели Метрики',
    reason: 'невозможно понять, какой канал работает',
    check: 'CTA, guest start, first answer, paywall, billing',
    status: 'P0',
  },
  {
    blocker: 'Privacy microcopy',
    reason: 'пользователь боится вставлять рабочий материал',
    check: 'текст рядом с textarea в guest flow',
    status: 'P0',
  },
];

const roadmap = [
  {
    period: 'Неделя 0',
    title: 'Launch gate',
    accent: COLORS.red,
    items: ['исправить guest-start 422', 'восстановить сценарии', 'цели Метрики', 'privacy microcopy'],
  },
  {
    period: 'Неделя 1',
    title: 'Каналы запущены',
    accent: COLORS.ember,
    items: ['Threads + Telegram', 'Instagram профиль', '15–20 Threads', '5 тёплых интро'],
  },
  {
    period: 'Неделя 2',
    title: 'Первые сигналы',
    accent: COLORS.amber,
    items: ['первый TG-разбор', '1 SEO-страница', '3 Reels', '5–10 интервью'],
  },
  {
    period: 'Недели 3–4',
    title: 'Проверка каналов',
    accent: COLORS.blue,
    items: ['3–5 SEO-страниц', 'Tier 1 материал', 'малый Директ', '20+ пробных сессий'],
  },
  {
    period: 'Месяц 2',
    title: 'Систематизация',
    accent: COLORS.green,
    items: ['8–12 SEO-страниц', '2–3 Tier 1 упоминания', '25–40 feedback', 'выбор каналов масштабирования'],
  },
];

const experiments = [
  {
    priority: 'P0',
    experiment: '3 неудобных вопроса по вашему материалу',
    channel: 'Threads',
    signal: 'переходы в guest flow',
  },
  {
    priority: 'P0',
    experiment: 'Сценарий “защита бюджета”',
    channel: 'SEO / TG',
    signal: 'пробные сессии',
  },
  {
    priority: 'P0',
    experiment: 'Тёплые интро через Кристину / Артура',
    channel: 'ручной',
    signal: 'интервью и первые кейсы',
  },
  {
    priority: 'P1',
    experiment: 'Instagram-карусели “слабый / сильный ответ”',
    channel: 'Instagram',
    signal: 'saves / переходы',
  },
  {
    priority: 'P1',
    experiment: 'Яндекс.Директ по защите бюджета',
    channel: 'поиск',
    signal: 'CTR и guest starts',
  },
  {
    priority: 'P1',
    experiment: 'VC/Habr материал про стресс-тест аргументации',
    channel: 'SEO / linkbuilding',
    signal: 'реферальный трафик',
  },
  {
    priority: 'P2',
    experiment: 'Telegram-бот',
    channel: 'Telegram',
    signal: 'если канал начинает расти',
  },
  {
    priority: 'P2',
    experiment: 'Email digest',
    channel: 'owned',
    signal: 'после 100+ контактов',
  },
];

const weeklyRhythm = [
  { day: 'Пн', threads: '3 коротких тезиса', telegram: 'сценарий недели', instagram: 'карусель' },
  { day: 'Вт', threads: 'вопрос дня + комментарии', telegram: 'слабый / сильный ответ', instagram: 'stories' },
  { day: 'Ср', threads: 'дневник запуска', telegram: 'разбор feedback', instagram: 'Reel' },
  { day: 'Чт', threads: 'разбор сценария', telegram: 'пост про продукт', instagram: '—' },
  { day: 'Пт', threads: 'прямой CTA', telegram: 'приглашение на пробу', instagram: 'карусель' },
  { day: 'Сб', threads: 'личная история', telegram: 'короткий итог', instagram: 'stories' },
  { day: 'Вс', threads: 'вывод недели', telegram: 'итоги недели', instagram: '—' },
];

const analyticsEvents = [
  { event: 'landing_cta_clicked', place: 'главная', props: 'source, medium, campaign, cta_location' },
  { event: 'scenario_opened', place: 'сценарий', props: 'scenario_slug, category, source' },
  { event: 'guest_started', place: 'guest flow', props: 'persona, difficulty, source' },
  { event: 'guest_answer_submitted', place: 'guest flow', props: 'turn, persona, difficulty' },
  { event: 'guest_paywall_seen', place: 'guest flow', props: 'turns_completed' },
  { event: 'billing_opened', place: 'billing', props: 'source, plan_context' },
  { event: 'feedback_submitted', place: 'после сессии', props: 'rating, scenario' },
];

const seoCluster = [
  '/blog/stress-test-argumentacii',
  '/scenarios/zaschita-byudzheta',
  '/scenarios/qbr',
  '/scenarios/pitch-investoru',
  '/scenarios/client-escalation',
  '/scenarios/zaschita-roadmap',
  '/blog/kak-podgotovitsya-k-slozhnoy-vstreche',
  '/blog/neudobnye-voprosy-rukovoditelya',
  '/blog/kak-zaschitit-byudzhet',
  '/blog/kak-otvechat-na-vozrazheniya-investora',
  '/blog/kak-podgotovitsya-k-klientskoy-eskalacii',
];

type TooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

function ChartTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;

  const first = payload[0];
  const details = first.payload?.label ?? first.payload?.role ?? first.payload?.action ?? first.payload?.note;

  return (
    <div className="max-w-[280px] border border-black/10 bg-white px-3 py-2 shadow-[0_20px_40px_rgba(17,24,39,0.1)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
        {label ?? first.name}
      </p>
      <p className="mt-1 text-sm font-semibold text-neutral-950">
        {typeof first.value === 'number' ? first.value.toLocaleString('ru-RU') : first.value}
        {suffix}
      </p>
      {typeof details === 'string' ? <p className="mt-1 text-xs leading-5 text-neutral-600">{details}</p> : null}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const className = priority === 'P0'
    ? 'border-red-200 bg-red-50 text-red-700'
    : priority === 'P1'
      ? 'border-orange-200 bg-orange-50 text-orange-700'
      : 'border-neutral-200 bg-neutral-100 text-neutral-600';

  return (
    <span className={`inline-flex border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${className}`}>
      {priority}
    </span>
  );
}

function CompactTable({
  columns,
  rows,
}: {
  columns: Array<{ key: string; label: string; className?: string }>;
  rows: Array<Record<string, string>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`border-b border-black/10 bg-neutral-950 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 ${column.className ?? ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[columns[0].key]}-${index}`} className="odd:bg-white even:bg-[rgba(17,24,39,0.025)]">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`border-b border-black/8 px-4 py-3 align-top text-sm leading-6 text-neutral-700 ${column.className ?? ''}`}
                >
                  {column.key === 'priority' ? <PriorityBadge priority={row[column.key]} /> : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContentUnitCard() {
  return (
    <AdminPanel
      title="Единица контента"
      subtitle="Одна рабочая ситуация должна давать пост, разбор, SEO-блок и новый сценарий."
      className="h-full"
    >
      <div className="grid gap-3 px-5 py-5 sm:px-6">
        {[
          ['Ситуация', 'CFO просит урезать бюджет на 30%'],
          ['Неудобный вопрос', 'Что сломается, если урезать эту статью на 50%?'],
          ['Слабый ответ', 'Команда не успеет.'],
          ['Сильный ответ', 'Сдвинется релиз для клиента X, риск потери Y млн из воронки, компромисс — урезать Z, но сохранить A.'],
          ['CTA', 'Проверьте слабое место материала до встречи.'],
        ].map(([label, value], index) => (
          <div key={label} className="grid gap-3 border border-black/8 bg-[rgba(17,24,39,0.02)] px-4 py-3 sm:grid-cols-[130px_1fr]">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              <span className="inline-flex h-6 w-6 items-center justify-center border border-black/10 bg-white text-neutral-800">
                {index + 1}
              </span>
              {label}
            </div>
            <p className="text-sm leading-6 text-neutral-800">{value}</p>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
}

export default function MarketingPlanPage() {
  return (
    <div className="space-y-6 pb-10">
      <AdminPageHeader
        eyebrow="Marketing / 60-day control map"
        title="Визуализация маркетинг-плана PeakTalk на 60 дней."
        description="Панель переводит документ запуска в управляемую карту: launch blockers, north star, каналы, KPI, контентный ритм, эксперименты, события аналитики и критерии успешного этапа."
        index="04"
        actions={
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-11 items-center gap-2 border border-black/10 bg-white px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-700">
              <CalendarDays size={14} />
              2026-04-26
            </span>
            <span className="inline-flex min-h-11 items-center gap-2 border border-[rgba(232,96,10,0.22)] bg-[rgba(232,96,10,0.08)] px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a4307]">
              <RadioTower size={14} />
              Hybrid soft launch
            </span>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="North Star"
          value="Qualified trials"
          helper="Запуски пробной сессии с реальным рабочим материалом."
          icon={Target}
        />
        <AdminMetricCard
          label="Trial starts / 60d"
          value="100–180"
          helper="Плановый диапазон пробных сессий к концу второго месяца."
          icon={MousePointerClick}
        />
        <AdminMetricCard
          label="Feedback / 60d"
          value="25–40"
          helper="Качественные интервью и обратная связь после сессий."
          icon={MessageSquareText}
        />
        <AdminMetricCard
          label="SEO pages"
          value="8–12"
          helper="Сценарные страницы и материалы для поискового фундамента."
          icon={Search}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <AdminPanel
          title="Launch gate"
          subtitle="До активного трафика нельзя масштабировать каналы: сначала нужно закрыть критичные разрывы в воронке."
        >
          <div className="grid gap-3 px-5 py-5 sm:px-6">
            {blockerData.map((item) => (
              <article key={item.blocker} className="grid gap-4 border border-red-200/70 bg-red-50/55 px-4 py-4 lg:grid-cols-[180px_1fr]">
                <div>
                  <PriorityBadge priority={item.status} />
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-neutral-950">{item.blocker}</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-700">Почему критично</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-700">{item.reason}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-700">Проверка</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-700">{item.check}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Demand flywheel"
          subtitle="Каждый пользовательский сигнал должен возвращаться в контент, сценарии и SEO."
          className="h-full"
        >
          <div className="px-5 py-5 sm:px-6">
            <div className="grid gap-3">
              {[
                'Острый тезис в Threads / Telegram / Instagram.',
                'Переход в Telegram или сразу в сценарий.',
                'Быстрый pressure scan материала.',
                'Feedback пользователя.',
                'Новый пост, сценарий, SEO-блок или внешний материал.',
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-black/10 bg-neutral-950 font-mono text-[11px] text-white">
                    {index + 1}
                  </div>
                  <p className="flex-1 border border-black/8 bg-white px-4 py-3 text-sm leading-6 text-neutral-700">{item}</p>
                  {index < 4 ? <ArrowRight size={16} className="hidden shrink-0 text-neutral-400 sm:block" /> : null}
                </div>
              ))}
            </div>
          </div>
        </AdminPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <AdminPanel
          title="KPI targets"
          subtitle="Целевые ориентиры на 30 и 60 дней. Диапазоны из плана показаны в таблице под графиком."
        >
          <div className="h-[360px] px-2 py-5 sm:px-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={targetMetrics} margin={{ top: 10, right: 20, left: -16, bottom: 40 }}>
                <CartesianGrid stroke="rgba(17,24,39,0.08)" vertical={false} />
                <XAxis
                  dataKey="metric"
                  interval={0}
                  angle={-24}
                  textAnchor="end"
                  tick={{ fill: COLORS.steel, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fill: COLORS.steel, fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="day30" name="30 дней" fill="rgba(232,96,10,0.42)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="day60" name="60 дней" fill={COLORS.ember} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <CompactTable
            columns={[
              { key: 'metric', label: 'Метрика' },
              { key: 'display30', label: '30 дней' },
              { key: 'display60', label: '60 дней' },
              { key: 'note', label: 'Смысл' },
            ]}
            rows={targetMetrics.map(({ metric, display30, display60, note }) => ({ metric, display30, display60, note }))}
          />
        </AdminPanel>

        <AdminPanel
          title="Channel mix"
          subtitle="Роли каналов в soft launch: быстрые формулировки, доверие, поисковый фундамент и малые paid-тесты."
          className="h-full"
        >
          <div className="h-[300px] px-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3}>
                  {channelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip suffix="%" />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 px-5 pb-5 sm:px-6">
            {channelData.map((channel) => (
              <div key={channel.name} className="border border-black/8 bg-[rgba(17,24,39,0.02)] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5" style={{ backgroundColor: channel.color }} />
                    <p className="text-sm font-semibold text-neutral-950">{channel.name}</p>
                  </div>
                  <p className="font-mono text-[11px] text-neutral-500">{channel.value}%</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-neutral-600">{channel.role}</p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AdminPanel
          title="Commitment ladder"
          subtitle="Модель пути от первого касания к payment intent. Значения показывают относительное сужение фокуса, не фактическую аналитику."
        >
          <div className="h-[330px] px-2 py-5 sm:px-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 8, right: 28, left: 18, bottom: 8 }}>
                <CartesianGrid stroke="rgba(17,24,39,0.08)" horizontal={false} />
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="step"
                  width={82}
                  tick={{ fill: COLORS.steel, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip suffix="%" />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {funnelData.map((item, index) => (
                    <Cell key={item.step} fill={index < 3 ? COLORS.ember : index < 5 ? COLORS.ink : COLORS.violet} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Psychological leverage"
          subtitle="Рычаги из плана с PLFS-оценками. Нужны не для манипуляции, а для ясного позиционирования профессионального риска."
        >
          <div className="h-[330px] px-2 py-5 sm:px-5">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={psychologyLevers}>
                <PolarGrid stroke="rgba(17,24,39,0.12)" />
                <PolarAngleAxis dataKey="lever" tick={{ fill: COLORS.steel, fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Radar dataKey="score" name="PLFS" stroke={COLORS.violet} fill={COLORS.violet} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>
      </section>

      <AdminPanel
        title="60-day roadmap"
        subtitle="Фазовая карта: сначала закрываем launch gate, затем запускаем каналы, потом систематизируем feedback и SEO."
      >
        <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-5">
          {roadmap.map((phase, index) => (
            <article key={phase.period} className="relative border border-black/10 bg-white px-4 py-4">
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: phase.accent }} />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">{phase.period}</p>
              <h3 className="mt-2 min-h-[56px] text-xl font-semibold leading-7 tracking-[-0.04em] text-neutral-950">
                {phase.title}
              </h3>
              <div className="mt-4 space-y-2">
                {phase.items.map((item) => (
                  <div key={item} className="flex gap-2 text-sm leading-5 text-neutral-700">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: phase.accent }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-black/8 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                Phase {index + 1}
              </div>
            </article>
          ))}
        </div>
      </AdminPanel>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ContentUnitCard />

        <AdminPanel
          title="Daily founder mode"
          subtitle="2–4 часа в день. Правило: не открывать новый канал, пока текущие каналы не приводят людей в пробную сессию."
          className="h-full"
        >
          <div className="px-5 py-5 sm:px-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { slot: 'Threads', minutes: 40 },
                    { slot: 'Диалоги', minutes: 30 },
                    { slot: 'Telegram', minutes: 30 },
                    { slot: 'SEO', minutes: 40 },
                    { slot: 'Аналитика', minutes: 20 },
                    { slot: 'Instagram', minutes: 30 },
                  ]}
                  margin={{ top: 10, right: 14, left: -18, bottom: 28 }}
                >
                  <CartesianGrid stroke="rgba(17,24,39,0.08)" vertical={false} />
                  <XAxis
                    dataKey="slot"
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    tick={{ fill: COLORS.steel, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fill: COLORS.steel, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip suffix=" мин" />} />
                  <Line type="monotone" dataKey="minutes" stroke={COLORS.ember} strokeWidth={3} dot={{ r: 4, fill: COLORS.ember }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AdminPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <AdminPanel
          title="Weekly content rhythm"
          subtitle="Операционный календарь для Threads, Telegram и Instagram-lite."
        >
          <CompactTable
            columns={[
              { key: 'day', label: 'День', className: 'w-[80px]' },
              { key: 'threads', label: 'Threads' },
              { key: 'telegram', label: 'Telegram' },
              { key: 'instagram', label: 'Instagram' },
            ]}
            rows={weeklyRhythm}
          />
        </AdminPanel>

        <AdminPanel
          title="SEO cluster"
          subtitle="Сценарный поисковый фундамент: pillar + страницы под конкретные рабочие встречи."
          className="h-full"
        >
          <div className="grid gap-2 px-5 py-5 sm:px-6">
            {seoCluster.map((path, index) => (
              <div key={path} className="flex items-center gap-3 border border-black/8 bg-[rgba(17,24,39,0.02)] px-3 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-black/10 bg-white font-mono text-[10px] text-neutral-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <code className="text-xs text-neutral-700">{path}</code>
              </div>
            ))}
          </div>
        </AdminPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AdminPanel
          title="Experiment queue"
          subtitle="Очередь тестов с приоритетом, каналом и главным сигналом успеха."
        >
          <CompactTable
            columns={[
              { key: 'priority', label: 'P' },
              { key: 'experiment', label: 'Эксперимент' },
              { key: 'channel', label: 'Канал' },
              { key: 'signal', label: 'Сигнал' },
            ]}
            rows={experiments}
          />
        </AdminPanel>

        <AdminPanel
          title="Analytics events"
          subtitle="Минимальная таксономия событий, чтобы связать каналы с qualified trial starts."
        >
          <CompactTable
            columns={[
              { key: 'event', label: 'Событие' },
              { key: 'place', label: 'Где' },
              { key: 'props', label: 'Свойства' },
            ]}
            rows={analyticsEvents}
          />
        </AdminPanel>
      </section>

      <AdminPanel
        title="Definition of done"
        subtitle="60-дневный этап успешен только если продуктовая воронка, аудитория, feedback, SEO и первые payment-сигналы сходятся в одну систему."
      >
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            ['Пробная сессия работает', 'без критичных ошибок guest flow'],
            ['600–1200 релевантных людей', 'регулярно видят PeakTalk'],
            ['100+ пробных сессий', 'с реальным рабочим материалом'],
            ['25+ feedback-разговоров', 'качественные формулировки боли'],
            ['2–3 сильных сценария', 'понятно, что масштабировать'],
            ['Первые оплаты / intent', 'сигнал качества аудитории'],
            ['8–12 SEO-страниц', 'сценарный поисковый фундамент'],
            ['2 Tier 1 материала', 'внешние упоминания и ссылки'],
          ].map(([title, description]) => (
            <div key={title} className="border border-black/8 bg-white px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-700">
                <Flag size={16} />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-[-0.03em] text-neutral-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
            </div>
          ))}
        </div>
      </AdminPanel>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: AlertTriangle,
            title: 'Чего не говорить',
            text: 'Не “ИИ-коуч”, не “публичные выступления”, не “мягкие навыки”, не игра и не челлендж.',
          },
          {
            icon: FileText,
            title: 'Что говорить',
            text: 'PeakTalk проверяет, выдержит ли ваша аргументация давление реальной встречи.',
          },
          {
            icon: Link2,
            title: 'Куда вести',
            text: 'Главный CTA: запустить 3 неудобных вопроса бесплатно, без регистрации и карты.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="border border-black/10 bg-neutral-950 p-5 text-white shadow-[0_18px_60px_rgba(17,24,39,0.14)]">
            <div className="flex h-11 w-11 items-center justify-center border border-white/10 bg-white/5 text-[#f6b153]">
              <Icon size={18} />
            </div>
            <h3 className="mt-5 font-syne text-2xl leading-none tracking-[-0.05em]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">{text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
