'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function StoreLoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [email, setEmail] = useState('meay.tech@gmail.com'); // prefill for your store
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);
    router.replace('/store');

    const { data: { user } } = await supabase.auth.getUser();

if (user?.user_metadata?.must_reset_password) {
  router.replace('/store/auth/set-password');
  return;
}

router.replace('/store');

  }
  

  return (
    <main className="min-h-dvh grid place-items-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-sm">
        <h1 className="mb-3 text-lg font-semibold">Store login</h1>
        <input
          type="email"
          className="mb-2 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="mb-2 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
        />
        {err && <p className="mb-2 text-sm text-rose-600">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? '…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
