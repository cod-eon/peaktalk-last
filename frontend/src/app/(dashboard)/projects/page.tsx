"use client";

import React from 'react';
import {
    Bot,
    Briefcase,
    Users,
    MessageSquare,
    ArrowRight,
    Activity,
    CheckCircle2,
    Clock,
    AlertCircle,
    BarChart3,
    Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { api } from '@/lib/api';

type PersonaConfig = {
    role: string;
    industry: string;
    difficulty: number;
};

type SimulationSessionListItem = {
    id: string;
    persona_config: PersonaConfig;
    status: 'active' | 'completed';
    created_at: string;
    completed_at: string | null;
    message_count: number;
    avg_score: number | null;
};

type SimulationListResponse = {
    items: SimulationSessionListItem[];
    total: number;
};

const PERSONA_LABELS: Record<string, string> = {
    investor: 'Венчурный Инвестор',
    tech_lead: 'CEO / Техдир',
    hr: 'HR-Менеджер',
    listener: 'Скептик из зала',
};

const PERSONA_ICONS: Record<string, React.ElementType> = {
    investor: Briefcase,
    tech_lead: Bot,
    hr: Users,
    listener: MessageSquare,
};

const DIFFICULTY_LABELS: Record<number, string> = {
    1: 'Лёгко',
    2: 'Средне',
    3: 'Стандарт',
    4: 'Сложно',
    5: 'Брутально',
};

function ScoreBadge({ score }: { score: number }) {
    const pct = Math.round(score * 10);
    const color =
        score >= 0.8 ? 'text-emerald-400' : score >= 0.5 ? 'text-amber-400' : 'text-rose-400';
    const bg =
        score >= 0.8
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : score >= 0.5
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-rose-500/10 border-rose-500/20';
    return (
        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${color} ${bg}`}>
            {pct}/10
        </span>
    );
}

export default function ProjectsPage() {
    const { data, isLoading, isError, refetch } = useQuery<SimulationListResponse>({
        queryKey: ['simulation-sessions'],
        queryFn: () => api.get('/simulation?limit=50'),
        staleTime: 30_000,
    });

    const sessions = data?.items ?? [];

    return (
        <div className="pb-10 pt-4 sm:pt-8 w-full max-w-6xl mx-auto px-6 lg:px-10">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col gap-6 mb-10 sm:flex-row sm:items-center sm:justify-between sm:mb-14">
                <div>
                    <div className="font-mono text-[11px] text-[var(--accent-blue)] tracking-[0.1em] uppercase mb-3">
                        ТРЕНИРОВОЧНЫЕ СЕССИИ
                    </div>
                    <h1 className="font-syne text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 leading-tight tracking-tight m-0">
                        Мои проекты
                    </h1>
                </div>
                <Link
                    href="/simulation"
                    className="btn-primary w-full sm:w-auto mt-2 sm:mt-0 shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-shadow"
                >
                    <Plus size={16} className="mr-2" />
                    Новая симуляция
                </Link>
            </div>

            {/* ─── CONTENT ─── */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Activity size={28} className="animate-spin text-[var(--accent-blue)] mb-4" />
                    <div className="text-slate-400 font-mono text-sm">Загрузка...</div>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-rose-500 mb-4 bg-rose-500/10 p-4 rounded-full">
                        <AlertCircle size={28} />
                    </div>
                    <div className="text-slate-200 mb-2">Не удалось загрузить проекты</div>
                    <button onClick={() => refetch()} className="btn-secondary rounded-lg mt-4">
                        Попробовать снова
                    </button>
                </div>
            ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--border-main)] rounded-2xl bg-[var(--bg-surface)]">
                    <div className="text-slate-500 mb-4 bg-[var(--bg-card)] p-4 rounded-full">
                        <Bot size={28} />
                    </div>
                    <div className="text-slate-200 mb-2 font-syne text-xl">Нет симуляций</div>
                    <div className="text-slate-500 text-sm mb-6 max-w-sm">
                        Запустите тренировочную сессию с AI-собеседником, чтобы прокачать навыки
                    </div>
                    <Link href="/simulation" className="btn-primary rounded-lg">
                        <Plus size={14} className="mr-2" /> Начать симуляцию
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sessions.map((session) => {
                        const Icon = PERSONA_ICONS[session.persona_config.role] ?? Bot;
                        const personaLabel =
                            PERSONA_LABELS[session.persona_config.role] ?? session.persona_config.role;
                        const isCompleted = session.status === 'completed';
                        const href = isCompleted
                            ? `/simulation/${session.id}/report`
                            : `/simulation/${session.id}`;

                        return (
                            <Link key={session.id} href={href} className="block h-full group">
                                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--accent-blue)]/50 rounded-2xl p-5 flex flex-col h-full relative overflow-hidden transition-colors duration-200 cursor-pointer">
                                    {/* Glow */}
                                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--accent-blue)]/5 rounded-full blur-2xl group-hover:bg-[var(--accent-blue)]/10 transition-colors duration-500 pointer-events-none" />

                                    {/* Top row */}
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="w-11 h-11 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-light)] flex items-center justify-center text-slate-400 group-hover:text-[var(--accent-blue)] transition-colors duration-200">
                                            <Icon size={22} strokeWidth={1.5} />
                                        </div>
                                        {isCompleted ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                                                <CheckCircle2 size={10} /> Завершён
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                                Активен
                                            </span>
                                        )}
                                    </div>

                                    {/* Persona & Industry */}
                                    <div className="mb-4 relative z-10 flex-1">
                                        <h3 className="font-syne text-base font-semibold text-slate-100 mb-1 group-hover:text-blue-400 transition-colors duration-200">
                                            {personaLabel}
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest bg-[var(--bg-surface-alt)] px-2 py-0.5 rounded border border-[var(--border-light)]">
                                                {session.persona_config.industry}
                                            </span>
                                            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest bg-[var(--bg-surface-alt)] px-2 py-0.5 rounded border border-[var(--border-light)]">
                                                {DIFFICULTY_LABELS[session.persona_config.difficulty] ?? `D${session.persona_config.difficulty}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-light)]/50 relative z-10">
                                        <div className="flex items-center gap-3">
                                            {/* Message count */}
                                            <div className="flex items-center gap-1 text-slate-500 font-mono text-xs">
                                                <MessageSquare size={11} />
                                                {session.message_count}
                                            </div>
                                            {/* Date */}
                                            <div className="flex items-center gap-1 text-slate-500 font-mono text-xs">
                                                <Clock size={11} />
                                                {format(new Date(session.created_at), 'dd.MM.yy')}
                                            </div>
                                        </div>

                                        {isCompleted && session.avg_score !== null ? (
                                            <div className="flex items-center gap-1.5">
                                                <BarChart3 size={11} className="text-slate-500" />
                                                <ScoreBadge score={session.avg_score} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--accent-blue)]">
                                                Продолжить <ArrowRight size={10} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
