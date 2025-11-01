import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { name, address, phone, email, wilaya } = await req.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('❌ Missing Supabase credentials in environment variables');
      return NextResponse.json({ error: 'Server misconfiguration (missing keys)' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabaseAdmin
      .from('stores')
      .insert([
        {
          name: name.trim(),
          address: address?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          wilaya: wilaya ? Number(wilaya) : null,
        },
      ])
      .select();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ✅ Always return JSON even if no data
    return NextResponse.json({ ok: true, store: data?.[0] || null });
  } catch (err: any) {
    console.error('💥 Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
