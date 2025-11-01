'use client'

import { Suspense, useEffect } from 'react'
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
  const router = useRouter()
  const params = useSearchParams()
  const code = params.get('code')
  const redirectTo = params.get('redirectTo')

  useEffect(() => {
    if (!code) return

    ;(async () => {
      try {
        // 1️⃣ Exchange auth code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error

        // 2️⃣ 🔐 Sync the session cookies on the server
        await fetch('/api/auth/callback', { method: 'POST' })

        // 3️⃣ Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error('No user')

        // 4️⃣ Get user roles
        const { data: roles, error: roleErr } = await supabase
          .from('me_effective_role')
          .select('role')
          .eq('user_id', user.id)

        if (roleErr) throw roleErr
        const roleList = roles?.map((r) => r.role) || []

        if (!roleList.length) throw new Error('No role assigned')

        // 5️⃣ Redirect based on role
        const dest =
          redirectTo ||
          (roleList.includes('superadmin')
            ? '/superadmin'
            : roleList.includes('admin')
            ? '/admin'
            : '/store')

        router.replace(dest)
      } catch (e: any) {
        console.error('Auth callback error:', e.message)
        router.replace('/auth/login?error=' + encodeURIComponent(e.message))
      }
    })()
  }, [code, router, supabase])

  return <div className="p-4 text-sm text-gray-500">Finalizing login…</div>
}
