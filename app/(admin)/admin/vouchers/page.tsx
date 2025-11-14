'use client'

import VoucherHeader from '@/components/VoucherHeader'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Menu, Combobox } from '@headlessui/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'
import VoucherModal from '@/components/VoucherModal'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useLanguage } from '@/lib/useLanguage'
import { useSearchParams } from 'next/navigation'



import {
  Search,
  X,
  Calendar,
  Check,
  ChevronDown,
  Filter,
  ListChecks,
} from 'lucide-react'


export default function AdminVouchersPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Signing you in…</div>}>
      <AdminVouchersInner/>
    </Suspense>
  )
}

/* =================== MAIN PAGE =================== */
 function AdminVouchersInner() {
  const { t, lang } = useLanguage()
  const supabase = createClientComponentClient()
  const params = useSearchParams()

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)


  
  /* ---------- Pagination ---------- */
  const ITEMS_PER_PAGE = 10
  const [page, setPage] = useState(1)
  const totalPages = useMemo(() => Math.ceil(rows.length / ITEMS_PER_PAGE), [rows])

 // ✅ Read status from query (?status=active)
  useEffect(() => {
    const s = params.get('status')
    if (s) setSelectedStatus(s)
  }, [params])

 // ✅ Fetch current user store_id and vouchers
  useEffect(() => {
    ;(async () => {
      setLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user.id
      if (!userId) return

      // fetch role/store_id
      const { data: roleRow } = await supabase
        .from('me_effective_role')
        .select('store_id')
        .eq('user_id', userId)
        .maybeSingle()

        
      const currentStoreId = roleRow?.store_id || null
      setStoreId(currentStoreId)

      // fetch vouchers (filter by store)
      let query = supabase
        .from('vouchers')
        .select('*')
        .order('activated_at', { ascending: false })

      if (currentStoreId) query = query.eq('store_id', currentStoreId)
      if (selectedStatus !== 'all') query = query.eq('status', selectedStatus)

      const { data, error } = await query
      if (error) console.error('Error loading vouchers:', error)
      setRows(data || [])
      setLoading(false)
    })()
  }, [selectedStatus, supabase]) 

  
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
  data = data.filter((v) => v.buyer_name?.toLowerCase().includes(t))
}
// 📅 DATE FILTER
  if (selectedDate) {
    data = data.filter((v) => {
      const d = new Date(v.activated_at).toISOString().slice(0, 10)
      return d === selectedDate
    })
  }
    return data
  }, [rows, q, selectedStore, selectedStatus])

/* -------- Totals Calculation -------- */
const totals = useMemo(() => {
  const totalInitial = filtered.reduce((sum, v) => sum + (v.initial_amount || 0), 0)
  const totalBalance = filtered.reduce((sum, v) => sum + (v.balance || 0), 0)
  const consumed = totalInitial - totalBalance
  return { totalInitial, totalBalance, consumed }
}, [filtered])


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
      

{/* ===== Totals Section (Always One Row) ===== */}
{!loading && filtered.length > 0 && (
  <div
    className="
      bg-white/70 border border-gray-100 shadow-sm p-2 rounded-xl text-sm
      flex  items-center gap-2 text-center overflow-x-auto no-scrollbar
      whitespace-nowrap mb-0
    "
  >
    {/* Initial */}
    <div className="flex flex-col min-w-[100px]">
      <span className="text-gray-600 text-xs">
        {selectedStatus === 'all'
          ? t.totalAllVouchers || 'All vouchers'
          : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} total`}
      </span>
      <span className="font-semibold text-gray-900 text-base">
        {fmtDZD(totals.totalInitial, lang)}
      </span>
    </div>

    {/* Remaining */}
    <div className="flex flex-col min-w-[100px] text-center">
      <span className="text-gray-600 text-xs">Remaining</span>
      <span className="font-semibold text-emerald-700 text-base">
        {fmtDZD(totals.totalBalance, lang)}
      </span>
    </div>

    {/* Consumed */}
    <div className="flex flex-col min-w-[100px] text-center">
      <span className="text-gray-600 text-xs">Consumed</span>
      <span className="font-semibold text-rose-600 text-base">
        {fmtDZD(totals.consumed, lang)}
      </span>
    </div>
  </div>
)}




{/* ===== Filters Section ===== */}
<div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 p-2 shadow-sm space-y-4">
  {/* 🔍 Search bar */}
  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
    <Search className="h-4 w-4 text-gray-400" />
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder={t.searchByClient || 'Search by client name'}
      className="flex-1 bg-transparent text-sm focus:outline-none"
    />
  </div>
    {/* 📅 Date Picker */}
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
      <Calendar className="h-4 w-4 text-gray-400" />
      <input
        type="date"
        className="flex-1 bg-transparent text-sm focus:outline-none"
        value={selectedDate || ''}
        onChange={(e) => setSelectedDate(e.target.value || null)}
      />
    </div>

 

  

   {/* ⚡ Quick Filter Bar (NEW) */}
  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
    {[
      { label: t.all, value: 'all' },
      { label: t.active, value: 'active' },
      { label: t.redeemed, value: 'redeemed' },
      { label: t.blank, value: 'blank' },
    
    ].map((f) => (
      <button
        key={f.value}
        onClick={() => setSelectedStatus(f.value)}
        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
          selectedStatus === f.value
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
        }`}
      >
        {f.label}
      </button>
    ))}
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
             <p className="mt-1 text-xs text-gray-400">
  Activated:{' '}
  {v.activated_at
    ? new Date(v.activated_at).toLocaleDateString()
    : 'Not activated yet'}
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
                <Th rtl={lang === 'ar'}>'activated'</Th>
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
                  <Td>{new Date(v.activated_at).toLocaleDateString()}</Td>

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

/* ---------- AddVoucherModal (with Combobox) ---------- */
/* ---------- AddVoucherModal (Tayseer UI) ---------- */
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
  const [query, setQuery] = useState('')
  const filtered =
    query === ''
      ? stores
      : stores.filter((s: any) => s.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 overflow-auto">
      <div
        className="
          relative w-full max-w-sm rounded-2xl 
          bg-white/95 border border-[var(--c-bank)]/20 
          shadow-[0_8px_30px_rgba(0,0,0,0.08)] 
          backdrop-blur-md p-6 space-y-4 
          animate-in fade-in-0 zoom-in-95 duration-200
        "
      >
        {/* ✖ Close */}
        <button
          onClick={onClose}
          className="
            absolute right-3 top-3 text-[var(--c-text)]/60 
            hover:text-[var(--c-text)] transition-colors
          "
        >
          <X className="h-5 w-5" />
        </button>

        {/* 🏷 Title */}
        <h2 className="text-lg font-semibold text-[var(--c-primary)]">
          Create Blank Vouchers
        </h2>

        {/* 🏬 Store selector */}
        <div className="space-y-2">
          <Combobox value={storeId} onChange={setStoreId}>
            <Combobox.Label className="text-sm text-[var(--c-text)]/70">
              Store
            </Combobox.Label>
            <div className="relative mt-1">
              <Combobox.Input
                className="
                  w-full rounded-lg border border-[var(--c-bank)]/30
                  p-2.5 text-sm bg-white/90 backdrop-blur-sm
                  focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none
                  transition
                "
                onChange={(e) => setQuery(e.target.value)}
                displayValue={(id: string) =>
                  stores.find((s: any) => s.id === id)?.name ?? ''
                }
                placeholder="Search store..."
              />
              <Combobox.Options
                className="
                  absolute mt-1 max-h-48 w-full overflow-auto 
                  rounded-lg bg-white border border-[var(--c-bank)]/20 
                  shadow-lg text-sm z-10
                "
              >
                {filtered.length === 0 ? (
                  <div className="px-4 py-2 text-[var(--c-text)]/60">
                    No results
                  </div>
                ) : (
                  filtered.map((s: any) => (
                    <Combobox.Option
                      key={s.id}
                      value={s.id}
                      className={({ active }) =>
                        `cursor-pointer px-4 py-2 ${
                          active
                            ? 'bg-[var(--c-accent)]/10 text-[var(--c-accent)]'
                            : 'text-[var(--c-text)]'
                        }`
                      }
                    >
                      {s.name}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

        {/* 🔢 Count */}
        <div className="space-y-2">
          <label className="text-sm text-[var(--c-text)]/70">How many?</label>
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="
              w-full rounded-lg border border-[var(--c-bank)]/30
              p-2.5 text-sm bg-white/90 backdrop-blur-sm
              focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none
            "
          />
        </div>

        {/* 🟠 Submit */}
        <button
          disabled={addingLoading}
          onClick={onSubmit}
          className="
            w-full rounded-lg bg-[var(--c-accent)] text-white font-medium text-sm 
            px-4 py-2.5 hover:bg-[var(--c-accent)]/90 
            active:scale-95 transition-all disabled:opacity-50
          "
        >
          {addingLoading ? 'Creating…' : 'Create Vouchers'}
        </button>

        {/* 💡 Hint */}
        <p className="text-xs text-center text-[var(--c-text)]/60">
          Each voucher will be assigned a unique QR code automatically.
        </p>
      </div>
    </div>
  )
}

