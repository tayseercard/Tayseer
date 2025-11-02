import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Refresh and sync cookies
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    const user = sessionData.session?.user
    if (!user) throw new Error('No authenticated user found.')

    // Example: fetch roles
    const { data: roles, error: roleErr } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)

    if (roleErr) throw roleErr

    const roleList = roles?.map((r) => r.role) || []
    const dest =
      roleList.includes('superadmin')
        ? '/superadmin'
        : roleList.includes('admin')
        ? '/admin'
        : '/store'

    return NextResponse.redirect(new URL(dest, req.url))
  } catch (err: any) {
    console.error('Auth callback error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
