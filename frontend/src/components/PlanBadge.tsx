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
      'bg-neutral-100 text-neutral-500 border border-neutral-200',
  },
  pro: {
    label: 'PRO',
    className:
      'bg-neutral-900 text-white border-0',
  },
  team: {
    label: 'TEAM',
    className:
      'bg-neutral-700 text-white border-0',
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
