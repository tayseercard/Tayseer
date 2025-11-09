'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Trash2, Plus, Store } from 'lucide-react'

export default function RolesSettings({ t }: { t: Record<string, string> }) {
  const [stores, setStores] = useState<any[]>([])
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [roles, setRoles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/list-stores')
      if (!res.ok) throw new Error('Failed to fetch stores')
      const data = await res.json()
      setStores(data.stores || [])
    } catch (err) {
      console.error('Error loading stores:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    const res = await fetch('/api/admin/delete-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const result = await res.json()
    if (res.ok && result.success) {
      alert(`✅ Store "${name}" deleted`)
      await refresh()
    } else {
      alert(`❌ Failed to delete: ${result.error || 'Unknown error'}`)
    }
  }

  async function handleRoleChange(storeId: string, newRole: string) {
    setRoles((r) => ({ ...r, [storeId]: newRole }))
    setSaving((s) => ({ ...s, [storeId]: true }))
    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, role: newRole }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        alert(`❌ Failed to update role: ${result.error || 'Unknown error'}`)
      }
    } catch (e) {
      console.error('Error saving role:', e)
    } finally {
      setSaving((s) => ({ ...s, [storeId]: false }))
    }
  }

  const roleOptions = ['Manager', 'Cashier', 'Auditor']

  return (
    <div className="relative p-4 sm:p-6">
      {/* === Header === */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Store className="h-5 w-5 text-[var(--c-accent)]" />
            Roles & Store Access
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage store accounts, roles, and temporary passwords.
          </p>
        </div>

        {/* Add Store Button */}
        <button
          onClick={() => alert('Add store modal')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--c-accent)] text-white text-sm hover:bg-[var(--c-accent)]/90"
        >
          <Plus className="h-4 w-4" /> Add Store
        </button>
      </div>

      {/* === Loading State === */}
      {loading && (
        <div className="text-center py-10 text-gray-400">Loading stores…</div>
      )}

      {/* === Empty State === */}
      {!loading && stores.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          No stores found yet.
        </div>
      )}

      {/* === Desktop Table === */}
      <div className="hidden md:block overflow-x-auto border rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Store</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Password</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => {
              const shown = visible[s.id]
              const pw = s.temp_password || '—'
              const masked = pw === '—' ? '—' : pw.replace(/./g, '•')
              const currentRole = roles[s.id] || s.role || 'Manager'
              return (
                <tr
                  key={s.id}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.email ?? '—'}</td>
                  <td className="px-4 py-2 font-mono flex items-center gap-2">
                    {shown ? pw : masked}
                    <button
                      onClick={() =>
                        setVisible((v) => ({ ...v, [s.id]: !v[s.id] }))
                      }
                      className="text-gray-500 hover:text-[var(--c-accent)]"
                    >
                      {shown ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      className="border rounded-md text-xs px-2 py-1"
                      value={currentRole}
                      onChange={(e) => handleRoleChange(s.id, e.target.value)}
                    >
                      {roleOptions.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="text-rose-600 border border-rose-300 rounded-md px-2 py-1 text-xs hover:bg-rose-50"
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

      {/* === Mobile Cards === */}
      <div className="grid gap-4 md:hidden mt-4">
        {stores.map((s) => {
          const shown = visible[s.id]
          const pw = s.temp_password || '—'
          const masked = pw === '—' ? '—' : pw.replace(/./g, '•')
          const currentRole = roles[s.id] || s.role || 'Manager'
          return (
            <div
              key={s.id}
              className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    {s.name}
                  </h3>
                  <p className="text-xs text-gray-500">{s.email ?? '—'}</p>
                </div>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="flex items-center gap-1 text-rose-600 text-xs border border-rose-300 rounded-lg px-2 py-1 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 font-mono text-xs">
                <span>{shown ? pw : masked}</span>
                <button
                  onClick={() =>
                    setVisible((v) => ({ ...v, [s.id]: !v[s.id] }))
                  }
                  className="text-[var(--c-accent)] flex items-center gap-1"
                >
                  {shown ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Show
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Role</span>
                <select
                  className="border rounded-md text-xs px-2 py-1 bg-white"
                  value={currentRole}
                  onChange={(e) => handleRoleChange(s.id, e.target.value)}
                >
                  {roleOptions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>

     
    </div>
  )
}
