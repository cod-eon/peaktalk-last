import {
  Bot, Users, Briefcase, TrendingUp, TrendingDown,
  MessageSquare, Zap, Search, Mic, ArrowRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SessionItem = {
  id: string;
  persona_config: { role: string; industry: string; difficulty: number };
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  message_count: number;
  avg_score: number | null;
  document_title: string | null;
};

export const PERSONA_LABELS: Record<string, string> = {
  supervisor: 'Научный руководитель',
  reviewer: 'Придирчивый рецензент',
  peer: 'Однокурсник-скептик',
  tech_lead: 'Тимлид / Principal Engineer',
  hr: 'HR-менеджер',
  senior_dev: 'Старший разработчик',
  investor: 'Венчурный инвестор',
  partner: 'Корпоративный партнёр',
  customer: 'Потенциальный клиент',
  demanding_client: 'Требовательный клиент',
  procurement: 'Менеджер по закупкам',
  board: 'Совет директоров',
  subordinate: 'Скептичный подчинённый',
  journalist: 'Журналист',
  audience: 'Общая аудитория',
  moderator: 'Модератор дискуссии',
  listener: 'Скептик из зала',
};

export type RoleVisual = { icon: LucideIcon; iconColor: string; iconBg: string };

export const ROLE_VISUALS: Record<string, RoleVisual> = {
  investor:   { icon: TrendingUp,    iconColor: 'text-amber-600',  iconBg: 'bg-amber-50' },
  partner:    { icon: Users,         iconColor: 'text-blue-600',   iconBg: 'bg-blue-50' },
  customer:   { icon: MessageSquare, iconColor: 'text-green-600',  iconBg: 'bg-green-50' },
  demanding_client: { icon: MessageSquare, iconColor: 'text-red-600', iconBg: 'bg-red-50' },
  procurement:      { icon: Briefcase,     iconColor: 'text-indigo-600', iconBg: 'bg-indigo-50' },
  tech_lead:  { icon: Briefcase,     iconColor: 'text-blue-600',   iconBg: 'bg-blue-50' },
  hr:         { icon: Users,         iconColor: 'text-pink-600',   iconBg: 'bg-pink-50' },
  senior_dev: { icon: Zap,           iconColor: 'text-cyan-600',   iconBg: 'bg-cyan-50' },
  supervisor: { icon: Bot,           iconColor: 'text-purple-600', iconBg: 'bg-purple-50' },
  reviewer:   { icon: Search,        iconColor: 'text-red-500',    iconBg: 'bg-red-50' },
  peer:       { icon: Users,         iconColor: 'text-teal-600',   iconBg: 'bg-teal-50' },
  board:      { icon: Briefcase,     iconColor: 'text-slate-600',  iconBg: 'bg-slate-100' },
  subordinate:{ icon: Users,         iconColor: 'text-amber-500',  iconBg: 'bg-amber-50' },
  journalist: { icon: Mic,           iconColor: 'text-neutral-600', iconBg: 'bg-neutral-100' },
  audience:   { icon: Mic,           iconColor: 'text-violet-600', iconBg: 'bg-violet-50' },
  moderator:  { icon: MessageSquare, iconColor: 'text-stone-600',  iconBg: 'bg-stone-100' },
  listener:   { icon: MessageSquare, iconColor: 'text-rose-500',   iconBg: 'bg-rose-50' },
};

export const DEFAULT_VISUAL: RoleVisual = { icon: Bot, iconColor: 'text-neutral-400', iconBg: 'bg-neutral-50' };

export const SHORT_PERSONA: Record<string, string> = {
  investor: 'Инвестор', partner: 'Партнёр', customer: 'Клиент',
  demanding_client: 'Сл. клиент', procurement: 'Закупки',
  tech_lead: 'Тимлид', hr: 'HR', senior_dev: 'Dev',
  supervisor: 'Науч. рук.', reviewer: 'Рецензент', peer: 'Коллега',
  board: 'Совет', subordinate: 'Подчин.', journalist: 'Журналист',
  audience: 'Аудитория', moderator: 'Модератор', listener: 'Скептик',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getInsightTag(session: SessionItem): string | null {
  if (session.avg_score == null) return null;
  const score = Math.round(session.avg_score * 10);
  if (score >= 9) return '🔥 Отличное выступление';
  if (score >= 7) return '✅ Уверенная аргументация';
  if (score >= 5) return '⚠️ Слабая структура';
  if (score >= 3) return '📌 Нужна работа над логикой';
  return '🚨 Критические пробелы';
}
