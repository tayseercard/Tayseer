'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { QrCode, X, ArrowLeft, Plus, Menu } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode';
import { Scanner } from '@yudiel/react-qr-scanner';
import DashboardHeader from '@/components/DashboardHeader'; // ✅ use your existing header

type StoreRow = {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  wilaya: number | null;
  created_at: string | null;
};

type VoucherRow = {
  id: string;
  code: string;
  buyer_name: string | null;
  buyer_phone?: string | null;
  initial_amount: number;
  balance: number;
  status: 'blank' | 'loaded' | 'redeemed' | 'expired' | 'void';
  expires_at: string | null;
  activated_at?: string | null;
  created_at: string;
};

export default function AdminStoreDetailPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { id: storeId } = useParams<{ id: string }>();

  const [store, setStore] = useState<StoreRow | null>(null);
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [q, setQ] = useState('');

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherRow | null>(null);
  const [showFabActions, setShowFabActions] = useState(false);

  // Modal state
  const [adding, setAdding] = useState(false);
  const [countToAdd, setCountToAdd] = useState(1);
  const [addingLoading, setAddingLoading] = useState(false);

  /* -------- Load store -------- */
  useEffect(() => {
    if (!storeId) return;
    (async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .maybeSingle();
      setLoadingStore(false);
      if (error || !data) {
        router.replace('/admin/stores');
        return;
      }
      setStore(data);
    })();
  }, [storeId]);

  /* -------- Load vouchers -------- */
  async function loadVouchers() {
    if (!storeId) return;
    setLoadingVouchers(true);
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    setLoadingVouchers(false);
    if (!error && data) setVouchers(data as VoucherRow[]);
  }

  useEffect(() => {
    loadVouchers();
  }, [storeId]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return vouchers;
    return vouchers.filter(
      (v) =>
        (v.code ?? '').toLowerCase().includes(t) ||
        (v.buyer_name ?? '').toLowerCase().includes(t)
    );
  }, [vouchers, q]);

  /* -------- Create blank vouchers -------- */
  async function createBlankVouchers() {
    if (!storeId || countToAdd < 1) return;
    setAddingLoading(true);

    const rows = Array.from({ length: countToAdd }).map(() => ({
      store_id: storeId,
      code: 'TSR-' + uuidv4().split('-')[0].toUpperCase(),
      status: 'blank',
      initial_amount: 0,
      balance: 0,
    }));

    const { error } = await supabase.from('vouchers').insert(rows);
    setAddingLoading(false);

    if (error) return alert('❌ Error: ' + error.message);
    alert(`✅ Created ${countToAdd} blank voucher(s)`);
    setAdding(false);
    setCountToAdd(1);
    loadVouchers();
  }

  /* -------- Render -------- */
  return (
    <div className="min-h-dvh bg-[var(--bg-light,#f9fafb)] text-gray-900">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
        {/* 🧱 Header */}
        <DashboardHeader
          title={store?.name || 'Store Details'}
          subtitle={store?.address || ''}
          icon={<ArrowLeft onClick={() => router.push('/admin/stores')} className="cursor-pointer text-gray-600 hover:text-black" />}
          actions={[
            {
              label: 'Add Voucher',
              onClick: () => setAdding(true),
              icon: <Plus className="h-4 w-4" />,
            },
            {
              label: 'Scan QR',
              onClick: () => {
                setScanError(null);
                setScanning(true);
              },
              icon: <QrCode className="h-4 w-4" />,
            },
          ]}
        />

        {/* 🔍 Search + Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search vouchers by code or buyer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="text-sm text-gray-600">
            {filtered.length} vouchers
          </div>
        </div>

        {/* 🧾 Voucher List */}
        <div className="rounded-2xl border bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden">
          {loadingVouchers ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              Loading vouchers…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              No vouchers found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Buyer</Th>
                  <Th>Code</Th>
                  <Th>Status</Th>
                  <Th>Initial</Th>
                  <Th>Balance</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVoucher(v)}
                    className="border-t cursor-pointer hover:bg-gray-50 transition"
                  >
                    <Td>{v.buyer_name ?? '—'}</Td>
                    <Td>
                      <code className="rounded bg-gray-100 px-1.5 py-0.5">
                        {v.code}
                      </code>
                    </Td>
                    <Td>
                      <StatusPill status={v.status} />
                    </Td>
                    <Td>{fmtDZD(v.initial_amount)}</Td>
                    <Td>{fmtDZD(v.balance)}</Td>
                    <Td>{new Date(v.created_at).toLocaleDateString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* --- Helpers --- */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}
function StatusPill({ status }: { status: VoucherRow['status'] }) {
  const map: Record<string, string> = {
    loaded: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    redeemed: 'bg-blue-50 text-blue-700 ring-blue-200',
    expired: 'bg-amber-50 text-amber-700 ring-amber-200',
    void: 'bg-rose-50 text-rose-700 ring-rose-200',
    blank: 'bg-gray-50 text-gray-700 ring-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${map[status] ?? map.blank}`}
    >
      {status}
    </span>
  );
}
function fmtDZD(n: number) {
  try {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} DZD`;
  }
}
