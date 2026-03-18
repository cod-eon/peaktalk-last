'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowRight, CheckCircle2, Loader2, Flag } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function SimulationPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id as string;
  
  // States
  const [messages, setMessages] = useState<{role: string; content: string; turn_index: number}[]>([]);
  const [personaConfig, setPersonaConfig] = useState<{role: string; industry: string} | null>(null);
  const [answer, setAnswer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const PERSONA_LABELS: Record<string, string> = {
    investor: 'AI-Инвестор',
    tech_lead: 'CEO / Техдир',
    hr: 'HR-Менеджер',
    listener: 'Скептик из зала',
  };

  useEffect(() => {
    async function loadHistory() {
      if (!sessionId) return;
      try {
        const res = await api.get(`/simulation/${sessionId}/history`);
        setMessages(res.messages || []);
        if (res.persona_config) setPersonaConfig(res.persona_config);
      } catch (err: unknown) {
        toast.error('Ошибка загрузки симуляции');
        router.push('/simulation');
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [sessionId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    const currentAnswer = answer;
    
    // Add optimistic user message for instant UI feedback
    const optimisticUserMsg = { role: 'user', content: currentAnswer, turn_index: 999 };
    setMessages(prev => [...prev, optimisticUserMsg]);
    setAnswer("");
    
    try {
      const res = await api.post(`/simulation/${sessionId}/message`, { content: currentAnswer });
      setMessages(prev => {
        const filtered = prev.filter(m => m !== optimisticUserMsg);
        return [...filtered, res.user_message, res.assistant_message];
      });
    } catch(err: unknown) {
      const message = err instanceof Error ? err.message : 'Сбой сети';
      toast.error('Ошибка отправки сообщения: ' + message);
      setAnswer(currentAnswer); // restore
      setMessages(prev => prev.filter(m => m !== optimisticUserMsg)); // remove optimistic
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleComplete = async () => {
    if (messages.filter(m => m.role === 'user').length === 0) {
      toast.error('Ответьте хотя бы на один вопрос перед завершением.');
      return;
    }
    
    setIsCompleting(true);
    try {
      await api.post(`/simulation/${sessionId}/complete`);
      setIsFinished(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Сбой сети';
      toast.error('Ошибка завершения сессии: ' + message);
      setIsCompleting(false);
    }
  };

  if (isLoading) {
      return (
          <div className="flex-1 w-full max-w-4xl mx-auto flex items-center justify-center min-h-[calc(100vh-2rem)]">
              <Loader2 className="animate-spin text-[var(--accent-primary)]" size={32} />
          </div>
      );
  }

  const personaLabel = PERSONA_LABELS[personaConfig?.role ?? ''] || personaConfig?.role || 'Тренер';

  if (isFinished) {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-10 w-full"
        >
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-syne font-bold text-[var(--text-main)] mb-4">
            Тренировка завершена!
          </h2>
          <p className="text-[var(--text-dim)] mb-8 max-w-md mx-auto">
            Сессия была успешно завершена. {personaLabel} проанализировал ваши ответы — ознакомьтесь с подробным отчетом по вашим навыкам.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
            >
              В дашборд
            </button>
            <button
              onClick={() => router.push(`/simulation/${sessionId}/report`)}
              className="btn-primary"
            >
              Посмотреть полный отчет
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Find the last assistant message to display as the current question
  const aiMessages = messages.filter(m => m.role === 'assistant');
  const lastQuestion = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].content : "Загрузка вопроса...";
  const turnCount = aiMessages.length;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col p-4 md:p-8 min-h-[calc(100vh-2rem)] relative">
      <div className="w-full mb-8 pt-4">
        {/* Шапка */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-full flex items-center justify-center text-[var(--accent-primary)]">
              <Bot size={20} />
            </div>
            <div>
              <div className="font-mono text-xs text-[var(--accent-primary)] tracking-wider uppercase mb-1">
                {personaLabel}
              </div>
              <div className="text-sm text-[var(--text-dim)] border border-[var(--border-main)] rounded-full px-2 py-0.5 inline-block text-[10px] uppercase tracking-wider font-mono">
                Тренировка
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm text-[var(--text-dim)] mb-2">
              Вопрос {turnCount}
            </div>
            <button 
                onClick={handleComplete}
                disabled={isCompleting || isAnalyzing}
                className="text-xs font-mono border border-[var(--border-main)] hover:border-[var(--accent-primary)] bg-[var(--bg-surface)] hover:bg-[var(--accent-primary)]/10 text-[var(--text-muted)] hover:text-[var(--accent-primary)] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
                {isCompleting ? <Loader2 size={12} className="animate-spin" /> : <Flag size={12} />}
                Завершить симуляцию
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`qa-step-${turnCount}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-3xl mx-auto"
          >
            {/* Карточка Вопроса */}
            <div className="mb-8 p-6 bg-[var(--bg-surface-alt)] border border-[var(--border-light)] rounded-2xl relative shadow-sm">
              <div className="absolute -left-3 -top-3 text-[var(--accent-primary)] bg-[var(--bg-main)] rounded-full p-1 opacity-50">
                <Bot size={24} />
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-syne font-medium leading-tight text-[var(--text-main)]">
                {lastQuestion}
              </h1>
            </div>

            {/* Ввод ответа */}
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={`Ваш ответ ${personaLabel}...`}
                autoFocus
                disabled={isAnalyzing}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 min-h-[160px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all resize-none shadow-sm"
                style={{ fontSize: '16px' }}
              />
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  {answer.length} символов
                </div>
                <button
                  type="submit"
                  disabled={!answer.trim() || isAnalyzing}
                  className="btn-primary group disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Анализ нейросетью...
                    </>
                  ) : (
                    <>
                      Ответить
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
