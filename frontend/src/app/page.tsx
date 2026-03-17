"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const smoothScroll = (id: string) => {
  const element = document.querySelector(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
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
          background: scrolled ? 'rgba(3, 4, 7, 0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-main)' : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <div className="container-custom" style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) auto minmax(120px, 1fr)', alignItems: 'center' }}>
          <div style={{ justifySelf: 'start' }}>
            <Logo />
          </div>

          {/* Desktop Nav */}
          <div style={{ display: 'none', justifySelf: 'center' }} className="hidden lg:flex">
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {['Как это работает', 'Возможности', 'Отзывы', 'Тарифы'].map((item, i) => {
                const mapIds = ['#how', '#features', '#testimonials', '#pricing'];
                return (
                  <button
                    key={item}
                    onClick={() => smoothScroll(mapIds[i])}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      color: 'var(--text-main)',
                      opacity: 0.7,
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'none', justifySelf: 'end' }} className="hidden lg:flex">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <a href="/login" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-main)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textDecoration: 'none',
              }}>Вход</a>
              <a href="/register" className="btn-primary" style={{ padding: '10px 20px', fontSize: 11 }}>
                Начать
              </a>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            style={{
              justifySelf: 'end',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            [ Меню ]
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(32px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(3, 4, 7, 0.95)',
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
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                [ Закрыть ]
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'flex-start' }}>
              {['Как это работает', 'Возможности', 'Отзывы', 'Тарифы'].map((item, i) => {
                const mapIds = ['#how', '#features', '#testimonials', '#pricing'];
                return (
                  <button
                    key={item}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setTimeout(() => smoothScroll(mapIds[i]), 300);
                    }}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 16,
                      color: 'var(--text-main)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {item}
                  </button>
                );
              })}

              <div style={{ width: '100%', height: 1, backgroundColor: 'var(--border-main)', margin: '16px 0' }} />

              <a href="/login" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textDecoration: 'none',
              }}>Войти в систему</a>

              <a href="/register" className="btn-primary" style={{ width: '100%', padding: '16px 0', marginTop: 16 }}>
                Начать бесплатно
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
      paddingTop: 'clamp(100px, 15vh, 220px)',
      paddingBottom: 'clamp(60px, 10vh, 160px)',
      overflow: 'hidden'
    }}>
      <div className="bg-grid" />

      <div className="container-custom" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid var(--border-light)',
              borderRadius: 100,
              padding: '6px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 32,
              backgroundColor: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-blue)', marginRight: 10 }} />
            AI-Тренер выступлений
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(40px, 8vw, 88px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: 'white',
              marginBottom: 24,
              textWrap: 'balance',
            }}
          >
            Текст — это лишь база.<br />
            <span className="text-slate-300">Уверенность решает.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(16px, 2vw, 20px)',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              marginBottom: 48,
              maxWidth: 600,
              marginInline: 'auto',
              textWrap: 'balance',
            }}
          >
            Готовься к презентациям, питчам и собеседованиям. Загрузи сценарий, получи разбор структуры и пройди стресс-интервью с AI-экспертами.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <a href="/register" className="btn-primary" style={{ padding: '16px 32px', fontSize: 13 }}>
              Начать бесплатно
            </a>
            <button 
              className="btn-secondary transition-all border-slate-700 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
              onClick={() => smoothScroll('#how')} 
              style={{ padding: '16px 32px', fontSize: 13 }}
            >
              Узнать больше
            </button>
          </motion.div>
        </div>

        {/* Mock representation of the interface */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: 'clamp(64px, 10vw, 96px)',
            border: '1px solid var(--border-light)',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: 'var(--bg-surface)',
            boxShadow: '0 24px 64px -12px rgba(0,0,0,0.8)',
            position: 'relative',
          }}
        >
          <div style={{ height: 48, borderBottom: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2a3143' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2a3143' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2a3143' }} />
            <div style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-dim)',
              letterSpacing: '0.05em',
            }}>
              peaktalk / analysis / pitch_v2.md
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'clamp(16px, 4vw, 32px)', fontFamily: 'var(--font-mono)', fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--text-muted)', lineHeight: 1.8, position: 'relative' }}>
              <div><span style={{ color: 'var(--accent-blue)' }}>[00:00]</span> Здравствуйте, сегодня я хочу представить вам наш стартап.</div>
              <div style={{ marginTop: 12 }}><span style={{ color: 'var(--accent-blue)' }}>[00:15]</span> Мы решаем острую проблему рынка... <span style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', padding: '0 4px', borderRadius: 2 }}>как бы так сказать, довольно сложную</span> (⚠ Вода / Неуверенность)</div>
              <div style={{ marginTop: 12 }}><span style={{ color: 'var(--accent-blue)' }}>[00:42]</span> Наш TAM составляет 2 миллиарда долларов.</div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4" style={{
                marginTop: 'clamp(24px, 4vw, 32px)',
                padding: 'clamp(12px, 3vw, 16px)',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderLeft: '2px solid var(--accent-blue)',
                fontFamily: 'var(--font-inter)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '1px solid var(--border-light)' }}>
                  <Image src="/investor_avatar.png" alt="Investor Avatar" fill sizes="40px" className="object-cover" />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>AI-Слушатель:</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>&quot;Рассказ про TAM кажется оторванным от реальности. Вы не объяснили, как будете его достигать. Рекомендую добавить стратегию Go-to-Market сразу после озвучивания объема рынка.&quot;</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── MARQUEE (Aesthetic Scroller) ──────────────────────────────────────────────
function MarqueeStrip() {
  return (
    <div style={{
      padding: '24px 0',
      borderTop: '1px solid var(--border-main)',
      borderBottom: '1px solid var(--border-main)',
      overflow: 'hidden',
      display: 'flex',
      whiteSpace: 'nowrap',
      backgroundColor: 'var(--bg-surface)',
    }}>
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', gap: 64, alignItems: 'center' }}
      >
        {[...Array(2)].fill([
          'АНАЛИЗ СТРУКТУРЫ', 'СТРЕСС-ИНТЕРВЬЮ', 'AI-АВАТАРЫ', 'PDF ОТЧЁТЫ', 'РАЗБОР ОШИБОК', 'УПРАВЛЕНИЕ ТЕМПОМ'
        ]).flat().map((text, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.1em',
              color: 'var(--text-dim)',
            }}>
              {text}
            </span>
            <span style={{ color: 'var(--accent-blue)', fontSize: 10 }}>✚</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── HOW IT WORKS ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { title: "ЗАГРУЗКА", desc: "Вставьте черновик текста или загрузите файл. PeakTalk поддерживает все основные форматы." },
    { title: "АНАЛИЗ", desc: "Система разбирает логику, выявляет 'воду', неуверенные формулировки и слабые аргументы." },
    { title: "ИНТЕРВЬЮ", desc: "AI-эксперты задают неудобные вопросы по тексту. Учитесь защищать свои идеи в стрессовой ситуации." },
    { title: "РЕЗУЛЬТАТ", desc: "Получите PDF-отчёт с рекомендациями по улучшению текста и разбором ваших ответов." },
  ];

  return (
    <section id="how" style={{ padding: 'clamp(80px, 15vw, 140px) 0' }}>
      <div className="container-custom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 80 }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Процесс
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-main)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: 24 }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--accent-blue)',
                letterSpacing: '0.1em',
                marginBottom: 16,
              }}>
                [ {String(i + 1).padStart(2, '0')} ]
              </div>
              <h3 style={{
                fontFamily: 'var(--font-syne)',
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 12,
                color: 'white',
              }}>
                {step.title}
              </h3>
              <p style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 14,
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ──────────────────────────────────────────────────────────────────
function FeatureCard({ tag, title, desc, accent, topVisual, delay = 0 }: { tag: string, title: string, desc: string, accent?: boolean, topVisual?: React.ReactNode, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      style={{
        border: `1px solid ${accent ? 'var(--accent-blue)' : 'var(--border-light)'}`,
        padding: 'clamp(24px, 4vw, 40px)',
        backgroundColor: accent ? 'rgba(59, 130, 246, 0.02)' : 'var(--bg-surface)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
      {topVisual && (
        <div style={{ marginBottom: 32 }}>
          {topVisual}
        </div>
      )}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: accent ? 'var(--accent-blue)' : 'var(--text-dim)',
        letterSpacing: '0.1em',
        marginBottom: 24,
      }}>
        {tag}
      </div>
      <h3 style={{
        fontFamily: 'var(--font-syne)',
        fontSize: 24,
        fontWeight: 600,
        marginBottom: 16,
        color: 'white',
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: 'var(--font-inter)',
        fontSize: 15,
        color: 'var(--text-muted)',
        lineHeight: 1.6,
        margin: 0,
      }}>
        {desc}
      </p>
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" style={{ padding: 'clamp(60px, 10vw, 80px) 0' }}>
      <div className="container-custom">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <FeatureCard
            tag="КРИТИЧЕСКИЙ РАЗБОР"
            title="Логика и Структура"
            desc='Система детально читает ваш текст и указывает на логические дыры, "воду" и слабые переходные моменты, предлагая варианты исправления.'
            accent={true}
            delay={0}
            topVisual={
              <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(135deg, rgba(20,30,50,0.8), rgba(10,15,30,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '60%' }}>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--text-dim)', width: '100%' }} />
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--text-dim)', width: '80%' }} />
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--accent-blue)', width: '60%', boxShadow: '0 0 10px rgba(59,130,246,0.5)' }} />
                </div>
              </div>
            }
          />
          <FeatureCard
            tag="СИМУЛЯЦИИ"
            title="Стресс-интервью"
            desc="Пройдите интерактивное интервью. Отвечайте на лету, а AI оценит вашу уверенность и качество аргументации."
            delay={0.1}
            topVisual={
              <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(135deg, rgba(20,30,40,0.8), rgba(5,10,20,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '2px dashed rgba(59,130,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 20px var(--accent-blue)' }} />
                </div>
              </div>
            }
          />
          <FeatureCard
            tag="АВАТАРЫ"
            title="Персонализированные Слушатели"
            desc="Настройте аудиторию: душный инвестор, придирчивый техдир или скучающий HR. Подготовьтесь к любому сценарию."
            delay={0.2}
            topVisual={
              <div style={{ width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                {['И', 'Т', 'H'].map((initial, idx) => (
                  <div key={idx} style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(20,25,35,0.8)',
                    backdropFilter: 'blur(10px)',
                    marginLeft: idx === 0 ? 0 : -16,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 3 - idx,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-syne)',
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'var(--text-main)'
                  }}>
                    {initial}
                  </div>
                ))}
              </div>
            }
          />
          <FeatureCard
            tag="ВЫГРУЗКА"
            title="PDF-Отчёты"
            desc="Экспортируйте подробный отчёт со всеми слабыми сторонами текста."
            delay={0.3}
            topVisual={
              <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(135deg, rgba(15,20,30,0.8), rgba(5,10,15,0.9))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 80,
                  height: 110,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  backdropFilter: 'blur(5px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div style={{ width: '100%', height: 16, backgroundColor: 'rgba(220, 38, 38, 0.15)', borderLeft: '2px solid #ef4444' }} />
                  <div style={{ width: '60%', height: 4, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, marginTop: 4 }} />
                  <div style={{ width: '80%', height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                  <div style={{ width: '40%', height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}

// ─── WHY NOT CHATGPT ───────────────────────────────────────────────────────────
function WhyNotChatGPT() {
  const comparisons = [
    {
      feature: 'Структура работы',
      peaktalk: 'Структурированный воркфлоу: загрузка → анализ → симуляция → отчёт',
      chatgpt: 'Свободный чат — нужно самому знать, что и как спросить',
    },
    {
      feature: 'Ролевые симуляции',
      peaktalk: 'Персонажи с контекстом: Инвестор, HR, Техдир, Скептик',
      chatgpt: 'Нейтральный бот без ролевой глубины и отраслевых знаний',
    },
    {
      feature: 'История и аналитика',
      peaktalk: 'Все сессии сохраняются, есть прогресс и рекомендации',
      chatgpt: 'Stateless — каждый новый чат начинается с нуля',
    },
  ];

  return (
    <section style={{ padding: 'clamp(80px, 12vw, 120px) 0', backgroundColor: 'var(--bg-surface)' }}>
      <div className="container-custom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 60 }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            margin: 0,
            whiteSpace: 'nowrap',
          }}>
            Почему не ChatGPT?
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-main)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border-main)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Функция
            </div>
            <div style={{ padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px)', borderLeft: '1px solid var(--border-main)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              PeakTalk
            </div>
            <div style={{ padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px)', borderLeft: '1px solid var(--border-main)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ChatGPT
            </div>
          </div>

          {comparisons.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: i < comparisons.length - 1 ? '1px solid var(--border-main)' : 'none' }}
            >
              <div style={{ padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 24px)', fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                {row.feature}
              </div>
              <div style={{ padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 24px)', borderLeft: '1px solid var(--border-main)', fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-main)', backgroundColor: 'rgba(79, 140, 255, 0.03)' }}>
                {row.peaktalk}
              </div>
              <div style={{ padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 24px)', borderLeft: '1px solid var(--border-main)', fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-dim)' }}>
                {row.chatgpt}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ──────────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <section id="testimonials" style={{ padding: 'clamp(80px, 15vw, 140px) 0' }}>
      <div className="container-custom">
        <div style={{ borderTop: '1px solid var(--border-main)', borderBottom: '1px solid var(--border-main)', padding: 'clamp(40px, 8vw, 80px) 0' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 80,
              color: 'var(--text-dim)',
              lineHeight: 0.5,
              opacity: 0.3,
            }}>&quot;</div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: 'clamp(28px, 5vw, 40px)',
                fontWeight: 600,
                color: 'var(--text-main)',
                lineHeight: 1.4,
                marginBottom: 40,
              }}>
              Благодаря текстовому разбору я переписал свой сценарий. Нейросеть задавала именно те коварные вопросы, которые я затем услышал на реальной защите.
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}
            >
              <div style={{ width: 48, height: 48, position: 'relative', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                <Image src="/investor_avatar.png" alt="Artem Avatar" fill sizes="48px" className="object-cover" />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', textAlign: 'left' }}>
                <div style={{ color: 'white', fontWeight: 600 }}>Артур Бобрицкий</div>
                <div>Руководитель бизнес-процессов в ПАО ВТБ</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ───────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "STARTER", price: "0",
      features: ["3 анализа в месяц", "1 симуляция интервью", "Детектор паразитов", "—", "—"]
    },
    {
      name: "PRO", price: "990", accent: true,
      features: ["Безлимитный анализ", "Безлимитные симуляции", "Детектор паразитов", "Экспорт PDF отчётов", "Все AI-аватары"]
    },
    {
      name: "TEAM", price: "2490",
      features: ["До 5 пользователей", "Всё из тарифа PRO", "Командная статистика", "Приоритетная поддержка", "Централизованная оплата"]
    }
  ];

  return (
    <section id="pricing" style={{ padding: 'clamp(60px, 10vw, 80px) 0 clamp(80px, 15vw, 140px) 0' }}>
      <div className="container-custom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 80 }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Тарифы
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-main)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0 }}>
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                border: '1px solid var(--border-light)',
                marginLeft: i > 0 ? -1 : 0, // collapse borders
                padding: 'clamp(24px, 4vw, 40px)',
                backgroundColor: plan.accent ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                position: 'relative',
                zIndex: plan.accent ? 10 : 1,
              }}>
              {plan.accent && (
                <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 2, background: 'var(--accent-blue)' }} />
              )}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: plan.accent ? 'var(--accent-blue)' : 'var(--text-dim)', marginBottom: 24 }}>
                {plan.name}
              </div>
              <div style={{ marginBottom: 40 }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontSize: 48, fontWeight: 700 }}>{plan.price}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>₽ / мес</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-main)', paddingBottom: 16 }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: f === '—' ? 'var(--text-dim)' : 'var(--text-main)' }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 40 }}>
                <a href="/register" className={plan.accent ? "btn-primary" : "btn-secondary"} style={{ width: '100%', justifyContent: 'center' }}>
                  Выбрать план
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-main)', padding: '64px 0', backgroundColor: 'var(--bg-surface)' }}>
      <div className="container-custom" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
        <div>
          <Logo size={20} />
          <p style={{ marginTop: 16, fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} PeakTalk. Все права защищены.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'clamp(16px, 4vw, 40px)', flexWrap: 'wrap' }}>
          {['Конфиденциальность', 'Условия', 'Контакты'].map((link) => (
            <a href="#" key={link} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              textDecoration: 'none',
            }}>
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── ROOT PAGE ─────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <main>
      <Nav />
      <Hero />
      <MarqueeStrip />
      <HowItWorks />
      <Features />
      <WhyNotChatGPT />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  );
}
