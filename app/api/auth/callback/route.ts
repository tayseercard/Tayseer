import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // ✅ Create server-side Supabase client that reads/writes auth cookies
    const supabase = createRouteHandlerClient({ cookies })

    // ✅ Force session sync
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Supabase callback error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Session synced:', !!data.session)
    return NextResponse.json({ success: true, session: !!data.session })
  } catch (e: any) {
    console.error('❌ Unhandled callback error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
