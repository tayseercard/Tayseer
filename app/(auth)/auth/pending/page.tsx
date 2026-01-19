'use client'

import { motion } from 'framer-motion'
import { Clock, ShieldAlert, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
    const supabase = createClientComponentClient()
    const router = useRouter()
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4" style={paletteVars}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-[var(--c-primary)]/5 border border-[var(--c-primary)]/5 text-center">
                    <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="h-10 w-10 text-amber-500 animate-pulse" />
                    </div>

                    <h1 className="text-2xl font-bold text-[var(--c-primary)] mb-4">Compte en attente d'activation</h1>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Votre boutique a été créée avec succès ! Un administrateur doit maintenant valider votre payement et activer votre compte, on vous contactera sur le <span className="font-bold text-[var(--c-primary)]">05 52 30 76 34</span>.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-start gap-4 text-left">
                            <ShieldAlert className="h-6 w-6 text-[var(--c-accent)] shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Délai habituel</p>
                                <p className="text-xs text-gray-500">L'activation prend généralement moins de 24 heures (jours ouvrables).</p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl flex items-start gap-4 text-left">
                            <Mail className="h-6 w-6 text-[var(--c-bank)] shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Besoin d'aide ?</p>
                                <p className="text-xs text-gray-500">Contactez notre support si vous avez des questions concernant votre inscription.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100">
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut()
                                router.replace('/')
                            }}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] hover:text-[var(--c-accent)] transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Déconnexion et retour à l'accueil
                        </button>
                    </div>
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
