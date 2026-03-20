"use client";

import React from 'react';
import {
    ArrowRight,
    FileText,
    CheckCircle2,
    Clock,
    UploadCloud,
    AlertCircle,
    TrendingUp,
    ChevronRight,
    Sparkles,
    Plus,
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

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Пользователь';

    const { data, isLoading, isError } = useQuery<DraftsResponse>({
        queryKey: ['drafts-dashboard'],
        queryFn: () => api.get('/drafts?limit=10'),
        staleTime: 30_000,
    });

    const drafts = data?.items ?? [];
    const totalDrafts = data?.total ?? 0;
    const analyzedDrafts = drafts.filter((d) => d.analysis_result !== null);
    const avgScore =
        analyzedDrafts.length
            ? Math.round(
                  analyzedDrafts.reduce((acc, d) => acc + d.analysis_result!.feedback_json.overall_score, 0) /
                      analyzedDrafts.length
              )
            : null;

    return (
        <div className="pb-16 md:pb-10 pt-8 sm:pt-10 w-full max-w-5xl mx-auto px-5 lg:px-8">

            {/* ─── Header ─── */}
            <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[13px] text-[var(--text-dim)] mb-1.5 font-medium">Добро пожаловать</p>
                    <h1 className="text-[26px] sm:text-[30px] font-bold text-[var(--text-main)] leading-tight" style={{ letterSpacing: '-0.025em' }}>
                        Привет, {displayName}! Готов к питчу?
                    </h1>
                </div>
                <Link
                    href="/upload"
                    className="btn-primary flex-shrink-0 gap-2 self-start"
                >
                    <Plus size={15} />
                    Новый разбор
                </Link>
            </div>

            {/* ─── Main grid: hero card + metric cards ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

                {/* Hero card — AI Simulation */}
                <Link
                    href="/simulation"
                    className="lg:col-span-2 group relative bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] p-6 sm:p-7 flex flex-col justify-between overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-[var(--border-light)] transition-all duration-200"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                    {/* Background gradient accent */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-50 to-transparent rounded-[var(--radius-lg)] pointer-events-none" />

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

                        <p className="text-[14px] text-[var(--text-muted)] leading-relaxed max-w-sm">
                            Пройди стресс-тест по своему тексту с AI-собеседником — HR, Инвестор или Клиент. Живые вопросы, честная обратная связь.
                        </p>
                    </div>

                    <div className="relative z-10 mt-6 flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] border border-violet-200 bg-violet-50 text-violet-700 text-[13px] font-semibold transition-all group-hover:bg-violet-100 group-hover:border-violet-300">
                            <Sparkles size={13} />
                            Начать тренировку
                        </span>
                        <ChevronRight
                            size={18}
                            className="text-[var(--text-dim)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                        />
                    </div>
                </Link>

                {/* Metric cards column */}
                <div className="flex flex-col gap-4">

                    {/* Card: texts uploaded */}
                    <div
                        className="flex-1 bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] p-5 flex flex-col justify-between"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="label-kicker">Текстов загружено</span>
                            <div className="w-7 h-7 rounded-md bg-orange-50 flex items-center justify-center">
                                <FileText size={14} className="text-[var(--accent-primary)]" />
                            </div>
                        </div>
                        <div>
                            <div className="text-[36px] font-bold text-[var(--text-main)] leading-none mb-1" style={{ letterSpacing: '-0.03em' }}>
                                {isLoading ? <span className="opacity-25">—</span> : totalDrafts}
                            </div>
                            <p className="text-[12px] text-[var(--text-dim)]">
                                {totalDrafts > 0
                                    ? `${analyzedDrafts.length} из ${totalDrafts} проанализировано`
                                    : 'материалов'}
                            </p>
                        </div>
                    </div>

                    {/* Card: avg score */}
                    <div
                        className="flex-1 bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] p-5 flex flex-col justify-between"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="label-kicker">Средний балл</span>
                            <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center">
                                <TrendingUp size={14} className="text-emerald-600" />
                            </div>
                        </div>
                        <div>
                            <div className="text-[36px] font-bold text-[var(--text-main)] leading-none mb-1" style={{ letterSpacing: '-0.03em' }}>
                                {isLoading ? (
                                    <span className="opacity-25">—</span>
                                ) : avgScore !== null ? (
                                    <>
                                        {avgScore}
                                        <span className="text-[20px] text-[var(--text-dim)] font-medium ml-0.5">/10</span>
                                    </>
                                ) : (
                                    <span className="text-[var(--text-dim)] text-2xl">—</span>
                                )}
                            </div>
                            <p className="text-[12px] text-[var(--text-dim)]">
                                {avgScore !== null
                                    ? avgScore >= 7
                                        ? 'Логика улучшилась'
                                        : avgScore >= 5
                                        ? 'Есть куда расти'
                                        : 'Нужна доработка'
                                    : 'Запустите анализ'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Onboarding checklist (new users only) ─── */}
            {!isLoading && !isError && totalDrafts === 0 && (
                <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] p-6 mb-8" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h2 className="text-[15px] font-semibold text-[var(--text-main)] mb-5" style={{ letterSpacing: '-0.01em' }}>
                        С чего начать
                    </h2>
                    <div className="flex flex-col gap-0">
                        {[
                            {
                                icon: UploadCloud,
                                title: 'Загрузите материал',
                                desc: 'Текст выступления, питча или сценария',
                                href: '/upload',
                                active: true,
                                iconBg: 'bg-orange-50',
                                iconColor: 'text-[var(--accent-primary)]',
                            },
                            {
                                icon: FileText,
                                title: 'Запустите анализ',
                                desc: 'AI разберёт структуру и логику текста',
                                href: null,
                                active: false,
                                iconBg: 'bg-gray-50',
                                iconColor: 'text-[var(--text-dim)]',
                            },
                            {
                                icon: Sparkles,
                                title: 'Начните симуляцию',
                                desc: 'Стресс-тест с AI-собеседником по вашему материалу',
                                href: null,
                                active: false,
                                iconBg: 'bg-violet-50',
                                iconColor: 'text-violet-500',
                            },
                        ].map((step, i) => (
                            <React.Fragment key={i}>
                                <div className={`flex items-center gap-4 py-3 ${!step.active ? 'opacity-40' : ''}`}>
                                    <div className={`w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 border ${step.active ? 'border-orange-200 ' + step.iconBg : 'border-[var(--border-main)] bg-[var(--bg-surface-alt)]'}`}>
                                        <step.icon size={15} className={step.active ? step.iconColor : 'text-[var(--text-dim)]'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {step.href ? (
                                            <Link
                                                href={step.href}
                                                className="text-[13px] font-semibold text-[var(--text-main)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5 w-fit"
                                            >
                                                {step.title}
                                                <ArrowRight size={12} className="opacity-60" />
                                            </Link>
                                        ) : (
                                            <span className="text-[13px] font-medium text-[var(--text-muted)]">
                                                {step.title}
                                            </span>
                                        )}
                                        <p className="text-[12px] text-[var(--text-dim)] mt-0.5">{step.desc}</p>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${step.active ? 'border-orange-300' : 'border-[var(--border-main)]'}`}>
                                        {step.active && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                                        )}
                                    </div>
                                </div>
                                {i < 2 && (
                                    <div className="ml-10 w-px h-3 bg-[var(--border-main)]" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Recent drafts ─── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[17px] font-semibold text-[var(--text-main)]" style={{ letterSpacing: '-0.015em' }}>
                        Последние разборы
                    </h2>
                    <Link
                        href="/upload"
                        className="flex items-center gap-1 text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors group text-[13px] font-medium"
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
                                <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center mx-auto mb-3">
                                    <FileText size={20} className="text-[var(--text-dim)]" strokeWidth={1.5} />
                                </div>
                                <p className="text-[14px] text-[var(--text-dim)] mb-4">
                                    Пока нет материалов для разбора
                                </p>
                                <Link href="/upload" className="btn-primary text-sm gap-1.5">
                                    <UploadCloud size={13} />
                                    Загрузить первый
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
                                    className="group flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_160px_150px_44px] lg:items-center px-4 py-4 sm:px-5 hover:bg-[var(--bg-surface-alt)] transition-colors duration-150 relative"
                                >
                                    {/* Active left bar */}
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />

                                    {/* Name */}
                                    <div className="flex items-center gap-3 min-w-0 mb-2.5 lg:mb-0">
                                        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-gray-50 border border-[var(--border-main)] flex items-center justify-center shrink-0 group-hover:border-orange-200 group-hover:bg-orange-50 transition-colors">
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
