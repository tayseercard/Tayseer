'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { QrCode, ShieldCheck, Sparkles, ArrowRight, X, Package, Facebook, Instagram, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const defaultPlans = [
  {
    id: 'starter',
    name: 'Pack Starter',
    quantity: 100,
    price_per_unit: 50,
    is_popular: false,
    features: ['Idéal pour démarrer', 'Support par email', 'Validité illimitée']
  },
  {
    id: 'popular',
    name: 'Pack Populaire',
    quantity: 500,
    price_per_unit: 40,
    is_popular: true,
    features: ['Le plus populaire', 'Support prioritaire', 'Validité illimitée', 'Badge commerçant vérifié']
  },
  {
    id: 'enterprise',
    name: 'Pack Enterprise',
    quantity: 1000,
    price_per_unit: 35,
    is_popular: false,
    features: ['Pour les grands volumes', 'Support dédié 24/7', 'Validité illimitée', 'Personnalisation avancée']
  }
]

export default function TayseerLanding() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .order('quantity', { ascending: true })

        if (!error && data && data.length > 0) {
          setPlans(data)
        }
      } catch (err) {
        console.error("Failed to load plans", err)
      } finally {
        setLoading(false)
      }
    }
    loadPlans()
  }, [])

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)] text-[var(--c-text)]" style={paletteVars}>
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[var(--c-primary)]/20">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-md overflow-hidden">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/icon-192.png`}
                alt="Tayseer Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-lg font-semibold tracking-wide text-[var(--c-primary)]">
              tayseer
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="hover:text-[var(--c-secondary)]">Fonctionnement</a>
            <Link
              href="/auth/signup"
              className="rounded-md border border-[var(--c-primary)] text-[var(--c-primary)] px-4 py-2 font-medium hover:bg-[var(--c-primary)] hover:text-white transition"
            >
              S'inscrire
            </Link>
            <Link
              href="/auth/login"
              className="rounded-md bg-[var(--c-bank)] text-white px-4 py-2 font-medium hover:bg-[var(--c-secondary)] transition"
            >
              Se connecter
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
            <a href="#how" onClick={() => setMenuOpen(false)}>Fonctionnement</a>
            <Link
              href="/auth/signup"
              onClick={() => setMenuOpen(false)}
              className="rounded-md border border-white text-white px-6 py-3 font-semibold hover:bg-white hover:text-[var(--c-primary)] transition"
            >
              S'inscrire
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-md bg-white text-[var(--c-primary)] px-6 py-3 font-semibold hover:bg-[var(--c-accent)] hover:text-white transition"
            >
              Se connecter
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
            Bons d'achat intelligents pour les magasins modernes
          </motion.h1>

          <p className="text-base sm:text-lg text-[var(--c-text)]/80 max-w-[45ch]">
            Créez, offrez et utilisez des bons Tayseer en quelques secondes — approuvé par les commerçants et adoré par les clients.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--c-primary)] text-white px-6 py-3 font-semibold hover:bg-[var(--c-secondary)] transition"
            >
              Lancez votre boutique <ArrowRight size={18} />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--c-accent)] text-white px-6 py-3 font-semibold hover:bg-[#c53e00] transition"
            >
              Se connecter
            </Link>
          </div>
        </section>

        {/* ===== HOW ===== */}
        <section id="how" className="py-20 border-t border-[var(--c-secondary)]/10">
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--c-primary)] text-center mb-10">
            Comment fonctionne Tayseer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step icon={<Sparkles className="text-[var(--c-secondary)]" />} title="1. Créer" text="Ajoutez le nom de l'acheteur, le montant et l'expiration. Tayseer génère un QR code instantanément." />
            <Step icon={<QrCode className="text-[var(--c-bank)]" />} title="2. Utiliser" text="Les clients présentent le QR code à la caisse. Le solde est mis à jour automatiquement." />
            <Step icon={<ShieldCheck className="text-[var(--c-accent)]" />} title="3. Suivre" text="Consultez tous les bons, les utilisations et les rapports dans votre tableau de bord commerçant." />
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section id="pricing" className="py-20 border-t border-[var(--c-secondary)]/10">
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--c-primary)] text-center mb-4">
            Nos Packs QR Codes
          </h2>
          <p className="text-center text-[var(--c-text)]/70 mb-10 max-w-2xl mx-auto">
            Des tarifs dégressifs adaptés à vos besoins. Plus vous achetez, moins vous payez.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-[var(--c-text)]/60">
                Chargement des plans...
              </div>
            ) : (
              (plans.length > 0 ? plans : defaultPlans).map((plan) => (
                <PricingCard
                  key={plan.id}
                  quantity={plan.quantity}
                  name={plan.name}
                  pricePerUnit={plan.price_per_unit}
                  isPopular={plan.is_popular}
                  features={typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || [])}
                />
              ))
            )}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="py-20 text-center">
          <div className="bg-[var(--c-primary)] text-white rounded-3xl py-12 px-6 md:px-12 shadow-md">
            <h3 className="text-2xl font-semibold mb-3">Commencez à émettre des bons dès aujourd'hui</h3>
            <p className="text-white/80 mb-8">Rejoignez Tayseer et développez la fidélité de vos clients sans effort.</p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-[var(--c-accent)] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#c53e00] transition"
            >
              Créer votre compte boutique <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="py-16 bg-[#020035] text-white/80 text-sm border-t border-[var(--c-secondary)]/10 text-center md:text-left">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand column */}
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold text-white block mb-4">tayseer</span>
              <p className="mb-6 max-w-xs text-white/60">La solution de fidélité simplifiée pour les commerces modernes.</p>
              <div className="flex gap-3">
                <a href="#" className="p-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white transition group">
                  <Facebook size={18} />
                </a>
                <a href="#" className="p-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-[#E4405F] hover:border-[#E4405F] hover:text-white transition group">
                  <Instagram size={18} />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Société</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-[var(--c-accent)] transition">À propos</a></li>
                <li><a href="#" className="hover:text-[var(--c-accent)] transition">Carrières</a></li>
                <li><a href="#" className="hover:text-[var(--c-accent)] transition">Blog</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Légal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-[var(--c-accent)] transition">Confidentialité</a></li>
                <li><a href="#" className="hover:text-[var(--c-accent)] transition">Conditions</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-wider">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Mail size={16} className="text-[var(--c-accent)]" />
                  <a href="mailto:tayseercard@gmail.com" className="hover:text-[var(--c-accent)] transition font-medium">contact@tayseer.dz</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Tayseercard. Tous droits réservés.</p>
            <p>Fait avec ❤️ en Algérie</p>
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

function PricingCard({
  quantity,
  name,
  pricePerUnit,
  isPopular,
  features,
}: {
  quantity: number
  name?: string
  pricePerUnit: number
  isPopular: boolean
  features: string[]
}) {
  const totalPrice = quantity * pricePerUnit

  return (
    <div className={`relative p-6 rounded-2xl border ${isPopular ? 'border-[var(--c-accent)] shadow-lg scale-105 bg-white' : 'border-[var(--c-secondary)]/10 bg-white/50 shadow-sm'} flex flex-col items-center text-center transition hover:shadow-md`}>
      {isPopular && (
        <span className="absolute -top-3 bg-[var(--c-accent)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Populaire
        </span>
      )}

      <div className="mb-4 p-3 rounded-full bg-[var(--c-primary)]/5">
        <Package className={`h-8 w-8 ${isPopular ? 'text-[var(--c-accent)]' : 'text-[var(--c-primary)]'}`} />
      </div>

      <h3 className="text-xl font-bold text-[var(--c-primary)] mb-1">{name || `Pack ${quantity} QR`}</h3>
      <p className="text-sm font-semibold text-[var(--c-accent)] mb-2 flex items-center justify-center gap-1">
        <Package className="h-4 w-4" />
        {quantity} QR
      </p>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-[var(--c-primary)]">{totalPrice.toLocaleString()} DA</span>
      </div>
      <p className="text-sm text-[var(--c-text)]/60 mb-6 font-medium">soit {pricePerUnit} DA / QR code</p>

      <ul className="space-y-3 mb-8 text-sm text-[var(--c-text)]/80 w-full">
        {features.map((feat, i) => (
          <li key={i} className="flex items-center gap-2 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-secondary)]" />
            {feat}
          </li>
        ))}
      </ul>

      <Link
        href="/auth/signup"
        className={`w-full py-2.5 rounded-xl font-semibold transition ${isPopular
          ? 'bg-[var(--c-accent)] text-white hover:bg-[#c53e00]'
          : 'bg-[var(--c-primary)] text-white hover:bg-[var(--c-secondary)]'
          }`}
      >
        Choisir ce pack
      </Link>
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
