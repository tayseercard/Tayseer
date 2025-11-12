import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ⚠️ Use the admin client (service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, store_id, store_name } = body

    if (!email || !store_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // 1️⃣ Create (or upsert) the user
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
    if (createError) throw createError

    const userId = user.user?.id
    if (!userId) throw new Error('User creation failed')

    // 2️⃣ Add role in me_effective_role
    const { error: insertError } = await supabaseAdmin.from('me_effective_role').upsert([
      {
        user_id: userId,
        store_id,
        role: 'cashier',
      },
    ])
    if (insertError) throw insertError

    // 3️⃣ Optional: Send custom email via Tayseer (for branding)
    // You can integrate with Resend, Brevo, or Supabase SMTP config.

    return NextResponse.json({ success: true, user })
  } catch (err: any) {
    console.error('Add cashier error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
