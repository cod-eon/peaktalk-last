'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  Lock,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { startGuestSession, sendGuestMessage } from '@/lib/guest-api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'input' | 'chat' | 'paywall'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PERSONAS = [
  {
    id: 'cfo',
    label: 'CFO / Финансовый директор',
    icon: DollarSign,
    description: 'Задаёт жёсткие вопросы по unit-экономике и ROI',
  },
  {
    id: 'investor',
    label: 'Инвестор',
    icon: TrendingUp,
    description: 'Проверяет рыночные гипотезы и стратегию роста',
  },
  {
    id: 'board_member',
    label: 'Совет директоров',
    icon: Users,
    description: 'Оценивает стратегические решения и риски',
  },
  {
    id: 'client',
    label: 'Клиент',
    icon: Briefcase,
    description: 'Сомневается в ценности и сравнивает с альтернативами',
  },
]

const DIFFICULTIES = [
  { value: 1, label: 'Мягко' },
  { value: 3, label: 'Стандартно' },
  { value: 5, label: 'Жёстко' },
]

const MAX_GUEST_TURNS = 3
const MAX_TEXT_LENGTH = 8000

// ─── Component ───────────────────────────────────────────────────────────────

export default function GuestSimulationPage() {
  // Step state
  const [step, setStep] = useState<Step>('input')

  // Input form state
  const [text, setText] = useState('')
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(3)

  // Chat state
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [turn, setTurn] = useState(0)
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const chatBottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Derived ──────────────────────────────────────────────────────────────
  const charsLeft = MAX_TEXT_LENGTH - text.length
  const isReady =
    text.trim().length >= 20 && selectedPersona !== null

  const personaLabel =
    PERSONAS.find((p) => p.id === selectedPersona)?.label ?? ''
  const difficultyLabel =
    DIFFICULTIES.find((d) => d.value === selectedDifficulty)?.label ?? ''

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (!isReady || isLoading) return
    setIsLoading(true)
    try {
      const res = await startGuestSession(
        text,
        selectedPersona!,
        selectedDifficulty
      )
      setGuestSessionId(res.guest_session_id)
      setMessages([{ role: 'assistant', content: res.first_question }])
      setTurn(1)
      setStep('chat')
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Ошибка запуска сессии'
      alert(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAnswer = async () => {
    if (!answer.trim() || !guestSessionId || isLoading) return
    const currentAnswer = answer.trim()
    setAnswer('')
    setIsLoading(true)

    // Optimistic user message
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: currentAnswer },
    ])

    try {
      const res = await sendGuestMessage(guestSessionId, currentAnswer)

      if (res.limit_reached) {
        localStorage.setItem("peaktalk_guest_session_id", guestSessionId)
        localStorage.setItem("peaktalk_guest_difficulty", String(selectedDifficulty))
        setStep("paywall")
        return
      }

      if (res.question) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.question! },
        ])
        setTurn((t) => t + 1)
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Ошибка отправки сообщения'
      alert(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSendAnswer()
    }
  }

  // ── Render: Input step ───────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Minimal header */}
        <header className="h-14 border-b border-neutral-200 flex items-center px-5 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
            <span className="brand-wordmark text-neutral-900 text-[15px]">PeakTalk</span>
          </Link>
        </header>

        <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
          <div className="w-full max-w-2xl">
            {/* Title block */}
            <div className="mb-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500 border border-neutral-200 px-3 py-1.5 inline-block mb-4">
                Стресс-тест без регистрации
              </div>
              <h1 className="font-inter font-bold text-2xl sm:text-3xl text-neutral-900 leading-tight tracking-tight mb-2">
                Проверьте аргументацию прямо сейчас
              </h1>
              <p className="font-inter text-neutral-500 text-sm">
                Вставьте текст вашего документа, презентации или тезисов — получите 3 жёстких вопроса от выбранного собеседника.
              </p>
            </div>

            {/* Step 1: Text input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold tracking-widest uppercase text-neutral-500">
                  Ваш текст
                </label>
                <span
                  className={`font-mono text-[11px] ${
                    charsLeft < 500 ? 'text-amber-500' : 'text-neutral-400'
                  }`}
                >
                  {text.length} / {MAX_TEXT_LENGTH}
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                placeholder="Вставьте текст вашего документа, презентации или тезисов..."
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all resize-none rounded-none p-4 text-neutral-900 placeholder:text-neutral-400 min-h-[160px] font-inter text-sm"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Step 2: Persona selector */}
            <div className="mb-6">
              <div className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3">
                Кто задаёт вопросы
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PERSONAS.map((persona) => {
                  const Icon = persona.icon
                  const isSelected = selectedPersona === persona.id
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setSelectedPersona(persona.id)}
                      className={`text-left p-4 border-2 transition-all duration-150 relative ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-transparent shadow-[inset_0_0_0_1px_rgba(229,229,229,1)] hover:bg-neutral-50 hover:shadow-[inset_0_0_0_1px_rgba(163,163,163,1)]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-neutral-900">
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                      <div
                        className={`w-8 h-8 flex items-center justify-center mb-3 border border-neutral-200 ${
                          isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="font-inter font-semibold text-sm text-neutral-900 mb-1 leading-snug">
                        {persona.label}
                      </div>
                      <div className="font-inter text-xs text-neutral-400 leading-relaxed">
                        {persona.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 3: Difficulty selector */}
            <div className="mb-8">
              <div className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3">
                Уровень давления
              </div>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setSelectedDifficulty(d.value)}
                    className={`flex-1 px-4 py-2.5 border text-sm font-inter transition-all ${
                      selectedDifficulty === d.value
                        ? 'bg-neutral-900 border-neutral-900 text-white font-semibold'
                        : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleStart}
              disabled={!isReady || isLoading}
              className="w-full bg-[#171717] hover:bg-black text-white font-inter font-semibold text-base h-14 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Начать стресс-тест
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <p className="text-center font-mono text-xs text-neutral-400 mt-3 uppercase tracking-wider">
              Без регистрации · 3 вопроса бесплатно
            </p>
          </div>
        </main>
      </div>
    )
  }

  // ── Render: Chat step ────────────────────────────────────────────────────
  if (step === 'chat') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-neutral-200 flex items-center justify-between px-5 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
            <span className="brand-wordmark text-neutral-900 text-[15px]">PeakTalk</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-500 border border-neutral-200 px-2 py-1">
              {personaLabel}
            </span>
            <span
              className={`font-mono text-xs border px-2 py-1 ${
                selectedDifficulty >= 5
                  ? 'border-red-200 text-red-600 bg-red-50'
                  : selectedDifficulty >= 3
                  ? 'border-amber-200 text-amber-600 bg-amber-50'
                  : 'border-neutral-200 text-neutral-500'
              }`}
            >
              {difficultyLabel}
            </span>
          </div>
        </header>

        {/* Progress indicator */}
        <div className="border-b border-neutral-100 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Array.from({ length: MAX_GUEST_TURNS }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < turn ? 'bg-neutral-900' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
          <span className="font-mono text-xs text-neutral-400">
            Вопрос {Math.min(turn, MAX_GUEST_TURNS)} из {MAX_GUEST_TURNS}
          </span>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 font-inter text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-50 border border-neutral-200 text-neutral-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-50 border border-neutral-200 px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-neutral-400" />
                  <span className="font-mono text-xs text-neutral-400">Анализирует...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-neutral-200 px-4 py-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ваш ответ... (Ctrl+Enter для отправки)"
              disabled={isLoading}
              className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition-all resize-none rounded-none p-4 text-neutral-900 placeholder:text-neutral-400 min-h-[100px] font-inter text-sm mb-3"
              style={{ fontSize: '16px' }}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSendAnswer}
                disabled={!answer.trim() || isLoading}
                className="bg-[#171717] hover:bg-black text-white font-inter font-semibold px-6 h-11 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Ответить
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Paywall step ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-neutral-200 flex items-center px-5 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
          <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
          <span className="brand-wordmark text-neutral-900 text-[15px]">PeakTalk</span>
        </Link>
      </header>

      {/* Blurred chat background */}
      <div className="flex-1 relative overflow-hidden">
        {/* Blurred chat history */}
        <div className="absolute inset-0 overflow-y-auto px-4 py-6 pointer-events-none select-none filter blur-[3px] opacity-40">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 font-inter text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-50 border border-neutral-200 text-neutral-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paywall overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-4 py-8 bg-white/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-md bg-white border border-neutral-200 shadow-xl p-6 sm:p-8"
          >
            {/* Lock icon */}
            <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-5">
              <Lock size={20} className="text-neutral-700" />
            </div>

            <h2 className="font-inter font-bold text-xl text-neutral-900 mb-2">
              Вы прошли 3 бесплатных вопроса
            </h2>
            <p className="font-inter text-sm text-neutral-500 mb-5">
              Это был демо-режим. Полная сессия даёт более глубокий анализ аргументации и конкретный разбор слабых мест.
            </p>

            {/* Teaser */}
            <div className="bg-neutral-50 border border-neutral-200 p-4 mb-6">
              <div className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3">
                В полной версии
              </div>
              <div className="flex flex-col gap-2">
                {[
                  'Ещё 5–12 вопросов под давлением',
                  'PDF-отчёт с оценками по навыкам',
                  'Шпаргалка с сильными аргументами',
                  'Разбор каждого ответа с комментариями',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-inter text-sm text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary CTA */}
            <Link
                href="/register?return=/simulation/from-guest"
                className="w-full bg-[#171717] hover:bg-black text-white font-inter font-semibold text-sm h-12 flex items-center justify-center gap-2 transition-colors mb-3"
              >
                Сохранить сессию
                <ArrowRight size={16} />
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/register"
                className="hidden"
            >
            </Link>

            <p className="text-center font-mono text-[11px] text-neutral-400 mt-3">
              Включает полный отчёт и шпаргалку
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
