'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Zap, Download, FileText,
    CheckCircle2, ShieldAlert, TrendingDown, Bot,
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score01: number) {
    if (score01 >= 0.7) return '#10b981';
    if (score01 >= 0.5) return '#fbbf24';
    return '#ef4444';
}

function getIntColor(score10: number) {
    if (score10 >= 7) return '#10b981';
    if (score10 >= 5) return '#fbbf24';
    return '#ef4444';
}

function formatDate(iso: string | null) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
}

function ScoreIcon({ score }: { score: number }) {
    const color = getScoreColor(score);
    if (score >= 0.7) return <CheckCircle2 size={15} style={{ color }} className="shrink-0 mt-0.5" />;
    if (score >= 0.5) return <ShieldAlert size={15} style={{ color }} className="shrink-0 mt-0.5" />;
    return <TrendingDown size={15} style={{ color }} className="shrink-0 mt-0.5" />;
}

// ── ScoreRing ────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
    const sw = 6, r = (size - sw) / 2, c = 2 * Math.PI * r;
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
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-syne font-bold leading-none"
                    style={{ color, fontSize: size * 0.28 }}>{score}</span>
                <span className="font-mono text-[var(--text-dim)]"
                    style={{ fontSize: size * 0.14 }}>/10</span>
            </div>
        </div>
    );
}

// ── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ metric, idx }: { metric: SkillMetric; idx: number }) {
    const color = getScoreColor(metric.score);
    const score10 = Math.round(metric.score * 10);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + idx * 0.05 }}
            className="p-5 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)] flex flex-col gap-3"
        >
            {/* Top row */}
            <div className="flex items-start gap-2.5">
                <ScoreIcon score={metric.score} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold font-inter text-[var(--text-main)]">
                            {metric.metric_name}
                        </span>
                        <span
                            className="text-[12px] font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0"
                            style={{ color, backgroundColor: `${color}18` }}
                        >
                            {score10}/10
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-[4px] bg-[var(--bg-surface-alt)] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.score * 100}%` }}
                    transition={{ duration: 0.7, delay: 0.15 + idx * 0.05, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                />
            </div>

            {/* Comment */}
            {metric.comment && (
                <p className="text-[12px] text-[var(--text-dim)] font-inter leading-relaxed">
                    {metric.comment}
                </p>
            )}
        </motion.div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SimulationReportPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

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

    // ── Loading ──────────────────────────────────────────────────────────────

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

    const { persona_config, messages, skill_metrics, document_title, completed_at } = report;

    const overallScoreFloat = skill_metrics?.length
        ? skill_metrics.reduce((acc, m) => acc + m.score, 0) / skill_metrics.length
        : 0;
    const overallScore = Math.round(overallScoreFloat * 10);
    const overallColor = getIntColor(overallScore);
    const personaName = PERSONA_LABELS[persona_config?.role] || persona_config?.role || 'Тренер';

    const scoreLabel = overallScore >= 8
        ? 'Отличный результат'
        : overallScore >= 6
        ? 'Хороший результат'
        : overallScore >= 4
        ? 'Есть над чем поработать'
        : 'Нужно больше практики';

    return (
        <>
            {/* ── Printable ────────────────────────────────────────────────── */}
            <div id="print-report" style={{ display: 'none' }} className="font-inter text-black bg-white">
                <div style={{ borderBottom: '2px solid black', paddingBottom: 16, marginBottom: 24 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 4 }}>
                        Отчёт по симуляции PeakTalk
                    </h1>
                    <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                        Персона: {personaName} · Балл: {overallScore}/10
                        {document_title ? ` · Документ: ${document_title}` : ''}
                        {completed_at ? ` · ${formatDate(completed_at)}` : ''}
                    </p>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Навыки</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 32 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #ccc' }}>
                            <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 600 }}>Навык</th>
                            <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 600, width: 60 }}>Балл</th>
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

            {/* ── Screen ───────────────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-[var(--bg-main)]">

                {/* Toolbar */}
                <div className="sticky top-0 z-10 h-13 border-b border-[var(--border-main)] flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-surface)] shrink-0 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.push('/simulation')}
                            className="flex items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors shrink-0"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div className="hidden sm:block h-4 w-px bg-[var(--border-main)]" />
                        <div className="flex items-center gap-2 min-w-0">
                            <Zap size={14} className="text-[var(--accent-primary)] shrink-0" />
                            <span className="text-[13px] font-medium font-inter text-[var(--text-main)] truncate">
                                Отчёт симуляции
                            </span>
                            <span className="hidden sm:inline text-[11px] text-[var(--text-dim)] font-mono">
                                · {personaName}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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

                {/* Content */}
                <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-6">

                    {/* ── Hero card ──────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="p-6 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-surface)]"
                    >
                        <div className="flex items-center gap-5">
                            <ScoreRing score={overallScore} size={88} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span
                                        className="text-2xl font-syne font-bold"
                                        style={{ color: overallColor }}
                                    >
                                        {overallScore}/10
                                    </span>
                                    <span
                                        className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold"
                                        style={{ color: overallColor, backgroundColor: `${overallColor}18` }}
                                    >
                                        {scoreLabel}
                                    </span>
                                </div>
                                <div className="text-[13px] font-medium font-inter text-[var(--text-main)] mb-0.5">
                                    {personaName}
                                </div>
                                <div className="text-[11px] font-mono text-[var(--text-dim)] flex items-center gap-3 flex-wrap">
                                    {persona_config?.industry && <span>{persona_config.industry}</span>}
                                    {completed_at && <span>{formatDate(completed_at)}</span>}
                                </div>
                            </div>
                        </div>
                        {/* Full-width progress bar */}
                        <div className="mt-4 w-full h-2 bg-[var(--bg-surface-alt)] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${overallScoreFloat * 100}%` }}
                                transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: overallColor }}
                            />
                        </div>
                    </motion.div>

                    {/* ── Context card (only when document) ──────────────────── */}
                    {document_title && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.08 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)]"
                        >
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary-bg)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                                <FileText size={14} />
                            </div>
                            <div>
                                <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider mb-0.5">
                                    Контекст симуляции
                                </div>
                                <div className="text-[13px] font-medium font-inter text-[var(--text-main)]">
                                    {document_title}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Metrics grid ───────────────────────────────────────── */}
                    {skill_metrics && skill_metrics.length > 0 && (
                        <section>
                            <p className="label-kicker mb-4">Оценка навыков</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {skill_metrics.map((metric, idx) => (
                                    <MetricCard key={metric.metric_name} metric={metric} idx={idx} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── Transcript ─────────────────────────────────────────── */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <p className="label-kicker">Транскрипт сессии</p>
                            <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
                                <Bot size={12} />
                                <span className="text-[10px] font-mono">{personaName}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {messages.map((msg, idx) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25, delay: idx * 0.03 }}
                                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                                            isUser
                                                ? 'bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)] rounded-br-none'
                                                : 'bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-tl-none'
                                        }`}>
                                            <div className="label-kicker mb-1.5">
                                                {isUser ? 'Вы' : personaName}
                                            </div>
                                            <p className="text-[13px] leading-relaxed font-inter text-[var(--text-main)]">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>

                    <div className="h-8" />
                </div>
            </div>
        </>
    );
}
