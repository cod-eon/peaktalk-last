"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Bell, Shield, Wallet, Monitor, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const TABS = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'billing', label: 'Оплата', icon: Wallet },
    { id: 'appearance', label: 'Внешний вид', icon: Monitor },
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

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const user = useAuthStore((s) => s.user);

    // Profile state
    const [displayName, setDisplayName] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);

    // Security state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.user_metadata?.display_name || '');
        }
        api.get('/me')
            .then((me: { onboarding_profile: OnboardingProfile | null }) => {
                setOnboardingProfile(me.onboarding_profile);
            })
            .catch(() => {});
    }, [user]);

    const handleSaveProfile = async () => {
        const trimmed = displayName.trim();
        if (trimmed.length > 100) {
            toast.error('Имя не может быть длиннее 100 символов');
            return;
        }
        setIsSavingProfile(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ data: { display_name: trimmed } });
            if (error) throw error;
            toast.success('Профиль обновлён');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ошибка';
            toast.error(message);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Пароли не совпадают');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Минимум 8 символов');
            return;
        }
        setIsSavingPassword(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Пароль успешно изменён');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ошибка изменения пароля';
            toast.error(message);
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

    const inputClass =
        'bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium';

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-10 md:py-16">
            <div className="mb-12">
                <h1 className="text-3xl font-syne font-bold text-slate-100 mb-2 tracking-tight flex items-center gap-3">
                    <Settings className="text-slate-400" />
                    Настройки
                </h1>
                <p className="text-slate-400 text-sm">Управление аккаунтом и предпочтениями.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                {/* Sidebar Nav */}
                <div className="w-full md:w-56 shrink-0 flex flex-col gap-1">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left relative overflow-hidden ${
                                    isActive
                                        ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-[var(--bg-surface)] border border-transparent'
                                }`}
                            >
                                <tab.icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="settings-tab-indicator"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-sm"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content Panel */}
                <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden min-h-[420px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {/* ── PROFILE ── */}
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col gap-8 relative z-10"
                            >
                                <div>
                                    <h2 className="text-xl font-syne font-semibold text-slate-100 mb-1">
                                        Профиль
                                    </h2>
                                    <p className="text-sm text-slate-500">Персональные данные аккаунта.</p>
                                </div>

                                {/* Avatar + info */}
                                <div className="flex items-center gap-6 pb-8 border-b border-[var(--border-light)]">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-[3px] shrink-0">
                                        <div className="w-full h-full bg-[var(--bg-main)] rounded-full flex items-center justify-center">
                                            <span className="text-xl font-syne font-bold text-white">
                                                {avatarInitials}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-200 font-semibold mb-0.5">
                                            {user?.user_metadata?.display_name || 'Пользователь'}
                                        </div>
                                        <div className="text-slate-500 text-sm mb-2">{user?.email}</div>
                                        {onboardingProfile && (
                                            <div className="flex gap-2 flex-wrap">
                                                <span className="px-2 py-0.5 bg-[var(--bg-main)] border border-[var(--border-light)] rounded text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                                                    {SEGMENT_LABELS[onboardingProfile.segment] ?? onboardingProfile.segment}
                                                </span>
                                                <span className="px-2 py-0.5 bg-[var(--bg-main)] border border-[var(--border-light)] rounded text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                                                    {GOAL_LABELS[onboardingProfile.primary_goal] ?? onboardingProfile.primary_goal}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                                            Отображаемое имя
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Ваше имя"
                                            maxLength={100}
                                            className={inputClass}
                                        />
                                        {displayName.length > 80 && (
                                            <p className="text-[11px] font-mono text-amber-500">
                                                {100 - displayName.length} символов осталось
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            readOnly
                                            className={`${inputClass} opacity-50 cursor-not-allowed`}
                                        />
                                        <p className="text-[11px] text-slate-600 font-mono">
                                            Email изменяется через службу поддержки
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="btn-primary px-8 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-60"
                                    >
                                        {isSavingProfile ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={16} />
                                        )}
                                        Сохранить
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── SECURITY ── */}
                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col gap-8 relative z-10"
                            >
                                <div>
                                    <h2 className="text-xl font-syne font-semibold text-slate-100 mb-1">
                                        Безопасность
                                    </h2>
                                    <p className="text-sm text-slate-500">Управление паролем аккаунта.</p>
                                </div>

                                <div className="flex flex-col gap-5 pb-8 border-b border-[var(--border-light)]">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                                            Новый пароль
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Минимум 8 символов"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                                            Подтвердите пароль
                                        </label>
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
                                            className="btn-primary px-6 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-60"
                                        >
                                            {isSavingPassword ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Shield size={16} />
                                            )}
                                            Изменить пароль
                                        </button>
                                    </div>
                                </div>

                                {/* Active session */}
                                <div>
                                    <h3 className="text-sm font-syne font-semibold text-slate-300 mb-3">
                                        Активная сессия
                                    </h3>
                                    <div className="p-4 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-slate-200 font-medium">
                                                Текущее устройство
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                {user?.email}
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                            Активна
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── PLACEHOLDER для остальных ── */}
                        {activeTab !== 'profile' && activeTab !== 'security' && (
                            <motion.div
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-center h-full relative z-10"
                            >
                                <div className="w-16 h-16 rounded-full bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center text-slate-500 mb-4 opacity-40">
                                    <Monitor size={24} />
                                </div>
                                <h3 className="text-lg font-syne font-semibold text-slate-200 mb-2">
                                    Раздел в разработке
                                </h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    Этот раздел появится в будущих обновлениях платформы.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
