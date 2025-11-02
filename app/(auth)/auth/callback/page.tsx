'use client'

import { useEffect, useState, Suspense } from 'react'
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
  const [debug, setDebug] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return setDebug('❌ Missing code param')

    ;(async () => {
      try {
        setDebug('⏳ Exchanging code for session…')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error

        setDebug('🔐 Session OK, syncing cookies and redirecting...')
        // The API route will handle redirect now
        await fetch('/api/auth/callback', { method: 'POST' })
      } catch (err: any) {
        console.error(err)
        setDebug('💥 Error: ' + err.message)
      }
    })()
  }, [code, supabase])

  return (
    <div className="p-6 text-center text-sm text-gray-700">
      {debug || 'Please wait…'}
    </div>
  )
}
