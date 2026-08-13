import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

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

export default function HeroVisual({ compact = false }: HeroVisualProps) {
  return (
    <div className={`relative mx-auto w-full min-w-0 max-w-[calc(100vw-48px)] ${compact ? '' : 'lg:max-w-[min(100%,900px)]'}`}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={safariMotionStyle}
        className="relative z-10 overflow-hidden border border-neutral-300 bg-white shadow-[0_18px_46px_rgba(17,24,39,0.08)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <div className="truncate font-mono text-[8px] uppercase tracking-[0.16em] text-neutral-400 sm:text-[10px]">
              Материал / разбор / стресс-тест
            </div>
          </div>
          <div className={`${compact ? 'hidden sm:block' : 'block'} shrink-0 border border-neutral-200 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-neutral-500 sm:text-[10px]`}>
            Defense Brief
          </div>
        </div>

        <div className={`${compact ? 'h-[196px]' : 'h-[338px] lg:h-[398px]'} relative overflow-hidden bg-[#f7f3eb]`}>
          <Image
            src="/mockup screen.png"
            alt="PeakTalk показывает материал встречи, слабое место позиции и вопрос для стресс-теста"
            width={1586}
            height={992}
            className={`h-full w-full object-cover ${compact ? 'object-[52%_42%] scale-[1.24]' : 'object-[52%_55%] scale-[1.04]'}`}
            priority
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(250,248,244,0.86))]" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-3 border-t border-neutral-200 bg-white text-center">
          {['Source', 'Scan', 'Brief'].map((item) => (
            <div key={item} className="border-r border-neutral-200 px-2 py-2 last:border-r-0">
              <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-neutral-400 sm:text-[10px]">
                {item}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
