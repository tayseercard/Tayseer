'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

export default function NotificationBell({
  onOpen,
  refreshSignal,
  light = false,
}: {
  onOpen: () => void
  refreshSignal: number
  light?: boolean
}) {
  const supabase = createClientComponentClient()
  const [count, setCount] = useState(0)
  const soundRef = useRef<HTMLAudioElement | null>(null)

  /* 🔊 Load sound once */
  useEffect(() => {
    soundRef.current = new Audio('/notify.wav')
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

      const unread = data?.length ?? 0
      setCount(unread)
      updateAppBadge(unread)

      // 🟢 Realtime channel
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
            setCount((prev) => {
              const newCount = prev + 1
              updateAppBadge(newCount)
              return newCount
            })

            // 🔊 play sound
            if (soundRef.current) {
              soundRef.current.currentTime = 0
              soundRef.current.play().catch(() => { })
            }

            // 🔔 toast
            toast.success(payload.new.title || 'Nouvelle notification')
          }
        )

        // 🟡 Mark as read
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
              setCount((prev) => {
                const newCount = Math.max(0, prev - 1)
                updateAppBadge(newCount)
                return newCount
              })
            }
          }
        )

        // 🔴 Deleted notif
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            setCount((prev) => {
              const newCount = Math.max(0, prev - 1)
              updateAppBadge(newCount)
              return newCount
            })
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  /* 🔄 When panel opens, refresh count */
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

      const unread = data?.length ?? 0
      setCount(unread)
      updateAppBadge(unread)
    }

    reload()
  }, [refreshSignal])

  /* 🟦 When user opens panel → clear badge */
  function handleOpen() {
    updateAppBadge(0)
    onOpen()
  }

  return (
    <div className="relative cursor-pointer p-2 rounded-xl hover:bg-black/5 transition" onClick={handleOpen}>
      <svg
        className={`w-6 h-6 ${light ? 'text-gray-900' : 'text-white'}`}
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
        <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-black min-w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-white">
          {count}
        </span>
      )}
    </div>
  )
}

/* 🟦 PWA App Badge API */
function updateAppBadge(count: number) {
  if ('setAppBadge' in navigator) {
    // @ts-ignore
    navigator.setAppBadge(count).catch(() => { })
  } else if ('setExperimentalAppBadge' in navigator) {
    // @ts-ignore
    navigator.setExperimentalAppBadge(count).catch(() => { })
  }
}
