"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, MotionValue, useTransform, useMotionValueEvent } from 'framer-motion';

export default function HeroVisual({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const FRAME_COUNT = 240;
  const currentFrameRef = useRef(0);
  
  // Preload images
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;
    
    for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        const frameNum = i.toString().padStart(4, '0');
        img.src = `/hero-frames/frame_${frameNum}.jpg`;
        img.onload = () => {
            loadedCount++;
            if (i === 1) { // Draw first frame immediately
                requestAnimationFrame(() => renderFrame(img));
            }
        };
        loadedImages.push(img);
    }
    setImages(loadedImages);
  }, []);

  const renderFrame = (img: HTMLImageElement) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (imgRatio > canvasRatio) {
        drawWidth = canvas.height * imgRatio;
        offsetX = -(drawWidth - canvas.width) / 2;
    } else {
        drawHeight = canvas.width / imgRatio;
        offsetY = -(drawHeight - canvas.height) / 2;
    }
    
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);

  useMotionValueEvent(frameIndex, "change", (latest) => {
    const index = Math.floor(latest) - 1;
    if (index >= 0 && index < images.length && images[index]) {
        if (currentFrameRef.current !== index) {
            currentFrameRef.current = index;
            requestAnimationFrame(() => renderFrame(images[index]));
        }
    }
  });

  return (
    <div className="relative w-full h-[400px] lg:h-[600px] flex items-center justify-center -mr-8 lg:-mr-24 lg:-mt-6 cursor-default">
      
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[var(--color-accent)] rounded-full blur-[100px] opacity-[0.15] pointer-events-none" />
        
        <motion.div 
          className="absolute inset-4 lg:inset-8 z-10 rounded-[28px] overflow-hidden shadow-2xl bg-neutral-100/50 border border-white/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <canvas ref={canvasRef} className="w-full h-full object-cover rounded-[28px]" />
          <div className="absolute inset-0 bg-orange-500/5 mix-blend-overlay pointer-events-none rounded-[28px]" />
        </motion.div>

        {/* Floating Annotation Tags */}
        <div className="absolute inset-0 z-20 pointer-events-none lg:block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute top-[8%] left-[-5%] hidden md:block"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-lg shadow-xl shadow-orange-500/10 border border-orange-500/20">
              <span className="text-[var(--color-accent)] font-bold">⚡</span>
              <span className="font-syne font-bold text-sm text-[var(--text-main)]">Аргумент не подкреплён данными</span>
            </div>
          </motion.div>

          <motion.div
             style={{ opacity: useTransform(scrollYProgress, [0.3, 0.5], [0, 1]), y: useTransform(scrollYProgress, [0.3, 0.5], [20, 0]) }}
            className="absolute bottom-[12%] right-[-5%]"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-lg shadow-xl shadow-green-500/10 border border-green-500/20">
              <span className="text-green-500 font-bold">✓</span>
              <span className="font-syne font-bold text-sm text-[var(--text-main)]">Сильная позиция</span>
            </div>
          </motion.div>

          <motion.div
            style={{ opacity: useTransform(scrollYProgress, [0.6, 0.8], [0, 1]), y: useTransform(scrollYProgress, [0.6, 0.8], [20, 0]) }}
            className="absolute top-[40%] md:top-[50%] right-[60%] lg:right-[80%]"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md rounded-lg shadow-xl shadow-blue-500/10 border border-blue-500/20">
              <span className="text-blue-500 font-bold">→</span>
              <span className="font-syne font-bold text-sm text-[var(--text-main)]">Уточни пример</span>
            </div>
          </motion.div>
        </div>
    </div>
  );
}
