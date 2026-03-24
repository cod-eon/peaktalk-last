"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Zap, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft,
    BarChart2, Sparkles, Copy, Download, Check, X, MessageSquare, MousePointer2,
} from 'lucide-react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

type IssueType   = 'logic' | 'style' | 'clarity' | 'grammar';
type Severity    = 'high' | 'medium' | 'low';
type MobileTab   = 'text' | 'issues' | 'improved';
type DesktopView = 'text' | 'ai';
type Segment     = { text: string; ann?: Annotation; idx?: number };

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

const ISSUE: Record<IssueType, { label: string; pill: string; bg: string; bgHover: string }> = {
    logic:   { label: 'Логика',     pill: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  bgHover: 'rgba(59,130,246,0.20)' },
    clarity: { label: 'Ясность',    pill: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', bgHover: 'rgba(139,92,246,0.20)' },
    style:   { label: 'Стиль',      pill: '#f59e0b', bg: 'rgba(245,158,11,0.08)', bgHover: 'rgba(245,158,11,0.20)' },
    grammar: { label: 'Грамматика', pill: '#ef4444', bg: 'rgba(239,68,68,0.08)',  bgHover: 'rgba(239,68,68,0.20)'  },
};

const SEV: Record<Severity, { label: string; bg: string; color: string }> = {
    high:   { label: 'Критично',      bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
    medium: { label: 'Важно',         bg: 'rgba(251,146,60,0.15)',  color: '#fb923c' },
    low:    { label: 'Незначительно', bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function pl(n: number, one: string, few: string, many: string) {
    const m10 = n % 10, m100 = n % 100;
    if (m100 >= 11 && m100 <= 19) return many;
    if (m10 === 1) return one;
    if (m10 >= 2 && m10 <= 4) return few;
    return many;
}

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

// ── ScoreRing ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
    const sw = 5, r = (size - sw) / 2, c = 2 * Math.PI * r;
    const color = score >= 7 ? '#10b981' : score >= 5 ? '#fbbf24' : '#ef4444';
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-surface)" strokeWidth={sw} />
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

// ── FilterPills ────────────────────────────────────────────────────────────────

function FilterPills({ annotations, activeFilter, onFilter }: {
    annotations: Annotation[];
    activeFilter: IssueType | null;
    onFilter: (type: IssueType | null) => void;
}) {
    const countByType = useMemo(() => annotations.reduce<Record<string, number>>(
        (a, ann) => ({ ...a, [ann.issue_type]: (a[ann.issue_type] ?? 0) + 1 }), {}
    ), [annotations]);
    return (
        <div className="flex flex-wrap gap-1.5">
            <button onClick={() => onFilter(null)}
                className={`text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    !activeFilter
                        ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                        : 'border-[var(--border-main)] text-[var(--text-dim)] bg-[var(--bg-surface-alt)] hover:text-[var(--text-muted)]'
                }`}>
                Все · {annotations.length}
            </button>
            {(['grammar','logic','clarity','style'] as IssueType[]).map(type => {
                const count = countByType[type] ?? 0;
                if (!count) return null;
                const c = ISSUE[type]; const isA = activeFilter === type;
                return (
                    <button key={type}
                        onClick={() => onFilter(activeFilter === type ? null : type)}
                        className="text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer"
                        style={{
                            backgroundColor: isA ? c.pill : 'var(--bg-surface-alt)',
                            borderColor: isA ? c.pill : 'var(--border-main)',
                            color: isA ? '#fff' : 'var(--text-dim)',
                        }}>
                        {c.label} · {count}
                    </button>
                );
            })}
        </div>
    );
}

// ── IssueCard (mobile issues tab) ──────────────────────────────────────────────

const IssueCard = React.forwardRef<HTMLButtonElement, {
    ann: Annotation; realIdx: number;
    isHovered: boolean; isActive: boolean;
    onMouseEnter: () => void; onMouseLeave: () => void;
    onClick: () => void;
}>(function IssueCard({ ann, realIdx, isHovered, isActive, onMouseEnter, onMouseLeave, onClick }, ref) {
    const c = ISSUE[ann.issue_type];
    const sev = SEV[ann.severity];
    const hi = isHovered || isActive;
    return (
        <button ref={ref}
            className="w-full text-left rounded-xl transition-all cursor-pointer"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderLeftWidth: '4px',
                borderLeftColor: c.pill,
                borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0,
                boxShadow: hi
                    ? `0 0 0 1px ${c.pill}40, 0 4px 12px rgba(0,0,0,0.15)`
                    : '0 1px 3px rgba(0,0,0,0.1)',
                padding: '16px',
                scrollMarginTop: '8px',
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}>
            <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${c.pill}15`, color: c.pill }}>{c.label}</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: sev.bg, color: sev.color }}>{sev.label}</span>
                <span className="ml-auto text-[10px] font-mono text-[var(--text-dim)]">#{realIdx + 1}</span>
            </div>
            <div className="rounded px-2.5 py-2 mb-2.5"
                style={{ backgroundColor: 'var(--bg-surface)', borderLeft: `2px solid ${c.pill}50` }}>
                <p className="text-[11px] font-mono italic leading-relaxed text-[var(--text-main)] line-clamp-2">
                    «{ann.text}»
                </p>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">
                {ann.comment}
            </p>
        </button>
    );
});

// ── Desktop Summary Panel ──────────────────────────────────────────────────────

function SummaryPanel({ fb, annotations, scoreLabel, scoreColor, activeFilter, onFilter }: {
    fb: AnalysisFeedback;
    annotations: Annotation[];
    scoreLabel: string;
    scoreColor: string;
    activeFilter: IssueType | null;
    onFilter: (t: IssueType | null) => void;
}) {
    const total = annotations.length;
    const micro = total === 0
        ? 'Замечаний не найдено — текст полностью готов к выступлению.'
        : `AI обнаружил ${total} ${pl(total, 'замечание', 'замечания', 'замечаний')} — кликните подчёркнутый фрагмент слева для разбора.`;

    return (
        <div className="h-full flex flex-col">
            {/* Score hero */}
            <div className="flex flex-col items-center gap-3 px-5 pt-6 pb-5 border-b border-[var(--border-main)]">
                <ScoreRing score={fb.overall_score} size={88} />
                <div className="text-center">
                    <p className="font-syne font-bold text-[18px] leading-tight mb-1.5" style={{ color: scoreColor }}>
                        {scoreLabel}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed max-w-[220px]">
                        {micro}
                    </p>
                </div>
            </div>

            {/* Filter pills */}
            {total > 0 && (
                <div className="px-4 pt-4 pb-2 shrink-0">
                    <FilterPills annotations={annotations} activeFilter={activeFilter} onFilter={onFilter} />
                </div>
            )}

            {/* CTA placeholder — дышащий пустой стейт */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-3 mt-2">
                {total === 0 ? (
                    <>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
                            <CheckCircle2 size={22} className="text-emerald-400" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm text-[var(--text-dim)] font-inter text-center leading-relaxed">
                            Отличная работа!
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--bg-surface)' }}>
                            <MousePointer2 size={20} className="text-[var(--text-dim)]" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm text-[var(--text-dim)] font-inter leading-relaxed text-center max-w-[180px]">
                            Кликните на любой подчёркнутый фрагмент в тексте, чтобы увидеть детальный разбор и советы
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Desktop Detail Panel ───────────────────────────────────────────────────────

function DetailPanel({ ann, idx, total, onClose, onPrev, onNext }: {
    ann: Annotation; idx: number; total: number;
    onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
    const c = ISSUE[ann.issue_type];
    const sev = SEV[ann.severity];
    return (
        <div className="h-full flex flex-col">
            {/* Header row */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border-main)]">
                <button onClick={onClose}
                    className="flex items-center gap-1.5 text-[12px] font-mono px-3 py-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-all cursor-pointer">
                    <ArrowLeft size={12} /> К сводке
                </button>
                <div className="flex items-center gap-1">
                    <button onClick={onPrev} disabled={idx === 0}
                        className="p-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-md">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[11px] font-mono text-[var(--text-dim)] px-1">{idx + 1} / {total}</span>
                    <button onClick={onNext} disabled={idx === total - 1}
                        className="p-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-md">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
                {/* Category + severity badges */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${c.pill}20`, color: c.pill }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.pill }} />
                        {c.label}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: sev.bg, color: sev.color }}>{sev.label}</span>
                </div>

                {/* Quote */}
                <div className="rounded-xl px-4 py-4 mb-5"
                    style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: `1px solid ${c.pill}25`,
                        borderLeftWidth: '4px',
                        borderLeftColor: c.pill,
                    }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest mb-2"
                        style={{ color: c.pill }}>Фрагмент</p>
                    <p className="text-[13px] font-mono italic leading-relaxed text-[var(--text-main)]">
                        «{ann.text}»
                    </p>
                </div>

                {/* Full comment — never truncated */}
                <p className="text-[14px] text-[var(--text-muted)] font-inter leading-[1.9]">
                    {ann.comment}
                </p>
            </div>
        </div>
    );
}

// ── AnnotationSheet (mobile only) ─────────────────────────────────────────────

function AnnotationSheet({ ann, idx, total, onClose, onPrev, onNext }: {
    ann: Annotation; idx: number; total: number;
    onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
    const c = ISSUE[ann.issue_type];
    const sev = SEV[ann.severity];
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)] rounded-t-[24px] border-t border-[var(--border-main)] shadow-2xl"
                style={{ maxWidth: '680px', margin: '0 auto' }}>
                <div className="flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
                    <div className="w-10 h-1 rounded-full bg-[var(--border-main)]" />
                </div>
                <div className="px-5 pb-10 pt-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: `${c.pill}20`, color: c.pill }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.pill }} />
                                {c.label}
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: sev.bg, color: sev.color }}>{sev.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-mono text-[var(--text-dim)] px-1">{idx + 1}/{total}</span>
                            <button onClick={onPrev} disabled={idx === 0}
                                className="p-1 text-[var(--text-dim)] hover:text-[var(--text-main)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                <ChevronLeft size={15} />
                            </button>
                            <button onClick={onNext} disabled={idx === total - 1}
                                className="p-1 text-[var(--text-dim)] hover:text-[var(--text-main)] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                <ChevronRight size={15} />
                            </button>
                            <button onClick={onClose} className="p-1 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors cursor-pointer">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="rounded-[var(--radius-md)] px-4 py-3 mb-4 bg-[var(--bg-surface)]"
                        style={{ borderLeft: `3px solid ${c.pill}` }}>
                        <p className="text-[13px] font-mono italic leading-relaxed text-[var(--text-main)]">«{ann.text}»</p>
                    </div>
                    <p className="text-[15px] text-[var(--text-muted)] font-inter leading-[1.75] mb-6">{ann.comment}</p>
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

// ── AnnotatedText ──────────────────────────────────────────────────────────────

function AnnotatedText({ text, annotations, activeIdx, hoveredIdx, activeFilter, spotlight, onTap, onHover, onLeave, onEmpty }: {
    text: string; annotations: Annotation[];
    activeIdx: number | null; hoveredIdx: number | null;
    activeFilter: IssueType | null;
    spotlight: boolean;
    onTap: (idx: number) => void;
    onHover: (idx: number) => void;
    onLeave: () => void;
    onEmpty: () => void;
}) {
    const segments = useMemo(() => buildSegments(text, annotations), [text, annotations]);
    return (
        <div
            className="font-inter text-[18px] leading-[1.75] text-[var(--text-muted)] whitespace-pre-wrap break-words"
            onClick={onEmpty}
        >
            {segments.map((seg, i) => {
                if (!seg.ann || seg.idx === undefined) {
                    return (
                        <span key={i} style={{ transition: 'opacity 0.3s', opacity: spotlight ? 0.4 : 1 }}>
                            {seg.text}
                        </span>
                    );
                }
                const c = ISSUE[seg.ann.issue_type];
                const isFiltered = !activeFilter || seg.ann.issue_type === activeFilter;
                if (!isFiltered) {
                    return (
                        <span key={i} style={{ opacity: spotlight ? 0.3 : 1, transition: 'opacity 0.3s' }}>
                            {seg.text}
                        </span>
                    );
                }
                const isActive  = activeIdx === seg.idx;
                const isHovered = hoveredIdx === seg.idx;
                const dimmed    = spotlight && !isActive;
                return (
                    <span key={i}
                        data-ann-idx={seg.idx}
                        onClick={(e) => { e.stopPropagation(); onTap(seg.idx!); }}
                        onMouseEnter={() => onHover(seg.idx!)}
                        onMouseLeave={onLeave}
                        style={{
                            textDecoration: 'underline',
                            textDecorationStyle: 'wavy',
                            textDecorationColor: isActive ? 'transparent' : c.pill,
                            textDecorationThickness: '2px',
                            textUnderlineOffset: '4px',
                            backgroundColor: isActive ? c.bgHover : 'transparent',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            padding: isActive ? '1px 3px' : '1px 0',
                            color: isActive ? '#111827' : 'inherit',
                            opacity: dimmed ? 0.4 : 1,
                            transition: 'background-color 0.15s, opacity 0.3s, color 0.15s',
                        }}>
                        {seg.text}
                    </span>
                );
            })}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
    const params  = useParams();
    const router  = useRouter();
    const draftId = params.id as string;

    const [mobileTab,    setMobileTab]    = useState<MobileTab>('text');
    const [desktopView,  setDesktopView]  = useState<DesktopView>('text');
    const [sheetIdx,     setSheetIdx]     = useState<number | null>(null);
    const [activeFilter, setActiveFilter] = useState<IssueType | null>(null);
    const [hoveredIdx,   setHoveredIdx]   = useState<number | null>(null);
    const [isDesktop,    setIsDesktop]    = useState(false);

    const leftColRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Scroll left column so active annotation is centered
    useEffect(() => {
        if (!isDesktop || sheetIdx === null || !leftColRef.current) return;
        const span = leftColRef.current.querySelector(`[data-ann-idx="${sheetIdx}"]`);
        if (span) span.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [sheetIdx, isDesktop]);

    // ESC closes detail panel
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetIdx(null); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    const { data: draft, isLoading, isError } = useQuery<Draft>({
        queryKey: ['draft', draftId],
        queryFn:  () => api.get(`/drafts/${draftId}`),
        enabled:  !!draftId,
    });

    const handleTap   = useCallback((idx: number) => setSheetIdx(idx), []);
    const closeSheet  = useCallback(() => setSheetIdx(null), []);
    const handleHover = useCallback((idx: number) => setHoveredIdx(idx), []);
    const handleLeave = useCallback(() => setHoveredIdx(null), []);

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-6 h-6 border-2 border-[var(--border-light)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
        </div>
    );
    if (isError || !draft) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle size={32} className="text-red-400" strokeWidth={1.5} />
            <p className="text-[14px] text-[var(--text-muted)] font-inter">Материал не найден</p>
            <button onClick={() => router.back()} className="btn-secondary text-sm gap-2"><ArrowLeft size={14} /> Назад</button>
        </div>
    );

    const analysis = draft.analysis_result;
    const fb       = analysis?.feedback_json;

    if (!analysis || !fb) return (
        <div className="w-full py-8 pb-16">
            <div className="max-w-2xl mx-auto px-4">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors mb-5 cursor-pointer group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[12px] font-inter">Назад</span>
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
        : fb.overall_score >= 4 ? 'Требует доработки' : 'Нужна переработка';
    const scoreColor = fb.overall_score >= 7 ? '#10b981' : fb.overall_score >= 5 ? '#fbbf24' : '#ef4444';

    const filteredAnnotations = activeFilter
        ? annotations.filter(a => a.issue_type === activeFilter)
        : annotations;

    const mobileTabs = [
        { id: 'text'     as MobileTab, label: 'Текст',     badge: annotations.length },
        { id: 'issues'   as MobileTab, label: 'Разбор',    badge: null },
        { id: 'improved' as MobileTab, label: 'AI версия', badge: null, icon: true },
    ];

    // ── Desktop header: Back + Title + Simulation (score & toggle moved out) ──
    const DesktopHeader = () => (
        <header className="shrink-0 border-b border-[var(--border-main)] bg-[var(--bg-main)] z-10">
            <div className="h-14 flex items-center gap-3 px-6">
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors cursor-pointer group shrink-0">
                    <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[13px] font-inter">Назад</span>
                </button>
                <h1 className="flex-1 min-w-0 font-syne text-[14px] font-semibold text-[var(--text-main)] truncate">
                    {draft.title}
                </h1>
                <Link href={`/simulation?draft=${draftId}`} className="btn-primary gap-1.5 shrink-0">
                    <Zap size={13} /> Симуляция
                </Link>
            </div>
        </header>
    );

    // ── iOS segmented control (above text in left column) ─────────────────────
    const TextAiToggle = () => (
        <div className="inline-flex items-center gap-0.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg p-0.5">
            <button onClick={() => setDesktopView('text')}
                className={`text-[11px] font-mono px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    desktopView === 'text'
                        ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm'
                        : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'
                }`}>Текст</button>
            <button onClick={() => setDesktopView('ai')}
                className={`flex items-center gap-1 text-[11px] font-mono px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    desktopView === 'ai'
                        ? 'bg-[var(--bg-card)] text-[var(--color-ai)] shadow-sm'
                        : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'
                }`}>
                <Sparkles size={9} /> AI версия
            </button>
        </div>
    );

    return (
        <>
            {/* ══════════════════════════════════════════════════════════════
                DESKTOP (lg+): fixed-height, independent scroll columns
            ══════════════════════════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:flex-col h-screen overflow-hidden">

                <DesktopHeader />

                <div className="flex-1 grid grid-cols-[1fr_400px] min-h-0 overflow-hidden">

                    {/* LEFT: scrollable text */}
                    <div ref={leftColRef} className="overflow-y-auto">
                        <div className="max-w-3xl mx-auto px-8 py-6">

                            {/* Toggle + hint */}
                            <div className="flex items-center justify-between mb-6">
                                <TextAiToggle />
                                {annotations.length > 0 && desktopView === 'text' && (
                                    <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-dim)] font-inter">
                                        <MessageSquare size={12} className="shrink-0" />
                                        Кликните подчёркнутый фрагмент
                                    </p>
                                )}
                            </div>

                            <AnimatePresence mode="wait">
                                {desktopView === 'text' ? (
                                    <motion.div key="d-text"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}>
                                        <AnnotatedText
                                            text={textContent} annotations={annotations}
                                            activeIdx={sheetIdx} hoveredIdx={hoveredIdx}
                                            activeFilter={activeFilter}
                                            spotlight={sheetIdx !== null}
                                            onTap={handleTap} onHover={handleHover} onLeave={handleLeave}
                                            onEmpty={closeSheet}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div key="d-ai"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}>
                                        <div className="flex items-start gap-2.5 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-ai-bg)]/25 border border-[var(--color-ai)]/20 mb-4">
                                            <Sparkles size={14} className="text-[var(--color-ai)] shrink-0 mt-0.5" />
                                            <p className="text-[12px] text-[var(--color-ai)] font-inter leading-relaxed">
                                                AI переписал текст, сохранив ваш голос — улучшена структура, аргументация и ясность
                                            </p>
                                        </div>
                                        <div className="flex gap-2 mb-5">
                                            <CopyButton text={analysis.improved_text} />
                                            <DownloadButton text={analysis.improved_text} title={draft.title} />
                                        </div>
                                        <p className="font-inter text-[18px] leading-[1.75] text-[var(--text-muted)] whitespace-pre-wrap break-words">
                                            {analysis.improved_text}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RIGHT: contextual sidebar — Summary or Detail */}
                    <div className="flex flex-col min-h-0 border-l border-[var(--border-main)] overflow-hidden">
                        <AnimatePresence mode="wait">
                            {sheetIdx === null ? (
                                <motion.div
                                    key="summary"
                                    className="flex-1 min-h-0 overflow-hidden"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}>
                                    <SummaryPanel
                                        fb={fb}
                                        annotations={annotations}
                                        scoreLabel={scoreLabel}
                                        scoreColor={scoreColor}
                                        activeFilter={activeFilter}
                                        onFilter={setActiveFilter}
                                    />
                                </motion.div>
                            ) : (
                                annotations[sheetIdx] && (
                                    <motion.div
                                        key={`detail-${sheetIdx}`}
                                        className="flex-1 min-h-0 overflow-hidden"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                                        <DetailPanel
                                            ann={annotations[sheetIdx]}
                                            idx={sheetIdx}
                                            total={annotations.length}
                                            onClose={closeSheet}
                                            onPrev={() => setSheetIdx(p => p !== null && p > 0 ? p - 1 : p)}
                                            onNext={() => setSheetIdx(p => p !== null && p < annotations.length - 1 ? p + 1 : p)}
                                        />
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MOBILE (< lg): normal scroll, sticky header, tabs
            ══════════════════════════════════════════════════════════════ */}
            <div className="lg:hidden min-h-screen pb-24">

                <header className="sticky top-0 z-30 bg-[var(--bg-main)]/95 backdrop-blur-md border-b border-[var(--border-main)]">
                    <div className="h-14 flex items-center gap-2 px-4">
                        <button onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors cursor-pointer group shrink-0">
                            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <h1 className="flex-1 min-w-0 font-syne text-[13px] font-semibold text-[var(--text-main)] truncate">
                            {draft.title}
                        </h1>
                        <span className="text-[13px] font-syne font-bold shrink-0" style={{ color: scoreColor }}>{fb.overall_score}/10</span>
                        <Link href={`/simulation?draft=${draftId}`} className="btn-primary gap-1.5 text-[12px] py-1.5 px-3 shrink-0">
                            <Zap size={12} />
                        </Link>
                    </div>
                </header>

                <div className="px-4 pt-4">
                    {/* Mobile score card */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                        className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <ScoreRing score={fb.overall_score} size={52} />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-mono text-[var(--text-dim)] mb-0.5">Разбор материала</p>
                                <p className="text-[13px] font-syne font-semibold" style={{ color: scoreColor }}>{scoreLabel}</p>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {(['grammar','logic','clarity','style'] as IssueType[]).map(type => {
                                        const cnt = countByType[type] ?? 0;
                                        if (!cnt) return null;
                                        const c = ISSUE[type];
                                        return (
                                            <div key={type} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono"
                                                style={{ backgroundColor: `${c.pill}15`, color: c.pill }}>
                                                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: c.pill }} />
                                                {c.label} {cnt}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tab bar */}
                    <div className="flex bg-[var(--bg-surface-alt)] rounded-[var(--radius-md)] border border-[var(--border-main)] p-1 mb-5">
                        {mobileTabs.map(tab => (
                            <button key={tab.id} onClick={() => setMobileTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-sm)] text-[12px] font-mono transition-all cursor-pointer ${
                                    mobileTab === tab.id ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-dim)]'
                                }`}>
                                {tab.icon && <Sparkles size={10} className={mobileTab === tab.id ? 'text-[var(--color-ai)]' : ''} />}
                                {tab.label}
                                {tab.badge !== null && tab.badge > 0 && (
                                    <span className={`text-[9px] px-1.5 py-px rounded-full font-bold ${
                                        mobileTab === tab.id ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-main)] text-[var(--text-dim)]'
                                    }`}>{tab.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {mobileTab === 'text' && (
                            <motion.div key="m-text"
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}>
                                {annotations.length > 0 && (
                                    <>
                                        <FilterPills annotations={annotations} activeFilter={activeFilter} onFilter={setActiveFilter} />
                                        <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-dim)] font-inter mt-3 mb-4">
                                            <MessageSquare size={12} className="shrink-0" />
                                            Нажмите на подчёркнутый фрагмент
                                        </p>
                                    </>
                                )}
                                <AnnotatedText text={textContent} annotations={annotations}
                                    activeIdx={sheetIdx} hoveredIdx={null} activeFilter={activeFilter}
                                    spotlight={false}
                                    onTap={handleTap} onHover={() => {}} onLeave={() => {}} onEmpty={() => {}} />
                            </motion.div>
                        )}

                        {mobileTab === 'issues' && (
                            <motion.div key="m-issues"
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}>
                                <div className="space-y-4">
                                    {annotations.length > 0 && (
                                        <FilterPills annotations={annotations} activeFilter={activeFilter} onFilter={setActiveFilter} />
                                    )}
                                    <div className="space-y-2.5">
                                        {filteredAnnotations.map((ann) => {
                                            const realIdx = annotations.indexOf(ann);
                                            return (
                                                <IssueCard key={realIdx} ann={ann} realIdx={realIdx}
                                                    isHovered={false} isActive={false}
                                                    onMouseEnter={() => {}} onMouseLeave={() => {}}
                                                    onClick={() => { setMobileTab('text'); setTimeout(() => handleTap(realIdx), 250); }} />
                                            );
                                        })}
                                    </div>
                                    <div>
                                        <p className="font-syne text-[13px] font-semibold text-[var(--text-main)] mb-2.5">Оценка по критериям</p>
                                        <div className="space-y-2">
                                            {categories.map(({ key, label, text }) => {
                                                const c = ISSUE[key]; const cnt = countByType[key] ?? 0;
                                                return (
                                                    <div key={key} className="rounded-xl p-3.5"
                                                        style={{
                                                            backgroundColor: 'var(--bg-card)',
                                                            borderLeftWidth: '4px',
                                                            borderLeftColor: c.pill,
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                        }}>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-[11px] font-mono uppercase tracking-wider font-bold" style={{ color: c.pill }}>{label}</span>
                                                            {cnt > 0 && (
                                                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                                                                    style={{ backgroundColor: `${c.pill}20`, color: c.pill }}>
                                                                    {cnt} {cnt === 1 ? 'проблема' : 'проблемы'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[12px] text-[var(--text-muted)] font-inter leading-relaxed">{text}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {mobileTab === 'improved' && (
                            <motion.div key="m-ai"
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}>
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
            </div>

            {/* Bottom sheet — mobile only */}
            {!isDesktop && (
                <AnimatePresence>
                    {sheetIdx !== null && annotations[sheetIdx] && (
                        <AnnotationSheet ann={annotations[sheetIdx]} idx={sheetIdx} total={annotations.length}
                            onClose={closeSheet}
                            onPrev={() => setSheetIdx(p => p !== null && p > 0 ? p - 1 : p)}
                            onNext={() => setSheetIdx(p => p !== null && p < annotations.length - 1 ? p + 1 : p)}
                        />
                    )}
                </AnimatePresence>
            )}
        </>
    );
}
