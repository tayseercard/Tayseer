"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Gift,
  Users,
  Settings,
  TrendingUp,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/stores", label: "Stores", icon: Package },
  { href: "/admin/vouchers", label: "Vouchers", icon: Gift },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: TrendingUp },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminTopNav() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex w-full justify-center bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="flex items-center gap-2 py-3 px-4 overflow-x-auto scrollbar-hide">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap
                ${
                  active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
