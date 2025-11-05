// /lib/scanVoucher.ts
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Scans a QR code value or deep link and returns the voucher record if found.
 * @param supabase - Supabase client instance
 * @param result - raw QR scan result (full URL or code)
 */
export async function scanVoucher(
  supabase: SupabaseClient,
  result: string | null
) {
  if (!result) return { data: null, error: 'No QR result detected.' }

  try {
    const code = result.includes('/')
      ? result.split('/').pop()!.trim()
      : result.trim()

    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (error || !data) {
      return { data: null, error: 'Voucher not found.' }
    }

    return { data, error: null }
  } catch (e: any) {
    return { data: null, error: e.message || 'Unexpected error scanning QR.' }
  }
}
