"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
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
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "0px",
        padding: "24px 28px",
        textDecoration: "none",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(37,99,235,0.35)";
        e.currentTarget.style.boxShadow =
          "0 4px 16px rgba(37,99,235,0.08), 0 0 0 1px rgba(37,99,235,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 10,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: "#737373",
          marginBottom: 10,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: "-0.02em",
          color: "#2563EB",
          marginBottom: 8,
        }}
      >
        {email}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "#737373",
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
        background: "#fff",
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
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#737373",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 48,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#171717")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "#737373")
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
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#2563EB",
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            PeakTalk / Контакты
          </div>
          <h1
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: 36,
              letterSpacing: "-0.03em",
              color: "#171717",
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
            color: "#737373",
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
            background: "#e5e7eb",
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
            background: "#f5f5f5",
            border: "1px solid #e5e7eb",
            borderRadius: "0px",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#16a34a",
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              letterSpacing: "0.04em",
              color: "#737373",
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
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: "-0.02em",
                color: "#171717",
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
                background: "#e5e7eb",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 1,
              background: "#e5e7eb",
              border: "1px solid #e5e7eb",
              borderRadius: "0px",
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
                  background: "#fff",
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#737373",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#171717",
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
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.05em",
              color: "#a3a3a3",
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
