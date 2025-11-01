export const runtime = 'nodejs' // ✅ must run on Node, not Edge

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Create Supabase client with cookies
    const supabase = createRouteHandlerClient({ cookies })

    // Get current session from client-side login
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Supabase session error:', error.message)
      return NextResponse.json(
        { error: 'Failed to get session', details: error.message },
        { status: 500 }
      )
    }

    // No active session?
    if (!data?.session) {
      console.error('❌ No active session returned')
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      )
    }

    // ✅ Everything OK — return success
    return NextResponse.json({
      success: true,
      user: data.session.user,
    })
  } catch (e: any) {
    console.error('💥 /api/auth/callback crash:', e)
    return NextResponse.json(
      { error: e.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
