
import React from 'react';
import Link from 'next/link';
import { format, differenceInDays, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FileText, Bot, Trash2 } from 'lucide-react';
import { Project } from '@/lib/types/projects';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '@/lib/constants/projects';
import { ReadinessCircle } from './ReadinessCircle';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const Icon = EVENT_TYPE_ICONS[project.event_type];

  const getDateBadgeColor = () => {
    if (!project.event_date) return '';
    const date = new Date(project.event_date);
    if (isPast(date)) return 'text-slate-500 line-through';
    
    const daysLeft = differenceInDays(date, new Date());
    if (daysLeft < 7) return 'text-red-400 font-bold';
    if (daysLeft <= 14) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <Link 
      href={`/projects/${project.id}`}
      className="panel hover:bg-[var(--bg-surface-hover)] transition-all duration-200 p-5 flex flex-col gap-4 group cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-xl bg-white/5 text-[var(--accent-blue)] group-hover:bg-[var(--accent-blue)] group-hover:text-white transition-colors duration-200">
          <Icon size={20} />
        </div>
        
        <div className="flex items-center gap-3">
          {project.readiness_score !== null && (
            <ReadinessCircle score={project.readiness_score} />
          )}
          <button 
            onClick={(e) => onDelete(project.id, e)}
            className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="editorial-kicker text-[8px] px-1.5 py-0.5 rounded-sm bg-white/5">
            {EVENT_TYPE_LABELS[project.event_type]}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-tight truncate">
          {project.title}
        </h3>
        {project.event_date && (
          <p className={`text-[11px] font-mono uppercase tracking-wider ${getDateBadgeColor()}`}>
            {format(new Date(project.event_date), 'dd MMMM yyyy', { locale: ru })}
          </p>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-dim)] font-mono">
          <FileText size={14} className="text-[var(--accent-blue)]" />
          <span>{project.document_count}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-dim)] font-mono">
          <Bot size={14} className="text-[var(--accent-blue)]" />
          <span>{project.simulation_count}</span>
        </div>
      </div>
    </Link>
  );
};
