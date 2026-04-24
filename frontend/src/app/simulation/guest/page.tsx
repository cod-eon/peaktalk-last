'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Loader2,
  Lock,
  Mic,
  Shield,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { startGuestSession, sendGuestMessage } from '@/lib/guest-api';

type Step = 'input' | 'chat' | 'paywall';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PERSONAS = [
  {
    id: 'cfo',
    label: 'CFO',
    subtitle: 'Финансовый директор',
    icon: DollarSign,
    description: 'Бьёт по ROI, unit-экономике, срокам окупаемости и допущениям.',
  },
  {
    id: 'investor',
    label: 'Инвестор',
    subtitle: 'Раунд / fundraising',
    icon: TrendingUp,
    description: 'Проверяет рынок, рост, риски и логику ставок в модели.',
  },
  {
    id: 'board_member',
    label: 'Совет',
    subtitle: 'Board / exec review',
    icon: Users,
    description: 'Режет roadmap, trade-offs и аргументацию по ресурсам.',
  },
  {
    id: 'client',
    label: 'Клиент',
    subtitle: 'QBR / renewal',
    icon: Briefcase,
    description: 'Требует доказать ценность, цифры результата и следующий шаг.',
  },
];

const DIFFICULTIES = [
  { value: 1, label: 'Мягко', note: 'проверка логики' },
  { value: 3, label: 'Стандартно', note: 'рабочее давление' },
  { value: 5, label: 'Жёстко', note: 'как на встрече' },
];

const MAX_GUEST_TURNS = 3;
const MAX_TEXT_LENGTH = 8000;

function Header({
  right,
}: {
  right?: React.ReactNode;
}) {
  return (
    <header className="h-14 border-b border-neutral-200 flex items-center justify-between px-4 sm:px-5 shrink-0 bg-white/95 backdrop-blur-sm relative z-10">
      <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
        <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
        <span className="brand-wordmark text-neutral-900 text-[15px]">PeakTalk</span>
      </Link>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </header>
  );
}

export default function GuestSimulationPage() {
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(3);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [turn, setTurn] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === 'chat') {
      textareaRef.current?.focus();
    }
  }, [step, turn]);

  useEffect(() => {
    if (step !== 'chat' || isLoading || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, isLoading, timeLeft]);

  const charsLeft = MAX_TEXT_LENGTH - text.length;
  const isReady = text.trim().length >= 20 && selectedPersona !== null;
  const currentPersona = PERSONAS.find((p) => p.id === selectedPersona) ?? null;
  const personaLabel = currentPersona?.label ?? '';
  const difficulty = DIFFICULTIES.find((d) => d.value === selectedDifficulty) ?? DIFFICULTIES[1];

  const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
  const currentQuestion = assistantMessages.length
    ? assistantMessages[assistantMessages.length - 1].content
    : 'Подготавливаем первый вопрос...';

  const transcript = messages.reduce<Array<{ question?: string; answer?: string }>>((acc, msg) => {
    if (msg.role === 'assistant') {
      acc.push({ question: msg.content });
      return acc;
    }
    const last = acc[acc.length - 1];
    if (last && !last.answer) {
      last.answer = msg.content;
    }
    return acc;
  }, []);

  const previousTranscript = transcript.slice(0, Math.max(0, transcript.length - 1));
  const progressPct = Math.min((turn / MAX_GUEST_TURNS) * 100, 100);
  const isWarningTime = timeLeft <= 15;

  const handleStart = async () => {
    if (!isReady || isLoading) return;
    setIsLoading(true);

    try {
      const res = await startGuestSession(text, selectedPersona!, selectedDifficulty);
      setGuestSessionId(res.guest_session_id);
      setMessages([{ role: 'assistant', content: res.first_question }]);
      setTurn(1);
      setTimeLeft(90);
      setStep('chat');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка запуска сессии';
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnswer = useCallback(async (timeoutAnswer?: string) => {
    const nextAnswer = (timeoutAnswer ?? answer).trim();
    if (!nextAnswer || !guestSessionId || isLoading) return;

    if (!timeoutAnswer) {
      setAnswer('');
    }

    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'user', content: nextAnswer }]);

    try {
      const res = await sendGuestMessage(guestSessionId, nextAnswer);

      if (res.limit_reached) {
        localStorage.setItem('peaktalk_guest_session_id', guestSessionId);
        localStorage.setItem('peaktalk_guest_difficulty', String(selectedDifficulty));
        setStep('paywall');
        return;
      }

      if (res.question) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.question! }]);
        setTurn((value) => value + 1);
        setTimeLeft(90);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка отправки сообщения';
      alert(msg);
      if (!timeoutAnswer) {
        setAnswer(nextAnswer);
      }
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [answer, guestSessionId, isLoading, selectedDifficulty]);

  useEffect(() => {
    if (step !== 'chat' || timeLeft > 0 || isLoading) return;
    void handleSendAnswer(answer.trim() ? answer : '[Время на ответ истекло, ответ не предоставлен]');
  }, [answer, handleSendAnswer, isLoading, step, timeLeft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleSendAnswer();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-white bg-page-geo-subtle flex flex-col">
        <Header
          right={
            <>
              <span className="hidden sm:inline-flex font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500 border border-neutral-200 px-2.5 py-1 bg-neutral-50">
                guest session
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E8600A] border border-[#E8600A]/20 px-2.5 py-1 bg-[#FEF3E8]">
                3 вопроса
              </span>
            </>
          }
        />

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10 relative z-10">
          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="border border-neutral-200 bg-white"
            >
              <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#E8600A] mb-3">
                  guest setup
                </div>
                <h1 className="font-inter text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-neutral-900 max-w-[18ch]">
                  Запустите 3 вопроса на своём документе
                </h1>
                <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-neutral-600">
                  Не demo-chat, а короткая продуктовая сессия: загрузите текст встречи, выберите роль оппонента и
                  получите первый stress-test до реального разговора.
                </p>
              </div>

              <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6">
                <div className="border border-neutral-200 bg-neutral-50">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                    <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-700">
                      Артефакт встречи
                    </label>
                    <span className={`font-mono text-[11px] ${charsLeft < 500 ? 'text-amber-600' : 'text-neutral-500'}`}>
                      {text.length} / {MAX_TEXT_LENGTH}
                    </span>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                      placeholder="Вставьте тезисы презентации, memo, QBR deck, roadmap или финмодели..."
                      className="min-h-[220px] w-full resize-none border border-neutral-200 bg-white px-4 py-4 text-[16px] leading-relaxed text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="border border-neutral-200 bg-white">
                    <div className="border-b border-neutral-200 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-700">
                      Кто будет спорить с решением
                    </div>
                    <div className="grid gap-2 p-3 sm:grid-cols-2">
                      {PERSONAS.map((persona) => {
                        const Icon = persona.icon;
                        const isSelected = selectedPersona === persona.id;

                        return (
                          <button
                            key={persona.id}
                            type="button"
                            onClick={() => setSelectedPersona(persona.id)}
                            className={`group border px-4 py-4 text-left transition-colors ${
                              isSelected
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center border ${
                                  isSelected
                                    ? 'border-white/20 bg-white/10 text-white'
                                    : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                                }`}
                              >
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-inter text-sm font-semibold leading-none">{persona.label}</div>
                                <div className={`mt-1 text-[11px] uppercase tracking-[0.14em] font-mono ${isSelected ? 'text-white/60' : 'text-neutral-400'}`}>
                                  {persona.subtitle}
                                </div>
                                <p className={`mt-3 text-[13px] leading-relaxed ${isSelected ? 'text-white/80' : 'text-neutral-600'}`}>
                                  {persona.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-neutral-200 bg-white">
                    <div className="border-b border-neutral-200 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-700">
                      Уровень давления
                    </div>
                    <div className="grid gap-2 p-3">
                      {DIFFICULTIES.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setSelectedDifficulty(item.value)}
                          className={`border px-4 py-3 text-left transition-colors ${
                            selectedDifficulty === item.value
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-200 bg-neutral-50 text-neutral-900 hover:border-neutral-400'
                          }`}
                        >
                          <div className="font-inter text-sm font-semibold">{item.label}</div>
                          <div className={`mt-1 font-mono text-[10px] uppercase tracking-[0.14em] ${selectedDifficulty === item.value ? 'text-white/60' : 'text-neutral-400'}`}>
                            {item.note}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                    Без регистрации. На своём кейсе. Сразу в продуктовый flow.
                  </p>
                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={!isReady || isLoading}
                    className="flex h-12 min-w-[220px] items-center justify-center gap-3 border border-neutral-900 bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Запустить 3 вопроса
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
              className="grid gap-4 self-start"
            >
              <div className="border border-neutral-200 bg-white">
                <div className="border-b border-neutral-200 px-4 py-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">guest mode</div>
                  <div className="mt-1 text-sm font-semibold text-neutral-900">Что проверит эта сессия</div>
                </div>
                <div className="grid gap-2 p-4">
                  {[
                    'Где ответы не держатся на цифрах',
                    'Какие допущения не защищены',
                    'Где вы уходите в общие формулировки',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                      <Sparkles size={13} className="mt-0.5 shrink-0 text-[#E8600A]" />
                      <span className="text-[13px] leading-relaxed text-neutral-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-neutral-200 bg-[#FCFCFD] px-4 py-4">
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">после 3 вопросов</div>
                <div className="grid gap-2">
                  {[
                    'Сохранение сессии',
                    'Полный разбор слабых мест',
                    'Prep-card перед встречей',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span className="text-[13px] leading-relaxed text-neutral-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'chat') {
    return (
      <div className="min-h-screen bg-white bg-page-geo-subtle flex flex-col">
        <Header
          right={
            <>
              <span className="hidden sm:inline-flex font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500 border border-neutral-200 px-2.5 py-1 bg-neutral-50">
                guest session
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-700 border border-neutral-200 px-2.5 py-1 bg-white">
                {personaLabel}
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 border ${
                  selectedDifficulty >= 5
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : selectedDifficulty >= 3
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                }`}
              >
                {difficulty.label}
              </span>
            </>
          }
        />

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-5 border border-neutral-200 bg-white">
              <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E8600A]">question flow</div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900">
                    Вопрос {Math.min(turn, MAX_GUEST_TURNS)} из {MAX_GUEST_TURNS}
                  </div>
                </div>
                <div className={`inline-flex items-center gap-2 border px-3 py-2 font-mono text-xs ${
                  timeLeft === 0
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : isWarningTime
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}>
                  <Timer size={14} className={isWarningTime && timeLeft > 0 ? 'animate-pulse' : ''} />
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="h-1.5 bg-neutral-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="h-full bg-neutral-900"
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid gap-4">
                <motion.section
                  key={`question-${turn}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="border border-neutral-200 bg-white"
                >
                  <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">Текущий вопрос</div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="mb-4 inline-flex items-center gap-2 border border-[#E8600A]/20 bg-[#FEF3E8] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-[#B45309]">
                      <Bot size={12} />
                      {personaLabel}
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-[30px] font-medium leading-tight text-neutral-900">
                      {currentQuestion}
                    </h1>
                  </div>
                </motion.section>

                <section className="border border-neutral-200 bg-white">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                      Ваш ответ
                    </div>
                    <div className="font-mono text-[11px] text-neutral-500">{answer.length} симв.</div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <AnimatePresence>
                      {timeLeft <= 15 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mb-4 flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-3"
                        >
                          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-700" />
                          <p className="text-[13px] leading-relaxed text-amber-800">
                            Времени мало. Лучше дать короткий и конкретный ответ, чем уйти в общие слова.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <textarea
                      ref={textareaRef}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Защитите решение коротко и по делу. Ctrl+Enter — отправить."
                      disabled={isLoading}
                      className={`min-h-[180px] w-full resize-none border px-4 py-4 text-[16px] leading-relaxed text-neutral-900 outline-none transition-all placeholder:text-neutral-400 ${
                        isLoading
                          ? 'border-neutral-200 bg-neutral-50'
                          : 'border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'
                      }`}
                    />

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled
                          className="flex h-12 w-12 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-400"
                          title="Voice input disabled in guest redesign preview"
                        >
                          <Mic size={18} />
                        </button>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                          Guest mode • 3 вопроса • без сохранения черновика
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleSendAnswer()}
                        disabled={!answer.trim() || isLoading}
                        className="flex h-12 min-w-[180px] items-center justify-center gap-3 border border-neutral-900 bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Анализ...
                          </>
                        ) : (
                          <>
                            Ответить
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="grid gap-4 self-start">
                <section className="border border-neutral-200 bg-white">
                  <div className="border-b border-neutral-200 px-4 py-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">Журнал сессии</div>
                  </div>
                  <div className="grid gap-3 p-4">
                    {previousTranscript.length === 0 ? (
                      <div className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">turn 01</div>
                        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
                          После первого ответа здесь появится краткая история предыдущих ходов.
                        </p>
                      </div>
                    ) : (
                      previousTranscript.map((item, index) => (
                        <div key={`${item.question}-${index}`} className="border border-neutral-200 bg-neutral-50 px-3 py-3">
                          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                            turn 0{index + 1}
                          </div>
                          <p className="mt-2 text-[13px] leading-relaxed text-neutral-700">{item.question}</p>
                          {item.answer ? (
                            <div className="mt-3 border-l-2 border-[#E8600A] pl-3">
                              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#B45309]">ваш ответ</div>
                              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{item.answer}</p>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="border border-neutral-200 bg-[#FCFCFD] px-4 py-4">
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">после guest test</div>
                  <div className="grid gap-2">
                    {[
                      'Сохранить сессию',
                      'Открыть полный разбор',
                      'Получить prep-card перед встречей',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span className="text-[13px] leading-relaxed text-neutral-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white bg-page-geo-subtle flex flex-col">
      <Header
        right={
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E8600A] border border-[#E8600A]/20 px-2.5 py-1 bg-[#FEF3E8]">
            guest complete
          </span>
        }
      />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="border border-neutral-200 bg-white p-5 sm:p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-400 mb-4">session snapshot</div>
            <div className="grid gap-3">
              {messages.slice(0, 4).map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`border px-4 py-3 ${
                    msg.role === 'assistant' ? 'border-neutral-200 bg-neutral-50' : 'border-[#F2C6A6] bg-[#FEF7F0]'
                  }`}
                >
                  <div className={`font-mono text-[10px] uppercase tracking-[0.14em] ${msg.role === 'assistant' ? 'text-neutral-400' : 'text-[#B45309]'}`}>
                    {msg.role === 'assistant' ? personaLabel || 'оппонент' : 'ваш ответ'}
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-700">{msg.content}</p>
                </div>
              ))}
            </div>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="border border-neutral-200 bg-white"
          >
            <div className="border-b border-neutral-200 px-5 py-5">
              <div className="flex h-12 w-12 items-center justify-center border border-[#E8600A]/20 bg-[#FEF3E8] text-[#E8600A]">
                <Lock size={18} />
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900">
                3 вопроса пройдены. Полный разбор открывается после сохранения сессии.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Guest-режим показал механику. Полная сессия сохраняет историю, открывает разбор слабых мест и даёт
                prep-card перед встречей.
              </p>
            </div>

            <div className="grid gap-3 px-5 py-5">
              {[
                'Полный pressure-test по документу',
                'Разбор слабых ответов и уязвимых допущений',
                'Prep-card, транскрипт и материалы на встречу',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span className="text-[13px] leading-relaxed text-neutral-700">{item}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 px-5 py-5">
              <Link
                href="/register?return=/simulation/from-guest"
                className="flex h-12 w-full items-center justify-center gap-2 border border-neutral-900 bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                Сохранить сессию и открыть разбор
                <ArrowRight size={16} />
              </Link>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                Включает отчёт, prep-card и возврат к сессии
              </p>
              <div className="mt-4 flex items-start gap-2 border border-neutral-200 bg-[#FCFCFD] px-3 py-3">
                <Shield size={14} className="mt-0.5 shrink-0 text-neutral-400" />
                <p className="text-[13px] leading-relaxed text-neutral-600">
                  Данные хранятся в российском контуре. Free-guest режим не включает автоподписку.
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
