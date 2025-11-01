import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Just touch the session to ensure cookies are set
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    return NextResponse.json({ ok: true, session });
  } catch (err: any) {
    console.error('Cookie sync error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Cookie sync failed' },
      { status: 500 }
    );
  }
}
