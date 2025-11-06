'use client'

import { ArrowLeft, QrCode, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { StoreRow } from '@/types/tables'

export default function StoreIdHeader({
  store,
  onAddVoucher,
}: {
  store?: StoreRow | null
  onAddVoucher?: () => void
}) {
  const router = useRouter()

  return (
    <header
      className="
        flex flex-col gap-4
        px-6 py-4
        rounded-2xl
        bg-[var(--c-primary)]
        border border-[var(--c-bank)]/20
        shadow-[0_4px_16px_rgba(0,0,0,0.06)]
        backdrop-blur-md
        text-white
      "
    >
      {/* === Top Row: Back + Title === */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          

          <h1 className="text-xl font-semibold text-white">
            {store?.name || 'Store Details'}
          </h1>
        </div>

        {/* === Actions === */}
        <div className="flex items-center gap-2">
          

          {onAddVoucher && (
            <button
              onClick={onAddVoucher}
              className="
                inline-flex items-center gap-2 rounded-full 
                bg-[var(--c-accent)] px-3 py-2 text-sm font-medium text-white 
                hover:bg-[var(--c-accent)]/90 active:scale-[0.97] transition
              "
            >
              <Plus className="h-4 w-4" />
              Add Voucher
            </button>
          )}
        </div>
      </div>

      {/* === Bottom: Store Info === */}
      {store && (
        <div className="text-sm text-white/80 space-y-1 ">
          {store.address && <p>{store.address}</p>}
          {(store.phone || store.email) && (
            <p>
              {store.phone && <span>{store.phone}</span>}
              {store.phone && store.email && ' · '}
              {store.email && <span>{store.email}</span>}
            </p>
          )}
        </div>
      )}
    </header>
  )
}
