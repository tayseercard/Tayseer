'use client'

import StoreHeader from '@/components/store/StoreHeader'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { Menu, Combobox } from '@headlessui/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'
import { Scanner } from '@yudiel/react-qr-scanner'
import VoucherModal from '@/components/VoucherModal'
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
import StoreVoucherHeader from '@/components/store/StoreVoucherHeader'
import PrintVouchersModal from '@/components/PrintVouchersModal'
import StorePrintVouchersModal from '@/components/store/StorePrintVouchersModal'
import PlanSettings from '@/components/store/settings/PlanSettings'



export default function StoreVouchersPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Signing you in…</div>}>
      <StoreVouchersInner />
    </Suspense>
  )
}

/* =================== MAIN PAGE =================== */
function StoreVouchersInner() {

  const [store, setStore] = useState<{
    name: string;
    email: string;
    role: string;
    logoUrl?: string;
    phone?: string;
    address?: string;
  } | null>(null)
  const { t, lang } = useLanguage()
  const supabase = createClientComponentClient()
  const params = useSearchParams()
  const [rows, setRows] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [storeName, setStoreName] = useState<string | null>(null)
  const [adminId, setAdminId] = useState<string[]>([])
  const [requestId, setrequestId] = useState<string | null>(null)
  const [openRequestModal, setOpenRequestModal] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [selectedStore, setSelectedStore] = useState<'all' | string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | string>('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [printOpen, setPrintOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [buyOpen, setBuyOpen] = useState(false)
  const [cashiersMap, setCashiersMap] = useState<Record<string, string>>({})

  //Pagination
  const ITEMS_PER_PAGE = 10
  const [page, setPage] = useState(1)
  const totalPages = useMemo(() => Math.ceil(rows.length / ITEMS_PER_PAGE), [rows])

  // load store

  useEffect(() => {
    ; (async () => {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const { data: storeRow } = await supabase
        .from('stores')
        .select('name, email, logo_url, phone, address')
        .eq('owner_user_id', user.id)
        .maybeSingle()

      setStore({
        name: storeRow?.name || 'Store',
        email: storeRow?.email || user.email || '',
        role: 'Propriétaire',
        logoUrl: storeRow?.logo_url || '/icon-192.png',
        phone: storeRow?.phone,
        address: storeRow?.address
      })

      const { data: roleRow } = await supabase
        .from('me_effective_role')
        .select('store_id')
        .eq('user_id', user.id)
        .maybeSingle()

      const storeId = roleRow?.store_id


      const { data: vouchersData } = await supabase
        .from('vouchers')
        .select('*')
        .eq('store_id', storeId)



      setLoading(false)
    })()
  }, [supabase])

  // ✅ Read status from query (?status=active)
  useEffect(() => {
    const s = params.get('status')
    if (s) setSelectedStatus(s)
  }, [params])

  // ✅ Fetch current user store_id and vouchers
  useEffect(() => {
    ; (async () => {
      setLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user.id
      if (!userId) return



      // fetch role/store_id
      const { data: roleRow } = await supabase
        .from('me_effective_role')
        .select('role, store_id, store_name')
        .eq('user_id', userId)
        .maybeSingle()

      setUserRole(roleRow?.role || null)
      setStoreId(roleRow?.store_id || null)
      setStoreName(roleRow?.store_name || null)

      const currentStoreId = roleRow?.store_id || null
      setStoreId(currentStoreId)

      // fetch vouchers (filter by store)
      let query = supabase
        .from('vouchers')
        .select('*')
        .order('updated_at', { ascending: false })

      if (currentStoreId) query = query.eq('store_id', currentStoreId)
      const { data, error } = await query
      if (error) console.error('Error loading vouchers:', error)
      setRows(data || [])
      setLoading(false)
    })()
  }, [supabase])


  //Load vouchers 
  useEffect(() => {
    ; (async () => {
      if (!storeId) return

      setLoading(true)

      let query = supabase
        .from('vouchers')
        .select('*')
        .eq('store_id', storeId)
        .order('activated_at', { ascending: false })

      const { data, error } = await query
      if (error) console.error('Error loading vouchers:', error)

      setRows(data || [])
      setLoading(false)
    })()
  }, [storeId, supabase])

  // ✅ Fetch Cashiers Map
  useEffect(() => {
    if (!storeId) return
      ; (async () => {
        // 1. Fetch cashiers linked to this store
        const { data: cashiers } = await supabase
          .from('cashiers')
          .select('user_id, full_name')
          .eq('store_id', storeId)

        const map: Record<string, string> = {}
        if (cashiers) {
          cashiers.forEach((c: any) => {
            if (c.user_id) map[c.user_id] = c.full_name || 'Cashier'
          })
        }

        // 2. Add current owner (me)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          map[session.user.id] = 'Moi (Owner)'
        }

        setCashiersMap(map)
      })()
  }, [storeId, supabase])

  //Load data 
  async function loadData() {
    setLoading(true)
    const [{ data: vouchers }, { data: storesData }] = await Promise.all([
      supabase.from('vouchers').select('*').order('updated_at', { ascending: false })
      ,
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
  /* -------- Filters & Custom Sorting -------- */
  const filtered = useMemo(() => {
    let data = [...rows] // Clone to avoid mutating state
    if (selectedStore !== 'all') data = data.filter(v => v.store_id === selectedStore)
    if (selectedStatus !== 'all') data = data.filter(v => v.status === selectedStatus)

    // 🔍 Search filter
    if (q.trim()) {
      const t = q.trim().toLowerCase()
      data = data.filter(v => v.buyer_name?.toLowerCase().includes(t))
    }

    // 📅 Date filter
    if (selectedDate) {
      data = data.filter((v) => {
        const d = v.activated_at
          ? new Date(v.activated_at).toISOString().slice(0, 10)
          : null
        return d === selectedDate
      })
    }

    // 🔃 Custom Sorting: Blanks last, then by date descending
    data.sort((a, b) => {
      const isBlankA = a.status === 'blank' ? 1 : 0
      const isBlankB = b.status === 'blank' ? 1 : 0

      // If one is blank and the other isn't, blank goes last
      if (isBlankA !== isBlankB) return isBlankA - isBlankB

      // Otherwise, sort by date (most recent first)
      const dateA = new Date(a.activated_at || a.updated_at || a.created_at || 0).getTime()
      const dateB = new Date(b.activated_at || b.updated_at || b.created_at || 0).getTime()
      return dateB - dateA
    })

    return data
  }, [rows, q, selectedStore, selectedStatus, selectedDate])


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
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 px-4 pt-4 pb-6 space-y-3 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>

      <StoreVoucherHeader
        onPrint={() => setPrintOpen(true)}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onBuyQR={() => setBuyOpen(true)}
      />

      {/* ===== Totals Section (Financial) ===== */}
      {!loading && rows.length > 0 && (
        <div
          className="
            bg-white/70 border border-gray-100 shadow-sm p-3 rounded-xl text-sm
            flex items-center justify-between sm:justify-start sm:gap-8 text-center overflow-x-auto no-scrollbar
            whitespace-nowrap mt-2
          "
        >
          {/* Initial */}
          <div className="flex flex-col min-w-[80px]">
            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">
              Total
            </span>
            <span className="font-bold text-gray-900 text-base">
              {fmtDZD(totals.totalInitial, lang)}
            </span>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Remaining */}
          <div className="flex flex-col min-w-[80px]">
            <span className="text-emerald-600/70 text-[10px] uppercase tracking-wider font-bold">Restant</span>
            <span className="font-bold text-emerald-700 text-base">
              {fmtDZD(totals.totalBalance, lang)}
            </span>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Consumed */}
          <div className="flex flex-col min-w-[80px]">
            <span className="text-rose-600/70 text-[10px] uppercase tracking-wider font-bold">Consommé</span>
            <span className="font-bold text-rose-600 text-base">
              {fmtDZD(totals.consumed, lang)}
            </span>
          </div>
        </div>
      )}

      {/* 🔵 Status Tabs Row */}
      <div className="flex items-center justify-between border-b border-gray-100 mt-2 gap-2">
        <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: t.all || 'Tous', count: rows.length },
            { key: 'active', label: t.active || 'Actifs', count: rows.filter(r => r.status === 'active').length },
            { key: 'redeemed', label: t.redeemed || 'Consommés', count: rows.filter(r => r.status === 'redeemed').length },
            { key: 'blank', label: t.blank || 'Vierges', count: rows.filter(r => r.status === 'blank').length },
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
        </div>

        <div className="shrink-0 pr-1 pb-1 pt-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-all ${showSearch ? 'bg-[var(--c-accent)] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ===== Filters Section ===== */}
      {showSearch && (
        <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 p-3 shadow-sm animate-in slide-in-from-top-2 fade-in duration-200 shrink-0 mt-2">
          {/* Combined Search + Date */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="flex-1 flex items-center gap-2 bg-white/50 rounded-xl px-3 py-2 border border-gray-100 h-10">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={q}
                autoFocus
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.searchByClient || 'Search by client name'}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-300 font-medium"
              />
              {q && (
                <button onClick={() => setQ('')} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 bg-white/50 rounded-xl px-3 py-2 border border-gray-100 h-10 sm:w-auto w-full">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                className="bg-transparent text-sm focus:outline-none w-full sm:w-auto font-medium text-gray-600"
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value || null)}
              />
            </div>
          </div>
        </div>
      )}

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
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-gray-900 leading-tight">{v.buyer_name ?? '—'}</h3>
                  <code className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] w-fit font-mono">{v.code}</code>
                </div>
                <StatusPill status={v.status} />
              </div>

              <div className="mt-4 flex justify-between items-end text-sm border-t border-gray-50 pt-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Solde</span>
                  <span className="font-black text-emerald-700 text-xl">{fmtDZD(v.balance, lang)}</span>
                </div>
                <div className="flex flex-col gap-0.5 items-end">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Initial</span>
                  <span className="font-bold text-gray-400 text-sm line-through">{fmtDZD(v.initial_amount, lang)}</span>
                </div>
              </div>

              <div className="mt-2 flex justify-between text-[10px] text-gray-400 font-medium">
                <span>Recu: {new Date(v.created_at).toLocaleDateString()}</span>
                {v.activated_by && (
                  <span className="text-emerald-600">
                    Activé par: <b>{cashiersMap[v.activated_by] || 'Inconnu'}</b>
                  </span>
                )}
              </div>

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
                  <Th rtl={lang === 'ar'}>Activé par</Th>
                  <Th rtl={lang === 'ar'}>{t.balance}</Th>
                  <Th rtl={lang === 'ar'}>{t.initial || 'Initial'}</Th>
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
                    <Td>
                      {v.activated_by ? (
                        <span className="text-xs font-medium text-gray-700">
                          {cashiersMap[v.activated_by] || '—'}
                        </span>
                      ) : '—'}
                    </Td>
                    <Td>{fmtDZD(v.balance, lang)}</Td>
                    <Td>{fmtDZD(v.initial_amount, lang)}</Td>
                    <Td>{new Date(v.created_at).toLocaleDateString()}</Td>
                    <Td>{new Date(v.activated_at).toLocaleDateString()}</Td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        )}
      </div>

      {printOpen && (
        <StorePrintVouchersModal
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          stores={stores}

        />
      )}

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

      {/* 🛍️ Buy QR Modal */}
      {buyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="font-bold text-lg">Acheter des QRs</h2>
              <button onClick={() => setBuyOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <PlanSettings t={t} storeId={storeId || undefined} />
            </div>
          </div>
        </div>
      )}

      {/* ⭐ Render Voucher Request Modal */}
      {openRequestModal && (
        <VoucherRequestModal
          onClose={() => setOpenRequestModal(false)}
          supabase={supabase}
          storeId={storeId}
          storeName={storeName}
          adminId={adminId}
          requestId={requestId} />
      )}

    </div>

  )

}

/* ---------- Voucher Request Modal ---------- */
function VoucherRequestModal({
  onClose,
  supabase,
  storeId,
  adminId,
  storeName,
  requestId,
}: {
  onClose: () => void
  supabase: any
  storeId: string | null
  adminId: string[]
  storeName: string | null
  requestId: string | null
}) {
  const [count, setCount] = useState(10)
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!storeId) return alert("Store ID manquant.")
    if (!storeName) return alert("Nom du magasin manquant.")

    setSaving(true)

    // 1️⃣ Insert request and retrieve new request ID
    const { data: newReq, error } = await supabase
      .from("voucher_requests")
      .insert({
        store_id: storeId,
        store_name: storeName,
        count,
      })
      .select()
      .single()

    if (error) {
      setSaving(false)
      return alert("Erreur: " + error.message)
    }



    // 2️⃣ Notify admin (with request_id)
    // 2️⃣ Notify ALL admins
    if (adminId && adminId.length > 0) {
      for (const id of adminId) {
        await supabase.from("notifications").insert({
          user_id: id,
          title: "Nouvelle demande de vouchers",
          message: `${storeName} a demandé ${count} vouchers`,
          request_id: newReq.id,
          type: "voucher_request",
          read: false,
        })
      }
    }


    setSaving(false)
    alert("Votre demande a été envoyée à l'administrateur.")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 p-4 flex items-center justify-center">
      <div className="bg-white p-4 rounded-xl w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-3">Demande de Vouchers</h2>

        <p className="text-sm text-gray-600 mb-2">
          Magasin: <b>{storeName ?? "—"}</b>
        </p>

        <input
          type="number"
          min="1"
          value={count}
          onChange={e => setCount(Number(e.target.value))}
          className="border p-2 w-full rounded mb-3"
        />

        <button
          onClick={submit}
          disabled={saving}
          className="w-full bg-[var(--c-accent)] text-white py-2 rounded-lg"
        >
          {saving ? "Envoi…" : "Envoyer la demande"}
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2 bg-gray-100 rounded-lg text-gray-700"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

/* ---------- Helpers ---------- */
function Th({ children, rtl = false }: { children: React.ReactNode; rtl?: boolean }) {
  return (
    <th
      className={`px-3 py-2 text-xs font-medium text-gray-500 ${rtl ? 'text-right' : 'text-left'
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
  const labels: Record<string, string> = {
    active: 'Actif',
    redeemed: 'Consommé',
    expired: 'Expiré',
    void: 'Annulé',
    blank: 'Vierge'
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${map[status] ?? map.blank}`}>
      {labels[status] || status}
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




