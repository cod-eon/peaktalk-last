'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

function FromGuestBridgeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function migrateSession() {
      const guestSessionId = localStorage.getItem('peaktalk_guest_session_id');
      const difficultyStr = localStorage.getItem('peaktalk_guest_difficulty');
      
      if (!guestSessionId) {
        if (mounted) router.replace('/dashboard');
        return;
      }

      try {
        const difficulty = parseInt(difficultyStr || '3', 10);
        const res = await api.post('/simulation/from-guest', {
          guest_session_id: guestSessionId,
          difficulty,
        });
        
        // Clean up
        localStorage.removeItem('peaktalk_guest_session_id');
        localStorage.removeItem('peaktalk_guest_difficulty');
        
        toast.success('Контекст сессии успешно перенесён!');
        if (mounted) router.replace(`/simulation/${res.session_id}`);
      } catch (err: any) {
        if (!mounted) return;
        // If limit exceeded 402 error, we send to billing
        if (err?.code === 'simulation_limit_exceeded') {
           router.replace('/billing?plan=per_session&return=/simulation/from-guest');
           return;
        }
        const message = err instanceof Error ? err.message : 'Ошибка переноса сессии';
        setError(message);
        localStorage.removeItem('peaktalk_guest_session_id');
      }
    }
    
    migrateSession();
    return () => { mounted = false; };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <p className="text-red-500 mb-4 font-inter text-sm">{error}</p>
        <button 
          onClick={() => router.replace('/dashboard')} 
          className="text-sm underline cursor-pointer text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Вернуться в дашборд
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <Loader2 size={32} className="animate-spin text-neutral-900 mb-5" />
        <h2 className="font-inter font-semibold text-lg text-neutral-900 mb-2">
          Готовим полную сессию...
        </h2>
        <p className="font-inter text-sm text-neutral-500">
          Переносим контекст вашего диалога
        </p>
      </motion.div>
    </div>
  );
}

export default function FromGuestBridge() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-neutral-900" />
      </div>
    }>
      <FromGuestBridgeInner />
    </Suspense>
  );
}