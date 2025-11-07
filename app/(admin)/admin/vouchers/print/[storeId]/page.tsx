// app/(admin)/admin/vouchers/print/[storeId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { voucherToDataUrl } from '@/lib/qrcode'

export default function PrintVouchersPage({ params }: { params: Promise<{ storeId: string }> }) {
  const [storeId, setStoreId] = useState<string | null>(null)
  const [vouchers, setVouchers] = useState<any[]>([])
  const supabase = createClientComponentClient()

  // ✅ Unwrap params
  useEffect(() => {
    (async () => {
      const resolved = await params
      setStoreId(resolved.storeId)
    })()
  }, [params])

  // ✅ Load vouchers when storeId available
  useEffect(() => {
    if (!storeId) return

    ;(async () => {
      const { data: voucherData } = await supabase
        .from('vouchers')
        .select('id, code, status')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true })

      setVouchers(voucherData || [])
    })()
  }, [storeId, supabase])

  return (
    <div className="p-6 bg-white text-black print:p-0">
      <h1 className="text-xl font-bold mb-4 text-center">
        Voucher Batch – Store {storeId}
      </h1>

      <div className="grid grid-cols-3 gap-4 print:grid-cols-4 print:gap-2">
        {vouchers.map((v) => (
          <VoucherCard key={v.id} code={v.code} />
        ))}
      </div>
    </div>
  )
}

function VoucherCard({ code }: { code: string }) {
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    voucherToDataUrl(code).then(setQr)
  }, [code])

  return (
    <div className="border rounded-lg p-3 text-center text-sm">
      <p className="font-medium mb-2">Voucher Code</p>
      {qr ? (
        <img src={qr} alt={code} className="mx-auto w-24 h-24" />
      ) : (
        <div className="w-24 h-24 bg-gray-100 mx-auto" />
      )}
      <p className="mt-2 font-semibold">{code}</p>
    </div>
  )
}
