'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import QRCodeStyling from 'qr-code-styling'

const CARDS_PER_ROW =5
const ROWS_PER_PAGE = 6
const CARDS_PER_PAGE = CARDS_PER_ROW * ROWS_PER_PAGE // 40 per A4 sheet

export default function PrintVouchersPage() {
  const supabase = createClientComponentClient()
  const params = useParams()
  const searchParams = useSearchParams()
  const storeId = params.storeId as string

  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  /* Load vouchers */
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

  // Auto print
  useEffect(() => {
    if (!loading && vouchers.length > 0) {
      setTimeout(() => window.print(), 1000)
    }
  }, [loading, vouchers])

  // Split into pages
  const pages = []
  for (let i = 0; i < vouchers.length; i += CARDS_PER_PAGE) {
    pages.push(vouchers.slice(i, i + CARDS_PER_PAGE))
  }

  return (
    <div className="bg-white text-black min-h-screen flex flex-col items-center p-4 print:p-0">
      
      {/* Hidden during print */}
      <div className="print:hidden mb-4 flex justify-between w-full max-w-4xl">
        <h1 className="text-xl font-semibold">Voucher Batch Printing</h1>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Print Now
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-gray-500">Loading vouchers...</div>
      ) : pages.length === 0 ? (
        <div className="py-10 text-gray-500">No vouchers found.</div>
      ) : (
        <div className="w-full flex flex-col items-center print-area">
          {pages.map((page, pageIndex) => (
            <div
              key={pageIndex}
className={`
  page-block 
  grid 
  grid-cols-5
  grid-rows-[repeat(6,38mm)]
  gap-[6mm]
  p-[10mm]
  w-[210mm]
  h-[270mm]
  bg-white
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

/* ---------------- Voucher Card with CUT MARKS ---------------- */
function VoucherCard({ code }: { code: string }) {
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!qrRef.current) return
    const qr = new QRCodeStyling({
      width: 100,
      height: 100,
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
    <div className="relative flex flex-col items-center justify-center w-[38mm] h-[38mm] border border-gray-300 p-2 bg-white break-inside-avoid">
      
      {/* Cut Marks (Corners) */}
      <div className="absolute -top-[2mm] left-1/2 w-[10mm] h-[0.2mm] bg-black"></div>
      <div className="absolute -bottom-[2mm] left-1/2 w-[10mm] h-[0.2mm] bg-black"></div>
      <div className="absolute top-1/2 -left-[2mm] h-[10mm] w-[0.2mm] bg-black"></div>
      <div className="absolute top-1/2 -right-[2mm] h-[10mm] w-[0.2mm] bg-black"></div>

      {/* QR CODE */}
      <div ref={qrRef} className="flex items-center justify-center h-full w-full" />

    
    </div>
  )
}

/* -------------- GLOBAL PRINT CSS -------------- */

//
// Add in this same file or inside globals.css
//
/*
@media print {
  @page {
    size: A4;
    margin: 0;
  }

  .page-block {
    page-break-after: always;
    page-break-inside: avoid;
  }

  .break-inside-avoid {
    break-inside: avoid;
  }
}
*/
