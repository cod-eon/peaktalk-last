'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Briefcase, Rocket, Users, ChevronRight, Mic, FileText, Globe, CheckCircle2, Loader2, MessageSquare, BarChart2, Download, Monitor, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type Segment = 'manager' | 'head' | 'founder' | 'customer_facing' | 'other';
type Goal = 'budget_defense' | 'pitch' | 'qbr' | 'stakeholder' | 'other';
type InstallDevice = 'android' | 'ios' | 'desktop';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const SEGMENTS: { id: Segment; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'manager', label: 'Тимлид / Менеджер', desc: 'Защита решений, приоритизация, апдейты руководству', icon: <Users size={22} /> },
    { id: 'head', label: 'Руководитель функции', desc: 'Бюджетные защиты, согласование инициатив, обсуждение с советом директоров', icon: <Briefcase size={22} /> },
    { id: 'founder', label: 'Фаундер / CEO', desc: 'Инвест-спичи, партнёрские переговоры, стратегические продажи', icon: <Rocket size={22} /> },
    { id: 'customer_facing', label: 'Клиентская команда', desc: 'квартальные обзоры, эскалации, переговоры по продлению контракта', icon: <MessageSquare size={22} /> },
    { id: 'other', label: 'Другое', desc: 'Любой другой тип рабочей коммуникации', icon: <Globe size={22} /> },
];

const GOALS: { id: Goal; label: string; icon: React.ReactNode }[] = [
    { id: 'budget_defense', label: 'Защита бюджета / дорожной карты', icon: <FileText size={20} /> },
    { id: 'pitch', label: 'Инвест-спич / продажа', icon: <Rocket size={20} /> },
    { id: 'qbr', label: 'Клиентский квартальный обзор', icon: <BarChart2 size={20} /> },
    { id: 'stakeholder', label: 'Сложный разговор со стейкхолдером', icon: <Users size={20} /> },
    { id: 'other', label: 'Другое', icon: <Globe size={20} /> },
];

function OnboardingForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('return') || '/dashboard';
    
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [segment, setSegment] = useState<Segment | null>(null);
    const [goal, setGoal] = useState<Goal | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [installDevice, setInstallDevice] = useState<InstallDevice>('desktop');
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallPromptAvailable, setIsInstallPromptAvailable] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

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
                    router.replace(returnUrl);
                }
            } catch {
                // Not logged in or error — stay on page (auth middleware will handle redirect)
            } finally {
                setIsChecking(false);
            }
        }
        checkProfile();
    }, [router]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isiPhone = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            // iOS Safari standalone mode
            ('standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));

        if (isStandalone) {
            setIsInstallPromptAvailable(false);
        }

        if (isiPhone) {
            setInstallDevice('ios');
            return;
        }

        if (isAndroid) {
            setInstallDevice('android');
            return;
        }

        setInstallDevice('desktop');
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
            setIsInstallPromptAvailable(true);
        };

        const handleAppInstalled = () => {
            setDeferredInstallPrompt(null);
            setIsInstallPromptAvailable(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

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

    const handleInstallApp = async () => {
        if (!deferredInstallPrompt) return;

        setIsInstalling(true);
        try {
            await deferredInstallPrompt.prompt();
            const choice = await deferredInstallPrompt.userChoice;
            if (choice.outcome === 'accepted') {
                toast.success('PeakTalk добавлен на устройство');
                setDeferredInstallPrompt(null);
                setIsInstallPromptAvailable(false);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Не удалось открыть установку');
        } finally {
            setIsInstalling(false);
        }
    };

    const installGuides: Record<InstallDevice, { title: string; hint: string; steps: string[] }> = {
        android: {
            title: 'Установите PeakTalk на Android',
            hint: 'Откроется как отдельное приложение и будет быстрее возвращать к симуляциям и уведомлениям.',
            steps: [
                'Откройте меню браузера Chrome или Edge.',
                'Нажмите «Установить приложение» или «Добавить на главный экран».',
                'Подтвердите установку и запускайте PeakTalk с рабочего стола.',
            ],
        },
        ios: {
            title: 'Добавьте PeakTalk на экран iPhone / iPad',
            hint: 'На iOS установка идёт через Safari, без отдельного popup-окна.',
            steps: [
                'Откройте сайт в Safari.',
                'Нажмите кнопку «Поделиться».',
                'Выберите «На экран Домой», затем подтвердите добавление.',
            ],
        },
        desktop: {
            title: 'Установите PeakTalk на компьютер',
            hint: 'Так сервис открывается отдельно от вкладок и ведёт себя как приложение.',
            steps: [
                'Откройте меню браузера или иконку установки в адресной строке.',
                'Нажмите «Установить PeakTalk» или «Install app».',
                'Закрепите приложение в dock / панели задач для быстрого запуска.',
            ],
        },
    };

    const currentInstallGuide = installGuides[installDevice];

    if (isChecking) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-neutral-900" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-start sm:justify-center px-4 py-6 sm:py-8 relative overflow-hidden">
            {/* Background grid — hidden on mobile for clean look */}
            <div className="fixed inset-0 pointer-events-none opacity-40 hidden md:block"
                style={{ backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />


            <div className="w-full max-w-4xl relative z-10">
                {/* Logo / Brand */}
                {step !== 3 && (
                    <div className="text-center mb-6 sm:mb-8">
                        <Link href="/" className="flex flex-col items-center gap-1 mb-4 sm:mb-5 hover:opacity-80 transition-opacity">
                            <Image src="/logo_svg.svg" alt="PeakTalk" width={32} height={32} className="block sm:w-9 sm:h-9" />
                            <span className="brand-wordmark text-[17px] sm:text-[18px] text-neutral-900">PeakTalk</span>
                        </Link>
                        <div className="font-mono text-[10px] sm:text-[11px] text-neutral-900 tracking-[0.15em] uppercase mb-2">
                            Onboarding
                        </div>
                        <h1 className="font-inter text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
                            {step === 1 ? 'Ваша роль' : 'Какой тип встречи впереди?'}
                        </h1>
                        <p className="text-neutral-400 font-inter text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                            {step === 1
                                ? 'Это поможет симулятору подобрать релевантные персоны и стиль давления.'
                                : 'Выберите ближайший сценарий — симулятор настроит вопросы под него.'}
                        </p>
                    </div>
                )}

                {/* Step indicator */}
                {step !== 3 && (
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                        {[1, 2].map((s) => (
                            <div key={s} className="flex items-center gap-2 sm:gap-3">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-none flex items-center justify-center font-mono text-[11px] sm:text-xs font-bold transition-all duration-300 ${
                                    step > s
                                        ? 'bg-emerald-500 text-white'
                                        : step === s
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-neutral-50 border border-neutral-200 text-neutral-400'
                                }`}>
                                    {step > s ? <CheckCircle2 size={13} className="sm:w-[14px] sm:h-[14px]" /> : s}
                                </div>
                                {s < 2 && (
                                    <div className={`w-10 sm:w-12 h-px transition-colors duration-300 ${step > s ? 'bg-emerald-500' : 'bg-neutral-200'}`} />
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                                {SEGMENTS.map((seg) => (
                                    <button
                                        key={seg.id}
                                        onClick={() => setSegment(seg.id)}
                                        className={`text-left p-4 sm:p-5 rounded-none border transition-all duration-200 relative group min-h-[116px] sm:min-h-[128px] flex flex-col justify-start ${
                                            segment === seg.id
                                                ? 'bg-neutral-100 border-neutral-900'
                                                : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100'
                                        }`}
                                    >
                                        {segment === seg.id && (
                                            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-neutral-900">
                                                <CheckCircle2 size={15} />
                                            </div>
                                        )}
                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-none flex items-center justify-center mb-3 sm:mb-4 transition-colors ${
                                            segment === seg.id
                                                ? 'bg-neutral-200 text-neutral-900'
                                                : 'bg-neutral-100 border border-neutral-200 text-neutral-500 group-hover:text-neutral-900'
                                        }`}>
                                            {seg.icon}
                                        </div>
                                        <div className="font-inter text-sm sm:text-[15px] font-semibold text-neutral-900 mb-1">{seg.label}</div>
                                        <div className="font-inter text-[11px] sm:text-xs text-neutral-500 leading-relaxed">{seg.desc}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    disabled={!segment}
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-2 px-5 py-3 rounded-none bg-[#171717] hover:bg-black text-white font-inter font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                                {GOALS.map((g) => (
                                    <button
                                        key={g.id}
                                        onClick={() => setGoal(g.id)}
                                        className={`text-left p-4 sm:p-5 rounded-none border transition-all duration-200 flex items-center gap-3 sm:gap-4 relative group min-h-[72px] sm:min-h-[84px] ${
                                            goal === g.id
                                                ? 'bg-neutral-100 border-neutral-900'
                                                : 'bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                                        }`}
                                    >
                                        {goal === g.id && (
                                            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-neutral-900">
                                                <CheckCircle2 size={15} />
                                            </div>
                                        )}
                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-none flex items-center justify-center flex-shrink-0 transition-colors ${
                                            goal === g.id
                                                ? 'bg-neutral-200 text-neutral-900'
                                                : 'bg-neutral-100 border border-neutral-200 text-neutral-500 group-hover:text-neutral-900'
                                        }`}>
                                            {g.icon}
                                        </div>
                                        <div className="font-inter text-sm sm:text-[15px] font-semibold text-neutral-900 pr-5 sm:pr-6">{g.label}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-5 py-3 rounded-none font-mono text-sm border border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900 transition-colors min-h-[44px]"
                                >
                                    Назад
                                </button>
                                <button
                                    disabled={!goal || isSubmitting}
                                    onClick={handleSubmit}
                                    className="flex items-center gap-2 px-5 py-3 rounded-none bg-[#171717] hover:bg-black text-white font-inter font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
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
                            className="text-center bg-neutral-50 border border-neutral-200 p-6 sm:p-10 rounded-none relative overflow-hidden shadow-sm"
                        >
                            <div className="w-14 h-14 sm:w-18 sm:h-18 bg-emerald-500/10 text-emerald-500 rounded-none flex items-center justify-center mx-auto mb-5 sm:mb-6">
                                <CheckCircle2 size={36} className="sm:hidden" />
                                <CheckCircle2 size={40} className="hidden sm:block" />
                            </div>
                            <h2 className="font-inter text-xl sm:text-3xl font-bold text-neutral-900 mb-2 sm:mb-3 leading-tight">
                                Профиль настроен
                            </h2>
                            <p className="text-neutral-400 mb-7 sm:mb-10 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                                Симулятор готов к работе. Выберите, с чего начать.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <button
                                    onClick={() => router.push('/upload')}
                                    className="p-4 sm:p-5 rounded-none border border-neutral-200 bg-white hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left flex flex-col group min-h-[136px] sm:min-h-[152px]"
                                >
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-neutral-100 text-neutral-900 flex items-center justify-center mb-4 sm:mb-5 group-hover:-translate-y-1 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                    <h3 className="font-inter font-semibold text-base sm:text-xl text-neutral-900 mb-2 transition-colors">Загрузить текст</h3>
                                    <p className="font-inter text-xs sm:text-sm text-neutral-500 leading-relaxed mt-auto">Симулятор проанализирует логику, структуру и аргументацию вашего документа.</p>
                                </button>
                                
                                <button
                                    onClick={() => router.push('/simulation')}
                                    className="p-4 sm:p-5 rounded-none border border-neutral-200 bg-white hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left flex flex-col group min-h-[136px] sm:min-h-[152px]"
                                >
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 sm:mb-5 group-hover:-translate-y-1 transition-transform">
                                        <Mic size={24} />
                                    </div>
                                    <h3 className="font-inter font-semibold text-base sm:text-xl text-neutral-900 mb-2 group-hover:text-emerald-500 transition-colors">Симуляция Q&A</h3>
                                    <p className="font-inter text-xs sm:text-sm text-neutral-500 leading-relaxed mt-auto">Отвечайте на сложные и провокационные вопросы в реальном времени.</p>
                                </button>
                            </div>

                            <div className="mt-6 sm:mt-8 border border-neutral-200 bg-white p-4 sm:p-5 text-left">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="max-w-xl">
                                        <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-400 mb-2">
                                            <Download size={14} />
                                            Приложение PeakTalk
                                        </div>
                                        <h3 className="font-inter text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
                                            {currentInstallGuide.title}
                                        </h3>
                                        <p className="text-sm text-neutral-500 leading-relaxed">
                                            {currentInstallGuide.hint}
                                        </p>
                                    </div>

                                    <div className="inline-flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setInstallDevice('android')}
                                            className={`min-h-[40px] px-3 inline-flex items-center gap-2 border text-xs font-semibold transition-colors ${
                                                installDevice === 'android'
                                                    ? 'border-neutral-900 bg-neutral-900 text-white'
                                                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                                            }`}
                                        >
                                            <Smartphone size={14} />
                                            Android
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInstallDevice('ios')}
                                            className={`min-h-[40px] px-3 inline-flex items-center gap-2 border text-xs font-semibold transition-colors ${
                                                installDevice === 'ios'
                                                    ? 'border-neutral-900 bg-neutral-900 text-white'
                                                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                                            }`}
                                        >
                                            <Smartphone size={14} />
                                            iPhone / iPad
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInstallDevice('desktop')}
                                            className={`min-h-[40px] px-3 inline-flex items-center gap-2 border text-xs font-semibold transition-colors ${
                                                installDevice === 'desktop'
                                                    ? 'border-neutral-900 bg-neutral-900 text-white'
                                                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                                            }`}
                                        >
                                            <Monitor size={14} />
                                            ПК
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                    {currentInstallGuide.steps.map((item, index) => (
                                        <div key={item} className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                                            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400 mb-2">
                                                Шаг {index + 1}
                                            </div>
                                            <div className="text-sm text-neutral-800 leading-relaxed">{item}</div>
                                        </div>
                                    ))}
                                </div>

                                {isInstallPromptAvailable && installDevice !== 'ios' && (
                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-neutral-200 bg-neutral-50 px-4 py-3">
                                        <p className="text-sm text-neutral-600 leading-relaxed">
                                            Браузер уже позволяет установить приложение прямо сейчас.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void handleInstallApp()}
                                            disabled={isInstalling}
                                            className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 bg-neutral-900 text-white font-semibold text-sm transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Download size={16} />
                                            {isInstalling ? 'Открываем...' : 'Установить PeakTalk'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => router.push(returnUrl)} 
                                className="mt-6 sm:mt-8 font-mono text-[11px] sm:text-xs tracking-wider uppercase text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-4 p-2 cursor-pointer min-h-[44px] inline-flex items-center justify-center"
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

export default function OnboardingPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>}>
            <OnboardingForm />
        </React.Suspense>
    );
}
