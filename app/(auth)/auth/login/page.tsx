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

  const redirectTo = params.get('redirectTo') || '/admin'

  // ✅ Auto-redirect if already logged in
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
      }
    })()
  }, [supabase, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1️⃣ Sign in with Supabase
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (!signInData.user) throw new Error('No user found')

      // 2️⃣ (Optional) persist session tokens to cookies
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

      // 3️⃣ Fetch user roles
      const { data: roles, error: roleErr } = await supabase
        .from('me_effective_role')
        .select('role')
        .eq('user_id', signInData.user.id)

      if (roleErr) throw roleErr
      if (!roles || roles.length === 0) throw new Error('No role assigned to this user.')

      // 4️⃣ Determine the highest-privilege role
      const roleList = roles.map((r) => r.role)
      let userRole = 'store_owner'
      let destination = redirectTo

      if (roleList.includes('superadmin')) {
        userRole = 'superadmin'
        destination = '/superadmin'
      } else if (roleList.includes('admin')) {
        userRole = 'admin'
        destination = '/admin'
      } else if (roleList.includes('store_owner')) {
        userRole = 'store_owner'
        destination = '/store'
      }

      // 5️⃣ Save role cookie (used by middleware)
      document.cookie = `role=${userRole}; path=/; SameSite=Lax;`

      // 6️⃣ Redirect
      router.replace(destination)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
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

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </form>
    </div>
  )
}
