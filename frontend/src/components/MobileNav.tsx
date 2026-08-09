"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, ShieldQuestion, UploadCloud } from "lucide-react";

const NAV_ITEMS = [
  { name: "Материал", path: "/dashboard", icon: FileText },
  { name: "Загрузка", path: "/upload", icon: UploadCloud },
  { name: "Проверка", path: "/simulation", icon: ShieldQuestion },
  { name: "Риски", path: "/progress", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <nav className="mx-3 mb-3 flex h-[62px] items-center justify-around rounded-[24px] border border-[color:var(--pt-line)] bg-white/94 px-1 shadow-[0_18px_55px_rgba(20,34,55,0.16)] backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-[18px] transition-colors ${
                isActive
                  ? "bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]"
                  : "text-[color:var(--pt-faint)] hover:text-[color:var(--pt-ink)]"
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.9} />
              <span className="text-[9px] font-semibold leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
