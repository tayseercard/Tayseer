'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminClients() {
  const [market, setMarket] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [stores, setStores] = useState(''); // comma separated
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<any[]>([]);

  // Optional: verify current user is platform_admin by calling a small SQL view/func
  useEffect(() => {
    (async () => {
      const { data: rs } = await supabase.rpc('am_platform_admin');
      if (!rs) alert('You are not platform admin.');
    })();
    refresh();
  }, []);

  async function refresh() {
    const { data } = await supabase.from('merchants').select('id,name,created_at,address,phone,email,wilaya,owner_user_id')
.order('created_at', { ascending: false }).limit(100);
    setMerchants(data || []);
  }

  async function createClient() {
    if (!market || !email) return alert('Market + owner email required');
    setLoading(true);
    const payload = {
      marketName: market,
      ownerEmail: email,
      ownerPassword: pwd || undefined,
      stores: stores
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    };

    const res = await fetch('/api/admin/create-merchant', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return alert(json.error || 'Failed');
    setMarket(''); setEmail(''); setPwd(''); setStores('');
    await refresh();
    alert('Client created ✔');
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-semibold">Admin • Clients</h1>

      <div className="mt-6 grid gap-3 max-w-xl">
        <input className="bg-white/10 rounded px-3 py-2" placeholder="Market name (e.g., Atlas Matelas)" value={market} onChange={e=>setMarket(e.target.value)} />
        <input className="bg-white/10 rounded px-3 py-2" placeholder="Owner email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="bg-white/10 rounded px-3 py-2" placeholder="Owner password (optional)" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} />
        <input className="bg-white/10 rounded px-3 py-2" placeholder="Stores (comma separated: ‘Centre, Oran, Alger’)" value={stores} onChange={e=>setStores(e.target.value)} />
        <button disabled={loading} onClick={createClient} className="bg-white text-black rounded px-4 py-2 w-max">{loading ? 'Creating…' : 'Create client'}</button>
      </div>

      <h2 className="mt-10 text-xl font-medium">All Merchants</h2>
      <ul className="mt-3 space-y-2">
        {merchants.map(m => (
          <li key={m.id} className="bg-white/5 rounded px-4 py-2 flex items-center justify-between">
            <span>{m.name}</span>
            <code className="text-white/70">{m.id.slice(0,8)}…</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
