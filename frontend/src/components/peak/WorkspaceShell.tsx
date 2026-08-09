"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  FileText,
  LogOut,
  Plus,
  Search,
  ShieldQuestion,
  UserRound,
} from "lucide-react";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { label: "Подготовка", href: "/workspace", icon: FileText },
];

const mobileItems = [
  { label: "Материал", href: "/material/demo", icon: FileText },
  { label: "Добавить", href: "/workspace?upload=1", icon: Plus },
  { label: "Проверка", href: "/material/demo/stress-test", icon: ShieldQuestion },
];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const isFocusedWorkspaceRoute = pathname?.startsWith("/material") || pathname?.startsWith("/workspace");
  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Пользователь";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-[100dvh] bg-[color:var(--pt-bg)] text-[color:var(--pt-ink)]">
      <header className="sticky top-0 z-[var(--z-topbar)] border-b border-[color:var(--pt-line)] bg-[color:var(--pt-bg)]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1540px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/workspace"
            className="brand-wordmark inline-flex min-h-10 shrink-0 items-center text-[22px] text-[color:var(--pt-cobalt)]"
          >
            PeakTalk
          </Link>

          <nav className="ml-3 hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/workspace" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex min-h-11 items-center gap-2 rounded-[16px] px-3 text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-white text-[color:var(--pt-ink)] shadow-[0_10px_28px_rgba(23,32,51,0.06)]"
                      : "text-[color:var(--pt-muted)] hover:bg-white/70 hover:text-[color:var(--pt-ink)]",
                  ].join(" ")}
                >
                  <Icon size={16} strokeWidth={1.85} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="ml-auto hidden min-h-11 min-w-[280px] items-center justify-between rounded-[16px] border border-[color:var(--pt-line)] bg-white px-3 text-left text-[13px] font-semibold text-[color:var(--pt-muted)] shadow-[0_10px_28px_rgba(23,32,51,0.04)] transition hover:border-[color:var(--pt-line-strong)] xl:flex"
          >
            <span className="inline-flex items-center gap-2">
              <Search size={15} strokeWidth={1.85} />
              Найти подготовку или материал
            </span>
            <span className="rounded-[10px] bg-[color:var(--pt-bg)] px-2 py-1 font-mono text-[11px]">
              Ctrl K
            </span>
          </button>

          <Link
            href="/billing"
            className="hidden min-h-11 items-center gap-2 rounded-[16px] border border-[color:var(--pt-line)] bg-white px-3 text-[13px] font-semibold text-[color:var(--pt-ink)] transition hover:border-[color:var(--pt-line-strong)] sm:inline-flex"
          >
            <CreditCard size={16} strokeWidth={1.85} />
            Pro
          </Link>

          <div className="hidden size-11 items-center justify-center rounded-[16px] border border-[color:var(--pt-line)] bg-white text-[color:var(--pt-muted)] sm:flex">
            <NotificationsPopover />
          </div>

          <Link
            href="/settings"
            className="hidden min-h-11 items-center gap-2 rounded-[16px] border border-[color:var(--pt-line)] bg-white px-3 text-[13px] font-semibold text-[color:var(--pt-ink)] transition hover:border-[color:var(--pt-line-strong)] md:inline-flex"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-[color:var(--pt-bg)] text-[12px] font-bold">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-[120px] truncate">{displayName}</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden size-11 items-center justify-center rounded-[16px] border border-[color:var(--pt-line)] bg-white text-[color:var(--pt-muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 md:flex"
            title="Выйти"
          >
            <LogOut size={17} strokeWidth={1.85} />
          </button>

          <div className="ml-auto flex items-center gap-2 sm:hidden">
            <div className="flex size-10 items-center justify-center rounded-[15px] border border-[color:var(--pt-line)] bg-white text-[color:var(--pt-muted)]">
              <NotificationsPopover isMobile />
            </div>
            <Link
              href="/settings"
              className="flex size-10 items-center justify-center rounded-[15px] border border-[color:var(--pt-line)] bg-white text-[color:var(--pt-muted)]"
              title="Профиль"
            >
              <UserRound size={17} strokeWidth={1.85} />
            </Link>
          </div>
        </div>
      </header>

      <main className={isFocusedWorkspaceRoute ? "pb-0" : "pb-24 md:pb-0"}>{children}</main>

      {!isFocusedWorkspaceRoute && (
        <nav className="fixed inset-x-0 bottom-0 z-[var(--z-mobile-nav)] px-3 pb-3 md:hidden">
          <div className="grid h-[62px] grid-cols-3 rounded-[24px] border border-[color:var(--pt-line)] bg-white/94 p-1 shadow-[0_18px_55px_rgba(20,34,55,0.16)] backdrop-blur-xl">
            {mobileItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[19px] text-[10px] font-semibold transition-colors",
                    active
                      ? "bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]"
                      : "text-[color:var(--pt-muted)]",
                  ].join(" ")}
                >
                  <Icon size={18} strokeWidth={active ? 2.1 : 1.85} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
