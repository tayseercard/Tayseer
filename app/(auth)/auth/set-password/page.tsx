'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const { data, error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage('Password updated! You can now log in.')
      setTimeout(() => router.replace('/auth/login'), 1500)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleReset}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-lg font-semibold text-center">Reset Your Password</h1>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          required
          className="w-full border rounded p-2 text-sm"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white rounded-md py-2 font-medium hover:bg-indigo-700"
        >
          Update Password
        </button>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        {message && <p className="text-sm text-green-600 text-center">{message}</p>}
      </form>
    </div>
  )
}
