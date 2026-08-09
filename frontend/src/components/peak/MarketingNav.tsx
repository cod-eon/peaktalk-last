import Link from "next/link";

const navItems = [
  { label: "Как работает", href: "/#how-it-works" },
  { label: "Сценарии", href: "/scenarios" },
  { label: "Стоимость", href: "/access" },
];

export function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--pt-line)] bg-[color:var(--pt-bg)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center font-display text-[18px] font-extrabold tracking-[-0.03em] text-[color:var(--pt-ink)]"
        >
          PeakTalk
        </Link>
        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-10 items-center text-[13px] font-semibold text-[color:var(--pt-muted)] transition-colors hover:text-[color:var(--pt-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden min-h-10 items-center text-[13px] font-semibold text-[color:var(--pt-muted)] transition-colors hover:text-[color:var(--pt-ink)] sm:inline-flex"
          >
            Войти
          </Link>
          <Link
            href="/simulation/guest"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[color:var(--pt-ink)] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[color:var(--pt-cobalt)]"
          >
            Загрузить материал
          </Link>
        </div>
      </div>
    </header>
  );
}
