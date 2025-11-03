'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UserPlus, RefreshCw, Trash2, Shield, Mail } from 'lucide-react'

export default function SuperadminUsersPage() {
  const supabase = createClientComponentClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  /* ---------- Load all users ---------- */
  async function loadUsers() {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.admin.listUsers()
      if (error) throw error
      setUsers(data.users || [])
    } catch (e: any) {
      console.error('Error loading users:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filtered = users.filter(
    (u) =>
      (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.user_metadata?.role ?? '').toLowerCase().includes(search.toLowerCase())
  )

  /* ---------- Delete User ---------- */
  async function handleDelete(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This action cannot be undone.`)) return
    try {
      const { error } = await supabase.auth.admin.deleteUser(id)
      if (error) throw error
      alert(`✅ User ${email} deleted`)
      await loadUsers()
    } catch (err: any) {
      alert('❌ ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-600" /> Users Management
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or role..."
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-500">Loading users…</div>
      ) : error ? (
        <div className="py-20 text-center text-rose-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500">No users found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Created</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <Td>{u.email}</Td>
                  <Td>
                    {u.user_metadata?.role ? (
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                        {u.user_metadata.role}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </Td>
                  <Td>{new Date(u.created_at).toLocaleDateString()}</Td>
                  <Td>
                    {u.confirmed_at ? (
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(u.id, u.email)}
                        className="text-rose-600 hover:text-rose-700"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ---------- UI Helpers ---------- */
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
