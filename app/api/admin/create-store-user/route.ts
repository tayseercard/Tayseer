import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// === Supabase Admin Client ===
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🟢 not anon key
);

// === Resend Email Client ===
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, address, wilaya } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // 1️⃣ Generate temp password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const tempPassword = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    // 2️⃣ Create Supabase Auth user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });
    if (userError) throw userError;

    const userId = user?.user?.id;

    // 3️⃣ Insert store row
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert([
        {
          name,
          email,
          phone: phone || null,
          address: address || null,
          wilaya: wilaya ? Number(wilaya) : null,
          owner_user_id: userId,
          temp_password: tempPassword,
          temp_password_set: true,
        },
      ])
      .select('*')
      .single();

    if (storeError) throw storeError;

    // 4️⃣ Send welcome email
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://https://tayseer.vercel.app'}/auth/login`;

    await resend.emails.send({
      from: 'tayseer <tayseercard@gmail.com>',
      to: email,
      subject: '🎁 Welcome to tayseer — Your Store Access',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:20px;background:#f9fafb;border-radius:12px">
          <h2 style="color:#16a34a;">Welcome to tayseer 🎉</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your store has been successfully registered on the tayseer platform.</p>
          <p>You can now log in with the following credentials:</p>
          <ul style="background:#fff;padding:12px;border-radius:8px;border:1px solid #ddd">
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Temporary Password:</strong> ${tempPassword}</li>
          </ul>
          <p style="margin-top:10px;">
            👉 <a href="${loginUrl}" style="color:#16a34a;font-weight:bold;">Login to your dashboard</a>
          </p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;" />
          <p style="font-size:12px;color:#6b7280;">
            Please change your password immediately after your first login for security reasons.
          </p>
          <p style="font-size:12px;color:#9ca3af;">— The tayseer Team</p>
        </div>
      `,
    });

    // 5️⃣ Return success response
    return NextResponse.json({
      success: true,
      store,
      temp_password: tempPassword,
      email_sent: true,
    });
  } catch (err: any) {
    console.error('Create store API error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
