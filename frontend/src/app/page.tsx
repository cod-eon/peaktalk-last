"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { Menu, X, ArrowRight, FileText, CheckCircle2, Timer, Download, Share2 } from 'lucide-react';
import HeroVisual from '@/components/HeroVisual';

const safariMotionStyle: React.CSSProperties = {
  willChange: 'transform, opacity',
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  transformStyle: 'preserve-3d',
  WebkitTransformStyle: 'preserve-3d',
  outline: '1px solid transparent',
};

type RevealTarget = {
  opacity: number;
  x?: number;
  y?: number;
  scale?: number;
  scaleX?: number;
};

type RevealMargin = `${number}px 0px`;

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hidden?: RevealTarget;
  visible?: RevealTarget;
  delay?: number;
  duration?: number;
  margin?: RevealMargin;
};

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

function useRevealTrigger<T extends HTMLElement>(margin: RevealMargin = '-64px 0px') {
  const ref = useRef<T | null>(null);
  const isInView = useInView(ref, { once: true, margin, amount: 0.2 });

  return { ref, isInView };
}

function useIsIOSSafari() {
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iP(hone|ad|od)/.test(userAgent);
    const isWebKit = /WebKit/i.test(userAgent);
    const isCriOS = /CriOS/i.test(userAgent);
    const isFxiOS = /FxiOS/i.test(userAgent);

    setIsIOSSafari(isIOS && isWebKit && !isCriOS && !isFxiOS);
  }, []);

  return isIOSSafari;
}

function normalizeRevealTarget(target: RevealTarget, disableScale: boolean): RevealTarget {
  if (!disableScale) {
    return target;
  }

  return {
    ...target,
    scale: 1,
    scaleX: target.scaleX,
  };
}

function buildRevealTransform(target: RevealTarget) {
  const x = target.x ?? 0;
  const y = target.y ?? 0;
  const scale = target.scale ?? 1;
  const scaleX = target.scaleX ?? 1;

  return `translate3d(${x}px, ${y}px, 0) scale(${scale}) scaleX(${scaleX})`;
}

function RevealDiv({
  children,
  className,
  style,
  hidden = { opacity: 0, y: 24, scale: 0.985 },
  visible = { opacity: 1, y: 0, scale: 1 },
  delay = 0,
  duration = 0.6,
  margin,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const isIOSSafari = useIsIOSSafari();
  const { ref, isInView } = useRevealTrigger<HTMLDivElement>(margin);
  const hiddenState = prefersReducedMotion ? { opacity: 0 } : normalizeRevealTarget(hidden, isIOSSafari);
  const visibleState = prefersReducedMotion ? { opacity: 1 } : normalizeRevealTarget(visible, isIOSSafari);
  const state = isInView ? visibleState : hiddenState;

  return (
    <div
      ref={ref}
      style={{
        ...safariMotionStyle,
        ...style,
        opacity: state.opacity,
        transform: `${buildRevealTransform(state)} translateZ(0)`,
        WebkitTransform: `${buildRevealTransform(state)} translateZ(0)`,
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function RevealP({
  children,
  className,
  style,
  hidden = { opacity: 0, y: 18 },
  visible = { opacity: 1, y: 0 },
  delay = 0,
  duration = 0.6,
  margin,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const isIOSSafari = useIsIOSSafari();
  const { ref, isInView } = useRevealTrigger<HTMLParagraphElement>(margin);
  const hiddenState = prefersReducedMotion ? { opacity: 0 } : normalizeRevealTarget(hidden, isIOSSafari);
  const visibleState = prefersReducedMotion ? { opacity: 1 } : normalizeRevealTarget(visible, isIOSSafari);
  const state = isInView ? visibleState : hiddenState;

  return (
    <p
      ref={ref}
      style={{
        ...safariMotionStyle,
        ...style,
        opacity: state.opacity,
        transform: `${buildRevealTransform(state)} translateZ(0)`,
        WebkitTransform: `${buildRevealTransform(state)} translateZ(0)`,
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={className}
    >
      {children}
    </p>
  );
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size = 24 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Image src="/logo_svg.svg" alt="PeakTalk Logo" width={52} height={52} style={{ width: 52, height: 52 }} />
      <span className="brand-wordmark text-neutral-900" style={{ fontSize: size * 0.9 }}>
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
          padding: scrolled ? '14px 0' : '18px 0',
          background: scrolled
            ? 'rgba(255, 255, 255, 0.88)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.55) 42%, rgba(255,255,255,0) 100%)',
          backdropFilter: scrolled ? 'blur(32px) saturate(140%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(32px) saturate(140%)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div className="container-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div>
            <Logo />
          </div>

          <div className="hidden lg:flex" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', gap: 40, alignItems: 'center' }}>
            {[
              { label: 'Как работает', id: '#how' },
              { label: 'Сравнение', id: '#comparison' },
              { label: 'Цены', id: '#pricing' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => smoothScroll(item.id)}
                className="font-mono text-neutral-900"
                style={{
                  fontSize: 12,
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
              <a href="/login" className="font-mono text-neutral-900" style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                opacity: 0.72
              }}>Вход</a>
              <div style={{ width: 1, height: 16, backgroundColor: '#e5e7eb' }} />
              <a href="/register" className="bg-[#171717] hover:bg-black text-white font-inter font-semibold rounded-none px-5 py-2.5 text-sm flex items-center transition-all" >
                Начать подготовку
              </a>
            </div>

            <div className="lg:hidden flex items-center gap-4">
              <button
                className="flex items-center justify-center"
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#171717',
                  width: 32,
                  height: 32,
                  marginRight: -4,
                }}
                aria-label="Открыть меню"
              >
                <Menu size={28} />
              </button>
            </div>
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
                  color: '#171717',
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
                { label: 'Сравнение', id: '#comparison' },
                { label: 'Цены', id: '#pricing' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => smoothScroll(item.id), 300);
                  }}
                  className="font-inter font-bold text-neutral-900"
                  style={{
                    fontSize: 24,
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
              <div style={{ width: '100%', height: 1, backgroundColor: '#e5e7eb', margin: '16px 0' }} />
              <a href="/login" className="font-inter font-semibold text-neutral-400" style={{
                fontSize: 18,
                textDecoration: 'none',
                padding: '8px 0',
              }}>Личный кабинет</a>
              <a href="/register" className="bg-[#171717] hover:bg-black text-white font-inter font-semibold rounded-none px-6 py-3.5 text-sm flex items-center justify-center w-full transition-all" >
                Начать подготовку
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
  return (
    <section className="relative bg-white">
      <div className="min-h-screen w-full flex items-center overflow-hidden pt-16 lg:pt-24 pb-12 lg:pb-0">
        {/* Editorial grid background */}
        <div className="absolute inset-0 z-0 opacity-[0.25] mix-blend-multiply" style={{
          backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)'
        }} />

        <div className="container-custom relative z-10 w-full flex flex-col justify-center h-full">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-8 items-center h-full">
            
            {/* Text Content - Center on mobile, left on desktop */}
            <div className="w-full max-w-2xl shrink-0 relative z-20 flex flex-col items-start text-left sm:items-center sm:text-center lg:items-start lg:text-left mt-12 lg:mt-0 lg:pr-10">

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0 }}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500 border border-neutral-200 rounded-none px-4 py-1.5 mb-5 bg-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
              >
                AI-симулятор рабочих коммуникаций
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-inter font-bold text-[34px] sm:text-5xl lg:text-[68px] text-neutral-900 tracking-tight leading-[0.92] mb-5 max-w-[13.5ch] sm:max-w-[15.5ch] lg:max-w-[14ch]"
              >
                <span className="block">Найдите дыры</span>
                <span className="block">в аргументации</span>
                <span className="block">до <span className="text-[#E8600A] relative">
                  реального давления
                </span>.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                  fontSize: 'clamp(15px, 1.55vw, 19px)',
                  lineHeight: 1.58,
                  color: '#737373',
                  marginBottom: 20,
                  maxWidth: 580,
                }}
              >
                Загрузите стратегию или отчет — получите жесткие вопросы от руководства, сложных клиентов или инвесторов. PeakTalk разберет ваши ответы и выдаст усиленную версию документа без логических уязвимостей.
              </motion.p>

              {/* Hero metrics strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                style={safariMotionStyle}
                className="grid grid-cols-3 w-full max-w-[520px] mb-6 overflow-hidden rounded-none border border-neutral-200 bg-white/85 shadow-[0_18px_40px_rgba(0,0,0,0.04)]"
              >
                {[
                  { value: '15', label: 'персон' },
                  { value: '10', label: 'вопросов' },
                  { value: 'PDF', label: 'отчёт' },
                ].map((m, i) => (
                  <div key={i} className={`flex flex-col gap-1 px-4 py-3 sm:px-5 sm:py-4 ${i !== 2 ? 'border-r border-neutral-200' : ''}`}>
                    <span className="font-inter font-bold text-[22px] sm:text-2xl text-neutral-900 leading-none">{m.value}</span>
                    <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-neutral-500">{m.label}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col items-start sm:items-center lg:items-start gap-3 w-full max-w-[520px]"
              >
                <div className="flex flex-col sm:flex-row w-full gap-3">
                  <a href="/register" className="bg-[#171717] hover:bg-black text-white font-inter font-semibold rounded-none w-full sm:w-auto flex items-center justify-center p-3 sm:px-6 text-sm transition-all" >
                    Начать подготовку →
                  </a>
                  <button
                    className="hidden sm:flex w-auto items-center justify-center p-3 sm:px-6 transition-all rounded-none border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50"
                    onClick={() => smoothScroll('#how')}
                  >
                    Как это работает →
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                    Бесплатно. Без карты.
                  </p>
                  <button
                    className="sm:hidden font-inter text-sm text-neutral-500 underline underline-offset-2 transition-colors hover:text-neutral-900"
                    onClick={() => smoothScroll('#how')}
                  >
                    Как это работает →
                  </button>
                </div>
              </motion.div>
            </div>

            {/* AI Visual Content - Centered on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              style={safariMotionStyle}
              className="w-full px-4 lg:px-0 relative min-h-[300px] lg:h-auto flex-1 lg:flex-none flex items-center justify-center z-10 pointer-events-none mt-4 sm:mt-8 lg:mt-0 lg:-translate-y-3"
            >
              <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_65%_35%,rgba(232,96,10,0.08),transparent_42%),radial-gradient(circle_at_38%_72%,rgba(0,0,0,0.05),transparent_40%)]" />
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ACTION FLOW MOCKUPS ───────────────────────────────────────────────────────

function MockupUpload() {
  const files = [
    { name: 'product_roadmap_q2.pdf', size: '1.4 MB' },
    { name: 'pitch_deck_series_a.pdf', size: '3.2 MB' },
  ];
  return (
    <div
      className="w-full rounded-none overflow-hidden border border-neutral-200 bg-white shadow-md relative"
      style={{ minHeight: 240 }}
    >
      {/* Toolbar strip */}
      <div className="flex items-center justify-center px-4 sm:px-8 py-4 border-b border-neutral-200 bg-gray-50">
        <span className="text-xs text-neutral-400 tracking-widest font-mono">[ PEAKTALK // UPLOAD ]</span>
      </div>

      {/* Drop zone */}
      <div className="border border-dashed border-neutral-300 rounded-none mx-4 sm:mx-8 mt-6 py-6 sm:py-10 flex flex-col items-center gap-3 bg-gray-50 hover:border-neutral-400 transition-colors cursor-pointer">
        <div className="w-9 h-9 rounded-none bg-orange-50 flex items-center justify-center">
          <FileText size={18} style={{ color: '#E8600A' }} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-neutral-900 font-semibold text-sm">Перетащите файл или выберите</p>
          <p className="text-neutral-400 text-xs mt-0.5 font-mono">PDF, PPTX, DOCX — любой формат</p>
        </div>
      </div>

      {/* Uploaded files */}
      <div className="px-4 sm:px-8 pt-4 pb-6 flex flex-col gap-3">
        {files.map((f) => (
          <div
            key={f.name}
            className="flex items-center justify-between px-3 py-2.5 rounded-none bg-gray-50 border border-gray-100"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-none bg-orange-50 flex items-center justify-center shrink-0">
                <FileText size={12} style={{ color: '#E8600A' }} />
              </div>
              <span className="text-gray-700 text-xs truncate font-mono">
                {f.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-gray-400 text-xs opacity-75 font-mono">{f.size}</span>
              <CheckCircle2 size={13} color="#10b981" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupSession() {
  const { ref: progressBarRef, isInView: progressVisible } = useRevealTrigger<HTMLDivElement>('-72px 0px');

  return (
    <div
      className="w-full rounded-none overflow-hidden border border-neutral-200 bg-white shadow-md flex flex-col"
      style={{ minHeight: 260 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-none flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.10)' }}>
            <span className="text-xs opacity-75 font-bold font-mono" style={{ color: '#8B5CF6' }}>AM</span>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="font-semibold text-gray-800" style={{ fontSize: '12px' }}>Алексей М.</span>
            <span className="text-gray-500 font-mono" style={{ fontSize: 12, opacity: 0.75 }}>Sr. Engineering Manager</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Timer size={11} style={{ color: '#E8600A' }} />
            <span className="text-xs opacity-75 font-bold font-mono" style={{ color: '#E8600A' }}>1:23</span>
          </div>
          <span className="text-gray-400 text-xs opacity-75 font-mono">Q 3/10</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100" ref={progressBarRef}>
        <div
          className="h-full rounded-none origin-left"
          style={{
            background: '#E8600A',
            ...safariMotionStyle,
            transformOrigin: 'left center',
            transform: `translateZ(0) scaleX(${progressVisible ? 0.3 : 0})`,
            WebkitTransform: `translateZ(0) scaleX(${progressVisible ? 0.3 : 0})`,
            transitionProperty: 'transform',
            transitionDuration: '1.2s',
            transitionDelay: '0.3s',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Question bubble */}
      <div className="mx-4 sm:mx-8 mt-6 mb-3">
        <p className="font-mono" style={{
          fontSize: 12,
          color: '#E8600A',
          opacity: 0.7,
          marginBottom: '6px'
        }}>
          ↻ Уточняет ответ на предыдущий
        </p>
        <div className="p-3.5 rounded-none bg-gray-50 border border-gray-100">
          <p className="text-gray-800 text-sm leading-relaxed font-medium">
            Как обосновать тех. долг команде, которая хочет только новые фичи?
          </p>
        </div>
      </div>

      {/* AI Reasoning hint */}
      <div className="bg-neutral-100 border-l-2 border-[#8B5CF6] p-4 mx-4 sm:mx-8 my-3 mb-8">
        <div className="font-mono text-xs text-[#8B5CF6]">
          ✦ PeakTalk думает: слабая точка — отсутствие метрик
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

  function getScoreOpacity(score: number): number {
    if (score >= 7) return 1;
    if (score >= 5) return 0.6;
    return 0.3;
  }

  return (
    <div
      className="w-full rounded-none overflow-hidden border border-neutral-200 bg-white shadow-md"
      style={{ minHeight: 280 }}
    >
      {/* Summary header */}
      <div className="px-4 sm:px-8 pt-6 pb-4 border-b border-gray-100">
        <div className="mb-3 border-b border-neutral-200 pb-3">
          <div className="font-inter font-extrabold text-neutral-900" style={{ fontSize: '28px', lineHeight: 1 }}>7.1 / 10</div>
          <div className="font-mono text-neutral-400" style={{ fontSize: 12, opacity: 0.75, marginTop: '4px' }}>Готовность: выше среднего</div>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#E8600A] text-sm">✦</span>
          <p className="text-gray-800 font-semibold text-sm">Разбор завершён</p>
        </div>
        <p className="text-gray-500 text-xs opacity-75 leading-relaxed mb-3">
          Хорошая попытка. Тимлид увидел потенциал, но местами аргументы теряли опору.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {metrics.map((m) => (
              <span
                key={m.label}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-none text-xs font-bold text-white shrink-0 font-mono"
                style={{ backgroundColor: '#E8600A', opacity: getScoreOpacity(m.score) }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block" />
                {m.label} {m.score}/10
              </span>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div className="px-4 sm:px-8 py-4 border-b border-gray-100">
        <p
          className="text-xs opacity-75 text-gray-400 uppercase tracking-widest mb-2.5 font-mono"
        >
          Транскрипт
        </p>
        <div className="space-y-2.5">
          <div>
            <p className="text-xs opacity-75 text-gray-400 mb-0.5 font-mono">Тимлид</p>
            <p className="text-gray-700 text-xs opacity-75 leading-relaxed">Как обосновать тех. долг?</p>
          </div>
          <div>
            <p className="text-xs opacity-75 text-gray-400 mb-0.5 font-mono">Вы</p>
            <p className="text-gray-700 text-xs opacity-75 leading-relaxed">
              Это важно для стабильности системы,{' '}
              <span
                className="rounded-none px-1 cursor-pointer"
                style={{ background: '#fef3c7', color: '#92400e' }}
              >
                без конкретики...
              </span>
            </p>
            <p className="text-xs opacity-75 text-gray-400 mt-1 font-mono">
              ↑ нажмите — увидите комментарий
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 px-4 sm:px-8 py-4">
        <button
          className="flex items-center justify-center flex-1 gap-1.5 px-2 py-2 rounded-none border border-neutral-200 text-gray-600 text-xs opacity-75 hover:bg-gray-50 transition-colors font-mono"
        >
          <Download size={12} /> Скачать PDF
        </button>
        <button
           className="bg-[#171717] hover:bg-black text-white font-inter font-semibold rounded-none flex items-center justify-center flex-1 gap-1.5 px-2 py-2 text-xs transition-all"
        >
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
      title: 'Загружаете то, что будете защищать',
      desc: 'Не тему, не область — конкретный файл. Спич-дек, роадмап, финансовую модель, стратегию. PeakTalk разбирает именно его: аргументы, данные, структуру. Вопросы на сессии будут по вашему материалу — не по теме в целом.',
      direction: -30,
      mockup: <MockupUpload />,
    },
    {
      num: '02',
      title: 'Выбираете роль и отрабатываете ответы под реальным давлением',
      desc: '15 типов собеседников: от технического директора и венчурного инвестора до скептика из совета директоров. 10 вопросов, 90 секунд на каждый ответ. AI держит позицию выбранной роли — задаёт уточнения, давит на слабые места, не принимает уклончивые формулировки.',
      direction: 0,
      scale: 0.9,
      mockup: <MockupSession />,
    },
    {
      num: '03',
      title: 'Читаете, что именно не сработало и почему',
      desc: 'Отчёт с оценками по каждому навыку: структура, чёткость аргументов, реакция на давление. Слабые ответы подсвечены в транскрипте. Нажимаете на фрагмент — получаете конкретный комментарий. Скачиваете PDF. Идёте на встречу без белых пятен.',
      direction: 30,
      mockup: <MockupReport />,
    },
  ];

  const sectionRef = React.useRef(null);
  return (
    <section ref={sectionRef} id="how" className="relative group/section" style={{ position: 'relative', padding: 'clamp(80px, 15vw, 180px) 0', backgroundColor: '#fff' }}>
      <div className="container-custom relative">
        <h2 className="font-inter font-extrabold" style={{
          fontSize: 'clamp(24px, 3vw, 36px)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: '1rem'
        }}>
          Как это работает.
        </h2>
        <p className="mt-4 text-neutral-400 font-mono text-xs tracking-widest uppercase mb-16">Три шага до уверенной защиты.</p>

        <div className="flex flex-col">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`grid grid-cols-1 md:grid-cols-2 items-center gap-12 lg:gap-24 py-16 ${i !== steps.length - 1 ? 'border-b border-neutral-200' : ''}`}
            >
              <RevealDiv
                hidden={{ opacity: 0, x: s.direction, y: s.direction === 0 ? 24 : 0, scale: s.scale ?? 1 }}
                visible={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                delay={0.1}
                margin="-50px 0px"
                className={`${i % 2 === 1 ? 'md:order-last' : ''}`}
              >
                <div className="font-mono text-xs text-[#E8600A] tracking-widest mb-4 opacity-50 block">[{s.num}]</div>
                <h3 className="font-inter font-bold text-3xl text-neutral-900 mb-6 leading-tight max-w-lg">{s.title}</h3>
                <p className="font-inter text-base text-neutral-500 leading-relaxed max-w-lg">{s.desc}</p>
              </RevealDiv>

              <RevealDiv
                hidden={{ opacity: 0, y: 28, scale: 0.97 }}
                visible={{ opacity: 1, y: 0, scale: 1 }}
                delay={0.2}
                margin="-50px 0px"
                className="relative w-full shadow-2xl rounded-none"
              >
                {s.mockup}
              </RevealDiv>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── IMPACT EVIDENCE ─────────────────────────────────────────────────────────
function ImpactEvidence() {
  const glyphs = [
    // Прицел — точность по конкретному файлу
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="6" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.22)"/>
      <line x1="12" y1="2" x2="12" y2="6" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="18" x2="12" y2="22" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="12" x2="6" y2="12" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="12" x2="22" y2="12" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    // Сетка узлов — конкретная роль, не абстрактный интервьюер
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="2.5" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
      <circle cx="4" cy="6" r="1.5" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
      <circle cx="20" cy="6" r="1.5" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
      <circle cx="4" cy="18" r="1.5" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
      <circle cx="20" cy="18" r="1.5" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
      <line x1="9.8" y1="10.8" x2="5.5" y2="7.4" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14.2" y1="10.8" x2="18.5" y2="7.4" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9.8" y1="13.2" x2="5.5" y2="16.6" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14.2" y1="13.2" x2="18.5" y2="16.6" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    // Щит с галочкой — конкретный разбор, измеримый результат
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 6v5c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6L12 2z" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinejoin="round"/>
      <polyline points="9,12 11,14 15,10" stroke="rgba(232,96,10,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  ];
  return (
    <section id="value" className="relative overflow-hidden" style={{ padding: 'clamp(80px, 10vw, 140px) 0', backgroundColor: '#0A0A0A' }}>
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          opacity: 0.04,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
        }}
      />

      <div className="container-custom relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
          <h2 className="font-inter" style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            maxWidth: 600,
          }}>
            Почему это работает лучше.
          </h2>
          <div className="font-mono text-xs opacity-75 tracking-widest uppercase text-neutral-400">
            PeakTalk // 2026
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/10 p-[1px]">
          {[
            {
              tag: '01',
              title: 'Задаёт вопросы по вашей конкретной теме',
              detail: 'Вопросы строятся не по теме вообще, а по тому, что в вашем файле. Собеседник знает вашу аргументацию, ваши данные, вашу структуру — и ищет слабые места именно в ней.',
              stat: '15 персон-собеседников, 9 индустрий',
            },
            {
              tag: '02',
              title: 'Симулирует конкретную аудиторию, а не абстрактного интервьюера',
              detail: 'CFO и продуктовый скептик задают разные вопросы. PeakTalk держит роль выбранного собеседника через всю сессию и не переключается в режим "дружелюбного помощника", когда вы отвечаете неточно.',
              stat: '24/7, без записи и ожидания',
            },
            {
              tag: '03',
              title: 'Конкретный разбор, не ощущение',
              detail: 'После сессии знаете, какие ответы были слабыми и где именно потеряли нить. Оценки по навыкам, комментарии к каждому фрагменту транскрипта, точки роста. Измеримо. Применимо сразу.',
              stat: 'Оценки по 8 навыкам после каждой сессии',
            },
          ].map((item, i) => (
            <RevealDiv
              key={i}
              delay={i * 0.1}
              duration={0.5}
              margin="-50px 0px"
              hidden={{ opacity: 0, y: 28, scale: 0.985 }}
              visible={{ opacity: 1, y: 0, scale: 1 }}
              className="group relative bg-[#0A0A0A] flex flex-col p-8 lg:p-12 transition-all hover:bg-neutral-900 overflow-hidden"
            >
              <div className="font-mono text-xs opacity-75 text-[#E8600A] tracking-widest uppercase mb-6">{item.tag}</div>
              <div className="mb-6">{glyphs[i]}</div>
              <h3 className="font-inter font-bold text-2xl text-white mb-4 leading-tight">{item.title}</h3>
              <p className="font-inter text-sm text-neutral-400 leading-relaxed">{item.detail}</p>
              
              <div 
                className="mt-auto pt-3 border-t" 
                style={{ marginTop: '20px', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="font-mono" style={{ fontSize: 12, opacity: 0.75, color: 'rgba(255,255,255,0.35)' }}>
                  {item.stat}
                </div>
              </div>

              {/* Hover reveal line */}
              <div className="absolute bottom-0 left-0 h-[2px] bg-[#E8600A] w-0 group-hover:w-full transition-all duration-150 ease-out" />
            </RevealDiv>
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
        <div className="absolute inset-0 bg-black/70 md:bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-[#0A0A0A]" />
      </div>
      
      {/* Static Noise Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <div className="py-32 lg:py-48 text-center container-custom relative z-10 transition-colors">
        <RevealDiv
          hidden={{ opacity: 0, y: 18 }}
          visible={{ opacity: 1, y: 0 }}
          duration={0.8}
          delay={0.3}
          className="font-mono"
          style={{
            fontSize: '12px',
            color: '#E8600A',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: 0.85,
            marginBottom: '20px'
          }}>
          Первая сессия — сегодня.
        </RevealDiv>
        <h2 className="font-inter font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] text-white max-w-4xl mx-auto">
          Спич, в котором нет слабых мест.
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <a 
            href="/register" 
            className="px-6 py-3 rounded-none border border-white/30 text-white bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-150 flex items-center justify-center gap-3 font-inter font-semibold text-base group" 
          >
            <span className="relative z-10">Начать подготовку</span>
            <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform duration-150" />
          </a>
        </div>
      </div>

      <Footer />
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 relative z-10 bg-black">
      <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-8 text-white/80">
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1.5">
          <div className="brightness-0 invert"><Logo size={20} /></div>
          <div className="font-mono" style={{ fontSize: 12, opacity: 0.75, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>AI-тренер для тех, кто защищает решения под давлением</div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 font-mono text-xs opacity-75 tracking-widest uppercase text-white/40">
          <a href="/contacts" className="hover:text-white transition-colors">Контакты</a>
          <a href="/personal-data" className="hover:text-white transition-colors">Оферта</a>
          <a href="/privacy" className="hover:text-white transition-colors">Конфиденциальность</a>
        </div>
      </div>
    </footer>
  );
}

// ─── COMPARISON BLOCK ─────────────────────────────────────────────────────────
function ComparisonBlock() {
  const altLogos = [
    // Живой коуч → Zoom (video camera)
    <svg width="80" height="80" viewBox="0 0 24 24" fill="#2D8CFF" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="5.5" width="14.5" height="13" rx="2.5"/>
      <path d="M16 8.8l6.5-3v12.5L16 15.2V8.8z"/>
    </svg>,
    // Онлайн-курс → YouTube / Udemy (play in rounded rect)
    <svg width="80" height="80" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="22" height="16" rx="4" fill="#FF0000"/>
      <path d="M9.5 8.5l7 3.5-7 3.5V8.5z" fill="white"/>
    </svg>,
    // Универсальный AI → OpenAI (6-petal bloom)
    <svg width="80" height="80" viewBox="0 0 24 24" fill="#10a37f" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(12,12)">
        <rect x="-1.8" y="-8.5" width="3.6" height="8.5" rx="1.8"/>
        <rect x="-1.8" y="-8.5" width="3.6" height="8.5" rx="1.8" transform="rotate(60)"/>
        <rect x="-1.8" y="-8.5" width="3.6" height="8.5" rx="1.8" transform="rotate(120)"/>
        <rect x="-1.8" y="-8.5" width="3.6" height="8.5" rx="1.8" transform="rotate(180)"/>
        <rect x="-1.8" y="-8.5" width="3.6" height="8.5" rx="1.8" transform="rotate(240)"/>
        <rect x="-1.8" y="-8.5" width="3.6" height="8.5" rx="1.8" transform="rotate(300)"/>
      </g>
    </svg>,
  ];

  const alternatives = [
    { title: "Живой коуч", issues: ["Не знает ваш конкретный материал", "Нужно записываться заранее", "Стоит в разы дороже за сессию"], note: "Работает. Но не для подготовки к встрече через три дня." },
    { title: "Онлайн-курс", issues: ["Учит выступать вообще, не под вашу задачу", "Результат через месяцы", "Нет практики под давлением вопросов"], note: "Полезно. Но горизонт — не ближайший четверг." },
    { title: "Универсальный AI", issues: ["Не читал ваши материалы", "Не держит роль под давлением", "Нет структурированного разбора"], note: "Удобно. Но другая задача." }
  ];

  return (
    <section id="comparison" style={{ backgroundColor: '#fff', padding: 'clamp(80px,10vw,140px) 0' }}>
      <div className="container-custom">
        <h2 className="font-inter font-extrabold" style={{ fontSize: 'clamp(24px,3vw,40px)', color: '#171717', letterSpacing: '-0.03em', margin: 0 }}>
          Три альтернативы. И почему они не закрывают задачу.
        </h2>
        <div className="font-mono" style={{ fontSize: 12, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginTop: '8px', marginBottom: '48px' }}>
          PeakTalk // Сравнение
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <RevealDiv
            hidden={{ opacity: 0, y: 24, scale: 0.985 }}
            visible={{ opacity: 1, y: 0, scale: 1 }}
            duration={0.5}
            className="order-first md:order-none flex flex-col bg-[#0A0A0A] rounded-none p-8 lg:p-10 relative"
          >
            <div className="flex items-center gap-3 mb-8">
              <h3 className="font-inter font-bold text-xl text-white m-0">PeakTalk</h3>
              <div className="font-mono text-xs text-white opacity-90 tracking-widest bg-[#E8600A] px-3 py-1 rounded-none uppercase">
                Рекомендуем
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {["Читает ваш конкретный документ", "Держит роль собеседника до конца", "Разбирает каждый ответ", "Доступен прямо сейчас"].map((p, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }}>✓</span>
                  <span className="font-inter text-sm text-[rgba(255,255,255,0.85)]">{p}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <a href="/register" className="font-inter font-medium text-sm text-[#E8600A] no-underline hover:text-white transition-colors">Выбрать этот вариант →</a>
            </div>
          </RevealDiv>

          {alternatives.map((alt, i) => (
            <RevealDiv
              key={i}
              hidden={{ opacity: 0, y: 22, scale: 0.985 }}
              visible={{ opacity: 1, y: 0, scale: 1 }}
              duration={0.5}
              delay={(i + 1) * 0.08}
              className="hover:opacity-100 transition-opacity opacity-75 flex flex-col relative overflow-hidden"
              style={{ ...safariMotionStyle, backgroundColor: '#FFF', border: '1px solid #e5e7eb', borderRadius: '0px', padding: '24px' }}
            >
              <div className="absolute top-3 right-3 pointer-events-none opacity-[0.07]">
                {altLogos[i]}
              </div>
              <h3 className="font-inter" style={{ fontWeight: 700, fontSize: '18px', color: '#171717', marginBottom: '16px' }}>{alt.title}</h3>
              <div className="flex flex-col gap-3">
                {alt.issues.map((iss, j) => (
                  <div key={j} className="flex gap-2 items-start">
                    <span className="font-mono text-red-500 text-sm flex-shrink-0 mt-0.5">×</span>
                    <span className="font-inter text-sm text-neutral-500">{iss}</span>
                  </div>
                ))}
              </div>
              <div className="font-mono" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: 12, opacity: 0.75, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {alt.note}
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    { quote: "За три дня до защиты стратегии перед советом директоров загрузил годовой план и прогнал сессию с ролью скептичного финансового директора. На реальной встрече один из вопросов был почти дословно — и я знал, где моя аргументация хромает ещё до того, как его задали.", name: "Алексей К.", role: "VP of Product", company: "Финтех, 200+ сотрудников", large: true },
    { quote: "Я умею выступать. Но когда аудитория давит и начинает перебивать — я теряю нить. PeakTalk не даёт уйти от вопроса, как это делает живой коллега из вежливости. Это неудобно. Именно поэтому работает.", name: "Марина С.", role: "Независимый консультант", company: "B2B стратегия", large: true },
    { quote: "Готовился к спичу серии A. Загрузил дек, выбрал роль инвестора. Из 10 вопросов нормально закрыл четыре. После разбора понял конкретно что переформулировать.", name: "Дмитрий Е.", role: "CEO", company: "EdTech стартап", large: false }
  ];

  return (
    <section style={{ backgroundColor: '#f9fafb', padding: 'clamp(80px,10vw,120px) 0' }}>
      <div className="container-custom">
        <div className="max-w-3xl mb-12">
          <div className="font-mono" style={{ fontSize: 12, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: '12px' }}>
            Результаты
          </div>
          <h2 className="font-inter font-extrabold text-neutral-900 tracking-tight" style={{ fontSize: 'clamp(24px,3vw,40px)', lineHeight: 1.06, letterSpacing: '-0.03em', margin: 0 }}>
            Что меняется после нескольких жёстких сессий.
          </h2>
          <p className="font-inter text-neutral-500" style={{ fontSize: 16, lineHeight: 1.65, marginTop: '14px', marginBottom: 0, maxWidth: 700 }}>
            Не абстрактное «стало увереннее», а конкретный эффект: слабые места всплывают до реальной встречи, а не во время неё.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <RevealDiv
              key={i} 
              hidden={{ opacity: 0, y: 24, scale: 0.985 }}
              visible={{ opacity: 1, y: 0, scale: 1 }}
              duration={0.5}
              delay={i * 0.12}
              className={`flex flex-col bg-white group hover:-translate-y-1 transition-all duration-150 ${!t.large ? 'md:col-span-2 md:justify-self-center md:max-w-xl w-full' : ''}`}
              style={{ ...safariMotionStyle, border: '1px solid #e5e7eb', borderRadius: '0px', padding: '32px', boxShadow: '0 12px 32px rgba(0,0,0,0.03)' }}
            >
              <p className="font-inter text-base text-neutral-900 leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              
              <div className="flex gap-4 items-center" style={{ marginTop: '24px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(232,96,10,0.08)', borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="font-mono" style={{ fontSize: 12, opacity: 0.75, color: '#E8600A', fontWeight: 'bold' }}>
                    {t.name.split(' ')[0][0] + (t.name.split(' ')[1] ? t.name.split(' ')[1][0] : '')}
                  </span>
                </div>
                <div className="flex flex-col leading-tight gap-1">
                  <span className="font-inter" style={{ fontWeight: 600, fontSize: '14px', color: '#171717' }}>{t.name}</span>
                  <span className="font-mono" style={{ fontSize: 12, opacity: 0.75, color: '#737373' }}>{t.role}</span>
                  <span className="font-mono" style={{ fontSize: 12, color: '#737373', opacity: 0.7 }}>{t.company}</span>
                </div>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING BLOCK ────────────────────────────────────────────────────────────
function PricingBlock() {
  return (
    <section id="pricing" style={{ backgroundColor: '#0A0A0A', padding: 'clamp(80px,10vw,120px) 0' }}>
      <div className="container-custom">
        <h2 className="font-inter font-extrabold" style={{ fontSize: 'clamp(32px,4vw,52px)', color: '#FFF', letterSpacing: '-0.03em', textAlign: 'center', margin: 0 }}>
          Начните без обязательств.
        </h2>
        <div className="font-mono" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginTop: '12px', marginBottom: '56px' }}>
          3 полных сессии — бесплатно. Карта не нужна.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <RevealDiv
            hidden={{ opacity: 0, x: -24, scale: 0.985 }}
            visible={{ opacity: 1, x: 0, scale: 1 }}
            duration={0.7}
            className="flex flex-col bg-[#141414] border border-white/10 rounded-none p-8 md:p-10"
          >
            <div className="font-mono text-xs opacity-75 text-white/50 uppercase tracking-widest">Попробовать</div>
            <div className="font-inter font-bold text-5xl text-white leading-none mt-2">Бесплатно</div>
            <div className="font-inter text-sm text-white/50 mt-2">Навсегда. Для первых шагов.</div>
            
            <div className="h-px bg-white/10 my-8" />
            
            <div className="flex flex-col gap-3 flex-1 mb-8">
              {["3 сессии с AI-тренером", "Все 15 персон-собеседников", "Анализ ответов после каждой сессии"].map((ft, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  <span className="font-inter text-sm text-white/75">{ft}</span>
                </div>
              ))}
            </div>
            
            <a href="/register" className="w-full py-4 text-center border border-white/20 rounded-none bg-transparent text-white font-inter font-semibold text-sm hover:border-white/40 transition-colors mt-auto">
              Начать бесплатно
            </a>
          </RevealDiv>

          <RevealDiv
            hidden={{ opacity: 0, x: 24, scale: 0.985 }}
            visible={{ opacity: 1, x: 0, scale: 1 }}
            duration={0.7}
            className="flex flex-col bg-[#141414] border border-white/10 rounded-none p-8 md:p-10"
          >
            <div className="font-mono text-xs opacity-75 text-[#E8600A] uppercase tracking-widest">Профессиональный доступ</div>
            <div className="font-inter font-bold text-5xl text-white leading-none mt-2 flex items-baseline gap-2">от 990 ₽ <span className="text-2xl font-medium text-white/50">/ мес</span></div>
            <div className="font-inter text-sm text-white/50 mt-2">Отмени в любой момент.</div>
            
            <div className="h-px bg-white/10 my-8" />
            
            <div className="flex flex-col gap-3 flex-1 mb-8">
              {["Неограниченные сессии", "История всех сессий (90 дней)", "Приоритетная обработка AI", "Экспорт PDF-отчётов"].map((ft, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  <span className="font-inter text-sm text-white/75">{ft}</span>
                </div>
              ))}
            </div>
            
            <a href="/pricing" className="bg-white hover:bg-neutral-100 text-[#0A0A0A] font-inter font-semibold rounded-none w-full mt-auto block text-center py-3 text-sm transition-all">
              Выбрать Pro
            </a>
          </RevealDiv>
        </div>

        <div className="font-mono text-xs text-white/40 text-center mt-8">
          Без скрытых платежей. Без автоподписки на Free-плане.
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="relative min-h-screen selection:bg-[#E8600A] selection:text-white">
      <Nav />
      <Hero />
      <ActionFlow />
      <ImpactEvidence />
      <ComparisonBlock />
      <Testimonials />
      <PricingBlock />
      <FooterCTA />
    </main>
  );
}
