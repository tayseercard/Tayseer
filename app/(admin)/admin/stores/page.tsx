'use client'
import StoresHeader from '@/components/StoresHeader'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Store as StoreIcon,
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
  MapPin,
  Phone,
  ChevronRight,
  Star,
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import VoucherHeader from '@/components/VoucherHeader'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stat } from '@/components/ui/stat'

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
    open: 0,
    closed: 0,
  })

  /* ---------- Load Data ---------- */
  const loadStores = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('stores').select('*')
      if (error) throw error
      setRows(data || [])
      setFiltered(data || [])
      setStats({
        total: data?.length || 0,
        open: data?.filter((s) => s.status === 'open').length || 0,
        closed: data?.filter((s) => s.status === 'closed').length || 0,
      })
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
    const t = q.trim().toLowerCase()
    if (!t) setFiltered(rows)
    else {
      setFiltered(
        rows.filter(
          (s) =>
            (s.name ?? '').toLowerCase().includes(t) ||
            (s.address ?? '').toLowerCase().includes(t)
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
      const res = await fetch('/api/admin/add-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to create store')

      alert(`✅ Store "${result.store.name}" created successfully.`)
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-6 space-y-8">

      {/* 🌿 Modern Header */}
<StoresHeader onAdd={() => setOpen(true)} />

      {/* 🧮 Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat title="Total Stores" value={stats.total.toLocaleString()} />
        <Stat title="Open" value={stats.open.toLocaleString()} />
        <Stat title="Closed" value={stats.closed.toLocaleString()} />
      </div>

      {/* 🔍 Search Bar */}
      <div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 p-4 shadow-sm flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stores..."
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
        <div className="flex gap-1">
          <button
            onClick={() => setView('grid')}
            className={`rounded-md border p-1.5 ${view === 'grid' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`rounded-md border p-1.5 ${view === 'list' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 📱 Mobile Cards / 💻 Desktop Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading stores...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400">No stores found.</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
          {filtered.map((s) => (
            <StoreCard key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b">
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
                <tr key={s.id} className="border-t hover:bg-gray-50 cursor-pointer">
                  <Td>{s.name ?? '—'}</Td>
                  <Td>
                    <Badge kind={s.status === 'open' ? 'green' : 'rose'}>
                      {s.status ?? '—'}
                    </Badge>
                  </Td>
                  <Td>{s.phone ?? '—'}</Td>
                  <Td>{s.address ?? '—'}</Td>
                  <Td>
                    <Link href={`/admin/stores/${s.id}`} className="text-blue-600 text-xs hover:underline">
                      View
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ➕ Add Store Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <Input placeholder="Store name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input type="number" placeholder="Wilaya (1–58)" min={1} max={58} value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })} />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStore} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving…' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- Subcomponents ---------- */
function StoreCard({ s }: { s: any }) {
  return (
    <Link
      href={`/admin/stores/${s.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900 truncate">{s.name ?? 'Unnamed'}</h3>
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
        <Badge kind={s.status === 'open' ? 'green' : 'rose'}>{s.status ?? '—'}</Badge>
        <div className="flex items-center gap-1 text-amber-500">
          <Star className="h-3 w-3" />
          <span className="text-xs">{s.rating ?? '—'}</span>
        </div>
      </div>
    </Link>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>
}
