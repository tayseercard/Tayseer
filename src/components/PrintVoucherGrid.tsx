'use client'

import { useEffect, useState } from 'react'
import { voucherToDataUrl } from '@/lib/qrcode'

type Voucher = {
  id: string
  code: string
  created_at?: string
}

export default function PrintVoucherGrid({ vouchers }: { vouchers: Voucher[] }) {
  const [withQR, setWithQR] = useState<(Voucher & { qr: string })[]>([])

  useEffect(() => {
    if (vouchers.length === 0) return
    ;(async () => {
      const qrData = await Promise.all(
        vouchers.map(async (v) => ({
          ...v,
          qr: await voucherToDataUrl(v.code),
        }))
      )
      setWithQR(qrData)
    })()
  }, [vouchers])

  if (withQR.length === 0)
    return <div className="text-gray-500 text-sm text-center py-10">Preparing QR codes…</div>

  return (
    <div className="print-area p-5 bg-white">
      <div className="grid grid-cols-7 gap-3">
        {withQR.map((v) => (
          <div
            key={v.id}
            className="voucher-card flex flex-col justify-center items-center border border-gray-300 rounded-md text-center w-24 h-24"
          >
            <img src={v.qr} alt={v.code} className="h-10 w-10 mb-1" />
            <p className="font-mono text-[10px]">{v.code}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
