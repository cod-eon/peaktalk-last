
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-none shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold font-inter">Новый проект</h2>
              <button 
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-3 text-sm focus:border-neutral-900 outline-none transition-all"
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
                      className={`px-3 py-2 text-[10px] uppercase font-mono tracking-wider rounded-none border transition-all ${
                        eventType === type 
                          ? 'bg-[#171717] border-[#171717] text-white' 
                          : 'bg-neutral-50 border-neutral-200 text-neutral-400 hover:border-neutral-300'
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-3 text-sm focus:border-neutral-900 outline-none transition-all"
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-none p-3 text-sm focus:border-neutral-900 outline-none transition-all resize-none"
                />
              </div>
            </form>

            <div className="p-6 border-t border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-900 font-medium rounded-none px-4 py-2.5 transition-colors flex-1"
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                className="bg-[#171717] hover:bg-black text-white font-medium rounded-none px-4 py-2.5 transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
