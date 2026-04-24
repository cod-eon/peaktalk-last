import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, CheckCircle2, FileText, MessageSquare, ShieldAlert } from 'lucide-react';

const safariMotionStyle: React.CSSProperties = {
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
  WebkitTransform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
};

const riskRows = [
  { label: 'ROI не защищён цифрами', score: '91%' },
  { label: 'Сроки завязаны на допущение', score: '74%' },
  { label: 'Trade-off не проговорён', score: '58%' },
];

const objections = [
  'Где доказательство, что бюджет окупится в Q3?',
  'Что вы уберёте, если ресурс режется на 20%?',
  'Почему клиент поверит в impact после прошлой задержки?',
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
    <div className="relative mx-auto w-full max-w-[calc(100vw-32px)] overflow-hidden py-4 sm:max-w-[720px] sm:overflow-visible lg:py-8">
      <div className="absolute -inset-4 bg-[radial-gradient(circle_at_72%_15%,rgba(232,96,10,0.18),transparent_34%),radial-gradient(circle_at_12%_70%,rgba(17,17,17,0.10),transparent_42%)] blur-3xl" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={safariMotionStyle}
        className="relative z-10 border border-neutral-950 bg-[#111111] p-3 shadow-[0_26px_70px_rgba(0,0,0,0.2)] sm:hidden"
      >
        <div className="border border-white/10 bg-[#f8f5ef] text-neutral-950">
          <div className="border-b border-neutral-300 bg-white/60 px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E8600A]">budget defense / q3</div>
            <h3 className="mt-1 text-[17px] font-black leading-tight">Evidence board перед CFO</h3>
          </div>
          <div className="grid gap-3 p-3">
            <div className="border border-neutral-300 bg-white p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-400">source fragment</div>
              <p className="mt-3 text-[13px] leading-relaxed text-neutral-800">
                Просим увеличить бюджет, чтобы удержать rollout в Q3 и ускорить внедрение у enterprise-клиентов.
              </p>
            </div>
            <div className="border border-neutral-300 bg-[#111111] p-4 text-white">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/[0.38]">opponent question</div>
              <p className="mt-3 text-[14px] font-semibold leading-relaxed">
                {objections[Math.min(step, objections.length - 1)]}
              </p>
            </div>
            <div className="border border-[#E8600A]/35 bg-[#fff7ed] p-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#B74707]">prep-card</div>
              <p className="mt-3 text-[13px] font-semibold leading-relaxed">
                Начать с цены задержки rollout, затем назвать ROI, payback period и fallback-опции.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        style={safariMotionStyle}
        className="relative z-10 hidden border border-neutral-950 bg-[#111111] p-3 shadow-[0_36px_90px_rgba(0,0,0,0.24)] sm:block sm:rotate-[-1.4deg] sm:p-4"
      >
        <div className="border border-white/10 bg-[#f8f5ef] text-neutral-950">
          <div className="grid grid-cols-[48px_minmax(0,1fr)] border-b border-neutral-300 sm:grid-cols-[64px_minmax(0,1fr)]">
            <aside className="border-r border-neutral-300 bg-[#111111] p-2 sm:p-3">
              <div className="flex h-9 w-9 items-center justify-center border border-white/15 bg-white/5 text-[#E8600A] sm:h-10 sm:w-10">
                <ShieldAlert size={18} />
              </div>
              <div className="mt-5 grid gap-2">
                {[FileText, MessageSquare, AlertTriangle, CheckCircle2].map((Icon, index) => (
                  <div
                    key={index}
                    className={`flex h-9 w-9 items-center justify-center border ${index === 2 ? 'border-[#E8600A] bg-[#E8600A] text-white' : 'border-white/12 bg-white/[0.03] text-white/[0.42]'}`}
                  >
                    <Icon size={15} />
                  </div>
                ))}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-300 bg-white/58 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#E8600A]">budget defense / q3</div>
                  <h3 className="mt-1 truncate text-[16px] font-black leading-tight text-neutral-950 sm:text-[20px]">Evidence board перед CFO</h3>
                </div>
                <div className="hidden border border-emerald-600/25 bg-emerald-50 px-3 py-2 sm:block">
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-700">status</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 bg-emerald-500" /> Готово
                  </div>
                </div>
              </div>

                  <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(190px,0.72fr)] sm:p-4">
                <div className="grid gap-3">
                  <div className="border border-neutral-300 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-400">source fragment</div>
                        <p className="mt-3 text-[13px] leading-relaxed text-neutral-800 sm:text-sm">
                          Просим увеличить бюджет, чтобы удержать rollout в Q3 и ускорить внедрение у enterprise-клиентов.
                        </p>
                      </div>
                      <div className="shrink-0 border border-neutral-300 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-500">memo</div>
                    </div>
                  </div>

                  <div className="border border-neutral-300 bg-[#111111] p-4 text-white">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/[0.38]">opponent question</div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#E8600A]">CFO</div>
                    </div>
                    <AnimatePresence mode="popLayout">
                      <motion.p
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.22 }}
                        className="mt-4 min-h-[76px] text-[14px] font-semibold leading-relaxed text-white sm:text-base"
                      >
                        {objections[Math.min(step, objections.length - 1)]}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-3 border border-neutral-300 bg-white">
                    {[
                      ['ready', '7.4/10'],
                      ['risks', '3'],
                      ['prep', step >= 3 ? 'done' : 'build'],
                    ].map(([label, value], index) => (
                      <div key={label} className={`px-3 py-3 ${index > 0 ? 'border-l border-neutral-300' : ''}`}>
                        <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-neutral-400">{label}</div>
                        <div className="mt-1 text-[15px] font-black text-neutral-950">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                  <div className="grid gap-3">
                  <div className="border border-neutral-300 bg-white p-4">
                    <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-400">risk map</div>
                    <div className="mt-4 grid gap-2">
                      {riskRows.map((row, index) => (
                        <motion.div
                          key={row.label}
                          initial={{ opacity: 0.35 }}
                          animate={{ opacity: step >= index + 1 ? 1 : 0.5 }}
                          transition={{ duration: 0.24 }}
                          className="border border-neutral-200 bg-[#fbf8f1] p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[12px] font-semibold leading-snug text-neutral-900">{row.label}</span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#E8600A]">{row.score}</span>
                          </div>
                          <div className="mt-3 h-1.5 bg-neutral-200">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: step >= index + 1 ? row.score : '18%' }}
                              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full bg-[#E8600A]"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: step >= 2 ? 1 : 0.45, y: step >= 2 ? 0 : 10 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="border border-[#E8600A]/35 bg-[#fff7ed] p-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#E8600A]/20 pb-3">
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#B74707]">prep-card</div>
                      <ArrowUpRight size={14} className="text-[#E8600A]" />
                    </div>
                    <p className="mt-3 text-[13px] font-semibold leading-relaxed text-neutral-950">
                      Начать с цены задержки rollout, затем назвать ROI, payback period и fallback-опции.
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="absolute -bottom-3 left-8 z-20 hidden border border-neutral-950 bg-white px-4 py-3 shadow-[12px_12px_0_rgba(232,96,10,0.22)] lg:block">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">meeting in</div>
        <div className="mt-1 text-2xl font-black text-neutral-950">37 min</div>
      </div>
    </div>
  );
}
