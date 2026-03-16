'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TerminalSquare, ListFilter, Sparkles, Activity, CheckCircle2, ShieldAlert, TrendingDown, Download } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type SkillMetric = {
    metric_name: string;
    score: number; // 0.0 – 1.0
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

/** score is 0.0–1.0 */
const getColorForScore = (score: number) => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.5) return '#f59e0b';
    return '#f43f5e';
};

const getIconForScore = (score: number, color: string) => {
    if (score >= 0.8) return <CheckCircle2 size={16} color={color} className="mt-0.5 shrink-0" />;
    if (score >= 0.5) return <ShieldAlert size={16} color={color} className="mt-0.5 shrink-0" />;
    return <TrendingDown size={16} color={color} className="mt-0.5 shrink-0" />;
};

export default function SimulationReportPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [showRightPanel, setShowRightPanel] = useState(false);

    useEffect(() => {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        if (isDesktop) setShowRightPanel(true);
    }, []);

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await api.get(`/simulation/${sessionId}/report`);
                setReport(res);
                if (res.skill_metrics && res.skill_metrics.length > 0) {
                    setActiveSection(res.skill_metrics[0].metric_name);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Ошибка загрузки отчета';
                toast.error(message + ' (возможно сессия не завершена)');
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
        window.addEventListener('afterprint', () => {
            document.getElementById('_pdf_print_style')?.remove();
        }, { once: true });
    }, []);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <div className="flex flex-col items-center gap-4 text-[var(--accent-blue)]">
                    <Activity size={32} className="animate-spin" />
                    <span className="text-sm font-mono text-[var(--text-muted)]">Загрузка отчета...</span>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <div className="text-[var(--text-muted)] font-mono">Отчет не найден</div>
            </div>
        );
    }

    const { persona_config, messages, skill_metrics } = report;

    const overallScoreFloat = skill_metrics?.length
        ? skill_metrics.reduce((acc, m) => acc + m.score, 0) / skill_metrics.length
        : 0;
    const overallScore = Math.round(overallScoreFloat * 10);

    const personaName = PERSONA_LABELS[persona_config?.role] || persona_config?.role || 'Тренер';

    return (
        <>
            {/* ─── PRINTABLE VERSION (off-screen normally, shown on print via JS) ─── */}
            <div
                id="print-report"
                style={{ display: 'none' }}
                className="font-inter text-black bg-white"
            >
                <div style={{ borderBottom: '2px solid black', paddingBottom: 16, marginBottom: 24 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 4 }}>
                        Отчет по симуляции PeakTalk
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

                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Транскрипт симуляции</h2>
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

            {/* ─── SCREEN VERSION ─── */}
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-main)]">
                {/* ─── TOOLBAR / HEADER ─── */}
                <div className="h-14 border-b border-[var(--border-main)] flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-surface)] shrink-0 gap-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[var(--text-main)] font-mono text-[13px] truncate max-w-[180px] sm:max-w-[400px]">
                            <TerminalSquare size={16} className="text-[var(--accent-blue)] shrink-0" />
                            <span className="truncate">Q&A Simulation ({personaName})</span>
                        </div>
                        <div className="hidden sm:block h-4 w-px bg-[var(--border-main)]" />
                        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
                            Average Score:{' '}
                            <span className="font-semibold" style={{ color: getColorForScore(overallScoreFloat) }}>
                                {overallScore}/10
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            className="md:hidden flex items-center gap-1.5 border border-[var(--border-light)] text-[var(--text-main)] px-2.5 py-1.5 rounded text-xs font-mono"
                            onClick={() => setShowRightPanel(!showRightPanel)}
                        >
                            <ListFilter size={14} /> Анализ
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-1.5 border border-[var(--border-light)] hover:border-[var(--accent-blue)] text-[var(--text-muted)] hover:text-[var(--accent-blue)] px-2.5 sm:px-3 py-1.5 rounded text-xs font-mono transition-colors"
                        >
                            <Download size={14} />
                            <span className="hidden sm:inline">Скачать PDF</span>
                        </button>
                        <button
                            className="btn-secondary px-3 sm:px-4 py-1.5 text-xs"
                            onClick={() => router.push('/dashboard')}
                        >
                            В дашборд
                        </button>
                    </div>
                </div>

                {/* ─── MAIN WORKSPACE ─── */}
                <div className="flex flex-1 min-h-0 overflow-hidden relative">

                    {/* ─── LEFT: TRANSCRIPT ─── */}
                    <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] scroll-smooth p-6 pb-16">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <h2 className="text-xl font-syne font-semibold text-[var(--text-main)] mb-8 flex items-center gap-2">
                                <Sparkles size={20} className="text-[var(--accent-blue)]" />
                                Лог Симуляции
                            </h2>

                            {messages.map((msg, idx) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`max-w-[85%] rounded-2xl p-5 ${
                                                isUser
                                                    ? 'bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--text-main)] rounded-tr-sm'
                                                    : 'bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] rounded-tl-sm'
                                            }`}
                                        >
                                            <div className="text-[11px] font-mono opacity-50 mb-2 uppercase tracking-wider">
                                                {isUser ? 'Вы' : personaName}
                                            </div>
                                            <div className="leading-relaxed text-[15px]">{msg.content}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── RIGHT: METRICS SIDEBAR ─── */}
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
                                        Оценка Навыков
                                    </span>
                                    <button
                                        className="md:hidden bg-transparent border-none text-[var(--text-dim)]"
                                        onClick={() => setShowRightPanel(false)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {skill_metrics?.map((metric) => {
                                        const isActive = activeSection === metric.metric_name;
                                        const color = getColorForScore(metric.score);
                                        const scoreDisplay = Math.round(metric.score * 10);
                                        return (
                                            <div
                                                key={metric.metric_name}
                                                onClick={() => setActiveSection(metric.metric_name)}
                                                className={`p-4 px-5 border-b border-[var(--border-light)] cursor-pointer transition-colors relative ${
                                                    isActive ? 'bg-[var(--bg-surface-hover)]' : 'bg-transparent hover:bg-[var(--bg-surface-hover)]/50'
                                                }`}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="sidebar-active-indicator"
                                                        className="absolute left-0 top-0 bottom-0 w-1"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                )}
                                                <div className="flex items-start gap-3">
                                                    {getIconForScore(metric.score, color)}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <div
                                                                className={`font-inter text-sm truncate pr-2 ${
                                                                    isActive ? 'text-white font-semibold' : 'text-[var(--text-main)]'
                                                                }`}
                                                            >
                                                                {metric.metric_name}
                                                            </div>
                                                            <div
                                                                className="font-mono text-xs font-bold shrink-0"
                                                                style={{ color }}
                                                            >
                                                                {scoreDisplay}/10
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={`font-inter text-xs leading-relaxed ${
                                                                isActive ? 'text-slate-300' : 'text-[var(--text-muted)] line-clamp-2'
                                                            }`}
                                                        >
                                                            {metric.comment || 'Нет комментария'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(!skill_metrics || skill_metrics.length === 0) && (
                                        <div className="p-8 text-center text-slate-500 font-mono text-sm">
                                            Метрики не найдены
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
