'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  QrCode,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

export default function tayseerLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col text-white bg-[var(--bg)]" style={paletteVars}>
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-black/20">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[var(--c-orange)] via-[var(--c-magenta)] to-[var(--c-purple)] shadow-md" />
            <span className="text-lg font-semibold tracking-wide">tayseer</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="hover:opacity-80">How it works</a>
            <a href="#features" className="hover:opacity-80">Features</a>
            <a href="#pricing" className="hover:opacity-80">Use cases</a>
            <Link
              href="/auth/login"
              className="rounded-xl bg-white text-black px-4 py-2 font-medium shadow hover:shadow-lg"
            >
              Log in
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden rounded-xl p-2 bg-white/10 hover:bg-white/20"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </nav>

        {/* Mobile Fullscreen Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 text-lg font-medium">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-5 right-5 rounded-full bg-white/10 p-2"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Use cases</a>
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-white text-black px-6 py-3 shadow font-medium"
            >
              Log in
            </Link>
          </div>
        )}
      </header>

      {/* ===== MAIN ===== */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Background gradients */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 opacity-60"
          style={{
            background:
              'radial-gradient(60% 60% at 75% 20%, var(--grad-orange) 0%, transparent 60%), radial-gradient(50% 50% at 20% 80%, var(--grad-magenta) 0%, transparent 60%), radial-gradient(40% 40% at 10% 10%, var(--grad-purple) 0%, transparent 60%)',
          }}
        />

        {/* ===== HERO ===== */}
        <section className="py-16 sm:py-20 md:py-28 flex flex-col items-center text-center gap-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight max-w-[20ch]"
          >
            Gift. Reward. Redeem.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--c-orange)] via-[var(--c-magenta)] to-[var(--c-purple)]">
              tayseer vouchers made simple.
            </span>
          </motion.h1>

          <p className="text-base sm:text-lg text-white/80 max-w-[40ch]">
            Create prepaid gift cards, run seasonal campaigns, and redeem via QR — all from your phone or tablet.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-5 py-3 font-medium shadow hover:shadow-lg transition"
            >
              Login to Dashboard <ArrowRight size={18} />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 ring-1 ring-white/30 hover:ring-white/50 text-white"
            >
              See how it works
            </a>
          </div>
        </section>

        {/* ===== HOW SECTION ===== */}
        <section id="how" className="py-14 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-semibold">How tayseer works</h2>
          <p className="mt-2 text-white/80 max-w-prose mx-auto md:mx-0">
            Create a prepaid voucher in seconds, hand it to your customer (QR or digital), and track every redemption in real-time.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Card icon={<Sparkles />} title="Issue" text="Enter buyer name, amount & expiry. A unique code + QR is generated instantly." />
            <Card icon={<QrCode />} title="Redeem" text="Scan or type the code at checkout. Balance updates in real time." />
            <Card icon={<ShieldCheck />} title="Audit" text="Track refunds, voids & balances securely with full ledger visibility." />
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" className="py-14">
          <h2 className="text-2xl md:text-3xl font-semibold text-center md:text-left">
            Built for modern merchants
          </h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FeatureBullet title="Multi-store & roles">
              Owner, Manager, Cashier, Auditor — least-privilege by design.
            </FeatureBullet>
            <FeatureBullet title="QR codes & secure redemption">
              Atomic RPCs prevent race conditions. Every voucher is tamper-proof.
            </FeatureBullet>
            <FeatureBullet title="Seasonal campaigns">
              Run Ramadan or Back-to-School promos with themed gift cards.
            </FeatureBullet>
            <FeatureBullet title="Reports & Exports">
              Track issued vs redeemed, and export to CSV for accounting.
            </FeatureBullet>
          </div>
        </section>

        {/* ===== CTA / PRICING ===== */}
        <section id="pricing" className="py-14">
          <div className="rounded-3xl p-8 ring-1 ring-white/10 bg-white/5 backdrop-blur-sm text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-semibold">
              Ready to issue your first voucher?
            </h3>
            <p className="mt-2 text-white/80">
              Log in to your dashboard and start in less than a minute.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-5 py-3 font-medium shadow hover:shadow-lg"
              >
                Login to tayseer <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="py-10 text-white/70 text-sm">
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} tayseer. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a className="hover:text-white" href="#">Privacy</a>
              <a className="hover:text-white" href="#">Terms</a>
              <a className="hover:text-white" href="#">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ======= Components ======= */

function Card({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-5 ring-1 ring-white/10 bg-white/5 text-left"
    >
      <div
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
        style={{
          background:
            'linear-gradient(135deg, var(--c-orange), var(--c-magenta))',
        }}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-white/80 text-sm leading-relaxed">{text}</p>
    </motion.div>
  );
}

function FeatureBullet({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 15 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3"
    >
      <div
        className="mt-1 h-2.5 w-2.5 rounded-full"
        style={{
          background:
            'linear-gradient(135deg, var(--c-orange), var(--c-purple))',
        }}
      />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-white/80 text-sm mt-1">{children}</p>
      </div>
    </motion.div>
  );
}

/* ======= Palette ======= */
const paletteVars: React.CSSProperties = {
  ['--bg' as any]: '#0A0A0C',
  ['--c-orange' as any]: '#FF6A00',
  ['--c-magenta' as any]: '#D81B60',
  ['--c-purple' as any]: '#6A00FF',
  ['--grad-orange' as any]: 'rgba(255, 106, 0, 0.55)',
  ['--grad-magenta' as any]: 'rgba(216, 27, 96, 0.45)',
  ['--grad-purple' as any]: 'rgba(106, 0, 255, 0.35)',
};
