import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 🔐 Admin Supabase client (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, store_id, store_name, full_name, phone } = body

    if (!email || !store_id) {
      return NextResponse.json(
        { error: 'Missing fields: email or store_id' },
        { status: 400 }
      )
    }

    // 🌍 Redirect URL (used in invite link)
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://tayseercard.vercel.app'
    const redirectUrl = `${siteUrl}/auth/set-password?email=${encodeURIComponent(email)}`

    // 1️⃣ Invite cashier (sends an email via Supabase)
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
      })

    if (inviteError) throw inviteError

    const userId = inviteData.user?.id
    if (!userId) throw new Error('❌ Failed to create or invite user.')

    // 2️⃣ Assign role in me_effective_role
    const { error: roleError } = await supabaseAdmin.from('me_effective_role').upsert([
      {
        user_id: userId,
        store_id,
        role: 'cashier',
        store_name: store_name || null,
      },
    ])

    if (roleError) throw roleError

    // 3️⃣ (Optional) Add to cashiers table for contact info
    await supabaseAdmin.from('cashiers').upsert([
      {
        user_id: userId,
        store_id,
        full_name: full_name || email.split('@')[0],
        email,
        phone: phone || null,
      },
    ])

    // ✅ Success response
    return NextResponse.json({
      success: true,
      message: `✅ Invitation sent to ${email}`,
      user: inviteData.user,
    })
  } catch (err: any) {
    console.error('Add cashier error:', err)
    return NextResponse.json(
      { error: err.message || 'Server error inviting cashier' },
      { status: 500 }
    )
  }
}
