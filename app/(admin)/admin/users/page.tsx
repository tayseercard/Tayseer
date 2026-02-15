'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Shield, RefreshCw, Search, Trash2 } from 'lucide-react'

export default function AdminUsersPage() {
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [groups, setGroups] = useState({
    admins: [] as any[],
    managers: [] as any[],
    cashiers: [] as any[],
  })


  /* ---------- Load users & roles ---------- */
  async function loadUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')

      let admins: any[] = []
      let managers: any[] = []
      let cashiers: any[] = []
      let flat: any[] = []

      // 🔹 CASE 1: old API → { users: [...] }
      if (Array.isArray(data.users)) {
        flat = data.users

        admins = flat.filter((u) => u.role === 'admin')
        managers = flat.filter(
          (u) => u.role === 'manager' || u.role === 'store_owner'
        )
        cashiers = flat.filter((u) => u.role === 'cashier')
      }
      // 🔹 CASE 2: new API → { admins: [], managers: [], cashiers: [] }
      else {
        admins = data.admins || []
        managers = data.managers || []
        cashiers = data.cashiers || []
        flat = [...admins, ...managers, ...cashiers]
      }

      setGroups({ admins, managers, cashiers })
      setRows(flat)
    } catch (err: any) {
      console.error('Load users failed:', err)
    } finally {
      setLoading(false)
    }
  }



  useEffect(() => {
    loadUsers()
  }, [])

  /* ---------- Search ---------- */
  const filtered = rows.filter(
    (u) =>
      (u.email ?? '').toLowerCase().includes(q.trim().toLowerCase()) ||
      (u.role ?? '').toLowerCase().includes(q.trim().toLowerCase()) ||
      (u.store_name ?? '').toLowerCase().includes(q.trim().toLowerCase()) ||
      (u.store_temp_password ?? '').toLowerCase().includes(q.trim().toLowerCase())
  )

  /* ---------- Delete User ---------- */
  async function handleDelete(userId: string, email: string) {
    if (!confirm(`Delete ${email}? This will remove the role and the authentication account.`)) return
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression')

      alert(`✅ Deleted ${email}`)
      await loadUsers()
    } catch (err: any) {
      alert('❌ ' + err.message)
    }
  }

  /* ---------- Render ---------- */
  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" /> Users & Roles
        </h1>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs sm:text-sm hover:bg-gray-100"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm max-w-md w-full">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email, role, store, or cashier name..."
          className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none"
        />
      </div>

      {/* Group Summary */}
      <div className="flex gap-3 text-xs sm:text-sm">
        <span className="px-3 py-1 bg-white border rounded-lg shadow-sm">
          Admins: <b>{groups.admins.length}</b>
        </span>
        <span className="px-3 py-1 bg-white border rounded-lg shadow-sm">
          Managers: <b>{groups.managers.length}</b>
        </span>
        <span className="px-3 py-1 bg-white border rounded-lg shadow-sm">
          Cashiers: <b>{groups.cashiers.length}</b>
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 text-sm">
          Loading users…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500 text-sm">
          No users found.
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Store</Th>
                  <Th>Cashier Name</Th>
                  <Th>Temp_password</Th>
                  <Th>Created</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.user_id} className="border-t hover:bg-gray-50">
                    <Td>{u.email}</Td>

                    <Td>
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                        {u.role}
                      </span>
                    </Td>

                    <Td>{u.store_name ?? '—'}</Td>
                    <Td>{u.cashier_full_name ?? (u.role === 'cashier' ? '—' : '')}</Td>

                    <Td>{u.store_temp_password ?? (u.role === 'store_owner' ? '—' : '')}</Td>
                    <Td>
                      {u.auth_created_at
                        ? new Date(u.auth_created_at).toLocaleDateString()
                        : '—'}
                    </Td>

                    <Td>
                      {u.confirmed ? (
                        <span className="text-emerald-600 text-xs font-medium">
                          Confirmed
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </Td>

                    <Td>
                      <button
                        onClick={() => handleDelete(u.user_id, u.email)}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="grid gap-3 sm:hidden">
            {filtered.map((u) => (
              <div
                key={u.user_id}
                className="border rounded-lg bg-white p-3 shadow-sm flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium text-sm">{u.email}</p>
                  <button
                    onClick={() => handleDelete(u.user_id, u.email)}
                    className="text-rose-600 text-xs border border-rose-300 rounded px-2 py-0.5 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p><b>Role:</b> {u.role}</p>
                  <p><b>Temp_Password:</b> {u.store_temp_password}</p>
                  <p><b>Store:</b> {u.store_name ?? '—'}</p>
                  {u.role === 'cashier' && (
                    <p><b>Cashier Name:</b> {u.cashier_full_name ?? '—'}</p>
                  )}
                  <p><b>Created:</b>
                    {u.auth_created_at
                      ? new Date(u.auth_created_at).toLocaleDateString()
                      : '—'}
                  </p>
                  <p>
                    <b>Status:</b> {u.confirmed ? '✅ Confirmed' : '⏳ Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}



/* ---------- Helpers ---------- */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>
}
