'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Zap,
  Activity,
  RussianRuble,
  TrendingUp,
  TrendingDown,
  CreditCard,
  CalendarDays,
  BarChart2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';
import type { AdminStats, AdminChartsData, DayPoint } from '@/types/admin';

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

function ChartTooltip({
  active,
  payload,
  label,
  prefix = '',
  suffix = '',
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black border border-neutral-800 rounded-lg px-3 py-2 shadow-lg text-sm font-inter text-white">
      <p className="text-neutral-400 mb-0.5 text-xs">{label}</p>
      <p className="font-semibold">
        {prefix}{typeof payload[0].value === 'number' ? payload[0].value.toLocaleString('ru-RU') : payload[0].value}{suffix}
      </p>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
  delay?: number;
  trend?: 'up' | 'down' | null;
}

function StatCard({ label, value, sub, icon, delay = 0, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="bg-white border border-black/5 rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col hover:border-black/10 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="font-inter text-base font-semibold text-neutral-800">
          {label}
        </p>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-neutral-200 bg-neutral-50 text-neutral-700">
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
      className={`bg-white border border-black/5 rounded-xl p-6 md:p-8 shadow-sm ${className}`}
    >
      <div className="mb-6">
        <p className="font-inter text-base font-semibold text-neutral-800">{title}</p>
        {sub && <p className="font-inter text-sm text-neutral-600 mt-1">{sub}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Plan distribution donut ──────────────────────────────────────────────────

function PlanDonut({ pro, starter }: { pro: number; starter: number }) {
  const total = pro + starter || 1;
  const proPct = Math.round((pro / total) * 100);
  const startPct = 100 - proPct;

  return (
    <div className="flex flex-col gap-5 mt-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-sm bg-neutral-800 shrink-0" />
            <span className="font-inter text-sm font-medium text-neutral-700">PRO / Team</span>
          </div>
          <span className="font-inter text-sm font-semibold text-neutral-900">
            {pro} <span className="text-neutral-400 font-normal ml-1.5">{proPct}%</span>
          </span>
        </div>
        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full bg-neutral-800 rounded-full" style={{ width: `${proPct}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-sm bg-neutral-300 shrink-0" />
            <span className="font-inter text-sm font-medium text-neutral-700">Starter</span>
          </div>
          <span className="font-inter text-sm font-semibold text-neutral-900">
            {starter} <span className="text-neutral-400 font-normal ml-1.5">{startPct}%</span>
          </span>
        </div>
        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full bg-neutral-300 rounded-full" style={{ width: `${startPct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Tick formatters ──────────────────────────────────────────────────────────

function shortDate(label: string) {
  try { return format(parseISO(label), 'd MMM', { locale: ru }); } catch { return label; }
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

  const revenueData = useMemo(
    () => fillDays(charts?.revenue_by_day ?? [], 30),
    [charts?.revenue_by_day]
  );
  const simData = useMemo(
    () => fillDays(charts?.simulations_by_day ?? [], 14),
    [charts?.simulations_by_day]
  );
  const usersData = useMemo(
    () => fillDays(charts?.users_by_day ?? [], 14),
    [charts?.users_by_day]
  );

  const totalRevenueMonth = stats ? Number(stats.payments_this_month_rub) : 0;
  const proRatio = stats ? Math.round((stats.users_pro / (stats.users_total || 1)) * 100) : 0;

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
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[var(--text-dim)] border border-[var(--border-main)] rounded-lg hover:bg-[var(--bg-surface-alt)] transition-colors cursor-pointer"
        >
          <RefreshCw size={12} />
          Обновить
        </button>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[var(--accent-primary)]" />
        </div>
      )}

      {/* ── Error ── */}
      {statsError && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <p>
            <span className="font-semibold">Ошибка:</span>{' '}
            {statsErr instanceof Error ? statsErr.message : 'Не удалось загрузить статистику.'}
          </p>
        </div>
      )}

      {stats && (
        <>
          {/* ── Hero metric cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Пользователи"
              value={stats.users_total}
              sub={`${proRatio}% с платным планом`}
              icon={<Users size={18} />}
              accent="" iconBg=""
              delay={0}
              trend={null}
            />
            <StatCard
              label="Выручка / месяц"
              value={`${totalRevenueMonth.toLocaleString('ru-RU')} ₽`}
              sub={`Всего: ${Number(stats.payments_total_rub).toLocaleString('ru-RU')} ₽`}
              icon={<RussianRuble size={18} />}
              accent="" iconBg=""
              delay={0.07}
              trend="up"
            />
            <StatCard
              label="Активных подписок"
              value={stats.active_subs_count}
              sub={`PRO/Team: ${stats.users_pro}`}
              icon={<Zap size={18} />}
              accent="" iconBg=""
              delay={0.14}
              trend={null}
            />
            <StatCard
              label="Симуляции сегодня"
              value={stats.simulations_today}
              sub={`Всего: ${stats.simulations_total.toLocaleString('ru-RU')}`}
              icon={<Activity size={18} />}
              accent="" iconBg=""
              delay={0.21}
              trend={null}
            />
          </div>

          {/* ── Secondary metrics row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Starter пользователи', value: stats.users_starter, icon: <CreditCard size={16} /> },
              { label: 'PRO / Team пользователи', value: stats.users_pro, icon: <Zap size={16} /> },
              { label: 'Всего платежей', value: stats.payments_count_total, icon: <BarChart2 size={16} /> },
              { label: 'Симуляций всего', value: stats.simulations_total, icon: <CalendarDays size={16} /> },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                className="bg-neutral-50/50 border border-black/5 rounded-xl px-4 py-4 flex items-center justify-between gap-3 shadow-sm hover:border-black/10 transition-colors"
              >
                <div>
                  <p className="font-inter text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    {item.label}
                  </p>
                  <p
                    className="font-inter text-xl font-bold text-neutral-900 tracking-tight"
                  >
                    {item.value.toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="text-neutral-400">{item.icon}</div>
              </motion.div>
            ))}
          </div>

          {/* ── Charts row 1: Revenue + Plan split ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard
              title="Выручка за 30 дней"
              sub="Оплаченные платежи, ₽"
              delay={0.35}
              className="lg:col-span-2"
            >
              {chartsLoading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-neutral-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 10, fill: '#737373', fontFamily: 'Inter' }}
                      tickLine={false}
                      axisLine={false}
                      interval={5}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#737373', fontFamily: 'Inter' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    />
                    <Tooltip content={<ChartTooltip suffix=" ₽" />} />
                    <Line
                      type="linear"
                      dataKey="value"
                      stroke="#171717"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#171717', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Распределение планов" sub="Активные пользователи" delay={0.4}>
              <PlanDonut pro={stats.users_pro} starter={stats.users_starter} />
            </ChartCard>
          </div>

          {/* ── Charts row 2: Simulations + Users ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Симуляции за 14 дней" sub="Количество запущенных сессий" delay={0.45}>
              {chartsLoading ? (
                <div className="h-[180px] flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-neutral-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={simData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={8}>
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
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip suffix=" сессий" />} />
                    <Bar dataKey="value" fill="#171717" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Новые пользователи за 14 дней" sub="Регистрации по дням" delay={0.5}>
              {chartsLoading ? (
                <div className="h-[180px] flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-neutral-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={usersData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip suffix=" чел." />} />
                    <Line
                      type="linear"
                      dataKey="value"
                      stroke="#737373"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#737373', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* ── Footer ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-[11px] text-[var(--text-dim)] text-right"
          >
            Данные обновляются каждые 30 сек · Графики за последние 30 / 14 дней
          </motion.p>
        </>
      )}
    </div>
  );
}
