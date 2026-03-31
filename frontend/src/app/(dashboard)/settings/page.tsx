"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Wallet, Loader2, CheckCircle2, Clock, Lock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const TABS = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'billing', label: 'Оплата', icon: Wallet },
];

type OnboardingProfile = {
    segment: string;
    primary_goal: string;
};

const SEGMENT_LABELS: Record<string, string> = {
    student: 'Студент',
    junior: 'Специалист',
    founder: 'Фаундер',
    manager: 'Руководитель',
    other: 'Другое',
};

const GOAL_LABELS: Record<string, string> = {
    interview: 'Собеседование',
    pitch: 'Питч',
    conference: 'Конференция',
    defense: 'Защита',
    other: 'Другое',
};

const inputClass =
    'w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[13px] font-inter text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-colors';

function ComingSoonTab({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
    const isBell = Icon === Bell;
    const isWallet = Icon === Wallet;
    const iconBgClass = isBell
        ? 'bg-amber-50 border-amber-100'
        : isWallet
            ? 'bg-emerald-50 border-emerald-100'
            : 'bg-[var(--bg-surface-alt)] border-[var(--border-main)]';
    const iconColorClass = isBell
        ? 'text-amber-500'
        : isWallet
            ? 'text-emerald-600'
            : 'text-[var(--text-dim)]';
    return (
        <motion.div
            key="coming-soon"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center justify-center h-full min-h-[280px] gap-4 text-center"
        >
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${iconBgClass}`}>
                <Icon size={24} className={iconColorClass} strokeWidth={1.5} />
            </div>
            <div>
                <h3 className="font-syne text-[15px] font-semibold text-[var(--text-main)] mb-2">{label}</h3>
                <p className="text-[12px] text-[var(--text-dim)] font-inter flex items-center gap-1.5 justify-center mb-3">
                    <Clock size={11} />
                    Будет доступно в следующих обновлениях
                </p>
                <span className="inline-block text-[10px] font-mono text-[var(--text-dim)] bg-[var(--bg-surface-alt)] border border-[var(--border-main)] px-2 py-0.5 rounded-full tracking-widest">
                    СКОРО
                </span>
            </div>
        </motion.div>
    );
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const user = useAuthStore((s) => s.user);

    const [displayName, setDisplayName] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();
    const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        if (user) setDisplayName(user.user_metadata?.display_name || '');
        api.get('/me')
            .then((me: { onboarding_profile: OnboardingProfile | null }) => setOnboardingProfile(me.onboarding_profile))
            .catch(() => {});
    }, [user]);

    const handleSaveProfile = async () => {
        const trimmed = displayName.trim();
        if (trimmed.length > 100) { toast.error('Имя не может быть длиннее 100 символов'); return; }
        setIsSavingProfile(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ data: { display_name: trimmed } });
            if (error) throw error;
            toast.success('Профиль обновлён');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Ошибка');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push('/');
            toast.success('Вы вышли из аккаунта');
        } catch (err) {
            toast.error('Ошибка при выходе');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) { toast.error('Пароли не совпадают'); return; }
        if (newPassword.length < 8) { toast.error('Минимум 8 символов'); return; }
        setIsSavingPassword(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Пароль изменён');
            setNewPassword(''); setConfirmPassword('');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Ошибка');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const avatarInitials = (user?.user_metadata?.display_name || user?.email || 'U')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 py-6 sm:py-8 lg:px-8 pb-20 md:pb-10">
            <div className="mb-6 sm:mb-8">
                <p className="label-kicker mb-2">Аккаунт</p>
                <h1 className="font-syne text-[22px] sm:text-[26px] font-bold text-[var(--text-main)] tracking-tight">
                    Настройки
                </h1>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Tab nav */}
                <div className="w-full md:w-48 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] transition-all duration-150 text-[13px] font-medium font-inter text-left whitespace-nowrap border relative ${
                                    isActive
                                        ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)] border-[var(--accent-primary-glow)]'
                                        : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] border-transparent'
                                }`}
                            >
                                <tab.icon size={15} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-dim)]'} />
                                {tab.label}
                            </button>
                        );
                    })}

                    <div className="hidden md:block h-px bg-[var(--border-main)] my-2 opacity-50" />

                    <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)] transition-all duration-150 text-[13px] font-medium font-inter text-left whitespace-nowrap border border-transparent text-[var(--color-destructive)] hover:bg-red-500/5 hover:border-red-500/20 disabled:opacity-50 mt-auto"
                    >
                        {isLoggingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                        Выйти
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-lg)] p-5 sm:p-7 min-h-[360px]">
                    <AnimatePresence mode="wait">
                        {/* Profile */}
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-6"
                            >
                                <div>
                                    <h2 className="font-syne text-[16px] font-semibold text-[var(--text-main)] tracking-tight mb-0.5">Профиль</h2>
                                    <p className="text-[12px] text-[var(--text-dim)] font-inter">Персональные данные аккаунта</p>
                                </div>

                                {/* Avatar row */}
                                <div className="flex items-center gap-4 pb-5 border-b border-[var(--border-main)]">
                                    <div className="w-20 h-20 rounded-full bg-[var(--accent-primary-bg)] border-2 border-orange-200 ring-4 ring-offset-2 ring-orange-100 flex items-center justify-center shrink-0">
                                        <span className="font-syne text-2xl font-bold text-[var(--accent-primary)]">
                                            {avatarInitials}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-[var(--text-main)] font-inter">
                                            {user?.user_metadata?.display_name || 'Пользователь'}
                                        </p>
                                        <p className="text-[12px] text-[var(--text-dim)] font-mono">{user?.email}</p>
                                        {onboardingProfile && (
                                            <div className="flex gap-1.5 flex-wrap mt-1.5">
                                                <span className="label-kicker px-2 py-0.5 rounded bg-[var(--bg-surface-alt)] border border-[var(--border-main)]">
                                                    {SEGMENT_LABELS[onboardingProfile.segment] ?? onboardingProfile.segment}
                                                </span>
                                                <span className="label-kicker px-2 py-0.5 rounded bg-[var(--bg-surface-alt)] border border-[var(--border-main)]">
                                                    {GOAL_LABELS[onboardingProfile.primary_goal] ?? onboardingProfile.primary_goal}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="label-kicker">Отображаемое имя</label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Ваше имя"
                                            maxLength={100}
                                            className={inputClass}
                                        />
                                        {displayName.length > 80 && (
                                            <p className="text-[11px] font-mono text-[var(--color-warning)]">
                                                {100 - displayName.length} символов осталось
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="label-kicker">Email</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                readOnly
                                                className={`${inputClass} bg-[var(--bg-surface-alt)] cursor-not-allowed pr-9`}
                                            />
                                            <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                                        </div>
                                        <p className="text-[11px] text-[var(--text-dim)] font-inter">
                                            Для изменения email обратитесь в поддержку
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <button
                                        onClick={handleSignOut}
                                        disabled={isLoggingOut}
                                        className="md:hidden flex items-center gap-2 text-[12px] font-medium text-[var(--color-destructive)] px-2 py-1 hover:bg-red-500/5 rounded transition-colors"
                                    >
                                        <LogOut size={14} />
                                        Выйти из аккаунта
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="btn-primary gap-2 disabled:opacity-60 ml-auto"
                                    >
                                        {isSavingProfile
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <CheckCircle2 size={14} />
                                        }
                                        Сохранить
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Security */}
                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-6"
                            >
                                <div>
                                    <h2 className="font-syne text-[16px] font-semibold text-[var(--text-main)] tracking-tight mb-0.5">Безопасность</h2>
                                    <p className="text-[12px] text-[var(--text-dim)] font-inter">Управление паролем аккаунта</p>
                                </div>

                                <div className="flex flex-col gap-4 pb-5 border-b border-[var(--border-main)]">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="label-kicker">Новый пароль</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Минимум 8 символов"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="label-kicker">Подтвердите пароль</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Повторите новый пароль"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={isSavingPassword || !newPassword || !confirmPassword}
                                            className="btn-primary gap-2 disabled:opacity-60"
                                        >
                                            {isSavingPassword
                                                ? <Loader2 size={14} className="animate-spin" />
                                                : <Shield size={14} />
                                            }
                                            Изменить пароль
                                        </button>
                                    </div>
                                </div>

                                {/* Active session */}
                                <div>
                                    <p className="label-kicker mb-3">Активная сессия</p>
                                    <div className="p-3.5 bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-[var(--radius-sm)] flex items-center justify-between">
                                        <div>
                                            <p className="text-[13px] font-medium text-[var(--text-main)] font-inter">
                                                Текущее устройство
                                            </p>
                                            <p className="text-[11px] text-[var(--text-dim)] font-mono mt-0.5">{user?.email}</p>
                                        </div>
                                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            Активна
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Notifications */}
                        {activeTab === 'notifications' && (
                            <ComingSoonTab label="Уведомления" icon={Bell} />
                        )}

                        {/* Billing */}
                        {activeTab === 'billing' && (
                            <ComingSoonTab label="Оплата и тарифы" icon={Wallet} />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
