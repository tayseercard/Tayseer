'use client'

import { Plus, Store } from 'lucide-react'

export default function StoresHeader({
  onAdd,
}: {
  onAdd: () => void
}) {
  return (
    <header  className="
        flex items-center justify-between
        px-6 py-4
        rounded-2xl
        bg-gradient-to-b from-white/90 to-gray-50/70
        border border-gray-100
        shadow-[0_4px_16px_rgba(0,0,0,0.04)]
        backdrop-blur-md
      "
    >
     {/* === Left: Title === */}
      <h1 className="
        text-lg sm:text-xl font-semibold tracking-tight
        text-gray-900
      ">
        <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          Add Store
        </span>
      </h1>

      {/* === Right: Add Button === */}
      <button
        onClick={onAdd}
        className="
          flex items-center justify-center
          w-10 h-10 sm:w-11 sm:h-11
          rounded-full
          bg-emerald-600 text-white
          shadow-md hover:bg-emerald-700
          active:scale-95 transition
        "
        aria-label="Add Store"
      >
        <Plus className="h-5 w-5" />
      </button>
    </header>
  )
}
