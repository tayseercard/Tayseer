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
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import { WILAYAS } from '@/lib/algeria'
import { toast } from 'sonner'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SignupPage() {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [plans, setPlans] = useState<any[]>([])

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
                // Default to popular or first plan
                const popular = data.find(p => p.is_popular)
                setFormData(prev => ({ ...prev, planId: popular ? popular.id : data[0].id }))
            }
        }
        loadPlans()
    }, [])

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
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 sm:p-6" style={paletteVars}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-[var(--c-primary)]/5 overflow-hidden"
            >
                {/* Content Area */}
                <div className="p-8 sm:p-10">
                    <AnimatePresence mode="wait">
                        {!success ? (
                            <motion.div
                                key="signup-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-[var(--c-primary)]">Commencer</h1>
                                    <p className="text-gray-500 text-sm mt-1">Créez votre compte propriétaire de boutique</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Store Name */}
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

                                        {/* Full Name */}
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
                                    </div>

                                    {/* Email */}
                                    <div className="relative">
                                        <Mail className={iconClasses} />
                                        <input
                                            type="email"
                                            placeholder="Adresse email"
                                            required
                                            className={inputClasses}
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="relative">
                                        <Lock className={iconClasses} />
                                        <input
                                            type="password"
                                            placeholder="Mot de passe"
                                            required
                                            minLength={8}
                                            className={inputClasses}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Phone */}
                                        <div className="relative">
                                            <Phone className={iconClasses} />
                                            <input
                                                type="tel"
                                                placeholder="Numéro de téléphone"
                                                className={inputClasses}
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>

                                        {/* Wilaya */}
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
                                    </div>

                                    {/* Plan Selection */}
                                    <div className="space-y-3 pt-2">
                                        <label className="text-sm font-medium text-gray-700 block">Choisissez votre pack de départ</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {plans.map((plan) => (
                                                <div
                                                    key={plan.id}
                                                    onClick={() => setFormData({ ...formData, planId: plan.id })}
                                                    className={`relative cursor-pointer rounded-xl border p-4 transition-all ${formData.planId === plan.id
                                                        ? 'border-[var(--c-accent)] bg-[var(--c-accent)]/5 ring-1 ring-[var(--c-accent)]'
                                                        : 'border-gray-200 hover:border-[var(--c-secondary)]/30 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {plan.is_popular && (
                                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--c-accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                            Populaire
                                                        </span>
                                                    )}
                                                    <div className="flex flex-col items-center text-center gap-1">
                                                        <span className={`text-sm font-bold ${formData.planId === plan.id ? 'text-[var(--c-accent)]' : 'text-[var(--c-primary)]'}`}>
                                                            {plan.quantity} QR
                                                        </span>
                                                        <span className="text-xs text-gray-500">{plan.price_per_unit} DA/unité</span>
                                                        <span className="text-sm font-bold text-[var(--c-primary)] mt-1">
                                                            {plan.total_price.toLocaleString()} DA
                                                        </span>
                                                    </div>
                                                    {formData.planId === plan.id && (
                                                        <div className="absolute top-2 right-2 text-[var(--c-accent)]">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[var(--c-primary)] text-white rounded-xl py-3 font-semibold hover:bg-[var(--c-secondary)] transition-all flex items-center justify-center gap-2 mt-6 group disabled:opacity-70"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Créer mon compte
                                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <div className="text-center mt-6">
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
