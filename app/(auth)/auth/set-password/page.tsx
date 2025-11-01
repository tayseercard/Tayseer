'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/* ---------- Wrapper with Suspense ---------- */
export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-500 text-sm text-center">Loading…</div>}>
      <SetPasswordInner />
    </Suspense>
  );
}

/* ---------- Actual page logic ---------- */
function SetPasswordInner() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const sp = useSearchParams();

  const redirectTo = sp.get('redirectTo') || '';

  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (p1.length < 8) return setErr('Password must be at least 8 characters.');
    if (p1 !== p2) return setErr('Passwords do not match.');

    setLoading(true);
    const { error: e1 } = await supabase.auth.updateUser({
      password: p1,
      data: { must_change_password: false },
    });
    setLoading(false);

    if (e1) return setErr(e1.message);
    setOk(true);

    // Fetch role to redirect properly
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: me } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user?.id)
      .maybeSingle();

    const dest = redirectTo || (me?.role === 'admin' ? '/admin' : '/store');
    router.replace(dest);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow">
        {!ok ? (
          <form onSubmit={onSubmit} className="grid gap-3">
            <h1 className="text-xl font-semibold mb-2 text-center">Set your password</h1>
            <input
              type="password"
              placeholder="New password"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              required
              className="border rounded-md p-2"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              required
              className="border rounded-md p-2"
            />
            {err && <p className="text-red-600 text-sm">{err}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white rounded-md p-2"
            >
              {loading ? 'Saving…' : 'Save password'}
            </button>
          </form>
        ) : (
          <div className="text-center text-green-700 font-medium">
            ✅ Password updated successfully!
          </div>
        )}
      </div>
    </div>
  );
}
