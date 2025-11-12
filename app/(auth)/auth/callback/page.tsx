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
  const [status, setStatus] = useState('')

  useEffect(() => {
    const hash = window.location.hash
    const codeFromQuery = params.get('code')
    const accessTokenFromHash = new URLSearchParams(hash.replace('#', '')).get('access_token')

    const code = codeFromQuery || accessTokenFromHash
    if (!code) {
      setStatus('❌ Missing "code" or "access_token" in URL')
      return
    }

    ;(async () => {
      try {
        setStatus('⏳ Exchanging code for session…')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error

        setStatus('🔐 Session OK — syncing cookies…')
        await fetch('/api/auth/callback', { method: 'POST' })

        setStatus('✅ Redirecting to dashboard…')
        window.location.href = '/store' // or '/admin' depending on role
      } catch (e: any) {
        console.error(e)
        setStatus('💥 ' + e.message)
      }
    })()
  }, [params, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-6 bg-white shadow rounded-lg text-sm text-gray-700">
        <p>{status || 'Please wait…'}</p>
      </div>
    </div>
  )
}
