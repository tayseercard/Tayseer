'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Menu, Plus, QrCode, X } from 'lucide-react';
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode';

import { Scanner } from '@yudiel/react-qr-scanner'; // ✅ modern QR scanner

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
  recipient_name: string | null;
  buyer_phone?: string | null;
  initial_amount: number;
  balance: number;
  status: 'blank' | 'active' | 'redeemed' | 'expired' | 'void';
  expires_at: string | null;
  activated_at?: string | null;
  created_at: string;
};

export default function StoreDashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [q, setQ] = useState('');
    const [showFabActions, setShowFabActions] = useState(false);

    


  // 🔍 Modal & scanning states
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherRow | null>(null);
  const [loadingVoucherDetail, setLoadingVoucherDetail] = useState(false);

  /* ========== Load stores ========== */
  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        router.replace('/store/');
        return;
      }

      setLoadingStores(true);
      const { data: own } = await supabase
        .from('stores')
        .select('id, name, address, phone, email, wilaya, created_at')
        .eq('owner_user_id', session.session.user.id);

      const { data: member } = await supabase
        .from('store_users')
        .select('store_id, stores!inner(id, name, address, phone, email, wilaya, created_at)')
        .eq('user_id', session.session.user.id);

      const fromMembership = (member ?? []).map((m: any) => m.stores) as StoreRow[];
      const unique = new Map<string, StoreRow>();
      (own ?? []).forEach((s) => unique.set(s.id, s as StoreRow));
      fromMembership.forEach((s) => unique.set(s.id, s as StoreRow));

      const list = Array.from(unique.values()).sort((a, b) =>
        (a.name ?? '').localeCompare(b.name ?? '')
      );

      setStores(list);
      setLoadingStores(false);
      if (list.length > 0) setStoreId(list[0].id);
      else router.replace('/store/');
    })();
  }, [router, supabase]);

  /* ========== Load vouchers ========== */
  async function loadVouchers(id: string) {
    setLoadingVouchers(true);
    const { data, error } = await supabase
      .from('vouchers')
      .select(
        'id, code, buyer_name,recipient_name, buyer_phone, initial_amount, balance, status, expires_at, activated_at, created_at'
      )
      .eq('store_id', id)
      .order('created_at', { ascending: false })
      .limit(300);
    setLoadingVouchers(false);
    if (!error && Array.isArray(data)) setVouchers(data as VoucherRow[]);
  }

  useEffect(() => {
    if (storeId) loadVouchers(storeId);
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

  /* ========== Handle Scan ========== */
  async function handleScan(result: string | null) {
    if (!result) return;
    setScanning(false);
    setScanError(null);

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
      setScanError(e.message || 'Error reading QR.');
    }
  }

  /* ========== Manual click open ========== */
  async function openVoucher(v: VoucherRow) {
    setLoadingVoucherDetail(true);
    const { data } = await supabase.from('vouchers').select('*').eq('id', v.id).maybeSingle();
    setLoadingVoucherDetail(false);
    if (data) setSelectedVoucher(data);
  }

  return (
  <div className="min-h-dvh bg-gray-50 text-black">
    <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={() => router.push('/admin/stores')}
          className="inline-flex items-center gap-1 text-gray-600 hover:text-black text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

{/* 🟢 Floating Action Button (FAB) */}
<div className="fixed bottom-5 right-5 z-50">
  <button
    onClick={() => setShowFabActions((prev) => !prev)}
    className="rounded-full bg-emerald-600 p-4 text-white shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition"
  >
    <Menu className="h-6 w-6" />
  </button>

  {showFabActions && (
    <div className="absolute bottom-16 right-0 flex flex-col gap-2 animate-fade-in">
     

      <button
        onClick={() => {
          setShowFabActions(false);
          setScanError(null);
          setScanning(true);
        }}
        className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition"
      >
        <QrCode className="h-4 w-4" /> Scan QR
      </button>
    </div>
  )}
</div>


      </div>

      

      {/* Search Bar */}
      <div className="flex items-center gap-2 sticky top-0 bg-gray-50/90 backdrop-blur-sm py-1 z-30">
        <input
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          placeholder="Search vouchers by code or buyer…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Vouchers Section */}
      {loadingVouchers ? (
        <div className="py-8 text-center text-gray-500 text-sm">
          Loading vouchers…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">
          No vouchers found.
        </div>
      ) : (
        <>
          {/* 🧱 Table (desktop) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Buyer</Th>
                  <th>Recipient</th>
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
                    onClick={() => openVoucher(v)}
                    className="border-t cursor-pointer hover:bg-gray-50 transition"
                  >
                    <Td>{v.buyer_name ?? '—'}</Td>
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

          {/* 🧩 Cards (mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {filtered.map((v) => (
              <div
                key={v.id}
                onClick={() => openVoucher(v)}
                className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {v.buyer_name || '—'}
                  </h3>
                  <StatusPill status={v.status} />
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  Code: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                    {v.code}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  Balance: {fmtDZD(v.balance)} / Init: {fmtDZD(v.initial_amount)}
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(v.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

  

      {/* ✅ Scanner Modal */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl p-4 w-[95%] max-w-md shadow-lg">
            <button
              onClick={() => setScanning(false)}
              className="absolute right-2 top-2 text-gray-500 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-center font-medium mb-2">Scan a voucher QR</h2>

            <Scanner
              onScan={(results) => handleScan(results[0]?.rawValue || null)}
              onError={(err) => console.error(err)}
              constraints={{ facingMode: 'environment' }}
            />

            {scanError && (
              <p className="mt-3 text-center text-sm text-rose-600">{scanError}</p>
            )}
          </div>
        </div>
      )}

      {/* Voucher Modal */}
           {selectedVoucher && (
             <VoucherModal
               voucher={selectedVoucher}
               supabase={supabase}
               onClose={() => setSelectedVoucher(null)}
             />
           )}
     
           
    </div>
  </div>
);
}

/* ---------- Helpers ---------- */


/* --- Voucher Modal --- */
function VoucherModal({ voucher, supabase, onClose, onRefresh }: any) {
  const [url, setUrl] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState(voucher.buyer_name ?? '');
  const [recipientName, setRecipientName] = useState(voucher.recipient_name ?? '');
  const [buyerPhone, setBuyerPhone] = useState(voucher.buyer_phone ?? '');
  const [amount, setAmount] = useState(
    voucher.initial_amount && voucher.initial_amount > 0
      ? voucher.initial_amount
      : ''
  );

  const [consumeAmount, setConsumeAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    voucherToDataUrl(voucher.code).then(setUrl);
  }, [voucher.code]);

  /* 🟢 Activate voucher */
  async function handleActivate() {
    if (!buyerName || !amount) {
      alert('Please enter buyer name and amount.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('vouchers')
      .update({
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim() || null,
        recipient_name: recipientName.trim() || null,
        initial_amount: Number(amount),
        balance: Number(amount),
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', voucher.id);
    setSaving(false);
    if (error) return alert('❌ ' + error.message);
    alert('✅ Voucher activated successfully');
    onRefresh();
    onClose();
  }

  /* 🔵 Consume part or full voucher */
  async function handleConsume(partial = true) {
    const consumeValue = partial ? Number(consumeAmount) : voucher.balance;
    if (!consumeValue || consumeValue <= 0)
      return alert('Enter a valid amount to consume.');
    if (consumeValue > voucher.balance)
      return alert('Amount exceeds current balance.');

    if (!confirm(`Confirm consuming ${fmtDZD(consumeValue)} ?`)) return;

    const newBalance = voucher.balance - consumeValue;
    const newStatus = newBalance <= 0 ? 'redeemed' : 'active';

    const { error } = await supabase
      .from('vouchers')
      .update({
        balance: newBalance,
        status: newStatus,
      })
      .eq('id', voucher.id);

    if (error) return alert('❌ ' + error.message);

    alert(
      newStatus === 'redeemed'
        ? '✅ Voucher fully consumed.'
        : `✅ ${fmtDZD(consumeValue)} consumed. Remaining ${fmtDZD(newBalance)}.`
    );

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
    
            <h2 className="text-lg font-semibold mb-3">Voucher Details</h2>
    
            {/* QR */}
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
    
            {/* Blank → Activation form */}
            {voucher.status === 'blank' ? (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-sm text-gray-600">Buyer Name</label>
                    <input
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm"
                    />
                  </div>
    
                  <div>
                    <label className="text-sm text-gray-600">Buyer Phone</label>
                    <input
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm"
                    />
                  </div>
    
                  <div>
                    <label className="text-sm text-gray-600">Amount (DZD)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm"
                      min={1}
                    />
                  </div>
                </div>
    
                <button
                  onClick={handleActivate}
                  disabled={saving}
                  className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Activate Voucher'}
                </button>
              </>
            ) : (
              <>
                <div className="space-y-2 text-sm mb-4">
                  <Info label="Buyer" value={voucher.buyer_name ?? '—'} />
                  <Info label="Phone" value={voucher.buyer_phone ?? '—'} />
                  <Info label="Status" value={voucher.status} />
                  <Info label="Balance" value={fmtDZD(voucher.balance)} />
                  <Info label="Initial" value={fmtDZD(voucher.initial_amount)} />
                  <Info label="Activated" value={voucher.activated_at ?? '—'} />
                </div>
    
                {/* Active → Consumption controls */}
                {voucher.status === 'active' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">
                        Consume Amount (DZD)
                      </label>
                      <input
                        type="number"
                        value={consumeAmount}
                        onChange={(e) => setConsumeAmount(e.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full border rounded-md p-2 text-sm"
                      />
                    </div>
    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleConsume(true)}
                        className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Consume Partial
                      </button>
                      <button
                        onClick={() => handleConsume(false)}
                        className="flex-1 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                      >
                        Consume All
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
    
            <button
              onClick={onClose}
              className="w-full mt-4 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
  );
}

function VoucherQr({ code }: { code: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const u = await voucherToDataUrl(code);
      if (active) setUrl(u);
    })();
    return () => {
      active = false;
    };
  }, [code]);

  if (!url) return <div className="w-32 h-32 bg-gray-100 rounded" />;
  return <img src={url} alt="Voucher QR" className="h-32 w-32 rounded border" />;
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{children}</th>
  );
}
function Td({ children, colSpan, className = '' }: { children: React.ReactNode; colSpan?: number; className?: string }) {
  return <td colSpan={colSpan} className={`px-3 py-2 ${className}`}>{children}</td>;
}
function StatusPill({ status }: { status: VoucherRow['status'] }) {
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
  try {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${n} DZD`;
  }
}
