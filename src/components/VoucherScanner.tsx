'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { scanVoucher } from '@/lib/scanVoucher'
import { Scanner } from '@yudiel/react-qr-scanner'
import { X } from 'lucide-react'
import VoucherModal from './VoucherModal'

/**
 * Universal QR voucher scanner with integrated modal.
 * Can be used in AdminLayout or any page.
 */
export default function VoucherScanner({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const supabase = createClientComponentClient()

  const [scanError, setScanError] = useState<string | null>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  /* ---------- Handle Scan ---------- */
  async function handleScan(result: string | null) {
    if (!result || loading) return
    setLoading(true)
    const { data, error } = await scanVoucher(supabase, result)
    setLoading(false)

    if (error) {
      setScanError(error)
    } else {
      setSelectedVoucher(data)
      setScanError(null)
    }
  }

  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        {/* Scanner Modal */}
        <div className="relative bg-white rounded-xl p-4 w-[95%] max-w-md shadow-lg">
          <button
            onClick={() => {
              onClose()
              setSelectedVoucher(null)
              setScanError(null)
            }}
            className="absolute right-2 top-2 text-gray-500 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>

          {!selectedVoucher ? (
            <>
              <h2 className="text-center font-medium mb-2">
                {loading ? 'Loading...' : 'Scan a voucher QR'}
              </h2>

              <Scanner
                onScan={(results) => handleScan(results[0]?.rawValue || null)}
                onError={(err) => console.error(err)}
                constraints={{ facingMode: 'environment' }}
              />

              {scanError && (
                <p className="mt-3 text-center text-sm text-rose-600">
                  {scanError}
                </p>
              )}
            </>
          ) : (
            <VoucherModal
              voucher={selectedVoucher}
              supabase={supabase}
              onClose={() => {
                setSelectedVoucher(null)
                onClose()
              }}
              onRefresh={() => setSelectedVoucher(null)} // reload later if needed
            />
          )}
        </div>
      </div>
    )
  )
}
