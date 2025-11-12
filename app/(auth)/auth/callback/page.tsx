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
        const cookieRes = await fetch('/api/auth/callback', { method: 'POST' })
        if (!cookieRes.ok) throw new Error('Failed to sync cookies')

        // 🧠 Fetch effective role
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData.session?.user
        let role = user?.user_metadata?.role || null

        if (!role && user?.id) {
          const { data: roleData } = await supabase
            .from('me_effective_role')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()
          role = roleData?.role || null
        }

        console.log('🎯 Effective role:', role)
        setStatus('✅ Redirecting based on role...')

        // 🚦 Redirect based on role
        if (role === 'admin' || role === 'superadmin') router.replace('/admin')
        else if (role === 'store_owner' || role === 'manager') router.replace('/store')
        else if (role === 'cashier') router.replace('/store') // or `/cashier` if you have a page
        else router.replace('/403')
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
