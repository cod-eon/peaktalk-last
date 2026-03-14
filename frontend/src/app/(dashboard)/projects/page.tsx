import React from 'react';
import { Folder, Clock, Hash, MoreHorizontal, ArrowRight, Activity, TrendingUp } from 'lucide-react';

const mockProjects = [
  { id: 1, title: 'Питч для Y Combinator W24', type: 'Pitch', date: '12 минут назад', score: 82, trend: 'up', items: 3 },
  { id: 2, title: 'Защита диплома по ИИ', type: 'Academic', date: 'Вчера', score: 65, trend: 'down', items: 1 },
  { id: 3, title: 'Собеседование в Яндекс', type: 'Interview', date: '3 дня назад', score: 92, trend: 'up', items: 5 },
  { id: 4, title: 'Отчет для инвесторов Q3', type: 'Report', date: 'Неделю назад', score: 78, trend: 'neutral', items: 2 },
];

export default function ProjectsPage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 md:py-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
                <h1 className="text-3xl font-syne font-bold text-slate-100 mb-2 tracking-tight">Ваши проекты</h1>
                <p className="text-slate-400 text-sm">История анализов, черновиков и Q&A симуляций.</p>
            </div>
            
            <div className="flex gap-3">
                <button className="bg-[var(--bg-surface)] border border-[var(--border-main)] text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--bg-surface-hover)] transition-colors">
                    Фильтры
                </button>
                <button className="btn-primary flex items-center gap-2 px-5 py-2">
                    <Folder size={16} /> Новый проект
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Project Card */}
            <div className="group border border-dashed border-[var(--border-light)] hover:border-blue-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-[var(--bg-surface-alt)] hover:bg-blue-500/5 transition-all min-h-[220px]">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border-main)] flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors mb-4 inline-flex">
                    <Folder size={20} />
                </div>
                <h3 className="text-slate-200 font-medium mb-1 group-hover:text-blue-400 transition-colors">Создать папку</h3>
                <p className="text-slate-500 text-xs text-balance">Сгруппируйте выступления по темам или целям</p>
            </div>

            {/* List of projects */}
            {mockProjects.map(project => (
                <div key={project.id} className="group bg-[var(--bg-surface)] border border-[var(--border-main)] hover:border-[var(--border-light)] rounded-2xl p-6 transition-all relative flex flex-col min-h-[220px]">
                    <div className="flex justify-between items-start mb-4">
                        <span className="px-2.5 py-1 rounded bg-[var(--bg-main)] border border-[var(--border-light)] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            {project.type}
                        </span>
                        <button className="text-slate-500 hover:text-slate-300">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>

                    <h3 className="text-lg font-syne font-semibold text-slate-200 mb-2 mt-auto group-hover:text-blue-400 transition-colors line-clamp-2">
                        {project.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-500 mb-6 mt-2">
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="opacity-70" /> {project.date}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Hash size={14} className="opacity-70" /> {project.items} файла
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="pt-4 border-t border-[var(--border-light)] flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Average Score</span>
                            <div className="flex items-center gap-1 font-mono text-sm">
                                <span className={project.score > 80 ? 'text-emerald-400' : 'text-yellow-400'}>{project.score}</span>
                                {project.trend === 'up' ? <TrendingUp size={12} className="text-emerald-500 mb-0.5" /> : project.trend === 'down' ? <Activity size={12} className="text-yellow-500 mb-0.5" /> : null}
                            </div>
                        </div>
                        
                        <button className="opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400 bg-blue-500/10 p-1.5 rounded-full">
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
