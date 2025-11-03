import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, phone, address, wilaya } = await req.json();

    if (!name || !email)
      return NextResponse.json({ error: "Missing store name or email" }, { status: 400 });

    // 1️⃣ Find or create user
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let user = list.users.find((u: any) => u.email === email);

    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";

    if (!user) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: "store_owner" },
      });
      if (createError) throw createError;
      user = created.user;
    }

    // 2️⃣ Create the store
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .insert([{ name, email, phone, address, wilaya, status: "open" }])
      .select()
      .single();
    if (storeError) throw storeError;

    // 3️⃣ Add role
    const { error: roleError } = await supabaseAdmin
      .from("me_effective_role")
      .insert([
        {
          user_id: user.id,
          role: "store_owner",
          store_id: store.id,
          store_name: store.name,
        },
      ]);
    if (roleError && !roleError.message.includes("duplicate key")) throw roleError;

    // 4️⃣ Send welcome email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Tayseer" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to Tayseer",
      html: `
        <div style="font-family:sans-serif;line-height:1.5;">
          <h2 style="color:#059669;">Welcome to Tayseer 🎁</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your store account has been created successfully.</p>
          <p><b>Temporary password:</b> <code>${tempPassword}</code></p>
          <p>You can log in and change your password at any time.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      store,
      temp_password: tempPassword,
    });
  } catch (err: any) {
    console.error("❌ Error creating store:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
