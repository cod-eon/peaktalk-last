"use client";

import React, { useState } from 'react';
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
    Code2,
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
    raw_text?: string;
    created_at: string;
    analysis_result: {
        id: string;
        feedback_json: AnalysisFeedback;
        created_at: string;
    } | null;
    document_id: string | null;
};

type CategoryKey = 'logic' | 'clarity' | 'style' | 'grammar';

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
    const stroke = 5;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 10) * circ;
    const color = score >= 7 ? '#10b981' : score >= 5 ? '#fbbf24' : '#ef4444';
    const fontSize = size <= 48 ? 14 : 20;

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
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
                <span className="font-syne font-bold leading-none" style={{ color, fontSize }}>{score}</span>
                <span className="text-[8px] font-mono text-[var(--text-dim)] mt-0.5">/10</span>
            </div>
        </div>
    );
}

function CategoryCard({ label, text, onClick, compact }: { label: string; text: string; onClick?: () => void; compact?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`text-left w-full p-4 bg-[var(--bg-surface-alt)] rounded-[var(--radius-md)] border border-[var(--border-main)] transition-colors hover:border-[var(--accent-primary)]/40 ${compact ? 'opacity-60' : ''}`}
        >
            <span className="label-kicker mb-2 block">{label}</span>
            {!compact && <p className="text-[13px] text-[var(--text-muted)] font-inter leading-relaxed">{text}</p>}
            {compact && <p className="text-[11px] text-[var(--text-dim)] font-inter leading-relaxed line-clamp-1">{text}</p>}
        </button>
    );
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
    logic: 'Логика',
    clarity: 'Ясность',
    style: 'Стиль',
    grammar: 'Грамматика',
};

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const draftId = params.id as string;
    const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);

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

    // ── Header (shared for both states) ─────────────────────────────────────
    const pageHeader = (
        <div className="w-full max-w-7xl mx-auto px-5 lg:px-8">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors mb-6 group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[12px] font-inter">Назад</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
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
        </div>
    );

    // ── No analysis state ────────────────────────────────────────────────────
    if (!analysis || !fb) {
        return (
            <div className="w-full py-8 pb-16 md:pb-10">
                {pageHeader}
                <div className="w-full max-w-7xl mx-auto px-5 lg:px-8">
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
                </div>
            </div>
        );
    }

    // ── IDE-like split layout ────────────────────────────────────────────────
    const textContent = draft.content || draft.raw_text || '';
    const lines = textContent.split('\n');

    const categories: Array<{ key: CategoryKey; label: string; text: string }> = [
        { key: 'logic', label: 'Логика', text: fb.logic },
        { key: 'clarity', label: 'Ясность', text: fb.clarity },
        { key: 'style', label: 'Стиль', text: fb.style },
        { key: 'grammar', label: 'Грамматика', text: fb.grammar },
    ];

    return (
        <div className="w-full py-8 pb-16 md:pb-10">
            {pageHeader}

            {/* IDE split layout */}
            <div className="w-full max-w-7xl mx-auto px-5 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="border border-[var(--border-main)] rounded-[var(--radius-lg)] overflow-hidden lg:grid lg:grid-cols-[55fr_45fr] lg:gap-0"
                >
                    {/* ── Left Panel: Editor (text) ── */}
                    <div className="border-b lg:border-b-0 lg:border-r border-[var(--border-main)] flex flex-col bg-[var(--bg-surface)]">
                        {/* Panel header */}
                        <div className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-main)] px-4 py-2.5 flex items-center gap-2">
                            <Code2 size={14} className="text-[var(--text-dim)] shrink-0" />
                            <span className="font-mono text-[11px] text-[var(--text-dim)] flex-1 truncate">{draft.title}</span>
                            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/20 shrink-0">
                                Проанализировано
                            </span>
                        </div>

                        {/* Panel body */}
                        <div className="overflow-y-auto max-h-[75vh] min-h-[300px] py-3">
                            {textContent ? (
                                lines.map((line, idx) => {
                                    if (line.trim() === '') {
                                        return <div key={idx} className="h-4" />;
                                    }
                                    return (
                                        <div key={idx} className="flex text-[12px] leading-6 font-mono group px-0">
                                            <span className="w-10 text-right pr-4 text-[var(--text-dim)] shrink-0 select-none group-hover:text-[var(--text-muted)]">
                                                {idx + 1}
                                            </span>
                                            <span className="text-[var(--text-muted)] break-words flex-1 pr-4">{line}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-[var(--text-dim)] italic text-sm p-6">Текст недоступен</p>
                            )}
                        </div>
                    </div>

                    {/* ── Right Panel: Analysis ── */}
                    <div className="flex flex-col bg-[var(--bg-card)]">
                        {/* Panel header with ScoreRing */}
                        <div className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-main)] px-4 py-2.5 flex items-center gap-3">
                            <ScoreRing score={fb.overall_score} size={48} />
                            <div>
                                <p className="font-syne text-[13px] font-semibold text-[var(--text-main)]">AI Score</p>
                                <p className="text-[10px] text-[var(--text-dim)] font-inter leading-tight">
                                    {fb.overall_score >= 8 ? 'Материал готов к выступлению'
                                        : fb.overall_score >= 6 ? 'Хорошая основа, есть точки роста'
                                        : fb.overall_score >= 4 ? 'Требуется доработка'
                                        : 'Необходима существенная переработка'}
                                </p>
                            </div>
                            <p className="ml-auto text-[9px] text-[var(--text-dim)] font-mono hidden sm:block">
                                {format(new Date(analysis.created_at), 'd MMM yyyy', { locale: ru })}
                            </p>
                        </div>

                        {/* Panel body */}
                        <div className="overflow-y-auto max-h-[75vh] bg-[var(--bg-card)] p-4 space-y-4">

                            {/* Category tabs + content */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <MessageSquare size={14} className="text-[var(--accent-primary)]" />
                                    <h2 className="font-syne text-[13px] font-semibold text-[var(--text-main)] tracking-tight">Разбор по критериям</h2>
                                </div>

                                {/* Category pills */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {categories.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveCategory(prev => prev === key ? null : key)}
                                            className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-colors ${
                                                activeCategory === key
                                                    ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                                    : 'bg-[var(--bg-surface-alt)] text-[var(--text-dim)] border-[var(--border-main)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-muted)]'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Category cards */}
                                <div className="flex flex-col gap-2">
                                    {categories.map(({ key, label, text }) => (
                                        <CategoryCard
                                            key={key}
                                            label={label}
                                            text={text}
                                            compact={activeCategory !== null && activeCategory !== key}
                                            onClick={() => setActiveCategory(prev => prev === key ? null : key)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Strengths & Weaknesses */}
                            {(fb.strengths?.length || fb.weaknesses?.length) ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {fb.strengths?.length ? (
                                        <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-[var(--radius-md)] p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle2 size={13} className="text-emerald-400" />
                                                <span className="label-kicker" style={{ color: 'rgba(52,211,153,0.7)' }}>Сильные стороны</span>
                                            </div>
                                            <ul className="flex flex-col gap-2">
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
                                        <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-[var(--radius-md)] p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <AlertCircle size={13} className="text-[var(--color-warning)]" />
                                                <span className="label-kicker" style={{ color: 'rgba(251,191,36,0.7)' }}>Зоны роста</span>
                                            </div>
                                            <ul className="flex flex-col gap-2">
                                                {fb.weaknesses.map((w, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-[var(--color-warning)] mt-[7px] shrink-0" />
                                                        <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">{w}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {/* Recommendations */}
                            {fb.recommendations?.length ? (
                                <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-[var(--radius-md)] p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lightbulb size={14} className="text-[var(--color-ai)]" />
                                        <h2 className="font-syne text-[13px] font-semibold text-[var(--text-main)] tracking-tight">Рекомендации AI</h2>
                                    </div>
                                    <ol className="flex flex-col gap-3">
                                        {fb.recommendations.map((rec, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-[var(--radius-sm)] bg-[var(--color-ai-bg)] border border-[var(--color-ai-glow)] flex items-center justify-center shrink-0 mt-0.5">
                                                    <span className="text-[9px] font-mono font-bold" style={{ color: 'var(--color-ai)' }}>{i + 1}</span>
                                                </span>
                                                <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">{rec}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ) : null}

                            {/* CTA */}
                            <div className="relative bg-[var(--bg-surface-alt)] border border-[var(--accent-primary-glow)] rounded-[var(--radius-md)] p-4 overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />
                                <h3 className="font-syne text-[13px] font-semibold text-[var(--text-main)] tracking-tight mb-1">Готовы к стресс-тесту?</h3>
                                <p className="text-[11px] text-[var(--text-dim)] font-inter mb-3">AI-собеседник задаст жёсткие вопросы по вашему материалу</p>
                                <Link href={`/simulation?draft=${draftId}`} className="btn-primary gap-2 text-sm w-full justify-center">
                                    <Zap size={13} /> Начать симуляцию <ChevronRight size={12} />
                                </Link>
                            </div>

                        </div>
                    </div>
                </motion.div>

                {/* Bottom nav links */}
                <div className="flex items-center gap-5 pt-5">
                    <Link href="/analytics" className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors">
                        <TrendingUp size={13} /><span className="text-[12px] font-inter">Аналитика</span>
                    </Link>
                    <Link href="/documents" className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors">
                        <FileText size={13} /><span className="text-[12px] font-inter">Все документы</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
