"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Target, BrainCircuit, Zap, FileText, AlertCircle } from 'lucide-react';
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

export default function AnalyticsPage() {
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
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        : null;
    const lastAnalyzed = analyzedDrafts[0] ?? null;

    // Last 10 scores, reversed for oldest→newest left-to-right
    const chartScores = scores.slice(0, 10).reverse();

    const stats = [
        {
            title: 'Всего материалов',
            value: isLoading ? '—' : String(totalDrafts),
            diff: analyzedDrafts.length > 0 ? `${analyzedDrafts.length} проанализировано` : 'Загрузите первый',
            icon: FileText,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
        },
        {
            title: 'Средний балл',
            value: isLoading ? '—' : avgScore ? `${avgScore}` : '—',
            diff: avgScore
                ? Number(avgScore) >= 7 ? 'Отличный результат' : 'Есть куда расти'
                : 'Запустите анализ',
            icon: Target,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
        },
        {
            title: 'Проанализировано',
            value: isLoading ? '—' : String(analyzedDrafts.length),
            diff:
                totalDrafts > 0
                    ? `${Math.round((analyzedDrafts.length / totalDrafts) * 100)}% от всех`
                    : '—',
            icon: Activity,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
        },
        {
            title: 'AI Симуляций',
            value: '—',
            diff: 'Скоро появится',
            icon: BrainCircuit,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
        },
    ];

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-10 md:py-16 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-slate-100 mb-2 tracking-tight flex items-center gap-3">
                        <BarChart3 className="text-blue-500" />
                        Аналитика
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Прогресс ваших материалов по AI-анализу.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-5 relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={20} strokeWidth={1.5} />
                            </div>
                            <div className="text-[11px] font-mono text-[var(--text-muted)] text-right max-w-[120px] leading-snug">
                                {stat.diff}
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-syne font-bold text-slate-100 mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm text-slate-500">{stat.title}</div>
                        </div>
                        <div
                            className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full ${stat.bg} blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 min-h-[380px] flex flex-col"
                >
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-syne font-bold text-slate-200">
                                Динамика качества (AI Score)
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Overall Score последних {chartScores.length || '0'} анализов
                            </p>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <Activity size={24} className="animate-spin text-[var(--accent-blue)]" />
                        </div>
                    )}

                    {isError && (
                        <div className="flex-1 flex items-center justify-center gap-3 text-rose-400 text-sm font-mono">
                            <AlertCircle size={16} /> Ошибка загрузки
                        </div>
                    )}

                    {!isLoading && !isError && chartScores.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
                            <BarChart3 size={40} className="opacity-20" />
                            <p className="text-sm font-mono text-center">
                                Нет данных. Проанализируйте материал.
                            </p>
                            <Link href="/upload" className="btn-primary text-sm">
                                Загрузить материал
                            </Link>
                        </div>
                    )}

                    {!isLoading && !isError && chartScores.length > 0 && (
                        <div className="flex-1 relative w-full flex items-end justify-between gap-2 px-2 pb-6">
                            {chartScores.map((score, i) => {
                                const h = score * 10;
                                const color =
                                    score >= 8
                                        ? 'bg-emerald-500/80'
                                        : score >= 6
                                        ? 'bg-blue-500/80'
                                        : 'bg-slate-600/80';
                                return (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center gap-2 flex-1 group"
                                    >
                                        <div className="font-mono text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {score}
                                        </div>
                                        <div className="w-full bg-[var(--bg-surface-alt)] rounded-t-sm flex justify-end flex-col overflow-hidden h-40">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ delay: 0.5 + i * 0.06, type: 'spring' }}
                                                className={`w-full rounded-t-sm relative group-hover:brightness-125 transition-all ${color}`}
                                            >
                                                <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
                                            </motion.div>
                                        </div>
                                        <span className="text-[9px] text-slate-500 font-mono hidden sm:block">
                                            #{i + 1}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Latest Feedback */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 flex flex-col"
                >
                    <div className="mb-6">
                        <h3 className="text-lg font-syne font-bold text-slate-200">
                            Последний разбор
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                            {lastAnalyzed ? lastAnalyzed.title : 'Нет данных'}
                        </p>
                    </div>

                    {!lastAnalyzed && !isLoading && (
                        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm font-mono text-center px-4">
                            Проанализируйте материал — здесь появится разбор
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex-1 flex items-center justify-center">
                            <Activity size={20} className="animate-spin text-[var(--text-muted)]" />
                        </div>
                    )}

                    {lastAnalyzed && lastAnalyzed.analysis_result && (
                        <div className="flex-1 flex flex-col gap-4">
                            {(
                                [
                                    { key: 'logic' as const, label: 'Логика' },
                                    { key: 'clarity' as const, label: 'Ясность' },
                                    { key: 'style' as const, label: 'Стиль' },
                                    { key: 'grammar' as const, label: 'Грамматика' },
                                ] as const
                            ).map(({ key, label }) => (
                                <div key={key}>
                                    <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">
                                        {label}
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                        {lastAnalyzed.analysis_result!.feedback_json[key]}
                                    </p>
                                </div>
                            ))}

                            <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
                                <Zap size={14} className="text-blue-400 shrink-0" />
                                <div className="text-xs text-blue-200">
                                    AI Score:{' '}
                                    <span className="font-bold text-white">
                                        {lastAnalyzed.analysis_result.feedback_json.overall_score}/10
                                    </span>
                                </div>
                                <TrendingUp size={12} className="text-emerald-400 ml-auto" />
                            </div>

                            <Link
                                href={`/analysis/${lastAnalyzed.id}`}
                                className="text-xs text-[var(--accent-blue)] hover:underline font-mono flex items-center gap-1"
                            >
                                Открыть полный разбор →
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
