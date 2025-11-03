'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Shield, RefreshCw, Search, Trash2 } from 'lucide-react'

export default function SuperadminUsersPage() {
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  /* ---------- Load users & roles ---------- */
  async function loadUsers() {
    setLoading(true)
    try {
      // 1️⃣ Get roles from public.me_effective_role
      const { data: roles, error: rolesError } = await supabase
        .from('me_effective_role')
        .select('*')
        .order('created_at', { ascending: false })

      if (rolesError) throw rolesError
      if (!roles || roles.length === 0) {
        setRows([])
        return
      }

      // 2️⃣ Get all auth users via admin API
      const { data: list, error: listError } =
        await supabase.auth.admin.listUsers()
      if (listError) throw listError

      // 3️⃣ Merge
      const merged = roles.map((r) => {
        const user = list.users.find((u) => u.id === r.user_id)
        return {
          ...r,
          email: user?.email ?? '—',
          user_created_at: user?.created_at ?? null,
          confirmed: !!user?.confirmed_at,
        }
      })

      setRows(merged)
    } catch (err: any) {
      console.error('❌ Load users failed:', err)
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
      (u.store_name ?? '').toLowerCase().includes(q.trim().toLowerCase())
  )

  /* ---------- Delete User ---------- */
  async function handleDelete(userId: string, email: string) {
    if (!confirm(`Delete ${email}? This will remove the role and user.`)) return
    try {
      const { error } = await supabase
        .from('me_effective_role')
        .delete()
        .eq('user_id', userId)
      if (error) throw error
      alert(`✅ Deleted ${email}`)
      await loadUsers()
    } catch (err: any) {
      alert('❌ ' + err.message)
    }
  }

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-600" /> Users & Roles
        </h1>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm max-w-md">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email, role, or store..."
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
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
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Store</Th>
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
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      {u.role}
                    </span>
                  </Td>
                  <Td>{u.store_name ?? '—'}</Td>
                  <Td>
                    {u.user_created_at
                      ? new Date(u.user_created_at).toLocaleDateString()
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
