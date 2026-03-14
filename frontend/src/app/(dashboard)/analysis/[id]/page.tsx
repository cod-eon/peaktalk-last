"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, TerminalSquare, ListFilter, Sparkles, Activity } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type FeedbackJSON = {
    logic: string;
    style: string;
    clarity: string;
    grammar: string;
    overall_score: number;
};

export default function AnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const draftId = params.id as string;
    
    const [draft, setDraft] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string | null>('logic');
    const [showRightPanel, setShowRightPanel] = useState(false);

    useEffect(() => {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        if (isDesktop) setShowRightPanel(true);
    }, []);

    useEffect(() => {
        async function fetchDraft() {
            try {
                const draftRes = await api.get(`/drafts/${draftId}`);
                setDraft(draftRes);
            } catch (err: any) {
                toast.error(err.message || 'Ошибка загрузки разбора');
                router.push('/upload');
            } finally {
                setLoading(false);
            }
        }
        if (draftId) fetchDraft();
    }, [draftId, router]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <div className="flex flex-col items-center gap-4 text-blue-500">
                    <Activity size={32} className="animate-spin" />
                    <span className="text-sm font-mono text-slate-400">Загрузка данных...</span>
                </div>
            </div>
        );
    }

    if (!draft || !draft.analysis_result) {
        return (
            <div className="flex flex-1 items-center justify-center bg-[var(--bg-main)]">
                <div className="text-slate-400 font-mono">Анализ не найден</div>
            </div>
        );
    }

    const { raw_text, title } = draft;
    const { feedback_json, improved_text } = draft.analysis_result;
    
    // Split text into lines for IDE view
    const textLines = raw_text.split('\n');
    
    const feedbackItems = [
        { id: 'logic', title: 'Логика и Структура', desc: feedback_json.logic, color: '#ef4444' },
        { id: 'style', title: 'Стиль и Тон', desc: feedback_json.style, color: '#f97316' },
        { id: 'clarity', title: 'Ясность', desc: feedback_json.clarity, color: '#a855f7' },
        { id: 'grammar', title: 'Грамматика', desc: feedback_json.grammar, color: '#eab308' },
    ];

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[var(--bg-main)]">
            {/* ─── TOOLBAR / HEADER ─── */}
            <div className="h-14 border-b border-[var(--border-main)] flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-surface)] shrink-0 gap-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[var(--text-main)] font-mono text-[13px] truncate max-w-[200px] sm:max-w-[400px]">
                        <TerminalSquare size={16} className="text-blue-500 shrink-0" />
                        <span className="truncate">{title || 'draft.txt'}</span>
                    </div>
                    <div className="hidden sm:block h-4 w-px bg-[var(--border-main)]" />
                    <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
                        Score: <span className="text-emerald-500 font-semibold">{feedback_json.overall_score}/10</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden flex items-center gap-1.5 border border-[var(--border-light)] text-[var(--text-main)] px-2.5 py-1.5 rounded"
                        onClick={() => setShowRightPanel(!showRightPanel)}
                    >
                        <ListFilter size={14} /> <span className="text-xs font-mono">Анализ</span>
                    </button>
                    <button className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5" onClick={() => setActiveSection('improved')}>
                        <Sparkles size={14} /> Улучшенная версия
                    </button>
                </div>
            </div>

            {/* ─── MAIN WORKSPACE ─── */}
            <div className="flex flex-1 min-h-0 overflow-hidden relative">

                {/* ─── LEFT: TEXT EDITOR (CODE VIEW) ─── */}
                <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] relative scroll-smooth">
                    {activeSection === 'improved' ? (
                        <div className="p-8 pb-32 max-w-4xl mx-auto">
                            <h3 className="text-lg font-mono text-slate-200 mb-6 flex items-center gap-2">
                                <Sparkles size={18} className="text-blue-400" />
                                Оптимизированный текст
                            </h3>
                            <div className="font-mono text-sm leading-[1.8] text-[var(--text-main)] whitespace-pre-wrap bg-white/5 border border-[var(--border-main)] rounded-xl p-6 shadow-inner">
                                {improved_text}
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 pb-32 font-mono text-xs sm:text-sm leading-[1.8]">
                            {textLines.map((text: string, index: number) => (
                                <div
                                    key={index}
                                    className="flex px-3 sm:px-6 transition-colors duration-200 hover:bg-white/5"
                                >
                                    <div className="w-8 sm:w-10 shrink-0 text-right pr-2 sm:pr-4 select-none text-[11px] sm:text-[13px] text-[var(--text-dim)] opacity-50">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 text-[var(--text-main)] whitespace-pre-wrap">
                                        {text || ' '}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── RIGHT: PROBLEMS SIDEBAR (VS Code Style) ─── */}
                <AnimatePresence>
                    {showRightPanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 340, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="fixed md:relative right-0 top-14 md:top-0 bottom-0 w-[min(340px,85vw)] max-w-full md:max-w-none border-l border-[var(--border-main)] bg-[var(--bg-surface)] flex flex-col z-20 shadow-2xl md:shadow-none bg-opacity-95 md:bg-opacity-100 backdrop-blur-xl md:backdrop-blur-none"
                        >
                            <div className="px-5 py-4 border-b border-[var(--border-main)] flex items-center justify-between shadow-sm">
                                <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-[0.1em]">Аналитика</span>
                                <button className="md:hidden bg-transparent border-none text-[var(--text-dim)]" onClick={() => setShowRightPanel(false)}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {feedbackItems.map(item => {
                                    const isActive = activeSection === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setActiveSection(item.id)}
                                            className={`p-4 px-5 border-b border-[var(--border-light)] cursor-pointer transition-colors relative ${
                                                isActive ? 'bg-[var(--bg-surface-hover)]' : 'bg-transparent'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div layoutId="sidebar-active-indicator" className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: item.color }} />
                                            )}
                                            <div className="flex items-start gap-3">
                                                <AlertCircle size={16} color={item.color} className="mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <div className={`font-inter text-sm mb-2 ${isActive ? 'text-white font-semibold' : 'text-[var(--text-main)] font-normal'}`}>
                                                        {item.title}
                                                    </div>
                                                    <div className={`font-inter text-xs leading-relaxed ${isActive ? 'text-slate-300' : 'text-[var(--text-muted)] line-clamp-2'}`}>
                                                        {item.desc}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
