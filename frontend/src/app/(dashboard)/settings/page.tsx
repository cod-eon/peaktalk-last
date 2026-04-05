"use client";

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Wallet, Loader2, LogOut, Check, Lock, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const TABS = [
  { id: 'profile', label: 'ПРОФИЛЬ', icon: User },
  { id: 'security', label: 'БЕЗОПАСНОСТЬ', icon: Shield },
  { id: 'notifications', label: 'УВЕДОМЛЕНИЯ', icon: Bell },
  { id: 'billing', label: 'БИЛЛИНГ', icon: Wallet },
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

function ComingSoonTab({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] bg-white border border-neutral-200 rounded-none p-10 text-center">
      <Icon className="w-8 h-8 text-neutral-300 mb-4" />
      <h3 className="text-sm font-semibold text-neutral-900 tracking-wider uppercase mb-2">{label}</h3>
      <p className="text-sm text-neutral-500 mb-4 max-w-md">Модуль находится в разработке и будет доступен в следующих релизах системы.</p>
      <span className="inline-block px-3 py-1 text-[10px] font-mono text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-none tracking-widest">
        ОТЛОЖЕНО
      </span>
    </div>
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
    if (trimmed.length > 100) { toast.error('Имя превышает лимит (100)'); return; }
    setIsSavingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { display_name: trimmed } });
      if (error) throw error;
      toast.success('Профиль синхронизирован');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Критическая ошибка сохранения');
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
      toast.success('Сессия завершена');
    } catch (err) {
      toast.error('Сбой при отключении');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error('Токены не совпадают'); return; }
    if (newPassword.length < 8) { toast.error('Длина токена < 8'); return; }
    setIsSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Конфигурация доступа обновлена');
      setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Сбой обновления доступа');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const inputClasses = "w-full bg-white border border-neutral-200 text-neutral-900 rounded-none py-2.5 px-3.5 text-sm focus:outline-none focus:ring-0 focus:border-neutral-900 transition-all font-inter ";

  return (
    <div className="pb-16 pt-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 font-inter bg-white min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Настройки</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">Управление профилем и безопасностью аккаунта.</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-neutral-200 text-neutral-700 text-sm font-semibold rounded-none hover:border-neutral-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Выйти из аккаунта
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200 flex gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-[11px] font-bold tracking-widest uppercase whitespace-nowrap transition-colors border-b-2 -mb-[2px] ${
                isActive
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2.5 : 2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>

        {/* Content Pane */}
        <div className="w-full relative mt-6">
          
          {activeTab === 'profile' && (
            <div className="bg-white border border-neutral-200 rounded-none p-6 md:p-8 space-y-8">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-neutral-200">
                <div className="w-16 h-16 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-none border border-neutral-300 flex items-center justify-center shrink-0 ">
                  <span className="font-inter text-xl font-bold text-neutral-900">
                    {(user?.user_metadata?.display_name || user?.email || 'U').slice(0,2)}
                  </span>
                </div>
                <div>
                  <p className="font-inter text-xl font-bold text-neutral-900 tracking-tight">
                    {user?.user_metadata?.display_name || 'UNDEFINED'}
                  </p>
                  <p className="font-inter text-[13px] text-neutral-500 mt-1 font-medium">{user?.email}</p>
                  {onboardingProfile && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      <span className="px-2.5 py-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-none">
                        Сегмент: {SEGMENT_LABELS[onboardingProfile.segment] ?? onboardingProfile.segment}
                      </span>
                      <span className="px-2.5 py-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-none">
                        Цель: {GOAL_LABELS[onboardingProfile.primary_goal] ?? onboardingProfile.primary_goal}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-inter text-sm font-semibold text-neutral-700 mb-2">
                    Отображаемое имя
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={100}
                    className={inputClasses}
                  />
                  {displayName.length > 80 && (
                    <p className="text-[10px] font-mono text-amber-600 mt-2">
                      ЛИМИТ: {100 - displayName.length}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-inter text-sm font-semibold text-neutral-700 mb-2">
                    Адрес электронной почты
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className={`${inputClasses} bg-neutral-100 text-neutral-400 cursor-not-allowed`}
                    />
                    <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" />
                  </div>
                  <p className="text-[12px] text-neutral-400 mt-2 font-medium">Системный идентификатор (только чтение).</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 bg-neutral-900 text-white rounded-none px-6 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-all  disabled:opacity-50"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Сохранить изменения
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-neutral-200 rounded-none p-6 md:p-8 space-y-8">
              <div>
                <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-1">Доступ к системе</h2>
                <p className="text-xs text-neutral-400">Установка нового ключа аутентификации</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block font-inter text-sm font-semibold text-neutral-700 mb-2">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Мин. 8 символов"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block font-inter text-sm font-semibold text-neutral-700 mb-2">
                    Подтверждение пароля
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль"
                    className={inputClasses}
                  />
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={isSavingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 text-white rounded-none px-6 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-all  disabled:opacity-50"
                  >
                    {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    Обновить пароль
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <ComingSoonTab label="СИГНАЛЫ" icon={Bell} />
          )}

          {activeTab === 'billing' && (
            <ComingSoonTab label="БИЛЛИНГ" icon={Wallet} />
          )}

        </div>
      </div>
    </div>
  );
}
