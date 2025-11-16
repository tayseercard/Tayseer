'use client'

import { Plus, Printer } from 'lucide-react'

export default function VoucherHeader({
  onAdd,
  onPrint,
}: {
  onAdd: () => void
  onPrint: () => void
}) {
  return (
    <header
      className="
        flex items-center justify-between
        px-6 py-4
        rounded-2xl
        bg-[var(--c-primary)]
        border border-[var(--c-bank)]/20
        shadow-md backdrop-blur-lg
        text-white
      "
    >
      <h1 className="text-lg sm:text-xl font-semibold">Vouchers</h1>

      <div className="flex items-center gap-3">
        {/* PRINT BUTTON */}
        <button
          onClick={onPrint}
          className="
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-white/20 text-white
            hover:bg-white/30 active:scale-95 transition
          "
        >
          <Printer className="h-5 w-5" />
        </button>

        {/* ADD BUTTON */}
        <button
          onClick={onAdd}
          className="
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-[var(--c-accent)] text-white
            hover:bg-[var(--c-accent)]/90
            active:scale-95 transition
          "
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
