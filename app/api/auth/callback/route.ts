export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Supabase session error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, hasSession: !!data.session });
  } catch (e: any) {
    console.error('💥 /api/auth/callback crashed:', e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
