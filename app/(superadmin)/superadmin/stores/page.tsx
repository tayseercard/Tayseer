'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Store as StoreIcon,
  LayoutGrid,
  List,
  Plus,
  Filter,
  Search,
  Star,
  MapPin,
  Phone,
  ChevronRight,
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Stat } from '@/components/ui/stat'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminStoresPage() {
  const supabase = createClientComponentClient()

  const [rows, setRows] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    wilaya: '',
  })

  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    open: 0,
    closed: 0,
    topStore: '—',
  })

  /* ---------- Load Data ---------- */
  const loadStores = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('stores').select('*')
      if (error) throw error
      setRows(data || [])
      setFiltered(data || [])
      setStats((prev) => ({
        ...prev,
        total: data?.length || 0,
        open: data?.filter((s) => s.status === 'open').length || 0,
        closed: data?.filter((s) => s.status === 'closed').length || 0,
      }))
    } catch (err) {
      console.error('Load stores failed', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  /* ---------- Search ---------- */
  useEffect(() => {
    const term = q.trim().toLowerCase()
    if (!term) setFiltered(rows)
    else {
      setFiltered(
        rows.filter(
          (s) =>
            (s.name ?? '').toLowerCase().includes(term) ||
            (s.address ?? '').toLowerCase().includes(term)
        )
      )
    }
  }, [q, rows])

  /* ---------- Add Store ---------- */
  async function handleAddStore() {
    if (!form.name.trim() || !form.email.trim()) {
      alert('Store name and email are required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/add-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      let result: any = {}
      try {
        result = await res.json()
      } catch {
        throw new Error('Invalid response from server')
      }

      if (!res.ok) throw new Error(result.error || 'Failed to create store')

      alert(
        `✅ Store "${result.store.name}" created successfully.${
          result.temp_password
            ? `\nTemporary password: ${result.temp_password}`
            : ''
        }`
      )

      await loadStores()
      setOpen(false)
      setForm({ name: '', email: '', phone: '', address: '', wilaya: '' })
    } catch (err: any) {
      alert('❌ ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  /* ---------- Render ---------- */
  return (
    <div className="flex flex-col gap-5 text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <StoreIcon className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-semibold">Stores</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('grid')}
            className={`rounded-md border px-2.5 py-1.5 text-sm ${
              view === 'grid' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`rounded-md border px-2.5 py-1.5 text-sm ${
              view === 'list' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="ml-2 hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-1" /> Add Store
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Store</DialogTitle>
                <DialogDescription>
                  Fill in the store information below. A temporary password will
                  be generated automatically.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 py-2">
                <Input
                  placeholder="Store name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  placeholder="Email *"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Wilaya (1–58)"
                  min={1}
                  max={58}
                  value={form.wilaya}
                  onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStore}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  type="button"
                >
                  {saving ? 'Saving…' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat title="Total Stores" value={stats.total.toLocaleString()} />
        <Stat title="Open" value={stats.open.toLocaleString()} />
        <Stat title="Closed" value={stats.closed.toLocaleString()} />
        <Stat title="Top Store" value={stats.topStore} />
      </div>

      {/* Search */}
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-sm p-2 rounded-xl border flex items-center gap-2 shadow-sm">
        <Search className="h-4 w-4 text-gray-400 ml-1" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Store…"
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
        <button className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50 flex items-center gap-1">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {/* Store List */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 text-sm">
          Loading stores…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500 text-sm">
          No stores found.
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
          {filtered.map((s) => (
            <StoreCard key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Phone</Th>
                <Th>Address</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <Td>{s.name ?? '—'}</Td>
                  <Td>
                    <Badge kind={s.status === 'open' ? 'green' : 'rose'}>
                      {s.status ?? '—'}
                    </Badge>
                  </Td>
                  <Td>{s.phone ?? '—'}</Td>
                  <Td>{s.address ?? '—'}</Td>
                  <Td>
                    <Link
                      href={`/superadmin/stores/${s.id}`}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      View
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Add Button (Mobile) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-emerald-700 md:hidden">
            <Plus className="h-4 w-4" />
            Add Store
          </button>
        </DialogTrigger>
      </Dialog>
    </div>
  )
}

/* ---------- Subcomponents ---------- */
function StoreCard({ s }: { s: any }) {
  return (
    <Link
      href={`/superadmin/stores/${s.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900 truncate">
          {s.name ?? 'Unnamed'}
        </h3>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        <MapPin className="h-3 w-3" />
        <span className="truncate">{s.address ?? 'No address'}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <Phone className="h-3 w-3" />
        <span>{s.phone ?? '—'}</span>
      </div>
      <div className="flex items-center justify-between">
        <Badge kind={s.status === 'open' ? 'green' : 'rose'}>
          {s.status ?? '—'}
        </Badge>
        <div className="flex items-center gap-1 text-amber-500">
          <Star className="h-3 w-3" />
          <span className="text-xs">{s.rating ?? '—'}</span>
        </div>
      </div>
    </Link>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>
}
