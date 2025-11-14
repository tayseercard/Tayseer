'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function NotificationBell({ onOpen }: { onOpen: () => void }) {
  const supabase = createClientComponentClient()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const userId = session?.user?.id
      if (!userId) return

      // 🔹 Load unread notifications
      const { data } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false)

      setCount(data?.length || 0)

      // 🔹 Live updates
      const channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            setCount((c) => c + 1)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    load()
  }, [supabase])

  /* 👉 When clicking the bell, open modal AND reset count */
  function handleOpen() {
    setCount(0)
    onOpen()
  }

  return (
    <div className="relative cursor-pointer" onClick={handleOpen}>
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  )
}
