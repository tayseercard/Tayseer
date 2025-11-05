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
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
          <Store className="h-5 w-5" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
          Stores
        </h1>
      </div>

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
