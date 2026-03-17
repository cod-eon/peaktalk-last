"use client";

import React from 'react';
import { ArrowRight, FileText, CheckCircle2, Clock, UploadCloud, Activity, TrendingUp, BarChart2, AlertCircle, Play, Zap } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type AnalysisResult = {
    feedback_json: {
        overall_score: number;
    };
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
        return { label: 'Проанализирован', color: 'text-emerald-400', icon: <CheckCircle2 size={15} className="text-emerald-400" /> };
    }
    return { label: 'Загружен', color: 'text-[var(--text-muted)]', icon: <Clock size={15} className="text-[var(--text-dim)]" /> };
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
    const avgScore = analyzedDrafts.length
        ? Math.round(analyzedDrafts.reduce((acc, d) => acc + (d.analysis_result!.feedback_json.overall_score), 0) / analyzedDrafts.length)
        : null;

    const stats = [
        {
            label: 'Материалов загружено',
            value: isLoading ? '—' : String(totalDrafts),
            trend: totalDrafts > 0 ? `${analyzedDrafts.length} проанализировано` : 'Загрузите первый материал',
            positive: totalDrafts > 0,
            type: 'progress' as const,
            valueProgress: totalDrafts > 0 ? Math.round((analyzedDrafts.length / totalDrafts) * 100) : 0,
            icon: <BarChart2 size={16} className="text-[var(--accent-blue)]" />,
        },
        {
            label: 'Средний балл анализа',
            value: isLoading ? '—' : avgScore !== null ? `${avgScore} / 10` : 'Нет данных',
            trend: avgScore !== null ? (avgScore >= 7 ? 'Отличный результат!' : avgScore >= 5 ? 'Есть куда расти' : 'Нужна доработка') : 'Запустите анализ материала',
            positive: avgScore !== null && avgScore >= 7,
            type: 'status' as const,
            statusColor: avgScore !== null ? (avgScore >= 7 ? '#10b981' : avgScore >= 5 ? '#f59e0b' : '#f43f5e') : '#64748b',
            icon: <TrendingUp size={16} className="text-[var(--accent-blue)]" />,
        },
        {
            label: 'Быстрый старт',
            value: 'Симуляция',
            trend: 'Стресс-тест с AI-собеседником',
            positive: true,
            type: 'action' as const,
            href: '/simulation',
            icon: <Activity size={16} className="text-[var(--accent-blue)]" />,
        },
    ];

    return (
        <div className="pb-10 pt-4 sm:pt-8 w-full max-w-6xl mx-auto px-6 lg:px-10 overflow-hidden">
            {/* ─── HEADER SECTION ─── */}
            <div className="flex flex-col gap-6 mb-10 sm:flex-row sm:items-start sm:justify-between sm:mb-14">
                <div>
                    <h1 className="font-syne text-2xl sm:text-3xl font-bold text-slate-100 leading-tight tracking-tight m-0">
                        С возвращением, {displayName}.
                    </h1>
                </div>
                <div className="w-full sm:w-auto">
                    <Link
                        href="/upload"
                        className="btn-primary w-full sm:w-auto mt-2 sm:mt-0 shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-shadow"
                    >
                        <UploadCloud size={16} className="mr-2" />
                        Новый разбор
                    </Link>
                </div>
            </div>

            {/* ─── ONBOARDING CHECKLIST (shown only for new users with no content) ─── */}
            {!isLoading && !isError && totalDrafts === 0 && (
                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 mb-10 shadow-lg">
                    <h2 className="font-syne text-base font-semibold text-[var(--text-main)] mb-5">Начните работу</h2>
                    <div className="flex flex-col gap-3">
                        {/* Step 1 */}
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/30 flex items-center justify-center shrink-0">
                                <UploadCloud size={16} className="text-[var(--accent-blue)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link href="/upload" className="font-inter text-sm font-medium text-[var(--text-main)] hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5">
                                    Загрузите документ
                                    <ArrowRight size={14} className="opacity-60" />
                                </Link>
                                <p className="font-inter text-xs text-[var(--text-dim)] mt-0.5">Текст выступления, питча или сценария</p>
                            </div>
                            <div className="w-5 h-5 rounded-full border border-[var(--border-light)] flex items-center justify-center shrink-0">
                                <span className="w-2 h-2 rounded-full bg-[var(--border-light)]" />
                            </div>
                        </div>
                        <div className="ml-4 w-px h-4 bg-[var(--border-main)]" />
                        {/* Step 2 */}
                        <div className="flex items-center gap-4 opacity-40">
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center shrink-0">
                                <Zap size={16} className="text-[var(--text-dim)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-inter text-sm font-medium text-[var(--text-muted)]">Запустите анализ</span>
                                <p className="font-inter text-xs text-[var(--text-dim)] mt-0.5">AI разберёт структуру и логику текста</p>
                            </div>
                            <div className="w-5 h-5 rounded-full border border-[var(--border-main)] flex items-center justify-center shrink-0" />
                        </div>
                        <div className="ml-4 w-px h-4 bg-[var(--border-main)]" />
                        {/* Step 3 */}
                        <div className="flex items-center gap-4 opacity-40">
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center shrink-0">
                                <Play size={16} className="text-[var(--text-dim)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-inter text-sm font-medium text-[var(--text-muted)]">Начните симуляцию</span>
                                <p className="font-inter text-xs text-[var(--text-dim)] mt-0.5">Стресс-тест с AI-собеседником по вашему материалу</p>
                            </div>
                            <div className="w-5 h-5 rounded-full border border-[var(--border-main)] flex items-center justify-center shrink-0" />
                        </div>
                    </div>
                </div>
            )}

            {/* ─── STATS GRID ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 sm:mb-16">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--accent-blue)]/50 transition-colors duration-300 p-6 flex flex-col relative overflow-hidden rounded-2xl group shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                    >
                        <div className="absolute -right-20 -top-20 w-40 h-40 bg-[var(--accent-blue)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent-blue)]/10 transition-all duration-500" />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="font-mono text-[11px] text-[var(--text-dim)] uppercase tracking-widest">
                                {stat.label}
                            </div>
                            {stat.type === 'status' && stat.statusColor && (
                                <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 relative">
                                    <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: stat.statusColor }} />
                                    <div className="relative w-full h-full rounded-full" style={{ backgroundColor: stat.statusColor }} />
                                </div>
                            )}
                        </div>

                        <div className="flex items-end justify-between mb-8 relative z-10">
                            {stat.type === 'action' ? (
                                <Link
                                    href={stat.href!}
                                    className="font-syne text-2xl sm:text-3xl font-bold text-[var(--accent-blue)] leading-none tracking-tight underline-offset-4 hover:underline transition-colors"
                                >
                                    {stat.value}
                                </Link>
                            ) : (
                                <div className="font-syne text-3xl sm:text-4xl font-bold text-slate-100 leading-none tracking-tight">
                                    {stat.value}
                                </div>
                            )}
                        </div>

                        <div className="mt-auto flex flex-col gap-3 relative z-10">
                            {stat.type === 'progress' && (
                                <div className="w-full h-2 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--accent-blue)] transition-all duration-700"
                                        style={{ width: `${stat.valueProgress ?? 0}%` }}
                                    />
                                </div>
                            )}

                            <div className={`font-inter text-xs flex items-center gap-1.5 ${stat.positive ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                                <Activity size={14} className="opacity-80" />
                                {stat.trend}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── RECENT DRAFTS MODULE ─── */}
            <div className="w-full">
                <div className="flex items-end justify-between mb-6">
                    <h2 className="font-syne text-xl sm:text-2xl font-semibold text-slate-100 m-0">
                        Недавние разборы
                    </h2>
                    <Link
                        href="/upload"
                        className="flex items-center gap-1.5 bg-transparent border-none p-0 text-[var(--text-dim)] hover:text-[var(--accent-blue)] font-mono text-[10px] sm:text-[11px] tracking-widest uppercase cursor-pointer transition-colors"
                    >
                        <span className="hidden sm:inline">Добавить</span> <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-blue)]/30 to-transparent" />

                    {/* Desktop header */}
                    <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_160px_120px_48px] px-6 py-5 border-b border-[var(--border-light)]/50 bg-[var(--bg-surface-alt)]/50">
                        <div className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-widest">Название</div>
                        <div className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-widest">Статус</div>
                        <div className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-widest">Дата</div>
                        <div></div>
                    </div>

                    <div className="flex flex-col divide-y divide-[var(--border-main)] relative z-10">
                        {isLoading && (
                            <div className="px-6 py-10 flex items-center justify-center gap-3 text-[var(--text-muted)] font-mono text-sm">
                                <Activity size={16} className="animate-spin" /> Загрузка...
                            </div>
                        )}

                        {isError && (
                            <div className="px-6 py-10 flex items-center justify-center gap-3 text-rose-400 font-mono text-sm">
                                <AlertCircle size={16} /> Ошибка загрузки данных
                            </div>
                        )}

                        {!isLoading && !isError && drafts.length === 0 && (
                            <div className="px-6 py-12 text-center">
                                <p className="text-[var(--text-muted)] font-mono text-sm mb-4">
                                    Нет материалов. Загрузите первый документ для разбора.
                                </p>
                                <Link href="/upload" className="btn-primary text-sm">
                                    <UploadCloud size={14} className="mr-2" /> Загрузить материал
                                </Link>
                            </div>
                        )}

                        {drafts.map((draft) => {
                            const { label, color, icon } = getDraftStatus(draft);
                            const dateStr = formatDistanceToNow(new Date(draft.created_at), { addSuffix: true, locale: ru });

                            return (
                                <Link
                                    href={`/analysis/${draft.id}`}
                                    key={draft.id}
                                    className="group flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_160px_120px_48px] lg:items-center px-4 py-4 sm:px-6 hover:bg-[var(--bg-surface-hover)] transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--accent-blue)]/50 to-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-blue)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                    {/* Name */}
                                    <div className="flex items-center gap-4 min-w-0 mb-3 lg:mb-0 relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-light)] flex items-center justify-center flex-shrink-0 group-hover:border-[var(--accent-blue)]/50 group-hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all duration-300">
                                            <FileText size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] transition-colors" />
                                        </div>
                                        <span className="font-inter text-sm font-medium text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap group-hover:translate-x-1 transition-transform duration-300">
                                            {draft.title}
                                        </span>
                                    </div>

                                    {/* Mobile meta */}
                                    <div className="grid grid-cols-2 gap-4 lg:hidden ml-14 relative z-10">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-widest">Статус</span>
                                            <div className="flex items-center gap-1.5">
                                                {icon}
                                                <span className={`font-inter text-[11px] font-medium ${color}`}>{label}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-widest">Дата</span>
                                            <span className="font-mono text-[11px] text-[var(--text-muted)]">{dateStr}</span>
                                        </div>
                                    </div>

                                    {/* Desktop status */}
                                    <div className="hidden lg:flex items-center gap-2 relative z-10">
                                        {icon}
                                        <span className={`font-inter text-sm font-medium ${color}`}>{label}</span>
                                    </div>

                                    {/* Desktop date */}
                                    <div className="hidden lg:flex items-center font-mono text-xs text-[var(--text-muted)] relative z-10">
                                        {dateStr}
                                    </div>

                                    {/* Chevron */}
                                    <div className="hidden lg:flex items-center justify-end text-[var(--text-dim)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--accent-blue)] group-hover:translate-x-1 transition-all relative z-10">
                                        <ArrowRight size={18} />
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
