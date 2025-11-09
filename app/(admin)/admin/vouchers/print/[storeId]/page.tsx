'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { voucherToDataUrl } from '@/lib/qrcode'
import QRCodeStyling from 'qr-code-styling'
import { useRef } from 'react'

export default function PrintVouchersPage() {
  const supabase = createClientComponentClient()
  const params = useParams()
  const searchParams = useSearchParams()
  const storeId = params.storeId as string

  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  /* 🟢 Load vouchers filtered by date range */
  useEffect(() => {
    if (!storeId) return
    ;(async () => {
      setLoading(true)
      let query = supabase
        .from('vouchers')
        .select('id, code, status, created_at')
        .eq('store_id', storeId)
        .eq('status', 'blank')
        .order('created_at', { ascending: true })

      if (from) query = query.gte('created_at', from)
      if (to) query = query.lte('created_at', to + 'T23:59:59')

      const { data, error } = await query
      if (error) console.error('Supabase error:', error)
      setVouchers(data || [])
      setLoading(false)
    })()
  }, [storeId, from, to, supabase])

  // 🖨 Auto print after load
  useEffect(() => {
    if (!loading && vouchers.length > 0) {
      const timer = setTimeout(() => window.print(), 800)
      return () => clearTimeout(timer)
    }
  }, [loading, vouchers])

  return (
    <div
      className="
        bg-white text-black min-h-screen
        flex flex-col items-center justify-start
        p-4 print:p-0
      "
    >
      {/* ===== Header for Screen Only ===== */}
      <div className="print:hidden flex justify-between items-center w-full max-w-5xl mb-4">
        <h1 className="text-lg font-semibold">🧾 Voucher Batch</h1>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700"
        >
          Print Now
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 py-10 text-sm">Loading vouchers...</div>
      ) : vouchers.length === 0 ? (
        <div className="text-gray-500 py-10 text-sm">
          No vouchers found in this date range.
        </div>
      ) : (
        <div className="print-area w-full flex justify-center">
          <div
            className="
              grid 
              grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
              gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-6
              print:grid-cols-5 print:gap-x-2 print:gap-y-2
              w-full max-w-[210mm] max-h-[270mm] mx-auto
            "
          >
            {vouchers.map((v) => (
              <VoucherCard key={v.id} code={v.code} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Voucher Card ---------------- */
function VoucherCard({ code }: { code: string }) {
  const qrRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  // detect screen width → choose QR size
  const isMobile = window.innerWidth < 640 // sm breakpoint
  const size = isMobile ? 120 : 180 // smaller on phone, bigger on desktop

  const qr = new QRCodeStyling({
    width: size,
    height: size,
    data: voucherDeepLink(voucher.code),
    margin: 6,
    dotsOptions: {
      color: '#00B686', // Tayseer green
      type: 'rounded',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    image: '/icon-192.png',
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 5,
    },
  })

  if (qrRef.current) {
    qrRef.current.innerHTML = ''
    qr.append(qrRef.current)
  }
}, [code])

  return (
    <div
      className="
        border border-gray-300 rounded-md text-center 
        flex flex-col items-center justify-center
        w-[42vw] h-[42vw] sm:w-[30vw] sm:h-[30vw] md:w-[35mm] md:h-[35mm] lg:w-[40mm] lg:h-[40mm]
        bg-white shadow-sm print:shadow-none print:border-gray-200
      "
    >
      <div ref={qrRef} className="flex-1 flex items-center justify-center" />
      <p className="text-[10px] font-medium tracking-widest mt-1 mb-2 select-none">
        {code}
      </p>
    </div>
  )
}