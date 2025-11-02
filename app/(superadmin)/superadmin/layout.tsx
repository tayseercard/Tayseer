'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Stores', href: '/superadmin/stores', icon: Building2 },
  { name: 'Roles', href: '/superadmin/roles', icon: ShieldCheck },
  { name: 'Audit Logs', href: '/superadmin/logs', icon: FileText },
  { name: 'Settings', href: '/superadmin/settings', icon: Settings },
]

export default function SuperadminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const supabase = createClientComponentClient()

  // ✅ Clean logout
  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:static z-20 w-64 bg-white border-r border-gray-200 h-full transition-transform duration-200`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h1 className="text-xl font-semibold">👑 Superadmin</h1>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col py-4 space-y-1">
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setOpen(false)}
              >
                <Icon size={16} />
                {name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setOpen(true)} className="text-gray-700">
            <Menu size={20} />
          </button>
          <h2 className="font-semibold text-lg">Tayseer Admin</h2>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
