import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 👑 Admin client with Service Role Key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔍 Optional filters
    const storeId = searchParams.get("store_id");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

    // 📄 Pagination
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 🧠 Build query dynamically (join store name)
    let query = supabaseAdmin
      .from("vouchers")
      .select("*, stores(name)", { count: "exact" }) // 👈 join store name
      .order("created_at", { ascending: false })
      .range(from, to);

    if (storeId) query = query.eq("store_id", storeId);
    if (status && status !== "all") query = query.eq("status", status);
    if (q)
      query = query.or(`code.ilike.%${q}%,buyer_name.ilike.%${q}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    // 🪄 Optional: flatten store_name for convenience
    const vouchers = (data || []).map((v: any) => ({
      ...v,
      store_name: v.stores?.name ?? null,
    }));

    return NextResponse.json({ vouchers, count, page, limit });
  } catch (err: any) {
    console.error("❌ Error fetching all vouchers:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
