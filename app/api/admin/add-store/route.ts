export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, phone, address, wilaya } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing required fields (name or email)" },
        { status: 400 }
      );
    }

    // 1️⃣ Check if the user already exists
    const { data: list, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let user = list.users.find((u) => u.email === email);
    let createdNew = false;
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";

    // 2️⃣ Create new Auth user if needed
    if (!user) {
      const { data: created, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { role: "store_owner" },
        });
      if (createError) throw createError;
      user = created.user;
      createdNew = true;
    }

    // 3️⃣ Create the store
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .insert([
        { name, email, phone, address, wilaya, status: "open", user_id: user.id },
      ])
      .select()
      .single();
    if (storeError) throw storeError;

    // 4️⃣ Assign role in me_effective_role
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

    // 5️⃣ Optional: send email via Resend (if available)
    if (createdNew && process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Welcome to Tayseer 🎁",
            html: `
              <div style="font-family:sans-serif;line-height:1.5;">
                <h2 style="color:#059669;">Welcome to Tayseer 🎁</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Your store account has been created successfully.</p>
                <p><b>Temporary password:</b> <code>${tempPassword}</code></p>
                <p>You can log in and change your password at any time.</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.warn("⚠️ Resend email failed:", (e as Error).message);
      }
    }

    // 6️⃣ Return JSON result
    return NextResponse.json({
      success: true,
      created_new_user: createdNew,
      store,
      temp_password: createdNew ? tempPassword : undefined,
    });
  } catch (err: any) {
    console.error("❌ Error creating store:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
