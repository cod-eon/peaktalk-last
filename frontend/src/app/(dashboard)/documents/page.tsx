"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, UploadCloud, File, FileType2, Search, MoreVertical, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DocumentsPage() {
    // Mock Documents Data
    const documents = [
        { id: '1', name: 'Питч перед ангелами V3.md', type: 'Pitch Deck', date: '14 Марта 2026', size: '124 KB', icon: FileText, extension: '.md' },
        { id: '2', name: 'Сценарий конфы_Техдир.txt', type: 'Tech Speech', date: '13 Марта 2026', size: '45 KB', icon: File, extension: '.txt' },
        { id: '3', name: 'Ответы на YC Interview.docx', type: 'Q&A Prep', date: '10 Марта 2026', size: '1.2 MB', icon: FileType2, extension: '.docx' },
        { id: '4', name: 'Презентация продукта_Q2.pdf', type: 'General', date: '7 Марта 2026', size: '4.8 MB', icon: FileText, extension: '.pdf' },
        { id: '5', name: 'Product_Requirements_v2.pdf', type: 'PRD', date: '1 Марта 2026', size: '2.1 MB', icon: FileText, extension: '.pdf' },
        { id: '6', name: 'Конкурентный_анализ.docx', type: 'Strategy', date: '28 Февраля 2026', size: '3.4 MB', icon: FileType2, extension: '.docx' },
    ];

    return (
        <div className="pb-10 pt-4 sm:pt-8 w-full max-w-6xl mx-auto px-6 lg:px-10 overflow-hidden">
            {/* ─── HEADER SECTION ─── */}
            <div className="flex flex-col gap-6 mb-10 sm:flex-row sm:items-center sm:justify-between sm:mb-14">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="font-mono text-[11px] text-[var(--accent-blue)] tracking-[0.1em] uppercase mb-3 flex items-center gap-2"
                    >
                        БАЗА ЗНАНИЙ
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="font-syne text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 leading-tight tracking-tight m-0"
                    >
                        Мои документы
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
                        Загрузить документ
                    </Link>
                </motion.div>
            </div>

            {/* ─── SEARCH AND FILTER BAR ─── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 mb-8"
            >
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Поиск по документам..." 
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-inter"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] rounded-xl text-sm font-inter text-slate-300 transition-colors whitespace-nowrap">
                        Все типы
                    </button>
                    <button className="px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] rounded-xl text-sm font-inter text-slate-300 transition-colors whitespace-nowrap">
                        Недавние
                    </button>
                </div>
            </motion.div>

            {/* ─── DOCUMENTS GRID ─── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
                {documents.map((doc, idx) => {
                    const Icon = doc.icon;
                    return (
                        <div 
                            key={doc.id}
                            className="bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)] p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden flex flex-col cursor-pointer"
                        >
                            {/* Decorative element */}
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--accent-blue)]/5 rounded-full blur-2xl group-hover:bg-[var(--accent-blue)]/10 transition-colors duration-500"></div>
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-light)] flex items-center justify-center text-slate-400 group-hover:text-[var(--accent-blue)] transition-colors">
                                    <Icon size={24} strokeWidth={1.5} />
                                </div>
                                <button className="p-2 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-[var(--bg-surface-alt)]">
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <div className="mb-4 relative z-10 flex-1">
                                <h3 className="font-syne text-lg font-semibold text-slate-100 mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                    {doc.name}
                                </h3>
                                <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mt-2 flex gap-2">
                                    <span className="bg-[var(--bg-surface-alt)] px-2 py-0.5 rounded border border-[var(--border-light)]">{doc.type}</span>
                                    <span className="bg-[var(--bg-surface-alt)] px-2 py-0.5 rounded border border-[var(--border-light)]">{doc.extension}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-light)]/50 relative z-10">
                                <div className="flex items-center gap-1.5 text-slate-400 font-inter text-xs">
                                    <Calendar size={12} />
                                    <span>{doc.date}</span>
                                </div>
                                <div className="font-mono text-[11px] text-slate-500">
                                    {doc.size}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
}
