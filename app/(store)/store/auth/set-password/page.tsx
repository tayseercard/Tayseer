'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/* ---------- Wrapper with Suspense ---------- */
export default function StoreSetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-500 text-sm text-center">Loading reset form…</div>}>
      <StoreSetPasswordInner />
    </Suspense>
  );
}

/* ---------- Main component ---------- */
function StoreSetPasswordInner() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState<string | null>(null);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'ready' | 'saving' | 'error'>('checking');

  useEffect(() => {
    const handleSession = async () => {
      const code = searchParams.get('code');
      if (!code) {
        setStatus('error');
        setError('Missing reset code.');
        return;
      }

      // Required for Supabase password reset flow
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setError(error.message);
        setStatus('error');
        return;
      }

      setEmail(data?.user?.email ?? null);
      setStatus('ready');
    };

    handleSession();
  }, [searchParams, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (pw1.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (pw1 !== pw2) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('saving');
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    if (error) {
      setError(error.message);
      setStatus('ready');
      return;
    }

    // ✅ Optional: redirect back to store dashboard
    router.replace('/store');
  }

  if (status === 'checking') {
    return (
      <main className="min-h-screen grid place-items-center text-gray-600">
        Checking reset link…
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 text-gray-700">
        <div className="rounded-xl border bg-white p-6 text-center shadow-sm max-w-sm">
          <h1 className="font-semibold mb-2 text-lg text-rose-600">
            Invalid or expired link
          </h1>
          <p className="text-sm text-gray-600">
            {error ?? 'Please request a new password reset.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50 text-gray-800">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm space-y-4"
      >
        <h1 className="text-lg font-semibold">Set a new password</h1>
        <p className="text-sm text-gray-500">
          {email ? `For ${email}` : 'Enter a new password below.'}
        </p>

        <div>
          <label className="block text-sm text-gray-600">New Password</label>
          <input
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Confirm Password</label>
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="••••••••"
            required
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : 'Save Password'}
        </button>
      </form>
    </main>
  );
}
