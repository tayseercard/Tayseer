'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import { Scanner } from '@yudiel/react-qr-scanner';
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode';
import {
  Gift,
  QrCode,
  Plus,
  Menu,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { Stat } from '@/components/ui/stat';

export default function SuperadminVouchersPage() {
  const supabase = createClientComponentClient();

  const [rows, setRows] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showFabActions, setShowFabActions] = useState(false);
  const [q, setQ] = useState('');
  const [selectedStore, setSelectedStore] = useState<'all' | string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | string>('all');

  /* -------- Load data -------- */
  async function loadData() {
    setLoading(true);
    try {
      const [vouchersRes, storesRes] = await Promise.all([
        fetch('/api/superadmin/list-vouchers'),
        supabase.from('stores').select('id, name'),
      ]);
      const { vouchers, error } = await vouchersRes.json();
      if (error) throw new Error(error);
      setRows(vouchers || []);
      setStores(storesRes.data || []);
    } catch (err) {
      console.error('❌ Error loading vouchers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* -------- Filters -------- */
  const filtered = useMemo(() => {
    let data = rows;
    if (selectedStore !== 'all') data = data.filter((v) => v.store_id === selectedStore);
    if (selectedStatus !== 'all') data = data.filter((v) => v.status === selectedStatus);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      data = data.filter(
        (v) =>
          v.code?.toLowerCase().includes(t) ||
          v.buyer_name?.toLowerCase().includes(t)
      );
    }
    return data;
  }, [rows, q, selectedStore, selectedStatus]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((v) => v.status === 'active').length;
    const redeemed = rows.filter((v) => v.status === 'redeemed').length;
    const blank = rows.filter((v) => v.status === 'blank').length;
    return { total, active, redeemed, blank };
  }, [rows]);

  const getStoreName = (id: string) => stores.find((s) => s.id === id)?.name ?? '—';

  /* -------- QR Scan -------- */
  async function handleScan(result: string | null) {
    if (!result) return;
    setScanError(null);
    setScanning(false);

    try {
      const code = result.includes('/') ? result.split('/').pop()! : result.trim();
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error || !data) {
        setScanError('Voucher not found.');
        return;
      }
      setSelectedVoucher(data);
    } catch (e: any) {
      setScanError(e.message || 'Error scanning QR.');
    }
  }

  /* -------- UI -------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-semibold">All Vouchers</h1>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat title="Total" value={stats.total.toLocaleString()} />
        <Stat title="Active" value={stats.active.toLocaleString()} />
        <Stat title="Redeemed" value={stats.redeemed.toLocaleString()} />
        <Stat title="Blank" value={stats.blank.toLocaleString()} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm p-3">
        <div className="flex flex-1 items-center gap-2 border rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by code or buyer..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700"
        >
          <option value="all">All stores</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-gray-700"
        >
          <option value="all">All statuses</option>
          <option value="blank">Blank</option>
          <option value="active">Active</option>
          <option value="redeemed">Redeemed</option>
          <option value="expired">Expired</option>
          <option value="void">Void</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading vouchers...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400">No vouchers found.</div>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <Th>Buyer</Th>
                <Th>Store</Th>
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
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <Td>{v.buyer_name ?? '—'}</Td>
                  <Td>{getStoreName(v.store_id)}</Td>
                  <Td><code className="rounded bg-gray-100 px-1.5 py-0.5">{v.code}</code></Td>
                  <Td><StatusPill status={v.status} /></Td>
                  <Td>{fmtDZD(v.initial_amount)}</Td>
                  <Td>{fmtDZD(v.balance)}</Td>
                  <Td>{new Date(v.created_at).toLocaleDateString()}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- Helpers ---------- */
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    redeemed: 'bg-blue-50 text-blue-700 ring-blue-200',
    expired: 'bg-amber-50 text-amber-700 ring-amber-200',
    void: 'bg-rose-50 text-rose-700 ring-rose-200',
    blank: 'bg-gray-50 text-gray-700 ring-gray-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${map[status] ?? map.blank}`}>
      {status}
    </span>
  );
}
function fmtDZD(n: number) {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(n);
}
