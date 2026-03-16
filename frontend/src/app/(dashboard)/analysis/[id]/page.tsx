"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, TerminalSquare, ListFilter, Sparkles, Activity, ChevronLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

type Severity = 'high' | 'medium' | 'low';
type IssueType = 'logic' | 'style' | 'clarity' | 'grammar';

type Annotation = {
    text: string;
    issue_type: IssueType;
    comment: string;
    severity: Severity;
};

type FeedbackJSON = {
    logic: string;
    style: string;
    clarity: string;
    grammar: string;
    overall_score: number;
    annotations?: Annotation[];
};

type Draft = {
    id: string;
    title: string;
    raw_text: string;
    analysis_result: {
        feedback_json: FeedbackJSON;
        improved_text: string;
    } | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const ISSUE_STYLES: Record<IssueType, { bg: string; border: string; label: string; color: string; dot: string }> = {
    logic:   { bg: 'bg-red-500/20',    border: 'border-b-2 border-red-400',    label: 'Логика',      color: '#ef4444', dot: 'bg-red-400' },
    style:   { bg: 'bg-orange-500/20', border: 'border-b-2 border-orange-400', label: 'Стиль',       color: '#f97316', dot: 'bg-orange-400' },
    clarity: { bg: 'bg-purple-500/20', border: 'border-b-2 border-purple-400', label: 'Ясность',     color: '#a855f7', dot: 'bg-purple-400' },
    grammar: { bg: 'bg-yellow-500/20', border: 'border-b-2 border-yellow-400', label: 'Грамматика',  color: '#eab308', dot: 'bg-yellow-400' },
};

const SEVERITY_LABEL: Record<Severity, string> = {
    high: 'Критично',
    medium: 'Средний',
    low: 'Низкий',
};

// ─── Text segmentation ───────────────────────────────────────────────────────

type Segment = { text: string; annotation?: Annotation };

function buildSegments(rawText: string, annotations: Annotation[]): Segment[] {
    if (!annotations.length) return [{ text: rawText }];

    // Find non-overlapping spans sorted by position
    const spans: Array<{ start: number; end: number; ann: Annotation }> = [];
    for (const ann of annotations) {
        if (!ann.text || ann.text.length < 3) continue;
        const idx = rawText.indexOf(ann.text);
        if (idx === -1) continue;
        const end = idx + ann.text.length;
        const overlaps = spans.some((s) => !(end <= s.start || idx >= s.end));
        if (!overlaps) spans.push({ start: idx, end, ann });
    }
    spans.sort((a, b) => a.start - b.start);

    const segments: Segment[] = [];
    let cursor = 0;
    for (const span of spans) {
        if (span.start > cursor) segments.push({ text: rawText.slice(cursor, span.start) });
        segments.push({ text: rawText.slice(span.start, span.end), annotation: span.ann });
        cursor = span.end;
    }
    if (cursor < rawText.length) segments.push({ text: rawText.slice(cursor) });
    return segments;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const draftId = params.id as string;

    const [draft, setDraft] = useState<Draft | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>('logic');
    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [view, setView] = useState<'original' | 'improved'>('original');

    useEffect(() => {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        if (isDesktop) setShowRightPanel(true);
    }, []);

    useEffect(() => {
        async function fetchDraft() {
            try {
                const res = await api.get(`/drafts/${draftId}`);
                setDraft(res);
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Ошибка загрузки разбора');
                router.push('/upload');
            } finally {
                setLoading(false);
            }
        }
        if (draftId) fetchDraft();
    }, [draftId, router]);

    const handleAnnotationClick = useCallback((ann: Annotation) => {
        setSelectedAnnotation(ann);
        setActiveSection(ann.issue_type);
        if (!showRightPanel) setShowRightPanel(true);
    }, [showRightPanel]);

    const clearAnnotation = useCallback(() => setSelectedAnnotation(null), []);

    // Build annotated segments from raw text
    const segments = useMemo(() => {
        if (!draft?.raw_text) return [];
        const annotations = draft.analysis_result?.feedback_json.annotations ?? [];
        return buildSegments(draft.raw_text, annotations);
    }, [draft]);

    const annotations = draft?.analysis_result?.feedback_json.annotations ?? [];

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <div className="flex flex-col items-center gap-4 text-[var(--accent-blue)]">
                    <Activity size={32} className="animate-spin" />
                    <span className="text-sm font-mono text-[var(--text-muted)]">Загрузка данных...</span>
                </div>
            </div>
        );
    }

    if (!draft || !draft.analysis_result) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <div className="text-[var(--text-muted)] font-mono">Анализ не найден</div>
            </div>
        );
    }

    const { title } = draft;
    const { feedback_json, improved_text } = draft.analysis_result;

    const feedbackItems = [
        { id: 'logic',   title: 'Логика и структура', desc: feedback_json.logic,   color: ISSUE_STYLES.logic.color },
        { id: 'style',   title: 'Стиль и тон',        desc: feedback_json.style,   color: ISSUE_STYLES.style.color },
        { id: 'clarity', title: 'Ясность',             desc: feedback_json.clarity, color: ISSUE_STYLES.clarity.color },
        { id: 'grammar', title: 'Грамматика',          desc: feedback_json.grammar, color: ISSUE_STYLES.grammar.color },
    ];

    // Annotations for the active category (for right panel listing)
    const categoryAnnotations = annotations.filter((a) => a.issue_type === activeSection);

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-main)]">
            {/* ─── TOOLBAR ─── */}
            <div className="h-14 border-b border-[var(--border-main)] flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-surface)] shrink-0 gap-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[var(--text-main)] font-mono text-[13px] truncate max-w-[180px] sm:max-w-[360px]">
                        <TerminalSquare size={16} className="text-[var(--accent-blue)] shrink-0" />
                        <span className="truncate">{title || 'draft.txt'}</span>
                    </div>
                    <div className="hidden sm:block h-4 w-px bg-[var(--border-main)]" />
                    <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
                        Score:{' '}
                        <span
                            className="font-semibold"
                            style={{
                                color:
                                    feedback_json.overall_score >= 8
                                        ? '#10b981'
                                        : feedback_json.overall_score >= 5
                                        ? '#f59e0b'
                                        : '#f43f5e',
                            }}
                        >
                            {feedback_json.overall_score}/10
                        </span>
                    </div>
                    {annotations.length > 0 && (
                        <>
                            <div className="hidden sm:block h-4 w-px bg-[var(--border-main)]" />
                            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
                                <AlertCircle size={12} />
                                {annotations.length} замечаний
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="md:hidden flex items-center gap-1.5 border border-[var(--border-light)] text-[var(--text-main)] px-2.5 py-1.5 rounded text-xs font-mono"
                        onClick={() => setShowRightPanel(!showRightPanel)}
                    >
                        <ListFilter size={14} /> Анализ
                    </button>
                    <button
                        onClick={() => { setView(view === 'improved' ? 'original' : 'improved'); clearAnnotation(); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                            view === 'improved'
                                ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--accent-blue)]'
                                : 'btn-primary'
                        }`}
                    >
                        <Sparkles size={14} />
                        <span className="hidden sm:inline">
                            {view === 'improved' ? 'Оригинал' : 'Улучшенная версия'}
                        </span>
                    </button>
                </div>
            </div>

            {/* ─── MAIN WORKSPACE ─── */}
            <div className="flex flex-1 min-h-0 overflow-hidden relative">

                {/* ─── LEFT: TEXT VIEW ─── */}
                <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] scroll-smooth">
                    <AnimatePresence mode="wait">
                        {view === 'improved' ? (
                            <motion.div
                                key="improved"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-8 pb-20 max-w-3xl mx-auto"
                            >
                                <div className="flex items-center gap-2 mb-6 font-mono text-xs text-[var(--accent-blue)] uppercase tracking-widest">
                                    <Sparkles size={14} />
                                    Оптимизированный текст
                                </div>
                                <div className="font-inter text-[15px] leading-[1.9] text-[var(--text-main)] whitespace-pre-wrap">
                                    {improved_text}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="original"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-8 pb-20 max-w-3xl mx-auto"
                            >
                                {annotations.length > 0 && (
                                    <div className="mb-6 flex flex-wrap gap-2">
                                        {(Object.keys(ISSUE_STYLES) as IssueType[]).map((type) => {
                                            const count = annotations.filter((a) => a.issue_type === type).length;
                                            if (!count) return null;
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => { setActiveSection(type); clearAnnotation(); }}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                                                        activeSection === type
                                                            ? 'opacity-100 border-current'
                                                            : 'opacity-50 border-transparent hover:opacity-75'
                                                    }`}
                                                    style={{ color: ISSUE_STYLES[type].color }}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${ISSUE_STYLES[type].dot}`} />
                                                    {ISSUE_STYLES[type].label} ({count})
                                                </button>
                                            );
                                        })}
                                        {selectedAnnotation && (
                                            <button
                                                onClick={clearAnnotation}
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-light)] transition-colors"
                                            >
                                                <X size={10} /> Снять выбор
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="font-inter text-[15px] leading-[1.9] text-[var(--text-main)] whitespace-pre-wrap">
                                    {segments.map((seg, i) => {
                                        if (!seg.annotation) return <span key={i}>{seg.text}</span>;

                                        const style = ISSUE_STYLES[seg.annotation.issue_type];
                                        const isSelected = selectedAnnotation === seg.annotation;

                                        return (
                                            <mark
                                                key={i}
                                                onClick={() => handleAnnotationClick(seg.annotation!)}
                                                title={seg.annotation.comment}
                                                className={`cursor-pointer rounded-sm px-0.5 transition-all duration-150 ${style.bg} ${style.border} ${
                                                    isSelected ? 'ring-2 ring-offset-1 ring-current' : 'hover:brightness-125'
                                                }`}
                                                style={isSelected ? { color: style.color } : {}}
                                            >
                                                {seg.text}
                                            </mark>
                                        );
                                    })}
                                </div>

                                {annotations.length === 0 && (
                                    <p className="mt-6 text-xs font-mono text-[var(--text-muted)]">
                                        Аннотации не найдены — переанализируйте текст для получения подсказок.
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ─── RIGHT: SMART PANEL ─── */}
                <AnimatePresence>
                    {showRightPanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 340, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="fixed md:relative right-0 top-14 md:top-0 bottom-0 w-[min(340px,85vw)] max-w-full md:max-w-none border-l border-[var(--border-main)] bg-[var(--bg-surface)] flex flex-col z-20 shadow-2xl md:shadow-none backdrop-blur-xl md:backdrop-blur-none"
                        >
                            <div className="px-5 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                                <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-[0.1em]">
                                    Анализ
                                </span>
                                <button
                                    className="md:hidden bg-transparent border-none text-[var(--text-dim)]"
                                    onClick={() => setShowRightPanel(false)}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <AnimatePresence mode="wait">
                                    {/* ── Annotation detail view ── */}
                                    {selectedAnnotation ? (
                                        <motion.div
                                            key="annotation-detail"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="flex flex-col h-full"
                                        >
                                            <button
                                                onClick={clearAnnotation}
                                                className="flex items-center gap-1.5 px-5 py-3 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] border-b border-[var(--border-light)] transition-colors"
                                            >
                                                <ChevronLeft size={12} /> Назад к категориям
                                            </button>

                                            <div className="p-5 flex-1">
                                                {/* Issue type badge */}
                                                <div
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono mb-4 border"
                                                    style={{
                                                        color: ISSUE_STYLES[selectedAnnotation.issue_type].color,
                                                        borderColor: ISSUE_STYLES[selectedAnnotation.issue_type].color + '40',
                                                        backgroundColor: ISSUE_STYLES[selectedAnnotation.issue_type].color + '15',
                                                    }}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${ISSUE_STYLES[selectedAnnotation.issue_type].dot}`}
                                                    />
                                                    {ISSUE_STYLES[selectedAnnotation.issue_type].label}
                                                    <span className="opacity-60 mx-1">·</span>
                                                    {SEVERITY_LABEL[selectedAnnotation.severity]}
                                                </div>

                                                {/* Quoted fragment */}
                                                <div className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl p-4 mb-4">
                                                    <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest mb-2">
                                                        Фрагмент
                                                    </div>
                                                    <p className="text-sm text-slate-300 leading-relaxed italic">
                                                        &ldquo;{selectedAnnotation.text}&rdquo;
                                                    </p>
                                                </div>

                                                {/* Recommendation */}
                                                <div>
                                                    <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest mb-2">
                                                        Рекомендация
                                                    </div>
                                                    <p className="text-sm text-slate-200 leading-relaxed">
                                                        {selectedAnnotation.comment}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        /* ── Category list view ── */
                                        <motion.div
                                            key="category-list"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            {/* General feedback categories */}
                                            {feedbackItems.map((item) => {
                                                const isActive = activeSection === item.id;
                                                const count = annotations.filter(
                                                    (a) => a.issue_type === item.id
                                                ).length;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => setActiveSection(item.id)}
                                                        className={`px-5 py-4 border-b border-[var(--border-light)] cursor-pointer transition-colors relative ${
                                                            isActive
                                                                ? 'bg-[var(--bg-surface-hover)]'
                                                                : 'hover:bg-[var(--bg-surface-hover)]/50'
                                                        }`}
                                                    >
                                                        {isActive && (
                                                            <motion.div
                                                                layoutId="sidebar-active-indicator"
                                                                className="absolute left-0 top-0 bottom-0 w-1"
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                        )}
                                                        <div className="flex items-start gap-3">
                                                            <AlertCircle
                                                                size={16}
                                                                color={item.color}
                                                                className="mt-0.5 shrink-0"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div
                                                                        className={`font-inter text-sm ${
                                                                            isActive
                                                                                ? 'text-white font-semibold'
                                                                                : 'text-[var(--text-main)]'
                                                                        }`}
                                                                    >
                                                                        {item.title}
                                                                    </div>
                                                                    {count > 0 && (
                                                                        <span
                                                                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                                                            style={{
                                                                                color: item.color,
                                                                                backgroundColor: item.color + '20',
                                                                            }}
                                                                        >
                                                                            {count}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className={`font-inter text-xs leading-relaxed ${
                                                                        isActive
                                                                            ? 'text-slate-300'
                                                                            : 'text-[var(--text-muted)] line-clamp-2'
                                                                    }`}
                                                                >
                                                                    {item.desc}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Annotations for active category */}
                                            {categoryAnnotations.length > 0 && (
                                                <div className="px-5 py-3">
                                                    <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest mb-3">
                                                        Найденные проблемы
                                                    </div>
                                                    {categoryAnnotations.map((ann, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleAnnotationClick(ann)}
                                                            className="w-full text-left p-3 mb-2 bg-[var(--bg-main)] border border-[var(--border-light)] rounded-xl hover:border-[var(--border-main)] transition-colors group"
                                                        >
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span
                                                                    className="text-[10px] font-mono"
                                                                    style={{ color: ISSUE_STYLES[ann.issue_type].color }}
                                                                >
                                                                    {SEVERITY_LABEL[ann.severity]}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-300 italic line-clamp-1 mb-1">
                                                                &ldquo;{ann.text.slice(0, 60)}{ann.text.length > 60 ? '…' : ''}&rdquo;
                                                            </p>
                                                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                                                                {ann.comment}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
