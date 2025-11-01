import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * This route is called by the client after sign-in
 * (see auth/callback/page.tsx → fetch('/api/auth/callback', { method: 'POST' }))
 *
 * It syncs the Supabase session from client to secure HTTP-only cookies
 * so that middleware & server components see the authenticated user.
 */

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Callback error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

// Optional GET → sanity-check endpoint
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return NextResponse.json({ user })
}
