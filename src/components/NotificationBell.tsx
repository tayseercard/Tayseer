'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Bell } from 'lucide-react'

export default function NotificationBell({
  onClick,
}: {
  onClick?: () => void
}) {
  const supabase = createClientComponentClient()
  const [count, setCount] = useState(0)

  // Load unread notifications
  async function loadUnread() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const userId = session?.user?.id
    if (!userId) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)

    setCount(data?.length || 0)
  }

  useEffect(() => {
    let channel: any

    const init = async () => {
      await loadUnread()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const userId = session?.user?.id
      if (!userId) return

      // 🔥 Real-time notifications
      channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => loadUnread()
        )
        .subscribe()
    }

    init()

    // Cleanup on unmount
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-white/20 transition"
    >
      <Bell className="w-6 h-6 text-white" />

      {/* 🔴 Badge */}
      {count > 0 && (
        <span
          className="
            absolute -top-1 -right-1
            bg-red-500 text-white text-[10px]
            rounded-full h-5 w-5
            flex items-center justify-center
            font-semibold animate-pulse
          "
        >
          {count}
        </span>
      )}
    </button>
  )
}
