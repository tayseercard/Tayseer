import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ Supabase admin client (service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json()
    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and newPassword required' }, { status: 400 })
    }

    // 1️⃣ Find the user
    const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers()
    if (findError) throw findError

    const user = users?.users?.find((u: any) => u.email === email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2️⃣ Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })
    if (updateError) throw updateError

    return NextResponse.json({ success: true, user_id: user.id })
  } catch (err: any) {
    console.error('❌ Error setting password:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
