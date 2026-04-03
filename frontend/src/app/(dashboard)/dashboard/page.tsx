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
          className="bg-white rounded-xl border border-black/5 p-6 sm:p-8 mb-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-200">
            <Bot size={24} className="text-neutral-700" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-inter text-base font-semibold text-neutral-800 mb-1">
              {getCoachTip(simAvgScore10, progressDelta).title}
            </h3>
            <p className="font-inter text-sm text-neutral-600 leading-relaxed max-w-2xl">
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
            className="lg:col-span-2 group bg-white rounded-xl border border-black/5 p-6 flex flex-col md:flex-row items-start md:items-center gap-5 hover:border-black/10 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-200">
              <Sparkles size={20} className="text-neutral-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-inter text-base font-semibold text-neutral-800">
                AI Симуляция
              </h2>
              <p className="font-inter text-sm text-neutral-600 truncate mt-0.5">Продолжи тренировки с AI-собеседником</p>
            </div>
            <span className="mt-4 md:mt-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-[13px] font-inter font-semibold transition-all hover:bg-neutral-800 min-h-[44px] shrink-0 w-full md:w-auto">
              <Sparkles size={13} />
              Продолжить
            </span>
          </Link>
        ) : (
          /* Full hero card for new users */
          <Link
            href="/simulation"
            className="lg:col-span-2 group bg-white rounded-xl border border-black/5 p-6 sm:p-8 flex flex-col justify-between hover:border-black/10 transition-all duration-200 cursor-pointer shadow-sm min-h-[200px]"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-200">
                  <Sparkles size={18} className="text-neutral-700" />
                </div>
                <div>
                  <h2 className="font-inter text-base font-semibold text-neutral-800">
                    AI Симуляция
                  </h2>
                  <p className="font-inter text-sm text-neutral-600">Нейронный собеседник</p>
                </div>
              </div>

              <p className="font-inter text-sm text-neutral-600 leading-relaxed max-w-sm">
                Пройди стресс-тест по своему тексту с AI-собеседником — HR, Инвестор или Клиент. Живые вопросы, честная обратная связь.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <span className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-[13px] font-inter font-semibold transition-all hover:bg-neutral-800 min-h-[44px]">
                <Sparkles size={13} />
                Начать тренировку
              </span>
            </div>
          </Link>
        )}

        {/* Metric cards column */}
        <div className="flex flex-col gap-4">

          {/* Card: Индекс готовности */}
          <div className="flex-1 bg-white rounded-xl border border-black/5 shadow-sm p-6 md:p-8 flex flex-col hover:border-black/10 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="font-inter text-base font-semibold text-neutral-800">Готовность</span>
            </div>
            <div className="flex-1">
              <div className="text-3xl md:text-4xl font-semibold text-black font-inter tracking-tight">
                {simData == null ? (
                  <span className="opacity-25">—</span>
                ) : simAvgScore10 != null ? (
                  <>{simAvgScore10}<span className="text-xl md:text-2xl font-medium text-neutral-400 ml-1">/10</span></>
                ) : (
                  <span className="text-neutral-300">—</span>
                )}
              </div>
              <p className="font-inter text-sm text-neutral-600 mt-0 mb-4 md:mb-6">
                {simAvgScore10 == null
                  ? 'Пройди симуляцию'
                  : simAvgScore10 >= 8 ? 'Готов к питчу'
                    : simAvgScore10 >= 6 ? 'Есть потенциал'
                      : simAvgScore10 >= 4 ? 'Нужна практика'
                        : 'Серьёзная работа'}
              </p>
            </div>
            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden mt-auto">
              <div
                className="h-full bg-neutral-800 rounded-full transition-all duration-700"
                style={{
                  width: `${(simAvgScore10 ?? 0) * 10}%`,
                }}
              />
            </div>
          </div>

          {/* Card: Тренд роста */}
          {(() => {
            const trendSub = progressDelta == null ? 'Нужно 2+ сессий'
              : progressDelta > 0 ? 'Ты растёшь!'
                : progressDelta < 0 ? 'Бывает — встряхнись' : 'Нет изменений';
            return (
              <div className="flex-1 bg-white rounded-xl border border-black/5 shadow-sm p-6 md:p-8 flex flex-col hover:border-black/10 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-inter text-base font-semibold text-neutral-800">Тренд роста</span>
                </div>
                <div className="flex-1">
                  <div className="text-3xl md:text-4xl font-semibold text-black font-inter tracking-tight">
                    {progressDelta == null ? '—'
                      : progressDelta === 0 ? '= 0'
                        : <>{progressDelta > 0 ? `+${progressDelta}` : progressDelta}<span className="text-xl md:text-2xl font-medium text-neutral-400 ml-1">б</span></>}
                  </div>
                  <p className="font-inter text-sm text-neutral-600 mt-0 mb-4 md:mb-6">{trendSub}</p>
                </div>
                {sparkPoints && (
                  <svg viewBox="0 0 80 26" className="w-full h-8 mt-auto" preserveAspectRatio="none">
                    <polyline
                      points={sparkPoints}
                      fill="none"
                      stroke="#404040"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {sparkScores.map((s, i) => (
                      <circle
                        key={i}
                        cx={(i / (sparkScores.length - 1)) * 80}
                        cy={sparkY(s)}
                        r={1.5}
                        fill="#404040"
                      />
                    ))}
                  </svg>
                )}
              </div>
            );
          })()}

          {/* Card: Время практики */}
          <div className="flex-1 bg-white rounded-xl border border-black/5 shadow-sm p-6 md:p-8 flex flex-col hover:border-black/10 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="font-inter text-base font-semibold text-neutral-800">Практика</span>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <div className="text-3xl md:text-4xl font-semibold text-black font-inter tracking-tight">
                {simData == null ? (
                  <span className="opacity-25">—</span>
                ) : practiceDisplay != null ? (
                  practiceDisplay
                ) : (
                  <span className="text-neutral-300">—</span>
                )}
              </div>
              <p className="font-inter text-sm text-neutral-600 mt-0">
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
          className="bg-white rounded-xl border border-black/5 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center shrink-0 border border-neutral-200">
            <Flame className="text-neutral-700" size={32} />
          </div>
          <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
            <h2 className="font-inter text-lg sm:text-xl font-bold text-neutral-900 mb-2 tracking-tight">
              Твоя первая симуляция ждет
            </h2>
            <p className="font-inter text-sm text-neutral-600 leading-relaxed mb-5 max-w-lg mx-auto sm:mx-0">
              Узнай свои слабые места до того, как выйдешь к инвестору или на сцену. Попробуй короткий демо-тест прямо сейчас — это займет всего пару минут.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-neutral-800 text-white font-inter font-semibold text-[13px] px-6 py-3 rounded-lg transition-colors w-full sm:w-auto min-h-[48px]"
            >
              <Zap size={16} />
              Пройти тест-драйв
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
