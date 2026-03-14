'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowRight, ShieldAlert, CheckCircle2, TrendingDown, RefreshCcw, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const MOCK_QUESTIONS = [
  {
    id: 1,
    text: "Вы просите 10 млн рублей на маркетинг, но у вас еще нет продукта. На что конкретно пойдут эти деньги?",
    type: "Финансы",
  },
  {
    id: 2,
    text: "Чем ваш продукт концептуально лучше конкурента X, у которого уже 100 000 активных пользователей?",
    type: "Конкуренция",
  },
  {
    id: 3,
    text: "Что вы будете делать, если через полгода закончатся деньги, а заявленые метрики так и не вырастут?",
    type: "Риски",
  },
];

export default function SimulationPage() {
  const router = useRouter();
  
  // States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<{
    badge: 'success' | 'warning' | 'error';
    badgeText: string;
    comment: string;
  } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const question = MOCK_QUESTIONS[currentIdx];
  const progress = ((currentIdx) / MOCK_QUESTIONS.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsAnalyzing(true);
    
    // Эмуляция задержки ответа от AI
    setTimeout(() => {
      setIsAnalyzing(false);
      
      // Простая логика фидбека для MVP (зависит от длины ответа)
      if (answer.length < 30) {
        setFeedback({
          badge: 'error',
          badgeText: 'Слишком коротко',
          comment: 'Вы ушли от ответа. Инвестору нужна конкретика и цифры, а не общие фразы. Попытайтесь привести хотя бы 2 аргумента.',
        });
      } else if (answer.toLowerCase().includes('не знаю') || answer.toLowerCase().includes('посмотрим')) {
        setFeedback({
          badge: 'warning',
          badgeText: 'Неуверенность',
          comment: 'Слова-маркеры выдают вашу неуверенность. В стрессовой ситуации лучше сказать "Мы тестируем две гипотезы", чем "Не знаю".',
        });
      } else {
        setFeedback({
          badge: 'success',
          badgeText: 'Отличный аргумент',
          comment: 'Хороший, четкий ответ. Вы не стали лить воду и сразу перешли к сути. Это то, что хотят слышать.',
        });
      }
    }, 1500);
  };

  const handleNext = () => {
    if (currentIdx < MOCK_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setAnswer("");
      setFeedback(null);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-10 w-full"
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-6 text-center">
            <p className="text-slate-400">Выберите &quot;Собеседование&quot; для начала</p>
          </div>
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-syne font-bold text-[var(--text-main)] mb-4">
            Стресс-тест пройден!
          </h2>
          <p className="text-[var(--text-dim)] mb-8 max-w-md mx-auto">
            Вы ответили на все 3 каверзных вопроса. Ваш итоговый AI-скор и полный разбор ответов уже готов в отчете.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
            >
              В дашборд
            </button>
            <button
              onClick={() => router.push('/analysis/mock-123')}
              className="btn-primary"
            >
              Посмотреть полный отчет
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col p-4 md:p-8 min-h-[calc(100vh-2rem)] relative">
      <div className="w-full mb-8 pt-4">
        {/* Шапка с прогрессом */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 rounded-full flex items-center justify-center text-[var(--accent-blue)]">
              <Bot size={20} />
            </div>
            <div>
              <div className="font-mono text-xs text-[var(--accent-blue)] tracking-wider uppercase mb-1">
                Бот-Инвестор
              </div>
              <div className="text-sm text-[var(--text-dim)] border border-[var(--border-main)] rounded-full px-2 py-0.5 inline-block text-[10px] uppercase tracking-wider font-mono">
                {question.type}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm text-[var(--text-dim)]">
              Вопрос {currentIdx + 1} / {MOCK_QUESTIONS.length}
            </div>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="w-full h-1 bg-[var(--border-main)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--accent-blue)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`qa-step-${currentIdx}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-3xl mx-auto"
          >
            {/* Карточка Вопроса */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-syne font-semibold leading-tight text-[var(--text-main)]">
                &quot;{question.text}&quot;
              </h1>
            </div>

            {/* Карточка ответа / фидбека */}
            {!feedback ? (
              <form onSubmit={handleSubmit} className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Ваш ответ инвестору..."
                  autoFocus
                  disabled={isAnalyzing}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 min-h-[160px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all resize-none shadow-sm"
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
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`rounded-2xl border p-6 ${
                  feedback.badge === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  feedback.badge === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                  'bg-rose-500/5 border-rose-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  {feedback.badge === 'success' && <CheckCircle2 className="text-emerald-500" size={20} />}
                  {feedback.badge === 'warning' && <ShieldAlert className="text-amber-500" size={20} />}
                  {feedback.badge === 'error' && <TrendingDown className="text-rose-500" size={20} />}
                  
                  <span className={`font-mono text-xs uppercase tracking-wider font-semibold ${
                    feedback.badge === 'success' ? 'text-emerald-500' :
                    feedback.badge === 'warning' ? 'text-amber-500' :
                    'text-rose-500'
                  }`}>
                    {feedback.badgeText}
                  </span>
                </div>
                
                <p className="text-[var(--text-main)] leading-relaxed mb-6">
                  {feedback.comment}
                </p>

                <div className="flex justify-between items-center bg-[var(--bg-main)]/50 rounded-xl p-4 border border-[var(--border-light)]">
                  <div className="text-sm text-[var(--text-dim)] truncate max-w-[60%] italic">
                    &laquo;{answer}&raquo;
                  </div>
                  <button
                    onClick={handleNext}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                  >
                    Дальше
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
