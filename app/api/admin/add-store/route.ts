export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Admin client (use Service Role Key — never expose this client-side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, phone, address, wilaya } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Missing store name or email" },
        { status: 400 }
      );
    }

    // 1️⃣ Generate secure temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";

    // 2️⃣ Check if user already exists in Supabase Auth
    const { data: list, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let user = list?.users.find((u: any) => u.email === email);

    // 3️⃣ Create user if not found
    if (!user) {
      const { data, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { role: "store_owner" },
        });
      if (createError) throw createError;
      user = data.user;
    }

    // 4️⃣ Insert store record — with proper snake_case mapping
    const { data: store, error: storeError } = await supabaseAdmin
      .from("stores")
      .insert([
        {
          name,
          email,
          phone,
          address,
          wilaya,
          owner_user_id: user.id,
          temp_password: tempPassword,  // ✅ correct snake_case
          temp_password_set: false,     // ✅ correct snake_case
        },
      ])
      .select()
      .single();

    if (storeError) throw storeError;

    // ✅ Your DB triggers handle me_effective_role automatically
    return NextResponse.json({
      success: true,
      store,
      temp_password: tempPassword,
    });

  } catch (err: any) {
    console.error("❌ Error creating store:", err);

    // 🧩 Handle duplicate constraint errors clearly
    if (err.message?.includes("duplicate")) {
      return NextResponse.json(
        { error: "Email or store name already exists." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
