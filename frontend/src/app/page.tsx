"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  Lock,
  Menu,
  ShieldAlert,
  Target,
  Timer,
  X,
} from 'lucide-react';
import HeroVisual from '@/components/HeroVisual';
import {
  ArtifactPreview,
  HeroLiveFrame,
  PressureDrillFrame,
  ScenarioBrowser,
} from '@/components/landing/AnimatedLandingFrames';

const CTA_LABEL = 'Запустить демо бесплатно';

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
  { label: 'Как работает', id: '#how' },
  { label: 'Сценарии', id: '#scenarios' },
  { label: 'Что бесплатно', id: '#pricing' },
  { label: 'FAQ', id: '#faq' },
];

const smoothScroll = (id: string) => {
  const element = document.querySelector(id);
  if (!element) return;
  const navHeight = 82;
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
  hidden = { opacity: 1, y: 14, scale: 1 },
  visible = { opacity: 1, y: 0, scale: 1 },
  delay = 0,
  duration = 0.45,
  margin,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const isIOSSafari = useIsIOSSafari();
  const { ref, isInView } = useRevealTrigger<HTMLDivElement>(margin);
  const hiddenState = prefersReducedMotion ? { opacity: 1 } : normalizeRevealTarget(hidden, isIOSSafari);
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
    <div className={`font-mono text-[11px] uppercase tracking-[0.18em] ${dark ? 'text-white/[0.45]' : 'text-neutral-500'}`}>
      {children}
    </div>
  );
}

function Logo({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo_svg.svg" alt="PeakTalk Logo" width={44} height={44} className="h-10 w-10 sm:h-11 sm:w-11" priority />
      <span className="brand-wordmark text-neutral-950" style={{ fontSize: size * 0.86 }}>
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
        initial={{ y: -84 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${scrolled ? 'border-b border-black/[0.08] bg-white/90 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] backdrop-blur-2xl' : 'bg-[#faf8f4]/84 py-3.5 backdrop-blur-md'}`}
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
              className="inline-flex min-h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#E8600A] hover:border-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40 rounded-none"
            >
              {CTA_LABEL}
            </Link>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 cursor-pointer items-center justify-center border border-neutral-300 bg-white text-neutral-950 lg:hidden"
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
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex flex-col bg-[#faf8f4] p-6"
          >
            <div className="mb-12 flex items-center justify-between">
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
                    setTimeout(() => smoothScroll(item.id), 240);
                  }}
                  className="cursor-pointer border-b border-neutral-200 py-4 text-left text-[22px] font-bold leading-none text-neutral-950"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-auto grid gap-3">
              <Link href="/login" className="flex min-h-12 items-center justify-center border border-neutral-300 text-sm font-semibold text-neutral-950">
                Войти
              </Link>
              <Link href="/simulation/guest" className="flex min-h-12 items-center justify-center border border-neutral-950 bg-neutral-950 px-4 text-center text-sm font-semibold text-white rounded-none">
                {CTA_LABEL}
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
    <section className="relative overflow-hidden bg-[#faf8f4] pt-24 lg:pt-20">
      <div className="absolute inset-0 opacity-[0.35]" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.045)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#faf8f4_86%)]" />
      </div>

      <div className="container-custom relative z-10 grid items-center gap-8 pb-14 md:pb-16 lg:grid-cols-[minmax(0,0.74fr)_minmax(520px,1.26fr)] lg:gap-14 lg:pb-24">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex max-w-full border border-neutral-200 bg-white/80 px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-600 shadow-sm rounded-none sm:mb-6 sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
          >
            подготовка к сложной рабочей встрече
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.64, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[780px] font-display text-[32px] font-black leading-[1.04] text-neutral-950 sm:text-[52px] lg:text-[54px] xl:text-[56px]"
          >
            Проверка аргументов <span className="whitespace-nowrap">под давлением</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-[620px] text-[17px] leading-[1.62] text-neutral-600 sm:mt-8 sm:text-[20px] sm:leading-[1.65]"
          >
            Вставьте тезисы, КП или план разговора. PeakTalk сыграет CFO,
            клиента или инвестора и покажет, где позиция не выдерживает давления.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.62, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={safariMotionStyle}
            className="mt-7 md:hidden"
          >
            <HeroVisual compact />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 grid gap-3 sm:mt-10 sm:flex sm:items-center sm:gap-4"
          >
            <Link
              href="/simulation/guest"
              className="inline-flex min-h-[54px] cursor-pointer items-center justify-center gap-3 whitespace-nowrap border border-[#E8600A] bg-[#E8600A] px-7 text-center text-[14px] font-bold text-white shadow-lg shadow-[#E8600A]/20 transition-all duration-200 hover:border-[#B74707] hover:bg-[#B74707] hover:shadow-xl hover:shadow-[#E8600A]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40 rounded-none sm:min-h-[56px] sm:px-8 sm:text-[15px]"
            >
              {CTA_LABEL}
              <ArrowRight size={18} />
            </Link>
            <button
              type="button"
              onClick={() => smoothScroll('#scenarios')}
              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center px-4 text-[15px] font-bold text-neutral-600 transition-colors duration-150 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30 sm:min-h-[56px] sm:px-6"
            >
              Посмотреть сценарии
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="mt-7 flex max-w-[680px] flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 sm:mt-8 sm:gap-x-6 sm:gap-y-3 sm:text-[11px] sm:tracking-[0.16em]"
          >
            <span>без регистрации</span>
            <span className="text-[#E8600A] font-medium">демо: 3 вопроса</span>
            <span>на своём кейсе</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 hidden sm:block"
          >
            <HeroLiveFrame />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.72, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          style={safariMotionStyle}
          className="relative hidden min-w-0 md:block lg:translate-x-4"
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

function PressureGap() {
  const items = [
    {
      title: 'Вопрос оппонента',
      body: 'Конкретная реплика CFO, клиента или инвестора, а не общий совет.',
    },
    {
      title: 'Слабое место',
      body: 'PeakTalk подсвечивает, где не хватает факта, trade-off или владельца.',
    },
    {
      title: 'Prep-card',
      body: 'На выходе — короткая карточка, с которой можно идти на встречу.',
    },
  ];

  return (
    <section className="bg-white py-[clamp(80px,12vw,140px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <SectionLabel>живой фрагмент</SectionLabel>
            <h2 className="mt-5 max-w-2xl text-[32px] font-bold leading-[1.1] text-neutral-950 sm:text-[46px]">
              Не презентация. Проверка, где позиция треснет.
            </h2>
          </div>
          <p className="max-w-xl text-[17px] leading-relaxed text-neutral-500 lg:pb-2">
            PeakTalk показывает конкретный момент давления: вопрос, слабое место,
            усиленную формулировку и следующий drill.
          </p>
        </RevealDiv>

        <PressureDrillFrame />

        <div className="mt-12 grid gap-8 border-t border-neutral-100 pt-10 lg:grid-cols-3 lg:gap-14">
          {items.map((item, index) => (
            <RevealDiv key={item.title} delay={index * 0.05} className="bg-white">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#E8600A]">0{index + 1}</div>
              <h3 className="mt-4 text-[22px] font-bold leading-tight text-neutral-950">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">{item.body}</p>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActionFlowPipeline() {
  const steps = [
    {
      id: '1',
      label: 'материал',
      title: 'Дайте контекст',
      body: 'Тезисы, КП, письмо клиенту или план защиты.',
      result: 'сценарий тренировки',
    },
    {
      id: '2',
      label: 'давление',
      title: 'Ответьте вслух',
      body: 'Оппонент давит на ценность, риски и компромиссы.',
      result: 'карта возражений',
    },
    {
      id: '3',
      label: 'правки',
      title: 'Усилите ответ',
      body: 'Получите слабые места и короткий план правок.',
      result: 'prep-card',
    },
  ];

  return (
    <section id="how" className="bg-[#faf8f4] py-[clamp(80px,12vw,140px)]">
      <div className="container-custom">
        <RevealDiv className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <SectionLabel>как работает</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.1] text-neutral-950 sm:text-[46px]">
              Один материал превращается в prep-card перед встречей.
            </h2>
          </div>
          <p className="max-w-md text-[17px] leading-relaxed text-neutral-500 lg:pb-2">
            Без учебной сцены и геймификации. Только короткая проверка аргументов,
            где Вас будут перебивать и уточнять.
          </p>
        </RevealDiv>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8">
          <ArtifactPreview />
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <RevealDiv
                key={step.title}
                delay={index * 0.05}
                className="relative flex flex-col rounded-none border border-neutral-100 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">{step.label}</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#faf8f4] font-display text-sm font-black text-neutral-950">
                    {step.id}
                  </div>
                </div>
                <h3 className="mt-8 text-[20px] font-bold leading-[1.15] text-neutral-950">{step.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-500">{step.body}</p>
                <div className="mt-auto pt-6">
                  <div className="inline-block rounded bg-[#E8600A]/10 px-2.5 py-1 text-[13px] font-semibold text-[#E8600A]">
                    Результат: {step.result}
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InteractiveScenarios() {
  return (
    <section id="scenarios" className="bg-white py-[clamp(80px,12vw,140px)]">
      <div className="container-custom">
        <RevealDiv className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <SectionLabel>сценарии встреч</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.1] text-neutral-950 sm:text-[46px]">
              Начните с разговора, который уже стоит в календаре.
            </h2>
          </div>
          <Link href="/scenarios" className="inline-flex min-h-[48px] w-fit items-center gap-2 bg-neutral-100 px-6 text-[15px] font-bold text-neutral-900 transition-colors hover:bg-neutral-200 lg:pb-2 rounded-none">
            Все сценарии
            <ArrowRight size={16} />
          </Link>
        </RevealDiv>

        <ScenarioBrowser />
      </div>
    </section>
  );
}

function PricingCTA() {
  return (
    <section id="pricing" className="bg-[#faf8f4] py-[clamp(80px,12vw,140px)]">
      <div className="container-custom">
        <RevealDiv className="mx-auto mb-14 max-w-3xl text-center">
          <SectionLabel>бесплатно / полностью</SectionLabel>
          <h2 className="mt-5 text-[32px] font-bold leading-[1.1] text-neutral-950 sm:text-[46px]">
            3 вопроса бесплатно. Полная сессия — с отчётом и prep-card.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-neutral-500">
            Сначала проверьте механику на своём материале. Платный режим нужен,
            когда важно сохранить разбор перед реальной встречей.
          </p>
        </RevealDiv>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 lg:gap-8">
          <RevealDiv className="flex flex-col rounded-none border border-neutral-200 bg-white p-8 shadow-sm lg:p-10">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">бесплатный стресс-тест</div>
            <div className="mt-4 text-[48px] font-black leading-none text-neutral-950">0 ₽</div>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">Материал, роль оппонента и первые 3 вопроса.</p>
            <div className="my-6 h-px bg-neutral-100" />
            <ul className="mb-8 grid gap-3 text-[15px] text-neutral-700">
              {['Без регистрации', 'Без карты', 'На тезисах, документе или плане разговора'].map((item) => (
                <li key={item} className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8600A]" />{item}</li>
              ))}
            </ul>
            <Link href="/simulation/guest" className="mt-auto flex min-h-[56px] items-center justify-center bg-neutral-100 px-6 text-[15px] font-bold text-neutral-900 transition-colors hover:bg-neutral-200 rounded-none">
              {CTA_LABEL}
            </Link>
          </RevealDiv>

          <RevealDiv delay={0.08} className="flex flex-col rounded-none bg-neutral-950 p-8 text-white shadow-xl lg:p-10">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#FF8A3D]">полная сессия</div>
            <div className="mt-4 flex items-end gap-2 text-[48px] font-black leading-none text-white">
              <span className="text-[#FF8A3D]">299</span>
              <span>₽</span>
              <span className="pb-1.5 text-lg font-medium text-white/50">/ сессия</span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">Полная симуляция с историей ответов и итоговой карточкой.</p>
            <div className="my-6 h-px bg-white/10" />
            <ul className="mb-8 grid gap-3 text-[15px] text-white/90">
              {['История вопросов и ответов', 'Разбор слабых мест', 'Prep-card и отчёт перед встречей'].map((item) => (
                <li key={item} className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF8A3D]" />{item}</li>
              ))}
            </ul>
            <Link href="/billing" className="mt-auto flex min-h-[56px] items-center justify-center bg-white px-6 text-[15px] font-bold text-neutral-950 transition-colors hover:bg-neutral-100 rounded-none">
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
      a: 'AI-стресс-тест аргументов перед сложной рабочей встречей. Вы даёте материал, выбираете роль оппонента и отвечаете на неудобные вопросы.',
    },
    {
      q: 'Нужна ли регистрация?',
      a: 'Для первых трёх вопросов регистрация не нужна. Аккаунт нужен для сохранения сессии, полного разбора, отчёта и prep-card.',
    },
    {
      q: 'Что можно вставить вместо документа?',
      a: 'Тезисы, КП, письмо клиента, структуру презентации или короткий план разговора.',
    },
    {
      q: 'Это заменяет коуча или курс?',
      a: 'Нет. PeakTalk закрывает другую задачу: быстрый pressure-test конкретного материала перед конкретным разговором.',
    },
  ];

  const signals = [
    { icon: Target, title: 'Конкретный материал', desc: 'Вопросы строятся вокруг Вашего текста.' },
    { icon: ShieldAlert, title: 'Неприятная роль', desc: 'Давление по цифрам, срокам и рискам.' },
    { icon: Timer, title: 'Перед встречей', desc: 'Формат на короткую подготовку.' },
    { icon: Lock, title: 'Без карты на старте', desc: 'Демо запускается без оплаты.' },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-[clamp(80px,12vw,140px)]">
      <div className="container-custom grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(460px,1fr)] lg:gap-20">
        <RevealDiv>
          <SectionLabel>trust / faq</SectionLabel>
          <h2 className="mt-5 max-w-xl text-[32px] font-bold leading-[1.1] text-neutral-950 sm:text-[46px]">
            Для разговоров, где общие формулировки не проходят.
          </h2>
          <div className="mt-10 grid gap-6">
            {signals.map((signal) => (
              <div key={signal.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8600A]/10">
                  <signal.icon size={20} className="text-[#E8600A]" />
                </div>
                <div>
                  <div className="text-[17px] font-bold text-neutral-950">{signal.title}</div>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-500">{signal.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </RevealDiv>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <div key={faq.q} className="rounded-none border border-neutral-100 bg-[#faf8f4] transition-colors hover:bg-neutral-100/50">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-5 px-6 py-5 text-left text-[17px] font-bold text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30"
                aria-expanded={openIndex === index}
              >
                {faq.q}
                <ChevronDown size={20} className={`shrink-0 text-neutral-400 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`} />
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
                    <p className="px-6 pb-6 text-[15px] leading-relaxed text-neutral-600">{faq.a}</p>
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

      <div className="container-custom relative z-10 py-[clamp(100px,14vw,160px)] text-center">
        <RevealDiv>
          <SectionLabel dark>final check</SectionLabel>
          <h2 className="mx-auto mt-6 max-w-4xl font-display text-[40px] font-black leading-[1.05] text-white sm:text-[60px] lg:text-[72px]">
            Не несите слабый ответ на сильную встречу.
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-[18px] leading-relaxed text-white/70">
            Запустите бесплатное демо на своём материале и посмотрите, где аргументация требует усиления.
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/simulation/guest" className="inline-flex min-h-[56px] items-center justify-center gap-3 border border-white/24 bg-white px-8 text-[15px] font-bold text-neutral-950 transition-colors hover:border-[#E8600A] hover:bg-[#E8600A] hover:text-white rounded-none">
              {CTA_LABEL}
              <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-6 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-white/[0.4]">без регистрации / без карты / на своём кейсе</p>
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
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/[0.28]">стресс-тест встреч</div>
        </div>
        <div className="flex flex-wrap justify-center gap-7 font-mono text-[11px] uppercase tracking-[0.14em] text-white/[0.38]">
          <Link href="/scenarios" className="transition-colors hover:text-white">Сценарии</Link>
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
      answer: 'PeakTalk — сервис подготовки к сложным рабочим встречам. Вы вставляете материал разговора, выбираете оппонента и отвечаете на вопросы, которые проверяют слабые места аргументации.',
    },
    {
      question: 'Нужна ли регистрация?',
      answer: 'Для первых трёх вопросов регистрация не нужна. Аккаунт нужен для сохранения сессии, полного разбора, отчёта и prep-card.',
    },
    {
      question: 'Что можно вставить вместо документа?',
      answer: 'Подойдут тезисы, план разговора, коммерческое предложение, письмо клиенту, структура презентации или любой текст, который нужно защитить на встрече.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'PeakTalk',
        url: 'https://peaktalk.ru',
        description: 'AI-стресс-тест аргументов перед сложной рабочей встречей: вставьте тезисы, документ или план разговора, получите неудобные вопросы и слабые места позиции.',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: [
          {
            '@type': 'Offer',
            name: 'Гостевой стресс-тест',
            price: '0',
            priceCurrency: 'RUB',
            description: '3 бесплатных вопроса без регистрации',
          },
          {
            '@type': 'Offer',
            name: 'Full session',
            price: '299',
            priceCurrency: 'RUB',
            description: 'Полная сессия с отчётом и prep-card',
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
    <main className="relative min-h-screen overflow-x-clip selection:bg-[#E8600A] selection:text-white">
      <JsonLd />
      <Nav />
      <Hero />
      <PressureGap />
      <ActionFlowPipeline />
      <InteractiveScenarios />
      <PricingCTA />
      <FAQAndTrust />
      <FooterCTA />
    </main>
  );
}
