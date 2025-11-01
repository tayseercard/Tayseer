export const runtime = 'nodejs' // ✅ must run on Node, not Edge

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const supabase = createRouteHandlerClient({ cookies });

  if (body?.signout) {
    await supabase.auth.signOut();
    return NextResponse.json({ success: true, message: 'Signed out' });
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data.session) return NextResponse.json({ error: 'No active session' }, { status: 401 });

  return NextResponse.json({ success: true, user: data.session.user });
}

