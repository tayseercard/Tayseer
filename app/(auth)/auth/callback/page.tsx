'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// ⬇️ Wrapper to satisfy Next.js build (Suspense boundary)
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Signing you in…</div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}

// ⬇️ Actual logic here
function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const code = params.get('code');
    if (!code) return;

    // Exchange Supabase auth code for a session
    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
      if (error) {
        console.error('Auth callback error:', error);
        alert('Authentication failed. Please try again.');
        router.replace('/auth/login');
        return;
      }

      // ✅ Optionally redirect user depending on role
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { data: roleRow } = await supabase
        .from('me_effective_role')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const role = roleRow?.role;
      const dest = role === 'admin' ? '/admin' : '/store';
      router.replace(dest);
    });
  }, [params, router, supabase]);

  return <div className="p-4 text-sm text-gray-500">Finalizing login…</div>;
}
