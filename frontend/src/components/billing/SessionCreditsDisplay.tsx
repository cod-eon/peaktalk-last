'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';

interface SessionCreditsDisplayProps {
  credits: number;
}

export function SessionCreditsDisplay({ credits }: SessionCreditsDisplayProps) {
  if (credits <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-emerald-200 bg-emerald-50 text-emerald-700 text-[12px] font-semibold">
      <CreditCard size={12} className="shrink-0" />
      Доступно сессий: {credits}
    </span>
  );
}
