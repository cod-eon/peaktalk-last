
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { EventType } from '@/lib/types/projects';
import { EVENT_TYPE_LABELS } from '@/lib/constants/projects';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; event_type: EventType; event_date: string | null; notes: string }) => void;
  isSubmitting?: boolean;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  isSubmitting = false
}) => {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('interview');
  const [eventDate, setEventDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title,
      event_type: eventType,
      event_date: eventDate || null,
      notes
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[var(--z-overlay-panel)] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--bg-main)]/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-main)]">
              <h2 className="text-xl font-bold font-syne">Новый проект</h2>
              <button 
                onClick={onClose}
                className="p-2 text-[var(--text-dim)] hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
              {/* Title */}
              <div className="flex flex-col gap-2">
                <label className="editorial-kicker">Название проекта *</label>
                <input
                  autoFocus
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Собеседование в Google"
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3 text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
                />
              </div>

              {/* Event Type */}
              <div className="flex flex-col gap-2">
                <label className="editorial-kicker">Тип события</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEventType(type)}
                      className={`px-3 py-2 text-[10px] uppercase font-mono tracking-wider rounded-lg border transition-all ${
                        eventType === type 
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white' 
                          : 'bg-white/5 border-[var(--border-main)] text-[var(--text-dim)] hover:border-[var(--border-light)]'
                      }`}
                    >
                      {EVENT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-2">
                <label className="editorial-kicker flex items-center gap-2">
                  <Calendar size={12} /> Дата события (опционально)
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3 text-sm focus:border-[var(--accent-primary)] outline-none transition-all [color-scheme:dark]"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-2">
                <label className="editorial-kicker">Заметки</label>
                <textarea
                  maxLength={1000}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Опишите ваши цели подготовки..."
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-xl p-3 text-sm focus:border-[var(--accent-primary)] outline-none transition-all resize-none"
                />
              </div>
            </form>

            <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-surface)]/50 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Создание...' : 'Создать проект'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
