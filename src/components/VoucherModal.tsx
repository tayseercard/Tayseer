'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode'
import { useLanguage } from '@/lib/useLanguage'

type Voucher = {
  recipient_name: string | null
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
  const { t, lang } = useLanguage() // ✅ get translations + current language
  const [url, setUrl] = useState<string | null>(null)
  const [buyerName, setBuyerName] = useState(voucher.buyer_name ?? '')
  const [recipientName, setRecipientName] = useState(voucher.recipient_name ?? '')
  const [buyerPhone, setBuyerPhone] = useState(voucher.buyer_phone ? formatPhone(voucher.buyer_phone) : '')
  const [amount, setAmount] = useState(voucher.initial_amount && voucher.initial_amount > 0 ? voucher.initial_amount : '')
  const [autoFilled, setAutoFilled] = useState(false)
  const [consumeAmount, setConsumeAmount] = useState('')
  const [saving, setSaving] = useState(false)

  // used for debounce
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  // Phone number validation
  const [phoneValid, setPhoneValid] = useState(true)


  useEffect(() => {
    voucherToDataUrl(voucher.code).then(setUrl)
  }, [voucher.code])

  // 🧠 Live lookup of client info as the user types phone
  useEffect(() => {
    if (!buyerPhone || buyerPhone.length < 6) {
      setAutoFilled(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData.session?.user
        if (!user) return

        // get store_id of this user
        const { data: roleRow } = await supabase
          .from('me_effective_role')
          .select('store_id')
          .eq('user_id', user.id)
          .maybeSingle()

        const storeId = roleRow?.store_id
        if (!storeId) return

        // check if client exists
        const { data: existing } = await supabase
          .from('clients')
          .select('full_name')
          .eq('store_id', storeId)
          .eq('phone', cleanPhone(buyerPhone))
          .maybeSingle()

        if (existing) {
          setBuyerName(existing.full_name || buyerName)
          setAutoFilled(true)
        } else {
          setAutoFilled(false)
        }
      } catch (err) {
        console.error('Auto-fill failed:', err)
      }
    }, 400) // wait 400 ms after typing stops

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [buyerPhone])

  /* 🟢 Activate voucher */
 async function handleActivate() {
  if (!buyerName || !amount)
    return alert('Please enter buyer name and amount.')

  if (!isValidPhone(buyerPhone))
    return alert('Invalid phone number format.')

  setSaving(true)

  try {
    // 🧠 1️⃣ Get session user
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) throw new Error('No session found')

    // 🏪 2️⃣ Get store_id for this store user
    const { data: roleRow, error: roleError } = await supabase
      .from('me_effective_role')
      .select('store_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (roleError) throw roleError

    const storeId = roleRow?.store_id
    if (!storeId) throw new Error('Missing store_id')

    const phoneClean = cleanPhone(buyerPhone)

    // 👥 3️⃣ Check if client exists
    const { data: existingClient, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('store_id', storeId)
      .eq('phone', phoneClean)
      .maybeSingle()
    if (clientError) console.warn('Client lookup failed:', clientError.message)

    // ➕ 4️⃣ Create client if missing
    if (!existingClient) {
      const { error: insertError } = await supabase.from('clients').insert([
        {
          store_id: storeId,
          full_name: buyerName.trim(),
          phone: phoneClean,
          created_at: new Date().toISOString(),
        },
      ])
      if (insertError)
        console.warn('⚠️ Failed to add client:', insertError.message)
      else console.log('✅ New client added:', buyerName)
    }

    // 💳 5️⃣ Activate the voucher
    const { error: voucherError } = await supabase
      .from('vouchers')
      .update({
        buyer_name: buyerName.trim(),
        recipient_name: recipientName.trim(),
        buyer_phone: phoneClean,
        initial_amount: Number(amount),
        balance: Number(amount),
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', voucher.id)
    if (voucherError) throw voucherError

    alert('✅ Voucher activated successfully!')
    onRefresh()
    onClose()
  } catch (err: any) {
    console.error(err)
    alert('❌ ' + (err.message || 'Activation failed'))
  } finally {
    setSaving(false)
  }
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
    <div  dir={lang === 'ar' ? 'rtl' : 'ltr'}
     className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div
        className="
          relative w-full max-w-md rounded-2xl
          bg-[var(--bg)]/95 backdrop-blur-md
          border border-[var(--c-bank)]/25
          shadow-[0_8px_24px_rgba(0,0,0,0.08)]
          p-5 animate-[fadeIn_0.25s_ease-out]
        "
      >
        {/* === Close === */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 text-[var(--c-text)]/60 hover:text-[var(--c-text)] transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* === Title === */}
        <div  dir={lang === 'ar' ? 'rtl' : 'ltr'} className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-[var(--c-primary)] tracking-tight">
            {t.voucherDetails}
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

        {/* === Blank → Activation form === */}
        {voucher.status === 'blank' ? (
          <>
            <div className="space-y-3 mb-4">
              <Input label="Buyer Name" value={buyerName} onChange={setBuyerName} />
              <Input label="To Whom?" value={recipientName} onChange={setRecipientName} />

              <div className="relative">
  <label className="text-sm text-gray-600">Buyer Phone</label>
  <input
    value={buyerPhone}
    onChange={(e) => {
      const formatted = formatPhone(e.target.value)
      setBuyerPhone(formatted)
      setPhoneValid(isValidPhone(formatted))
    }}
    placeholder="0x xx xx xx xx"
    maxLength={14}
    inputMode="numeric"
    pattern="[0-9 ]*"
    className={`w-full border rounded-md p-2 text-sm focus:outline-none transition
      ${phoneValid
        ? 'border-[var(--c-bank)]/30 focus:border-[var(--c-accent)]'
        : 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
      } tracking-widest font-medium`}
  />

  {autoFilled && phoneValid && (
    <p className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--c-accent)] font-medium">
      {t.existingClient} ✓
    </p>
  )}
  {!phoneValid && (
    <p className="text-[11px] text-rose-600 mt-1">{t.invalidPhone}</p>
  )}
</div>



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
            {/* === Active voucher details === */}
            {voucher.status === 'active' && (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3 items-center mb-3">
                  <div className="space-y-1 text-xs sm:text-sm">
                    <Info label={t.buyer} value={voucher.buyer_name ?? '—'} />
                    <Info label={t.phone} value={voucher.buyer_phone ?? '—'} />
                    <Info label={t.toWhom} value={voucher.recipient_name ?? '—'} />
                    <Info label={t.initial} value={fmtDZD(voucher.initial_amount, lang)} />
<Info label={t.balance} value={fmtDZD(voucher.balance, lang)} />
                  </div>

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
                      className="text-[10px] text-[var(--c-bank)] hover:underline mt-1 break-all text-center"
                    >
                      {voucher.activated_at ?? '—'}
                    </a>
                  </div>
                </div>

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
                    className="rounded-md bg-[var(--c-bank)] text-white px-3 py-2 text-sm font-medium hover:bg-[var(--c-bank)]/90 active:scale-[0.97] transition"
                  >
                    {t.consumePartial}
                  </button>
                  <button
                    onClick={() => handleConsume(false)}
                    className="rounded-md bg-[var(--c-accent)] text-white px-3 py-2 text-sm font-medium hover:bg-[var(--c-accent)]/90 active:scale-[0.97] transition"
                  >
                    {t.consumeAll}
                  </button>
                </div>

                <p className="text-[11px] text-[var(--c-text)]/60 text-center">
                  💡 Enter an amount or consume the full voucher.
                </p>
              </div>
            )}
          </>
        )}

        <button
          onClick={onClose}
          className="
            w-full mt-5 rounded-lg border border-[var(--c-bank)]/30
            px-4 py-2 text-sm text-[var(--c-text)]/80
            hover:bg-white/60 active:scale-[0.97] transition
          "
        >
         {t.close}
        </button>
      </div>
    </div>
  )
}


// ✅ Format Algerian phone number: "0561827855" → "05 61 82 78 55"
function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '') // remove non-numbers
  const groups = digits.match(/.{1,2}/g) || []
  return groups.join(' ').trim().slice(0, 14) // ensure max 14 chars
}

// ✅ Normalize for database lookup (remove spaces)
function cleanPhone(input: string): string {
  return input.replace(/\D/g, '')
}

// ✅ Check validity (Algerian mobile pattern)
function isValidPhone(input: string): boolean {
  const clean = cleanPhone(input)
  return /^0[5-7]\d{8}$/.test(clean)
}


/* --- Small Components --- */
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

function fmtDZD(n: number, lang: 'fr' | 'en' | 'ar' = 'fr') {
  const locale =
    lang === 'ar' ? 'ar-DZ' :
    lang === 'en' ? 'en-DZ' :
    'fr-DZ'

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'DZD',
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${n} DZD`
  }
}
