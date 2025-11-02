import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST() {
  try {
    // ✅ Handle both sync and async versions of cookies()
    const cookieStore: any =
      typeof (cookies as any).then === 'function' ? await cookies() : cookies()

    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    })

    // ✅ This actually refreshes + persists the session
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
