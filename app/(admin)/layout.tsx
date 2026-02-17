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
  Package,
  Settings,
  LogOut,
  Users,
  QrCode,
  ArrowLeft,
  QrCodeIcon,
  Gift,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'

import { PageTitleProvider, usePageTitle } from '@/lib/PageTitleContext'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTitleProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </PageTitleProvider>
  )
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()
  const [scannerOpen, setScannerOpen] = useState(false)
  const { t, lang } = useLanguage()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifRefresh, setNotifRefresh] = useState(0)
  const { title, setTitle } = usePageTitle()

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.body.classList.toggle('rtl', lang === 'ar')
  }, [lang])

  // Reset title on path change to avoid showing previous page's title
  useEffect(() => {
    setTitle(null)
  }, [pathname, setTitle])

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const breadcrumbTitle = title || pathname?.split('/').filter(Boolean).slice(1).pop()?.replace(/-/g, ' ') || t.dashboard

  return (
    <div className={`flex flex-col min-h-screen bg-gray-50 text-gray-900 transition-all duration-300 ${lang === 'ar' ? 'rtl' : 'ltr'}`}>

      {/* 🖥️ Desktop Navbar (Premium Glassmorphism) */}
      <header className="hidden md:block sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-gray-200/40 select-none">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="h-16 flex items-center justify-between relative">
            <Link href="/admin" className="flex items-center gap-2 group">
              <div className="relative h-8 w-8 bg-[#020035] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-900/10 group-hover:scale-105 transition-transform duration-300">
                T
              </div>
              <span className="text-base font-bold text-[#020035] tracking-tight group-hover:text-[#ED4B00] transition-colors">tayseer admin</span>
            </Link>

            <nav className="absolute left-1/2 -translate-x-1/2 flex items-center p-1 bg-gray-100/50 rounded-2xl border border-gray-100 h-11">
              {[
                { href: '/admin', label: t.dashboard, icon: LayoutDashboard },
                { href: '/admin/stores', label: t.stores, icon: Package },
                { href: '/admin/vouchers', label: t.vouchers, icon: QrCodeIcon },
                { href: '/admin/users', label: t.users, icon: Users },
                { href: '/admin/settings', label: t.settings, icon: Settings },
              ].map(({ href, label, icon: Icon }) => {
                const active = href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all duration-300 overflow-hidden group h-9 ${active
                      ? 'bg-white text-[#020035] shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    <Icon className={`h-4 w-4 transition-colors ${active ? 'text-[#ED4B00]' : 'group-hover:text-gray-800'}`} />
                    <span className="whitespace-nowrap">{label}</span>
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ED4B00] opacity-80"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
                <NotificationBell onOpen={() => setNotifOpen(true)} refreshSignal={notifRefresh} light />
              </div>

              <div className="flex items-center gap-3 pl-2">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-900 leading-none">Admin</span>
                  <span className="text-[10px] text-gray-400 font-medium">Platform Manager</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 border border-transparent hover:border-rose-100 shadow-sm"
                  title={t.logout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Breadcrumb / Context Bar */}
        <div className="bg-gray-50/40 border-t border-gray-100/60">
          <div className="max-w-[1440px] mx-auto px-10 h-8 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-gray-400">
              <button
                onClick={() => router.back()}
                className="hover:text-[#020035] transition-colors flex items-center gap-1.5 group"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                {t.back}
              </button>
              <div className="h-3 w-[1px] bg-gray-200" />
              <div className="flex items-center gap-1 text-gray-400">
                <span className="hover:text-gray-600 cursor-default transition-colors">Admin</span>
                <span className="opacity-30">/</span>
                <span className="text-[#020035]">{breadcrumbTitle}</span>
              </div>
            </div>

            <div className="text-[9px] text-gray-300 font-bold uppercase tracking-widest flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Active
            </div>
          </div>
        </div>
      </header>

      {/* 📱 Mobile Navbar (iOS-Style Floating Tab Bar) */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 z-[100]">
        <div className="bg-white/80 backdrop-blur-2xl border border-gray-200/50 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.08)] px-4 h-[65px] flex items-center relative overflow-visible">

          <div className="flex-1 flex justify-around items-center h-full relative z-10 overflow-visible">
            <MobileNavLink href="/admin" icon={LayoutDashboard} label={t.dashboard} />
            <MobileNavLink href="/admin/stores" icon={Package} label={t.stores} />

            {/* 📸 iOS QR Button */}
            <div className="relative -mt-10 overflow-visible flex flex-col items-center">
              <div className="absolute inset-0 bg-black/5 blur-2xl pointer-events-none" />
              <button
                onClick={() => setScannerOpen(true)}
                className="relative bg-[#020035] text-white p-4 rounded-full shadow-2xl active:scale-90 transition-all duration-300 border-[5px] border-white z-20 group"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition rounded-full" />
                <QrCode className="h-6 w-6 text-white" />
              </button>
            </div>

            <MobileNavLink href="/admin/vouchers" icon={Gift} label={t.vouchers} />
            <MobileNavLink href="/admin/settings" icon={Settings} label={t.settings} />
          </div>
        </div>
      </nav>

      {/* 🌫️ Bottom Blur Area (iOS Style Glassy Overlay) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-md pointer-events-none z-[90] [mask-image:linear-gradient(to_top,black,transparent)]" />

      {/* Content Area */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full p-4 md:p-6 pb-[100px] md:pb-6 overflow-x-hidden">
        <Toaster position="top-right" />
        <div className="animate-in fade-in duration-500">{children}</div>
      </main>

      {/* Modals & Overlays */}
      {scannerOpen && <VoucherScanner open={scannerOpen} onClose={() => setScannerOpen(false)} />}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} onRefreshCount={() => setNotifRefresh(n => n + 1)} />
      <NotificationModal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onClickNotification={n => {
          setNotifOpen(false)
          if (n.link) {
            router.push(n.link)
          } else if (n.request_id) {
            router.push(`/admin/voucher-requests?id=${n.request_id}`)
          } else {
            router.push("/admin/notifications")
          }
        }}
      />
    </div>
  )
}

function MobileNavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-[#020035]' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-[#020035]/5 translate-y-[-2px]' : ''}`}>
        <Icon className={`h-5 w-5 ${active ? 'scale-110 drop-shadow-sm' : ''}`} />
      </div>
      <span className={`text-[8px] font-black uppercase text-center leading-tight tracking-tighter max-w-[40px] transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>
        {label === 'Home' ? 'Home' : label}
      </span>
      {active && <div className="absolute -bottom-1 w-1 h-1 bg-[#020035] rounded-full" />}
    </Link>
  )
}
