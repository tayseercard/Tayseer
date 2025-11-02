import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data, error } = await supabase.auth.getSession()
  if (error) console.error('Session error:', error)

  // Continue your callback flow
  return NextResponse.redirect(new URL('/', request.url))
}
