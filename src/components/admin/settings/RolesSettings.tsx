'use client'
import { useEffect, useState } from 'react'

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
    <div className="space-y-3 text-sm">
      <h3 className="text-base font-semibold text-gray-800">
        Roles & Store Access
      </h3>
      <p className="text-gray-600 mb-2">
        Manage which role each store account has. You can also show passwords or delete a store.
      </p>

      {/* 🧱 Table (Desktop) */}
      <div className="hidden sm:block overflow-x-auto border rounded-md shadow-sm">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Store</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Temp password</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-400">
                  No stores found
                </td>
              </tr>
            ) : (
              stores.map((s) => {
                const shown = visible[s.id]
                const pw = s.temp_password || '—'
                const masked = pw === '—' ? '—' : pw.replace(/./g, '•')
                const currentRole = roles[s.id] || s.role || 'Manager'
                return (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.email ?? '—'}</td>
                    <td className="px-3 py-2 font-mono">
                      {shown ? pw : masked}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="border rounded-md text-xs px-2 py-1"
                        value={currentRole}
                        onChange={(e) =>
                          handleRoleChange(s.id, e.target.value)
                        }
                      >
                        {roleOptions.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        onClick={() =>
                          setVisible((v) => ({ ...v, [s.id]: !v[s.id] }))
                        }
                        className="border rounded px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        {shown ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="border border-rose-400 text-rose-600 rounded px-2 py-1 text-xs hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile View */}
      <div className="grid gap-3 sm:hidden mt-4">
        {stores.map((s) => {
          const shown = visible[s.id]
          const pw = s.temp_password || '—'
          const masked = pw === '—' ? '—' : pw.replace(/./g, '•')
          const currentRole = roles[s.id] || s.role || 'Manager'
          return (
            <div
              key={s.id}
              className="border rounded-lg bg-white p-3 shadow-sm flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">{s.name}</h3>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="text-rose-600 text-xs border border-rose-300 rounded px-2 py-0.5 hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>

              <p className="text-xs text-gray-600">{s.email ?? '—'}</p>

              <div className="flex items-center justify-between text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                <span>{shown ? pw : masked}</span>
                <button
                  onClick={() =>
                    setVisible((v) => ({ ...v, [s.id]: !v[s.id] }))
                  }
                  className="text-emerald-600"
                >
                  {shown ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">Role:</span>
                <select
                  className="border rounded-md text-xs px-2 py-1"
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
