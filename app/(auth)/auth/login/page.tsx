'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { Lock, Mail, Loader2, ArrowRight, Store } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Chargement...</div>}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const params = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  const redirectTo = params.get('redirectTo') || '/superadmin'

  /* Auto-redirect if already logged in */
  useEffect(() => {
    ; (async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        const { data: roles } = await supabase
          .from('me_effective_role')
          .select('role')
          .eq('user_id', sessionData.session.user.id)

        const roleList = roles?.map((r) => r.role) || []
        if (roleList.includes('superadmin')) router.replace('/superadmin')
        else if (roleList.includes('admin')) router.replace('/admin')
        else if (roleList.includes('store_owner')) router.replace('/store')
        else if (roleList.includes('cashier')) router.replace('/cashier')
      }
    })()
  }, [supabase, router])

  /* Login handler */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResetMsg(null)

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (!signInData.user) throw new Error('Utilisateur non trouvé')

      if (signInData.session) {
        await fetch('/api/auth/set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
          }),
        })
      }

      const { data: roles, error: roleErr } = await supabase
        .from('me_effective_role')
        .select('role, store_id')
        .eq('user_id', signInData.user.id)

      if (roleErr) throw roleErr
      if (!roles || roles.length === 0) throw new Error('Aucun rôle assigné à cet utilisateur.')

      const roleList = roles.map((r) => r.role)
      const primaryRole = roles[0] // Assuming one main role relationship

      // Check store status for store-related roles
      if (['store_owner', 'admin', 'cashier'].some(r => roleList.includes(r)) && primaryRole.store_id) {
        const { data: store, error: storeErr } = await supabase
          .from('stores')
          .select('status')
          .eq('id', primaryRole.store_id)
          .single()

        if (!storeErr && store?.status === 'inactive') {
          router.replace('/auth/pending')
          return
        }
      }

      let destination = redirectTo

      if (roleList.includes('superadmin')) destination = '/superadmin'
      else if (roleList.includes('admin')) destination = '/admin'
      else if (roleList.includes('store_owner')) destination = '/store'
      else if (roleList.includes('cashier')) destination = '/cashier'

      await new Promise((resolve) => setTimeout(resolve, 400))
      window.location.href = destination
    } catch (err: any) {
      setError(err.message || 'La connexion a échoué')
    } finally {
      setLoading(false)
    }
  }

  /* Forgot password handler */
  async function handleForgotPassword() {
    if (!email) {
      setError('Veuillez d\'abord saisir votre email.')
      return
    }
    setError(null)
    setResetMsg(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setResetMsg('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.')
    } catch (err: any) {
      setError(err.message || 'Impossible d\'envoyer l\'email de réinitialisation.')
    }
  }

  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[var(--c-accent)] focus:border-transparent transition-all outline-none text-sm"
  const iconClasses = "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4" style={paletteVars}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-[var(--c-primary)]/5 border border-[var(--c-primary)]/5">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="h-10 w-10 rounded-xl bg-[var(--c-primary)] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Store size={24} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-[var(--c-primary)]">tayseer</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-800">Bon retour parmi nous</h1>
            <p className="text-gray-500 text-sm mt-1">Connectez-vous à votre espace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Mail className={iconClasses} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse email"
                required
                className={inputClasses}
              />
            </div>

            <div className="relative">
              <Lock className={iconClasses} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
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
                  Se connecter
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center space-y-4 pt-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-gray-500 hover:text-[var(--c-accent)] transition-colors"
              >
                Mot de passe oublié ?
              </button>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Pas encore de compte ?{' '}
                  <Link href="/auth/signup" className="text-[var(--c-accent)] font-semibold hover:underline">
                    Inscrivez votre boutique
                  </Link>
                </p>
              </div>
            </div>
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
            {resetMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-medium text-center"
              >
                {resetMsg}
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
