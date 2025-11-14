'use client'

import { X, Check, Trash, MoreVertical } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function NotificationModal({
  open,
  onClose,
  onClickNotification,
}: {
  open: boolean
  onClose: () => void
  onClickNotification?: (notif: any) => void
}) {
  const supabase = createClientComponentClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  /* ---------------- LOAD NOTIFICATIONS ---------------- */
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

  /* ---------------- MARK ALL READ ---------------- */
  async function markAllRead() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)

    load()
    setMenuOpen(false)
  }

  /* ---------------- DELETE ALL ---------------- */
  async function deleteAll() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', session.user.id)

    load()
    setMenuOpen(false)
  }

  /* ---------------- DELETE ONE ---------------- */
  async function deleteOne(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    load()
  }

  /* ---------------- MARK ONE READ ---------------- */
  async function markOneRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  /* ---------------- OUTSIDE CLICK CLOSE MENU ---------------- */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  /* ---------------- AUTO LOAD WHEN OPEN ---------------- */
  useEffect(() => {
    if (open) load()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex justify-end">

      {/* RIGHT PANEL */}
      <div className="w-full max-w-md h-full bg-white shadow-2xl rounded-l-2xl animate-slide-in flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notifications</h2>

          <div className="relative flex items-center gap-3" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical className="w-5 h-5 text-gray-700" />
            </button>

            <button onClick={onClose}>
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Small menu */}
            {menuOpen && (
              <div className="absolute right-8 top-8 w-40 bg-white border rounded-xl shadow-xl text-sm animate-fade-in">
                <button
                  onClick={markAllRead}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100"
                >
                  Mark all as read
                </button>
                <button
                  onClick={deleteAll}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
                >
                  Delete all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-gray-400 text-sm text-center">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center text-center mt-10">
              <div className="text-gray-400 text-5xl mb-3">🔔</div>
              <p className="text-gray-500">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={async () => {
                  await markOneRead(n.id)
                  load()
                  onClickNotification?.(n)
                }}
                className={`
                  p-4 rounded-xl border shadow-sm flex justify-between items-start cursor-pointer transition
                  ${!n.read ? 'bg-emerald-50 border-emerald-200' : 'bg-white hover:bg-gray-50'}
                `}
              >
                <div className="flex-1 pr-3">
                  <p className="font-semibold text-gray-800">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteOne(n.id)
                  }}
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ANIMATION */}
      <style jsx>{`
        .animate-slide-in {
          animation: slide-in 0.25s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out forwards;
        }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
