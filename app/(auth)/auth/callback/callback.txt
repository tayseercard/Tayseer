'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Signing you in…</div>}>
      <AuthCallbackInner />
    </Suspense>
  )
}

function AuthCallbackInner() {
  const supabase = createClientComponentClient()
  const params = useSearchParams()
  const code = params.get('code')
  const redirectTo = params.get('redirectTo')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!code) {
      setStatus('❌ Missing "code" in URL')
      return
    }

    ;(async () => {
      try {
        setStatus('⏳ Exchanging code for session…')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error

        setStatus('🔐 Session OK — syncing cookies…')
        const res = await fetch('/api/auth/callback', { method: 'POST' })

        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error || 'Cookie sync failed')
        }

        setStatus('✅ Redirecting to dashboard…')
      } catch (e: any) {
        setStatus('💥 ' + e.message)
        console.error(e)
      }
    })()
  }, [code, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-6 bg-white shadow rounded-lg text-sm text-gray-700">
        <p>{status || 'Please wait…'}</p>
      </div>
    </div>
  )
}
