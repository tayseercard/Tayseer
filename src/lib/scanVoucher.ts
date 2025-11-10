import { SupabaseClient } from '@supabase/supabase-js'

type VoucherResult<T = any> = {
  data: T | null
  error: string | null
}

/**
 * Scans a QR code value or deep link and returns the voucher record if found.
 * @param supabase - Supabase client instance
 * @param result - raw QR scan result (full URL or code)
 */
export async function scanVoucher(
  supabase: SupabaseClient,
  result: string | null
): Promise<VoucherResult> {
  if (!result) return { data: null, error: 'No QR result detected.' }

  try {
    const code = result.includes('/') ? result.split('/').pop()!.trim() : result.trim()

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
