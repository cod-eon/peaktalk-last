"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Users, Briefcase, ChevronRight, CheckCircle2, MessageSquare,
    Loader2, Plus, ArrowLeft, Clock, Trophy, Zap, BarChart2,
    TrendingUp, Mic, Search, ChevronDown, Ban, FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type PersonaInfo = {
    title: string;
    description: string;
    style: string;
    focus: string;
};

type PersonasData = {
    segment: string;
    default_difficulty: number;
    personas: Record<string, PersonaInfo>;
    industries: string[];
};

type SessionItem = {
    id: string;
    persona_config: { role: string; industry: string; difficulty: number };
    status: 'active' | 'completed' | 'cancelled';
    created_at: string;
    completed_at: string | null;
    message_count: number;
    avg_score: number | null;
};

// ─── Persona label map (for history cards) ────────────────────────────────────

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

// ─── Role visual config ───────────────────────────────────────────────────────

type RoleVisual = { icon: LucideIcon; iconColor: string; iconBg: string };

const ROLE_VISUALS: Record<string, RoleVisual> = {
    investor:   { icon: TrendingUp,    iconColor: 'text-amber-600',  iconBg: 'bg-amber-50' },
    partner:    { icon: Users,         iconColor: 'text-blue-600',   iconBg: 'bg-blue-50' },
    customer:   { icon: MessageSquare, iconColor: 'text-green-600',  iconBg: 'bg-green-50' },
    tech_lead:  { icon: Briefcase,     iconColor: 'text-blue-600',   iconBg: 'bg-blue-50' },
    hr:         { icon: Users,         iconColor: 'text-pink-600',   iconBg: 'bg-pink-50' },
    senior_dev: { icon: Zap,           iconColor: 'text-cyan-600',   iconBg: 'bg-cyan-50' },
    supervisor: { icon: Bot,           iconColor: 'text-purple-600', iconBg: 'bg-purple-50' },
    reviewer:   { icon: Search,        iconColor: 'text-red-500',    iconBg: 'bg-red-50' },
    peer:       { icon: Users,         iconColor: 'text-teal-600',   iconBg: 'bg-teal-50' },
    board:      { icon: Briefcase,     iconColor: 'text-slate-600',  iconBg: 'bg-slate-100' },
    subordinate:{ icon: Users,         iconColor: 'text-amber-500',  iconBg: 'bg-amber-50' },
    journalist: { icon: Mic,           iconColor: 'text-orange-500', iconBg: 'bg-orange-50' },
    audience:   { icon: Mic,           iconColor: 'text-violet-600', iconBg: 'bg-violet-50' },
    moderator:  { icon: MessageSquare, iconColor: 'text-stone-600',  iconBg: 'bg-stone-100' },
    listener:   { icon: MessageSquare, iconColor: 'text-rose-500',   iconBg: 'bg-rose-50' },
};

const DEFAULT_VISUAL: RoleVisual = { icon: Bot, iconColor: 'text-[var(--text-dim)]', iconBg: 'bg-[var(--bg-surface-alt)]' };

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── History card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onClick }: { session: SessionItem; onClick: () => void }) {
    const isActive = session.status === 'active';
    const isCancelled = session.status === 'cancelled';
    const scoreLabel = session.avg_score != null
        ? `${Math.round(session.avg_score * 100)}%`
        : null;
    const personaLabel = PERSONA_LABELS[session.persona_config.role] ?? session.persona_config.role;
    const visual = ROLE_VISUALS[session.persona_config.role] ?? DEFAULT_VISUAL;
    const RoleIcon = visual.icon;

    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left w-full p-5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)] transition-all group"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${visual.iconBg} ${visual.iconColor} flex items-center justify-center shrink-0`}>
                        <RoleIcon size={16} />
                    </div>
                    <div className="min-w-0">
                        <div className="font-syne font-semibold text-[var(--text-main)] text-sm truncate">
                            {personaLabel}
                        </div>
                        <div className="font-inter text-xs text-[var(--text-muted)] truncate">
                            {session.persona_config.industry}
                        </div>
                    </div>
                </div>
                <span className={`shrink-0 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isActive
                        ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
                        : isCancelled
                            ? 'bg-[var(--bg-surface-alt)] text-[var(--text-dim)] border-[var(--border-main)]'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                }`}>
                    {isActive ? 'Активна' : isCancelled ? 'Прервана' : 'Завершена'}
                </span>
            </div>

            <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
                    <Clock size={11} />
                    <span className="font-mono text-[10px]">{formatDate(session.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
                    <MessageSquare size={11} />
                    <span className="font-mono text-[10px]">{session.message_count} сообщ.</span>
                </div>
                {scoreLabel && (
                    <div className="flex items-center gap-1.5 text-emerald-500">
                        <Trophy size={11} />
                        <span className="font-mono text-[10px] font-semibold">{scoreLabel}</span>
                    </div>
                )}
                <div className="ml-auto text-[var(--text-dim)] group-hover:text-[var(--accent-primary)] transition-colors">
                    <ChevronRight size={14} />
                </div>
            </div>
        </motion.button>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function SimulationPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftFromUrl = searchParams.get('draft');

    // View state
    const [view, setView] = useState<'loading' | 'history' | 'setup'>('loading');

    // Sessions history
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    // Setup form state
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [customDomain, setCustomDomain] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<number>(3);
    const [difficultyManuallySet, setDifficultyManuallySet] = useState(false);

    // Personas from API
    const [personasData, setPersonasData] = useState<PersonasData | null>(null);
    const [personasLoading, setPersonasLoading] = useState(true);

    // Drafts
    const [drafts, setDrafts] = useState<{ id: string; title: string; content?: string; created_at?: string }[]>([]);
    const [isStarting, setIsStarting] = useState(false);

    // Doc combobox
    const [docDropdownOpen, setDocDropdownOpen] = useState(false);
    const [docDropdownPlacement, setDocDropdownPlacement] = useState<'bottom' | 'top'>('bottom');
    const [docSearch, setDocSearch] = useState('');
    const docDropdownRef = useRef<HTMLDivElement>(null);
    const docTriggerRef = useRef<HTMLButtonElement>(null);

    // Load sessions, personas and drafts on mount
    useEffect(() => {
        async function fetchAll() {
            const [sessionsRes, personasRes, draftsRes] = await Promise.allSettled([
                api.get('/simulation?limit=50'),
                api.get('/simulation/personas'),
                api.get('/drafts'),
            ]);

            // Sessions
            if (sessionsRes.status === 'fulfilled' && sessionsRes.value?.items) {
                const items: SessionItem[] = sessionsRes.value.items;
                setSessions(items);
                setView(items.length > 0 ? 'history' : 'setup');
            } else {
                setView('setup');
            }
            setSessionsLoading(false);

            // Personas
            if (personasRes.status === 'fulfilled' && personasRes.value?.personas) {
                setPersonasData(personasRes.value as PersonasData);
                if (!difficultyManuallySet) {
                    setDifficulty(personasRes.value.default_difficulty);
                }
            }
            setPersonasLoading(false);

            // Drafts
            if (draftsRes.status === 'fulfilled' && draftsRes.value?.items) {
                setDrafts(draftsRes.value.items);
            }
        }
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-select draft from URL param once data is loaded
    useEffect(() => {
        if (draftFromUrl && !sessionsLoading) {
            setSelectedDoc(draftFromUrl);
            setView('setup');
        }
    }, [draftFromUrl, sessionsLoading]);

    // Open doc dropdown with collision detection
    const handleDocDropdownToggle = () => {
        if (!docDropdownOpen && docTriggerRef.current) {
            const rect = docTriggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setDocDropdownPlacement(spaceBelow < 320 ? 'top' : 'bottom');
        }
        setDocDropdownOpen(prev => !prev);
    };

    // Close doc dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (docDropdownRef.current && !docDropdownRef.current.contains(e.target as Node)) {
                setDocDropdownOpen(false);
            }
        }
        if (docDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [docDropdownOpen]);

    // ── Derived setup state ──────────────────────────────────────────────────

    const fallbackRoles = [
        { id: 'investor', name: 'Венчурный Инвестор', desc: 'Въедливый. Сфокусирован на метриках, TAM и возврате инвестиций.', icon: TrendingUp, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
        { id: 'tech_lead', name: 'Тимлид / Principal Engineer', desc: 'Прагматичный. Оценивает реалистичность, архитектуру и ресурсы.', icon: Briefcase, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
        { id: 'hr', name: 'HR-менеджер', desc: 'Эмпатичный, но строгий. Оценивает мотивацию и soft skills.', icon: Users, iconColor: 'text-pink-600', iconBg: 'bg-pink-50' },
        { id: 'audience', name: 'Общая аудитория', desc: 'Провокационный. Задаёт каверзные вопросы, ищет слабые места.', icon: Mic, iconColor: 'text-violet-600', iconBg: 'bg-violet-50' },
    ];

    const fallbackIndustries = ["IT / Технологии", "Образование", "Медицина", "Финансы", "Другое"];
    const industryList = personasData ? personasData.industries : fallbackIndustries;
    const domains = [
        ...industryList.map((name) => ({ id: name, name })),
        { id: 'custom', name: 'Своя сфера...' },
    ];

    const isReady = selectedRole && selectedDomain && (selectedDomain !== 'custom' || customDomain.trim().length > 0) && selectedDoc !== null;
    const currentStep = !selectedRole ? 1
        : !selectedDomain || (selectedDomain === 'custom' && !customDomain.trim()) ? 2
        : selectedDoc === null ? 3
        : 4;
    const selectedRoleName = personasData
        ? (personasData.personas[selectedRole ?? '']?.title ?? null)
        : (fallbackRoles.find(r => r.id === selectedRole)?.name ?? null);

    const handleStart = async () => {
        if (!isReady) return;
        setIsStarting(true);
        try {
            const domainName = selectedDomain === 'custom' ? customDomain : selectedDomain;
            const payload = {
                persona_config: { role: selectedRole, industry: domainName, difficulty },
                draft_id: selectedDoc === 'none' ? null : selectedDoc,
            };
            const res = await api.post('/simulation/start', payload);
            if (res?.id) {
                router.push(`/simulation/${res.id}`);
            } else {
                throw new Error('Не удалось получить ID симуляции');
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Ошибка запуска симуляции';
            toast.error(msg);
            setIsStarting(false);
        }
    };

    const handleSessionClick = (session: SessionItem) => {
        if (session.status === 'active') {
            router.push(`/simulation/${session.id}`);
        } else if (session.status === 'completed') {
            router.push(`/simulation/${session.id}/report`);
        }
        // cancelled — not clickable (no report available)
    };

    // ── Loading splash ───────────────────────────────────────────────────────

    if (view === 'loading') {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[40vh]">
                <Loader2 className="animate-spin text-[var(--accent-primary)]" size={28} />
            </div>
        );
    }

    // ── History view ─────────────────────────────────────────────────────────

    if (view === 'history') {
        const activeSessions = sessions.filter(s => s.status === 'active');
        const completedSessions = sessions.filter(s => s.status === 'completed');
        const cancelledSessions = sessions.filter(s => s.status === 'cancelled');

        return (
            <div className="pb-10 pt-4 sm:pt-8 w-full max-w-5xl mx-auto px-6 lg:px-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-10">
                    <div>
                        <h1 className="font-syne text-2xl sm:text-3xl font-bold text-[var(--text-main)] leading-tight tracking-tight mb-2">
                            Симуляции
                        </h1>
                        <p className="font-inter text-[var(--text-muted)] text-sm">
                            {sessions.length} {sessions.length === 1 ? 'сессия' : sessions.length < 5 ? 'сессии' : 'сессий'} · нажми на любую, чтобы открыть
                        </p>
                    </div>
                    <button
                        onClick={() => setView('setup')}
                        className="btn-primary shrink-0 gap-2 px-5 py-2.5 text-sm"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Новая симуляция</span>
                        <span className="sm:hidden">Новая</span>
                    </button>
                </div>

                {/* Stats strip */}
                {completedSessions.length > 0 && (() => {
                    const scores = completedSessions.filter(s => s.avg_score != null).map(s => s.avg_score!);
                    const avgScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) : null;
                    return (
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {[
                                { icon: Zap, label: 'Всего сессий', value: String(sessions.length) },
                                { icon: CheckCircle2, label: 'Завершено', value: String(completedSessions.length) },
                                { icon: BarChart2, label: 'Средний балл', value: avgScore != null ? `${avgScore}%` : '—' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-4 text-center">
                                    <Icon size={18} className="text-[var(--accent-primary)] mx-auto mb-2" />
                                    <div className="font-syne font-bold text-lg text-[var(--text-main)]">{value}</div>
                                    <div className="font-inter text-[10px] text-[var(--text-dim)] uppercase tracking-wider mt-0.5">{label}</div>
                                </div>
                            ))}
                        </div>
                    );
                })()}

                {/* Active sessions */}
                {activeSessions.length > 0 && (
                    <div className="mb-8">
                        <h2 className="label-kicker mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse" />
                            Активные
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeSessions.map(s => (
                                <SessionCard key={s.id} session={s} onClick={() => handleSessionClick(s)} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed sessions */}
                {completedSessions.length > 0 && (
                    <div className={cancelledSessions.length > 0 ? 'mb-8' : ''}>
                        <h2 className="label-kicker mb-3">Завершённые</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {completedSessions.map(s => (
                                <SessionCard key={s.id} session={s} onClick={() => handleSessionClick(s)} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Cancelled sessions */}
                {cancelledSessions.length > 0 && (
                    <div>
                        <h2 className="label-kicker mb-3 text-[var(--text-dim)]">Прерванные</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-50">
                            {cancelledSessions.map(s => (
                                <SessionCard key={s.id} session={s} onClick={() => handleSessionClick(s)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Setup view ───────────────────────────────────────────────────────────

    return (
        <div className="pb-48 pt-4 sm:pt-8 w-full max-w-5xl mx-auto px-6 lg:px-10">
            <div className="flex flex-col gap-6 mb-10 sm:mb-14">
                <div className="flex items-start gap-3">
                    {sessions.length > 0 && (
                        <button
                            onClick={() => setView('history')}
                            className="mt-1 p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div>
                        <h1 className="font-syne text-2xl sm:text-3xl font-bold text-[var(--text-main)] leading-tight tracking-tight m-0 mb-2">
                            Настройка симуляции
                        </h1>
                        <p className="font-inter text-[var(--text-muted)] max-w-2xl text-sm leading-relaxed">
                            Выберите AI-собеседника, сферу и материал для тренировки.
                        </p>
                    </div>
                </div>

                {/* Progress Stepper */}
                <div className="flex items-center gap-2 pt-1">
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
                                                ? 'bg-[var(--accent-primary)] text-white'
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
                    <h2 className="label-kicker mb-4 flex items-center gap-2 border-b border-[var(--border-main)] pb-3">
                        <span className="text-[var(--text-muted)]">Шаг 1:</span> Выбор собеседника
                    </h2>
                    <AnimatePresence mode="wait">
                        {personasLoading ? (
                            <div className="flex items-center gap-3 py-8 text-[var(--text-muted)]">
                                <Loader2 className="animate-spin" size={20} />
                                <span className="font-inter text-sm">Загружаем собеседников...</span>
                            </div>
                        ) : personasData ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(personasData.personas).map(([key, persona]) => {
                                    const isSelected = selectedRole === key;
                                    const visual = ROLE_VISUALS[key] || DEFAULT_VISUAL;
                                    const IconComp = visual.icon;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedRole(key)}
                                            className={`text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                                                isSelected
                                                    ? 'bg-orange-50 border-2 border-orange-500 shadow-[0_0_20px_var(--accent-primary-glow)]'
                                                    : 'bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 text-orange-500">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${visual.iconBg} border border-[var(--border-light)] ${visual.iconColor}`}>
                                                <IconComp size={20} />
                                            </div>
                                            <div className="font-syne text-lg font-semibold text-[var(--text-main)] mb-2">
                                                {persona.title}
                                            </div>
                                            <div className="font-inter text-xs text-[var(--text-muted)] leading-relaxed">
                                                {persona.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {fallbackRoles.map((role) => {
                                    const Icon = role.icon;
                                    const isSelected = selectedRole === role.id;
                                    return (
                                        <button
                                            key={role.id}
                                            onClick={() => setSelectedRole(role.id)}
                                            className={`text-left p-5 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                                                isSelected
                                                    ? 'bg-orange-50 border-2 border-orange-500 shadow-[0_0_20px_var(--accent-primary-glow)]'
                                                    : 'bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 text-orange-500">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 border border-[var(--border-light)] ${role.iconBg} ${role.iconColor}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="font-syne text-lg font-semibold text-[var(--text-main)] mb-2">
                                                {role.name}
                                            </div>
                                            <div className="font-inter text-xs text-[var(--text-muted)] leading-relaxed">
                                                {role.desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>
                </section>

                {/* 2. DOMAIN SELECTION */}
                <section>
                    <h2 className="label-kicker mb-4 flex items-center gap-2 border-b border-[var(--border-main)] pb-3">
                        <span className="text-[var(--text-muted)]">Шаг 2:</span> Индустрия / Ниша
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {domains.map((domain) => (
                            <button
                                key={domain.id}
                                onClick={() => setSelectedDomain(domain.id)}
                                className={`px-4 py-2.5 rounded-lg border text-sm font-inter transition-all ${
                                    selectedDomain === domain.id
                                        ? 'bg-[var(--accent-primary-bg)] border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                        : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--border-light)]'
                                }`}
                            >
                                {domain.name}
                            </button>
                        ))}
                    </div>
                    {selectedDomain === 'custom' && (
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="Укажите вашу индустрию (например: B2C HealthTech)..."
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                maxLength={100}
                                className="w-full max-w-md bg-[var(--bg-surface-alt)] border border-[var(--border-light)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] rounded-lg px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-dim)] outline-none transition-all font-inter"
                                autoFocus
                            />
                        </div>
                    )}
                </section>

                {/* 3. DOCUMENT SELECTION */}
                <section>
                    <h2 className="label-kicker mb-4 flex items-center gap-2 border-b border-[var(--border-main)] pb-3">
                        <span className="text-[var(--text-muted)]">Шаг 3:</span> Контекст для тренера
                    </h2>

                    {/* Combobox */}
                    <div className="relative max-w-lg" ref={docDropdownRef}>
                        {/* Trigger */}
                        <button
                            type="button"
                            ref={docTriggerRef}
                            onClick={handleDocDropdownToggle}
                            className={`w-full h-14 flex items-center gap-3 px-4 rounded-xl border transition-all text-left cursor-pointer ${
                                docDropdownOpen
                                    ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary-glow)] bg-[var(--bg-surface)]'
                                    : selectedDoc !== null
                                        ? 'border-orange-300 bg-orange-50'
                                        : 'border-[var(--border-main)] bg-[var(--bg-surface)] hover:border-[var(--border-light)]'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-surface-alt)] border border-[var(--border-light)]">
                                {selectedDoc === 'none'
                                    ? <Ban size={16} className="text-[var(--text-dim)]" />
                                    : selectedDoc
                                        ? <FileText size={16} className="text-orange-500" />
                                        : <FileText size={16} className="text-[var(--text-dim)]" />
                                }
                            </div>
                            <span className={`flex-1 text-sm font-inter truncate ${selectedDoc !== null ? 'text-[var(--text-main)] font-medium' : 'text-[var(--text-dim)]'}`}>
                                {selectedDoc === 'none'
                                    ? 'Без документа — общее интервью'
                                    : selectedDoc
                                        ? drafts.find(d => d.id === selectedDoc)?.title ?? 'Выбранный документ'
                                        : 'Выберите контекст для тренировки...'}
                            </span>
                            <ChevronDown
                                size={16}
                                className={`shrink-0 text-[var(--text-dim)] transition-transform duration-200 ${docDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown */}
                        <AnimatePresence>
                            {docDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: docDropdownPlacement === 'top' ? 6 : -6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: docDropdownPlacement === 'top' ? 6 : -6, scale: 0.98 }}
                                    transition={{ duration: 0.13 }}
                                    className={`absolute left-0 right-0 z-30 max-h-[320px] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden ${
                                        docDropdownPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                                    }`}
                                >
                                    {/* Search — sticky */}
                                    <div className="p-2 border-b border-[var(--border-main)]">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="Поиск по документам..."
                                                value={docSearch}
                                                onChange={(e) => setDocSearch(e.target.value)}
                                                autoFocus
                                                className="w-full pl-9 pr-3 py-2 text-sm font-inter bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent-primary)] transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* «Без документа» — pinned */}
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedDoc('none'); setDocDropdownOpen(false); setDocSearch(''); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[var(--border-main)] ${
                                            selectedDoc === 'none' ? 'bg-orange-50' : 'hover:bg-[var(--bg-surface-alt)]'
                                        }`}
                                    >
                                        <div className="w-7 h-7 rounded-md bg-[var(--bg-surface-alt)] border border-[var(--border-light)] flex items-center justify-center shrink-0">
                                            <Ban size={14} className="text-[var(--text-dim)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium font-inter text-[var(--text-main)]">Без документа</div>
                                            <div className="text-xs text-[var(--text-dim)] font-inter">Общее интервью по выбранной роли и сфере</div>
                                        </div>
                                        {selectedDoc === 'none' && <CheckCircle2 size={15} className="text-orange-500 shrink-0" />}
                                    </button>

                                    {/* Document list */}
                                    <div className="flex-1 overflow-y-auto min-h-0">
                                        {(() => {
                                            const filtered = drafts.filter(d =>
                                                d.title.toLowerCase().includes(docSearch.toLowerCase())
                                            );
                                            if (filtered.length === 0) {
                                                return (
                                                    <div className="py-8 text-center text-sm text-[var(--text-dim)] font-inter">
                                                        {docSearch ? `Ничего не найдено по «${docSearch}»` : 'Нет загруженных документов'}
                                                    </div>
                                                );
                                            }
                                            return filtered.map((doc) => {
                                                const isSelected = selectedDoc === doc.id;
                                                const dateStr = doc.created_at
                                                    ? new Date(doc.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                                                    : null;
                                                return (
                                                    <button
                                                        key={doc.id}
                                                        type="button"
                                                        onClick={() => { setSelectedDoc(doc.id); setDocDropdownOpen(false); setDocSearch(''); }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                                            isSelected ? 'bg-orange-50' : 'hover:bg-[var(--bg-surface-alt)]'
                                                        }`}
                                                    >
                                                        <div className="w-7 h-7 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                                                            <FileText size={14} className="text-orange-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium font-inter text-[var(--text-main)] truncate">{doc.title}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 shrink-0">
                                                            {dateStr && (
                                                                <span className="text-[11px] font-mono text-[var(--text-dim)]">{dateStr}</span>
                                                            )}
                                                            {isSelected && <CheckCircle2 size={15} className="text-orange-500" />}
                                                        </div>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>

                                    {/* Upload link — bottom */}
                                    <div className="p-2 border-t border-[var(--border-main)]">
                                        <Link
                                            href="/upload"
                                            onClick={() => setDocDropdownOpen(false)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium font-inter text-[var(--accent-primary)] hover:bg-[var(--accent-primary-bg)] rounded-lg transition-colors"
                                        >
                                            <Plus size={15} />
                                            Загрузить новый документ
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* LAUNCH BUTTON — desktop */}
                <div className="hidden md:flex pt-6 border-t border-[var(--border-main)] justify-end">
                    <button
                        disabled={!isReady || isStarting}
                        onClick={handleStart}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-sm)] text-sm font-semibold font-inter transition-all duration-200 ${
                            isReady && !isStarting
                                ? 'bg-[var(--accent-primary)] text-white cursor-pointer shadow-[0_4px_16px_rgba(249,115,22,0.35)] hover:bg-[var(--accent-primary-hover)] hover:shadow-[0_6px_24px_rgba(249,115,22,0.45)]'
                                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        }`}
                    >
                        {isStarting ? <Loader2 className="animate-spin" size={18} /> : 'Начать симуляцию'}
                        {!isStarting && <ChevronRight size={18} />}
                    </button>
                </div>
            </div>

            {/* STICKY BOTTOM CTA — mobile */}
            <div className="md:hidden fixed bottom-20 left-4 right-4 z-20">
                <div className="bg-[var(--bg-surface-alt)]/95 backdrop-blur-md border border-[var(--border-light)] rounded-2xl p-3 flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex-1 min-w-0">
                        <p className="font-inter text-xs text-[var(--text-dim)]">
                            {selectedRoleName
                                ? <span className="text-[var(--text-muted)]">{selectedRoleName}</span>
                                : 'Выберите персонажа'}
                        </p>
                    </div>
                    <button
                        disabled={!isReady || isStarting}
                        onClick={handleStart}
                        className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 shrink-0 rounded-[var(--radius-sm)] font-semibold font-inter transition-all ${
                            isReady && !isStarting
                                ? 'bg-[var(--accent-primary)] text-white shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-[var(--accent-primary-hover)]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isStarting ? <Loader2 className="animate-spin" size={16} /> : <><span>Начать</span><ChevronRight size={16} /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SimulationPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-[40vh]">
                <Loader2 className="animate-spin text-[var(--accent-primary)]" size={28} />
            </div>
        }>
            <SimulationPageContent />
        </Suspense>
    );
}
