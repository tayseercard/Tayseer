'use client'

import { useEffect, useState } from 'react'
import { Trash2, Store } from 'lucide-react'

export default function RolesSettings({ t }: { t: Record<string, string> }) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const roleOptions = ['admin', 'store_owner', 'cashier']

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    const res = await fetch('/api/admin/list-users')
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }

  async function handleRoleChange(user_id: string, newRole: string) {
    setSaving(prev => ({ ...prev, [user_id]: true }))

    const res = await fetch('/api/admin/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, role: newRole }),
    })

    const result = await res.json()

    if (!result.success) alert('Error updating role')
    else {
      setUsers(prev =>
        prev.map(u =>
          u.user_id === user_id ? { ...u, role: newRole } : u
        )
      )
    }

    setSaving(prev => ({ ...prev, [user_id]: false }))
  }

  async function handleDelete(user_id: string, label: string) {
    if (!confirm(`Delete user "${label}"?`)) return

    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    })

    const result = await res.json()
    if (result.success) refresh()
  }

  return (
    <div className="relative p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Store className="h-5 w-5 text-[var(--c-accent)]" />
            Users & Roles
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage user roles & store access.
          </p>
        </div>
      </div>

      {loading && <div className="py-10 text-center text-gray-400">Loading…</div>}
      {!loading && users.length === 0 && <div className="py-10 text-center text-gray-400">No users found.</div>}

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-x-auto border rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Store</th>
              <th className="px-4 py-2 text-left">Store Email</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Address</th>

              {/* Cashier extra columns */}
              <th className="px-4 py-2 text-left">Cashier Name</th>
              <th className="px-4 py-2 text-left">Cashier Email</th>
              <th className="px-4 py-2 text-left">User ID</th>

              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => {
              const store = u.stores || {}
              const cashier = u.cashiers || {}
              const auth = u.auth || {}
              const fullname = auth.raw_user_meta_data?.full_name ?? '—'
              const cashierEmail = auth.email ?? '—'

              return (
                <tr key={u.user_id} className="border-t hover:bg-gray-50">

                  <td className="px-4 py-2">{store.name ?? '—'}</td>
                  <td className="px-4 py-2">{store.email ?? '—'}</td>
                  <td className="px-4 py-2">{store.phone ?? '—'}</td>
                  <td className="px-4 py-2">{store.address ?? '—'}</td>

                  {/* Only fill values if role = cashier */}
                  <td className="px-4 py-2">{u.role === 'cashier' ? u.cashier?.full_name : '—'}</td>
                  <td className="px-4 py-2">{u.role === 'cashier' ? cashier.email : '—'}</td>
                  <td className="px-4 py-2">{u.role === 'cashier' ? u.user_id : '—'}</td>

                  <td className="px-4 py-2">
                    <select
                      className="border rounded-md text-xs px-2 py-1"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                    >
                      {roleOptions.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>

                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(u.user_id, store.name || u.user_id)}
                      className="text-rose-600 border border-rose-300 rounded-md px-2 py-1 text-xs"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="grid gap-4 md:hidden mt-4">
        {users.map((u) => {
          const store = u.stores || {}
          const auth = u.auth || {}

          return (
            <div key={u.user_id} className="bg-white rounded-xl border p-4 shadow-sm">

              <h3 className="font-semibold text-sm">{store.name ?? '—'}</h3>
              <p className="text-xs text-gray-500">{store.email ?? '—'}</p>
              <p className="text-xs text-gray-500">{store.phone ?? '—'}</p>
              <p className="text-xs text-gray-500">{store.address ?? '—'}</p>

              {/* Cashier extra data */}
              {u.role === 'cashier' && (
                <div className="mt-2 text-xs text-gray-700 space-y-1">
                  <p><b>Name:</b> {auth.raw_user_meta_data?.full_name ?? '—'}</p>
                  <p><b>Email:</b> {auth.email ?? '—'}</p>
                  <p><b>User ID:</b> {u.user_id}</p>
                </div>
              )}

              <div className="flex justify-between items-center mt-3">
                <span className="text-xs">Role</span>

                <select
                  className="text-xs border rounded-md px-2 py-1"
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                >
                  {roleOptions.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              <button
                onClick={() => handleDelete(u.user_id, store.name || u.user_id)}
                className="mt-3 flex items-center gap-1 text-rose-600 text-xs border border-rose-300 rounded-lg px-2 py-1"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>

            </div>
          )
        })}
      </div>
    </div>
  )
}
