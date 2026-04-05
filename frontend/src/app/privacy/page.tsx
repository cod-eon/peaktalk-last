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
        className="font-inter"
        style={{
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: "-0.02em",
          color: "#171717",
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
          background: "#e5e7eb",
        }}
      />
    </div>
  );
}

export default function PrivacyPage() {
  const router = useRouter();

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
          <button
            onClick={() => router.back()}
            className="font-mono"
            style={{
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
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#171717")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "#737373")
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
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#E8600A",
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            PeakTalk / Документы
          </div>
          <h1
            className="font-inter"
            style={{
              fontWeight: 800,
              fontSize: "clamp(26px, 6vw, 36px)",
              letterSpacing: "-0.03em",
              color: "#171717",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Политика конфиденциальности
          </h1>
          <p
            className="font-mono"
            style={{
              fontSize: 12,
              color: "#737373",
              marginTop: 12,
              letterSpacing: "0.04em",
            }}
          >
            Дата вступления в силу: 28 марта 2026 г.
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
            color: "#737373",
            marginTop: 32,
            marginBottom: 0,
          }}
        >
          Настоящая Политика конфиденциальности (далее — «Политика») описывает,
          каким образом сервис PeakTalk (далее — «Сервис», «мы»), расположенный
          по адресу{" "}
          <span style={{ color: "#171717" }}>peaktalk.ru</span>,
          собирает, использует, хранит и защищает персональные данные
          пользователей. Документ разработан в соответствии с требованиями
          Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных».
          Оператором является физическое лицо, применяющее специальный налоговый
          режим «Налог на профессиональный доход» (самозанятый),{" "}
          <span style={{ color: "#171717" }}>ИНН&nbsp;583414998055</span>.
          Используя Сервис, вы подтверждаете, что ознакомились с настоящей
          Политикой и согласны с порядком обработки ваших данных.
        </motion.p>

        {/* Sections */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="1. Оператор персональных данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            Оператором персональных данных является физическое лицо, применяющее
            специальный налоговый режим «Налог на профессиональный доход»
            (самозанятый), ИНН&nbsp;583414998055, управляющее сервисом PeakTalk
            (peaktalk.ru). Оператор самостоятельно организует обработку
            персональных данных и несёт ответственность за её соответствие
            требованиям Федерального закона от 27.07.2006 № 152-ФЗ
            «О персональных данных».
          </p>
        </motion.div>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="2. Какие данные мы собираем" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            При регистрации и использовании Сервиса мы собираем следующие данные:
          </p>
          <ul
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "#737373",
              paddingLeft: 20,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Email-адрес</span>{" "}
              — обязателен при регистрации, используется для аутентификации и
              технических уведомлений.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Имя</span>{" "}
              — опционально, при самостоятельном заполнении профиля.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Загружаемые документы</span>{" "}
              (тексты докладов, резюме, сценарии презентаций) — загружаются
              пользователем добровольно для проведения AI-симуляций.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>История сессий</span>{" "}
              — тексты вопросов, ответов и оценок в рамках тренировочных
              симуляций, сохраняются для персонализированной аналитики.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>IP-адрес</span>{" "}
              и технические параметры браузера — фиксируются автоматически
              в целях безопасности и отладки.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Данные localStorage</span>{" "}
              — используются для хранения параметров сессии на стороне браузера
              (без передачи на сервер).
            </li>
          </ul>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            Мы не собираем биометрические данные, аудио- или видеозаписи, данные
            о состоянии здоровья, политических взглядах или иные специальные
            категории персональных данных, определённые ст. 10 152-ФЗ.
          </p>
        </motion.div>

        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="3. Цели и правовые основания обработки" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            Ваши данные обрабатываются только в следующих целях и исключительно
            при наличии соответствующего правового основания:
          </p>
          <ul
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "#737373",
              paddingLeft: 20,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>
                Предоставление доступа к Сервису
              </span>{" "}
              — основание: исполнение договора об оказании услуг, стороной
              которого является пользователь (ст. 6 ч. 1 п. 5 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>
                Проведение AI-симуляций
              </span>{" "}
              — обработка загруженных текстов для формирования персонализированной
              обратной связи — основание: исполнение договора (ст. 6 ч. 1 п. 5 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>
                Хранение истории сессий
              </span>{" "}
              — для отображения аналитики и прогресса пользователя —
              основание: согласие пользователя (ст. 6 ч. 1 п. 1 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>
                Улучшение качества Сервиса
              </span>{" "}
              — в обезличенном виде, без возможности идентификации —
              основание: согласие пользователя (ст. 6 ч. 1 п. 1 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>
                Технические и сервисные уведомления
              </span>{" "}
              (изменения в работе Сервиса, обновления Политики) —
              основание: исполнение договора (ст. 6 ч. 1 п. 5 152-ФЗ).
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>
                Обеспечение безопасности
              </span>{" "}
              — защита от мошенничества и несанкционированного доступа —
              основание: законные интересы оператора (ст. 6 ч. 1 п. 5 152-ФЗ).
            </li>
          </ul>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="4. Передача данных третьим лицам" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            Мы не продаём ваши персональные данные и не передаём их рекламодателям.
            Передача данных третьим лицам осуществляется только в следующих случаях:
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            <span style={{ color: "#171717", fontWeight: 500 }}>
              Google LLC (Gemini API)
            </span>{" "}
            — тексты ваших документов и сообщений передаются в API Gemini
            исключительно для генерации AI-ответов в режиме реального времени.
            Согласно условиям использования Google Cloud API, данные, переданные
            через API-интерфейс, не используются Google для обучения и улучшения
            общедоступных моделей. Передача осуществляется по зашифрованному
            каналу (TLS 1.2+). Данная передача является трансграничной (сервер
            Google LLC расположен в США); она осуществляется с вашего согласия,
            полученного при регистрации.
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <span style={{ color: "#171717", fontWeight: 500 }}>
              Supabase Inc.
            </span>{" "}
            — загружаемые вами файлы (документы) хранятся в сервисе Supabase
            Storage. Обработка данных осуществляется на основании договора между
            Оператором и Supabase Inc., включающего требования по защите
            персональных данных.
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <span style={{ color: "#171717", fontWeight: 500 }}>
              Уполномоченные государственные органы РФ
            </span>{" "}
            — данные раскрываются исключительно по требованию органов власти
            в случаях, прямо предусмотренных законодательством Российской
            Федерации.
          </p>
        </motion.div>

        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="5. Хранение и сроки обработки данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            Персональные данные пользователей хранятся на серверах,
            расположенных на территории Российской Федерации, в соответствии
            с ч. 5 ст. 18 152-ФЗ. Первичная запись данных осуществляется
            в базы данных на серверах РФ.
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Данные хранятся до момента удаления аккаунта пользователем или до
            получения требования об удалении в порядке, установленном настоящей
            Политикой. После удаления аккаунта персональные данные уничтожаются
            в течение 30 календарных дней, за исключением данных, хранение
            которых обязательно по законодательству РФ. Загруженные документы
            могут быть удалены пользователем в любой момент через личный кабинет.
          </p>
        </motion.div>

        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="6. Защита данных" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            В соответствии со ст. 19 152-ФЗ Оператор принимает необходимые
            технические и организационные меры для защиты персональных данных
            от несанкционированного доступа, изменения, раскрытия или
            уничтожения:
          </p>
          <ul
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "#737373",
              paddingLeft: 20,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <li>Шифрование данных при передаче — протокол TLS 1.2 и выше.</li>
            <li>Хеширование паролей пользователей — алгоритм bcrypt.</li>
            <li>Разграничение прав доступа к базе данных по принципу минимальных привилегий.</li>
            <li>Регулярный аудит безопасности серверной инфраструктуры.</li>
            <li>Хранение персональных данных на серверах, расположенных в РФ.</li>
          </ul>
        </motion.div>

        <motion.div
          custom={8}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="7. Права пользователя" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            В соответствии со статьями 14–17 Федерального закона № 152-ФЗ
            вы вправе:
          </p>
          <ul
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "#737373",
              paddingLeft: 20,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Доступ (ст. 14):</span>{" "}
              получить подтверждение факта обработки и перечень хранимых
              персональных данных.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Исправление (ст. 15):</span>{" "}
              потребовать уточнения неполных или неточных данных.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Удаление (ст. 17):</span>{" "}
              потребовать уничтожения персональных данных — если данные
              обрабатываются незаконно, цель обработки достигнута или вы
              отзываете согласие.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Ограничение обработки (ст. 15):</span>{" "}
              потребовать блокирования данных на период проверки их точности
              или законности обработки.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Переносимость:</span>{" "}
              запросить выгрузку ваших данных в машиночитаемом формате (JSON).
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Отзыв согласия (ст. 9):</span>{" "}
              в любой момент отозвать ранее данное согласие на обработку.
              Отзыв не влияет на законность обработки, осуществлённой до
              его получения.
            </li>
            <li>
              <span style={{ color: "#171717", fontWeight: 500 }}>Обжалование (ст. 17):</span>{" "}
              обратиться с жалобой в Роскомнадзор (rkn.gov.ru) или в суд.
            </li>
          </ul>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            Для реализации любого из указанных прав направьте запрос на:{" "}
            <a
              href="mailto:support@peaktalk.ru"
              style={{ color: "#E8600A", textDecoration: "none" }}
            >
              support@peaktalk.ru
            </a>
            . Срок ответа — 30 календарных дней с момента получения запроса
            (ст. 20 152-ФЗ).
          </p>
        </motion.div>

        <motion.div
          custom={9}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="8. Cookies и локальное хранилище" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            Сервис использует cookie-файлы исключительно для поддержания сессии
            аутентификации и корректной работы интерфейса. Применяются только
            технически необходимые (essential) cookie — без них Сервис не может
            функционировать. Аналитические, рекламные и маркетинговые cookie
            не используются.
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Браузерный localStorage используется для временного хранения
            параметров текущей сессии на стороне клиента. Данные в localStorage
            не передаются на серверы третьих лиц. Вы можете очистить localStorage
            стандартными средствами браузера в любой момент.
          </p>
        </motion.div>

        <motion.div
          custom={10}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="9. Изменения политики" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            Оператор вправе вносить изменения в настоящую Политику. При
            существенных изменениях — затрагивающих цели обработки, состав
            передаваемых данных или права пользователей — мы уведомим вас
            по email не позднее чем за 7 дней до вступления изменений в силу.
            Актуальная редакция Политики всегда доступна по адресу{" "}
            <span style={{ color: "#171717" }}>peaktalk.ru/privacy</span>.
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Если вы не согласны с изменениями, вы вправе удалить свой аккаунт
            до даты вступления новой редакции в силу. Продолжение использования
            Сервиса после указанной даты означает принятие обновлённой Политики.
          </p>
        </motion.div>

        <motion.div
          custom={11}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <SectionHeading title="10. Контакты оператора" />
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#737373", margin: 0 }}>
            По всем вопросам, связанным с обработкой персональных данных,
            а также для реализации ваших прав обращайтесь:
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            <span style={{ color: "#171717", fontWeight: 500 }}>Email:</span>{" "}
            <a
              href="mailto:support@peaktalk.ru"
              style={{ color: "#E8600A", textDecoration: "none" }}
            >
              support@peaktalk.ru
            </a>
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            <span style={{ color: "#171717", fontWeight: 500 }}>Оператор:</span>{" "}
            Самозанятый, ИНН&nbsp;583414998055, сервис PeakTalk (peaktalk.ru).
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#737373",
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            Срок ответа на обращения — 30 календарных дней. Надзорный орган:
            Федеральная служба по надзору в сфере связи, информационных технологий
            и массовых коммуникаций (Роскомнадзор) — rkn.gov.ru.
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
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.05em",
              color: "#a3a3a3",
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
