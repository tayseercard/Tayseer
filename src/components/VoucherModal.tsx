'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode'

type Voucher = {
  id: string
  code: string
  buyer_name: string | null
  buyer_phone?: string | null
  initial_amount: number
  balance: number
  status: 'blank' | 'active' | 'redeemed' | 'expired' | 'void'
  activated_at?: string | null
  created_at: string
}

export default function VoucherModal({
  voucher,
  supabase,
  onClose,
  onRefresh,
}: {
  voucher: Voucher
  supabase: any
  onClose: () => void
  onRefresh: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [buyerName, setBuyerName] = useState(voucher.buyer_name ?? '')
  const [buyerPhone, setBuyerPhone] = useState(voucher.buyer_phone ?? '')
  const [amount, setAmount] = useState(
    voucher.initial_amount > 0 ? voucher.initial_amount : ''
  )
  const [consumeAmount, setConsumeAmount] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    voucherToDataUrl(voucher.code).then(setUrl)
  }, [voucher.code])

  /* 🟢 Activate voucher */
  async function handleActivate() {
    if (!buyerName || !amount) {
      alert('Please enter buyer name and amount.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('vouchers')
      .update({
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim() || null,
        initial_amount: Number(amount),
        balance: Number(amount),
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', voucher.id)
    setSaving(false)
    if (error) return alert('❌ ' + error.message)
    alert('✅ Voucher activated successfully')
    onRefresh()
    onClose()
  }

  /* 🔵 Consume part or full voucher */
  async function handleConsume(partial = true) {
    const consumeValue = partial ? Number(consumeAmount) : voucher.balance
    if (!consumeValue || consumeValue <= 0)
      return alert('Enter a valid amount to consume.')
    if (consumeValue > voucher.balance)
      return alert('Amount exceeds current balance.')
    if (!confirm(`Confirm consuming ${fmtDZD(consumeValue)} ?`)) return

    const newBalance = voucher.balance - consumeValue
    const newStatus = newBalance <= 0 ? 'redeemed' : 'active'

    const { error } = await supabase
      .from('vouchers')
      .update({
        balance: newBalance,
        status: newStatus,
      })
      .eq('id', voucher.id)

    if (error) return alert('❌ ' + error.message)

    alert(
      newStatus === 'redeemed'
        ? '✅ Voucher fully consumed.'
        : `✅ ${fmtDZD(consumeValue)} consumed. Remaining ${fmtDZD(
            newBalance
          )}.`
    )
    onRefresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold mb-3">Voucher Details</h2>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-4">
          {url ? (
            <img src={url} alt="QR" className="h-32 w-32 rounded border" />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded" />
          )}
          <a
            href={voucherDeepLink(voucher.code)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline mt-1 break-all"
          >
            {voucherDeepLink(voucher.code)}
          </a>
        </div>

        {/* Blank → Activation form */}
        {voucher.status === 'blank' ? (
          <>
            <div className="space-y-3 mb-4">
              <Input
                label="Buyer Name"
                value={buyerName}
                onChange={setBuyerName}
              />
              <Input
                label="Buyer Phone"
                value={buyerPhone}
                onChange={setBuyerPhone}
              />
              <Input
                label="Amount (DZD)"
                type="number"
                value={amount}
                onChange={setAmount}
              />
            </div>
            <button
              onClick={handleActivate}
              disabled={saving}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Activate Voucher'}
            </button>
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm mb-4">
              <Info label="Buyer" value={voucher.buyer_name ?? '—'} />
              <Info label="Phone" value={voucher.buyer_phone ?? '—'} />
              <Info label="Status" value={voucher.status} />
              <Info label="Balance" value={fmtDZD(voucher.balance)} />
              <Info label="Initial" value={fmtDZD(voucher.initial_amount)} />
              <Info label="Activated" value={voucher.activated_at ?? '—'} />
            </div>

            {/* Active → Consumption controls */}
            {voucher.status === 'active' && (
              <div className="space-y-3">
                <Input
                  label="Consume Amount (DZD)"
                  type="number"
                  value={consumeAmount}
                  onChange={setConsumeAmount}
                  placeholder="e.g. 1000"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleConsume(true)}
                    className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Consume Partial
                  </button>
                  <button
                    onClick={() => handleConsume(false)}
                    className="flex-1 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                  >
                    Consume All
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  )
}

/* --- Reusable small components --- */
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b py-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: any
  onChange: (val: any) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-md p-2 text-sm"
      />
    </div>
  )
}

function fmtDZD(n: number) {
  try {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${n} DZD`
  }
}
