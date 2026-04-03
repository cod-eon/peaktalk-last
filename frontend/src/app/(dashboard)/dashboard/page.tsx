"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  Play,
  CheckCircle2,
  Clock,
  Target,
  BarChart2,
  Zap,
  MessageSquare,
  FileText,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, parseISO, startOfDay, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

type PersonaConfig = {
  role: string;
  industry: string;
  difficulty: number;
};

type SimSession = {
  id: string;
  persona_config: PersonaConfig;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  message_count: number;
  avg_score: number | null;
  document_title: string | null;
};

type SimListResponse = { items: SimSession[]; total: number };
type DocListResponse = { items: unknown[]; total: number };

// ── Constants ────────────────────────────────────────────────────────────────

const PERSONA_LABELS: Record<string, string> = {
  hr_interviewer: 'HR-интервью',
  technical_interviewer: 'Тех. интервью',
  behavioral_interviewer: 'Поведенческое',
  investor: 'Питч инвестору',
  client: 'Питч клиенту',
  mentor: 'Менторская сессия',
  conference: 'Доклад',
  teacher: 'Защита',
};

function getPersonaLabel(role: string): string {
  return PERSONA_LABELS[role] ?? role;
}

function isInterviewSession(role: string): boolean {
  return role.includes('interview');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return 'text-neutral-400';
  const s = score * 10;
  if (s >= 7) return 'text-emerald-600';
  if (s >= 4.5) return 'text-amber-500';
  return 'text-red-500';
}

function buildChartData(sessions: SimSession[], days: number) {
  const today = startOfDay(new Date());
  return Array.from({ length: days }, (_, i) => {
    const day = subDays(today, days - 1 - i);
    const daySessions = sessions.filter((s) =>
      isSameDay(parseISO(s.created_at), day)
    );
    const interviews = daySessions.filter((s) => isInterviewSession(s.persona_config.role)).length;
    const pitches    = daySessions.filter((s) => !isInterviewSession(s.persona_config.role)).length;
    return {
      date: format(day, days <= 7 ? 'd MMM' : 'd MMM', { locale: ru }),
      interviews,
      pitches,
    };
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black border border-neutral-800 rounded-lg px-3 py-2 shadow-lg text-sm font-inter text-white min-w-[140px]">
      <p className="text-neutral-400 mb-2 text-xs font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1 last:mb-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke }} />
            <span className="text-neutral-300 font-medium">{entry.name}</span>
          </div>
          <span className="font-bold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function MetricPod({
  label, value, sub, icon, delay = 0, highlight = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  delay?: number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="bg-white rounded-xl border border-black/5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden flex flex-col group hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-orange-500/[0.015] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex justify-between items-start mb-5 relative z-10">
        <span className="font-inter text-sm font-semibold text-neutral-600 leading-tight break-words max-w-[80%] pr-2">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${highlight ? 'bg-orange-50 border border-orange-100 text-orange-500' : 'bg-neutral-50 border border-neutral-100 text-neutral-500'}`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10 flex flex-col justify-end flex-1">
        <span className="font-inter text-3xl font-bold text-neutral-900 tracking-tight leading-none">
          {value}
        </span>
        {sub && <p className="font-inter text-[13px] text-neutral-400 mt-2 font-medium">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const displayName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Пользователь';

  const [chartDays, setChartDays] = useState<7 | 30>(7);

  const { data: simData, isLoading: simLoading } = useQuery<SimListResponse>({
    queryKey: ['simulations-dashboard'],
    queryFn: () => api.get('/simulation?limit=200'),
    staleTime: 30_000,
  });

  const { data: docsData } = useQuery<DocListResponse>({
    queryKey: ['documents-count'],
    queryFn: () => api.get('/documents?limit=1'),
    staleTime: 60_000,
  });

  // ── Derived metrics ──────────────────────────────────────────────────────

  const simSessions   = simData?.items ?? [];
  const completedSims = simSessions.filter((s) => s.status === 'completed');
  const activeSims    = simSessions.filter((s) => s.status === 'active');

  const simScores = completedSims
    .filter((s) => s.avg_score != null)
    .map((s) => s.avg_score as number);

  const avgScore = simScores.length
    ? simScores.reduce((a, b) => a + b, 0) / simScores.length
    : null;

  const totalMessages = simSessions.reduce((sum, s) => sum + (s.message_count ?? 0), 0);
  const totalMinutes  = Math.round(totalMessages * 1.5);

  const docCount = docsData?.total ?? 0;

  // ── Chart data (real, grouped by day) ────────────────────────────────────

  const chartData = useMemo(
    () => buildChartData(simSessions, chartDays),
    [simSessions, chartDays]
  );

  // ── Recent sessions for history ──────────────────────────────────────────

  const recentLogs = useMemo(
    () =>
      completedSims.slice(0, 6).map((s) => ({
        id:        s.id,
        persona:   getPersonaLabel(s.persona_config.role),
        industry:  s.persona_config.industry !== 'general' ? s.persona_config.industry : null,
        difficulty: s.persona_config.difficulty,
        date:      format(parseISO(s.created_at), 'd MMM', { locale: ru }),
        score:     s.avg_score,
        docTitle:  s.document_title,
        msgCount:  s.message_count,
      })),
    [completedSims]
  );

  const isLoading = simLoading;

  return (
    <div className="pb-16 md:pb-12 pt-6 sm:pt-8 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── 1. COMMAND ACTION HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mb-8 bg-white/70 backdrop-blur-xl rounded-2xl border border-black/5 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/[0.04] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex-1">
          <h1 className="font-inter text-2xl md:text-[28px] font-bold text-neutral-900 tracking-tight mb-2.5">
            Добро пожаловать, {displayName}.
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-inter text-[13px] text-neutral-600 font-medium">
                ИИ-тренер активен
              </span>
            </div>
            {activeSims.length > 0 && (
              <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                {activeSims.length} активная сессия
              </span>
            )}
            {completedSims.length > 0 && (
              <span className="text-[11px] font-medium text-neutral-500">
                {completedSims.length} завершено
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0 w-full md:w-auto">
          <Link
            href="/upload"
            className="group flex flex-1 sm:flex-none items-center gap-3.5 bg-white/50 backdrop-blur-md border border-black/5 rounded-xl px-5 py-4 min-w-[220px] hover:bg-white hover:shadow-sm hover:border-black/10 transition-all duration-300"
          >
            <div className="bg-neutral-100 rounded-lg p-2 text-neutral-600 group-hover:text-neutral-900 transition-colors">
              <UploadCloud size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-inter text-sm font-bold text-neutral-900 leading-tight mb-0.5">
                Загрузить документы
              </span>
              <span className="font-inter text-[11px] font-medium text-neutral-500 uppercase tracking-widest">
                Новый контекст
              </span>
            </div>
          </Link>

          <Link
            href="/simulation"
            className="group flex flex-1 sm:flex-none items-center gap-3.5 bg-[var(--color-accent)] border border-[var(--color-accent)] rounded-xl px-5 py-4 min-w-[220px] hover:bg-orange-700 hover:border-orange-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="bg-white/20 rounded-lg p-2 text-white group-hover:scale-105 transition-transform">
              <Play size={20} className="fill-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-inter text-sm font-bold text-white leading-tight mb-0.5">
                Начать симуляцию
              </span>
              <span className="font-inter text-[11px] font-medium text-white/60 uppercase tracking-widest">
                Питч & Собеседование
              </span>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* ── LOADING ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" />
        </div>
      ) : (
        <>
          {/* ── 2. METRICS ROW ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricPod
              label="Сессий пройдено"
              value={completedSims.length}
              sub={
                simSessions.length > completedSims.length
                  ? `${simSessions.length} всего, ${simSessions.length - completedSims.length} незавершена`
                  : completedSims.length > 0
                  ? 'Все завершены'
                  : 'Ожидание активности'
              }
              icon={<Target size={18} strokeWidth={2.5} />}
              delay={0.1}
            />
            <MetricPod
              label="Минуты практики"
              value={totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}ч ${totalMinutes % 60}м` : `${totalMinutes}м`}
              sub={`${totalMessages} сообщений в ${simSessions.length} сессиях`}
              icon={<Clock size={18} strokeWidth={2.5} />}
              delay={0.2}
            />
            <MetricPod
              label="Средний балл ИИ"
              value={avgScore !== null ? `${(avgScore * 10).toFixed(1)}/10` : '—'}
              sub={simScores.length > 0 ? `На основе ${simScores.length} сессий` : 'Нет завершённых сессий'}
              icon={<Zap size={18} strokeWidth={2.5} />}
              delay={0.3}
              highlight={avgScore !== null && avgScore >= 0.7}
            />
            <MetricPod
              label="Документов загружено"
              value={docCount}
              sub={docCount > 0 ? 'Доступны для симуляции' : 'Загрузите первый документ'}
              icon={<FileText size={18} strokeWidth={2.5} />}
              delay={0.4}
            />
          </div>

          {/* ── 3. SECOND ROW: CHART + HISTORY ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4">

            {/* LEFT: PRACTICE ACTIVITY CHART */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
              className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden"
            >
              <div className="p-6 border-b border-black/[0.03] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="font-inter text-base font-bold text-neutral-900">
                    Активность по дням
                  </h2>
                  <p className="font-inter text-xs font-medium text-neutral-500 mt-1">
                    Сессий: {chartData.reduce((a, d) => a + d.interviews + d.pitches, 0)} за {chartDays} дней
                  </p>
                </div>
                <div className="flex bg-neutral-100/80 p-1 rounded-[10px] w-max border border-black/[0.02]">
                  {([7, 30] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setChartDays(d)}
                      className={`px-4 py-1.5 font-inter text-xs font-semibold rounded-md transition-all ${
                        chartDays === d
                          ? 'bg-white shadow-sm border border-black/[0.04] text-neutral-900'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      {d} дней
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 relative flex-1 min-h-[280px] bg-neutral-50/30">
                {simSessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                    <BarChart2 className="text-neutral-200" size={36} />
                    <div>
                      <p className="font-inter text-sm font-medium text-neutral-500">
                        Пока нет данных для графика
                      </p>
                      <p className="font-inter text-xs text-neutral-400 mt-1">
                        Данные появятся после первой симуляции
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#171717" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPitches" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ea580c" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#737373', fontFamily: 'Inter', fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        interval={chartDays === 30 ? 4 : 0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#737373', fontFamily: 'Inter', fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        tickMargin={12}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.04)', strokeWidth: 32 }} />
                      <Legend
                        iconType="rect"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', fontWeight: 600, color: '#404040', paddingTop: 20 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="interviews"
                        name="Собеседования"
                        stroke="#171717"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#colorInterviews)"
                        activeDot={{ r: 4, fill: '#171717', strokeWidth: 0 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pitches"
                        name="Питчи & Доклады"
                        stroke="#ea580c"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#colorPitches)"
                        activeDot={{ r: 4, fill: '#ea580c', strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* RIGHT: SESSION HISTORY LOG */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
              className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden h-[420px] lg:h-auto"
            >
              <div className="p-6 border-b border-black/[0.03] shrink-0 flex items-center justify-between">
                <div>
                  <h2 className="font-inter text-base font-bold text-neutral-900">История сессий</h2>
                  <p className="font-inter text-xs font-medium text-neutral-500 mt-1">
                    {completedSims.length > 0
                      ? `${completedSims.length} завершённых`
                      : 'Нет завершённых сессий'}
                  </p>
                </div>
                {completedSims.length > 6 && (
                  <Link
                    href="/simulation"
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
                  >
                    Все <ArrowRight size={11} />
                  </Link>
                )}
              </div>

              <div className="p-4 flex flex-col gap-2.5 overflow-y-auto flex-1">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <Link
                      key={log.id}
                      href={`/simulation/${log.id}/report`}
                      className="group bg-white border border-black/[0.06] rounded-xl p-4 shadow-sm hover:shadow-md hover:border-black/15 transition-all cursor-pointer block"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                            <MessageSquare size={12} strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-inter text-[13px] font-bold text-neutral-900 leading-tight truncate">
                              {log.persona}
                            </p>
                            {log.docTitle && (
                              <p className="font-inter text-[10px] text-neutral-400 truncate mt-0.5">
                                {log.docTitle}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 ml-2">
                          <span className={`font-inter text-lg font-bold leading-none ${scoreColor(log.score)}`}>
                            {log.score != null ? (log.score * 10).toFixed(1) : '—'}
                          </span>
                          {log.score != null && (
                            <span className="font-inter text-[9px] text-neutral-400 font-bold">/10</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-inter text-[9px] uppercase font-bold tracking-widest text-neutral-400">
                          {log.date}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-neutral-300" />
                        <span className="font-inter text-[9px] text-neutral-400">
                          {log.msgCount} сообщений
                        </span>
                        {log.industry && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-neutral-300" />
                            <span className="font-inter text-[9px] text-neutral-400 capitalize">
                              {log.industry}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-6 flex-col gap-3">
                    <Target className="text-neutral-200" size={32} />
                    <div>
                      <p className="font-inter text-sm font-medium text-neutral-500">
                        История пуста
                      </p>
                      <p className="font-inter text-xs text-neutral-400 mt-1">
                        Завершённые сессии появятся здесь
                      </p>
                    </div>
                    <Link
                      href="/simulation"
                      className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Начать первую <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </>
      )}
    </div>
  );
}
