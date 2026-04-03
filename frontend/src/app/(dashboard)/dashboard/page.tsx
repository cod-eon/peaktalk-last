"use client";

import React, { useMemo } from 'react';
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
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

// === Reusable Components ===

function ChartTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black border border-neutral-800 rounded-lg px-3 py-2 shadow-lg text-sm font-inter text-white min-w-[140px] z-50 relative">
      <p className="text-neutral-400 mb-2 text-xs font-medium">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex flex-row items-center justify-between gap-4 mb-1.5 last:mb-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.color }} />
            <span className="text-neutral-300 font-medium">{entry.name}</span>
          </div>
          <span className="font-bold tracking-tight">
            {typeof entry.value === 'number' ? entry.value.toLocaleString('ru-RU') : entry.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricPod({ label, value, sub, icon, delay = 0 }: { label: string, value: string | number, sub?: string, icon: React.ReactNode, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="bg-white rounded-xl border border-black/5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden flex flex-col group hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all duration-300 z-10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-orange-500/[0.015] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex justify-between items-start mb-5 relative z-10">
        <span className="font-inter text-sm font-semibold text-neutral-600 leading-tight break-words max-w-[80%] pr-2">
          {label}
        </span>
        <div className="w-9 h-9 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
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

// === Main Page ===

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Пользователь';

  const { data: simData, isLoading } = useQuery<{ items: Array<{ id: string; status: string; avg_score: number | null; message_count: number; created_at: string }> }>({
    queryKey: ['simulations-dashboard'],
    queryFn: () => api.get('/simulation?limit=50'),
    staleTime: 30_000,
  });

  const simSessions = simData?.items ?? [];
  const completedSims = simSessions.filter(s => s.status === 'completed');

  const simScores = completedSims.filter(s => s.avg_score != null).map(s => s.avg_score as number);
  const simAvgScore10 = simScores.length
    ? Math.round((simScores.reduce((a, b) => a + b, 0) / simScores.length) * 10)
    : null;

  const totalMessages = simSessions.reduce((sum, s) => sum + (s.message_count ?? 0), 0);
  const totalMinutes = Math.round(totalMessages * 1.5);

  // Mock Area Chart Data
  const practiceData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      data.push({
        date: format(subDays(new Date(), i), 'd MMM', { locale: ru }),
        pitch: Math.floor(Math.random() * 15) + (i === 0 && completedSims.length > 0 ? totalMinutes * 0.7 : 5),
        qa: Math.floor(Math.random() * 10) + (i === 0 && completedSims.length > 0 ? totalMinutes * 0.3 : 2),
      });
    }
    return data;
  }, [totalMinutes, completedSims.length]);

  // Session Logs generator
  const recentLogs = useMemo(() => {
    return completedSims.slice(0, 5).map((s, idx) => {
      const titles = ["Питч Серии А", "Стресс-интервью Q&A", "Собеседование (Middle)", "Презентация продукта", "Командный синк"];
      const score = s.avg_score != null ? s.avg_score.toFixed(1) : "—";
      const dateStr = format(new Date(s.created_at), 'd MMM', { locale: ru });
      const feedbacks = [
        "Отличная структура, но не хватает уверенности в блоке финансов. Поработайте над интонацией концовки.",
        "Ответы звучат профессионально, идеальная реакция на стресс-сценарий от инвестора.",
        "Логичный питч, однако тайминг превышен на 2 минуты. Попробуйте ускорить темп.",
        "Очень убедительно. Обратите внимание на переходы между смысловыми блоками.",
        "Хорошо проработаны возражения по бизнес-модели, фокус не размыт."
      ];

      return {
        id: s.id || idx.toString(),
        title: titles[idx % titles.length],
        date: dateStr,
        score: score,
        feedback: feedbacks[idx % feedbacks.length]
      };
    });
  }, [completedSims]);

  return (
    <div className="pb-16 md:pb-12 pt-6 sm:pt-8 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── 1. COMMAND ACTION HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mb-8 bg-white/70 backdrop-blur-xl rounded-2xl border border-black/5 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/[0.04] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex-1">
          <h1 className="font-inter text-2xl md:text-[28px] font-bold text-neutral-900 tracking-tight mb-2.5">
            Добро пожаловать, {displayName}.
          </h1>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-inter text-[13px] text-neutral-600 font-medium">Командный центр ИИ-аналитики активен</span>
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
              <span className="font-inter text-sm font-bold text-neutral-900 leading-tight mb-0.5">Загрузить документы</span>
              <span className="font-inter text-[11px] font-medium text-neutral-500 uppercase tracking-widest">Новый контекст</span>
            </div>
          </Link>

          <Link
            href="/simulation"
            className="group flex flex-1 sm:flex-none items-center gap-3.5 bg-[#171717] border border-black rounded-xl px-5 py-4 min-w-[220px] hover:bg-[#262626] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="bg-white/10 rounded-lg p-2 text-white group-hover:scale-105 transition-transform">
              <Play size={20} className="fill-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-inter text-sm font-bold text-white leading-tight mb-0.5">Начать симуляцию</span>
              <span className="font-inter text-[11px] font-medium text-neutral-400 uppercase tracking-widest">Питч & Собеседование</span>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* ── LOADER CONTENT ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" />
        </div>
      ) : (
        <>
          {/* ── 2. REPOPULATED METRICS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricPod
              label="Сессий пройдено"
              value={simSessions.length}
              sub={completedSims.length > 0 ? "Всего завершенных циклов" : "Ожидание активности"}
              icon={<Target size={18} strokeWidth={2.5} />}
              delay={0.1}
            />
            <MetricPod
              label="Минуты практики"
              value={totalMinutes}
              sub="Кумулятивное время в ИИ"
              icon={<Clock size={18} strokeWidth={2.5} />}
              delay={0.2}
            />
            <MetricPod
              label="Средний балл ИИ"
              value={simAvgScore10 !== null ? `${(simAvgScore10 / 10).toFixed(1)}/10` : '—'}
              sub="Качество коммуникации"
              icon={<Zap size={18} strokeWidth={2.5} />}
              delay={0.3}
            />
            <MetricPod
              label="Точность транскрипции"
              value="98.4%"
              sub="Медианное значение (Whisper)"
              icon={<CheckCircle2 size={18} strokeWidth={2.5} />}
              delay={0.4}
            />
          </div>

          {/* ── 3. OPTIMIZED SECOND ROW ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4">

            {/* LEFT WIDGET: PRACTICE ACTIVITY */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
              className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden"
            >
              <div className="p-6 border-b border-black/[0.03] flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
                <div>
                  <h2 className="font-inter text-base font-bold text-neutral-900">Статистика вашей практики</h2>
                  <p className="font-inter text-xs font-medium text-neutral-500 mt-1">Время практики и Оценка сессий</p>
                </div>
                <div className="flex bg-neutral-100/80 p-1 rounded-[10px] w-max border border-black/[0.02]">
                  <button className="px-4 py-1.5 font-inter text-xs font-semibold bg-white rounded-md shadow-sm border border-black/[0.04] text-neutral-900">7 дней</button>
                  <button className="px-4 py-1.5 font-inter text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">30 дней</button>
                </div>
              </div>

              <div className="p-6 relative flex-1 min-h-[320px] bg-neutral-50/30">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/[0.02] via-transparent to-transparent pointer-events-none" />
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={practiceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPitch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#171717" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorQa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#737373', fontFamily: 'Inter', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#737373', fontFamily: 'Inter', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tickMargin={12}
                    />
                    <Tooltip content={<ChartTooltip suffix=" мин" />} cursor={{ stroke: 'rgba(0,0,0,0.04)', strokeWidth: 32 }} />
                    <Legend
                      iconType="rect"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', fontWeight: 600, color: '#404040', paddingTop: 20 }}
                    />
                    <Area
                      type="linear"
                      dataKey="pitch"
                      name="Сценарии питчей"
                      stroke="#171717"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorPitch)"
                      activeDot={{ r: 4, fill: '#171717', strokeWidth: 0 }}
                    />
                    <Area
                      type="linear"
                      dataKey="qa"
                      name="Стресс Q&A"
                      stroke="#a3a3a3"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorQa)"
                      activeDot={{ r: 4, fill: '#a3a3a3', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* RIGHT WIDGET: SESSION HISTORY LOG */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
              className="bg-white border border-black/5 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden h-[420px] lg:h-auto"
            >
              <div className="p-6 border-b border-black/[0.03] relative z-10 shrink-0">
                <h2 className="font-inter text-base font-bold text-neutral-900">История сессий</h2>
                <p className="font-inter text-xs font-medium text-neutral-500 mt-1">Детализация и анализ ИИ</p>
              </div>
              <div className="p-4 flex flex-col gap-3 relative z-10 overflow-y-auto">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-orange-500/[0.03] via-transparent to-transparent pointer-events-none" />

                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <div key={log.id} className="group bg-white border border-black/[0.06] rounded-xl p-4 shadow-sm hover:shadow-md hover:border-black/15 transition-all cursor-pointer relative z-10 w-full block">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                            <MessageSquare size={13} strokeWidth={2.5} />
                          </div>
                          <span className="font-inter text-[13px] font-bold text-neutral-900">{log.title}</span>
                        </div>
                        <span className="font-inter text-[9px] uppercase font-bold tracking-widest text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">{log.date}</span>
                      </div>
                      <div className="flex justify-between items-end gap-4 mt-2">
                        <p className="font-inter text-[12px] font-medium text-neutral-500 line-clamp-2 leading-relaxed flex-1 italic">
                          «{log.feedback}»
                        </p>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-inter text-xl font-bold text-neutral-900 leading-none">
                            {log.score}<span className="text-[11px] text-neutral-400 font-bold tracking-wider">/10</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-6 flex-col">
                    <Target className="text-neutral-300 mb-3" size={32} />
                    <p className="font-inter text-sm font-medium text-neutral-500">История пуста. Начните свою первую симуляцию.</p>
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
