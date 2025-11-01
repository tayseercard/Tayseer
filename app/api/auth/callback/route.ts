import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Force Supabase to refresh and persist cookies
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error

    return NextResponse.json({ ok: true, session: data.session ?? null })
  } catch (err: any) {
    console.error('❌ /api/auth/callback error:', err)
    return NextResponse.json(
      { error: err.message || 'Cookie sync failed' },
      { status: 500 },
    )
  }
}
