"use client";

import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Loader2, LogOut, Check, Lock, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const TABS = [
  { id: 'profile', label: 'ПРОФИЛЬ', icon: User },
  { id: 'security', label: 'БЕЗОПАСНОСТЬ', icon: Shield },
  { id: 'notifications', label: 'УВЕДОМЛЕНИЯ', icon: Bell },
];

type OnboardingProfile = {
  segment: string;
  primary_goal: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  manager: 'Тимлид / Менеджер',
  head: 'Руководитель функции',
  founder: 'Фаундер / CEO',
  customer_facing: 'Клиентская команда',
  other: 'Другое',
};

const GOAL_LABELS: Record<string, string> = {
  budget_defense: 'Защита бюджета / дорожной карты',
  pitch: 'Инвест-спич / продажа',
  qbr: 'Клиентский квартальный обзор',
  stakeholder: 'Сложный разговор со стейкхолдером',
  other: 'Другое',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const user = useAuthStore((s) => s.user);

  const [displayName, setDisplayName] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.user_metadata?.display_name || '');
    api.get('/me')
      .then((me: { 
        onboarding_profile: OnboardingProfile | null, 
        notification_email_enabled: boolean, 
        notification_push_enabled: boolean 
      }) => {
        setOnboardingProfile(me.onboarding_profile);
        setEmailNotifications(me.notification_email_enabled ?? true);
        setPushNotifications(me.notification_push_enabled ?? true);
      })
      .catch(() => {});
  }, [user]);

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await api.patch('/me', {
        notification_email_enabled: emailNotifications,
        notification_push_enabled: pushNotifications,
      });
      toast.success('Настройки уведомлений обновлены');
    } catch {
      toast.error('Не удалось обновить настройки');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSignOut = () => {
    setIsLoggingOut(true);
    window.location.assign('/api/auth/logto/sign-out');
  };

  const inputClasses = "w-full bg-white border border-[#D9D5CC] text-[#111827] rounded-none py-2.5 px-3.5 text-sm focus:outline-none focus:ring-0 focus:border-[#111827] transition-all font-inter ";

  return (
    <div className="pb-16 pt-6 sm:pt-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 font-inter">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">Настройки</h1>
          <p className="text-sm font-medium text-[#73706A] mt-1">Профиль, доступ и рабочие уведомления аккаунта.</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-[#D9D5CC] text-[#111827] text-sm font-semibold rounded-none hover:border-[#111827] hover:text-red-600 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Выйти из аккаунта
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-[#D9D5CC] flex gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            <div className="bg-white border border-[#D9D5CC] rounded-none p-6 md:p-8 space-y-8">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-neutral-200">
                <div className="w-16 h-16 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-none border border-neutral-300 flex items-center justify-center shrink-0 ">
                  <span className="font-inter text-xl font-bold text-neutral-900">
                    {(user?.user_metadata?.display_name || user?.email || 'U').slice(0,2)}
                  </span>
                </div>
                <div>
                  <p className="font-inter text-xl font-bold text-neutral-900 tracking-tight">
                    {user?.user_metadata?.display_name || 'Пользователь'}
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
                    readOnly
                    maxLength={100}
                    className={`${inputClasses} bg-neutral-100 text-neutral-500 cursor-not-allowed`}
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
                  <p className="text-[12px] text-neutral-400 mt-2 font-medium">Email нельзя изменить.</p>
                </div>

                <p className="text-xs text-neutral-400">Имя аккаунта управляется в профиле Logto.</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-neutral-200 rounded-none p-6 md:p-8 space-y-8">
              <div>
                <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-1">Смена пароля</h2>
                <p className="text-xs text-neutral-400">Пароль и восстановление доступа обслуживаются в Logto.</p>
              </div>

              <div className="space-y-5">
                <p className="text-sm leading-relaxed text-neutral-600">
                  Чтобы сменить пароль или восстановить доступ, подтвердите email
                  в защищённом окне Logto.
                </p>
                <a
                  href="/forgot-password"
                  className="w-full inline-flex items-center justify-center gap-2 bg-neutral-900 text-white rounded-none px-6 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-all"
                >
                  <Shield className="w-4 h-4" />
                  Открыть восстановление пароля
                </a>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white border border-neutral-200 rounded-none p-6 md:p-8 space-y-8">
              <div>
                <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-1">Уведомления</h2>
                <p className="text-xs text-neutral-400">Управляйте тем, как мы отправляем вам обновления.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-neutral-100">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Email-уведомления</h3>
                    <p className="text-xs text-neutral-500 mt-1">Оповещения о стресс-тестах на вашу электронную почту.</p>
                  </div>
                  <button 
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${emailNotifications ? 'bg-neutral-900' : 'bg-neutral-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailNotifications ? 'translate-x-2' : '-translate-x-2'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Push-уведомления</h3>
                    <p className="text-xs text-neutral-500 mt-1">Мгновенные уведомления в браузере о важных событиях.</p>
                  </div>
                  <button 
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${pushNotifications ? 'bg-neutral-900' : 'bg-neutral-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pushNotifications ? 'translate-x-2' : '-translate-x-2'}`} />
                  </button>
                </div>

                <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button
                    onClick={async () => {
                      try {
                        await api.post('/api/notifications/test');
                        toast.success('Тестовый сигнал отправлен!');
                      } catch {
                        toast.error('Ошибка отправки теста');
                      }
                    }}
                    className="text-[10px] font-bold text-neutral-400 hover:text-neutral-900 uppercase tracking-widest border border-neutral-200 px-4 py-2 hover:bg-neutral-50 transition-all flex items-center gap-2"
                  >
                    <Clock className="w-3 h-3" />
                    Отправить тест
                  </button>
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isSavingNotifications}
                    className="inline-flex items-center gap-2 bg-neutral-900 text-white rounded-none px-6 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-all disabled:opacity-50"
                  >
                    {isSavingNotifications ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Сохранить изменения
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
