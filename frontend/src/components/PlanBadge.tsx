'use client';

import React from 'react';
import type { PlanId } from '@/types/billing';

interface PlanBadgeProps {
  plan: PlanId;
}

const PLAN_CONFIG: Record<
  PlanId,
  { label: string; className: string }
> = {
  starter: {
    label: 'STARTER',
    className:
      'bg-[var(--bg-surface-alt)] text-[var(--text-dim)] border border-[var(--border-main)]',
  },
  pro: {
    label: 'PRO',
    className:
      'bg-gradient-to-r from-accent-500 to-amber-400 text-white border-0',
  },
  team: {
    label: 'TEAM',
    className:
      'bg-gradient-to-r from-violet-600 to-purple-500 text-white border-0',
  },
};

export function PlanBadge({ plan }: PlanBadgeProps) {
  const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.starter;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-widest leading-none ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
