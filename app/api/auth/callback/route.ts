import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Handles POST /api/auth/callback
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.getSession(); // this syncs cookies for SSR
  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
