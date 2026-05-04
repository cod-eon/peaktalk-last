'use client';

import React, { Suspense, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Zap,
  Bot,
  Check,
  Play,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useRouter } from 'next/navigation';

// ─── Types ──────────────────────────────────────────────────────────────────────

type Persona = {
  id: string;
  name: string;
  role: string;
  age: number | null;
  background: string;
  communication_style: string;
  catch_phrases: string[];
  focus_areas: string[];
  difficulty_hint: number;
  usage_count: number;
};

type PersonaFormData = {
  name: string;
  role: string;
  age: string;
  background: string;
  communication_style: string;
  catch_phrases: string;
  focus_areas: string;
  difficulty_hint: string;
};

const EMPTY_FORM: PersonaFormData = {
  name: '',
  role: '',
  age: '',
  background: '',
  communication_style: '',
  catch_phrases: '',
  focus_areas: '',
  difficulty_hint: '4',
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function parseCsv(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatList(items: string[]): string {
  return items.join(', ');
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Лёгкий',
  2: 'Ниже среднего',
  3: 'Средний',
  4: 'Выше среднего',
  5: 'Сложный',
};

function difficultyColor(d: number): string {
  if (d <= 2) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (d === 3) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

// ─── Form Component ─────────────────────────────────────────────────────────────

function PersonaForm({
  initial,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial: PersonaFormData;
  onSubmit: (data: PersonaFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<PersonaFormData>(initial);

  const handleChange = (field: keyof PersonaFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputClass =
    'w-full bg-white border border-[#D9D5CC] text-[#111827] text-sm rounded-none px-3 py-2 focus:outline-none focus:border-[#111827] transition-colors placeholder:text-neutral-300';
  const labelClass = 'block font-mono text-[10px] font-bold text-[#73706A] tracking-[0.18em] uppercase mb-1.5';

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-none border border-[#D9D5CC] p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-mono text-[10px] font-bold text-[#73706A] tracking-[0.18em] uppercase">
          {initial.name ? 'Редактирование' : 'Новая персона'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Закрыть"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className={labelClass}>
            Имя <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={128}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={inputClass}
            placeholder="Иван Петрович"
          />
        </div>

        {/* Role */}
        <div>
          <label className={labelClass}>
            Роль <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={64}
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className={inputClass}
            placeholder="CTO, инвестор, клиент"
          />
        </div>

        {/* Age */}
        <div>
          <label className={labelClass}>Возраст</label>
          <input
            type="number"
            min={18}
            max={99}
            value={form.age}
            onChange={(e) => handleChange('age', e.target.value)}
            className={inputClass}
            placeholder="45"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className={labelClass}>Сложность</label>
          <select
            value={form.difficulty_hint}
            onChange={(e) => handleChange('difficulty_hint', e.target.value)}
            className={inputClass}
          >
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d} — {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
            Этот уровень влияет на жёсткость вопросов, давление, терпимость к расплывчатым ответам и интенсивность стресс-тест сценария.
          </p>
        </div>

        {/* Background */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Предыстория</label>
          <textarea
            rows={3}
            value={form.background}
            onChange={(e) => handleChange('background', e.target.value)}
            className={inputClass + ' resize-none'}
            placeholder="Краткое описание бэкграунда персоны..."
          />
        </div>

        {/* Communication style */}
        <div className="sm:col-span-2">
          <label className={labelClass}>
            Стиль общения <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={form.communication_style}
            onChange={(e) => handleChange('communication_style', e.target.value)}
            className={inputClass + ' resize-none'}
            placeholder="Как персона общается — тон, подход, манера..."
          />
        </div>

        {/* Catch phrases */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Характерные фразы</label>
          <input
            type="text"
            value={form.catch_phrases}
            onChange={(e) => handleChange('catch_phrases', e.target.value)}
            className={inputClass}
            placeholder="Фраза 1, фраза 2, фраза 3"
          />
        </div>

        {/* Focus areas */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Фокус-зоны</label>
          <input
            type="text"
            value={form.focus_areas}
            onChange={(e) => handleChange('focus_areas', e.target.value)}
            className={inputClass}
            placeholder="Бюджет, сроки, риски"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-[#171717] hover:bg-black text-white rounded-none px-5 py-2.5 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          {initial.name ? 'Сохранить' : 'Создать'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-none border border-neutral-200 text-neutral-500 text-sm hover:border-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          Отмена
        </button>
      </div>
    </motion.form>
  );
}

// ─── Persona Card ───────────────────────────────────────────────────────────────

function PersonaCard({
  persona,
  onEdit,
  onDelete,
}: {
  persona: Persona;
  onEdit: (p: Persona) => void;
  onDelete: (p: Persona) => void;
}) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-none border border-[#D9D5CC] p-4 hover:border-[#111827] transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-none bg-[#FAF8F4] border border-[#D9D5CC] flex items-center justify-center shrink-0">
            <Bot size={18} className="text-[#111827]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#111827] truncate">{persona.name}</div>
            <div className="text-[12px] text-[#73706A]">{persona.role}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(persona)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 rounded-none transition-colors cursor-pointer"
            aria-label="Редактировать"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(persona)}
            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors cursor-pointer"
            aria-label="Удалить"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {persona.background && (
        <p className="text-[12px] text-neutral-500 leading-relaxed mb-3 line-clamp-2">
          {persona.background}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {persona.age && (
          <span className="inline-flex items-center text-[10px] font-mono text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-0.5 rounded-none">
            {persona.age} лет
          </span>
        )}
        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-none border ${difficultyColor(persona.difficulty_hint)}`}>
          {DIFFICULTY_LABELS[persona.difficulty_hint] || `Уровень ${persona.difficulty_hint}`}
        </span>
        {persona.usage_count > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-0.5 rounded-none">
            <Zap size={9} />
            {persona.usage_count} {persona.usage_count === 1 ? 'раз' : persona.usage_count < 5 ? 'раза' : 'раз'}
          </span>
        )}

        {/* Use in simulation button */}
        <button
          onClick={() => router.push(`/simulation?persona=${persona.id}`)}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#E8600A] bg-[#FEF3E8] border border-[#F9BD8E] px-2.5 py-1 rounded-none ml-auto hover:bg-[#FDDEC4] transition-colors cursor-pointer"
        >
          <Play size={9} />
          Использовать в симуляции
        </button>
      </div>

      {/* Tags */}
      {(persona.focus_areas.length > 0 || persona.catch_phrases.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-100">
          {persona.focus_areas.map((area) => (
            <span
              key={area}
              className="inline-flex text-[10px] text-neutral-600 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-none"
            >
              {area}
            </span>
          ))}
          {persona.catch_phrases.slice(0, 3).map((phrase) => (
            <span
              key={phrase}
              className="inline-flex text-[10px] text-neutral-500 bg-white border border-neutral-100 px-2 py-0.5 rounded-none italic"
            >
              &laquo;{phrase}&raquo;
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Loading ────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-neutral-400" />
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-4 text-neutral-400"
    >
      <Users size={36} className="opacity-30" />
      <div className="text-center">
        <p className="text-sm font-medium text-neutral-600 mb-1">Нет персон</p>
        <p className="text-xs text-neutral-400 mb-4">
          Создайте собственных персонажей для симуляций
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 bg-[#171717] hover:bg-black text-white rounded-none px-5 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
        >
          <Plus size={14} />
          Создать персону
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Content ───────────────────────────────────────────────────────────────

function PersonasContent() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [deletingPersona, setDeletingPersona] = useState<Persona | null>(null);

  // ── Fetch ──

  const { data: personas, isLoading } = useQuery<Persona[]>({
    queryKey: ['user-personas'],
    queryFn: () => api.get('/personas'),
    staleTime: 30_000,
    retry: false,
  });

  // ── Create ──

  const createMutation = useMutation({
    mutationFn: (form: PersonaFormData) => {
      const body: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        communication_style: form.communication_style,
      };
      if (form.age) body.age = parseInt(form.age, 10);
      if (form.background) body.background = form.background;
      if (form.catch_phrases) body.catch_phrases = parseCsv(form.catch_phrases);
      if (form.focus_areas) body.focus_areas = parseCsv(form.focus_areas);
      body.difficulty_hint = parseInt(form.difficulty_hint, 10);
      return api.post('/personas', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-personas'] });
      toast.success('Персона создана');
      setShowForm(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания');
    },
  });

  // ── Update ──

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: PersonaFormData }) => {
      const body: Record<string, unknown> = {};
      if (form.name) body.name = form.name;
      if (form.role) body.role = form.role;
      if (form.age) body.age = parseInt(form.age, 10);
      if (form.background !== undefined) body.background = form.background;
      if (form.communication_style) body.communication_style = form.communication_style;
      body.catch_phrases = parseCsv(form.catch_phrases);
      body.focus_areas = parseCsv(form.focus_areas);
      body.difficulty_hint = parseInt(form.difficulty_hint, 10);
      return api.patch(`/personas/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-personas'] });
      toast.success('Персона обновлена');
      setEditingPersona(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Ошибка обновления');
    },
  });

  // ── Delete ──

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/personas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-personas'] });
      toast.success('Персона удалена');
      setDeletingPersona(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления');
    },
  });

  // ── Handlers ──

  const handleCreateSubmit = useCallback(
    (form: PersonaFormData) => {
      createMutation.mutate(form);
    },
    [createMutation],
  );

  const handleEditSubmit = useCallback(
    (form: PersonaFormData) => {
      if (!editingPersona) return;
      updateMutation.mutate({ id: editingPersona.id, form });
    },
    [editingPersona, updateMutation],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingPersona) return;
    deleteMutation.mutate(deletingPersona.id);
  }, [deletingPersona, deleteMutation]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Render ──

  if (isLoading) return <LoadingState />;

  const isFormOpen = showForm || editingPersona !== null;

  return (
    <div className="pb-16 pt-6 sm:pt-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">Персоны</h1>
          <p className="text-sm font-medium text-[#73706A] mt-1 max-w-xl">
            Управляйте ролями оппонентов для стресс-тестов: инвестор, клиент, руководитель или стейкхолдер.
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-[#171717] hover:bg-black text-white rounded-none px-5 py-2.5 text-sm font-semibold cursor-pointer transition-colors self-start sm:self-auto"
          >
            <Plus size={14} />
            Создать персону
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* ─── Form ─── */}
        <AnimatePresence mode="wait">
          {editingPersona && (
            <PersonaForm
              key={`edit-${editingPersona.id}`}
              initial={{
                name: editingPersona.name,
                role: editingPersona.role,
                age: editingPersona.age !== null ? String(editingPersona.age) : '',
                background: editingPersona.background,
                communication_style: editingPersona.communication_style,
                catch_phrases: formatList(editingPersona.catch_phrases),
                focus_areas: formatList(editingPersona.focus_areas),
                difficulty_hint: String(editingPersona.difficulty_hint),
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingPersona(null)}
              isSubmitting={isSubmitting}
            />
          )}
          {showForm && !editingPersona && (
            <PersonaForm
              key="create-new"
              initial={EMPTY_FORM}
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowForm(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </AnimatePresence>

        {/* ─── Persona list ─── */}
        {!personas || personas.length === 0 ? (
          <EmptyState onCreate={() => setShowForm(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((p) => (
              <PersonaCard
                key={p.id}
                persona={p}
                onEdit={setEditingPersona}
                onDelete={setDeletingPersona}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Delete confirmation ─── */}
      <ConfirmDialog
        isOpen={deletingPersona !== null}
        title="Удалить персону?"
        message={`Персона «${deletingPersona?.name ?? ''}» будет удалена безвозвратно. Все настройки будут потеряны.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPersona(null)}
      />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function PersonasPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PersonasContent />
    </Suspense>
  );
}
