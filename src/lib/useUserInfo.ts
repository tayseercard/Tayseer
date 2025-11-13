'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useUserInfo() {
  const supabase = createClientComponentClient()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)

      // 1) Get auth session
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) {
        setUserInfo(null)
        setLoading(false)
        return
      }

      // 2) Get role + store info + team info
      const { data: me } = await supabase
        .from('me_effective_role')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      // 3) Combine all useful fields
      setUserInfo({
        id: user.id,
        email: user.email,
        role: me?.role,
        store_id: me?.store_id,
        store_name: me?.store_name,
        avatarUrl: user.user_metadata?.avatar_url || null,
        full_name:
          me?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0],
      })

      setLoading(false)
    })()
  }, [])

  return { userInfo, loading }
}
