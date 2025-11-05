'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'
import { Scanner } from '@yudiel/react-qr-scanner'
import VoucherModal from '@/components/VoucherModal'
import { Stat } from '@/components/ui/stat'
import {
  Gift,
  QrCode,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'

/* ---------- Types ---------- */
type Store = {
  id: string
  name: string
}

type Voucher = {
  id: string
  store_id: string
  code: string
  buyer_name?: string | null
  recipient_name?: string | null
  status: string
  initial_amount: number
  balance: number
  created_at: string
}

/* =================== MAIN PAGE =================== */
export default function AdminVouchersPage() {
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null)
  const [adding, setAdding] = useState(false)
  const [addingLoading, setAddingLoading] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [count, setCount] = useState(1)

  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [selectedStore, setSelectedStore] = useState<'all' | string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | string>('all')

  /* ---------- Pagination ---------- */
  const ITEMS_PER_PAGE = 10
  const [page, setPage] = useState(1)
  const totalPages = useMemo(() => Math.ceil(rows.length / ITEMS_PER_PAGE), [rows])

  /* -------- Load data -------- */
  async function loadData() {
    setLoading(true)
    const [{ data: vouchers }, { data: storesData }] = await Promise.all([
      supabase.from('vouchers').select('*').order('created_at', { ascending: false }),
      supabase.from('stores').select('id, name'),
    ])
    setRows(vouchers || [])
    setStores(storesData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  /* -------- Filters -------- */
  const filtered = useMemo(() => {
    let data = rows
    if (selectedStore !== 'all') data = data.filter((v) => v.store_id === selectedStore)
    if (selectedStatus !== 'all') data = data.filter((v) => v.status === selectedStatus)
    if (q.trim()) {
      const t = q.trim().toLowerCase()
      data = data.filter(
        (v) =>
          v.code?.toLowerCase().includes(t) ||
          v.buyer_name?.toLowerCase().includes(t)
      )
    }
    return data
  }, [rows, q, selectedStore, selectedStatus])

  /* -------- Paginated data -------- */
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  /* -------- Stats -------- */
  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter((v) => v.status === 'active').length
    const redeemed = rows.filter((v) => v.status === 'redeemed').length
    const blank = rows.filter((v) => v.status === 'blank').length
    return { total, active, redeemed, blank }
  }, [rows])

  const getStoreName = (id: string) => stores.find((s) => s.id === id)?.name ?? '—'

  /* -------- QR Scan -------- */
  async function handleScan(result: string | null) {
    if (!result) return
    setScanError(null)
    setScanning(false)

    try {
      const code = result.includes('/') ? result.split('/').pop()! : result.trim()
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .maybeSingle()

      if (error || !data) {
        setScanError('Voucher not found.')
        return
      }
      setSelectedVoucher(data)
    } catch (e: any) {
      setScanError(e.message || 'Error scanning QR.')
    }
  }

  /* -------- Create Blank Vouchers -------- */
  async function createBlankVouchers() {
    if (!storeId || count < 1) return alert('Select store and count.')
    setAddingLoading(true)

    const rowsToInsert = Array.from({ length: count }).map(() => ({
      store_id: storeId,
      code: 'MKD-' + uuidv4().split('-')[0].toUpperCase(),
      status: 'blank',
      initial_amount: 0,
      balance: 0,
    }))

    const { error } = await supabase.from('vouchers').insert(rowsToInsert)
    setAddingLoading(false)

    if (error) return alert('❌ Error: ' + error.message)

    alert(`✅ Created ${count} blank voucher(s).`)
    setAdding(false)
    setStoreId(null)
    setCount(1)
    loadData()
  }

  /* -------- UI -------- */
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-6 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-semibold">Vouchers</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Vouchers
          </button>
          <button
            onClick={() => setScanning(true)}
            className="flex items-center gap-2 rounded-md bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700"
          >
            <QrCode className="h-4 w-4" /> Scan QR
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

    

      {/* Filters */}
      {/* ===== Filters Section ===== */}
<div className="rounded-xl bg-white border border-gray-100 p-4 shadow-sm space-y-3">
  {/* 🔍 Search bar */}
  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
    <Search className="h-4 w-4 text-gray-400" />
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Search"
      className="flex-1 bg-transparent text-sm focus:outline-none"
    />
  </div>

  {/* ⏱ Filters row */}
  <div className="flex justify-between gap-2 text-sm">
    <button className="flex-1 flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
      </svg>
      Date
      <span className="ml-1">▾</span>
    </button>

    <button
      onClick={() => setSelectedStatus(selectedStatus === 'all' ? 'active' : 'all')}
      className="flex-1 flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
      </svg>
      Status
      <span className="ml-1">▾</span>
    </button>

    <button className="flex-1 flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18M4 8h16M5 12h14M6 16h12M7 20h10" />
      </svg>
      Filter
      <span className="ml-1">▾</span>
    </button>
  </div>
</div>


      {/* 📱 Mobile — Cards layout */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="py-10 text-center text-gray-400">Loading vouchers...</div>
        ) : paginated.length === 0 ? (
          <div className="py-10 text-center text-gray-400">No vouchers found.</div>
        ) : (
          paginated.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedVoucher(v)}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">{v.buyer_name ?? '—'}</h3>
                <StatusPill status={v.status} />
              </div>

              <div className="mt-2 text-sm text-gray-600">
                <p>Recipient: {v.recipient_name ?? '—'}</p>
                <p>Store: {getStoreName(v.store_id)}</p>
              </div>

              <div className="mt-3 flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-500">Code: </span>
                  <code className="bg-gray-100 rounded px-1 py-0.5 text-xs">{v.code}</code>
                </div>
                <span className="font-medium text-emerald-700">{fmtDZD(v.balance)}</span>
              </div>

              <p className="mt-1 text-xs text-gray-400">
                Created: {new Date(v.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 💻 Desktop / Tablet — Table */}
      <div className="hidden md:block rounded-xl bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm overflow-y-auto"
           style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading vouchers...</div>
        ) : paginated.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No vouchers found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <Th>Buyer</Th>
                <Th>Recipient</Th>
                <Th>Store</Th>
                <Th>Code</Th>
                <Th>Status</Th>
                <Th>Initial</Th>
                <Th>Balance</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedVoucher(v)}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <Td>{v.buyer_name ?? '—'}</Td>
                  <Td>{v.recipient_name ?? '—'}</Td>
                  <Td>{getStoreName(v.store_id)}</Td>
                  <Td><code className="rounded bg-gray-100 px-1.5 py-0.5">{v.code}</code></Td>
                  <Td><StatusPill status={v.status} /></Td>
                  <Td>{fmtDZD(v.initial_amount)}</Td>
                  <Td>{fmtDZD(v.balance)}</Td>
                  <Td>{new Date(v.created_at).toLocaleDateString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Voucher Modal */}
      {selectedVoucher && (
        <VoucherModal
          voucher={selectedVoucher}
          supabase={supabase}
          onClose={() => setSelectedVoucher(null)}
          onRefresh={loadData}
        />
      )}

      {/* Add Voucher Modal */}
      {adding && (
        <AddVoucherModal
          stores={stores}
          storeId={storeId}
          setStoreId={setStoreId}
          count={count}
          setCount={setCount}
          addingLoading={addingLoading}
          onClose={() => setAdding(false)}
          onSubmit={createBlankVouchers}
        />
      )}

      {/* Scanner Modal */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl p-4 w-[95%] max-w-md shadow-lg">
            <button
              onClick={() => setScanning(false)}
              className="absolute right-2 top-2 text-gray-500 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-center font-medium mb-2">Scan a voucher QR</h2>
            <Scanner
              onScan={(results) => handleScan(results[0]?.rawValue || null)}
              onError={(err) => console.error(err)}
              constraints={{ facingMode: 'environment' }}
            />
            {scanError && (
              <p className="mt-3 text-center text-sm text-rose-600">{scanError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Small Helpers ---------- */
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
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${map[status] ?? map.blank}`}>
      {status}
    </span>
  )
}
function fmtDZD(n: number) {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(n)
}

/* ---------- AddVoucherModal ---------- */
function AddVoucherModal({
  stores,
  storeId,
  setStoreId,
  count,
  setCount,
  addingLoading,
  onClose,
  onSubmit,
}: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold mb-3">Create Blank Vouchers</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Store</label>
            <select
              value={storeId ?? ''}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            >
              <option value="">Select store</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">How many?</label>
            <input
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full border rounded-md p-2 text-sm"
            />
          </div>
          <button
            disabled={addingLoading}
            onClick={onSubmit}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {addingLoading ? 'Creating…' : 'Create Vouchers'}
          </button>
        </div>
      </div>
    </div>
  )
}
