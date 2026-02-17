'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import VoucherScanner from '@/components/VoucherScanner'
import { useLanguage } from '@/lib/useLanguage'
import NotificationBell from '@/components/NotificationBell'
import NotificationPanel from '@/components/NotificationPanel'
import NotificationModal from '@/components/NotificationModal'

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
import { Toaster } from 'react-hot-toast'

export default function StoreLayout({ children }: { children: React.ReactNode }) {

  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [storeName, setStoreName] = useState<string | null>(null)
  const [storeLogo, setStoreLogo] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const { t, lang } = useLanguage()

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifRefresh, setNotifRefresh] = useState(0)

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  useEffect(() => {
    ; (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/auth/login?redirectTo=/store')
        return
      }

      const { data: store } = await supabase
        .from('stores')
        .select('name, status, logo_url')
        .eq('owner_user_id', session.user.id)
        .maybeSingle()

      if (store?.status === 'inactive' && !pathname.includes('/auth/pending')) {
        router.replace('/auth/pending')
        return
      }

      setStoreName(store?.name ?? 'Store')
      setStoreLogo(store?.logo_url ?? null)
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

        {/* === GLOBAL NOTIFICATION SYSTEM === */}
        <Toaster position="top-right" />
        <NotificationPanel
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          onRefreshCount={() => setNotifRefresh((n) => n + 1)}
        />
        <NotificationModal
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          onClickNotification={(n) => {
            setNotifOpen(false)
            if (n.link) {
              router.push(n.link)
            } else if (n.request_id) {
              router.push(`/store/requests?id=${n.request_id}`)
            } else {
              router.push("/store/notifications")
            }
          }}
        />

        <div className="relative flex items-center justify-center px-6 py-3">

          {/* LEFT: Logo & Bell */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
            {/* Logo */}
            <div className="relative h-8 w-28">
              <Image alt="tayseer" src="/icon-192.png" fill className="object-contain" />
            </div>

            {/* 🔔 Notification Bell */}
            <NotificationBell
              onOpen={() => setNotifOpen(true)}
              refreshSignal={notifRefresh}
            />
          </div>

          {/* CENTER: Desktop Nav */}
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${active
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

          {/* RIGHT: Profile Dropdown */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <div
              className="relative"
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              <button
                className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-sm transition-transform hover:scale-105 bg-white"
              >
                {storeLogo ? (
                  <Image src={storeLogo} alt="Profile" fill className="object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <Users className="h-5 w-5" />
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 top-full pt-2 w-56 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Connecté en tant que</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{storeName}</p>
                    </div>

                    <div className="p-1">
                      <Link
                        href="/store/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        {t.settings}
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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
      className={`flex flex-col items-center text-[11px] ${active
        ? 'text-[--c-accent] font-medium'
        : 'text-white/70 hover:text-[var(--c-accent)]'
        }`}
    >
      <Icon className="h-5 w-5 mb-0.5" />
      {label}
    </Link>
  )
}
