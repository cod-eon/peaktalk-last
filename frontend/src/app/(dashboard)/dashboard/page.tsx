"use client";

import React from 'react';
import {
    ArrowRight,
    FileText,
    CheckCircle2,
    Clock,
    UploadCloud,
    AlertCircle,
    Zap,
    TrendingUp,
    BarChart2,
    ChevronRight,
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

function getDraftStatus(draft: Draft): { label: string; color: string; icon: React.ReactNode } {
    if (draft.analysis_result) {
        return {
            label: 'Проанализирован',
            color: 'text-emerald-400',
            icon: <CheckCircle2 size={14} className="text-emerald-400" />,
        };
    }
    return {
        label: 'Загружен',
        color: 'text-[var(--text-dim)]',
        icon: <Clock size={14} className="text-[var(--text-dim)]" />,
    };
}

function ScoreBadge({ score }: { score: number }) {
    const color =
        score >= 7 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
        score >= 5 ? 'text-[var(--color-warning)] bg-[var(--color-warning-bg)] border-[var(--color-warning)]/20' :
                    'text-red-400 bg-red-400/10 border-red-400/20';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${color}`}>
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

    const analysisProgress = totalDrafts > 0 ? Math.round((analyzedDrafts.length / totalDrafts) * 100) : 0;

    return (
        <div className="pb-16 md:pb-10 pt-6 sm:pt-10 w-full max-w-5xl mx-auto px-5 lg:px-8">

            {/* ─── Header ─── */}
            <div className="flex flex-col gap-4 mb-10 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="label-kicker mb-2">Рабочее пространство</p>
                    <h1 className="font-syne text-2xl sm:text-[28px] font-bold text-[var(--text-main)] leading-tight tracking-tight">
                        {displayName}
                    </h1>
                </div>
                <Link
                    href="/upload"
                    className="btn-primary w-full sm:w-auto flex-shrink-0 gap-2"
                >
                    <UploadCloud size={15} />
                    Новый разбор
                </Link>
            </div>

            {/* ─── Onboarding checklist (new users only) ─── */}
            {!isLoading && !isError && totalDrafts === 0 && (
                <div className="relative bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-6 mb-8 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />
                    <h2 className="font-syne text-[15px] font-semibold text-[var(--text-main)] mb-5 tracking-tight">
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
                            },
                            {
                                icon: BarChart2,
                                title: 'Запустите анализ',
                                desc: 'AI разберёт структуру и логику текста',
                                href: null,
                                active: false,
                            },
                            {
                                icon: Zap,
                                title: 'Начните симуляцию',
                                desc: 'Стресс-тест с AI-собеседником по вашему материалу',
                                href: null,
                                active: false,
                            },
                        ].map((step, i) => (
                            <React.Fragment key={i}>
                                <div className={`flex items-center gap-4 py-3 ${!step.active ? 'opacity-35' : ''}`}>
                                    <div className={`w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 transition-colors ${
                                        step.active
                                            ? 'bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)]'
                                            : 'bg-[var(--bg-surface-alt)] border border-[var(--border-main)]'
                                    }`}>
                                        <step.icon
                                            size={15}
                                            className={step.active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-dim)]'}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {step.href ? (
                                            <Link
                                                href={step.href}
                                                className="text-[13px] font-medium text-[var(--text-main)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5 w-fit"
                                            >
                                                {step.title}
                                                <ArrowRight size={12} className="opacity-60" />
                                            </Link>
                                        ) : (
                                            <span className="text-[13px] font-medium text-[var(--text-muted)]">
                                                {step.title}
                                            </span>
                                        )}
                                        <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{step.desc}</p>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                        step.active ? 'border-[var(--accent-primary-glow)]' : 'border-[var(--border-main)]'
                                    }`}>
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

            {/* ─── Stats ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {/* Stat: Materials */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-[var(--border-light)] transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="label-kicker">Материалы</span>
                        <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-blue-bg)] flex items-center justify-center">
                            <FileText size={14} className="text-[var(--accent-blue)]" />
                        </div>
                    </div>
                    <div>
                        <div className="font-syne text-[32px] font-bold text-[var(--text-main)] leading-none tracking-tight mb-1">
                            {isLoading ? <span className="opacity-30">—</span> : totalDrafts}
                        </div>
                        <p className="text-[11px] text-[var(--text-dim)]">
                            {totalDrafts > 0
                                ? `${analyzedDrafts.length} из ${totalDrafts} проанализировано`
                                : 'Загрузите первый материал'}
                        </p>
                    </div>
                    {totalDrafts > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <div className="w-full h-1 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--accent-blue)] rounded-full transition-all duration-700"
                                    style={{ width: `${analysisProgress}%` }}
                                />
                            </div>
                            <span className="label-kicker">{analysisProgress}% разобрано</span>
                        </div>
                    )}
                </div>

                {/* Stat: Average score */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-[var(--border-light)] transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="label-kicker">Средний балл</span>
                        <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-primary-bg)] flex items-center justify-center">
                            <TrendingUp size={14} className="text-[var(--accent-primary)]" />
                        </div>
                    </div>
                    <div>
                        <div className="font-syne text-[32px] font-bold text-[var(--text-main)] leading-none tracking-tight mb-1">
                            {isLoading ? (
                                <span className="opacity-30">—</span>
                            ) : avgScore !== null ? (
                                <span>
                                    {avgScore}
                                    <span className="text-[18px] text-[var(--text-dim)] font-medium ml-1">/10</span>
                                </span>
                            ) : (
                                <span className="text-[var(--text-dim)] text-2xl">—</span>
                            )}
                        </div>
                        <p className="text-[11px] text-[var(--text-dim)]">
                            {avgScore !== null
                                ? avgScore >= 7
                                    ? 'Отличный результат'
                                    : avgScore >= 5
                                    ? 'Есть куда расти'
                                    : 'Нужна доработка'
                                : 'Запустите анализ материала'}
                        </p>
                    </div>
                    {avgScore !== null && (
                        <div className="flex flex-col gap-1.5">
                            <div className="w-full h-1 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${(avgScore / 10) * 100}%`,
                                        backgroundColor:
                                            avgScore >= 7 ? '#10b981' : avgScore >= 5 ? 'var(--color-warning)' : '#ef4444',
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Stat: Quick action */}
                <Link
                    href="/simulation"
                    className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5 flex flex-col gap-4 relative overflow-hidden group hover:border-[var(--accent-primary)]/40 transition-all duration-200 hover:shadow-[0_0_20px_var(--accent-primary-glow)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/0 to-[var(--accent-primary)]/0 group-hover:from-[var(--accent-primary)]/4 group-hover:to-transparent transition-all duration-300" />
                    <div className="flex items-center justify-between relative z-10">
                        <span className="label-kicker">Быстрый старт</span>
                        <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)] flex items-center justify-center group-hover:bg-[var(--accent-primary)] transition-colors">
                            <Zap size={14} className="text-[var(--accent-primary)] group-hover:text-[#0a0c10] transition-colors" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="font-syne text-[22px] font-bold text-[var(--text-main)] leading-tight tracking-tight mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
                            Симуляция
                        </div>
                        <p className="text-[11px] text-[var(--text-dim)]">
                            Стресс-тест с AI-собеседником
                        </p>
                    </div>
                    <div className="mt-auto flex items-center gap-1 text-[var(--text-dim)] group-hover:text-[var(--accent-primary)] transition-colors relative z-10">
                        <span className="text-[11px] font-medium font-inter">Начать сессию</span>
                        <ChevronRight size={13} />
                    </div>
                </Link>
            </div>

            {/* ─── Recent drafts ─── */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-syne text-[18px] font-semibold text-[var(--text-main)] tracking-tight">
                        Последние разборы
                    </h2>
                    <Link
                        href="/upload"
                        className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--accent-primary)] transition-colors group"
                    >
                        <span className="text-[12px] font-medium font-inter">Добавить</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent" />

                    {/* Desktop header */}
                    <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_150px_140px_40px] px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--bg-surface-alt)]/60">
                        <span className="label-kicker">Название</span>
                        <span className="label-kicker">Статус</span>
                        <span className="label-kicker">Дата</span>
                        <span />
                    </div>

                    <div className="flex flex-col divide-y divide-[var(--border-main)]">
                        {isLoading && (
                            <div className="px-5 py-10 flex items-center justify-center gap-3 text-[var(--text-dim)]">
                                <div className="w-4 h-4 border-2 border-[var(--border-light)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                                <span className="text-[13px] font-inter">Загрузка...</span>
                            </div>
                        )}

                        {isError && (
                            <div className="px-5 py-10 flex items-center justify-center gap-2 text-red-400">
                                <AlertCircle size={15} />
                                <span className="text-[13px] font-inter">Ошибка загрузки данных</span>
                            </div>
                        )}

                        {!isLoading && !isError && drafts.length === 0 && (
                            <div className="px-5 py-12 text-center">
                                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center mx-auto mb-3">
                                    <FileText size={18} className="text-[var(--text-dim)]" strokeWidth={1.5} />
                                </div>
                                <p className="text-[13px] text-[var(--text-muted)] font-inter mb-4">
                                    Пока нет материалов для разбора
                                </p>
                                <Link href="/upload" className="btn-primary text-sm gap-1.5">
                                    <UploadCloud size={13} />
                                    Загрузить первый
                                </Link>
                            </div>
                        )}

                        {drafts.map((draft) => {
                            const { label, color, icon } = getDraftStatus(draft);
                            const dateStr = formatDistanceToNow(new Date(draft.created_at), {
                                addSuffix: true,
                                locale: ru,
                            });
                            const score = draft.analysis_result?.feedback_json.overall_score ?? null;

                            return (
                                <Link
                                    href={`/analysis/${draft.id}`}
                                    key={draft.id}
                                    className="group flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_150px_140px_40px] lg:items-center px-4 py-3.5 sm:px-5 hover:bg-[var(--bg-surface-hover)] transition-colors duration-150 relative"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />

                                    {/* Name */}
                                    <div className="flex items-center gap-3 min-w-0 mb-2.5 lg:mb-0">
                                        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center shrink-0 group-hover:border-[var(--accent-primary)]/30 transition-colors">
                                            <FileText size={15} className="text-[var(--text-dim)] group-hover:text-[var(--accent-primary)] transition-colors" />
                                        </div>
                                        <span className="text-[13px] font-medium text-[var(--text-main)] overflow-hidden text-ellipsis whitespace-nowrap">
                                            {draft.title}
                                        </span>
                                    </div>

                                    {/* Mobile meta */}
                                    <div className="grid grid-cols-2 gap-3 lg:hidden ml-11">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="label-kicker mb-1">Статус</span>
                                            <div className="flex items-center gap-1.5">
                                                {icon}
                                                <span className={`text-[11px] font-medium font-inter ${color}`}>{label}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="label-kicker mb-1">Дата</span>
                                            <span className="text-[11px] text-[var(--text-dim)] font-mono">{dateStr}</span>
                                        </div>
                                    </div>

                                    {/* Desktop status */}
                                    <div className="hidden lg:flex items-center gap-2">
                                        {icon}
                                        <span className={`text-[12px] font-medium font-inter ${color}`}>{label}</span>
                                        {score !== null && <ScoreBadge score={score} />}
                                    </div>

                                    {/* Desktop date */}
                                    <div className="hidden lg:flex items-center text-[11px] font-mono text-[var(--text-dim)]">
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
