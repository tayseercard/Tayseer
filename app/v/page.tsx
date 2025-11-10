'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { Scanner } from '@yudiel/react-qr-scanner'
import { X } from 'lucide-react'

export default function FindYourVoucherPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [code, setCode] = useState('')
  const [voucher, setVoucher] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setError(null)
    setVoucher(null)
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('vouchers_public')
        .select(
          'code, status, initial_amount, balance, currency, store_id, created_at, activated_at, expires_at'
        )
        .ilike('code', code.trim())
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setError('❌ Aucun bon trouvé avec ce code.')
      } else {
        const { data: storeData } = await supabase
          .from('stores')
          .select('name')
          .eq('id', data.store_id)
          .maybeSingle()
        setVoucher({ ...data, store_name: storeData?.name || 'Inconnu' })
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setError('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleScan(value: string | null) {
    if (!value) return
    const scannedCode = value.includes('/')
      ? value.split('/').pop()!.trim()
      : value.trim()

    console.log('📦 Scanned:', scannedCode)
    setScannerOpen(false)
    router.push(`/v/${encodeURIComponent(scannedCode)}`)
  }

  const verifyUrl =
    voucher && `https://tayseercard.vercel.app/v/${voucher.code}`

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-center relative">
        {/* ===== Scanner Modal ===== */}
        {scannerOpen && (
          <div className="absolute inset-0 bg-white z-20 rounded-2xl flex flex-col items-center justify-center p-4">
            <button
              onClick={() => setScannerOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold mb-3 text-emerald-700">
              📷 Scanner un bon
            </h2>
            <Scanner
              onScan={(results) => handleScan(results[0]?.rawValue || null)}
              onError={(err) => console.error('Scanner error:', err)}
              constraints={{ facingMode: 'environment' }}
              styles={{ container: { width: '100%' } }}
            />
            <p className="text-xs text-gray-500 mt-3">
              Scannez le QR code d’un bon Tayseer
            </p>
          </div>
        )}

        <h1 className="text-2xl font-bold text-emerald-700 mb-3">
          🔍 Trouvez votre bon Tayseer
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          Entrez votre code ou scannez votre QR pour consulter les détails.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex : MKD-D1D50C8C"
            className="flex-1 border rounded-md p-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm"
          >
            {loading ? 'Recherche…' : 'Rechercher'}
          </button>
        </form>

        <button
          onClick={() => setScannerOpen(true)}
          className="w-full mb-6 py-2 border border-emerald-600 text-emerald-700 rounded-md text-sm hover:bg-emerald-50 transition"
        >
          📷 Scanner un QR
        </button>

        {error && (
          <p className="text-red-600 font-medium text-sm mb-3">{error}</p>
        )}

        {voucher && (
          <div
            className={`text-left text-sm space-y-1 border-t pt-3 ${
              voucher.status === 'active'
                ? 'text-green-700'
                : voucher.status === 'expired'
                ? 'text-gray-500'
                : voucher.status === 'redeemed'
                ? 'text-orange-600'
                : 'text-gray-700'
            }`}
          >
            <p>
              <strong>Magasin :</strong> {voucher.store_name}
            </p>
            <p>
              <strong>Montant :</strong>{' '}
              {voucher.initial_amount.toLocaleString()} {voucher.currency}
            </p>
            {voucher.balance !== voucher.initial_amount && (
              <p>
                <strong>Reste :</strong>{' '}
                {voucher.balance.toLocaleString()} {voucher.currency}
              </p>
            )}
            <p>
              <strong>Statut :</strong>{' '}
              <span className="capitalize">{voucher.status}</span>
            </p>
            <p>
              <strong>Émis le :</strong>{' '}
              {new Date(voucher.created_at).toLocaleDateString('fr-FR')}
            </p>
            {voucher.activated_at && (
              <p>
                <strong>Activé le :</strong>{' '}
                {new Date(voucher.activated_at).toLocaleDateString('fr-FR')}
              </p>
            )}
            {voucher.expires_at && (
              <p>
                <strong>Expire le :</strong>{' '}
                {new Date(voucher.expires_at).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}

        {voucher && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <QRCode value={verifyUrl!} size={120} />
            <p className="text-xs text-gray-500">Code : {voucher.code}</p>
            <a
              href={verifyUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 text-sm hover:underline"
            >
              Voir la page du bon →
            </a>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400">
          ✅ Ce service est public — aucune connexion requise.
        </p>
      </div>
    </main>
  )
}
