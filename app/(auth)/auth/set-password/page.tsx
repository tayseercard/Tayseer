'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SetPasswordPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 🧠 Step 1: Parse tokens from hash fragment
  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    const emailParam = searchParams.get('email') || ''
    setEmail(emailParam)

    if (access_token && refresh_token) {
      ;(async () => {
        try {
          // ✅ Restore the session
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })
          if (error) throw error
        } catch (err: any) {
          console.error('Set session error:', err)
          setError(err.message)
        } finally {
          setLoading(false)
        }
      })()
    } else {
      setLoading(false)
      setError('Auth session missing. Please re-open the invite link.')
    }
  }, [supabase, searchParams])

  // 🧩 Step 2: Handle password update
  async function handleSetPassword() {
    if (!password.trim()) return setError('Please enter a new password.')
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading secure session…
      </div>
    )

  if (success)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-semibold text-emerald-600">
          Password set successfully 🎉
        </h2>
        <p className="mt-2 text-gray-600">Redirecting to login...</p>
      </div>
    )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Set your new password
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          for <span className="font-medium text-gray-700">{email}</span>
        </p>

        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3"
        />

        {error && (
          <p className="text-sm text-red-600 mb-3">
            ⚠️ {error}
          </p>
        )}

        <Button
          onClick={handleSetPassword}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Set Password
        </Button>
      </div>
    </div>
  )
}
