import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Target } from 'lucide-react';

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
    <div className={`relative mx-auto w-full ${compact ? 'max-w-[390px] overflow-visible py-1' : 'max-w-[min(100%,880px)] py-2 sm:overflow-visible lg:py-4'}`}>
      <div
        className={`${compact ? 'absolute -inset-x-5 -inset-y-2 bg-[radial-gradient(circle_at_76%_18%,rgba(232,96,10,0.12),transparent_42%)] blur-2xl' : 'absolute -inset-4 bg-[radial-gradient(circle_at_82%_12%,rgba(232,96,10,0.12),transparent_34%)] blur-3xl'}`}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={safariMotionStyle}
        className={`relative z-10 ${compact ? 'rounded-[6px]' : ''}`}
      >
        <Image 
          src="/mockup screen.png" 
          alt="PeakTalk Interface Mockup" 
          width={1400}
          height={900}
          className={`${compact ? 'h-auto w-full object-contain drop-shadow-[0_20px_40px_rgba(17,17,17,0.16)]' : 'w-full h-auto object-contain drop-shadow-xl'}`}
          priority 
        />
      </motion.div>

      <div className={`${compact ? 'absolute -bottom-3 left-3 z-20 border border-neutral-950 bg-white px-3 py-2 shadow-[6px_6px_0_rgba(232,96,10,0.16)]' : 'absolute -bottom-2 left-6 z-20 hidden border border-neutral-950 bg-white px-4 py-3 shadow-[8px_8px_0_rgba(232,96,10,0.18)] lg:block'}`}>
        <div className="flex items-center gap-2">
          <Target size={compact ? 12 : 14} className="text-[#E8600A]" />
          <div>
            <div className={`${compact ? 'font-mono text-[8px] uppercase tracking-[0.14em] text-neutral-500' : 'font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500'}`}>демо</div>
            <div className={`${compact ? 'mt-0.5 text-sm font-black text-neutral-950' : 'mt-1 text-lg font-black text-neutral-950'}`}>3 вопроса</div>
          </div>
        </div>
      </div>
    </div>
  );
}
