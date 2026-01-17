'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Loader2, ArrowRight } from 'lucide-react'

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage('Mot de passe mis à jour ! Redirection vers la connexion...')
      setTimeout(() => router.replace('/auth/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--c-accent)] focus:border-transparent transition-all outline-none text-sm"
  const iconClasses = "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4" style={paletteVars}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-[var(--c-primary)]/5 border border-[var(--c-primary)]/5">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-[var(--c-primary)]">Réinitialiser le mot de passe</h1>
            <p className="text-gray-500 text-sm mt-1">Choisissez votre nouveau mot de passe</p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            <div className="relative">
              <Lock className={iconClasses} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                required
                minLength={8}
                className={inputClasses}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--c-primary)] text-white rounded-xl py-3 font-semibold hover:bg-[var(--c-secondary)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Mettre à jour
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Alert Messages */}
          <div className="mt-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center"
              >
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-medium text-center"
              >
                {message}
              </motion.div>
            )}
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
