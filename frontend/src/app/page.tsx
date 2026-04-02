"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'framer-motion';
import Image from 'next/image';
import { Menu, X, ArrowRight, FileText, CheckCircle2, Timer, Mic, Download, Share2 } from 'lucide-react';
import HeroVisual from '@/components/HeroVisual';

const smoothScroll = (id: string) => {
  const element = document.querySelector(id);
  if (element) {
    const navHeight = 88;
    const y = element.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

// ─── HOOKS & UTILS ────────────────────────────────────────────────────────────
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return scrolled;
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size = 24 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Image src="/logo_svg.svg" alt="PeakTalk Logo" width={52} height={52} style={{ width: 52, height: 52 }} />
      <span style={{
        fontFamily: 'var(--font-syne)',
        fontWeight: 800,
        fontSize: size * 0.9,
        letterSpacing: '-0.02em',
        color: 'var(--text-main)',
      }}>
        PeakTalk
      </span>
    </div>
  );
}

// ─── NAVIGATION ────────────────────────────────────────────────────────────────
function Nav() {
  const scrolled = useScrolled();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '16px 0',
          background: scrolled ? 'rgba(255, 255, 255, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(32px) saturate(140%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(32px) saturate(140%)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div className="container-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div>
            <Logo />
          </div>

          <div className="hidden lg:flex" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', gap: 32, alignItems: 'center' }}>
            {[
              { label: 'Как работает', id: '#how' },
              { label: 'Зачем не ChatGPT', id: '#value' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => smoothScroll(item.id)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--text-main)',
                  opacity: 0.6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="hidden lg:flex" style={{ gap: 16, alignItems: 'center' }}>
              <a href="/login" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-main)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textDecoration: 'none',
                opacity: 0.8
              }}>Вход</a>
              <a href="/register" className="btn-primary" style={{ padding: '10px 24px', fontSize: 13, borderRadius: '4px' }}>
                Попробовать бесплатно
              </a>
            </div>

            <button
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                marginRight: -12,
              }}
              aria-label="Открыть меню"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 64 }}>
              <Logo />
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  marginRight: -12,
                }}
              >
                <X size={32} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
              {[
                { label: 'Как работает', id: '#how' },
                { label: 'Зачем не ChatGPT', id: '#value' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => smoothScroll(item.id), 300);
                  }}
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontSize: 24,
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    letterSpacing: '-0.02em',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '8px 0',
                  }}
                >
                  {item.label}
                </button>
              ))}
              <div style={{ width: '100%', height: 1, backgroundColor: 'var(--border-main)', margin: '16px 0' }} />
              <a href="/login" style={{
                fontFamily: 'var(--font-syne)',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text-dim)',
                textDecoration: 'none',
                padding: '8px 0',
              }}>Личный кабинет</a>
              <a href="/register" className="btn-primary flex items-center justify-center w-full" style={{ padding: '20px 0', marginTop: 16, fontSize: 15 }}>
                Попробовать бесплатно
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── HERO ──────────────────────────────────────────────────────────────────────
function Hero() {
  const containerRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="h-auto lg:h-[250vh] relative bg-[var(--bg-main)]" style={{ position: 'relative' }}>
      <div className="lg:sticky lg:top-0 min-h-screen w-full flex items-center overflow-hidden pt-16 lg:pt-24 pb-12 lg:pb-0">
        {/* Editorial grid background */}
        <div className="absolute inset-0 z-0 opacity-[0.25] mix-blend-multiply" style={{
          backgroundImage: 'linear-gradient(var(--border-main) 1px, transparent 1px), linear-gradient(90deg, var(--border-main) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)'
        }} />

        <div className="container-custom relative z-10 w-full flex flex-col justify-center h-full">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 items-center h-full">
            
            {/* Text Content - Center on mobile, left on desktop */}
            <div className="w-full max-w-2xl shrink-0 relative z-20 flex flex-col items-center text-center lg:items-start lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="inline-flex items-center border border-[var(--border-light)] rounded-none px-4 py-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-6 lg:mb-8 bg-[var(--color-accent-bg)] backdrop-blur-md"
              >
                <span className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full mr-3 animate-pulse" />
                Без видео. Без биометрии. Только текст.
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: 'clamp(28px, 7vw, 92px)',
                  fontWeight: 800,
                  lineHeight: 0.95,
                  letterSpacing: '-0.04em',
                  color: 'var(--text-main)',
                  marginBottom: 20,
                  textWrap: 'balance',
                }}
              >
                Говоришь хорошо. <br/>
                <span className="text-[var(--color-accent)] italic opacity-90">Под давлением — другое дело.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'clamp(13px, 1.5vw, 18px)',
                  lineHeight: 1.5,
                  color: 'var(--text-muted)',
                  marginBottom: 24,
                  maxWidth: 480,
                  textWrap: 'balance',
                }}
              >
                Загрузи материалы выступления. PeakTalk создаёт персонализированные вопросы от твоей реальной аудитории — и разбирает каждый ответ. Не теория. Практика до результата.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex gap-3 flex-wrap justify-center lg:justify-start"
              >
                <a href="/register" className="btn-primary" style={{ padding: '14px 28px', fontSize: 13, borderRadius: '4px' }}>
                  Попробовать бесплатно
                </a>
                <button
                  className="btn-secondary transition-all hover:bg-[var(--bg-surface-alt)]"
                  onClick={() => smoothScroll('#how')}
                  style={{ padding: '14px 28px', fontSize: 13, borderRadius: '4px', border: '1px solid var(--border-main)' }}
                >
                  Как это работает
                </button>
              </motion.div>
            </div>

            {/* AI Visual Content - Centered on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="w-full relative min-h-[300px] lg:h-auto flex-1 lg:flex-none flex items-center justify-center z-10 pointer-events-none mt-8 lg:mt-0"
            >
              <HeroVisual scrollYProgress={scrollYProgress} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ACTION FLOW MOCKUPS ───────────────────────────────────────────────────────

function MockupUpload() {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[var(--border-main)] bg-[var(--bg-surface)]" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Drop zone */}
      <div className="border-2 border-dashed border-[var(--border-main)] rounded-xl m-4 py-8 flex flex-col items-center gap-3 bg-[var(--bg-surface-alt)]">
        <FileText size={28} color="var(--color-accent)" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-[var(--text-main)] font-medium text-sm">Перетащи файл или выбери</p>
          <p className="text-[var(--text-muted)] text-xs mt-1" style={{ fontFamily: 'var(--font-mono)' }}>PDF, PPTX, DOCX — любой формат</p>
        </div>
      </div>
      {/* Uploaded files list */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {[
          'product_roadmap_q2.pdf',
          'pitch_deck_series_a.pdf',
        ].map((name) => (
          <div key={name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border-light)]">
            <div className="flex items-center gap-2">
              <FileText size={14} color="var(--text-muted)" />
              <span className="text-[var(--text-dim)] text-xs" style={{ fontFamily: 'var(--font-mono)' }}>{name}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 size={13} color="#10b981" />
              <span className="text-[10px] text-[#10b981]" style={{ fontFamily: 'var(--font-mono)' }}>Загружен</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupSession() {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[var(--border-main)] bg-[var(--bg-surface)]" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-surface-alt)]">
        <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
          Тимлид / Principal Engineer
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Timer size={11} color="var(--color-accent)" />
            <span className="text-[var(--color-accent)] text-[10px] font-bold" style={{ fontFamily: 'var(--font-mono)' }}>1:23</span>
          </div>
          <span className="text-[var(--text-muted)] text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>Вопрос 3 из 10</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-[var(--border-light)]">
        <motion.div
          className="h-full bg-[var(--color-accent)] rounded-full"
          initial={{ width: 0 }}
          whileInView={{ width: '30%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </div>
      {/* Question card */}
      <div className="m-4 p-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border-light)]">
        <p className="text-[var(--text-main)] text-sm leading-relaxed font-medium">
          Как вы обоснуете технический долг команде, которая хочет только новые фичи?
        </p>
      </div>
      {/* Answer area */}
      <div className="mx-4 mb-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-alt)] overflow-hidden">
        <div className="px-4 py-3 min-h-[52px] flex items-start">
          <p className="text-[var(--text-muted)] text-sm">Ваш ответ тимлиду...</p>
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-light)]">
          <Mic size={16} color="var(--text-muted)" />
          <button className="btn-primary flex items-center gap-1.5" style={{ padding: '6px 16px', fontSize: 12, borderRadius: '6px' }}>
            Ответить <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MockupReport() {
  const metrics = [
    { label: 'Структура', score: 8 },
    { label: 'Чёткость', score: 6 },
    { label: 'Темп', score: 7 },
  ];

  function getScoreColor(score: number): string {
    if (score >= 7) return '#10b981';
    if (score >= 5) return '#f59e0b';
    return '#e11d48';
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[var(--border-main)] bg-[var(--bg-surface)]" style={{ fontFamily: 'var(--font-inter)' }}>
      {/* Summary block */}
      <div className="m-4 p-4 rounded-2xl" style={{ background: 'rgba(232,96,10,0.06)', border: '1px solid rgba(232,96,10,0.15)' }}>
        <p className="text-[var(--text-main)] text-xs font-medium mb-1">Хорошая попытка. Тимлид увидел потенциал,</p>
        <p className="text-[var(--text-dim)] text-xs mb-3">но местами аргументы теряли опору.</p>
        <div className="flex flex-wrap gap-2">
          {metrics.map((m) => (
            <span
              key={m.label}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
              style={{ fontFamily: 'var(--font-mono)', backgroundColor: getScoreColor(m.score) }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block" />
              {m.label} {m.score}/10
            </span>
          ))}
        </div>
      </div>
      {/* Transcript */}
      <div className="px-4 pb-2">
        <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-3">Транскрипт</p>
        <div className="space-y-3">
          <div>
            <p className="text-[var(--text-muted)] text-[11px] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Тимлид</p>
            <p className="text-[var(--text-dim)] text-xs">Как вы обоснуете технический долг?</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-[11px] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Вы</p>
            <p className="text-[var(--text-dim)] text-xs leading-relaxed">
              Это важно для стабильности системы, потому что{' '}
              <span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 rounded px-1 cursor-pointer">
                иначе мы накопим проблемы...
              </span>
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
              ↑ нажми — "Аргумент без конкретного примера"
            </p>
          </div>
        </div>
      </div>
      {/* Buttons */}
      <div className="flex gap-2 px-4 pb-4 mt-3">
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-main)] text-[var(--text-dim)] text-[11px]" style={{ fontFamily: 'var(--font-mono)' }}>
          <Download size={12} /> Скачать PDF
        </button>
        <button className="btn-primary flex items-center gap-1.5" style={{ padding: '8px 14px', fontSize: 11, borderRadius: '8px', fontFamily: 'var(--font-mono)' }}>
          <Share2 size={12} /> Поделиться
        </button>
      </div>
    </div>
  );
}

// ─── CORE VALUE (Consolidated Flow) ──────────────────────────────────────────
function ActionFlow() {
  const steps = [
    {
      num: '01',
      title: 'Загрузи материалы',
      desc: 'Загружаешь PDF, дек или документ. PeakTalk анализирует содержимое и строит сессию вопросов именно по твоему контенту — не по теме вообще, а по тому, что ты реально будешь защищать.',
      direction: -30,
      mockup: <MockupUpload />,
    },
    {
      num: '02',
      title: 'Выбери собеседника и отвечай',
      desc: '15 персон: от Тимлида и Совета директоров до Венчурного инвестора и Скептика из зала. 10 вопросов, 90 секунд на каждый ответ. Можно отвечать голосом. Списать у ChatGPT не получится — AI-детектор видит чужой текст и отклоняет.',
      direction: 0,
      scale: 0.9,
      mockup: <MockupSession />,
    },
    {
      num: '03',
      title: 'Читай разбор',
      desc: 'Отчёт с оценками по каждому навыку. Слабые ответы подсвечены прямо в транскрипте — нажимаешь и читаешь, что именно пошло не так. Скачиваешь PDF. Идёшь на следующую встречу с пониманием, что отточить.',
      direction: 30,
      mockup: <MockupReport />,
    },
  ];

  const sectionRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"]
  });
  
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <section ref={sectionRef} id="how" className="relative group/section" style={{ position: 'relative', padding: 'clamp(80px, 15vw, 180px) 0', backgroundColor: 'var(--bg-main)' }}>
      <div className="container-custom relative">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">
          
          <div className="col-span-1 lg:col-span-1">
            <h2 style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}>
              Как это работает.
            </h2>
            <p className="mt-4 text-[var(--text-dim)] font-mono text-xs tracking-widest uppercase">Три шага до уверенного выступления.</p>
          </div>

          <div 
            className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative group/grid"
            onMouseMove={handleMouseMove}
          >
            {/* Interactive Spotlight following cursor */}
            <motion.div
              className="pointer-events-none absolute -inset-10 z-0 hidden lg:block opacity-0 transition duration-500 group-hover/grid:opacity-100"
              style={{
                background: useMotionTemplate`
                  radial-gradient(
                    450px circle at ${mouseX}px ${mouseY}px,
                    rgba(232, 96, 10, 0.12),
                    transparent 80%
                  )
                `,
              }}
            />

            {/* Scroll Progress Line (Desktop) */}
            <div className="absolute left-[11px] top-0 bottom-0 w-[1px] bg-[var(--border-main)] hidden md:block z-20" />
            <motion.div 
              className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-[var(--color-accent)] hidden md:block z-30" 
              style={{ originY: 0, scaleY }}
            />

            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: s.direction, scale: s.scale || 1 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="group relative border-l md:border-l-0 border-[var(--border-main)] pl-6 md:pl-8 pb-8 md:pb-0"
              >
                {/* Visual marker for mobile */}
                <div className="absolute -left-[3px] top-0 w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full md:hidden" />

                <div className="font-mono text-[10px] text-[var(--color-accent)] tracking-widest mb-4 opacity-50 block transition-all group-hover:opacity-100">[{s.num}]</div>

                {/* UI Mockup */}
                <div className="mb-6 pointer-events-none transition-transform duration-500 lg:group-hover:-translate-y-1 lg:group-hover:scale-[1.02] origin-bottom">
                  {s.mockup}
                </div>

                <h3 className="font-syne font-bold text-xl md:text-2xl text-[var(--text-main)] mb-3 leading-tight transition-colors group-hover:text-[var(--color-accent)]">{s.title}</h3>
                <p className="font-inter text-sm text-[var(--text-muted)] leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}

// ─── IMPACT EVIDENCE ─────────────────────────────────────────────────────────
function ImpactEvidence() {
  return (
    <section id="value" className="relative overflow-hidden" style={{ padding: 'clamp(80px, 10vw, 140px) 0', backgroundColor: 'var(--text-main)' }}>
      {/* Massive Glass Background - Slow Rotation and Scaling */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center mix-blend-screen opacity-30">
        <motion.img 
          src="/glass.png" 
          alt="" 
          className="w-[150%] max-w-none h-auto"
          animate={{ rotate: 360, scale: [1, 1.05, 1] }} 
          transition={{ rotate: { duration: 120, repeat: Infinity, ease: "linear" }, scale: { duration: 15, repeat: Infinity, ease: "easeInOut" } }} 
        />
        <div className="absolute inset-0 bg-black/40" /> {/* Slight dark wash to keep text readable */}
      </div>

      <div className="container-custom relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            maxWidth: 600,
          }}>
            Почему не просто ChatGPT?
          </h2>
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--text-dim)]">
            PeakTalk // 2026
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/10 p-[1px]">
          {[
            {
              tag: '01',
              title: 'ChatGPT не знает твой контент',
              detail: 'Универсальная модель задаёт универсальные вопросы. PeakTalk читает твои материалы и атакует именно там, где у тебя слабо — не там, где слабо у всех.',
            },
            {
              tag: '02',
              title: 'Репетитор недоступен в 23:00',
              detail: 'Прогнать презентацию накануне важной встречи — теперь реально. Без записи. Без ожидания. В 10 раз дешевле часа с коучем.',
            },
            {
              tag: '03',
              title: 'Навык нарабатывается только практикой',
              detail: 'Смотреть видео о плавании — не то же самое, что плыть. PeakTalk даёт повторение с качественным фидбэком — единственный способ реально стать лучше.',
            },
          ].map((item, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              key={i}
              className="group relative bg-[var(--text-main)] p-8 lg:p-12 transition-all hover:bg-neutral-900 overflow-hidden"
            >
              <div className="font-mono text-[9px] text-[var(--color-accent)] tracking-widest uppercase mb-8">{item.tag}</div>
              <h3 className="font-syne font-bold text-2xl text-white mb-4 leading-tight">{item.title}</h3>
              <p className="font-inter text-sm text-neutral-400 leading-relaxed">{item.detail}</p>

              {/* Hover reveal line */}
              <div className="absolute bottom-0 left-0 h-[2px] bg-[var(--color-accent)] w-0 group-hover:w-full transition-all duration-500 ease-out" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA FOOTER ──────────────────────────────────────────────────────────────
function FooterCTA() {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img src="/footercta_bg.png" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/60 md:bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
      </div>
      
      {/* Static Noise Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <div className="py-32 lg:py-48 text-center container-custom relative z-10 transition-colors">
        <h2 style={{
          fontFamily: 'var(--font-syne)',
          fontSize: 'clamp(40px, 6vw, 80px)',
          fontWeight: 800,
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          color: '#FFFFFF',
          marginBottom: 32,
        }}>
          Следующее выступление — лучшее.
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <a 
            href="/register" 
            className="btn-primary flex items-center gap-3 group relative overflow-hidden" 
            style={{ padding: '16px 32px', fontSize: 13, borderRadius: '4px', boxShadow: '0 4px 20px rgba(232,96,10, 0.1)' }}
          >
            <span className="relative z-10 font-bold transition-all duration-300">Попробовать бесплатно</span>
            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
        </div>
        <p className="mt-8 font-mono text-[10px] tracking-widest uppercase text-white/50">3 сессии бесплатно // Карта не нужна</p>
      </div>

      <Footer />
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 relative z-10 bg-black">
      <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-8 text-white/80">
        <div className="brightness-0 invert"><Logo size={20} /></div>
        
        <div className="flex flex-wrap justify-center gap-8 font-mono text-[10px] tracking-widest uppercase text-[var(--text-dim)]">
          <a href="/contacts" className="hover:text-[var(--text-main)] transition-colors">Контакты</a>
          <a href="#" className="hover:text-[var(--text-main)] transition-colors">Оферта</a>
          <a href="#" className="hover:text-[var(--text-main)] transition-colors">Конфиденциальность</a>
        </div>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen selection:bg-[var(--color-accent)] selection:text-white">
      <Nav />
      <Hero />
      <ActionFlow />
      <ImpactEvidence />
      <FooterCTA />
    </main>
  );
}
