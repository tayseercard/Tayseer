export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { name, email, phone, address, wilaya } = await req.json()

    if (!name || !email)
      return NextResponse.json({ error: 'Missing name or email' }, { status: 400 })

    // 1️⃣ Check if user already exists
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    let user = list.users.find((u) => u.email === email)
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'

    // 2️⃣ Create user if not existing
    if (!user) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: 'store_owner' },
      })
      if (createError) throw createError
      user = created.user
    }

    // 3️⃣ Insert store — let triggers handle linking & role assignment
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .insert([
        {
          name,
          email,
          phone,
          address,
          wilaya,
          owner_user_id: user.id,
          temp_password: tempPassword,
          temp_password_set: true,
        },
      ])
      .select()
      .single()
    if (storeError) throw storeError

    // 4️⃣ Optional: send email via Resend sandbox (works to your Gmail only)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Welcome to Tayseer 🎁',
            html: `
              <div style="font-family:sans-serif;line-height:1.6;">
                <h2 style="color:#059669;">Welcome to Tayseer 🎁</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Your store account has been created successfully.</p>
                <p><b>Temporary password:</b> <code>${tempPassword}</code></p>
                <p>You can log in now and change your password anytime.</p>
              </div>
            `,
          }),
        })
      } catch (e) {
        console.warn('⚠️ Email sending failed:', (e as Error).message)
      }
    }

    return NextResponse.json({
      success: true,
      store,
      temp_password: tempPassword,
    })
  } catch (err: any) {
    console.error('❌ Error creating store:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
