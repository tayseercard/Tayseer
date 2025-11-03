'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  Store as StoreIcon,
  X,
  QrCode,
  Menu,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Scanner } from '@yudiel/react-qr-scanner'
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode'

export default function AdminStoresPage() {
  const supabase = createClientComponentClient()

  const [stores, setStores] = useState<any[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [q, setQ] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  // Voucher management
  const [selectedStore, setSelectedStore] = useState<any | null>(null)
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loadingVouchers, setLoadingVouchers] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addingLoading, setAddingLoading] = useState(false)
  const [countToAdd, setCountToAdd] = useState(1)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null)
  const [showFabActions, setShowFabActions] = useState(false)

  /* ---------- Load stores ---------- */
  async function loadStores() {
    setLoadingStores(true)
    const { data, error } = await supabase.from('stores').select('*')
    if (!error && data) setStores(data)
    setLoadingStores(false)
  }

  useEffect(() => {
    loadStores()
  }, [])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return stores
    return stores.filter((s) =>
      (s.name ?? '').toLowerCase().includes(t)
    )
  }, [stores, q])

  /* ---------- Load vouchers for store ---------- */
  async function loadVouchersForStore(storeId: string) {
    setLoadingVouchers(true)
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
    if (!error) setVouchers(data || [])
    setLoadingVouchers(false)
  }

  /* ---------- Create blank vouchers ---------- */
  async function createBlankVouchers() {
    if (!selectedStore) return
    setAddingLoading(true)
    const rows = Array.from({ length: countToAdd }).map(() => ({
      store_id: selectedStore.id,
      code: 'MKD-' + uuidv4().split('-')[0].toUpperCase(),
      status: 'blank',
      initial_amount: 0,
      balance: 0,
    }))
    const { error } = await supabase.from('vouchers').insert(rows)
    setAddingLoading(false)
    if (error) alert('❌ ' + error.message)
    else {
      alert(`✅ Created ${countToAdd} blank voucher(s).`)
      setAdding(false)
      loadVouchersForStore(selectedStore.id)
    }
  }

  /* ---------- Scan QR ---------- */
  async function handleScan(result: string | null) {
    if (!result) return
    setScanning(false)
    setScanError(null)
    try {
      const code = result.includes('/') ? result.split('/').pop()! : result.trim()
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .maybeSingle()
      if (error || !data) setScanError('Voucher not found.')
      else setSelectedVoucher(data)
    } catch (e: any) {
      setScanError(e.message)
    }
  }

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <StoreIcon className="h-5 w-5 text-emerald-600" />
          <h1 className="text-xl font-semibold">Stores</h1>
        </div>
        <button onClick={loadStores} className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-gray-100">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 border rounded-lg bg-white/80 p-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          className="flex-1 bg-transparent text-sm focus:outline-none"
          placeholder="Search stores..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Store list */}
      {loadingStores ? (
        <div className="py-20 text-center text-gray-500">Loading stores...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500">No stores found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setSelectedStore(s)
                loadVouchersForStore(s.id)
              }}
              className="p-4 border rounded-xl bg-white hover:shadow-lg transition cursor-pointer"
            >
              <h3 className="font-semibold">{s.name}</h3>
              <p className="text-sm text-gray-600">{s.address}</p>
              <p className="text-xs text-gray-500">{s.phone}</p>
            </div>
          ))}
        </div>
      )}

      {/* 🟢 VOUCHER MODAL */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl p-5 shadow-xl">
            <button
              onClick={() => setSelectedStore(null)}
              className="absolute right-3 top-3 text-gray-500 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold mb-3">
              {selectedStore.name} — Vouchers
            </h2>

            {loadingVouchers ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                Loading vouchers…
              </div>
            ) : vouchers.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No vouchers yet.
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-xl bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Buyer</Th>
                      <Th>Code</Th>
                      <Th>Status</Th>
                      <Th>Balance</Th>
                      <Th>Created</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v) => (
                      <tr
                        key={v.id}
                        className="border-t hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedVoucher(v)}
                      >
                        <Td>{v.buyer_name ?? '—'}</Td>
                        <Td>
                          <code className="rounded bg-gray-100 px-1.5 py-0.5">
                            {v.code}
                          </code>
                        </Td>
                        <Td>
                          <StatusPill status={v.status} />
                        </Td>
                        <Td>{fmtDZD(v.balance)}</Td>
                        <Td>{new Date(v.created_at).toLocaleDateString()}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Floating Add / Scan */}
            <div className="fixed bottom-5 right-5">
              <button
                onClick={() => setShowFabActions((p) => !p)}
                className="rounded-full bg-emerald-600 p-4 text-white shadow-lg hover:bg-emerald-700 transition"
              >
                <Menu className="h-6 w-6" />
              </button>
              {showFabActions && (
                <div className="absolute bottom-16 right-0 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setAdding(true)
                      setShowFabActions(false)
                    }}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm text-white"
                  >
                    <Plus className="h-4 w-4" /> Add Vouchers
                  </button>
                  <button
                    onClick={() => {
                      setScanning(true)
                      setScanError(null)
                      setShowFabActions(false)
                    }}
                    className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white"
                  >
                    <QrCode className="h-4 w-4" /> Scan QR
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* --- Helpers --- */
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    redeemed: 'bg-blue-50 text-blue-700 ring-blue-200',
    expired: 'bg-amber-50 text-amber-700 ring-amber-200',
    void: 'bg-rose-50 text-rose-700 ring-rose-200',
    blank: 'bg-gray-50 text-gray-700 ring-gray-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${
        map[status] ?? map.blank
      }`}
    >
      {status}
    </span>
  )
}
function fmtDZD(n: number) {
  try {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${n} DZD`
  }
}
