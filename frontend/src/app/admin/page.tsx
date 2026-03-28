'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Zap,
  TrendingUp,
  RussianRuble,
  Activity,
  CalendarDays,
  CreditCard,
  Loader2,
  AlertCircle,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminStats } from '@/types/admin';

// ─── Metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'orange' | 'violet' | 'emerald' | 'blue' | 'default';
  delay?: number;
  suffix?: string;
}

const ACCENT_MAP = {
  orange: {
    icon: 'bg-orange-100 text-orange-600',
    value: 'text-orange-600',
    border: 'border-orange-100',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-600',
    value: 'text-violet-600',
    border: 'border-violet-100',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-600',
    border: 'border-emerald-100',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-600',
    border: 'border-blue-100',
  },
  default: {
    icon: 'bg-[var(--bg-surface-alt)] text-[var(--text-dim)]',
    value: 'text-[var(--text-main)]',
    border: 'border-[var(--border-main)]',
  },
};

function MetricCard({ label, value, icon, accent = 'default', delay = 0, suffix }: MetricCardProps) {
  const colors = ACCENT_MAP[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={`bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border ${colors.border} p-5 shadow-[var(--shadow-card)] relative overflow-hidden`}
    >
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04] pointer-events-none" aria-hidden="true">
        <div className="w-full h-full rounded-full bg-current transform translate-x-8 -translate-y-8" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-2">
            {label}
          </p>
          <div className={`text-[28px] font-bold leading-none ${colors.value}`} style={{ fontFamily: 'var(--font-syne)' }}>
            {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
            {suffix && <span className="text-[18px] ml-1 font-medium opacity-70">{suffix}</span>}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const { data, isLoading, isError, error } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats'),
    staleTime: 30_000,
    retry: 1,
  });

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[var(--text-dim)] mb-1.5 font-semibold uppercase tracking-wider">
          Панель администратора
        </p>
        <h1
          className="text-[28px] sm:text-[32px] font-bold text-[var(--text-main)] leading-tight"
          style={{ letterSpacing: '-0.025em', fontFamily: 'var(--font-syne)' }}
        >
          Статистика
        </h1>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-[var(--accent-primary)]" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
          <p>
            <span className="font-semibold">Ошибка загрузки:</span>{' '}
            {error instanceof Error ? error.message : 'Не удалось загрузить статистику.'}
          </p>
        </div>
      )}

      {/* Grid */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Всего пользователей"
            value={data.total_users}
            icon={<Users size={18} />}
            accent="default"
            delay={0}
          />
          <MetricCard
            label="PRO пользователи"
            value={data.pro_users}
            icon={<Zap size={18} />}
            accent="orange"
            delay={0.05}
          />
          <MetricCard
            label="Starter пользователи"
            value={data.starter_users}
            icon={<UserPlus size={18} />}
            accent="default"
            delay={0.1}
          />
          <MetricCard
            label="Team пользователи"
            value={data.team_users}
            icon={<UserCheck size={18} />}
            accent="violet"
            delay={0.15}
          />
          <MetricCard
            label="Всего симуляций"
            value={data.total_simulations}
            icon={<Activity size={18} />}
            accent="blue"
            delay={0.2}
          />
          <MetricCard
            label="Симуляции сегодня"
            value={data.simulations_today}
            icon={<CalendarDays size={18} />}
            accent="emerald"
            delay={0.25}
          />
          <MetricCard
            label="Общая выручка"
            value={data.total_revenue.toLocaleString('ru-RU')}
            icon={<RussianRuble size={18} />}
            accent="emerald"
            delay={0.3}
            suffix="₽"
          />
          <MetricCard
            label="Выручка в этом месяце"
            value={data.revenue_this_month.toLocaleString('ru-RU')}
            icon={<TrendingUp size={18} />}
            accent="orange"
            delay={0.35}
            suffix="₽"
          />
          <MetricCard
            label="Активных подписок"
            value={data.active_subscriptions}
            icon={<CreditCard size={18} />}
            accent="violet"
            delay={0.4}
          />
        </div>
      )}

      {/* Last updated */}
      {data && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-[12px] text-[var(--text-dim)] text-right"
        >
          Обновляется каждые 30 секунд
        </motion.p>
      )}
    </div>
  );
}
