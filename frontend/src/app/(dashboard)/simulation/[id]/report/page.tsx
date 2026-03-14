'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, TerminalSquare, ListFilter, Sparkles, Activity, CheckCircle2, ShieldAlert, TrendingDown } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function SimulationReportPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;
    
    const [report, setReport] = useState<any>(null);
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
                // To get report, the session MUST be completed. Otherwise it's 422.
                const res = await api.get(`/simulation/${sessionId}/report`);
                setReport(res);
                if (res.skill_metrics && res.skill_metrics.length > 0) {
                    setActiveSection(res.skill_metrics[0].id);
                }
            } catch (err: any) {
                toast.error(err.message || 'Ошибка загрузки отчета (возможно сессия не завершена)');
                router.push(`/simulation/${sessionId}`);
            } finally {
                setLoading(false);
            }
        }
        if (sessionId) fetchReport();
    }, [sessionId, router]);

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

    const { persona_config, status, messages, skill_metrics } = report;
    
    const overallScore = skill_metrics?.length 
        ? Math.round(skill_metrics.reduce((acc: number, m: any) => acc + m.score, 0) / skill_metrics.length)
        : 0;

    const getColorForScore = (score: number) => {
        if (score >= 8) return '#10b981'; // emerald
        if (score >= 5) return '#f59e0b'; // amber
        return '#f43f5e'; // rose
    };
    
    const getIconForScore = (score: number, color: string) => {
        if (score >= 8) return <CheckCircle2 size={16} color={color} className="mt-0.5 shrink-0" />;
        if (score >= 5) return <ShieldAlert size={16} color={color} className="mt-0.5 shrink-0" />;
        return <TrendingDown size={16} color={color} className="mt-0.5 shrink-0" />;
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-main)]">
            {/* ─── TOOLBAR / HEADER ─── */}
            <div className="h-14 border-b border-[var(--border-main)] flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-surface)] shrink-0 gap-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[var(--text-main)] font-mono text-[13px] truncate max-w-[200px] sm:max-w-[400px]">
                        <TerminalSquare size={16} className="text-[var(--accent-blue)] shrink-0" />
                        <span className="truncate">Q&A Simulation ({persona_config?.role || 'Инвестор'})</span>
                    </div>
                    <div className="hidden sm:block h-4 w-px bg-[var(--border-main)]" />
                    <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
                        Average Score: <span className="font-semibold" style={{ color: getColorForScore(overallScore) }}>{overallScore}/10</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden flex items-center gap-1.5 border border-[var(--border-light)] text-[var(--text-main)] px-2.5 py-1.5 rounded"
                        onClick={() => setShowRightPanel(!showRightPanel)}
                    >
                        <ListFilter size={14} /> <span className="text-xs font-mono">Анализ</span>
                    </button>
                    <button className="btn-secondary px-4 py-1.5 text-xs flex items-center gap-1.5" onClick={() => router.push('/dashboard')}>
                        В дашборд
                    </button>
                </div>
            </div>

            {/* ─── MAIN WORKSPACE ─── */}
            <div className="flex flex-1 min-h-0 overflow-hidden relative">

                {/* ─── LEFT: TRANSCRIPT VIEW ─── */}
                <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] relative scroll-smooth p-6 pb-32">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <h2 className="text-xl font-syne font-semibold text-[var(--text-main)] mb-8 flex items-center gap-2">
                            <Sparkles size={20} className="text-[var(--accent-blue)]" />
                            Лог Симуляции
                        </h2>
                        
                        {messages.map((msg: any, idx: number) => {
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
                                            {isUser ? 'Вы' : (persona_config?.role || 'Инвестор')}
                                        </div>
                                        <div className="leading-relaxed text-[15px]">
                                            {msg.content}
                                        </div>
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
                            className="fixed md:relative right-0 top-14 md:top-0 bottom-0 w-[min(340px,85vw)] max-w-full md:max-w-none border-l border-[var(--border-main)] bg-[var(--bg-surface)] flex flex-col z-20 shadow-2xl md:shadow-none bg-opacity-95 md:bg-opacity-100 backdrop-blur-xl md:backdrop-blur-none"
                        >
                            <div className="px-5 py-4 border-b border-[var(--border-main)] flex items-center justify-between shadow-sm">
                                <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-[0.1em]">Оценка Навыков</span>
                                <button className="md:hidden bg-transparent border-none text-[var(--text-dim)]" onClick={() => setShowRightPanel(false)}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {skill_metrics?.map((metric: any) => {
                                    const isActive = activeSection === metric.id;
                                    const color = getColorForScore(metric.score);
                                    return (
                                        <div
                                            key={metric.id}
                                            onClick={() => setActiveSection(metric.id)}
                                            className={`p-4 px-5 border-b border-[var(--border-light)] cursor-pointer transition-colors relative ${
                                                isActive ? 'bg-[var(--bg-surface-hover)]' : 'bg-transparent'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div layoutId="sidebar-active-indicator" className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
                                            )}
                                            <div className="flex items-start gap-3">
                                                {getIconForScore(metric.score, color)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className={`font-inter text-sm truncate pr-2 ${isActive ? 'text-white font-semibold' : 'text-[var(--text-main)] font-normal'}`}>
                                                            {metric.metric_name}
                                                        </div>
                                                        <div className="font-mono text-xs font-bold shrink-0" style={{ color }}>
                                                            {metric.score}/10
                                                        </div>
                                                    </div>
                                                    <div className={`font-inter text-xs leading-relaxed ${isActive ? 'text-slate-300 line-clamp-none' : 'text-[var(--text-muted)] line-clamp-2'}`}>
                                                        {metric.comment || "Нет комментария"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {(!skill_metrics || skill_metrics.length === 0) && (
                                    <div className="p-8 text-center text-slate-500 font-mono text-sm border-b border-[var(--border-main)]">
                                        Метрики не найдены
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
