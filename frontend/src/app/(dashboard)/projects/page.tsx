
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderOpen, AlertCircle, Search, RefreshCw } from 'lucide-react';
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
        onError: (error: Error) => toast.error(error.message || 'Ошибка при создании'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/projects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Проект удалён');
        },
        onError: (error: Error) => toast.error(error.message || 'Ошибка при удалении'),
    });

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteProjectId(id);
    };

    const projects = data?.items ?? [];
    const filteredProjects = searchQuery
        ? projects.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : projects;

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 py-6 sm:py-8 lg:px-8 pb-20 md:pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div>
                    <p className="label-kicker mb-2">Подготовка</p>
                    <h1 className="font-syne text-[22px] sm:text-[26px] font-bold text-[var(--text-main)] tracking-tight">
                        Мои проекты
                    </h1>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary w-full sm:w-auto gap-2 flex-shrink-0 min-h-[44px]"
                >
                    <Plus size={15} />
                    Новый проект
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 sm:max-w-sm group">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--accent-primary)] transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[var(--radius-sm)] py-2.5 pl-9 pr-3 text-[13px] font-inter text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent-primary)]/50 focus:outline-none transition-colors min-h-[44px]"
                    />
                </div>
                {projects.length > 0 && (
                    <span className="label-kicker shrink-0">
                        {filteredProjects.length} из {projects.length}
                    </span>
                )}
            </div>

            {/* States */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="w-6 h-6 border-2 border-[var(--border-light)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    <p className="text-[13px] text-[var(--text-dim)] font-inter">Загрузка проектов...</p>
                </div>
            )}

            {isError && (
                <div className="bg-red-400/5 border border-red-400/20 rounded-[var(--radius-lg)] p-8 flex flex-col items-center gap-4 text-center">
                    <AlertCircle size={28} className="text-red-400" strokeWidth={1.5} />
                    <div>
                        <h3 className="font-syne text-[15px] font-semibold text-[var(--text-main)] mb-1">
                            Не удалось загрузить проекты
                        </h3>
                        <p className="text-[12px] text-[var(--text-dim)] font-inter">
                            Проверьте соединение и попробуйте снова
                        </p>
                    </div>
                    <button onClick={() => refetch()} className="btn-secondary gap-2 text-sm">
                        <RefreshCw size={13} /> Обновить
                    </button>
                </div>
            )}

            {!isLoading && !isError && projects.length === 0 && (
                <div className="bg-[var(--bg-card)] border border-[var(--border-main)] border-dashed rounded-[var(--radius-lg)] p-12 flex flex-col items-center gap-5 text-center">
                    <div className="w-14 h-14 rounded-[var(--radius-lg)] bg-[var(--bg-surface-alt)] border border-[var(--border-main)] flex items-center justify-center">
                        <FolderOpen size={24} className="text-[var(--text-dim)]" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="font-syne text-[17px] font-semibold text-[var(--text-main)] mb-2">
                            Пока нет проектов
                        </h3>
                        <p className="text-[13px] text-[var(--text-dim)] font-inter max-w-sm">
                            Создайте проект, чтобы объединить документы и тренировочные сессии в одном пространстве
                        </p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary gap-2">
                        <Plus size={14} /> Создать первый проект
                    </button>
                </div>
            )}

            {!isLoading && !isError && projects.length > 0 && (
                <>
                    {filteredProjects.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-[13px] text-[var(--text-muted)] font-inter">
                                Ничего не найдено по запросу &ldquo;{searchQuery}&rdquo;
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

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
