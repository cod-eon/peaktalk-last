"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    UploadCloud,
    ArrowRight,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { api } from '@/lib/api';

type Draft = {
    id: string;
    title: string;
    created_at: string;
    analysis_result: {
        feedback_json: { overall_score: number };
    } | null;
};

type DraftsResponse = {
    items: Draft[];
    total: number;
};

export default function ProjectsPage() {
    const { data, isLoading, isError } = useQuery<DraftsResponse>({
        queryKey: ['drafts-projects'],
        queryFn: () => api.get('/drafts?limit=50'),
        staleTime: 30_000,
    });

    const drafts = data?.items ?? [];

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-10 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-slate-100 mb-2 tracking-tight">
                        Мои материалы
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Все загруженные черновики и результаты AI-анализа.
                    </p>
                </div>
                <Link href="/upload" className="btn-primary flex items-center gap-2 px-5 py-2 w-fit">
                    <UploadCloud size={16} /> Загрузить
                </Link>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-24">
                    <Activity size={28} className="animate-spin text-[var(--accent-blue)]" />
                </div>
            )}

            {isError && (
                <div className="flex items-center justify-center gap-3 py-24 text-rose-400 font-mono text-sm">
                    <AlertCircle size={18} /> Ошибка загрузки данных
                </div>
            )}

            {!isLoading && !isError && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* New material card */}
                    <Link
                        href="/upload"
                        className="group border border-dashed border-[var(--border-light)] hover:border-blue-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-[var(--bg-surface-alt)] hover:bg-blue-500/5 transition-all min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors mb-4">
                            <UploadCloud size={20} />
                        </div>
                        <h3 className="text-slate-200 font-medium mb-1 group-hover:text-blue-400 transition-colors">
                            Новый материал
                        </h3>
                        <p className="text-slate-500 text-xs">Загрузите PDF, DOCX или TXT</p>
                    </Link>

                    {drafts.map((draft, i) => {
                        const score = draft.analysis_result?.feedback_json.overall_score ?? null;
                        const analyzed = draft.analysis_result !== null;
                        const dateStr = formatDistanceToNow(new Date(draft.created_at), {
                            addSuffix: true,
                            locale: ru,
                        });

                        return (
                            <motion.div
                                key={draft.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="h-full"
                            >
                                <Link
                                    href={`/analysis/${draft.id}`}
                                    className="group block bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--border-light)] rounded-2xl p-6 transition-all flex flex-col min-h-[200px] h-full relative overflow-hidden"
                                >
                                    {/* Glow on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-blue)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                    {/* Status badge */}
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        {analyzed ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                                                <CheckCircle2 size={10} /> Проанализирован
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-light)] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                                                <Clock size={10} /> Загружен
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-base font-syne font-semibold text-slate-200 mb-2 mt-auto group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2 relative z-10">
                                        {draft.title}
                                    </h3>

                                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 mb-4 mt-1 relative z-10">
                                        <Clock size={11} className="opacity-70" />
                                        {dateStr}
                                    </div>

                                    {/* Score row */}
                                    <div className="pt-4 border-t border-[var(--border-light)] flex justify-between items-center mt-auto relative z-10">
                                        {score !== null ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400 font-mono">
                                                    AI Score
                                                </span>
                                                <span
                                                    className={`font-mono text-sm font-bold ${
                                                        score >= 8
                                                            ? 'text-emerald-400'
                                                            : score >= 6
                                                            ? 'text-blue-400'
                                                            : 'text-yellow-400'
                                                    }`}
                                                >
                                                    {score}/10
                                                </span>
                                                {score >= 7 ? (
                                                    <TrendingUp size={12} className="text-emerald-500" />
                                                ) : score >= 5 ? (
                                                    <Minus size={12} className="text-slate-500" />
                                                ) : (
                                                    <TrendingDown size={12} className="text-yellow-500" />
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500 font-mono">
                                                Анализ не запущен
                                            </span>
                                        )}

                                        <div className="opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--accent-blue)] bg-[var(--accent-blue)]/10 p-1.5 rounded-full">
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}

                    {drafts.length === 0 && (
                        <div className="sm:col-span-2 lg:col-span-2 flex flex-col items-center justify-center py-16 gap-4 text-[var(--text-muted)]">
                            <p className="font-mono text-sm">Нет материалов — загрузите первый!</p>
                            <Link href="/upload" className="btn-primary text-sm">
                                <UploadCloud size={14} className="mr-2" />
                                Загрузить материал
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
