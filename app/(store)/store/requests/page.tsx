'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Calendar } from 'lucide-react'
import { useSearchParams } from "next/navigation"


export default function StoreRequestsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-500">Loading…</div>}>
      <StoreRequestsInner />
    </Suspense>
  )
}

function StoreRequestsInner() {
  const supabase = createClientComponentClient()

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const params = useSearchParams()
  const highlightId = params.get("highlight")

  const highlightRef = useRef<HTMLDivElement | null>(null)
  // After loading the requests:
  useEffect(() => {
    if (!highlightId) return

    // small delay to ensure rendering
    setTimeout(() => {
      const el = document.getElementById(`request-${highlightId}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("animate-highlight")
      }
    }, 300)
  }, [highlightId, loading])
  // Filters
  const [selectedStatus, setSelectedStatus] =
    useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeName, setStoreName] = useState<string | null>(null)

  // Modal for making new requests
  const [openModal, setOpenModal] = useState(false)

  /* ------------------ 1️⃣ Get store_id ------------------ */
  useEffect(() => {
    ; (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const userId = session?.user.id
      if (!userId) return

      const { data: me } = await supabase
        .from('me_effective_role')
        .select('store_id, store_name')
        .eq('user_id', userId)
        .maybeSingle()

      setStoreId(me?.store_id || null)
      setStoreName(me?.store_name || null)
    })()
  }, [])

  /* ------------------ 2️⃣ Load requests ------------------ */
  useEffect(() => {
    if (!storeId) return

      ; (async () => {
        setLoading(true)

        const { data, error } = await supabase
          .from('voucher_requests')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })

        if (error) console.error(error)
        setRequests(data || [])
        setLoading(false)
      })()
  }, [storeId])

  /* ------------------ 3️⃣ Filters ------------------ */
  const filtered = requests.filter((req) => {
    let ok = true

    if (selectedStatus !== 'all') ok = ok && req.status === selectedStatus

    if (selectedDate) {
      const d = new Date(req.created_at).toISOString().slice(0, 10)
      ok = ok && d === selectedDate
    }

    return ok
  })

  /* ------------------ 4️⃣ Submit Request ------------------ */
  async function submitRequest(count: number) {
    if (!storeId) return alert('Missing store')

    const { error } = await supabase.from('voucher_requests').insert({
      store_id: storeId,
      store_name: storeName,
      count,
    })

    if (error) return alert('❌ ' + error.message)

    alert('Votre demande a été envoyée !')
    setOpenModal(false)

    // Reload data
    const { data } = await supabase
      .from('voucher_requests')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    setRequests(data || [])
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 px-4 pt-4 pb-6 space-y-3">

      {/* -------- Header -------- */}
      <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
        Mes demandes de vouchers
      </h1>

      {/* 🔵 Status Tabs Row */}
      <div className="flex items-center justify-between border-b border-gray-100 mt-2 gap-2">
        <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: 'Toutes', count: requests.length },
            { key: 'pending', label: 'En attente', count: requests.filter(r => r.status === 'pending').length },
            { key: 'approved', label: 'Approuvées', count: requests.filter(r => r.status === 'approved').length },
            { key: 'rejected', label: 'Rejetées', count: requests.filter(r => r.status === 'rejected').length },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setSelectedStatus(st.key as any)}
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
      </div>

      {/* -------- Filters Section (Date) -------- */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 p-3 shadow-sm mt-2">
        <div className="flex items-center gap-2 bg-white/50 rounded-xl px-3 py-2 border border-gray-100 h-10 w-full sm:w-auto">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            className="bg-transparent text-sm focus:outline-none w-full font-medium text-gray-600"
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value || null)}
          />
        </div>
      </div>

      {/* -------- Mobile View -------- */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-10 text-center text-gray-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-gray-400">Aucune demande trouvée.</div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              id={`request-${req.id}`}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-gray-900 leading-tight">Demande</h3>
                  <code className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] w-fit font-mono">#{req.id.slice(0, 6)}</code>
                </div>
                <StatusBadge status={req.status} />
              </div>

              <div className="mt-4 flex justify-between items-end text-sm border-t border-gray-50 pt-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Quantité</span>
                  <span className="font-black text-gray-900 text-xl">{req.count}</span>
                </div>
                <div className="flex flex-col gap-0.5 items-end">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Date</span>
                  <span className="font-medium text-gray-600 text-xs">{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* -------- Desktop Table -------- */}
      <div className="hidden md:block rounded-xl bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gray-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-gray-400">Aucune demande trouvée.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <Th>ID</Th>
                <Th>Quantité</Th>
                <Th>Statut</Th>
                <Th>Créée le</Th>
                <Th>Traitée le</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr
                  key={req.id}
                  id={`request-${req.id}`}
                  className="border-b hover:bg-gray-50"
                >
                  <Td><code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{req.id.slice(0, 8)}</code></Td>
                  <Td><span className="font-bold">{req.count}</span></Td>
                  <Td><StatusBadge status={req.status} /></Td>
                  <Td>{new Date(req.created_at).toLocaleDateString()}</Td>
                  <Td>
                    {req.processed_at
                      ? new Date(req.processed_at).toLocaleString()
                      : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* -------- Modal: Demande de vouchers -------- */}
      {openModal && (
        <RequestModal
          onClose={() => setOpenModal(false)}
          onSubmit={submitRequest}
        />
      )}
    </div>
  )
}

/* ---------- UI Components ---------- */

function StatusBadge({ status }: { status: string }) {
  const map: any = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200 ring-1',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200 ring-1',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-200 ring-1',
  }
  const labelMap: any = {
    pending: 'En attente',
    approved: 'Approuvée',
    rejected: 'Rejetée'
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {labelMap[status] || status}
    </span>
  )
}


function Th({ children }: any) {
  return <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{children}</th>
}
function Td({ children }: any) {
  return <td className="px-4 py-3 whitespace-nowrap text-gray-700">{children}</td>
}

function RequestModal({ onClose, onSubmit }: any) {
  const [count, setCount] = useState(10)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onSubmit(count)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Demander des vouchers</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Quantité</label>
            <input
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)] transition"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-[var(--c-accent)] text-white py-3 rounded-xl font-bold shadow-sm hover:opacity-90 transition active:scale-[0.98]"
          >
            {saving ? 'Envoi…' : 'Envoyer la demande'}
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-50 hover:bg-gray-100 py-3 rounded-xl text-gray-600 font-medium transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}




<style jsx global>{`
  .animate-highlight {
    animation: highlightGlow 2s ease-in-out;
  }

  @keyframes highlightGlow {
    0% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.8);
      background-color: #ecfdf5;
    }
    50% {
      box-shadow: 0 0 20px 4px rgba(16, 185, 129, 0.9);
      background-color: #d1fae5;
    }
    100% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      background-color: white;
    }
  }
`}</style>
