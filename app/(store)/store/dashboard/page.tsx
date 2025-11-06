'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StoreHeader from '@/components/store/StoreHeader'
import {
  Gift,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  QrCode,
  ArrowRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function StoreDashboardPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<{
    name: string
    email: string
    role: string
    logoUrl?: string
  } | null>(null)
  const [voucherStats, setVoucherStats] = useState({
    total: 0,
    active: 0,
    redeemed: 0,
    empty: 0,
    totalValue: 0,
    redeemedValue: 0,
  })
  const [clientStats, setClientStats] = useState({
    totalClients: 0,
    repeatClients: 0,
  })
 useEffect(() => {
    ;(async () => {
      setLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      // 🔹 Get the store linked to this user
      const { data: storeRow } = await supabase
        .from('stores')
        .select('name, email, logo_url')
        .eq('owner_user_id', user.id)
        .maybeSingle()

      setStore({
        name: storeRow?.name || 'Store',
        email: storeRow?.email || user.email || 'No email',
        role: 'Store Owner',
        logoUrl: storeRow?.logo_url || '/icon-192.png',
      })

      // 🔹 Fetch store_id
      const { data: roleRow } = await supabase
        .from('me_effective_role')
        .select('store_id')
        .eq('user_id', user.id)
        .maybeSingle()

      const storeId = roleRow?.store_id
      if (!storeId) {
        setLoading(false)
        return
      }

      // 🔹 Fetch vouchers
      const { data: vouchersData } = await supabase
        .from('vouchers')
        .select('*')
        .eq('store_id', storeId)

      // 🔹 Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('store_id', storeId)

      // Calculate stats
      if (vouchersData) {
        setVoucherStats({
          total: vouchersData.length,
          active: vouchersData.filter((v) => v.status === 'active').length,
          redeemed: vouchersData.filter((v) => v.status === 'redeemed').length,
          empty: vouchersData.filter(
            (v) => v.status === 'blank' || v.status === 'precreated'
          ).length,
          totalValue: vouchersData.reduce(
            (sum, v) => sum + (v.initial_amount || 0),
            0
          ),
          redeemedValue: vouchersData
            .filter((v) => v.status === 'redeemed')
            .reduce((sum, v) => sum + (v.initial_amount || 0), 0),
        })
      }

      if (clientsData) {
        setClientStats({
          totalClients: clientsData.length,
          repeatClients: clientsData.filter((c) => c.visits > 1).length,
        })
      }

      setLoading(false)
    })()
  }, [supabase])


  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--c-text)] px-4 sm:px-6 md:px-10 py-8 space-y-8">
      {/* ===== Header ===== */}
            <StoreHeader store={store || { name: 'Loading…', email: '', role: '', logoUrl: '' }} />

      

      {/* ===== Content ===== */}
      {loading ? (
        <div className="py-20 text-center text-[var(--c-text)]/50 text-sm animate-pulse">
          Loading store dashboard…
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            key="store-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-10"
          >
            {/* === Voucher Overview === */}
           <SectionTitle icon={<Gift />} title="Voucher Overview" href="/store/vouchers" />

 <div className="mt-8 grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  
        <DashboardStatCard title="Total" value={voucherStats.total} subtitle="All vouchers" />
        <DashboardStatCard
          title="active"
          value={voucherStats.active}
          subtitle="Currently active"
          highlight
        />
        <DashboardStatCard
          title="Redeemed"
          value={voucherStats.redeemed}
          subtitle="Used vouchers"
        />
      </div>


            {/* === Financial Summary === */}
            <SectionTitle icon={<CreditCard />} title="Financial Summary" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <DashboardStatCard
                title="Total Value"
                value={voucherStats.totalValue}
                suffix=" DA"
              />
              <DashboardStatCard
                title="Redeemed Value"
                value={voucherStats.redeemedValue}
                suffix=" DA"
              />
              
            </div>

            {/* === Clients === */}            <SectionTitle icon={<Users />} title="Client Overview" href="/store/clients" />
<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
  <DashboardStatCard title="Total Clients" value={clientStats.totalClients} />
</div>
          
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

/* ---------- Reusable Components ---------- */
function SectionTitle({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode
  title: string
  href?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-3"
    >
      <div className="flex items-center gap-2 text-[var(--c-primary)]">
        <div className="p-1 rounded-md bg-[var(--c-accent)]/15 text-[var(--c-accent)]">
          {icon}
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      {href && (
        <Link
          href={href}
          className="
            flex items-center gap-1 text-sm font-medium
            text-[var(--c-accent)] hover:text-[var(--c-accent)]/80
            transition-all group
          "
        >
          <span>See all</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </motion.div>
  )
}

function StatCard({
  title,
  value,
  suffix,
}: {
  title: string
  value: number
  suffix?: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="
        rounded-xl border border-[var(--c-bank)]/20
        bg-[var(--c-primary)]/5 hover:bg-[var(--c-accent)]/10
        shadow-sm p-4 flex flex-col items-start justify-center transition
      "
    >
      <p className="text-[11px] uppercase font-medium text-[var(--c-text)]/60">{title}</p>
      <p className="text-2xl font-semibold mt-1 text-[var(--c-primary)]">
        <CountUp end={value || 0} duration={1.2} separator="," />
        {suffix && <span className="text-sm ml-0.5 text-[var(--c-text)]/70">{suffix}</span>}
      </p>
    </motion.div>
  )
}

function DashboardStatCard({
  title,
  value,
  subtitle,
  highlight = false,
  suffix,
}: {
  title: string
  value: number
  subtitle?: string
  highlight?: boolean
    suffix?: string

}) {
  return (
    <div
      className="rounded-2xl border border-[var(--c-secondary)]/10 bg-white shadow-sm p-4 
                 flex flex-col justify-between hover:shadow-md transition-all"
    >
      <p className="text-sm text-[var(--c-text)]/70">{title}</p>
      <p
        className={`text-2xl font-semibold ${
          highlight ? 'text-[var(--c-accent)]' : 'text-[var(--c-bank)]'
        }`}
      >
        {value.toLocaleString()}
      </p>
      {subtitle && <p className="text-xs text-[var(--c-text)]/60 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function LinkCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="
        flex flex-col gap-2 rounded-xl border border-[var(--c-bank)]/20
        p-4 bg-[var(--c-primary)]/5 hover:bg-[var(--c-accent)]/10
        text-[var(--c-text)] hover:shadow-md hover:-translate-y-0.5
        transition-all duration-200
      "
    >
      <div className="flex items-center gap-2 text-[var(--c-accent)]">
        {icon}
        <h3 className="font-medium text-sm text-[var(--c-text)]">{title}</h3>
      </div>
      <p className="text-xs text-[var(--c-text)]/70 leading-snug">{desc}</p>
    </Link>
  )
}
