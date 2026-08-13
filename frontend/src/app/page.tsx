"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  FileText,
  Lock,
  Menu,
  ShieldAlert,
  Target,
  Timer,
  X,
} from 'lucide-react';
import HeroVisual from '@/components/HeroVisual';
import { trackEvent } from '@/lib/analytics';

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
    label: 'вопрос CFO',
    title: 'Если бюджет режут на 30%, что Вы убираете первым и какая метрика не должна просесть?',
    body: 'Будущий оппонент проверяет не уверенность, а цену компромисса, владельца решения и конкретную метрику.',
  },
  {
    label: 'слабый ответ',
    title: '“Мы постараемся сохранить ключевые активности без потери результата...”',
    body: 'Общая формулировка не показывает выбор, последствия и условия, при которых план меняется.',
  },
  {
    label: 'что усилить',
    title: 'Назовите сокращаемые статьи, цену риска, owner и пороговую метрику.',
    body: 'PeakTalk превращает неясную позицию в список мест, где аргументация должна стать жестче до встречи.',
  },
];

const scenarios = [
  {
    tag: 'Бюджет',
    title: 'Защитить бюджет перед руководителем',
    desc: 'Когда просят сократить расходы, а Вам нужно доказать, какие инвестиции держат результат.',
    href: '/scenarios/budget-cut-q3',
    pressure: 'CFO давит на ROI, альтернативы и цену задержки.',
  },
  {
    tag: 'Клиент',
    title: 'Подготовиться к клиентской эскалации',
    desc: 'Когда нужно вернуть доверие, объяснить сбой или защитить продление контракта.',
    href: '/scenarios/client-escalation',
    pressure: 'Клиент проверяет ответственность, гарантии и следующий шаг.',
  },
  {
    tag: 'Инвестор',
    title: 'Выдержать вопросы инвестора',
    desc: 'Когда будут давить на рынок, рост, unit-экономику и реалистичность плана.',
    href: '/scenarios/series-a-pitch',
    pressure: 'Инвестор просит математику, а не эмоции.',
  },
];

const methodSteps = [
  {
    id: '01',
    label: 'source material',
    title: 'Вставьте материал встречи',
    body: 'Тезисы защиты, КП, memo, план разговора или структура презентации.',
    result: 'Подготовка начинается с позиции, которую нужно защитить, а не с абстрактной темы.',
  },
  {
    id: '02',
    label: 'pressure scan',
    title: 'Найдите слабые места до звонка',
    body: 'PeakTalk проверяет логику, доказательства, компромиссы, метрики, владельцев решений и next step.',
    result: 'До встречи видно, где будущий оппонент начнет давить.',
  },
  {
    id: '03',
    label: 'defense brief',
    title: 'Соберите Defense Brief и стресс-тест',
    body: 'Слабые зоны, вопросы оппонента и рабочие формулировки собираются в один кейс подготовки.',
    result: 'На встречу идет усиленная позиция, а не просто более гладкий текст.',
  },
];

const caseWorkspaceItems = [
  {
    label: 'source',
    title: 'Материал встречи',
    body: 'Тезисы защиты, КП, memo, письмо клиенту или структура презентации остаются в центре подготовки.',
    result: 'PeakTalk работает с Вашей позицией, а не генерирует абстрактную речь.',
  },
  {
    label: 'pressure scan',
    title: 'Разбор слабых мест',
    body: 'Система ищет пробелы в логике, метриках, компромиссах, ответственности и next step.',
    result: 'До разговора видно, где будущий оппонент начнет давить.',
  },
  {
    label: 'defense brief',
    title: 'Памятка и стресс-тест',
    body: 'Усиленная версия материала и вопросы роли собираются в один кейс подготовки.',
    result: 'Следующий шаг очевиден: прогнать позицию, исправить ответ, идти на встречу.',
  },
];

const outputArtifacts = [
  {
    label: 'история давления',
    title: 'Вопросы и ответы по Вашему материалу',
    body: 'Сохраняется ход проверки: какие возражения прилетели и как Вы на них ответили.',
  },
  {
    label: 'weak spots',
    title: 'Слабые места позиции',
    body: 'Отдельно подсвечиваются пробелы: метрики, trade-off, владелец решения, цена риска.',
  },
  {
    label: 'brief',
    title: 'Краткая памятка перед встречей',
    body: 'Defense Brief собирает фразы-опоры, вопросы, которые стоит ожидать, и следующий рабочий шаг.',
  },
];

const faqData = [
  {
    question: 'Что такое PeakTalk?',
    answer:
      'PeakTalk. AI-стресс-тест аргументов перед сложной рабочей встречей. Вы вставляете материал, выбираете роль оппонента и отвечаете на вопросы, которые проверяют слабые места позиции.',
  },
  {
    question: 'Нужна ли регистрация?',
    answer:
      'Для быстрого pressure scan регистрация не нужна. Аккаунт нужен для сохранения истории, полного разбора и Defense Brief после полной сессии.',
  },
  {
    question: 'Какой материал можно вставить?',
    answer:
      'Подойдут тезисы защиты, коммерческое предложение, memo, письмо клиенту, структура презентации или план разговора. Не вставляйте пароли, персональные данные, NDA-фрагменты и коммерческую тайну.',
  },
  {
    question: 'Это курс переговоров или коуч по выступлениям?',
    answer:
      'Нет. PeakTalk не тренирует голос, харизму или общие soft skills. Он проверяет конкретную позицию перед конкретным разговором: QBR, защита бюджета, инвесторский pitch или клиентская эскалация.',
  },
  {
    question: 'Что открывается в полной сессии?',
    answer:
      'Полная сессия за 299 ₽ сохраняет материал и ответы, показывает слабые места аргументации и собирает Defense Brief перед встречей.',
  },
];

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 18);
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
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${scrolled ? 'border-b border-black/[0.08] bg-white/92 py-2.5 shadow-[0_12px_36px_rgba(17,17,17,0.06)] backdrop-blur-2xl' : 'bg-[#FAF8F4]/90 py-3.5 backdrop-blur-md'}`}
      >
        <div className="container-custom flex items-center justify-between gap-5">
          <Link href="/" aria-label="PeakTalk">
            <Logo />
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.id}
                className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-600 transition-colors duration-150 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30"
              >
                {item.label}
              </Link>
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
              onClick={() => trackLandingCta('nav_desktop')}
              className="inline-flex min-h-11 items-center justify-center border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:border-[#E8600A] hover:bg-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40"
            >
              Проверить материал
            </Link>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 cursor-pointer items-center justify-center border border-neutral-300 bg-white text-neutral-950 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Открыть меню"
            aria-controls="landing-mobile-menu"
            aria-expanded={mobileMenuOpen}
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
            id="landing-mobile-menu"
            className="fixed inset-0 z-[100] flex flex-col bg-[#FAF8F4] p-6"
          >
            <div className="mb-10 flex items-center justify-between">
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

            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.id}
                  onClick={() => setMobileMenuOpen(false)}
                  className="cursor-pointer border-b border-neutral-200 py-4 text-left text-[22px] font-bold leading-none text-neutral-950"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto grid gap-3">
              <Link href="/login" className="flex min-h-12 items-center justify-center border border-neutral-300 text-sm font-semibold text-neutral-950">
                Войти
              </Link>
              <Link
                href="/simulation/guest"
                onClick={() => trackLandingCta('nav_mobile')}
                className="flex min-h-12 items-center justify-center border border-neutral-950 bg-neutral-950 px-4 text-center text-sm font-semibold text-white"
              >
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
    <section className="relative overflow-hidden bg-[#FAF8F4] pt-24 lg:pt-20">
      <div className="absolute inset-0 opacity-[0.45]" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.045)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,248,244,0.4)_0%,#FAF8F4_88%)]" />
      </div>

      <div className="container-custom relative z-10 grid min-w-0 grid-cols-1 items-center gap-9 pb-14 md:pb-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(520px,1.18fr)] lg:gap-12 lg:pb-20">
        <div className="w-full min-w-0 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex max-w-full border border-neutral-950 bg-white px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-700 shadow-[6px_6px_0_rgba(232,96,10,0.12)] sm:mb-6 sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
          >
            Материал / разбор / Defense Brief
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.64, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[820px] min-w-0 break-words [overflow-wrap:anywhere] font-display text-[34px] font-black leading-[1.03] text-neutral-950 sm:text-[56px] lg:text-[58px] xl:text-[64px]"
          >
            Подготовьте материал, который выдержит вопросы на встрече
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 w-full max-w-[calc(100vw-48px)] min-w-0 break-words [overflow-wrap:anywhere] text-[17px] leading-[1.62] text-neutral-600 sm:mt-7 sm:max-w-[640px] sm:text-[20px] sm:leading-[1.58]"
          >
            <span className="block sm:hidden">
              Вставьте тезисы, КП, memo<br />
              или план разговора.<br />
              PeakTalk сохранит исходник,<br />
              найдет слабые места, соберет<br />
              короткий Defense Brief и затем<br />
              прогонит позицию через вопросы<br />
              CFO, клиента или инвестора.
            </span>
            <span className="hidden sm:inline">
              Вставьте тезисы, КП, memo или план разговора. PeakTalk сохранит исходник,
              найдет слабые места, соберет короткий Defense Brief и затем прогонит позицию
              через вопросы CFO, клиента или инвестора.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 grid gap-3 sm:mt-9 sm:flex sm:items-center sm:gap-4"
          >
            <Link
              href="/simulation/guest"
              onClick={() => trackLandingCta('hero_primary')}
              className="inline-flex min-h-[54px] cursor-pointer items-center justify-center gap-3 whitespace-nowrap border border-[#E8600A] bg-[#E8600A] px-7 text-center text-[14px] font-bold text-white shadow-[0_16px_36px_rgba(232,96,10,0.22)] transition-colors duration-200 hover:border-[#B74707] hover:bg-[#B74707] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40 sm:min-h-[56px] sm:px-8 sm:text-[15px]"
            >
              {CTA_LABEL}
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#case"
              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center border border-neutral-300 bg-white px-5 text-[15px] font-bold text-neutral-800 transition-colors duration-150 hover:border-neutral-950 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30 sm:min-h-[56px] sm:px-6"
            >
              Как устроен кейс
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="mt-7 flex max-w-[680px] flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500 sm:gap-x-6 sm:gap-y-3 sm:text-[11px] sm:tracking-[0.16em]"
          >
            <span>без регистрации</span>
            <span>без карты</span>
            <span className="font-bold text-[#E8600A]">на своём материале</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.62, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={safariMotionStyle}
            className="mt-7 w-full min-w-0 md:hidden"
          >
            <HeroVisual compact />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.72, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          style={safariMotionStyle}
          className="relative hidden min-w-0 md:block lg:translate-x-5"
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

function CaseWorkspace() {
  return (
    <section id="case" className="scroll-mt-24 border-y border-neutral-200 bg-white py-[clamp(64px,8vw,104px)]">
      <div className="container-custom">
        <RevealDiv className="mb-10 grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <SectionLabel>meeting case</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.08] text-neutral-950 sm:text-[48px]">
              Не чат с AI. Рабочий кейс вокруг Вашего материала.
            </h2>
          </div>
          <p className="max-w-xl text-[16px] leading-relaxed text-neutral-600 lg:pb-2">
            Новая логика PeakTalk начинается не с выбора режима, а с материала, который нужно
            защитить. Разбор, усиленная версия и стресс-тест живут рядом, чтобы подготовка не распадалась
            на отдельные AI-ответы.
          </p>
        </RevealDiv>

        <div className="grid gap-px border border-neutral-950 bg-neutral-950 lg:grid-cols-3">
          {caseWorkspaceItems.map((item, index) => (
            <RevealDiv
              key={item.title}
              delay={index * 0.05}
              className="flex min-h-[300px] flex-col bg-[#FAF8F4] p-6 sm:p-8"
            >
              <div className="flex items-start justify-between gap-5">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8600A]">
                  {item.label}
                </div>
                <div className="border border-neutral-950 bg-white px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-neutral-950">
                  0{index + 1}
                </div>
              </div>
              <h3 className="mt-10 text-[23px] font-bold leading-[1.12] text-neutral-950">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">{item.body}</p>
              <div className="mt-auto border-t border-neutral-200 pt-6 text-[14px] font-semibold leading-relaxed text-[#B74707]">
                {item.result}
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function PressureProof() {
  return (
    <section id="pressure" className="scroll-mt-24 bg-neutral-950 py-[clamp(76px,11vw,132px)] text-white">
      <div className="container-custom">
        <RevealDiv className="mb-10 grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <SectionLabel dark>live pressure fragment</SectionLabel>
            <h2 className="mt-5 max-w-2xl text-[32px] font-bold leading-[1.08] text-white sm:text-[48px]">
              Не презентация. Место, где позиция начинает трескаться.
            </h2>
          </div>
          <p className="max-w-xl text-[16px] leading-relaxed text-white/62 lg:pb-2">
            PeakTalk не пишет речь вместо Вас. Он показывает момент, где будущий оппонент начнет
            давить на цифры, компромисс и ответственность за решение.
          </p>
        </RevealDiv>

        <RevealDiv className="grid border border-white/12 bg-white/[0.03] lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="border-b border-white/12 p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 text-[#FF8A3D]">
              <ShieldAlert size={20} />
              <div className="font-mono text-[11px] uppercase tracking-[0.16em]">case pressure room</div>
            </div>
            <p className="mt-8 text-[24px] font-bold leading-[1.16] text-white sm:text-[30px]">
              Один слабый ответ лучше увидеть здесь, а не за столом переговоров.
            </p>
            <Link
              href="/simulation/guest"
              onClick={() => trackLandingCta('pressure_fragment')}
              className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-3 border border-white bg-white px-6 text-[14px] font-bold text-neutral-950 transition-colors hover:border-[#E8600A] hover:bg-[#E8600A] hover:text-white"
            >
              Проверить свой материал
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="divide-y divide-white/12">
            {pressureRows.map((row, index) => (
              <div key={row.label} className="grid gap-4 p-5 sm:p-7 md:grid-cols-[164px_minmax(0,1fr)]">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF8A3D]">
                    {row.label}
                  </div>
                  <div className="mt-2 font-mono text-[10px] tabular-nums text-white/32">
                    0{index + 1} / 03
                  </div>
                </div>
                <div>
                  <p className="text-[18px] font-bold leading-snug text-white sm:text-[22px]">
                    {row.title}
                  </p>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/58">
                    {row.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </RevealDiv>
      </div>
    </section>
  );
}

function ScenarioEntrances() {
  return (
    <section id="scenarios" className="scroll-mt-24 bg-[#FAF8F4] py-[clamp(76px,11vw,132px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <SectionLabel>сценарии встреч</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.08] text-neutral-950 sm:text-[48px]">
              Начните с разговора, который уже стоит в календаре.
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-xl text-[16px] leading-relaxed text-neutral-600">
              Страница не продает “переговоры вообще”. Выберите ситуацию, где нужно защитить решение,
              деньги, доверие или план.
            </p>
            <Link
              href="/scenarios"
              className="mt-5 inline-flex min-h-[48px] items-center gap-2 border border-neutral-300 bg-white px-5 text-[15px] font-bold text-neutral-950 transition-colors hover:border-neutral-950"
            >
              Все сценарии
              <ArrowRight size={16} />
            </Link>
          </div>
        </RevealDiv>

        <div className="grid gap-px border border-neutral-950 bg-neutral-950 lg:grid-cols-3">
          {scenarios.map((item, index) => (
            <RevealDiv
              key={item.title}
              delay={index * 0.04}
              className="group flex min-h-[314px] flex-col bg-white p-6 transition-colors hover:bg-[#fffbf6] sm:p-7"
            >
              <div className="mb-8 flex items-center justify-between gap-4">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8600A]">
                  {item.tag}
                </div>
                <div className="font-mono text-[11px] tabular-nums text-neutral-400">0{index + 1}</div>
              </div>
              <h3 className="text-[23px] font-bold leading-[1.12] text-neutral-950 lg:text-[25px]">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">{item.desc}</p>
              <div className="mt-6 border-l-2 border-[#E8600A] pl-4 text-[14px] font-semibold leading-relaxed text-neutral-800">
                {item.pressure}
              </div>
              <Link
                href={item.href}
                className="mt-auto inline-flex w-fit items-center gap-2 pt-7 text-[15px] font-bold text-neutral-950 transition-colors group-hover:text-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30"
              >
                Разобрать сценарий
                <ArrowRight size={16} />
              </Link>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function MethodSection() {
  return (
    <section id="how" className="scroll-mt-24 bg-white py-[clamp(76px,11vw,132px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <SectionLabel>как работает</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.08] text-neutral-950 sm:text-[48px]">
              Материал встречи превращается в проверку позиции.
            </h2>
          </div>
          <p className="max-w-md text-[16px] leading-relaxed text-neutral-600 lg:pb-2">
            Три шага без учебной сцены, бейджей и абстрактных AI-настроек: материал, pressure scan,
            Defense Brief и только затем репетиция давления.
          </p>
        </RevealDiv>

        <div className="grid gap-px border border-neutral-200 bg-neutral-200 lg:grid-cols-3">
          {methodSteps.map((step, index) => (
            <RevealDiv key={step.title} delay={index * 0.05} className="flex min-h-[330px] flex-col bg-[#FAF8F4] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                  {step.label}
                </div>
                <div className="border border-neutral-950 bg-white px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-neutral-950">
                  {step.id}
                </div>
              </div>
              <h3 className="mt-10 text-[23px] font-bold leading-[1.12] text-neutral-950">{step.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">{step.body}</p>
              <div className="mt-auto border-t border-neutral-200 pt-6 text-[14px] font-semibold leading-relaxed text-[#B74707]">
                {step.result}
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

function OutputArtifacts() {
  return (
    <section className="bg-[#FAF8F4] py-[clamp(76px,11vw,132px)]">
      <div className="container-custom">
        <RevealDiv className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <SectionLabel>после полной сессии</SectionLabel>
            <h2 className="mt-5 max-w-xl text-[32px] font-bold leading-[1.08] text-neutral-950 sm:text-[46px]">
              На выходе не “совет”. На выходе рабочий briefing перед встречей.
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-neutral-600">
              Бесплатный pressure scan показывает механику. Полная сессия нужна, чтобы сохранить разбор,
              слабые места и короткую памятку перед реальным разговором.
            </p>
          </div>

          <div className="border border-neutral-950 bg-white">
            <div className="border-b border-neutral-950 bg-neutral-950 px-5 py-4 text-white sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#FF8A3D]">
                  Defense Brief
                </div>
                <FileText size={18} className="text-[#FF8A3D]" />
              </div>
            </div>
            <div className="divide-y divide-neutral-200">
              {outputArtifacts.map((artifact, index) => (
                <div key={artifact.title} className="grid gap-4 p-5 sm:p-6 md:grid-cols-[150px_minmax(0,1fr)]">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E8600A]">
                      {artifact.label}
                    </div>
                    <div className="mt-2 font-mono text-[10px] tabular-nums text-neutral-400">
                      0{index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[19px] font-bold leading-snug text-neutral-950">{artifact.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{artifact.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealDiv>
      </div>
    </section>
  );
}

function PricingCTA() {
  return (
    <section id="pricing" className="scroll-mt-24 bg-white py-[clamp(76px,11vw,132px)]">
      <div className="container-custom">
        <RevealDiv className="mx-auto mb-12 max-w-3xl text-center">
          <SectionLabel>free / Defense Brief</SectionLabel>
          <h2 className="mt-5 text-[32px] font-bold leading-[1.08] text-neutral-950 sm:text-[46px]">
            Бесплатно: первый pressure scan. 299 ₽, когда нужен Defense Brief.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-neutral-600">
            Граница простая: демо показывает давление на Вашем материале. Defense Brief сохраняет
            историю, слабые места и короткий план защиты перед встречей.
          </p>
        </RevealDiv>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 lg:gap-8">
          <RevealDiv className="flex flex-col border border-neutral-200 bg-[#FAF8F4] p-7 sm:p-8 lg:p-10">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">
              бесплатный stress-test
            </div>
            <div className="mt-4 text-[48px] font-black leading-none text-neutral-950">0 ₽</div>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
              Материал встречи, выбранный оппонент и первая проверка без регистрации.
            </p>
            <div className="my-6 h-px bg-neutral-200" />
            <ul className="mb-8 grid gap-3 text-[15px] text-neutral-700">
              {['Без регистрации', 'Без карты', 'На тезисах, документе или плане разговора'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#E8600A]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/simulation/guest"
              onClick={() => trackLandingCta('pricing_free')}
              className="mt-auto flex min-h-[56px] items-center justify-center bg-neutral-950 px-6 text-[15px] font-bold text-white transition-colors hover:bg-[#E8600A]"
            >
              {CTA_LABEL}
            </Link>
          </RevealDiv>

          <RevealDiv delay={0.08} className="flex flex-col bg-neutral-950 p-7 text-white shadow-[0_28px_80px_rgba(17,17,17,0.18)] sm:p-8 lg:p-10">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FF8A3D]">
              Defense Brief
            </div>
            <div className="mt-4 flex items-end gap-2 text-[48px] font-black leading-none text-white">
              <span className="text-[#FF8A3D]">299</span>
              <span>₽</span>
              <span className="pb-1.5 text-lg font-medium text-white/50">/ разбор</span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Разбор материала встречи: вопросы, ответы, слабые места и план защиты.
            </p>
            <div className="my-6 h-px bg-white/10" />
            <ul className="mb-8 grid gap-3 text-[15px] text-white/90">
              {['История вопросов и ответов', 'Слабые места позиции', 'Defense Brief перед встречей'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[#FF8A3D]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/billing?plan=per_session"
              onClick={() => trackLandingCta('pricing_paid')}
              className="mt-auto flex min-h-[56px] items-center justify-center bg-white px-6 text-[15px] font-bold text-neutral-950 transition-colors hover:bg-[#FF8A3D] hover:text-white"
            >
              Собрать Defense Brief
            </Link>
          </RevealDiv>
        </div>
      </div>
    </section>
  );
}

function FAQAndBoundaries() {
  const signals = [
    {
      icon: Target,
      title: 'Конкретная встреча',
      desc: 'QBR, защита бюджета, pitch, клиентская эскалация или stakeholder update.',
    },
    {
      icon: ShieldAlert,
      title: 'Неприятная роль',
      desc: 'Оппонент давит по цифрам, срокам, рискам и компромиссам.',
    },
    {
      icon: Timer,
      title: 'Перед реальным разговором',
      desc: 'Формат рассчитан на подготовку, когда времени мало.',
    },
    {
      icon: Lock,
      title: 'Честная граница демо',
      desc: 'Быстрый pressure scan доступен без карты и регистрации.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-[#FAF8F4] py-[clamp(76px,11vw,132px)]">
      <div className="container-custom grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(460px,1fr)] lg:gap-20">
        <RevealDiv>
          <SectionLabel>faq / границы продукта</SectionLabel>
          <h2 className="mt-5 max-w-xl text-[32px] font-bold leading-[1.08] text-neutral-950 sm:text-[46px]">
            Для разговоров, где общие формулировки не проходят.
          </h2>
          <div className="mt-10 grid gap-6">
            {signals.map((signal) => (
              <div key={signal.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-white text-[#E8600A]">
                  <signal.icon size={20} />
                </div>
                <div>
                  <div className="text-[17px] font-bold text-neutral-950">{signal.title}</div>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-600">{signal.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </RevealDiv>

        <div className="flex flex-col gap-3">
          {faqData.map((faq, index) => (
            <div key={faq.question} className="border border-neutral-200 bg-white transition-colors hover:border-neutral-300">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-5 px-5 py-5 text-left text-[17px] font-bold text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30 sm:px-6"
                aria-expanded={openIndex === index}
              >
                {faq.question}
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
                    <p className="px-5 pb-6 text-[15px] leading-relaxed text-neutral-600 sm:px-6">{faq.answer}</p>
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
      <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.52)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.52)_1px,transparent_1px)] bg-[size:76px_76px]" />
      </div>

      <div className="container-custom relative z-10 py-[clamp(92px,13vw,150px)]">
        <RevealDiv className="mx-auto max-w-4xl text-center">
          <SectionLabel dark>final check</SectionLabel>
          <h2 className="mx-auto mt-6 max-w-4xl font-display text-[38px] font-black leading-[1.04] text-white sm:text-[60px] lg:text-[72px]">
            Не несите слабый ответ на сильную встречу.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-white/68">
            За быстрый scan Вы увидите, где позиция проседает. После оплаты сохраните разбор и
            соберете Defense Brief перед разговором.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href="/simulation/guest"
              onClick={() => trackLandingCta('footer_final')}
              className="inline-flex min-h-[56px] items-center justify-center gap-3 border border-white/24 bg-white px-8 text-[15px] font-bold text-neutral-950 transition-colors hover:border-[#E8600A] hover:bg-[#E8600A] hover:text-white"
            >
              {CTA_LABEL}
              <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-6 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-white/[0.4]">
            без регистрации / без карты / на своём материале
          </p>
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
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'PeakTalk',
        url: 'https://peaktalk.ru',
        description:
          'AI-стресс-тест аргументов перед сложной рабочей встречей: вставьте тезисы, документ или план разговора, получите неудобные вопросы и слабые места позиции.',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: [
          {
            '@type': 'Offer',
            name: 'Гостевой стресс-тест',
            price: '0',
            priceCurrency: 'RUB',
            description: 'Быстрый pressure scan без регистрации',
          },
          {
            '@type': 'Offer',
            name: 'Defense Brief',
            price: '299',
            priceCurrency: 'RUB',
            description: 'Разбор материала встречи с Defense Brief',
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
      <CaseWorkspace />
      <PressureProof />
      <ScenarioEntrances />
      <MethodSection />
      <OutputArtifacts />
      <PricingCTA />
      <FAQAndBoundaries />
      <FooterCTA />
    </main>
  );
}
