'use client'

import StoresHeader from '@/components/StoresHeader'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Store as StoreIcon,
  Search,
  X,
  Phone,
  ArrowUpDown,
  Mail,
} from 'lucide-react'
import { Menu } from '@headlessui/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/useLanguage'
import { wilayaLabel } from '@/lib/algeria'

export default function AdminStoresPage() {
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'all' | string>('all')
  const [showFilters, setShowFilters] = useState(false)
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
    inactive: 0,
    closed: 0,
  })

  /* ---------- Load Data ---------- */
  const loadStores = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error

      setRows(data || [])
      setStats({
        total: data?.length || 0,
        open: data?.filter((s) => s.status === 'open').length || 0,
        inactive: data?.filter((s) => s.status === 'inactive').length || 0,
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

    if (q.trim()) {
      const term = q.trim().toLowerCase()
      data = data.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.address?.toLowerCase().includes(term)
      )
    }

    return data
  }, [rows, q, selectedStatus])

  /* ---------- Actions ---------- */
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

  async function handleDeleteStore(id: string, name: string) {
    if (!confirm(`❌ Delete store "${name}"? This action cannot be undone.`))
      return

    try {
      const res = await fetch('/api/admin/delete-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: id }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      alert(`🗑️ Store "${name}" deleted.`)
      loadStores()
    } catch (err: any) {
      alert('❌ ' + err.message)
    }
  }

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900">

      {/* 🟢 Main Wrapper */}
      <div className="flex flex-col px-4 sm:px-6 md:px-8 py-4 space-y-4">

        {/* 🌿 Header */}
        <StoresHeader onAdd={() => setOpen(true)} />

        {/* 🔵 Status Tabs Row */}
        <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto scrollbar-hide shrink-0">
          {[
            { key: 'all', label: 'Tous', count: stats.total },
            { key: 'open', label: 'Actifs', count: stats.open },
            { key: 'inactive', label: 'En attente', count: stats.inactive },
            { key: 'closed', label: 'Fermés', count: stats.closed },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setSelectedStatus(st.key)}
              className={`flex items-center gap-1.5 pt-4 pb-2 px-3 text-xs font-bold transition-all relative whitespace-nowrap ${selectedStatus === st.key ? 'text-[var(--c-accent)]' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <span>{st.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${selectedStatus === st.key ? 'bg-[var(--c-accent)] text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                {st.count}
              </span>
              {selectedStatus === st.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--c-accent)]" />
              )}
            </button>
          ))}

          <div className="ml-auto pr-2 pb-2 pt-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg transition-all ${showFilters ? 'bg-[var(--c-accent)] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ===== Filters Section ===== */}
        {showFilters && (
          <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 p-3 shadow-sm animate-in slide-in-from-top-2 fade-in duration-200 shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 flex items-center gap-2 bg-white/50 rounded-xl px-3 py-2 border border-gray-100 h-10">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={q}
                  autoFocus
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-300 font-medium"
                />
              </div>

              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center justify-center h-10 w-10 border border-gray-100 bg-white/50 rounded-xl hover:bg-white transition-colors">
                  <ArrowUpDown className="h-4 w-4 text-gray-500" />
                </Menu.Button>
                <Menu.Items className="absolute z-50 mt-1 right-0 w-48 rounded-2xl bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setRows([...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))}
                        className={`w-full text-left px-4 py-3 text-xs font-bold ${active ? 'bg-gray-50 text-[var(--c-accent)]' : 'text-gray-600'}`}
                      >
                        {t.newestFirst}
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setRows([...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))}
                        className={`w-full text-left px-4 py-3 text-xs font-bold border-t border-gray-50 ${active ? 'bg-gray-50 text-[var(--c-accent)]' : 'text-gray-600'}`}
                      >
                        {t.oldestFirst}
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            </div>
          </div>
        )}

        {/* 📱 Main List (Scrollable) */}
        <div className="pb-8">
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-medium">Loading stores...</div>
          ) : filteredData.length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-medium">No stores found.</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold tracking-wider">Store</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Contact</th>
                      <th className="px-6 py-4 font-bold tracking-wider">Location</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {filteredData.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                        onClick={() => window.location.href = `/admin/stores/${encodeURIComponent(s.name)}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 shrink-0 rounded-full border border-gray-100 bg-gray-50 overflow-hidden relative">
                              {s.logo_url ? (
                                <Image src={s.logo_url} alt={s.name} fill className="object-cover" />
                              ) : (
                                <StoreIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{s.name}</div>
                              <div className="text-xs text-gray-400">Inscrit: {new Date(s.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-gray-400" /> {s.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-400" /> {s.phone || '—'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              {wilayaLabel(s.wilaya)}
                            </span>
                            {s.address && <span className="text-xs text-gray-400 truncate max-w-[150px]">{s.address}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <Badge kind={s.status === 'open' ? 'green' : s.status === 'inactive' ? 'amber' : 'rose'}>
                              {s.status === 'open' ? 'Actif' : s.status === 'inactive' ? 'En attente' : 'Fermé'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteStore(s.id, s.name)}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Delete store"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm md:hidden divide-y divide-gray-50 overflow-hidden">
                {filteredData.map((s) => (
                  <StoreCard key={s.id} s={s} onDelete={handleDeleteStore} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ➕ Add Store Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-[var(--c-bank)]/20 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-[var(--c-text)] p-6 space-y-4 animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-[var(--c-primary)]">{t.addStoreTitle}</DialogTitle>
            <p className="text-sm text-[var(--c-text)]/70">{t.addStoreDesc}</p>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Input placeholder={t.storeName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-[var(--c-bank)]/30 rounded-lg focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none bg-white/90 backdrop-blur-sm text-sm" />
            <Input placeholder={t.email} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-[var(--c-bank)]/30 rounded-lg focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none bg-white/90 backdrop-blur-sm text-sm" />
            <Input placeholder={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border border-[var(--c-bank)]/30 rounded-lg focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none bg-white/90 backdrop-blur-sm text-sm" />
            <Input placeholder={t.address} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border border-[var(--c-bank)]/30 rounded-lg focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none bg-white/90 backdrop-blur-sm text-sm" />
            <Input type="number" placeholder={t.wilayaRange} min={1} max={58} value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })} className="border border-[var(--c-bank)]/30 rounded-lg focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none bg-white/90 backdrop-blur-sm text-sm" />
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="border border-[var(--c-bank)]/40 text-[var(--c-text)]/80 hover:bg-[var(--section-bg)] rounded-lg transition">{t.cancel}</Button>
            <Button onClick={handleAddStore} disabled={saving} className="rounded-lg bg-[var(--c-accent)] text-white font-medium px-4 py-2 text-sm hover:bg-[var(--c-accent)]/90 active:scale-95 transition disabled:opacity-50">{saving ? t.saving : t.addStore}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StoreCard({ s, onDelete }: { s: any; onDelete: (id: string, name: string) => void }) {
  return (
    <Link
      href={`/admin/stores/${s.id}`} // Using ID is safer if available, but keeping name for route consistency
      className="block p-4 hover:bg-gray-50 transition-all active:bg-gray-100 group relative"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 shrink-0 rounded-full border border-gray-100 bg-gray-50 overflow-hidden relative mt-0.5">
          {s.logo_url ? (
            <Image src={s.logo_url} alt={s.name} fill className="object-cover" />
          ) : (
            <StoreIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate text-sm mb-1.5 pr-16">
            {s.name ?? 'Unnamed'}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
              {wilayaLabel(s.wilaya)}
            </span>
            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 bg-gray-50/50 px-1.5 py-0.5 rounded border border-transparent truncate max-w-[150px]">
              <Phone size={10} className="text-gray-300" />
              {s.phone || '—'}
            </span>
            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 bg-gray-50/50 px-1.5 py-0.5 rounded border border-transparent truncate max-w-[180px]">
              <Mail size={10} className="text-gray-300" />
              {s.email || '—'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 absolute top-3 right-3">
          <Badge kind={s.status === 'open' ? 'green' : s.status === 'inactive' ? 'amber' : 'rose'}>
            {s.status === 'open' ? 'Actif' : s.status === 'inactive' ? 'En attente' : 'Fermé'}
          </Badge>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(s.id, s.name); }}
            className="p-1 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </Link>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{children}</td>
}
