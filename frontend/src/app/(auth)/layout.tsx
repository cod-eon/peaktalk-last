"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Background elements */}
      <div className="bg-grid absolute inset-0 z-0 pointer-events-none opacity-50" />
      <div className="absolute inset-x-0 top-20 h-px bg-neutral-200/80 pointer-events-none" />

      {/* Nav — same style & animation as landing page */}
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
          borderBottom: '1px solid #e5e5e5',
          background: 'rgba(255, 255, 255, 0.9)',
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

      {/* Main Content — centered, padded for fixed nav */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 z-10 relative py-6" style={{ paddingTop: 88 }}>
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
