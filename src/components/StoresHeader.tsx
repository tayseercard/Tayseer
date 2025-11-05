'use client'

import { Plus, Store } from 'lucide-react'

export default function StoresHeader({
  onAdd,
}: {
  onAdd: () => void
}) {
  return (
    <header className="relative flex items-center justify-between px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-gray-100 shadow-sm">
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
        className="flex items-center justify-center h-9 w-9 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
        title="Add Store"
      >
        <Plus className="h-5 w-5" />
      </button>
    </header>
  )
}
