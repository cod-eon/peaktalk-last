'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, CheckCircle2, ShieldAlert, TrendingDown,
    Download, ArrowLeft, Zap, FileText, BarChart2,
    ChevronDown,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────

type SkillMetric = {
    metric_name: string;
    score: number; // 0.0–1.0
    comment: string | null;
};

type Message = {
    role: 'user' | 'assistant';
    content: string;
    turn_index: number;
};

type PersonaConfig = {
    role: string;
    industry: string;
    difficulty: number;
};

type ReportData = {
    id: string;
    persona_config: PersonaConfig;
    status: string;
    messages: Message[];
    skill_metrics: SkillMetric[];
    completed_at: string | null;
    document_title: string | null;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const PERSONA_LABELS: Record<string, string> = {
    supervisor: 'Научный руководитель',
    reviewer: 'Придирчивый рецензент',
    peer: 'Однокурсник-скептик',
    tech_lead: 'Тимлид / Principal Engineer',
    hr: 'HR-менеджер',
    senior_dev: 'Старший разработчик',
    investor: 'Венчурный инвестор',
    partner: 'Корпоративный партнёр',
    customer: 'Потенциальный клиент',
    board: 'Совет директоров',
    subordinate: 'Скептичный подчинённый',
    journalist: 'Журналист',
    audience: 'Общая аудитория',
    moderator: 'Модератор дискуссии',
    listener: 'Скептик из зала',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getScoreColor(score01: number): string {
    if (score01 >= 0.7) return '#10b981';
    if (score01 >= 0.5) return '#fbbf24';
    return '#e11d48';
}

function getIntColor(score10: number): string {
    if (score10 >= 7) return '#10b981';
    if (score10 >= 5) return '#fbbf24';
    return '#e11d48';
}

// ── ScoreIcon ──────────────────────────────────────────────────────────────────

function ScoreIcon({ score }: { score: number }) {
    const color = getScoreColor(score);
    if (score >= 0.7) return <CheckCircle2 size={14} style={{ color }} className="shrink-0" />;
    if (score >= 0.5) return <ShieldAlert size={14} style={{ color }} className="shrink-0" />;
    return <TrendingDown size={14} style={{ color }} className="shrink-0" />;
}

// ── ScoreRing ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
    const sw = 9;
    const r = (size - sw) / 2;
    const c = 2 * Math.PI * r;
    const color = getIntColor(score);
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="#F3F4F6" strokeWidth={sw}
                />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={color}
                    strokeWidth={sw} strokeLinecap="round" strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: c - (score / 10) * c }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 leading-none">{score}</span>
                <span className="text-xs text-gray-400 mt-0.5">/10</span>
            </div>
        </div>
    );
}

// ── AnimatedBar ────────────────────────────────────────────────────────────────

function AnimatedBar({
    value,
    color,
    delay = 0,
}: {
    value: number;
    color: string;
    delay?: number;
}) {
    return (
        <div className="w-full h-[3px] bg-[var(--bg-main)] rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value * 100}%` }}
                transition={{ duration: 0.55, delay, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
            />
        </div>
    );
}

// ── AccordionItem ──────────────────────────────────────────────────────────────

type AccordionItemProps = {
    metric: SkillMetric;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
};

function AccordionItem({ metric, index, isOpen, onToggle }: AccordionItemProps) {
    const color = getScoreColor(metric.score);
    const score10 = Math.round(metric.score * 10);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.05 }}
            className="mb-3 last:mb-0"
        >
            <div
                onClick={onToggle}
                role="button"
                aria-expanded={isOpen}
                className={`border border-gray-200 rounded-xl shadow-sm cursor-pointer transition-all ${
                    isOpen
                        ? 'bg-gray-50/50 border-gray-300'
                        : 'bg-white hover:border-gray-300'
                }`}
            >
                {/* Header row */}
                <div className="flex items-center justify-between p-4 gap-3">
                    <span className="font-semibold text-gray-800 text-sm leading-snug flex-1 truncate">
                        {metric.metric_name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md text-xs font-bold">
                            {score10}/10
                        </span>
                        <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-gray-400"
                        >
                            <ChevronDown size={14} />
                        </motion.span>
                    </div>
                </div>

                {/* Expandable content */}
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="px-4 pb-4 pt-0 flex flex-col gap-3">
                                <AnimatedBar value={metric.score} color={color} delay={0.05} />
                                {metric.comment && (
                                    <p className="text-[12.5px] leading-relaxed font-inter italic text-gray-500 border-l-2 border-gray-300 pl-3">
                                        {metric.comment}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ── ChatMessage ────────────────────────────────────────────────────────────────

type ChatMessageProps = {
    msg: Message;
    idx: number;
    personaName: string;
    isHighlighted: boolean;
};

function ChatMessage({ msg, idx, personaName, isHighlighted }: ChatMessageProps) {
    const isUser = msg.role === 'user';

    return (
        <motion.div
            id={`message-${msg.turn_index}`}
            className={`flex flex-col gap-1 mb-6 ${isUser ? 'items-end' : 'items-start'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={
                isHighlighted
                    ? {
                          opacity: 1,
                          y: 0,
                          scale: [1, 1.02, 1],
                          boxShadow: [
                              'none',
                              '0 0 0 3px rgba(245,158,11,0.35)',
                              'none',
                          ],
                      }
                    : { opacity: 1, y: 0, scale: 1, boxShadow: 'none' }
            }
            transition={
                isHighlighted
                    ? { duration: 0.4, ease: 'easeInOut' }
                    : { duration: 0.3, delay: idx * 0.06 }
            }
            style={{ borderRadius: 12 }}
        >
            {/* Name outside bubble */}
            <span className={`text-[11px] font-medium text-gray-400 uppercase tracking-wider ${isUser ? 'mr-3' : 'ml-3'}`}>
                {isUser ? 'Вы' : personaName}
            </span>
            {/* Bubble */}
            <div className={`max-w-[85%] sm:max-w-xl px-5 py-3.5 shadow-sm ${
                isUser
                    ? 'bg-[#FFF4ED] border border-orange-100 rounded-2xl rounded-tr-sm text-gray-900'
                    : 'bg-white border border-gray-100 rounded-2xl rounded-tl-sm text-gray-800'
            }`}>
                <p className="text-[15px] leading-relaxed font-inter">
                    {msg.content}
                </p>
            </div>
        </motion.div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SimulationReportPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // On desktop show panel by default
    useEffect(() => {
        if (window.matchMedia('(min-width: 768px)').matches) {
            setShowRightPanel(true);
        }
    }, []);

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await api.get(`/simulation/${sessionId}/report`);
                setReport(res);
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Ошибка загрузки отчёта');
                router.push(`/simulation/${sessionId}`);
            } finally {
                setLoading(false);
            }
        }
        if (sessionId) fetchReport();
    }, [sessionId, router]);

    // Clear highlight timer on unmount
    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        };
    }, []);

    const handleAccordionToggle = useCallback(
        (idx: number, messages: Message[]) => {
            const isClosing = openIndex === idx;

            if (isClosing) {
                setOpenIndex(null);
                setHighlightedId(null);
                if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                return;
            }

            setOpenIndex(idx);

            // Scroll & highlight corresponding user message
            const userMessages = messages.filter((m) => m.role === 'user');
            const targetIdx = Math.min(idx, userMessages.length - 1);
            const targetMsg = userMessages[targetIdx];

            if (targetMsg) {
                document
                    .getElementById(`message-${targetMsg.turn_index}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

                if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                setHighlightedId(targetMsg.turn_index);
                highlightTimerRef.current = setTimeout(() => {
                    setHighlightedId(null);
                }, 1500);
            }
        },
        [openIndex],
    );

    const handleDownloadPdf = useCallback(() => {
        const existing = document.getElementById('_pdf_print_style');
        if (existing) existing.remove();
        const style = document.createElement('style');
        style.id = '_pdf_print_style';
        style.textContent = `
            @media print {
                body * { visibility: hidden !important; }
                #print-report {
                    visibility: visible !important; display: block !important;
                    position: fixed !important; inset: 0 !important;
                    background: white !important; padding: 48px !important;
                    z-index: 99999 !important; overflow: visible !important;
                }
                #print-report * { visibility: visible !important; }
            }
        `;
        document.head.appendChild(style);
        window.print();
        window.addEventListener(
            'afterprint',
            () => document.getElementById('_pdf_print_style')?.remove(),
            { once: true },
        );
    }, []);

    // ── Loading ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-[var(--border-light)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    <span className="text-[13px] font-inter text-[var(--text-dim)]">
                        Загрузка отчёта...
                    </span>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <p className="text-[13px] text-[var(--text-muted)] font-inter">
                    Отчёт не найден
                </p>
            </div>
        );
    }

    // ── Derived ────────────────────────────────────────────────────────────────

    const { persona_config, messages, skill_metrics, document_title } = report;

    const overallScoreFloat = skill_metrics?.length
        ? skill_metrics.reduce((acc, m) => acc + m.score, 0) / skill_metrics.length
        : 0;
    const overallScore = Math.round(overallScoreFloat * 10);
    const overallColor = getIntColor(overallScore);
    const personaName =
        PERSONA_LABELS[persona_config?.role] || persona_config?.role || 'Тренер';

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            {/* ── Printable version ─────────────────────────────────────────── */}
            <div id="print-report" style={{ display: 'none' }} className="font-inter text-black bg-white">
                <div style={{ borderBottom: '2px solid black', paddingBottom: 16, marginBottom: 24 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 4 }}>
                        Отчёт по симуляции PeakTalk
                    </h1>
                    <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                        Персона: {personaName} · Средний балл: {overallScore}/10
                        {document_title ? ` · Контекст: ${document_title}` : ''}
                    </p>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                    Оценка навыков
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 32 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #ccc' }}>
                            <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 600 }}>Навык</th>
                            <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 600, width: 80 }}>Балл</th>
                            <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 600 }}>Комментарий</th>
                        </tr>
                    </thead>
                    <tbody>
                        {skill_metrics.map((m) => (
                            <tr key={m.metric_name} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '6px 12px 6px 0', fontWeight: 500 }}>{m.metric_name}</td>
                                <td style={{ padding: '6px 12px 6px 0' }}>{Math.round(m.score * 10)}/10</td>
                                <td style={{ padding: '6px 0', color: '#666' }}>{m.comment || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Транскрипт</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                paddingLeft: msg.role === 'user' ? 32 : 0,
                                paddingRight: msg.role === 'assistant' ? 32 : 0,
                            }}
                        >
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>
                                {msg.role === 'user' ? 'Вы' : personaName}
                            </div>
                            <div style={{ fontSize: 13 }}>{msg.content}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Screen version ────────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-main)]">

                {/* ── Toolbar ─────────────────────────────────────────────────── */}
                <div className="h-13 shrink-0 border-b border-[var(--border-main)] bg-[var(--bg-surface)] flex items-center justify-between px-4 sm:px-5 gap-2 sticky top-0 z-10">

                    {/* Left side */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.push('/simulation')}
                            className="flex items-center gap-1 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors shrink-0"
                            aria-label="Назад"
                        >
                            <ArrowLeft size={14} />
                        </button>
                        <div className="hidden sm:block h-4 w-px bg-[var(--border-main)]" />
                        <div className="flex items-center gap-2 min-w-0">
                            <Zap size={14} className="text-[var(--accent-primary)] shrink-0" />
                            <span className="text-[13px] font-medium font-inter text-[var(--text-main)] truncate">
                                Отчёт симуляции
                            </span>
                            <span className="hidden sm:inline text-[11px] text-[var(--text-dim)] font-mono truncate">
                                · {personaName}
                            </span>
                        </div>
                        {/* Score pill */}
                        <div
                            className="hidden sm:flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0"
                            style={{ color: overallColor, backgroundColor: `${overallColor}1a` }}
                        >
                            {overallScore}/10
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Mobile metrics toggle */}
                        <button
                            className="md:hidden flex items-center gap-1.5 border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-inter transition-colors"
                            onClick={() => setShowRightPanel((v) => !v)}
                            aria-label="Показать метрики"
                        >
                            <BarChart2 size={13} />
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-1.5 border border-[var(--border-main)] hover:border-[var(--accent-primary)]/40 text-[var(--text-dim)] hover:text-[var(--accent-primary)] px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-inter transition-colors"
                            aria-label="Скачать PDF"
                        >
                            <Download size={13} />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            className="btn-secondary px-3 py-1.5 text-[12px]"
                            onClick={() => router.push('/dashboard')}
                        >
                            Дашборд
                        </button>
                    </div>
                </div>

                {/* ── Main content area ──────────────────────────────────────── */}
                <div className="flex flex-1 min-h-0 overflow-hidden relative">

                    {/* ── Left: Transcript ──────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-5 sm:p-8 pb-16">
                        <div className="max-w-2xl mx-auto">

                            {/* Context card */}
                            {document_title && (
                                <div className="mb-6 p-3.5 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                        <FileText size={13} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-0.5">
                                            Контекст
                                        </div>
                                        <div className="text-[12px] font-medium text-gray-700">
                                            {document_title}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-6">Транскрипт сессии</p>

                            <div className="flex flex-col">
                                {messages.map((msg, idx) => (
                                    <ChatMessage
                                        key={`${msg.turn_index}-${idx}`}
                                        msg={msg}
                                        idx={idx}
                                        personaName={personaName}
                                        isHighlighted={highlightedId === msg.turn_index}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Results panel ──────────────────────────────── */}
                    <AnimatePresence>
                        {showRightPanel && (
                            <motion.div
                                key="right-panel"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 40 }}
                                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                className="
                                    fixed md:relative
                                    right-0 top-13 md:top-0 bottom-0
                                    z-20 md:z-auto
                                    border-l border-gray-200
                                    bg-white
                                    flex flex-col
                                    shadow-lg md:shadow-none
                                    overflow-hidden
                                "
                                style={{
                                    width: 'min(420px, 42%)',
                                    minWidth: 300,
                                }}
                            >
                                {/* ── Panel header ────────────────────────── */}
                                <div className="px-5 py-5 border-b border-gray-100 shrink-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Результаты</span>
                                        <button
                                            className="md:hidden text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            onClick={() => setShowRightPanel(false)}
                                            aria-label="Закрыть панель"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {/* Score row */}
                                    <div className="flex items-center gap-4">
                                        <ScoreRing score={overallScore} size={80} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px] font-semibold text-gray-700 truncate mb-0.5">
                                                {personaName}
                                            </div>
                                            {persona_config?.industry && (
                                                <div className="text-[11px] text-gray-400 truncate">
                                                    {persona_config.industry}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Overall progress bar */}
                                    <div className="mt-4 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${overallScoreFloat * 100}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: overallColor }}
                                        />
                                    </div>
                                </div>

                                {/* ── Metrics accordion list ───────────────── */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {skill_metrics?.length > 0 ? (
                                        skill_metrics.map((metric, idx) => (
                                            <AccordionItem
                                                key={metric.metric_name}
                                                metric={metric}
                                                index={idx}
                                                isOpen={openIndex === idx}
                                                onToggle={() =>
                                                    handleAccordionToggle(idx, messages)
                                                }
                                            />
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-[12px] text-[var(--text-dim)] font-inter">
                                                Метрики не найдены
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
