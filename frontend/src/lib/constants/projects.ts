import { 
  Briefcase, 
  Code2, 
  Mic, 
  Monitor, 
  FolderOpen,
  User,
  Bot,
  Users,
  MessageSquare
} from 'lucide-react';
import { EventType } from '../types/projects';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  interview: 'Собеседование',
  pitch: 'Питч',
  talk: 'Доклад',
  presentation: 'Презентация',
  other: 'Другое'
};

export const EVENT_TYPE_ICONS: Record<EventType, any> = {
  interview: Code2,
  pitch: Briefcase,
  talk: Mic,
  presentation: Monitor,
  other: FolderOpen
};

// Keys must match backend PersonaConfig.role: investor | hr | tech_lead | listener
export const PERSONA_ICONS: Record<string, React.ElementType> = {
  investor: Briefcase,
  tech_lead: Bot,
  hr: User,
  listener: MessageSquare,
  default: Users,
};

export const PERSONA_LABELS: Record<string, string> = {
  investor: 'Венчурный Инвестор',
  tech_lead: 'CEO / Техдир',
  hr: 'HR-Менеджер',
  listener: 'Скептик из зала',
};

import React from 'react';
