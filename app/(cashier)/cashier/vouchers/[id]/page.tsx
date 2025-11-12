'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X } from 'lucide-react';
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode';

type Voucher = {
  id: string;
  code: string;
  buyer_name: string | null;
  buyer_phone: string | null; // ← add this in your table if not present
  initial_amount: number;
  balance: number;
  status: 'blank'|'active'|'redeemed'|'expired'|'void';
  expires_at: string | null;
  store_id: string | null;
  created_at: string;
  activated_at: string | null;
  redeemed_at: string | null;
};

export default function VoucherModalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [v, setV] = useState<Voucher | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  // form state for activation
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [amount, setAmount] = useState<number | ''>('');

  const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);

  const PHONE_RE = /^[0-9 +()\-]{6,20}$/;

  const [redeemAmt, setRedeemAmt] = useState<number | ''>('');

  async function load() {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();
    setLoading(false);
    if (error || !data) return setErr('Voucher not found');

    const vv = data as Voucher;
    setV(vv);
    setBuyerName(vv.buyer_name ?? '');
    setBuyerPhone(vv.buyer_phone ?? '');
    setAmount(vv.status === 'blank' ? '' : vv.initial_amount || ''); // only propose amount for blank
    setQr(await voucherToDataUrl(vv.code));
  }

useEffect(() => {
  // 🧠 Safety: only run if voucher exists
  if (!v?.store_id) return;

  // only search when user typed enough
  if (!buyerName || buyerName.trim().length < 2) {
    setClientSuggestions([]);
    return;
  }

  const delay = setTimeout(async () => {
    const { data, error } = await supabase
      .from('store_clients')
      .select('id, full_name, phone')
      .ilike('full_name', `%${buyerName}%`)
      .eq('store_id', v.store_id)
      .limit(5);

    if (!error) setClientSuggestions(data || []);
  }, 300); // debounce to reduce calls

  return () => clearTimeout(delay);
}, [buyerName, supabase, v]);

  
  useEffect(() => {
    // lock scroll while modal open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    load();
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && router.back();
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);


  
  async function onDelete() {
    if (!v) return;
    if (!confirm('Delete this voucher? This cannot be undone.')) return;
    setWorking(true);
    const { error } = await supabase.from('vouchers').delete().eq('id', v.id);
    setWorking(false);
    if (error) return alert(error.message);
    router.back();
  }

 async function onActivate() {
  if (!v) return;
  if (v.status !== 'blank') {
    setErr('Only blank vouchers can be activated.');
    return;
  }

  const a = Number(amount);
  if (!a || a <= 0) {
    setErr('Amount must be greater than 0.');
    return;
  }

  if (buyerPhone && !PHONE_RE.test(buyerPhone)) {
    setErr('Phone is invalid. Use digits/spaces/()+- (6–20 chars).');
    return;
  }

  setWorking(true);

  try {
    let storeClientId: string | null = null;

    // ✅ If the store entered buyer name or phone, check for existing client
    if (buyerName || buyerPhone) {
      const { data: existing } = await supabase
        .from('store_clients')
        .select('id')
        .eq('store_id', v.store_id)
        .or(`phone.eq.${buyerPhone || ''},full_name.ilike.${buyerName || ''}`)
        .maybeSingle();

      if (existing) {
        storeClientId = existing.id;
      } else {
        // 🆕 Create new client
        const { data: newClient, error: insertErr } = await supabase
          .from('store_clients')
          .insert({
            store_id: v.store_id,
            full_name: buyerName || '—',
            phone: buyerPhone || null,
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;
        storeClientId = newClient.id;
      }
    }

    // 💾 Update voucher — optimistic guard: only if still blank
    const { error: updateErr } = await supabase
      .from('vouchers')
      .update({
        buyer_name: buyerName || null,
        buyer_phone: buyerPhone || null,
        store_client_id: storeClientId,
        initial_amount: a,
        balance: a,
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', v.id)
      .eq('status', 'blank');

    if (updateErr) throw updateErr;

    await load(); // refresh modal/table
  } catch (err: any) {
    console.error(err);
    setErr(err.message || 'Activation failed.');
  } finally {
    setWorking(false);
  }
}


  async function onConsume() {
  if (!v) return;
  if (v.status !== 'active') {
    setErr('Only active vouchers can be consumed.');
    return;
  }
  const a = Number(redeemAmt);
  if (!a || a <= 0) {
    setErr('Amount must be greater than 0.');
    return;
  }
  if (a > v.balance) {
    setErr('Amount exceeds remaining balance.');
    return;
  }

  setWorking(true);

  // Preferred if you created it:
  // const { error } = await supabase.rpc('redeem_voucher', {
  //   p_code: v.code,
  //   p_amount: a,
  //   p_store_id: v.store_id,
  // });

  // Fallback: direct update with optimistic guard on status
  const newBal = v.balance - a;
  const { error } = await supabase
    .from('vouchers')
    .update({
      balance: newBal,
      status: newBal === 0 ? 'redeemed' : 'active',
      redeemed_at: newBal === 0 ? new Date().toISOString() : v.redeemed_at,
    })
    .eq('id', v.id)
    .eq('status', 'active');

  setWorking(false);
  if (error) return setErr(error.message);

  setRedeemAmt('');
  await load(); // refresh data
}
  function onBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) router.back();
  }

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={onBackdrop}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white text-black shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-base font-semibold">Voucher details</div>
          <button
            onClick={() => router.back()}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : err ? (
            <div className="text-sm text-rose-600">{err}</div>
          ) : v ? (
            <>
              {/* Top: code + QR */}
             <div className="flex items-start gap-4">
  <div className="rounded-lg border p-2">
    {qr ? (
      <a href={voucherDeepLink(v.code)} target="_blank" rel="noreferrer" title="Open voucher public page">
        <img src={qr} alt="QR" className="h-36 w-36 rounded" />
      </a>
    ) : (
      <div className="grid h-36 w-36 place-items-center text-gray-400">QR…</div>
    )}
  </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-600">Code</div>
                  <div className="mb-2 break-all font-mono text-lg">{v.code}</div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info label="Status" value={v.status} />
                    <Info label="Balance" value={`${Math.round(v.balance)} DZD`} />
                    <Info label="Initial" value={`${Math.round(v.initial_amount)} DZD`} />
                    <Info label="Buyer" value={v.buyer_name ?? '—'} />
                    <Info label="Phone" value={v.buyer_phone ?? '—'} />
                    <Info label="Expires" value={v.expires_at ?? '—'} />
                    <Info label="Activated" value={v.activated_at ? new Date(v.activated_at).toLocaleString() : '—'} />
                  </div>
                </div>
              </div>

              {/* Activation form (only when blank) */}
              {v.status === 'blank' && (
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium mb-3">Activate voucher</div>
                  <div className="relative">
  <label className="block text-sm text-gray-600">Buyer name (optional)</label>
  <input
    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
    value={buyerName}
    onChange={(e) => {
      setBuyerName(e.target.value);
      setShowSuggestions(true);
    }}
    placeholder="Client name"
    onFocus={() => setShowSuggestions(true)}
    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // slight delay for click
  />

  {/* 🧠 Suggestions Dropdown */}
  {showSuggestions && clientSuggestions.length > 0 && (
    <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-md max-h-48 overflow-auto">
      {clientSuggestions.map((c) => (
        <button
          key={c.id}
          onClick={() => {
            setBuyerName(c.full_name);
            setBuyerPhone(c.phone || '');
            setShowSuggestions(false);
            setClientSuggestions([]);
          }}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex justify-between"
        >
          <span>{c.full_name}</span>
          {c.phone && <span className="text-xs text-gray-500">{c.phone}</span>}
        </button>
      ))}
    </div>
  )}
</div>


                  <div className="mt-3 flex gap-2">
                    <button
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      onClick={onActivate}
                      disabled={working}
                    >
                      {working ? 'Activating…' : 'Activate'}
                    </button>
                  </div>
                </div>
              )}

              {/* Consume (only when active) */}
{v.status === 'active' && (
  <div className="rounded-lg border p-4">
    <div className="mb-3 text-sm font-medium">Consume voucher</div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 items-end">
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-600">Amount to consume (DZD) *</label>
        <input
          type="number"
          min={1}
          step={1}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={redeemAmt}
          onChange={(e) => setRedeemAmt(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="e.g. 1000"
        />
        <p className="mt-1 text-xs text-gray-500">
          Remaining: <b>{Math.round(v.balance)} DZD</b>
        </p>
      </div>
      <div className="flex gap-2">
        <button
          className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
          onClick={onConsume}
          disabled={working}
        >
          {working ? 'Consuming…' : 'Consume'}
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => setRedeemAmt(Math.max(1, Math.floor(v.balance)))} // quick-fill
          disabled={working || v.balance <= 0}
          title="Use full remaining balance"
        >
          Max
        </button>
      </div>
    </div>
  </div>
)}


              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                

                <button
                  className="rounded-md border px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  onClick={onDelete}
                  disabled={working}
                >
                  {working ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </>
          ) : null}
        </div>

        <div className="border-t px-4 py-3 text-xs text-gray-500">
          Tip: activate here or use the public page to activate/top-up/redeem.
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 break-words">{value}</div>
    </div>
  );
}
