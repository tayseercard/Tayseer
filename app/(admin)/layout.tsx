'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { scanVoucher } from '@/lib/scanVoucher' // 🟩 Import helper
import { Scanner } from '@yudiel/react-qr-scanner'
import VoucherScanner from '@/components/VoucherScanner'


import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Gift,
  Users,
  QrCode,
  ArrowLeft,
  X,
  QrCodeIcon,
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()
  const [email] = useState('admin@tayseer.com')

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null)

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  /* ---------- Scan Handler ---------- */
  async function handleScan(result: string | null) {
    const { data, error } = await scanVoucher(supabase, result)
    if (error) setScanError(error)
    else setSelectedVoucher(data)
  }

  /* ---------- Breadcrumb ---------- */
  const crumbs = pathname?.split('/').filter(Boolean).slice(1)
  const breadcrumbTitle =
    crumbs.length > 0 ? crumbs[crumbs.length - 1].replace(/-/g, ' ') : 'Dashboard'

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      {/* ===== Desktop Top Navigation ===== */}
      <header className="hidden md:flex flex-col w-full sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="relative h-8 w-28">
            <Image alt="tayseer" src="/tayseercard.png" fill className="object-contain" />
          </div>

          {/* Desktop Nav */}
          <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {[
              { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { href: '/admin/stores', label: 'Stores', icon: Package },
              { href: '/admin/vouchers', label: 'Vouchers', icon: QrCodeIcon },
              { href: '/admin/users', label: 'Users', icon: Users },
              { href: '/admin/settings', label: 'Settings', icon: Settings },
          ].map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${
                    active
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-600 hover:text-emerald-600 flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-6 py-2 border-t border-gray-100 text-sm text-gray-600 bg-white/70 backdrop-blur-sm">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 hover:text-emerald-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-gray-400">/</span>
          <span className="font-medium text-gray-800 capitalize">{breadcrumbTitle}</span>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-1 relative z-10 px-3 sm:px-5 md:px-8 py-6 md:py-8 transition-all duration-300">
        <div className="h-full min-h-[85vh] rounded-2xl border border-gray-100 bg-white/90 backdrop-blur-sm p-5 sm:p-8 shadow-lg overflow-hidden">
          {children}
        </div>
      </main>

      {/* ===== Bottom Navigation (Mobile) ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-white/90 backdrop-blur-md py-2 shadow-lg md:hidden">
        <NavLink href="/admin/dashboard" icon={LayoutDashboard} label="Home" />
        <NavLink href="/admin/stores" icon={Package} label="Stores" />

        {/* Floating Scan Button */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => setScannerOpen(true)}
            className="absolute -top-5 bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 active:scale-95 transition"
          >
            <QrCode className="h-5 w-5" />
          </button>
        </div>

        <NavLink href="/admin/users" icon={Users} label="Users" />
        <NavLink href="/admin/settings" icon={Settings} label="Settings" />
      </nav>

      {/* ===== Scanner Modal ===== */}
      {scannerOpen && (
        <VoucherScanner open={scannerOpen} onClose={() => setScannerOpen(false)} />

      )}
    </div>
  )
}

/* ====== Mobile Bottom Nav Link ====== */
function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<any>
  label: string
}) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      className={`flex flex-col items-center text-[11px] ${
        active ? 'text-emerald-600 font-medium' : 'text-gray-500 hover:text-emerald-600'
      }`}
    >
      <Icon className="h-5 w-5 mb-0.5" />
      {label}
    </Link>
  )
}
