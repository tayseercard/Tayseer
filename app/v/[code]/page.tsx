'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import QRCode from 'react-qr-code'
import { Gift, Store, Calendar, User } from 'lucide-react'

export default function PublicVoucherPage() {
  const { code } = useParams()
  const supabase = createClientComponentClient()
  const [voucher, setVoucher] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
      ; (async () => {
        try {
          const { data, error } = await supabase
            .from('vouchers_public')
            .select(
              `code, status, initial_amount, balance, currency,
             buyer_name, recipient_name, store_id,
             created_at, activated_at, expires_at`
            )
            .eq('code', code)
            .maybeSingle()

          if (error) throw error
          if (!data) {
            setError('Ce bon est introuvable ou non valide ❌')
            return
          }

          // Fetch store name & logo (optional)
          const { data: store } = await supabase
            .from('stores')
            .select('name, logo_url, address, phone')
            .eq('id', data.store_id)
            .maybeSingle()

          setVoucher({
            ...data,
            store_name: store?.name || 'Magasin inconnu',
            store_logo_url: store?.logo_url,
            store_address: store?.address,
            store_phone: store?.phone
          })
        } catch (err: any) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      })()
  }, [code])

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Vérification en cours…
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <Gift className="h-10 w-10 text-rose-500 mb-3" />
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Erreur</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    )

  const verifyUrl = `https://tayseercard.vercel.app/v/${voucher.code}`

  const statusColors: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50',
    redeemed: 'text-orange-600 bg-orange-50',
    expired: 'text-gray-500 bg-gray-50',
    void: 'text-red-600 bg-red-50',
  }

  const statusLabels: Record<string, string> = {
    active: 'Actif — prêt à être utilisé',
    redeemed: 'Déjà utilisé',
    expired: 'Expiré',
    void: 'Annulé',
  }

  const clientName = voucher.buyer_name || '—'

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white px-4 py-8">
      <div
        className="relative w-full max-w-md bg-white/90 backdrop-blur-md shadow-lg rounded-3xl border border-gray-100 
                   overflow-hidden p-6 sm:p-8 animate-fade-in"
      >
        {/* Header: Logo & Store Name */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm mb-3">
            {voucher.store_logo_url ? (
              <img src={voucher.store_logo_url} alt="Store Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <Store className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 px-4">{voucher.store_name}</h1>
          {voucher.store_address && (
            <p className="text-sm text-gray-500 mt-1 px-4 leading-tight">
              {voucher.store_address}
            </p>
          )}
        </div>

        {/* Amount */}
        {/* Amount */}
        <div className="mt-4 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Solde Actuel</p>
          <p className="text-4xl sm:text-5xl font-extrabold text-[#020035]">
            {voucher.balance.toLocaleString()} <span className="text-2xl text-gray-400 font-bold">{voucher.currency}</span>
          </p>

          <p className="text-sm text-gray-500 mt-2 font-medium">
            Montant initial : {voucher.initial_amount.toLocaleString()} {voucher.currency}
          </p>
        </div>

        {/* Status */}
        <div className='flex justify-center'>
          <div
            className={`mt-4 inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[voucher.status] || 'bg-gray-100 text-gray-600'
              }`}
          >
            {statusLabels[voucher.status] || voucher.status}
          </div>
        </div>

        {/* Divider */}
        <hr className="my-6 border-gray-200" />

        {/* Details */}
        <div className="space-y-3 text-sm text-gray-700 mt-6">
          <div className="flex items-start gap-3">
            <Store className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span className="font-medium">{voucher.store_name}</span>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span className="font-medium break-words">Acheteur: {clientName}</span>
          </div>
          {voucher.recipient_name && (
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span className="font-medium break-words">Bénéficiaire: {voucher.recipient_name}</span>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              Émis le {new Date(voucher.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          {voucher.expires_at && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
              <span>
                Expire le{' '}
                {new Date(voucher.expires_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>



        {/* Footer */}
        <p className="mt-6 text-[11px] text-gray-400 text-center">
          ✅ Vérifié par <strong className="text-emerald-600">{voucher.store_name}</strong> — bon
          cadeau authentique.
        </p>
      </div>
    </main>
  )
}
