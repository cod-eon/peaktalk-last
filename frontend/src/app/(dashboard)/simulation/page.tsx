"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Users, Briefcase, ChevronRight, CheckCircle2, MessageSquare,
    Loader2, Plus, ArrowLeft, Clock, Trophy, Zap, BarChart2
} from 'lucide-react';
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
    status: 'active' | 'completed';
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

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── History card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onClick }: { session: SessionItem; onClick: () => void }) {
    const isActive = session.status === 'active';
    const scoreLabel = session.avg_score != null
        ? `${Math.round(session.avg_score * 100)}%`
        : null;
    const personaLabel = PERSONA_LABELS[session.persona_config.role] ?? session.persona_config.role;

    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left w-full p-5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)] transition-all group"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary-bg)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                        <Bot size={16} />
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
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                }`}>
                    {isActive ? 'Активна' : 'Завершена'}
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
    const [drafts, setDrafts] = useState<{ id: string; title: string; content?: string }[]>([]);
    const [isStarting, setIsStarting] = useState(false);

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

    // ── Derived setup state ──────────────────────────────────────────────────

    const fallbackRoles = [
        { id: 'investor', name: 'Венчурный Инвестор', desc: 'Въедливый. Сфокусирован на метриках, TAM и возврате инвестиций.', icon: Briefcase },
        { id: 'tech_lead', name: 'Тимлид / Principal Engineer', desc: 'Прагматичный. Оценивает реалистичность, архитектуру и ресурсы.', icon: Bot },
        { id: 'hr', name: 'HR-менеджер', desc: 'Эмпатичный, но строгий. Оценивает мотивацию и soft skills.', icon: Users },
        { id: 'audience', name: 'Общая аудитория', desc: 'Провокационный. Задаёт каверзные вопросы, ищет слабые места.', icon: MessageSquare },
    ];

    const fallbackIndustries = ["IT / Технологии", "Образование", "Медицина", "Финансы", "Другое"];
    const industryList = personasData ? personasData.industries : fallbackIndustries;
    const domains = [
        ...industryList.map((name) => ({ id: name, name })),
        { id: 'custom', name: 'Своя сфера...' },
    ];

    const isReady = selectedRole && selectedDomain && (selectedDomain !== 'custom' || customDomain.trim().length > 0);
    const currentStep = !selectedRole ? 1 : !selectedDomain || (selectedDomain === 'custom' && !customDomain.trim()) ? 2 : 3;
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
        } else {
            router.push(`/simulation/${session.id}/report`);
        }
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
                    <div>
                        <h2 className="label-kicker mb-3">Завершённые</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {completedSessions.map(s => (
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
        <div className="pb-10 pt-4 sm:pt-8 w-full max-w-5xl mx-auto px-6 lg:px-10 overflow-hidden">
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
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedRole(key)}
                                            className={`text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                                                isSelected
                                                    ? 'bg-[var(--accent-primary-bg)] border-[var(--accent-primary)] shadow-[0_0_20px_var(--accent-primary-glow)]'
                                                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 text-[var(--accent-primary)]">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                                                isSelected ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)]' : 'bg-[var(--bg-surface-alt)] border border-[var(--border-light)] text-[var(--text-dim)] group-hover:text-[var(--text-muted)]'
                                            }`}>
                                                <Bot size={20} />
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
                                            className={`text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                                                isSelected
                                                    ? 'bg-[var(--accent-primary-bg)] border-[var(--accent-primary)] shadow-[0_0_20px_var(--accent-primary-glow)]'
                                                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 text-[var(--accent-primary)]">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                                                isSelected ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)]' : 'bg-[var(--bg-surface-alt)] border border-[var(--border-light)] text-[var(--text-dim)] group-hover:text-[var(--text-muted)]'
                                            }`}>
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
                    <h2 className="label-kicker mb-4 flex items-center gap-3 border-b border-[var(--border-main)] pb-3">
                        Контекст для тренера
                        <span className="font-inter text-[10px] normal-case tracking-normal bg-[var(--accent-primary-bg)] text-[var(--accent-primary)] border border-[var(--accent-primary-glow)] px-2 py-0.5 rounded-full">
                            Необязательно
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setSelectedDoc('none')}
                            className={`text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                                selectedDoc === 'none'
                                    ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)] shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                                    : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                        >
                            <div className={`mt-0.5 min-w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                selectedDoc === 'none' ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-[var(--border-light)] bg-[var(--bg-surface-alt)]'
                            }`}>
                                {selectedDoc === 'none' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <div>
                                <div className="font-inter font-medium text-[var(--text-main)] mb-1">Без документа</div>
                                <div className="font-inter text-xs text-[var(--text-muted)]">Общее интервью по сфере и роли</div>
                            </div>
                        </button>
                        {drafts.map((doc) => {
                            const isSelected = selectedDoc === doc.id;
                            return (
                                <button
                                    key={doc.id}
                                    onClick={() => setSelectedDoc(doc.id)}
                                    className={`text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                                        isSelected
                                            ? 'bg-[var(--accent-primary-bg)] border-[var(--accent-primary)] shadow-[0_0_15px_var(--accent-primary-glow)]'
                                            : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                    }`}
                                >
                                    <div className={`mt-0.5 min-w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-[var(--border-light)] bg-[var(--bg-surface-alt)]'
                                    }`}>
                                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-inter font-medium text-[var(--text-main)] truncate mb-1">{doc.title}</div>
                                        <div className="font-inter text-xs text-[var(--text-muted)] line-clamp-1">
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
                        className={`btn-primary gap-2 px-6 py-3 ${!isReady || isStarting ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                        className={`btn-primary text-sm px-4 py-2.5 shrink-0 gap-2 ${!isReady || isStarting ? 'opacity-40 cursor-not-allowed' : ''}`}
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
