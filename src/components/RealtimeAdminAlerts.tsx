'use client'

import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

export default function RealtimeAdminAlerts() {
  const supabase = createClientComponentClient()

  useEffect(() => {
    ;(async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.user) return
      const userId = session.user.id

      // Listen only for notifications belonging to this admin
      const channel = supabase
        .channel('admin-notification-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const n = payload.new

            toast.info(n.title, {
              description: n.message,
            })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    })()
  }, [])

  return null
}
