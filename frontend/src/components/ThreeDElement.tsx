"use client";

import React, { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import { motion } from 'framer-motion';

interface ThreeDElementProps {
  scene?: string;
}

export default function ThreeDElement({ 
  scene = 'https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode' 
}: ThreeDElementProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if device is mobile to prevent heavy 3D rendering
    if (window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  if (!isClient) return null;

  // On mobile, we might want a lighter version or a static image 
  // to save battery. For now, we'll try to load it anyway unless specifically needed.
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[var(--bg-surface-alt)] rounded-2xl border border-[var(--border-main)] relative overflow-hidden">
        {/* Simplified mobile graphic representation instead of heavy 3D */}
        <div className="absolute inset-0 bg-page-geo-subtle opacity-50 mix-blend-multiply" />
        <div className="w-48 h-48 opacity-20 bg-[var(--color-ai)] rounded-full blur-[80px] object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="w-32 h-32 bg-[var(--bg-card)] rounded-xl shadow-elevated border border-[var(--border-main)] transform rotate-12 flex items-center justify-center z-10">
          <div className="text-[var(--color-accent)] font-syne font-bold text-4xl">PT</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 border-2 border-[var(--color-ai)] border-t-transparent rounded-full animate-spin"
            style={{ filter: "drop-shadow(0 0 10px var(--color-ai-glow))" }}
          />
        </div>
      )}
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 1 }}
        className="w-full h-full"
      >
        <Spline 
          scene={scene} 
          onLoad={() => setIsLoading(false)}
        />
      </motion.div>
    </div>
  );
}
