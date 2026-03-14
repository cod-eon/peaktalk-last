"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Users, Briefcase, ChevronRight, FileText, CheckCircle2, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function SimulationSetupPage() {
    // State
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [customDomain, setCustomDomain] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

    // Mock Data
    const roles = [
        { id: 'investor', name: 'Венчурный Инвестор', desc: 'Въедливый. Сфокусирован на метриках, TAM и возврате инвестиций. Ждет четких цифр.', icon: Briefcase },
        { id: 'cto', name: 'CEO / Техдир', desc: 'Прагматичный. Оценивает реалистичность, архитектуру и ресурсы на реализацию.', icon: Bot },
        { id: 'hr', name: 'HR / Нанимающий менеджер', desc: 'Эмпатичный, но строгий. Оценивает софт-скиллы, культурный код и стрессоустойчивость.', icon: Users },
        { id: 'skeptic', name: 'Скептик из зала', desc: 'Провокационный. Задает каверзные вопросы на конференции, пытается найти слабые места.', icon: MessageSquare },
    ];

    const domains = [
        { id: 'saas', name: 'B2B SaaS / IT' },
        { id: 'fintech', name: 'FinTech' },
        { id: 'edtech', name: 'EdTech' },
        { id: 'ecommerce', name: 'E-commerce / Retail' },
        { id: 'custom', name: 'Своя сфера...' },
    ];

    const documents = [
        { id: 'none', name: 'Без документа', desc: 'Общее интервью по сфере и роли', type: 'General' },
        { id: 'doc1', name: 'Питч перед ангелами V3.md', desc: 'B2B SaaS платформа для оптимизации логистики', type: 'Pitch Deck' },
        { id: 'doc2', name: 'Сценарий конфы_Техдир.txt', desc: 'Выступление на HighLoad 2026', type: 'Tech Speech' },
        { id: 'doc3', name: 'Ответы на YC Interview.docx', desc: 'Черновик ответов на вопросы акселератора', type: 'Q&A Prep' },
    ];

    const isReady = selectedRole && (selectedDomain !== 'custom' || customDomain.length > 0) && selectedDoc;

    return (
        <div className="pb-10 pt-4 sm:pt-8 w-full max-w-5xl mx-auto px-6 lg:px-10 overflow-hidden">
            <div className="flex flex-col gap-6 mb-10 sm:mb-14">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="font-mono text-[11px] text-[var(--accent-blue)] tracking-[0.1em] uppercase mb-3 flex items-center gap-2"
                    >
                        КОНФИГУРАЦИЯ СЕССИИ
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="font-syne text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 leading-tight tracking-tight m-0"
                    >
                        Настройка симуляции
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="font-inter text-slate-400 mt-4 max-w-2xl text-sm leading-relaxed"
                    >
                        Выберите характер AI-собеседника, сферу и базовый материал (если есть), 
                        чтобы начать индивидуальную тренировку по защите ваших идей в условиях, приближенных к реальности.
                    </motion.p>
                </div>
            </div>

            <div className="space-y-12">
                {/* 1. ROLE SELECTION */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h2 className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[var(--border-main)] pb-3">
                        <span className="text-[var(--text-muted)]">Шаг 1:</span> Выбор собеседника
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {roles.map((role) => {
                            const Icon = role.icon;
                            const isSelected = selectedRole === role.id;
                            
                            return (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                                        isSelected 
                                            ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] shadow-[0_0_20px_rgba(56,189,248,0.15)] glow-border' 
                                            : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-4 right-4 text-[var(--accent-blue)]">
                                            <CheckCircle2 size={18} />
                                        </div>
                                    )}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                                        isSelected ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]' : 'bg-[var(--bg-surface-alt)] border border-[var(--border-light)] text-slate-400 group-hover:text-slate-300'
                                    }`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="font-syne text-lg font-semibold text-slate-100 mb-2">
                                        {role.name}
                                    </div>
                                    <div className="font-inter text-xs text-slate-400 leading-relaxed">
                                        {role.desc}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </motion.section>

                {/* 2. DOMAIN SELECTION */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h2 className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[var(--border-main)] pb-3">
                        <span className="text-[var(--text-muted)]">Шаг 2:</span> Индустрия / Ниша
                    </h2>
                    
                    <div className="flex flex-wrap gap-3">
                        {domains.map((domain) => (
                            <button
                                key={domain.id}
                                onClick={() => setSelectedDomain(domain.id)}
                                className={`px-4 py-2.5 rounded-lg border text-sm font-inter transition-all ${
                                    selectedDomain === domain.id
                                        ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] text-[var(--accent-blue)]'
                                        : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-slate-300 hover:border-[var(--border-light)]'
                                }`}
                            >
                                {domain.name}
                            </button>
                        ))}
                    </div>
                    
                    {/* Custom Domain Input */}
                    {selectedDomain === 'custom' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            className="overflow-hidden"
                        >
                            <input
                                type="text"
                                placeholder="Укажите вашу индустрию (например: B2C HealthTech)..."
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                className="w-full max-w-md bg-[var(--bg-surface-alt)] border border-[var(--border-light)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-inter"
                                autoFocus
                            />
                        </motion.div>
                    )}
                </motion.section>

                {/* 3. DOCUMENT SELECTION */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <h2 className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[var(--border-main)] pb-3">
                        <span className="text-[var(--text-muted)]">Шаг 3:</span> Контекст для тренера
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => {
                            const isSelected = selectedDoc === doc.id;
                            
                            return (
                                <button
                                    key={doc.id}
                                    onClick={() => setSelectedDoc(doc.id)}
                                    className={`text-left p-4 rounded-xl border transition-all flex items-start gap-4 relative ${
                                        isSelected 
                                            ? 'bg-[var(--accent-blue)]/5 border-[var(--accent-blue)] shadow-[0_0_15px_rgba(56,189,248,0.1)]' 
                                            : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                    }`}
                                >
                                    <div className={`mt-0.5 min-w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)]' : 'border-slate-500 bg-[var(--bg-surface-alt)]'
                                    }`}>
                                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-inter font-medium text-slate-100 truncate">
                                                {doc.name}
                                            </span>
                                            {doc.id !== 'none' && (
                                                <span className="flex-shrink-0 font-mono text-[9px] uppercase tracking-wider text-slate-400 bg-[var(--bg-surface-alt)] border border-[var(--border-light)] px-1.5 py-0.5 rounded">
                                                    {doc.type}
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-inter text-xs text-slate-400 line-clamp-1">
                                            {doc.desc}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </motion.section>

                {/* LAUNCH BUTTON */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="pt-6 border-t border-[var(--border-main)] flex justify-end"
                >
                    <Link
                        href={isReady ? "/simulation/mock-123" : "#"}
                        className={`inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-syne font-semibold text-sm transition-all duration-300 ${
                            isReady
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transform hover:-translate-y-0.5'
                                : 'bg-[var(--bg-surface-alt)] border border-[var(--border-main)] text-slate-500 cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                            if (!isReady) e.preventDefault();
                        }}
                    >
                        Начать симуляцию
                        <ChevronRight size={18} />
                    </Link>
                </motion.div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .glow-border {
                    box-shadow: inset 0 0 0 1px rgba(56,189,248,0.2), 0 0 20px rgba(56,189,248,0.15);
                }
            `}} />
        </div>
    );
}
