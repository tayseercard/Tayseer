import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Refresh the session to sync cookies on the server
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error

    return NextResponse.json({ success: true, session: data.session })
  } catch (err: any) {
    console.error('Auth callback route error:', err)
    return NextResponse.json(
      { error: err.message || 'Unexpected server error' },
      { status: 500 }
    )
  }
}
