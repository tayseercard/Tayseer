import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to } = body

    if (!to) {
      return NextResponse.json({ error: 'Missing "to" address' }, { status: 400 })
    }

    // 1️⃣ Configure the transporter (same config you use for create-store-user)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or host/port if custom domain
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // 2️⃣ Verify the connection (optional, helps debug)
    await transporter.verify()
    console.log('✅ SMTP connection verified')

    // 3️⃣ Send the test email
    const info = await transporter.sendMail({
      from: `"Tayseer Test" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Test Email from Tayseer',
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2 style="color:#059669;">📨 Test Email Successful</h2>
          <p>If you received this, your SMTP is configured correctly!</p>
          <p style="font-size:12px;color:gray">Sent via Nodemailer from Tayseer API</p>
        </div>
      `,
    })

    console.log('📤 Email sent:', info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (err: any) {
    console.error('❌ Test email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
