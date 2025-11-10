'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import QRCodeStyling from 'qr-code-styling'

const CARDS_PER_PAGE = 50// 🔧 adjust per page (A4 usually fits 15–20)

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
      const timer = setTimeout(() => window.print(), 1000)
      return () => clearTimeout(timer)
    }
  }, [loading, vouchers])

  // ➕ Split vouchers into pages
  const pages = []
  for (let i = 0; i < vouchers.length; i += CARDS_PER_PAGE) {
    pages.push(vouchers.slice(i, i + CARDS_PER_PAGE))
  }

  return (
    <div className="bg-white text-black min-h-screen flex flex-col items-center p-4 print:p-0">
      {/* ===== Header (hidden during print) ===== */}
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
        <div className="print-area w-full flex flex-col items-center">
          {pages.map((page, pageIndex) => (
            <div
              key={pageIndex}
              className={`
                page-block
                grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-5
                gap-3 print:gap-x-[6mm] print:gap-y-[6mm]
                w-full max-w-[210mm] mx-auto
                print:p-[5mm]
                ${pageIndex < pages.length - 1 ? 'print:page-break-after' : ''}
              `}
            >
              {page.map((v) => (
                <VoucherCard key={v.id} code={v.code} />
              ))}
            </div>
          ))}
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
    const qrSize = 100
    const qr = new QRCodeStyling({
      width: qrSize,
      height: qrSize,
      data: `https://tayseercard.vercel.app/v/${encodeURIComponent(code)}`,
      margin: 1,
      dotsOptions: { color: '#00B686', type: 'rounded' },
      backgroundOptions: { color: '#ffffff' },
      image: '/icon-192.png',
      imageOptions: { crossOrigin: 'anonymous', margin: 1 },
    })
    qrRef.current.innerHTML = ''
    qr.append(qrRef.current)
  }, [code])

  return (
    <div
      className="
        voucher-card
        border border-gray-300 rounded-md bg-white
        flex flex-col items-center justify-center
        w-[85px] h-[85px] sm:w-[95px] sm:h-[95px] md:w-[90px] md:h-[90px]
        shadow-sm print:shadow-none print:border-gray-200
        p-2 print:p-1
        break-inside-avoid
      "
    >
      <div ref={qrRef} className="flex items-center justify-center h-full w-full" />
      <p className="text-[7px] font-medium tracking-widest mt-1 select-none">
        {code}
      </p>
    </div>
  )
}

/* ✅ Add global print CSS in same file or globals.css:
@media print {
  .page-block {
    page-break-after: always;
    page-break-inside: avoid;
  }
  .break-inside-avoid {
    break-inside: avoid;
  }
}
*/
