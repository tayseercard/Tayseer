import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ must be service role key
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, address, wilaya } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1️⃣ Generate a secure temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'

    // 2️⃣ Create user in Supabase Auth
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: 'store_owner', name },
    })
    if (userError) throw userError

    // 3️⃣ Insert the store record
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

    // 4️⃣ Configure the mail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or use 'smtp.yourdomain.com'
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // 5️⃣ Compose the email
    const mailOptions = {
      from: `"Tayseer" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Tayseer Store Account',
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2 style="color:#059669;">Welcome to Tayseer 🎁</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your store account has been created successfully.</p>
          <p><b>Temporary password:</b> <code>${tempPassword}</code></p>
          <p>You can log in now and change your password in your dashboard.</p>
          <hr />
          <p style="font-size: 12px; color: gray;">Tayseer Platform • Algeria</p>
        </div>
      `,
    }

    // 6️⃣ Send the email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      store,
      temp_password: tempPassword,
    })
  } catch (err: any) {
    console.error('Error creating store:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
