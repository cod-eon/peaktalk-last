"use client";

import React, { useState, useEffect } from 'react';
import { Bot, Users, Briefcase, ChevronRight, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function SimulationSetupPage() {
    const router = useRouter();
    // State
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [customDomain, setCustomDomain] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
    
    // API Data
    const [drafts, setDrafts] = useState<{ id: string; title: string; content?: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        async function fetchDrafts() {
            try {
                const res = await api.get('/drafts');
                if (res?.items) setDrafts(res.items);
            } catch (error) {
                console.error('Failed to load drafts', error);
            }
        }
        fetchDrafts();
    }, []);

    // Mock Data
    const roles = [
        { id: 'investor', name: 'Венчурный Инвестор', desc: 'Въедливый. Сфокусирован на метриках, TAM и возврате инвестиций. Ждет четких цифр.', icon: Briefcase },
        { id: 'tech_lead', name: 'CEO / Техдир', desc: 'Прагматичный. Оценивает реалистичность, архитектуру и ресурсы на реализацию.', icon: Bot },
        { id: 'hr', name: 'HR / Нанимающий менеджер', desc: 'Эмпатичный, но строгий. Оценивает софт-скиллы, культурный код и стрессоустойчивость.', icon: Users },
        { id: 'listener', name: 'Скептик из зала', desc: 'Провокационный. Задает каверзные вопросы на конференции, пытается найти слабые места.', icon: MessageSquare },
    ];

    const domains = [
        { id: 'saas', name: 'B2B SaaS / IT' },
        { id: 'fintech', name: 'FinTech' },
        { id: 'edtech', name: 'EdTech' },
        { id: 'ecommerce', name: 'E-commerce / Retail' },
        { id: 'custom', name: 'Своя сфера...' },
    ];

    const isReady = selectedRole && selectedDomain && (selectedDomain !== 'custom' || customDomain.trim().length > 0);

    // Determine current step for progress stepper
    const currentStep = !selectedRole ? 1 : !selectedDomain || (selectedDomain === 'custom' && !customDomain.trim()) ? 2 : 3;

    const selectedRoleName = roles.find(r => r.id === selectedRole)?.name ?? null;

    const handleStart = async () => {
        if (!isReady) return;
        setIsStarting(true);
        
        try {
            const domainName = selectedDomain === 'custom' 
                ? customDomain 
                : domains.find(d => d.id === selectedDomain)?.name || 'General';
                
            const payload = {
                persona_config: {
                    role: selectedRole,
                    industry: domainName,
                    difficulty: 3
                },
                draft_id: selectedDoc === 'none' ? null : selectedDoc
            };

            const simulationUrl = await api.post('/simulation/start', payload);
            if (simulationUrl?.id) {
                router.push(`/simulation/${simulationUrl.id}`);
            } else {
                throw new Error('Не удалось получить ID симуляции');
            }
        } catch (error: any) {
            toast.error(error.message || 'Ошибка запуска симуляции');
            setIsStarting(false);
        }
    };

    return (
        <div className="pb-10 pt-4 sm:pt-8 w-full max-w-5xl mx-auto px-6 lg:px-10 overflow-hidden">
            <div className="flex flex-col gap-6 mb-10 sm:mb-14">
                <div>
                    <h1 className="font-syne text-2xl sm:text-3xl font-bold text-slate-100 leading-tight tracking-tight m-0 mb-4">
                        Настройка симуляции
                    </h1>
                    <p className="font-inter text-slate-400 max-w-2xl text-sm leading-relaxed">
                        Выберите характер AI-собеседника, сферу и базовый материал (если есть),
                        чтобы начать индивидуальную тренировку по защите ваших идей.
                    </p>
                </div>

                {/* Progress Stepper */}
                <div className="flex items-center gap-2 pt-2">
                    {[
                        { step: 1, label: 'Персонаж' },
                        { step: 2, label: 'Индустрия' },
                        { step: 3, label: 'Контекст' },
                    ].map(({ step, label }, i) => {
                        const isDone = currentStep > step;
                        const isActive = currentStep === step;
                        return (
                            <React.Fragment key={step}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                                        isDone
                                            ? 'bg-[var(--color-success)] text-white'
                                            : isActive
                                                ? 'bg-[var(--accent-blue)] text-white'
                                                : 'bg-[var(--bg-surface-alt)] border border-[var(--border-main)] text-[var(--text-dim)]'
                                    }`}>
                                        {isDone ? <CheckCircle2 size={14} /> : step}
                                    </div>
                                    <span className={`text-xs font-inter hidden sm:block transition-colors ${
                                        isActive ? 'text-[var(--text-main)]' : isDone ? 'text-[var(--color-success)]' : 'text-[var(--text-dim)]'
                                    }`}>
                                        {label}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div className={`flex-1 h-px max-w-[40px] transition-colors ${isDone ? 'bg-[var(--color-success)]' : 'bg-[var(--border-main)]'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-12">
                {/* 1. ROLE SELECTION */}
                <section>
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
                                            ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] shadow-[0_0_20px_rgba(56,189,248,0.15)] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2),0_0_20px_rgba(56,189,248,0.15)]' 
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
                </section>

                {/* 2. DOMAIN SELECTION */}
                <section>
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
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="Укажите вашу индустрию (например: B2C HealthTech)..."
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                maxLength={100}
                                className="w-full max-w-md bg-[var(--bg-surface-alt)] border border-[var(--border-light)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all font-inter"
                                autoFocus
                            />
                        </div>
                    )}
                </section>

                {/* 3. DOCUMENT SELECTION */}
                <section>
                    <h2 className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-widest mb-4 flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
                        Контекст для тренера
                        <span className="font-inter text-[10px] normal-case tracking-normal bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 px-2 py-0.5 rounded-full">
                            Необязательно
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setSelectedDoc('none')}
                            className={`text-left p-4 rounded-xl border transition-all flex items-start gap-4 relative ${
                                selectedDoc === 'none' 
                                    ? 'bg-[var(--accent-blue)]/5 border-[var(--accent-blue)] shadow-[0_0_15px_rgba(56,189,248,0.1)]' 
                                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                        >
                            <div className={`mt-0.5 min-w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                selectedDoc === 'none' ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)]' : 'border-slate-500 bg-[var(--bg-surface-alt)]'
                            }`}>
                                {selectedDoc === 'none' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-inter font-medium text-slate-100 truncate mb-1">
                                    Без документа
                                </div>
                                <div className="font-inter text-xs text-slate-400 line-clamp-1">
                                    Общее интервью по сфере и роли
                                </div>
                            </div>
                        </button>
                        
                        {drafts.map((doc) => {
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
                                                {doc.title}
                                            </span>
                                        </div>
                                        <div className="font-inter text-xs text-slate-400 line-clamp-1">
                                            {doc.content ? doc.content.substring(0, 60) + '...' : 'Нет предпросмотра'}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* LAUNCH BUTTON — desktop */}
                <div className="hidden md:flex pt-6 border-t border-[var(--border-main)] justify-end">
                    <button
                        disabled={!isReady || isStarting}
                        onClick={handleStart}
                        className={`btn-primary gap-2 px-6 py-3 ${
                            !isReady || isStarting ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                    >
                        {isStarting ? <Loader2 className="animate-spin" size={18} /> : 'Начать симуляцию'}
                        {!isStarting && <ChevronRight size={18} />}
                    </button>
                </div>
            </div>

            {/* STICKY BOTTOM CTA — mobile only */}
            <div className="md:hidden fixed bottom-20 left-4 right-4 z-20">
                <div className="bg-[var(--bg-surface-alt)]/95 backdrop-blur-md border border-[var(--border-light)] rounded-2xl p-3 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex-1 min-w-0">
                        <p className="font-inter text-xs text-[var(--text-dim)]">
                            {selectedRoleName ? (
                                <span className="text-[var(--text-muted)]">{selectedRoleName}</span>
                            ) : (
                                'Выберите персонажа'
                            )}
                        </p>
                    </div>
                    <button
                        disabled={!isReady || isStarting}
                        onClick={handleStart}
                        className={`btn-primary text-sm px-4 py-2.5 shrink-0 gap-2 ${
                            !isReady || isStarting ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                    >
                        {isStarting ? <Loader2 className="animate-spin" size={16} /> : (
                            <>Начать <ChevronRight size={16} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
