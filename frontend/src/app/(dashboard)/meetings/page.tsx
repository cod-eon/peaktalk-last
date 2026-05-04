"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  CalendarDays,
  Clock,
  Edit3,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Zap,
  Link2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

type MeetingType =
  | "budget_defense"
  | "qbr"
  | "pitch"
  | "client_meeting"
  | "roadmap_review"
  | "other";

type MeetingStatus = "upcoming" | "prepared" | "completed" | "cancelled";

type Meeting = {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  scenario_id: string | null;
  simulation_session_id?: string | null;
  has_active_preparation?: boolean;
  created_at: string;
  updated_at: string;
};

type MeetingFormData = {
  title: string;
  description: string;
  meeting_date: string;
  meeting_type: MeetingType;
  scenario_id: string;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  budget_defense: "Защита бюджета",
  qbr: "QBR",
  pitch: "Питч",
  client_meeting: "Встреча с клиентом",
  roadmap_review: "Обзор дорожной карты",
  other: "Другое",
};

const MEETING_STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; cls: string }
> = {
  upcoming: {
    label: "Предстоит",
    cls: "bg-[#FEF3E8] text-[#B04A08] border border-[#F9BD8E]",
  },
  prepared: {
    label: "Подготовка идет",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  completed: {
    label: "Завершена",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  cancelled: {
    label: "Отменена",
    cls: "bg-neutral-100 text-neutral-500 border border-neutral-200",
  },
};

const EMPTY_FORM: MeetingFormData = {
  title: "",
  description: "",
  meeting_date: "",
  meeting_type: "budget_defense",
  scenario_id: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── MeetingForm Modal ─────────────────────────────────────────────────────────

function MeetingFormModal({
  initial,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  initial: MeetingFormData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingFormData) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<MeetingFormData>(initial ?? EMPTY_FORM);
  const isEdit = initial !== null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.meeting_date) return;
    onSubmit({
      ...form,
      scenario_id: form.scenario_id.trim() || "",
    });
  };

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setForm(initial ?? EMPTY_FORM);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg bg-white border border-neutral-200 z-50 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="font-inter text-[15px] font-semibold text-neutral-900">
            {isEdit ? "Редактировать встречу" : "Новая встреча"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase font-mono">
              Название
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Защита бюджета Q3"
              className="w-full px-3 py-2.5 border border-neutral-200 text-sm text-neutral-900 font-inter placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors bg-white"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase font-mono">
              Описание
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Краткое описание повестки и целей встречи"
              className="w-full px-3 py-2.5 border border-neutral-200 text-sm text-neutral-900 font-inter placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors bg-white resize-none"
            />
          </div>

          {/* Date/time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase font-mono">
              Дата и время
            </label>
            <input
              type="datetime-local"
              name="meeting_date"
              value={form.meeting_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-neutral-200 text-sm text-neutral-900 font-inter placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors bg-white font-mono"
            />
          </div>

          {/* Meeting type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase font-mono">
              Тип встречи
            </label>
            <select
              name="meeting_type"
              value={form.meeting_type}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-neutral-200 text-sm text-neutral-900 font-inter focus:outline-none focus:border-neutral-400 transition-colors bg-white cursor-pointer"
            >
              {(
                Object.entries(MEETING_TYPE_LABELS) as [MeetingType, string][]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Scenario link */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase font-mono flex items-center gap-1.5">
              <Link2 size={10} />
              Привязка к сценарию
              <span className="normal-case tracking-normal font-normal text-neutral-400">
                (необязательно)
              </span>
            </label>
            <input
              type="text"
              name="scenario_id"
              value={form.scenario_id}
              onChange={handleChange}
              placeholder="ID сценария"
              className="w-full px-3 py-2.5 border border-neutral-200 text-sm text-neutral-900 font-inter placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 transition-colors bg-white font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-neutral-500 border border-neutral-200 hover:border-neutral-400 hover:text-neutral-700 transition-colors font-inter cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!form.title.trim() || !form.meeting_date || isSubmitting}
              className="inline-flex items-center gap-2 bg-[#171717] hover:bg-black text-white text-sm font-semibold px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              {isEdit ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

// ── MeetingCard ────────────────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  onStartSimulation,
}: {
  meeting: Meeting;
  onEdit: (m: Meeting) => void;
  onDelete: (id: string) => void;
  onStartSimulation: (id: string) => void;
}) {
  const statusCfg = MEETING_STATUS_CONFIG[meeting.status];
  const hasActivePreparation = Boolean(meeting.has_active_preparation);
  const days = daysUntil(meeting.meeting_date);
  const isToday = days === 0;
  let urgencyLabel: string | null = null;
  let urgencyCls = "";
  if (meeting.status === "upcoming") {
    if (isToday) {
      urgencyLabel = "Сегодня";
      urgencyCls = "text-amber-600 bg-amber-50 border border-amber-200";
    } else if (days === 1) {
      urgencyLabel = "Завтра";
      urgencyCls = "text-amber-600 bg-amber-50 border border-amber-200";
    } else if (days > 0 && days <= 3) {
      urgencyLabel = `Через ${days} дн.`;
      urgencyCls = "text-[#D4570A] bg-[#FEF3E8] border border-[#F9BD8E]";
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-[#D9D5CC] p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-[#111827] transition-colors group"
    >
      {/* Date column */}
      <div className="flex sm:flex-col items-center sm:items-start gap-1.5 sm:w-[72px] shrink-0">
        <div className="w-10 h-10 flex items-center justify-center bg-[#FAF8F4] border border-[#D9D5CC]">
          <CalendarDays size={18} className="text-[#73706A]" />
        </div>
        <div className="sm:hidden flex flex-col">
          <span className="text-[12px] font-inter text-neutral-900 font-medium">
            {formatDate(meeting.meeting_date)}
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {formatTime(meeting.meeting_date)}
          </span>
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-[12px] font-inter text-neutral-900 font-medium leading-tight">
            {new Date(meeting.meeting_date).getDate()}{" "}
            {new Date(meeting.meeting_date)
              .toLocaleDateString("ru-RU", { month: "short" })
              .replace(".", "")}
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {formatTime(meeting.meeting_date)}
          </span>
        </div>
      </div>

      {/* Info column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-inter text-[14px] font-bold text-[#111827] truncate">
            {meeting.title}
          </h3>
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium ${statusCfg.cls}`}
          >
            {statusCfg.label}
          </span>
          {urgencyLabel && (
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold ${urgencyCls}`}
            >
              {urgencyLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[12px] text-neutral-400">
          <span className="font-mono">
            {MEETING_TYPE_LABELS[meeting.meeting_type]}
          </span>
          <span className="hidden sm:inline font-mono">
            {formatDate(meeting.meeting_date)}
          </span>
          {meeting.scenario_id && (
            <span className="inline-flex items-center gap-1 font-mono text-neutral-400">
              <Link2 size={10} />
              Сценарий привязан
            </span>
          )}
        </div>

        {meeting.description && (
          <p className="text-[12px] text-neutral-500 font-inter mt-1.5 line-clamp-2 leading-relaxed">
            {meeting.description}
          </p>
        )}
      </div>

      {/* Actions column */}
      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
        {(meeting.status === "upcoming" || meeting.status === "prepared") && (
          <button
            onClick={() => onStartSimulation(meeting.id)}
            className="inline-flex items-center gap-1.5 bg-[#111827] hover:bg-black text-white text-[12px] font-semibold px-4 py-2 transition-colors cursor-pointer"
          >
            <Zap size={12} />
            <span className="hidden sm:inline">{hasActivePreparation ? "Продолжить подготовку" : "Подготовиться"}</span>
            <span className="sm:hidden">{hasActivePreparation ? "Продолжить" : "Подготовиться"}</span>
          </button>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(meeting)}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer border border-transparent hover:border-neutral-200"
            title="Редактировать"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(meeting.id)}
            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200"
            title="Удалить"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: meetings,
    isLoading,
    isError,
  } = useQuery<Meeting[]>({
    queryKey: ["meetings"],
    queryFn: () => api.get("/meetings"),
    staleTime: 30_000,
    retry: false,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: MeetingFormData) => api.post("/meetings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Встреча создана");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MeetingFormData }) =>
      api.patch(`/meetings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Встреча обновлена");
      closeModal();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/meetings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Встреча удалена");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openCreate = useCallback(() => {
    setEditingMeeting(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((meeting: Meeting) => {
    setEditingMeeting(meeting);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingMeeting(null);
  }, []);

  const handleSubmit = useCallback(
    (data: MeetingFormData) => {
      if (editingMeeting) {
        updateMutation.mutate({ id: editingMeeting.id, data });
      } else {
        createMutation.mutate(data);
      }
    },
    [editingMeeting, updateMutation, createMutation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm("Удалить эту встречу?")) return;
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const handleStartSimulation = useCallback((id: string) => {
    router.push(`/simulation?meeting=${id}`);
  }, [router]);

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  // ── Sort: upcoming first, then by date ────────────────────────────────────

  const sortedMeetings = React.useMemo(() => {
    if (!meetings) return [];
    return [...meetings].sort((a, b) => {
      // Upcoming first, then completed, then cancelled
      const statusOrder: Record<MeetingStatus, number> = {
        upcoming: 0,
        prepared: 1,
        completed: 2,
        cancelled: 3,
      };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      // Within same status, sort by date ascending
      return new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime();
    });
  }, [meetings]);

  const upcomingCount = meetings?.filter((m) => m.status === "upcoming" || m.status === "prepared").length ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="pb-16 pt-6 sm:pt-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
            Встречи
          </h1>
          <p className="text-sm font-medium text-[#73706A] mt-1 max-w-xl">
            Ближайшие разговоры, дедлайны и подготовка к защите решений.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#171717] hover:bg-black text-white text-sm font-semibold px-5 py-2.5 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={15} />
          Добавить встречу
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-neutral-400" />
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertCircle size={32} className="text-red-400" strokeWidth={1.5} />
          <p className="text-sm text-neutral-500 font-inter">
            Не удалось загрузить встречи
          </p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["meetings"] })
            }
            className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && (
        <>
          {/* Summary strip */}
          {meetings && meetings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-6 mb-6 px-4 py-3 bg-white border border-[#D9D5CC]"
            >
              <div className="flex items-center gap-2 text-[12px] text-neutral-600 font-inter">
                <CalendarDays size={13} className="text-neutral-400" />
                <span>
                  Всего:{" "}
                  <span className="font-semibold text-neutral-900">
                    {meetings.length}
                  </span>
                </span>
              </div>
              {upcomingCount > 0 && (
                <div className="flex items-center gap-2 text-[12px] text-neutral-600 font-inter">
                  <Clock size={13} className="text-[#F29555]" />
                  <span>
                    Предстоит:{" "}
                    <span className="font-semibold text-[#D4570A]">
                      {upcomingCount}
                    </span>
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Meeting list */}
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {sortedMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStartSimulation={handleStartSimulation}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {meetings && meetings.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            >
              <div className="w-14 h-14 rounded-none bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                <CalendarDays size={24} className="text-neutral-300" />
              </div>
              <div>
                <p className="font-inter text-[15px] font-semibold text-neutral-900 mb-1">
                  Нет запланированных встреч
                </p>
                <p className="text-[13px] text-neutral-400 font-inter max-w-xs leading-relaxed">
                  Добавьте предстоящую встречу, чтобы подготовиться к ней с
                  помощью ИИ-симуляции
                </p>
              </div>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 bg-[#171717] hover:bg-black text-white text-sm font-semibold px-5 py-2.5 transition-colors cursor-pointer mt-2"
              >
                <Plus size={14} />
                Добавить встречу
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* Modal */}
      <MeetingFormModal
        initial={
          editingMeeting
            ? {
                title: editingMeeting.title,
                description: editingMeeting.description ?? "",
                meeting_date: formatDatetimeLocal(editingMeeting.meeting_date),
                meeting_type: editingMeeting.meeting_type,
                scenario_id: editingMeeting.scenario_id ?? "",
              }
            : null
        }
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
