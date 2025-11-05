'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Store as StoreIcon,
  Gift,
  QrCode,
  TrendingUp,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic'; // ✅ Prevents prerender error (SSR-safe)

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [storeStats, setStoreStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    online: 0,
    offline: 0,
  });
  const [voucherStats, setVoucherStats] = useState({
    total: 0,
    active: 0,
    redeemed: 0,
    empty: 0,
  });

  // ✅ Safe refresh (works on both SSR + client)
  function handleRefresh() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  /* ---------- Load Data ---------- */
  useEffect(() => {
    (async () => {
      setLoading(true);

      const [{ data: storesData }, { data: vouchersData }] = await Promise.all([
        supabase.from('stores').select('*'),
        supabase.from('vouchers').select('*'),
      ]);

      if (storesData) {
        setStores(storesData);
        setStoreStats({
          total: storesData.length,
          open: storesData.filter((s) => s.status === 'open').length,
          closed: storesData.filter((s) => s.status === 'closed').length,
          online: storesData.filter((s) => s.type === 'online').length,
          offline: storesData.filter((s) => s.type === 'offline').length,
        });
      }

      if (vouchersData) {
        setVouchers(vouchersData);
        setVoucherStats({
          total: vouchersData.length,
          active: vouchersData.filter((v) => v.status === 'active').length,
          redeemed: vouchersData.filter((v) => v.status === 'redeemed').length,
          empty: vouchersData.filter(
            (v) => v.status === 'blank' || v.status === 'precreated'
          ).length,
        });
      }

      setLoading(false);
    })();
  }, [supabase]);

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-gray-900 px-4 py-8 sm:px-6 lg:px-10 space-y-10">
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
          <p className="text-gray-500 text-sm">Overview of stores and vouchers</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 text-sm rounded-md border px-3 py-2 hover:bg-gray-100 transition"
        >
          <RefreshCw className="h-4 w-4 text-gray-600" /> Refresh
        </button>
      </motion.header>

      {/* QUICK ACTIONS */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <SectionTitle
          icon={<QrCode className="h-5 w-5 text-purple-600" />}
          title="Quick Actions"
        />
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LinkCard
            href="/admin/stores"
            icon={<StoreIcon className="h-6 w-6 text-emerald-600" />}
            title="Manage Stores"
            desc="Add, edit, or view your stores."
            gradient="from-emerald-50 to-emerald-100"
          />
          <LinkCard
            href="/admin/vouchers"
            icon={<Gift className="h-6 w-6 text-pink-500" />}
            title="Manage Vouchers"
            desc="Activate or redeem vouchers."
            gradient="from-pink-50 to-pink-100"
          />
         
          <LinkCard
            href="/admin/settings"
            icon={<Settings className="h-6 w-6 text-gray-600" />}
            title="Settings"
            desc="Manage account & configuration."
            gradient="from-gray-50 to-gray-100"
          />
        </div>
      </motion.section>

      {/* DASHBOARD STATS */}
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
            className="space-y-10"
          >
            {/* Overview SECTION */}
            <SectionTitle
              icon={<StoreIcon className="h-5 w-5 text-emerald-600" />}
              title="Overview"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard title="Total Stores" value={storeStats.total} color="emerald" />
             <StatCard title="Total Vouchers" value={voucherStats.total} color="indigo" />
             <StatCard title="Active" value={voucherStats.active} color="emerald" />
              <StatCard title="Redeemed" value={voucherStats.redeemed} color="rose" />
              
             


            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-lg font-semibold mb-3 flex items-center gap-2"
    >
      {icon}
      {title}
    </motion.h2>
  );
}

function StatCard({
  title,
  value,
  suffix,
  color,
}: {
  title: string;
  value: number;
  suffix?: string;
  color?: string;
}) {
  const gradients: any = {
    emerald: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
    indigo: 'from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200',
    rose: 'from-rose-50 to-rose-100 text-rose-700 border-rose-200',
    amber: 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
    purple: 'from-purple-50 to-purple-100 text-purple-700 border-purple-200',
    cyan: 'from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200',
    gray: 'from-gray-50 to-gray-100 text-gray-700 border-gray-200',
    sky: 'from-sky-50 to-sky-100 text-sky-700 border-sky-200',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`rounded-xl bg-gradient-to-br ${gradients[color || 'gray']} border shadow-sm p-4 flex flex-col items-start justify-center`}
    >
      <p className="text-[11px] uppercase font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">
        <CountUp end={value} duration={1.2} separator="," />
        {suffix && <span className="text-sm ml-0.5">{suffix}</span>}
      </p>
    </motion.div>
  );
}

function LinkCard({
  href,
  icon,
  title,
  desc,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 rounded-xl border p-4 bg-gradient-to-br ${gradient} hover:shadow-lg hover:-translate-y-1 transition`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <p className="text-xs text-gray-600 leading-snug">{desc}</p>
    </Link>
  );
}
