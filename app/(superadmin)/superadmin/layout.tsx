'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CiUser } from "react-icons/ci";
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Gift,
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [email] = useState('superadmin@tayseer.com')

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden">
      {/* ====== Topbar ====== */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-1.5 hover:bg-gray-100"
          >
            {menuOpen ? (
              <X className="h-5 w-5 text-gray-700" />
            ) : (
              <Menu className="h-5 w-5 text-gray-700" />
            )}
          </button>
          <div className="relative h-8 w-24">
            <Image alt="tayseer" src="/tayseercard.png" fill className="object-contain" />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-600 hover:underline"
        >
          Logout
        </button>
      </header>

      {/* ====== Overlay Sidebar ====== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[250px] transform bg-white/95 backdrop-blur-md border-r border-gray-200 shadow-xl transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="relative h-8 w-24">
            <Image alt="tayseer" src="/tayseercard.png" fill className="object-contain" />
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-md"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="px-3 mt-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-9 text-sm text-gray-700 outline-none placeholder:text-gray-500"
            />
          </div>

          <div className="text-[12px] uppercase tracking-wide text-gray-500 mb-2">
            Main Menu
          </div>
          <nav className="space-y-1">
            <NavItem
              href="/superadmin/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              onClick={() => setMenuOpen(false)}
            />
            <NavItem
              href="/superadmin/stores"
              icon={Package}
              label="Stores"
              onClick={() => setMenuOpen(false)}
            />
            <NavItem
              href="/superadmin/vouchers"
              icon={Gift}
              label="Vouchers"
              onClick={() => setMenuOpen(false)}
            />
            <NavItem
              href="/superadmin/users"
              icon={CiUser}
              label="Users"
              onClick={() => setMenuOpen(false)}
            />
            <NavItem
              href="/superadmin/roles"
              icon={Gift}
              label="Roles"
              onClick={() => setMenuOpen(false)}
            />
            <NavItem
            
              href="/superadmin/settings"
              icon={Settings}
              label="Settings"
              onClick={() => setMenuOpen(false)}
            />
          </nav>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 px-3 pb-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-800">
                {email ?? 'Admin'}
              </div>
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

      {/* ====== Dimmed Background ====== */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ====== Main Content ====== */}
      <main className="relative z-10 p-4 md:p-6 transition-all duration-300">
        <div className="flex h-full min-h-[85vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1 truncate">
              <Link href="/admin" className="hover:underline">
                Main Menu
              </Link>
              <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              <span className="font-medium text-gray-900 truncate">
                {pathname?.split('/').slice(2).join(' / ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}

/* ====== Reusable NavItem ====== */
function NavItem({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string
  icon: React.ComponentType<any>
  label: string
  onClick?: () => void
}) {
  const pathname = usePathname()
  const active = pathname?.startsWith(href)
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
        active
          ? 'bg-emerald-50 text-emerald-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}
