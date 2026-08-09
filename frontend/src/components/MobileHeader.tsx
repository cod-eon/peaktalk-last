"use client";

import Link from "next/link";
import { NotificationsPopover } from "./NotificationsPopover";

export function MobileHeader() {
  return (
    <div className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[color:var(--pt-line)] bg-white/90 px-4 backdrop-blur-xl">
      <Link href="/dashboard" className="font-display text-[18px] font-extrabold tracking-[-0.04em] text-[color:var(--pt-cobalt)]">
        PeakTalk
      </Link>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color:var(--pt-line)] bg-white px-3 text-[12px] font-semibold text-[color:var(--pt-ink)]">
          Pro
          <span className="size-1.5 rounded-full bg-[color:var(--pt-cobalt)]" />
        </span>
        <NotificationsPopover isMobile />
      </div>
    </div>
  );
}
