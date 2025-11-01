'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Gift } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-500 text-sm text-center">Loading login…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const redirectTo = params.get('redirectTo');

  // ---------------- LOGIN ----------------
  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!signInData.user) throw new Error('No user found');

      // 🟢 Sync session cookies for Next.js SSR
      await fetch('/api/auth/callback', { method: 'POST' });

      // 🔍 Fetch all roles for this user
      const { data: roles, error: roleErr } = await supabase
        .from('me_effective_role')
        .select('role')
        .eq('user_id', signInData.user.id);

      if (roleErr) console.error(roleErr);

      if (!roles || roles.length === 0) {
        setErr('No role assigned to this user.');
        setLoading(false);
        return;
      }

      // ✅ Determine role priority
      const roleList = roles.map((r) => r.role);
      const isSuperadmin = roleList.includes('superadmin');
      const isAdmin = roleList.includes('admin');
      const isStoreOwner = roleList.includes('store_owner');

      // 🧭 Redirect logic
      if (isSuperadmin) {
        router.replace(redirectTo || '/superadmin');
      } else if (isAdmin) {
        router.replace(redirectTo || '/admin');
      } else if (isStoreOwner) {
        const { data: store } = await supabase
          .from('stores')
          .select('temp_password_set')
          .eq('email', email)
          .maybeSingle();

        if (store?.temp_password_set) {
          router.replace('/auth/change-password');
        } else {
          router.replace(redirectTo || '/store');
        }
      } else {
        setErr('Unknown role: ' + roleList.join(', '));
      }

      setLoading(false);
    } catch (e: any) {
      console.error('Login error:', e);
      setLoading(false);
      setErr(e.message || 'Login failed');
    }
  }

  // ---------------- RESET PASSWORD ----------------
  // ---------------- RESET PASSWORD ----------------
async function onReset(e: React.FormEvent) {
  e.preventDefault();
  setErr(null);
  setMsg(null);
  setLoading(true);

  const origin = 'https://tayseercard.vercel.app'; // ✅ always use production URL

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  setLoading(false);
  if (error) return setErr(error.message);
  setMsg('✅ Check your email for a reset link.');
}


  // ---------------- UI ----------------
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 bg-gradient-to-br from-[#0A0A0C] via-[#18181C] to-[#2A2A30] text-white"
      style={{
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-lg border border-white/10 p-6 shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-7 w-7 text-white" />
            <h1 className="text-2xl font-semibold">tayseer</h1>
          </div>
          <p className="text-sm text-white/60">
            {resetMode ? 'Reset your password' : 'Sign in to your dashboard'}
          </p>
        </div>

        {/* Forms */}
        {!resetMode ? (
          <form onSubmit={onLogin} className="space-y-3">
            <div>
              <label className="text-sm text-white/70 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="you@tayseer.com"
              />
            </div>

            <div>
              <label className="text-sm text-white/70 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="••••••••"
              />
            </div>

            {err && <p className="text-rose-400 text-sm">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white text-black py-2.5 font-medium hover:opacity-90 active:scale-[0.99] transition"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={onReset} className="space-y-3">
            <div>
              <label className="text-sm text-white/70 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="you@tayseer.com"
              />
            </div>

            {err && <p className="text-rose-400 text-sm">{err}</p>}
            {msg && <p className="text-emerald-400 text-sm">{msg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white text-black py-2.5 font-medium hover:opacity-90 active:scale-[0.99] transition"
            >
              {loading ? 'Sending link…' : 'Send reset link'}
            </button>
          </form>
        )}

        {/* Toggle Links */}
        <div className="mt-4 text-center">
          {!resetMode ? (
            <button
              onClick={() => setResetMode(true)}
              className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              Forgot password?
            </button>
          ) : (
            <button
              onClick={() => setResetMode(false)}
              className="text-sm text-white/70 hover:text-white underline underline-offset-2 flex items-center gap-1 justify-center"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
