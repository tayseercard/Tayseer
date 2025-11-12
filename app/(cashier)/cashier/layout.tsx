'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import VoucherScanner from '@/components/VoucherScanner'
import { useLanguage } from '@/lib/useLanguage'

import {
  LayoutDashboard,
  Gift,
  Settings,
  LogOut,
  Users,
  QrCode,
  ArrowLeft,
  Package,
} from 'lucide-react'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [storeName, setStoreName] = useState<string | null>(null)
const { t, lang } = useLanguage()

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/auth/login?redirectTo=/cashier')
        return
      }

      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('owner_user_id', session.user.id)
        .maybeSingle()

      setStoreName(store?.name ?? 'Store')
    })()
  }, [supabase, router])

  const crumbs = pathname?.split('/').filter(Boolean).slice(1)
  const breadcrumbTitle =
    crumbs.length > 0 ? crumbs[crumbs.length - 1].replace(/-/g, ' ') : 'Dashboard'

  return (
    <div
      className="
        flex flex-col 
        bg-[var(--bg)] text-[var(--c-text)] 
        md:overflow-hidden
      "
    >
      {/* ===== Desktop Top Navigation ===== */}
      <header className="hidden md:flex flex-col w-full sticky top-0 z-50 bg-[var(--c-bg)] text-[var(--c-text)] border-b border-[var(--c-bank)]/20 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="relative h-8 w-28">
            <Image alt="tayseer" src="/icon-192.png" fill className="object-contain" />
          </div>

          {/* Desktop Nav */}
          <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {[
              { href: '/store/dashboard', label: t.dashboard, icon: LayoutDashboard },
              { href: '/store/vouchers', label: t.vouchers, icon: QrCode },
              { href: '/store/clients', label: t.clients, icon: Users },
              { href: '/store/settings', label: t.settings, icon: Settings },
            ].map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[var(--c-accent)] text-white shadow-sm'
                      : 'bg-white/10 text-[var(--c-text)] hover:bg-[var(--c-accent)]/20'
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
        <div className="flex items-center gap-2 px-6 py-2 border-t border-gray-400 text-sm text-[var(--c-text)] bg-[var(--c-bg)]">
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
          md:overflow-hidden 
          px-4 sm:px-6 md:px-10 py-4 
          pb-20 md:pb-0
        "
      >
        <div className="flex flex-col flex-grow justify-between h-full">{children}</div>
      </main>

      {/* ===== Bottom Navigation (Mobile) ===== */}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-70
          flex justify-around items-center
          border-t border-[var(--c-accent)]/20
          bg-[var(--c-primary)] text-[var(--c-accent)]
          backdrop-blur-lg
          py-3 shadow-xl md:hidden
          h-[70px]
        "
      >
        {/* Buttons container (lifted upward) */}
        <div className="flex flex-1 justify-around items-end pb-4">
          <NavLink href="/store/dashboard" icon={LayoutDashboard} label={t.home} />
          <NavLink href="/store/clients" icon={Users} label={t.clients} />

          {/* Floating Scan Button */}
          <div className="relative flex items-center justify-center -mt-10">
            <button
              onClick={() => setScannerOpen(true)}
              className="
                bg-[var(--c-accent)] text-white 
                p-4 rounded-full shadow-lg
                hover:bg-[var(--c-accent)]/90 active:scale-95
                transition-all duration-150
              "
            >
              <QrCode className="h-6 w-6" />
            </button>
          </div>

          <NavLink href="/store/vouchers" icon={Gift} label={t.vouchers} />
          <NavLink href="/store/settings" icon={Settings} label={t.settings} />
        </div>
      </nav>

      {/* ===== QR Scanner Modal ===== */}
      {scannerOpen && (
        <VoucherScanner open={scannerOpen} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  )
}

/* ===== Mobile Bottom Nav Link ===== */
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
        active
          ? 'text-[--c-accent] font-medium'
          : 'text-white/70 hover:text-[var(--c-accent)]'
      }`}
    >
      <Icon className="h-5 w-5 mb-0.5" />
      {label}
    </Link>
  )
}
