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
    gap-4 sm:gap-5 md:gap-6
    print:grid-cols-5 print:gap-3
    w-full max-w-[210mm] mx-auto
    print:p-4
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
    if (!qrRef.current) return

    // ✅ Detect device type → adjust QR size dynamically
    const isMobile = window.innerWidth < 640 // sm breakpoint
    const qrSize = isMobile ? 100 : 160 // smaller on phones, medium for print

    const qr = new QRCodeStyling({
      width: qrSize,
      height: qrSize,
      data: `https://tayseer.vercel.app/v/${encodeURIComponent(code)}`,
      margin: 4,
      dotsOptions: {
        color: '#00B686', // Tayseer green
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      image: '/icon-192.png', // your logo in center
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 4,
      },
    })

    qrRef.current.innerHTML = ''
    qr.append(qrRef.current)
  }, [code])

  return (
    <div
      className="
    border border-gray-300 rounded-md text-center 
    flex flex-col items-center justify-center
    w-[35vw] h-[35vw] sm:w-[32vw] sm:h-[32vw] md:w-[36mm] md:h-[36mm]
    bg-white shadow-sm print:shadow-none print:border-gray-200
    p-2 sm:p-3 print:p-2
  "
    >
      <div
        ref={qrRef}
        className="flex items-center justify-center scale-[0.85] sm:scale-100"
      />
      <p className="text-[10px] font-medium tracking-widest mt-1 mb-2 select-none">
        {code}
      </p>
    </div>
  )
}
