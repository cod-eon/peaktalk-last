import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LogoMark } from "./PeakTalkLogo";

const paper = "#FAF8F4";
const surface = "#FFFFFF";
const surfaceSoft = "#F5F3EF";
const ink = "#111827";
const black = "#171717";
const muted = "#73706A";
const dim = "#9A958C";
const line = "#D9D5CC";
const border = "#E5E2DA";
const ember = "#E8600A";
const violet = "#8B5CF6";
const success = "#059669";
const warning = "#D97706";

const bodyFont =
  '"IBM Plex Sans", "Inter", "Helvetica Neue", Arial, sans-serif';
const monoFont =
  '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace';
const displayFont = '"Unbounded", "IBM Plex Sans", Arial, sans-serif';

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

type IconName =
  | "dashboard"
  | "file"
  | "bot"
  | "calendar"
  | "chart"
  | "users"
  | "credit"
  | "settings"
  | "timer"
  | "flag"
  | "mic"
  | "arrow"
  | "alert"
  | "check"
  | "target"
  | "spark";

const iconPaths: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M14 3v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </>
  ),
  bot: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M12 8V4" />
      <path d="M8.5 13h.01" />
      <path d="M15.5 13h.01" />
      <path d="M9 17h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4" />
      <path d="M17 3v4" />
      <path d="M4 10h17" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h17" />
      <path d="M8 16l4-5 3 3 5-8" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.7-3.2 2.8-5 6-5s5.3 1.8 6 5" />
      <path d="M15 11a3 3 0 1 0 0-6" />
      <path d="M17 15c2.4.6 3.8 2.2 4 5" />
    </>
  ),
  credit: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 16h4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2 3.4-.2-.1a1.8 1.8 0 0 0-2 .4l-.1.1-3.4-2 .1-.2a1.8 1.8 0 0 0-.4-2h-.2a1.8 1.8 0 0 0-2 .4l-.1.1-3.4-2 .1-.2a1.8 1.8 0 0 0-.4-2l-.1-.1 2-3.4.2.1a1.8 1.8 0 0 0 2-.4l.1-.1 3.4 2-.1.2a1.8 1.8 0 0 0 .4 2h.2a1.8 1.8 0 0 0 2-.4l.1-.1 3.4 2z" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V8" />
      <path d="M12 13l4 2" />
      <path d="M9 2h6" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-1 4 1 4H5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 9v5" />
      <path d="M12 18h.01" />
    </>
  ),
  check: (
    <>
      <path d="M20 6L9 17l-5-5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
      <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </>
  ),
};

const Icon = ({
  name,
  size = 24,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {iconPaths[name]}
  </svg>
);

const fade = (frame: number, fps: number, start: number, end: number) =>
  interpolate(frame, [start * fps, end * fps], [0, 1], {
    ...clamp,
    easing: easeOut,
  });

const fadeOut = (frame: number, fps: number, start: number, end: number) =>
  interpolate(frame, [start * fps, end * fps], [1, 0], {
    ...clamp,
    easing: easeOut,
  });

const softScale = (value: number) =>
  interpolate(value, [0, 1], [0.985, 1], clamp);

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const typeText = (text: string, progress: number) =>
  text.slice(0, Math.floor(text.length * progress));

const MonoLabel = ({
  children,
  color = dim,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) => (
  <div
    style={{
      fontFamily: monoFont,
      fontSize: 13,
      letterSpacing: 1.7,
      textTransform: "uppercase",
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

const SidebarButton = ({
  name,
  active = false,
}: {
  name: IconName;
  active?: boolean;
}) => (
  <div
    style={{
      width: 44,
      height: 38,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: active ? ink : "#9CA3AF",
      background: active ? "#E5E5E5" : "transparent",
      border: active ? "1px solid #E0E0E0" : "1px solid transparent",
    }}
  >
    <Icon name={name} size={19} strokeWidth={active ? 2.4 : 2} />
  </div>
);

const MetricStrip = ({
  label,
  value,
  color,
  delay,
  frame,
  fps,
}: {
  label: string;
  value: number;
  color: string;
  delay: number;
  frame: number;
  fps: number;
}) => {
  const reveal = fade(frame, fps, delay, delay + 0.65);
  const width = interpolate(reveal, [0, 1], [0, value], clamp);

  return (
    <div
      style={{
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [10, 0], clamp)}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 650, color: ink }}>{label}</span>
        <span style={{ fontFamily: monoFont, fontSize: 12, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "#EEEAE3", overflow: "hidden" }}>
        <div style={{ width: `${width}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
};

const TimelineDot = ({
  active,
  complete,
  label,
}: {
  active?: boolean;
  complete?: boolean;
  label: string;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div
      style={{
        width: 18,
        height: 18,
        border: `1px solid ${complete ? success : active ? ink : line}`,
        background: complete ? success : active ? ink : surface,
        color: complete || active ? surface : muted,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {complete ? <Icon name="check" size={12} strokeWidth={3} /> : null}
    </div>
    <span
      style={{
        fontSize: 15,
        color: complete ? ink : active ? ink : muted,
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </span>
  </div>
);

const Sidebar = ({
  frame,
  fps,
  intro,
}: {
  frame: number;
  fps: number;
  intro: number;
}) => (
  <aside
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: 72,
      height: "100%",
      borderRight: `1px solid ${border}`,
      background: surface,
      opacity: intro,
      transform: `translateX(${interpolate(intro, [0, 1], [-18, 0], clamp)}px)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <div
      style={{
        height: 64,
        width: "100%",
        borderBottom: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LogoMark frame={Math.min(frame, fps * 3.6)} fps={fps} size={34} />
    </div>
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        paddingTop: 18,
        alignItems: "center",
        flex: 1,
      }}
    >
      <SidebarButton name="dashboard" />
      <SidebarButton name="file" />
      <SidebarButton name="bot" active />
      <SidebarButton name="calendar" />
      <SidebarButton name="chart" />
      <SidebarButton name="users" />
      <SidebarButton name="credit" />
    </nav>
    <div
      style={{
        width: "100%",
        borderTop: `1px solid ${border}`,
        padding: "14px 0 18px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <SidebarButton name="settings" />
    </div>
  </aside>
);

const Header = ({
  questionNumber,
  timerSeconds,
  progress,
  analyzing,
}: {
  questionNumber: number;
  timerSeconds: number;
  progress: number;
  analyzing: boolean;
}) => {
  const warningTimer = timerSeconds <= 20;

  return (
    <div style={{ marginBottom: 34 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              border: "1px solid #E5E7EB",
              background: "#F5F5F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: ink,
            }}
          >
            <Icon name="bot" size={21} />
          </div>
          <div>
            <MonoLabel color={ink} style={{ marginBottom: 6 }}>
              Совет директоров
            </MonoLabel>
            <div
              style={{
                display: "inline-flex",
                border: "1px solid #E5E7EB",
                padding: "4px 8px",
                fontFamily: monoFont,
                fontSize: 10,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: muted,
                background: surface,
              }}
            >
              Тренировка
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 38,
              padding: "0 13px",
              border: `1px solid ${warningTimer ? "#F9BD8E" : "#E5E7EB"}`,
              background: warningTimer ? "#FEF3E8" : "#F9FAFB",
              color: warningTimer ? warning : ink,
              fontFamily: monoFont,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <Icon name="timer" size={15} />
            {formatTimer(timerSeconds)}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: monoFont, fontSize: 12, color: dim }}>
              Вопрос{" "}
              <span style={{ color: ink, fontWeight: 750 }}>{questionNumber}</span>{" "}
              из 10
            </div>
            <div style={{ fontFamily: monoFont, fontSize: 10, color: analyzing ? violet : dim }}>
              {analyzing ? "AI проверяет логику ответа" : "активная сессия"}
            </div>
          </div>
          <div
            style={{
              height: 38,
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 12px",
              border: "1px solid #E5E7EB",
              background: "#F9FAFB",
              color: "#6B7280",
              fontFamily: monoFont,
              fontSize: 12,
            }}
          >
            <Icon name="flag" size={13} />
            Завершить досрочно
          </div>
        </div>
      </div>
      <div style={{ height: 6, background: "#ECE8DF", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: questionNumber >= 5 ? success : black,
          }}
        />
      </div>
    </div>
  );
};

const QuestionCard = ({
  question,
  opacity,
  y,
  iconColor,
}: {
  question: string;
  opacity: number;
  y: number;
  iconColor: string;
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      transform: `translateY(${y}px)`,
    }}
  >
    <div
      style={{
        position: "relative",
        border: `1px solid ${border}`,
        background: "#F9FAFB",
        padding: "30px 34px 34px",
        boxShadow: "0 1px 2px rgba(17,24,39,0.04)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -12,
          top: -12,
          width: 38,
          height: 38,
          background: surface,
          border: `1px solid ${border}`,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.86,
        }}
      >
        <Icon name="bot" size={21} />
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: bodyFont,
          fontSize: 31,
          lineHeight: 1.22,
          letterSpacing: 0,
          fontWeight: 600,
          color: ink,
        }}
      >
        {question}
      </h1>
    </div>
  </div>
);

const AnswerBox = ({
  typedAnswer,
  analyzing,
  submitPulse,
  spinnerRotation,
}: {
  typedAnswer: string;
  analyzing: boolean;
  submitPulse: number;
  spinnerRotation: number;
}) => (
  <div style={{ marginTop: 34 }}>
    <div
      style={{
        minHeight: 168,
        border: `1px solid ${analyzing ? black : border}`,
        background: "#F9FAFB",
        padding: "22px 24px",
        boxShadow: analyzing ? "0 0 0 1px #171717" : "0 1px 2px rgba(17,24,39,0.04)",
      }}
    >
      <div
        style={{
          color: typedAnswer ? ink : "#8C8A84",
          fontSize: 20,
          lineHeight: 1.44,
          whiteSpace: "pre-wrap",
        }}
      >
        {typedAnswer || "Ваш ответ совету директоров..."}
        {typedAnswer && !analyzing ? (
          <span style={{ color: ember, marginLeft: 3 }}>|</span>
        ) : null}
      </div>
    </div>
    <div
      style={{
        marginTop: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div
        style={{
          fontFamily: monoFont,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: muted,
        }}
      >
        {typedAnswer.length} симв.
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            background: "#F5F5F5",
            border: `1px solid ${border}`,
            color: ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="mic" size={24} />
        </div>
        <div
          style={{
            minWidth: 238,
            height: 56,
            padding: "0 18px",
            background: black,
            color: surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontSize: 17,
            fontWeight: 700,
            transform: `scale(${interpolate(submitPulse, [0, 1], [1, 0.985], clamp)})`,
          }}
        >
          {analyzing ? (
            <>
              <div
                style={{
                  width: 17,
                  height: 17,
                  border: "2px solid rgba(255,255,255,0.35)",
                  borderTopColor: surface,
                  borderRadius: 999,
                  transform: `rotate(${spinnerRotation}deg)`,
                }}
              />
              Анализ нейросетью
            </>
          ) : (
            <>
              Ответить
              <Icon name="arrow" size={20} />
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

const ContextPanel = ({
  frame,
  fps,
  stage,
}: {
  frame: number;
  fps: number;
  stage: "question" | "analysis" | "next";
}) => {
  const panelIn = fade(frame, fps, 1.2, 2.1);
  const riskReveal = fade(frame, fps, 6.5, 8.4);

  return (
    <aside
      style={{
        width: 358,
        opacity: panelIn,
        transform: `translateX(${interpolate(panelIn, [0, 1], [28, 0], clamp)}px)`,
      }}
    >
      <div
        style={{
          border: `1px solid ${border}`,
          background: surface,
          padding: 22,
          marginBottom: 18,
        }}
      >
        <MonoLabel color={ember} style={{ marginBottom: 14 }}>
          Контекст сессии
        </MonoLabel>
        <div
          style={{
            fontSize: 23,
            lineHeight: 1.13,
            fontWeight: 750,
            color: ink,
            marginBottom: 16,
          }}
        >
          Защита бюджета внедрения CRM
        </div>
        <div style={{ display: "grid", gap: 11 }}>
          {[
            ["Оппонент", "Совет директоров"],
            ["Ставка", "сроки релиза и ключевой клиент"],
            ["Жесткость", "5 / давление высоким темпом"],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "92px 1fr",
                gap: 12,
                borderTop: `1px solid ${border}`,
                paddingTop: 11,
              }}
            >
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 10,
                  letterSpacing: 1.3,
                  textTransform: "uppercase",
                  color: dim,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 15, lineHeight: 1.3, color: ink }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${stage === "analysis" ? violet : border}`,
          background: surface,
          padding: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <MonoLabel color={stage === "analysis" ? violet : dim}>
            Pressure map
          </MonoLabel>
          <div
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: stage === "analysis" ? "rgba(139,92,246,0.09)" : surfaceSoft,
              color: stage === "analysis" ? violet : muted,
              border: `1px solid ${stage === "analysis" ? "rgba(139,92,246,0.26)" : border}`,
            }}
          >
            <Icon name="target" size={16} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 17 }}>
          <MetricStrip
            label="Логика"
            value={stage === "next" ? 76 : 68}
            color={ink}
            delay={2.1}
            frame={frame}
            fps={fps}
          />
          <MetricStrip
            label="Доказательства"
            value={stage === "next" ? 59 : 42}
            color={ember}
            delay={2.35}
            frame={frame}
            fps={fps}
          />
          <MetricStrip
            label="Контраргументы"
            value={stage === "next" ? 71 : 53}
            color={violet}
            delay={2.6}
            frame={frame}
            fps={fps}
          />
        </div>

        <div
          style={{
            marginTop: 20,
            borderTop: `1px solid ${border}`,
            paddingTop: 16,
            opacity: Math.max(riskReveal, stage === "next" ? 1 : 0),
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div
              style={{
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#FEF3E8",
                color: ember,
                border: "1px solid #F9BD8E",
                flexShrink: 0,
              }}
            >
              <Icon name="alert" size={14} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1.25,
                  fontWeight: 700,
                  color: ink,
                  marginBottom: 5,
                }}
              >
                Риск: экономический эффект звучит позже, чем просит совет.
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.35, color: muted }}>
                Нужен мост: цена задержки, не только цена внедрения.
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const TranscriptRail = ({
  frame,
  fps,
  answered,
}: {
  frame: number;
  fps: number;
  answered: boolean;
}) => {
  const railIn = fade(frame, fps, 8.25, 9.15);

  return (
    <div
      style={{
        marginTop: 22,
        opacity: railIn,
        transform: `translateY(${interpolate(railIn, [0, 1], [14, 0], clamp)}px)`,
        borderTop: `1px solid ${border}`,
        paddingTop: 18,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 14,
      }}
    >
      <TimelineDot complete label="Вопрос принят" />
      <TimelineDot complete={answered} active={!answered} label="Ответ проверен" />
      <TimelineDot active={answered} label="Следующий нажим" />
    </div>
  );
};

export const PeakTalkSimulationMockup = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = fade(frame, fps, 0.05, 0.95);
  const shellIn = fade(frame, fps, 0.45, 1.25);
  const questionIn = fade(frame, fps, 1.0, 1.75);
  const typedProgress = fade(frame, fps, 2.2, 5.35);
  const analyzingIn = fade(frame, fps, 5.65, 6.15);
  const analyzingOut = fadeOut(frame, fps, 7.35, 8.0);
  const analyzing = analyzingIn * analyzingOut > 0.05;
  const questionSwap = fade(frame, fps, 7.55, 8.35);
  const nextStage = frame >= 8.25 * fps;
  const outro = fade(frame, fps, 10.1, 11.2);

  const timerSeconds = Math.round(
    interpolate(
      frame,
      [1.0 * fps, 5.6 * fps, 8.2 * fps, 11.8 * fps],
      [74, 28, 90, 78],
      clamp,
    ),
  );
  const headerProgress = interpolate(frame, [0, 8.4 * fps], [40, 50], clamp);
  const submitPulse = fade(frame, fps, 5.35, 5.8);

  const answer =
    "Если мы режем бюджет сейчас, экономия видна в отчете сразу, но цена задержки выше: релиз уедет на месяц, команда потеряет окно у ключевого клиента, а возврат к проекту станет дороже. Я предлагаю оставить бюджет и вынести два контрольных рубежа: запуск пилота через 3 недели и метрики удержания клиента через 6 недель.";
  const typedAnswer = typeText(answer, typedProgress);

  const firstQuestion =
    "Если квартальный эффект появится только через два месяца, почему совет должен оставить бюджет сейчас?";
  const secondQuestion =
    "Вы называете цену задержки. Какая цифра доказывает, что она выше прямой экономии бюджета?";

  return (
    <AbsoluteFill
      style={{
        background: paper,
        color: ink,
        fontFamily: bodyFont,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(17,24,39,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(17,24,39,0.035) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.82,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${ember}, ${violet})`,
          opacity: 0.85 * intro,
          transform: `scaleX(${intro})`,
          transformOrigin: "left center",
        }}
      />

      <Sidebar frame={frame} fps={fps} intro={intro} />

      <main
        style={{
          position: "absolute",
          left: 72,
          top: 0,
          right: 0,
          bottom: 0,
          padding: "58px 76px 58px 86px",
          opacity: shellIn,
          transform: `translateY(${interpolate(shellIn, [0, 1], [18, 0], clamp)}px) scale(${softScale(shellIn)})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
          }}
        >
          <div>
            <MonoLabel color={ember} style={{ marginBottom: 12 }}>
              Simulation / active pressure test
            </MonoLabel>
            <h2
              style={{
                margin: 0,
                fontFamily: displayFont,
                fontSize: 38,
                lineHeight: 1,
                letterSpacing: 0,
                fontWeight: 800,
              }}
            >
              Стресс-тест аргументации
            </h2>
          </div>
          <div
            style={{
              border: `1px solid ${border}`,
              background: surface,
              padding: "12px 16px",
              minWidth: 238,
            }}
          >
            <MonoLabel style={{ marginBottom: 8 }}>Документ</MonoLabel>
            <div style={{ fontSize: 15, fontWeight: 650, color: ink }}>
              Budget defense memo.pdf
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1030px) 358px",
            gap: 36,
            alignItems: "start",
          }}
        >
          <section
            style={{
              position: "relative",
              border: `1px solid ${border}`,
              background: surface,
              padding: 34,
              minHeight: 786,
              boxShadow: "0 10px 28px rgba(17,24,39,0.05)",
            }}
          >
            <Header
              questionNumber={nextStage ? 5 : 4}
              timerSeconds={timerSeconds}
              progress={headerProgress}
              analyzing={analyzing}
            />

            <div style={{ position: "relative", height: 192, opacity: questionIn }}>
              <QuestionCard
                question={firstQuestion}
                opacity={1 - questionSwap}
                y={interpolate(questionSwap, [0, 1], [0, -14], clamp)}
                iconColor={muted}
              />
              <QuestionCard
                question={secondQuestion}
                opacity={questionSwap}
                y={interpolate(questionSwap, [0, 1], [18, 0], clamp)}
                iconColor={violet}
              />
            </div>

            <AnswerBox
              typedAnswer={nextStage ? "" : typedAnswer}
              analyzing={analyzing}
              submitPulse={submitPulse}
              spinnerRotation={frame * 18}
            />

            <div
              style={{
                position: "absolute",
                left: 34,
                right: 34,
                bottom: 30,
              }}
            >
              <TranscriptRail frame={frame} fps={fps} answered={nextStage} />
            </div>
          </section>

          <ContextPanel
            frame={frame}
            fps={fps}
            stage={analyzing ? "analysis" : nextStage ? "next" : "question"}
          />
        </div>
      </main>

      <div
        style={{
          position: "absolute",
          right: 72,
          bottom: 52,
          opacity: outro,
          transform: `translateY(${interpolate(outro, [0, 1], [16, 0], clamp)}px)`,
          background: black,
          color: surface,
          padding: "18px 22px",
          minWidth: 436,
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: "0 20px 50px rgba(17,24,39,0.18)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(139,92,246,0.18)",
            color: violet,
            border: "1px solid rgba(139,92,246,0.35)",
          }}
        >
          <Icon name="spark" size={20} />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 750, marginBottom: 3 }}>
            Новый вопрос усиливает слабое место
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>
            PeakTalk проверяет позицию до реальной встречи, а не тренирует красивую речь.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
