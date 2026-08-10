"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#faf8f4] text-[#171717]">
      <div className="bg-grid absolute inset-0 z-0 pointer-events-none opacity-35" />

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '16px 0',
          borderBottom: '1px solid #d9d5cc',
          background: 'rgba(250, 248, 244, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="container-custom">
          <Link href="/" className="flex items-center gap-2 w-fit hover:opacity-80 transition-opacity">
            <Image
              src="/logo_svg.svg"
              alt="PeakTalk"
              width={52}
              height={52}
              priority
              loading="eager"
              style={{ display: 'block' }}
            />
            <span className="brand-wordmark text-[21.6px] text-neutral-900">
              PeakTalk
            </span>
          </Link>
        </div>
      </motion.nav>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-28 sm:px-6">
        <div className="grid w-full max-w-5xl items-stretch overflow-hidden border border-[#d9d5cc] bg-white shadow-[0_24px_80px_rgba(23,23,23,0.08)] lg:grid-cols-[0.82fr_1.18fr]">
          <section className="relative hidden min-h-[520px] overflow-hidden bg-[#171717] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
            <div className="relative">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#f29555]">PeakTalk / access</p>
              <h1 className="mt-20 max-w-sm font-syne text-3xl font-semibold leading-tight">Защитите важную идею до того, как войдёте в переговорную.</h1>
            </div>
            <div className="relative grid gap-3 text-sm text-white/65">
              <span>01 / Материал</span>
              <span>02 / Слабые места</span>
              <span>03 / Adversarial simulation</span>
              <span>04 / Defense Brief</span>
            </div>
          </section>
          <section className="flex min-h-[520px] items-center justify-center p-5 sm:p-10">
            <div className="w-full max-w-md">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}
