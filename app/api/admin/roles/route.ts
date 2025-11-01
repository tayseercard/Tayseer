import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ✅ Helper to check if current user is superadmin
async function assertSuperAdmin() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data: roles, error } = await supabase
    .from('me_effective_role')
    .select('role')
    .eq('user_id', user.id)

  if (error) throw error
  const isSuper = roles?.some((r) => r.role === 'superadmin')
  if (!isSuper) throw new Error('Forbidden')

  return { user }
}

//
// 🟩 CREATE role (POST)
//
export async function POST(req: Request) {
  try {
    await assertSuperAdmin()
    const { email, role, store_id, store_name } = await req.json()

    if (!email || !role)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Create user if not exists
    const { data: list } = await supabaseAdmin.auth.admin.listUsers()
    let user = list?.users.find((u) => u.email === email)

    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      })
      if (error) throw error
      user = data.user
    }

    const { error: insertErr } = await supabaseAdmin.from('me_effective_role').insert([
      {
        user_id: user.id,
        role,
        store_id: store_id || null,
        store_name: store_name || null,
      },
    ])
    if (insertErr) throw insertErr

    return NextResponse.json({ success: true, user })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

//
// 🟨 UPDATE role (PUT)
//
export async function PUT(req: Request) {
  try {
    await assertSuperAdmin()
    const { id, role, store_id, store_name } = await req.json()

    if (!id || !role)
      return NextResponse.json({ error: 'Missing id or role' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('me_effective_role')
      .update({
        role,
        store_id: store_id || null,
        store_name: store_name || null,
      })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}

//
// 🟥 DELETE role (DELETE)
//
export async function DELETE(req: Request) {
  try {
    await assertSuperAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id)
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('me_effective_role')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
