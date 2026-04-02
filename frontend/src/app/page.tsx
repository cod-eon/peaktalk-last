"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useMotionValue, useMotionTemplate } from 'framer-motion';
import Image from 'next/image';
import { Menu, X, ArrowRight } from 'lucide-react';
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

function CountUpStat({ end, delay = 0, suffix = "" }: { end: number, delay?: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let startTimestamp: number;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    const timer = setTimeout(() => {
      window.requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [inView, end, delay]);

  return <span ref={ref}>{count}{suffix}</span>;
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
            {['Суть', 'Ценность', 'Отзывы'].map((item, i) => {
              const mapIds = ['#how', '#value', '#testimonials'];
              return (
                <button
                  key={item}
                  onClick={() => smoothScroll(mapIds[i])}
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
                  {item}
                </button>
              );
            })}
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
                Войти в симуляцию
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
              {['Суть', 'Ценность', 'Отзывы'].map((item, i) => {
                const mapIds = ['#how', '#value', '#testimonials'];
                return (
                  <button
                    key={item}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setTimeout(() => smoothScroll(mapIds[i]), 300);
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
                    {item}
                  </button>
                );
              })}
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
                Войти в симуляцию
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
                Приватно. Без записи камер.
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
                Комиссия не будет <br/> 
                <span className="text-[var(--color-accent)] italic opacity-90">закрывать глаза.</span>
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
                Готовься к жестким вопросам — не к гладкому тексту. Загрузи диплом или питч. AI-коуч в роли инвестора или критика разорвет слабые аргументы, прежде чем это сделает реальность.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex gap-3 flex-wrap justify-center lg:justify-start"
              >
                <a href="/register" className="btn-primary" style={{ padding: '14px 28px', fontSize: 13, borderRadius: '4px' }}>
                  Войти в симуляцию
                </a>
                <button
                  className="btn-secondary transition-all hover:bg-[var(--bg-surface-alt)]"
                  onClick={() => smoothScroll('#how')}
                  style={{ padding: '14px 28px', fontSize: 13, borderRadius: '4px', border: '1px solid var(--border-main)' }}
                >
                  Читать манифест
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

// ─── CORE VALUE (Consolidated Flow) ──────────────────────────────────────────
function ActionFlow() {
  const steps = [
    { num: '01', title: 'Грязный черновик', desc: 'Скармливаешь PDF, дек или просто кривой текст. Плевать на форматирование. Система сама найдет смысловые узлы.', direction: -30, img: '/dirty_draft.png' },
    { num: '02', title: 'Жесткий краш-тест', desc: 'Выбираешь роль экзекутора: Инвестор, Скептик из комиссии, HR. Получаешь допрос по самым неочевидным местам.', direction: 0, scale: 0.9, img: '/mic.png' },
    { num: '03', title: 'Холодная оценка', desc: 'Отчет: 10% блефа, 40% воды, 2 проваленных аргумента. Забираешь правки и идешь выступать без мандража.', direction: 30, img: '/cold_grade.png' },
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
              textTransform: 'uppercase',
            }}>
              Цикл подготовки.
            </h2>
            <p className="mt-4 text-[var(--text-dim)] font-mono text-xs tracking-widest uppercase">Без жалости. Без камеры.</p>
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
                
                <div className="font-mono text-[10px] text-[var(--color-accent)] tracking-widest mb-4 opacity-50 block transition-all group-hover:opacity-100 group-hover:text-shadow-[0_0_12px_var(--color-accent)]">[{s.num}]</div>
                
                {/* AI Image Showcase with Spotlight */}
                <div className="relative h-40 md:h-48 mb-8 pointer-events-none transition-transform duration-500 lg:group-hover:-translate-y-2 lg:group-hover:scale-105 origin-left w-full flex items-center justify-start">
                  {/* Subtle Grid Backdrop (static) */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_transparent_0%,_var(--bg-main)_100%),url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNlNWEyNyIvPjwvc3ZnPg==')] transition-opacity duration-700" />
                  
                  {/* Floating effect specifically for mobile or fallback */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)] to-[#FF3366] opacity-10 blur-2xl lg:hidden rounded-full scale-150 animate-pulse" />

                  {/* Image itself */}
                  <img src={s.img} alt="" className="relative z-10 h-full w-auto max-w-full object-contain drop-shadow-2xl mix-blend-darken" />
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
            Для тех, кто не полагается на удачу.
          </h2>
          <div className="font-mono text-[10px] tracking-widest uppercase text-[var(--text-dim)]">
            Аудитория PeakTalk // 2026
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/10 p-[1px]">
          {[
            { tag: 'СТУДЕНТЫ', title: 'Научный руководитель', detail: 'Защита диплома или курсовой', stat: 47, suffix: '% успешных защит' },
            { tag: 'ФАУНДЕРЫ', title: 'Холодный Инвестор', detail: 'Питчи, деки и unit-экономика', stat: 3, suffix: '× уверенность на питче' },
            { tag: 'КАРЬЕРА', title: 'Токсичный HR', detail: 'Собеседования на Senior грейды', stat: 60, suffix: '% офферов' }
          ].map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              key={i} 
              className="group relative bg-[var(--text-main)] p-8 lg:p-12 transition-all hover:bg-neutral-900 pb-20 lg:pb-24 overflow-hidden"
            >
              <div className="font-mono text-[9px] text-[var(--color-accent)] tracking-widest uppercase mb-16">{item.tag}</div>
              <h3 className="font-syne font-bold text-2xl text-white mb-2">{item.title}</h3>
              <p className="font-inter text-sm text-neutral-400">{item.detail}</p>

              {/* Stat Counter */}
              <div className="absolute bottom-6 left-8 lg:left-12 font-mono text-[10px] text-white/50 uppercase tracking-widest font-bold">
                +<CountUpStat end={item.stat} delay={300 + i * 150} />{item.suffix}
              </div>

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
          Готов к допросу?
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <a 
            href="/register" 
            className="btn-primary flex items-center gap-3 group relative overflow-hidden" 
            style={{ padding: '16px 32px', fontSize: 13, borderRadius: '4px', boxShadow: '0 4px 20px rgba(232,96,10, 0.1)' }}
          >
            <span className="relative z-10 font-bold transition-all duration-300">Начать тренировку</span>
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
