"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, FileText, Zap, TrendingUp, AlertCircle, CheckCircle2,
    ChevronRight, BarChart2, Lightbulb, Code2, Sparkles, Copy, Download,
    Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type IssueType = 'logic' | 'style' | 'clarity' | 'grammar';
type Severity = 'high' | 'medium' | 'low';
type RightTab = 'annotations' | 'criteria' | 'advice';

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

// ── Color system ───────────────────────────────────────────────────────────────

const ISSUE_COLORS: Record<IssueType, { bg: string; underline: string; label: string; pill: string; textColor: string }> = {
    logic:   { bg: 'rgba(59,130,246,0.13)',  underline: '#3b82f6', label: 'Логика',     pill: '#3b82f6', textColor: '#93c5fd' },
    clarity: { bg: 'rgba(139,92,246,0.13)',  underline: '#8b5cf6', label: 'Ясность',    pill: '#8b5cf6', textColor: '#c4b5fd' },
    style:   { bg: 'rgba(251,191,36,0.13)',  underline: '#fbbf24', label: 'Стиль',      pill: '#fbbf24', textColor: '#fde68a' },
    grammar: { bg: 'rgba(239,68,68,0.13)',   underline: '#ef4444', label: 'Грамматика', pill: '#ef4444', textColor: '#fca5a5' },
};

const SEVERITY_CONFIG: Record<Severity, { label: string; opacity: number }> = {
    high:   { label: 'Критично',      opacity: 1.0 },
    medium: { label: 'Важно',         opacity: 0.8 },
    low:    { label: 'Незначительно', opacity: 0.55 },
};

// ── Text segmentation ──────────────────────────────────────────────────────────

type Segment = { text: string; annotation?: Annotation; annIndex?: number };

function buildSegments(text: string, annotations: Annotation[]): Segment[] {
    const intervals: Array<{ start: number; end: number; annotation: Annotation; index: number }> = [];
    annotations.forEach((ann, i) => {
        const idx = text.indexOf(ann.text);
        if (idx !== -1) intervals.push({ start: idx, end: idx + ann.text.length, annotation: ann, index: i });
    });
    intervals.sort((a, b) => a.start - b.start);

    const segments: Segment[] = [];
    let cursor = 0;
    for (const { start, end, annotation, index } of intervals) {
        if (start < cursor) continue;
        if (start > cursor) segments.push({ text: text.slice(cursor, start) });
        segments.push({ text: text.slice(start, end), annotation, annIndex: index });
        cursor = end;
    }
    if (cursor < text.length) segments.push({ text: text.slice(cursor) });
    return segments;
}

// ── HighlightedText ────────────────────────────────────────────────────────────

function HighlightedText({
    text, annotations, activeCategory, activeAnnotationIdx, onAnnotationClick,
}: {
    text: string;
    annotations: Annotation[];
    activeCategory: IssueType | null;
    activeAnnotationIdx: number | null;
    onAnnotationClick: (idx: number) => void;
}) {
    const segments = useMemo(() => buildSegments(text, annotations), [text, annotations]);

    return (
        <div className="font-inter text-[14px] leading-[1.9] text-[var(--text-muted)] whitespace-pre-wrap break-words">
            {segments.map((seg, i) => {
                if (!seg.annotation || seg.annIndex === undefined) return <span key={i}>{seg.text}</span>;

                const ann = seg.annotation;
                const idx = seg.annIndex;
                const c = ISSUE_COLORS[ann.issue_type];
                const isActive = activeAnnotationIdx === idx;
                const isDimmed = activeCategory !== null && activeCategory !== ann.issue_type;

                return (
                    <span key={i} className="relative inline">
                        <span
                            onClick={() => onAnnotationClick(idx)}
                            style={{
                                backgroundColor: isActive ? `${c.pill}25` : c.bg,
                                borderBottom: `2px solid ${c.underline}`,
                                borderRadius: '2px 2px 0 0',
                                cursor: 'pointer',
                                padding: '1px 1px 0',
                                transition: 'all 0.15s',
                                opacity: isDimmed ? 0.28 : SEVERITY_CONFIG[ann.severity].opacity,
                                outline: isActive ? `2px solid ${c.pill}55` : 'none',
                                outlineOffset: '1px',
                            }}
                        >
                            {seg.text}
                        </span>
                        <sup
                            onClick={() => onAnnotationClick(idx)}
                            style={{
                                fontSize: '9px', color: c.pill, fontFamily: 'monospace',
                                fontWeight: 700, cursor: 'pointer', marginLeft: '1px',
                                opacity: isDimmed ? 0.28 : 1, lineHeight: 1,
                            }}
                        >
                            {idx + 1}
                        </sup>
                    </span>
                );
            })}
        </div>
    );
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
    const stroke = 5;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 10) * circ;
    const color = score >= 7 ? '#10b981' : score >= 5 ? '#fbbf24' : '#ef4444';

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-main)" strokeWidth={stroke} />
                <motion.circle
                    cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
                    strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-syne font-bold leading-none text-[15px]" style={{ color }}>{score}</span>
                <span className="text-[7px] font-mono text-[var(--text-dim)] mt-0.5">/10</span>
            </div>
        </div>
    );
}

// ── Save buttons ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handle = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handle}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)] hover:border-[var(--border-light)] transition-all text-[11px] font-mono cursor-pointer"
        >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            {copied ? 'Скопировано!' : 'Скопировать'}
        </button>
    );
}

function DownloadButton({ text, title }: { text: string; title: string }) {
    const handle = () => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.slice(0, 40).replace(/[^а-яёa-z0-9]/gi, '_')}_AI.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };
    return (
        <button
            onClick={handle}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--color-ai)] hover:border-[var(--color-ai)]/40 transition-all text-[11px] font-mono cursor-pointer"
        >
            <Download size={11} /> Скачать .txt
        </button>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const draftId = params.id as string;

    const [showImproved, setShowImproved] = useState(false);
    const [activeCategory, setActiveCategory] = useState<IssueType | null>(null);
    const [activeAnnotationIdx, setActiveAnnotationIdx] = useState<number | null>(null);
    const [rightTab, setRightTab] = useState<RightTab>('annotations');

    const { data: draft, isLoading, isError } = useQuery<Draft>({
        queryKey: ['draft', draftId],
        queryFn: () => api.get(`/drafts/${draftId}`),
        enabled: !!draftId,
    });

    const handleAnnotationClick = useCallback((idx: number) => {
        setActiveAnnotationIdx(prev => prev === idx ? null : idx);
        setRightTab('annotations');
    }, []);

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

    // ── Header ───────────────────────────────────────────────────────────────
    const pageHeader = (
        <div className="w-full max-w-7xl mx-auto px-5 lg:px-8">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors mb-5 group cursor-pointer"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[12px] font-inter">Назад</span>
            </button>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText size={16} className="text-[var(--text-dim)]" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                        <p className="label-kicker mb-0.5">Разбор материала</p>
                        <h1 className="font-syne text-[18px] sm:text-[22px] font-bold text-[var(--text-main)] tracking-tight leading-tight truncate">
                            {draft.title}
                        </h1>
                    </div>
                </div>
                {analysis && (
                    <Link href={`/simulation?draft=${draftId}`} className="btn-primary flex-shrink-0 gap-2 self-start">
                        <Zap size={13} /> Симуляция
                    </Link>
                )}
            </div>
        </div>
    );

    if (!analysis || !fb) {
        return (
            <div className="w-full py-8 pb-16 md:pb-10">
                {pageHeader}
                <div className="w-full max-w-7xl mx-auto px-5 lg:px-8">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-8 text-center">
                        <BarChart2 size={24} className="text-[var(--text-dim)] mx-auto mb-4" strokeWidth={1.5} />
                        <h2 className="font-syne text-[16px] font-semibold text-[var(--text-main)] mb-2">Анализ ещё не запущен</h2>
                        <p className="text-[13px] text-[var(--text-muted)] font-inter mb-5 max-w-sm mx-auto">
                            AI разберёт структуру, логику и стиль вашего текста
                        </p>
                        <button className="btn-primary gap-2 cursor-pointer"><Zap size={14} /> Запустить анализ</button>
                    </div>
                </div>
            </div>
        );
    }

    const annotations = fb.annotations ?? [];
    const textContent = draft.raw_text || draft.content || '';
    const annCountByCategory = annotations.reduce<Record<string, number>>((acc, ann) => {
        acc[ann.issue_type] = (acc[ann.issue_type] ?? 0) + 1;
        return acc;
    }, {});

    const categories: Array<{ key: IssueType; label: string; text: string }> = [
        { key: 'logic',   label: 'Логика',     text: fb.logic },
        { key: 'clarity', label: 'Ясность',    text: fb.clarity },
        { key: 'style',   label: 'Стиль',      text: fb.style },
        { key: 'grammar', label: 'Грамматика', text: fb.grammar },
    ];

    const rightTabs: Array<{ id: RightTab; label: string; badge?: number }> = [
        { id: 'annotations', label: 'Проблемы', badge: annotations.length },
        { id: 'criteria',    label: 'Критерии' },
        { id: 'advice',      label: 'Советы' },
    ];

    return (
        <div className="w-full py-7 pb-16 md:pb-10">
            {pageHeader}

            <div className="w-full max-w-7xl mx-auto px-5 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border border-[var(--border-main)] rounded-[var(--radius-lg)] overflow-hidden lg:grid lg:grid-cols-[55fr_45fr]"
                >
                    {/* ═══ LEFT: Text ═══ */}
                    <div className="border-b lg:border-b-0 lg:border-r border-[var(--border-main)] flex flex-col bg-[var(--bg-surface)]">

                        {/* Toolbar */}
                        <div className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-main)] px-4 py-2 flex items-center gap-2 min-h-[40px]">
                            <Code2 size={13} className="text-[var(--text-dim)] shrink-0" />
                            <span className="font-mono text-[11px] text-[var(--text-dim)] flex-1 truncate">{draft.title}</span>
                            <div className="flex bg-[var(--bg-main)] rounded-[var(--radius-sm)] border border-[var(--border-main)] p-[3px] shrink-0">
                                <button
                                    onClick={() => setShowImproved(false)}
                                    className={`text-[10px] font-mono px-2.5 py-[3px] rounded-[3px] transition-all cursor-pointer ${!showImproved ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-dim)]'}`}
                                >
                                    Оригинал
                                </button>
                                <button
                                    onClick={() => setShowImproved(true)}
                                    className={`text-[10px] font-mono px-2.5 py-[3px] rounded-[3px] transition-all flex items-center gap-1 cursor-pointer ${showImproved ? 'bg-[var(--color-ai-bg)] text-[var(--color-ai)] shadow-sm' : 'text-[var(--text-dim)]'}`}
                                >
                                    <Sparkles size={9} /> AI версия
                                </button>
                            </div>
                        </div>

                        {/* Original: category filter legend */}
                        {!showImproved && annotations.length > 0 && (
                            <div className="border-b border-[var(--border-main)] px-4 py-1.5 flex items-center gap-2 flex-wrap bg-[var(--bg-surface)]">
                                <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-dim)]">Показать:</span>
                                {(['logic', 'clarity', 'style', 'grammar'] as IssueType[]).map(type => {
                                    const count = annCountByCategory[type] ?? 0;
                                    if (!count) return null;
                                    const c = ISSUE_COLORS[type];
                                    const isActive = activeCategory === type;
                                    return (
                                        <button key={type}
                                            onClick={() => setActiveCategory(prev => prev === type ? null : type)}
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all text-[10px] font-mono cursor-pointer"
                                            style={{
                                                backgroundColor: isActive ? `${c.pill}20` : 'transparent',
                                                borderColor: isActive ? c.pill : 'var(--border-main)',
                                                color: isActive ? c.pill : 'var(--text-dim)',
                                            }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.pill }} />
                                            {c.label}
                                            <span style={{ color: c.pill, opacity: 0.8 }}>{count}</span>
                                        </button>
                                    );
                                })}
                                {activeCategory && (
                                    <button
                                        onClick={() => { setActiveCategory(null); setActiveAnnotationIdx(null); }}
                                        className="ml-auto text-[9px] font-mono text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors cursor-pointer"
                                    >
                                        сбросить ×
                                    </button>
                                )}
                            </div>
                        )}

                        {/* AI version: save bar */}
                        {showImproved && (
                            <div className="border-b border-[var(--border-main)] px-4 py-2 flex items-center gap-2 bg-[var(--color-ai-bg)]/20">
                                <Sparkles size={11} className="text-[var(--color-ai)]" />
                                <span className="text-[10px] font-mono text-[var(--color-ai)] flex-1">Улучшенная версия от AI</span>
                                <CopyButton text={analysis.improved_text} />
                                <DownloadButton text={analysis.improved_text} title={draft.title} />
                            </div>
                        )}

                        {/* Text body */}
                        <div className="overflow-y-auto max-h-[68vh] min-h-[300px] p-5">
                            {showImproved ? (
                                <p className="font-inter text-[14px] leading-[1.9] text-[var(--text-muted)] whitespace-pre-wrap break-words">
                                    {analysis.improved_text}
                                </p>
                            ) : textContent ? (
                                <HighlightedText
                                    text={textContent}
                                    annotations={annotations}
                                    activeCategory={activeCategory}
                                    activeAnnotationIdx={activeAnnotationIdx}
                                    onAnnotationClick={handleAnnotationClick}
                                />
                            ) : (
                                <p className="text-[var(--text-dim)] italic text-sm">Текст недоступен</p>
                            )}
                        </div>
                    </div>

                    {/* ═══ RIGHT: Analysis ═══ */}
                    <div className="flex flex-col bg-[var(--bg-card)]">

                        {/* Score header */}
                        <div className="bg-[var(--bg-surface-alt)] border-b border-[var(--border-main)] px-4 py-2.5 flex items-center gap-3">
                            <ScoreRing score={fb.overall_score} />
                            <div className="flex-1 min-w-0">
                                <p className="font-syne text-[13px] font-semibold text-[var(--text-main)]">Общая оценка</p>
                                <p className="text-[10px] text-[var(--text-dim)] font-inter leading-tight">
                                    {fb.overall_score >= 8 ? 'Материал готов к выступлению'
                                        : fb.overall_score >= 6 ? 'Хорошая основа, есть точки роста'
                                        : fb.overall_score >= 4 ? 'Требуется доработка'
                                        : 'Необходима существенная переработка'}
                                </p>
                            </div>
                            <p className="text-[9px] text-[var(--text-dim)] font-mono hidden sm:block shrink-0">
                                {format(new Date(analysis.created_at), 'd MMM yyyy', { locale: ru })}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-[var(--border-main)] px-3 flex items-center bg-[var(--bg-surface-alt)]">
                            {rightTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setRightTab(tab.id)}
                                    className={`relative px-3 py-2.5 text-[11px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        rightTab === tab.id ? 'text-[var(--text-main)]' : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                        <span className={`text-[9px] font-bold px-1 py-px rounded-full ${
                                            rightTab === tab.id ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-main)] text-[var(--text-dim)]'
                                        }`}>
                                            {tab.badge}
                                        </span>
                                    )}
                                    {rightTab === tab.id && (
                                        <motion.div
                                            layoutId="tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-primary)]"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab body */}
                        <div className="overflow-y-auto flex-1 max-h-[calc(68vh+42px)]">
                            <AnimatePresence mode="wait">

                                {/* Tab: Проблемы */}
                                {rightTab === 'annotations' && (
                                    <motion.div key="annotations"
                                        initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}
                                        className="p-4"
                                    >
                                        {annotations.length === 0 ? (
                                            <div className="text-center py-10">
                                                <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-3" strokeWidth={1.5} />
                                                <p className="text-[13px] text-[var(--text-muted)] font-inter">Серьёзных проблем не найдено</p>
                                                <p className="text-[11px] text-[var(--text-dim)] font-inter mt-1">Материал хорошо написан</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Filter pills */}
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    <button
                                                        onClick={() => { setActiveCategory(null); setActiveAnnotationIdx(null); }}
                                                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                                            !activeCategory
                                                                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                                                : 'border-[var(--border-main)] text-[var(--text-dim)] hover:border-[var(--border-light)]'
                                                        }`}
                                                    >
                                                        Все · {annotations.length}
                                                    </button>
                                                    {(['logic', 'clarity', 'style', 'grammar'] as IssueType[]).map(type => {
                                                        const count = annCountByCategory[type] ?? 0;
                                                        if (!count) return null;
                                                        const c = ISSUE_COLORS[type];
                                                        const isActive = activeCategory === type;
                                                        return (
                                                            <button key={type}
                                                                onClick={() => setActiveCategory(prev => prev === type ? null : type)}
                                                                className="text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer"
                                                                style={{
                                                                    backgroundColor: isActive ? `${c.pill}20` : 'var(--bg-surface-alt)',
                                                                    borderColor: isActive ? c.pill : 'var(--border-main)',
                                                                    color: isActive ? c.pill : 'var(--text-dim)',
                                                                }}
                                                            >
                                                                {c.label} · {count}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Annotation list */}
                                                <div className="flex flex-col gap-2">
                                                    {annotations.map((ann, idx) => {
                                                        const c = ISSUE_COLORS[ann.issue_type];
                                                        const isActive = activeAnnotationIdx === idx;
                                                        const isDimmed = activeCategory !== null && activeCategory !== ann.issue_type;
                                                        return (
                                                            <motion.div key={idx} layout
                                                                onClick={() => setActiveAnnotationIdx(prev => prev === idx ? null : idx)}
                                                                className="rounded-[var(--radius-md)] border p-3 cursor-pointer transition-all"
                                                                style={{
                                                                    backgroundColor: isActive ? `${c.pill}12` : 'var(--bg-surface-alt)',
                                                                    borderColor: isActive ? `${c.pill}50` : 'var(--border-main)',
                                                                    opacity: isDimmed ? 0.28 : 1,
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span
                                                                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold shrink-0"
                                                                        style={{ backgroundColor: `${c.pill}20`, color: c.pill }}
                                                                    >
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: c.pill }}>
                                                                        {c.label}
                                                                    </span>
                                                                    <span className="text-[9px] font-mono text-[var(--text-dim)] ml-auto">
                                                                        {SEVERITY_CONFIG[ann.severity].label}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] font-mono italic mb-1.5 leading-relaxed line-clamp-2"
                                                                    style={{ color: c.textColor, opacity: 0.85 }}>
                                                                    «{ann.text}»
                                                                </p>
                                                                <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">
                                                                    {ann.comment}
                                                                </p>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}

                                {/* Tab: Критерии */}
                                {rightTab === 'criteria' && (
                                    <motion.div key="criteria"
                                        initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}
                                        className="p-4 flex flex-col gap-2"
                                    >
                                        {categories.map(({ key, label, text }) => {
                                            const c = ISSUE_COLORS[key];
                                            const count = annCountByCategory[key] ?? 0;
                                            return (
                                                <div key={key} className="p-3.5 rounded-[var(--radius-md)] border bg-[var(--bg-surface-alt)] border-[var(--border-main)]">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: c.pill }} />
                                                            <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: c.pill }}>{label}</span>
                                                        </div>
                                                        {count > 0 && (
                                                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                                                                style={{ backgroundColor: `${c.pill}20`, color: c.pill }}>
                                                                {count} {count === 1 ? 'проблема' : 'проблемы'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">{text}</p>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}

                                {/* Tab: Советы */}
                                {rightTab === 'advice' && (
                                    <motion.div key="advice"
                                        initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}
                                        className="p-4 space-y-4"
                                    >
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

                                        {!fb.strengths?.length && !fb.weaknesses?.length && !fb.recommendations?.length && (
                                            <div className="text-center py-8">
                                                <Lightbulb size={24} className="text-[var(--text-dim)] mx-auto mb-2 opacity-40" strokeWidth={1.5} />
                                                <p className="text-[13px] font-inter text-[var(--text-dim)]">Дополнительные советы недоступны</p>
                                            </div>
                                        )}

                                        {/* CTA */}
                                        <div className="relative bg-[var(--bg-surface-alt)] border border-[var(--accent-primary-glow)] rounded-[var(--radius-md)] p-4 overflow-hidden">
                                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />
                                            <h3 className="font-syne text-[13px] font-semibold text-[var(--text-main)] tracking-tight mb-1">Готовы к стресс-тесту?</h3>
                                            <p className="text-[11px] text-[var(--text-dim)] font-inter mb-3">AI-собеседник задаст жёсткие вопросы по вашему материалу</p>
                                            <Link href={`/simulation?draft=${draftId}`} className="btn-primary gap-2 text-sm w-full justify-center">
                                                <Zap size={13} /> Начать симуляцию <ChevronRight size={12} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
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
