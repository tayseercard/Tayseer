import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Admin client (service role key required)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, phone, address, wilaya } = await req.json();

    if (!name || !email)
      return NextResponse.json(
        { error: "Missing store name or email" },
        { status: 400 }
      );

    // 1️⃣ Generate a secure temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";

    // 2️⃣ Check if user already exists in Supabase Auth
    const { data: list, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let user = list.users.find((u: any) => u.email === email);

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

    // 4️⃣ Insert store record — link to owner
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
          tempPassword,
          temp_password_set: false,
        },
      ])
      .select()
      .single();

    if (storeError) throw storeError;

    // ✅ Trigger will auto-link owner role
    return NextResponse.json({
      success: true,
      store,
      temp_password: tempPassword,
    });
  } catch (err: any) {
    console.error("❌ Error creating store:", err);
    // Enhanced debugging for Supabase errors
    if (err.message?.includes("duplicate")) {
      return NextResponse.json(
        { error: "Email or name already exists. Choose a different one." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
