'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

export default function NotificationBell({
  onOpen,
  refreshSignal,
}: {
  onOpen: () => void
  refreshSignal: number
}) {
  const supabase = createClientComponentClient()
  const [count, setCount] = useState(0)
  const soundRef = useRef<HTMLAudioElement | null>(null)

  /* 🔊 Load sound once */
  useEffect(() => {
    soundRef.current = new Audio('/notify.mp3')
  }, [])

  /* Realtime listener */
  useEffect(() => {
    let channel: any = null

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const userId = session?.user?.id
      if (!userId) return

      // Load unread notifications
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false)

      setCount(data?.length ?? 0)

      // 🟢 Create realtime channel 
      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            setCount((c) => c + 1)

            // 🔊 Play sound
            if (soundRef.current) {
              soundRef.current.currentTime = 0
              soundRef.current.play().catch(() => {})
            }

            // 🔔 Show toast
            toast.success(payload.new.title || 'Nouvelle notification')
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.old.read === false && payload.new.read === true) {
              setCount((c) => Math.max(0, c - 1))
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            setCount((c) => Math.max(0, c - 1))
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, []) // only once

  /* 🔄 Refresh when modal is opened */
  useEffect(() => {
    const reload = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return

      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false)

      setCount(data?.length ?? 0)
    }

    reload()
  }, [refreshSignal])

  return (
    <div className="relative cursor-pointer" onClick={onOpen}>
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
