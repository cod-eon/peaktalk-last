import Link from 'next/link';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--bg-main)]">
      {/* Background elements */}
      <div className="bg-grid absolute inset-0 z-0 pointer-events-none opacity-50" />
      
      {/* Decorative Blur */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--accent-primary)]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--accent-primary)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Logo */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)] flex items-center justify-center text-[var(--accent-primary)] font-bold font-syne text-sm shadow-[0_0_15px_var(--accent-primary-glow)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all">
            P
          </div>
          <span className="font-syne font-bold text-lg tracking-wide text-[var(--text-main)]">
            PeakTalk
          </span>
        </Link>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-md px-6 z-10 relative">
        {children}
      </main>
    </div>
  );
}
