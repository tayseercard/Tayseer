'use client'

import DashboardHeader from '@/components/DashboardHeader'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store as StoreIcon, Gift, TrendingUp, ListChecks } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useLanguage } from '@/lib/useLanguage'
import { motion } from 'framer-motion'
import NotificationBell from '@/components/NotificationBell'
import NotificationModal from '@/components/NotificationModal'


export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
const [userRole, setUserRole] = useState<string | null>(null)
  const [stores, setStores] = useState<any[]>([])
  const [vouchers, setVouchers] = useState<any[]>([])
  const [storeStats, setStoreStats] = useState({ total: 0, open: 0, closed: 0 })
  const [voucherStats, setVoucherStats] = useState({ total: 0, active: 0, redeemed: 0 })
  const [topStores, setTopStores] = useState<any[]>([])
/* -------- Load Latest Voucher Requests -------- */
const [latestRequests, setLatestRequests] = useState<any[]>([])
const [notifOpen, setNotifOpen] = useState(false)

useEffect(() => {
  ;(async () => {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase
      .from('voucher_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error) setLatestRequests(data || [])
  })()
}, [])

  useEffect(() => {
  async function fetchRole() {
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    let role = session?.user?.user_metadata?.role ?? null

    // fallback: get from view if not in metadata
    if (!role && session?.user?.id) {
      const { data: roleData } = await supabase
        .from('me_effective_role')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()
      role = roleData?.role ?? null
    }

    console.log('🧩 Effective role:', role)
    setUserRole(role)
  }

  fetchRole()
}, [supabase])

  /* ---------- Load Data ---------- */
  useEffect(() => {
    ;(async () => {
      setLoading(true)

    

      // 🧩 Get current user role
const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
if (sessionError) console.error('❌ Error fetching session:', sessionError)

const role = sessionData?.session?.user?.user_metadata?.role || null
setUserRole(role)
console.log('🧠 Current user role:', role)


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
rightContent={
    <NotificationBell onOpen={() => setNotifOpen(true)} />
  }        user={{
          name: "Tayseer Admin",
          email: "admin@tayseer.app",
          role: "Admin",
          avatarUrl: "/icon-192-2.png"
        }}
      />
{notifOpen && (
  <NotificationModal onClose={() => setNotifOpen(false)} open={false} />
)}

      {/* === SUMMARY STATS === */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
       
        <Link href="/admin/stores"  className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl">
                <DashboardStatCard
                title={t.stores}
                value={storeStats.total}
                subtitle={t.totalRegistered}
                /> 
        </Link>

        <Link href="/admin/vouchers" className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl">  
              <DashboardStatCard
                title={t.vouchers}
                value={voucherStats.total}
                subtitle={t.allVouchers}
              /> 
        </Link>

        <Link href="/admin/vouchers?status=active" className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl">
              <DashboardStatCard
                title={t.active}
                value={voucherStats.active}
                subtitle={'active Vouchers'}
                />
        </Link>

        <Link href="/admin/vouchers?status=redeemed" className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl">

        <DashboardStatCard
          title={t.redeemed}
          value={voucherStats.redeemed}
          subtitle={t.usedVouchers}
        />
        </Link>
      </div>
      {userRole && (
  <div className="mt-2 text-xs text-gray-500">
    🧩 Current role: <b>{userRole}</b>
  </div>
)}


      {/* === DASHBOARD CARDS === */}
      {!loading && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">

          {/* Recent Voucher Requests */}
<DashboardCard
  title="Recent Voucher Requests"
  icon={<ListChecks className="h-5 w-5 text-[var(--c-accent)]" />}
  link="/admin/voucher-requests"
>
  {latestRequests.length === 0 ? (
    <p className="text-sm text-[var(--c-text)]/50">No requests yet.</p>
  ) : (
    <ul className="space-y-3">
      {latestRequests.map((req) => (
        <li
          key={req.id}
          className="flex items-center justify-between border-b border-[var(--c-secondary)]/10 pb-2 text-sm"
        >
          <div className="flex flex-col">
            <span className="font-medium text-[var(--c-primary)]">
              {req.store_name}
            </span>

            <span className="text-xs text-[var(--c-text)]/60">
              {req.count} vouchers • {req.status}
            </span>
          </div>

          <span className="text-xs text-[var(--c-text)]/60 whitespace-nowrap">
            {new Date(req.created_at).toLocaleDateString()}
          </span>
        </li>
      ))}
    </ul>
  )}
</DashboardCard>
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

function SectionTitle({ icon, title, href }: { icon: React.ReactNode; title: string; href?: string }) {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-3"
    >
      <div className="flex items-center gap-2 text-[var(--c-primary)]">
        <div className="p-1 rounded-md bg-[var(--c-accent)]/15 text-[var(--c-accent)]">{icon}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-[var(--c-accent)] hover:text-[var(--c-accent)]/80 transition-all group"
        >
          <span>{t.seeAll}</span>
        </Link>
      )}
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
