"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  ChevronDown,
  Clock3,
  FileText,
  Gauge,
  Lock,
  Menu,
  MessageSquareWarning,
  PanelsTopLeft,
  Radio,
  ShieldAlert,
  Target,
  Timer,
  TrendingUp,
  X,
} from 'lucide-react';

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

function useAnimeFrame<T extends HTMLElement>(variant: 'hero' | 'review' | 'scenarios') {
  const ref = useRef<T | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { amount: 0.18, margin: '-48px 0px' });

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion || !isInView) return;

    let cancelled = false;
    const animations: Array<{ revert: () => unknown }> = [];

    import('animejs').then(({ animate, createTimeline, stagger }) => {
      if (cancelled) return;

      const parts = root.querySelectorAll<HTMLElement>('[data-kinetic="part"]');
      const lines = root.querySelectorAll<HTMLElement>('[data-kinetic="line"]');
      const pulses = root.querySelectorAll<HTMLElement>('[data-kinetic="pulse"]');
      const sweep = root.querySelectorAll<HTMLElement>('[data-kinetic="sweep"]');
      const cursor = root.querySelectorAll<HTMLElement>('[data-kinetic="cursor"]');
      const drift = root.querySelectorAll<HTMLElement>('[data-kinetic="drift"]');

      if (parts.length) {
        animations.push(animate(parts, {
          opacity: [0, 1],
          y: [14, 0],
          duration: 680,
          delay: stagger(58),
          ease: 'outQuint',
        }));
      }

      const loop = createTimeline({
        defaults: { ease: 'inOutSine' },
        loop: true,
        loopDelay: variant === 'hero' ? 900 : 1200,
      });

      if (pulses.length) {
        loop
          .add(pulses, {
            opacity: [0.45, 1],
            scale: [0.9, 1],
            duration: 520,
            delay: stagger(74),
          }, 0)
          .add(pulses, {
            opacity: [1, 0.48],
            scale: [1, 0.92],
            duration: 560,
            delay: stagger(62),
          }, 720);
      }

      if (lines.length) {
        loop.add(lines, {
          opacity: [0.42, 1],
          x: [-8, 0],
          duration: 680,
          delay: stagger(78),
        }, variant === 'scenarios' ? 120 : 220);
      }

      if (sweep.length) {
        loop.add(sweep, {
          opacity: [0, 0.72, 0],
          y: ['-115%', '115%'],
          duration: 1600,
        }, 260);
      }

      if (cursor.length) {
        loop.add(cursor, {
          opacity: [0, 1],
          duration: 360,
          loop: 4,
          alternate: true,
        }, 520);
      }

      if (drift.length) {
        loop
          .add(drift, {
            y: [-3, 3],
            duration: 1200,
            delay: stagger(90),
          }, 0)
          .add(drift, {
            y: [3, -2],
            duration: 1200,
            delay: stagger(90),
          }, 1250);
      }

      animations.push(loop);
    });

    return () => {
      cancelled = true;
      animations.forEach((animation) => animation.revert());
    };
  }, [isInView, prefersReducedMotion, variant]);

  return ref;
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

function HeroPressureFrame({ compact = false }: { compact?: boolean }) {
  const frameRef = useAnimeFrame<HTMLDivElement>('hero');
  const pressurePoints = ['ресурс', 'метрика', 'компромисс'];

  return (
    <div
      ref={frameRef}
      className={`relative mx-auto w-full ${compact ? 'max-w-[410px]' : 'max-w-[860px]'}`}
      aria-label="Фрагмент симуляции PeakTalk"
    >
      <div className="absolute -inset-3 border border-[#E8600A]/20 bg-[#E8600A]/5" aria-hidden="true" />
      <div
        data-kinetic="part"
        style={safariMotionStyle}
        className={`relative overflow-hidden border-[3px] border-neutral-950 bg-white shadow-[10px_12px_0_rgba(17,17,17,0.08)] ${compact ? '' : 'lg:shadow-[22px_24px_0_rgba(17,17,17,0.08)]'}`}
      >
        <div
          data-kinetic="sweep"
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(232,96,10,0.16),rgba(232,96,10,0))]"
          aria-hidden="true"
        />

        <div className={`relative flex items-center justify-between gap-3 border-b border-neutral-200 bg-[#faf8f4] ${compact ? 'px-3 py-2.5' : 'px-4 py-3 sm:px-5'}`}>
          <div className="flex items-center gap-3">
            <div className={`${compact ? 'size-7' : 'size-8'} flex items-center justify-center bg-neutral-950 font-mono text-[11px] font-bold text-white`}>PT</div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-400">board review</div>
              <div className={`${compact ? 'text-[14px]' : 'text-[15px] sm:text-[18px]'} font-black leading-tight text-neutral-950`}>Защита бюджета</div>
            </div>
          </div>
          <div className="flex items-center gap-2 border border-neutral-200 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
            <Radio size={13} className="text-[#E8600A]" />
            live
          </div>
        </div>

        <div className="relative grid bg-white lg:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="hidden border-r border-neutral-200 bg-[#f7f4ed] p-4 lg:block">
            <div data-kinetic="part" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">материал</div>
            <p data-kinetic="line" className="mt-4 text-[14px] leading-relaxed text-neutral-700">
              Релиз сдвинется на месяц, если бюджет сократят на 30%.
            </p>
            <div className="mt-8 grid gap-2">
              {pressurePoints.map((point) => (
                <div key={point} data-kinetic="pulse" className="flex items-center justify-between border border-neutral-200 bg-white px-3 py-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-500">{point}</span>
                  <span className="size-1.5 bg-[#E8600A]" />
                </div>
              ))}
            </div>
          </aside>

          <div className={compact ? 'p-3.5' : 'p-4 sm:p-5 lg:p-6'}>
            <div className={`${compact ? 'hidden' : 'grid'} grid-cols-3 gap-3`}>
              {[
                { label: 'раунд', value: '02/03' },
                { label: 'давление', value: '8/10' },
                { label: 'до встречи', value: '42м' },
              ].map((item) => (
                <div key={item.label} data-kinetic="part" className={`border border-neutral-200 bg-[#faf8f4] ${compact ? 'p-2.5' : 'p-3'}`}>
                  <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-neutral-400">{item.label}</div>
                  <div className={`${compact ? 'mt-1.5 text-[17px]' : 'mt-2 text-[18px] sm:text-[22px]'} font-black leading-none text-neutral-950`}>{item.value}</div>
                </div>
              ))}
            </div>

            <div data-kinetic="part" className={`${compact ? 'mt-3 p-3.5' : 'mt-4 p-4 sm:p-5'} bg-neutral-950 text-white`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
                  <MessageSquareWarning size={14} className="text-[#FF8A3D]" />
                  входящий вопрос
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#FF8A3D]">CFO</span>
              </div>
              <p data-kinetic="line" className={`${compact ? 'text-[17px]' : 'text-[18px] sm:text-[22px]'} font-bold leading-snug text-white text-pretty`}>
                Что Вы убираете первым, если ресурс режется на 30%?
              </p>
            </div>

            {compact ? (
              <div data-kinetic="part" className="mt-3 border border-[#E8600A]/35 bg-[#fff8f2] p-3.5">
                <div className="flex items-start gap-2">
                  <Activity size={15} className="mt-0.5 text-[#E8600A]" />
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E8600A]">слабое место</div>
                    <p data-kinetic="line" className="mt-2 text-[14px] font-bold leading-snug text-neutral-950">
                      Нет выбора, цены компромисса и владельца решения.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_0.9fr]">
                <div data-kinetic="part" className="border border-neutral-200 bg-white p-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-400">черновик ответа</div>
                  <p data-kinetic="line" className="mt-3 text-[14px] leading-relaxed text-neutral-600 text-pretty">
                    Сохраним ключевые активности и постараемся не потерять результат<span data-kinetic="cursor" className="ml-1 inline-block h-4 w-px translate-y-0.5 bg-[#E8600A]" />
                  </p>
                </div>
                <div data-kinetic="part" className="border border-[#E8600A]/35 bg-[#fff8f2] p-4">
                  <div className="flex items-start gap-2">
                    <Activity size={16} className="mt-0.5 text-[#E8600A]" />
                    <div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E8600A]">слабое место</div>
                      <p data-kinetic="line" className="mt-2 text-[14px] font-bold leading-snug text-neutral-950">
                        Нет выбора, цены компромисса и владельца решения.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveReviewFrame() {
  const frameRef = useAnimeFrame<HTMLDivElement>('review');

  return (
    <div ref={frameRef} className="relative">
      <div className="absolute -inset-3 border border-neutral-100 bg-[#faf8f4]" aria-hidden="true" />
      <div className="relative overflow-hidden border border-neutral-950 bg-white shadow-[14px_16px_0_rgba(232,96,10,0.12)]">
        <div data-kinetic="sweep" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(17,17,17,0.08),rgba(17,17,17,0))]" aria-hidden="true" />
        <div className="border-b border-neutral-200 bg-neutral-950 px-5 py-4 text-white sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">live pressure frame</div>
            <div className="font-mono text-[10px] tabular-nums text-[#FF8A3D]">02:18</div>
          </div>
          <p data-kinetic="line" className="mt-4 max-w-xl text-[21px] font-bold leading-snug text-white text-balance sm:text-[28px]">
            “Почему этот проект важнее двух альтернатив, которые уже ждут ресурс?”
          </p>
        </div>

        <div className="grid gap-px bg-neutral-200 sm:grid-cols-2">
          <div data-kinetic="part" className="bg-[#faf8f4] p-5 sm:p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">ответ сейчас</div>
            <p data-kinetic="line" className="mt-4 text-[16px] leading-relaxed text-neutral-600 text-pretty">
              “Он стратегически важен, потому что влияет на удержание клиента и скорость релиза.”
            </p>
          </div>
          <div data-kinetic="part" className="bg-white p-5 sm:p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#E8600A]">где ломается</div>
            <p data-kinetic="line" className="mt-4 text-[17px] font-bold leading-snug text-neutral-950 text-pretty">
              Нет цены задержки и условия, при котором Вы сами отмените инициативу.
            </p>
          </div>
        </div>

        <div data-kinetic="part" className="border-t border-neutral-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div data-kinetic="pulse" className="mt-1 flex size-9 shrink-0 items-center justify-center bg-[#E8600A] text-white">
              <Target size={18} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">prep-card</div>
              <p data-kinetic="line" className="mt-2 text-[16px] font-semibold leading-relaxed text-neutral-800 text-pretty">
                Начните с цены бездействия. Затем назовите компромисс, владельца решения и метрику, которую не готовы просадить.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioSignalFrame() {
  const frameRef = useAnimeFrame<HTMLDivElement>('scenarios');
  const signals = [
    { icon: Gauge, title: 'Budget defense', meta: 'CFO режет ресурс' },
    { icon: BarChart3, title: 'QBR', meta: 'проверка метрик' },
    { icon: MessageSquareWarning, title: 'Client escalation', meta: 'потеря доверия' },
    { icon: TrendingUp, title: 'Investor pitch', meta: 'давление по росту' },
  ];

  return (
    <div ref={frameRef} className="grid gap-3 sm:grid-cols-2">
      {signals.map((signal, index) => (
        <div
          key={signal.title}
          data-kinetic="drift"
          className={`border bg-white p-4 shadow-sm ${index === 0 ? 'border-[#E8600A]/45' : 'border-neutral-100'}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-10 items-center justify-center bg-neutral-950 text-white">
              <signal.icon size={18} />
            </div>
            <span data-kinetic="pulse" className={`mt-1 size-2 ${index === 0 ? 'bg-[#E8600A]' : 'bg-neutral-300'}`} />
          </div>
          <h3 className="mt-5 text-[18px] font-bold leading-tight text-neutral-950">{signal.title}</h3>
          <p data-kinetic="line" className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">{signal.meta}</p>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#faf8f4] pt-24 lg:pt-20">
      <div className="absolute inset-0 opacity-[0.35]" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.045)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#faf8f4_86%)]" />
      </div>

      <div className="container-custom relative z-10 grid items-center gap-8 pb-8 md:pb-16 lg:grid-cols-[minmax(0,0.76fr)_minmax(520px,1.24fr)] lg:gap-14 lg:pb-24">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 hidden max-w-full border border-neutral-200 bg-white/80 px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-600 shadow-sm rounded-none sm:mb-6 sm:inline-flex sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
          >
            подготовка к сложной рабочей встрече
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.64, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[760px] font-display text-[31px] font-black leading-[1.04] text-neutral-950 text-balance sm:text-[54px] lg:text-[58px] xl:text-[62px]"
          >
            Стресс-тест аргументов перед встречей.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-[560px] text-[16px] leading-[1.48] text-neutral-600 text-pretty sm:mt-8 sm:text-[20px] sm:leading-[1.55]"
          >
            Вставьте тезисы. PeakTalk сыграет CFO, клиента или инвестора
            и покажет слабые места позиции.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.62, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={safariMotionStyle}
            className="mt-5 md:hidden"
          >
            <HeroPressureFrame compact />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 grid gap-3 sm:mt-10 sm:flex sm:items-center sm:gap-4"
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
              className="hidden min-h-[48px] cursor-pointer items-center justify-center px-4 text-[15px] font-bold text-neutral-600 transition-colors duration-150 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30 sm:inline-flex sm:min-h-[56px] sm:px-6"
            >
              Посмотреть сценарии
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="mt-5 hidden max-w-[680px] flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 sm:mt-8 sm:flex sm:gap-x-6 sm:gap-y-3 sm:text-[11px] sm:tracking-[0.16em]"
          >
            <span>без регистрации</span>
            <span className="text-[#E8600A] font-medium">демо: 3 вопроса</span>
            <span>на своём кейсе</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.72, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          style={safariMotionStyle}
          className="relative hidden min-w-0 md:block lg:translate-x-4"
        >
          <HeroPressureFrame />
        </motion.div>
      </div>
    </section>
  );
}

function PressureGap() {
  const items = [
    {
      title: 'Жёсткий вопрос',
      body: 'Не общий совет, а конкретное возражение под Ваш материал.',
    },
    {
      title: 'Слабая связка',
      body: 'PeakTalk показывает, где нет метрики, выбора или владельца решения.',
    },
    {
      title: 'Prep-card',
      body: 'Короткая карта ответа, которую можно открыть перед встречей.',
    },
  ];

  return (
    <section className="bg-white py-[clamp(76px,12vw,140px)]">
      <div className="container-custom">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
          <div>
            <RevealDiv>
              <SectionLabel>что на выходе</SectionLabel>
              <h2 className="mt-5 max-w-2xl text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
                Не ещё один AI-текст. Репетиция момента, где Вас начнут давить.
              </h2>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-neutral-500 text-pretty">
                Вы видите цепочку сразу: вопрос оппонента, слабую связку и короткую карту ответа перед встречей.
              </p>
            </RevealDiv>

            <div className="mt-9 grid gap-5 border-t border-neutral-100 pt-8 sm:grid-cols-3 lg:grid-cols-1">
              {items.map((item, index) => (
                <RevealDiv key={item.title} delay={index * 0.05} className="flex gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center bg-[#E8600A]/10 font-mono text-[11px] font-bold text-[#E8600A]">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold leading-tight text-neutral-950">{item.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-neutral-500 text-pretty">{item.body}</p>
                  </div>
                </RevealDiv>
              ))}
            </div>
          </div>

          <RevealDiv delay={0.08}>
            <LiveReviewFrame />
          </RevealDiv>
        </div>
      </div>
    </section>
  );
}

function ActionFlowPipeline() {
  const steps = [
    {
      icon: FileText,
      id: '1',
      label: 'контекст',
      title: 'Материал встречи',
      body: 'Тезисы, КП, письмо клиенту или план защиты.',
      result: 'роль и вводные',
    },
    {
      icon: Radio,
      id: '2',
      label: 'давление',
      title: 'Живые вопросы',
      body: 'Оппонент давит на ценность, риски и компромиссы.',
      result: 'ответы под давлением',
    },
    {
      icon: PanelsTopLeft,
      id: '3',
      label: 'правки',
      title: 'Prep-card',
      body: 'Слабые места и формулировка, которую можно взять в разговор.',
      result: 'карта защиты',
    },
  ];

  return (
    <section id="how" className="bg-[#faf8f4] py-[clamp(80px,12vw,140px)]">
      <div className="container-custom">
        <RevealDiv className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <SectionLabel>как работает</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
              Три шага без учебной сцены и мотивационной подачи.
            </h2>
          </div>
          <p className="max-w-md text-[17px] leading-relaxed text-neutral-500 text-pretty lg:pb-2">
            Контур короткий: загрузили контекст, выдержали вопросы, забрали карту ответа.
          </p>
        </RevealDiv>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-8">
          <RevealDiv className="border border-neutral-950 bg-neutral-950 p-6 text-white shadow-xl shadow-black/5 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#FF8A3D]">pre-meeting cockpit</div>
              <Clock3 size={18} className="text-white/45" />
            </div>
            <div className="mt-10 grid gap-4">
              {['12 минут до созвона', '3 неудобных вопроса', '1 карта ответа'].map((item, index) => (
                <div key={item} className="flex items-center gap-4">
                  <span className="flex size-8 items-center justify-center border border-white/15 font-mono text-[10px] text-white/60">0{index + 1}</span>
                  <span className="text-[18px] font-bold leading-tight text-white">{item}</span>
                </div>
              ))}
            </div>
          </RevealDiv>

          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <RevealDiv
                key={step.title}
                delay={index * 0.05}
                className="relative flex min-h-[250px] flex-col border border-neutral-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md lg:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-10 items-center justify-center bg-[#faf8f4] text-[#E8600A]">
                    <step.icon size={18} />
                  </div>
                  <div className="flex size-8 items-center justify-center bg-neutral-950 font-display text-sm font-black text-white">
                    {step.id}
                  </div>
                </div>
                <div className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">{step.label}</div>
                <h3 className="mt-3 text-[20px] font-bold leading-[1.15] text-neutral-950">{step.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-neutral-500 text-pretty">{step.body}</p>
                <div className="mt-auto pt-6">
                  <div className="inline-flex items-center gap-2 bg-[#E8600A]/10 px-2.5 py-1 text-[13px] font-semibold text-[#E8600A]">
                    <span className="size-1.5 bg-[#E8600A]" />
                    {step.result}
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
  const scenarios = [
    {
      tag: 'Бюджет',
      title: 'Защитить бюджет перед руководителем',
      desc: 'Сокращение ресурса, цена задержки, владелец решения.',
      href: '/scenarios/budget-cut-q3',
    },
    {
      tag: 'Клиент',
      title: 'Подготовиться к разговору с клиентом',
      desc: 'Эскалация, доверие, продление и неприятные факты.',
      href: '/scenarios/client-escalation',
    },
    {
      tag: 'Инвестор',
      title: 'Выдержать вопросы инвестора',
      desc: 'Рынок, рост, unit-экономика и реалистичность плана.',
      href: '/scenarios/series-a-pitch',
    },
  ];

  return (
    <section id="scenarios" className="bg-white py-[clamp(80px,12vw,140px)]">
      <div className="container-custom">
        <RevealDiv className="mb-14 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)] lg:items-end">
          <div>
            <SectionLabel>сценарии встреч</SectionLabel>
            <h2 className="mt-5 max-w-3xl text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
              Не “публичные выступления”. Конкретный разговор из календаря.
            </h2>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-neutral-500 text-pretty">
              Выбираете роль оппонента и контекст давления. Сценарий сразу подстраивает вопросы под материал.
            </p>
          </div>
          <ScenarioSignalFrame />
        </RevealDiv>

        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          {scenarios.map((item, index) => (
            <RevealDiv key={item.title} delay={index * 0.04} className="group flex min-h-[230px] flex-col border border-neutral-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg lg:p-7">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#E8600A]">{item.tag}</div>
                <div className="flex size-8 items-center justify-center bg-neutral-100 font-display text-sm font-black text-neutral-400">{index + 1}</div>
              </div>
              <h3 className="text-[22px] font-bold leading-[1.15] text-neutral-950 lg:text-[24px]">{item.title}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-500 text-pretty">{item.desc}</p>
              <Link
                href={item.href}
                className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-[15px] font-bold text-neutral-950 transition-colors group-hover:text-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/30 lg:pt-8"
              >
                Разобрать сценарий
                <ArrowRight size={16} />
              </Link>
            </RevealDiv>
          ))}
        </div>

        <RevealDiv delay={0.12} className="mt-8 flex justify-center">
          <Link href="/scenarios" className="inline-flex min-h-[48px] items-center gap-2 bg-neutral-100 px-6 text-[15px] font-bold text-neutral-900 transition-colors hover:bg-neutral-200 rounded-none">
            Все сценарии
            <ArrowRight size={16} />
          </Link>
        </RevealDiv>
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
          <h2 className="mt-5 text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
            Начать можно сразу. Платить — только за полный разбор.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-neutral-500 text-pretty">
            Бесплатный режим показывает давление на Вашем материале. Полная сессия сохраняет отчёт и prep-card.
          </p>
        </RevealDiv>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 lg:gap-8">
          <RevealDiv className="flex flex-col border border-neutral-200 bg-white p-8 shadow-sm lg:p-10">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">бесплатный стресс-тест</div>
            <div className="mt-4 text-[48px] font-black leading-none text-neutral-950">0 ₽</div>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-600 text-pretty">Материал встречи, выбранный оппонент и первые 3 вопроса.</p>
            <div className="my-6 h-px bg-neutral-100" />
            <ul className="mb-8 grid gap-3 text-[15px] text-neutral-700">
              {['Без регистрации', 'Без карты', 'На своём кейсе'].map((item) => (
                <li key={item} className="flex items-start gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8600A]" />{item}</li>
              ))}
            </ul>
            <Link href="/simulation/guest" className="mt-auto flex min-h-[56px] items-center justify-center bg-neutral-100 px-6 text-[15px] font-bold text-neutral-900 transition-colors hover:bg-neutral-200 rounded-none">
              {CTA_LABEL}
            </Link>
          </RevealDiv>

          <RevealDiv delay={0.08} className="flex flex-col bg-neutral-950 p-8 text-white shadow-xl lg:p-10">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#FF8A3D]">полная сессия</div>
            <div className="mt-4 flex items-end gap-2 text-[48px] font-black leading-none text-white">
              <span className="text-[#FF8A3D]">299</span>
              <span>₽</span>
              <span className="pb-1.5 text-lg font-medium text-white/50">/ сессия</span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70 text-pretty">Полная симуляция, история ответов и карта защиты перед встречей.</p>
            <div className="my-6 h-px bg-white/10" />
            <ul className="mb-8 grid gap-3 text-[15px] text-white/90">
              {['История вопросов', 'Разбор слабых мест', 'Prep-card и отчёт'].map((item) => (
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
      a: 'Сервис подготовки к сложным рабочим встречам: Вы вставляете материал, выбираете оппонента и проходите проверку аргументов.',
    },
    {
      q: 'Нужна ли регистрация?',
      a: 'Для первых трёх вопросов — нет. Аккаунт нужен для сохранения полной сессии, отчёта и prep-card.',
    },
    {
      q: 'Что можно вставить вместо документа?',
      a: 'Тезисы, КП, письмо клиенту, структура презентации или план защиты решения.',
    },
    {
      q: 'Это заменяет коуча или курс?',
      a: 'Нет. PeakTalk закрывает более узкую задачу: pressure-test конкретного материала перед конкретным разговором.',
    },
  ];

  const signals = [
    { icon: Target, title: 'Свой материал' },
    { icon: ShieldAlert, title: 'Неприятная роль' },
    { icon: Timer, title: 'Перед встречей' },
    { icon: Lock, title: 'Без карты' },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-[clamp(80px,12vw,140px)]">
      <div className="container-custom grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(460px,1fr)] lg:gap-20">
        <RevealDiv>
          <SectionLabel>trust / faq</SectionLabel>
          <h2 className="mt-5 max-w-xl text-[32px] font-bold leading-[1.1] text-neutral-950 text-balance sm:text-[46px]">
            Для встреч, где общие формулировки не проходят.
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-3">
            {signals.map((signal) => (
              <div key={signal.title} className="flex items-center gap-3 border border-neutral-100 bg-[#faf8f4] p-4">
                <div className="flex size-9 shrink-0 items-center justify-center bg-[#E8600A]/10">
                  <signal.icon size={20} className="text-[#E8600A]" />
                </div>
                <div className="text-[15px] font-bold leading-tight text-neutral-950">{signal.title}</div>
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
      answer: 'PeakTalk — сервис подготовки к сложным рабочим встречам: Вы вставляете материал, выбираете оппонента и проходите проверку аргументов.',
    },
    {
      question: 'Нужна ли регистрация?',
      answer: 'Для первых трёх вопросов регистрация не нужна. Аккаунт нужен для сохранения полной сессии, отчёта и prep-card.',
    },
    {
      question: 'Что можно вставить вместо документа?',
      answer: 'Подойдут тезисы, коммерческое предложение, письмо клиенту, структура презентации или план защиты решения.',
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
