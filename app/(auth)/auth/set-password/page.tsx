'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SetPasswordPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSetPassword() {
    if (password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/auth/login')
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-emerald-50">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow p-6">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Set your password</h1>

        <input
          type="password"
          placeholder="Enter new password"
          className="w-full border rounded-lg p-2 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}

        <button
          onClick={handleSetPassword}
          disabled={loading}
          className="w-full bg-emerald-600 text-white rounded-lg py-2 font-medium hover:bg-emerald-700"
        >
          {loading ? 'Saving…' : 'Save Password'}
        </button>
      </div>
    </div>
  )
}
