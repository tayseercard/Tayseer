'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

/* ---------- Wrapper with Suspense ---------- */
export default function MagicLoginPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-500 text-sm text-center">Loading magic link form…</div>}>
      <MagicInner />
    </Suspense>
  );
}

/* ---------- Inner page logic ---------- */
function MagicInner() {
  const supabase = createClientComponentClient();
  const sp = useSearchParams();
  const redirectTo = sp.get('redirectTo') || ''; // where to go after callback

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const origin =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'ttps://https://tayseercard.vercel.app');


      const callbackUrl = `${origin}/auth/callback${
        redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''
      }`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
          // shouldCreateUser: true, // uncomment if you want signup via magic link
        },
      });

      if (error) throw error;

      setSent(true);
    } catch (e: any) {
      setErr(e.message || 'Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow">
        {!sent ? (
          <form onSubmit={onSend} className="grid gap-3">
            <h1 className="text-xl font-semibold mb-2 text-center">
              Sign in with Magic Link
            </h1>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border rounded-md p-2"
            />

            {err && <p className="text-red-600 text-sm">{err}</p>}

            <button type="submit" className="bg-black text-white rounded-md p-2" disabled={loading}>
              {loading ? 'Sending…' : 'Send link'}
            </button>

            <div className="text-sm text-center mt-2">
              <span className="text-gray-500">Prefer password? </span>
              <Link
                href={`/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
                className="text-blue-600 hover:underline"
              >
                Use password login
              </Link>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-2">
            <h2 className="text-lg font-medium">Check your inbox ✉️</h2>
            <p className="text-gray-600 text-sm">
              We sent you a sign-in link. Open it on this device to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
