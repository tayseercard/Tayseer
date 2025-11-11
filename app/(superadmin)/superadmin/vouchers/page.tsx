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

  /* -------- Load Data -------- */
 /* -------- Load Data -------- */
async function loadData() {
  setLoading(true);

  const params = new URLSearchParams();
  if (selectedStore !== "all") params.set("store_id", selectedStore);
  if (selectedStatus !== "all") params.set("status", selectedStatus);
  if (q.trim()) params.set("q", q.trim());
  const query = params.toString() ? `?${params}` : "";

  const [vouchersRes, storesRes] = await Promise.all([
    fetch(`/api/superadmin/vouchers${query}`),
    supabase.from("stores").select("id, name"),
  ]);

  const { vouchers } = await vouchersRes.json();

  // ✅ Save both
  setRows(vouchers || []);
  setStores(storesRes.data || []); // <-- Added line
  setLoading(false);
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

  /* -------- Create Blank Vouchers -------- */
  async function createBlankVouchers() {
    if (!storeId || count < 1) return alert('Select store and count.');
    setAddingLoading(true);

    const rowsToInsert = Array.from({ length: count }).map(() => ({
      store_id: storeId,
      code: 'MKD-' + uuidv4().split('-')[0].toUpperCase(),
      status: 'blank',
      initial_amount: 0,
      balance: 0,
    }));

    const { error } = await supabase.from('vouchers').insert(rowsToInsert);
    setAddingLoading(false);

    if (error) return alert('❌ Error: ' + error.message);

    alert(`✅ Created ${count} blank voucher(s).`);
    setAdding(false);
    setStoreId(null);
    setCount(1);
    loadData();
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

      {/* Voucher Modal */}
      {selectedVoucher && (
        <VoucherModal
          voucher={selectedVoucher}
          supabase={supabase}
          onClose={() => setSelectedVoucher(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}

/* ---------- Voucher Modal ---------- */
function VoucherModal({ voucher, supabase, onClose, onRefresh }: any) {
  const [url, setUrl] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState(voucher.buyer_name ?? '');
  const [buyerPhone, setBuyerPhone] = useState(voucher.buyer_phone ?? '');
  const [amount, setAmount] = useState('');
  const [consumeAmount, setConsumeAmount] = useState('');

  useEffect(() => {
    voucherToDataUrl(voucher.code).then(setUrl);
  }, [voucher.code]);

  async function handleActivate() {
    if (!buyerName || !amount) return alert('Enter buyer name and amount');
    const { error } = await supabase
      .from('vouchers')
      .update({
        buyer_name: buyerName,
        buyer_phone: buyerPhone || null,
        initial_amount: Number(amount),
        balance: Number(amount),
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', voucher.id);
    if (error) return alert(error.message);
    alert('✅ Voucher activated');
    onRefresh();
    onClose();
  }

  async function handleConsume(partial = true) {
    const value = partial ? Number(consumeAmount) : voucher.balance;
    if (!value || value <= 0 || value > voucher.balance)
      return alert('Invalid amount');
    const newBalance = voucher.balance - value;
    const newStatus = newBalance <= 0 ? 'redeemed' : 'active';
    const { error } = await supabase
      .from('vouchers')
      .update({ balance: newBalance, status: newStatus })
      .eq('id', voucher.id);
    if (error) return alert(error.message);
    alert('✅ Consumption recorded');
    onRefresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold mb-3">Voucher Detailss</h2>

        <div className="flex flex-col items-center mb-4">
          {url ? (
            <img src={url} alt="QR" className="h-32 w-32 rounded border" />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded" />
          )}
          <a
            href={voucherDeepLink(voucher.code)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline mt-1 break-all"
          >
            {voucherDeepLink(voucher.code)}
          </a>
        </div>

        {voucher.status === 'blank' ? (
          <div className="space-y-3">
            <input
              placeholder="Buyer name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            />
            <input
              placeholder="Phone (optional)"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            />
            <input
              type="number"
              placeholder="Amount (DZD)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            />
            <button
              onClick={handleActivate}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Activate
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <Info label="Buyer" value={voucher.buyer_name ?? '—'} />
            <Info label="Phone" value={voucher.buyer_phone ?? '—'} />
            <Info label="Status" value={voucher.status} />
            <Info label="Balance" value={fmtDZD(voucher.balance)} />
            {voucher.status === 'active' && (
              <>
                <input
                  type="number"
                  placeholder="Consume amount (DZD)"
                  value={consumeAmount}
                  onChange={(e) => setConsumeAmount(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleConsume(true)}
                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    Consume Partial
                  </button>
                  <button
                    onClick={() => handleConsume(false)}
                    className="flex-1 rounded-md bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700"
                  >
                    Redeem All
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Small helpers ---------- */
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
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