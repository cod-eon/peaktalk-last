'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GraduationCap, Briefcase, Rocket, Users, ChevronRight, Mic, FileText, MonitorPlay, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type Segment = 'student' | 'junior' | 'founder' | 'manager' | 'other';
type Goal = 'interview' | 'pitch' | 'conference' | 'defense' | 'other';

const SEGMENTS: { id: Segment; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'student', label: 'Студент', desc: 'Защита диплома, учебные конференции, стажировки', icon: <GraduationCap size={22} /> },
    { id: 'junior', label: 'Молодой специалист', desc: 'Собеседования, онбординг, технические презентации', icon: <FileText size={22} /> },
    { id: 'founder', label: 'Фаундер / Стартап', desc: 'Питчи инвесторам, ускорители, демо-дни', icon: <Rocket size={22} /> },
    { id: 'manager', label: 'Руководитель', desc: 'Доклады, переговоры, мотивационные выступления', icon: <Users size={22} /> },
    { id: 'other', label: 'Другое', desc: 'Любой другой тип коммуникации', icon: <Globe size={22} /> },
];

const GOALS: { id: Goal; label: string; icon: React.ReactNode }[] = [
    { id: 'interview', label: 'Собеседование', icon: <Briefcase size={20} /> },
    { id: 'pitch', label: 'Питч инвестору', icon: <Rocket size={20} /> },
    { id: 'conference', label: 'Конференция / Доклад', icon: <Mic size={20} /> },
    { id: 'defense', label: 'Защита проекта', icon: <MonitorPlay size={20} /> },
    { id: 'other', label: 'Другое', icon: <Globe size={20} /> },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [segment, setSegment] = useState<Segment | null>(null);
    const [goal, setGoal] = useState<Goal | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Skip onboarding if already completed
    useEffect(() => {
        async function checkProfile() {
            try {
                const me = await api.get('/me');
                if (me?.onboarding_profile) {
                    router.replace('/dashboard');
                }
            } catch {
                // Not logged in or error — stay on page (auth middleware will handle redirect)
            } finally {
                setIsChecking(false);
            }
        }
        checkProfile();
    }, [router]);

    const handleSubmit = async () => {
        if (!segment || !goal) return;
        setIsSubmitting(true);
        try {
            await api.post('/me/onboarding', { segment, primary_goal: goal });
            toast.success('Профиль настроен! Добро пожаловать в PeakTalk.');
            router.push('/dashboard');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ошибка сохранения';
            toast.error(message);
            setIsSubmitting(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[var(--accent-blue)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center px-4 py-12">
            {/* Background grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(var(--border-main) 1px, transparent 1px), linear-gradient(90deg, var(--border-main) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            <div className="w-full max-w-2xl relative z-10">
                {/* Logo / Brand */}
                <div className="text-center mb-10">
                    <div className="font-mono text-[11px] text-[var(--accent-blue)] tracking-[0.15em] uppercase mb-3">
                        PeakTalk · Onboarding
                    </div>
                    <h1 className="font-syne text-3xl sm:text-4xl font-bold text-slate-100 mb-3">
                        {step === 1 ? 'Расскажите о себе' : 'К чему готовитесь?'}
                    </h1>
                    <p className="text-[var(--text-dim)] font-inter text-sm max-w-md mx-auto">
                        {step === 1
                            ? 'Это поможет AI-тренеру подобрать правильный стиль и уровень сложности.'
                            : 'Укажите главную цель — тренер сфокусируется именно на ней.'}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                                step > s
                                    ? 'bg-emerald-500 text-white'
                                    : step === s
                                        ? 'bg-[var(--accent-blue)] text-white shadow-[0_0_12px_rgba(79,140,255,0.4)]'
                                        : 'bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-dim)]'
                            }`}>
                                {step > s ? <CheckCircle2 size={14} /> : s}
                            </div>
                            {s < 2 && (
                                <div className={`w-12 h-px transition-colors duration-300 ${step > s ? 'bg-emerald-500' : 'bg-[var(--border-main)]'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                {SEGMENTS.map((seg) => (
                                    <button
                                        key={seg.id}
                                        onClick={() => setSegment(seg.id)}
                                        className={`text-left p-5 rounded-2xl border transition-all duration-200 relative group ${
                                            segment === seg.id
                                                ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] shadow-[0_0_20px_rgba(79,140,255,0.15)]'
                                                : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                        }`}
                                    >
                                        {segment === seg.id && (
                                            <div className="absolute top-4 right-4 text-[var(--accent-blue)]">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                                            segment === seg.id
                                                ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]'
                                                : 'bg-[var(--bg-surface-alt)] border border-[var(--border-light)] text-slate-400 group-hover:text-slate-300'
                                        }`}>
                                            {seg.icon}
                                        </div>
                                        <div className="font-syne text-base font-semibold text-slate-100 mb-1">{seg.label}</div>
                                        <div className="font-inter text-xs text-slate-400 leading-relaxed">{seg.desc}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    disabled={!segment}
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-syne font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
                                >
                                    Далее <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                {GOALS.map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => setGoal(g.id)}
                                        className={`text-left p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 relative group ${
                                            goal === g.id
                                                ? 'bg-[var(--accent-blue)]/10 border-[var(--accent-blue)] shadow-[0_0_20px_rgba(79,140,255,0.15)]'
                                                : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                        }`}
                                    >
                                        {goal === g.id && (
                                            <div className="absolute top-4 right-4 text-[var(--accent-blue)]">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                            goal === g.id
                                                ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]'
                                                : 'bg-[var(--bg-surface-alt)] border border-[var(--border-light)] text-slate-400 group-hover:text-slate-300'
                                        }`}>
                                            {g.icon}
                                        </div>
                                        <div className="font-syne text-base font-semibold text-slate-100">{g.label}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3.5 rounded-xl font-mono text-sm border border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--border-light)] hover:text-[var(--text-main)] transition-colors"
                                >
                                    Назад
                                </button>
                                <button
                                    disabled={!goal || isSubmitting}
                                    onClick={handleSubmit}
                                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-syne font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 size={16} className="animate-spin" /> Сохранение...</>
                                    ) : (
                                        <>Начать работу <ChevronRight size={18} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
