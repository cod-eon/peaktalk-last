"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Users, Briefcase, ChevronRight, CheckCircle2, MessageSquare,
    Loader2, Plus, ArrowLeft, Clock, Trophy, Zap, BarChart2,
    TrendingUp, TrendingDown, Flame, Target, Mic, Search, ChevronDown, Ban, FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useBilling } from '@/hooks/useBilling';
import { useBillingStore } from '@/store/billingStore';
import { UpgradeModal } from '@/components/UpgradeModal';
import { UpgradeBanner } from '@/components/UpgradeBanner';

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
    document_title: string | null;
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
    journalist: { icon: Mic,           iconColor: 'text-neutral-600', iconBg: 'bg-neutral-100' },
    audience:   { icon: Mic,           iconColor: 'text-violet-600', iconBg: 'bg-violet-50' },
    moderator:  { icon: MessageSquare, iconColor: 'text-stone-600',  iconBg: 'bg-stone-100' },
    listener:   { icon: MessageSquare, iconColor: 'text-rose-500',   iconBg: 'bg-rose-50' },
};

const DEFAULT_VISUAL: RoleVisual = { icon: Bot, iconColor: 'text-neutral-400', iconBg: 'bg-neutral-50' };

// Short labels for KPI "Сложнее всего" card
const SHORT_PERSONA: Record<string, string> = {
    investor: 'Инвестор', partner: 'Партнёр', customer: 'Клиент',
    tech_lead: 'Тимлид', hr: 'HR', senior_dev: 'Dev',
    supervisor: 'Науч. рук.', reviewer: 'Рецензент', peer: 'Коллега',
    board: 'Совет', subordinate: 'Подчин.', journalist: 'Журналист',
    audience: 'Аудитория', moderator: 'Модератор', listener: 'Скептик',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── History card ─────────────────────────────────────────────────────────────

// ─── Insight tag derivation ───────────────────────────────────────────────────

function getInsightTag(session: SessionItem): string | null {
    if (session.avg_score == null) return null;
    const score = Math.round(session.avg_score * 10);
    if (score >= 9) return '🔥 Отличное выступление';
    if (score >= 7) return '✅ Уверенная аргументация';
    if (score >= 5) return '⚠️ Слабая структура';
    if (score >= 3) return '📌 Нужна работа над логикой';
    return '🚨 Критические пробелы';
}

function SessionCard({ session, onClick, variant = 'default' }: { session: SessionItem; onClick: () => void; variant?: 'active' | 'default' }) {
    const isActive = session.status === 'active';
    const isCancelled = session.status === 'cancelled';
    const isCompleted = session.status === 'completed';
    const scoreLabel = session.avg_score != null
        ? `${Math.round(session.avg_score * 10)}/10`
        : null;
    const scoreVal = session.avg_score != null ? Math.round(session.avg_score * 10) : null;
    const scoreColor = scoreVal == null
        ? 'text-gray-400'
        : scoreVal >= 5 ? 'text-gray-700'
        : 'text-rose-500';
    const personaLabel = PERSONA_LABELS[session.persona_config.role] ?? session.persona_config.role;
    const visual = ROLE_VISUALS[session.persona_config.role] ?? DEFAULT_VISUAL;
    const RoleIcon = visual.icon;
    const insightTag = isCompleted ? getInsightTag(session) : null;

    // Progress estimate for active sessions (message_count out of ~10 typical)
    const progressPercent = isActive ? Math.min(Math.round((session.message_count / 10) * 100), 95) : 0;

    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-left w-full p-4 sm:p-5 border transition-all group min-h-[44px] ${
                variant === 'active'
                    ? 'bg-white border-neutral-900 border-2'
                    : 'bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
            }`}
        >
            <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 ${visual.iconBg} ${visual.iconColor} flex items-center justify-center shrink-0`}>
                        <RoleIcon size={16} />
                    </div>
                    <div className="min-w-0">
                        <div className="font-inter font-semibold text-neutral-900 text-sm truncate">
                            {personaLabel}
                        </div>
                        <div className="font-inter text-xs text-neutral-500 truncate">
                            {session.persona_config.industry}
                        </div>
                    </div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-none ${
                    isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isCancelled
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                    {isActive && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />}
                    {isActive ? 'Активна' : isCancelled ? 'Прервана' : 'Завершена'}
                </span>
            </div>

            {/* Progress bar for active sessions */}
            {isActive && (
                <div className="mb-3">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] text-neutral-400 font-inter">Прогресс сессии</span>
                        <span className="text-[11px] font-mono text-neutral-500">{session.message_count} сообщ.</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-neutral-900"
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-gray-400 min-h-[28px]">
                    <Clock size={11} />
                    <span className="font-mono text-[10px]">{formatDate(session.created_at)}</span>
                </div>
                {!isActive && (
                    <div className="flex items-center gap-1.5 text-gray-400 min-h-[28px]">
                        <MessageSquare size={11} />
                        <span className="font-mono text-[10px]">{session.message_count} сообщ.</span>
                    </div>
                )}
                {scoreLabel && (
                    <div className="flex items-center gap-1.5 min-h-[28px]">
                        <Trophy size={11} className="text-gray-400" />
                        <span className={`font-mono text-[10px] font-semibold ${scoreColor}`}>{scoreLabel}</span>
                    </div>
                )}
                {isActive ? (
                    <div className="ml-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] text-white text-[11px] font-semibold min-h-[32px]">
                            Продолжить
                            <ChevronRight size={12} />
                        </span>
                    </div>
                ) : (
                    <div className="ml-auto text-gray-400 group-hover:text-neutral-900 transition-colors">
                        <ChevronRight size={14} />
                    </div>
                )}
            </div>

            {/* Insight tag for completed sessions */}
            {insightTag && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-[11px] font-medium text-neutral-500 font-inter">{insightTag}</span>
                </div>
            )}

            {session.document_title && (
                <div className={`flex items-center gap-1.5 ${insightTag ? 'mt-1.5' : 'mt-2.5 pt-2.5 border-t border-gray-100'}`}>
                    <FileText size={10} className="text-gray-400 shrink-0" />
                    <span className="font-mono text-[10px] text-gray-400 truncate">
                        {session.document_title}
                    </span>
                </div>
            )}
        </motion.button>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function SimulationPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftFromUrl = searchParams.get('draft') ?? searchParams.get('doc');

    // Billing
    const { canStartSimulation, simulationsLeft, openUpgrade } = useBilling();
    const { upgradeModalOpen, upgradeModalReason, closeUpgradeModal } = useBillingStore();

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

    // Documents (unified — uploads + text)
    const [documents, setDocuments] = useState<{ id: string; name: string; source?: string; created_at?: string }[]>([]);
    const [isStarting, setIsStarting] = useState(false);

    // Doc combobox
    const [docDropdownOpen, setDocDropdownOpen] = useState(false);
    const [docDropdownPlacement, setDocDropdownPlacement] = useState<'bottom' | 'top'>('bottom');
    const [docSearch, setDocSearch] = useState('');
    const docDropdownRef = useRef<HTMLDivElement>(null);
    const docTriggerRef = useRef<HTMLButtonElement>(null);

    // Step section refs for auto-scroll on mobile
    const step2Ref = useRef<HTMLElement>(null);
    const step3Ref = useRef<HTMLElement>(null);

    // Auto-scroll to next step on mobile when a selection is made
    const scrollToStep = (ref: React.RefObject<HTMLElement | null>) => {
        if (window.innerWidth < 768 && ref.current) {
            setTimeout(() => {
                ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }
    };

    // Load sessions, personas and documents on mount
    useEffect(() => {
        async function fetchAll() {
            const [sessionsRes, personasRes, docsRes] = await Promise.allSettled([
                api.get('/simulation?limit=50'),
                api.get('/simulation/personas'),
                api.get('/documents?limit=200'),
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

            // Documents
            let docsItems: { id: string; name: string; source?: string; created_at?: string }[] = [];
            if (docsRes.status === 'fulfilled' && docsRes.value?.items) {
                docsItems = docsRes.value.items;
            }

            // If navigated from analysis page with a draft ID, fetch the draft and inject it
            if (draftFromUrl) {
                const alreadyPresent = docsItems.some(d => d.id === draftFromUrl);
                if (!alreadyPresent) {
                    try {
                        const draftData = await api.get(`/drafts/${draftFromUrl}`);
                        if (draftData?.id) {
                            docsItems = [
                                { id: draftData.id, name: draftData.title || 'Черновик', source: 'draft', created_at: draftData.created_at },
                                ...docsItems,
                            ];
                        }
                    } catch {
                        // draft not found — proceed without pre-selection
                    }
                }
                setSelectedDoc(draftFromUrl);
                setView('setup');
            }
            setDocuments(docsItems);
        }
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        if (!canStartSimulation) {
            openUpgrade('simulations');
            return;
        }
        setIsStarting(true);
        try {
            const domainName = selectedDomain === 'custom' ? customDomain : selectedDomain;
            const selectedDocItem = documents.find(d => d.id === selectedDoc);
            const isDraft = selectedDocItem?.source === 'draft';
            const hasDoc = selectedDoc !== null && selectedDoc !== 'none';
            const payload = {
                persona_config: { role: selectedRole, industry: domainName, difficulty },
                document_id: (hasDoc && !isDraft) ? selectedDoc : null,
                draft_id: (hasDoc && isDraft) ? selectedDoc : null,
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
                <Loader2 className="animate-spin text-neutral-400" size={28} />
            </div>
        );
    }

    // ── History view ─────────────────────────────────────────────────────────

    if (view === 'history') {
        const activeSessions = sessions.filter(s => s.status === 'active');
        const completedSessions = sessions.filter(s => s.status === 'completed');
        const cancelledSessions = sessions.filter(s => s.status === 'cancelled');

        return (
            <div className="pb-10 pt-0 sm:pt-0 w-full max-w-5xl mx-auto">
                <UpgradeModal isOpen={upgradeModalOpen} onClose={closeUpgradeModal} reason={upgradeModalReason} />
                {simulationsLeft !== null && simulationsLeft <= 1 && <UpgradeBanner />}
                <div className="px-4 sm:px-6 lg:px-10 pt-4 sm:pt-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 sm:gap-4 mb-8 sm:mb-10">
                    <div>
                        <h1 className="font-inter text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 leading-tight tracking-tight mb-1 sm:mb-2">
                            Симуляции
                        </h1>
                        <p className="font-inter text-neutral-500 text-xs sm:text-sm">
                            {sessions.length} {sessions.length === 1 ? 'сессия' : sessions.length < 5 ? 'сессии' : 'сессий'} · нажми на любую, чтобы открыть
                        </p>
                        {(activeSessions.length > 0 || completedSessions.length > 0) && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {activeSessions.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none font-medium">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        {activeSessions.length} активных
                                    </span>
                                )}
                                {completedSessions.length > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-none font-medium">
                                        {completedSessions.length} завершено
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            if (!canStartSimulation) {
                                openUpgrade('simulations');
                            } else {
                                setView('setup');
                            }
                        }}
                        className="inline-flex items-center bg-[#171717] hover:bg-black text-white font-medium shrink-0 gap-2 px-3 sm:px-5 py-2.5 text-sm min-h-[44px] transition-colors"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Новая тренировка</span>
                        <span className="sm:hidden">Новая</span>
                    </button>
                </div>

                {/* Stats strip */}
                {sessions.length > 0 && (() => {
                    const scores = completedSessions
                        .filter(s => s.avg_score != null)
                        .map(s => s.avg_score!);
                    const avgScoreRaw = scores.length
                        ? scores.reduce((a, b) => a + b, 0) / scores.length
                        : null;
                    const avgScore10 = avgScoreRaw != null ? Math.round(avgScoreRaw * 10) : null;
                    const bestScore10 = scores.length ? Math.round(Math.max(...scores) * 10) : null;

                    // Прогресс: последняя сессия vs первая (хронологически)
                    const scoredByDate = completedSessions
                        .filter(s => s.avg_score != null)
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    const progressDelta = scoredByDate.length >= 2
                        ? Math.round(scoredByDate[scoredByDate.length - 1].avg_score! * 10)
                          - Math.round(scoredByDate[0].avg_score! * 10)
                        : null;

                    // Сложнее всего: роль с наименьшим средним баллом
                    const roleMap: Record<string, number[]> = {};
                    completedSessions.forEach(s => {
                        if (s.avg_score != null) {
                            const r = s.persona_config.role;
                            roleMap[r] = [...(roleMap[r] ?? []), s.avg_score];
                        }
                    });
                    const hardestRole = Object.entries(roleMap)
                        .map(([role, sc]) => ({
                            role,
                            avg: Math.round((sc.reduce((a, b) => a + b, 0) / sc.length) * 10),
                        }))
                        .sort((a, b) => a.avg - b.avg)[0] ?? null;

                    const readinessSub = avgScore10 == null ? 'Пройди симуляцию'
                        : avgScore10 >= 8 ? 'Готов к спичу'
                        : avgScore10 >= 6 ? 'Есть потенциал'
                        : avgScore10 >= 4 ? 'Нужна практика'
                        : 'Серьёзная работа';

                    const TrendIcon = progressDelta != null && progressDelta < 0 ? TrendingDown : TrendingUp;
                    const trendIconBg = progressDelta == null ? 'bg-gray-50'
                        : progressDelta > 0 ? 'bg-emerald-50'
                        : progressDelta < 0 ? 'bg-rose-50' : 'bg-gray-50';
                    const trendIconColor = progressDelta == null ? 'text-gray-400'
                        : progressDelta > 0 ? 'text-emerald-500'
                        : progressDelta < 0 ? 'text-rose-500' : 'text-gray-400';
                    const trendSub = progressDelta == null ? 'Нужно 2+ сессий'
                        : progressDelta > 0 ? 'Ты растёшь!'
                        : progressDelta < 0 ? 'Бывает — встряхнись'
                        : 'Нет изменений';

                    // Sparkline: последние 7 scored сессий
                    const sparkScores = scoredByDate.slice(-7).map(s => Math.round(s.avg_score! * 10));
                    const sparkColor = progressDelta == null ? '#cbd5e1'
                        : progressDelta > 0 ? '#10b981'
                        : progressDelta < 0 ? '#f43f5e' : '#94a3b8';
                    // y: 3 (score=10, top) → 23 (score=0, bottom) — 3px padding for r=2.5 dots
                    const sparkY = (s: number) => 3 + (1 - s / 10) * 20;
                    const sparkPoints = sparkScores.length >= 2
                        ? sparkScores.map((s, i) => {
                            const x = (i / (sparkScores.length - 1)) * 80;
                            return `${x},${sparkY(s)}`;
                        }).join(' ')
                        : null;

                    // Persona icon for "Сложнее всего"
                    const hardestVisual = hardestRole ? (ROLE_VISUALS[hardestRole.role] ?? DEFAULT_VISUAL) : DEFAULT_VISUAL;
                    const HardestIcon = hardestVisual.icon;

                    const kpiCard = "relative overflow-hidden bg-white border border-neutral-200 p-3 sm:p-4 lg:p-5 transition-all duration-200 flex flex-col";

                    return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">

                            {/* Индекс готовности */}
                            <div className={kpiCard}>
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-teal-300" />
                                <div className="flex justify-between items-center mb-2 sm:mb-3">
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-widest uppercase">Готовность</span>
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-none bg-emerald-50 flex items-center justify-center">
                                        <Target size={14} className="text-emerald-500 sm:hidden" />
                                        <Target size={16} className="text-emerald-500 hidden sm:block" />
                                    </div>
                                </div>
                                <div className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                                    {avgScore10 != null ? (
                                        <>{avgScore10}<span className="text-lg sm:text-xl font-semibold text-gray-400">/10</span></>
                                    ) : '—'}
                                </div>
                                <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 mb-2 sm:mb-3">{readinessSub}</p>
                                <div className="mt-auto h-1 sm:h-1.5 bg-gray-100 rounded-none overflow-hidden">
                                    <div
                                        className="h-full rounded-none transition-all duration-700"
                                        style={{
                                            width: `${(avgScore10 ?? 0) * 10}%`,
                                            background: (avgScore10 ?? 0) >= 7 ? '#10b981' : (avgScore10 ?? 0) >= 4 ? '#f59e0b' : '#f43f5e',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Тренд роста */}
                            <div className={kpiCard}>
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-violet-400" />
                                <div className="flex justify-between items-center mb-2 sm:mb-3">
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-widest uppercase">Тренд роста</span>
                                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-none flex items-center justify-center ${trendIconBg}`}>
                                        <TrendIcon size={14} className={`${trendIconColor} sm:hidden`} />
                                        <TrendIcon size={16} className={`${trendIconColor} hidden sm:block`} />
                                    </div>
                                </div>
                                <div className={`text-2xl sm:text-3xl font-bold ${progressDelta == null ? 'text-gray-300' : progressDelta > 0 ? 'text-emerald-600' : progressDelta < 0 ? 'text-rose-500' : 'text-gray-400'}`} style={{ letterSpacing: '-0.02em' }}>
                                    {progressDelta == null ? '—'
                                        : progressDelta === 0 ? '= 0'
                                        : `${progressDelta > 0 ? '+' : ''}${progressDelta}б`}
                                </div>
                                <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 mb-1.5 sm:mb-2">
                                    {progressDelta == null ? (
                                        <span className="text-violet-600 font-medium">Пройди ещё один тест, чтобы увидеть динамику</span>
                                    ) : trendSub}
                                </p>
                                {sparkPoints && (
                                    <div className="mt-auto">
                                        <svg viewBox="0 0 80 26" className="w-full h-8" preserveAspectRatio="none">
                                            <polyline
                                                points={sparkPoints}
                                                fill="none"
                                                stroke={sparkColor}
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                opacity="0.7"
                                            />
                                            {sparkScores.map((s, i) => (
                                                <circle
                                                    key={i}
                                                    cx={(i / (sparkScores.length - 1)) * 80}
                                                    cy={sparkY(s)}
                                                    r={i === sparkScores.length - 1 ? 2.5 : 1.5}
                                                    fill={sparkColor}
                                                    opacity={i === sparkScores.length - 1 ? 1 : 0.5}
                                                />
                                            ))}
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Личный рекорд */}
                            <div className={kpiCard}>
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-300" />
                                <div className="flex justify-between items-center mb-2 sm:mb-3">
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-widest uppercase">Рекорд</span>
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-none bg-amber-50 flex items-center justify-center">
                                        <Trophy size={14} className="text-amber-500 sm:hidden" />
                                        <Trophy size={16} className="text-amber-500 hidden sm:block" />
                                    </div>
                                </div>
                                <div className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                                    {bestScore10 != null ? (
                                        <>{bestScore10}<span className="text-lg sm:text-xl font-semibold text-gray-400">/10</span></>
                                    ) : '—'}
                                </div>
                                <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 mb-2 sm:mb-3">
                                    {bestScore10 != null ? 'Личный рекорд' : 'Пройди симуляцию'}
                                </p>
                                <div className="mt-auto h-1 sm:h-1.5 bg-gray-100 rounded-none overflow-hidden">
                                    <div
                                        className="h-full bg-amber-300 rounded-none transition-all duration-700"
                                        style={{ width: `${(bestScore10 ?? 0) * 10}%` }}
                                    />
                                </div>
                            </div>

                            {/* Сложнее всего */}
                            <div className={kpiCard}>
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-400 to-pink-300" />
                                <div className="flex justify-between items-center mb-2 sm:mb-3">
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-widest uppercase">Сложнее всего</span>
                                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-none flex items-center justify-center ${hardestRole ? hardestVisual.iconBg : 'bg-gray-50'}`}>
                                        <HardestIcon size={14} className={`${hardestRole ? hardestVisual.iconColor : 'text-gray-400'} sm:hidden`} />
                                        <HardestIcon size={16} className={`${hardestRole ? hardestVisual.iconColor : 'text-gray-400'} hidden sm:block`} />
                                    </div>
                                </div>
                                <div className="text-sm sm:text-lg font-bold text-gray-900 leading-snug flex-1" style={{ letterSpacing: '-0.01em' }}>
                                    {hardestRole
                                        ? (SHORT_PERSONA[hardestRole.role] ?? hardestRole.role)
                                        : '—'}
                                </div>
                                <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                                    {hardestRole
                                        ? `Ср. балл ${hardestRole.avg}/10`
                                        : 'Пройди симуляцию'}
                                </p>
                                {hardestRole && (
                                    <div className="mt-2 sm:mt-3 h-1 sm:h-1.5 bg-gray-100 rounded-none overflow-hidden">
                                        <div
                                            className="h-full bg-rose-300 rounded-none transition-all duration-700"
                                            style={{ width: `${hardestRole.avg * 10}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Active sessions */}
                {activeSessions.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-neutral-900 rounded-full animate-pulse" />
                            Активные
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeSessions.map(s => (
                                <SessionCard key={s.id} session={s} onClick={() => handleSessionClick(s)} variant="active" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed sessions */}
                {completedSessions.length > 0 && (
                    <div className={cancelledSessions.length > 0 ? 'mb-8' : ''}>
                        <h2 className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3">Завершённые</h2>
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
                        <h2 className="text-[11px] font-bold tracking-widest uppercase text-neutral-400 mb-3">Прерванные</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-50">
                            {cancelledSessions.map(s => (
                                <SessionCard key={s.id} session={s} onClick={() => handleSessionClick(s)} />
                            ))}
                        </div>
                    </div>
                )}
                </div>
            </div>
        );
    }

    // ── Setup view ───────────────────────────────────────────────────────────

    return (
        <div className="pb-48 pt-4 sm:pt-8 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-6 mb-10 sm:mb-14">
                <div className="flex items-start gap-3">
                    {sessions.length > 0 && (
                        <button
                            onClick={() => setView('history')}
                            className="mt-1 p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div>
                        <h1 className="font-inter text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 leading-tight tracking-tight m-0 mb-2">
                            Выбери себе вызов
                        </h1>
                        <p className="font-inter text-neutral-500 max-w-2xl text-sm leading-relaxed">
                            Кто сегодня по ту сторону стола? Настрой контекст и покажи класс.
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
                                    <div className={`w-7 h-7 rounded-none flex items-center justify-center text-xs font-semibold transition-colors ${
                                        isDone
                                            ? 'bg-emerald-500 text-white'
                                            : isActive
                                                ? 'bg-neutral-900 text-white'
                                                : 'bg-neutral-50 border border-neutral-200 text-neutral-400'
                                    }`}>
                                        {isDone ? <CheckCircle2 size={14} /> : step}
                                    </div>
                                    <span className={`text-xs font-inter hidden sm:block transition-colors ${
                                        isActive ? 'text-neutral-900' : isDone ? 'text-emerald-500' : 'text-neutral-400'
                                    }`}>
                                        {label}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div className={`flex-1 h-px max-w-[40px] transition-colors ${isDone ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-12">
                {/* 1. ROLE SELECTION */}
                <section>
                    <h2 className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-4 flex items-center gap-2 border-b border-neutral-200 pb-3">
                        <span className="text-neutral-500">Шаг 1:</span> Кого нужно убедить?
                    </h2>
                    <AnimatePresence mode="wait">
                        {personasLoading ? (
                            <div className="flex items-center gap-3 py-8 text-neutral-500">
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
                                            onClick={() => { setSelectedRole(key); scrollToStep(step2Ref); }}
                                            className={`text-left p-5 border transition-all duration-300 relative overflow-hidden group ${
                                                isSelected
                                                    ? 'bg-neutral-50 border-2 border-neutral-900'
                                                    : 'bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 text-neutral-900">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}
                                            {!isSelected && (
                                                <svg className="absolute bottom-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300 pointer-events-none" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                                                    <circle cx="60" cy="60" r="48" stroke="#6B7280" strokeWidth="1.5" />
                                                    <circle cx="60" cy="60" r="30" stroke="#6B7280" strokeWidth="1" />
                                                </svg>
                                            )}
                                            <div className={`w-10 h-10 flex items-center justify-center mb-4 transition-colors ${visual.iconBg} border border-neutral-200 ${visual.iconColor}`}>
                                                <IconComp size={20} />
                                            </div>
                                            <div className="font-inter text-lg font-semibold text-neutral-900 mb-2">
                                                {persona.title}
                                            </div>
                                            <div className="font-inter text-xs text-neutral-500 leading-relaxed">
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
                                            onClick={() => { setSelectedRole(role.id); scrollToStep(step2Ref); }}
                                            className={`text-left p-5 transition-all duration-300 relative overflow-hidden group ${
                                                isSelected
                                                    ? 'bg-neutral-50 border-2 border-neutral-900'
                                                    : 'bg-white border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-4 right-4 text-neutral-900">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 flex items-center justify-center mb-4 border border-neutral-200 ${role.iconBg} ${role.iconColor}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div className="font-inter text-lg font-semibold text-neutral-900 mb-2">
                                                {role.name}
                                            </div>
                                            <div className="font-inter text-xs text-neutral-500 leading-relaxed">
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
                <section ref={step2Ref}>
                    <h2 className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-4 flex items-center gap-2 border-b border-neutral-200 pb-3">
                        <span className="text-neutral-500">Шаг 2:</span> Индустрия / Ниша
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {domains.map((domain) => (
                            <button
                                key={domain.id}
                                onClick={() => { setSelectedDomain(domain.id); scrollToStep(step3Ref); }}
                                className={`px-4 py-2.5 border text-sm font-inter transition-all ${
                                    selectedDomain === domain.id
                                        ? 'bg-neutral-100 border-neutral-900 text-neutral-900'
                                        : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400'
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
                                className="w-full max-w-md bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all font-inter"
                                autoFocus
                            />
                        </div>
                    )}
                </section>

                {/* 3. DOCUMENT SELECTION */}
                <section ref={step3Ref}>
                    <h2 className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-4 flex items-center gap-2 border-b border-neutral-200 pb-3">
                        <span className="text-neutral-500">Шаг 3:</span> Контекст для тренера
                    </h2>

                    {/* Combobox */}
                    <div className="relative max-w-lg" ref={docDropdownRef}>
                        {/* Trigger */}
                        <button
                            type="button"
                            ref={docTriggerRef}
                            onClick={handleDocDropdownToggle}
                            className={`w-full h-14 flex items-center gap-3 px-4 border transition-all text-left cursor-pointer ${
                                docDropdownOpen
                                    ? 'border-neutral-400 ring-2 ring-neutral-300 bg-white'
                                    : selectedDoc !== null
                                        ? 'border-neutral-400 bg-neutral-50'
                                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                            }`}
                        >
                            <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-neutral-50 border border-neutral-200">
                                {selectedDoc === 'none'
                                    ? <Ban size={16} className="text-neutral-400" />
                                    : selectedDoc
                                        ? <FileText size={16} className="text-neutral-500" />
                                        : <FileText size={16} className="text-neutral-400" />
                                }
                            </div>
                            <span className={`flex-1 text-sm font-inter truncate ${selectedDoc !== null ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
                                {selectedDoc === 'none'
                                    ? 'Без документа — общее интервью'
                                    : selectedDoc
                                        ? documents.find(d => d.id === selectedDoc)?.name ?? 'Выбранный документ'
                                        : 'Выберите контекст для тренировки...'}
                            </span>
                            <ChevronDown
                                size={16}
                                className={`shrink-0 text-neutral-400 transition-transform duration-200 ${docDropdownOpen ? 'rotate-180' : ''}`}
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
                                    className={`absolute left-0 right-0 z-30 max-h-[320px] flex flex-col bg-white border border-neutral-200 shadow-lg overflow-hidden ${
                                        docDropdownPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                                    }`}
                                >
                                    {/* Search — sticky */}
                                    <div className="p-2 border-b border-neutral-200">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="Поиск по документам..."
                                                value={docSearch}
                                                onChange={(e) => setDocSearch(e.target.value)}
                                                autoFocus
                                            className="w-full pl-9 pr-3 py-2 text-sm font-inter bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 transition-colors"
                                                style={{ fontSize: '16px' }}
                                            />
                                        </div>
                                    </div>

                                    {/* «Без документа» — pinned */}
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedDoc('none'); setDocDropdownOpen(false); setDocSearch(''); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-neutral-200 ${
                                            selectedDoc === 'none' ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                                        }`}
                                    >
                                        <div className="w-7 h-7 rounded-none bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0">
                                            <Ban size={14} className="text-neutral-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium font-inter text-neutral-900">Без документа</div>
                                            <div className="text-xs text-neutral-400 font-inter">Общее интервью по выбранной роли и сфере</div>
                                        </div>
                                        {selectedDoc === 'none' && <CheckCircle2 size={15} className="text-neutral-900 shrink-0" />}
                                    </button>

                                    {/* Document list */}
                                    <div className="flex-1 overflow-y-auto min-h-0">
                                        {(() => {
                                            const filtered = documents.filter(d =>
                                                d.name.toLowerCase().includes(docSearch.toLowerCase())
                                            );
                                            if (filtered.length === 0) {
                                                return (
                                                    <div className="py-8 text-center text-sm text-neutral-400 font-inter">
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
                                                            isSelected ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                                                        }`}
                                                    >
                                                        <div className="w-7 h-7 rounded-none bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0">
                                                            <FileText size={14} className="text-neutral-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium font-inter text-neutral-900 truncate">{doc.name}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 shrink-0">
                                                            {dateStr && (
                                                                <span className="text-[11px] font-mono text-neutral-400">{dateStr}</span>
                                                            )}
                                                            {isSelected && <CheckCircle2 size={15} className="text-neutral-900" />}
                                                        </div>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>

                                    {/* Upload link — bottom */}
                                    <div className="p-2 border-t border-neutral-200">
                                        <Link
                                            href="/upload"
                                            onClick={() => setDocDropdownOpen(false)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium font-inter text-neutral-900 hover:bg-neutral-50 transition-colors"
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
                <div className="hidden md:flex pt-6 border-t border-neutral-200 justify-end">
                    <button
                        disabled={!isReady || isStarting}
                        onClick={handleStart}
                        className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold font-inter transition-all duration-200 ${
                            isReady && !isStarting
                                ? 'bg-[#171717] text-white cursor-pointer hover:bg-black'
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
                <div className="bg-white/95 backdrop-blur-md border border-neutral-200 p-3 flex items-center gap-3 shadow-lg">
                    <div className="flex-1 min-w-0">
                        <p className="font-inter text-xs text-neutral-400 truncate">
                            {!selectedRoleName 
                                ? 'Шаг 1: Выберите собеседника' 
                                : !selectedDomain 
                                    ? 'Шаг 2: Укажите индустрию' 
                                    : selectedDoc === null 
                                        ? 'Шаг 3: Выберите контекст' 
                                        : <span className="text-neutral-500 font-medium">Готово: {selectedRoleName}</span>}
                        </p>
                    </div>
                    <button
                        disabled={!isReady || isStarting}
                        onClick={handleStart}
                        className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 shrink-0 font-semibold font-inter transition-all ${
                            isReady && !isStarting
                                ? 'bg-[#171717] text-white hover:bg-black'
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
                <Loader2 className="animate-spin text-neutral-400" size={28} />
            </div>
        }>
            <SimulationPageContent />
        </Suspense>
    );
}
