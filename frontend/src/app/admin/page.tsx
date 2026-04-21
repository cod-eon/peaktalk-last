'use client';

import { useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CreditCard,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatAdminCurrency, formatAdminDateTime } from '@/lib/admin';
import {
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
} from '@/components/admin/AdminPrimitives';
import type { AdminChartsData, AdminStats, DayPoint, MaintenanceStatus } from '@/types/admin';

function fillDays(points: DayPoint[], days: number) {
  const map = new Map(points.map((point) => [point.date, point.value]));

  return Array.from({ length: days }, (_, index) => {
    const day = subDays(new Date(), days - 1 - index);
    const key = format(day, 'yyyy-MM-dd');

    return {
      date: key,
      shortLabel: format(day, 'd MMM', { locale: ru }),
      value: map.get(key) ?? 0,
    };
  });
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; color?: string }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border border-black/10 bg-white px-3 py-2 shadow-[0_20px_40px_rgba(17,24,39,0.08)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-950">
        {typeof payload[0]?.value === 'number'
          ? payload[0].value.toLocaleString('ru-RU')
          : payload[0]?.value}
        {suffix}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  data,
  color,
  suffix,
}: {
  title: string;
  subtitle: string;
  data: Array<{ date: string; shortLabel: string; value: number }>;
  color: string;
  suffix?: string;
}) {
  const chartId = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <AdminPanel title={title} subtitle={subtitle} className="h-full">
      <div className="h-[290px] px-2 pb-4 pt-3 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 8 }}>
            <defs>
              <linearGradient id={`gradient-${chartId}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(17,24,39,0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                try {
                  return format(parseISO(value), 'd MMM', { locale: ru });
                } catch {
                  return value;
                }
              }}
              tick={{ fill: '#737373', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fill: '#737373', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k` : String(value)
              }
            />
            <Tooltip content={<ChartTooltip suffix={suffix} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${chartId})`}
              activeDot={{ r: 4, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AdminPanel>
  );
}

function MaintenanceControl() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<MaintenanceStatus>({
    queryKey: ['admin-maintenance'],
    queryFn: () => api.get('/admin/maintenance'),
    staleTime: 10_000,
    retry: 1,
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => api.post('/admin/maintenance', { enabled }) as Promise<MaintenanceStatus>,
    onSuccess: (next) => {
      queryClient.setQueryData(['admin-maintenance'], next);
      queryClient.setQueryData(['maintenance-status'], next);
      toast.success(next.enabled ? 'Техработы включены.' : 'Техработы выключены.');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Не удалось изменить режим техработ.';
      toast.error(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-status'] });
    },
  });

  const enabled = Boolean(data?.enabled);
  const updated = formatAdminDateTime(data?.updated_at ?? null);

  return (
    <section className="relative overflow-hidden border border-black/10 bg-[linear-gradient(135deg,#111827_0%,#191f2d_56%,#111827_100%)] text-white shadow-[0_30px_80px_rgba(17,24,39,0.22)]">
      <div className="absolute inset-y-0 right-0 w-56 bg-[radial-gradient(circle_at_center,rgba(232,96,10,0.34),transparent_68%)]" />
      <div className="relative grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
            {enabled ? <ShieldAlert size={14} className="text-[#f6b153]" /> : <ShieldCheck size={14} className="text-[#86efac]" />}
            Runtime Control
          </div>
          <h2 className="mt-4 font-syne text-[30px] leading-[0.95] tracking-[-0.05em] text-white sm:text-[36px]">
            Технические работы для пользовательского дашборда
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-white/74">
            Режим перекрывает маршруты рабочего кабинета maintenance-экраном. Админка остаётся доступной, а на maintenance-screen есть быстрый выход из аккаунта.
          </p>
        </div>

        <div className="relative flex min-w-[260px] flex-col gap-3">
          <div className={`inline-flex items-center gap-2 self-start border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${
            enabled
              ? 'border-amber-300/25 bg-amber-400/10 text-amber-200'
              : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
          }`}>
            <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-amber-300' : 'bg-emerald-300'}`} />
            {enabled ? 'Режим включён' : 'Режим выключен'}
          </div>
          <div className="border border-white/10 bg-white/5 px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Последнее изменение</p>
            <div className="mt-2 text-sm text-white/82">
              {updated.date} <span className="text-white/45">·</span> {updated.time}
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading || toggleMutation.isPending}
            onClick={() => toggleMutation.mutate(!enabled)}
            className={`inline-flex min-h-12 items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors ${
              enabled
                ? 'bg-white text-neutral-950 hover:bg-neutral-100'
                : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {(isLoading || toggleMutation.isPending) ? <Loader2 size={16} className="animate-spin" /> : null}
            {enabled ? 'Выключить техработы' : 'Включить техработы'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function AdminOverviewPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorValue,
    refetch,
  } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats'),
    staleTime: 30_000,
    retry: 1,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery<AdminChartsData>({
    queryKey: ['admin-charts'],
    queryFn: () => api.get('/admin/charts?days=30'),
    staleTime: 60_000,
    retry: 1,
  });

  const revenueData = useMemo(() => fillDays(charts?.revenue_by_day ?? [], 30), [charts?.revenue_by_day]);
  const simulationData = useMemo(() => fillDays(charts?.simulations_by_day ?? [], 30), [charts?.simulations_by_day]);
  const usersData = useMemo(() => fillDays(charts?.users_by_day ?? [], 30), [charts?.users_by_day]);

  const monthRevenue = stats ? formatAdminCurrency(stats.revenue_this_month_rub) : '—';
  const totalRevenue = stats ? formatAdminCurrency(stats.revenue_total_rub) : '—';

  return (
    <div className="space-y-6 pb-10">
      <AdminPageHeader
        eyebrow="Operations / Analytics"
        title="Контур управления без вымышленных метрик."
        description="Админка теперь показывает только реальные показатели продукта: пользователей, симуляции, оплату и состояние runtime. Никаких декоративных “латентностей” и фиктивных транскрипций."
        index="01"
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex min-h-11 items-center gap-2 border border-black/10 bg-white px-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            <RefreshCw size={14} />
            Обновить
          </button>
        }
      />

      {statsError ? (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{statsErrorValue instanceof Error ? statsErrorValue.message : 'Не удалось загрузить статистику.'}</p>
        </div>
      ) : null}

      {statsLoading ? (
        <div className="flex items-center justify-center py-28">
          <Loader2 size={28} className="animate-spin text-neutral-950" />
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminMetricCard
              label="Пользователи"
              value={stats.total_users.toLocaleString('ru-RU')}
              helper={`${stats.free_users.toLocaleString('ru-RU')} на free/разовых сценариях`}
              icon={Users}
            />
            <AdminMetricCard
              label="Платящие аккаунты"
              value={stats.paying_users.toLocaleString('ru-RU')}
              helper="Активные платные подписки и legacy starter."
              icon={CreditCard}
            />
            <AdminMetricCard
              label="Все симуляции"
              value={stats.total_simulations.toLocaleString('ru-RU')}
              helper={`${stats.simulations_today.toLocaleString('ru-RU')} запусков сегодня`}
              icon={Activity}
            />
            <AdminMetricCard
              label="Выручка / месяц"
              value={monthRevenue}
              helper="Сумма успешных платежей с начала календарного месяца."
              icon={TrendingUp}
            />
            <AdminMetricCard
              label="Выручка / всё время"
              value={totalRevenue}
              helper="Накопленная сумма только по успешным платежам."
              icon={BarChart3}
            />
            <AdminMetricCard
              label="Успешные оплаты"
              value={stats.successful_payments_count.toLocaleString('ru-RU')}
              helper="Количество оплаченных транзакций без pending и failed."
              icon={ShieldCheck}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <MaintenanceControl />

            <AdminPanel
              title="Snapshot"
              subtitle="Короткий срез по текущему состоянию продукта без вторичного шума."
              className="h-full"
            >
              <div className="grid gap-4 px-5 py-5 sm:px-6">
                {[
                  {
                    label: 'Платящая доля',
                    value: stats.total_users > 0 ? `${Math.round((stats.paying_users / stats.total_users) * 100)}%` : '0%',
                    helper: 'Доля активных платных пользователей от общей базы.',
                  },
                  {
                    label: 'Средний чек',
                    value: stats.successful_payments_count > 0
                      ? formatAdminCurrency(Math.round(stats.revenue_total_rub / stats.successful_payments_count))
                      : '—',
                    helper: 'Считает только successful payments.',
                  },
                  {
                    label: 'Нагрузка сегодня',
                    value: stats.total_simulations > 0
                      ? `${Math.round((stats.simulations_today / Math.max(stats.total_simulations, 1)) * 1000) / 10}%`
                      : '0%',
                    helper: 'Доля сегодняшних симуляций от накопленного объёма.',
                  },
                ].map((item) => (
                  <div key={item.label} className="border border-black/8 bg-[rgba(17,24,39,0.02)] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{item.label}</p>
                    <div className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-neutral-950">{item.value}</div>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{item.helper}</p>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <ChartCard
              title="Revenue"
              subtitle="Последние 30 дней, успешные оплаты."
              data={revenueData}
              color="#E8600A"
              suffix=" ₽"
            />
            <ChartCard
              title="Simulations"
              subtitle="Запуски по дням за тот же период."
              data={simulationData}
              color="#111827"
            />
            <ChartCard
              title="New Users"
              subtitle="Новые регистрации по дням."
              data={usersData}
              color="#2563eb"
            />
          </div>

          {chartsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-neutral-700" />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
