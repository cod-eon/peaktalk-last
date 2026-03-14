"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Bell, Shield, Wallet, Monitor, Trash2 } from 'lucide-react';

const TABS = [
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'billing', label: 'Оплата и Тарифы', icon: Wallet },
    { id: 'appearance', label: 'Внешний вид', icon: Monitor },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-10 md:py-16 relative z-10">
            <div className="mb-12">
                <h1 className="text-3xl font-syne font-bold text-slate-100 mb-2 tracking-tight flex items-center gap-3">
                    <Settings className="text-slate-400" />
                    Настройки
                </h1>
                <p className="text-slate-400 text-sm">Управление вашим аккаунтом и предпочтениями системы.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                
                {/* SETTINGS SIDEBAR NAV */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left relative overflow-hidden ${
                                    isActive ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[var(--bg-surface)] border border-transparent'
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

                {/* SETTINGS CONTENT AREA */}
                <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                    {/* Nice subtle glow in background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col gap-8 relative z-10"
                            >
                                <div>
                                    <h2 className="text-xl font-syne font-semibold text-slate-100 mb-1">Профиль</h2>
                                    <p className="text-sm text-slate-500">Обновите ваши персональные данные и фото.</p>
                                </div>
                                
                                <div className="flex items-center gap-6 pb-8 border-b border-[var(--border-light)]">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shrink-0 relative group">
                                        <div className="w-full h-full bg-[var(--bg-main)] rounded-full flex items-center justify-center overflow-hidden">
                                            <span className="text-3xl font-syne font-bold text-white">AS</span>
                                            {/* We can put an Image here later */}
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                                            <span className="text-xs font-medium text-white">Изменить</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button className="bg-[var(--bg-surface-hover)] border border-[var(--border-main)] hover:bg-[var(--bg-surface-alt)] text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors w-fit">
                                            Загрузить новое фото
                                        </button>
                                        <p className="text-xs text-slate-500 font-mono">JPG, GIF или PNG. Максимум 2MB.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">Имя</label>
                                        <input 
                                            type="text" 
                                            defaultValue="Alex"
                                            className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">Фамилия</label>
                                        <input 
                                            type="text" 
                                            defaultValue="Smith"
                                            className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 sm:col-span-2">
                                        <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">Email</label>
                                        <input 
                                            type="email" 
                                            defaultValue="alex.smith@example.com"
                                            className="bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6">
                                    <button className="btn-primary px-8 py-2.5 text-sm font-semibold rounded-xl">
                                        Сохранить
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab !== 'profile' && (
                            <motion.div
                                key="placeholder"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="flex flex-col items-center justify-center py-20 text-center relative z-10 h-full"
                            >
                                <div className="w-16 h-16 rounded-full bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center text-slate-500 mb-4 opacity-50">
                                    <Monitor size={24} />
                                </div>
                                <h3 className="text-lg font-syne font-semibold text-slate-200 mb-2">Раздел в разработке</h3>
                                <p className="text-sm text-slate-500 max-w-sm text-balance">
                                    Этот раздел появится в будущих обновлениях платформы, когда мы внедрим этот функционал.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
