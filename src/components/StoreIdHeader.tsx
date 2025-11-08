'use client'

import { ArrowLeft, QrCode, Plus, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { StoreRow } from '@/types/tables'

export default function StoreIdHeader({
  store,
  onAddVoucher,
  onPrintVouchers,
}: {
  store?: StoreRow | null
  onAddVoucher?: () => void
  onPrintVouchers?: () => void
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
        {/* Left: Back + Store Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/10 transition"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="text-xl font-semibold text-white tracking-tight">
            {store?.name || 'Store Details'}
          </h1>
        </div>

        {/* === Actions === */}
        <div className="flex items-center gap-2">
          {onPrintVouchers && (
            <button
              onClick={onPrintVouchers}
              className="
                inline-flex items-center gap-2 rounded-full 
                bg-white/15 border border-white/20 
                px-3 py-2 text-sm font-medium text-white 
                hover:bg-white/25 active:scale-[0.97] transition
              "
            >
              <Printer className="h-4 w-4" />
            </button>
          )}

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
            </button>
          )}
        </div>
      </div>

      {/* === Bottom: Store Info === */}
      {store && (
        <div className="text-sm text-white/80 space-y-1">
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
