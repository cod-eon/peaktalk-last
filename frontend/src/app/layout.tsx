import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://peaktalk.ru"),
  title: "PeakTalk — AI-симулятор сложных рабочих коммуникаций",
  description:
    "Тренируйте защиту проектов, бюджетов, QBR и переговоров с жесткими стейкхолдерами. PeakTalk стресс-тестирует аргументацию перед реальной встречей.",
  applicationName: "PeakTalk",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "96x96", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "PeakTalk — AI-симулятор сложных рабочих коммуникаций",
    description:
      "Тренируйте защиту проектов, бюджетов, QBR и переговоров с жесткими стейкхолдерами. PeakTalk стресс-тестирует аргументацию перед реальной встречей.",
    url: "https://peaktalk.ru",
    siteName: "PeakTalk",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PeakTalk — AI-симулятор сложных рабочих коммуникаций",
    description:
      "Тренируйте защиту проектов, бюджетов, QBR и переговоров с жесткими стейкхолдерами.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable} antialiased`}>
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
