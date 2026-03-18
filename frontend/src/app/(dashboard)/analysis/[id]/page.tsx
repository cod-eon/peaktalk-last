"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    FileText,
    Zap,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    BarChart2,
    MessageSquare,
    Lightbulb,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';

type AnalysisFeedback = {
    logic: string;
    style: string;
    clarity: string;
    grammar: string;
    overall_score: number;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
};

type Draft = {
    id: string;
    title: string;
    content: string;
    created_at: string;
    analysis_result: {
        id: string;
        feedback_json: AnalysisFeedback;
        created_at: string;
    } | null;
    document_id: string | null;
};

function ScoreRing({ score }: { score: number }) {
    const size = 80;
    const stroke = 5;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 10) * circ;
    const color = score >= 7 ? '#10b981' : score >= 5 ? '#fbbf24' : '#ef4444';

    return (
        <div className="relative w-20 h-20 shrink-0">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-main)" strokeWidth={stroke} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-syne text-[20px] font-bold leading-none" style={{ color }}>{score}</span>
                <span className="text-[9px] font-mono text-[var(--text-dim)] mt-0.5">/10</span>
            </div>
        </div>
    );
}

function CategoryCard({ label, text }: { label: string; text: string }) {
    return (
        <div className="p-4 bg-[var(--bg-surface-alt)] rounded-[var(--radius-md)] border border-[var(--border-main)]">
            <span className="label-kicker mb-2 block">{label}</span>
            <p className="text-[13px] text-[var(--text-muted)] font-inter leading-relaxed">{text}</p>
        </div>
    );
}

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const draftId = params.id as string;

    const { data: draft, isLoading, isError } = useQuery<Draft>({
        queryKey: ['draft', draftId],
        queryFn: () => api.get(`/drafts/${draftId}`),
        enabled: !!draftId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-6 h-6 border-2 border-[var(--border-light)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !draft) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle size={32} className="text-red-400" strokeWidth={1.5} />
                <p className="text-[14px] text-[var(--text-muted)] font-inter">Материал не найден</p>
                <Link href="/dashboard" className="btn-secondary text-sm gap-2">
                    <ArrowLeft size={14} /> На дашборд
                </Link>
            </div>
        );
    }

    const analysis = draft.analysis_result;
    const fb = analysis?.feedback_json;

    return (
        <div className="w-full max-w-4xl mx-auto px-5 py-8 lg:px-8 pb-16 md:pb-10">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors mb-6 group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[12px] font-inter">Назад</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText size={18} className="text-[var(--text-dim)]" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <p className="label-kicker mb-1">Разбор материала</p>
                        <h1 className="font-syne text-[20px] sm:text-[24px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
                            {draft.title}
                        </h1>
                        <p className="text-[11px] text-[var(--text-dim)] mt-1 font-mono">
                            {format(new Date(draft.created_at), 'd MMMM yyyy', { locale: ru })}
                        </p>
                    </div>
                </div>
                {analysis && (
                    <Link href={`/simulation?draft=${draftId}`} className="btn-primary flex-shrink-0 gap-2 self-start">
                        <Zap size={14} /> Симуляция
                    </Link>
                )}
            </div>

            {!analysis && (
                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-8 text-center">
                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center mx-auto mb-4">
                        <BarChart2 size={20} className="text-[var(--text-dim)]" strokeWidth={1.5} />
                    </div>
                    <h2 className="font-syne text-[16px] font-semibold text-[var(--text-main)] mb-2">Анализ ещё не запущен</h2>
                    <p className="text-[13px] text-[var(--text-muted)] font-inter mb-5 max-w-sm mx-auto">
                        AI разберёт структуру, логику и стиль вашего текста
                    </p>
                    <button className="btn-primary gap-2"><Zap size={14} /> Запустить анализ</button>
                </div>
            )}

            {analysis && fb && (
                <div className="flex flex-col gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="relative bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/25 to-transparent" />
                        <div className="flex items-center gap-5">
                            <ScoreRing score={fb.overall_score} />
                            <div>
                                <h2 className="font-syne text-[16px] font-semibold text-[var(--text-main)] tracking-tight">AI Score</h2>
                                <p className="text-[12px] text-[var(--text-dim)] font-inter mt-1 max-w-xs">
                                    {fb.overall_score >= 8 ? 'Отличная работа — материал готов к выступлению'
                                        : fb.overall_score >= 6 ? 'Хорошая основа, есть точки роста'
                                        : fb.overall_score >= 4 ? 'Требуется доработка перед выступлением'
                                        : 'Материал нуждается в существенной переработке'}
                                </p>
                                <p className="text-[10px] text-[var(--text-dim)] font-mono mt-2">
                                    {format(new Date(analysis.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.08 }}
                        className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare size={15} className="text-[var(--accent-primary)]" />
                            <h2 className="font-syne text-[15px] font-semibold text-[var(--text-main)] tracking-tight">Разбор по критериям</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <CategoryCard label="Логика" text={fb.logic} />
                            <CategoryCard label="Ясность" text={fb.clarity} />
                            <CategoryCard label="Стиль" text={fb.style} />
                            <CategoryCard label="Грамматика" text={fb.grammar} />
                        </div>
                    </motion.div>

                    {(fb.strengths?.length || fb.weaknesses?.length) ? (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.16 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                            {fb.strengths?.length ? (
                                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                        <span className="label-kicker" style={{ color: 'rgba(52,211,153,0.7)' }}>Сильные стороны</span>
                                    </div>
                                    <ul className="flex flex-col gap-2.5">
                                        {fb.strengths.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-emerald-400 mt-[7px] shrink-0" />
                                                <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">{s}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                            {fb.weaknesses?.length ? (
                                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle size={14} className="text-[var(--color-warning)]" />
                                        <span className="label-kicker" style={{ color: 'rgba(251,191,36,0.7)' }}>Зоны роста</span>
                                    </div>
                                    <ul className="flex flex-col gap-2.5">
                                        {fb.weaknesses.map((w, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-[var(--color-warning)] mt-[7px] shrink-0" />
                                                <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">{w}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </motion.div>
                    ) : null}

                    {fb.recommendations?.length ? (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.22 }}
                            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Lightbulb size={15} className="text-[var(--color-ai)]" />
                                <h2 className="font-syne text-[15px] font-semibold text-[var(--text-main)] tracking-tight">Рекомендации AI</h2>
                            </div>
                            <ol className="flex flex-col gap-3">
                                {fb.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-[var(--radius-sm)] bg-[var(--color-ai-bg)] border border-[var(--color-ai-glow)] flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-[9px] font-mono font-bold" style={{ color: 'var(--color-ai)' }}>{i + 1}</span>
                                        </span>
                                        <p className="text-[13px] text-[var(--text-muted)] font-inter leading-relaxed">{rec}</p>
                                    </li>
                                ))}
                            </ol>
                        </motion.div>
                    ) : null}

                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.28 }}
                        className="relative bg-[var(--bg-card)] border border-[var(--accent-primary-glow)] rounded-[var(--radius-lg)] p-5 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1">
                                <h3 className="font-syne text-[15px] font-semibold text-[var(--text-main)] tracking-tight">Готовы к стресс-тесту?</h3>
                                <p className="text-[12px] text-[var(--text-dim)] font-inter mt-1">AI-собеседник задаст жёсткие вопросы по вашему материалу</p>
                            </div>
                            <Link href={`/simulation?draft=${draftId}`} className="btn-primary gap-2 shrink-0">
                                <Zap size={14} /> Начать симуляцию <ChevronRight size={13} />
                            </Link>
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-5 pt-1">
                        <Link href="/analytics" className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors">
                            <TrendingUp size={13} /><span className="text-[12px] font-inter">Аналитика</span>
                        </Link>
                        <Link href="/documents" className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors">
                            <FileText size={13} /><span className="text-[12px] font-inter">Все документы</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
