'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const supabase = createClientComponentClient()

  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})

      if (error) throw error

      // If redirectTo is configured in Supabase dashboard,
      // Supabase will automatically redirect to /auth/callback?code=...
      setMessage('✅ Logged in! Redirecting...')
    } catch (err: any) {
      console.error(err)
      setMessage('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error

      setMessage('📧 Check your inbox for the login link!')
    } catch (err: any) {
      console.error(err)
      setMessage('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-sm space-y-6">
        <h1 className="text-lg font-semibold text-center">🔐 Login</h1>

        {/* Mode toggle */}
        <div className="flex justify-center gap-4 mb-2">
          <button
            type="button"
            className={`text-sm font-medium ${
              mode === 'password' ? 'text-green-600 underline' : 'text-gray-500'
            }`}
            onClick={() => setMode('password')}
          >
            Password
          </button>
          <button
            type="button"
            className={`text-sm font-medium ${
              mode === 'magic' ? 'text-green-600 underline' : 'text-gray-500'
            }`}
            onClick={() => setMode('magic')}
          >
            Magic Link
          </button>
        </div>

        {/* Password login */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full border rounded-md p-2 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full border rounded-md p-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white rounded-md py-2 font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Connecting…' : 'Login'}
            </button>
          </form>
        )}

        {/* Magic link login */}
        {mode === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full border rounded-md p-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        {message && (
          <p className="text-sm text-center text-gray-600 whitespace-pre-line">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
