import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, store_id, store_name } = body

    if (!email || !store_id) {
      return NextResponse.json({ error: 'Missing fields: email or store_id' }, { status: 400 })
    }

    // ✅ Define redirect domain explicitly
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tayseercard.vercel.app'
    const redirectUrl = `${siteUrl}/auth/callback?type=invite`

    // 1️⃣ Invite user by email (sends email with link)
    const { data: user, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
    })
    if (inviteError) throw inviteError

    const userId = user.user?.id
    if (!userId) throw new Error('User creation failed')

    // 2️⃣ Insert or update cashier role in me_effective_role
    const { error: insertError } = await supabaseAdmin
      .from('me_effective_role')
      .upsert([
        {
          user_id: userId,
          store_id,
          role: 'cashier',
          store_name: store_name || null,
        },
      ])
    if (insertError) throw insertError

    // 3️⃣ Return success response
    return NextResponse.json({
      success: true,
      message: `✅ Invitation sent to ${email}`,
      user: user.user,
    })
  } catch (err: any) {
    console.error('Add cashier error:', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
