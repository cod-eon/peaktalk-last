"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, Zap, TrendingUp, AlertCircle, CheckCircle2,
    ChevronRight, BarChart2, MessageSquare, Lightbulb, Code2, Sparkles, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

type IssueType = 'logic' | 'style' | 'clarity' | 'grammar';
type Severity = 'high' | 'medium' | 'low';
type CategoryKey = IssueType;

type Annotation = {
    text: string;
    issue_type: IssueType;
    comment: string;
    severity: Severity;
};

type AnalysisFeedback = {
    logic: string;
    style: string;
    clarity: string;
    grammar: string;
    overall_score: number;
    annotations?: Annotation[];
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
};

type Draft = {
    id: string;
    title: string;
    raw_text: string;
    content?: string;
    created_at: string;
    analysis_result: {
        id: string;
        improved_text: string;
        feedback_json: AnalysisFeedback;
        created_at: string;
    } | null;
    document_id: string | null;
};

// ── Color system ──────────────────────────────────────────────────────────────

const ISSUE_COLORS: Record<IssueType, { bg: string; border: string; label: string; pill: string }> = {
    logic:   { bg: 'rgba(59,130,246,0.14)',  border: 'rgba(59,130,246,0.5)',  label: 'Логика',     pill: '#3b82f6' },
    clarity: { bg: 'rgba(139,92,246,0.14)',  border: 'rgba(139,92,246,0.5)', label: 'Ясность',    pill: '#8b5cf6' },
    style:   { bg: 'rgba(251,191,36,0.14)',  border: 'rgba(251,191,36,0.5)',  label: 'Стиль',      pill: '#fbbf24' },
    grammar: { bg: 'rgba(239,68,68,0.14)',   border: 'rgba(239,68,68,0.5)',   label: 'Грамматика', pill: '#ef4444' },
};

const SEVERITY_OPACITY: Record<Severity, number> = { high: 1, medium: 0.75, low: 0.5 };

// ── Text segmentation ─────────────────────────────────────────────────────────

type Segment = { text: string; annotation?: Annotation; index?: number };

function buildSegments(text: string, annotations: Annotation[]): Segment[] {
    const intervals: Array<{ start: number; end: number; annotation: Annotation; index: number }> = [];

    annotations.forEach((ann, i) => {
        const idx = text.indexOf(ann.text);
        if (idx !== -1) {
            intervals.push({ start: idx, end: idx + ann.text.length, annotation: ann, index: i });
        }
    });

    intervals.sort((a, b) => a.start - b.start);

    const segments: Segment[] = [];
    let cursor = 0;

    for (const { start, end, annotation, index } of intervals) {
        if (start < cursor) continue; // skip overlaps
        if (start > cursor) segments.push({ text: text.slice(cursor, start) });
        segments.push({ text: text.slice(start, end), annotation, index });
        cursor = end;
    }

    if (cursor < text.length) segments.push({ text: text.slice(cursor) });

    return segments;
}

// ── HighlightedText ───────────────────────────────────────────────────────────

function HighlightedText({
    text, annotations, activeCategory, activeAnnotationIdx, onAnnotationClick,
}: {
    text: string;
    annotations: Annotation[];
    activeCategory: CategoryKey | null;
    activeAnnotationIdx: number | null;
    onAnnotationClick: (ann: Annotation, idx: number) => void;
}) {
    const segments = useMemo(() => buildSegments(text, annotations), [text, annotations]);

    return (
        <div className="font-inter text-[13px] leading-[1.9] text-[var(--text-muted)] whitespace-pre-wrap break-words">
            {segments.map((seg, i) => {
                if (!seg.annotation) return <span key={i}>{seg.text}</span>;

                const ann = seg.annotation;
                const colors = ISSUE_COLORS[ann.issue_type];
                const opacity = SEVERITY_OPACITY[ann.severity];
                const isActive = activeAnnotationIdx === seg.index;
                const isDimmed = activeCategory !== null && activeCategory !== ann.issue_type;

                return (
                    <span
                        key={i}
                        onClick={() => onAnnotationClick(ann, seg.index!)}
                        style={{
                            backgroundColor: colors.bg,
                            borderBottom: `2px solid ${colors.border}`,
                            opacity: isDimmed ? 0.35 : opacity,
                            borderRadius: '2px',
                            cursor: 'pointer',
                            padding: '1px 1px 0',
                            transition: 'all 0.2s',
                            outline: isActive ? `2px solid ${colors.pill}` : 'none',
                            outlineOffset: '1px',
                        }}
                    >
                        {seg.text}
                    </span>
                );
            })}
        </div>
    );
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const draftId = params.id as string;

    const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
    const [activeAnnotation, setActiveAnnotation] = useState<{ ann: Annotation; idx: number } | null>(null);
    const [showImproved, setShowImproved] = useState(false);

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

    // ── Shared header ────────────────────────────────────────────────────────
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

    // ── Main layout ──────────────────────────────────────────────────────────
    const annotations = fb.annotations ?? [];
    const textContent = draft.raw_text || draft.content || '';

    const categories: Array<{ key: CategoryKey; label: string; text: string }> = [
        { key: 'logic',   label: 'Логика',     text: fb.logic },
        { key: 'clarity', label: 'Ясность',    text: fb.clarity },
        { key: 'style',   label: 'Стиль',      text: fb.style },
        { key: 'grammar', label: 'Грамматика', text: fb.grammar },
    ];

    const annCountByCategory = annotations.reduce<Record<string, number>>((acc, ann) => {
        acc[ann.issue_type] = (acc[ann.issue_type] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="w-full py-8 pb-16 md:pb-10">
            {pageHeader}

            <div className="w-full max-w-7xl mx-auto px-5 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="border border-[var(--border-main)] rounded-[var(--radius-lg)] overflow-hidden lg:grid lg:grid-cols-[55fr_45fr]"
                >
                    {/* ── Left Panel: text with highlights ── */}
                    <div className="border-b lg:border-b-0 lg:border-r border-[var(--border-main)] flex flex-col bg-[var(--bg-surface)]">

                        {/* Toolbar */}
                        <div className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-main)] px-4 py-2 flex items-center gap-2 min-h-[38px]">
                            <Code2 size={14} className="text-[var(--text-dim)] shrink-0" />
                            <span className="font-mono text-[11px] text-[var(--text-dim)] flex-1 truncate">{draft.title}</span>

                            {/* Original / AI toggle */}
                            <div className="flex items-center bg-[var(--bg-main)] rounded-[var(--radius-sm)] border border-[var(--border-main)] p-0.5 shrink-0">
                                <button
                                    onClick={() => setShowImproved(false)}
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-[3px] transition-colors ${!showImproved ? 'bg-[var(--bg-surface)] text-[var(--text-main)]' : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'}`}
                                >
                                    Оригинал
                                </button>
                                <button
                                    onClick={() => setShowImproved(true)}
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-[3px] transition-colors flex items-center gap-1 ${showImproved ? 'bg-[var(--color-ai-bg)] text-[var(--color-ai)]' : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'}`}
                                >
                                    <Sparkles size={9} /> AI версия
                                </button>
                            </div>
                        </div>

                        {/* Annotation legend (original mode only) */}
                        {!showImproved && annotations.length > 0 && (
                            <div className="border-b border-[var(--border-main)] px-4 py-1.5 flex items-center gap-3 flex-wrap bg-[var(--bg-surface)]">
                                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-dim)] mr-1">Проблемы:</span>
                                {(['logic', 'clarity', 'style', 'grammar'] as IssueType[]).map(type => {
                                    const count = annCountByCategory[type] ?? 0;
                                    if (!count) return null;
                                    const colors = ISSUE_COLORS[type];
                                    const isActive = activeCategory === type;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setActiveCategory(prev => prev === type ? null : type)}
                                            className="flex items-center gap-1 transition-opacity"
                                            style={{ opacity: activeCategory && !isActive ? 0.4 : 1 }}
                                        >
                                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors.pill, opacity: 0.8 }} />
                                            <span className="text-[10px] font-mono" style={{ color: isActive ? colors.pill : 'var(--text-dim)' }}>
                                                {colors.label}
                                            </span>
                                            <span
                                                className="text-[9px] font-mono w-4 h-4 flex items-center justify-center rounded-full"
                                                style={{ backgroundColor: `${colors.pill}20`, color: colors.pill }}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                                {activeCategory && (
                                    <button
                                        onClick={() => { setActiveCategory(null); setActiveAnnotation(null); }}
                                        className="ml-auto text-[9px] font-mono text-[var(--text-dim)] flex items-center gap-0.5 hover:text-[var(--text-muted)] transition-colors"
                                    >
                                        <X size={9} /> сбросить
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Text body */}
                        <div className="overflow-y-auto max-h-[72vh] min-h-[300px] p-5">
                            {showImproved ? (
                                <div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-ai)] mb-3 opacity-70">
                                        <Sparkles size={10} />
                                        <span>AI улучшенная версия — структура, аргументы и ясность переработаны</span>
                                    </div>
                                    <p className="font-inter text-[13px] leading-[1.9] text-[var(--text-muted)] whitespace-pre-wrap break-words">
                                        {analysis.improved_text}
                                    </p>
                                </div>
                            ) : textContent ? (
                                <HighlightedText
                                    text={textContent}
                                    annotations={annotations}
                                    activeCategory={activeCategory}
                                    activeAnnotationIdx={activeAnnotation?.idx ?? null}
                                    onAnnotationClick={(ann, idx) => {
                                        setActiveAnnotation(prev => prev?.idx === idx ? null : { ann, idx });
                                        setActiveCategory(ann.issue_type);
                                    }}
                                />
                            ) : (
                                <p className="text-[var(--text-dim)] italic text-sm">Текст недоступен</p>
                            )}
                        </div>
                    </div>

                    {/* ── Right Panel: analysis ── */}
                    <div className="flex flex-col bg-[var(--bg-card)]">

                        {/* Score header */}
                        <div className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-main)] px-4 py-2.5 flex items-center gap-3 min-h-[38px]">
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
                            <p className="ml-auto text-[9px] text-[var(--text-dim)] font-mono hidden sm:block shrink-0">
                                {format(new Date(analysis.created_at), 'd MMM yyyy', { locale: ru })}
                            </p>
                        </div>

                        <div className="overflow-y-auto max-h-[72vh] bg-[var(--bg-card)] p-4 space-y-4">

                            {/* Active annotation callout */}
                            <AnimatePresence>
                                {activeAnnotation && (
                                    <motion.div
                                        key="ann-callout"
                                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                        transition={{ duration: 0.18 }}
                                        className="rounded-[var(--radius-md)] border p-3.5 relative"
                                        style={{
                                            backgroundColor: ISSUE_COLORS[activeAnnotation.ann.issue_type].bg,
                                            borderColor: `${ISSUE_COLORS[activeAnnotation.ann.issue_type].pill}35`,
                                        }}
                                    >
                                        <button
                                            onClick={() => setActiveAnnotation(null)}
                                            className="absolute top-2.5 right-2.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ISSUE_COLORS[activeAnnotation.ann.issue_type].pill }} />
                                            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: ISSUE_COLORS[activeAnnotation.ann.issue_type].pill }}>
                                                {ISSUE_COLORS[activeAnnotation.ann.issue_type].label}
                                                {' · '}
                                                {activeAnnotation.ann.severity === 'high' ? 'Критично' : activeAnnotation.ann.severity === 'medium' ? 'Важно' : 'Незначительно'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[var(--text-dim)] font-mono italic mb-2.5 leading-relaxed line-clamp-2">
                                            «{activeAnnotation.ann.text}»
                                        </p>
                                        <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">
                                            {activeAnnotation.ann.comment}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Hint when no annotation selected */}
                            {!activeAnnotation && annotations.length > 0 && !showImproved && (
                                <p className="text-[10px] text-[var(--text-dim)] font-inter text-center py-1">
                                    Кликни на подсвеченный фрагмент в тексте — увидишь комментарий AI
                                </p>
                            )}

                            {/* Category pills + content */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <MessageSquare size={14} className="text-[var(--accent-primary)]" />
                                    <h2 className="font-syne text-[13px] font-semibold text-[var(--text-main)] tracking-tight">Разбор по критериям</h2>
                                </div>

                                {/* Pills */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {categories.map(({ key, label }) => {
                                        const colors = ISSUE_COLORS[key];
                                        const count = annCountByCategory[key] ?? 0;
                                        const isActive = activeCategory === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setActiveCategory(prev => prev === key ? null : key);
                                                    if (activeAnnotation?.ann.issue_type !== key) setActiveAnnotation(null);
                                                }}
                                                className="text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5"
                                                style={{
                                                    backgroundColor: isActive ? `${colors.pill}18` : 'var(--bg-surface-alt)',
                                                    borderColor: isActive ? colors.pill : 'var(--border-main)',
                                                    color: isActive ? colors.pill : 'var(--text-dim)',
                                                }}
                                            >
                                                {label}
                                                {count > 0 && (
                                                    <span
                                                        className="text-[9px] w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold"
                                                        style={{
                                                            backgroundColor: isActive ? colors.pill : `${colors.pill}20`,
                                                            color: isActive ? 'white' : colors.pill,
                                                        }}
                                                    >
                                                        {count}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Category cards */}
                                <div className="flex flex-col gap-2">
                                    {categories.map(({ key, label, text }) => (
                                        <div
                                            key={key}
                                            className="p-3.5 rounded-[var(--radius-md)] border transition-all cursor-pointer"
                                            style={{
                                                backgroundColor: activeCategory === key ? `${ISSUE_COLORS[key].pill}0e` : 'var(--bg-surface-alt)',
                                                borderColor: activeCategory === key ? `${ISSUE_COLORS[key].pill}35` : 'var(--border-main)',
                                                opacity: activeCategory !== null && activeCategory !== key ? 0.45 : 1,
                                            }}
                                            onClick={() => setActiveCategory(prev => prev === key ? null : key)}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ISSUE_COLORS[key].pill }} />
                                                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: ISSUE_COLORS[key].pill }}>
                                                    {label}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">{text}</p>
                                        </div>
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
