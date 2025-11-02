import { NextResponse } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// 🧩 Fix for Next.js 15+ cookies API change
export async function POST() {
  try {
    const cookieStore = await nextCookies() // <— important: call it!
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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
