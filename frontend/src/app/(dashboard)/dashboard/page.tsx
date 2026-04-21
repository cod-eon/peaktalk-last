"use client";

import React from 'react';
import { Play, Target, AlertTriangle, ArrowRight, Upload, Activity, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { DocumentItem, UserProfile } from '@/hooks/useDashboardData';
import { PlanBadge } from '@/components/PlanBadge';
import { formatDate, getPersonaDisplayLabel, getPersonaVisual } from '@/lib/constants/personas';
import type { SessionItem } from '@/lib/constants/personas';
import type { BillingStatus, PlanId } from '@/types/billing';

// ── Components ─────────────────────────────────────────────────────────────

function MetricPod({
  label, value, subtitle, icon
}: {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-none p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start gap-3 mb-6">
        <span className="font-inter text-[11px] font-bold text-neutral-500 tracking-widest uppercase leading-tight">
          {label}
        </span>
        <div className="text-neutral-400 shrink-0">
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="font-inter text-3xl font-bold text-neutral-900 tracking-tight flex items-baseline gap-1">
          {value}
        </div>
        {subtitle && (
          <span className="font-inter text-[11px] font-medium tracking-wide text-neutral-400 mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

function DashboardSessionCard({ session }: { session: SessionItem }) {
  const isActive = session.status === 'active';
  const personaLabel = getPersonaDisplayLabel(session.persona_config);
  const visual = getPersonaVisual(session.persona_config);
  const Icon = visual.icon;
  
  const scoreBadge = session.avg_score !== null 
    ? <span className="font-mono text-sm font-bold text-neutral-700">{Math.round(session.avg_score * 10)}/10</span>
    : null;

  return (
    <Link 
      href={isActive ? `/simulation/${session.id}` : `/simulation/${session.id}/report`}
      className="flex items-center justify-between p-4 px-6 border-b border-neutral-100 hover:bg-neutral-50 transition-colors group last:border-b-0"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 ${visual.iconBg} ${visual.iconColor} flex items-center justify-center shrink-0`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="font-medium text-neutral-900">{personaLabel}</div>
          <div className="text-xs text-neutral-500 whitespace-nowrap">
            {session.persona_config.industry} • {formatDate(session.created_at)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-medium">
             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
             Активна
          </span>
        ) : (
          scoreBadge
        )}
        <div className="text-neutral-300 group-hover:text-neutral-900 transition-colors">
          <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  );
}

function SimpleChart({ sessions }: { sessions: Array<{ avg_score: number | null; created_at: string; completed_at: string | null }> }) {
  const scores = sessions.map(s => Math.round((s.avg_score ?? 0) * 10));
  const minScore = 0;
  const maxScore = 10;
  const paddingY = 40;
  const paddingX = 40;
  
  const width = 800 - paddingX * 2;
  const height = 200 - paddingY * 2;

  const points = scores.map((score, i) => {
    const x = paddingX + (i / (scores.length - 1)) * width;
    const y = paddingY + height - ((score - minScore) / (maxScore - minScore)) * height;
    return { x, y, score, session: sessions[i] };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const baselineY = paddingY + height - ((5 - minScore) / (maxScore - minScore)) * height;

  return (
    <div className="h-[280px] p-6 pt-10 relative flex flex-col">
      <div className="flex-1 border-b border-dashed border-neutral-200 relative">
        <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="w-full h-full text-emerald-500 overflow-visible">
           <line x1="0" y1={baselineY} x2="800" y2={baselineY} stroke="currentColor" strokeDasharray="5,5" className="text-neutral-200" strokeWidth="2" />
           <path d={pathD} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
           {points.map((p, i) => (
             <circle key={i} cx={p.x} cy={p.y} r="6" fill="white" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
           ))}
        </svg>
      </div>
      <div className="flex items-end justify-between px-4 pt-4 text-[11px] text-neutral-400 font-medium whitespace-nowrap overflow-hidden">
        {points.map((p, i) => {
           const d = new Date(p.session.completed_at || p.session.created_at);
           const str = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
           return <span key={i} className="flex-1 text-center truncate">{str}</span>;
        })}
      </div>
    </div>
  );
}

function NextStepsPanel({ documents, completedSessions, sessions }: { documents: Array<{ id: string; name: string; created_at: string }>, completedSessions: Array<{ status: string; avg_score: number | null; created_at: string }>, sessions: Array<{ status: string; created_at: string }> }) {
  let tip;
  
  const lastSessionDate = sessions.length > 0 ? new Date(sessions[0].created_at).getTime() : 0;
  const inactivityDays = (new Date().getTime() - lastSessionDate) / (1000 * 60 * 60 * 24);

  if (documents.length === 0) {
    tip = {
      title: "Загрузите текст выступления",
      desc: "Для точной симуляции нужен контекст.",
      action: "Перейти к загрузке",
      href: "/upload",
      icon: <Upload size={24} className="text-[#E8600A]" />
    };
  } else if (completedSessions.length === 0) {
    tip = {
      title: "Завершите симуляцию",
      desc: "Только завершенные тренировки формируют статистику.",
      action: "Начать тест",
      href: "/simulation",
      icon: <Target size={24} className="text-emerald-500" />
    };
  } else if (inactivityDays > 7 && sessions.length > 0) {
    tip = {
      title: "Регулярная практика улучшает результаты",
      desc: "Вы не тренировались больше недели. Пора размяться!",
      action: "Продолжить",
      href: "/simulation",
      icon: <Activity size={24} className="text-amber-500" />
    };
  } else {
    tip = {
      title: "Пройдите еще симуляции",
      desc: "График динамики станет доступен после 3-й завершенной сессии.",
      action: "Новая тренировка",
      href: "/simulation",
      icon: <Target size={24} className="text-emerald-500" />
    };
  }

  return (
    <div className="h-[280px] p-6 relative flex flex-col justify-center items-center text-center bg-neutral-50/50 border-t border-neutral-100 mt-2">
      <div className="bg-white p-4 rounded-full border border-neutral-200 shadow-sm mb-4 text-emerald-500 flex items-center justify-center">
         {tip.icon}
      </div>
      <h3 className="font-bold text-neutral-900 mb-2">{tip.title}</h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm">{tip.desc}</p>
      <Link href={tip.href} className="text-sm font-semibold text-neutral-900 hover:text-black hover:underline flex items-center gap-1 group">
         {tip.action} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

function DashboardDocuments({ documents }: { documents: Array<{ id: string; name: string; created_at: string }> }) {
  if (!documents || documents.length === 0) return null;
  const recentDocs = documents.slice(0, 3);
  
  return (
    <div className="bg-white border border-neutral-200 rounded-none overflow-hidden mt-8 mb-8">
      <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="font-inter text-[11px] font-bold text-neutral-500 tracking-widest uppercase">
          ПОСЛЕДНИЕ ДОКУМЕНТЫ
        </h2>
      </div>
      <div className="flex flex-col">
        {recentDocs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-4 px-6 border-b border-neutral-100 hover:bg-neutral-50 transition-colors group last:border-b-0">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-[#FEF3E8] text-[#E8600A] flex items-center justify-center shrink-0">
                 <FileText size={16} />
               </div>
               <div>
                 <div className="font-medium text-neutral-900 truncate max-w-[150px] sm:max-w-[300px]">{doc.name}</div>
                 <div className="text-xs text-neutral-500">{formatDate(doc.created_at)}</div>
               </div>
             </div>
             <Link 
               href={`/simulation?doc=${doc.id}`}
               className="text-[11px] font-semibold px-3 py-1.5 border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors text-neutral-600 rounded-none whitespace-nowrap"
             >
               Начать<span className="hidden sm:inline"> симуляцию</span>
             </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-pages ────────────────────────────────────────────────────────────────

function DashboardNewUser({ profile, billing }: { profile: UserProfile; billing: { status: BillingStatus | null; simulationsLeft: number | null } }) {
  const segment = profile?.segment || 'other';
  let title = "Начните первую симуляцию";
  
  switch (segment) {
    case 'manager':
      title = 'Подготовьтесь к защите решений';
      break;
    case 'founder':
      title = 'Отрепетируйте инвест-спич';
      break;
    case 'head':
      title = 'Подготовьтесь к бюджетной защите';
      break;
    case 'customer_facing':
      title = 'Подготовьтесь к QBR';
      break;
  }

  const simulationsLeft = billing?.simulationsLeft ?? 0;
  const plan: PlanId = billing?.status?.subscription.plan === 'per_session' ? 'per_session' : 'free';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <PlanBadge plan={plan} />
        <span className="text-[11px] font-medium text-neutral-500 font-mono tracking-tight uppercase">
          Осталось симуляций: {simulationsLeft}
        </span>
      </div>
      
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
        {title}
      </h1>
      
      <p className="text-sm sm:text-base text-neutral-500 mb-10 max-w-md mx-auto">
        Загрузите текст выступления или начните тренировку прямо сейчас с ИИ-оппонентом.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <Link
          href="/upload"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-neutral-200 rounded-none hover:border-neutral-400 text-neutral-700 hover:text-neutral-900 px-6 py-3.5 text-sm font-semibold transition-colors"
        >
          <Upload size={16} />
          Загрузить документ
        </Link>
        <Link
          href="/simulation"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#171717] hover:bg-black text-white rounded-none px-6 py-3.5 text-sm font-semibold transition-colors"
        >
          <Play size={16} className="fill-white" />
          Начать симуляцию
        </Link>
      </div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

function DashboardActive({ sessions, documents }: { sessions: SessionItem[]; documents: DocumentItem[] }) {
  // Compute metrics
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const validScores = completedSessions
    .map(s => s.avg_score)
    .filter((score): score is number => score !== null);
  
  let indexMarkup: React.ReactNode = "--";
  let indexSubtitle = "Завершите симуляцию для расчёта";
  
  if (validScores.length > 0) {
    const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
    const avg10 = Math.round(avg * 10);
    const colorClass = avg10 >= 7 ? "text-emerald-500" : avg10 >= 4 ? "text-amber-500" : "text-red-500";
    indexMarkup = <span className={colorClass}>{avg10}<span className="text-neutral-400 text-xl">/10</span></span>;
    indexSubtitle = "Средний результат всех защит";
  }

  const criticalCount = validScores.filter(s => s < 0.4).length;
  
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  
  const monthlySessionsCount = sessions.filter(s => new Date(s.created_at) >= currentMonthStart).length;

  const activeSession = sessions.find(s => s.status === 'active');
  const recentSessions = sessions.slice(0, 5);
  
  const scoredSessions = [...completedSessions]
    .filter(s => s.avg_score !== null)
    .sort((a, b) => new Date(a.completed_at || a.created_at).getTime() - new Date(b.completed_at || b.created_at).getTime());

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Сводка</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            Аналитика ваших последних защит.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center gap-2 bg-white border border-neutral-200 rounded-none hover:border-neutral-400 text-neutral-700 hover:text-neutral-900 px-5 py-3 text-sm font-semibold transition-colors"
          >
            <Upload size={14} />
            Загрузить документ
          </Link>
          <Link
            href="/simulation"
            className="inline-flex items-center justify-center gap-2 bg-[#171717] hover:bg-black text-white rounded-none px-5 py-3 text-sm font-semibold transition-colors"
          >
            <Play size={14} className="fill-white" />
            Новый стресс-тест
          </Link>
        </div>
      </motion.div>

      {activeSession && (
        <motion.div variants={itemVariants} className="border-2 border-neutral-900 bg-neutral-50 p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <span className="font-medium text-neutral-900">У вас есть незавершённая симуляция</span>
            <span className="text-neutral-500 text-sm hidden sm:inline">({getPersonaDisplayLabel(activeSession.persona_config)})</span>
          </div>
          <Link 
            href={`/simulation/${activeSession.id}`}
            className="bg-[#171717] text-white px-5 py-2.5 text-sm font-semibold hover:bg-black transition-colors rounded-none whitespace-nowrap text-center"
          >
            Продолжить
          </Link>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <MetricPod
          label="ИНДЕКС УСТОЙЧИВОСТИ"
          value={indexMarkup}
          subtitle={indexSubtitle}
          icon={<Target size={18} className="text-emerald-500" />}
        />
        <MetricPod
          label="КРИТИЧЕСКИЕ УЯЗВИМОСТИ"
          value={criticalCount}
          subtitle="Сессии с баллом ниже 4/10"
          icon={<AlertTriangle size={18} className="text-red-500" />}
        />
        <MetricPod
          label="СЕССИЙ ЗА МЕСЯЦ"
          value={monthlySessionsCount}
          subtitle="Интенсивность тренировок"
          icon={<Activity size={18} className="text-amber-500" />}
        />
      </motion.div>

      {/* ── 3. CHART SECTION ── */}
      <motion.div variants={itemVariants} className="bg-white border border-neutral-200 rounded-none overflow-hidden mb-8 flex flex-col">
        <div className="p-6 pb-0">
          <h2 className="font-inter text-[11px] font-bold text-neutral-500 tracking-widest uppercase">
            ДИНАМИКА ИНДЕКСА УСТОЙЧИВОСТИ
          </h2>
        </div>
        {scoredSessions.length >= 3 ? (
          <SimpleChart sessions={scoredSessions} />
        ) : (
          <NextStepsPanel documents={documents} completedSessions={completedSessions} sessions={sessions} />
        )}
      </motion.div>

      {/* ── 4. HISTORY SECTION ── */}
      <motion.div variants={itemVariants} className="bg-white border border-neutral-200 rounded-none overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="font-inter text-[11px] font-bold text-neutral-500 tracking-widest uppercase">
            ЛЕНТА СИМУЛЯЦИЙ
          </h2>
          <Link href="/simulation" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 group">
            Все <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="flex flex-col">
          {recentSessions.map(session => (
            <DashboardSessionCard key={session.id} session={session} />
          ))}
        </div>
      </motion.div>

      {/* ── 5. DOCUMENTS SECTION ── */}
      <motion.div variants={itemVariants}>
        <DashboardDocuments documents={documents} />
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, sessions, documents, billing, userState, isLoading, error } = useDashboardData();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 font-inter bg-white min-h-screen">
      {error && (
        <div className="mb-8 p-3 bg-red-50 text-red-600 text-sm flex items-center justify-center border border-red-200">
           <AlertTriangle size={16} className="mr-2" />
           Не удалось загрузить историю. Показаны частичные данные.
        </div>
      )}

      {isLoading || userState === 'loading' ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 size={32} className="animate-spin text-neutral-900 mb-4" />
          <span className="font-mono text-[11px] text-neutral-500 tracking-widest uppercase">Загрузка аналитики...</span>
        </div>
      ) : userState === 'new' ? (
        <DashboardNewUser profile={profile} billing={billing} />
      ) : (
        <DashboardActive sessions={sessions} documents={documents} />
      )}
    </div>
  );
}
