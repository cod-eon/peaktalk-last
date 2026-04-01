'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [segment, setSegment] = useState<Segment | null>(null);
    const [goal, setGoal] = useState<Goal | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Scroll to top whenever step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

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
            setStep(3);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ошибка сохранения';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Background grid — hidden on mobile for clean look */}
            <div className="fixed inset-0 pointer-events-none opacity-40 hidden md:block"
                style={{ backgroundImage: 'linear-gradient(var(--border-main) 1px, transparent 1px), linear-gradient(90deg, var(--border-main) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {step === 3 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={`confetti-${i}`}
                            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                            animate={{ 
                                opacity: 0, 
                                scale: [0, 1.5, 1],
                                x: (Math.random() - 0.5) * 500, 
                                y: (Math.random() - 0.5) * 500 - 150
                            }}
                            transition={{ duration: 2, ease: "easeOut", delay: Math.random() * 0.3 }}
                            className="w-3 h-3 rounded-full absolute"
                            style={{ 
                                backgroundColor: i % 3 === 0 ? '#10B981' : i % 2 === 0 ? '#E8600A' : '#3B82F6' 
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="w-full max-w-2xl relative z-10">
                {/* Logo / Brand */}
                {step !== 3 && (
                    <div className="text-center mb-10">
                        <a href="/" className="flex flex-col items-center gap-1.5 mb-6 hover:opacity-80 transition-opacity">
                            <Image src="/logo_svg.svg" alt="PeakTalk" width={36} height={36} className="block" />
                            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>PeakTalk</span>
                        </a>
                        <div className="font-mono text-[11px] text-[var(--accent-primary)] tracking-[0.15em] uppercase mb-3">
                            Onboarding
                        </div>
                        <h1 className="font-syne text-3xl sm:text-4xl font-bold text-[var(--text-main)] mb-3">
                            {step === 1 ? 'Расскажите о себе' : 'К чему готовитесь?'}
                        </h1>
                        <p className="text-[var(--text-dim)] font-inter text-sm max-w-md mx-auto">
                            {step === 1
                                ? 'Это поможет AI-тренеру подобрать правильный стиль и уровень сложности.'
                                : 'Укажите главную цель — тренер сфокусируется именно на ней.'}
                        </p>
                    </div>
                )}

                {/* Step indicator */}
                {step !== 3 && (
                    <div className="flex items-center justify-center gap-3 mb-10">
                        {[1, 2].map((s) => (
                            <div key={s} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                                    step > s
                                        ? 'bg-emerald-500 text-white'
                                        : step === s
                                            ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_12px_rgba(232,96,10,0.30)]'
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
                )}

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
                                        className={`text-left p-5 rounded-2xl border transition-all duration-200 relative group min-h-[140px] flex flex-col justify-start ${
                                            segment === seg.id
                                                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] shadow-[0_0_20px_rgba(232,96,10,0.15)]'
                                                : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                        }`}
                                    >
                                        {segment === seg.id && (
                                            <div className="absolute top-4 right-4 text-[var(--accent-primary)]">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                                            segment === seg.id
                                                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                                : 'bg-[var(--bg-surface-alt)] border border-[var(--border-light)] text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                                        }`}>
                                            {seg.icon}
                                        </div>
                                        <div className="font-syne text-base font-semibold text-[var(--text-main)] mb-1">{seg.label}</div>
                                        <div className="font-inter text-xs text-[var(--text-muted)] leading-relaxed">{seg.desc}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    disabled={!segment}
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-syne font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed btn-primary hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(232,96,10,0.25)] min-h-[48px]"
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
                                        className={`text-left p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 relative group min-h-[88px] ${
                                            goal === g.id
                                                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] shadow-[0_0_20px_rgba(232,96,10,0.15)]'
                                                : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-hover)]'
                                        }`}
                                    >
                                        {goal === g.id && (
                                            <div className="absolute top-4 right-4 text-[var(--accent-primary)]">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                            goal === g.id
                                                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                                : 'bg-[var(--bg-surface-alt)] border border-[var(--border-light)] text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                                        }`}>
                                            {g.icon}
                                        </div>
                                        <div className="font-syne text-base font-semibold text-[var(--text-main)]">{g.label}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3.5 rounded-xl font-mono text-sm border border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--border-light)] hover:text-[var(--text-main)] transition-colors min-h-[48px]"
                                >
                                    Назад
                                </button>
                                <button
                                    disabled={!goal || isSubmitting}
                                    onClick={handleSubmit}
                                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-syne font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed btn-primary hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(232,96,10,0.25)] min-h-[48px]"
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

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-center bg-[var(--bg-surface)] border border-[var(--border-main)] p-8 sm:p-12 rounded-3xl relative overflow-hidden shadow-sm"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={36} className="sm:hidden" />
                                <CheckCircle2 size={40} className="hidden sm:block" />
                            </div>
                            <h2 className="font-syne text-2xl sm:text-3xl font-bold text-[var(--text-main)] mb-3 leading-tight">
                                Профиль успешно настроен!
                            </h2>
                            <p className="text-[var(--text-dim)] mb-10 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                                Ваш персональный ИИ-тренер готов к работе. Выберите, с чего хотите начать первую тренировку.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <button
                                    onClick={() => router.push('/upload')}
                                    className="p-5 sm:p-6 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-main)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)] transition-all text-left flex flex-col group min-h-[160px]"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                    <h3 className="font-syne font-semibold text-lg sm:text-xl text-[var(--text-main)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">Загрузить текст</h3>
                                    <p className="font-inter text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mt-auto">Тренер проанализирует логику, структуру и тайминг вашего доклада.</p>
                                </button>
                                
                                <button
                                    onClick={() => router.push('/simulation')}
                                    className="p-5 sm:p-6 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-main)] hover:border-emerald-500 hover:bg-[var(--bg-surface-hover)] transition-all text-left flex flex-col group min-h-[160px]"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5 group-hover:-translate-y-1 transition-transform">
                                        <Mic size={24} />
                                    </div>
                                    <h3 className="font-syne font-semibold text-lg sm:text-xl text-[var(--text-main)] mb-2 group-hover:text-emerald-500 transition-colors">Симуляция Q&A</h3>
                                    <p className="font-inter text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mt-auto">Отвечайте на сложные и провокационные вопросы в реальном времени.</p>
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => router.push('/dashboard')} 
                                className="mt-8 font-mono text-[11px] sm:text-xs tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors underline underline-offset-4 p-2 cursor-pointer min-h-[44px] inline-flex items-center justify-center"
                            >
                                Перейти в дашборд
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
