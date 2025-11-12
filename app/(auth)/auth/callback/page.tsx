'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [status, setStatus] = useState('')

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')
    const code = params.get('code') // for OAuth PKCE flow
    const type = params.get('type') // optional (invite, signup, etc.)

    ;(async () => {
      try {
        if (access_token && refresh_token) {
          // ✅ Magic link or invite case
          setStatus('🔐 Setting session from access token...')
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) throw error
        } else if (code) {
          // ✅ OAuth / PKCE case
          setStatus('⏳ Exchanging code for session...')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          throw new Error('Missing code or token in URL')
        }

        // 🧠 Sync cookies
        await fetch('/api/auth/callback', { method: 'POST' })

        // 🧩 Get session + role
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData.session?.user
        let role = user?.user_metadata?.role || null

        if (!role && user?.id) {
          const { data: roleRow } = await supabase
            .from('me_effective_role')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()
          role = roleRow?.role ?? null
        }

        console.log('🎯 Effective role:', role)
        setStatus('✅ Redirecting...')

        // 🚦 Redirects
        if (type === 'invite') {
          router.replace('/auth/set-password')
        } else if (role === 'admin' || role === 'superadmin') {
          router.replace('/admin')
        } else if (role === 'store_owner' || role === 'manager') {
          router.replace('/store')
        } else if (role === 'cashier') {
          router.replace('/store') // or /cashier
        } else {
          router.replace('/403')
        }
      } catch (e: any) {
        console.error('Callback error:', e)
        setStatus('💥 ' + e.message)
      }
    })()
  }, [params, supabase, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-white shadow rounded-lg text-sm text-gray-700">
        <p>{status || 'Please wait…'}</p>
      </div>
    </div>
  )
}
