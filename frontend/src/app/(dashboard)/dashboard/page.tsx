"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, CheckCircle2, Clock, UploadCloud, ChevronRight, Activity } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const stats = [
        {
            label: 'Общая готовность питча',
            value: '88 / 100',
            trend: '+12% к прошлому черновику',
            positive: true,
            type: 'progress',
            valueProgress: 88,
        },
        {
            label: 'Слабые аргументы / «Вода»',
            value: '2 найдено',
            trend: 'Было 8 в первой версии',
            positive: true,
            type: 'chart',
            chartData: [8, 7, 6, 5, 3, 2]
        },
        {
            label: 'Стрессоустойчивость',
            value: 'Уверенно',
            trend: 'Отработано 14 жестких вопросов',
            positive: true,
            type: 'status',
            statusColor: '#10b981' // emerald-500
        },
    ];

    const recentDrafts = [
        { id: 1, name: 'Питч перед ангелами V3.md', status: 'Готов', date: '2 часа назад', type: 'Pitch Deck' },
        { id: 2, name: 'Сценарий конфы_Техдир.txt', status: 'В работе', date: 'Вчера', type: 'Tech Speech' },
        { id: 3, name: 'Ответы на YC Interview.docx', status: 'Готов', date: '3 дня назад', type: 'Q&A Prep' },
        { id: 4, name: 'Презентация продукта_Q2.pdf', status: 'Проанализирован', date: 'Неделю назад', type: 'General' },
    ];

    return (
        <div className="pb-10 pt-4 sm:pt-8 w-full max-w-6xl mx-auto px-6 lg:px-10 overflow-hidden">
            {/* ─── HEADER SECTION ─── */}
            <div className="flex flex-col gap-6 mb-10 sm:flex-row sm:items-start sm:justify-between sm:mb-14">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="font-mono text-[11px] text-[var(--accent-blue)] tracking-[0.1em] uppercase mb-3 flex items-center gap-2"
                    >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-blue)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-blue)]"></span>
                        </span>
                        SYSTEM_STATE: READY [100%]
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="font-syne text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 leading-tight tracking-tight m-0"
                    >
                        С возвращением,<br className="hidden sm:block lg:hidden" /> Артур.
                    </motion.h1>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="w-full sm:w-auto"
                >
                    <Link href="/upload" className="btn-primary w-full sm:w-auto mt-2 sm:mt-0 shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-shadow">
                        <UploadCloud size={16} className="mr-2" />
                        Новый разбор
                    </Link>
                </motion.div>
            </div>

            {/* ─── STATS GRID ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 sm:mb-16">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 + (i * 0.1), type: "spring", stiffness: 100 }}
                        className="bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--accent-blue)]/50 transition-colors duration-300 p-6 flex flex-col relative overflow-hidden rounded-2xl group shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                    >
                        {/* Glowing orb background effect */}
                        <div className="absolute -right-20 -top-20 w-40 h-40 bg-[var(--accent-blue)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent-blue)]/10 transition-all duration-500" />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="font-mono text-[11px] text-[var(--text-dim)] uppercase tracking-widest">
                                {stat.label}
                            </div>
                            {stat.type === 'status' && (
                                <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 relative">
                                    <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: stat.statusColor }} />
                                    <div className="relative w-full h-full rounded-full" style={{ backgroundColor: stat.statusColor }} />
                                </div>
                            )}
                        </div>

                        <div className="flex items-end justify-between mb-8 relative z-10">
                            <div className="font-syne text-3xl sm:text-4xl font-bold text-slate-100 leading-none tracking-tight group-hover:scale-105 transition-transform origin-left">
                                {stat.value}
                            </div>

                            {/* Fake Line Chart with Framer Motion */}
                            {stat.type === 'chart' && stat.chartData && (
                                <div className="flex items-end gap-1.5 h-10 px-2">
                                    {stat.chartData.map((val, idx) => (
                                        <motion.div 
                                             key={idx} 
                                             initial={{ height: 0 }}
                                             animate={{ height: `${(val / 10) * 100}%` }}
                                             transition={{ duration: 0.5, delay: 0.5 + (idx * 0.05) }}
                                             className={`w-2.5 rounded-t-sm transition-colors duration-300 ${idx === stat.chartData.length - 1 ? 'bg-[var(--accent-blue)]' : 'bg-[var(--border-light)] group-hover:bg-[var(--accent-blue)]/40'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Content specific to metric type */}
                        <div className="mt-auto flex flex-col gap-3 relative z-10">
                            {stat.type === 'progress' && stat.valueProgress && (
                                <div className="w-full h-2 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stat.valueProgress}%` }}
                                        transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                                        className="h-full bg-[var(--accent-blue)] relative overflow-hidden"
                                    >
                                        <motion.div 
                                            animate={{ x: ["-100%", "200%"] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" 
                                        />
                                    </motion.div>
                                </div>
                            )}

                            <div className={`font-inter text-xs flex items-center gap-1.5 ${stat.positive ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                                {stat.positive ? (
                                    <Activity size={14} className="opacity-80" />
                                ) : (
                                    <span className="font-sans">↘</span>
                                )}
                                {stat.trend}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ─── RECENT DRAFTS MODULE ─── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="w-full"
            >
                <div className="flex items-end justify-between mb-6">
                    <h2 className="font-syne text-xl sm:text-2xl font-semibold text-slate-100 m-0">
                        Недавние разборы
                    </h2>
                    <button className="flex items-center gap-1.5 bg-transparent border-none p-0 text-[var(--text-dim)] hover:text-[var(--accent-blue)] font-mono text-[10px] sm:text-[11px] tracking-widest uppercase cursor-pointer transition-colors">
                        <span className="hidden sm:inline">Смотреть</span> все <ArrowRight size={14} />
                    </button>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl overflow-hidden shadow-2xl relative">
                    {/* Decorative subtle top border */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-blue)]/30 to-transparent" />
                    
                    {/* Desktop header */}
                    <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_140px_160px_120px_48px] px-6 py-5 border-b border-[var(--border-light)]/50 bg-[var(--bg-surface-alt)]/50 backdrop-blur-sm">
                        <div className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-widest">Название файла</div>
                        <div className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-widest">Тип</div>
                        <div className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-widest">Статус</div>
                        <div className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-widest">Дата</div>
                        <div></div>
                    </div>

                    <div className="flex flex-col divide-y divide-[var(--border-main)] relative z-10">
                        {recentDrafts.map((draft, idx) => (
                            <Link
                                href={`/analysis/${draft.id}`}
                                key={draft.id}
                                className="group flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_140px_160px_120px_48px] lg:items-center px-4 py-4 sm:px-6 hover:bg-[var(--bg-surface-hover)] transition-all duration-300 relative overflow-hidden"
                            >
                                {/* Active subtle indicator line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--accent-blue)]/50 to-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                {/* Subtle background glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-blue)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                {/* Name — visible on all sizes */}
                                <div className="flex items-center gap-4 min-w-0 mb-3 lg:mb-0 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-light)] flex items-center justify-center flex-shrink-0 group-hover:border-[var(--accent-blue)]/50 group-hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all duration-300">
                                        <FileText size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] transition-colors" />
                                    </div>
                                    <span className="font-inter text-sm font-medium text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap group-hover:translate-x-1 transition-transform duration-300">
                                        {draft.name}
                                    </span>
                                </div>

                                {/* Mobile meta data — mini-table grid */}
                                <div className="grid grid-cols-2 gap-4 lg:hidden ml-14 relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-widest">Тип</span>
                                        <span className="font-mono text-[11px] text-[var(--text-muted)]">{draft.type}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-widest">Статус</span>
                                        <div className="flex items-center gap-1.5">
                                            {draft.status === 'Готов' ? <CheckCircle2 size={12} className="text-emerald-400" /> :
                                                draft.status === 'В работе' ? <Clock size={12} className="text-[var(--text-dim)]" /> :
                                                    <Activity size={12} className="text-[var(--accent-blue)]" />}
                                            <span className={`font-inter text-[11px] font-medium ${draft.status === 'Готов' ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                                                {draft.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 col-span-2 mt-1">
                                        <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-widest">Дата изменения</span>
                                        <span className="font-mono text-[11px] text-[var(--text-muted)]">{draft.date}</span>
                                    </div>
                                </div>

                                {/* Тип — desktop only */}
                                <div className="hidden lg:flex items-center font-mono text-xs text-[var(--text-muted)] relative z-10">
                                    {draft.type}
                                </div>

                                {/* Статус — desktop only */}
                                <div className="hidden lg:flex items-center gap-2 relative z-10">
                                    {draft.status === 'Готов' ? <CheckCircle2 size={16} className="text-emerald-400" /> :
                                        draft.status === 'В работе' ? <Clock size={16} className="text-[var(--text-dim)]" /> :
                                            <Activity size={16} className="text-[var(--accent-blue)]" />}
                                    <span className={`font-inter text-sm font-medium ${draft.status === 'Готов' ? 'text-emerald-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors'}`}>
                                        {draft.status}
                                    </span>
                                </div>

                                {/* Изменен — desktop only */}
                                <div className="hidden lg:flex items-center font-mono text-xs text-[var(--text-muted)] relative z-10">
                                    {draft.date}
                                </div>

                                {/* Chevron — desktop only, hover */}
                                <div className="hidden lg:flex items-center justify-end text-[var(--text-dim)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--accent-blue)] group-hover:translate-x-1 transition-all relative z-10">
                                    <ArrowRight size={18} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
