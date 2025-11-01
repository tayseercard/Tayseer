'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Signing you in…</div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}

function AuthCallbackInner() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get('code');
  const redirectTo = params.get('redirectTo');
  const [debug, setDebug] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setDebug('❌ No "code" parameter found in URL.');
      return;
    }

    (async () => {
      try {
        setDebug('⏳ Exchanging code for session…');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw new Error('Exchange error: ' + exchangeError.message);

        setDebug('✅ Session exchanged, syncing cookies...');
const res = await fetch('/api/auth/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
});
        const json = await res.json();

        if (!res.ok) {
          throw new Error(`Cookie sync failed: ${json.error || res.statusText}`);
        }

        setDebug('🔐 Cookies synced. Fetching user...');
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) throw new Error('Get user failed: ' + userErr.message);
        if (!user) throw new Error('User missing after login.');

        setDebug(`👤 Logged in as ${user.email}, fetching role…`);
        const { data: roles, error: roleErr } = await supabase
          .from('me_effective_role')
          .select('role')
          .eq('user_id', user.id);

        if (roleErr) throw new Error('Role fetch error: ' + roleErr.message);
        if (!roles?.length) throw new Error('No role assigned to this user.');

        const roleList = roles.map((r) => r.role);
        const dest =
          redirectTo ||
          (roleList.includes('superadmin')
            ? '/superadmin'
            : roleList.includes('admin')
            ? '/admin'
            : '/store');

        setDebug(`✅ Redirecting to ${dest}...`);
        router.replace(dest);
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setDebug('💥 Error: ' + err.message);
      }
    })();
  }, [code, router, supabase, redirectTo]);

  return (
    <div className="p-4 text-sm text-gray-700 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-md max-w-md w-full border">
        <h1 className="font-semibold text-lg mb-2">🔄 Login callback</h1>
        <p>{debug || 'Please wait…'}</p>
        <p className="text-xs text-gray-500 mt-4">
          If you’re stuck here, copy the message above and share it with your developer.
        </p>
      </div>
    </div>
  );
}
