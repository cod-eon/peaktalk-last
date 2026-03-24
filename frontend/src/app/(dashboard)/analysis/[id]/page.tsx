"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Zap, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft,
    BarChart2, Lightbulb, Sparkles, Copy, Download, Check, X, MessageSquare,
} from 'lucide-react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

type IssueType = 'logic' | 'style' | 'clarity' | 'grammar';
type Severity  = 'high' | 'medium' | 'low';
type ActiveTab = 'text' | 'issues' | 'improved';

type Annotation = { text: string; issue_type: IssueType; comment: string; severity: Severity };

type AnalysisFeedback = {
    logic: string; style: string; clarity: string; grammar: string;
    overall_score: number;
    annotations?: Annotation[];
    strengths?: string[]; weaknesses?: string[]; recommendations?: string[];
};

type Draft = {
    id: string; title: string; raw_text: string; content?: string; created_at: string;
    analysis_result: { id: string; improved_text: string; feedback_json: AnalysisFeedback; created_at: string } | null;
    document_id: string | null;
};

// ── Design tokens ──────────────────────────────────────────────────────────────

const ISSUE: Record<IssueType, { label: string; pill: string; bg: string; border: string; text: string }> = {
    logic:   { label: 'Логика',     pill: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: '#3b82f6', text: '#93c5fd' },
    clarity: { label: 'Ясность',    pill: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: '#8b5cf6', text: '#c4b5fd' },
    style:   { label: 'Стиль',      pill: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: '#fbbf24', text: '#fde68a' },
    grammar: { label: 'Грамматика', pill: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: '#ef4444', text: '#fca5a5' },
};

const SEV: Record<Severity, { label: string; opacity: number }> = {
    high:   { label: 'Критично',      opacity: 1.0 },
    medium: { label: 'Важно',         opacity: 0.8 },
    low:    { label: 'Незначительно', opacity: 0.55 },
};

// ── Segment builder ────────────────────────────────────────────────────────────

type Segment = { text: string; ann?: Annotation; idx?: number };

function buildSegments(text: string, annotations: Annotation[]): Segment[] {
    const ivs = annotations.flatMap((ann, i) => {
        const s = text.indexOf(ann.text);
        return s === -1 ? [] : [{ s, e: s + ann.text.length, ann, i }];
    }).sort((a, b) => a.s - b.s);

    const out: Segment[] = [];
    let cur = 0;
    for (const { s, e, ann, i } of ivs) {
        if (s < cur) continue;
        if (s > cur) out.push({ text: text.slice(cur, s) });
        out.push({ text: text.slice(s, e), ann, idx: i });
        cur = e;
    }
    if (cur < text.length) out.push({ text: text.slice(cur) });
    return out;
}

// ── Score ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
    const sw = 5, r = (size - sw) / 2, c = 2 * Math.PI * r;
    const color = score >= 7 ? '#10b981' : score >= 5 ? '#fbbf24' : '#ef4444';
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-main)" strokeWidth={sw} />
                <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
                    strokeWidth={sw} strokeLinecap="round" strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: c - (score / 10) * c }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-syne font-bold leading-none" style={{ color, fontSize: size * 0.27 }}>{score}</span>
                <span className="font-mono text-[var(--text-dim)]" style={{ fontSize: size * 0.13 }}>/10</span>
            </div>
        </div>
    );
}

// ── Copy / Download ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all text-[12px] font-mono cursor-pointer">
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? 'Скопировано!' : 'Скопировать'}
        </button>
    );
}

function DownloadButton({ text, title }: { text: string; title: string }) {
    return (
        <button onClick={() => {
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
            Object.assign(document.createElement('a'), { href: url, download: `${title.slice(0,40).replace(/[^а-яёa-z0-9]/gi,'_')}_AI.txt` }).click();
            URL.revokeObjectURL(url);
        }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--color-ai)] hover:border-[var(--color-ai)]/40 transition-all text-[12px] font-mono cursor-pointer">
            <Download size={12} /> Скачать .txt
        </button>
    );
}

// ── Annotation bottom sheet ────────────────────────────────────────────────────

function AnnotationSheet({ ann, idx, total, onClose, onPrev, onNext }: {
    ann: Annotation; idx: number; total: number;
    onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
    const c = ISSUE[ann.issue_type];
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)] rounded-t-[24px] border-t border-[var(--border-main)] shadow-2xl"
                style={{ maxWidth: '680px', margin: '0 auto' }}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
                    <div className="w-10 h-1 rounded-full bg-[var(--border-main)]" />
                </div>

                <div className="px-5 pb-10 pt-2">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: `${c.pill}20`, color: c.pill }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.pill }} />
                                {c.label}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-dim)] px-2 py-0.5 rounded bg-[var(--bg-surface-alt)]">
                                {SEV[ann.severity].label}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono text-[var(--text-dim)]">{idx + 1}/{total}</span>
                            <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors cursor-pointer p-1">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Cited fragment */}
                    <div className="rounded-[var(--radius-md)] p-3.5 mb-4" style={{ backgroundColor: c.bg, borderLeft: `3px solid ${c.border}` }}>
                        <p className="text-[13px] font-mono italic leading-relaxed" style={{ color: c.text }}>
                            «{ann.text}»
                        </p>
                    </div>

                    {/* AI comment */}
                    <p className="text-[15px] text-[var(--text-muted)] font-inter leading-[1.75] mb-6">
                        {ann.comment}
                    </p>

                    {/* Prev / Next */}
                    <div className="flex items-center justify-between">
                        <button onClick={onPrev} disabled={idx === 0}
                            className="flex items-center gap-1.5 text-[13px] font-mono text-[var(--text-dim)] hover:text-[var(--text-main)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer py-2 px-1">
                            <ChevronLeft size={15} /> Предыдущая
                        </button>
                        <button onClick={onNext} disabled={idx === total - 1}
                            className="flex items-center gap-1.5 text-[13px] font-mono text-[var(--text-dim)] hover:text-[var(--text-main)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer py-2 px-1">
                            Следующая <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    );
}

// ── Annotated text ─────────────────────────────────────────────────────────────

function AnnotatedText({ text, annotations, activeIdx, onTap }: {
    text: string; annotations: Annotation[]; activeIdx: number | null;
    onTap: (idx: number) => void;
}) {
    const segments = useMemo(() => buildSegments(text, annotations), [text, annotations]);
    return (
        <div className="font-inter text-[15px] sm:text-[16px] leading-[1.9] text-[var(--text-muted)] whitespace-pre-wrap break-words">
            {segments.map((seg, i) => {
                if (!seg.ann || seg.idx === undefined) return <span key={i}>{seg.text}</span>;
                const c = ISSUE[seg.ann.issue_type];
                const isActive = activeIdx === seg.idx;
                return (
                    <span key={i} onClick={() => onTap(seg.idx!)}
                        style={{
                            backgroundColor: isActive ? `${c.pill}28` : c.bg,
                            borderBottom: `2px solid ${c.border}`,
                            borderRadius: '2px 2px 0 0',
                            cursor: 'pointer',
                            padding: '1px 1px 0',
                            transition: 'background-color 0.15s',
                            opacity: SEV[seg.ann.severity].opacity,
                        }}
                    >
                        {seg.text}
                    </span>
                );
            })}
        </div>
    );
}

// ── Issues list ────────────────────────────────────────────────────────────────

function IssuesList({ annotations, onTap, categories, fb }: {
    annotations: Annotation[];
    onTap: (idx: number) => void;
    categories: Array<{ key: IssueType; label: string; text: string }>;
    fb: AnalysisFeedback;
}) {
    const [filter, setFilter] = useState<IssueType | null>(null);
    const countByType = annotations.reduce<Record<string, number>>((a, ann) => ({ ...a, [ann.issue_type]: (a[ann.issue_type] ?? 0) + 1 }), {});
    const filtered = filter ? annotations.filter(a => a.issue_type === filter) : annotations;

    if (!annotations.length) return (
        <div className="text-center py-16">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-[var(--text-muted)] font-inter font-medium">Серьёзных проблем нет</p>
            <p className="text-[13px] text-[var(--text-dim)] mt-1">Текст написан хорошо</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilter(null)}
                    className={`text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${!filter ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'border-[var(--border-main)] text-[var(--text-dim)]'}`}>
                    Все · {annotations.length}
                </button>
                {(['logic','clarity','style','grammar'] as IssueType[]).map(type => {
                    const count = countByType[type] ?? 0;
                    if (!count) return null;
                    const c = ISSUE[type]; const isA = filter === type;
                    return (
                        <button key={type} onClick={() => setFilter(p => p === type ? null : type)}
                            className="text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer"
                            style={{ backgroundColor: isA ? `${c.pill}20` : 'var(--bg-surface-alt)', borderColor: isA ? c.pill : 'var(--border-main)', color: isA ? c.pill : 'var(--text-dim)' }}>
                            {c.label} · {count}
                        </button>
                    );
                })}
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3">
                {filtered.map((ann, i) => {
                    const realIdx = annotations.indexOf(ann);
                    const c = ISSUE[ann.issue_type];
                    return (
                        <button key={i} onClick={() => onTap(realIdx)}
                            className="text-left rounded-[var(--radius-lg)] border p-4 transition-all cursor-pointer hover:border-[var(--border-light)] active:scale-[0.99]"
                            style={{ backgroundColor: 'var(--bg-surface-alt)', borderColor: 'var(--border-main)', borderLeft: `3px solid ${c.pill}` }}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold" style={{ color: c.pill }}>{c.label}</span>
                                <span className="text-[9px] font-mono text-[var(--text-dim)] px-1.5 py-0.5 rounded bg-[var(--bg-main)]">{SEV[ann.severity].label}</span>
                            </div>
                            <p className="text-[11px] font-mono italic mb-2 leading-relaxed line-clamp-1" style={{ color: c.text }}>«{ann.text}»</p>
                            <p className="text-[13px] text-[var(--text-muted)] font-inter leading-relaxed line-clamp-2">{ann.comment}</p>
                        </button>
                    );
                })}
            </div>

            {/* Category breakdown */}
            <div>
                <h2 className="font-syne text-[14px] font-semibold text-[var(--text-main)] mb-3">Оценка по критериям</h2>
                <div className="space-y-2.5">
                    {categories.map(({ key, label, text }) => {
                        const c = ISSUE[key]; const cnt = countByType[key] ?? 0;
                        return (
                            <div key={key} className="bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-[var(--radius-md)] p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.pill }} />
                                        <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: c.pill }}>{label}</span>
                                    </div>
                                    {cnt > 0 && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${c.pill}20`, color: c.pill }}>{cnt} {cnt === 1 ? 'проблема' : 'проблемы'}</span>}
                                </div>
                                <p className="text-[13px] text-[var(--text-muted)] font-inter leading-relaxed">{text}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Strengths / weaknesses */}
            {(fb.strengths?.length || fb.weaknesses?.length) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fb.strengths?.length ? (
                        <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-[var(--radius-md)] p-4">
                            <div className="flex items-center gap-2 mb-3"><CheckCircle2 size={13} className="text-emerald-400" /><span className="label-kicker" style={{ color: 'rgba(52,211,153,0.7)' }}>Сильные стороны</span></div>
                            <ul className="flex flex-col gap-2">{fb.strengths.map((s,i) => <li key={i} className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400 mt-[7px] shrink-0"/><p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">{s}</p></li>)}</ul>
                        </div>
                    ) : null}
                    {fb.weaknesses?.length ? (
                        <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-[var(--radius-md)] p-4">
                            <div className="flex items-center gap-2 mb-3"><AlertCircle size={13} className="text-[var(--color-warning)]" /><span className="label-kicker" style={{ color: 'rgba(251,191,36,0.7)' }}>Зоны роста</span></div>
                            <ul className="flex flex-col gap-2">{fb.weaknesses.map((w,i) => <li key={i} className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-[var(--color-warning)] mt-[7px] shrink-0"/><p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">{w}</p></li>)}</ul>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {/* Recommendations */}
            {fb.recommendations?.length ? (
                <div className="bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-[var(--radius-md)] p-4">
                    <div className="flex items-center gap-2 mb-3"><Lightbulb size={14} className="text-[var(--color-ai)]" /><h2 className="font-syne text-[13px] font-semibold text-[var(--text-main)]">Рекомендации AI</h2></div>
                    <ol className="flex flex-col gap-3">{fb.recommendations.map((rec,i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded bg-[var(--color-ai-bg)] border border-[var(--color-ai-glow)] flex items-center justify-center shrink-0 mt-0.5"><span className="text-[9px] font-mono font-bold" style={{ color: 'var(--color-ai)' }}>{i+1}</span></span>
                            <p className="text-[13px] text-[var(--text-muted)] font-inter leading-relaxed">{rec}</p>
                        </li>
                    ))}</ol>
                </div>
            ) : null}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
    const params   = useParams();
    const router   = useRouter();
    const draftId  = params.id as string;

    const [activeTab, setActiveTab] = useState<ActiveTab>('text');
    const [sheetIdx,  setSheetIdx]  = useState<number | null>(null);

    const { data: draft, isLoading, isError } = useQuery<Draft>({
        queryKey: ['draft', draftId],
        queryFn:  () => api.get(`/drafts/${draftId}`),
        enabled:  !!draftId,
    });

    const openSheet = useCallback((idx: number) => setSheetIdx(idx), []);
    const closeSheet = useCallback(() => setSheetIdx(null), []);

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-6 h-6 border-2 border-[var(--border-light)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
        </div>
    );

    if (isError || !draft) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle size={32} className="text-red-400" strokeWidth={1.5} />
            <p className="text-[14px] text-[var(--text-muted)] font-inter">Материал не найден</p>
            <Link href="/dashboard" className="btn-secondary text-sm gap-2"><ArrowLeft size={14} /> На дашборд</Link>
        </div>
    );

    const analysis = draft.analysis_result;
    const fb = analysis?.feedback_json;

    if (!analysis || !fb) return (
        <div className="w-full py-8 pb-16">
            <div className="max-w-2xl mx-auto px-4">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors mb-5 cursor-pointer group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /><span className="text-[12px] font-inter">Назад</span>
                </button>
                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-8 text-center">
                    <BarChart2 size={24} className="text-[var(--text-dim)] mx-auto mb-4" strokeWidth={1.5} />
                    <h2 className="font-syne text-[16px] font-semibold text-[var(--text-main)] mb-2">Анализ ещё не запущен</h2>
                    <p className="text-[13px] text-[var(--text-muted)] font-inter mb-5 max-w-sm mx-auto">AI разберёт структуру, логику и стиль вашего текста</p>
                    <button className="btn-primary gap-2 cursor-pointer"><Zap size={14} /> Запустить анализ</button>
                </div>
            </div>
        </div>
    );

    const annotations = fb.annotations ?? [];
    const textContent = draft.raw_text || draft.content || '';
    const countByType = annotations.reduce<Record<string, number>>((a, ann) => ({ ...a, [ann.issue_type]: (a[ann.issue_type] ?? 0) + 1 }), {});
    const categories  = [
        { key: 'logic'   as IssueType, label: 'Логика',     text: fb.logic   },
        { key: 'clarity' as IssueType, label: 'Ясность',    text: fb.clarity },
        { key: 'style'   as IssueType, label: 'Стиль',      text: fb.style   },
        { key: 'grammar' as IssueType, label: 'Грамматика', text: fb.grammar },
    ];
    const scoreLabel = fb.overall_score >= 8 ? 'Готов к выступлению'
        : fb.overall_score >= 6 ? 'Хорошая основа'
        : fb.overall_score >= 4 ? 'Требует доработки'
        : 'Нужна переработка';

    const tabs = [
        { id: 'text'     as ActiveTab, label: 'Текст',    badge: annotations.length },
        { id: 'issues'   as ActiveTab, label: 'Разбор',   badge: null },
        { id: 'improved' as ActiveTab, label: 'AI версия', badge: null, icon: true },
    ];

    return (
        <div className="w-full min-h-screen pb-24">
            <div className="max-w-2xl mx-auto px-4 pt-6">

                {/* Back */}
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors mb-5 cursor-pointer group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[12px] font-inter">Назад</span>
                </button>

                {/* Score card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5 mb-4">

                    <div className="flex items-start gap-4 mb-4">
                        <ScoreRing score={fb.overall_score} size={68} />
                        <div className="flex-1 min-w-0 pt-1">
                            <p className="label-kicker mb-1">Разбор материала</p>
                            <h1 className="font-syne text-[17px] font-bold text-[var(--text-main)] leading-snug line-clamp-2 mb-1">
                                {draft.title}
                            </h1>
                            <p className="text-[12px] font-mono" style={{ color: fb.overall_score >= 7 ? '#10b981' : fb.overall_score >= 5 ? '#fbbf24' : '#ef4444' }}>
                                {scoreLabel}
                            </p>
                        </div>
                    </div>

                    {/* Issue type chips */}
                    {annotations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {(['grammar','logic','clarity','style'] as IssueType[]).map(type => {
                                const cnt = countByType[type] ?? 0;
                                if (!cnt) return null;
                                const c = ISSUE[type];
                                return (
                                    <div key={type} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono"
                                        style={{ backgroundColor: `${c.pill}15`, color: c.pill }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.pill }} />
                                        {c.label} {cnt}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <Link href={`/simulation?draft=${draftId}`} className="btn-primary gap-2 w-full justify-center">
                        <Zap size={14} /> Начать симуляцию <ChevronRight size={13} />
                    </Link>
                </motion.div>

                {/* Tab bar */}
                <div className="flex bg-[var(--bg-surface-alt)] rounded-[var(--radius-md)] border border-[var(--border-main)] p-1 mb-5">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-sm)] text-[12px] font-mono transition-all cursor-pointer ${
                                activeTab === tab.id ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-dim)]'
                            }`}
                        >
                            {tab.icon && <Sparkles size={10} className={activeTab === tab.id ? 'text-[var(--color-ai)]' : ''} />}
                            {tab.label}
                            {tab.badge !== null && tab.badge > 0 && (
                                <span className={`text-[9px] px-1.5 py-px rounded-full font-bold ${
                                    activeTab === tab.id ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-main)] text-[var(--text-dim)]'
                                }`}>{tab.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">

                    {activeTab === 'text' && (
                        <motion.div key="text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                            {annotations.length > 0 && (
                                <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-dim)] font-inter mb-4">
                                    <MessageSquare size={12} className="shrink-0" />
                                    Нажмите на подсвеченный фрагмент — AI объяснит что не так
                                </p>
                            )}
                            <AnnotatedText
                                text={textContent}
                                annotations={annotations}
                                activeIdx={sheetIdx}
                                onTap={openSheet}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'issues' && (
                        <motion.div key="issues" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                            <IssuesList
                                annotations={annotations}
                                categories={categories}
                                fb={fb}
                                onTap={(idx) => { setActiveTab('text'); setTimeout(() => openSheet(idx), 250); }}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'improved' && (
                        <motion.div key="improved" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                            <div className="flex items-start gap-2.5 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-ai-bg)]/25 border border-[var(--color-ai)]/20 mb-4">
                                <Sparkles size={14} className="text-[var(--color-ai)] shrink-0 mt-0.5" />
                                <p className="text-[12px] text-[var(--color-ai)] font-inter leading-relaxed">
                                    AI переписал текст, сохранив ваш голос — улучшена структура, аргументация и ясность изложения
                                </p>
                            </div>
                            <div className="flex gap-2 mb-5">
                                <CopyButton text={analysis.improved_text} />
                                <DownloadButton text={analysis.improved_text} title={draft.title} />
                            </div>
                            <p className="font-inter text-[15px] leading-[1.9] text-[var(--text-muted)] whitespace-pre-wrap break-words">
                                {analysis.improved_text}
                            </p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Annotation sheet */}
            <AnimatePresence>
                {sheetIdx !== null && annotations[sheetIdx] && (
                    <AnnotationSheet
                        ann={annotations[sheetIdx]}
                        idx={sheetIdx}
                        total={annotations.length}
                        onClose={closeSheet}
                        onPrev={() => setSheetIdx(p => p !== null && p > 0 ? p - 1 : p)}
                        onNext={() => setSheetIdx(p => p !== null && p < annotations.length - 1 ? p + 1 : p)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
