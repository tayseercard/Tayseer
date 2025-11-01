

// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw Error("NEXT_PUBLIC_SUPABASE_URL is required.");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw Error("SUPABASE_SERVICE_ROLE_KEY is required.");
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // ⚠️ must be service role key
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);
