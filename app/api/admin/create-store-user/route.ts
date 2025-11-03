import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { name, email, phone, address, wilaya } = await req.json()
    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'

    // Create Supabase Auth user
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: 'store_owner', name },
    })
    if (userError) throw userError

    // Insert store record
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .insert([
        {
          name,
          email,
          phone,
          address,
          wilaya,
          status: 'open',
          user_id: user.user.id,
        },
      ])
      .select()
      .single()
    if (storeError) throw storeError

    // Configure Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password
      },
    })

    // Compose and send the email
    await transporter.sendMail({
      from: `"Tayseer" <${process.env.SMTP_USER}>`,
      to: email, // ✅ real store email
      subject: 'Your Tayseer Store Account',
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2 style="color:#059669;">Welcome to Tayseer 🎁</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your store account has been created successfully.</p>
          <p><b>Temporary password:</b> <code>${tempPassword}</code></p>
          <p>You can log in and change your password later.</p>
          <hr />
          <p style="font-size: 12px; color: gray;">Tayseer Platform • Algeria</p>
        </div>
      `,
    })

    return NextResponse.json({ store, temp_password: tempPassword })
  } catch (err: any) {
    console.error('❌ Error creating store:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
