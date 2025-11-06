'use client'

import { Plus, Store } from 'lucide-react'

export default function StoresHeader({
  onAdd,
}: {
  onAdd: () => void
}) {
  return (
    <header
      className="
        flex items-center justify-between
        px-6 py-4
        rounded-2xl
        bg-[var(--c-primary)]
        border border-[var(--c-bank)]/20
        shadow-[0_4px_16px_rgba(0,0,0,0.06)]
        backdrop-blur-md
        text-white
      "
    >
      {/* === Left: Title === */}
      <h1
        className="
          flex items-center gap-2
          text-lg sm:text-xl font-semibold tracking-tight
        "
      >
        <span className="text-white">Add Store</span>
      </h1>

      {/* === Right: Add Button === */}
      <button
        onClick={onAdd}
        className="
          flex items-center justify-center
          w-10 h-10 sm:w-11 sm:h-11
          rounded-full
          bg-[var(--c-accent)] text-white
          shadow-md hover:bg-[var(--c-accent)]/90
          active:scale-95 transition
        "
        aria-label="Add Store"
      >
        <Plus className="h-5 w-5" />
      </button>
    </header>
  )
}
