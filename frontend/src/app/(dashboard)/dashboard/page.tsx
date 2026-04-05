"use client";

import React, { useMemo } from 'react';
import { Play, Target, AlertTriangle, Droplets, ArrowRight, Upload } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

// ── Components ─────────────────────────────────────────────────────────────

function MetricPod({
  label, value, trend, trendValue, icon
}: {
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-none p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start gap-3 mb-6">
        <span className="font-inter text-[11px] font-bold text-neutral-500 tracking-widest uppercase leading-tight">
          {label}
        </span>
        <div className="text-neutral-400 shrink-0">
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-inter text-3xl font-bold text-neutral-900 tracking-tight">
          {value}
        </span>
        {trend && trendValue && (
          <span className={`font-inter text-[11px] font-bold tracking-wide ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 font-inter bg-white min-h-screen">
      
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Сводка</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">Аналитика ваших последних защит.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center gap-2 bg-white border border-neutral-200 rounded-none hover:border-neutral-400 text-neutral-700 hover:text-neutral-900 px-5 py-3 text-sm font-semibold transition-colors"
          >
            <Upload size={14} />
            Загрузить документ
          </Link>
          <Link
            href="/simulation"
            className="inline-flex items-center justify-center gap-2 bg-[#171717] hover:bg-black text-white rounded-none px-5 py-3 text-sm font-semibold transition-colors"
          >
            <Play size={14} className="fill-white" />
            Новый стресс-тест
          </Link>
        </div>
      </div>

      {/* ── 2. METRICS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricPod
          label="ИНДЕКС УСТОЙЧИВОСТИ"
          value="--"
          icon={<Target size={18} className="text-emerald-500" />}
        />
        <MetricPod
          label="КРИТИЧЕСКИЕ УЯЗВИМОСТИ"
          value="--"
          icon={<AlertTriangle size={18} className="text-red-500" />}
        />
        <MetricPod
          label="УРОВЕНЬ «ВОДЫ»"
          value="--"
          icon={<Droplets size={18} className="text-amber-500" />}
        />
      </div>

      {/* ── 3. CHART SECTION ── */}
      <div className="bg-white border border-neutral-200 rounded-none overflow-hidden mb-8 flex flex-col">
        <div className="p-6 pb-0">
          <h2 className="font-inter text-[11px] font-bold text-neutral-500 tracking-widest uppercase">
            ДИНАМИКА ИНДЕКСА УСТОЙЧИВОСТИ
          </h2>
        </div>
        <div className="h-[280px] p-6 pt-10 relative flex flex-col">
          <div className="flex-1 border-b border-dashed border-neutral-200 flex items-end justify-between px-4 pb-2 text-[11px] text-neutral-400 font-medium">
            <span>22 мар.</span>
            <span>24 мар.</span>
            <span>26 мар.</span>
            <span>28 мар.</span>
            <span>30 мар.</span>
            <span>1 апр.</span>
            <span>3 апр.</span>
          </div>
        </div>
      </div>

      {/* ── 4. HISTORY SECTION ── */}
      <div className="bg-white border border-neutral-200 rounded-none overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="font-inter text-[11px] font-bold text-neutral-500 tracking-widest uppercase">
            ЛЕНТА СИМУЛЯЦИЙ
          </h2>
        </div>
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-neutral-500 mb-4">
            У вас пока нет проведенных защит.
          </p>
          <Link
            href="/simulation"
            className="text-sm font-semibold text-neutral-900 hover:text-orange-600 transition-colors flex items-center gap-1 group"
          >
            Начать первую <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

    </div>
  );
}
