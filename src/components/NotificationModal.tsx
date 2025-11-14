'use client'

import { X, Check, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function NotificationModal({ open, onClose }: {
  open: boolean
  onClose: () => void
}) {
  const supabase = createClientComponentClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load notifications
  async function load() {
    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return
    const userId = session.user.id

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setNotifications(data || [])
    setLoading(false)
  }
async function markAllAsRead() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id
  if (!userId) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
}

  // Mark all as read
  async function markAllRead() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const userId = session?.user.id
    if (!userId) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)

    load()
  }

  // Delete one
  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    load()
  }

  // Delete all
  async function deleteAll() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', session?.user.id)

    load()
  }

  // Auto-load when modal opens
  useEffect(() => {
    if (open) load()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-start justify-end">
      {/* Panel */}
      <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notifications</h2>

          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-3 flex items-center justify-between border-b text-sm">
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-emerald-600"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>

          <button
            onClick={deleteAll}
            className="flex items-center gap-2 text-red-600"
          >
            <Trash className="w-4 h-4" />
            Delete all
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-400 text-sm text-center">
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`
                  p-3 rounded-lg border shadow-sm flex justify-between
                  ${n.is_read ? 'bg-gray-50' : 'bg-emerald-50 border-emerald-100'}
                `}
              >
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>

                <button onClick={() => deleteNotification(n.id)}>
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Animation */}
      <style jsx>{`
        .animate-slide-in-right {
          animation: slide-in 0.25s ease-out;
        }
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
