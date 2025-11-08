'use client'

import DashboardHeader from '@/components/DashboardHeader'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store as StoreIcon, Gift, TrendingUp } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useLanguage } from '@/lib/useLanguage'

export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)

  const [stores, setStores] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [storeStats, setStoreStats] = useState({ total: 0, open: 0, closed: 0 })
  const [voucherStats, setVoucherStats] = useState({ total: 0, active: 0, redeemed: 0 })
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

      // 📊 Top stores by active vouchers
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

  /* ---------- UI ---------- */
  return (
    <div
      className="relative flex flex-col bg-[var(--bg)] text-[var(--c-text)]
                 px-4 py-6 sm:px-6 lg:px-10 min-h-[calc(100vh-70px)] md:min-h-screen overflow-y-auto"
    >
      {/* === HEADER === */}
      <DashboardHeader
        user={{
          name: 'Djamil',
          email: 'admin@tayseer.app',
          role: 'Admin',
          avatarUrl: '/icon-192-2.png',
        }}
      />

      {/* === SUMMARY STATS === */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title={t.stores}
          value={storeStats.total}
          subtitle={t.totalRegistered}
        />
        <DashboardStatCard
          title={t.vouchers}
          value={voucherStats.total}
          subtitle={t.allVouchers}
        />
        <DashboardStatCard
          title={t.active}
          value={voucherStats.active}
          subtitle={t.currentlyActive}
          highlight
        />
        <DashboardStatCard
          title={t.redeemed}
          value={voucherStats.redeemed}
          subtitle={t.usedVouchers}
        />
      </div>

      {/* === DASHBOARD CARDS === */}
      {!loading && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
          {/* Latest Stores */}
          <DashboardCard
            title={t.latestStores}
            icon={<StoreIcon className="h-5 w-5 text-[var(--c-bank)]" />}
            link="/admin/stores"
          >
            {stores.length === 0 ? (
              <p className="text-sm text-[var(--c-text)]/50">{t.noStores}</p>
            ) : (
              <ul className="space-y-3">
                {stores.slice(0, 5).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border-b border-[var(--c-secondary)]/10 pb-2 text-sm"
                  >
                    <span className="truncate font-medium text-[var(--c-primary)]">
                      {s.name}
                    </span>
                    <span className="text-xs text-[var(--c-text)]/60">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          {/* Recent Vouchers */}
          <DashboardCard
            title={t.recentVouchers}
            icon={<Gift className="h-5 w-5 text-[var(--c-accent)]" />}
            link="/admin/vouchers"
          >
            {vouchers.length === 0 ? (
              <p className="text-sm text-[var(--c-text)]/50">{t.noVouchers}</p>
            ) : (
              <ul className="space-y-3">
                {vouchers.slice(0, 5).map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between border-b border-[var(--c-secondary)]/10 pb-2 text-sm"
                  >
                    <span className="truncate font-medium text-[var(--c-primary)]">
                      {v.code || '—'}
                      <span className="text-[var(--c-text)]/60 text-xs ml-1">
                        ({v.status})
                      </span>
                    </span>
                    <span className="text-xs text-[var(--c-text)]/60">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          {/* Top Stores */}
          <DashboardCard
            title={t.topStores}
            icon={<TrendingUp className="h-5 w-5 text-[var(--c-secondary)]" />}
          >
            {topStores.length === 0 ? (
              <p className="text-sm text-[var(--c-text)]/50">{t.noActiveVouchers}</p>
            ) : (
              <ul className="space-y-3">
                {topStores.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border-b border-[var(--c-secondary)]/10 pb-2 text-sm"
                  >
                    <span className="truncate font-medium text-[var(--c-primary)]">
                      {s.name}
                    </span>
                    <span className="text-xs text-[var(--c-accent)] font-semibold">
                      {s.activeCount} {t.active}
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

function DashboardStatCard({
  title,
  value,
  subtitle,
  highlight = false,
}: {
  title: string
  value: number
  subtitle?: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[var(--c-secondary)]/10 bg-white shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-all">
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
    const { t } = useLanguage() // ✅ Add this

  return (
    <div className="rounded-xl border border-[var(--c-secondary)]/10 bg-white shadow-sm hover:shadow-md transition-all p-4 flex flex-col overflow-hidden min-h-[220px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="flex items-center gap-2 font-semibold text-[var(--c-primary)] text-sm">
          {icon}
          {title}
        </h3>
        {link && (
          <Link href={link} className="text-xs text-[var(--c-accent)] hover:underline">
             {t.viewAll} 
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto md:overflow-visible pr-1">{children}</div>
    </div>
  )
}
