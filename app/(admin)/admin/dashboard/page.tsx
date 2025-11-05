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
  return (
<div className="h-screen md:overflow-hidden overflow-auto bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 px-4 py-8 sm:px-6 lg:px-10 flex flex-col md:justify-between">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold flex items-center gap-2">
            <StoreIcon className="h-6 w-6 text-emerald-600" />
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm">Business overview and activity insights</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 text-sm rounded-md border px-3 py-2 hover:bg-gray-100 transition"
        >
          <RefreshCw className="h-4 w-4 text-gray-600" /> Refresh
        </button>
      </motion.header>

      {/* SUMMARY STATS */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm animate-pulse">
          Loading dashboard data…
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
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

      {/* DASHBOARD CARDS */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Latest Stores */}
          <DashboardCard
            title="🧱 Latest Stores"
            icon={<StoreIcon className="h-5 w-5 text-emerald-600" />}
            link="/admin/stores"
          >
            {stores.length === 0 ? (
              <p className="text-sm text-gray-400">No stores yet.</p>
            ) : (
              <ul className="space-y-2">
                {stores.slice(0, 5).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border-b border-gray-100 py-1.5 text-sm"
                  >
                    <span className="truncate">{s.name}</span>
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
            title="🎁 Latest Vouchers"
            icon={<Gift className="h-5 w-5 text-pink-500" />}
            link="/admin/vouchers"
          >
            {vouchers.length === 0 ? (
              <p className="text-sm text-gray-400">No vouchers yet.</p>
            ) : (
              <ul className="space-y-2">
                {vouchers.slice(0, 5).map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between border-b border-gray-100 py-1.5 text-sm"
                  >
                    <span className="truncate">
                      {v.code || '—'}{' '}
                      <span className="text-gray-400 text-xs">({v.status})</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          {/* Top Stores by Active Vouchers */}
          <DashboardCard
            title="🏆 Top Stores by Active Vouchers"
            icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
          >
            {topStores.length === 0 ? (
              <p className="text-sm text-gray-400">No active vouchers found.</p>
            ) : (
              <ul className="space-y-2">
                {topStores.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border-b border-gray-100 py-1.5 text-sm"
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-xs text-emerald-600 font-medium">
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
  const gradients: any = {
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
    indigo: 'from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200',
    rose: 'from-rose-50 to-rose-100 text-rose-700 border-rose-200',
    amber: 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
    sky: 'from-sky-50 to-sky-100 text-sky-700 border-sky-200',
  }
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`rounded-xl bg-gradient-to-br ${
        gradients[color || 'gray']
      } border shadow-sm p-4 flex flex-col items-start justify-center`}
    >
      <p className="text-[11px] uppercase font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">
        <CountUp end={value} duration={1.2} separator="," />
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
    <div className="rounded-2xl border border-gray-100 bg-white/90 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800">
          {icon}
          {title}
        </h3>
        {link && (
          <Link
            href={link}
            className="flex items-center text-xs text-emerald-600 hover:underline"
          >
            View all <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}
