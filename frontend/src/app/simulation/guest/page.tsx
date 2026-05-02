'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Lock, Timer, UserRound, Briefcase, TrendingUp } from 'lucide-react';
import { sendGuestMessage, startGuestSession } from '@/lib/guest-api';

type Step = 'input' | 'chat' | 'paywall';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const PERSONAS = [
  { id: 'cfo', label: 'Руководитель', note: 'бюджет, ресурсы, сроки', icon: Briefcase },
  { id: 'client', label: 'Клиент', note: 'ценность, доверие, продление', icon: UserRound },
  { id: 'investor', label: 'Инвестор', note: 'рост, рынок, риски', icon: TrendingUp },
];

const DIFFICULTIES = [
  { value: 1, label: 'Спокойно' },
  { value: 3, label: 'Рабоче' },
  { value: 5, label: 'Жёстко' },
];

const MAX_GUEST_TURNS = 3;
const MAX_TEXT_LENGTH = 8000;
const SAMPLE_TEXT = 'Нужно защитить бюджет внедрения. Если сократить расходы сейчас, релиз сдвинется на месяц, а команда потеряет окно у ключевого клиента.';

const safariMotionStyle: React.CSSProperties = {
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
  WebkitTransform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
};

function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/[0.08] bg-white px-5 sm:px-8">
      <Link
        href="/"
        className="flex items-center gap-2 transition-opacity hover:opacity-75"
        aria-label="PeakTalk"
      >
        <Image src="/logo_svg.svg" alt="PeakTalk" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" />
        <span className="brand-wordmark text-[18px] text-neutral-950">PeakTalk</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-neutral-950"
        >
          Вход
        </Link>
        <Link
          href="/scenarios"
          className="inline-flex min-h-[44px] items-center justify-center border border-neutral-950 bg-neutral-950 px-5 font-inter text-[13px] font-bold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]"
        >
          Сценарии
        </Link>
      </div>
    </header>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400 ${className}`}>
      {children}
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function GuestSimulationPage() {
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('cfo');
  const [selectedDifficulty, setSelectedDifficulty] = useState(3);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [turn, setTurn] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [error, setError] = useState<string | null>(null);
  const [hasScenarioParam, setHasScenarioParam] = useState(false);

  const answerRef = useRef<HTMLTextAreaElement>(null);
  const currentPersona = PERSONAS.find((persona) => persona.id === selectedPersona) ?? PERSONAS[0];
  const isReady = text.trim().length >= 20;
  const currentQuestion = messages.filter((message) => message.role === 'assistant').at(-1)?.content ?? 'Анализ вводных данных...';
  const progress = Math.min((turn / MAX_GUEST_TURNS) * 100, 100);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isFromScenario = params.get('from_scenario') === 'true';
    if (isFromScenario) {
      const ctx = localStorage.getItem('peaktalk_guest_context');
      if (ctx) {
        setHasScenarioParam(true);
        setText(ctx);
      }
    }
    const p = params.get('persona');
    
    // Map scenario categories to our 3 guest personas, or just use the exact match
    const mapped = p === 'investors' ? 'investor' : p === 'clients' ? 'client' : p === 'cfo' || p === 'budget' || p === 'roadmap' || p === 'people' || p === 'crisis' ? 'cfo' : p;
    if (mapped && PERSONAS.some(x => x.id === mapped)) setSelectedPersona(mapped);
    const d = params.get('difficulty');
    if (d) {
      const requestedDifficulty = Number(d);
      const closestDifficulty = DIFFICULTIES.reduce((closest, item) =>
        Math.abs(item.value - requestedDifficulty) < Math.abs(closest.value - requestedDifficulty)
          ? item
          : closest,
      DIFFICULTIES[1]);
      setSelectedDifficulty(closestDifficulty.value);
    }
  }, []);

  const transcript = useMemo(() => {
    return messages.reduce<Array<{ question?: string; answer?: string }>>((acc, message) => {
      if (message.role === 'assistant') {
        acc.push({ question: message.content });
        return acc;
      }
      const last = acc.at(-1);
      if (last && !last.answer) last.answer = message.content;
      return acc;
    }, []);
  }, [messages]);

  useEffect(() => {
    if (step === 'chat') {
      setTimeout(() => answerRef.current?.focus(), 100);
    }
  }, [step, turn]);

  useEffect(() => {
    if (step !== 'chat' || isLoading || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearInterval(interval);
  }, [step, isLoading, timeLeft]);

  const handleStart = async () => {
    if (!isReady || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await startGuestSession(text, selectedPersona, selectedDifficulty);
      setGuestSessionId(response.guest_session_id);
      setMessages([{ role: 'assistant', content: response.first_question }]);
      setTurn(1);
      setTimeLeft(90);
      setStep('chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка инициализации сессии');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnswer = useCallback(async (timeoutAnswer?: string) => {
    const nextAnswer = (timeoutAnswer ?? answer).trim();
    if (!nextAnswer || !guestSessionId || isLoading) return;

    if (!timeoutAnswer) setAnswer('');
    setIsLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: nextAnswer }]);

    try {
      const response = await sendGuestMessage(guestSessionId, nextAnswer);

      if (response.limit_reached) {
        localStorage.setItem('peaktalk_guest_session_id', guestSessionId);
        localStorage.setItem('peaktalk_guest_difficulty', String(selectedDifficulty));
        setStep('paywall');
        return;
      }

      if (response.question) {
        setMessages((prev) => [...prev, { role: 'assistant', content: response.question! }]);
        setTurn((value) => value + 1);
        setTimeLeft(90);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки данных');
      if (!timeoutAnswer) setAnswer(nextAnswer);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [answer, guestSessionId, isLoading, selectedDifficulty]);

  useEffect(() => {
    if (step !== 'chat' || timeLeft > 0 || isLoading) return;
    void handleSendAnswer(answer.trim() || '[Истекло время на ответ]');
  }, [answer, handleSendAnswer, isLoading, step, timeLeft]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <AnimatePresence mode="wait">

          {/* INPUT STATE */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={safariMotionStyle}
            >
              <div className="mb-4">
                <Label className="mb-2 text-[#E8600A]">бесплатная проверка</Label>
                <h1 className="font-display text-[32px] font-black leading-[1.05] text-neutral-950 sm:text-[42px]">
                  Настройка симуляции
                </h1>
                <p className="mt-3 max-w-2xl font-inter text-[16px] leading-relaxed text-neutral-600">
                  Подготовьтесь к сложной встрече. Задайте контекст, выберите профиль оппонента и уровень жесткости.
                </p>
              </div>

              <div className="border border-neutral-200 bg-white">
                <div className="p-4 sm:p-6">
                  {/* Persona Selection */}
                  {!hasScenarioParam && (
                    <div className="mb-6">
                      <Label className="mb-3">оппонент</Label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {PERSONAS.map((persona) => {
                          const isSelected = selectedPersona === persona.id;
                          const Icon = persona.icon;
                          return (
                            <button
                              key={persona.id}
                              type="button"
                              onClick={() => setSelectedPersona(persona.id)}
                              className={`group flex flex-col items-start gap-3 border p-4 text-left transition-all duration-200 ${
                                isSelected
                                  ? 'border-[#E8600A] bg-[#E8600A]/[0.04]'
                                  : 'border-neutral-200 bg-white hover:border-neutral-400'
                              }`}
                            >
                              <Icon size={20} className={isSelected ? 'text-[#E8600A]' : 'text-neutral-400 group-hover:text-neutral-600'} />
                              <div>
                                <span className={`block text-[16px] font-bold ${isSelected ? 'text-neutral-950' : 'text-neutral-700'}`}>
                                  {persona.label}
                                </span>
                                <span className="mt-1 block text-[13px] leading-relaxed text-neutral-500">
                                  {persona.note}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Context Input */}
                  <div className={hasScenarioParam ? '' : 'mb-6'}>
                    {!hasScenarioParam ? (
                      <>
                        <div className="mb-3 flex items-center justify-between">
                          <Label>контекст встречи</Label>
                          <span className="font-mono text-[10px] text-neutral-300">{text.length}/{MAX_TEXT_LENGTH}</span>
                        </div>
                        <div>
                          <textarea
                            id="meeting-material"
                            value={text}
                            onChange={(event) => setText(event.target.value.slice(0, MAX_TEXT_LENGTH))}
                            placeholder="Опишите ситуацию. Например: тезисы защиты бюджета, спорный момент с клиентом, запрос инвестиций..."
                            className="h-[120px] w-full resize-none border border-neutral-200 bg-[#faf8f4] p-4 font-inter text-[15px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 transition-colors"
                          />
                          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-inter text-[13px] leading-relaxed text-neutral-500 sm:max-w-[85%]">
                              Не вставляйте пароли, персональные данные и коммерческие тайны. Материал нужен только для проверки в этой сессии.
                            </p>
                            <button
                              type="button"
                              onClick={() => setText(SAMPLE_TEXT)}
                              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-700 transition-colors hover:text-neutral-950"
                            >
                              [вставить пример]
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mb-2 bg-neutral-50 border border-neutral-200 p-5">
                        <Label className="mb-2 text-[#E8600A]">готовый сценарий</Label>
                        <p className="font-inter text-[15px] leading-relaxed text-neutral-700">
                          Контекст и вводные данные успешно загружены. Вы можете сразу начинать симуляцию.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Difficulty & Start */}
                  <div className={`flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between ${hasScenarioParam ? 'mt-6' : 'border-t border-neutral-200 pt-6'}`}>
                    {!hasScenarioParam && (
                      <div className="pt-2">
                        <Label className="mb-3">уровень давления</Label>
                        <div className="flex gap-2">
                          {DIFFICULTIES.map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => setSelectedDifficulty(item.value)}
                              className={`min-h-[44px] px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                                selectedDifficulty === item.value
                                  ? 'bg-neutral-950 text-white shadow-md'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {hasScenarioParam && (
                      <div className="pt-2">
                        <div className="flex items-center gap-2">
                          <Label>Сложность: {DIFFICULTIES.find(d => d.value === selectedDifficulty)?.label || 'Рабоче'}</Label>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col items-end gap-2">
                      {error && (
                        <div className="font-mono text-[10px] uppercase tracking-widest text-red-500">{error}</div>
                      )}
                      <button
                        type="button"
                        onClick={handleStart}
                        disabled={!isReady || isLoading}
                        className="group flex min-h-[52px] w-full items-center justify-center gap-3 border border-[#E8600A] bg-[#E8600A] px-8 text-[14px] font-bold text-white shadow-lg shadow-[#E8600A]/20 transition-all duration-200 hover:border-[#B74707] hover:bg-[#B74707] hover:shadow-xl hover:shadow-[#E8600A]/30 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none sm:w-auto"
                      >
                        {isLoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            Начать тест
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                      <span className="font-mono text-[10px] text-neutral-400">без регистрации</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CHAT STATE */}
          {step === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={safariMotionStyle}
            >
              {/* Header row */}
              <div className="mb-5 flex flex-col gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-[#E8600A] animate-pulse" />
                    <Label>живая симуляция</Label>
                  </div>
                  <h1 className="mt-3 font-display text-3xl font-black text-neutral-950 sm:text-4xl">
                    Раунд 0{Math.min(turn, MAX_GUEST_TURNS)} / 0{MAX_GUEST_TURNS}
                  </h1>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <Label className="mb-1">оппонент</Label>
                    <div className="font-inter text-sm font-bold text-neutral-950">{currentPersona.label}</div>
                  </div>
                  <div className={`flex flex-col items-end border-l border-neutral-200 pl-6 ${timeLeft <= 15 ? 'text-[#E8600A]' : 'text-neutral-950'}`}>
                    <Label className="mb-1">таймер</Label>
                    <div className="flex items-center gap-2 font-mono text-xl tracking-tight font-bold">
                      <Timer size={20} className={timeLeft <= 15 ? 'animate-pulse' : ''} />
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6 h-px w-full bg-neutral-200">
                <div
                  className="h-full bg-[#E8600A] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Question card */}
              <div className="mb-4 border border-neutral-200 bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
                  <Label>входящий вопрос</Label>
                  <span className="font-mono text-[10px] font-bold text-[#E8600A]">
                    0{Math.min(turn, MAX_GUEST_TURNS)}/0{MAX_GUEST_TURNS}
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={turn}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="font-inter text-[18px] font-medium leading-relaxed text-neutral-950 sm:text-[20px]"
                  >
                    {currentQuestion}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Answer area */}
              <div className="mb-4 border border-neutral-200 bg-[#faf8f4] p-5 sm:p-6">
                <Label className="mb-4">ваш ответ</Label>
                <textarea
                  id="guest-answer"
                  ref={answerRef}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault();
                      void handleSendAnswer();
                    }
                  }}
                  placeholder="Ваш аргумент..."
                  disabled={isLoading}
                  className="w-full min-h-[120px] resize-none bg-transparent font-inter text-[15px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-300 disabled:opacity-50"
                />
                {error && (
                  <div className="mt-3 border-l-2 border-red-400 pl-3 font-mono text-[10px] uppercase text-red-500">
                    {error}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
                  <Label className="hidden sm:block">ctrl + enter</Label>
                  <button
                    type="button"
                    onClick={() => void handleSendAnswer()}
                    disabled={!answer.trim() || isLoading}
                    className="group flex min-h-[56px] w-full items-center justify-center gap-3 border border-[#E8600A] bg-[#E8600A] px-10 text-[15px] font-bold text-white shadow-lg shadow-[#E8600A]/20 transition-all duration-200 hover:border-[#B74707] hover:bg-[#B74707] hover:shadow-xl hover:shadow-[#E8600A]/30 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Анализ
                      </>
                    ) : (
                      <>
                        Ответить
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* History */}
              {transcript.length > 1 && (
                <div className="mt-8 opacity-50 transition-opacity hover:opacity-100">
                  <Label className="mb-4">лог симуляции</Label>
                  <div className="grid gap-3 border-l-2 border-neutral-200 pl-4">
                    {transcript.slice(0, -1).map((item, index) => (
                      <div key={index} className="grid gap-1.5">
                        <div className="flex gap-3">
                          <span className="font-mono text-[11px] font-bold text-neutral-400 pt-0.5">Q</span>
                          <p className="text-[15px] font-medium text-neutral-700">{item.question}</p>
                        </div>
                        {item.answer && (
                          <div className="flex gap-3">
                            <span className="font-mono text-[11px] font-bold text-[#E8600A] pt-0.5">A</span>
                            <p className="text-[15px] text-neutral-600">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* PAYWALL STATE */}
          {step === 'paywall' && (
            <motion.div
              key="paywall"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={safariMotionStyle}
            >
              <div className="mb-6">
                <Label className="mb-3 text-[#E8600A]">лимит исчерпан</Label>
                <h1 className="font-inter text-[28px] font-black leading-[1.08] text-neutral-950 sm:text-[36px]">
                  Демо-режим завершён
                </h1>
                <p className="mt-5 font-inter text-[17px] leading-relaxed text-neutral-600">
                  Вы прошли 3 вопроса. Зарегистрируйтесь, чтобы получить полный разбор, памятку перед встречей и доступ ко всем сценариям.
                </p>
              </div>

              <div className="border border-neutral-200 bg-white">
                <div className="border-b border-neutral-100 bg-[#faf8f4] px-5 py-3">
                  <Label>фрагмент анализа</Label>
                </div>
                <div className="p-5 sm:p-7">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white text-neutral-400">
                    <Lock size={18} />
                  </div>

                  <div className="border-l-2 border-[#E8600A] pl-4">
                    <p className="font-inter text-sm italic leading-relaxed text-neutral-600">
                      Оппонент отметил слабость в аргументации на втором шаге. Ваш ответ про...
                    </p>
                    <div className="mt-2 h-4 w-3/4 bg-gradient-to-r from-neutral-200 to-transparent blur-sm" />
                    <div className="mt-1 h-4 w-1/2 bg-gradient-to-r from-neutral-200 to-transparent blur-sm" />
                  </div>

                  <div className="mt-7 grid gap-3 border-t border-neutral-200 pt-7">
                    <Link
                      href="/register?return=/simulation/from-guest"
                      className="group flex min-h-[56px] w-full items-center justify-center gap-3 border border-[#E8600A] bg-[#E8600A] px-10 text-[15px] font-bold text-white shadow-lg shadow-[#E8600A]/20 transition-all duration-200 hover:border-[#B74707] hover:bg-[#B74707] hover:shadow-xl hover:shadow-[#E8600A]/30"
                    >
                      Разблокировать отчёт
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <p className="text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                      Сохранить прогресс и получить памятку
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
