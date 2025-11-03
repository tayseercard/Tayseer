'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Store as StoreIcon,
  Gift,
  QrCode,
  TrendingUp,
  Settings,
  RefreshCw,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SuperadminDashboardPage() {
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);

  const [storeStats, setStoreStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
  });

  const [voucherStats, setVoucherStats] = useState({
    total: 0,
    active: 0,
    redeemed: 0,
  });

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
        });
      }

      if (vouchersData) {
        setVouchers(vouchersData);
        setVoucherStats({
          total: vouchersData.length,
          active: vouchersData.filter((v) => v.status === 'active').length,
          redeemed: vouchersData.filter((v) => v.status === 'redeemed').length,
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
            <QrCode className="h-6 w-6 text-emerald-600" />
            Superadmin Dashboard
          </h1>
          <p className="text-gray-500 text-sm">Global control center for Tayseer</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-sm rounded-md border px-3 py-2 hover:bg-gray-100 transition"
        >
          <RefreshCw className="h-4 w-4 text-gray-600" /> Refresh
        </button>
      </motion.header>

      {/* 🟩 QUICK ACTIONS — now on top */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <QuickActionCard
          href="/superadmin/stores"
          icon={<StoreIcon className="h-6 w-6 text-emerald-600" />}
          title="Manage Stores"
          desc="View & edit all stores"
          color="emerald"
        />
        <QuickActionCard
          href="/superadmin/vouchers"
          icon={<Gift className="h-6 w-6 text-pink-500" />}
          title="Manage Vouchers"
          desc="Track and manage all vouchers"
          color="pink"
        />
        <QuickActionCard
          href="/superadmin/users"
          icon={<Users className="h-6 w-6 text-indigo-500" />}
          title="Users"
          desc="Admins and store owners"
          color="indigo"
        />
        <QuickActionCard
          href="/superadmin/settings"
          icon={<Settings className="h-6 w-6 text-gray-600" />}
          title="Platform Settings"
          desc="Manage global configuration"
          color="gray"
        />
      </motion.div>

      {/* DASHBOARD STATS (same as admin) */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm animate-pulse">
          Loading dashboard data…
        </div>
      ) : (
        <>
          <SectionTitle
            icon={<StoreIcon className="h-5 w-5 text-emerald-600" />}
            title="Store Overview"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard title="Total" value={storeStats.total} color="emerald" />
            <StatCard title="Open" value={storeStats.open} color="sky" />
            <StatCard title="Closed" value={storeStats.closed} color="rose" />
          </div>

          <SectionTitle
            icon={<Gift className="h-5 w-5 text-indigo-600" />}
            title="Voucher Overview"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard title="Total" value={voucherStats.total} color="indigo" />
            <StatCard title="Active" value={voucherStats.active} color="emerald" />
            <StatCard title="Redeemed" value={voucherStats.redeemed} color="rose" />
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function QuickActionCard({
  href,
  icon,
  title,
  desc,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color?: string;
}) {
  const bg: any = {
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200',
    pink: 'from-pink-50 to-pink-100 border-pink-200',
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200',
    gray: 'from-gray-50 to-gray-100 border-gray-200',
  };
  return (
    <Link
      href={href}
      className={`flex flex-col items-start justify-center gap-2 border rounded-xl bg-gradient-to-br ${bg[color || 'gray']} p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition`}
    >
      <div className="flex items-center gap-2">{icon}<h3 className="font-medium">{title}</h3></div>
      <p className="text-xs text-gray-600">{desc}</p>
    </Link>
  );
}

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
