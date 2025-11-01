'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SupabaseDebugPage() {
  const [info, setInfo] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    (async () => {
      // Fetch current auth settings to verify the connection
      const { data, error } = await supabase.from('me_effective_role').select('count', { count: 'exact', head: true });

      setInfo({
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasError: !!error,
        errorMessage: error?.message || null,
        connected: !error,
      });
    })();
  }, [supabase]);

  return (
    <div className="p-6 font-mono text-sm space-y-2">
      <h2 className="text-lg font-semibold mb-2">🔍 Supabase Environment Check</h2>

      <p>
        <strong>URL:</strong> {info?.SUPABASE_URL || '...'}
      </p>

      <p>
        <strong>Status:</strong>{' '}
        {info?.connected ? '✅ Connected successfully!' : '❌ Connection failed'}
      </p>

      {info?.errorMessage && (
        <p className="text-red-500">
          <strong>Error:</strong> {info.errorMessage}
        </p>
      )}
    </div>
  );
}
