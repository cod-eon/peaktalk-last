"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
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
  const [isIOSSafari] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent;
    const isIOS = /iP(hone|ad|od)/.test(userAgent);
    const isWebKit = /WebKit/i.test(userAgent);
    const isCriOS = /CriOS/i.test(userAgent);
    const isFxiOS = /FxiOS/i.test(userAgent);
    return isIOS && isWebKit && !isCriOS && !isFxiOS;
  });
  return isIOSSafari;
}

function normalizeRevealTarget(target: RevealTarget, disableScale: boolean): RevealTarget {
  if (!disableScale) return target;
  return { ...target, scale: 1, scaleX: target.scaleX };
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
              { label: 'Сценарии', id: '#scenarios' },
              { label: 'Как работает', id: '#how' },
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
              <Link href="/login" className="font-mono text-neutral-900" style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                opacity: 0.72
              }}>Вход</Link>
              <div style={{ width: 1, height: 16, backgroundColor: '#e5e7eb' }} />
              <Link href="/simulation/guest" className="bg-[#171717] hover:bg-black text-white font-inter font-semibold rounded-none px-5 py-2.5 text-sm flex items-center transition-all">
                Попробовать бесплатно
              </Link>
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
                { label: 'Сценарии', id: '#scenarios' },
                { label: 'Как работает', id: '#how' },
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
              <Link href="/login" className="font-inter font-semibold text-neutral-400" style={{
                fontSize: 18,
                textDecoration: 'none',
                padding: '8px 0',
              }}>Личный кабинет</Link>
              <Link href="/simulation/guest" className="bg-[#171717] hover:bg-black text-white font-inter font-semibold rounded-none px-6 py-3.5 text-sm flex items-center justify-center w-full transition-all">
                Попробовать бесплатно
              </Link>
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

            {/* Text Content */}
            <div className="w-full max-w-2xl shrink-0 relative z-20 flex flex-col items-start text-left sm:items-center sm:text-center lg:items-start lg:text-left mt-12 lg:mt-0 lg:pr-10">

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0 }}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500 border border-neutral-200 rounded-none px-4 py-1.5 mb-5 bg-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
              >
                Тренажер для защиты проектов, бюджетов и QBR
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-inter font-bold text-[34px] sm:text-5xl lg:text-[64px] text-neutral-900 tracking-tight leading-[0.92] mb-5 max-w-[13.5ch] sm:max-w-[15.5ch] lg:max-w-[16ch]"
              >
                <span className="block">Стресс-тест</span>
                <span className="block">аргументов перед</span>
                <span className="block">жёсткой <span className="text-[#E8600A] relative">защитой</span>.</span>
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
                Пройдите жесткий Q&amp;A с AI-стейкхолдером по вашему документу. Найдите уязвимости в презентации, PnL или финмодели до того, как их найдет бизнес.
              </motion.p>

              {/* Stats strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                style={safariMotionStyle}
                className="grid grid-cols-3 w-full max-w-[520px] mb-6 overflow-hidden rounded-none border border-neutral-200 bg-white/85 shadow-[0_18px_40px_rgba(0,0,0,0.04)]"
              >
                {[
                  { value: '4', label: 'типа оппонентов' },
                  { value: '5', label: 'навыков в оценке' },
                  { value: '100%', label: 'конфиденциально' },
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
                  <Link
                    href="/simulation/guest"
                    className="bg-[#171717] hover:bg-black text-white font-inter font-semibold rounded-none w-full sm:w-auto flex items-center justify-center p-3 sm:px-6 text-sm transition-all"
                  >
                    Попробовать 3 вопроса бесплатно →
                  </Link>
                  <button
                    className="hidden sm:flex w-auto items-center justify-center p-3 sm:px-6 transition-all rounded-none border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50"
                    onClick={() => smoothScroll('#scenarios')}
                  >
                    Посмотреть сценарии →
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                    Без регистрации. Без карты.
                  </p>
                  <button
                    className="sm:hidden font-inter text-sm text-neutral-500 underline underline-offset-2 transition-colors hover:text-neutral-900"
                    onClick={() => smoothScroll('#scenarios')}
                  >
                    Сценарии →
                  </button>
                </div>
              </motion.div>
            </div>

            {/* AI Visual */}
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

// ─── USE CASES ────────────────────────────────────────────────────────────────
function UseCases() {
  const cases = [
    {
      tag: 'CFO',
      title: 'Защита бюджета',
      desc: 'Ваш бюджет будет порезан, если вы не можете ответить на эти вопросы.',
      accent: '#E8600A',
    },
    {
      tag: 'Инвестор',
      title: 'Питч раунда',
      desc: 'Инвесторы слышали всё. Ваш нарратив должен выдержать давление.',
      accent: '#8B5CF6',
    },
    {
      tag: 'Клиент',
      title: 'QBR с клиентом',
      desc: 'Клиент недоволен. Подготовьтесь к жёсткому разговору.',
      accent: '#10b981',
    },
    {
      tag: 'Совет директоров',
      title: 'Защита roadmap',
      desc: 'Стейкхолдеры будут давить. Знайте свои ответы заранее.',
      accent: '#3b82f6',
    },
  ];

  return (
    <section id="scenarios" style={{ backgroundColor: '#fff', padding: 'clamp(80px, 10vw, 120px) 0' }}>
      <div className="container-custom">
        <RevealDiv
          hidden={{ opacity: 0, y: 18 }}
          visible={{ opacity: 1, y: 0 }}
          duration={0.6}
          margin="-50px 0px"
          className="mb-12"
        >
          <div className="font-mono text-xs text-neutral-400 uppercase tracking-widest mb-3">Сценарии</div>
          <h2 className="font-inter font-extrabold text-neutral-900" style={{ fontSize: 'clamp(24px, 3vw, 40px)', letterSpacing: '-0.03em', lineHeight: 1.06 }}>
            Под какую встречу готовитесь?
          </h2>
          <p className="font-inter text-neutral-500 mt-3" style={{ fontSize: 16, maxWidth: 520, lineHeight: 1.6 }}>
            Загрузите документ по конкретному сценарию — симулятор настроит вопросы под роль оппонента.
          </p>
        </RevealDiv>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cases.map((c, i) => (
            <RevealDiv
              key={i}
              hidden={{ opacity: 0, y: 24, scale: 0.985 }}
              visible={{ opacity: 1, y: 0, scale: 1 }}
              duration={0.5}
              delay={i * 0.08}
              margin="-50px 0px"
              className="group relative flex flex-col border border-neutral-200 bg-white hover:border-neutral-300 transition-all p-6"
            >
              <div
                className="font-mono text-[11px] uppercase tracking-widest px-2.5 py-1 mb-4 inline-flex w-fit"
                style={{ backgroundColor: `${c.accent}14`, color: c.accent }}
              >
                {c.tag}
              </div>
              <h3 className="font-inter font-bold text-neutral-900 text-lg mb-2 leading-snug">{c.title}</h3>
              <p className="font-inter text-neutral-500 text-sm leading-relaxed flex-1">{c.desc}</p>
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <Link
                  href="/simulation/guest"
                  className="font-mono text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1.5"
                >
                  Запустить <ArrowRight size={11} />
                </Link>
              </div>
              <div
                className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-150 ease-out"
                style={{ backgroundColor: c.accent }}
              />
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Загрузи документ или выбери готовый сценарий',
      desc: 'Не тему — конкретный файл: спич-дек, финмодель, роадмап. PeakTalk разбирает именно его аргументы и данные. Вопросы на сессии будут по вашему материалу.',
      mockup: <MockupUpload />,
    },
    {
      num: '02',
      title: 'Выбери оппонента: CFO, инвестор, клиент, совет директоров',
      desc: 'Каждая роль задаёт разные вопросы. CFO режет по ROI. Инвестор давит на риски. Клиент требует обоснование. Совет директоров проверяет стратегию.',
      mockup: <MockupSession />,
    },
    {
      num: '03',
      title: 'Пройди жёсткий Q&A — получи шпаргалку с сильными аргументами',
      desc: 'После сессии — разбор по каждому ответу. Слабые места подсвечены. Знаете, где и почему потеряли нить. Идёте на встречу без белых пятен.',
      mockup: <MockupReport />,
    },
  ];

  return (
    <section id="how" className="relative" style={{ backgroundColor: '#fff', padding: 'clamp(80px, 15vw, 180px) 0' }}>
      <div className="container-custom">
        <RevealDiv
          hidden={{ opacity: 0, y: 18 }}
          visible={{ opacity: 1, y: 0 }}
          duration={0.6}
          margin="-50px 0px"
          className="mb-16"
        >
          <h2 className="font-inter font-extrabold" style={{ fontSize: 'clamp(24px, 3vw, 36px)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Как это работает.
          </h2>
          <p className="font-mono text-neutral-400 text-xs tracking-widest uppercase">Три шага до уверенной защиты.</p>
        </RevealDiv>

        <div className="flex flex-col">
          {steps.map((s, i) => (
            <div
              key={s.num}
              className={`grid grid-cols-1 md:grid-cols-2 items-center gap-12 lg:gap-24 py-16 ${i !== steps.length - 1 ? 'border-b border-neutral-200' : ''}`}
            >
              <RevealDiv
                hidden={{ opacity: 0, x: -24, y: 0, scale: 1 }}
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

// ─── MOCKUPS (reused from original) ──────────────────────────────────────────
function MockupUpload() {
  const files = [
    { name: 'budget_defence_q3.pdf', size: '1.4 MB' },
    { name: 'pitch_deck_series_a.pdf', size: '3.2 MB' },
  ];
  return (
    <div className="w-full rounded-none overflow-hidden border border-neutral-200 bg-white shadow-md relative" style={{ minHeight: 240 }}>
      <div className="flex items-center justify-center px-4 sm:px-8 py-4 border-b border-neutral-200 bg-gray-50">
        <span className="text-xs text-neutral-400 tracking-widest font-mono">[ PEAKTALK // ЗАГРУЗКА ]</span>
      </div>
      <div className="border border-dashed border-neutral-300 rounded-none mx-4 sm:mx-8 mt-6 py-6 sm:py-10 flex flex-col items-center gap-3 bg-gray-50 hover:border-neutral-400 transition-colors cursor-pointer">
        <div className="w-9 h-9 rounded-none bg-orange-50 flex items-center justify-center">
          <FileText size={18} style={{ color: '#E8600A' }} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-neutral-900 font-semibold text-sm">Перетащите файл или выберите</p>
          <p className="text-neutral-400 text-xs mt-0.5 font-mono">PDF, PPTX, DOCX — любой формат</p>
        </div>
      </div>
      <div className="px-4 sm:px-8 pt-4 pb-6 flex flex-col gap-3">
        {files.map((f) => (
          <div key={f.name} className="flex items-center justify-between px-3 py-2.5 rounded-none bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-none bg-orange-50 flex items-center justify-center shrink-0">
                <FileText size={12} style={{ color: '#E8600A' }} />
              </div>
              <span className="text-gray-700 text-xs truncate font-mono">{f.name}</span>
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
    <div className="w-full rounded-none overflow-hidden border border-neutral-200 bg-white shadow-md flex flex-col" style={{ minHeight: 260 }}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none flex items-center justify-center shrink-0 border border-neutral-200 bg-white">
            <span className="text-xs opacity-75 font-bold font-mono" style={{ color: '#8B5CF6' }}>CFO</span>
          </div>
          <div className="flex flex-col leading-none gap-1">
            <span className="font-semibold text-gray-900" style={{ fontSize: '13px' }}>Финансовый директор</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 font-mono" style={{ fontSize: 10 }}>Жёстко</span>
              <span className="text-gray-400 font-mono" style={{ fontSize: 10 }}>Вопрос 3 из 10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-5 flex flex-col gap-4 bg-white relative">
        {/* Assistant Message */}
        <div className="flex justify-start">
          <div className="max-w-[85%] px-4 py-3 bg-neutral-50 border border-neutral-200 text-neutral-900 font-inter text-sm leading-relaxed">
            Вы просите $500k на новую инициативу, но в финмодели я не вижу четкого обоснования возврата инвестиций. Каков ROI на горизонте 12 месяцев?
          </div>
        </div>

        {/* User Message (typing or sent) */}
        <div className="flex justify-end">
          <div className="max-w-[85%] px-4 py-3 bg-neutral-900 text-white font-inter text-sm leading-relaxed relative">
            <span className="opacity-50 absolute -left-10 top-3 text-[10px] text-neutral-400 font-mono">Вы</span>
            Мы ожидаем рост LTV на 15%, что перекроет затраты уже в Q3...
            <span className="inline-block w-1 h-3 ml-1 bg-white animate-pulse" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100" ref={progressBarRef}>
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
      </div>
    </div>
  );
}

function MockupReport() {
  const metrics = [
    { label: 'Аргументация', score: 8 },
    { label: 'Устойчивость', score: 4 },
    { label: 'Структура', score: 7 },
  ];

  function getScoreOpacity(score: number): number {
    if (score >= 7) return 1;
    if (score >= 5) return 0.6;
    return 0.3;
  }

  function getScoreColor(score: number): string {
    if (score >= 7) return '#10b981';
    if (score >= 5) return '#f59e0b';
    return '#e11d48';
  }

  return (
    <div className="w-full rounded-none overflow-hidden border border-neutral-200 bg-white shadow-md flex flex-col" style={{ minHeight: 280 }}>
      <div className="px-5 sm:px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-neutral-50 to-white">
        <div className="flex justify-between items-start mb-4">
          <div>
             <div className="font-inter text-neutral-500 font-medium text-[10px] mb-1 tracking-widest uppercase">Разбор завершён</div>
             <div className="font-inter font-extrabold text-neutral-900 leading-none" style={{ fontSize: '32px' }}>
               6<span className="text-lg text-neutral-400 font-medium">/10</span>
             </div>
          </div>
          <div className="text-right">
             <div className="font-mono text-neutral-500" style={{ fontSize: 11 }}>CFO</div>
             <div className="font-mono text-neutral-900 font-bold" style={{ fontSize: 11 }}>Средняя готовность</div>
          </div>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">
          «Хорошая попытка, оппонент увидел потенциал. Но местами ты плавал в цифрах — фундамент пошатнулся.»
        </p>

        <div className="flex flex-wrap gap-1.5">
          {metrics.map((m) => {
            const color = getScoreColor(m.score);
            return (
            <span
              key={m.label}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-none text-xs font-bold font-mono border"
              style={{ color, backgroundColor: `${color}12`, borderColor: `${color}30` }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {m.label} {m.score}/10
            </span>
          )})}
        </div>
      </div>

      <div className="flex-1 p-5 bg-white">
        <div className="border-l-2 border-amber-200 pl-3 mb-4">
          <p className="text-xs font-bold text-neutral-900 mb-1">Слабое место: Обоснование ROI</p>
          <p className="text-[13px] text-neutral-600">На 3-м вопросе вы ушли от ответа про конкретные сроки окупаемости. Рекомендуем подготовить расчет...</p>
        </div>
      </div>
    </div>
  );
}

// ─── SOCIAL PROOF ─────────────────────────────────────────────────────────────
function SocialProof() {
  return (
    <section style={{ backgroundColor: '#0A0A0A', padding: 'clamp(60px, 8vw, 100px) 0' }}>
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/10 p-[1px]">
          {[
            { value: 'QBR', label: 'Защиты и бюджеты', sub: 'Для high-stakes бесед' },
            { value: '4', label: 'ключевых персоны', sub: 'CFO · Инвестор · Совет директоров · Клиент' },
            { value: '5', label: 'критических навыков', sub: 'аргументация, структура, устойчивость' },
          ].map((item, i) => (
            <RevealDiv
              key={i}
              delay={i * 0.08}
              duration={0.5}
              margin="-40px 0px"
              hidden={{ opacity: 0, y: 20 }}
              visible={{ opacity: 1, y: 0 }}
              className="bg-[#0A0A0A] flex flex-col p-8 lg:p-10"
            >
              <div className="font-inter font-extrabold text-white" style={{ fontSize: 'clamp(36px, 4vw, 52px)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {item.value}
              </div>
              <div className="font-mono text-[#E8600A] text-xs uppercase tracking-widest mt-2 mb-1">{item.label}</div>
              <div className="font-mono text-neutral-500 text-xs mt-1">{item.sub}</div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING TEASER ───────────────────────────────────────────────────────────
function PricingBlock() {
  return (
    <section id="pricing" style={{ backgroundColor: '#0A0A0A', padding: 'clamp(80px, 10vw, 120px) 0' }}>
      <div className="container-custom">
        <h2 className="font-inter font-extrabold" style={{ fontSize: 'clamp(32px, 4vw, 52px)', color: '#FFF', letterSpacing: '-0.03em', textAlign: 'center', margin: 0 }}>
          Начните без обязательств.
        </h2>
        <div className="font-mono" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginTop: '12px', marginBottom: '56px' }}>
          3 вопроса — без регистрации. Полная сессия — от 299 ₽.
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
            <div className="font-inter text-sm text-white/50 mt-2">3 вопроса. Без регистрации.</div>

            <div className="h-px bg-white/10 my-8" />

            <div className="flex flex-col gap-3 flex-1 mb-8">
              {[
                "3 вопроса Q&A по вашему документу",
                "Выбор персоны-оппонента",
                "Базовая обратная связь после сессии",
              ].map((ft, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  <span className="font-inter text-sm text-white/75">{ft}</span>
                </div>
              ))}
            </div>

            <Link href="/simulation/guest" className="w-full py-4 text-center border border-white/20 rounded-none bg-transparent text-white font-inter font-semibold text-sm hover:border-white/40 transition-colors mt-auto">
              Начать бесплатно
            </Link>
          </RevealDiv>

          <RevealDiv
            hidden={{ opacity: 0, x: 24, scale: 0.985 }}
            visible={{ opacity: 1, x: 0, scale: 1 }}
            duration={0.7}
            className="flex flex-col bg-[#141414] border border-white/10 rounded-none p-8 md:p-10"
          >
            <div className="font-mono text-xs opacity-75 text-[#E8600A] uppercase tracking-widest">Полная сессия</div>
            <div className="font-inter font-bold text-5xl text-white leading-none mt-2 flex items-baseline gap-2">
              299 ₽ <span className="text-2xl font-medium text-white/50">/ сессия</span>
            </div>
            <div className="font-inter text-sm text-white/50 mt-2">Или от 990 ₽/мес без ограничений.</div>

            <div className="h-px bg-white/10 my-8" />

            <div className="flex flex-col gap-3 flex-1 mb-8">
              {[
                "10 вопросов с жёстким Q&A",
                "Полный разбор по 5 навыкам",
                "Транскрипт с комментариями",
                "Экспорт PDF-отчёта",
              ].map((ft, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  <span className="font-inter text-sm text-white/75">{ft}</span>
                </div>
              ))}
            </div>

            <Link href="/billing" className="bg-white hover:bg-neutral-100 text-[#0A0A0A] font-inter font-semibold rounded-none w-full mt-auto block text-center py-3 text-sm transition-all">
              Посмотреть все тарифы
            </Link>
          </RevealDiv>
        </div>

        <div className="font-mono text-xs text-white/40 text-center mt-8">
          Без скрытых платежей. Без автоподписки на бесплатном режиме.
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER CTA ───────────────────────────────────────────────────────────────
function FooterCTA() {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img src="/footercta_bg.png" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/70 md:bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-[#0A0A0A]" />
      </div>
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <div className="py-32 lg:py-48 text-center container-custom relative z-10">
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
          }}
        >
          Следующая важная встреча уже в календаре.
        </RevealDiv>
        <h2 className="font-inter font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] text-white max-w-4xl mx-auto">
          Подготовься сейчас.
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Link
            href="/simulation/guest"
            className="px-6 py-3 rounded-none border border-white/30 text-white bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-150 flex items-center justify-center gap-3 font-inter font-semibold text-base group"
          >
            <span className="relative z-10">Начать стресс-тест</span>
            <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform duration-150" />
          </Link>
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
          <div className="font-mono" style={{ fontSize: 12, opacity: 0.75, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
            Стресс-тест аргументации до реальной встречи
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 font-mono text-xs opacity-75 tracking-widest uppercase text-white/40">
          <Link href="/contacts" className="hover:text-white transition-colors">Контакты</Link>
          <Link href="/personal-data" className="hover:text-white transition-colors">Оферта</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Конфиденциальность</Link>
        </div>
      </div>
    </footer>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <main className="relative min-h-screen selection:bg-[#E8600A] selection:text-white">
      <Nav />
      <Hero />
      <UseCases />
      <HowItWorks />
      <SocialProof />
      <PricingBlock />
      <FooterCTA />
    </main>
  );
}
