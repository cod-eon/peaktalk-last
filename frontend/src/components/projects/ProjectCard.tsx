
import React from 'react';
import Link from 'next/link';
import { format, differenceInDays, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FileText, Zap, Trash2, Calendar } from 'lucide-react';
import { Project } from '@/lib/types/projects';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '@/lib/constants/projects';
import { ReadinessCircle } from './ReadinessCircle';

interface ProjectCardProps {
    project: Project;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

function getDateStatus(eventDate: string | null): { label: string; className: string } | null {
    if (!eventDate) return null;
    const date = new Date(eventDate);
    if (isPast(date)) {
        return { label: format(date, 'd MMM', { locale: ru }), className: 'text-[var(--text-dim)] line-through' };
    }
    const days = differenceInDays(date, new Date());
    if (days < 3) return { label: `через ${days} дн.`, className: 'text-red-400 font-semibold' };
    if (days < 7) return { label: `${days} дн.`, className: 'text-[var(--color-warning)]' };
    return { label: format(date, 'd MMM', { locale: ru }), className: 'text-emerald-400' };
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
    const Icon = EVENT_TYPE_ICONS[project.event_type];
    const dateStatus = getDateStatus(project.event_date);

    return (
        <Link
            href={`/projects/${project.id}`}
            className="group bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-3.5 cursor-pointer transition-all duration-150 relative hover:shadow-[var(--shadow-elevated)]"
        >
            {/* Header row */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)] flex items-center justify-center">
                        <Icon size={15} className="text-[var(--accent-primary)]" />
                    </div>
                    <span className="label-kicker">{EVENT_TYPE_LABELS[project.event_type]}</span>
                </div>

                <div className="flex items-center gap-2">
                    {project.readiness_score !== null && (
                        <ReadinessCircle score={project.readiness_score} size={28} />
                    )}
                    <button
                        onClick={(e) => onDelete(project.id, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-dim)] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all duration-150"
                        title="Удалить проект"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Title */}
            <h3 className="font-syne text-[15px] font-semibold text-[var(--text-main)] leading-snug tracking-tight line-clamp-2">
                {project.title}
            </h3>

            {/* Date */}
            {dateStatus && (
                <div className="flex items-center gap-1.5">
                    <Calendar size={11} className="text-[var(--text-dim)]" />
                    <span className={`text-[11px] font-mono ${dateStatus.className}`}>
                        {dateStatus.label}
                    </span>
                </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-[var(--border-main)] flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
                    <FileText size={12} />
                    <span className="text-[11px] font-mono">{project.document_count}</span>
                    <span className="text-[10px] text-[var(--text-dim)] font-inter">документов</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
                    <Zap size={12} />
                    <span className="text-[11px] font-mono">{project.simulation_count}</span>
                    <span className="text-[10px] text-[var(--text-dim)] font-inter">сессий</span>
                </div>
            </div>
        </Link>
    );
};
