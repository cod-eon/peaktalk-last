"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity, Target, Zap, Waves, BrainCircuit, MoreHorizontal } from 'lucide-react';

const stats = [
    { title: 'Время выступлений', value: '4ч 12м', diff: '+12%', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Слов паразитов убрано', value: '1,492', diff: '-34%', icon: Waves, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Средний скор', value: '84.5', diff: '+4.2', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Симуляций пройдено', value: '18', diff: '+3', icon: BrainCircuit, color: 'text-orange-400', bg: 'bg-orange-500/10' },
];

export default function AnalyticsPage() {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-10 md:py-16 relative z-10 w-full overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-3xl font-syne font-bold text-slate-100 mb-2 tracking-tight flex items-center gap-3">
                        <BarChart3 className="text-blue-500" />
                        Аналитика
                    </h1>
                    <p className="text-slate-400 text-sm">Прогресс вашего публичного выступания за последние 30 дней.</p>
                </div>
                
                <div className="flex gap-2">
                    <button className="bg-[var(--bg-surface-hover)] border border-[var(--border-main)] text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        30 дней
                    </button>
                    <button className="bg-[var(--bg-surface)] border border-[var(--border-light)] text-slate-500 hover:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Все время
                    </button>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-5 relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={20} strokeWidth={1.5} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                <TrendingUp size={12} /> {stat.diff}
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-2xl font-syne font-bold text-slate-100 mb-1">{stat.value}</div>
                            <div className="text-sm text-slate-500">{stat.title}</div>
                        </div>

                        {/* Background glow on hover */}
                        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full ${stat.bg} blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                    </motion.div>
                ))}
            </div>

            {/* Charts Section Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Progress Chart */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 min-h-[400px] flex flex-col"
                >
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-syne font-bold text-slate-200">Динамика качества (AI Score)</h3>
                            <p className="text-xs text-slate-500 mt-1">Средний балл за анализ текстов</p>
                        </div>
                        <button className="text-slate-500 hover:text-slate-300">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>

                    <div className="flex-1 relative w-full h-full flex items-end justify-between gap-2 px-2 pb-6">
                        {/* Fake Bar Chart */}
                        {[40, 55, 48, 65, 70, 68, 85, 82, 90, 88].map((h, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 flex-1 group">
                                <div className="w-full bg-[var(--bg-surface-alt)] rounded-t-sm relative flex justify-end flex-col overflow-hidden h-full">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: 0.5 + i * 0.05, type: 'spring' }}
                                        className={`w-full rounded-t-sm relative ${h > 80 ? 'bg-emerald-500/80' : h > 60 ? 'bg-blue-500/80' : 'bg-slate-700/80'} group-hover:brightness-125 transition-all`}
                                    >
                                        <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
                                    </motion.div>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono hidden sm:block">Ден {i+1}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Issues Breakdown */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 flex flex-col"
                >
                    <div className="mb-6">
                        <h3 className="text-lg font-syne font-bold text-slate-200">Типовые ошибки</h3>
                        <p className="text-xs text-slate-500 mt-1">В чем вы ошибаетесь чаще всего</p>
                    </div>

                    <div className="flex-1 flex flex-col gap-5 justify-center">
                        {[
                            { label: 'Вода / Слова-паразиты', val: 45, color: 'bg-red-500' },
                            { label: 'Слабая аргументация', val: 30, color: 'bg-yellow-500' },
                            { label: 'Канцеляризмы', val: 15, color: 'bg-orange-500' },
                            { label: 'Маркеры неуверенности', val: 10, color: 'bg-purple-500' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-300">{item.label}</span>
                                    <span className="text-slate-500 font-mono">{item.val}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#111115] rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.val}%` }}
                                        transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                                        className={`h-full ${item.color} rounded-full`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                        <Zap size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-200 leading-relaxed">
                            У вас отличный прогресс в структурировании. Постарайтесь уменьшить количество вводных слов на старте, чтобы увеличить Energy Score.
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
