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
  PieChart,
  Pie,
  Cell,
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
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl px-3 py-2 shadow-lg text-[12px]">
      <p className="text-[var(--text-dim)] mb-0.5">{label}</p>
      <p className="font-semibold text-[var(--text-main)]">
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

function StatCard({ label, value, sub, icon, accent, iconBg, delay = 0, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-5 shadow-[var(--shadow-card)] relative overflow-hidden group hover:border-[var(--accent-primary)]/30 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--bg-surface-alt)]/40 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-dim)] mb-3">
            {label}
          </p>
          <div
            className={`text-[32px] font-black leading-none ${accent}`}
            style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.03em' }}
          >
            {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
          </div>
          {sub && (
            <div className="mt-2 flex items-center gap-1">
              {trend === 'up' && <TrendingUp size={11} className="text-emerald-500 shrink-0" />}
              {trend === 'down' && <TrendingDown size={11} className="text-red-400 shrink-0" />}
              <p className="text-[11px] text-[var(--text-dim)]">{sub}</p>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
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
      className={`bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="mb-4">
        <p className="text-[13px] font-semibold text-[var(--text-main)]">{title}</p>
        {sub && <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{sub}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Plan distribution donut ──────────────────────────────────────────────────

const PLAN_COLORS = ['#E8600A', '#7c3aed', '#64748b'];

function PlanDonut({ pro, starter }: { pro: number; starter: number }) {
  const total = pro + starter || 1;
  const data = [
    { name: 'PRO / Team', value: pro, color: PLAN_COLORS[0] },
    { name: 'Starter', value: starter, color: PLAN_COLORS[1] },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    data.push({ name: 'Нет данных', value: 1, color: PLAN_COLORS[2] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n} (${Math.round((n / total) * 100)}%)`, '']; }}
              contentStyle={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-main)',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2">
        {[
          { label: 'PRO / Team', value: pro, color: PLAN_COLORS[0] },
          { label: 'Starter', value: starter, color: PLAN_COLORS[1] },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[var(--text-dim)]">{item.label}</span>
            </div>
            <span className="font-semibold text-[var(--text-main)]">
              {item.value} <span className="text-[var(--text-dim)] font-normal">({Math.round((item.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
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
          <p className="text-[11px] text-[var(--text-dim)] font-semibold uppercase tracking-widest mb-1.5">
            Панель администратора
          </p>
          <h1
            className="text-[28px] sm:text-[32px] font-black text-[var(--text-main)] leading-tight"
            style={{ letterSpacing: '-0.03em', fontFamily: 'var(--font-syne)' }}
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Пользователи"
              value={stats.users_total}
              sub={`${proRatio}% с платным планом`}
              icon={<Users size={18} className="text-blue-600" />}
              accent="text-blue-600"
              iconBg="bg-blue-50"
              delay={0}
              trend={null}
            />
            <StatCard
              label="Выручка / месяц"
              value={`${totalRevenueMonth.toLocaleString('ru-RU')} ₽`}
              sub={`Всего: ${Number(stats.payments_total_rub).toLocaleString('ru-RU')} ₽`}
              icon={<RussianRuble size={18} className="text-accent-600" />}
              accent="text-accent-600"
              iconBg="bg-accent-50"
              delay={0.07}
              trend="up"
            />
            <StatCard
              label="Активных подписок"
              value={stats.active_subs_count}
              sub={`PRO/Team: ${stats.users_pro}`}
              icon={<Zap size={18} className="text-violet-600" />}
              accent="text-violet-600"
              iconBg="bg-violet-50"
              delay={0.14}
              trend={null}
            />
            <StatCard
              label="Симуляции сегодня"
              value={stats.simulations_today}
              sub={`Всего: ${stats.simulations_total.toLocaleString('ru-RU')}`}
              icon={<Activity size={18} className="text-emerald-600" />}
              accent="text-emerald-600"
              iconBg="bg-emerald-50"
              delay={0.21}
              trend={null}
            />
          </div>

          {/* ── Secondary metrics row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Starter пользователи', value: stats.users_starter, icon: <CreditCard size={15} /> },
              { label: 'PRO / Team пользователи', value: stats.users_pro, icon: <Zap size={15} /> },
              { label: 'Всего платежей', value: stats.payments_count_total, icon: <BarChart2 size={15} /> },
              { label: 'Симуляций всего', value: stats.simulations_total, icon: <CalendarDays size={15} /> },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
                className="bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1">
                    {item.label}
                  </p>
                  <p
                    className="text-[20px] font-bold text-[var(--text-main)]"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {item.value.toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="text-[var(--text-dim)] opacity-50">{item.icon}</div>
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
                  <Loader2 size={20} className="animate-spin text-[var(--text-dim)]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8600A" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#E8600A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={5}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    />
                    <Tooltip content={<ChartTooltip suffix=" ₽" />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#E8600A"
                      strokeWidth={2}
                      fill="url(#revGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#E8600A', strokeWidth: 0 }}
                    />
                  </AreaChart>
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
                  <Loader2 size={20} className="animate-spin text-[var(--text-dim)]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={simData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip suffix=" сессий" />} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Новые пользователи за 14 дней" sub="Регистрации по дням" delay={0.5}>
              {chartsLoading ? (
                <div className="h-[180px] flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-[var(--text-dim)]" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={usersData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="usrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={shortDate}
                      tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip suffix=" чел." />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
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
