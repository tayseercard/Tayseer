'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  QrCode,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  Package,
  Facebook,
  Instagram,
  Mail,
  CheckCircle2,
  CreditCard,
  Menu,
  ChevronRight,
  Star,
  Twitter,
  Linkedin,
  Globe,
  TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// --- Types & Defaults ---
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
  const [termsOpen, setTermsOpen] = useState(false)
  const [termsContent, setTermsContent] = useState('')
  const [plans, setPlans] = useState<any[]>([])
  const [socials, setSocials] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  async function handleOpenTerms() {
    setTermsOpen(true)
    setTermsContent('Chargement...')
    try {
      const { data, error } = await supabase.storage.from('logos').download('terms.txt')
      if (data) {
        setTermsContent(await data.text())
      } else {
        setTermsContent('Aucune condition d\'utilisation n\'est actuellement disponible.')
      }
    } catch {
      setTermsContent('Erreur lors du chargement.')
    }
  }

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
    async function loadSocials() {
      try {
        const { data, error } = await supabase.storage.from('logos').download('socials.json')
        if (data) {
          const text = await data.text()
          if (text) {
            setSocials(JSON.parse(text))
          }
        }
      } catch (err) {
        console.error("Failed to load socials", err)
      }
    }
    loadPlans()
    loadSocials()
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#ED4B00] selection:text-white overflow-x-hidden">

      {/* ===== HEADER ===== */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-9 w-9 bg-[#020035] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-900/20">
              T
            </div>
            <span className="text-xl font-bold text-[#020035] tracking-tight">tayseer</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#020035] transition">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-[#020035] transition">Tarifs</a>
            <a href="#trust" className="hover:text-[#020035] transition">Témoignages</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-bold text-[#020035] hover:text-[#ED4B00] transition">
              Connexion
            </Link>
            <Link
              href="/auth/signup"
              className="bg-[#020035] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#ED4B00] hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300"
            >
              Créer un compte
            </Link>
          </div>

          <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 text-slate-800">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#020035] text-white flex flex-col items-center justify-center gap-8 text-xl font-medium animate-fade-in">
          <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <a href="#features" onClick={() => setMenuOpen(false)}>Fonctionnalités</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Tarifs</a>
          <div className="flex flex-col gap-4 mt-8 w-full px-12">
            <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="w-full bg-white text-[#020035] py-4 rounded-xl text-center font-bold">Inscrivez-vous</Link>
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="w-full border border-white/20 py-4 rounded-xl text-center">Connexion</Link>
          </div>
        </div>
      )}

      {/* Terms Overlay */}
      {termsOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ pointerEvents: 'auto' }}
          onClick={() => setTermsOpen(false)}
        >
          <div
            className="bg-white text-slate-800 rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl relative"
            style={{ maxHeight: '90vh', pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0 rounded-t-3xl">
              <h2 className="text-xl font-black text-[#020035]">Conditions d'utilisation</h2>
              <button onClick={() => setTermsOpen(false)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 border border-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="p-6 sm:p-8 text-slate-600 bg-white overflow-x-hidden"
              style={{ overflowY: 'auto', flex: '1 1 auto', overscrollBehavior: 'contain' }}
            >
              <div className="whitespace-pre-wrap break-words font-medium leading-relaxed pb-4 w-full">
                {termsContent}
              </div>
            </div>

          </div>
        </div>
      )}

      <main className="pt-24">
        {/* ===== HERO ===== */}
        <section className="relative pt-10 pb-20 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[1000px] -z-10 rounded-[100%] bg-gradient-to-b from-indigo-50/80 via-white to-white blur-3xl opacity-60" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[100px] -z-10" />
          <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px] -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#020035] text-xs font-bold uppercase tracking-wider mb-6">
                <Star className="w-3 h-3 text-[#ED4B00] fill-[#ED4B00]" />
                La Solution #1 en Algérie
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#020035] leading-[1.1] mb-6">
                Gérez vos <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#020035] to-[#ED4B00]">Vouchers</span> & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ED4B00] to-[#E52E2E]">Fidélité</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
                Tayseer aide les commerçants à créer, distribuer et scanner des bons d'achat en quelques secondes. Une solution tout-en-un pour votre croissance.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <Link
                  href="/auth/signup"
                  className="bg-[#020035] text-white h-14 px-8 rounded-2xl flex items-center gap-3 font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#020035]/20"
                >
                  Commencer
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#how"
                  className="h-14 px-8 rounded-2xl flex items-center gap-3 font-bold text-slate-600 hover:bg-slate-50 transition border border-slate-200"
                >
                  En savoir plus
                </Link>
              </div>

              <div className="mt-10 flex items-center justify-center md:justify-start gap-6 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                <p className="text-sm font-semibold text-slate-400">Ils nous font confiance</p>
                <div className="h-8 w-24 bg-slate-200/50 rounded animate-pulse" />
                <div className="h-8 w-24 bg-slate-200/50 rounded animate-pulse" />
              </div>
            </motion.div>

            {/* Right Content (Phone Mockup) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center"
            >
              {/* Floating Element 1 - Top Left */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 left-0 md:-left-10 bg-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-3 z-20"
              >
                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Succès</p>
                  <p className="text-sm font-bold text-slate-800">QR Code Validé</p>
                </div>
              </motion.div>

              {/* Floating Element 2 - Bottom Right */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 right-0 md:-right-4 bg-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-3 z-20"
              >
                <div className="bg-orange-100 p-2 rounded-full text-[#ED4B00]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Revenus</p>
                  <p className="text-sm font-bold text-slate-800">+ 125,000 DA</p>
                </div>
              </motion.div>

              {/* Phone Container */}
              <div className="relative w-[300px] h-[600px] border-8 border-slate-900 rounded-[50px] overflow-hidden shadow-2xl bg-[#020035]">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-40 mx-auto z-10" />

                {/* App UI Mockup Inside Phone */}
                <div className="w-full h-full bg-slate-50 flex flex-col pt-10 px-4 relative">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-lg font-black text-[#020035]">Dashboard</div>
                    <div className="w-8 h-8 rounded-full bg-slate-200" />
                  </div>

                  {/* Stats Card */}
                  <div className="bg-gradient-to-br from-[#020035] to-[#0a0555] rounded-2xl p-4 text-white shadow-lg shadow-indigo-900/30 mb-6 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                    <div className="text-white/60 text-xs mb-1">Total Ventes</div>
                    <div className="text-3xl font-bold">45,200 DA</div>
                    <div className="mt-4 flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">QR</div>
                      <div className="flex-1" />
                      <div className="text-xs bg-white/20 px-2 py-1 rounded-lg">+12%</div>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex gap-2 mb-4 overflow-hidden">
                    <div className="px-4 py-1.5 rounded-full bg-[#ED4B00] text-white text-xs font-bold shadow-md shadow-orange-500/20">Tous</div>
                    <div className="px-4 py-1.5 rounded-full bg-white text-slate-500 text-xs font-bold border border-slate-100">Actifs</div>
                    <div className="px-4 py-1.5 rounded-full bg-white text-slate-500 text-xs font-bold border border-slate-100">Consommés</div>
                  </div>

                  {/* List */}
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">🛍️</div>
                          <div>
                            <div className="h-3 w-24 bg-slate-200 rounded mb-1.5" />
                            <div className="h-2 w-16 bg-slate-100 rounded" />
                          </div>
                        </div>
                        <div className="font-bold text-[#020035]">500 DA</div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Nav */}
                  <div className="absolute bottom-4 inset-x-4 bg-white/90 backdrop-blur rounded-2xl p-4 flex justify-around shadow-lg border border-slate-100/50">
                    <div className="w-6 h-6 rounded bg-[#ED4B00]/20" />
                    <div className="w-6 h-6 rounded bg-slate-100" />
                    <div className="w-6 h-6 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===== FEATURES ("Everything You Need") ===== */}
        <section id="features" className="py-24 bg-slate-50/50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-[#020035] mb-6">
                Tout ce dont vous avez besoin. <br />
                <span className="text-slate-400">Rien de superflu.</span>
              </h2>
              <p className="text-lg text-slate-600">
                Une plateforme pensée pour l'efficacité. Gérez vos campagnes promotionnelles sans complexité technique.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Left Column */}
              <div className="space-y-8">
                <FeatureCard
                  icon={<Zap className="text-[#ED4B00]" />}
                  title="Génération Instantanée"
                  desc="Créez des milliers de QR codes uniques en quelques clics. Prêts à être imprimés ou partagés."
                />
                <FeatureCard
                  icon={<CreditCard className="text-blue-600" />}
                  title="Paiement Flexible"
                  desc="Modifiez les soldes en temps réel. Acceptez des paiements partiels sur les vouchers."
                />
              </div>

              {/* Center Phone */}
              <div className="relative mx-auto flex justify-center py-10 md:py-0">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-100/50 to-orange-50/50 rounded-full blur-[80px] -z-10" />
                {/* Simplified Center Image */}
                <div className="relative w-[280px] h-[550px] bg-white rounded-[40px] shadow-2xl border-4 border-white overflow-hidden flex flex-col">
                  <div className="bg-[#020035] p-8 text-white h-2/5 flex flex-col justify-center items-center text-center">
                    <QrCode className="w-20 h-20 mb-4 opacity-90" />
                    <h3 className="font-bold text-xl">Scan & Go</h3>
                    <p className="text-sm opacity-70">Validation ultra-rapide</p>
                  </div>
                  <div className="h-3/5 bg-slate-50 p-6 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-slate-800">Coupon #883</span>
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 rounded">Valide</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full mb-2">
                        <div className="w-3/4 bg-[#020035] h-2 rounded-full" />
                      </div>
                      <div className="text-xs text-slate-400">Reste: 2500 DA</div>
                    </div>
                    <button className="w-full bg-[#ED4B00] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20">
                      Scanner un autre
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <FeatureCard
                  icon={<TrendingUp className="text-emerald-600" />}
                  title="Suivi & Analytics"
                  desc="Visualisez vos ventes et l'utilisation des bons en temps réel via un tableau de bord intuitif."
                />
                <FeatureCard
                  icon={<ShieldCheck className="text-indigo-600" />}
                  title="100% Sécurisé"
                  desc="Chaque QR code est unique et infalsifiable. Protégez votre chiffre d'affaires."
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section id="pricing" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-[#020035] mb-4">Nos Packs</h2>
              <p className="text-slate-500 max-w-lg mx-auto">Choisissez la quantité qui correspond à votre volume de vente.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {loading ? (
                <div className="col-span-full py-20 text-center text-slate-400">Chargement des tarifs...</div>
              ) : (
                (plans.length > 0 ? plans : defaultPlans).map(plan => (
                  <div key={plan.id} className={`group relative p-8 rounded-3xl transition-all duration-300 ${plan.is_popular ? 'bg-[#020035] text-white shadow-2xl scale-105 z-10' : 'bg-slate-50 text-slate-800 hover:bg-white hover:shadow-xl border border-slate-100'}`}>
                    {plan.is_popular && (
                      <div className="absolute top-0 right-0 bg-[#ED4B00] text-white text-xs font-bold px-4 py-2 rounded-bl-2xl rounded-tr-2xl uppercase tracking-wider">
                        Populaire
                      </div>
                    )}

                    <h3 className={`text-xl font-bold mb-2 ${plan.is_popular ? 'text-white' : 'text-[#020035]'}`}>{plan.name}</h3>
                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${plan.is_popular ? 'text-[#ED4B00]' : 'text-slate-400'}`}>
                      {plan.quantity} Vouchers
                    </div>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-black">{plan.quantity * plan.price_per_unit} <span className="text-lg">DA</span></span>
                    </div>

                    <div className={`h-px w-full mb-6 ${plan.is_popular ? 'bg-white/10' : 'bg-slate-200'}`} />

                    <ul className="space-y-4 mb-8">
                      <li className={`flex items-start gap-3 text-sm font-black ${plan.is_popular ? 'text-white' : 'text-[#020035]'}`}>
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.is_popular ? 'text-[#ED4B00]' : 'text-emerald-500'}`} />
                        {plan.quantity} Vouchers (QR Codes)
                      </li>
                      {(typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || [])).map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium opacity-80">
                          <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.is_popular ? 'text-[#ED4B00]' : 'text-emerald-500'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/auth/signup"
                      className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${plan.is_popular
                        ? 'bg-white text-[#020035] hover:bg-slate-100'
                        : 'bg-[#020035] text-white hover:bg-[#ED4B00]'
                        }`}
                    >
                      Choisir ce pack
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ===== CTA CARD ===== */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto rounded-[3rem] bg-gradient-to-r from-[#020035] to-[#1a1566] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-indigo-900/30">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ED4B00] rounded-full blur-[150px] opacity-20 -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[150px] opacity-20 -ml-20 -mb-20 pointer-events-none" />

            <h2 className="relative text-3xl md:text-5xl font-black text-white mb-6">Prêt à transformer votre business ?</h2>
            <p className="relative text-lg text-indigo-100 mb-10 max-w-2xl mx-auto">
              Rejoignez des centaines de commerçants qui utilisent Tayseer pour fidéliser leurs clients. Inscription gratuite et rapide.
            </p>

            <div className="relative flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/signup" className="bg-white text-[#020035] px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-white/20 transition-all flex items-center justify-center gap-2">
                Créer mon compte
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="bg-[#0b0a1f] text-slate-400 py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6 text-white">
                <span className="text-2xl font-bold">tayseer</span>
              </Link>
              <p className="text-sm leading-relaxed mb-6">
                La plateforme de gestion de vouchers nouvelle génération. Simple, puissante et conçue pour l'Algérie.
              </p>
              <div className="flex gap-4">
                {socials.facebook && <SocialIcon href={socials.facebook} icon={<Facebook className="w-5 h-5" />} />}
                {socials.instagram && <SocialIcon href={socials.instagram} icon={<Instagram className="w-5 h-5" />} />}
                {socials.twitter && <SocialIcon href={socials.twitter} icon={<Twitter className="w-5 h-5" />} />}
                {socials.linkedin && <SocialIcon href={socials.linkedin} icon={<Linkedin className="w-5 h-5" />} />}
                {socials.website && <SocialIcon href={socials.website} icon={<Globe className="w-5 h-5" />} />}

                {/* Fallbacks if none are set */}
                {!socials.facebook && !socials.instagram && !socials.twitter && !socials.linkedin && !socials.website && (
                  <>
                    <SocialIcon href="#" icon={<Facebook className="w-5 h-5" />} />
                    <SocialIcon href="#" icon={<Instagram className="w-5 h-5" />} />
                  </>
                )}
                <SocialIcon href="mailto:contact@tayseer.dz" icon={<Mail className="w-5 h-5" />} />
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Liens Rapides</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white transition">Accueil</a></li>
                <li><a href="#features" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Tarifs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Ressources</h4>
              <ul className="space-y-4 text-sm">
                <li><button onClick={(e) => { e.preventDefault(); handleOpenTerms(); }} className="hover:text-white transition">Conditions d'utilisation</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Newsletter</h4>
              <p className="text-xs mb-4">Restez informé de nos nouveautés.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-white/30" />
                <button className="bg-[#ED4B00] text-white p-2 rounded-lg hover:bg-orange-600 transition">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 pt-8 mt-12 border-t border-white/5 text-center text-xs">
            &copy; {new Date().getFullYear()} Tayseer Card. Made with ❤️ in Algeria.
          </div>
        </footer>

      </main>
    </div>
  )
}

// --- Subcomponents ---

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-[#020035] text-lg mb-2">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function SocialIcon({ icon, href = '#' }: { icon: React.ReactNode, href?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 hover:text-white transition">
      {icon}
    </a>
  )
}
