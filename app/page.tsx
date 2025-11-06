'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, ShieldCheck, Sparkles, ArrowRight, X } from 'lucide-react'

export default function TayseerLanding() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)] text-[var(--c-text)]" style={paletteVars}>
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[var(--c-primary)]/20">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Logo */}
          <Link href="/icon-192.png" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-[var(--c-primary)]" />
            <span className="text-lg font-semibold tracking-wide text-[var(--c-primary)]">
              tayseer
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="hover:text-[var(--c-secondary)]">How it works</a>
            <a href="#features" className="hover:text-[var(--c-secondary)]">Features</a>
            <a href="#usecases" className="hover:text-[var(--c-secondary)]">Use cases</a>
            <Link
              href="/auth/login"
              className="rounded-md bg-[var(--c-bank)] text-white px-4 py-2 font-medium hover:bg-[var(--c-secondary)] transition"
            >
              Log in
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden rounded-md p-2 text-[var(--c-primary)] hover:bg-[var(--c-secondary)]/10"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="fixed inset-0 bg-[var(--c-bank)] text-white flex flex-col items-center justify-center gap-6 text-lg font-medium">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-5 right-5 rounded-full bg-white/10 p-2"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#usecases" onClick={() => setMenuOpen(false)}>Use cases</a>
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-md bg-white text-[var(--c-primary)] px-6 py-3 font-semibold hover:bg-[var(--c-accent)] hover:text-white transition"
            >
              Log in
            </Link>
          </div>
        )}
      </header>

      {/* ===== MAIN ===== */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===== HERO ===== */}
        <section className="py-24 text-center flex flex-col items-center gap-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--c-primary)]"
          >
            Smart vouchers for modern stores
          </motion.h1>

          <p className="text-base sm:text-lg text-[var(--c-text)]/80 max-w-[45ch]">
            Create, gift, and redeem Tayseer vouchers in seconds — trusted by merchants and loved by customers.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--c-primary)] text-white px-6 py-3 font-semibold hover:bg-[var(--c-secondary)] transition"
            >
              Get Started <ArrowRight size={18} />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 border border-[var(--c-secondary)] text-[var(--c-secondary)] hover:bg-[var(--c-secondary)] hover:text-white transition"
            >
              Learn more
            </a>
          </div>
        </section>

        {/* ===== HOW ===== */}
        <section id="how" className="py-20 border-t border-[var(--c-secondary)]/10">
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--c-primary)] text-center mb-10">
            How Tayseer works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step icon={<Sparkles className="text-[var(--c-secondary)]" />} title="1. Create" text="Add buyer name, amount, and expiry. Tayseer generates a QR instantly." />
            <Step icon={<QrCode className="text-[var(--c-bank)]" />} title="2. Redeem" text="Customers show the QR at checkout. The balance updates automatically." />
            <Step icon={<ShieldCheck className="text-[var(--c-accent)]" />} title="3. Track" text="See all vouchers, redemptions, and reports in your merchant dashboard." />
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" className="py-20 bg-[var(--section-bg)] rounded-3xl px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--c-primary)] text-center mb-12">
            Why merchants choose Tayseer
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Feature color="var(--c-bank)" title="Multi-role access">
              Give permissions to owners, managers, and cashiers separately.
            </Feature>
            <Feature color="var(--c-secondary)" title="Instant QR redemption">
              Fast scan-based redemptions — no manual codes or delays.
            </Feature>
            <Feature color="var(--c-accent)" title="Promotions made easy">
              Run seasonal offers like Ramadan or Back-to-School campaigns.
            </Feature>
            <Feature color="var(--c-primary)" title="Full transparency">
              Every voucher action is logged for security and audits.
            </Feature>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="py-20 text-center">
          <div className="bg-[var(--c-primary)] text-white rounded-3xl py-12 px-6 md:px-12 shadow-md">
            <h3 className="text-2xl font-semibold mb-3">Start issuing vouchers today</h3>
            <p className="text-white/80 mb-8">Join Tayseer and grow your customer loyalty effortlessly.</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 bg-[var(--c-accent)] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#c53e00] transition"
            >
              Log in to Dashboard <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="py-10 text-[var(--c-text)]/70 text-sm border-t border-[var(--c-secondary)]/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Tayseer. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a className="hover:text-[var(--c-secondary)]" href="#">Privacy</a>
              <a className="hover:text-[var(--c-secondary)]" href="#">Terms</a>
              <a className="hover:text-[var(--c-secondary)]" href="#">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

/* ===== Components ===== */
function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="p-6 rounded-xl border border-[var(--c-secondary)]/10 bg-white text-center shadow-sm hover:shadow-md transition">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="font-semibold text-[var(--c-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--c-text)]/70">{text}</p>
    </div>
  )
}

function Feature({ title, children, color }: { title: string; children: React.ReactNode; color: string }) {
  return (
    <div className="p-6 rounded-xl border border-[var(--c-secondary)]/10 bg-white shadow-sm hover:shadow-md transition">
      <h4 className="font-semibold mb-2" style={{ color }}>{title}</h4>
      <p className="text-sm text-[var(--c-text)]/80">{children}</p>
    </div>
  )
}

/* ===== 🎨 Optimized Palette Usage ===== */
const paletteVars: React.CSSProperties = {
  ['--bg' as any]: '#F2F3F4',
  ['--section-bg' as any]: '#EBEAED',
  ['--c-primary' as any]: '#020035',
  ['--c-secondary' as any]: '#02066F',
  ['--c-bank' as any]: '#2000B1',
  ['--c-accent' as any]: '#ED4B00',
  ['--c-text' as any]: '#1A1A1A',
}
