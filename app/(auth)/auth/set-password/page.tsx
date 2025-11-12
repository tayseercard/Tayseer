'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
      <SetPasswordInner />
    </Suspense>
  )
}

function SetPasswordInner() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const params = useSearchParams()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // ✅ Step 1: Restore Supabase session from invite link
  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔍 Parsing tokens from URL...')
        await new Promise((r) => setTimeout(r, 300))

        let hash = window.location.hash
        let access_token: string | null = null
        let refresh_token: string | null = null

        // Try fragment first (#access_token=...)
        if (hash && hash.includes('access_token')) {
          const parts = new URLSearchParams(hash.replace(/^#/, ''))
          access_token = parts.get('access_token')
          refresh_token = parts.get('refresh_token')
          console.log('🔑 Tokens (fragment):', { access_token, refresh_token })
        }

        // Fallback to query (?access_token=...)
        if (!access_token) {
          access_token = params.get('access_token')
          refresh_token = params.get('refresh_token')
          console.log('🔑 Tokens (query):', { access_token, refresh_token })
        }

        const emailParam = params.get('email') || ''
        setEmail(emailParam)

        if (!access_token || !refresh_token) {
          console.warn('⚠️ No tokens found in URL.')
          setError('Auth session missing. Please reopen the invite email.')
          setLoading(false)
          return
        }

        console.log('⚙️ Setting Supabase session...')
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })
        if (error) throw error
        console.log('✅ Session restored successfully.')
      } catch (e: any) {
        console.error('❌ Session restore failed:', e)
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [supabase, params])

  // ✅ Step 2: Handle password update
  async function handleSetPassword() {
    if (!password.trim()) return setError('Please enter a password.')
    setError(null)
    try {
      console.log('🔒 Updating user password...')
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      console.log('✅ Password updated successfully.')
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (e: any) {
      console.error('❌ Password update failed:', e)
      setError(e.message)
    }
  }

  // === UI ===
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Restoring session…
      </div>
    )

  if (success)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-xl font-semibold text-emerald-600">
          ✅ Password updated!
        </h1>
        <p className="text-gray-600 mt-2">Redirecting to login…</p>
      </div>
    )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-6 border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Set your new password
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          for <span className="font-medium text-gray-700">{email}</span>
        </p>

        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3"
        />

        {error && <p className="text-sm text-red-600 mb-3">⚠️ {error}</p>}

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
