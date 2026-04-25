'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2, Lock, Timer, UserRound, Briefcase, TrendingUp } from 'lucide-react';
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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
      <Link
        href="/"
        className="flex items-center gap-2.5 transition-opacity hover:opacity-75"
      >
        <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
        <span className="brand-wordmark text-[15px] text-neutral-900">PeakTalk</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="font-mono text-xs uppercase tracking-widest text-neutral-400 transition-colors hover:text-neutral-900"
        >
          Войти
        </Link>
        <Link
          href="/scenarios"
          className="border border-neutral-950 bg-neutral-950 px-4 py-2 font-inter text-xs font-semibold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]"
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

  const answerRef = useRef<HTMLTextAreaElement>(null);
  const currentPersona = PERSONAS.find((persona) => persona.id === selectedPersona) ?? PERSONAS[0];
  const isReady = text.trim().length >= 20;
  const currentQuestion = messages.filter((message) => message.role === 'assistant').at(-1)?.content ?? 'Анализ вводных данных...';
  const progress = Math.min((turn / MAX_GUEST_TURNS) * 100, 100);

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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
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
              <div className="mb-6">
                <Label className="mb-3 text-[#E8600A]">бесплатный pressure-test</Label>
                <h1 className="font-inter text-[32px] font-black leading-[1.04] text-neutral-950 sm:text-[40px]">
                  Настройка симуляции
                </h1>
                <p className="mt-4 max-w-xl font-inter text-[15px] leading-relaxed text-neutral-600">
                  Подготовьтесь к сложной встрече. Задайте контекст, выберите профиль оппонента и уровень жесткости.
                </p>
              </div>

              <div className="border border-neutral-200 bg-white">
                <div className="p-5 sm:p-7">
                  {/* Persona Selection */}
                  <div className="mb-7">
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
                            <Icon size={18} className={isSelected ? 'text-[#E8600A]' : 'text-neutral-400 group-hover:text-neutral-600'} />
                            <div>
                              <span className={`block text-[14px] font-bold ${isSelected ? 'text-neutral-950' : 'text-neutral-700'}`}>
                                {persona.label}
                              </span>
                              <span className="mt-0.5 block text-[11px] leading-relaxed text-neutral-500">
                                {persona.note}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Context Input */}
                  <div className="mb-7">
                    <div className="mb-3 flex items-center justify-between">
                      <Label>контекст встречи</Label>
                      <span className="font-mono text-[10px] text-neutral-300">{text.length}/{MAX_TEXT_LENGTH}</span>
                    </div>
                    <div className="relative">
                      <textarea
                        id="meeting-material"
                        value={text}
                        onChange={(event) => setText(event.target.value.slice(0, MAX_TEXT_LENGTH))}
                        placeholder="Опишите ситуацию. Например: тезисы защиты бюджета, спорный момент с клиентом, запрос инвестиций..."
                        className="h-[200px] w-full resize-none border border-neutral-200 bg-white p-4 font-inter text-[15px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-300 focus:border-neutral-400 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setText(SAMPLE_TEXT)}
                        className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#E8600A] transition-colors hover:text-[#FF8A3D]"
                      >
                        [вставить пример]
                      </button>
                    </div>
                  </div>

                  {/* Difficulty & Start */}
                  <div className="flex flex-col gap-5 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label className="mb-3">уровень давления</Label>
                      <div className="flex gap-2">
                        {DIFFICULTIES.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setSelectedDifficulty(item.value)}
                            className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-all ${
                              selectedDifficulty === item.value
                                ? 'bg-neutral-950 text-white font-bold'
                                : 'bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-400 hover:text-neutral-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {error && (
                        <div className="font-mono text-[10px] uppercase tracking-widest text-red-500">{error}</div>
                      )}
                      <button
                        type="button"
                        onClick={handleStart}
                        disabled={!isReady || isLoading}
                        className="group flex h-12 w-full items-center justify-center gap-3 bg-neutral-950 px-8 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#E8600A] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 sm:w-auto"
                      >
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            Начать тест
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
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
                    <Label>live simulation</Label>
                  </div>
                  <h1 className="mt-2 font-inter text-2xl font-black text-neutral-950">
                    Раунд 0{Math.min(turn, MAX_GUEST_TURNS)} / 0{MAX_GUEST_TURNS}
                  </h1>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <Label className="mb-1">оппонент</Label>
                    <div className="font-inter text-sm font-bold text-neutral-950">{currentPersona.label}</div>
                  </div>
                  <div className={`flex flex-col items-end border-l border-neutral-200 pl-5 ${timeLeft <= 15 ? 'text-[#E8600A]' : 'text-neutral-950'}`}>
                    <Label className="mb-1">таймер</Label>
                    <div className="flex items-center gap-2 font-mono text-lg tracking-tight font-bold">
                      <Timer size={16} className={timeLeft <= 15 ? 'animate-pulse' : ''} />
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
                    className="font-inter text-base font-medium leading-relaxed text-neutral-950 sm:text-lg"
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
                    className="group flex h-10 w-full items-center justify-center gap-2 bg-neutral-950 px-6 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#E8600A] disabled:bg-neutral-200 disabled:text-neutral-400 sm:w-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Анализ
                      </>
                    ) : (
                      <>
                        Ответить
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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
                          <span className="font-mono text-[10px] text-neutral-400 pt-0.5">Q</span>
                          <p className="text-sm font-medium text-neutral-700">{item.question}</p>
                        </div>
                        {item.answer && (
                          <div className="flex gap-3">
                            <span className="font-mono text-[10px] text-[#E8600A] pt-0.5">A</span>
                            <p className="text-sm text-neutral-500">{item.answer}</p>
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
                <p className="mt-4 font-inter text-[15px] leading-relaxed text-neutral-600">
                  Вы прошли 3 вопроса. Зарегистрируйтесь, чтобы получить полный разбор, prep-card и доступ ко всем сценариям.
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
                      className="group flex h-12 w-full items-center justify-center gap-3 bg-neutral-950 px-8 font-inter text-sm font-bold text-white transition-colors hover:bg-[#E8600A]"
                    >
                      Разблокировать отчёт
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <p className="text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                      Сохранить прогресс и получить prep-card
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
