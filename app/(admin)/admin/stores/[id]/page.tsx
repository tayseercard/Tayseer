'use client'

import { useEffect, useMemo, useState } from 'react'
import StoreIdHeader from '@/components/StoreIdHeader'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X } from 'lucide-react'
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode'
import { v4 as uuidv4 } from 'uuid'
import PrintVouchersModal from '@/components/PrintVouchersModal'

type StoreRow = {
  id: string
  name: string | null
  address: string | null
  phone: string | null
  email: string | null
  wilaya: number | null
  created_at: string | null
}

type VoucherRow = {
  id: string
  code: string
  buyer_name: string | null
  buyer_phone?: string | null
  initial_amount: number
  balance: number
  status: 'blank' | 'active' | 'redeemed' | 'expired' | 'void'
  expires_at: string | null
  activated_at?: string | null
  created_at: string
}

export default function AdminStoreDetailPage() {
  const [printModal, setPrintModal] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { id: storeId } = useParams<{ id: string }>()

  const [store, setStore] = useState<StoreRow | null>(null)
  const [vouchers, setVouchers] = useState<VoucherRow[]>([])
  const [loadingStore, setLoadingStore] = useState(true)
  const [loadingVouchers, setLoadingVouchers] = useState(true)
  const [q, setQ] = useState('')

  // Modal states
  const [adding, setAdding] = useState(false)
  const [countToAdd, setCountToAdd] = useState(1)
  const [addingLoading, setAddingLoading] = useState(false)

  /* -------- Load store -------- */
  useEffect(() => {
    if (!storeId) return
    ;(async () => {
      setLoadingStore(true)
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .maybeSingle()
      setLoadingStore(false)

      if (error || !data) {
        console.error(error)
        router.replace('/admin/stores')
        return
      }
      setStore(data)
    })()
  }, [storeId, supabase, router])

  /* -------- Load vouchers -------- */
  async function loadVouchers() {
    if (!storeId) return
    setLoadingVouchers(true)
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    setLoadingVouchers(false)
    if (!error && data) setVouchers(data as VoucherRow[])
  }

  useEffect(() => {
    loadVouchers()
  }, [storeId])

  /* -------- Filter -------- */
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return vouchers
    return vouchers.filter(
      (v) =>
        (v.code ?? '').toLowerCase().includes(t) ||
        (v.buyer_name ?? '').toLowerCase().includes(t)
    )
  }, [vouchers, q])

  /* ---------- Pagination ---------- */
  const ITEMS_PER_PAGE = 10
  const [page, setPage] = useState(1)

  const totalPages = useMemo(
    () => Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1,
    [filtered]
  )

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1)
  }, [q])

  /* 🟩 Create blank vouchers */
  async function createBlankVouchers() {
    if (!storeId || countToAdd < 1) return
    setAddingLoading(true)

    const rows = Array.from({ length: countToAdd }).map(() => ({
      store_id: storeId,
      code: 'MKD-' + uuidv4().split('-')[0].toUpperCase(),
      status: 'blank',
      initial_amount: 0,
      balance: 0,
    }))

    const { error } = await supabase.from('vouchers').insert(rows)
    setAddingLoading(false)

    if (error) {
      alert('❌ Error creating vouchers: ' + error.message)
      return
    }

    alert(`✅ Created ${countToAdd} blank voucher(s)`)
    setAdding(false)
    setCountToAdd(1)
    loadVouchers()
  }

  /* -------- Render -------- */
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--c-text)]">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
        <StoreIdHeader
          store={store}
          onAddVoucher={() => setAdding(true)}
          onPrintVouchers={() => setPrintModal(true)}
        />

        <PrintVouchersModal
          open={printModal}
          onClose={() => setPrintModal(false)}
          storeId={store?.id}
        />

        {/* Search Bar */}
        <div className="flex items-center gap-2 sticky top-0 bg-[var(--bg)]/90 backdrop-blur-sm py-1 z-30">
          <input
            className="
              flex-1 rounded-lg border border-[var(--c-bank)]/30 
              bg-white/80 backdrop-blur-sm 
              px-3 py-2 text-sm
              placeholder-[var(--c-text)]/40 focus:outline-none 
              focus:ring-2 focus:ring-[var(--c-accent)]/40
            "
            placeholder="Search vouchers by code or buyer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Vouchers Section */}
        {loadingVouchers ? (
          <div className="py-8 text-center text-[var(--c-text)]/60 text-sm">
            Loading vouchers…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-[var(--c-text)]/60 text-sm">
            No vouchers found.
          </div>
        ) : (
          <>
            {/* 🧱 Table (desktop) */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-[var(--c-bank)]/20 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-[var(--section-bg)] border-b border-[var(--c-bank)]/10">
                  <tr>
                    <Th>Buyer</Th>
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
                      className="border-t border-[var(--c-bank)]/10 cursor-pointer hover:bg-[var(--section-bg)] transition"
                    >
                      <Td>{v.buyer_name ?? '—'}</Td>
                      <Td>
                        <code className="rounded bg-[var(--section-bg)] px-1.5 py-0.5">
                          {v.code}
                        </code>
                      </Td>
                      <Td>
                        <StatusPill status={v.status} />
                      </Td>
                      <Td>{fmtDZD(v.initial_amount)}</Td>
                      <Td>{fmtDZD(v.balance)}</Td>
                      <Td>{new Date(v.created_at).toLocaleDateString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🧩 Cards (mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
              {paginated.map((v) => (
                <div
                  key={v.id}
                  className="
                    rounded-2xl border border-[var(--c-bank)]/20 
                    bg-white/90 backdrop-blur-sm 
                    p-4 shadow-sm hover:shadow-md transition cursor-pointer
                  "
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[var(--c-primary)] text-sm">
                      {v.buyer_name || '—'}
                    </h3>
                    <StatusPill status={v.status} />
                  </div>
                  <div className="text-xs text-[var(--c-text)]/70 mb-1">
                    Code:{' '}
                    <span className="font-mono bg-[var(--section-bg)] px-1 py-0.5 rounded">
                      {v.code}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--c-text)]/70 mb-1">
                    Balance: {fmtDZD(v.balance)} / Init: {fmtDZD(v.initial_amount)}
                  </div>
                  <div className="text-xs text-[var(--c-text)]/60">
                    Created: {new Date(v.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {!loadingVouchers && filtered.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`
                    px-4 py-1.5 rounded-full border text-sm font-medium transition-all
                    ${
                      page === 1
                        ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400'
                        : 'border-[var(--c-accent)] text-[var(--c-accent)] hover:bg-[var(--c-accent)] hover:text-white'
                    }
                  `}
                >
                  ← Prev
                </button>

                <span className="text-sm text-gray-600">
                  Page{' '}
                  <span className="font-semibold text-[var(--c-primary)]">{page}</span>{' '}
                  of{' '}
                  <span className="font-semibold text-[var(--c-primary)]">
                    {totalPages}
                  </span>
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`
                    px-4 py-1.5 rounded-full border text-sm font-medium transition-all
                    ${
                      page === totalPages
                        ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400'
                        : 'border-[var(--c-accent)] text-[var(--c-accent)] hover:bg-[var(--c-accent)] hover:text-white'
                    }
                  `}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* ✅ Add Voucher Modal */}
        {adding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-[var(--c-bank)]/20">
              <button
                onClick={() => setAdding(false)}
                className="absolute right-3 top-3 text-[var(--c-text)]/60 hover:text-[var(--c-text)]"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold mb-3 text-[var(--c-primary)]">
                Create Blank Vouchers
              </h2>
              <label className="text-sm text-[var(--c-text)]/70 mb-1 block">
                Number to create
              </label>
              <input
                type="number"
                min={1}
                value={countToAdd}
                onChange={(e) => setCountToAdd(parseInt(e.target.value))}
                className="
                  w-full border border-[var(--c-bank)]/30 rounded-md p-2 mb-4 text-sm
                  focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none
                "
              />
              <button
                disabled={addingLoading}
                onClick={createBlankVouchers}
                className="
                  w-full rounded-md bg-[var(--c-accent)] px-4 py-2 text-sm font-medium text-white 
                  hover:bg-[var(--c-accent)]/90 active:scale-95 transition disabled:opacity-50
                "
              >
                {addingLoading ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* --- Helpers --- */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
      {children}
    </th>
  )
}
function Td({
  children,
  colSpan,
}: {
  children: React.ReactNode
  colSpan?: number
}) {
  return <td colSpan={colSpan} className="px-3 py-2">{children}</td>
}
function StatusPill({ status }: { status: VoucherRow['status'] }) {
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
