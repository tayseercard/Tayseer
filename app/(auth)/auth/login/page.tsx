'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading login…</div>}>
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
    ;(async () => {
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
      if (!signInData.user) throw new Error('No user found')

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
        .select('role')
        .eq('user_id', signInData.user.id)

      if (roleErr) throw roleErr
      if (!roles || roles.length === 0) throw new Error('No role assigned to this user.')

      const roleList = roles.map((r) => r.role)
      let destination = redirectTo

      if (roleList.includes('superadmin')) destination = '/superadmin'
      else if (roleList.includes('admin')) destination = '/admin'
      else if (roleList.includes('store_owner')) destination = '/store'
      else if (roleList.includes('cashier')) destination = '/cashier'


      await new Promise((resolve) => setTimeout(resolve, 400))
      window.location.href = destination
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  /* Forgot password handler */
  async function handleForgotPassword() {
    if (!email) {
      setError('Please enter your email first.')
      return
    }
    setError(null)
    setResetMsg(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setResetMsg('Password reset email sent! Check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-lg font-semibold text-center">🔐 Tayseer Admin Login</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full border rounded p-2 text-sm"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full border rounded p-2 text-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-md py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Connecting…' : 'Login'}
        </button>

        {/* Forgot password */}
        <div className="text-sm text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-indigo-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Messages */}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        {resetMsg && <p className="text-sm text-green-600 text-center">{resetMsg}</p>}
      </form>
    </div>
  )
}
