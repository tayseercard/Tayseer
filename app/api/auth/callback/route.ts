import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    console.log("🟢 /api/auth/callback triggered");

    const supabase = createRouteHandlerClient({ cookies });

    // Try to fetch the session explicitly
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ getSession error:", error);
      return NextResponse.json(
        { error: error.message, step: "getSession" },
        { status: 500 }
      );
    }

    console.log("✅ Session found:", !!data.session);

    // Return session info to browser
    return NextResponse.json({
      success: true,
      hasSession: !!data.session,
      user: data.session?.user?.email || null,
    });
  } catch (e: any) {
    console.error("💥 Unhandled error in callback:", e);
    return NextResponse.json(
      { error: e.message || e.toString(), step: "catch" },
      { status: 500 }
    );
  }
}
