export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🟢 Incoming body:", body);
    const { name, email, phone, address, wilaya } = body;

    console.log("🔑 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "🔑 Service key prefix:",
      process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8)
    );

    if (!name || !email)
      return NextResponse.json(
        { error: "Missing name or email" },
        { status: 400 }
      );

    // 🧪 Test Supabase connectivity first
    const { data: ping, error: pingErr } = await supabaseAdmin
      .from("stores")
      .select("id")
      .limit(1);
    if (pingErr) throw pingErr;
    console.log("✅ Supabase connectivity OK");

    // Continue with your logic...
    return NextResponse.json({ success: true, message: "Ping OK" });
  } catch (err: any) {
    console.error("❌ Internal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
