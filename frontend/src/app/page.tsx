"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  Lock,
  Menu,
  MessageSquare,
  Shield,
  ShieldAlert,
  Target,
  X,
  Zap,
} from 'lucide-react';
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

const navItems = [
  { label: 'Сценарии', id: '#scenarios' },
  { label: 'Как работает', id: '#how' },
  { label: 'Сравнение', id: '#comparison' },
  { label: 'Цены', id: '#pricing' },
];

const smoothScroll = (id: string) => {
  const element = document.querySelector(id);
  if (!element) return;
  const navHeight = 88;
  const y = element.getBoundingClientRect().top + window.scrollY - navHeight;
  window.scrollTo({ top: y, behavior: 'smooth' });
};

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrolled;
}

function useRevealTrigger<T extends HTMLElement>(margin: RevealMargin = '-64px 0px') {
  const ref = useRef<T | null>(null);
  const isInView = useInView(ref, { once: true, margin, amount: 0.18 });
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
  hidden = { opacity: 0, y: 22, scale: 0.99 },
  visible = { opacity: 1, y: 0, scale: 1 },
  delay = 0,
  duration = 0.55,
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

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`font-mono text-[11px] uppercase tracking-[0.18em] ${dark ? 'text-white/[0.42]' : 'text-neutral-500'}`}>
      {children}
    </div>
  );
}

function Logo({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo_svg.svg" alt="PeakTalk Logo" width={52} height={52} className="h-[52px] w-[52px]" priority />
      <span className="brand-wordmark text-neutral-950" style={{ fontSize: size * 0.9 }}>
        PeakTalk
      </span>
    </div>
  );
}

function Nav() {
  const scrolled = useScrolled();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ y: -90 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${scrolled ? 'border-b border-black/[0.08] bg-[#faf8f4]/90 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.05)] backdrop-blur-2xl' : 'bg-transparent py-4'}`}
      >
        <div className="container-custom flex items-center justify-between gap-5">
          <Link href="/" aria-label="PeakTalk">
            <Logo />
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => smoothScroll(item.id)}
                className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-600 transition-colors duration-150 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/login"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30"
            >
              Вход
            </Link>
            <Link
              href="/simulation/guest"
              className="inline-flex min-h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#E8600A] hover:border-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40"
            >
              Проверить документ
            </Link>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 cursor-pointer items-center justify-center border border-neutral-300 bg-white/80 text-neutral-950 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu size={22} />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex flex-col bg-[#faf8f4] p-6"
          >
            <div className="mb-14 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-12 w-12 cursor-pointer items-center justify-center border border-neutral-300 bg-white text-neutral-950"
                aria-label="Закрыть меню"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => smoothScroll(item.id), 260);
                  }}
                  className="cursor-pointer border-b border-neutral-200 py-4 text-left font-display text-[26px] font-semibold leading-none text-neutral-950"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-auto grid gap-3">
              <Link href="/login" className="flex min-h-12 items-center justify-center border border-neutral-300 text-sm font-semibold text-neutral-950">
                Войти
              </Link>
              <Link href="/simulation/guest" className="flex min-h-12 items-center justify-center border border-neutral-950 bg-neutral-950 text-sm font-semibold text-white">
                Проверить документ бесплатно
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#faf8f4] pt-28 lg:pt-32">
      <div className="absolute inset-0 opacity-[0.45]" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.055)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(232,96,10,0.13),transparent_32%),linear-gradient(180deg,transparent_0%,#faf8f4_78%)]" />
      </div>

      <div className="container-custom relative z-10 grid min-h-[calc(100vh-112px)] items-center gap-10 pb-16 lg:grid-cols-[minmax(0,0.93fr)_minmax(480px,1.07fr)] lg:pb-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-6 inline-flex border border-neutral-300 bg-white/72 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-600 shadow-[0_12px_30px_rgba(0,0,0,0.04)]"
          >
            Peaktalk / meeting defense workspace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[30px] font-black uppercase leading-[0.94] text-neutral-950 min-[420px]:text-[36px] sm:text-[64px] lg:text-[62px] xl:text-[72px]"
          >
            Документ
            <span className="block text-[#E8600A]">должен</span>
            выдержать
            <span className="block">встречу.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-[320px] text-[17px] leading-[1.65] text-neutral-700 sm:max-w-[620px] sm:text-[19px]"
          >
            PeakTalk читает ваш рабочий документ как будущий оппонент: давит по ROI, срокам, рискам и trade-offs,
            а затем собирает prep-card до реального разговора.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 grid max-w-[320px] gap-3 sm:flex sm:max-w-none sm:items-center"
          >
            <Link
              href="/simulation/guest"
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 border border-neutral-950 bg-neutral-950 px-6 text-sm font-bold text-white transition-colors duration-150 hover:border-[#E8600A] hover:bg-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40"
            >
              Проверить документ — 3 вопроса
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              onClick={() => smoothScroll('#scenarios')}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center border border-neutral-300 bg-white/68 px-6 text-sm font-semibold text-neutral-800 transition-colors duration-150 hover:border-neutral-950 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30"
            >
              Посмотреть сценарии
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.38 }}
            className="mt-7 grid max-w-[320px] grid-cols-1 border border-neutral-300 bg-white/68 sm:max-w-[650px] sm:grid-cols-3"
          >
            {[
              ['Input', 'memo / deck / QBR'],
              ['Pressure', 'CFO / client / board'],
              ['Output', 'risks / prep-card / report'],
            ].map(([label, value], index) => (
              <div key={label} className={`px-4 py-4 ${index > 0 ? 'border-t border-neutral-300 sm:border-l sm:border-t-0' : ''}`}>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">{label}</div>
                <div className="mt-1 text-sm font-bold text-neutral-950">{value}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={safariMotionStyle}
          className="relative min-w-0 lg:translate-x-10 lg:translate-y-5 xl:translate-x-14"
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

function ProblemAgitation() {
  const problems = [
    {
      method: 'Живой коуч',
      problem: 'Хорош для навыка, но не знает ваш QBR, финмодель и политический контекст встречи в четверг.',
    },
    {
      method: 'Онлайн-курс',
      problem: 'Учит коммуникации вообще. А вам нужен разбор конкретного документа и конкретных возражений.',
    },
    {
      method: 'Универсальный AI-чат',
      problem: 'Отвечает охотно, но редко держит роль жёсткого стейкхолдера и не оставляет рабочий артефакт.',
    },
  ];

  return (
    <section className="bg-white py-[clamp(76px,9vw,118px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 max-w-4xl" margin="-50px 0px">
          <SectionLabel>problem / pressure gap</SectionLabel>
          <h2 className="mt-4 max-w-4xl font-display text-[32px] font-black uppercase leading-[1.02] text-neutral-950 sm:text-[48px] lg:text-[58px]">
            Идеи редко проваливаются из-за идеи. Чаще — из-за ответа на третий неудобный вопрос.
          </h2>
        </RevealDiv>

        <div className="grid border border-neutral-200 md:grid-cols-3">
          {problems.map((item, index) => (
            <RevealDiv
              key={item.method}
              delay={index * 0.06}
              className={`group relative min-h-[250px] bg-white p-6 transition-colors duration-150 hover:bg-[#111111] ${index > 0 ? 'border-t border-neutral-200 md:border-l md:border-t-0' : ''}`}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E8600A]">0{index + 1}</div>
              <h3 className="mt-8 text-2xl font-bold text-neutral-950 transition-colors group-hover:text-white">{item.method}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-600 transition-colors group-hover:text-white/68">{item.problem}</p>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#E8600A] transition-all duration-200 group-hover:w-full" />
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActionFlow() {
  const steps = [
    {
      number: '01',
      title: 'Загружаете то, что будете защищать',
      body: 'Не тему и не “контекст”. Конкретный документ: budget memo, roadmap, pitch deck, QBR. Вопросы строятся вокруг ваших формулировок и дыр в логике.',
      label: 'document intake',
      icon: FileText,
    },
    {
      number: '02',
      title: 'Выбираете, кто будет спорить',
      body: 'CFO давит на окупаемость, клиент на ценность, инвестор на модель роста, board на trade-offs. Роль меняет угол атаки.',
      label: 'opponent model',
      icon: ShieldAlert,
    },
    {
      number: '03',
      title: 'Получаете разбор, а не комплименты',
      body: 'Критические возражения, слабые ответы, prep-card и список мест, которые надо укрепить до созвона или кабинета.',
      label: 'meeting artifact',
      icon: BarChart3,
    },
  ];

  return (
    <section id="how" className="bg-[#faf8f4] py-[clamp(80px,11vw,146px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end" margin="-50px 0px">
          <div>
            <SectionLabel>how it works</SectionLabel>
          <h2 className="mt-4 max-w-3xl font-display text-[32px] font-black leading-[1.05] text-neutral-950 sm:text-[46px] lg:text-[56px]">
            Один документ. Один оппонент. Один честный разбор.
          </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-neutral-600">
            Без учебной сцены и лишней геймификации. Это рабочий prep-room для переговоров, защиты решений и сложных апдейтов.
          </p>
        </RevealDiv>

        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <RevealDiv key={step.number} delay={index * 0.08} className="border border-neutral-300 bg-white p-6 lg:min-h-[390px]">
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-6">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">{step.label}</div>
                  <div className="mt-2 font-display text-[44px] font-black leading-none text-[#E8600A]">{step.number}</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center border border-neutral-200 bg-[#faf8f4] text-neutral-950">
                  <step.icon size={20} />
                </div>
              </div>
              <h3 className="mt-8 text-[24px] font-bold leading-[1.12] text-neutral-950">{step.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">{step.body}</p>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImpactEvidence() {
  const evidence = [
    {
      title: 'Слабые допущения',
      body: 'Где документ просит поверить, но не показывает цифры, диапазоны или последствия.',
      icon: Target,
    },
    {
      title: 'Опасные формулировки',
      body: 'Где ответ звучит уверенно, но уходит от факта, срока, владельца или trade-off.',
      icon: MessageSquare,
    },
    {
      title: 'Prep-card перед встречей',
      body: 'Что открыть за пять минут до разговора: opening move, опорные цифры, риски и ответы.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0b0b0b] py-[clamp(84px,11vw,150px)] text-white">
      <div className="absolute inset-0 opacity-[0.055]" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#E8600A] via-white/20 to-transparent" aria-hidden="true" />

      <div className="container-custom relative z-10">
        <RevealDiv className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end" margin="-50px 0px">
          <div>
            <SectionLabel dark>why it works</SectionLabel>
            <h2 className="mt-4 max-w-4xl font-display text-[34px] font-black leading-[1.04] text-white sm:text-[52px] lg:text-[68px]">
              Не “улучшает текст”. Показывает, где вас разберут.
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-white/55">
            Польза не в красивой формулировке. Польза в том, что слабое место всплывает на экране, а не перед CFO, клиентом или советом директоров.
          </p>
        </RevealDiv>

        <div className="grid border border-white/12 lg:grid-cols-3">
          {evidence.map((item, index) => (
            <RevealDiv
              key={item.title}
              delay={index * 0.07}
              className={`relative min-h-[300px] bg-white/[0.025] p-7 ${index > 0 ? 'border-t border-white/12 lg:border-l lg:border-t-0' : ''}`}
            >
              <div className="mb-10 inline-flex h-12 w-12 items-center justify-center border border-white/16 bg-white/[0.035] text-[#E8600A]">
                <item.icon size={20} />
              </div>
              <h3 className="text-[24px] font-bold text-white">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55">{item.body}</p>
              <div className="absolute bottom-6 right-7 font-mono text-[11px] uppercase tracking-[0.16em] text-white/20">signal 0{index + 1}</div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function Scenarios() {
  const scenarios = [
    {
      tag: 'CFO',
      title: 'Защита бюджета',
      desc: 'Окупаемость, payback period, цена задержки, что можно убрать без риска.',
      artifact: 'Budget memo / financial model',
    },
    {
      tag: 'Investor',
      title: 'Питч раунда',
      desc: 'Модель роста, рынок, unit-экономика, почему ставка сейчас оправдана.',
      artifact: 'Pitch deck / fundraising memo',
    },
    {
      tag: 'Client',
      title: 'QBR и продление',
      desc: 'Доказательство impact, renewal risk, неприятные вопросы по результатам квартала.',
      artifact: 'QBR deck / account review',
    },
    {
      tag: 'Board',
      title: 'Защита roadmap',
      desc: 'Приоритеты, ресурсы, trade-offs, стоимость переноса и отказа от фич.',
      artifact: 'Roadmap / strategy memo',
    },
  ];

  return (
    <section id="scenarios" className="bg-white py-[clamp(82px,10vw,128px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 max-w-3xl" margin="-50px 0px">
          <SectionLabel>meeting scenarios</SectionLabel>
          <h2 className="mt-4 font-display text-[32px] font-black leading-[1.06] text-neutral-950 sm:text-[46px] lg:text-[54px]">
            Не переговоры вообще. Конкретные встречи, где документ должен держаться.
          </h2>
        </RevealDiv>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {scenarios.map((item, index) => (
            <RevealDiv key={item.title} delay={index * 0.06} className="group flex min-h-[330px] flex-col border border-neutral-200 bg-white p-6 transition-colors duration-150 hover:bg-neutral-950">
              <div className="mb-8 inline-flex w-fit border border-[#E8600A]/25 bg-[#E8600A]/[0.08] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#B74707] group-hover:border-[#E8600A]/45 group-hover:text-[#ff8d42]">
                {item.tag}
              </div>
              <h3 className="text-[23px] font-bold leading-[1.1] text-neutral-950 transition-colors group-hover:text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 transition-colors group-hover:text-white/60">{item.desc}</p>
              <div className="mt-auto border-t border-neutral-200 pt-5 transition-colors group-hover:border-white/12">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">artifact</div>
                <div className="mt-1 text-sm font-semibold text-neutral-800 transition-colors group-hover:text-white/78">{item.artifact}</div>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonBlock() {
  const alternatives = [
    {
      title: 'Коуч',
      weakness: 'Дорогой и не всегда доступен именно перед срочной встречей.',
    },
    {
      title: 'Курс',
      weakness: 'Длинный горизонт обучения вместо проверки конкретного материала.',
    },
    {
      title: 'AI-чат',
      weakness: 'Слишком уступчивый: помогает писать, но редко держит неприятную роль.',
    },
  ];

  return (
    <section id="comparison" className="bg-[#faf8f4] py-[clamp(82px,10vw,130px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 max-w-3xl" margin="-50px 0px">
          <SectionLabel>comparison</SectionLabel>
          <h2 className="mt-4 font-display text-[32px] font-black leading-[1.06] text-neutral-950 sm:text-[46px] lg:text-[54px]">
            У PeakTalk другая задача: не успокоить, а вскрыть риск.
          </h2>
        </RevealDiv>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <RevealDiv className="border border-neutral-950 bg-neutral-950 p-7 text-white lg:p-9">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E8600A]">PeakTalk</div>
            <h3 className="mt-5 max-w-xl text-[32px] font-bold leading-[1.04] lg:text-[42px]">
              Загружаете документ и получаете давление по его слабым местам.
            </h3>
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {['вопросы', 'слабые ответы', 'prep-card'].map((item) => (
                <div key={item} className="border border-white/12 bg-white/[0.035] px-4 py-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">output</div>
                  <div className="mt-1 text-sm font-semibold text-white">{item}</div>
                </div>
              ))}
            </div>
          </RevealDiv>

          <div className="grid gap-4">
            {alternatives.map((item, index) => (
              <RevealDiv key={item.title} delay={index * 0.06} className="border border-neutral-300 bg-white p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">alternative</div>
                <h3 className="mt-3 text-xl font-bold text-neutral-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.weakness}</p>
              </RevealDiv>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCTA() {
  return (
    <section id="pricing" className="bg-white py-[clamp(82px,10vw,130px)]">
      <div className="container-custom">
        <RevealDiv className="mx-auto mb-12 max-w-3xl text-center" margin="-50px 0px">
          <SectionLabel>start</SectionLabel>
          <h2 className="mt-4 font-display text-[34px] font-black uppercase leading-[1] text-neutral-950 sm:text-[52px] lg:text-[68px]">
            Проверьте один документ бесплатно.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-neutral-600">
            Три вопроса на своём кейсе без регистрации. Достаточно, чтобы понять, где защита уже трещит.
          </p>
        </RevealDiv>

        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          <RevealDiv className="flex flex-col border border-neutral-300 bg-[#faf8f4] p-7 lg:p-9">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">guest pressure-test</div>
            <div className="mt-4 font-display text-[52px] font-black leading-none text-neutral-950">0 ₽</div>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">Один документ, выбранный оппонент, первые критические вопросы.</p>
            <div className="my-7 h-px bg-neutral-300" />
            <ul className="mb-8 grid gap-3 text-sm text-neutral-700">
              {['Без регистрации', 'Без карты', '3 вопроса по вашему материалу'].map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 bg-[#E8600A]" />{item}</li>
              ))}
            </ul>
            <Link href="/simulation/guest" className="mt-auto flex min-h-12 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-bold text-white transition-colors hover:border-[#E8600A] hover:bg-[#E8600A]">
              Запустить 3 вопроса
            </Link>
          </RevealDiv>

          <RevealDiv delay={0.08} className="flex flex-col border border-neutral-950 bg-neutral-950 p-7 text-white lg:p-9">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF8A3D]">full session</div>
            <div className="mt-4 flex items-end gap-2 font-display text-[56px] font-black leading-none text-white">
              <span className="text-[#FF8A3D]">299</span>
              <span>₽</span>
              <span className="pb-1 text-lg font-semibold text-white/70">/ сессия</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/58">Полный разбор, prep-card и материалы, к которым можно вернуться перед встречей.</p>
            <div className="my-7 h-px bg-white/12" />
            <ul className="mb-8 grid gap-3 text-sm text-white/72">
              {['Полная симуляция', 'Слабые ответы и риски', 'Prep-card и отчёт'].map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 bg-[#E8600A]" />{item}</li>
              ))}
            </ul>
            <Link href="/billing" className="mt-auto flex min-h-12 items-center justify-center border border-white bg-white px-5 text-sm font-bold text-neutral-950 transition-colors hover:bg-[#faf8f4]">
              Открыть полную сессию
            </Link>
          </RevealDiv>
        </div>
      </div>
    </section>
  );
}

function FAQAndTrust() {
  const faqs = [
    {
      q: 'Что такое PeakTalk?',
      a: 'PeakTalk — сервис подготовки к защите решений и сложным B2B-встречам. Вы загружаете документ, выбираете оппонента и получаете разбор слабых мест до реального разговора.',
    },
    {
      q: 'Нужна ли регистрация?',
      a: 'Для первых трёх вопросов регистрация не нужна. Аккаунт нужен для сохранения сессии, полного разбора и возврата к материалам.',
    },
    {
      q: 'Какие документы подходят?',
      a: 'Memo, pitch deck, QBR, roadmap, финмодель, стратегия или любой текстовый материал, который вы будете защищать на встрече.',
    },
    {
      q: 'Это заменяет коуча?',
      a: 'Нет. PeakTalk закрывает другую задачу: быстрый pressure-test конкретного документа и аргументации перед встречей.',
    },
  ];

  const signals = [
    { icon: Shield, title: '152-ФЗ', desc: 'Данные хранятся в России.' },
    { icon: Lock, title: 'Не обучаем модели', desc: 'Ваши документы не становятся датасетом.' },
    { icon: Database, title: 'Cloud.ru', desc: 'Обработка через российского провайдера.' },
    { icon: Zap, title: 'Без карты', desc: 'Guest pressure-test запускается без оплаты.' },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-[#faf8f4] py-[clamp(82px,10vw,130px)]">
      <div className="container-custom grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1fr)]">
        <RevealDiv margin="-50px 0px">
          <SectionLabel>trust / faq</SectionLabel>
          <h2 className="mt-4 max-w-xl font-display text-[32px] font-black leading-[1.06] text-neutral-950 sm:text-[44px]">
            Для документов, которые нельзя разбирать на публике.
          </h2>
          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            {signals.map((signal) => (
              <div key={signal.title} className="border border-neutral-300 bg-white/70 p-4">
                <signal.icon size={18} className="text-[#E8600A]" />
                <div className="mt-3 text-sm font-bold text-neutral-950">{signal.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-neutral-600">{signal.desc}</p>
              </div>
            ))}
          </div>
        </RevealDiv>

        <div className="border border-neutral-300 bg-white">
          {faqs.map((faq, index) => (
            <div key={faq.q} className={index > 0 ? 'border-t border-neutral-200' : ''}>
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-5 px-5 py-5 text-left text-base font-bold text-neutral-950 transition-colors hover:text-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30"
                aria-expanded={openIndex === index}
              >
                {faq.q}
                <ChevronDown size={18} className={`shrink-0 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-neutral-600">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterCTA() {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.52)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.52)_1px,transparent_1px)] bg-[size:76px_76px]" />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8600A] to-transparent" aria-hidden="true" />

      <div className="container-custom relative z-10 py-[clamp(92px,12vw,170px)] text-center">
        <RevealDiv margin="-50px 0px">
          <SectionLabel dark>final check</SectionLabel>
          <h2 className="mx-auto mt-5 max-w-5xl font-display text-[38px] font-black uppercase leading-[0.98] text-white sm:text-[62px] lg:text-[86px]">
            Не несите слабый документ на сильную встречу.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-white/55">
            Запустите pressure-test и посмотрите, где аргументация ломается, пока это ещё можно исправить.
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/simulation/guest" className="inline-flex min-h-12 items-center justify-center gap-3 border border-white/24 bg-white px-6 text-sm font-bold text-neutral-950 transition-colors hover:border-[#E8600A] hover:bg-[#E8600A] hover:text-white">
              Проверить документ бесплатно
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/[0.32]">3 вопроса. Без регистрации. На своём кейсе.</p>
        </RevealDiv>
      </div>

      <Footer />
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black py-10">
      <div className="container-custom flex flex-col items-center justify-between gap-7 text-white/75 md:flex-row">
        <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
          <div className="brightness-0 invert"><Logo size={20} /></div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/[0.28]">meeting defense workspace</div>
        </div>
        <div className="flex flex-wrap justify-center gap-7 font-mono text-[11px] uppercase tracking-[0.14em] text-white/[0.38]">
          <Link href="/contacts" className="transition-colors hover:text-white">Контакты</Link>
          <Link href="/personal-data" className="transition-colors hover:text-white">Оферта</Link>
          <Link href="/privacy" className="transition-colors hover:text-white">Конфиденциальность</Link>
        </div>
      </div>
    </footer>
  );
}

function JsonLd() {
  const faqData = [
    {
      question: 'Что такое PeakTalk?',
      answer: 'PeakTalk — сервис подготовки к защите решений и сложным B2B-встречам. Вы загружаете документ, выбираете оппонента и получаете разбор слабых мест до реального разговора.',
    },
    {
      question: 'Нужна ли регистрация?',
      answer: 'Для первых трёх вопросов регистрация не нужна. Аккаунт нужен для сохранения сессии, полного разбора и возврата к материалам.',
    },
    {
      question: 'Какие документы подходят?',
      answer: 'Memo, pitch deck, QBR, roadmap, финмодель, стратегия или любой текстовый материал, который вы будете защищать на встрече.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'PeakTalk',
        url: 'https://peaktalk.ru',
        description: 'Сервис подготовки к защите бюджета, roadmap и QBR. Загружаете документ, выбираете оппонента и получаете разбор слабых мест до реальной встречи.',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: [
          {
            '@type': 'Offer',
            name: 'Guest',
            price: '0',
            priceCurrency: 'RUB',
            description: '3 бесплатных вопроса без регистрации',
          },
          {
            '@type': 'Offer',
            name: 'Per-session',
            price: '299',
            priceCurrency: 'RUB',
            description: 'Одна полная сессия',
          },
        ],
        provider: {
          '@type': 'Organization',
          name: 'PeakTalk',
          url: 'https://peaktalk.ru',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqData.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}

export default function Page() {
  return (
    <main className="relative min-h-screen selection:bg-[#E8600A] selection:text-white">
      <JsonLd />
      <Nav />
      <Hero />
      <ProblemAgitation />
      <ActionFlow />
      <ImpactEvidence />
      <Scenarios />
      <ComparisonBlock />
      <PricingCTA />
      <FAQAndTrust />
      <FooterCTA />
    </main>
  );
}
