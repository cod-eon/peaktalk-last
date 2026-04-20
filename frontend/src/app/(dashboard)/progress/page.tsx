'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Loader2,
  Trophy,
  AlertTriangle,
  Zap,
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

// ─── Skill Badge ────────────────────────────────────────────────────────────────

function SkillBadge({ label, score, variant }: { label: string; score: number; variant: 'strongest' | 'weakest' }) {
  const color = variant === 'strongest' ? 'emerald' : 'rose';
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-none border ${
      variant === 'strongest'
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-rose-50 border-rose-200'
    }`}>
      {variant === 'strongest'
        ? <Trophy size={16} className="text-emerald-600" />
        : <AlertTriangle size={16} className="text-rose-500" />
      }
      <div className="flex flex-col">
        <span className={`text-[10px] font-bold tracking-widest uppercase ${
          variant === 'strongest' ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          {variant === 'strongest' ? 'Сильнейшая' : 'Слабейшая'}
        </span>
        <span className="text-sm font-semibold text-neutral-900">{label}</span>
        <span className="text-xs font-mono text-neutral-500">{scoreTo10(score)}/10</span>
      </div>
    </div>
  );
}

// ─── Trajectory Timeline ────────────────────────────────────────────────────────

function TrajectoryTimeline({ trajectory, metricNames }: { trajectory: TrajectoryEntry[]; metricNames: string[] }) {
  if (trajectory.length === 0) return null;

  const METRIC_COLORS: Record<string, string> = {
    'Структура аргументации': '#10b981',
    'Уверенность подачи': '#3b82f6',
    'Работа с контраргументами': '#f59e0b',
    'Конкретика и цифры': '#8b5cf6',
    'Эмоциональный интеллект': '#ec4899',
    'Стратегическое мышление': '#06b6d4',
  };

  const getColor = (name: string) => METRIC_COLORS[name] || '#6b7280';

  return (
    <div className="space-y-4">
      {trajectory.map((entry, idx) => {
        const avgScore =
          Object.values(entry.metrics).length > 0
            ? Object.values(entry.metrics).reduce((a, b) => a + b, 0) / Object.values(entry.metrics).length
            : 0;

        return (
          <motion.div
            key={entry.session_id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.04 }}
            className="relative flex gap-3"
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center shrink-0 pt-1">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: scoreColor(avgScore) }}
              />
              {idx < trajectory.length - 1 && (
                <div className="w-px flex-1 bg-neutral-200 mt-1" />
              )}
            </div>

            {/* Session card */}
            <div className="flex-1 bg-neutral-50 border border-neutral-200 p-3 mb-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-neutral-400 tracking-wider uppercase">
                  Сессия {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-500">
                    {formatDate(entry.created_at)}
                  </span>
                  <span
                    className="text-[11px] font-bold font-mono"
                    style={{ color: scoreColor(avgScore) }}
                  >
                    {scoreTo10(avgScore)}/10
                  </span>
                </div>
              </div>

              {/* Metric bars */}
              <div className="flex flex-col gap-1">
                {metricNames.map((name) => {
                  const score = entry.metrics[name];
                  if (score === undefined) return null;
                  return (
                    <div key={name} className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-500 w-36 truncate shrink-0">{name}</span>
                      <div className="flex-1 h-1.5 bg-neutral-200 overflow-hidden rounded-none">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(score * 100)}%` }}
                          transition={{ duration: 0.5, delay: 0.1 + idx * 0.04 }}
                          className="h-full rounded-none"
                          style={{ backgroundColor: getColor(name) }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-mono font-semibold w-6 text-right"
                        style={{ color: getColor(name) }}
                      >
                        {scoreTo10(score)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
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

  const metricNames = Object.keys(data.metric_trends).sort();
  const trendEntries = Object.entries(data.metric_trends);

  return (
    <div className="pb-16 pt-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 font-inter bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Прогресс</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            Динамика навыков по результатам ваших симуляций.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200">
          <Zap size={16} className="text-neutral-600" />
          <span className="text-sm font-semibold text-neutral-900">{data.total_sessions}</span>
          <span className="text-sm text-neutral-500">
            {data.total_sessions === 1 ? 'сессия' : data.total_sessions < 5 ? 'сессии' : 'сессий'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">

        {/* ─── Skill badges ─── */}
        {data.summary && (data.summary.strongest_skill || data.summary.weakest_skill) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-none border border-neutral-200 p-6"
          >
            <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-4">
              Навыки-выделки
            </h2>
            <div className="flex flex-wrap gap-3">
              {data.summary.strongest_skill && data.summary.strongest_score !== null && (
                <SkillBadge
                  label={data.summary.strongest_skill}
                  score={data.summary.strongest_score}
                  variant="strongest"
                />
              )}
              {data.summary.weakest_skill && data.summary.weakest_score !== null && (
                <SkillBadge
                  label={data.summary.weakest_skill}
                  score={data.summary.weakest_score}
                  variant="weakest"
                />
              )}
            </div>
          </motion.div>
        )}

        {/* ─── Metric trends table ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.03 }}
          className="bg-white rounded-none border border-neutral-200 p-6"
        >
          <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-5">
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

        {/* ─── Trajectory timeline ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="bg-white rounded-none border border-neutral-200 p-6"
        >
          <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-5">
            Хронология сессий
          </h2>
          <TrajectoryTimeline trajectory={data.trajectory} metricNames={metricNames} />
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
