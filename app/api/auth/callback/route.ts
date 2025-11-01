export const runtime = 'nodejs'; // ✅ must run on Node, not Edge

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if this is a logout request
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (body?.signout) {
      // ✅ Sign out (clears cookie)
      await supabase.auth.signOut();
      return NextResponse.json({ success: true, message: 'Signed out' });
    }

    // ✅ Otherwise, it's a login cookie sync
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Supabase session error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.session) {
      console.error('❌ No session found');
      return NextResponse.json({ error: 'No active session found' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: data.session.user,
    });
  } catch (e: any) {
    console.error('💥 /api/auth/callback failed:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
