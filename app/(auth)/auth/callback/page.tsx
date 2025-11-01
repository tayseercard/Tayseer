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

  useEffect(() => {
    if (!code) return

    ;(async () => {
      try {
        // 🧭 Exchange code for session (magic-link or OAuth)
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          console.error('Auth callback error:', exchangeError.message)
          router.replace('/auth/login?error=session')
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/auth/login?error=nouser')
          return
        }

        // 🔍 Fetch role from me_effective_role
        const { data: roles, error: roleError } = await supabase
          .from('me_effective_role')
          .select('role')
          .eq('user_id', user.id)

        if (roleError) {
          console.error('Role query error:', roleError.message)
          router.replace('/auth/login?error=rolequery')
          return
        }

        const roleList = roles?.map((r) => r.role) || []
        if (!roleList.length) {
          // No assigned role
          router.replace('/auth/login?error=norole')
          return
        }

        // 🧭 Redirect based on role
        const dest = roleList.includes('superadmin')
          ? '/superadmin'
          : roleList.includes('admin')
          ? '/admin'
          : '/store'

        router.replace(dest)
      } catch (err) {
        console.error('Unexpected error in callback:', err)
        router.replace('/auth/login?error=unknown')
      }
    })()
  }, [code, router, supabase])

  return <div className="p-4 text-sm text-gray-500">Finalizing login…</div>
}
