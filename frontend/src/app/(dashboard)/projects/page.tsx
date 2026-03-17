
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderOpen, Activity, AlertCircle, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Project } from '@/lib/types/projects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<{ items: Project[] }>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  const createMutation = useMutation({
    mutationFn: (newProject: Record<string, unknown>) => api.post('/projects', newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      toast.success('Проект создан');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка при создании проекта');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Проект удален');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка при удалении проекта');
    }
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteProjectId(id);
  };

  const projects = data?.items || [];
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="container-custom py-12 md:py-20 flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="editorial-kicker text-[var(--accent-blue)]">Управление подготовкой</div>
            <h1 className="text-4xl md:text-5xl font-syne font-bold tracking-tight">Мои проекты</h1>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-full md:w-auto shadow-[0_0_20px_var(--accent-blue-glow)]"
          >
            <Plus size={16} className="mr-2" />
            Создать проект
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:max-w-sm group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent-blue)] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-[var(--accent-blue)] outline-none transition-all"
            />
          </div>
          <div className="hidden md:block h-px flex-1 bg-white/5" />
          <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-widest">
            Всего: {projects.length}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Activity className="animate-spin text-[var(--accent-blue)]" size={32} />
            <p className="font-mono text-sm text-[var(--text-dim)]">Синхронизация проектов...</p>
          </div>
        ) : isError ? (
          <div className="panel p-12 flex flex-col items-center justify-center text-center gap-4 bg-red-400/5 border-red-400/20">
            <AlertCircle className="text-red-400" size={40} />
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold">Не удалось загрузить проекты</h3>
              <p className="text-sm text-[var(--text-dim)] max-w-sm">
                Проверьте соединение с интернетом или попробуйте обновить страницу.
              </p>
            </div>
            <button onClick={() => refetch()} className="btn-secondary mt-2">
              Обновить
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="panel p-16 flex flex-col items-center justify-center text-center gap-6 border-dashed">
            <div className="p-5 rounded-3xl bg-white/5 text-[var(--text-dim)]">
              <FolderOpen size={48} strokeWidth={1} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold font-syne">У вас пока нет проектов</h3>
              <p className="text-sm text-[var(--text-dim)] max-w-sm mx-auto">
                Создайте проект, чтобы объединить документы, заметки и тренировочные сессии в одном рабочем пространстве.
              </p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">
              <Plus size={16} className="mr-2" />
              Начать первый проект
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteProjectId !== null}
        title="Удалить проект?"
        message="Все связанные данные будут удалены. Это действие невозможно отменить."
        confirmLabel="Удалить"
        onConfirm={() => {
          if (deleteProjectId) deleteMutation.mutate(deleteProjectId);
          setDeleteProjectId(null);
        }}
        onCancel={() => setDeleteProjectId(null)}
      />
    </div>
  );
}
