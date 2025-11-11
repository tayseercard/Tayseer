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
  const [editMode, setEditMode] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)


  
  // form state for activation
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [amount, setAmount] = useState<number | ''>('');

  const PHONE_RE = /^[0-9 +()\-]{6,20}$/;

  const [redeemAmt, setRedeemAmt] = useState<number | ''>('');


// 🔹 fetch session role once
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setUserRole(data.session?.user?.user_metadata?.role ?? null)
    })()
  }, [supabase])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()
    setLoading(false)
    if (error || !data) return setErr('Voucher not found')
    setV(data)
    setBuyerName(data.buyer_name ?? '')
    setBuyerPhone(data.buyer_phone ?? '')
    setAmount(data.initial_amount ?? '')
    setQr(await voucherToDataUrl(data.code))
  }

  useEffect(() => {
    load()
  }, [params.id])

    async function onEditSave() {
    if (!v) return
    if (!['admin', 'superadmin'].includes(userRole || '')) {
      return setErr('Only admin can edit active vouchers.')
    }
    const a = Number(amount)
    if (!a || a <= 0) return setErr('Amount must be > 0')

    setWorking(true)
    const { error } = await supabase
      .from('vouchers')
      .update({
        buyer_name: buyerName || null,
        buyer_phone: buyerPhone || null,
        initial_amount: a,
        balance: a, // reset balance to new amount
      })
      .eq('id', v.id)
      .eq('status', 'active')
    setWorking(false)
    if (error) return setErr(error.message)
    setEditMode(false)
    await load()
  }

  if (loading) return <p className="p-6">Loading…</p>
  if (err) return <p className="p-6 text-rose-600">{err}</p>
  if (!v) return null


  /*async function load() {
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
  }*/

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

    // Preferred: call your RPC if you created it
    // const { error } = await supabase.rpc('activate_voucher', {
    //   p_code: v.code,
    //   p_amount: a,
    //   p_buyer_name: buyerName || null,
    //   p_store_id: v.store_id
    // });

    // Fallback: direct update with optimistic guard on status
    const { error } = await supabase
      .from('vouchers')
      .update({
        buyer_name: buyerName || null,
        buyer_phone: buyerPhone || null,
        initial_amount: a,
        balance: a,
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', v.id)
      .eq('status', 'blank');

    setWorking(false);
    if (error) return setErr(error.message);

    await load(); // refresh modal with updated values
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
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-base font-semibold">Voucher details</div>
          <button
            onClick={() => router.back()}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-5">
          {/* QR + INFO */}
          <div className="flex items-start gap-4">
            <div className="rounded-lg border p-2">
              {qr ? (
                <a
                  href={voucherDeepLink(v.code)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src={qr} alt="QR" className="h-36 w-36 rounded" />
                </a>
              ) : (
                <div className="grid h-36 w-36 place-items-center text-gray-400">
                  QR…
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm text-gray-600">Code</div>
              <div className="mb-2 break-all font-mono text-lg">{v.code}</div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Status" value={v.status} />
                <Info label="Balance" value={`${Math.round(v.balance)} DZD`} />
                <Info
                  label="Initial"
                  value={`${Math.round(v.initial_amount)} DZD`}
                />
                <Info label="Buyer" value={v.buyer_name ?? '—'} />
                <Info label="Phone" value={v.buyer_phone ?? '—'} />
                <Info label="Expires" value={v.expires_at ?? '—'} />
              </div>
            </div>
          </div>

          {/* 🔹 Admin edit section */}
          {['admin', 'superadmin'].includes(userRole || '') &&
            v.status === 'active' && (
              <div className="rounded-lg border p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-medium">Edit Active Voucher</div>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700"
                  >
                    {editMode ? 'Cancel' : '✏️ Edit'}
                  </button>
                </div>

                {editMode && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Buyer name</label>
                      <input
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Buyer phone</label>
                      <input
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Initial amount (DZD)
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={amount}
                        onChange={(e) =>
                          setAmount(
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-3">
                      <button
                        onClick={onEditSave}
                        disabled={working}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 text-sm"
                      >
                        {working ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Consume section */}
          {v.status === 'active' && (
            <div className="rounded-lg border p-4">
              <div className="mb-3 text-sm font-medium">Consume voucher</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">
                    Amount to consume (DZD)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                    value={redeemAmt}
                    onChange={(e) =>
                      setRedeemAmt(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
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
                    onClick={() =>
                      setRedeemAmt(Math.max(1, Math.floor(v.balance)))
                    }
                    disabled={working || v.balance <= 0}
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3 text-xs text-gray-500">
          Tip: only admins can edit active vouchers to correct wrong values.
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase text-gray-500">{label}</div>
      <div>{value}</div>
    </div>
  )
}
