import Link from 'next/link';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--bg-main)]">
      {/* Background elements */}
      <div className="bg-grid absolute inset-0 z-0 pointer-events-none opacity-50" />
      
      {/* Decorative Blur */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Logo */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold font-syne text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all">
            P
          </div>
          <span className="font-syne font-bold text-lg tracking-wide text-slate-100">
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
