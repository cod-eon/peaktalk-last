'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────────

type TrajectoryEntry = {
  session_id: string;
  created_at: string;
  metrics: Record<string, number>;
};

type MetricTrend = {
  latest: number;
  average: number;
  trend: 'up' | 'down' | 'stable' | 'baseline';
  sessions_count: number;
};

type ProgressSummary = {
  strongest_skill: string | null;
  strongest_score: number | null;
  weakest_skill: string | null;
  weakest_score: number | null;
};

type ProgressData = {
  total_sessions: number;
  trajectory: TrajectoryEntry[];
  metric_trends: Record<string, MetricTrend>;
  summary: ProgressSummary | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function scoreTo10(score: number): number {
  return Math.round(score * 10);
}

function scoreColor(score: number): string {
  if (score >= 0.7) return '#10b981';
  if (score >= 0.5) return '#f59e0b';
  return '#e11d48';
}

function trendIcon(trend: string) {
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-600" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />;
  if (trend === 'stable') return <Minus size={14} className="text-neutral-400" />;
  return <BarChart2 size={14} className="text-neutral-300" />;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

// ─── Trend Arrow Badge ──────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: string }) {
  const cfg =
    trend === 'up'
      ? { label: 'Растёт', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
      : trend === 'down'
        ? { label: 'Падает', cls: 'bg-red-50 text-red-600 border border-red-200' }
        : trend === 'stable'
          ? { label: 'Стабильно', cls: 'bg-neutral-100 text-neutral-600 border border-neutral-200' }
          : { label: 'Базовый', cls: 'bg-neutral-50 text-neutral-400 border border-neutral-100' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-semibold tracking-wide uppercase ${cfg.cls}`}>
      {trendIcon(trend)}
      {cfg.label}
    </span>
  );
}

// ─── Last Sessions Summary ─────────────────────────────────────────────────────

function LastSessions({ trajectory }: { trajectory: TrajectoryEntry[] }) {
  if (trajectory.length === 0) return null;

  const last5 = trajectory.slice(-5).reverse();

  return (
    <div className="divide-y divide-neutral-100">
      {last5.map((entry, idx) => {
        const values = Object.values(entry.metrics);
        const avgScore =
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;

        return (
          <motion.div
            key={entry.session_id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            className="flex items-center gap-4 py-3"
          >
            {/* Date */}
            <span className="text-[12px] font-mono text-neutral-500 w-20 shrink-0">
              {formatDate(entry.created_at)}
            </span>

            {/* Mini bar */}
            <div className="flex-1 h-2 bg-neutral-100 overflow-hidden rounded-none min-w-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(avgScore * 100)}%` }}
                transition={{ duration: 0.4, delay: 0.05 + idx * 0.04 }}
                className="h-full rounded-none"
                style={{ backgroundColor: scoreColor(avgScore) }}
              />
            </div>

            {/* Score */}
            <span
              className="text-[12px] font-bold font-mono w-10 text-right shrink-0"
              style={{ color: scoreColor(avgScore) }}
            >
              {scoreTo10(avgScore)}/10
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Loading ────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-neutral-400" />
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
      <BarChart2 size={32} className="opacity-40" />
      <p className="text-sm font-medium">Пока нет завершённых сессий</p>
      <p className="text-xs text-neutral-300">Пройдите первую симуляцию, чтобы увидеть прогресс</p>
    </div>
  );
}

// ─── Main Content ───────────────────────────────────────────────────────────────

function ProgressContent() {
  const { data, isLoading } = useQuery<ProgressData>({
    queryKey: ['simulation-progress'],
    queryFn: () => api.get('/simulation/progress/narrative'),
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) return <LoadingState />;

  if (!data || data.total_sessions === 0) return <EmptyState />;

  const trendEntries = Object.entries(data.metric_trends);

  return (
    <div className="pb-16 pt-6 sm:pt-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#73706A] mb-2">
            readiness trend
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">Прогресс</h1>
          <p className="text-sm font-medium text-[#73706A] mt-1 max-w-xl">
            Динамика устойчивости аргументации по завершённым стресс-тестам.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#D9D5CC]">
          <BarChart2 size={16} className="text-[#73706A]" />
          <span className="text-sm font-semibold text-[#111827]">{data.total_sessions}</span>
          <span className="text-sm text-[#73706A]">
            {data.total_sessions === 1 ? 'сессия' : data.total_sessions < 5 ? 'сессии' : 'сессий'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">

        {/* ─── Metric trends table ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.03 }}
          className="bg-white rounded-none border border-[#D9D5CC] p-6"
        >
          <h2 className="font-mono text-[10px] font-bold text-[#73706A] tracking-[0.18em] uppercase mb-5">
            Динамика по метрикам
          </h2>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                    Метрика
                  </th>
                  <th className="text-right py-2 px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                    Последний
                  </th>
                  <th className="text-right py-2 px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                    Средний
                  </th>
                  <th className="text-right py-2 px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                    Сессий
                  </th>
                  <th className="text-center py-2 px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                    Тренд
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {trendEntries.map(([name, t]) => (
                  <tr key={name} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-2 text-neutral-900 text-[13px] font-medium">{name}</td>
                    <td className="py-3 px-2 text-right font-mono font-semibold" style={{ color: scoreColor(t.latest) }}>
                      {scoreTo10(t.latest)}/10
                    </td>
                    <td className="py-3 px-2 text-right text-neutral-500 text-[13px] font-mono">
                      {scoreTo10(t.average)}/10
                    </td>
                    <td className="py-3 px-2 text-right text-neutral-400 text-[12px] font-mono">
                      {t.sessions_count}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <TrendBadge trend={t.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ─── Last sessions ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="bg-white rounded-none border border-[#D9D5CC] p-6"
        >
          <h2 className="font-mono text-[10px] font-bold text-[#73706A] tracking-[0.18em] uppercase mb-4">
            Последние сессии
          </h2>
          <LastSessions trajectory={data.trajectory} />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProgressContent />
    </Suspense>
  );
}
