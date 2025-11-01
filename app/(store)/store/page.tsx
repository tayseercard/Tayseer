'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { QrCode, X } from 'lucide-react';
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
        'id, code, buyer_name, buyer_phone, initial_amount, balance, status, expires_at, activated_at, created_at'
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
      <div className="mx-auto max-w-5xl p-5">
        {/* Header */}
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Store</h1>
            {loadingStores ? (
              <span className="text-sm text-gray-500">Loading stores…</span>
            ) : stores.length > 1 ? (
              <select
                className="rounded-md border bg-white px-3 py-2 text-sm"
                value={storeId ?? ''}
                onChange={(e) => setStoreId(e.target.value)}
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ?? s.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-gray-600">{stores[0]?.name}</span>
            )}
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/store/');
            }}
            className="rounded-md border px-3 py-2 text-sm hover:bg-white"
          >
            Logout
          </button>
        </header>

        {/* Search + Scan */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            placeholder="Search vouchers by code or buyer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={() => {
              setScanError(null);
              setScanning(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <QrCode className="h-4 w-4" /> Scan QR
          </button>
        </div>

        {/* ✅ Scanner Modal using @yudiel/react-qr-scanner */}
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

        {/* Vouchers table */}
        <div className="overflow-hidden rounded-2xl border bg-white mt-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Buyer</Th>
                <Th>Code</Th>
                <Th>Status</Th>
                <Th>Initial</Th>
                <Th>Balance</Th>
                <Th>Expires</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {loadingVouchers ? (
                <tr>
                  <Td colSpan={7}>
                    <div className="py-8 text-center text-gray-500">Loading vouchers…</div>
                  </Td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <Td colSpan={7}>
                    <div className="py-8 text-center text-gray-500">No vouchers.</div>
                  </Td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => openVoucher(v)}
                    className="border-t cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Td>{v.buyer_name ?? '—'}</Td>
                    <Td>
                      <code className="rounded bg-gray-100 px-1.5 py-0.5">{v.code}</code>
                    </Td>
                    <Td>
                      <StatusPill status={v.status} />
                    </Td>
                    <Td>{fmtDZD(v.initial_amount)}</Td>
                    <Td>{fmtDZD(v.balance)}</Td>
                    <Td>{v.expires_at ?? '—'}</Td>
                    <Td>{new Date(v.created_at).toLocaleString()}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Voucher detail modal */}
       {selectedVoucher && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
    <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
      <button
        onClick={() => setSelectedVoucher(null)}
        className="absolute right-3 top-3 text-gray-500 hover:text-black"
      >
        <X className="h-5 w-5" />
      </button>

      <h2 className="text-lg font-semibold mb-3">Voucher Details</h2>

      {loadingVoucherDetail ? (
        <div className="py-6 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          {/* --- QR Image --- */}
          <div className="flex flex-col items-center mb-4">
            <VoucherQr code={selectedVoucher.code} />
            <a
              href={voucherDeepLink(selectedVoucher.code)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline mt-1 break-all"
            >
              {voucherDeepLink(selectedVoucher.code)}
            </a>
          </div>

          {/* --- Voucher info --- */}
          <div className="space-y-2 text-sm mb-4">
            <Info label="Code" value={selectedVoucher.code} />
            <Info label="Buyer" value={selectedVoucher.buyer_name ?? '—'} />
            <Info label="Phone" value={selectedVoucher.buyer_phone ?? '—'} />
            <Info label="Status" value={selectedVoucher.status} />
            <Info label="Balance" value={fmtDZD(selectedVoucher.balance)} />
            <Info label="Initial" value={fmtDZD(selectedVoucher.initial_amount)} />
            <Info label="Expires" value={selectedVoucher.expires_at ?? '—'} />
            <Info
              label="Activated"
              value={
                selectedVoucher.activated_at
                  ? new Date(selectedVoucher.activated_at).toLocaleString()
                  : '—'
              }
            />
            <Info
              label="Created"
              value={new Date(selectedVoucher.created_at).toLocaleString()}
            />
          </div>

          {/* --- Action buttons --- */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              disabled={selectedVoucher.status !== 'blank'}
              onClick={async () => {
                const { error } = await supabase
                  .from('vouchers')
                  .update({ status: 'active', activated_at: new Date().toISOString() })
                  .eq('id', selectedVoucher.id);
                if (error) return alert(error.message);
                alert('✅ Voucher activated');
                setSelectedVoucher({ ...selectedVoucher, status: 'active', activated_at: new Date().toISOString() });
              }}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Activate
            </button>

            <button
              disabled={selectedVoucher.status !== 'active'}
              onClick={async () => {
                const { error } = await supabase
                  .from('vouchers')
                  .update({ status: 'redeemed', balance: 0 })
                  .eq('id', selectedVoucher.id);
                if (error) return alert(error.message);
                alert('✅ Voucher consumed');
                setSelectedVoucher({ ...selectedVoucher, status: 'redeemed', balance: 0 });
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Consume
            </button>

            <button
              onClick={() => setSelectedVoucher(null)}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

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
