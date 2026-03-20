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
      paddingBottom: 'clamp(60px, 10vh, 160px)',
      overflow: 'hidden',
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
              { icon: '🔒', label: 'данные по 152-ФЗ' },
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
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.10)',
            position: 'relative',
          }}
        >
          <div style={{ height: 48, borderBottom: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--border-light)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--border-light)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--border-light)' }} />
            <div style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-dim)',
              letterSpacing: '0.05em',
            }}>
              peaktalk / simulation / pitch_investor.md
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'clamp(16px, 4vw, 32px)', fontFamily: 'var(--font-mono)', fontSize: 'clamp(11px, 2.5vw, 13px)', color: 'var(--text-muted)', lineHeight: 1.8, position: 'relative' }}>
              <div><span style={{ color: 'var(--accent-primary)' }}>[00:00]</span> Здравствуйте, сегодня я хочу представить вам наш стартап.</div>
              <div style={{ marginTop: 12 }}><span style={{ color: 'var(--accent-primary)' }}>[00:15]</span> Мы решаем острую проблему рынка... <span style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', padding: '0 4px', borderRadius: 2 }}>как бы так сказать, довольно сложную</span> <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>(⚠ Вода / Неуверенность)</span></div>
              <div style={{ marginTop: 12 }}><span style={{ color: 'var(--accent-primary)' }}>[00:42]</span> Наш TAM составляет 2 миллиарда долларов.</div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4" style={{
                marginTop: 'clamp(24px, 4vw, 32px)',
                padding: 'clamp(12px, 3vw, 16px)',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderLeft: '2px solid var(--accent-primary)',
                fontFamily: 'var(--font-inter)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', border: '1px solid var(--border-light)' }}>
                  <Image src="/investor_avatar.png" alt="Investor Avatar" fill sizes="40px" className="object-cover" />
                </div>
                <div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>AI-Инвестор:</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>&quot;TAM 2 млрд — это красиво. Но вы не объяснили стратегию Go-to-Market. Кто ваш первый платящий сегмент и почему именно он? Рекомендую добавить это сразу после объёма рынка.&quot;</div>
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
      desc: "Вставь текст или загрузи файл — диплом, питч-дек, план собеседования. Ничего не нужно форматировать заранее: AI сам разберётся со структурой."
    },
    {
      title: "АНАЛИЗ",
      desc: "AI читает твой текст целиком и находит логические дыры, «воду», слабые аргументы и неуверенные формулировки. Получаешь конкретные правки — не «улучши здесь», а «вот почему это не работает и как исправить»."
    },
    {
      title: "ИНТЕРВЬЮ",
      desc: "Выбираешь персонажа: придирчивый инвестор, жёсткий HR, скептичный техдир. AI задаёт именно те каверзные вопросы, которые чаще всего ставят в тупик — прямо по твоему тексту."
    },
    {
      title: "РЕЗУЛЬТАТ",
      desc: "Получаешь PDF с разбором: что исправлено в тексте, где ты отвечал уверенно, а где терял аргументацию. Берёшь на реальное выступление как шпаргалку — и уже знаешь, чего ждать."
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
              style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: 24 }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--accent-primary)',
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
    },
    {
      label: 'Специалистам',
      kicker: 'ИНТЕРВЬЮ / ОНБОРДИНГ',
      desc: 'Технически силён, но на собеседовании теряешься на поведенческих вопросах? AI-рекрутер задаст их первым — у тебя будет время подготовить ответ.',
      scenarios: ['Техническое интервью', 'Оффер-презентация', 'Митинг с командой'],
    },
    {
      label: 'Фаундерам',
      kicker: 'ПИТЧ / ПЕРЕГОВОРЫ',
      desc: 'Инвестор спросит про unit-экономику именно в тот момент, когда ты забыл цифры. Лучше он спросит на тренировке — а не на Demo Day.',
      scenarios: ['Питч инвестору', 'Demo Day', 'Переговоры о партнёрстве'],
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
                padding: 'clamp(24px, 3vw, 32px)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
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
      peaktalk: 'Только текст. Без камеры, микрофона, биометрии. Соответствие 152-ФЗ',
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
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--border-main)' }}>
            <div style={{ padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Критерий
            </div>
            <div style={{ padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px)', borderLeft: '1px solid var(--border-main)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: '#FFF7ED' }}>
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
              <div style={{ padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 24px)', borderLeft: '1px solid var(--border-main)', fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--text-main)', backgroundColor: '#FFF7ED' }}>
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
      role: "Студентка 4 курса, ВШЭ",
    },
    {
      quote: "Я технически сильный, но на интервью терялся при поведенческих вопросах. Прогнал три симуляции с AI-HR — на четвёртый раз почувствовал себя уверенно. Оффер от Яндекса пришёл через две недели.",
      name: "Данила Крылов",
      role: "Junior Backend Developer",
    },
    {
      quote: "Инвестор на Demo Day спросил: «Почему вы?» — я уже отрабатывал этот вопрос с AI-инвестором в PeakTalk. Ответил чётко, без паузы. Привлекли pre-seed раунд через месяц после питча.",
      name: "Максим Дорохов",
      role: "Co-founder edtech-стартапа",
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
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-syne)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{t.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.03em' }}>{t.role}</div>
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
      borderTop: '1px solid var(--border-main)',
      borderBottom: '1px solid var(--border-main)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)',
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
            color: 'var(--accent-primary)',
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
            color: 'var(--text-main)',
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
            color: 'var(--text-muted)',
            marginBottom: 40,
            maxWidth: 520,
            marginInline: 'auto',
            lineHeight: 1.6,
          }}>
            Загрузи текст, пройди стресс-тест с AI и узнай, где ты уязвим — прежде чем это выяснит реальная аудитория. Первые три сессии бесплатно.
          </p>
          <a href="/register" className="btn-primary" style={{ padding: '16px 36px', fontSize: 13 }}>
            Попробовать бесплатно — без карты
          </a>
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
