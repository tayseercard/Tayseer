'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import QRCode from 'react-qr-code'

export default function PublicVoucherPage({
  params,
}: {
  params: { code: string }
}) {
  const supabase = createClientComponentClient()
  const [voucher, setVoucher] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.code) return

    ;(async () => {
      try {
        // 🔹 Fetch voucher from the public view
        const { data, error } = await supabase
          .from('vouchers_public')
          .select(
            'code, status, initial_amount, balance, currency, store_id, created_at, activated_at, expires_at'
          )
          .eq('code', params.code)
          .maybeSingle()

        console.log('Voucher fetch →', data, error)

        if (error || !data) {
          setError('Voucher introuvable ou non valide ❌')
          return
        }

        // 🔹 Fetch public store name
        let storeName = 'Inconnu'
        const { data: storeData, error: storeErr } = await supabase
          .from('stores')
          .select('name')
          .eq('id', data.store_id)
          .maybeSingle()

        if (!storeErr && storeData?.name) storeName = storeData.name

        setVoucher({ ...data, store_name: storeName })
      } catch (err) {
        console.error('Public voucher error:', err)
        setError('Erreur de connexion au serveur ❌')
      } finally {
        setLoading(false)
      }
    })()
  }, [params.code, supabase])

  // 🕓 Loading screen
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Vérification en cours…
      </div>
    )

  // ❌ Error screen
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600 text-center px-6">
        <h1 className="text-2xl font-semibold mb-2">Erreur</h1>
        <p>{error}</p>
      </div>
    )

  // === STATUS COLORS ===
  const statusColors: Record<string, string> = {
    active: 'text-green-600',
    redeemed: 'text-orange-500',
    expired: 'text-gray-400',
    void: 'text-red-600',
    blank: 'text-gray-300',
  }

  // === STATUS LABELS ===
  const statusLabels: Record<string, string> = {
    active: 'Actif — prêt à être utilisé',
    redeemed: 'Déjà utilisé',
    expired: 'Expiré',
    void: 'Annulé',
    blank: 'Non encore émis',
  }

  const verifyUrl = `https://tayseercard.vercel.app/v/${encodeURIComponent(
    voucher.code
  )}`

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-6 text-center border border-gray-100">
        <h1 className="text-2xl font-bold text-emerald-700 mb-2">
          🎁 Tayseer Voucher
        </h1>

        <p className="text-gray-700 mb-4">
          <span className="font-medium">Magasin :</span>{' '}
          {voucher.store_name || 'Inconnu'}
        </p>

        <div className="my-3">
          <p className="text-3xl font-semibold text-gray-900">
            {voucher.initial_amount.toLocaleString()} {voucher.currency}
          </p>
          {voucher.balance !== voucher.initial_amount && (
            <p className="text-sm text-gray-600">
              Reste : {voucher.balance.toLocaleString()} {voucher.currency}
            </p>
          )}
        </div>

        <p
          className={`mt-3 font-semibold ${
            statusColors[voucher.status] || 'text-gray-500'
          }`}
        >
          {statusLabels[voucher.status] || voucher.status}
        </p>

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>
            Émis le {new Date(voucher.created_at).toLocaleDateString('fr-FR')}
          </p>
          {voucher.activated_at && (
            <p>
              Activé le{' '}
              {new Date(voucher.activated_at).toLocaleDateString('fr-FR')}
            </p>
          )}
          {voucher.expires_at && (
            <p>
              Expire le{' '}
              {new Date(voucher.expires_at).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>

        {/* === QR CODE PREVIEW === */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <QRCode value={verifyUrl} size={140} />
          <p className="text-xs text-gray-500">
            📱 Scannez pour vérifier ce bon sur{' '}
            <span className="font-medium text-gray-700">
              tayseercard.vercel.app
            </span>
          </p>
        </div>

        <hr className="my-5 border-gray-200" />

        <p className="text-xs text-gray-400">
          ✅ Vérifié par <strong>Tayseer</strong> — bon cadeau authentique.
        </p>
      </div>
    </main>
  )
}
