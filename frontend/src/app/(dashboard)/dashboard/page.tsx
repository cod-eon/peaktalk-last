"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  UploadCloud,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Plus,
  Target,
  Bot,
  Flame,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type AnalysisResult = {
  feedback_json: { overall_score: number };
};

type Draft = {
  id: string;
  title: string;
  created_at: string;
  analysis_result: AnalysisResult | null;
};

type DraftsResponse = {
  items: Draft[];
  total: number;
};

function getDraftStatus(draft: Draft): { label: string; badgeClass: string; icon: React.ReactNode } {
  if (draft.analysis_result) {
    return {
      label: 'Проанализирован',
      badgeClass: 'bg-green-100 text-green-700',
      icon: <CheckCircle2 size={12} className="text-green-600" />,
    };
  }
  return {
    label: 'Загружен',
    badgeClass: 'bg-gray-100 text-gray-600',
    icon: <Clock size={12} className="text-gray-500" />,
  };
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 7 ? 'bg-green-100 text-green-700' :
      score >= 5 ? 'bg-amber-100 text-amber-700' :
        'bg-red-100 text-red-600';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {score}/10
    </span>
  );
}

function getCoachTip(score: number | null, progress: number | null) {
  if (score == null) {
    return { title: 'Твой первый шаг', text: 'Тренер ждёт твою первую симуляцию. Не бойся ошибаться — мы здесь, чтобы учиться. Приготовь текст и начнём!', type: 'neutral' };
  }
  if (score >= 8) {
    return { title: 'Почти безупречно!', text: 'Отличный уровень. Теперь переведи фокус на харизму, интонацию и мелкие детали. Ты звучишь убедительно.', type: 'positive' };
  }
  if (progress != null && progress > 0) {
    return { title: 'Отличная динамика', text: 'С каждой попыткой всё увереннее. Обрати особое внимание на логические переходы между модулями питча.', type: 'positive' };
  }
  if (score >= 6) {
    return { title: 'Прочный фундамент', text: 'База есть, но не хватает уверенности. Попробуй говорить чуть медленнее, делай паузы — это добавит веса словам.', type: 'warning' };
  }
  return { title: 'Структура — наше всё', text: 'Питчинг — это навык. Сфокусируйся на самом главном: чётком вступлении и логичных аргументах. Поехали ещё раз.', type: 'warning' };
}

function getGamificationLevel(totalSims: number) {
  if (totalSims < 1) return { title: 'Новичок', xp: 0, next: 1, percent: 0, badge: '🌱', color: 'bg-emerald-400' };
  if (totalSims < 3) return { title: 'Студент', xp: totalSims, next: 3, percent: (totalSims / 3) * 100, badge: '🥉', color: 'bg-amber-400' };
  if (totalSims < 10) return { title: 'Оратор', xp: totalSims, next: 10, percent: (totalSims / 10) * 100, badge: '🥈', color: 'bg-slate-300' };
  if (totalSims < 25) return { title: 'Эксперт', xp: totalSims, next: 25, percent: (totalSims / 25) * 100, badge: '🥇', color: 'bg-yellow-400' };
  return { title: 'Мастер', xp: totalSims, next: totalSims, percent: 100, badge: '👑', color: 'bg-violet-500' };
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Пользователь';

  const { data, isLoading, isError } = useQuery<DraftsResponse>({
    queryKey: ['drafts-dashboard'],
    queryFn: () => api.get('/drafts?limit=10'),
    staleTime: 30_000,
  });

  const { data: simData } = useQuery<{ items: Array<{ status: string; avg_score: number | null; message_count: number; created_at: string }> }>({
    queryKey: ['simulations-dashboard'],
    queryFn: () => api.get('/simulation?limit=50'),
    staleTime: 30_000,
  });

  const drafts = data?.items ?? [];
  const totalDrafts = data?.total ?? 0;

  const simSessions = simData?.items ?? [];
  const completedSims = simSessions.filter(s => s.status === 'completed');
  const simScores = completedSims.filter(s => s.avg_score != null).map(s => s.avg_score as number);
  const simAvgScore10 = simScores.length
    ? Math.round((simScores.reduce((a, b) => a + b, 0) / simScores.length) * 10)
    : null;

  // Progress trend: last scored session vs first scored session
  const scoredByDate = completedSims
    .filter(s => s.avg_score != null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const progressDelta = scoredByDate.length >= 2
    ? Math.round(scoredByDate[scoredByDate.length - 1].avg_score! * 10)
    - Math.round(scoredByDate[0].avg_score! * 10)
    : null;

  // Practice time: message_count × 1.5 min
  const totalMessages = simSessions.reduce((sum, s) => sum + (s.message_count ?? 0), 0);
  const totalMinutes = Math.round(totalMessages * 1.5);
  const practiceDisplay = totalMinutes >= 60
    ? `~${Math.round(totalMinutes / 60)} ч`
    : totalMinutes > 0 ? `~${totalMinutes} мин` : null;

  // Sparkline for trend card
  const sparkScores = scoredByDate.slice(-7).map(s => Math.round(s.avg_score! * 10));
  const sparkColor = progressDelta == null ? '#cbd5e1'
    : progressDelta > 0 ? '#10b981'
      : progressDelta < 0 ? '#f43f5e' : '#94a3b8';
  // y: 3 (score=10, top) → 23 (score=0, bottom) — 3px padding for r=2.5 dots
  const sparkY = (s: number) => 3 + (1 - s / 10) * 20;
  const sparkPoints = sparkScores.length >= 2
    ? sparkScores.map((s, i) => {
      const x = (i / (sparkScores.length - 1)) * 80;
      return `${x},${sparkY(s)}`;
    }).join(' ')
    : null;

  return (
    <div className="pb-16 md:pb-10 pt-8 sm:pt-10 w-full max-w-5xl mx-auto px-5 lg:px-8">

      {/* ─── Header ─── */}
      <div className="flex flex-col gap-6 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
          <div>
            <p className="text-[12px] text-[var(--text-dim)] mb-1 uppercase tracking-widest font-semibold">Добро пожаловать</p>
            <h1 className="text-[28px] sm:text-[34px] font-syne font-bold text-[var(--text-main)] leading-tight tracking-tight">
              Привет, {displayName}!
            </h1>
          </div>
          
          {/* Gamification Badge */}
          {!isLoading && simData && (
            <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-full py-2 px-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow group relative cursor-help">
              <div className="text-2xl drop-shadow-sm">{getGamificationLevel(simSessions.length).badge}</div>
              <div className="flex flex-col w-28">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">{getGamificationLevel(simSessions.length).title}</span>
                  <span className="text-[10px] font-medium text-gray-400">{getGamificationLevel(simSessions.length).xp}/{getGamificationLevel(simSessions.length).next}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${getGamificationLevel(simSessions.length).percent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full transition-all duration-700 ${getGamificationLevel(simSessions.length).color}`} 
                  />
                </div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 w-56 text-center shadow-lg">
                Следующий уровень достигается при <strong>{getGamificationLevel(simSessions.length).next}</strong> полных симуляциях.
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </div>
          )}
        </div>

        <Link
          href="/upload"
          className="btn-primary flex-shrink-0 gap-2 self-start sm:self-auto min-h-[48px] px-5 flex items-center justify-center cursor-pointer"
        >
          <Plus size={15} />
          Новый разбор
        </Link>
      </div>

      {/* ─── Coach's Tip — Priority #1, always on top ─── */}
      {!isLoading && !isError && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative bg-gradient-to-r from-violet-50/80 to-accent-50/50 backdrop-blur-sm rounded-[var(--radius-lg)] border border-violet-100/60 p-5 sm:p-6 mb-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center overflow-hidden shadow-[0_2px_12px_rgba(139,92,246,0.04)]"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-200/30 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-violet-100 relative z-10">
            <Bot size={24} className="text-violet-600" />
          </div>
          
          <div className="flex-1 relative z-10">
            <h3 className="text-[15px] font-bold text-violet-900 mb-1.5" style={{ letterSpacing: '-0.01em' }}>
              {getCoachTip(simAvgScore10, progressDelta).title}
            </h3>
            <p className="text-[14px] text-violet-800/80 leading-relaxed max-w-2xl">
              {getCoachTip(simAvgScore10, progressDelta).text}
            </p>
          </div>
        </motion.div>
      )}

      {/* ─── Main grid: hero card + metric cards ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

        {/* Hero card — conditional: compact CTA for returning users, full card for new */}
        {completedSims.length > 0 ? (
          /* Compact horizontal CTA for returning users */
          <Link
            href="/simulation"
            className="lg:col-span-2 group relative bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-4 overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-[var(--border-light)] transition-all duration-200 cursor-pointer"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-50/30 via-white to-accent-50/20 rounded-[var(--radius-lg)] pointer-events-none" />
            <div className="relative z-10 w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-violet-600" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <h2 className="text-[15px] font-semibold text-[var(--text-main)]" style={{ letterSpacing: '-0.01em' }}>
                AI Симуляция
              </h2>
              <p className="text-[12px] text-[var(--text-dim)] truncate">Продолжи тренировки с AI-собеседником</p>
            </div>
            <span className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-ai)] text-white text-[13px] font-semibold shadow-sm transition-all group-hover:bg-violet-700 group-hover:shadow-[0_4px_14px_rgba(139,92,246,0.30)] min-h-[44px] shrink-0">
              <Sparkles size={13} />
              Продолжить
            </span>
            <ChevronRight
              size={18}
              className="relative z-10 text-[var(--text-dim)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block"
            />
          </Link>
        ) : (
          /* Full hero card for new users */
          <Link
            href="/simulation"
            className="lg:col-span-2 group relative bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] p-6 sm:p-7 flex flex-col justify-between overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-[var(--border-light)] transition-all duration-200 cursor-pointer min-h-[200px]"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            {/* Background gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/40 via-white to-accent-50/30 rounded-[var(--radius-lg)] pointer-events-none" />
            {/* Decorative AI-pulse geometry — hidden on mobile for clean look */}
            <motion.svg className="absolute bottom-0 right-0 w-52 h-40 opacity-[0.25] pointer-events-none hidden md:block" viewBox="0 0 208 160" fill="none" aria-hidden="true">
              <motion.circle cx="160" cy="108" r="80" stroke="#8B5CF6" strokeWidth="1.5"
                animate={{ r: [80, 84, 80], opacity: [0.6, 0.2, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle cx="160" cy="108" r="58" stroke="#8B5CF6" strokeWidth="1"
                animate={{ r: [58, 62, 58], opacity: [0.7, 0.3, 0.7] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <motion.circle cx="160" cy="108" r="38" stroke="#E8600A" strokeWidth="1.5"
                animate={{ r: [38, 40, 38], opacity: [0.8, 0.4, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle cx="160" cy="108" r="20" fill="#8B5CF6" fillOpacity="0.2"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <path d="M80 108 Q120 68 160 108 Q120 148 80 108Z" stroke="#E8600A" strokeWidth="1" fill="none" strokeOpacity="0.5" />
            </motion.svg>

            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Sparkles size={18} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold text-[var(--text-main)]" style={{ letterSpacing: '-0.015em' }}>
                    AI Симуляция
                  </h2>
                  <p className="text-[11px] text-[var(--text-dim)] font-medium">Нейронный собеседник</p>
                </div>
              </div>

              <p className="text-[14px] text-[var(--text-muted)] leading-relaxed">
                Пройди стресс-тест по своему тексту с AI-собеседником — HR, Инвестор или Клиент. Живые вопросы, честная обратная связь.
              </p>
            </div>

            <div className="relative z-10 mt-6 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-ai)] text-white text-[13px] font-semibold shadow-sm transition-all group-hover:bg-violet-700 group-hover:shadow-[0_4px_14px_rgba(139,92,246,0.30)] min-h-[44px]">
                <Sparkles size={13} />
                Начать тренировку
              </span>
              <ChevronRight
                size={18}
                className="text-[var(--text-dim)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </Link>
        )}

        {/* Metric cards column */}
        <div className="flex flex-col gap-4">

          {/* Card: Индекс готовности */}
          <div className="relative overflow-hidden flex-1 bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-4 md:p-5 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-teal-300 rounded-t-xl" />
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Готовность</span>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Target size={16} className="text-emerald-500 md:hidden" />
                <Target size={18} className="text-emerald-500 hidden md:block" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.03em' }}>
                {simData == null ? (
                  <span className="opacity-25">—</span>
                ) : simAvgScore10 != null ? (
                  <>{simAvgScore10}<span className="text-xl md:text-2xl font-bold text-gray-400 ml-0.5">/10</span></>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1 mb-2 md:mb-3">
                {simAvgScore10 == null
                  ? 'Пройди симуляцию'
                  : simAvgScore10 >= 8 ? 'Готов к питчу'
                    : simAvgScore10 >= 6 ? 'Есть потенциал'
                      : simAvgScore10 >= 4 ? 'Нужна практика'
                        : 'Серьёзная работа'}
              </p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(simAvgScore10 ?? 0) * 10}%`,
                  background: (simAvgScore10 ?? 0) >= 7 ? '#10b981' : (simAvgScore10 ?? 0) >= 4 ? '#f59e0b' : '#f43f5e',
                }}
              />
            </div>
          </div>

          {/* Card: Тренд роста */}
          {(() => {
            const TrendIcon = progressDelta != null && progressDelta < 0 ? TrendingDown : TrendingUp;
            const trendBg = progressDelta == null ? 'bg-gray-50'
              : progressDelta > 0 ? 'bg-emerald-50' : progressDelta < 0 ? 'bg-rose-50' : 'bg-gray-50';
            const trendColor = progressDelta == null ? 'text-gray-400'
              : progressDelta > 0 ? 'text-emerald-500' : progressDelta < 0 ? 'text-rose-500' : 'text-gray-400';
            const trendSub = progressDelta == null ? 'Нужно 2+ сессий'
              : progressDelta > 0 ? 'Ты растёшь!'
                : progressDelta < 0 ? 'Бывает — встряхнись' : 'Нет изменений';
            const trendValColor = progressDelta == null ? 'text-gray-300'
              : progressDelta > 0 ? 'text-emerald-600'
                : progressDelta < 0 ? 'text-rose-500' : 'text-gray-900';
            return (
              <div className="relative overflow-hidden flex-1 bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-4 md:p-5 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-violet-400 rounded-t-xl" />
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Тренд роста</span>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${trendBg} flex items-center justify-center`}>
                    <TrendIcon size={16} className={`${trendColor} md:hidden`} />
                    <TrendIcon size={18} className={`${trendColor} hidden md:block`} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`text-3xl md:text-4xl font-extrabold ${trendValColor}`} style={{ letterSpacing: '-0.03em' }}>
                    {progressDelta == null ? '—'
                      : progressDelta === 0 ? '= 0'
                        : <>{progressDelta > 0 ? `+${progressDelta}` : progressDelta}<span className="text-xl md:text-2xl font-bold text-gray-400 ml-0.5">б</span></>}
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mt-1 mb-2">{trendSub}</p>
                </div>
                {sparkPoints && (
                  <svg viewBox="0 0 80 26" className="w-full h-8 mt-auto" preserveAspectRatio="none">
                    <polyline
                      points={sparkPoints}
                      fill="none"
                      stroke={sparkColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.7"
                    />
                    {sparkScores.map((s, i) => (
                      <circle
                        key={i}
                        cx={(i / (sparkScores.length - 1)) * 80}
                        cy={sparkY(s)}
                        r={i === sparkScores.length - 1 ? 2.5 : 1.5}
                        fill={sparkColor}
                        opacity={i === sparkScores.length - 1 ? 1 : 0.5}
                      />
                    ))}
                  </svg>
                )}
              </div>
            );
          })()}

          {/* Card: Время практики */}
          <div className="relative overflow-hidden flex-1 bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-4 md:p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-400 to-violet-300 rounded-t-xl" />
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Практика</span>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-violet-50 flex items-center justify-center">
                <Clock size={16} className="text-violet-500 md:hidden" />
                <Clock size={18} className="text-violet-500 hidden md:block" />
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.03em' }}>
                {simData == null ? (
                  <span className="opacity-25">—</span>
                ) : practiceDisplay != null ? (
                  practiceDisplay
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {totalMessages > 0 ? `${totalMessages} сообщений` : 'Начни тренировку'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Zero State (new users only) ─── */}
      {!isLoading && !isError && totalDrafts === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-gradient-to-br from-accent-50/50 to-accent-100/30 rounded-[var(--radius-lg)] border border-accent-200/60 p-6 sm:p-8 mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6 shadow-sm overflow-hidden relative"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-400/10 rounded-full blur-[40px] pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-accent-100 flex items-center justify-center shrink-0">
            <Flame className="text-accent-500" size={32} />
          </div>
          <div className="flex-1 relative z-10 w-full sm:w-auto">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-accent-950 mb-2" style={{ letterSpacing: '-0.01em' }}>
              Твоя первая симуляция ждет
            </h2>
            <p className="text-[14px] text-accent-900/70 leading-relaxed mb-5 max-w-lg mx-auto sm:mx-0">
              Узнай свои слабые места до того, как выйдешь к инвестору или на сцену. Попробуй короткий демо-тест прямо сейчас — это займет всего пару минут.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold text-[14px] px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(232,96,10,0.3)] hover:shadow-[0_6px_20px_rgba(232,96,10,0.4)] transition-all w-full sm:w-auto min-h-[48px]"
            >
              <Zap size={16} />
              Пройти тест-драйв (Бесплатно)
            </Link>
          </div>
        </motion.div>
      )}

      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] font-syne font-bold text-[var(--text-main)] uppercase tracking-tight">
            Твои выступления
          </h2>
          <Link
            href="/upload"
            className="flex items-center justify-center gap-1 text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors group text-[13px] font-medium min-h-[44px] px-3 -mr-3 rounded-lg cursor-pointer"
          >
            Добавить
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div
          className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] overflow-hidden"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          {/* Desktop table header */}
          <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_160px_150px_44px] px-5 py-3 border-b border-[var(--border-main)] bg-[var(--bg-surface-alt)]">
            <span className="label-kicker">Название</span>
            <span className="label-kicker">Статус</span>
            <span className="label-kicker">Дата</span>
            <span />
          </div>

          <div className="flex flex-col divide-y divide-[var(--border-main)]">

            {isLoading && (
              <div className="px-5 py-12 flex items-center justify-center gap-3 text-[var(--text-dim)]">
                <div className="w-4 h-4 border-2 border-gray-200 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                <span className="text-[13px]">Загрузка...</span>
              </div>
            )}

            {isError && (
              <div className="px-5 py-12 flex items-center justify-center gap-2 text-red-500">
                <AlertCircle size={15} />
                <span className="text-[13px]">Ошибка загрузки данных</span>
              </div>
            )}

            {!isLoading && !isError && drafts.length === 0 && (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto mb-4 flex items-center justify-center">
                  <svg width="64" height="52" viewBox="0 0 64 52" fill="none" aria-hidden="true">
                    <rect x="10" y="4" width="34" height="44" rx="4" stroke="#E5E7EB" strokeWidth="1.5" fill="#F9FAFB" />
                    <rect x="16" y="13" width="22" height="2" rx="1" fill="#E5E7EB" />
                    <rect x="16" y="19" width="16" height="2" rx="1" fill="#E5E7EB" />
                    <rect x="16" y="25" width="19" height="2" rx="1" fill="#E5E7EB" />
                    <circle cx="50" cy="36" r="9" stroke="#E8600A" strokeWidth="1.5" fill="rgba(232,96,10,0.07)" />
                    <path d="M46.5 36 L53.5 36 M50 32.5 L50 39.5" stroke="#E8600A" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-[14px] text-[var(--text-dim)] mb-4">
                  Твоя трибуна пока пуста
                </p>
                <Link href="/upload" className="btn-primary text-sm gap-1.5 flex items-center justify-center min-h-[48px] w-full sm:w-auto px-6 cursor-pointer">
                  <UploadCloud size={13} />
                  Загрузить первый питч
                </Link>
              </div>
            )}

            {drafts.map((draft) => {
              const { label, badgeClass, icon } = getDraftStatus(draft);
              const dateStr = formatDistanceToNow(new Date(draft.created_at), {
                addSuffix: true,
                locale: ru,
              });
              const score = draft.analysis_result?.feedback_json.overall_score ?? null;

              return (
                <Link
                  href={`/analysis/${draft.id}`}
                  key={draft.id}
                  className="group flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_160px_150px_44px] lg:items-center px-4 py-4 sm:px-5 hover:bg-[var(--bg-surface-alt)] transition-colors duration-150 relative cursor-pointer min-h-[64px]"
                >
                  {/* Active left bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />

                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0 mb-2.5 lg:mb-0">
                    <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-gray-50 border border-[var(--border-main)] flex items-center justify-center shrink-0 group-hover:border-accent-200 group-hover:bg-accent-50 transition-colors">
                      <FileText size={14} className="text-[var(--text-dim)] group-hover:text-[var(--accent-primary)] transition-colors" />
                    </div>
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[var(--text-main)] overflow-hidden text-ellipsis whitespace-nowrap">
                        {draft.title}
                      </span>
                      {score !== null && <ScoreBadge score={score} />}
                    </div>
                  </div>

                  {/* Mobile meta */}
                  <div className="grid grid-cols-2 gap-3 lg:hidden ml-11">
                    <div className="flex flex-col gap-0.5">
                      <span className="label-kicker mb-1">Статус</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeClass}`}>
                          {icon}
                          {label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="label-kicker mb-1">Дата</span>
                      <span className="text-[11px] text-[var(--text-dim)]">{dateStr}</span>
                    </div>
                  </div>

                  {/* Desktop status */}
                  <div className="hidden lg:flex items-center min-w-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeClass}`}>
                      {icon}
                      {label}
                    </span>
                  </div>

                  {/* Desktop date */}
                  <div className="hidden lg:flex items-center text-[12px] text-[var(--text-dim)]">
                    {dateStr}
                  </div>

                  {/* Arrow */}
                  <div className="hidden lg:flex items-center justify-end text-[var(--text-dim)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--accent-primary)] transition-all">
                    <ChevronRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
