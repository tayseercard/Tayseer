'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StoreHeader from '@/components/store/StoreHeader'
import { useLanguage } from '@/lib/useLanguage'
import { useRouter } from "next/navigation"

import {
  Gift,
  Users,
  CreditCard,
  ArrowRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import NotificationBell from '@/components/NotificationBell'
import NotificationModal from '@/components/NotificationModal'

export default function StoreDashboardPage() {
  const { t } = useLanguage()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const router = useRouter()
  const [store, setStore] = useState<{ name: string; email: string; role: string; logoUrl?: string } | null>(null)
  const [voucherStats, setVoucherStats] = useState({
    total: 0,
    active: 0,
    redeemed: 0,
    blank:0,
    totalValue: 0,
    redeemedValue: 0,
  })
  const [clientStats, setClientStats] = useState({
    totalClients: 0,
  })

const [latestRequests, setLatestRequests] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const { data: storeRow } = await supabase
        .from('stores')
        .select('name, email, logo_url')
        .eq('owner_user_id', user.id)
        .maybeSingle()

      setStore({
        name: storeRow?.name || 'Store',
        email: storeRow?.email || user.email || '',
        role: 'Store Owner',
        logoUrl: storeRow?.logo_url || '/icon-192.png',
      })

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
      // Fetch latest 5 requests
    const { data } = await supabase
      .from("voucher_requests")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(5)

    setLatestRequests(data || [])
  

      const { data: vouchersData } = await supabase
        .from('vouchers')
        .select('*')
        .eq('store_id', storeId)

      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('store_id', storeId)

      if (vouchersData) {
        setVoucherStats({
          total: vouchersData.length,
          active: vouchersData.filter((v) => v.status === 'active').length,
          redeemed: vouchersData.filter((v) => v.status === 'redeemed').length,
          blank: vouchersData.filter((v) => v.status === 'blank').length,
          totalValue: vouchersData.reduce((sum, v) => sum + (v.initial_amount || 0), 0),
          redeemedValue: vouchersData
            .filter((v) => v.status === 'redeemed')
            .reduce((sum, v) => sum + (v.initial_amount || 0), 0),
        })
      }

      if (clientsData) {
        setClientStats({ totalClients: clientsData.length })
      }

      setLoading(false)
    })()
  }, [supabase])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--c-text)] px-4 sm:px-6 md:px-10 py-8 space-y-8">
      <StoreHeader
   rightContent={
          <NotificationBell onOpen={() => setNotifOpen(true)} />
        }
              store={store || { name: 'Loading…', email: '', role: '', logoUrl: '' }} />


        <NotificationModal
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
         
        />
      {loading ? (
        <div className="py-20 text-center text-[var(--c-text)]/50 text-sm animate-pulse">
          {t.loadingDashboard}
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
          <div>
            <SectionTitle
              icon={<Gift />}
              title={t.voucherOverview}
              href="/store/vouchers"
            />

            {/* ONE ROW ALWAYS — SCROLLABLE */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">

              {/* Total vouchers */}
              <Link
                href="/store/vouchers"
                className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl"
              >
                <DashboardStatCard title={t.total} value={voucherStats.total} />
              </Link>

              {/* Active vouchers */}
              <Link
                href="/store/vouchers?status=active"
                className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl"
              >
                <DashboardStatCard
                  title={t.active}
                  value={voucherStats.active}
                  highlight
                />
              </Link>

              {/* Redeemed vouchers */}
              <Link
                href="/store/vouchers?status=redeemed"
                className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl"
              >
                <DashboardStatCard title={t.redeemed} value={voucherStats.redeemed} />
              </Link>
               {/* blank vouchers */}
              <Link
                href="/store/vouchers?status=blank"
                className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl"
              >
                <DashboardStatCard title={t.blank} value={voucherStats.blank} />
              </Link>
            </div>
          </div>



            {/* === Financial Summary === */}
            <SectionTitle icon={<CreditCard />} title={t.financialSummary} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <DashboardStatCard title={t.totalValue} value={voucherStats.totalValue} suffix=" DA" />
              <DashboardStatCard title={t.redeemedValue} value={voucherStats.redeemedValue} suffix=" DA" />
            </div>


            <div>
{/* Latest Requests */}
              <div>
                 {/* Total vouchers */}
                  <SectionTitle
              icon={<Gift />}
              title='Latest requests'
              href="/store/requests"
            />
              <Link
                href="/store/requests"
                className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl"
              >
            <DashboardRequestCard latestRequests={latestRequests}  />
              </Link>
           
             </div>

            </div>
              
            {/* === Clients === */}
            <SectionTitle icon={<Users />} 
            title={t.clientOverview} href="/store/clients" />
            {/* Total vouchers */}
              <Link
                href="/store/clients"
                className="min-w-[140px] block transition hover:-translate-y-0.5 hover:shadow-md rounded-2xl"
              >
              <DashboardStatCard title={t.totalClients} value={clientStats.totalClients} />
              </Link>

              


            
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

/* ---------- Subcomponents ---------- */
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
    <div className="rounded-2xl border border-[var(--c-secondary)]/10 bg-white shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-all">
      <p className="text-sm text-[var(--c-text)]/70">{title}</p>
      <p className={`text-2xl font-semibold ${highlight ? 'text-[var(--c-accent)]' : 'text-[var(--c-bank)]'}`}>
        {value.toLocaleString()}
        {suffix && <span className="text-sm ml-0.5 text-[var(--c-text)]/70">{suffix}</span>}
      </p>
      {subtitle && <p className="text-xs text-[var(--c-text)]/60 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function DashboardRequestCard({
  latestRequests,
}: {
  latestRequests: any[]
}) {
  return (
    <div className="rounded-2xl border border-[var(--c-secondary)]/10 bg-white shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-all">
      {/* Body */}
      {latestRequests.length === 0 ? (
        <p className="text-sm text-[var(--c-text)]/50">
          Aucune demande trouvée.
        </p>
      ) : (
        <ul className="space-y-3">
          {latestRequests.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between border-b border-[var(--c-secondary)]/10 pb-2 text-sm"
            >
              <div>
                <p className="font-medium text-[var(--c-primary)]">
                  {r.count} voucher(s)
                </p>
                <p className="text-xs text-[var(--c-text)]/60">{r.status}</p>
              </div>

              <span className="text-xs text-[var(--c-text)]/60">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

