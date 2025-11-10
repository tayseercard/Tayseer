'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X } from 'lucide-react'

export default function PublicVouchersListPage() {
  const supabase = createClientComponentClient()
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const { data, error } = await supabase
          .from('vouchers_public')
          .select(
            'code, status, initial_amount, balance, currency, store_id, created_at, activated_at, expires_at'
          )
          .in('status', ['active', 'redeemed']) // ✅ only active + redeemed
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setVouchers(data || [])
      } catch (err: any) {
        console.error('💥 Fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVouchers()
  }, [supabase])

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Chargement des bons…
      </div>
    )

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        Erreur : {error}
      </div>
    )

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6 text-center">
          🎁 Bons actifs et utilisés
        </h1>

        {vouchers.length === 0 ? (
          <p className="text-gray-500 text-center">
            Aucun bon actif ou utilisé trouvé.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-t">
              <thead>
                <tr className="text-left text-gray-600 border-b bg-gray-50">
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Montant</th>
                  <th className="py-2 px-3">Reste</th>
                  <th className="py-2 px-3">Statut</th>
                  <th className="py-2 px-3">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr
                    key={v.code}
                    onClick={() => setSelected(v)}
                    className="border-b hover:bg-emerald-50 cursor-pointer transition"
                  >
                    <td className="py-2 px-3 font-mono text-xs">{v.code}</td>
                    <td className="py-2 px-3">
                      {v.initial_amount?.toLocaleString()} {v.currency}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {v.balance?.toLocaleString()} {v.currency}
                    </td>
                    <td
                      className={`py-2 px-3 font-medium capitalize ${
                        v.status === 'active'
                          ? 'text-green-600'
                          : v.status === 'redeemed'
                          ? 'text-orange-600'
                          : 'text-gray-700'
                      }`}
                    >
                      {v.status}
                    </td>
                    <td className="py-2 px-3 text-gray-500">
                      {new Date(v.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400 text-center">
          ✅ Page publique — affichant uniquement les bons{' '}
          <b>actifs</b> et <b>utilisés</b>.
        </p>
      </div>

      {selected && (
        <VoucherModal voucher={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  )
}

/* ---------------- Voucher Modal ---------------- */
function VoucherModal({
  voucher,
  onClose,
}: {
  voucher: any
  onClose: () => void
}) {
  const statusLabels: Record<string, string> = {
    active: 'Actif — prêt à être utilisé',
    redeemed: 'Déjà utilisé',
    expired: 'Expiré',
    void: 'Annulé',
    blank: 'Non encore émis',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-[95%] max-w-md text-center border border-gray-100">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-emerald-700 mb-2">
          🎁 Tayseer Voucher
        </h2>

        <p className="font-mono text-gray-700 mb-3">{voucher.code}</p>

        <p className="text-3xl font-semibold text-gray-900 mb-2">
          {voucher.initial_amount.toLocaleString()} {voucher.currency}
        </p>
        {voucher.balance !== voucher.initial_amount && (
          <p className="text-sm text-gray-600 mb-3">
            Reste : {voucher.balance.toLocaleString()} {voucher.currency}
          </p>
        )}

        <p className="text-sm text-gray-600 mb-3">
          Statut :{' '}
          <span className="font-medium text-emerald-600">
            {statusLabels[voucher.status] || voucher.status}
          </span>
        </p>

        <div className="text-xs text-gray-500 space-y-1 mb-4">
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

        <a
          href={`/v/${encodeURIComponent(voucher.code)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition"
        >
          Ouvrir la page publique →
        </a>
      </div>
    </div>
  )
}
