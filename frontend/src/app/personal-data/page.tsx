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

export default function PersonalDataPage() {
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
            Политика обработки персональных данных
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
            В соответствии с Федеральным законом № 152-ФЗ «О персональных данных»
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
          Настоящая Политика обработки персональных данных (далее — «Политика»)
          разработана в соответствии с требованиями Федерального закона от
          27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок
          обработки персональных данных пользователей сервиса PeakTalk.
        </motion.p>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="1. Оператор персональных данных" />
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-main)",
              borderRadius: "var(--radius-md)",
              padding: "20px 24px",
              display: "grid",
              gap: 10,
            }}
          >
            {[
              ["Статус", "Самозанятый (НПД)"],
              ["ИНН", "583414998055"],
              ["Сервис", "PeakTalk (peaktalk.ru)"],
              ["Контакт", "support@peaktalk.ru"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-dim)",
                    minWidth: 80,
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--text-main)",
                    fontWeight: 500,
                  }}
                >
                  {label === "Контакт" ? (
                    <a
                      href="mailto:support@peaktalk.ru"
                      style={{
                        color: "var(--accent-primary)",
                        textDecoration: "none",
                      }}
                    >
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="2. Правовое основание обработки" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Обработка персональных данных осуществляется на основании:
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
            <li>
              Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».
            </li>
            <li>
              Согласия субъекта персональных данных (ст. 9 152-ФЗ), выражаемого
              при регистрации в Сервисе.
            </li>
            <li>
              Необходимости исполнения договора об оказании услуг, стороной
              которого является субъект персональных данных.
            </li>
          </ul>
        </motion.div>

        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="3. Цели обработки" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Оператор обрабатывает персональные данные в следующих целях:
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
            <li>Предоставление пользователям доступа к функциям Сервиса.</li>
            <li>
              Проведение AI-симуляций и анализа документов с целью формирования
              персонализированной обратной связи.
            </li>
            <li>Ведение статистики и улучшение качества Сервиса.</li>
            <li>Обеспечение безопасности учётных записей пользователей.</li>
            <li>
              Направление технических уведомлений, связанных с работой Сервиса.
            </li>
          </ul>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="4. Перечень обрабатываемых персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Оператор обрабатывает следующие категории персональных данных:
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
            <li>
              Фамилия, имя, отчество (ФИО) — опционально, при заполнении профиля.
            </li>
            <li>
              Адрес электронной почты (email) — обязателен для регистрации и
              аутентификации.
            </li>
            <li>IP-адрес — фиксируется автоматически в целях безопасности.</li>
            <li>
              Пользовательские документы — тексты, загружаемые пользователем для
              проведения симуляций.
            </li>
            <li>
              История сессий — тексты вопросов, ответов и оценок в рамках
              тренировочных симуляций.
            </li>
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
            Специальные категории персональных данных (биометрия, здоровье,
            политические взгляды и т.д.) Оператором не обрабатываются.
          </p>
        </motion.div>

        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="5. Способы обработки персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Обработка персональных данных включает: сбор, запись, систематизацию,
            накопление, хранение, уточнение (обновление, изменение), использование,
            передачу (в случаях, предусмотренных настоящей Политикой), блокирование
            и уничтожение.
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
            Обработка осуществляется с использованием средств автоматизации.
            Неавтоматизированная обработка не применяется.
          </p>
        </motion.div>

        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="6. Условия передачи персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Передача персональных данных третьим лицам допускается только:
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
            <li>
              С согласия субъекта персональных данных.
            </li>
            <li>
              По требованию уполномоченных государственных органов в случаях,
              предусмотренных законодательством РФ.
            </li>
            <li>
              Провайдеру Gemini API (Google LLC) — исключительно для обработки
              запросов AI-анализа в режиме реального времени, без сохранения
              данных провайдером.
            </li>
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
            Передача персональных данных в целях коммерческой выгоды не
            осуществляется.
          </p>
        </motion.div>

        <motion.div
          custom={8}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="7. Защита персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Оператор принимает необходимые правовые, организационные и технические
            меры для защиты персональных данных от несанкционированного доступа,
            изменения, раскрытия или уничтожения. В том числе:
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
            <li>Шифрование данных при передаче (протокол TLS 1.2 и выше).</li>
            <li>Хеширование паролей пользователей (алгоритм bcrypt).</li>
            <li>Ограниченный доступ к базе данных по принципу минимальных привилегий.</li>
            <li>Регулярный аудит безопасности серверной инфраструктуры.</li>
            <li>Хранение данных на серверах, расположенных на территории РФ.</li>
          </ul>
        </motion.div>

        <motion.div
          custom={9}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="8. Права субъекта персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            В соответствии со статьями 14–17 Федерального закона № 152-ФЗ субъект
            персональных данных вправе:
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
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ст. 14.</span>{" "}
              Получить подтверждение факта обработки и доступ к своим персональным данным.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ст. 15.</span>{" "}
              Потребовать уточнения, блокирования или уничтожения неполных,
              устаревших или незаконно полученных данных.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ст. 16.</span>{" "}
              Потребовать прекращения обработки персональных данных в случае
              нарушения требований закона.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ст. 17.</span>{" "}
              Обжаловать действия или бездействие Оператора в уполномоченном органе
              (Роскомнадзор) или в судебном порядке.
            </li>
            <li>
              Отозвать ранее данное согласие на обработку персональных данных.
            </li>
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
            Для реализации указанных прав направьте письменный запрос на адрес{" "}
            <a
              href="mailto:support@peaktalk.ru"
              style={{ color: "var(--accent-primary)", textDecoration: "none" }}
            >
              support@peaktalk.ru
            </a>
            . Срок ответа — 10 рабочих дней.
          </p>
        </motion.div>

        <motion.div
          custom={10}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="9. Срок действия политики" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Настоящая Политика действует бессрочно. Оператор вправе вносить
            изменения в Политику по мере необходимости. Актуальная версия
            Политики всегда доступна по адресу{" "}
            <span style={{ color: "var(--text-main)" }}>
              peaktalk.ru/personal-data
            </span>
            . Дата последнего обновления указана в заголовке документа.
          </p>
        </motion.div>

        <motion.div
          custom={11}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="10. Контактные данные оператора" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Оператор: Самозанятый, ИНН&nbsp;583414998055, сервис PeakTalk
            (peaktalk.ru).
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
            Электронная почта:{" "}
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
            Надзорный орган: Федеральная служба по надзору в сфере связи,
            информационных технологий и массовых коммуникаций (Роскомнадзор) —
            rkn.gov.ru.
          </p>
        </motion.div>

        {/* Footer note */}
        <motion.div
          custom={12}
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
            &mdash; Редакция 1.0 &mdash; Вступает в силу с 01.01.2025
          </p>
        </motion.div>
      </div>
    </main>
  );
}
