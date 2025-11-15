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
    ;(async () => {
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

    ;(async () => {
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
    <div className="p-4 space-y-6">

      {/* -------- Header -------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mes demandes de vouchers</h1>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-[var(--c-accent)] text-white px-4 py-2 rounded-lg"
        >
          + Nouvelle demande
        </button>
      </div>

      {/* -------- Filters -------- */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">

        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Toutes', value: 'all' },
            { label: 'En attente', value: 'pending' },
            { label: 'Approuvées', value: 'approved' },
            { label: 'Rejetées', value: 'rejected' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedStatus(f.value as any)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                selectedStatus === f.value
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 border rounded-lg">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            className="bg-transparent flex-1"
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value || null)}
          />
        </div>
      </div>

      {/* -------- Mobile View -------- */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-gray-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">Aucune demande trouvée.</p>
        ) : (
          filtered.map((req) => (
           <div
  key={req.id}
  id={`request-${req.id}`}
  className="bg-white p-4 rounded-xl shadow-sm border space-y-2"
>

              <div className="flex justify-between">
                <h3 className="font-semibold">Demande #{req.id.slice(0, 6)}</h3>
                <StatusBadge status={req.status} />
              </div>

              <p className="text-sm text-gray-600">
                Quantité: <b>{req.count}</b>
              </p>

              <p className="text-xs text-gray-400">
                Créée: {new Date(req.created_at).toLocaleDateString()}
              </p>

              <p className="text-xs text-gray-400">
                Traitée:{' '}
                {req.processed_at
                  ? new Date(req.processed_at).toLocaleString()
                  : '—'}
              </p>
            </div>
          ))
        )}
      </div>

      {/* -------- Desktop Table -------- */}
      <div className="hidden md:block bg-white border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-gray-500">Aucune demande trouvée.</p>
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
                  <Td>{req.id}</Td>
                  <Td>{req.count}</Td>
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
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${map[status]}`}>
      {status}
    </span>
  )
}


function Th({ children }: any) {
  return <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{children}</th>
}
function Td({ children }: any) {
  return <td className="px-4 py-2">{children}</td>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white p-5 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-3">Demander des vouchers</h2>

        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="border rounded-lg p-2 w-full mb-4"
        />

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-[var(--c-accent)] text-white py-2 rounded-lg"
        >
          {saving ? 'Envoi…' : 'Envoyer la demande'}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 bg-gray-100 py-2 rounded-lg text-gray-700"
        >
          Annuler
        </button>
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
