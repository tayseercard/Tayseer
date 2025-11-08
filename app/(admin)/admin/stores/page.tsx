'use client'

import StoresHeader from '@/components/StoresHeader'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Store as StoreIcon,
  LayoutGrid,
  List,
  Plus,
  Search,
  Calendar,
  Filter,
  ListChecks,
  ChevronDown,
  Check,
  X,
  MapPin,
  Phone,
  ChevronRight,
  Star,
} from 'lucide-react'
import { Menu } from '@headlessui/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stat } from '@/components/ui/stat'
import { useLanguage } from '@/lib/useLanguage'

export default function AdminStoresPage() {
  const supabase = createClientComponentClient()

  const [rows, setRows] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedStatus, setSelectedStatus] = useState<'all' | string>('all')
  const [selectedWilaya, setSelectedWilaya] = useState<'all' | string>('all')
  const { t } = useLanguage()
 
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

  /* ---------- Filters ---------- */
  const filteredData = useMemo(() => {
    let data = [...rows]

    if (selectedStatus !== 'all') {
      data = data.filter((s) => s.status === selectedStatus)
    }

    if (selectedWilaya !== 'all') {
      data = data.filter((s) => s.wilaya?.toString() === selectedWilaya)
    }

    if (q.trim()) {
      const t = q.trim().toLowerCase()
      data = data.filter(
        (s) =>
          s.name?.toLowerCase().includes(t) ||
          s.address?.toLowerCase().includes(t)
      )
    }

    return data
  }, [rows, q, selectedStatus, selectedWilaya])

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-6 space-y-8 overflow-y-auto">

      {/* 🌿 Header */}
      <StoresHeader onAdd={() => setOpen(true)} />

    

      {/* ===== Filters Section ===== */}
      <div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 p-4 shadow-sm space-y-3">

        {/* 🔍 Search bar */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>

        {/* ⚙️ Filters Row */}
        <div className="flex justify-between gap-2 text-sm">
          {/* 🗓 Sort by Date */}
          <Menu as="div" className="relative flex-1">
            <Menu.Button className="w-full flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50">
              <Calendar className="h-4 w-4 text-gray-500" />
              {t.sort}
              <ChevronDown className="h-3 w-3" />
            </Menu.Button>
            <Menu.Items className="absolute z-50 mt-1 w-full rounded-lg bg-white border shadow-lg">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() =>
                      setRows([...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
                    }
                    className={`w-full text-left px-4 py-2 ${active ? 'bg-gray-50' : ''}`}
                  >
                    {t.newestFirst}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() =>
                      setRows([...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
                    }
                    className={`w-full text-left px-4 py-2 ${active ? 'bg-gray-50' : ''}`}
                  >
                    {t.oldestFirst}
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>


          {/* 🧩 Wilaya Filter */}
          <Menu as="div" className="relative flex-1">
            <Menu.Button className="w-full flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50">
              <Filter className="h-4 w-4 text-gray-500" />
              {t.wilaya}
              <ChevronDown className="h-3 w-3" />
            </Menu.Button>
            <Menu.Items className="absolute z-50 mt-1 w-full rounded-lg bg-white border shadow-lg max-h-48 overflow-y-auto">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setSelectedWilaya('all')}
                    className={`w-full text-left px-4 py-2 ${active ? 'bg-gray-50' : ''}`}
                  >
                    All wilayas
                  </button>
                )}
              </Menu.Item>
              {[...new Set(rows.map((s) => s.wilaya))].map((w) => (
                <Menu.Item key={w}>
                  {({ active }) => (
                    <button
                      onClick={() => setSelectedWilaya(w)}
                      className={`w-full text-left px-4 py-2 flex justify-between ${active ? 'bg-gray-50' : ''}`}
                    >
                      Wilaya {w}
                      {selectedWilaya === w && <Check className="h-4 w-4 text-emerald-600" />}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {/* 📱 Cards / 💻 Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading stores...</div>
      ) : filteredData.length === 0 ? (
        <div className="py-20 text-center text-gray-400">No stores found.</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
          {filteredData.map((s) => (
            <StoreCard key={s.id} s={s} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <Th>{t.name}</Th>
                <Th>{t.status}</Th>
                <Th>{t.wilaya}</Th>
                <Th>{t.phone}</Th>
                <Th>{t.address}</Th>
                <Th>{t.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50 cursor-pointer">
                  <Td>{s.name ?? '—'}</Td>
                  <Td>
                    <Badge kind={s.status === 'open' ? 'green' : 'rose'}>
                      {s.status ?? '—'}
                    </Badge>
                  </Td>
                  <Td>{s.wilaya ?? '—'}</Td>
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
  <DialogContent
    className="
      sm:max-w-md rounded-2xl border border-[var(--c-bank)]/20
      bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.08)]
      text-[var(--c-text)]
      p-6 space-y-4 animate-in fade-in-0 zoom-in-95 duration-200
    "
  >
    {/* === Header === */}
    <DialogHeader className="space-y-1">
      <DialogTitle className="text-lg font-semibold text-[var(--c-primary)]">
        {t.addStoreTitle}
      </DialogTitle>
      <p className="text-sm text-[var(--c-text)]/70">
        {t.addStoreDesc}
      </p>
    </DialogHeader>

    {/* === Form Fields === */}
    <div className="flex flex-col gap-3 pt-2">
      <Input
        placeholder={t.storeName}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="
          border border-[var(--c-bank)]/30 rounded-lg
          focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none
          bg-white/90 backdrop-blur-sm text-sm
        "
      />
      <Input
        placeholder={t.email}
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="
          border border-[var(--c-bank)]/30 rounded-lg
          focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none
          bg-white/90 backdrop-blur-sm text-sm
        "
      />
      <Input
        placeholder={t.phone}
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="
          border border-[var(--c-bank)]/30 rounded-lg
          focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none
          bg-white/90 backdrop-blur-sm text-sm
        "
      />
      <Input
        placeholder={t.address}
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        className="
          border border-[var(--c-bank)]/30 rounded-lg
          focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none
          bg-white/90 backdrop-blur-sm text-sm
        "
      />
      <Input
        type="number"
        placeholder={t.wilayaRange}
        min={1}
        max={58}
        value={form.wilaya}
        onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
        className="
          border border-[var(--c-bank)]/30 rounded-lg
          focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none
          bg-white/90 backdrop-blur-sm text-sm
        "
      />
    </div>

    {/* === Footer Buttons === */}
    <DialogFooter className="flex justify-end gap-2 pt-2">
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
        className="
          border border-[var(--c-bank)]/40 
          text-[var(--c-text)]/80 hover:bg-[var(--section-bg)]
          rounded-lg transition
        "
      >
        {t.cancel}
      </Button>

      <Button
        onClick={handleAddStore}
        disabled={saving}
        className="
          rounded-lg bg-[var(--c-accent)] text-white font-medium
          px-4 py-2 text-sm
          hover:bg-[var(--c-accent)]/90 active:scale-95 transition
          disabled:opacity-50
        "
      >
{saving ? t.saving : t.addStore}
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
