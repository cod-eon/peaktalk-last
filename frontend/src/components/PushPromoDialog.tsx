"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushPromoDialog() {
  const [isVisible, setIsVisible] = useState(false);
  const { permission, requestPermissionAndSubscribe } = usePushNotifications();

  useEffect(() => {
    // If we already have permission or denied, don't show
    if (permission === 'granted' || permission === 'denied') return;

    // Check localStorage for 3-day backoff
    const lastPrompt = localStorage.getItem('peaktalk_push_prompted_date');
    if (lastPrompt) {
      const daysSincePrompt = (Date.now() - new Date(lastPrompt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePrompt < 3) return;
    }

    // Delay showing the prompt slightly, maybe 10 seconds after user opens app
    const timer = setTimeout(() => setIsVisible(true), 10000);
    return () => clearTimeout(timer);
  }, [permission]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('peaktalk_push_prompted_date', new Date().toISOString());
  };

  const handleAllow = async () => {
    const success = await requestPermissionAndSubscribe();
    if (success) {
      setIsVisible(false);
    } else {
      // Failed or denied, let's also set dismiss state so we don't spam
      handleDismiss();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed left-4 right-4 bottom-4 md:left-auto md:right-6 md:bottom-6 md:w-[380px] z-50 bg-white border border-neutral-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden rounded-none"
        >
          <div className="absolute top-3 right-3">
            <button 
              onClick={handleDismiss}
              className="h-8 w-8 inline-flex items-center justify-center border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors rounded-none"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="border-b border-neutral-200 px-6 py-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">
              Системные уведомления
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-12 w-12 shrink-0 border border-neutral-200 bg-neutral-50 flex items-center justify-center rounded-none">
                <BellRing size={22} className="text-neutral-900" />
              </div>
              <div className="pt-0.5">
                <h3 className="text-[18px] font-bold text-neutral-900 mb-2 leading-tight">
                  Включите уведомления
                </h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed">
                  PeakTalk сообщит, когда будут готовы разбор, текст или важное обновление. Лишний шум не нужен, поэтому пуши только по делу.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-6">
              <div className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 rounded-none">
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400 mb-1">Что придет</div>
                <div className="text-[13px] text-neutral-800">Готовность симуляции, анализа и статусы важных действий</div>
              </div>
              <div className="border border-neutral-200 bg-white px-3 py-2.5 rounded-none">
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400 mb-1">Куда ведет</div>
                <div className="text-[13px] text-neutral-800">Сразу на нужную страницу внутри приложения</div>
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <button 
                onClick={handleDismiss}
                className="flex-1 h-11 px-4 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-[12px] font-mono uppercase tracking-[0.12em] rounded-none transition-colors"
              >
                Позже
              </button>
              <button 
                onClick={handleAllow}
                className="flex-1 h-11 px-4 bg-neutral-900 hover:bg-black text-white text-[12px] font-mono uppercase tracking-[0.12em] rounded-none transition-colors shadow-md shadow-neutral-900/10"
              >
                Включить
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
