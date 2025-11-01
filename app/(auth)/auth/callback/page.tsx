//app\(auth)\auth\callback\page.tsx
'use client';

import { Suspense, useEffect } from 'react';
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

  useEffect(() => {
    if (!code) return;

    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Auth callback error:', error);
        router.replace('/auth/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { data: roles, error: roleErr } = await supabase
        .from('me_effective_role')
        .select('role')
        .eq('user_id', user.id);

      if (roleErr) console.error(roleErr);

      const roleList = roles?.map((r) => r.role) || [];
      const dest = roleList.includes('superadmin')
        ? '/superadmin'
        : roleList.includes('admin')
        ? '/admin'
        : '/store';

      router.replace(dest);
    })();
  }, [code, router, supabase]);

  return <div className="p-4 text-sm text-gray-500">Finalizing login…</div>;
}
