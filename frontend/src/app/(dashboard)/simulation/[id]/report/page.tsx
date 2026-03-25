'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, CheckCircle2, ShieldAlert, TrendingDown,
    Download, ArrowLeft, Zap, FileText, BarChart2,
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
    return '#ef4444';
}

function getIntColor(score10: number): string {
    if (score10 >= 7) return '#10b981';
    if (score10 >= 5) return '#fbbf24';
    return '#ef4444';
}

function ScoreIcon({ score }: { score: number }) {
    const color = getScoreColor(score);
    if (score >= 0.7) return <CheckCircle2 size={14} style={{ color }} className="shrink-0" />;
    if (score >= 0.5) return <ShieldAlert size={14} style={{ color }} className="shrink-0" />;
    return <TrendingDown size={14} style={{ color }} className="shrink-0" />;
}

// ── ScoreRing ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
    const sw = 5, r = (size - sw) / 2, c = 2 * Math.PI * r;
    const color = getIntColor(score);
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="var(--bg-surface-alt)" strokeWidth={sw} />
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
                <span className="font-syne font-bold leading-none"
                    style={{ color, fontSize: size * 0.27 }}>{score}</span>
                <span className="font-mono text-[var(--text-dim)]"
                    style={{ fontSize: size * 0.13 }}>/10</span>
            </div>
        </div>
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

    useEffect(() => {
        if (window.matchMedia('(min-width: 768px)').matches) setShowRightPanel(true);
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

    // ── Loading ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-[var(--border-light)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    <span className="text-[13px] font-inter text-[var(--text-dim)]">Загрузка отчёта...</span>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <p className="text-[13px] text-[var(--text-muted)] font-inter">Отчёт не найден</p>
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
    const personaName = PERSONA_LABELS[persona_config?.role] || persona_config?.role || 'Тренер';

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
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Оценка навыков</h2>
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
                        <div key={idx} style={{ paddingLeft: msg.role === 'user' ? 32 : 0, paddingRight: msg.role === 'assistant' ? 32 : 0 }}>
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

                {/* Toolbar */}
                <div className="h-13 border-b border-[var(--border-main)] flex items-center justify-between px-4 sm:px-5 bg-[var(--bg-surface)] shrink-0 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.push('/simulation')}
                            className="flex items-center gap-1 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors shrink-0"
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
                            style={{ color: overallColor, backgroundColor: `${overallColor}18` }}
                        >
                            {overallScore}/10
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mobile metrics toggle */}
                        <button
                            className="md:hidden flex items-center gap-1.5 border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-inter transition-colors"
                            onClick={() => setShowRightPanel(!showRightPanel)}
                        >
                            <BarChart2 size={13} />
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-1.5 border border-[var(--border-main)] hover:border-[var(--accent-primary)]/40 text-[var(--text-dim)] hover:text-[var(--accent-primary)] px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-inter transition-colors"
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

                {/* Main content */}
                <div className="flex flex-1 min-h-0 overflow-hidden relative">

                    {/* ── Left: Transcript ────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-16">
                        <div className="max-w-2xl mx-auto">

                            {/* Context card */}
                            {document_title && (
                                <div className="mb-6 p-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary-bg)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                                        <FileText size={13} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider mb-0.5">
                                            Контекст
                                        </div>
                                        <div className="text-[12px] font-medium font-inter text-[var(--text-main)]">
                                            {document_title}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="label-kicker mb-5">Транскрипт сессии</p>

                            <div className="flex flex-col gap-3.5">
                                {messages.map((msg, idx) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[88%] px-4 py-3 ${
                                                isUser
                                                    ? 'bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)] rounded-2xl rounded-br-none'
                                                    : 'bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl rounded-tl-none'
                                            }`}>
                                                <div className="label-kicker mb-1.5">
                                                    {isUser ? 'Вы' : personaName}
                                                </div>
                                                <p className="text-[13px] leading-relaxed font-inter text-[var(--text-main)]">
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Metrics panel ────────────────────────────────── */}
                    <AnimatePresence>
                        {showRightPanel && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 'clamp(300px, 38%, 440px)', opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed md:relative right-0 top-13 md:top-0 bottom-0 border-l border-[var(--border-main)] bg-[var(--bg-surface)] flex flex-col z-20 shadow-[var(--shadow-elevated)] md:shadow-none overflow-hidden"
                                style={{ minWidth: 0 }}
                            >
                                {/* Panel header */}
                                <div className="px-5 py-4 border-b border-[var(--border-main)] shrink-0">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                                            Результаты
                                        </span>
                                        <button
                                            className="md:hidden text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
                                            onClick={() => setShowRightPanel(false)}
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>

                                    {/* Score row */}
                                    <div className="flex items-center gap-4">
                                        <ScoreRing score={overallScore} size={72} />
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="font-syne text-[22px] font-bold leading-none mb-1"
                                                style={{ color: overallColor }}
                                            >
                                                {overallScore}
                                                <span className="text-[13px] text-[var(--text-dim)] font-mono ml-1">/10</span>
                                            </div>
                                            <div className="text-[12px] font-inter text-[var(--text-muted)] truncate mb-0.5">
                                                {personaName}
                                            </div>
                                            {persona_config?.industry && (
                                                <div className="text-[11px] font-mono text-[var(--text-dim)] truncate">
                                                    {persona_config.industry}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-3 w-full h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${overallScoreFloat * 100}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: overallColor }}
                                        />
                                    </div>
                                </div>

                                {/* Metrics list */}
                                <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-main)]">
                                    {skill_metrics?.map((metric, idx) => {
                                        const color = getScoreColor(metric.score);
                                        const score10 = Math.round(metric.score * 10);
                                        return (
                                            <motion.div
                                                key={metric.metric_name}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.28, delay: idx * 0.05 }}
                                                className="px-5 py-4"
                                            >
                                                {/* Name + score */}
                                                <div className="flex items-start gap-2 mb-2">
                                                    <ScoreIcon score={metric.score} />
                                                    <span className="flex-1 text-[13px] font-semibold font-inter text-[var(--text-main)] leading-snug">
                                                        {metric.metric_name}
                                                    </span>
                                                    <span
                                                        className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0"
                                                        style={{ color, backgroundColor: `${color}18` }}
                                                    >
                                                        {score10}/10
                                                    </span>
                                                </div>
                                                {/* Bar */}
                                                <div className="w-full h-[3px] bg-[var(--bg-main)] rounded-full overflow-hidden mb-2.5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${metric.score * 100}%` }}
                                                        transition={{ duration: 0.55, delay: idx * 0.05 + 0.15, ease: 'easeOut' }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                </div>
                                                {/* Comment */}
                                                {metric.comment && (
                                                    <p className="text-[11.5px] text-[var(--text-dim)] font-inter leading-relaxed">
                                                        {metric.comment}
                                                    </p>
                                                )}
                                            </motion.div>
                                        );
                                    })}

                                    {(!skill_metrics || skill_metrics.length === 0) && (
                                        <div className="p-8 text-center">
                                            <p className="text-[12px] text-[var(--text-dim)] font-inter">Метрики не найдены</p>
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
