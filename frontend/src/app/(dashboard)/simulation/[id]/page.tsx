'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowRight, CheckCircle2, Loader2, Flag, AlertTriangle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useBillingStore } from '@/store/billingStore';
import { UpgradeModal } from '@/components/UpgradeModal';

export default function SimulationPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id as string;
  
  // Billing
  const { upgradeModalOpen, upgradeModalReason, openUpgradeModal, closeUpgradeModal } = useBillingStore();

  // States
  const [messages, setMessages] = useState<{role: string; content: string; turn_index: number}[]>([]);
  const [personaConfig, setPersonaConfig] = useState<{role: string; industry: string} | null>(null);
  const [answer, setAnswer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [aiWarning, setAiWarning] = useState(false);

  // Refs for beforeunload beacon (can't use state inside event handler reliably)
  const authTokenRef = useRef<string | null>(null);
  const isFinishedRef = useRef(false);

  const PERSONA_LABELS: Record<string, string> = {
    supervisor: 'Научный руководитель',
    reviewer: 'Придирчивый рецензент',
    peer: 'Однокурсник-скептик',
    tech_lead: 'Тимлид / Principal Engineer',
    hr: 'HR-менеджер',
    senior_dev: 'Старший разработчик',
    investor: 'Венчурный инвестор',
    partner: 'Корпоративный партнёр',
    customer: 'Потенциальный клиент',
    board: 'Совет директоров',
    subordinate: 'Скептичный подчинённый',
    journalist: 'Журналист',
    audience: 'Общая аудитория',
    moderator: 'Модератор дискуссии',
    listener: 'Скептик из зала',
  };

  // Dative case — "Ваш ответ [кому]..."
  const PERSONA_DATIVE: Record<string, string> = {
    supervisor: 'научному руководителю',
    reviewer: 'придирчивому рецензенту',
    peer: 'однокурснику-скептику',
    tech_lead: 'тимлиду',
    hr: 'HR-менеджеру',
    senior_dev: 'старшему разработчику',
    investor: 'венчурному инвестору',
    partner: 'корпоративному партнёру',
    customer: 'потенциальному клиенту',
    board: 'совету директоров',
    subordinate: 'скептичному подчинённому',
    journalist: 'журналисту',
    audience: 'аудитории',
    moderator: 'модератору дискуссии',
    listener: 'скептику из зала',
  };

  // Keep isFinishedRef in sync so beforeunload can read it synchronously
  useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);

  // Cache the Supabase auth token so it's available in the synchronous beforeunload handler
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        authTokenRef.current = session?.access_token ?? null;
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        authTokenRef.current = session?.access_token ?? null;
      });
      cleanup = () => subscription.unsubscribe();
    });
    return () => cleanup?.();
  }, []);

  // Fire-and-forget abandon signal when user closes the tab
  useEffect(() => {
    if (!sessionId) return;
    const handleBeforeUnload = () => {
      if (isFinishedRef.current || !authTokenRef.current) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      fetch(`${apiUrl}/simulation/${sessionId}/abandon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authTokenRef.current}` },
        keepalive: true,
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId]);

  useEffect(() => {
    async function loadHistory() {
      if (!sessionId) return;
      try {
        const res = await api.get(`/simulation/${sessionId}/history`);
        // Redirect away from chat if session is no longer active
        if (res.status === 'completed') {
          router.replace(`/simulation/${sessionId}/report`);
          return;
        }
        if (res.status === 'cancelled') {
          router.replace('/simulation');
          return;
        }
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
    setAiWarning(false);
    const currentAnswer = answer;

    // Add optimistic user message for instant UI feedback
    const optimisticUserMsg = { role: 'user', content: currentAnswer, turn_index: 999 };
    setMessages(prev => [...prev, optimisticUserMsg]);
    setAnswer("");

    try {
      const res = await api.post(`/simulation/${sessionId}/message`, { content: currentAnswer });

      // AI-generated content detected — reject the answer, let user rewrite
      if (res.ai_detected) {
        setMessages(prev => prev.filter(m => m !== optimisticUserMsg));
        setAnswer(currentAnswer);
        setAiWarning(true);
        return;
      }

      setMessages(prev => {
        const filtered = prev.filter(m => m !== optimisticUserMsg);
        const newMsgs = [res.user_message, ...(res.assistant_message ? [res.assistant_message] : [])];
        return [...filtered, ...newMsgs];
      });
      if (res.session_completed) {
        setIsFinished(true);
      }
    } catch(err: unknown) {
      const message = err instanceof Error ? err.message : 'Сбой сети';
      // Detect 402-style limit errors and show upgrade modal
      const isLimitError =
        message.toLowerCase().includes('лимит') ||
        message.toLowerCase().includes('limit') ||
        message.toLowerCase().includes('exceeded') ||
        message.toLowerCase().includes('симуляц');
      if (isLimitError) {
        openUpgradeModal('simulations');
      } else {
        toast.error('Ошибка отправки сообщения: ' + message);
      }
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
  const personaDative = PERSONA_DATIVE[personaConfig?.role ?? ''] ?? personaLabel.toLowerCase();

  if (isFinished) {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 sm:p-10 w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6">
            <CheckCircle2 size={32} className="sm:hidden" />
            <CheckCircle2 size={40} className="hidden sm:block" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-syne font-bold text-[var(--text-main)] mb-3 sm:mb-4">
            Тренировка завершена!
          </h2>
          <p className="text-[var(--text-dim)] mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
            Сессия была успешно завершена. {personaLabel} проанализировал ваши ответы — ознакомьтесь с подробным отчетом по вашим навыкам.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary min-h-[44px]"
            >
              В дашборд
            </button>
            <button
              onClick={() => router.push(`/simulation/${sessionId}/report`)}
              className="btn-primary min-h-[44px]"
            >
              Посмотреть полный отчет
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const MAX_TURNS = 10;

  // Find the last assistant message to display as the current question
  const aiMessages = messages.filter(m => m.role === 'assistant');
  const lastQuestion = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].content : "Загрузка вопроса...";
  const turnCount = aiMessages.length;
  const progressPct = Math.min((turnCount / MAX_TURNS) * 100, 100);
  const isLastQuestion = turnCount >= MAX_TURNS;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col p-3 sm:p-4 md:p-8 min-h-[calc(100vh-2rem)] relative">
      <UpgradeModal isOpen={upgradeModalOpen} onClose={closeUpgradeModal} reason={upgradeModalReason} />
      <div className="w-full mb-5 sm:mb-8 pt-2 sm:pt-4">
        {/* Шапка */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-full flex items-center justify-center text-[var(--accent-primary)]">
              <Bot size={16} className="sm:hidden" />
              <Bot size={20} className="hidden sm:block" />
            </div>
            <div>
              <div className="font-mono text-[10px] sm:text-xs text-[var(--accent-primary)] tracking-wider uppercase mb-0.5 sm:mb-1 truncate max-w-[140px] sm:max-w-none">
                {personaLabel}
              </div>
              <div className="text-sm text-[var(--text-dim)] border border-[var(--border-main)] rounded-full px-2 py-0.5 inline-block text-[10px] uppercase tracking-wider font-mono">
                Тренировка
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <div className="font-mono text-xs text-[var(--text-dim)]">
                Вопрос <span className="text-[var(--text-main)] font-semibold">{turnCount}</span> из {MAX_TURNS}
              </div>
            </div>
            <button
              onClick={handleComplete}
              disabled={isCompleting || isAnalyzing}
              className="text-xs font-mono border border-[var(--border-main)] hover:border-red-500/50 bg-[var(--bg-surface)] hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 sm:gap-1.5 disabled:opacity-40 min-h-[36px]"
            >
              {isCompleting ? <Loader2 size={12} className="animate-spin" /> : <Flag size={12} />}
              <span className="hidden sm:inline">Завершить досрочно</span>
              <span className="sm:hidden">Завершить</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[var(--bg-surface-alt)] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors ${isLastQuestion ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1 sm:hidden">
          <span className="font-mono text-[10px] text-[var(--text-dim)]">Вопрос {turnCount} из {MAX_TURNS}</span>
          {isLastQuestion && (
            <span className="font-mono text-[10px] text-emerald-500">Последний вопрос!</span>
          )}
        </div>
        {isLastQuestion && (
          <div className="hidden sm:block text-right mt-1">
            <span className="font-mono text-[10px] text-emerald-500">Последний вопрос!</span>
          </div>
        )}
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
            <div className="mb-5 sm:mb-8 p-4 sm:p-6 bg-[var(--bg-surface-alt)] border border-[var(--border-light)] rounded-2xl relative shadow-sm">
              <div className="absolute -left-2 -top-2 sm:-left-3 sm:-top-3 text-[var(--accent-primary)] bg-[var(--bg-main)] rounded-full p-1 opacity-50">
                <Bot size={18} className="sm:hidden" />
                <Bot size={24} className="hidden sm:block" />
              </div>
              <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-syne font-medium leading-tight text-[var(--text-main)]">
                {lastQuestion}
              </h1>
            </div>

            {/* AI detection warning */}
            <AnimatePresence>
              {aiWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4 flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl"
                >
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Обнаружен ИИ-сгенерированный ответ</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Тренер видит, что текст написан нейросетью. Напишите ответ своими словами — только так вы получите честную оценку и реальную пользу от тренировки.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ввод ответа */}
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={answer}
                onChange={(e) => { setAnswer(e.target.value); if (aiWarning) setAiWarning(false); }}
                placeholder={`Ваш ответ ${personaDative}...`}
                autoFocus
                disabled={isAnalyzing}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-6 min-h-[140px] sm:min-h-[160px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all resize-none shadow-sm"
                style={{ fontSize: '16px' }}
              />

              <div className="mt-3 sm:mt-4 flex justify-between items-center gap-3">
                <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider shrink-0">
                  {answer.length} симв.
                </div>
                <button
                  type="submit"
                  disabled={!answer.trim() || isAnalyzing}
                  className="btn-primary group disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px] flex-1 sm:flex-none justify-center sm:justify-start"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span className="hidden sm:inline">Анализ нейросетью...</span>
                      <span className="sm:hidden">Анализ...</span>
                    </>
                  ) : (
                    <>
                      Ответить
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
