import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  MessageSquare,
  Target,
  UserRound,
} from 'lucide-react';

const safariMotionStyle: React.CSSProperties = {
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
  WebkitTransform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
};

const questions = [
  'Почему это решение важнее двух альтернатив, которые уже лежат в backlog?',
  'Какая цифра доказывает, что задержка будет дороже текущего бюджета?',
  'Что Вы готовы убрать из плана, если ресурс режется на 20%?',
];

const weakSpots = [
  { label: 'Нет цены задержки', detail: 'Нужно связать срок с деньгами и риском клиента.' },
  { label: 'Размытый владелец', detail: 'Не видно, кто отвечает за следующий шаг.' },
  { label: 'Слабый компромисс', detail: 'Есть просьба, но нет fallback-сценария.' },
];

export default function HeroVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => setStep(2), 1900),
      setTimeout(() => setStep(3), 3100),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,640px)] overflow-hidden py-2 sm:overflow-visible lg:py-4">
      <div className="absolute -inset-4 bg-[radial-gradient(circle_at_82%_12%,rgba(232,96,10,0.12),transparent_34%)] blur-3xl" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={safariMotionStyle}
        className="relative z-10 border border-neutral-950 bg-[#111111] p-2 shadow-[0_22px_54px_rgba(0,0,0,0.16)] sm:p-3"
      >
        <div className="border border-white/10 bg-white text-neutral-950">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E8600A]">бесплатный pressure-test</div>
              <h3 className="mt-1 truncate text-[15px] font-black leading-tight sm:text-[19px]">Подготовка к защите бюджета</h3>
            </div>
            <div className="hidden items-center gap-1.5 border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 sm:flex">
              <UserRound size={13} />
              Руководитель
            </div>
          </div>

          <div className="grid gap-3 bg-[#fbfaf8] p-3 sm:p-4">
            <div className="grid gap-3 sm:grid-cols-[0.86fr_1.14fr]">
              <div className="border border-neutral-200 bg-[#faf8f4] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-neutral-500" />
                    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-500">материал</div>
                  </div>
                  <div className="hidden border border-neutral-200 bg-white px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-500 sm:block">
                    тезисы
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-neutral-800">
                  Если бюджет режется, релиз сдвинется на месяц и команда потеряет окно у ключевого клиента.
                </p>
              </div>

              <div className="border border-neutral-950 bg-[#111111] p-4 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-[#E8600A]" />
                    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/[0.42]">вопрос оппонента</div>
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#FF8A3D]">0{Math.min(step + 1, 3)}/03</div>
                </div>
                <AnimatePresence mode="popLayout">
                  <motion.p
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="mt-4 min-h-[78px] text-[15px] font-semibold leading-relaxed text-white"
                  >
                    {questions[Math.min(step, questions.length - 1)]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <div className="border border-neutral-200 bg-white p-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-400">черновик ответа</div>
                <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">
                  Бюджет нужен, чтобы удержать срок и не потерять клиента. Мы можем сократить второстепенный запуск...
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-400">ctrl + enter</div>
                  <div className="inline-flex items-center gap-1.5 border border-neutral-950 bg-neutral-950 px-3 py-2 text-[11px] font-bold text-white">
                    Ответить
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>

              <div className="border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#E8600A]" />
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-400">после ответа</div>
                </div>
                <motion.div
                  key={step}
                  initial={{ opacity: 0.48 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.24 }}
                  className="mt-4 border-l-2 border-[#E8600A] pl-3"
                >
                  <div className="text-[12px] font-bold leading-snug text-neutral-950">{weakSpots[Math.min(step, weakSpots.length - 1)].label}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">{weakSpots[Math.min(step, weakSpots.length - 1)].detail}</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="absolute -bottom-2 left-6 z-20 hidden border border-neutral-950 bg-white px-4 py-3 shadow-[8px_8px_0_rgba(232,96,10,0.18)] lg:block">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-[#E8600A]" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">бесплатно</div>
            <div className="mt-1 text-lg font-black text-neutral-950">3 вопроса</div>
          </div>
        </div>
      </div>
    </div>
  );
}
