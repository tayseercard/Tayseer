'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Store as StoreIcon,
  Gift,
  QrCode,
  TrendingUp,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [screenWidth, setScreenWidth] = useState(0)

  const [storeStats, setStoreStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    online: 0,
    offline: 0,
  })
  const [voucherStats, setVoucherStats] = useState({
    total: 0,
    active: 0,
    redeemed: 0,
    empty: 0,
  })

  /* ---------- Load Data ---------- */
  useEffect(() => {
    if (typeof window !== 'undefined') setScreenWidth(window.innerWidth)
    ;(async () => {
      setLoading(true)
      const [{ data: stores }, { data: vouchers }] = await Promise.all([
        supabase.from('stores').select('*'),
        supabase.from('vouchers').select('*'),
      ])

      if (stores)
        setStoreStats({
          total: stores.length,
          open: stores.filter((s) => s.status === 'open').length,
          closed: stores.filter((s) => s.status === 'closed').length,
          online: stores.filter((s) => s.type === 'online').length,
          offline: stores.filter((s) => s.type === 'offline').length,
        })

      if (vouchers)
        setVoucherStats({
          total: vouchers.length,
          active: vouchers.filter((v) => v.status === 'active').length,
          redeemed: vouchers.filter((v) => v.status === 'redeemed').length,
          empty: vouchers.filter(
            (v) => v.status === 'blank' || v.status === 'precreated'
          ).length,
        })
      setLoading(false)
    })()
  }, [supabase])

  /* ---------- Drag control ---------- */
  const handleDragEnd = (_: any, info: any) => {
    if (screenWidth === 0) return
    const threshold = screenWidth / 4
    if (info.offset.x < -threshold && currentIndex < 2) setCurrentIndex((i) => i + 1)
    else if (info.offset.x > threshold && currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  const x = -currentIndex * screenWidth

  return (
    <div className="relative h-[100dvh] bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 overflow-hidden">
      {/* ---------- Desktop fallback ---------- */}
      <div className="hidden md:block px-8 py-8 space-y-8">
        <Header />
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <StoreIcon className="h-5 w-5 text-emerald-600" /> Overview
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard title="Stores" value={storeStats.total} color="emerald" />
          <StatCard title="Active Vouchers" value={voucherStats.active} color="indigo" />
          <StatCard title="Redeemed" value={voucherStats.redeemed} color="rose" />
        </div>
      </div>

      {/* ---------- Mobile Swipe ---------- */}
      <div className="md:hidden h-full w-full relative">
        <motion.div
          className="flex h-full"
          drag="x"
          dragConstraints={{ left: -screenWidth * 2, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* PAGE 1: Quick Actions */}
          <div className="min-w-full h-[100dvh] flex flex-col justify-center items-center px-5 space-y-6">
            <Header mobile />
            <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <LinkCard
                href="/admin/stores"
                icon={<StoreIcon className="h-6 w-6 text-emerald-600" />}
                title="Stores"
                desc="Manage"
                gradient="from-emerald-50 to-emerald-100"
              />
              <LinkCard
                href="/admin/vouchers"
                icon={<Gift className="h-6 w-6 text-pink-500" />}
                title="Vouchers"
                desc="Manage"
                gradient="from-pink-50 to-pink-100"
              />
              <LinkCard
                href="/admin/reports"
                icon={<TrendingUp className="h-6 w-6 text-indigo-500" />}
                title="Reports"
                desc="View"
                gradient="from-indigo-50 to-indigo-100"
              />
              <LinkCard
                href="/admin/settings"
                icon={<Settings className="h-6 w-6 text-gray-600" />}
                title="Settings"
                desc="Config"
                gradient="from-gray-50 to-gray-100"
              />
            </div>
          </div>

          {/* PAGE 2: Store Overview */}
          <div className="min-w-full h-[100dvh] flex flex-col justify-center items-center px-5 space-y-6">
            <h2 className="text-lg font-semibold text-emerald-700 flex items-center gap-2">
              <StoreIcon className="h-5 w-5" /> Store Overview
            </h2>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              <StatCard title="Total" value={storeStats.total} color="emerald" />
              <StatCard title="Open" value={storeStats.open} color="sky" />
              <StatCard title="Closed" value={storeStats.closed} color="rose" />
              <StatCard title="Online" value={storeStats.online} color="purple" />
            </div>
          </div>

          {/* PAGE 3: Voucher Overview */}
          <div className="min-w-full h-[100dvh] flex flex-col justify-center items-center px-5 space-y-6">
            <h2 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
              <Gift className="h-5 w-5" /> Voucher Overview
            </h2>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              <StatCard title="Total" value={voucherStats.total} color="indigo" />
              <StatCard title="Active" value={voucherStats.active} color="emerald" />
              <StatCard title="Redeemed" value={voucherStats.redeemed} color="rose" />
              <StatCard title="Empty" value={voucherStats.empty} color="gray" />
            </div>
          </div>
        </motion.div>

        {/* Pagination dots */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                currentIndex === i ? 'bg-emerald-600 w-4' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Components ---------- */
function Header({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between ${
        mobile ? 'w-full px-2 absolute top-4' : ''
      }`}
    >
      <h1 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
        <StoreIcon className="h-5 w-5 text-emerald-600" /> Dashboard
      </h1>
      <button className="border rounded-md px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100">
        <RefreshCw className="h-3.5 w-3.5 inline mr-1" />
        Refresh
      </button>
    </div>
  )
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string
  value: number
  color: string
}) {
  const gradients: any = {
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
    indigo: 'from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200',
    rose: 'from-rose-50 to-rose-100 text-rose-700 border-rose-200',
    amber: 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
    purple: 'from-purple-50 to-purple-100 text-purple-700 border-purple-200',
    gray: 'from-gray-50 to-gray-100 text-gray-700 border-gray-200',
    sky: 'from-sky-50 to-sky-100 text-sky-700 border-sky-200',
  }
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`rounded-xl bg-gradient-to-br ${gradients[color]} border shadow-sm p-3 flex flex-col items-start justify-center`}
    >
      <p className="text-[11px] uppercase font-medium text-gray-500">{title}</p>
      <p className="text-xl font-semibold">
        <CountUp end={value} duration={1.2} separator="," />
      </p>
    </motion.div>
  )
}

function LinkCard({
  href,
  icon,
  title,
  desc,
  gradient,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
  gradient: string
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center rounded-xl border p-4 bg-gradient-to-br ${gradient} hover:shadow-md transition`}
    >
      {icon}
      <h3 className="font-medium text-sm text-gray-800 mt-1">{title}</h3>
      <p className="text-[11px] text-gray-500">{desc}</p>
    </Link>
  )
}
