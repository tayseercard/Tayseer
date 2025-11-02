'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError(error.message)
    window.location.href = '/auth/callback'
  }

  return (
    <form onSubmit={handleLogin} className="max-w-sm mx-auto mt-20 space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border rounded w-full p-2"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="border rounded w-full p-2"
      />
      <button type="submit" className="bg-blue-600 text-white rounded p-2 w-full">
        Login
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  )
}
