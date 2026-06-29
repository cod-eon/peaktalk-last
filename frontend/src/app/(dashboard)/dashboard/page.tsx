"use client";

import React from 'react';
import { Play, Target, AlertTriangle, ArrowRight, Upload, Activity, Loader2, FileText, BarChart3, RotateCcw, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { DocumentItem, UserProfile } from '@/hooks/useDashboardData';
import { PlanBadge } from '@/components/PlanBadge';
import { formatDate, getPersonaDisplayLabel } from '@/lib/constants/personas';
import type { SessionItem } from '@/lib/constants/personas';
import type { BillingStatus, PlanId } from '@/types/billing';

// ── Components ─────────────────────────────────────────────────────────────

function MetricPod({
  label, value, subtitle, icon, variant = 'default'
}: {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'critical';
}) {
  return (
    <div className="bg-white border border-[#D9D5CC] rounded-none p-4 sm:p-6 flex flex-col justify-between h-full min-h-[138px]">
      <div className="flex justify-between items-start gap-3 mb-6">
        <span className="font-mono text-[10px] font-bold text-[#73706A] tracking-[0.18em] uppercase leading-tight">
          {label}
        </span>
        {variant === 'critical' ? (
          <span className="bg-[#E8600A] text-white px-2.5 py-1 font-mono text-[9px] font-bold leading-none tracking-[0.12em] uppercase">
            Требует внимания
          </span>
        ) : (
          <div className="text-[#111827] shrink-0">{icon}</div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="font-inter text-4xl sm:text-5xl font-black text-[#111827] tracking-tight flex items-baseline gap-1">
          {value}
        </div>
        <div className={`mt-2 h-1 w-full ${variant === 'critical' ? 'bg-[#E8600A]' : 'bg-[#111827]'}`} />
        {subtitle && (
          <span className="font-inter text-xs font-medium tracking-wide text-[#73706A] mt-2">
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
  
  const scoreBadge = session.avg_score !== null 
    ? <span className="font-mono text-[11px] font-bold text-[#111827]">{Math.round(session.avg_score * 10)}/10</span>
    : null;
  const date = formatDate(session.completed_at || session.created_at);

  return (
    <Link 
      href={isActive ? `/simulation/${session.id}` : `/simulation/${session.id}/report`}
      className="grid grid-cols-1 gap-3 px-4 py-4 border-b border-[#D9D5CC] hover:bg-[#FAF8F4] transition-colors group last:border-b-0 sm:grid-cols-[minmax(0,1fr)_120px_128px_28px] sm:items-center sm:px-6"
    >
      <div className="min-w-0">
        <div className="font-semibold text-[#111827] truncate">{personaLabel}</div>
        <div className="mt-1 text-xs text-[#73706A] truncate">
          {session.persona_config.industry}
        </div>
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#73706A]">{date}</div>
      <div>
        {isActive ? (
          <span className="inline-flex border border-[#D97706] bg-[#D97706]/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#92400E]">
             В процессе
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 border border-[#D9D5CC] bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#111827]">
            Завершено {scoreBadge}
          </span>
        )}
      </div>
      <div className="text-[#73706A] group-hover:text-[#111827] transition-colors sm:justify-self-end">
        <ArrowRight size={16} />
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
    <div className="h-[300px] p-6 pt-8 relative flex flex-col">
      <div className="flex-1 border-b border-[#D9D5CC] relative">
        <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="w-full h-full text-[#111827] overflow-visible">
           {[40, 80, 120, 160].map(y => (
             <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#D9D5CC" strokeWidth="1" vectorEffect="non-scaling-stroke" />
           ))}
           <line x1="0" y1={baselineY} x2="800" y2={baselineY} stroke="#E8600A" strokeDasharray="6,6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
           <path d={pathD} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
           {points.map((p, i) => (
             <circle key={i} cx={p.x} cy={p.y} r="6" fill="#111827" stroke="#FAF8F4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
           ))}
        </svg>
      </div>
      <div className="flex items-end justify-between px-4 pt-4 font-mono text-[10px] text-[#73706A] font-medium uppercase tracking-[0.08em] whitespace-nowrap overflow-hidden">
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
      title: "Загрузите материал встречи",
      desc: "Для точной проверки нужен контекст: тезисы, аргументы и ожидаемые возражения.",
      action: "Перейти к загрузке",
      href: "/upload",
      icon: <Upload size={24} className="text-[#E8600A]" />
    };
  } else if (completedSessions.length === 0) {
    tip = {
      title: "Проведите первую проверку",
      desc: "Завершённый стресс-тест сформирует базовую линию устойчивости аргументации.",
      action: "Запустить стресс-тест",
      href: "/simulation",
      icon: <Target size={24} className="text-[#E8600A]" />
    };
  } else if (inactivityDays > 7 && sessions.length > 0) {
    tip = {
      title: "Данные устарели",
      desc: "Последний стресс-тест был больше недели назад. Обновите картину перед реальной встречей.",
      action: "Продолжить",
      href: "/simulation",
      icon: <Activity size={24} className="text-[#D97706]" />
    };
  } else {
    tip = {
      title: "Недостаточно точек для динамики",
      desc: "График станет показательным после трёх завершённых стресс-тестов.",
      action: "Новый стресс-тест",
      href: "/simulation",
      icon: <Target size={24} className="text-[#E8600A]" />
    };
  }

  return (
    <div className="h-[300px] p-6 relative flex flex-col justify-center items-center text-center bg-[#FAF8F4] border-t border-[#D9D5CC] mt-2">
      <div className="bg-white p-4 border border-[#D9D5CC] mb-4 flex items-center justify-center">
         {tip.icon}
      </div>
      <h3 className="font-bold text-[#111827] mb-2">{tip.title}</h3>
      <p className="text-sm text-[#73706A] mb-6 max-w-sm">{tip.desc}</p>
      <Link href={tip.href} className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#111827] hover:text-[#E8600A] flex items-center gap-1 group">
         {tip.action} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

function DashboardDocuments({ documents }: { documents: DocumentItem[] }) {
  if (!documents || documents.length === 0) return null;
  const recentDocs = documents.slice(0, 3);
  
  return (
    <div className="bg-white border border-[#D9D5CC] rounded-none overflow-hidden mt-8 mb-8">
      <div className="p-6 border-b border-[#D9D5CC] flex justify-between items-center">
        <h2 className="font-mono text-[11px] font-bold text-[#73706A] tracking-[0.18em] uppercase">
          ПОСЛЕДНИЕ МАТЕРИАЛЫ
        </h2>
      </div>
      <div className="flex flex-col">
        {recentDocs.map(doc => {
          const hasAnalysis = Boolean(doc.draft_id);
          return (
            <div key={doc.id} className="flex items-center justify-between p-4 px-6 border-b border-[#D9D5CC] hover:bg-[#FAF8F4] transition-colors group last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FEF3E8] text-[#E8600A] flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="font-medium text-[#111827] truncate max-w-[150px] sm:max-w-[300px]">{doc.name}</div>
                  <div className="text-xs text-[#73706A]">{formatDate(doc.created_at)}</div>
                </div>
              </div>
              <Link
                href={hasAnalysis ? `/analysis/${doc.draft_id}` : '/upload'}
                className="text-[11px] font-semibold px-3 py-1.5 border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors text-neutral-600 rounded-none whitespace-nowrap"
              >
                {hasAnalysis ? (
                  <>Открыть<span className="hidden sm:inline"> разбор</span></>
                ) : (
                  <>Подготовить</>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-pages ────────────────────────────────────────────────────────────────

function DashboardNewUser({ profile, billing }: { profile: UserProfile; billing: { status: BillingStatus | null; simulationsLeft: number | null } }) {
  const segment = profile?.segment || 'other';
  let title = "Подготовьте первый рабочий материал";
  
  switch (segment) {
    case 'manager':
      title = 'Подготовьтесь к защите решений';
      break;
    case 'founder':
      title = 'Проверьте инвест-питч';
      break;
    case 'head':
      title = 'Подготовьтесь к бюджетной защите';
      break;
    case 'customer_facing':
      title = 'Подготовьтесь к QBR';
      break;
  }

  const simulationsLeft = billing?.simulationsLeft;
  const plan: PlanId = (billing?.status?.subscription.plan as PlanId) ?? 'free';
  const isUnlimited = simulationsLeft === null && ['pro', 'team'].includes(plan);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <PlanBadge plan={plan} />
        {isUnlimited ? (
          <span className="text-[11px] font-medium text-[#73706A] font-mono tracking-[0.12em] uppercase">
            Безлимитные проверки материала
          </span>
        ) : (
          <span className="text-[11px] font-medium text-[#73706A] font-mono tracking-[0.12em] uppercase">
            Осталось проверок материала: {simulationsLeft ?? 0}
          </span>
        )}
      </div>
      
      <h1 className="text-3xl sm:text-5xl font-black text-[#111827] tracking-tight mb-4">
        {title}
      </h1>
      
      <p className="text-sm sm:text-base text-[#73706A] mb-10 max-w-xl mx-auto">
        Добавьте материал встречи, получите разбор слабых мест и затем прогоните позицию через ИИ-оппонента.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <Link
          href="/upload"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#111827] hover:bg-black text-white rounded-none px-6 py-3.5 text-sm font-semibold transition-colors"
        >
          <Upload size={16} />
          Новый материал
        </Link>
        <Link
          href="/simulation"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-[#D9D5CC] rounded-none hover:border-[#111827] text-[#111827] px-6 py-3.5 text-sm font-semibold transition-colors"
        >
          <Play size={16} />
          К стресс-тестам
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
  let indexSubtitle = "Завершите стресс-тест для расчёта";
  
  if (validScores.length > 0) {
    const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
    const avg10 = Math.round(avg * 10);
    const colorClass = avg10 >= 7 ? "text-[#111827]" : avg10 >= 4 ? "text-[#D97706]" : "text-[#E8600A]";
    indexMarkup = <span className={colorClass}>{avg10}<span className="text-[#73706A] text-xl">/10</span></span>;
    indexSubtitle = "Средняя устойчивость позиции";
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
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6 border-b border-[#D9D5CC] pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#111827] tracking-tight">Сводка подготовки</h1>
          <p className="text-sm font-medium text-[#73706A] mt-1">
            Устойчивость аргументации, уязвимости и история последних защит.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center gap-2 bg-[#111827] hover:bg-black text-white rounded-none px-5 py-3 text-sm font-semibold transition-colors"
          >
            <Upload size={14} />
            Новый материал
          </Link>
          <Link
            href="/simulation"
            className="inline-flex items-center justify-center gap-2 bg-white border border-[#D9D5CC] rounded-none hover:border-[#111827] text-[#111827] px-5 py-3 text-sm font-semibold transition-colors"
          >
            <Play size={14} />
            К стресс-тестам
          </Link>
        </div>
      </motion.div>

      {activeSession && (
        <motion.div variants={itemVariants} className="border-2 border-[#111827] bg-white p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[8px_8px_0_rgba(232,96,10,0.18)]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#E8600A] shrink-0" />
            <span className="font-medium text-[#111827]">Незавершённый стресс-тест</span>
            <span className="text-[#73706A] text-sm hidden sm:inline">({getPersonaDisplayLabel(activeSession.persona_config)})</span>
          </div>
          <Link 
            href={`/simulation/${activeSession.id}`}
            className="bg-[#111827] text-white px-5 py-2.5 text-sm font-semibold hover:bg-black transition-colors rounded-none whitespace-nowrap text-center"
          >
            Продолжить
          </Link>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <MetricPod
          label="ИНДЕКС УСТОЙЧИВОСТИ"
          value={indexMarkup}
          subtitle={indexSubtitle}
          icon={<BarChart3 size={18} />}
        />
        <MetricPod
          label="КРИТИЧЕСКИЕ УЯЗВИМОСТИ"
          value={criticalCount}
          subtitle="Разборы, где аргументы не выдержали давления"
          icon={<ShieldAlert size={18} />}
          variant={criticalCount > 0 ? 'critical' : 'default'}
        />
        <MetricPod
          label="СТРЕСС-ТЕСТОВ ЗА МЕСЯЦ"
          value={monthlySessionsCount}
          subtitle="Сколько проверок материала запущено в этом месяце"
          icon={<RotateCcw size={18} />}
        />
      </motion.div>

      {/* ── 3. CHART SECTION ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-4 mb-8">
        <section className="bg-white border border-[#D9D5CC] rounded-none overflow-hidden flex flex-col">
          <div className="p-5 sm:p-6 pb-0 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-2xl font-black leading-tight text-[#111827]">
              Динамика индекса<br className="hidden sm:block" /> устойчивости
            </h2>
            <div className="inline-flex self-start border border-[#D9D5CC] bg-[#FAF8F4] p-1">
              <span className="bg-[#111827] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white">Месяц</span>
              <span className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#73706A]">Квартал</span>
            </div>
          </div>
          {scoredSessions.length >= 3 ? (
            <SimpleChart sessions={scoredSessions} />
          ) : (
            <NextStepsPanel documents={documents} completedSessions={completedSessions} sessions={sessions} />
          )}
        </section>

        <aside className="bg-[#050505] border border-[#050505] p-8 min-h-[300px] flex flex-col items-center justify-center text-center text-white">
          <div className="mb-6 flex h-12 w-12 items-center justify-center border border-white/20 bg-white text-[#111827]">
            <Upload size={24} />
          </div>
          <h2 className="text-2xl font-black leading-tight">
            Загрузить материал<br />встречи
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/58">
            Анализ аргументации и поиск логических уязвимостей перед встречей.
          </p>
          <Link
            href="/upload"
            className="mt-8 inline-flex items-center justify-center border border-white px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-[#111827]"
          >
            Перейти к загрузке
          </Link>
        </aside>
      </motion.div>

      {/* ── 4. HISTORY SECTION ── */}
      <motion.div variants={itemVariants} className="bg-white border border-[#D9D5CC] rounded-none overflow-hidden">
        <div className="p-6 border-b border-[#D9D5CC] flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#111827]">
            Лента стресс-тестов
          </h2>
          <Link href="/simulation" className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#73706A] hover:text-[#111827] flex items-center gap-1 group">
            Все <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <div className="hidden border-b border-[#D9D5CC] bg-[#F3F0EA] px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#73706A] sm:grid sm:grid-cols-[minmax(0,1fr)_120px_128px_28px]">
          <span>Кейс</span>
          <span>Дата</span>
          <span>Статус</span>
          <span></span>
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
    <div className="min-h-screen bg-[#FAF8F4] bg-page-geo-subtle px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-16 font-inter">
      <div className="max-w-6xl mx-auto">
      {error && (
        <div className="mb-8 p-3 bg-white text-[#DC2626] text-sm flex items-center justify-center border border-[#DC2626]/30">
           <AlertTriangle size={16} className="mr-2" />
           Не удалось загрузить историю. Показаны частичные данные.
        </div>
      )}

      {isLoading || userState === 'loading' ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 size={32} className="animate-spin text-[#111827] mb-4" />
          <span className="font-mono text-[11px] text-[#73706A] tracking-[0.18em] uppercase">Загрузка аналитики...</span>
        </div>
      ) : userState === 'new' ? (
        <DashboardNewUser profile={profile} billing={billing} />
      ) : (
        <DashboardActive sessions={sessions} documents={documents} />
      )}
      </div>
    </div>
  );
}
