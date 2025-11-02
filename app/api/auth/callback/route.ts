import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Re-sync session cookies
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const user = sessionData.session?.user
    if (!user) throw new Error('User not found in session.')

    // Fetch effective role(s)
    const { data: roles, error: roleError } = await supabase
      .from('me_effective_role')
      .select('role')
      .eq('user_id', user.id)

    if (roleError) throw roleError
    if (!roles?.length) throw new Error('No role assigned to this user.')

    // Determine redirect destination
    const roleList = roles.map((r) => r.role)
    const dest =
      roleList.includes('superadmin')
        ? '/superadmin'
        : roleList.includes('admin')
        ? '/admin'
        : '/store'

    // ✅ Redirect to the right dashboard
    const redirectUrl = new URL(dest, req.url)
    return NextResponse.redirect(redirectUrl)
  } catch (err: any) {
    console.error('❌ /api/auth/callback error:', err)
    return NextResponse.json(
      { error: err.message || 'Unexpected server error' },
      { status: 500 }
    )
  }
}
