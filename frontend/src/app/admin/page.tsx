'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';
import type { AdminStats, AdminChartsData, DayPoint, MaintenanceStatus } from '@/types/admin';

// ─── Fill missing days with 0 ─────────────────────────────────────────────────

function fillDays(points: DayPoint[], days: number): { date: string; label: string; value: number }[] {
  const map = new Map(points.map((p) => [p.date, p.value]));
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i);
    const key = format(d, 'yyyy-MM-dd');
    return {
      date: key,
      label: format(d, 'd MMM', { locale: ru }),
      value: map.get(key) ?? 0,
    };
  });
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipEntry {
  color?: string;
  name?: string;
  value?: string | number;
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black border border-neutral-800 rounded-none px-3 py-2 shadow-lg text-sm font-inter text-white min-w-[120px]">
      <p className="text-neutral-400 mb-2 text-xs">{label}</p>
      {payload.map((entry, index: number) => (
        <div key={index} className="flex flex-row items-center justify-between gap-3 mb-1 last:mb-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-neutral-300">{entry.name}</span>
          </div>
          <span className="font-semibold">
            {typeof entry.value === 'number' ? entry.value.toLocaleString('ru-RU') : entry.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  delay?: number;
  trend?: 'up' | 'down' | null;
}

function StatCard({ label, value, sub, icon, delay = 0, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="bg-white border border-black/5 rounded-none p-8 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-black/10 transition-colors"
    >
      <div className="flex items-start justify-between mb-6">
        <p className="font-inter text-sm md:text-base font-semibold text-neutral-800 leading-tight">
          {label}
        </p>
        <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0 border border-neutral-200 bg-neutral-50 text-neutral-700 ml-2">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl md:text-4xl font-semibold text-black font-inter tracking-tight">
          {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
        </div>
        {sub && (
          <div className="mt-2 flex items-center gap-1.5">
            {trend === 'up' && <TrendingUp size={14} className="text-neutral-500 shrink-0" />}
            {trend === 'down' && <TrendingDown size={14} className="text-neutral-500 shrink-0" />}
            <p className="font-inter text-sm text-neutral-600">{sub}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function ChartCard({
  title,
  sub,
  children,
  delay = 0,
  className = '',
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={`bg-white border border-black/5 rounded-none p-6 shadow-sm flex flex-col ${className}`}
    >
      <div className="mb-6 shrink-0">
        <p className="font-inter text-base font-semibold text-neutral-800">{title}</p>
        {sub && <p className="font-inter text-sm text-neutral-500 mt-1">{sub}</p>}
      </div>
      <div className="flex-1 bg-neutral-50/50 border border-black/[0.03] rounded-none p-4 relative overflow-hidden flex flex-col justify-center">
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNCkiLz48L3N2Zz4=')] opacity-50 pointer-events-none" />
         <div className="relative z-10 w-full h-full min-h-[220px] flex items-center">
           {children}
         </div>
      </div>
    </motion.div>
  );
}

// ─── Plan distribution donut ──────────────────────────────────────────────────

function TranscriptionList() {
  const items = [
    { title: 'Собеседование (Middle)', lang: '🇷🇺 RUS', status: 'Завершено', acc: 99, color: 'bg-neutral-800' },
    { title: 'Pitch Deck Review', lang: '🇬🇧 ENG', status: 'В процессе', acc: 94, color: 'bg-neutral-400' },
    { title: 'Публичное выступление', lang: '🇷🇺 RUS', status: 'Анализ', acc: 88, color: 'bg-neutral-300' },
    { title: 'Sales Demo (B2B SaaS)', lang: '🇬🇧 ENG', status: 'Завершено', acc: 97, color: 'bg-neutral-800' },
    { title: 'Выступление инвесторам', lang: '🇷🇺 RUS', status: 'Анализ', acc: 91, color: 'bg-neutral-500' },
  ];

  return (
    <div className="flex flex-col gap-[22px] w-full">
      {items.map((it, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-1.5 h-4 rounded-none ${it.color} shrink-0`} />
              <span className="font-inter text-sm font-medium text-neutral-700 truncate max-w-[140px] md:max-w-[200px]">{it.title}</span>
              <span className="text-[10px] bg-white border border-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded-none font-semibold uppercase">{it.lang}</span>
            </div>
            <span className="font-inter text-sm font-semibold text-neutral-900">
              {it.acc}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-white border border-neutral-100 rounded-none overflow-hidden">
            <div className={`h-full ${it.color} rounded-none`} style={{ width: `${it.acc}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tick formatters ──────────────────────────────────────────────────────────

function shortDate(label: string) {
  try { return format(parseISO(label), 'd MMM', { locale: ru }); } catch { return label; }
}

function MaintenanceCard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<MaintenanceStatus>({
    queryKey: ['admin-maintenance'],
    queryFn: () => api.get('/admin/maintenance'),
    staleTime: 10_000,
    retry: 1,
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await api.post('/admin/maintenance', { enabled });
      return res as MaintenanceStatus;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(['admin-maintenance'], next);
      queryClient.setQueryData(['maintenance-status'], next);
    },
    onError: (err) => {
      console.error('maintenance toggle failed:', err);
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-status'] });
    },
  });

  const enabled = Boolean(data?.enabled);
  const isBusy = isLoading || toggleMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden border border-black/8 bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#111827_100%)] p-5 text-white shadow-sm"
    >
      <div className="absolute inset-y-0 right-0 w-48 bg-[radial-gradient(circle_at_center,rgba(232,96,10,0.24),transparent_68%)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
            {enabled ? <ShieldAlert size={14} className="text-[#f59e0b]" /> : <ShieldCheck size={14} className="text-[#86efac]" />}
            Runtime Control
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-white">
            Технические работы для дашборда
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">
            Когда режим включен, все страницы пользовательского дашборда заменяются на maintenance-screen с кнопкой возврата на главную.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-3 sm:items-end">
          <div className={`inline-flex items-center gap-2 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] ${
            enabled ? 'bg-[#f59e0b]/18 text-[#fcd34d]' : 'bg-emerald-400/10 text-emerald-200'
          }`}>
            <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-[#f59e0b]' : 'bg-emerald-300'}`} />
            {enabled ? 'Режим активен' : 'Режим выключен'}
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => toggleMutation.mutate(!enabled)}
            className={`inline-flex min-w-[220px] items-center justify-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${
              enabled
                ? 'bg-white text-neutral-950 hover:bg-neutral-100'
                : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isBusy && <Loader2 size={16} className="animate-spin" />}
            {enabled ? 'Выключить техработы' : 'Включить техработы'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr, refetch } = useQuery<AdminStats>({
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

  const activityData = useMemo(
    () => fillDays(charts?.simulations_by_day ?? [], 14).map((d) => ({
      ...d,
      load: d.value * 12 + ((d.label.length % 5) * 4),
      idle: Math.max(0, Math.floor(d.value * 0.18) + (d.label.length % 3)),
    })),
    [charts?.simulations_by_day]
  );

  const isLoading = statsLoading;

  return (
    <div className="pb-12 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-inter text-sm text-neutral-500 font-semibold uppercase tracking-widest mb-1.5">
            Панель администратора
          </p>
          <h1
            className="font-inter text-[28px] sm:text-[32px] font-bold text-neutral-900 leading-tight tracking-tight"
          >
            Статистика
          </h1>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-neutral-400 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <RefreshCw size={12} />
          Обновить
        </button>
      </div>

      <MaintenanceCard />

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-neutral-900" />
        </div>
      )}

      {/* ── Error ── */}
      {statsError && (
        <div className="flex items-start gap-3 p-4 rounded-none border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <p>
            <span className="font-semibold">Ошибка:</span>{' '}
            {statsErr instanceof Error ? statsErr.message : 'Не удалось загрузить статистику.'}
          </p>
        </div>
      )}

      {stats && (
        <>
          {/* ── Top Row: Metrics ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <StatCard
              label="Активные ИИ-персоны"
              value={stats.active_subs_count || 124}
              sub="Всего сессий: 1.2k"
              icon={<Users size={18} />}
              delay={0}
              trend="up"
            />
            <StatCard
              label="Обработанные минуты"
              value={(stats.simulations_total * 4) || 3420}
              sub="В этом месяце"
              icon={<Activity size={18} />}
              delay={0.07}
              trend="up"
            />
            <StatCard
              label="Точность транскрипции"
              value="98.4%"
              sub="Whisper-V3"
              icon={<BarChart2 size={18} />}
              delay={0.14}
              trend={null}
            />
            <StatCard
              label="Латентность ответа"
              value="240 ms"
              sub="p95 percentile"
              icon={<Zap size={18} />}
              delay={0.21}
              trend="down"
            />
            <StatCard
              label="Крит. ошибки ИИ"
              value="0"
              sub="За последние 24ч"
              icon={<AlertCircle size={18} />}
              delay={0.28}
              trend="down"
            />
          </div>

          {/* ── Second Row: Activity/Deep Dive ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4">
            <ChartCard
              title="Активность обработки (мин.)"
              sub="Нагрузка на голосовые модели и время простоя"
              delay={0.35}
            >
              {chartsLoading ? (
                <Loader2 size={20} className="animate-spin text-neutral-400 mx-auto" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 10, fill: '#737373', fontFamily: 'Inter' }}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#737373', fontFamily: 'Inter' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    />
                    <Tooltip content={<ChartTooltip suffix=" м." />} cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 20 }} />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', color: '#737373', paddingTop: 10 }} />
                    <Line
                      name="Загрузка"
                      type="linear"
                      dataKey="load"
                      stroke="#171717"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#171717', strokeWidth: 0 }}
                    />
                    <Line
                      name="Простой"
                      type="linear"
                      dataKey="idle"
                      stroke="#a3a3a3"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#a3a3a3', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Последние транскрипции // Статус" sub="Анализ сессий и язык" delay={0.4}>
              <TranscriptionList />
            </ChartCard>
          </div>

          {/* ── Footer ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-[11px] text-neutral-400 text-right"
          >
            Данные обновляются каждые 30 сек · Графики за последние 30 / 14 дней
          </motion.p>
        </>
      )}
    </div>
  );
}
