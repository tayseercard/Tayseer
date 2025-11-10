'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function PublicVoucherScanner() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)

  function handleScan(value: string | null) {
    if (!value) return
    setError(null)

    try {
      // Extract code from URL or plain string
      const code = value.includes('/')
        ? value.split('/').pop()!.trim()
        : value.trim()

      console.log('📦 Scanned code:', code)

      // Avoid scanning twice
      if (scannedCode === code) return
      setScannedCode(code)

      // ✅ Redirect directly to voucher details page
      router.push(`/v/${encodeURIComponent(code)}`)
    } catch (err: any) {
      console.error('❌ Scan error:', err)
      setError('Erreur: ' + err.message)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-sm p-5 text-center">
        <h1 className="text-2xl font-bold text-emerald-700 mb-4">
          🎁 Scanner un bon Tayseer
        </h1>

        <Scanner
          onScan={(results) => handleScan(results[0]?.rawValue || null)}
          onError={(err) => console.error('Scanner error:', err)}
          constraints={{ facingMode: 'environment' }}
          styles={{ container: { width: '100%' } }}
        />

        <p className="text-sm text-gray-500 mt-3">
          Scannez le QR code d’un bon Tayseer pour voir ses détails
        </p>

        {error && (
          <div className="mt-4 text-red-600 font-medium">{error}</div>
        )}

        {scannedCode && (
          <p className="mt-4 text-gray-600 text-sm">
            🔄 Redirection vers <strong>{scannedCode}</strong>…
          </p>
        )}

        <p className="mt-6 text-xs text-gray-400">
          (Ce scanner est public — aucune connexion requise)
        </p>
      </div>
    </main>
  )
}
