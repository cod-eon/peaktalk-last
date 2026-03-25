"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    FileText,
    AlertCircle,
    Zap,
    Target,
    Activity,
    ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';

type AnalysisFeedback = {
    logic: string;
    style: string;
    clarity: string;
    grammar: string;
    overall_score: number;
};

type Draft = {
    id: string;
    title: string;
    created_at: string;
    analysis_result: {
        feedback_json: AnalysisFeedback;
        created_at: string;
    } | null;
};

type DraftsResponse = {
    items: Draft[];
    total: number;
};

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
    const pct = Math.min((value / max) * 100, 100);
    const color =
        value >= 7 ? 'bg-emerald-500' : value >= 5 ? 'bg-[var(--color-warning)]' : 'bg-red-500';
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="label-kicker">{label}</span>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {value}<span className="text-[var(--text-dim)]">/10</span>
                </span>
            </div>
            <div className="w-full h-1 bg-[var(--bg-main)] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    const { data, isLoading, isError } = useQuery<DraftsResponse>({
        queryKey: ['drafts-analytics'],
        queryFn: () => api.get('/drafts?limit=100'),
        staleTime: 30_000,
    });

    const drafts = data?.items ?? [];
    const totalDrafts = data?.total ?? 0;
    const analyzedDrafts = drafts.filter((d) => d.analysis_result !== null);
    const scores = analyzedDrafts.map((d) => d.analysis_result!.feedback_json.overall_score);
    const avgScore = scores.length
        ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
        : null;
    const lastAnalyzed = analyzedDrafts[0] ?? null;
    const chartScores = scores.slice(0, 10).reverse();

    const analysisRate =
        totalDrafts > 0 ? Math.round((analyzedDrafts.length / totalDrafts) * 100) : 0;

    const yLabels = [10, 7, 5, 0];

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 py-6 sm:py-8 lg:px-8 pb-20 md:pb-10">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <p className="label-kicker mb-2">Прогресс</p>
                <h1 className="font-syne text-[22px] sm:text-[26px] font-bold text-[var(--text-main)] tracking-tight">
                    Аналитика
                </h1>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    {
                        label: 'Материалов',
                        value: isLoading ? '—' : String(totalDrafts),
                        sub: analyzedDrafts.length > 0 ? `${analyzedDrafts.length} разобрано` : 'Загрузите первый',
                        icon: FileText,
                        iconColor: 'text-[var(--accent-blue)]',
                        iconBg: 'bg-[var(--accent-blue-bg)]',
                    },
                    {
                        label: 'Средний AI Score',
                        value: isLoading ? '—' : avgScore !== null ? String(avgScore) : '—',
                        sub: avgScore !== null
                            ? avgScore >= 7 ? 'Отличный уровень' : 'Есть куда расти'
                            : 'Запустите анализ',
                        icon: Target,
                        iconColor: 'text-[var(--accent-primary)]',
                        iconBg: 'bg-[var(--accent-primary-bg)]',
                    },
                    {
                        label: 'Покрытие анализом',
                        value: isLoading ? '—' : `${analysisRate}%`,
                        sub: `${analyzedDrafts.length} из ${totalDrafts}`,
                        icon: Activity,
                        iconColor: 'text-emerald-400',
                        iconBg: 'bg-emerald-400/10',
                    },
                    {
                        label: 'AI Симуляций',
                        value: '—',
                        sub: 'Скоро появится',
                        icon: Zap,
                        iconColor: 'text-[var(--color-ai)]',
                        iconBg: 'bg-[var(--color-ai-bg)]',
                    },
                ].map((s, i) => (
                    <div
                        key={i}
                        className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="label-kicker">{s.label}</span>
                            <div className={`w-6 h-6 rounded-[var(--radius-sm)] ${s.iconBg} flex items-center justify-center`}>
                                <s.icon size={13} className={s.iconColor} />
                            </div>
                        </div>
                        <div>
                            <div className="font-syne text-[26px] font-bold text-[var(--text-main)] leading-none tracking-tight">
                                {s.value}
                            </div>
                            <p className="text-[11px] text-[var(--text-dim)] mt-1">{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar chart */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5 flex flex-col min-h-[320px]">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="font-syne text-[15px] font-semibold text-[var(--text-main)] tracking-tight">
                                Динамика AI Score
                            </h3>
                            <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                                Последние {chartScores.length || 0} анализов
                            </p>
                        </div>
                        {avgScore !== null && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)]">
                                <TrendingUp size={12} className="text-[var(--accent-primary)]" />
                                <span className="text-[11px] font-mono text-[var(--accent-primary)] font-medium">
                                    avg {avgScore}
                                </span>
                            </div>
                        )}
                    </div>

                    {isLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[var(--border-light)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                        </div>
                    )}

                    {isError && (
                        <div className="flex-1 flex items-center justify-center gap-2 text-red-400">
                            <AlertCircle size={15} />
                            <span className="text-[12px] font-inter">Ошибка загрузки</span>
                        </div>
                    )}

                    {!isLoading && !isError && chartScores.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center">
                                <BarChart3 size={18} className="text-[var(--text-dim)]" strokeWidth={1.5} />
                            </div>
                            <p className="text-[12px] text-[var(--text-muted)] font-inter text-center">
                                Нет данных — проанализируйте материал
                            </p>
                            <Link href="/upload" className="btn-primary text-[12px] px-3 py-2 gap-1.5">
                                <FileText size={12} />
                                Загрузить материал
                            </Link>
                        </div>
                    )}

                    {!isLoading && !isError && chartScores.length > 0 && (
                        <div className="flex-1 flex gap-3">
                            {/* Y-axis */}
                            <div className="flex flex-col justify-between pb-6 pr-1">
                                {yLabels.map((v) => (
                                    <span key={v} className="text-[9px] font-mono text-[var(--text-dim)] leading-none">
                                        {v}
                                    </span>
                                ))}
                            </div>

                            {/* Bars */}
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1 flex items-end gap-2 relative">
                                    {/* Horizontal grid lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0">
                                        {yLabels.map((v) => (
                                            <div
                                                key={v}
                                                className="w-full border-t border-dashed border-[var(--border-main)]/60"
                                            />
                                        ))}
                                    </div>

                                    {chartScores.map((score, i) => {
                                        const pct = (score / 10) * 100;
                                        const barColor =
                                            score >= 8
                                                ? 'bg-emerald-500'
                                                : score >= 6
                                                ? 'bg-[var(--accent-primary)]'
                                                : score >= 4
                                                ? 'bg-[var(--color-warning)]'
                                                : 'bg-red-500';

                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 flex flex-col items-center gap-0 relative group h-full justify-end"
                                                onMouseEnter={() => setHoveredBar(i)}
                                                onMouseLeave={() => setHoveredBar(null)}
                                            >
                                                {/* Tooltip */}
                                                {hoveredBar === i && (
                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 bg-[var(--bg-surface-alt)] border border-[var(--border-light)] rounded-[var(--radius-sm)] px-2 py-1 whitespace-nowrap pointer-events-none">
                                                        <span className="text-[11px] font-mono text-[var(--text-main)] font-medium">
                                                            {score}/10
                                                        </span>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--border-light)]" />
                                                    </div>
                                                )}

                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${pct}%` }}
                                                    transition={{
                                                        delay: 0.1 + i * 0.05,
                                                        duration: 0.5,
                                                        ease: [0.16, 1, 0.3, 1],
                                                    }}
                                                    className={`w-full relative rounded-t-[3px] ${barColor} ${
                                                        hoveredBar === i ? 'brightness-125' : ''
                                                    } transition-[filter] cursor-pointer`}
                                                >
                                                    <div className="absolute inset-x-0 top-0 h-px bg-white/25 rounded-t-full" />
                                                </motion.div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* X-axis labels */}
                                <div className="flex gap-2 mt-2 h-5">
                                    <div className="w-0" />
                                    {chartScores.map((_, i) => (
                                        <div key={i} className="flex-1 text-center">
                                            <span className="text-[9px] font-mono text-[var(--text-dim)]">#{i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Last analysis card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5 flex flex-col">
                    <div className="mb-5">
                        <h3 className="font-syne text-[15px] font-semibold text-[var(--text-main)] tracking-tight">
                            Последний разбор
                        </h3>
                        <p className="text-[11px] text-[var(--text-dim)] mt-0.5 truncate">
                            {lastAnalyzed ? lastAnalyzed.title : 'Нет данных'}
                        </p>
                    </div>

                    {isLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[var(--border-light)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                        </div>
                    )}

                    {!lastAnalyzed && !isLoading && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                            <Target size={24} className="text-[var(--text-dim)]" strokeWidth={1.5} />
                            <p className="text-[12px] text-[var(--text-muted)] font-inter">
                                Проанализируйте материал — здесь появится разбор
                            </p>
                        </div>
                    )}

                    {lastAnalyzed && lastAnalyzed.analysis_result && (
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Overall score */}
                            <div className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)]">
                                <div>
                                    <span className="font-syne text-[22px] font-bold text-[var(--accent-primary)] leading-none">
                                        {lastAnalyzed.analysis_result.feedback_json.overall_score}
                                    </span>
                                    <span className="text-[12px] text-[var(--text-dim)] font-mono ml-0.5">/10</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium text-[var(--text-main)]">AI Score</p>
                                    <p className="text-[10px] text-[var(--text-dim)]">Итоговая оценка</p>
                                </div>
                                <TrendingUp size={14} className="text-[var(--accent-primary)] ml-auto" />
                            </div>

                            {/* Skill bars */}
                            <div className="flex flex-col gap-3">
                                {(
                                    [
                                        { key: 'logic' as const, label: 'Логика' },
                                        { key: 'clarity' as const, label: 'Ясность' },
                                        { key: 'style' as const, label: 'Стиль' },
                                        { key: 'grammar' as const, label: 'Грамматика' },
                                    ] as const
                                ).map(({ key, label }) => {
                                    const text = lastAnalyzed.analysis_result!.feedback_json[key];
                                    // Extract a numeric score from the text if present, otherwise show text
                                    return (
                                        <div key={key}>
                                            <span className="label-kicker">{label}</span>
                                            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed line-clamp-2 font-inter">
                                                {text}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <Link
                                href={`/analysis/${lastAnalyzed.id}`}
                                className="mt-auto flex items-center gap-1.5 text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors"
                            >
                                <span className="text-[12px] font-medium font-inter">Открыть полный разбор</span>
                                <ChevronRight size={13} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
