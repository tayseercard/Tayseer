'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'

export default function VoucherHeader() {
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
        {/* NOTIFICATION BELL TO REQUESTS */}
        <Link
          href="/admin/voucher-requests"
          className="
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-white/20 text-white
            hover:bg-white/30 active:scale-95 transition
            relative
          "
        >
          <Bell className="h-5 w-5" />
          {/* Optional: Add a red dot if needed later */}
        </Link>
      </div>
    </header>
  )
}
