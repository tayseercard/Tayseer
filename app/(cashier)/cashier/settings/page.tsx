'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

export default function CashierSettingsPage() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--c-primary)] mb-4">Settings</h1>
      {user && (
        <div className="bg-white p-4 rounded-lg border shadow-sm space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.user_metadata?.role}</p>
        </div>
      )}
    </div>
  )
}
