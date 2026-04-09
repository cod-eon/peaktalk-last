import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const safariMotionStyle: React.CSSProperties = {
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
  WebkitTransform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
};

export default function HeroVisual() {
  const [step, setStep] = useState(0); // 0: typing, 1: generating AI, 2: completed

  useEffect(() => {
    // Simulate progression
    const t1 = setTimeout(() => setStep(1), 1500);
    const t2 = setTimeout(() => setStep(2), 3500);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative w-[343px] sm:w-auto max-w-[calc(100vw-32px)] sm:max-w-[680px] mx-auto overflow-visible my-4">
      <div className="absolute inset-x-8 top-8 bottom-10 rounded-none bg-[radial-gradient(circle_at_50%_35%,rgba(232,96,10,0.10),transparent_45%)] blur-3xl opacity-80" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={safariMotionStyle}
        className="relative z-10 w-full"
      >
        <div className="rounded-none overflow-hidden bg-white border border-black/5 shadow-[0px_1px_3px_rgba(0,0,0,0.05),_0px_10px_20px_rgba(0,0,0,0.04),_0px_20px_40px_rgba(0,0,0,0.04),_0px_30px_60px_rgba(0,0,0,0.06)] flex flex-col relative w-full">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-black/5 bg-[#F9FAFB]">
            <div className="font-mono text-[10px] sm:text-xs text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <span className="break-words whitespace-normal text-center sm:text-left">[ СЕССИЯ // СПИЧ СЕРИИ А ]</span>
            </div>
            <div className="font-mono text-[10px] sm:text-xs text-[#10B981] uppercase tracking-widest flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="break-words whitespace-normal">ЗАПИСЬ</span>
            </div>
          </div>

          <div className="p-4 sm:p-8 pb-32 sm:pb-36 relative bg-white">
            
            {/* Block 1: Investor */}
            <div className="mb-8">
              <div className="bg-neutral-50 border border-neutral-100 rounded-none p-5 sm:p-6">
                <div className="font-mono text-[10px] text-[#E8600A] uppercase tracking-widest mb-3 opacity-90 break-words whitespace-normal">
                  [ ИНВЕСТОР ]
                </div>
                <p className="font-inter text-base leading-relaxed text-black break-words whitespace-normal font-medium">
                  "Вы закладываете 300% роста в первый год. Но стоимость привлечения клиента (CAC) в этой нише обычно растет нелинейно. За счет чего вы планируете ее удерживать?"
                </p>
              </div>
            </div>

            {/* Block 2: User Response */}
            <div className="pl-2 relative max-w-[80%] sm:max-w-[76%]">
              <div className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest mb-3 break-words whitespace-normal">
                [ ВАШ ОТВЕТ ]
              </div>
              <p className="font-inter text-base leading-relaxed text-[#171717] break-words whitespace-normal relative">
                Мы планируем расширять партнерский канал и{' '}
                <span className="relative inline-block cursor-text">
                  <span className={`relative z-10 font-medium ${step >= 1 ? 'text-black' : 'text-neutral-500'}`}>
                    постепенно снижать
                  </span>
                  {/* Highlight */}
                  <motion.span 
                    className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-[#E8600A]"
                    style={{ ...safariMotionStyle, transformOrigin: 'left center' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: step >= 1 ? 1 : 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </span>
                {' '}затраты на...
                
                {/* Text Cursor */}
                <motion.span
                   animate={{ opacity: [1, 0, 1] }}
                   transition={{ duration: 0.8, repeat: Infinity }}
                   className="inline-block w-[2px] h-[1em] bg-[#E8600A] translate-y-[2px] ml-1"
                />
              </p>
            </div>

            {/* Floating AI Analysis Panel */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute bottom-4 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-[350px] rounded-none border border-neutral-200 bg-white/98 shadow-[0px_24px_60px_rgba(0,0,0,0.14)] p-5 backdrop-blur-sm"
                  style={{ ...safariMotionStyle, zIndex: 30 }}
                >
                  <div className="flex items-center justify-between mb-3 border-b border-[rgba(0,0,0,0.06)] pb-2">
                    <span className="font-mono text-[10px] text-[#E8600A] uppercase tracking-widest font-bold break-words whitespace-normal">
                      [ PEAKTALK AI ]
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-300">signal</span>
                  </div>
                  
                  <div className="font-inter text-[13px] leading-relaxed text-black font-medium flex gap-2 items-start mt-3">
                    <span className="text-[#E8600A] shrink-0 font-mono mt-0.5">✦</span>
                    <span className="break-words">
                      Уход от конкретики. Инвестор ждет точных метрик по удержанию CAC, а не абстрактных планов.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
