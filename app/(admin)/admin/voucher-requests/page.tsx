'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, X, Calendar, Filter } from 'lucide-react'

export default function AdminVoucherRequestsPage() {
  const supabase = createClientComponentClient()

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [storeQuery, setStoreQuery] = useState('')

  async function loadRequests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('voucher_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  /* ---------- APPROVE REQUEST ---------- */
  async function approveRequest(req: any) {
    if (!confirm(`Approve ${req.count} vouchers for ${req.store_name}?`)) return

    // 1️⃣ Update request
    const { error: updateErr } = await supabase
      .from('voucher_requests')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
      })
      .eq('id', req.id)

    if (updateErr) return alert('❌ ' + updateErr.message)

    // 2️⃣ Create vouchers
    const newVouchers = Array.from({ length: req.count }).map(() => ({
      store_id: req.store_id,
      code: 'MKD-' + crypto.randomUUID().split('-')[0].toUpperCase(),
      status: 'blank',
      initial_amount: 0,
      balance: 0,
    }))

    const { error: insertErr } = await supabase.from('vouchers').insert(newVouchers)
    if (insertErr) return alert('❌ ' + insertErr.message)

    // 3️⃣ Notify store owner
    if (req.store_owner_id) {
      await supabase.from('notifications').insert({
        user_id: req.store_owner_id,
        title: 'Demande approuvée',
        message: `${req.count} vouchers ont été ajoutés à votre magasin.`,
      })
    }

    alert('✅ Request approved & vouchers created!')
    loadRequests()
  }

  /* ---------- REJECT REQUEST ---------- */
  async function rejectRequest(req: any) {
    if (!confirm(`Reject request from ${req.store_name}?`)) return

    const { error } = await supabase
      .from('voucher_requests')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
      })
      .eq('id', req.id)

    if (error) return alert('❌ ' + error.message)

    // Notify reject
    if (req.store_owner_id) {
      await supabase.from('notifications').insert({
        user_id: req.store_owner_id,
        title: 'Votre demande a été rejetée',
        message: `Votre demande pour ${req.count} vouchers a été rejetée.`,
      })
    }

    alert('❌ Request rejected')
    loadRequests()
  }

  /* ---------- FILTERED RESULTS ---------- */
  const filtered = rows.filter((r) => {
    let ok = true

    if (selectedStatus !== 'all') ok = ok && r.status === selectedStatus

    if (selectedDate) {
      ok = ok && r.created_at.slice(0, 10) === selectedDate
    }

    if (storeQuery.trim()) {
      ok = ok && r.store_name.toLowerCase().includes(storeQuery.trim().toLowerCase())
    }

    return ok
  })

  return (
    <div className="p-4 space-y-6">

      <h1 className="text-xl font-semibold">Voucher Requests</h1>

      {/* ---------- Filters ---------- */}
      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">

        {/* Store Search */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
          <Filter className="h-4 w-4 text-gray-400" />
          <input
            value={storeQuery}
            onChange={(e) => setStoreQuery(e.target.value)}
            placeholder="Search store..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value || null)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { label: 'All', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedStatus(f.value as any)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                selectedStatus === f.value
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Mobile Cards ---------- */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No requests found.</p>
        ) : (
          filtered.map((req) => (
            <div key={req.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-2">
              <div className="flex justify-between">
                <h3 className="font-semibold">{req.store_name}</h3>
                <StatusBadge status={req.status} />
              </div>

              <p className="text-sm text-gray-600">
                Count: <b>{req.count}</b>
              </p>
              <p className="text-xs text-gray-400">
                Created: {new Date(req.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-400">
                Processed:{' '}
                {req.processed_at
                  ? new Date(req.processed_at).toLocaleString()
                  : '—'}
              </p>

              {req.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => approveRequest(req)}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectRequest(req)}
                    className="flex-1 bg-rose-600 text-white py-2 rounded-lg"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ---------- Desktop Table ---------- */}
      <div className="hidden md:block bg-white border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-gray-500">No requests found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <Th>Store</Th>
                <Th>Count</Th>
                <Th>Requested</Th>
                <Th>Status</Th>
                <Th>Processed</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <Td>{req.store_name}</Td>
                  <Td>{req.count}</Td>
                  <Td>{new Date(req.created_at).toLocaleDateString()}</Td>
                  <Td><StatusBadge status={req.status} /></Td>
                  <Td>
                    {req.processed_at
                      ? new Date(req.processed_at).toLocaleString()
                      : '—'}
                  </Td>

                  <Td>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <ActionBtn color="green" onClick={() => approveRequest(req)}>
                          <Check className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn color="red" onClick={() => rejectRequest(req)}>
                          <X className="h-4 w-4" />
                        </ActionBtn>
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ---------- Subcomponents ---------- */
function Th({ children }: any) {
  return (
    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">
      {children}
    </th>
  )
}

function Td({ children }: any) {
  return <td className="px-4 py-2">{children}</td>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700'
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  )
}

function ActionBtn({ children, color, onClick }: any) {
  const styles =
    color === 'green'
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : 'bg-rose-600 hover:bg-rose-700'

  return (
    <button onClick={onClick} className={`p-1.5 text-white rounded ${styles}`}>
      {children}
    </button>
  )
}
