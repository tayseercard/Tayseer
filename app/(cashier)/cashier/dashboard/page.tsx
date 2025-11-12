'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/useLanguage'
import {
  Gift,
  CreditCard,
  Users,
  ArrowRight,
  CheckCircle,
  QrCode,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function CashierDashboardPage() {
  const { t } = useLanguage()
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<{ name: string; store_id: string | null }>({
    name: '',
    store_id: null,
  })
  const [voucherStats, setVoucherStats] = useState({
    total: 0,
    active: 0,
    redeemed: 0,
    todayActivated: 0,
    totalValue: 0,
  })

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) return

      // 🧩 Get cashier’s store
      const { data: roleRow } = await supabase
        .from('me_effective_role')
        .select('store_id, store_name')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!roleRow?.store_id) {
        setLoading(false)
        return
      }

      setStore({ name: roleRow.store_name, store_id: roleRow.store_id })

      // 💳 Get vouchers for this store
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('*')
        .eq('store_id', roleRow.store_id)

      if (vouchers) {
        const today = new Date().toISOString().slice(0, 10)
        const todayActivated = vouchers.filter(
          (v) => v.activated_at?.slice(0, 10) === today
        ).length

        setVoucherStats({
          total: vouchers.length,
          active: vouchers.filter((v) => v.status === 'active').length,
          redeemed: vouchers.filter((v) => v.status === 'redeemed').length,
          todayActivated,
          totalValue: vouchers.reduce(
            (sum, v) => sum + (v.initial_amount || 0),
            0
          ),
        })
      }

      setLoading(false)
    })()
  }, [supabase])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--c-text)] px-4 sm:px-6 md:px-10 py-8 space-y-8">
      {/* ===== Header ===== */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-[var(--c-primary)]">
            Cashier Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            {store.name ? `Store: ${store.name}` : 'Loading store info...'}
          </p>
        </div>
      </header>

      {/* ===== Content ===== */}
      {loading ? (
        <div className="py-20 text-center text-[var(--c-text)]/50 text-sm flex justify-center items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading cashier dashboard…
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            key="cashier-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-10"
          >
            {/* === Voucher Overview === */}
            <SectionTitle
              icon={<Gift />}
              title="Voucher Overview"
              href="/cashier/vouchers"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Link href="/cashier/vouchers" className="block hover:scale-[1.02] transition">
                <DashboardStatCard title="Total Vouchers" value={voucherStats.total} />
              </Link>

              <DashboardStatCard
                title="Active Vouchers"
                value={voucherStats.active}
                highlight
              />

              <DashboardStatCard
                title="Redeemed"
                value={voucherStats.redeemed}
              />

              <DashboardStatCard
                title="Activated Today"
                value={voucherStats.todayActivated}
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
            </div>

            {/* === Quick Actions === */}
            <SectionTitle icon={<QrCode />} title="Quick Actions" />
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <LinkCard
                href="/cashier/vouchers"
                icon={<Gift className="h-4 w-4" />}
                title="Manage Vouchers"
                desc="Activate or redeem vouchers"
              />
              <LinkCard
                href="/cashier/settings"
                icon={<Users className="h-4 w-4" />}
                title="Profile Settings"
                desc="Edit your account or log out"
              />
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
          className="flex items-center gap-1 text-sm font-medium text-[var(--c-accent)] hover:text-[var(--c-accent)]/80 group"
        >
          <span>See all</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </motion.div>
  )
}

function DashboardStatCard({
  title,
  value,
  suffix,
  highlight = false,
}: {
  title: string
  value: number
  suffix?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col justify-between shadow-sm transition-all bg-white
        ${highlight ? 'border-[var(--c-accent)]/30 bg-[var(--c-accent)]/10' : 'border-gray-100'}`}
    >
      <p className="text-sm text-[var(--c-text)]/70">{title}</p>
      <p className="text-2xl font-semibold mt-1 text-[var(--c-secondary)]">
        <CountUp end={value || 0} duration={1.2} separator="," />
        {suffix && (
          <span className="text-sm ml-0.5 text-[var(--c-text)]/60">{suffix}</span>
        )}
      </p>
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
      className="flex flex-col gap-2 rounded-xl border border-[var(--c-bank)]/20 p-4 
                 bg-[var(--c-primary)]/5 hover:bg-[var(--c-accent)]/10 hover:shadow-md 
                 text-[var(--c-text)] transition-all duration-200"
    >
      <div className="flex items-center gap-2 text-[var(--c-accent)]">
        {icon}
        <h3 className="font-medium text-sm text-[var(--c-text)]">{title}</h3>
      </div>
      <p className="text-xs text-[var(--c-text)]/70 leading-snug">{desc}</p>
    </Link>
  )
}
