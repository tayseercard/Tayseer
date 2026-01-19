'use client'

import { MoreVertical, Printer, ShoppingBag, Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function StoreVoucherHeader({
  onPrint,
  onToggleSearch,
  onBuyQR,
}: {
  onPrint: () => void
  onToggleSearch?: () => void
  onBuyQR?: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

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
        relative z-30
      "
    >
      <h1 className="text-lg sm:text-xl font-semibold">Vouchers</h1>

      <div className="flex items-center gap-3 relative" ref={menuRef}>

        {/* 3 DOTS MENU BUTTON */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-white/20 text-white
            hover:bg-white/30 active:scale-95 transition
          "
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {/* DROPDOWN MENU */}
        {showMenu && (
          <div className="
            absolute right-0 top-12
            w-48 bg-white rounded-xl shadow-xl border border-gray-100
            py-1 overflow-hidden animate-fade-in
            text-gray-800 z-50
          ">
            <button
              onClick={() => {
                setShowMenu(false)
                onPrint()
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition border-b border-gray-50"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>Imprimer QR</span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false)
                if (onBuyQR) onBuyQR()
                else alert("Coming soon!")
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition"
            >
              <ShoppingBag className="w-4 h-4 text-gray-500" />
              <span>Acheter des QRs</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
