'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import VoucherScanner from '@/components/VoucherScanner'

import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Users,
  QrCode,
  ArrowLeft,
  QrCodeIcon,
  Gift,
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()
  const [scannerOpen, setScannerOpen] = useState(false)

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const crumbs = pathname?.split('/').filter(Boolean).slice(1)
  const breadcrumbTitle =
    crumbs.length > 0 ? crumbs[crumbs.length - 1].replace(/-/g, ' ') : 'Dashboard'

  return (
    <div
      className="
        h-screen flex flex-col 
        bg-[var(--bg)] text-[var(--c-text)] 
        md:overflow-hidden overflow-auto
      "
    >
      {/* ===== Desktop Top Navigation ===== */}
      <header className="hidden md:flex flex-col w-full sticky top-0 z-50 bg-[var(--c-bg)] text-[var(--c-text)]  border-b border-[var(--c-bank)]/20 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="relative h-8 w-28">
            <Image alt="tayseer" src="/icon-192.png" fill className="object-contain" />
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
                      ? 'bg-[var(--c-accent)] text-white shadow-sm'
                      : 'bg-white/10 text-[var(--c-text)]  hover:bg-[var(--c-accent)]/20'
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
            className="text-xs text-[var(--c-text)] hover:text-[var(--c-accent)] flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-6 py-2 border-t border-gray-400 text-sm text-[var(--c-text)] bg-[var(--c-bg)] ">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 hover:text-[var(--c-accent)] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-[var(--c-text)]">/</span>
          <span className="font-medium text-[var(--c-text)] capitalize">{breadcrumbTitle}</span>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main
        className="
          flex-1 flex flex-col justify-between h-full 
          overflow-y-auto md:overflow-hidden 
          px-4 sm:px-6 md:px-10 py-4 
          pb-20 md:pb-0
        "
      >
        <div className="flex flex-col flex-grow justify-between h-full">{children}</div>
      </main>

      {/* ===== Bottom Navigation (Mobile) ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-70 flex justify-around border-t border-[var(--c-accent)]/20 bg-[var(--c-primary)] text-[var(--c-text)] hover-[var(--c-text)] backdrop-blur-md py-2 shadow-lg md:hidden">
        <NavLink href="/admin/dashboard" icon={LayoutDashboard} label="Home" />
        <NavLink href="/admin/stores" icon={Package} label="Stores" />

        {/* Floating Scan Button */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => setScannerOpen(true)}
            className="absolute -top-5 bg-[var(--c-accent)] text-white p-3 rounded-full shadow-lg hover:bg-[#c53e00] active:scale-95 transition"
          >
            <QrCode className="h-5 w-5" />
          </button>
        </div>

        <NavLink href="/admin/vouchers" icon={Gift} label="Vouchers" />
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
      className={`flex flex-col items-center hover:text-accent text-[11px] ${
        active
          ? 'text-[--c-gring-amber-400] font-medium'
          : 'text-white/70 hover:text-[var(--c-amber-900)]'
      }`}
    >
      <Icon className="h-5 w-5 mb-0.5" />
      {label}
    </Link>
  )
}
