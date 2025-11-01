import { createClient } from '@supabase/supabase-js';

export async function sendEmail(to: string, subject: string, html: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, html },
  });

  if (error) console.error('❌ Email error:', error);
}
