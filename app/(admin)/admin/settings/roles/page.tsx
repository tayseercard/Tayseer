'use client'

import RolesSettings from '@/components/admin/settings/RolesSettings'
import SettingsHeader from '@/components/admin/settings/SettingsHeader'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useLanguage } from '@/lib/useLanguage'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RolesPage() {
  const { t, lang } = useLanguage()
  const supabase = createClientComponentClient()
  const router = useRouter()

  // protect route
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/auth/login?redirectTo=/admin/settings/roles')
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 sm:px-6 md:px-10 py-8">
      
      <SettingsHeader
        title={t.roles}
        subtitle={t.manageRoles}
        user={{
          name: 'Admin',
          email: 'admin@tayseer.app',
          role: 'Admin',
          avatarUrl: '/icon-192-2.png',
        }}
        onLogout={() => router.push('/auth/login')}
      />

      <div className="bg-white rounded-2xl shadow-sm border p-6 mt-6">
        <RolesSettings t={t} />
      </div>
    </div>
  )
}
