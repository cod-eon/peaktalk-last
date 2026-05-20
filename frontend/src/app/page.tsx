"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Lock,
  Menu,
  MessageSquare,
  ShieldAlert,
  Target,
  Timer,
  X,
} from 'lucide-react';
import HeroVisual from '@/components/HeroVisual';

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
            pressure-test перед рабочей встречей
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.64, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[780px] font-display text-[32px] font-black leading-[1.04] text-neutral-950 sm:text-[52px] lg:text-[54px] xl:text-[56px]"
          >
            Проверьте позицию до встречи, где будут давить
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-[620px] text-[17px] leading-[1.62] text-neutral-600 sm:mt-8 sm:text-[20px] sm:leading-[1.65]"
          >
            Вставьте тезисы, КП или план защиты. PeakTalk сыграет руководителя,
            клиента или инвестора, задаст неудобные вопросы и покажет слабые места ответа.
          </motion.p>

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
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.62, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={safariMotionStyle}
            className="mt-7 md:hidden"
          >
            <HeroVisual compact />
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
  const outcomes = [
    {
      title: 'Вопрос',
      body: 'Оппонент бьёт по приоритету, срокам и цене компромисса.',
    },
    {
      title: 'Слабое место',
      body: 'PeakTalk подсвечивает не общую “уверенность”, а дыру в логике.',
    },
    {
      title: 'Prep-card',
      body: 'Короткая карточка: как перестроить ответ до реальной встречи.',
    },
  ];

  return (
    <section className="bg-white py-[clamp(72px,10vw,126px)]">
      <div className="container-custom grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(520px,1.18fr)] lg:items-center lg:gap-16">
        <RevealDiv>
          <SectionLabel>что на выходе</SectionLabel>
          <h2 className="mt-5 max-w-2xl text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
            Меньше объяснений. Больше доказательства, где ответ ломается.
          </h2>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-neutral-500 text-pretty">
            PeakTalk не “улучшает выступление”. Он прогоняет Ваш материал через оппонента и
            возвращает рабочие правки: вопрос, слабое место, следующий ответ.
          </p>

          <div className="mt-9 grid gap-px border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
            {outcomes.map((item, index) => (
              <div key={item.title} className="bg-white p-5">
                <div className="font-mono text-[11px] font-medium uppercase text-[#E8600A]">0{index + 1}</div>
                <h3 className="mt-4 text-[18px] font-bold leading-tight text-neutral-950">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-neutral-500 text-pretty">{item.body}</p>
              </div>
            ))}
          </div>
        </RevealDiv>

        <RevealDiv delay={0.06} className="border border-neutral-950 bg-[#f4f1ea] shadow-xl shadow-black/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white p-4 sm:p-5">
            <div className="font-mono text-[10px] uppercase text-neutral-400">живой фрагмент разбора</div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600">
              <Timer size={15} className="text-[#E8600A]" />
              <span className="tabular-nums">03:12 до встречи</span>
            </div>
          </div>

          <div className="grid gap-px bg-neutral-200 p-px">
            <div className="bg-neutral-950 p-5 text-white sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="font-mono text-[10px] uppercase text-[#FF8A3D]">вопрос руководителя</div>
                <div className="font-mono text-[10px] tabular-nums text-white/35">01 / 03</div>
              </div>
              <p className="text-[20px] font-bold leading-[1.32] text-white text-pretty sm:text-[26px]">
                Если ресурс режется на 20%, что Вы убираете первым и какая метрика не должна просесть?
              </p>
            </div>

            <div className="grid gap-px bg-neutral-200 md:grid-cols-2">
              <div className="bg-white p-5 sm:p-6">
                <div className="font-mono text-[10px] uppercase text-neutral-400">ваш черновик</div>
                <p className="mt-4 text-[16px] leading-relaxed text-neutral-600 text-pretty">
                  “Мы постараемся сохранить ключевые активности и пересобрать план без потери результата…”
                </p>
              </div>
              <div className="bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-[#E8600A]/10 text-[#E8600A]">
                    <ShieldAlert size={17} />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase text-[#E8600A]">слабое место</div>
                    <p className="mt-1 text-[18px] font-bold leading-tight text-neutral-950">
                      Нет выбора, цены компромисса и владельца решения.
                    </p>
                  </div>
                </div>
                <div className="border-l-2 border-[#E8600A] pl-4">
                  <div className="font-mono text-[10px] uppercase text-neutral-400">prep-card</div>
                  <p className="mt-2 text-[15px] leading-relaxed text-neutral-600 text-pretty">
                    Начните с того, что можно отложить. Затем назовите риск, метрику и условие, при котором план меняется.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RevealDiv>
      </div>
    </section>
  );
}

function ActionFlowPipeline() {
  const steps = [
    {
      id: '01',
      label: 'brief',
      title: 'Материал встречи',
      body: 'Тезисы, КП, письмо клиенту, структура презентации или план защиты бюджета.',
      result: 'сценарий тренировки',
      icon: FileText,
      visual: ['QBR: защитить продление', 'Риск: бюджет заморожен', 'Запрос: согласовать рост'],
    },
    {
      id: '02',
      label: 'pressure',
      title: 'Вопросы оппонента',
      body: 'Симуляция давит на ценность, риски, сроки, бюджет и право на решение.',
      result: 'проверенная аргументация',
      icon: MessageSquare,
      visual: ['CFO: почему сейчас?', 'Клиент: докажите срок', 'Инвестор: покажите когорты'],
    },
    {
      id: '03',
      label: 'debrief',
      title: 'План усиления',
      body: 'Получите слабые места, точные формулировки и следующий рабочий шаг.',
      result: 'prep-card перед встречей',
      icon: ClipboardCheck,
      visual: ['нет метрики', 'слабый компромисс', 'следующий ответ готов'],
    },
  ];

  return (
    <section id="how" className="bg-[#faf8f4] py-[clamp(72px,10vw,126px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <SectionLabel>как работает</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
              Один короткий цикл: brief → pressure → debrief.
            </h2>
          </div>
          <p className="max-w-lg text-[17px] leading-relaxed text-neutral-500 text-pretty lg:pb-2">
            Сначала фиксируете контекст встречи. Затем PeakTalk давит ролью оппонента
            и собирает debrief, который можно открыть прямо перед разговором.
          </p>
        </RevealDiv>

        <div className="relative grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-3">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <RevealDiv
                key={step.title}
                delay={index * 0.05}
                className="group relative flex min-h-[430px] flex-col bg-white"
              >
                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-[118px] z-10 hidden size-8 items-center justify-center border border-neutral-200 bg-white text-neutral-400 md:flex">
                    <ArrowRight size={16} />
                  </div>
                )}

                <div className="relative flex h-[208px] items-center justify-center overflow-hidden border-b border-neutral-100 bg-[#f4f1ea] px-6 pt-10">
                  <div className="absolute left-5 top-5 font-mono text-[11px] font-medium uppercase text-neutral-400">{step.label}</div>
                  <div className="absolute right-5 top-5 font-mono text-[18px] font-black tabular-nums text-neutral-950">{step.id}</div>

                  <div className="w-full max-w-[280px] border border-neutral-200 bg-white p-4 shadow-sm transition-transform duration-200 ease-out group-hover:-translate-y-1">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex size-9 items-center justify-center bg-neutral-950 text-white">
                        <StepIcon size={18} />
                      </div>
                      <div className="h-2 w-16 bg-[#E8600A]" />
                    </div>
                    <div className="grid gap-2">
                      {step.visual.map((line) => (
                        <div key={line} className="flex items-center gap-2 border border-neutral-100 bg-[#faf8f4] px-3 py-2">
                          <span className="size-1.5 shrink-0 bg-[#E8600A]" />
                          <span className="truncate text-[12px] font-semibold text-neutral-600">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="text-[22px] font-bold leading-[1.15] text-neutral-950">{step.title}</h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-neutral-500 text-pretty">{step.body}</p>
                  <div className="mt-auto pt-7">
                    <div className="border-t border-neutral-100 pt-4 text-[14px] font-bold text-[#E8600A]">
                      Результат: {step.result}
                    </div>
                  </div>
                </div>
              </RevealDiv>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InteractiveScenarios() {
  const scenarios = [
    {
      tag: 'Бюджет',
      title: 'Защитить бюджет',
      desc: 'Нужно доказать приоритет, когда расходы режут и просят убрать инициативы.',
      href: '/scenarios/budget-cut-q3',
      role: 'Руководитель',
      stake: 'сохранить ресурс',
      risk: 'срезать инициативу без замены',
      metric: 'срок релиза',
      question: 'Что Вы готовы убрать первым, если ресурс режется на 20%?',
      output: 'Нужен компромисс: что снимаем, какую метрику защищаем, кто владелец решения.',
    },
    {
      tag: 'Клиент',
      title: 'Разобрать эскалацию',
      desc: 'Нужно вернуть доверие, объяснить сбой или защитить продление контракта.',
      href: '/scenarios/client-escalation',
      role: 'Клиент',
      stake: 'вернуть доверие',
      risk: 'ещё один сорванный срок',
      metric: 'SLA / продление',
      question: 'Почему мы должны верить новому сроку, если предыдущий уже сорван?',
      output: 'Нужен новый механизм доверия: причина, контрольный ритм, компенсация.',
    },
    {
      tag: 'Инвестор',
      title: 'Выдержать инвестора',
      desc: 'Нужно защитить рост, рынок, unit-экономику и реалистичность плана.',
      href: '/scenarios/series-a-pitch',
      role: 'Инвестор',
      stake: 'защитить раунд',
      risk: 'growth story без математики',
      metric: 'CAC / retention',
      question: 'Откуда берётся рост, если retention уже проседает?',
      output: 'Нужно развести CAC, retention и payback по когортам, затем назвать допущение.',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const activeScenario = scenarios[activeIndex];

  return (
    <section id="scenarios" className="bg-white py-[clamp(72px,10vw,126px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <SectionLabel>сценарии встреч</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
              Не “публичные выступления”. Конкретная встреча в календаре.
            </h2>
          </div>
          <Link href="/scenarios" className="inline-flex min-h-[48px] w-fit items-center gap-2 bg-neutral-100 px-6 text-[15px] font-bold text-neutral-900 transition-colors hover:bg-neutral-200 rounded-none">
            Все сценарии
            <ArrowRight size={16} />
          </Link>
        </RevealDiv>

        <RevealDiv className="min-w-0 overflow-hidden border border-neutral-200 bg-neutral-200">
          <div className="grid min-w-0 gap-px bg-neutral-200 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="min-w-0 bg-white">
              <div className="flex min-w-0 gap-px overflow-x-auto bg-neutral-200 lg:block lg:overflow-visible">
                {scenarios.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative min-w-[240px] flex-1 cursor-pointer bg-white p-5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30 lg:min-w-0 lg:border-b lg:border-neutral-100 lg:p-6 ${
                      activeIndex === index ? 'text-neutral-950' : 'text-neutral-500 hover:text-neutral-950'
                    }`}
                    aria-pressed={activeIndex === index}
                  >
                    {activeIndex === index && (
                      <motion.div
                        layoutId="scenarioTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-[#E8600A] lg:bottom-0 lg:right-auto lg:top-0 lg:h-auto lg:w-1"
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                      />
                    )}
                    <div className="font-mono text-[10px] font-medium uppercase text-[#E8600A]">{item.tag}</div>
                    <div className="mt-3 text-[18px] font-bold leading-tight">{item.title}</div>
                    <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-neutral-500">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 bg-[#faf8f4] p-4 sm:p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScenario.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="grid gap-6 lg:grid-cols-[minmax(260px,0.86fr)_minmax(0,1.14fr)] lg:items-center"
                >
                  <div className="relative min-h-[260px] overflow-hidden border border-neutral-200 bg-white p-5 sm:min-h-[320px]">
                    <div className="absolute inset-x-0 top-0 h-10 border-b border-neutral-100 bg-white" />
                    <div className="relative z-10 pt-8">
                      <div className="font-mono text-[10px] uppercase text-neutral-400">meeting brief</div>
                      <h3 className="mt-3 text-[28px] font-bold leading-[1.05] text-neutral-950 text-balance">
                        {activeScenario.title}
                      </h3>

                      <div className="mt-6 grid gap-px bg-neutral-200 sm:grid-cols-3">
                        {[
                          ['роль', activeScenario.role],
                          ['ставка', activeScenario.stake],
                          ['метрика', activeScenario.metric],
                        ].map(([label, value]) => (
                          <div key={label} className="bg-[#faf8f4] p-4">
                            <div className="font-mono text-[9px] uppercase text-neutral-400">{label}</div>
                            <div className="mt-2 text-[15px] font-bold leading-snug text-neutral-950">{value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 border border-neutral-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="font-mono text-[10px] uppercase text-[#E8600A]">risk map</div>
                          <div className="font-mono text-[10px] tabular-nums text-neutral-400">pressure 78</div>
                        </div>
                        <div className="h-2 bg-neutral-100">
                          <div className="h-full w-[78%] bg-[#E8600A]" />
                        </div>
                        <p className="mt-4 text-[15px] font-semibold leading-relaxed text-neutral-600 text-pretty">
                          {activeScenario.risk}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="bg-neutral-950 p-5 text-white sm:p-6">
                      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div className="font-mono text-[10px] uppercase text-[#FF8A3D]">пример давления</div>
                        <div className="font-mono text-[10px] uppercase text-white/35">{activeScenario.tag}</div>
                      </div>
                      <p className="text-[21px] font-bold leading-[1.3] text-white text-pretty sm:text-[26px]">
                        {activeScenario.question}
                      </p>
                    </div>

                    <div className="border border-neutral-200 bg-white p-5 sm:p-6">
                      <div className="font-mono text-[10px] uppercase text-[#E8600A]">debrief</div>
                      <p className="mt-3 text-[17px] font-bold leading-snug text-neutral-950 text-pretty">{activeScenario.output}</p>
                      <Link
                        href={activeScenario.href}
                        className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 bg-neutral-950 px-5 text-[14px] font-bold text-white transition-colors hover:bg-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30 rounded-none"
                      >
                        Разобрать сценарий
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </RevealDiv>
      </div>
    </section>
  );
}

function PricingCTA() {
  const plans = [
    {
      label: 'бесплатный стресс-тест',
      price: '0 ₽',
      note: '3 вопроса без регистрации и карты',
      href: '/simulation/guest',
      cta: CTA_LABEL,
      tone: 'light',
      points: ['свой материал', 'роль оппонента', 'первые слабые места'],
    },
    {
      label: 'полная сессия',
      price: '299 ₽',
      note: 'полный разбор, отчёт и prep-card',
      href: '/billing',
      cta: 'Открыть полную сессию',
      tone: 'dark',
      points: ['история ответов', 'debrief', 'карточка перед встречей'],
    },
  ];

  return (
    <section id="pricing" className="bg-[#faf8f4] py-[clamp(72px,10vw,126px)]">
      <div className="container-custom">
        <RevealDiv className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1fr)] lg:items-end">
          <div>
          <SectionLabel>бесплатно / полностью</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
              Попробуйте механику бесплатно. Платите только за полный разбор.
          </h2>
          </div>
          <p className="max-w-lg text-[17px] leading-relaxed text-neutral-500 text-pretty lg:pb-2">
            Граница честная: бесплатный режим показывает давление на Вашем кейсе.
            Полная сессия нужна, когда важно сохранить debrief и вернуться к нему перед встречей.
          </p>
        </RevealDiv>

        <div className="grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-2">
          {plans.map((plan, index) => {
            const isDark = plan.tone === 'dark';
            return (
              <RevealDiv
                key={plan.label}
                delay={index * 0.06}
                className={`flex min-h-[360px] flex-col p-7 sm:p-8 lg:p-10 ${isDark ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-950'}`}
              >
                <div className={`font-mono text-[11px] font-medium uppercase ${isDark ? 'text-[#FF8A3D]' : 'text-neutral-400'}`}>
                  {plan.label}
                </div>
                <div className="mt-5 text-[48px] font-black leading-none tabular-nums">{plan.price}</div>
                <p className={`mt-4 text-[16px] leading-relaxed text-pretty ${isDark ? 'text-white/68' : 'text-neutral-600'}`}>{plan.note}</p>
                <div className={`my-7 h-px ${isDark ? 'bg-white/10' : 'bg-neutral-100'}`} />
                <div className="mb-8 flex flex-wrap gap-2">
                  {plan.points.map((point) => (
                    <span
                      key={point}
                      className={`border px-3 py-1.5 text-[13px] font-semibold ${isDark ? 'border-white/12 bg-white/5 text-white/80' : 'border-neutral-200 bg-[#faf8f4] text-neutral-700'}`}
                    >
                      {point}
                    </span>
                  ))}
                </div>
                <Link
                  href={plan.href}
                  className={`mt-auto flex min-h-[56px] items-center justify-center px-6 text-[15px] font-bold transition-colors rounded-none ${
                    isDark ? 'bg-white text-neutral-950 hover:bg-neutral-100' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </RevealDiv>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQAndTrust() {
  const faqs = [
    {
      q: 'Что такое PeakTalk?',
      a: 'Сервис подготовки к сложным рабочим встречам: вставляете материал, выбираете оппонента и отвечаете на вопросы, которые проверяют аргументацию.',
    },
    {
      q: 'Нужна ли регистрация?',
      a: 'Для первых трёх вопросов — нет. Аккаунт нужен для сохранения полной сессии, отчёта и prep-card.',
    },
    {
      q: 'Что можно вставить вместо документа?',
      a: 'Тезисы, план разговора, КП, письмо клиенту, структура презентации или любой текст, который нужно защитить.',
    },
    {
      q: 'Это заменяет коуча или курс?',
      a: 'Нет. PeakTalk закрывает другую задачу: быстрый pressure-test конкретного материала перед конкретной встречей.',
    },
  ];

  const signals = [
    { icon: Target, title: 'PM / Product Lead', desc: 'Защита roadmap, ресурсов и приоритетов.' },
    { icon: ShieldAlert, title: 'Founder / CEO', desc: 'Инвестор, board update, стратегическая защита.' },
    { icon: Timer, title: 'CS / Account Lead', desc: 'Клиентская эскалация и продление контракта.' },
    { icon: Lock, title: 'Без карты на старте', desc: 'Первые вопросы запускаются без оплаты.' },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white py-[clamp(72px,10vw,126px)]">
      <div className="container-custom grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(460px,1fr)] lg:gap-20">
        <RevealDiv>
          <SectionLabel>trust / faq</SectionLabel>
          <h2 className="mt-5 max-w-xl text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
            Для ролей, которым нужно защищать решение, а не красиво выступать.
          </h2>
          <div className="mt-10 grid gap-4">
            {signals.map((signal) => (
              <div key={signal.title} className="flex gap-4 border border-neutral-100 bg-[#faf8f4] p-4">
                <div className="flex size-10 shrink-0 items-center justify-center bg-white">
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
