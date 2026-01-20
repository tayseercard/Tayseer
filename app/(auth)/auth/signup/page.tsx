'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Store,
    User,
    Mail,
    Lock,
    Phone,
    MapPin,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Home
} from 'lucide-react'
import { WILAYAS } from '@/lib/algeria'
import { toast } from 'sonner'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SignupPage() {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [plans, setPlans] = useState<any[]>([])

    // Step state: 1 = Identity, 2 = Store, 3 = Plan
    const [step, setStep] = useState(1)

    const [formData, setFormData] = useState({
        storeName: '',
        fullName: '',
        email: '',
        password: '',
        phone: '',
        wilaya: '',
        planId: ''
    })

    useEffect(() => {
        async function loadPlans() {
            const { data } = await supabase
                .from('plans')
                .select('*')
                .order('quantity', { ascending: true })

            if (data && data.length > 0) {
                setPlans(data)
            }
        }
        loadPlans()
    }, [])

    async function checkEmail(email: string) {
        if (!email || !email.includes('@')) return

        try {
            const res = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            const data = await res.json()
            if (data.exists) {
                setEmailError('Cet email est déjà utilisé.')
            } else {
                setEmailError(null)
            }
        } catch (e) {
            console.error(e)
        }
    }

    function goNext() {
        if (step === 1) {
            if (!formData.fullName || !formData.email || !formData.password || formData.password.length < 6) {
                toast.error('Veuillez remplir tous les champs correctement.')
                return
            }
            if (emailError) {
                toast.error('Veuillez utiliser un autre email.')
                return
            }
        }
        if (step === 2) {
            if (!formData.storeName || !formData.phone || !formData.wilaya) {
                toast.error('Veuillez remplir tous les champs de la boutique.')
                return
            }
        }
        setStep(prev => prev + 1)
    }

    function goBack() {
        setStep(prev => prev - 1)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const resp = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await resp.json()

            if (!resp.ok) {
                throw new Error(data.error || 'Erreur lors de l\'inscription')
            }

            setSuccess(true)
            toast.success('Compte créé avec succès !')

            setTimeout(() => {
                router.push('/auth/login')
            }, 3000)

        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--c-accent)] focus:border-transparent transition-all outline-none text-sm";
    const iconClasses = "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#020035] to-[#1a1566] p-4 sm:p-6 relative overflow-hidden" style={paletteVars}>
            {/* Background Blobs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ED4B00] rounded-full blur-[150px] opacity-20 -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[150px] opacity-20 -ml-20 -mb-20 pointer-events-none" />

            {/* Home Button */}
            <Link
                href="/"
                className="absolute top-6 left-6 p-2.5 rounded-xl bg-transparent text-white border border-white/20 hover:bg-white/10 transition-all duration-300 group z-10"
            >
                <Home size={20} className="group-hover:scale-110 transition-transform" />
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-[var(--c-primary)]/5 overflow-hidden z-10"
            >
                {/* Content Area */}
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {!success ? (
                            <motion.div
                                key="signup-form"
                            >
                                <div className="mb-6 text-center">
                                    <h1 className="text-2xl font-bold text-[var(--c-primary)]">
                                        {step === 1 && "Créer un compte"}
                                        {step === 2 && "Votre Boutique"}
                                        {step === 3 && "Sélection du Pack"}
                                    </h1>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Étape {step} sur 3
                                    </p>
                                    <div className="flex gap-1 justify-center mt-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-[var(--c-accent)]' : 'bg-gray-100'}`} />
                                        ))}
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <AnimatePresence mode="wait">
                                        {step === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-4"
                                            >
                                                <div className="relative">
                                                    <User className={iconClasses} />
                                                    <input
                                                        type="text"
                                                        placeholder="Votre nom complet"
                                                        required
                                                        className={inputClasses}
                                                        value={formData.fullName}
                                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Mail className={iconClasses} />
                                                    <input
                                                        type="email"
                                                        placeholder="Adresse email"
                                                        required
                                                        className={`${inputClasses} ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                        value={formData.email}
                                                        onChange={e => {
                                                            setFormData({ ...formData, email: e.target.value })
                                                            setEmailError(null)
                                                        }}
                                                        onBlur={() => checkEmail(formData.email)}
                                                    />
                                                    {emailError && (
                                                        <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                                                            <AlertCircle size={12} /> {emailError}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <Lock className={iconClasses} />
                                                    <input
                                                        type="password"
                                                        placeholder="Mot de passe"
                                                        required
                                                        minLength={6}
                                                        className={inputClasses}
                                                        value={formData.password}
                                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-4"
                                            >
                                                <div className="relative">
                                                    <Store className={iconClasses} />
                                                    <input
                                                        type="text"
                                                        placeholder="Nom de la boutique"
                                                        required
                                                        className={inputClasses}
                                                        value={formData.storeName}
                                                        onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Phone className={iconClasses} />
                                                    <input
                                                        type="tel"
                                                        placeholder="Numéro de téléphone"
                                                        required
                                                        className={inputClasses}
                                                        value={formData.phone}
                                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <MapPin className={iconClasses} />
                                                    <select
                                                        required
                                                        className={`${inputClasses} appearance-none cursor-pointer`}
                                                        value={formData.wilaya}
                                                        onChange={e => setFormData({ ...formData, wilaya: e.target.value })}
                                                    >
                                                        <option value="" disabled>Sélectionnez une Wilaya</option>
                                                        {WILAYAS.map(w => (
                                                            <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-3"
                                            >
                                                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {plans.map((plan) => (
                                                        <div
                                                            key={plan.id}
                                                            onClick={() => setFormData({ ...formData, planId: plan.id })}
                                                            className={`relative cursor-pointer rounded-xl border p-3 flex items-center justify-between transition-all ${formData.planId === plan.id
                                                                ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/5 ring-1 ring-[var(--c-accent)]'
                                                                : 'border-gray-100 hover:border-[var(--c-secondary)]/30 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className={`text-sm font-bold ${formData.planId === plan.id ? 'text-[var(--c-accent)]' : 'text-[var(--c-primary)]'}`}>
                                                                    Pack {plan.quantity} QR
                                                                </span>
                                                                <span className="text-xs text-gray-500">{plan.price_per_unit} DA/unité</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-sm font-bold text-[var(--c-primary)]">
                                                                    {plan.total_price.toLocaleString()} DA
                                                                </span>
                                                                {plan.is_popular && (
                                                                    <span className="text-[10px] font-bold text-[var(--c-accent)] bg-[var(--c-accent)]/10 px-1.5 py-0.5 rounded-full uppercase">
                                                                        Populaire
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex gap-3 pt-4">
                                        {step > 1 && (
                                            <button
                                                type="button"
                                                onClick={goBack}
                                                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                        )}
                                        <button
                                            type={step === 3 ? "submit" : "button"}
                                            onClick={step === 3 ? undefined : goNext}
                                            disabled={loading || (step === 3 && !formData.planId)}
                                            className="flex-1 bg-[var(--c-primary)] text-white rounded-xl py-3 font-semibold hover:bg-[var(--c-secondary)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : step === 3 ? (
                                                <>
                                                    Créer mon compte
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </>
                                            ) : (
                                                <>
                                                    Suivant
                                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="text-center pt-2">
                                        <p className="text-sm text-gray-500">
                                            Vous avez déjà un compte ?{' '}
                                            <Link href="/auth/login" className="text-[var(--c-accent)] font-semibold hover:underline">
                                                Se connecter
                                            </Link>
                                        </p>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success-message"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-[var(--c-primary)] mb-2">Inscription réussie !</h2>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    Votre compte propriétaire de boutique a été créé. Redirection vers la page de connexion...
                                </p>

                                <div className="mt-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-[var(--c-accent)] mx-auto" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}

const paletteVars: React.CSSProperties = {
    ['--bg' as any]: '#F2F3F4',
    ['--c-primary' as any]: '#020035',
    ['--c-secondary' as any]: '#02066F',
    ['--c-bank' as any]: '#2000B1',
    ['--c-accent' as any]: '#ED4B00',
    ['--c-text' as any]: '#1A1A1A',
}
