'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import QRCodeStyling from 'qr-code-styling'

const CARDS_PER_ROW = 5
const ROWS_PER_PAGE = 6
const CARDS_PER_PAGE = CARDS_PER_ROW * ROWS_PER_PAGE // 40 per A4 sheet

export default function PrintVouchersPage() {
  const supabase = createClientComponentClient()
  const params = useParams()
  const searchParams = useSearchParams()
  const storeId = params.storeId as string

  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalCode, setModalCode] = useState<string | null>(null)

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
    if (!loading && vouchers.length > 0 && window.innerWidth > 768) {
      setTimeout(() => window.print(), 800)
    }
  }, [loading, vouchers])

  // Split into pages
  const pages = []
  for (let i = 0; i < vouchers.length; i += CARDS_PER_PAGE) {
    pages.push(vouchers.slice(i, i + CARDS_PER_PAGE))
  }

  return (
    <div className="bg-white text-black min-h-screen flex flex-col items-center px-3 py-4 print:p-0">

      {/* HEADER (hidden in print) */}
      <div className="print:hidden w-full max-w-xl flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Batch QR Printing</h1>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded bg-emerald-600 text-white"
        >
          Print
        </button>
      </div>

      {/* MOBILE UI */}
      <div className="print:hidden w-full max-w-xl">

        {loading ? (
          <div className="py-10 text-gray-500 text-center">Loading…</div>
        ) : vouchers.length === 0 ? (
          <div className="py-10 text-gray-500 text-center">No vouchers found.</div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              {vouchers.length} vouchers ready
            </p>

            {/* Mobile scrollable grid */}
            <div className="grid grid-cols-3 gap-3">
              {vouchers.map((v) => (
                <MobileVoucherCard
                  key={v.id}
                  code={v.code}
                  onPreview={() => setModalCode(v.code)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* DESKTOP PRINT LAYOUT */}
      <div className="hidden print:flex flex-col items-center print-area">
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

      {/* MOBILE QR MODAL */}
      {modalCode && (
        <MobilePreviewModal code={modalCode} onClose={() => setModalCode(null)} />
      )}
    </div>
  )
}

/* ---------------- MOBILE CARD ---------------- */
function MobileVoucherCard({ code, onPreview }: any) {
  return (
    <div
      onClick={onPreview}
      className="border rounded-md p-4 bg-white text-center active:scale-95 transition shadow-sm cursor-pointer"
    >
      <div className="text-[10px] text-gray-600 mb-1">Voucher</div>
      <div className="font-semibold text-[11px]">{code}</div>
    </div>
  )
}

/* ---------------- MOBILE PREVIEW MODAL ---------------- */
function MobilePreviewModal({ code, onClose }: any) {
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!qrRef.current) return

    const qr = new QRCodeStyling({
      width: 220,
      height: 220,
      data: `https://tayseercard.vercel.app/v/${code}`,
      margin: 2,
      dotsOptions: { color: '#00B686', type: 'rounded' },
      backgroundOptions: { color: '#ffffff' },
      image: '/icon-192.png',
      imageOptions: { crossOrigin: 'anonymous', margin: 2 },
    })

    qrRef.current.innerHTML = ''
    qr.append(qrRef.current)
  }, [code])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-5 w-[90%] max-w-xs text-center">
        <h3 className="font-semibold mb-3">Voucher QR</h3>
        <div ref={qrRef} className="mx-auto mb-4"></div>

        <div className="text-xs text-gray-500 mb-4">{code}</div>

        <button
          onClick={onClose}
          className="w-full bg-gray-200 py-2 rounded-md text-sm"
        >
          Close
        </button>
      </div>
    </div>
  )
}

/* ---------------- DESKTOP A4 VOUCHER CARD ---------------- */
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

      {/* Cut Marks */}
      <div className="absolute -top-[2mm] left-1/2 w-[10mm] h-[0.2mm] bg-black"></div>
      <div className="absolute -bottom-[2mm] left-1/2 w-[10mm] h-[0.2mm] bg-black"></div>
      <div className="absolute top-1/2 -left-[2mm] h-[10mm] w-[0.2mm] bg-black"></div>
      <div className="absolute top-1/2 -right-[2mm] h-[10mm] w-[0.2mm] bg-black"></div>

      <div ref={qrRef} className="flex items-center justify-center h-full w-full" />
    </div>
  )
}
