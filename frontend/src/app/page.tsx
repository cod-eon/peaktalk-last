"use client";

import React, { useRef, useState } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import HeroVisual from '@/components/HeroVisual';
import LandingPressureFilm from '@/components/landing/LandingPressureFilm';
import { trackEvent } from '@/lib/analytics';
import styles from './landing.module.css';

const CTA_LABEL = 'Проверить материал бесплатно';

type LandingCtaLocation =
  | 'nav_desktop'
  | 'nav_mobile'
  | 'hero_primary'
  | 'pressure_fragment'
  | 'pricing_free'
  | 'pricing_paid'
  | 'footer_final';

type LandingCtaTracker = (ctaLocation: LandingCtaLocation) => void;

const trackLandingCta: LandingCtaTracker = (ctaLocation) => {
  trackEvent('landing_cta_clicked', {
    source: 'landing',
    cta_location: ctaLocation,
  });
};

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
  { label: 'Кейс', id: '#case' },
  { label: 'Давление', id: '#pressure' },
  { label: 'Сценарии', id: '#scenarios' },
  { label: 'Пакеты', id: '#pricing' },
  { label: 'FAQ', id: '#faq' },
];

const pressureRows = [
  {
    label: 'вопрос финансового директора',
    title: 'Если бюджет сократят на 30%, что вы уберёте первым и какую метрику не готовы потерять?',
    body: 'Проверяется не уверенность, а выбор между статьями расходов, последствия и критерий решения.',
  },
  {
    label: 'слабый ответ',
    title: 'Сохраним ключевые активности без потери результата.',
    body: 'В ответе нет конкретного выбора, цены риска и условия, при котором план нужно менять.',
  },
  {
    label: 'что усилить',
    title: 'Назовите сокращаемые статьи, цену риска, владельца решения и пороговую метрику.',
    body: 'Так позиция становится проверяемой до встречи, а не в момент давления.',
  },
];

const scenarios = [
  {
    tag: 'Бюджет',
    title: 'Защитить бюджет перед руководителем',
    body: 'Докажите, какие расходы нельзя сокращать без ущерба для результата.',
    decision: 'Решение: что сохранить, что сократить и по какой метрике оценить риск.',
    href: '/scenarios/budget-cut-q3',
  },
  {
    tag: 'Клиент',
    title: 'Подготовиться к клиентской эскалации',
    body: 'Объясните сбой и защитите план восстановления доверия.',
    decision: 'Решение: что вы берёте на себя, что обещаете клиенту и какой следующий шаг предлагаете.',
    href: '/scenarios/client-escalation',
  },
  {
    tag: 'Инвестор',
    title: 'Выдержать вопросы инвестора',
    body: 'Подготовьте ответы о рынке, росте, экономике и реалистичности плана.',
    decision: 'Решение: какие допущения подтверждают рост и при каком условии план нужно пересмотреть.',
    href: '/scenarios/series-a-pitch',
  },
];

const processStages = [
  {
    label: 'материал встречи',
    title: 'Вставьте то, что нужно защитить',
    body: 'Тезисы, коммерческое предложение или план разговора для бюджета, QBR, клиента или инвестора.',
  },
  {
    label: 'три вопроса бесплатно',
    title: 'Ответьте на неудобные вопросы',
    body: 'Выберите роль оппонента и пройдите три вопроса без регистрации.',
  },
  {
    label: 'полная сессия и Defense Brief',
    title: 'Соберите план защиты перед встречей',
    body: 'После оплаты сохраните материал и ответы, пройдите полный разбор и получите слабые места позиции, ожидаемые вопросы и следующий шаг.',
  },
];

const faqData = [
  {
    question: 'Что такое PeakTalk?',
    answer:
      'PeakTalk проверяет аргументацию перед сложной рабочей встречей. Вы вставляете материал, отвечаете на вопросы оппонента и видите слабые места позиции.',
  },
  {
    question: 'Нужна ли регистрация?',
    answer:
      'Нет. Три вопроса по вашему материалу доступны без регистрации. Для полной сессии и Defense Brief потребуется аккаунт.',
  },
  {
    question: 'Какой материал можно вставить?',
    answer:
      'Тезисы защиты, коммерческое предложение, письмо клиенту, структуру презентации или план разговора. Не вставляйте пароли, персональные данные и конфиденциальные фрагменты.',
  },
  {
    question: 'Это курс переговоров или тренировка выступлений?',
    answer:
      'Нет. PeakTalk не тренирует голос или харизму. Он помогает проверить конкретную позицию перед конкретной встречей.',
  },
  {
    question: 'Что входит в полную сессию?',
    answer:
      'Материал и ответы сохраняются, разбор показывает слабые места позиции и собирает Defense Brief с ожидаемыми вопросами и планом защиты.',
  },
];

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const nextScrolled = latest > 18;
    setScrolled((current) => (current === nextScrolled ? current : nextScrolled));
  });

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
    <div className={`font-mono text-[11px] uppercase tracking-[0.18em] ${dark ? 'text-white/65' : 'text-neutral-500'}`}>
      {children}
    </div>
  );
}

function Logo({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo_svg.svg" alt="PeakTalk Logo" width={44} height={44} className="h-10 w-10 sm:h-11 sm:w-11" priority />
      <span className="brand-wordmark text-neutral-950" style={{ fontSize: size * 0.86 }}>PeakTalk</span>
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
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${scrolled ? 'border-b border-black/[0.08] bg-white/92 py-2.5 shadow-[0_12px_36px_rgba(17,17,17,0.06)] backdrop-blur-2xl' : 'bg-[#FAF8F4]/90 py-3.5 backdrop-blur-md'}`}
      >
        <div className="container-custom flex items-center justify-between gap-5">
          <Link href="/" aria-label="PeakTalk" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40"><Logo /></Link>
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.id} className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-600 transition-colors duration-150 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-600 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30">Вход</Link>
            <Link href="/simulation/guest" onClick={() => trackLandingCta('nav_desktop')} className="inline-flex min-h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:border-[#E8600A] hover:bg-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40">Проверить материал</Link>
          </div>
          <button type="button" className="flex h-11 w-11 cursor-pointer items-center justify-center border border-neutral-300 bg-white text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40 lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Открыть меню" aria-controls="landing-mobile-menu" aria-expanded={mobileMenuOpen}>
            <Menu size={22} />
          </button>
        </div>
      </motion.nav>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }} id="landing-mobile-menu" className="fixed inset-0 z-[100] flex flex-col bg-[#FAF8F4] p-6">
            <div className="mb-10 flex items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="flex h-12 w-12 cursor-pointer items-center justify-center border border-neutral-300 bg-white text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40" aria-label="Закрыть меню"><X size={24} /></button>
            </div>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.label} href={item.id} onClick={() => setMobileMenuOpen(false)} className="cursor-pointer border-b border-neutral-200 py-4 text-left text-[22px] font-bold leading-none text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40">{item.label}</Link>
              ))}
            </div>
            <div className="mt-auto grid gap-3">
              <Link href="/login" className="flex min-h-12 items-center justify-center border border-neutral-300 text-sm font-semibold text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40">Войти</Link>
              <Link href="/simulation/guest" onClick={() => trackLandingCta('nav_mobile')} className="flex min-h-12 items-center justify-center border border-neutral-950 bg-neutral-950 px-4 text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40">{CTA_LABEL}</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#FAF8F4] pt-24 lg:pt-20">
      <div className="absolute inset-0 opacity-[0.45]" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.045)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,248,244,0.4)_0%,#FAF8F4_88%)]" />
      </div>
      <div className="container-custom relative z-10 grid items-center gap-9 pb-14 md:pb-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(350px,0.85fr)] lg:gap-6 lg:pb-20 xl:grid-cols-[minmax(0,0.82fr)_minmax(520px,1.18fr)] xl:gap-12">
        <div className="max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-5 inline-flex max-w-full border border-neutral-950 bg-white px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-700 shadow-[6px_6px_0_rgba(232,96,10,0.12)] sm:mb-6 sm:px-4 sm:text-[10px] sm:tracking-[0.16em]">Материал / разбор / Defense Brief</motion.div>
          <motion.h1 data-landing-hero-copy initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.64, delay: 0.06, ease: [0.16, 1, 0.3, 1] }} className="max-w-[820px] font-display text-[34px] font-black leading-[1.03] text-neutral-950 sm:text-[56px] lg:text-[58px] xl:text-[64px]">Подготовьте материал, который выдержит вопросы руководства.</motion.h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} className="mt-6 max-w-[640px] text-[17px] leading-[1.62] text-neutral-600 sm:mt-7 sm:text-[20px] sm:leading-[1.58]">Вставьте тезисы, коммерческое предложение или план разговора. За три вопроса без регистрации увидите, где позиции не хватает цифр, выбора и ответственности за решение.</motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }} className="mt-8 grid gap-3 sm:mt-9 sm:flex sm:items-center sm:gap-4 lg:gap-2 xl:gap-4">
            <Link href="/simulation/guest" onClick={() => trackLandingCta('hero_primary')} className="inline-flex min-h-[54px] cursor-pointer items-center justify-center gap-3 whitespace-nowrap border border-[#E8600A] bg-[#E8600A] px-7 text-center text-[14px] font-bold text-white shadow-[0_16px_36px_rgba(232,96,10,0.22)] transition-colors duration-200 hover:border-[#B74707] hover:bg-[#B74707] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40 sm:min-h-[56px] sm:px-8 sm:text-[15px] lg:px-4 lg:text-[13px] xl:px-8 xl:text-[15px]">{CTA_LABEL}<ArrowRight size={18} /></Link>
            <Link href="#case" className="inline-flex min-h-[48px] cursor-pointer items-center justify-center whitespace-nowrap border border-neutral-300 bg-white px-5 text-[15px] font-bold text-neutral-800 transition-colors duration-150 hover:border-neutral-950 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30 sm:min-h-[56px] sm:px-6 lg:px-4 lg:text-[13px] xl:px-6 xl:text-[15px]">Как устроена подготовка</Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.34 }} className="mt-7 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500 sm:text-[11px] sm:tracking-[0.16em]">Без регистрации / без карты / на своём материале</motion.div>
          <motion.div initial={{ opacity: 0, y: 18, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.62, delay: 0.18, ease: [0.16, 1, 0.3, 1] }} style={safariMotionStyle} className="mt-7 md:hidden"><HeroVisual compact /></motion.div>
        </div>
        <motion.div data-landing-hero-visual initial={{ opacity: 0, y: 18, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.72, delay: 0.16, ease: [0.16, 1, 0.3, 1] }} style={safariMotionStyle} className="relative hidden min-w-0 md:block lg:translate-x-5"><HeroVisual /></motion.div>
      </div>
    </section>
  );
}

function PressureProof() {
  return (
    <section id="pressure" className="scroll-mt-24 bg-neutral-950 py-[clamp(52px,4.5vw,60px)] text-white">
      <div className="container-custom grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:items-start lg:gap-16">
        <div>
          <RevealDiv>
            <SectionLabel dark>проверка под давлением</SectionLabel>
            <h2 className="mt-5 max-w-4xl text-[32px] font-bold leading-[1.08] text-white sm:text-[48px] lg:text-[54px]">Вопрос, который может сорвать защиту, лучше услышать до встречи.</h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/62">PeakTalk проверяет, сможете ли вы объяснить выбор, назвать цену риска и взять ответственность за решение.</p>
          </RevealDiv>
          <div className="mt-10 border-y border-white/14">
            {pressureRows.map((row, index) => (
              <RevealDiv key={row.label} delay={index * 0.1} className={`grid gap-4 border-b border-white/14 py-6 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] ${index === 1 ? 'sm:pl-8' : ''}`}>
                <div className="flex items-start gap-3"><span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-[#FF8A3D]/60 font-mono text-[9px] text-[#FF8A3D]">0{index + 1}</span><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF8A3D]">{row.label}</span></div>
                <div><h3 className="text-[19px] font-bold leading-snug text-white sm:text-[22px]">{row.title}</h3><p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/58">{row.body}</p></div>
              </RevealDiv>
            ))}
          </div>
          <RevealDiv className="mt-8"><Link href="/simulation/guest" onClick={() => trackLandingCta('pressure_fragment')} className="inline-flex min-h-[52px] items-center justify-center gap-3 border border-white bg-white px-6 text-[14px] font-bold text-neutral-950 transition-colors hover:border-[#E8600A] hover:bg-[#E8600A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A3D]">Проверить свой материал<ArrowRight size={17} /></Link></RevealDiv>
        </div>
        <RevealDiv className="mx-auto w-full max-w-[370px] border border-white/14 bg-white/[0.03] p-2 lg:sticky lg:top-28"><LandingPressureFilm /></RevealDiv>
      </div>
    </section>
  );
}

function ScenarioLink({ item, primary = false }: { item: (typeof scenarios)[number]; primary?: boolean }) {
  return (
    <article className={`group relative flex h-full flex-col overflow-hidden border border-neutral-950 bg-white transition-transform duration-200 hover:-translate-y-1 focus-within:-translate-y-1 ${primary ? 'min-h-[430px] p-7 sm:p-10' : 'min-h-[210px] p-6 sm:p-7'}`}>
      {primary ? <div className="absolute right-[-44px] top-[-36px] h-44 w-44 rotate-12 border border-[#E8600A]/25 bg-[#FFF7ED]" aria-hidden="true" /> : null}
      <div className="relative flex items-center justify-between gap-4"><div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8600A]">{item.tag}</div><div className="h-px flex-1 bg-neutral-200" /></div>
      <h3 className={`relative mt-7 max-w-2xl font-bold leading-[1.08] text-neutral-950 ${primary ? 'text-[30px] sm:text-[40px]' : 'text-[22px]'}`}>{item.title}</h3>
      <p className="relative mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-600">{item.body}</p>
      <p className={`relative mt-6 border-l-2 border-[#E8600A] pl-4 font-semibold leading-relaxed text-neutral-800 ${primary ? 'max-w-2xl text-[15px]' : 'text-[14px]'}`}>{item.decision}</p>
      <Link href={item.href} className="relative mt-auto inline-flex w-fit items-center gap-2 pt-7 text-[15px] font-bold text-neutral-950 transition-colors group-hover:text-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40">Разобрать сценарий<ArrowRight size={16} /></Link>
    </article>
  );
}

function ScenarioEntrances() {
  return (
    <section id="scenarios" className="scroll-mt-24 bg-[#FAF8F4] py-[clamp(52px,4.5vw,60px)]">
      <div className="container-custom">
        <RevealDiv className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div><SectionLabel>сценарии встреч</SectionLabel><h2 className="mt-5 max-w-4xl text-[32px] font-bold leading-[1.08] text-neutral-950 sm:text-[48px]">Выберите решение, которое нужно защитить на ближайшей встрече.</h2></div>
          <p className="max-w-xl text-[16px] leading-relaxed text-neutral-600 lg:justify-self-end lg:pb-1">Начните с давления, которое встретите при защите бюджета, разговоре с клиентом или вопросах инвестора.</p>
        </RevealDiv>
        <div className="mt-11 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <RevealDiv><ScenarioLink item={scenarios[0]} primary /></RevealDiv>
          <div className="grid gap-5"><RevealDiv delay={0.06}><ScenarioLink item={scenarios[1]} /></RevealDiv><RevealDiv delay={0.12}><ScenarioLink item={scenarios[2]} /></RevealDiv></div>
        </div>
      </div>
    </section>
  );
}

function DecisionProcess() {
  return (
    <section id="case" className="scroll-mt-24 overflow-hidden border-y border-neutral-200 bg-white py-[clamp(52px,4.5vw,60px)]">
      <div className="container-custom">
        <div className={styles.processIntro}>
          <RevealDiv><SectionLabel>подготовка / Defense Brief</SectionLabel><h2 className={`${styles.processHeadline} mt-5 font-display text-[34px] font-black leading-[1.02] text-neutral-950 sm:text-[54px] lg:text-[58px] xl:text-[72px]`}>От материала до позиции, которую можно защищать.</h2></RevealDiv>
          <RevealDiv className={styles.dossier} hidden={{ opacity: 0, x: 24, y: 16, scale: 0.98 }} visible={{ opacity: 1, x: 0, y: 0, scale: 1 }}><Image src="/noprecache/landing/decision-dossier.png" alt="" width={1536} height={1024} sizes="(min-width: 1024px) 56vw, 100vw" className="h-auto w-full" aria-hidden="true" /></RevealDiv>
          <RevealDiv className={styles.processBody}><p className="max-w-2xl text-[16px] leading-relaxed text-neutral-600">Сначала пройдите бесплатный стресс-тест на своём материале. Если нужен полный разбор, продолжите сессию за 299 ₽ и получите Defense Brief перед встречей.</p></RevealDiv>
        </div>
        <div className={styles.stageTrack} data-process-track="open">
          <RevealDiv className={styles.annotationLayer} hidden={{ opacity: 0, x: -30, scaleX: 0.7 }} visible={{ opacity: 1, x: 0, scaleX: 1 }} duration={0.8}><svg viewBox="0 0 1000 170" preserveAspectRatio="none" aria-hidden="true"><path d="M18 18 C158 18 226 74 338 74 S552 130 684 130" fill="none" stroke="#E8600A" strokeWidth="4" strokeLinecap="round" /></svg></RevealDiv>
          <div className={styles.stageList}>
            {processStages.map((stage, index) => (
              <RevealDiv key={stage.label} delay={index * 0.08} className={styles.processStage}>
                <div className={styles.stageMarker}>0{index + 1}</div>
                <div className="max-w-[260px] font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#E8600A]">{stage.label}</div>
                <h3 className="mt-5 text-[22px] font-bold leading-[1.12] text-neutral-950">{stage.title}</h3><p className="mt-4 max-w-[360px] text-[15px] leading-relaxed text-neutral-600">{stage.body}</p>
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
    <section id="pricing" className="scroll-mt-24 bg-[#FAF8F4] py-[clamp(52px,4.5vw,60px)]">
      <div className="container-custom">
        <RevealDiv className="mx-auto max-w-4xl text-center"><SectionLabel>цена подготовки</SectionLabel><h2 className="mt-5 text-[32px] font-bold leading-[1.08] text-neutral-950 sm:text-[48px]">Три вопроса бесплатно. Полная подготовка за 299 ₽.</h2><p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-neutral-600">Бесплатный стресс-тест показывает давление на вашем материале. Полная сессия сохраняет разбор и собирает Defense Brief.</p></RevealDiv>
        <div className="mx-auto mt-11 grid max-w-5xl gap-5 md:grid-cols-2">
          <RevealDiv className="flex flex-col border border-neutral-200 bg-white p-7 sm:p-9">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">Бесплатный стресс-тест</div><div className="mt-4 text-[48px] font-black leading-none text-neutral-950">0 ₽</div><p className="mt-4 text-[15px] leading-relaxed text-neutral-600">Вставьте материал, выберите оппонента и ответьте на три вопроса.</p><div className="my-6 h-px bg-neutral-200" />
            <ul className="mb-8 grid gap-3 text-[15px] text-neutral-700">{['Три вопроса по вашему материалу', 'Без регистрации', 'Без карты'].map((item) => <li key={item} className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#E8600A]" />{item}</li>)}</ul>
            <Link href="/simulation/guest" onClick={() => trackLandingCta('pricing_free')} className="mt-auto flex min-h-[56px] items-center justify-center bg-neutral-950 px-6 text-center text-[15px] font-bold text-white transition-colors hover:bg-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40">Проверить материал бесплатно</Link>
          </RevealDiv>
          <RevealDiv delay={0.08} className="flex flex-col bg-neutral-950 p-7 text-white shadow-[0_28px_80px_rgba(17,17,17,0.18)] sm:p-9">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FF8A3D]">Полная сессия и Defense Brief</div><div className="mt-4 text-[44px] font-black leading-none text-white">299 ₽ <span className="text-lg font-medium text-white/50">/ разбор</span></div><p className="mt-4 text-[15px] leading-relaxed text-white/70">Полный разбор материала встречи с вопросами, ответами и планом защиты.</p><div className="my-6 h-px bg-white/10" />
            <ul className="mb-8 grid gap-3 text-[15px] text-white/90">{['Сохранённый материал и ответы', 'Слабые места позиции', 'Вопросы и короткий план защиты'].map((item) => <li key={item} className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#FF8A3D]" />{item}</li>)}</ul>
            <Link href="/billing?plan=per_session" onClick={() => trackLandingCta('pricing_paid')} className="mt-auto flex min-h-[56px] items-center justify-center bg-white px-6 text-center text-[15px] font-bold text-neutral-950 transition-colors hover:bg-[#FF8A3D] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A3D]">Собрать Defense Brief</Link>
          </RevealDiv>
        </div>
      </div>
    </section>
  );
}

function FAQAndBoundaries() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section id="faq" className="scroll-mt-24 bg-white py-[clamp(52px,4.5vw,60px)]">
      <div className="container-custom mx-auto max-w-[900px]">
        <RevealDiv className="mb-9"><SectionLabel>FAQ / границы продукта</SectionLabel></RevealDiv>
        <div className="flex flex-col border-t border-neutral-950">
          {faqData.map((faq, index) => (
            <div key={faq.question} className="border-b border-neutral-200">
              <button type="button" onClick={() => setOpenIndex(openIndex === index ? null : index)} className="flex w-full cursor-pointer items-center justify-between gap-5 px-1 py-5 text-left text-[17px] font-bold text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40 sm:py-6 sm:text-[19px]" aria-expanded={openIndex === index}>{faq.question}<ChevronDown size={20} className={`shrink-0 text-neutral-400 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`} /></button>
              <AnimatePresence>{openIndex === index && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden"><p className="max-w-3xl px-1 pt-2 pb-6 text-[15px] leading-relaxed text-neutral-600">{faq.answer}</p></motion.div>}</AnimatePresence>
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
      <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true"><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.52)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.52)_1px,transparent_1px)] bg-[size:76px_76px]" /></div>
      <div className="container-custom relative z-10 py-[clamp(92px,13vw,150px)]">
        <RevealDiv className="mx-auto max-w-4xl text-center">
          <SectionLabel dark>final check</SectionLabel><h2 className="mx-auto mt-6 max-w-4xl font-display text-[38px] font-black leading-[1.04] text-white sm:text-[60px] lg:text-[72px]">Не несите слабый ответ на сильную встречу.</h2><p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-white/68">За три вопроса увидите, где позиция требует доработки. За 299 ₽ продолжите разбор и соберёте Defense Brief перед встречей.</p>
          <div className="mt-9 flex justify-center"><Link href="/simulation/guest" onClick={() => trackLandingCta('footer_final')} className="inline-flex min-h-[56px] items-center justify-center gap-3 border border-white/24 bg-white px-8 text-[15px] font-bold text-neutral-950 transition-colors hover:border-[#E8600A] hover:bg-[#E8600A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A3D]">{CTA_LABEL}<ArrowRight size={18} /></Link></div>
          <p className="mt-6 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-white/65">Без регистрации / без карты / на своём материале</p>
        </RevealDiv>
      </div>
      <Footer />
    </section>
  );
}

function Footer() {
  const footerLinkClass = 'transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A3D]';
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black py-10">
      <div className="container-custom flex flex-col items-center justify-between gap-7 text-white/75 md:flex-row">
        <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left"><div className="brightness-0 invert"><Logo size={20} /></div><div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/65">стресс-тест встреч</div></div>
        <div className="flex flex-wrap justify-center gap-7 font-mono text-[11px] uppercase tracking-[0.14em] text-white/65"><Link href="/scenarios" className={footerLinkClass}>Сценарии</Link><Link href="/contacts" className={footerLinkClass}>Контакты</Link><Link href="/personal-data" className={footerLinkClass}>Оферта</Link><Link href="/privacy" className={footerLinkClass}>Конфиденциальность</Link></div>
      </div>
    </footer>
  );
}

function JsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'PeakTalk',
        url: 'https://peaktalk.ru',
        description: 'Стресс-тест аргументации перед защитой решения, бюджета или инициативы: три вопроса без регистрации и полный разбор с Defense Brief.',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: [
          { '@type': 'Offer', name: 'Бесплатный стресс-тест', price: '0', priceCurrency: 'RUB', description: 'Три вопроса по материалу встречи без регистрации' },
          { '@type': 'Offer', name: 'Полная сессия и Defense Brief', price: '299', priceCurrency: 'RUB', description: 'Полный разбор материала встречи с Defense Brief' },
        ],
        provider: { '@type': 'Organization', name: 'PeakTalk', url: 'https://peaktalk.ru' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqData.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />;
}

export default function Page() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-screen overflow-x-clip selection:bg-[#E8600A] selection:text-white">
        <JsonLd />
        <Nav />
        <Hero />
        <PressureProof />
        <ScenarioEntrances />
        <DecisionProcess />
        <PricingCTA />
        <FAQAndBoundaries />
        <FooterCTA />
      </main>
    </MotionConfig>
  );
}
