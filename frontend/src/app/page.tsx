"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Menu, X, ArrowRight } from 'lucide-react';
import ThreeDElement from '@/components/ThreeDElement';

const smoothScroll = (id: string) => {
  const element = document.querySelector(id);
  if (element) {
    const navHeight = 88;
    const y = element.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

// ─── HOOKS ──────────────────────────────────────────────────────────────────
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
  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: 88,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    }}>
      {/* Editorial grid background */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply" style={{
        backgroundImage: 'linear-gradient(var(--border-main) 1px, transparent 1px), linear-gradient(90deg, var(--border-main) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 70%)'
      }} />

      <div className="container-custom relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Text Content */}
          <div className="max-w-2xl pt-12 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center border border-[var(--border-light)] rounded-none px-4 py-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-8 bg-[var(--color-accent-bg)] backdrop-blur-md"
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
                fontSize: 'clamp(44px, 7vw, 92px)',
                fontWeight: 800,
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
                color: 'var(--text-main)',
                marginBottom: 32,
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
                fontSize: 'clamp(16px, 1.5vw, 18px)',
                lineHeight: 1.6,
                color: 'var(--text-muted)',
                marginBottom: 48,
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
              className="flex gap-4 flex-wrap"
            >
              <a href="/register" className="btn-primary" style={{ padding: '16px 32px', fontSize: 13, borderRadius: '4px' }}>
                Войти в симуляцию
              </a>
              <button
                className="btn-secondary transition-all hover:bg-[var(--bg-surface-alt)]"
                onClick={() => smoothScroll('#how')}
                style={{ padding: '16px 32px', fontSize: 13, borderRadius: '4px', border: '1px solid var(--border-main)' }}
              >
                Читать манифест
              </button>
            </motion.div>
          </div>

          {/* 3D Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="h-[500px] lg:h-[700px] w-full relative -mr-8 lg:-mr-24"
          >
            {/* Soft backdrop glow so the 3D element pops */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[var(--color-ai)] rounded-full blur-[120px] opacity-10 pointer-events-none" />
            <ThreeDElement scene="https://prod.spline.design/kZIGLNwjBEnx0hA3/scene.splinecode" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// ─── CORE VALUE (Consolidated Flow) ──────────────────────────────────────────
function ActionFlow() {
  const steps = [
    { num: '01', title: 'Грязный черновик', desc: 'Скармливаешь PDF, дек или просто кривой текст. Плевать на форматирование. Система сама найдет смысловые узлы.' },
    { num: '02', title: 'Жесткий краш-тест', desc: 'Выбираешь роль экзекутора: Инвестор, Скептик из комиссии, HR. Получаешь допрос по самым неочевидным местам.' },
    { num: '03', title: 'Холодная оценка', desc: 'Отчет: 10% блефа, 40% воды, 2 проваленных аргумента. Забираешь правки и идешь выступать без мандража.' },
  ];

  return (
    <section id="how" style={{ padding: 'clamp(100px, 15vw, 180px) 0', backgroundColor: 'var(--bg-main)' }}>
      <div className="container-custom">
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

          <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div 
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="group relative border-l border-[var(--border-main)] pl-6 pb-8"
              >
                <div className="font-mono text-[10px] text-[var(--color-accent)] tracking-widest mb-4 opacity-50 block">[{s.num}]</div>
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
    <section id="value" style={{ padding: 'clamp(80px, 10vw, 140px) 0', backgroundColor: 'var(--text-main)' }}>
      <div className="container-custom">
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
            { tag: 'СТУДЕНТЫ', title: 'Научный руководитель', detail: 'Защита диплома или курсовой' },
            { tag: 'ФАУНДЕРЫ', title: 'Холодный Инвестор', detail: 'Питчи, деки и unit-экономика' },
            { tag: 'КАРЬЕРА', title: 'Токсичный HR', detail: 'Собеседования на Senior грейды' }
          ].map((item, i) => (
            <div key={i} className="bg-[var(--text-main)] p-8 lg:p-12 transition-all hover:bg-neutral-900">
              <div className="font-mono text-[9px] text-[var(--color-accent)] tracking-widest uppercase mb-16">{item.tag}</div>
              <h3 className="font-syne font-bold text-2xl text-white mb-2">{item.title}</h3>
              <p className="font-inter text-sm text-neutral-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA FOOTER ──────────────────────────────────────────────────────────────
function FooterCTA() {
  return (
    <section style={{ backgroundColor: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
      <div className="py-32 lg:py-48 text-center container-custom relative z-10">
        <h2 style={{
          fontFamily: 'var(--font-syne)',
          fontSize: 'clamp(40px, 6vw, 80px)',
          fontWeight: 800,
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          color: 'var(--text-main)',
          marginBottom: 32,
        }}>
          Готов к допросу?
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <a href="/register" className="btn-primary flex items-center gap-3 group" style={{ padding: '16px 32px', fontSize: 13, borderRadius: '4px' }}>
            Начать тренировку
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <p className="mt-8 font-mono text-[10px] tracking-widest uppercase text-[var(--text-dim)]">3 сессии бесплатно // Карта не нужна</p>
      </div>

      <Footer />
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border-main)] py-12">
      <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-8">
        <Logo size={20} />
        
        <div className="flex gap-8 font-mono text-[10px] tracking-widest uppercase text-[var(--text-dim)]">
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
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <ActionFlow />
      <ImpactEvidence />
      <FooterCTA />
    </main>
  );
}
