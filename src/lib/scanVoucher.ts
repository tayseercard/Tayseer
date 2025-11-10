import { SupabaseClient } from '@supabase/supabase-js'

type VoucherResult<T = any> = {
  data: T | null
  error: string | null
}

/**
 * Scans a QR code value or deep link and returns the voucher record if found.
 * Handles both `/verify/` and `/v/` links, with or without trailing slashes or query params.
 */
export async function scanVoucher(
  supabase: SupabaseClient,
  result: string | null
): Promise<VoucherResult> {
  if (!result) return { data: null, error: 'No QR result detected.' }

  try {
    // 🧠 Extract voucher code from any type of URL or raw string
    let code: string | null = null

    // 1️⃣ Handle URLs like https://tayseercard.vercel.app/v/MKD-D1D50C8C
    const match = result.match(/(?:\/v\/|\/verify\/)([A-Za-z0-9\-]+)/)
    if (match) {
      code = match[1]
    } else {
      // 2️⃣ Fallback: strip query params, slashes, etc.
      const cleaned = result.split(/[?#]/)[0].trim().replace(/\/+$/, '')
      code = cleaned.split('/').pop()?.trim() || null
    }

    if (!code) {
      return { data: null, error: 'Invalid QR format.' }
    }

    // ✅ Query Supabase for the voucher
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (error) {
      console.error('Supabase error:', error)
      return { data: null, error: 'Database error.' }
    }

    if (!data) {
      return { data: null, error: `Voucher ${code} not found.` }
    }

    return { data, error: null }
  } catch (e: any) {
    console.error('scanVoucher error:', e)
    return { data: null, error: e.message || 'Unexpected error scanning QR.' }
  }
}
