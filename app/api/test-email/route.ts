import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { to } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev', // ✅ Sandbox sender
      to,
      subject: '✅ Tayseer Email Test via Resend Sandbox',
      html: `<p>✅ Success! Your Resend connection works.</p>`,
    }),
  })

  const text = await res.text()
  console.log('Resend response:', text)

  if (!res.ok) return NextResponse.json({ error: text }, { status: res.status })
  return NextResponse.json({ success: true, result: JSON.parse(text) })
}
