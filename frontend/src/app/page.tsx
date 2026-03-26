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
          background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
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
                Начать бесплатно
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
              background: 'rgba(255, 255, 255, 0.98)',
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
      paddingBottom: 0,
      backgroundColor: '#FFFFFF',
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
              backgroundColor: 'rgba(249,115,22,0.07)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-primary)', marginRight: 10 }} />
            Бесплатно до 3 сессий — без карты
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
              color: 'var(--text-main)',
              marginBottom: 24,
              textWrap: 'balance',
            }}
          >
            Готовься к каверзным<br />
            <span className="text-[var(--accent-primary)]">вопросам — не к тексту</span>
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
            Загрузи свой сценарий, диплом или питч. AI найдёт логические дыры и сыграет роль строгого рекрутера, инвестора или научного руководителя — прежде чем это сделают настоящие. Без камеры, без записи, без страха.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <a href="/register" className="btn-primary" style={{ padding: '16px 32px', fontSize: 13 }}>
              Попробовать бесплатно
            </a>
            <button
              className="btn-secondary transition-all border-[var(--border-main)] hover:bg-[var(--bg-surface-hover)] hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              onClick={() => smoothScroll('#how')}
              style={{ padding: '16px 32px', fontSize: 13 }}
            >
              Посмотреть, как работает
            </button>
          </motion.div>

          {/* Trust elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 24,
            }}
          >
            {[
              { icon: '📵', label: 'без камеры' },
              { icon: '🔇', label: 'без микрофона' },
              { icon: '🔒', label: 'данные защищены' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* UPGRADE 1: Big floating Safari-style browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginTop: 'clamp(48px, 8vw, 80px)',
            marginBottom: '-60px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
            boxShadow: '0 40px 100px -12px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
            backgroundColor: '#FFFFFF',
          }}>
            {/* Safari chrome bar */}
            <div style={{
              height: 48,
              backgroundColor: '#F0F0F0',
              borderBottom: '1px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: 8,
              flexShrink: 0,
            }}>
              {/* Traffic lights */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#FEBC2E' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28C840' }} />
              </div>
              {/* URL pill */}
              <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
              }}>
                <div style={{
                  backgroundColor: '#E8E8E8',
                  borderRadius: 8,
                  padding: '4px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: '#666666',
                  letterSpacing: '0.02em',
                  maxWidth: 320,
                  width: '100%',
                  textAlign: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}>
                  peaktalk.ru/simulation/pitch_investor
                </div>
              </div>
              <div style={{ width: 72 }} />
            </div>

            {/* App UI inside browser */}
            <div style={{ display: 'flex', height: 'clamp(320px, 45vw, 520px)', backgroundColor: '#F9FAFB' }}>
              {/* Thin left sidebar */}
              <div style={{
                width: 56,
                flexShrink: 0,
                backgroundColor: '#FAFAFA',
                borderRight: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 16,
                gap: 16,
              }}>
                {/* P logo */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: '#F97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 800,
                  fontSize: 14,
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}>
                  P
                </div>
                {/* Nav placeholder bars */}
                {[36, 28, 32, 24].map((w, idx) => (
                  <div key={idx} style={{
                    width: w,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#E5E7EB',
                  }} />
                ))}
              </div>

              {/* Main content area */}
              <div style={{
                flex: 1,
                padding: 'clamp(16px, 3vw, 28px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(12px, 2vw, 20px)',
                overflow: 'hidden',
              }}>
                {/* Top row: label + progress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(9px, 1.5vw, 11px)',
                    color: '#6B7280',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    ИНВЕСТОР · Тренировка
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(9px, 1.5vw, 11px)',
                      color: '#6B7280',
                    }}>
                      Вопрос 3 из 10
                    </div>
                    <div style={{ width: 120, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: '30%', height: '100%', backgroundColor: '#F97316', borderRadius: 2 }} />
                    </div>
                  </div>
                </div>

                {/* AI question card */}
                <div style={{
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: 'clamp(12px, 2vw, 18px)',
                  flexShrink: 0,
                }}>
                  <p style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'clamp(11px, 1.8vw, 14px)',
                    color: '#111827',
                    lineHeight: 1.55,
                    margin: '0 0 10px 0',
                    fontStyle: 'italic',
                  }}>
                    &laquo;TAM 2 млрд — красиво. Но вы не объяснили стратегию Go-to-Market. Кто ваш первый платящий сегмент и почему именно он?&raquo;
                  </p>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'clamp(9px, 1.3vw, 10px)',
                    color: '#F97316',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    AI-Инвестор
                  </div>
                </div>

                {/* Textarea answer */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #F97316',
                  borderRadius: 12,
                  padding: 'clamp(10px, 1.8vw, 16px)',
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}>
                  <p style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'clamp(10px, 1.6vw, 13px)',
                    color: '#374151',
                    lineHeight: 1.6,
                    margin: 0,
                    flex: 1,
                  }}>
                    Наш первый сегмент — студенты финтех-специальностей в топ-20 вузах России...
                  </p>
                  {/* Orange send button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: '#F97316',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Score chips */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                  {[
                    { label: 'Структура', score: '78%', color: '#F97316', bg: '#FFF7ED' },
                    { label: 'Аргументы', score: '65%', color: '#3B82F6', bg: '#EFF6FF' },
                    { label: 'Уверенность', score: '82%', color: '#22C55E', bg: '#F0FDF4' },
                  ].map((chip) => (
                    <div key={chip.label} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: chip.bg,
                      border: `1px solid ${chip.color}22`,
                      borderRadius: 20,
                      padding: '4px 10px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'clamp(9px, 1.3vw, 11px)',
                      color: chip.color,
                    }}>
                      <span>{chip.label}</span>
                      <span style={{ fontWeight: 700 }}>{chip.score}</span>
                    </div>
                  ))}
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
          'АНАЛИЗ СТРУКТУРЫ', 'СТРЕСС-ИНТЕРВЬЮ', 'AI-АВАТАРЫ', 'PDF ОТЧЁТЫ', 'РАЗБОР ОШИБОК', 'ИСТОРИЯ СЕССИЙ'
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
            <span style={{ color: 'var(--accent-primary)', fontSize: 10 }}>✚</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── HOW IT WORKS ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      title: "ЗАГРУЗКА",
      desc: "Вставь текст или загрузи файл — диплом, питч-дек, план собеседования. Ничего не нужно форматировать заранее: AI сам разберётся со структурой.",
      num: "01",
      iconBg: '#FFF7ED',
      iconColor: '#F97316',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 15V3M12 3L8 7M12 3L16 7M3 17V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "АНАЛИЗ",
      desc: "AI читает твой текст целиком и находит логические дыры, «воду», слабые аргументы и неуверенные формулировки. Получаешь конкретные правки — не «улучши здесь», а «вот почему это не работает и как исправить».",
      num: "02",
      iconBg: '#EFF6FF',
      iconColor: '#3B82F6',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "ИНТЕРВЬЮ",
      desc: "Выбираешь персонажа: придирчивый инвестор, жёсткий HR, скептичный техдир. AI задаёт именно те каверзные вопросы, которые чаще всего ставят в тупик — прямо по твоему тексту.",
      num: "03",
      iconBg: '#F5F3FF',
      iconColor: '#8B5CF6',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "РЕЗУЛЬТАТ",
      desc: "Получаешь PDF с разбором: что исправлено в тексте, где ты отвечал уверенно, а где терял аргументацию. Берёшь на реальное выступление как шпаргалку — и уже знаешь, чего ждать.",
      num: "04",
      iconBg: '#F0FDF4',
      iconColor: '#22C55E',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how" style={{ padding: 'clamp(80px, 15vw, 140px) 0', backgroundColor: '#FFFFFF' }}>
      <div className="container-custom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 80 }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            margin: 0,
            whiteSpace: 'nowrap',
          }}>
            От черновика до уверенного выступления
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
              style={{
                borderLeft: '1px solid var(--border-light)',
                paddingLeft: 24,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* UPGRADE 2: Big background number */}
              <div style={{
                position: 'absolute',
                top: -20,
                right: 16,
                fontSize: 120,
                fontFamily: 'var(--font-syne)',
                fontWeight: 900,
                color: 'rgba(249,115,22,0.07)',
                lineHeight: 1,
                pointerEvents: 'none',
                zIndex: 0,
                userSelect: 'none',
              }}>
                {step.num}
              </div>

              {/* Content wrapper with zIndex above background number */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* UPGRADE 2: Icon box */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: step.iconBg,
                  color: step.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  flexShrink: 0,
                }}>
                  {step.icon}
                </div>

                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.1em',
                  marginBottom: 16,
                }}>
                  [ {step.num} ]
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: 20,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: 'var(--text-main)',
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
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── WHO IS IT FOR ─────────────────────────────────────────────────────────────
function WhoIsItFor() {
  const segments = [
    {
      label: 'Студентам',
      kicker: 'ЗАЩИТА / ДОКЛАД',
      desc: 'Защита диплома через неделю, а комиссия задаёт вопросы, которых ты не ждал? Тренируйся с AI-научруком — строгим, но безопасным.',
      scenarios: ['Дипломная защита', 'Дебаты', 'Стажировочное интервью'],
      picsumSeed: 237,
    },
    {
      label: 'Специалистам',
      kicker: 'ИНТЕРВЬЮ / ОНБОРДИНГ',
      desc: 'Технически силён, но на собеседовании теряешься на поведенческих вопросах? AI-рекрутер задаст их первым — у тебя будет время подготовить ответ.',
      scenarios: ['Техническое интервью', 'Оффер-презентация', 'Митинг с командой'],
      picsumSeed: 1062,
    },
    {
      label: 'Фаундерам',
      kicker: 'ПИТЧ / ПЕРЕГОВОРЫ',
      desc: 'Инвестор спросит про unit-экономику именно в тот момент, когда ты забыл цифры. Лучше он спросит на тренировке — а не на Demo Day.',
      scenarios: ['Питч инвестору', 'Demo Day', 'Переговоры о партнёрстве'],
      picsumSeed: 633,
    },
  ];

  return (
    <section style={{ padding: 'clamp(60px, 10vw, 100px) 0', backgroundColor: 'var(--bg-main)' }}>
      <div className="container-custom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 60 }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            margin: 0,
            whiteSpace: 'nowrap',
          }}>
            Кому это подходит
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-main)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {segments.map((seg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-card)',
                overflow: 'hidden',
                borderRadius: 12,
              }}
            >
              {/* UPGRADE 3: Photo area */}
              <div style={{
                width: '100%',
                height: 180,
                overflow: 'hidden',
                borderRadius: '8px 8px 0 0',
                flexShrink: 0,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://picsum.photos/seed/${seg.picsumSeed}/600/280`}
                  alt={seg.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(30%) sepia(20%) brightness(0.95)',
                    display: 'block',
                  }}
                />
              </div>

              {/* Text content with padding */}
              <div style={{ padding: 'clamp(24px, 3vw, 32px)' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.1em',
                  marginBottom: 16,
                }}>
                  {seg.kicker}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: 22,
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: 16,
                }}>
                  {seg.label}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}>
                  {seg.desc}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {seg.scenarios.map((s) => (
                    <div key={s} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text-dim)',
                      letterSpacing: '0.05em',
                    }}>
                      <span style={{ color: 'var(--accent-primary)', fontSize: 10 }}>→</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── WHY NOT CHATGPT ───────────────────────────────────────────────────────────
function WhyNotChatGPT() {
  const comparisons = [
    {
      feature: 'Рабочий процесс',
      peaktalk: 'Структурированный цикл: загрузка → анализ → стресс-тест → PDF-отчёт',
      chatgpt: 'Свободный чат. Нужно самому знать, что и как спросить — и не забыть ничего важного',
    },
    {
      feature: 'Стресс-тест по тексту',
      peaktalk: 'AI атакует именно слабые места твоего конкретного файла — видит весь текст целиком',
      chatgpt: 'Задаёт общие вопросы по теме. Не знает твой текст, если не вставить всё вручную',
    },
    {
      feature: 'Ролевые персонажи',
      peaktalk: 'Инвестор, HR, Техдир, Скептик — каждый с отраслевой логикой и характером',
      chatgpt: 'Нейтральный бот без ролевой глубины. «Притворись инвестором» работает поверхностно',
    },
    {
      feature: 'История и прогресс',
      peaktalk: 'Все сессии сохраняются. Видишь динамику: стал ли ты отвечать лучше за последние недели',
      chatgpt: 'Каждый новый чат — с нуля. Контекст прошлых сессий теряется',
    },
    {
      feature: 'Конфиденциальность',
      peaktalk: 'Только текст. Без камеры, микрофона, биометрии. Твои данные не используются для обучения моделей',
      chatgpt: 'Стандартная политика OpenAI — данные могут использоваться для обучения модели',
    },
    {
      feature: 'Формат результата',
      peaktalk: 'PDF с разбором текста и ответов — берёшь на реальное выступление',
      chatgpt: 'Текст в чате, который нужно копировать руками и самому структурировать',
    },
  ];

  return (
    <section style={{ padding: 'clamp(80px, 12vw, 120px) 0', backgroundColor: '#FFFFFF' }}>
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
            ChatGPT — универсал. PeakTalk — снайпер.
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-main)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border-main)' }}>
          {/* UPGRADE 4: Header row with border on PeakTalk column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Критерий
            </div>
            {/* PeakTalk header with orange border */}
            <div style={{ padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px)', borderLeft: '1px solid var(--border-main)', borderRight: '2px solid #F97316', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: '#FFF7ED', fontWeight: 700 }}>
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
              {/* UPGRADE 4: PeakTalk cell with green checkmark */}
              <div style={{ padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 24px)', borderLeft: '1px solid var(--border-main)', borderRight: '2px solid #F97316', fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-main)', backgroundColor: '#FFF7ED' }}>
                <span style={{ color: '#22C55E', fontWeight: 700, marginRight: 8 }}>✓</span>
                {row.peaktalk}
              </div>
              {/* UPGRADE 4: ChatGPT cell with gray X and dimmed text */}
              <div style={{ padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 24px)', borderLeft: '1px solid var(--border-main)', fontFamily: 'var(--font-inter)', fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                <span style={{ color: '#D1D5DB', marginRight: 8 }}>✕</span>
                {row.chatgpt}
              </div>
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
        border: `1px solid ${accent ? 'var(--accent-primary)' : 'var(--border-light)'}`,
        padding: 'clamp(24px, 4vw, 40px)',
        backgroundColor: accent ? 'rgba(245, 158, 11, 0.02)' : 'var(--bg-surface)',
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
        color: accent ? 'var(--accent-primary)' : 'var(--text-dim)',
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
        color: 'var(--text-main)',
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
    <section id="features" style={{ padding: 'clamp(60px, 10vw, 80px) 0', backgroundColor: 'var(--bg-main)' }}>
      <div className="container-custom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 60 }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            margin: 0,
            whiteSpace: 'nowrap',
          }}>
            Возможности
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-main)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <FeatureCard
            tag="КРИТИЧЕСКИЙ РАЗБОР"
            title="Логические дыры — до аудитории, не после"
            desc="AI читает твой текст глазами скептика. Указывает, где аргумент повисает в воздухе, где слишком много воды, а где переход между идеями рвётся. Получаешь конкретные правки с объяснением — не «перепиши», а «вот почему это не работает и как исправить»."
            accent={true}
            delay={0}
            topVisual={
              <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '70%' }}>
                  <div style={{ height: 6, borderRadius: 4, background: '#E5E7EB', width: '100%' }} />
                  <div style={{ height: 6, borderRadius: 4, background: '#E5E7EB', width: '80%' }} />
                  <div style={{ height: 6, borderRadius: 4, background: '#F97316', width: '60%', boxShadow: '0 0 8px rgba(249,115,22,0.3)' }} />
                  <div style={{ height: 6, borderRadius: 4, background: '#E5E7EB', width: '90%' }} />
                </div>
              </div>
            }
          />
          <FeatureCard
            tag="СИМУЛЯЦИЯ Q&A"
            title="Каверзные вопросы по твоему тексту"
            desc="AI не задаёт случайные вопросы — он атакует именно слабые места твоего конкретного текста. Инвестор спросит про unit-экономику, если ты её не упомянул. HR уточнит пробел в резюме. Техдир докопается до архитектурного решения. Реальные вопросы — безопасная тренировка."
            delay={0.1}
            topVisual={
              <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, border: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(249,115,22,0.08)', border: '2px dashed rgba(249,115,22,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#F97316', boxShadow: '0 0 12px rgba(249,115,22,0.4)' }} />
                </div>
              </div>
            }
          />
          <FeatureCard
            tag="AI-ПЕРСОНАЖИ"
            title="Твоя аудитория до настоящей аудитории"
            desc="Выбери, перед кем выступаешь: придирчивый инвестор серии А, опытный HR tech-компании, научный руководитель или скептичный техдир. Каждый персонаж задаёт вопросы в своём стиле и с учётом своих приоритетов — как в реальной жизни."
            delay={0.2}
            topVisual={
              <div style={{ width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                {['И', 'Т', 'H'].map((initial, idx) => (
                  <div key={idx} style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    border: '2px solid #FFFFFF',
                    background: idx === 0 ? '#FFF7ED' : idx === 1 ? '#F3F4F6' : '#EDE9FE',
                    marginLeft: idx === 0 ? 0 : -16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    zIndex: 3 - idx,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-syne)',
                    fontSize: 20,
                    fontWeight: 600,
                    color: idx === 0 ? '#F97316' : idx === 1 ? '#6B7280' : '#8B5CF6',
                  }}>
                    {initial}
                  </div>
                ))}
              </div>
            }
          />
          <FeatureCard
            tag="ГОТОВЫЙ ПЛАН"
            title="PDF-шпаргалка к каждому выступлению"
            desc="После сессии получаешь документ: исправленный текст, список найденных слабых мест, вопросы, на которые ты отвечал неуверенно, и рекомендации по каждому. Распечатай или открой на телефоне перед самым выходом на сцену."
            delay={0.3}
            topVisual={
              <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, border: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 80,
                  height: 110,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  <div style={{ width: '100%', height: 16, backgroundColor: '#FEE2E2', borderLeft: '2px solid #EF4444' }} />
                  <div style={{ width: '60%', height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, marginTop: 4 }} />
                  <div style={{ width: '80%', height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
                  <div style={{ width: '40%', height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ──────────────────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    {
      quote: "Загрузила текст диплома за три дня до защиты. AI нашёл три логические дыры, которые я не видела месяц. На защите комиссия спросила ровно те вопросы, которые мы разбирали в симуляции. Получила пятёрку.",
      name: "Катя Соколова",
      initials: "КС",
      role: "Студентка 4 курса, ВШЭ",
      // UPGRADE 5
      avatarGradient: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
      avatarColor: '#92400E',
      badge: 'ВШЭ',
    },
    {
      quote: "Я технически сильный, но на интервью терялся при поведенческих вопросах. Прогнал три симуляции с AI-HR — на четвёртый раз почувствовал себя уверенно. Оффер от Яндекса пришёл через две недели.",
      name: "Данила Крылов",
      initials: "ДК",
      role: "Junior Backend Developer",
      avatarGradient: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
      avatarColor: '#1E40AF',
      badge: 'Яндекс offer',
    },
    {
      quote: "Инвестор на Demo Day спросил: «Почему вы?» — я уже отрабатывал этот вопрос с AI-инвестором в PeakTalk. Ответил чётко, без паузы. Привлекли pre-seed раунд через месяц после питча.",
      name: "Максим Дорохов",
      initials: "МД",
      role: "Co-founder edtech-стартапа",
      avatarGradient: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
      avatarColor: '#065F46',
      badge: 'pre-seed round',
    },
  ];

  return (
    <section id="testimonials" style={{ padding: 'clamp(80px, 15vw, 140px) 0', backgroundColor: '#FFFFFF' }}>
      <div className="container-custom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 60 }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            margin: 0,
            whiteSpace: 'nowrap',
          }}>
            Истории
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-main)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                border: '1px solid var(--border-main)',
                padding: 'clamp(24px, 3vw, 32px)',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: 48,
                color: 'var(--accent-primary)',
                lineHeight: 0.7,
                opacity: 0.5,
              }}>&ldquo;</div>
              <p style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 15,
                color: 'var(--text-main)',
                lineHeight: 1.65,
                margin: 0,
                flex: 1,
              }}>
                {t.quote}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* UPGRADE 5: Two-letter gradient avatar */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: t.avatarGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-syne)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.avatarColor,
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  letterSpacing: '0.02em',
                }}>
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{t.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.03em' }}>{t.role}</div>
                  {/* UPGRADE 5: Institution badge */}
                  <div style={{
                    display: 'inline-flex',
                    marginTop: 6,
                    padding: '2px 8px',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid var(--border-light)',
                    borderRadius: 100,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-dim)',
                    letterSpacing: '0.04em',
                  }}>
                    {t.badge}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ───────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "STARTER",
      price: "0",
      badge: null,
      cta: "Попробовать бесплатно",
      // UPGRADE 6: trust text
      trustText: "Без привязки карты",
      features: [
        "3 разбора текста в месяц",
        "1 сессия стресс-интервью",
        "Детектор слабых мест и воды",
        { text: "PDF-отчёты", disabled: true },
        { text: "Дополнительные AI-персонажи", disabled: true },
      ],
    },
    {
      name: "PRO",
      price: "990",
      accent: true,
      badge: "Популярный выбор",
      cta: "Получить PRO",
      trustText: "Отмените в 1 клик · в любой момент",
      features: [
        "Безлимитный разбор любых текстов",
        "Безлимитные сессии стресс-интервью",
        "Детектор слабых мест и воды",
        "PDF-отчёты после каждой сессии",
        "Все AI-персонажи: Инвестор, HR, Техдир",
      ],
    },
    {
      name: "TEAM",
      price: "2490",
      badge: "Для команд и курсов",
      cta: "Подключить команду",
      trustText: "Безопасная оплата картой РФ",
      features: [
        "До 5 пользователей на аккаунте",
        "Всё из тарифа PRO для каждого",
        "Командная статистика и прогресс",
        "Приоритетная поддержка",
        "Единый платёж для всей команды",
      ],
    },
  ];

  return (
    <section id="pricing" style={{ padding: 'clamp(60px, 10vw, 80px) 0 clamp(80px, 15vw, 140px) 0', backgroundColor: 'var(--bg-surface)' }}>
      <div className="container-custom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            margin: 0,
            whiteSpace: 'nowrap',
          }}>
            Тарифы
          </h2>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-main)' }} />
        </div>

        <p style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 15,
          color: 'var(--text-muted)',
          marginBottom: 56,
        }}>
          Начни бесплатно — переходи на PRO, когда готов.
        </p>

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
                marginLeft: i > 0 ? -1 : 0,
                padding: 'clamp(24px, 4vw, 40px)',
                backgroundColor: plan.accent ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                position: 'relative',
                zIndex: plan.accent ? 10 : 1,
              }}>
              {plan.accent && (
                <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 2, background: 'var(--accent-primary)' }} />
              )}
              {plan.badge && (
                <div style={{
                  display: 'inline-flex',
                  padding: '3px 10px',
                  backgroundColor: plan.accent ? 'var(--accent-primary)' : 'var(--bg-surface-alt)',
                  border: plan.accent ? 'none' : '1px solid var(--border-light)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: plan.accent ? '#080807' : 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: plan.accent ? 'var(--accent-primary)' : 'var(--text-dim)', marginBottom: plan.badge ? 8 : 24, marginTop: plan.badge ? 0 : 0 }}>
                {plan.name}
              </div>
              <div style={{ marginBottom: 40 }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontSize: 48, fontWeight: 700 }}>{plan.price}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>₽ / мес</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {plan.features.map((f, j) => {
                  const isDisabled = typeof f === 'object' && f.disabled;
                  const text = typeof f === 'object' ? f.text : f;
                  return (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-main)', paddingBottom: 16 }}>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: isDisabled ? 'var(--text-dim)' : 'var(--text-main)', textDecoration: isDisabled ? 'line-through' : 'none' }}>
                        {text}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 40 }}>
                <a href="/register" className={plan.accent ? "btn-primary" : "btn-secondary"} style={{ width: '100%', justifyContent: 'center' }}>
                  {plan.cta}
                </a>
                {/* UPGRADE 6: Trust micro-copy under CTA */}
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  textAlign: 'center',
                  marginTop: 12,
                  letterSpacing: '0.04em',
                }}>
                  {plan.trustText}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p style={{
          marginTop: 24,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-dim)',
          letterSpacing: '0.05em',
        }}>
          Без привязки карты на Starter. Отмена PRO — в один клик, в любой момент.
        </p>
      </div>
    </section>
  );
}

// ─── CTA BANNER ────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section style={{
      padding: 'clamp(60px, 10vw, 100px) 0',
      borderTop: 'none',
      borderBottom: 'none',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0F0E0D 0%, #1A1208 60%, #261500 100%)',
    }}>
      {/* UPGRADE 6: Orange radial overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 70% 30%, rgba(249,115,22,0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div className="container-custom" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#F97316',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Не откладывай
          </div>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 20,
            textWrap: 'balance',
            maxWidth: 700,
            marginInline: 'auto',
          }}>
            Твоё следующее выступление — уже скоро. Начни готовиться сейчас.
          </h2>
          <p style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 16,
            color: 'rgba(255,255,255,0.6)',
            marginBottom: 40,
            maxWidth: 520,
            marginInline: 'auto',
            lineHeight: 1.6,
          }}>
            Загрузи текст, пройди стресс-тест с AI и узнай, где ты уязвим — прежде чем это выяснит реальная аудитория. Первые три сессии бесплатно.
          </p>
          {/* UPGRADE 6: White button with Framer hover */}
          <motion.a
            href="/register"
            whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F0E0D',
              padding: '16px 36px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-inter)',
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'box-shadow 0.2s ease',
            }}
          >
            Попробовать бесплатно — без карты
          </motion.a>
        </motion.div>
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
          <p style={{ marginTop: 16, fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-muted)' }} suppressHydrationWarning>
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
      <WhoIsItFor />
      <WhyNotChatGPT />
      <Features />
      <Testimonials />
      <Pricing />
      <CTABanner />
      <Footer />
    </main>
  );
}
