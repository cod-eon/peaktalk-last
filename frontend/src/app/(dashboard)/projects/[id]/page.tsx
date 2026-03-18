
"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Bot, 
  StickyNote, 
  Plus, 
  Settings2,
  ExternalLink,
  ChevronRight,
  Activity,
  AlertCircle,
  Unlink,
  CheckCircle2,
  Clock,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/lib/api';
import { ProjectDetail, LinkedDocument, LinkedSimulation } from '@/lib/types/projects';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, PERSONA_ICONS, PERSONA_LABELS } from '@/lib/constants/projects';
import { ReadinessCircle } from '@/components/projects/ReadinessCircle';
import { toast } from 'sonner';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'simulations'>('overview');

  const { data: project, isLoading, isError } = useQuery<ProjectDetail>({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`),
    enabled: !!id,
  });

  const unlinkDocumentMutation = useMutation({
    mutationFn: (docId: string) => api.post(`/projects/${id}/documents/unlink`, { document_id: docId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Документ отвязан от проекта');
    }
  });

  const unlinkSimulationMutation = useMutation({
    mutationFn: (simId: string) => api.post(`/projects/${id}/simulations/unlink`, { simulation_id: simId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Сессия отвязана от проекта');
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Activity className="animate-spin text-[var(--accent-primary)]" size={32} />
        <p className="font-mono text-sm text-[var(--text-dim)]">Загрузка проекта...</p>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="container-custom py-20 flex flex-col items-center text-center gap-6">
        <div className="p-5 rounded-full bg-red-400/10 text-red-400">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold font-syne">Проект не найден</h2>
        <button onClick={() => router.push('/projects')} className="btn-secondary">
          Вернуться к списку
        </button>
      </div>
    );
  }

  const Icon = EVENT_TYPE_ICONS[project.event_type] || EVENT_TYPE_ICONS.other;

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="container-custom py-10 md:py-16">
        
        {/* Breadcrumbs & Back */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push('/projects')}
            className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-[var(--text-dim)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--text-dim)]">
             <span>Проекты</span>
             <ChevronRight size={14} />
             <span className="text-white max-w-[200px] truncate">{project.title}</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row gap-8 items-start mb-12">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[var(--accent-primary)] text-white">
                <Icon size={24} />
              </div>
              <div className="editorial-kicker text-[var(--accent-primary)]">
                {EVENT_TYPE_LABELS[project.event_type]}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tight">
              {project.title}
            </h1>
            
            {project.event_date && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-dim)]">
                <Calendar size={16} className="text-[var(--accent-primary)]" />
                <span>Целевая дата: {format(new Date(project.event_date), 'dd MMMM yyyy (EEEE)', { locale: ru })}</span>
              </div>
            )}
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4">
             <div className="panel flex items-center gap-5 p-4 pr-6">
                <ReadinessCircle score={project.readiness_score} size={56} strokeWidth={4} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)]">Готовность</span>
                  <span className="text-xl font-bold font-syne">
                    {project.readiness_score ? `${Math.round(project.readiness_score * 100)}%` : '—'}
                  </span>
                </div>
             </div>
             
             <button className="btn-secondary w-full sm:w-auto py-4">
                <Settings2 size={16} className="mr-2" />
                Настроить
             </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Details & Sections */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            
            {/* Tabs */}
            <div className="flex border-b border-white/5 overflow-x-auto">
               {[
                 { id: 'overview', label: 'Обзор', icon: StickyNote },
                 { id: 'documents', label: 'Документы', icon: FileText, count: project.document_count },
                 { id: 'simulations', label: 'Тренировки', icon: Bot, count: project.simulation_count },
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as 'overview' | 'documents' | 'simulations')}
                   className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                     activeTab === tab.id 
                      ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' 
                      : 'text-[var(--text-dim)] hover:text-white'
                   }`}
                 >
                   <tab.icon size={16} />
                   {tab.label}
                   {tab.count !== undefined && (
                     <span className="text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded ml-1">
                        {tab.count}
                     </span>
                   )}
                 </button>
               ))}
            </div>

            <div className="flex flex-col gap-10">
              {activeTab === 'overview' && (
                <>
                  {/* Notes */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold font-syne flex items-center gap-2">
                        <StickyNote size={20} className="text-[var(--accent-primary)]" />
                        Заметки проекта
                      </h3>
                    </div>
                    <div className="panel p-6 min-h-[120px] bg-[var(--bg-surface)]/30 backdrop-blur-sm">
                      {project.notes ? (
                        <p className="text-sm leading-relaxed text-[var(--text-muted)] whitespace-pre-wrap">
                          {project.notes}
                        </p>
                      ) : (
                        <p className="text-sm italic text-[var(--text-dim)]">
                          Нет дополнительных заметок. Добавьте информацию о целях подготовки, аудитории или ключевых тезисах.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="panel p-5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <FileText size={18} className="text-[var(--accent-primary)]" />
                        <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase">Документы</span>
                      </div>
                      <div className="text-2xl font-bold font-syne">{project.document_count}</div>
                    </div>
                    <div className="panel p-5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Bot size={18} className="text-[var(--accent-primary)]" />
                        <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase">Симуляции</span>
                      </div>
                      <div className="text-2xl font-bold font-syne">{project.simulation_count}</div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'documents' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-syne">Документы</h3>
                    <button className="btn-secondary py-2 px-4 text-xs">
                      <Plus size={14} className="mr-2" /> Привязать
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {project.documents.map((doc) => (
                      <div key={doc.id} className="panel p-4 flex items-center justify-between hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-white/5 text-[var(--accent-primary)]">
                            <FileText size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{doc.name}</span>
                            <span className="text-[10px] uppercase font-mono text-[var(--text-dim)]">{doc.file_type} • {format(new Date(doc.created_at), 'dd.MM.yy')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                            className="p-2 text-[var(--text-dim)] hover:text-white transition-colors"
                            title="Открыть"
                           >
                             <ExternalLink size={16} />
                           </button>
                           <button
                            onClick={() => unlinkDocumentMutation.mutate(doc.id)}
                            className="p-2 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                            title="Отвязать"
                           >
                             <Unlink size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                    {project.documents.length === 0 && (
                      <div className="p-12 text-center text-[var(--text-dim)] border border-dashed border-[var(--border-main)] rounded-2xl">
                        Нет привязанных документов
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'simulations' && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold font-syne">Тренировочные сессии</h3>
                    <button className="btn-secondary py-2 px-4 text-xs">
                      <Plus size={14} className="mr-2" /> Привязать
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {project.simulations.map((sim) => {
                      const SimIcon = PERSONA_ICONS[sim.persona_config.role] || PERSONA_ICONS.default;
                      const personaLabel = PERSONA_LABELS[sim.persona_config.role] || sim.persona_config.role;
                      
                      return (
                        <div key={sim.id} className="panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/5 text-[var(--accent-primary)]">
                              <SimIcon size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{personaLabel}</span>
                              <div className="flex items-center gap-2 text-[10px] uppercase font-mono text-[var(--text-dim)]">
                                <span>{sim.persona_config.industry}</span>
                                <span>•</span>
                                <span>Сложность {sim.persona_config.difficulty}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            <div className="flex flex-col items-end">
                               <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)] mb-1">Счёт</span>
                               <div className={`text-sm font-bold font-mono ${sim.avg_score && sim.avg_score >= 0.7 ? 'text-green-400' : 'text-yellow-400'}`}>
                                  {sim.avg_score ? `${Math.round(sim.avg_score * 10)}/10` : '—'}
                               </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => router.push(`/simulation/${sim.id}${sim.status === 'completed' ? '/report' : ''}`)}
                                className="btn-secondary py-2 px-3 text-[10px] uppercase tracking-wider"
                              >
                                Перейти
                              </button>
                              <button 
                                onClick={() => unlinkSimulationMutation.mutate(sim.id)}
                                className="p-2 text-[var(--text-dim)] hover:text-red-400 transition-colors"
                              >
                                <Unlink size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {project.simulations.length === 0 && (
                      <div className="p-12 text-center text-[var(--text-dim)] border border-dashed border-[var(--border-main)] rounded-2xl">
                        Нет привязанных тренировок
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions & Quick Guide */}
          <div className="flex flex-col gap-6">
            <div className="panel p-6 bg-gradient-to-br from-[var(--accent-primary-bg)] to-transparent border-[var(--accent-primary-glow)]">
              <h4 className="font-syne font-bold mb-2">Быстрые действия</h4>
              <p className="text-xs text-[var(--text-dim)] mb-6">Используйте проект как единый хаб для подготовки</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => router.push(`/upload?project_id=${id}`)}
                  className="btn-primary w-full justify-start text-xs py-3"
                >
                  <Plus size={14} className="mr-2" /> Добавить документ
                </button>
                <button 
                  onClick={() => router.push(`/simulation?project_id=${id}`)}
                  className="btn-secondary w-full justify-start text-xs py-3 bg-white/5"
                >
                  <Plus size={14} className="mr-2" /> Начать тренировку
                </button>
              </div>
            </div>

            <div className="panel p-6">
              <h4 className="font-syne font-bold mb-4 flex items-center gap-2">
                 <Activity size={16} className="text-[var(--accent-primary)]" />
                 Совет PeakTalk
              </h4>
              <ul className="flex flex-col gap-4">
                 {[
                   "Привяжите PDF с вашим выступлением для точного анализа ИИ.",
                   "Проведите минимум 3 тренировки с разными персонажами.",
                   "Используйте 'Скептика', чтобы проверить аргументацию."
                 ].map((tip, i) => (
                   <li key={i} className="flex gap-3 text-xs leading-relaxed text-[var(--text-muted)]">
                      <span className="text-[var(--accent-primary)] font-mono shrink-0">0{i+1}.</span>
                      {tip}
                   </li>
                 ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
