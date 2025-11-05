'use client'
import DashboardHeader from '@/components/DashboardHeader'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Store as StoreIcon,
  Gift,
  QrCode,
  TrendingUp,
  RefreshCw,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic' // ✅ Prevents prerender error (SSR-safe)

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)

  const [stores, setStores] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [storeStats, setStoreStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
  })
  const [voucherStats, setVoucherStats] = useState({
    total: 0,
    active: 0,
    redeemed: 0,
  })

  const [topStores, setTopStores] = useState<any[]>([])

  /* ---------- Load Data ---------- */
  useEffect(() => {
    ;(async () => {
      setLoading(true)

      const [{ data: storesData }, { data: vouchersData }] = await Promise.all([
        supabase.from('stores').select('*').order('created_at', { ascending: false }),
        supabase.from('vouchers').select('*').order('created_at', { ascending: false }),
      ])

      if (storesData) {
        setStores(storesData)
        setStoreStats({
          total: storesData.length,
          open: storesData.filter((s) => s.status === 'open').length,
          closed: storesData.filter((s) => s.status === 'closed').length,
        })
      }

      if (vouchersData) {
        setVouchers(vouchersData)
        setVoucherStats({
          total: vouchersData.length,
          active: vouchersData.filter((v) => v.status === 'active').length,
          redeemed: vouchersData.filter((v) => v.status === 'redeemed').length,
        })
      }

      // 📊 Compute top stores by active vouchers
      if (storesData && vouchersData) {
        const grouped: Record<string, number> = {}
        vouchersData
          .filter((v) => v.status === 'active')
          .forEach((v) => {
            if (v.store_id) grouped[v.store_id] = (grouped[v.store_id] || 0) + 1
          })

        const ranked = storesData
          .map((s) => ({ ...s, activeCount: grouped[s.id] || 0 }))
          .sort((a, b) => b.activeCount - a.activeCount)
          .slice(0, 5)

        setTopStores(ranked)
      }

      setLoading(false)
    })()
  }, [supabase])

  /* ---------- Refresh ---------- */
  function handleRefresh() {
    if (typeof window !== 'undefined') window.location.reload()
  }

 /* ---------- UI ---------- */
/* ---------- UI ---------- */
return (
<div  className="
      relative flex flex-col h-full 
      overflow-y-auto md:overflow-hidden
      bg-gradient-to-br from-white via-gray-50 to-emerald-50 
      text-gray-900 px-4 py-6 sm:px-6 lg:px-10
    ">
    {/* Background Accent */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-emerald-100/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[35rem] h-[35rem] bg-sky-100/40 blur-[100px] rounded-full" />
    </div>

    {/* HEADER */}
  <DashboardHeader
  title="Dashboard"
  icon={<StoreIcon className="h-5 w-5 text-emerald-600" />}
  user={{
    name: 'Djamil',
    email: 'admin@tayseer.app',
    role: 'Admin',
    avatarUrl: '/images/avatar-admin.png',
  }}
  
/>


    {/* SUMMARY STATS */}
    <div className="flex-shrink-0 mt-8">
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm animate-pulse">
          Loading dashboard data…
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            <StatCard title="Stores" value={storeStats.total} color="emerald" />
            <StatCard title="Open" value={storeStats.open} color="sky" />
            <StatCard title="Closed" value={storeStats.closed} color="rose" />
            <StatCard title="Vouchers" value={voucherStats.total} color="indigo" />
            <StatCard title="Active" value={voucherStats.active} color="emerald" />
            <StatCard title="Redeemed" value={voucherStats.redeemed} color="amber" />
          </motion.div>
        </AnimatePresence>
      )}
    </div>

    {/* DASHBOARD CARDS */}
    {!loading && (
  <div className="mt-8 sm:mt-10 lg:mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
        {/* Latest Stores */}
        <DashboardCard 
        
          title="Latest Stores"
          icon={<StoreIcon className="h-5 w-5 text-emerald-600" />}
          link="/admin/stores"
        >
          {stores.length === 0 ? (
            <p className="text-sm text-gray-400">No stores yet.</p>
          ) : (
            <ul className="space-y-3">
              {stores.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm"
                >
                  <span className="truncate font-medium text-gray-700">{s.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        {/* Latest Vouchers */}
        <DashboardCard
          title="Recent Vouchers"
          icon={<Gift className="h-5 w-5 text-pink-500" />}
          link="/admin/vouchers"
        >
          {vouchers.length === 0 ? (
            <p className="text-sm text-gray-400">No vouchers yet.</p>
          ) : (
            <ul className="space-y-3">
              {vouchers.slice(0, 5).map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm"
                >
                  <span className="truncate font-medium text-gray-700">
                    {v.code || '—'}
                    <span className="text-gray-400 text-xs ml-1">({v.status})</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        {/* Top Stores */}
        <DashboardCard
          title="Top Performing Stores"
          icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
        >
          {topStores.length === 0 ? (
            <p className="text-sm text-gray-400">No active vouchers found.</p>
          ) : (
            <ul className="space-y-3">
              {topStores.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm"
                >
                  <span className="truncate font-medium text-gray-700">{s.name}</span>
                  <span className="text-xs text-emerald-600 font-semibold">
                    {s.activeCount} active
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    )}
  </div>
)


}

/* ---------- Components ---------- */

function StatCard({
  title,
  value,
  color,
}: {
  title: string
  value: number
  color?: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-100',
    indigo: 'from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-100',
    rose: 'from-rose-50 to-rose-100 text-rose-700 border-rose-100',
    amber: 'from-amber-50 to-amber-100 text-amber-700 border-amber-100',
    sky: 'from-sky-50 to-sky-100 text-sky-700 border-sky-100',
    gray: 'from-gray-50 to-gray-100 text-gray-700 border-gray-100',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`rounded-xl bg-gradient-to-br ${colorMap[color || 'gray']} 
        border shadow-sm p-3 sm:p-4 flex flex-col justify-center 
        min-h-[80px] sm:min-h-[100px] hover:shadow-md transition-all`}
    >
      <p className="text-[11px] uppercase font-medium tracking-wide text-gray-500 mb-0.5">
        {title}
      </p>
      <p className="text-xl sm:text-2xl font-semibold leading-none">
        {value.toLocaleString()}
      </p>
    </motion.div>
  )
}


function DashboardCard({
  title,
  icon,
  link,
  children,
}: {
  title: string
  icon: React.ReactNode
  link?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm 
                 shadow-sm hover:shadow-md transition-all p-4 flex flex-col
                 overflow-hidden min-h-[220px] max-h-[300px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          {icon}
          {title}
        </h3>

        {link && (
          <Link
            href={link}
            className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            View all →
          </Link>
        )}
      </div>

      {/* Scrollable Content */}
<div className="flex-1 overflow-y-auto md:overflow-visible scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-1">
        {children}
      </div>
    </div>
  )
}


