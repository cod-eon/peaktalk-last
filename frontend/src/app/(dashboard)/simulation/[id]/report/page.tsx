'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Zap, FileText, Sparkles, X, Share2, RefreshCw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
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

type PopoverState = {
    metricName: string;
    comment: string;
    x: number;
    rectTop: number;
    rectBottom: number;
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

function getScoreColor(s: number) {
    if (s >= 0.7) return '#10b981';
    if (s >= 0.5) return '#f59e0b';
    return '#e11d48';
}

function buildSummary(
    personaName: string,
    metrics: SkillMetric[],
    avgScore: number,
): string[] {
    const intro =
        avgScore >= 8
            ? `Браво! ${personaName} под впечатлением. Отличная структура и мощная подача — это победа!`
            : avgScore >= 6
            ? `Хорошая попытка, ${personaName} увидел потенциал. Но местами ты «плавал(а)» — давай точечно усилим защиту.`
            : avgScore >= 4
            ? `Ты выстоял(а), но фундамент пошатнулся. ${personaName} выявил слепые зоны, требующие проработки.`
            : `Тяжело в учении — легко в бою. ${personaName} задал жару, но этот разбор поможет тебе пересобрать питч.`;

    const comments = metrics
        .filter((m) => m.comment && m.score < 0.85)
        .sort((a, b) => a.score - b.score)
        .slice(0, 2)
        .map((m) => m.comment as string);

    return [intro, ...comments].filter(Boolean);
}

// ── Markdown prose (shared) ───────────────────────────────────────────────────

const MD_COMPONENTS = {
    p: ({ children }: React.ComponentProps<'p'>) => (
        <p className="text-sm text-gray-700 leading-relaxed mt-2 first:mt-0">{children}</p>
    ),
    strong: ({ children }: React.ComponentProps<'strong'>) => (
        <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    ul: ({ children }: React.ComponentProps<'ul'>) => (
        <ul className="mt-2 space-y-1 pl-4 list-disc">{children}</ul>
    ),
    li: ({ children }: React.ComponentProps<'li'>) => (
        <li className="text-sm text-gray-700 leading-relaxed">{children}</li>
    ),
};

// ── Popover ────────────────────────────────────────────────────────────────────

function Popover({
    state,
    onClose,
}: {
    state: PopoverState;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleOutside(e: MouseEvent | TouchEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
        };
    }, [onClose]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed z-50 w-[calc(100vw-32px)] sm:w-96 bg-white shadow-xl border border-gray-100 rounded-xl p-4 sm:p-5"
            style={{
                top: state.rectBottom + 8 + 240 > window.innerHeight
                    ? Math.max(8, state.rectTop - 248)
                    : state.rectBottom + 8,
                left: Math.min(Math.max(16, state.x), window.innerWidth - Math.min(window.innerWidth - 32, 384) - 16),
            }}
        >
            <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">
                    {state.metricName}
                </span>
                <button
                    onClick={onClose}
                    className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 -mt-0.5"
                >
                    <X size={13} />
                </button>
            </div>
            <ReactMarkdown components={MD_COMPONENTS}>{state.comment}</ReactMarkdown>
        </motion.div>
    );
}

// ── UserLine (with inline highlight if metric available) ───────────────────────

function UserLine({
    msg,
    idx,
    metric,
    onPopover,
    activePopoverId,
}: {
    msg: Message;
    idx: number;
    metric: SkillMetric | null;
    onPopover: (id: number, metricName: string, comment: string, rect: DOMRect) => void;
    activePopoverId: number | null;
}) {
    const isActive = activePopoverId === msg.turn_index;
    const hasIssue = metric && metric.comment && metric.score < 0.75;
    const highlightClass = !hasIssue
        ? ''
        : metric.score < 0.45
        ? 'bg-rose-100 hover:bg-rose-200 cursor-pointer rounded px-1 transition-colors'
        : 'bg-yellow-100 hover:bg-yellow-200 cursor-pointer rounded px-1 transition-colors';

    function handleClick(e: React.MouseEvent<HTMLSpanElement>) {
        if (!hasIssue || !metric?.comment) return;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        onPopover(msg.turn_index, metric.metric_name, metric.comment, rect);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="mb-6 sm:mb-10 pl-4 sm:pl-5 border-l-2 border-accent-200"
        >
            <p className="text-sm font-semibold text-accent-500 mb-2 uppercase tracking-wide">Вы</p>
            <p className="text-[15px] sm:text-[17px] text-gray-900 leading-relaxed">
                {hasIssue ? (
                    <span
                        className={`${highlightClass} ${isActive ? 'ring-2 ring-yellow-300' : ''}`}
                        onClick={handleClick}
                    >
                        {msg.content}
                    </span>
                ) : (
                    msg.content
                )}
            </p>
        </motion.div>
    );
}

function AILine({
    msg,
    idx,
    personaName,
}: {
    msg: Message;
    idx: number;
    personaName: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="mb-6 sm:mb-10"
        >
            <p className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">{personaName}</p>
            <p className="text-[15px] sm:text-[17px] text-gray-900 leading-relaxed">{msg.content}</p>
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
    const [popover, setPopover] = useState<PopoverState | null>(null);
    const [activePopoverId, setActivePopoverId] = useState<number | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

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

    useEffect(() => {
        if (report) {
            const sum = report.skill_metrics?.reduce((acc, m) => acc + m.score, 0) || 0;
            const avg = report.skill_metrics?.length ? Math.round((sum / report.skill_metrics.length) * 10) : 0;
            if (avg >= 8) {
                setShowConfetti(true);
                const timer = setTimeout(() => setShowConfetti(false), 6000);
                return () => clearTimeout(timer);
            }
        }
    }, [report]);

    const handlePopover = useCallback(
        (id: number, metricName: string, comment: string, rect: DOMRect) => {
            if (activePopoverId === id) {
                setPopover(null);
                setActivePopoverId(null);
                return;
            }
            setPopover({ metricName, comment, x: rect.left, rectTop: rect.top, rectBottom: rect.bottom });
            setActivePopoverId(id);
        },
        [activePopoverId],
    );

    const closePopover = useCallback(() => {
        setPopover(null);
        setActivePopoverId(null);
    }, []);

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
        window.addEventListener('afterprint', () => document.getElementById('_pdf_print_style')?.remove(), { once: true });
    }, []);

    // ── Loading ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[#FAFAFA]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-accent-400 rounded-full animate-spin" />
                    <span className="text-[13px] text-gray-400">Загрузка отчёта...</span>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[#FAFAFA]">
                <p className="text-[13px] text-gray-400">Отчёт не найден</p>
            </div>
        );
    }

    // ── Derived ──────────────────────────────────────────────────────────────

    const { persona_config, messages, skill_metrics, document_title } = report;
    const personaName = PERSONA_LABELS[persona_config?.role] || persona_config?.role || 'Тренер';

    const overallScoreFloat = skill_metrics?.length
        ? skill_metrics.reduce((acc, m) => acc + m.score, 0) / skill_metrics.length
        : 0;
    const avgScore10 = Math.round(overallScoreFloat * 10);

    const summaryLines = buildSummary(personaName, skill_metrics || [], avgScore10);

    // Map each user message to a metric (distributed evenly)
    const userMessages = messages.filter((m) => m.role === 'user');
    function getMetricForUserMsg(userIdx: number): SkillMetric | null {
        if (!skill_metrics?.length) return null;
        const i = Math.floor((userIdx * skill_metrics.length) / Math.max(userMessages.length, 1));
        return skill_metrics[Math.min(i, skill_metrics.length - 1)] ?? null;
    }

    const handleShare = async () => {
        const text = `Я прошел стресс-тест в PeakTalk на ${avgScore10}/10! А ты сможешь?`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Мой результат в PeakTalk',
                    text: text,
                    url: window.location.origin
                });
            } catch (err) {
                // Ignore abort errors
            }
        } else {
            navigator.clipboard.writeText(`${text} ${window.location.origin}`);
            toast.success("Результат скопирован в буфер обмена!");
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* ── Printable ─────────────────────────────────────────────────── */}
            <div id="print-report" style={{ display: 'none' }} className="font-inter text-black bg-white">
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Отчёт по симуляции PeakTalk</h1>
                <p style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
                    {personaName} · {avgScore10}/10{document_title ? ` · ${document_title}` : ''}
                </p>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Сводка</h2>
                {summaryLines.map((l, i) => (
                    <p key={i} style={{ fontSize: 13, marginBottom: 8 }}>{l}</p>
                ))}
                <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>Транскрипт</h2>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: 16, paddingLeft: msg.role === 'user' ? 16 : 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>
                            {msg.role === 'user' ? 'Вы' : personaName}
                        </div>
                        <div style={{ fontSize: 13 }}>{msg.content}</div>
                    </div>
                ))}
            </div>

            {/* ── Screen ───────────────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#FAFAFA] relative">
                
                {/* 🎉 Confetti animation */}
                <AnimatePresence>
                    {showConfetti && (
                        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
                            {[...Array(60)].map((_, i) => (
                                <motion.div
                                    key={`confetti-${i}`}
                                    className="absolute w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-sm"
                                    style={{
                                        backgroundColor: ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
                                        top: -20,
                                        left: `${Math.random() * 100}%`,
                                    }}
                                    initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
                                    animate={{
                                        y: typeof window !== 'undefined' ? window.innerHeight + 40 : 1000,
                                        x: (Math.random() - 0.5) * 500,
                                        rotate: Math.random() * 720,
                                        opacity: [1, 1, 1, 0.8, 0],
                                    }}
                                    transition={{
                                        duration: 3.5 + Math.random() * 3,
                                        ease: "easeOut",
                                        delay: Math.random() * 0.8,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {/* Toolbar */}
                <div className="h-13 shrink-0 border-b border-gray-100 bg-white flex items-center justify-between px-4 sm:px-6 gap-2 sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={() => router.push('/simulation')}
                            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                            aria-label="Назад"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Zap size={13} className="text-accent-400 shrink-0" />
                            <span className="text-[12px] sm:text-[13px] font-inter font-bold text-gray-800 tracking-tight uppercase">
                                Отчёт
                            </span>
                            <span className="text-[11px] text-gray-400 truncate hidden xs:inline sm:inline font-mono uppercase tracking-widest">
                                · {personaName}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-1.5 border border-gray-200 hover:border-gray-400 text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors min-h-[32px]"
                        >
                            <Download size={13} />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-gray-600 text-[12px] transition-colors min-h-[32px] hidden sm:block"
                            onClick={() => router.push('/dashboard')}
                        >
                            Дашборд
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

                        {/* Context pill */}
                        {document_title && (
                            <div className="flex items-center gap-2 mb-8">
                                <FileText size={13} className="text-gray-400" />
                                <span className="text-[12px] text-gray-400">{document_title}</span>
                            </div>
                        )}

                        {/* ── Summary block ────────────────────────────────── */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-accent-50/60 border border-accent-100 rounded-2xl p-4 sm:p-6 mb-8 sm:mb-12"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={15} className="text-accent-400 shrink-0" />
                                <h2 className="text-[16px] font-inter font-bold text-gray-900 uppercase tracking-tight">Разбор завершён</h2>
                            </div>
                            <div className="flex flex-col gap-2 text-[14px]">
                                {summaryLines.map((line, i) => (
                                    <ReactMarkdown key={i} components={{
                                        p: ({ children }) => (
                                            <p className="text-[14px] text-gray-700 leading-relaxed">{children}</p>
                                        ),
                                        strong: ({ children }) => (
                                            <strong className="font-semibold text-gray-900">{children}</strong>
                                        ),
                                    }}>
                                        {line}
                                    </ReactMarkdown>
                                ))}
                            </div>

                            {/* Metric pills row */}
                            {skill_metrics?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-accent-100">
                                    {skill_metrics.map((m) => {
                                        const color = getScoreColor(m.score);
                                        const s10 = Math.round(m.score * 10);
                                        return (
                                            <span
                                                key={m.metric_name}
                                                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border"
                                                style={{
                                                    color,
                                                    backgroundColor: `${color}12`,
                                                    borderColor: `${color}30`,
                                                }}
                                            >
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: color }}
                                                />
                                                {m.metric_name}
                                                <span className="font-bold">{s10}/10</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>

                        {/* ── Transcript (script format) ───────────────────── */}
                        <div>
                            <p className="text-[11px] font-mono text-gray-300 uppercase tracking-widest mb-10">
                                Транскрипт сессии
                            </p>

                            {(() => {
                                let userIdx = 0;
                                return messages.map((msg, idx) => {
                                    if (msg.role === 'assistant') {
                                        return (
                                            <AILine
                                                key={idx}
                                                msg={msg}
                                                idx={idx}
                                                personaName={personaName}
                                            />
                                        );
                                    } else {
                                        const metric = getMetricForUserMsg(userIdx);
                                        const thisUserIdx = userIdx;
                                        userIdx++;
                                        return (
                                            <UserLine
                                                key={idx}
                                                msg={msg}
                                                idx={idx}
                                                metric={metric}
                                                onPopover={handlePopover}
                                                activePopoverId={activePopoverId}
                                            />
                                        );
                                    }
                                });
                            })()}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16 mb-20 border-t border-gray-100 pt-10">
                            <button
                                onClick={() => router.push('/upload')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold px-6 py-3 rounded-xl border border-gray-200 transition-all shadow-sm h-12"
                            >
                                <RefreshCw size={18} />
                                Пройти еще раз (Сложнее)
                            </button>
                            {avgScore10 >= 7 && (
                                <button
                                    onClick={handleShare}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all h-12"
                                >
                                    <Share2 size={18} />
                                    Поделиться результатом
                                </button>
                            )}
                        </div>

                        <div className="h-[10vh]" />
                    </div>
                </div>
            </div>

            {/* ── Global popover ───────────────────────────────────────────── */}
            <AnimatePresence>
                {popover && (
                    <Popover state={popover} onClose={closePopover} />
                )}
            </AnimatePresence>
        </>
    );
}
