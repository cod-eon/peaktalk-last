"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
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
          margin: 0,
          lineHeight: 1.3,
          minWidth: 0,
        }}
      >
        {title}
      </h2>
      <div
        className="hidden sm:block"
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
  const router = useRouter();

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
          <button
            onClick={() => router.back()}
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
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-main)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-dim)")
            }
          >
            &larr; Назад
          </button>
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
              fontSize: "clamp(24px, 6vw, 36px)",
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
            Утверждена: 28 марта 2026 г. &mdash; Федеральный закон № 152-ФЗ «О персональных данных»
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
          27.07.2006 № 152-ФЗ «О персональных данных» (далее — 152-ФЗ),
          Постановления Правительства РФ от 01.11.2012 № 1119 «Об утверждении
          требований к защите персональных данных», а также иных применимых
          нормативных актов. Политика определяет порядок и условия обработки
          персональных данных пользователей сервиса PeakTalk (peaktalk.ru)
          и устанавливает меры по обеспечению их безопасности.
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
          <SectionHeading title="2. Принципы обработки персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            В соответствии со ст. 5 152-ФЗ Оператор при обработке персональных
            данных руководствуется следующими принципами:
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
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Законность и справедливость</span>{" "}
              — обработка осуществляется только при наличии правового основания;
              пользователи не вводятся в заблуждение.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Целевой характер</span>{" "}
              — данные обрабатываются только для конкретных, заранее определённых
              и правомерных целей; не допускается обработка в целях, несовместимых
              с заявленными.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Минимизация данных</span>{" "}
              — Оператор собирает только те данные, которые необходимы для
              достижения указанных целей.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Точность</span>{" "}
              — принимаются меры по обеспечению достоверности и актуальности
              данных; неточные данные уточняются или удаляются.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ограничение хранения</span>{" "}
              — данные хранятся не дольше, чем требуется для целей их обработки.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Целостность и конфиденциальность</span>{" "}
              — применяются технические и организационные меры, исключающие
              несанкционированный доступ или утрату данных.
            </li>
          </ul>
        </motion.div>

        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="3. Перечень обрабатываемых персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Субъекты персональных данных — физические лица (пользователи сервиса).
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
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Адрес электронной почты (email)</span>{" "}
              — обязателен для регистрации, аутентификации и направления
              уведомлений.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Имя пользователя</span>{" "}
              — опционально, предоставляется пользователем самостоятельно при
              заполнении профиля.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>IP-адрес</span>{" "}
              — фиксируется автоматически при каждом запросе в целях обеспечения
              безопасности.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Пользовательские документы</span>{" "}
              — текстовые материалы (резюме, тексты докладов, сценарии),
              добровольно загружаемые пользователем для проведения симуляций.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>История сессий</span>{" "}
              — тексты вопросов, ответов и оценок в рамках тренировочных
              AI-симуляций; сохраняются для отображения прогресса пользователя.
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
            Специальные категории персональных данных, указанные в ст. 10 152-ФЗ
            (биометрия, здоровье, расовая принадлежность, политические взгляды и
            иные), Оператором не обрабатываются.
          </p>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="4. Цели обработки и правовые основания" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Оператор обрабатывает персональные данные исключительно в следующих
            целях при наличии соответствующего правового основания:
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
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>
                Регистрация и предоставление доступа к Сервису
              </span>{" "}
              — основание: исполнение договора (ст. 6 ч. 1 п. 5 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>
                Проведение AI-симуляций
              </span>{" "}
              — обработка текстов пользователя для формирования обратной связи —
              основание: исполнение договора (ст. 6 ч. 1 п. 5 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>
                Хранение и отображение истории сессий
              </span>{" "}
              — для аналитики прогресса — основание: согласие
              пользователя (ст. 6 ч. 1 п. 1, ст. 9 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>
                Улучшение качества Сервиса
              </span>{" "}
              — в обезличенном виде — основание: согласие пользователя
              (ст. 6 ч. 1 п. 1 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>
                Направление технических уведомлений
              </span>{" "}
              (изменения Сервиса, обновления Политики) — основание: исполнение
              договора (ст. 6 ч. 1 п. 5 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>
                Обеспечение безопасности
              </span>{" "}
              — защита от несанкционированного доступа — основание: законные
              интересы оператора (ст. 6 ч. 1 п. 5 152-ФЗ).
            </li>
          </ul>
        </motion.div>

        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="5. Способы обработки персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            В соответствии со ст. 3 152-ФЗ обработка персональных данных
            включает следующие действия: сбор, запись, систематизацию,
            накопление, хранение, уточнение (обновление, изменение),
            извлечение, использование, передачу (в случаях, предусмотренных
            настоящей Политикой), блокирование и уничтожение.
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
            Все операции осуществляются исключительно автоматизированным
            способом с использованием программно-аппаратных средств.
            Неавтоматизированная обработка (бумажные носители) не применяется.
          </p>
        </motion.div>

        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="6. Условия передачи третьим лицам" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Передача персональных данных третьим лицам допускается только в
            следующих случаях, предусмотренных ст. 6 и ст. 18.1 152-ФЗ:
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
              С предварительного согласия субъекта персональных данных
              (ст. 6 ч. 1 п. 1, ст. 9 152-ФЗ).
            </li>
            <li>
              По требованию уполномоченных государственных органов РФ в
              случаях, прямо предусмотренных законодательством.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Google LLC (Gemini API)</span>{" "}
              — тексты документов и сообщений передаются для генерации
              AI-ответов на основании договора-поручения обработки данных.
              Провайдер не использует переданные данные для обучения моделей.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Supabase Inc.</span>{" "}
              — хранение загружаемых пользователем файлов на основании
              договора-поручения обработки данных.
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
            Продажа персональных данных, их передача рекламодателям или иное
            коммерческое использование в интересах третьих лиц не
            осуществляется.
          </p>
        </motion.div>

        <motion.div
          custom={8}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="7. Трансграничная передача данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            В соответствии со ст. 12 152-ФЗ Оператор осуществляет трансграничную
            передачу персональных данных следующим получателям:
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
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Google LLC (США)</span>{" "}
              — для обработки текстовых запросов через Gemini API. Google LLC
              обеспечивает защиту персональных данных в соответствии со
              стандартами, которые Оператор признаёт достаточными; передача
              осуществляется с согласия пользователя, полученного при
              регистрации. Данные передаются по зашифрованному каналу
              (TLS 1.2+) и не используются для обучения моделей.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Supabase Inc. (США)</span>{" "}
              — для хранения загружаемых пользователем файлов. Передача
              осуществляется с согласия пользователя на основании договора
              о поручении обработки данных, включающего требования по защите
              персональных данных.
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
            Первичная запись персональных данных граждан РФ осуществляется
            на серверах, расположенных на территории Российской Федерации,
            в соответствии с ч. 5 ст. 18 152-ФЗ.
          </p>
        </motion.div>

        <motion.div
          custom={9}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="8. Меры по обеспечению безопасности" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            В соответствии со ст. 19 152-ФЗ и требованиями Постановления
            Правительства РФ № 1119 Оператор применяет следующие меры защиты
            персональных данных:
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
            <li>Шифрование данных при передаче — протокол TLS 1.2 и выше.</li>
            <li>Хеширование паролей пользователей — алгоритм bcrypt.</li>
            <li>
              Разграничение прав доступа к базам данных по принципу
              минимальных привилегий (least privilege).
            </li>
            <li>
              Регулярный аудит безопасности серверной инфраструктуры и
              устранение выявленных уязвимостей.
            </li>
            <li>
              Хранение персональных данных на серверах, расположенных на
              территории РФ (ч. 5 ст. 18 152-ФЗ).
            </li>
            <li>
              Ведение журналов доступа к персональным данным для обнаружения
              несанкционированных действий.
            </li>
          </ul>
        </motion.div>

        <motion.div
          custom={10}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="9. Права субъекта персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            В соответствии со статьями 14–17 Федерального закона № 152-ФЗ
            субъект персональных данных вправе:
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
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ст. 14 — Право на доступ:</span>{" "}
              получить подтверждение факта обработки, перечень обрабатываемых
              данных, цели и способы обработки, сведения о третьих лицах,
              которым передавались данные.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ст. 15 — Право на уточнение:</span>{" "}
              потребовать уточнения неполных, устаревших или неточных
              персональных данных, а также их блокирования до устранения
              нарушений.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ст. 17 — Право на удаление:</span>{" "}
              потребовать уничтожения персональных данных, если они обрабатываются
              незаконно, цель обработки достигнута или субъект отзывает согласие.
              Срок исполнения — 30 дней.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ст. 9 — Отзыв согласия:</span>{" "}
              в любой момент отозвать ранее данное согласие на обработку.
              Отзыв не влияет на законность обработки, осуществлённой до его
              получения. После отзыва Оператор прекращает обработку в течение
              30 дней и уничтожает данные, если отсутствуют иные правовые
              основания для их хранения.
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Переносимость:</span>{" "}
              запросить выгрузку персональных данных в машиночитаемом формате
              (JSON).
            </li>
            <li>
              <span style={{ color: "var(--text-main)", fontWeight: 500 }}>Ст. 17 — Право на обжалование:</span>{" "}
              обжаловать действия или бездействие Оператора в Роскомнадзоре
              (rkn.gov.ru) или в судебном порядке.
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
            Для реализации указанных прав направьте запрос на:{" "}
            <a
              href="mailto:support@peaktalk.ru"
              style={{ color: "var(--accent-primary)", textDecoration: "none" }}
            >
              support@peaktalk.ru
            </a>
            . Запрос должен содержать: ФИО или email, указанный при
            регистрации, суть требования. Срок ответа — 30 календарных дней
            с даты получения запроса (ст. 20 152-ФЗ).
          </p>
        </motion.div>

        <motion.div
          custom={11}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="10. Заключительные положения" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-muted)", margin: 0 }}>
            Настоящая Политика вступает в силу с даты её утверждения и действует
            бессрочно. Оператор вправе вносить изменения в Политику; новая
            редакция публикуется по адресу{" "}
            <span style={{ color: "var(--text-main)" }}>
              peaktalk.ru/personal-data
            </span>{" "}
            и вступает в силу с даты публикации, если иное не указано в
            уведомлении. При существенных изменениях пользователи уведомляются
            по email не позднее чем за 7 дней.
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
            Дата утверждения настоящей редакции: 28 марта 2026 г.
          </p>
        </motion.div>

        <motion.div
          custom={12}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="11. Контактные данные оператора" />
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
            Срок ответа на обращения — 30 календарных дней (ст. 20 152-ФЗ).
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
          custom={13}
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
            &mdash; Редакция 2.0 &mdash; Вступает в силу с 28.03.2026
          </p>
        </motion.div>
      </div>
    </main>
  );
}
