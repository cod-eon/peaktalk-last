"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileText,
  FolderOpen,
  LogOut,
  Settings,
  ShieldQuestion,
  UploadCloud,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { createClient } from "@/lib/supabase/client";
import { NotificationsPopover } from "@/components/NotificationsPopover";

const NAV_ITEMS = [
  { name: "Материал", caption: "текущая подготовка", path: "/dashboard", icon: FileText },
  { name: "Артефакты", caption: "версии и файлы", path: "/documents", icon: FolderOpen },
  { name: "Загрузка", caption: "новый материал", path: "/upload", icon: UploadCloud },
  { name: "Проверка", caption: "краш-тест", path: "/simulation", icon: ShieldQuestion },
  { name: "Встречи", caption: "даты и пакеты", path: "/meetings", icon: CalendarDays },
  { name: "Роли", caption: "оппоненты", path: "/personas", icon: Users },
  { name: "Риски", caption: "слабые места", path: "/progress", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Пользователь";

  return (
    <aside className="hidden h-screen w-[236px] shrink-0 flex-col border-r border-[color:var(--pt-line)] bg-white/90 px-4 py-5 backdrop-blur-xl md:fixed md:left-0 md:top-0 md:z-40 md:flex">
      <Link href="/dashboard" className="brand-wordmark text-[26px] text-[color:var(--pt-cobalt)]">
        PeakTalk
      </Link>

      <nav className="mt-9 flex flex-1 flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cx(
                "group flex min-h-[58px] items-center gap-3 rounded-[18px] px-3 text-[color:var(--pt-muted)] transition hover:bg-[color:var(--pt-bg)] hover:text-[color:var(--pt-ink)]",
                isActive &&
                  "bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)] shadow-[inset_3px_0_0_var(--pt-cobalt)]",
              )}
            >
              <span
                className={cx(
                  "flex size-9 shrink-0 items-center justify-center rounded-[14px] border transition",
                  isActive
                    ? "border-[color:var(--pt-cobalt)] bg-white text-[color:var(--pt-cobalt)]"
                    : "border-[color:var(--pt-line)] bg-white text-[color:var(--pt-muted)] group-hover:border-[color:var(--pt-line-strong)]",
                )}
              >
                <Icon size={18} strokeWidth={1.85} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold leading-tight">{item.name}</span>
                <span className="mt-0.5 block truncate text-[11px] font-medium leading-tight text-[color:var(--pt-faint)]">
                  {item.caption}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 space-y-3 border-t border-[color:var(--pt-line)] pt-4">
        <Link
          href="/billing"
          className={cx(
            "flex items-center justify-between rounded-[18px] border px-3 py-3 transition",
            pathname === "/billing"
              ? "border-[color:var(--pt-cobalt)] bg-[color:var(--pt-cobalt-soft)]"
              : "border-[color:var(--pt-line)] bg-white hover:border-[color:var(--pt-line-strong)]",
          )}
        >
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-[14px] bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]">
              <CreditCard size={17} strokeWidth={1.85} />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-[color:var(--pt-ink)]">
                Тариф Pro
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-[color:var(--pt-muted)]">
                14 проверок
              </span>
            </span>
          </span>
          <span className="size-2 rounded-full bg-[color:var(--pt-cobalt)]" />
        </Link>

        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/settings"
            title="Настройки"
            className={cx(
              "flex size-12 items-center justify-center rounded-[16px] transition",
              pathname === "/settings"
                ? "bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]"
                : "bg-[color:var(--pt-bg)] text-[color:var(--pt-muted)] hover:text-[color:var(--pt-ink)]",
            )}
          >
            <Settings size={18} strokeWidth={1.85} />
          </Link>
          <div className="flex size-12 items-center justify-center rounded-[16px] bg-[color:var(--pt-bg)] text-[color:var(--pt-muted)]">
            <NotificationsPopover />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex size-12 items-center justify-center rounded-[16px] bg-[color:var(--pt-bg)] text-[color:var(--pt-muted)] transition hover:bg-red-50 hover:text-red-600"
            title="Выйти"
          >
            <LogOut size={18} strokeWidth={1.85} />
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-[18px] bg-[color:var(--pt-bg)] px-3 py-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[color:var(--pt-ink)]">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[color:var(--pt-ink)]">
              {displayName}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-[color:var(--pt-muted)]">
              рабочее пространство
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
