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
  Sparkles,
  Zap,
  Shield,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { startGuestSession, sendGuestMessage } from '@/lib/guest-api'
import VideoBackground from '@/components/VideoBackground'

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
    label: 'CFO',
    subtitle: 'Финансовый директор',
    icon: DollarSign,
    description: 'Задаёт жёсткие вопросы по unit-экономике и ROI',
  },
  {
    id: 'investor',
    label: 'Инвестор',
    subtitle: '',
    icon: TrendingUp,
    description: 'Проверяет рыночные гипотезы и стратегию роста',
  },
  {
    id: 'board_member',
    label: 'Совет директоров',
    subtitle: '',
    icon: Users,
    description: 'Оценивает стратегические решения и риски',
  },
  {
    id: 'client',
    label: 'Клиент',
    subtitle: '',
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
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
        {/* Background Video */}
        <VideoBackground opacity={0.35} />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/50 to-[#0A0A0A]/90" />

        {/* Header */}
        <header className="h-14 border-b border-white/[0.06] flex items-center px-5 shrink-0 relative z-10">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} className="brightness-0 invert" />
            <span className="brand-wordmark text-white text-[15px]">PeakTalk</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Hero Copy */}
            <div className="hidden lg:flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#E8600A] bg-[#E8600A]/10 border border-[#E8600A]/20 px-3 py-1.5 inline-block mb-5 font-bold">
                  Стресс-тест без регистрации
                </div>
                <h1 className="font-inter font-bold text-3xl xl:text-4xl text-white leading-[1.1] tracking-tight mb-4">
                  Подготовьтесь к<br />
                  <span className="text-[#E8600A]">жёстким вопросам</span>
                </h1>
                <p className="font-inter text-neutral-400 text-base leading-relaxed max-w-md">
                  Вставьте черновик презентации, финмодели или PnL — получите критические вопросы от выбранного стейкхолдера.
                </p>
              </motion.div>

              {/* Value Props */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
                className="flex flex-col gap-4"
              >
                {[
                  { icon: Zap, text: '3 бесплатных вопроса для оценки' },
                  { icon: Shield, text: 'Данные удаляются после сессии' },
                  { icon: FileText, text: 'PDF-отчёт в полной версии' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/[0.03]">
                      <Icon size={14} className="text-[#E8600A]" />
                    </div>
                    <span className="font-inter text-sm text-neutral-300">{text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-2xl p-6 sm:p-8"
            >
              {/* Mobile Title */}
              <div className="lg:hidden mb-6 text-center">
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#E8600A] bg-[#E8600A]/10 px-3 py-1.5 inline-block mb-4 font-bold">
                  Стресс-тест без регистрации
                </div>
                <h1 className="font-inter font-bold text-2xl text-white leading-tight tracking-tight mb-2">
                  Подготовьтесь к <span className="text-[#E8600A]">жёстким вопросам</span>
                </h1>
                <p className="font-inter text-neutral-400 text-sm">
                  Вставьте черновик — получите 3 критических вопроса.
                </p>
              </div>

              {/* Step 1: Text input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold tracking-widest uppercase text-neutral-500">
                    Текст вашего выступления
                  </label>
                  <span
                    className={`font-mono text-[11px] ${
                      charsLeft < 500 ? 'text-amber-500' : 'text-neutral-600'
                    }`}
                  >
                    {text.length} / {MAX_TEXT_LENGTH}
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                  placeholder="Вставьте тезисы вашего проекта или скопируйте текст со слайдов..."
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#E8600A]/50 focus:ring-1 focus:ring-[#E8600A]/30 outline-none transition-all resize-none p-4 text-neutral-200 placeholder:text-neutral-600 min-h-[140px] font-inter text-sm"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Step 2: Persona selector */}
              <div className="mb-6">
                <div className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3">
                  Кто ваш оппонент
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERSONAS.map((persona) => {
                    const Icon = persona.icon
                    const isSelected = selectedPersona === persona.id
                    return (
                      <motion.button
                        key={persona.id}
                        type="button"
                        onClick={() => setSelectedPersona(persona.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={`text-left p-3.5 border transition-all duration-200 relative flex items-start gap-3 ${
                          isSelected
                            ? 'border-[#E8600A] bg-[#E8600A]/10 ring-1 ring-[#E8600A]/30'
                            : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 text-[#E8600A]">
                            <CheckCircle2 size={14} />
                          </div>
                        )}
                        <div
                          className={`w-9 h-9 flex items-center justify-center shrink-0 border transition-colors ${
                            isSelected
                              ? 'bg-[#E8600A] text-white border-[#E8600A]'
                              : 'bg-white/[0.03] text-neutral-500 border-white/[0.08]'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 pr-5">
                          <div className="font-inter font-bold text-[13px] text-neutral-200 mb-0.5 leading-snug">
                            {persona.label}
                          </div>
                          <div className="font-inter text-[11px] text-neutral-500 leading-relaxed">
                            {persona.description}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Step 3: Difficulty selector */}
              <div className="mb-7">
                <div className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3">
                  Уровень давления
                </div>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setSelectedDifficulty(d.value)}
                      className={`flex-1 px-4 py-2.5 border text-sm font-inter transition-all duration-200 ${
                        selectedDifficulty === d.value
                          ? 'bg-[#E8600A] border-[#E8600A] text-white font-semibold'
                          : 'bg-white/[0.03] border-white/[0.08] text-neutral-500 hover:border-white/[0.2] hover:bg-white/[0.05]'
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
                className="w-full bg-[#E8600A] hover:bg-[#c95207] text-white font-inter font-bold text-base h-14 flex items-center justify-center gap-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Начать симуляцию
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <p className="text-center font-mono text-[10px] text-neutral-600 mt-4 uppercase tracking-wider">
                Без регистрации · 3 вопроса бесплатно · Данные удаляются
              </p>
            </motion.div>
          </div>
        </main>
      </div>
    )
  }

  // ── Render: Chat step ────────────────────────────────────────────────────
  if (step === 'chat') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
        {/* Background Video */}
        <VideoBackground opacity={0.15} />
        <div className="absolute inset-0 z-[1] bg-[#0A0A0A]/70" />

        {/* Header */}
        <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-5 shrink-0 relative z-10 bg-[#0A0A0A]/80 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} className="brightness-0 invert" />
            <span className="brand-wordmark text-white text-[15px]">PeakTalk</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-neutral-400 border border-white/[0.08] px-2 py-1 bg-white/[0.03]">
              {personaLabel}
            </span>
            <span
              className={`font-mono text-[11px] border px-2 py-1 ${
                selectedDifficulty >= 5
                  ? 'border-red-500/30 text-red-400 bg-red-500/10'
                  : selectedDifficulty >= 3
                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                  : 'border-white/[0.08] text-neutral-500 bg-white/[0.03]'
              }`}
            >
              {difficultyLabel}
            </span>
          </div>
        </header>

        {/* Progress indicator */}
        <div className="border-b border-white/[0.04] px-5 py-2.5 flex items-center justify-between relative z-10 bg-[#0A0A0A]/60">
          <div className="flex items-center gap-2">
            {Array.from({ length: MAX_GUEST_TURNS }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 transition-colors duration-300 ${
                  i < turn ? 'bg-[#E8600A]' : 'bg-white/[0.08]'
                }`}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] text-neutral-600">
            Вопрос {Math.min(turn, MAX_GUEST_TURNS)} из {MAX_GUEST_TURNS}
          </span>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 relative z-10">
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
                  {msg.role === 'assistant' ? (
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="w-7 h-7 flex items-center justify-center shrink-0 bg-[#E8600A]/15 border border-[#E8600A]/25 mt-0.5">
                        <Sparkles size={13} className="text-[#E8600A]" />
                      </div>
                      <div className="bg-white/[0.05] border border-white/[0.08] px-4 py-3 font-inter text-sm leading-relaxed text-neutral-200">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[80%] bg-[#E8600A] text-white px-4 py-3 font-inter text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 flex items-center justify-center shrink-0 bg-[#E8600A]/15 border border-[#E8600A]/25 mt-0.5">
                    <Sparkles size={13} className="text-[#E8600A]" />
                  </div>
                  <div className="bg-white/[0.05] border border-white/[0.08] px-4 py-3 flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin text-neutral-500" />
                    <span className="font-mono text-[11px] text-neutral-500">Анализирует...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-white/[0.06] px-4 py-4 bg-[#0A0A0A]/90 backdrop-blur-sm relative z-10">
          <div className="max-w-2xl mx-auto">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ваш ответ... (Ctrl+Enter для отправки)"
              disabled={isLoading}
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#E8600A]/50 focus:ring-1 focus:ring-[#E8600A]/30 outline-none transition-all resize-none p-4 text-neutral-200 placeholder:text-neutral-600 min-h-[100px] font-inter text-sm mb-3"
              style={{ fontSize: '16px' }}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSendAnswer}
                disabled={!answer.trim() || isLoading}
                className="bg-[#E8600A] hover:bg-[#c95207] text-white font-inter font-semibold px-6 h-11 flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Background Video */}
      <VideoBackground opacity={0.2} />
      <div className="absolute inset-0 z-[1] bg-[#0A0A0A]/80" />

      {/* Header */}
      <header className="h-14 border-b border-white/[0.06] flex items-center px-5 shrink-0 relative z-10 bg-[#0A0A0A]/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
          <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} className="brightness-0 invert" />
          <span className="brand-wordmark text-white text-[15px]">PeakTalk</span>
        </Link>
      </header>

      {/* Blurred chat background */}
      <div className="flex-1 relative overflow-hidden z-10">
        {/* Blurred chat history */}
        <div className="absolute inset-0 overflow-y-auto px-4 py-6 pointer-events-none select-none opacity-20 blur-[4px]">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 font-inter text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#E8600A] text-white'
                      : 'bg-white/[0.05] border border-white/[0.08] text-neutral-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paywall overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-md bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-2xl p-6 sm:p-8"
          >
            {/* Lock icon */}
            <div className="w-12 h-12 bg-[#E8600A]/15 border border-[#E8600A]/25 flex items-center justify-center mb-5">
              <Lock size={20} className="text-[#E8600A]" />
            </div>

            <h2 className="font-inter font-bold text-xl text-white mb-2">
              Вы прошли 3 бесплатных вопроса
            </h2>
            <p className="font-inter text-sm text-neutral-400 mb-6">
              Это был демо-режим. Полная сессия даёт более глубокий анализ аргументации и конкретный разбор слабых мест.
            </p>

            {/* Teaser */}
            <div className="bg-white/[0.03] border border-white/[0.06] p-4 mb-6">
              <div className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-3">
                В полной версии
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  'Ещё 5–12 вопросов под давлением',
                  'PDF-отчёт с оценками по навыкам',
                  'Шпаргалка с сильными аргументами',
                  'Разбор каждого ответа с комментариями',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="font-inter text-sm text-neutral-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary CTA */}
            <Link
              href="/register?return=/simulation/from-guest"
              className="w-full bg-[#E8600A] hover:bg-[#c95207] text-white font-inter font-semibold text-sm h-12 flex items-center justify-center gap-2 transition-colors mb-3"
            >
              Сохранить сессию
              <ArrowRight size={16} />
            </Link>

            <p className="text-center font-mono text-[11px] text-neutral-600 mt-3">
              Включает полный отчёт и шпаргалку
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
