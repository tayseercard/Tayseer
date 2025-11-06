'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode'

type Voucher = {
  id: string
  code: string
  buyer_name: string | null
  buyer_phone?: string | null
  to_whom?: string | null
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
    if (!buyerName || !amount) return alert('Please enter buyer name and amount.')
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

  /* 🔵 Consume voucher */
  async function handleConsume(partial = true) {
    const consumeValue = partial ? Number(consumeAmount) : voucher.balance
    if (!consumeValue || consumeValue <= 0) return alert('Enter a valid amount.')
    if (consumeValue > voucher.balance)
      return alert('Amount exceeds current balance.')
    if (!confirm(`Confirm consuming ${fmtDZD(consumeValue)} ?`)) return

    const newBalance = voucher.balance - consumeValue
    const newStatus = newBalance <= 0 ? 'redeemed' : 'active'
    const { error } = await supabase
      .from('vouchers')
      .update({ balance: newBalance, status: newStatus })
      .eq('id', voucher.id)

    if (error) return alert('❌ ' + error.message)

    alert(
      newStatus === 'redeemed'
        ? '✅ Voucher fully consumed.'
        : `✅ ${fmtDZD(consumeValue)} consumed. Remaining ${fmtDZD(newBalance)}.`
    )
    onRefresh()
    onClose()
  }

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
    <div
      className="
        relative w-full max-w-md rounded-2xl
        bg-[var(--bg)]/95 backdrop-blur-md
        border border-[var(--c-bank)]/25
        shadow-[0_8px_24px_rgba(0,0,0,0.08)]
        p-5 animate-[fadeIn_0.25s_ease-out]
      "
    >
      {/* === Close Button === */}
      <button
        onClick={onClose}
        className="absolute right-2 top-2 text-[var(--c-text)]/60 hover:text-[var(--c-text)] transition"
      >
        <X className="h-4 w-4" />
      </button>

      {/* === Header: Title + Status === */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--c-primary)] tracking-tight">
          Voucher Details
        </h2>
        <span
          className={`
            text-xs px-2 py-1 rounded-full font-medium capitalize
            ${
              voucher.status === 'active'
                ? 'bg-[var(--c-accent)]/10 text-[var(--c-accent)]'
                : voucher.status === 'blank'
                ? 'bg-[var(--c-bank)]/10 text-[var(--c-bank)]'
                : 'bg-gray-100 text-gray-600'
            }
          `}
        >
          {voucher.status}
        </span>
      </div>

      {/* === Blank → Activation Form === */}
      {voucher.status === 'blank' ? (
        <>
          <div className="space-y-3 mb-4">
            <Input label="Buyer Name" value={buyerName} onChange={setBuyerName} />
            <Input label="Buyer Phone" value={buyerPhone} onChange={setBuyerPhone} />
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
            className="
              w-full rounded-lg bg-[var(--c-accent)]
              px-4 py-2 text-sm font-medium text-white
              hover:bg-[var(--c-accent)]/90
              active:scale-[0.97] transition disabled:opacity-50
            "
          >
            {saving ? 'Saving…' : 'Activate Voucher'}
          </button>
        </>
      ) : (
        <>
          {/* === Active → Details + Consumption Controls === */}
          {voucher.status === 'active' && (
            <div className="space-y-3 mt-2">

              {/* === Buyer Info + QR === */}
              <div className="grid grid-cols-2 gap-3 items-center mb-3">
                {/* Left: Buyer Info */}
                <div className="space-y-1 text-xs sm:text-sm">
                  <Info label="Buyer" value={voucher.buyer_name ?? '—'} />
                  <Info label="Phone" value={voucher.buyer_phone ?? '—'} />
                  <Info label="To whom" value={voucher.to_whom ?? '—'} />
                  <Info label="Initial" value={fmtDZD(voucher.initial_amount)} />
                  <Info label="Balance" value={fmtDZD(voucher.balance)} />
                </div>

                {/* Right: QR */}
                <div className="flex flex-col items-center justify-center">
                  {url ? (
                    <img
                      src={url}
                      alt="QR"
                      className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg border border-[var(--c-bank)]/30 shadow-sm bg-white/80 p-1.5"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-[var(--section-bg)]/60" />
                  )}
                  <a
                    href={voucherDeepLink(voucher.code)}
                    target="_blank"
                    rel="noreferrer"
                    className="
                      text-[10px] text-[var(--c-bank)] hover:underline mt-1 break-all text-center
                    "
                  >
                    {voucher.activated_at ?? '—'}
                  </a>
                </div>
              </div>

              {/* === Consume Controls === */}
              <Input
                label="Consume Amount (DZD)"
                type="number"
                value={consumeAmount}
                onChange={setConsumeAmount}
                placeholder="e.g. 1000"
              />

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => handleConsume(true)}
                  className="
                    rounded-md bg-[var(--c-bank)] text-white
                    px-3 py-2 text-sm font-medium
                    hover:bg-[var(--c-bank)]/90 active:scale-[0.97]
                    transition
                  "
                >
                  Consume Partial
                </button>
                <button
                  onClick={() => handleConsume(false)}
                  className="
                    rounded-md bg-[var(--c-accent)] text-white
                    px-3 py-2 text-sm font-medium
                    hover:bg-[var(--c-accent)]/90 active:scale-[0.97]
                    transition
                  "
                >
                  Consume All
                </button>
              </div>

              <p className="text-[11px] text-[var(--c-text)]/60 text-center">
                💡 Enter an amount or consume the full voucher.
              </p>
            </div>
          )}
        </>
      )}

      {/* === Close Button === */}
      <button
        onClick={onClose}
        className="
          w-full mt-5 rounded-lg border border-[var(--c-bank)]/30
          px-4 py-2 text-sm text-[var(--c-text)]/80
          hover:bg-white/60 active:scale-[0.97] transition
        "
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
    <div className="flex justify-between border-b border-[var(--c-bank)]/10 py-1">
      <span className="text-[var(--c-text)]/60">{label}</span>
      <span className="font-medium text-[var(--c-text)]">{value}</span>
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
      <label className="text-sm text-[var(--c-text)]/70 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full border border-[var(--c-bank)]/30 rounded-md
          p-2 text-sm bg-white/90 backdrop-blur-sm
          focus:ring-2 focus:ring-[var(--c-accent)]/40 outline-none
        "
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
