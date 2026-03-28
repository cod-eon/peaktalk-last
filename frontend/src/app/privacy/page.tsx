"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

function SectionHeading({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 20,
        marginTop: 48,
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
        {title}
      </h2>
      <div
        style={{
          flex: 1,
          height: 1,
          background: "var(--border-main)",
        }}
      />
    </div>
  );
}

export default function PrivacyPage() {
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
            PeakTalk / Документы
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
            Политика конфиденциальности
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-dim)",
              marginTop: 12,
              letterSpacing: "0.04em",
            }}
          >
            Дата вступления в силу: 01 января 2025 г.
          </p>
        </motion.div>

        {/* Intro */}
        <motion.p
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--text-muted)",
            marginTop: 32,
            marginBottom: 0,
          }}
        >
          Настоящая Политика конфиденциальности описывает, каким образом сервис
          PeakTalk (далее — «Сервис», «мы»), находящийся по адресу{" "}
          <span style={{ color: "var(--text-main)" }}>peaktalk.ru</span>,
          собирает, использует и защищает персональные данные пользователей.
          Оператором является физическое лицо, применяющее специальный налоговый
          режим «Налог на профессиональный доход» (самозанятый),{" "}
          <span style={{ color: "var(--text-main)" }}>ИНН&nbsp;583414998055</span>.
        </motion.p>

        {/* Sections */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="1. Какие данные мы собираем" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            При регистрации и использовании Сервиса мы можем собирать следующие
            данные:
          </p>
          <ul
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "var(--text-muted)",
              paddingLeft: 20,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <li>Адрес электронной почты (email) — обязательно при регистрации.</li>
            <li>Имя или отображаемое имя — опционально, при заполнении профиля.</li>
            <li>
              Загружаемые вами документы (тексты докладов, резюме, презентации) —
              для проведения AI-симуляций.
            </li>
            <li>История сессий и ответов — сохраняется для аналитики и улучшения качества обратной связи.</li>
            <li>IP-адрес и технические данные браузера — в целях безопасности и отладки.</li>
          </ul>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-muted)",
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            Мы не собираем биометрические данные, аудио- или видеозаписи.
          </p>
        </motion.div>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="2. Цели обработки данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Ваши данные используются исключительно для:
          </p>
          <ul
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "var(--text-muted)",
              paddingLeft: 20,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <li>Предоставления доступа к Сервису и его функциям.</li>
            <li>Проведения AI-симуляций на основе загруженных материалов.</li>
            <li>Хранения истории сессий для отображения персонализированной аналитики.</li>
            <li>Улучшения качества алгоритмов и пользовательского опыта.</li>
            <li>Связи с вами по вопросам работы Сервиса (технические уведомления).</li>
          </ul>
        </motion.div>

        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="3. Хранение данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Все данные хранятся на серверах, расположенных на территории
            Российской Федерации, в соответствии с требованиями Федерального
            закона от 27.07.2006 № 152-ФЗ «О персональных данных».
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-muted)",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Срок хранения — до момента удаления вашего аккаунта. После удаления
            аккаунта данные уничтожаются в течение 30 календарных дней.
            Загруженные документы могут быть удалены вами в любой момент через
            личный кабинет.
          </p>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="4. Передача третьим лицам" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Мы не продаём, не передаём и не раскрываем ваши персональные данные
            третьим лицам, за исключением следующего случая:
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-muted)",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <span style={{ color: "var(--text-main)", fontWeight: 500 }}>
              Gemini API (Google LLC):
            </span>{" "}
            Тексты ваших документов передаются в API Gemini для проведения
            AI-анализа в режиме реального времени. Согласно политике Google,
            переданные данные не сохраняются провайдером для обучения моделей
            при использовании API-доступа. Передача осуществляется по
            зашифрованному каналу (HTTPS/TLS).
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-muted)",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Также данные могут быть раскрыты по требованию уполномоченных
            государственных органов РФ в случаях, предусмотренных
            действующим законодательством.
          </p>
        </motion.div>

        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="5. Защита данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Для защиты ваших данных мы применяем технические и организационные
            меры: шифрование данных при передаче (TLS 1.2+), хеширование паролей
            (bcrypt), разграничение прав доступа к базе данных, регулярные
            проверки безопасности инфраструктуры.
          </p>
        </motion.div>

        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="6. Права пользователя" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            В соответствии с 152-ФЗ вы вправе:
          </p>
          <ul
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "var(--text-muted)",
              paddingLeft: 20,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <li>Запросить информацию о том, какие данные о вас хранятся.</li>
            <li>Потребовать исправления неточных данных.</li>
            <li>Потребовать удаления ваших данных (право на забвение).</li>
            <li>Отозвать согласие на обработку персональных данных.</li>
          </ul>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-muted)",
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            Для реализации любого из указанных прав направьте запрос на адрес{" "}
            <a
              href="mailto:support@peaktalk.ru"
              style={{ color: "var(--accent-primary)", textDecoration: "none" }}
            >
              support@peaktalk.ru
            </a>
            . Мы обработаем обращение в течение 10 рабочих дней.
          </p>
        </motion.div>

        <motion.div
          custom={8}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="7. Cookies" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Сервис использует cookie-файлы для поддержания сессии
            аутентификации и корректной работы интерфейса. Используются
            исключительно необходимые (essential) cookie. Аналитические и
            маркетинговые cookie не применяются.
          </p>
        </motion.div>

        <motion.div
          custom={9}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="8. Изменения политики" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Мы оставляем за собой право вносить изменения в настоящую Политику.
            При существенных изменениях мы уведомим вас по email или через
            интерфейс Сервиса. Продолжение использования Сервиса после
            публикации обновлённой Политики означает ваше согласие с
            изменениями.
          </p>
        </motion.div>

        <motion.div
          custom={10}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="9. Контакты" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            По всем вопросам, связанным с обработкой персональных данных,
            обращайтесь:{" "}
            <a
              href="mailto:support@peaktalk.ru"
              style={{ color: "var(--accent-primary)", textDecoration: "none" }}
            >
              support@peaktalk.ru
            </a>
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "var(--text-muted)",
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            Оператор: Самозанятый, ИНН&nbsp;583414998055, сервис PeakTalk
            (peaktalk.ru).
          </p>
        </motion.div>

        {/* Footer note */}
        <motion.div
          custom={11}
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
            &mdash; Версия от 01.01.2025
          </p>
        </motion.div>
      </div>
    </main>
  );
}
