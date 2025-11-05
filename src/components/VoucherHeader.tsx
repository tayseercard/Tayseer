'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'

export default function VoucherHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <header
      className="
        flex items-center justify-between 
        px-5 py-3
        rounded-2xl
        bg-white/70 backdrop-blur-md
        border border-gray-100
        shadow-sm
      "
    >
      {/* === Left: Avatar === */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200">
          {/* Replace with dynamic user avatar if available */}
          <Image
            src="/avatar-placeholder.png"
            alt="User Avatar"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* === Right: Add Button === */}
      <button
        onClick={onAdd}
        className="
          flex items-center justify-center
          w-10 h-10 rounded-full
          bg-emerald-600 text-white
          shadow-md hover:bg-emerald-700
          active:scale-95 transition
        "
        aria-label="Add Voucher"
      >
        <Plus className="h-5 w-5" />
      </button>
    </header>
  )
}
