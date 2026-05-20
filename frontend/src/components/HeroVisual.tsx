"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  MessageSquare,
  Timer,
} from 'lucide-react';

const safariMotionStyle: React.CSSProperties = {
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
  WebkitTransform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
};

type HeroVisualProps = {
  compact?: boolean;
};

const pressureFrames = [
  {
    role: 'Руководитель',
    meeting: 'Защита бюджета',
    timer: '08:40',
    pressure: 74,
    question: 'Что Вы готовы убрать из плана, если ресурс режется на 20%?',
    answer: 'Мы сохраним ключевые активности и пересоберём план без потери результата...',
    weak: 'Нет цены компромисса',
    prep: 'Назовите, что снимаете первым, какую метрику защищаете и кто принимает решение.',
    tag: 'budget defense',
  },
  {
    role: 'Клиент',
    meeting: 'Эскалация клиента',
    timer: '06:15',
    pressure: 82,
    question: 'Почему мы должны верить новому сроку, если предыдущий уже сорван?',
    answer: 'Мы усилили контроль и готовы чаще синхронизироваться по статусу...',
    weak: 'Нет нового механизма доверия',
    prep: 'Дайте причину срыва, новый контрольный ритм и компенсационный жест.',
    tag: 'client escalation',
  },
  {
    role: 'Инвестор',
    meeting: 'Инвест-спич',
    timer: '04:50',
    pressure: 68,
    question: 'Откуда берётся рост 500%, если retention уже проседает?',
    answer: 'Рост будет за счёт новых каналов и более точной сегментации...',
    weak: 'Связь метрик не доказана',
    prep: 'Разведите CAC, retention и payback по когортам, затем назовите допущение.',
    tag: 'investor pitch',
  },
];

export default function HeroVisual({ compact = false }: HeroVisualProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % pressureFrames.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  const frame = pressureFrames[activeIndex];
  const compactClasses = useMemo(
    () => ({
      shell: compact ? 'max-w-[390px]' : 'max-w-[min(100%,880px)]',
      pad: compact ? 'p-3' : 'p-4 sm:p-5',
      title: compact ? 'text-[15px]' : 'text-[18px] sm:text-[20px]',
      question: compact ? 'text-[15px]' : 'text-[20px] sm:text-[24px]',
    }),
    [compact],
  );

  return (
    <div className={`relative mx-auto w-full ${compactClasses.shell}`}>
      <div className="absolute -inset-3 border border-neutral-200/70 bg-white/35" aria-hidden="true" />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={safariMotionStyle}
        className="relative z-10 border border-neutral-950 bg-white shadow-xl shadow-black/10"
      >
        <div className={`border-b border-neutral-200 ${compactClasses.pad}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center bg-neutral-950 font-mono text-[11px] font-bold text-white">
                PT
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[9px] uppercase text-neutral-400 sm:text-[10px]">{frame.tag}</div>
                <div className={`${compactClasses.title} truncate font-bold leading-tight text-neutral-950`}>{frame.meeting}</div>
              </div>
            </div>
            <div className="hidden items-center gap-2 border border-neutral-200 bg-[#faf8f4] px-3 py-2 text-sm font-semibold text-neutral-700 sm:flex">
              <Timer size={15} className="text-[#E8600A]" />
              <span className="tabular-nums">{frame.timer}</span>
            </div>
          </div>
        </div>

        <div className={`grid gap-3 bg-[#f4f1ea] ${compact ? 'p-3' : 'p-4 sm:p-5'} ${compact ? '' : 'lg:grid-cols-[0.78fr_1.22fr]'}`}>
          <div className={`grid gap-3 ${compact ? 'hidden' : 'hidden lg:grid'}`}>
            {[
              ['Материал', 'Релиз сдвинется на месяц, если бюджет сократят.'],
              ['Раунд', '03 / 05'],
              ['Давление', `${frame.pressure} / 100`],
            ].map(([label, value]) => (
              <div key={label} className="border border-neutral-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase text-neutral-400">
                  <FileText size={13} />
                  {label}
                </div>
                <div className="text-[16px] font-bold leading-snug text-neutral-950">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={frame.question}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="bg-neutral-950 p-5 text-white sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-[#FF8A3D]">
                    <MessageSquare size={13} />
                    входящий вопрос
                  </div>
                  <div className="font-mono text-[10px] uppercase text-white/45">{frame.role}</div>
                </div>
                <p className={`${compactClasses.question} text-pretty font-bold leading-[1.28] text-white`}>{frame.question}</p>
              </motion.div>
            </AnimatePresence>

            <div className="grid gap-3 sm:grid-cols-[0.95fr_1.05fr]">
              <div className="border border-neutral-200 bg-white p-4">
                <div className="font-mono text-[10px] uppercase text-neutral-400">черновик ответа</div>
                <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">{frame.answer}</p>
                <div className="mt-5 h-px bg-neutral-100" />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="font-mono text-[10px] uppercase text-neutral-300">ответ готовится</div>
                  <ArrowRight size={16} className="text-neutral-400" />
                </div>
              </div>

              <div className="border border-neutral-200 bg-white p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center bg-[#E8600A]/10 text-[#E8600A]">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase text-[#E8600A]">слабое место</div>
                    <p className="mt-1 text-[15px] font-bold leading-snug text-neutral-950">{frame.weak}</p>
                  </div>
                </div>
                <p className="border-l-2 border-[#E8600A] pl-3 text-[14px] leading-relaxed text-neutral-600">{frame.prep}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`border-t border-neutral-200 bg-white ${compact ? 'p-3' : 'p-4 sm:p-5'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[13px] font-bold text-neutral-800">
              <BarChart3 size={16} className="text-[#E8600A]" />
              <span>Pressure score</span>
            </div>
            <div className="font-mono text-[12px] font-semibold tabular-nums text-neutral-500">{frame.pressure}%</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden bg-neutral-100">
            <motion.div
              className="h-full origin-left bg-[#E8600A]"
              initial={false}
              animate={{ scaleX: frame.pressure / 100 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-neutral-500">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span className="truncate">Следующий шаг сформирован до встречи</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
