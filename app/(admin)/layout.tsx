'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Gift,
  Users,
  QrCode,
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()
  const [email] = useState('admin@tayseer.com')

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-gray-100 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-center border-b py-4">
          <div className="relative h-9 w-28">
            <Image alt="tayseer" src="/tayseercard.png" fill className="object-contain" />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <NavItem href="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/admin/stores" icon={Package} label="Stores" />
          <NavItem href="/admin/vouchers" icon={Gift} label="Vouchers" />
          <NavItem href="/admin/users" icon={Users} label="Users" />
          <NavItem href="/admin/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="mt-auto border-t p-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-800">{email}</div>
              <div className="text-xs text-gray-500">@tayseer</div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 relative z-10 md:ml-64 pt-14 md:pt-0 px-3 sm:px-5 md:px-8 transition-all duration-300">
        <div className="h-full min-h-[85vh] rounded-2xl border border-gray-100 bg-white/90 backdrop-blur-sm p-5 sm:p-8 shadow-lg overflow-hidden">
          {children}
        </div>
      </main>

      {/* ===== Bottom Navigation (Mobile Only) ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-white/90 backdrop-blur-md py-2 shadow-lg md:hidden">
        <NavLink href="/admin/dashboard" icon={LayoutDashboard} label="Home" />
        <NavLink href="/admin/stores" icon={Package} label="Stores" />
        <div className="relative flex items-center justify-center">
          {/* Floating Action Button (Scan / Add Voucher) */}
          <Link
            href="/admin/vouchers"
            className="absolute -top-5 bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition"
          >
            <QrCode className="h-5 w-5" />
          </Link>
        </div>
        <NavLink href="/admin/users" icon={Users} label="Users" />
        <NavLink href="/admin/settings" icon={Settings} label="Settings" />
      </nav>
    </div>
  )
}

/* ====== Desktop Sidebar NavItem ====== */
function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<any>
  label: string
}) {
  const pathname = usePathname()
  const active = pathname?.startsWith(href)
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all ${
        active
          ? 'bg-emerald-100 text-emerald-700 font-medium shadow-sm'
          : 'text-gray-700 hover:bg-gray-100 hover:text-emerald-600'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
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
