'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-500">Chargement…</div>}>
      <LoginInner />
    </Suspense>
  )
}

/* ------------------ Actual Login Logic ------------------ */
function LoginInner() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Get redirect destination (from middleware)
  const redirectTo = searchParams.get('redirectTo') || '/admin'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('Identifiants invalides. Réessayez.')
      return
    }

    // ✅ Redirect to intended page
    router.push(redirectTo)
  }

  // Auto-redirect if already logged in
  useEffect(() => {
    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) router.push(redirectTo)
    })()
  }, [router, redirectTo, supabase])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm border border-gray-100"
      >
        <h1 className="text-2xl font-bold text-center text-emerald-600 mb-4">
          Connexion Tayseer
        </h1>

        <label className="block mb-3 text-sm">
          Email
          <input
            type="email"
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block mb-3 text-sm">
          Mot de passe
          <input
            type="password"
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <p className="mt-4 text-xs text-gray-500 text-center">
          🔐 Vous serez redirigé vers{' '}
          <span className="font-semibold text-gray-700">{redirectTo}</span>
        </p>
      </form>
    </main>
  )
}
