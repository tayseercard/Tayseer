'use client'

import VoucherHeader from '@/components/VoucherHeader'
import { useEffect, useMemo, useState } from 'react'
import { Menu, Combobox } from '@headlessui/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'
import { Scanner } from '@yudiel/react-qr-scanner'
import VoucherModal from '@/components/VoucherModal'
import { useLanguage } from '@/lib/useLanguage'


import {
  Search,
  X,
  Calendar,
  Check,
  ChevronDown,
  Filter,
  ListChecks,
} from 'lucide-react'

/* ---------- Types ---------- */
type Store = { id: string; name: string }
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
export default function StoreVouchersPage() {
  const { t, lang } = useLanguage()
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null)
  const [adding, setAdding] = useState(false)
  const [addingLoading, setAddingLoading] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [count, setCount] = useState(1)
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

 

  const getStoreName = (id: string) => stores.find((s) => s.id === id)?.name ?? '—'

 

  /* -------- UI -------- */
  return (
<div
      className={`min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-6 space-y-8 ${
        lang === 'ar' ? 'rtl' : 'ltr'
      }`}
    >
      

{/* ===== Filters Section ===== */}
<div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 p-4 shadow-sm space-y-3">

  {/* 🔍 Search bar */}
  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
    <Search className="h-4 w-4 text-gray-400" />
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder={t.search}
      className="flex-1 bg-transparent text-sm focus:outline-none"
    />
  </div>

  {/* ⚙️ Filters Row */}
  <div className="flex justify-between gap-2 text-sm">

    {/* 🗓 Date Sort Menu */}
    <Menu as="div" className="relative flex-1">
      <Menu.Button className="w-full flex items-center justify-center gap-2 border rounded-lg py-2 hover:bg-gray-50">
        <Calendar className="h-4 w-4 text-gray-500" />
        {t.date}
        <ChevronDown className="h-3 w-3" />
      </Menu.Button>
      <Menu.Items className="absolute z-50 mt-1 w-full rounded-lg bg-white border shadow-lg">
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={() => {
                setRows([...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
              }}
              className={`w-full text-left px-4 py-2 ${active ? 'bg-gray-50' : ''}`}
            >
              {t.newestFirst}
            </button>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={() => {
                setRows([...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
              }}
              className={`w-full text-left px-4 py-2 ${active ? 'bg-gray-50' : ''}`}
            >
              {t.oldestFirst}
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>

    {/* 🎯 Status Filter Menu */}
    <Menu as="div" className="relative flex-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
  <Menu.Button
    className="
      w-full flex items-center justify-center gap-2 
      border rounded-lg py-2 hover:bg-gray-50
    "
  >
    <ListChecks className="h-4 w-4 text-gray-500" />
    {t.status}
    <ChevronDown className={`h-3 w-3 ${lang === 'ar' ? 'rotate-180' : ''}`} />
  </Menu.Button>

  <Menu.Items
    className="
      absolute z-50 mt-1 w-full rounded-lg bg-white border shadow-lg 
      text-sm overflow-hidden
    "
  >
    {['all', 'blank', 'active', 'redeemed', 'expired', 'void'].map((status) => (
      <Menu.Item key={status}>
        {({ active }) => (
          <button
            onClick={() => setSelectedStatus(status)}
            className={`
              w-full text-left px-4 py-2 flex justify-between items-center 
              capitalize transition-all
              ${active ? 'bg-gray-50' : ''}
              ${lang === 'ar' ? 'text-right flex-row-reverse' : ''}
            `}
          >
            <span>{t[status]}</span>
            {selectedStatus === status && (
              <Check className={`h-4 w-4 text-emerald-600 ${lang === 'ar' ? 'mr-1' : 'ml-1'}`} />
            )}
          </button>
        )}
      </Menu.Item>
    ))}
  </Menu.Items>
</Menu>


    
  </div>
</div>


      {/* Mobile Cards */}
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

      {/* Desktop Table */}
    
      <div className="hidden md:block rounded-xl bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 350px)' }}>
        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading vouchers...</div>
        ) : paginated.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No vouchers found.</div>
        ) : (
            <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <Th rtl={lang === 'ar'}>{t.buyer}</Th>
                <Th rtl={lang === 'ar'}>{t.recipient}</Th>
                <Th rtl={lang === 'ar'}>{t.store}</Th>
                <Th rtl={lang === 'ar'}>{t.code}</Th>
                <Th rtl={lang === 'ar'}>{t.Status}</Th>
                <Th rtl={lang === 'ar'}>{t.balance}</Th>
                <Th rtl={lang === 'ar'}>{t.created}</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((v) => (
                <tr key={v.id}
                  onClick={() => setSelectedVoucher(v)}
                  className="border-t hover:bg-gray-50 cursor-pointer">
                  <Td>{v.buyer_name ?? '—'}</Td>
                  <Td>{v.recipient_name ?? '—'}</Td>
                  <Td>{getStoreName(v.store_id)}</Td>
                  <Td><code className="rounded bg-gray-100 px-1.5 py-0.5">{v.code}</code></Td>
                  <Td><StatusPill status={v.status} /></Td>
                  <Td>{fmtDZD(v.balance, lang)}</Td>
                  <Td>{new Date(v.created_at).toLocaleDateString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
                </div>

        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50">
            {t.prev}
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50">
            {t.next}
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

    
    </div>
  )
}

/* ---------- Helpers ---------- */
function Th({ children, rtl = false }: { children: React.ReactNode; rtl?: boolean }) {
  return (
    <th
      className={`px-3 py-2 text-xs font-medium text-gray-500 ${
        rtl ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
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
function fmtDZD(n: number, lang: 'fr' | 'en' | 'ar' = 'fr') {
  const locale =
    lang === 'ar' ? 'ar-DZ' :
    lang === 'en' ? 'en-DZ' :
    'fr-DZ'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(n)
}




