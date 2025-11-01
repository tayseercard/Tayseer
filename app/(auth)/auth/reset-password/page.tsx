'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1️⃣ Update Supabase password
      const { data: { user }, error: updateErr } = await supabase.auth.updateUser({
        password,
      })
      if (updateErr) throw updateErr
      if (!user) throw new Error('No user found after update.')

      // 2️⃣ ✅ Update your store record so user won't get redirected again
      const { error: dbErr } = await supabase
        .from('stores')
        .update({ temp_password_set: false }) // or requires_password_change: false
        .eq('email', user.email)

      if (dbErr) console.warn('Warning: Could not update store flag', dbErr)

      // 3️⃣ Sync cookies for middleware
      await fetch('/api/auth/callback', { method: 'POST' })

      // 4️⃣ Success!
      setSuccess(true)
      setTimeout(() => router.replace('/store'), 1200)
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-xl p-6 max-w-sm w-full space-y-4"
      >
        <h1 className="text-xl font-semibold text-center text-gray-800">
          Set Your New Password
        </h1>

        <input
          type="password"
          className="w-full border rounded-md p-2 text-sm"
          placeholder="New password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">✅ Password updated successfully!</p>}

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-2 font-medium"
        >
          {loading ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
