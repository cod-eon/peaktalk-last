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
  free: {
    label: 'FREE',
    className:
      'bg-neutral-100 text-neutral-500 border border-neutral-200',
  },
  per_session: {
    label: '1 СЕССИЯ',
    className:
      'bg-neutral-100 text-neutral-500 border border-neutral-200',
  },
  personal: {
    label: 'PERSONAL',
    className:
      'bg-[#E8600A]/10 text-[#B74707] border border-[#E8600A]/20',
  },
  pro: {
    label: 'PRO',
    className:
      'bg-violet-50 text-violet-700 border border-violet-100',
  },
  team: {
    label: 'TEAM',
    className:
      'bg-neutral-950 text-white border border-neutral-950',
  },
  starter: {
    label: 'STARTER',
    className:
      'bg-[#E8600A]/10 text-[#B74707] border border-[#E8600A]/20',
  },
};

export function PlanBadge({ plan }: PlanBadgeProps) {
  const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-none text-[9px] font-bold tracking-widest leading-none ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
