'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, CheckCircle, Bell, ArrowRight } from 'lucide-react'

export default function NotificationPanel({
  open,
  onClose,
  onRefreshCount,
}: {
  open: boolean
  onClose: () => void
  onRefreshCount: () => void
}) {
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return

    const load = async () => {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      setRows(data || [])
      setLoading(false)
    }

    load()
  }, [open])

  async function markAllAsRead() {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    onRefreshCount() // refresh bell count
    setRows((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function handleClick(n: any) {
    if (n.request_id) {
      window.location.href = `/superadmin/requests/${n.request_id}`
    } else if (n.link) {
      window.location.href = n.link
    }
  }

  return (
    <div
      className={`
        fixed inset-0 z-50 transition-all duration-300
        ${open ? 'pointer-events-auto' : 'pointer-events-none'}
      `}
    >
      {/* Dark overlay */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity 
          ${open ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />

      {/* Right sidebar */}
      <div
        className={`
          absolute right-0 top-0 h-full w-[320px] sm:w-[380px]
          bg-white shadow-xl border-l border-gray-200
          transform transition-transform duration-300
          flex flex-col
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600" />
            Notifications
          </h3>
          <button onClick={onClose}>
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Mark all as read */}
        <button
          onClick={markAllAsRead}
          className="mx-4 mt-3 text-sm text-emerald-600 underline"
        >
          Mark all as read
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-center text-gray-400">No notifications</div>
          ) : (
            rows.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`p-3 rounded-lg border cursor-pointer transition
                  ${
                    n.read
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-emerald-50 border-emerald-200'
                  }
                `}
              >
                <div className="flex justify-between">
                  <p className="font-medium">{n.title}</p>
                  {!n.read && (
                    <span className="text-xs bg-emerald-600 text-white px-2 rounded-full">
                      NEW
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mt-1">{n.message}</p>

                {n.request_id && (
                  <div className="mt-2 flex items-center text-emerald-700 text-sm font-medium">
                    View Request
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
