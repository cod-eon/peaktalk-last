'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListFilter, CheckCircle2, ShieldAlert, TrendingDown, Download, ArrowLeft, Zap } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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
    persona_config: PersonaConfig;
    status: string;
    messages: Message[];
    skill_metrics: SkillMetric[];
};

const PERSONA_LABELS: Record<string, string> = {
    investor: 'AI-Инвестор',
    tech_lead: 'CEO / Техдир',
    hr: 'HR-Менеджер',
    listener: 'Скептик из зала',
};

function getScoreColor(score: number): string {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.5) return '#f59e0b';
    return '#ef4444';
}

function ScoreIcon({ score }: { score: number }) {
    const color = getScoreColor(score);
    if (score >= 0.8) return <CheckCircle2 size={14} style={{ color }} className="shrink-0" />;
    if (score >= 0.5) return <ShieldAlert size={14} style={{ color }} className="shrink-0" />;
    return <TrendingDown size={14} style={{ color }} className="shrink-0" />;
}

function MetricBar({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    const color = getScoreColor(score);
    return (
        <div className="w-full h-1 bg-[var(--bg-main)] rounded-full overflow-hidden mt-2">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
            />
        </div>
    );
}

export default function SimulationReportPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [showRightPanel, setShowRightPanel] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(min-width: 768px)').matches) setShowRightPanel(true);
    }, []);

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await api.get(`/simulation/${sessionId}/report`);
                setReport(res);
                if (res.skill_metrics?.length > 0) setActiveSection(res.skill_metrics[0].metric_name);
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
                #print-report { visibility: visible !important; display: block !important;
                    position: fixed !important; inset: 0 !important;
                    background: white !important; padding: 48px !important;
                    z-index: 99999 !important; overflow: visible !important; }
                #print-report * { visibility: visible !important; }
            }
        `;
        document.head.appendChild(style);
        window.print();
        window.addEventListener('afterprint', () => document.getElementById('_pdf_print_style')?.remove(), { once: true });
    }, []);

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

    const { persona_config, messages, skill_metrics } = report;
    const overallScoreFloat = skill_metrics?.length
        ? skill_metrics.reduce((acc, m) => acc + m.score, 0) / skill_metrics.length
        : 0;
    const overallScore = Math.round(overallScoreFloat * 10);
    const personaName = PERSONA_LABELS[persona_config?.role] || persona_config?.role || 'Тренер';
    const overallColor = getScoreColor(overallScoreFloat);

    return (
        <>
            {/* Printable version */}
            <div id="print-report" style={{ display: 'none' }} className="font-inter text-black bg-white">
                <div style={{ borderBottom: '2px solid black', paddingBottom: 16, marginBottom: 24 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 4 }}>
                        Отчёт по симуляции PeakTalk
                    </h1>
                    <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                        Персона: {personaName} · Средний балл: {overallScore}/10
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

            {/* Screen version */}
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
                        <div className="hidden sm:flex items-center gap-1.5 ml-2">
                            <span className="text-[11px] font-mono font-bold" style={{ color: overallColor }}>
                                {overallScore}/10
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="md:hidden flex items-center gap-1.5 border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-inter transition-colors"
                            onClick={() => setShowRightPanel(!showRightPanel)}
                        >
                            <ListFilter size={13} /> Анализ
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

                {/* Main */}
                <div className="flex flex-1 min-h-0 overflow-hidden relative">
                    {/* Transcript */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-16">
                        <div className="max-w-2xl mx-auto">
                            <p className="label-kicker mb-6">Транскрипт сессии</p>

                            <div className="flex flex-col gap-4">
                                {messages.map((msg, idx) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[88%] rounded-[var(--radius-lg)] p-4 ${
                                                isUser
                                                    ? 'bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)] rounded-br-[var(--radius-sm)]'
                                                    : 'bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-bl-[var(--radius-sm)]'
                                            }`}>
                                                <div className="label-kicker mb-2">
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

                    {/* Right panel: metrics */}
                    <AnimatePresence>
                        {showRightPanel && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 300, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed md:relative right-0 top-13 md:top-0 bottom-0 w-[min(300px,85vw)] max-w-full md:max-w-none border-l border-[var(--border-main)] bg-[var(--bg-surface)] flex flex-col z-20 shadow-[var(--shadow-elevated)] md:shadow-none"
                            >
                                <div className="px-4 py-3.5 border-b border-[var(--border-main)] flex items-center justify-between">
                                    <span className="label-kicker">Оценка навыков</span>
                                    <button
                                        className="md:hidden text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
                                        onClick={() => setShowRightPanel(false)}
                                    >
                                        <X size={15} />
                                    </button>
                                </div>

                                {/* Overall score */}
                                <div className="px-4 py-3.5 border-b border-[var(--border-main)] bg-[var(--bg-surface-alt)]">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[12px] font-medium font-inter text-[var(--text-muted)]">Итоговый балл</span>
                                        <span className="font-syne text-[18px] font-bold" style={{ color: overallColor }}>
                                            {overallScore}<span className="text-[12px] text-[var(--text-dim)] font-mono ml-0.5">/10</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${overallScoreFloat * 100}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: overallColor }}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {skill_metrics?.map((metric) => {
                                        const isActive = activeSection === metric.metric_name;
                                        const color = getScoreColor(metric.score);
                                        const scoreDisplay = Math.round(metric.score * 10);

                                        return (
                                            <div
                                                key={metric.metric_name}
                                                onClick={() => setActiveSection(metric.metric_name)}
                                                className={`px-4 py-3.5 border-b border-[var(--border-main)] cursor-pointer transition-colors relative ${
                                                    isActive ? 'bg-[var(--bg-surface-hover)]' : 'hover:bg-[var(--bg-surface-hover)]/50'
                                                }`}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="metric-active"
                                                        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                )}

                                                <div className="flex items-center gap-2 mb-1">
                                                    <ScoreIcon score={metric.score} />
                                                    <span className={`text-[12px] font-medium font-inter flex-1 ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                                        {metric.metric_name}
                                                    </span>
                                                    <span className="text-[11px] font-mono font-bold shrink-0" style={{ color }}>
                                                        {scoreDisplay}/10
                                                    </span>
                                                </div>

                                                <MetricBar score={metric.score} />

                                                {isActive && metric.comment && (
                                                    <motion.p
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="text-[11px] text-[var(--text-dim)] font-inter leading-relaxed mt-2"
                                                    >
                                                        {metric.comment}
                                                    </motion.p>
                                                )}
                                            </div>
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
