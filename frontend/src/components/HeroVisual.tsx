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

export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,880px)] py-2 sm:overflow-visible lg:py-4">
      <div className="absolute -inset-4 bg-[radial-gradient(circle_at_82%_12%,rgba(232,96,10,0.12),transparent_34%)] blur-3xl" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={safariMotionStyle}
        className="relative z-10"
      >
        <Image 
          src="/mockup screen.png" 
          alt="PeakTalk Interface Mockup" 
          width={1400}
          height={900}
          className="w-full h-auto object-contain drop-shadow-xl"
          priority 
        />
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
