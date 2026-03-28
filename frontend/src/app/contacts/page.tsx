"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function ContactCard({
  label,
  email,
  description,
  delay,
}: {
  label: string;
  email: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.a
      href={`mailto:${email}`}
      custom={delay}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        display: "block",
        background: "var(--bg-card)",
        border: "1px solid var(--border-main)",
        borderRadius: "var(--radius-lg)",
        padding: "24px 28px",
        textDecoration: "none",
        cursor: "pointer",
        boxShadow: "var(--shadow-card)",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)";
        e.currentTarget.style.boxShadow =
          "0 4px 16px rgba(249,115,22,0.08), 0 0 0 1px rgba(249,115,22,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-main)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
          marginBottom: 10,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-syne)",
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: "-0.02em",
          color: "var(--accent-primary)",
          marginBottom: 8,
        }}
      >
        {email}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--text-muted)",
        }}
      >
        {description}
      </div>
    </motion.a>
  );
}

export default function ContactsPage() {
  return (
    <main
      style={{
        background: "var(--bg-main)",
        minHeight: "100vh",
        paddingTop: 120,
        paddingBottom: 80,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          marginInline: "auto",
          paddingInline: 24,
        }}
      >
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 48,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-main)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-dim)")
            }
          >
            &larr; Назад
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--accent-primary)",
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            PeakTalk / Контакты
          </div>
          <h1
            style={{
              fontFamily: "var(--font-syne)",
              fontWeight: 800,
              fontSize: 36,
              letterSpacing: "-0.03em",
              color: "var(--text-main)",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Контакты
          </h1>
        </motion.div>

        {/* Lead */}
        <motion.p
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--text-muted)",
            marginTop: 20,
            marginBottom: 0,
          }}
        >
          Мы отвечаем в течение 24 часов по рабочим дням. Если вы столкнулись с
          проблемой или хотите предложить идею — напишите нам.
        </motion.p>

        {/* Divider */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            height: 1,
            background: "var(--border-main)",
            marginTop: 40,
            marginBottom: 40,
          }}
        />

        {/* Contact cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ContactCard
            label="Поддержка и общие вопросы"
            email="support@peaktalk.ru"
            description="Технические проблемы, вопросы по аккаунту, запросы на удаление данных, обратная связь о работе сервиса."
            delay={3}
          />
          <ContactCard
            label="Партнёрство и сотрудничество"
            email="partner@peaktalk.ru"
            description="Предложения по интеграции, совместным проектам, медиапартнёрству и b2b-сотрудничеству."
            delay={4}
          />
        </div>

        {/* Response time note */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 32,
            padding: "14px 18px",
            background: "var(--bg-surface-alt)",
            border: "1px solid var(--border-main)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--color-success)",
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.04em",
              color: "var(--text-dim)",
              margin: 0,
            }}
          >
            Среднее время ответа — до 24 часов в рабочие дни (Пн–Пт)
          </p>
        </motion.div>

        {/* Requisites block */}
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{ marginTop: 56 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: "-0.02em",
                color: "var(--text-main)",
                whiteSpace: "nowrap",
                margin: 0,
              }}
            >
              Реквизиты
            </h2>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "var(--border-main)",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 1,
              background: "var(--border-main)",
              border: "1px solid var(--border-main)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {[
              ["Правовая форма", "Самозанятый (НПД)"],
              ["ИНН", "583414998055"],
              ["Сервис", "PeakTalk"],
              ["Сайт", "peaktalk.ru"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: "var(--bg-card)",
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-dim)",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-main)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid var(--border-main)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.05em",
              color: "var(--text-placeholder)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            PeakTalk &mdash; peaktalk.ru &mdash; ИНН&nbsp;583414998055
          </p>
        </motion.div>
      </div>
    </main>
  );
}
