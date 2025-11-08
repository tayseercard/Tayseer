'use client'

import { useState } from 'react'
import { X } from 'lucide-react'


export default function PrintVouchersModal({
  open,
  onClose,
  storeId,
}: {
  open: boolean
  onClose: () => void
  storeId?: string
}) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3">
      <div
        className="
          relative w-full max-w-sm rounded-2xl bg-white 
          p-5 shadow-xl border border-[var(--c-bank)]/20
        "
      >
        {/* ✖ Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold mb-3 text-[var(--c-primary)]">
          Print Vouchers by Date
        </h2>

        {/* Date range inputs */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-sm mb-1 text-gray-600">From date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-600">To date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>
        </div>

        {/* Print button */}
        <button
          onClick={() => {
            if (!from || !to)
              return alert('Please select both "from" and "to" dates.')
            if (!storeId)
              return alert('Missing store ID.')

            const url = `/admin/vouchers/print/${storeId}?from=${from}&to=${to}`
            window.open(url, '_blank')
          }}
          className="
            w-full rounded-lg bg-[var(--c-accent)] text-white text-sm font-medium
            px-4 py-2 hover:bg-[var(--c-accent)]/90 active:scale-95 transition
          "
        >
          Print Vouchers
        </button>
      </div>
    </div>
  )
}
