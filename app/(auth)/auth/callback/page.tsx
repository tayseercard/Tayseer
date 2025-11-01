'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  useEffect(() => {
    if (!code) return;

    (async () => {
      try {
        console.log('🟢 Exchanging code for session…');
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) throw exchangeErr;

        // ✅ Write session cookie so middleware can read it
        const res = await fetch('/api/auth/callback', { method: 'POST' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Cookie sync failed');

        console.log('✅ Session synced with server cookies');

        // ✅ Get logged-in user
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user) throw new Error('No user found');

        console.log('👤 Logged in as:', user.email);

        // ✅ Fetch all roles
        const { data: roles, error: roleErr } = await supabase
          .from('me_effective_role')
          .select('role')
          .eq('user_id', user.id);

        if (roleErr) throw roleErr;
        if (!roles?.length) throw new Error('No role assigned');

        const roleList = roles.map(r => r.role);
        console.log('🔑 Roles:', roleList);

        // ✅ Determine redirect destination
        const dest =
          redirectTo ||
          (roleList.includes('superadmin')
            ? '/superadmin'
            : roleList.includes('admin')
            ? '/admin'
            : '/store');

        console.log('➡️ Redirecting to', dest);
        router.replace(dest);
      } catch (e: any) {
        console.error('❌ Auth callback error:', e);
        router.replace('/auth/login?error=' + encodeURIComponent(e.message || 'Auth failed'));
      }
    })();
  }, [code, router, supabase, redirectTo]);

  return <div className="p-4 text-sm text-gray-500">Finalizing login…</div>;
}
