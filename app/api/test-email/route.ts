import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to } = body

    if (!to) {
      return NextResponse.json({ error: 'Missing "to" address' }, { status: 400 })
    }

    // ✅ Send email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Tayseer <${process.env.SMTP_USER || 'onboarding@resend.dev'}>`,
        to,
        subject: '📨 Test Email from Tayseer',
        html: `
          <div style="font-family: sans-serif; line-height: 1.6;">
            <h2 style="color:#059669;">🎁 Tayseer Test Email</h2>
            <p>Hello, this is a test email to confirm that your Resend integration works.</p>
            <p style="font-size:12px;color:#777;">Tayseer Platform • Algeria</p>
          </div>
        `,
      }),
    })

    const result = await res.json()

    if (!res.ok) throw new Error(result.error?.message || 'Failed to send email')

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (err: any) {
    console.error('❌ Test email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Optional GET handler to quickly verify deployment
export async function GET() {
  return NextResponse.json({ message: '✅ Tayseer test-email endpoint ready' })
}
