'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Printer } from 'lucide-react'
import { voucherToDataUrl, voucherDeepLink } from '@/lib/qrcode'
import { useLanguage } from '@/lib/useLanguage'
import QRCodeStyling from 'qr-code-styling'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
  security_pin?: string | null
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
  const { t, lang } = useLanguage()
  const [buyerName, setBuyerName] = useState(voucher.buyer_name ?? '')
  const [recipientName, setRecipientName] = useState(voucher.recipient_name ?? '')
  const [buyerPhone, setBuyerPhone] = useState(voucher.buyer_phone ? formatPhone(voucher.buyer_phone) : '')
  const [amount, setAmount] = useState(voucher.initial_amount && voucher.initial_amount > 0 ? voucher.initial_amount : '')
  const [securityPin, setSecurityPin] = useState(voucher.security_pin ?? '')
  const [autoFilled, setAutoFilled] = useState(false)
  const [consumeAmount, setConsumeAmount] = useState('')
  const [consumePin, setConsumePin] = useState('')

  const handlePinChange = (e: any) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setConsumePin(val)
  }

  const handleAmountChange = (val: string) => {
    setConsumeAmount(val.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
  }

  const handleSecurityPinChange = (val: string) => {
    setSecurityPin(val.replace(/\D/g, '').slice(0, 4))
  }

  const handleAmountEditChange = (val: string) => {
    setAmount(val.replace(/,/g, '.').replace(/[^0-9.]/g, ''))
  }
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [isPinStep, setIsPinStep] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const qrRefActive = useRef<HTMLDivElement>(null)
  const qrRefBlank = useRef<HTMLDivElement>(null)
  const qrRefRedeemed = useRef<HTMLDivElement>(null)
  const [qrPng, setQrPng] = useState<string | null>(null)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [phoneValid, setPhoneValid] = useState(true)

  // ✅ Detect role
  useEffect(() => {
    async function fetchRole() {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      let role = session?.user?.user_metadata?.role ?? null

      if (!role && session?.user?.id) {
        const { data: roleData, error } = await supabase
          .from('me_effective_role')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (error) console.warn('Role lookup failed:', error.message)
        role = roleData?.role ?? null
      }
      setUserRole(role)
    }
    fetchRole()
  }, [supabase])

  // ✅ QR Code Rendering
  useEffect(() => {
    const target =
      voucher.status === "blank" ? qrRefBlank.current :
        voucher.status === "active" ? qrRefActive.current :
          voucher.status === "redeemed" ? qrRefRedeemed.current :
            null;

    if (!target) return;

    const size = window.innerWidth < 640 ? 110 : 140;

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      data: voucherDeepLink(voucher.code),
      margin: 8,
      dotsOptions: { color: '#020035', type: 'rounded' },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#020035' },
    });

    target.innerHTML = "";
    qr.append(target);

    qr.getRawData("png").then((blob) => {
      if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        setQrPng(url);
      }
    });
  }, [voucher.code, voucher.status]);

  // ✅ Auto-fill client info
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

        const { data: roleRow } = await supabase
          .from('me_effective_role')
          .select('store_id')
          .eq('user_id', user.id)
          .maybeSingle()

        const storeId = roleRow?.store_id
        if (!storeId) return

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
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [buyerPhone])

  /* 🟢 Activate voucher */
  async function handleActivate() {
    if (!buyerName || !amount || !securityPin)
      return toast.error('Veuillez remplir tous les champs obligatoires.')

    if (!isValidPhone(buyerPhone))
      return toast.error('Format de téléphone invalide.')

    setSaving(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) throw new Error('Session non trouvée')

      const { data: roleRow } = await supabase
        .from('me_effective_role')
        .select('store_id')
        .eq('user_id', user.id)
        .maybeSingle()

      const storeId = roleRow?.store_id
      const phoneClean = cleanPhone(buyerPhone)

      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('store_id', storeId)
        .eq('phone', phoneClean)
        .maybeSingle()

      if (!existingClient) {
        await supabase.from('clients').insert([
          {
            store_id: storeId,
            full_name: buyerName.trim(),
            phone: phoneClean,
            created_at: new Date().toISOString(),
          },
        ])
      }

      const { error: voucherError } = await supabase
        .from('vouchers')
        .update({
          buyer_name: buyerName.trim(),
          recipient_name: recipientName.trim(),
          buyer_phone: phoneClean,
          initial_amount: Number(amount),
          balance: Number(amount),
          security_pin: securityPin,
          status: 'active',
          activated_at: new Date().toISOString(),
          activated_by: user.id,
        })
        .eq('id', voucher.id)

      if (voucherError) throw voucherError

      toast.success('✅ Voucher activé avec succès !')
      onRefresh()
      onClose()
    } catch (err: any) {
      toast.error('❌ ' + (err.message || 'Échec de l\'activation'))
    } finally {
      setSaving(false)
    }
  }

  /* 🔵 Consume voucher */
  /* 🔵 Consume voucher */
  async function handleConsume(partial = true) {
    const consumeValue = partial ? Number(consumeAmount) : voucher.balance
    if (!consumeValue || consumeValue <= 0) return toast.error('Montant invalide.')

    if (consumeValue > voucher.balance)
      return toast.error('Le montant dépasse le solde disponible.')

    // Step 1: Check for PIN requirement
    if (voucher.security_pin && !isPinStep) {
      setIsPinStep(true)
      return
    }

    // Step 2: Validate PIN if required
    if (voucher.security_pin && isPinStep) {
      if (!consumePin) return toast.error('PIN requis pour la consommation.')
      if (consumePin !== voucher.security_pin) return toast.error('❌ PIN incorrect.')
    }

    if (!confirm(`Confirmer le débit de ${fmtDZD(consumeValue, lang)} ?`)) return

    const newBalance = voucher.balance - consumeValue
    const newStatus = newBalance <= 0 ? 'redeemed' : 'active'
    const { error } = await supabase
      .from('vouchers')
      .update({ balance: newBalance, status: newStatus })
      .eq('id', voucher.id)

    if (error) return toast.error('❌ ' + error.message)

    toast.success('✅ Opération réussie.')
    onRefresh()
    onClose()
  }

  /* ✏️ Edit Active Voucher */
  async function handleEditSave() {
    const a = Number(amount)
    if (!a || a <= 0) return toast.error('Montant invalide.')

    setSaving(true)
    const { error } = await supabase
      .from('vouchers')
      .update({
        buyer_name: buyerName.trim(),
        buyer_phone: cleanPhone(buyerPhone),
        initial_amount: a,
        balance: a,
        security_pin: securityPin,
      })
      .eq('id', voucher.id)
      .eq('status', 'active')

    setSaving(false)
    if (error) return toast.error('❌ ' + error.message)
    toast.success('✅ Voucher mis à jour.')
    setEditMode(false)
    onRefresh()
  }

  function handlePrintQROnly() {
    if (!qrPng) return toast.error("Le code QR est en cours de génération...");
    const win = window.open("", "_blank", "width=400,height=500");
    win!.document.write(`
      <html>
        <head>
          <title>Imprimer QR</title>
          <style>
            @page { margin: 0; }
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { width: 300px; height: 300px; }
          </style>
        </head>
        <body>
          <img src="${qrPng}" />
          <script>
            window.onload = () => { window.print(); window.onafterprint = window.close; }
          </script>
        </body>
      </html>
    `);
    win!.document.close();
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-xl p-4 pt-20 md:pt-10 pb-24 md:pb-4 overflow-y-auto">

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="
          relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
          bg-white/95 backdrop-blur-xl border border-white/50
          shadow-[0_20px_50px_rgba(0,0,0,0.15)]
          rounded-[2.5rem] p-5 md:p-8
        "
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 md:right-6 md:top-6 h-10 w-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-[#020035] transition-all hover:bg-gray-100 active:scale-95 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {isPinStep ? (
          <div className="flex flex-col gap-6 md:gap-8 h-full animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg md:text-xl font-black text-[#020035] leading-tight">Confirmer le débit</h2>
                <p className="text-xs text-gray-400 mt-1">Veuillez autoriser cette transaction par PIN</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center space-y-8">
              <div className="w-full max-w-[200px]">
                <input
                  type="password"
                  value={consumePin}
                  onChange={handlePinChange}
                  placeholder="****"
                  maxLength={4}
                  className="w-full text-center text-4xl font-black bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 focus:border-[#ED4B00] focus:bg-white outline-none transition-all tracking-[0.5em] placeholder:tracking-normal text-[#020035]"
                />
              </div>
              <div className="w-full max-w-sm flex flex-col items-center gap-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50 text-center">
                <span className="text-amber-500 text-xs">★</span>
                <p className="text-[10px] font-bold text-amber-600/80 leading-relaxed uppercase">
                  Code PIN confidentiel, à ne pas partager qu'avec la personne bénéficiaire.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsPinStep(false)}
                className="w-full text-center text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#020035] transition py-4 border border-gray-100 rounded-xl hover:bg-gray-50 bg-white"
              >
                Retour
              </button>
              <button
                onClick={() => handleConsume(true)}
                className="w-full bg-[#020035] text-white rounded-xl py-4 text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-indigo-900/10"
              >
                Confirmer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            {/* Header Area */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 pr-10 md:pr-0">
              <div className="flex flex-col">
                <h2 className="text-lg md:text-xl font-black text-[#020035] leading-tight">{t.voucherDetails}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={voucher.status} />
                  <span className="text-[10px] font-mono text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{voucher.code}</span>
                </div>
              </div>

            </div>

            {voucher.status === 'blank' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Desktop: Side-by-side | Mobile: Stacked */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left Column: Essential Info */}
                  <div className="order-2 md:order-1 md:col-span-8 space-y-3">
                    <Input label="Nom de l'acheteur" value={buyerName} onChange={setBuyerName} placeholder="Nom complet" />
                    <Input label="Bénéficiaire" value={recipientName} onChange={setRecipientName} placeholder="Optionnel" />
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                      <div className="relative">
                        <input
                          value={buyerPhone}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value)
                            setBuyerPhone(formatted)
                            setPhoneValid(isValidPhone(formatted))
                          }}
                          placeholder="0x xx xx xx xx"
                          maxLength={14}
                          className={`w-full rounded-xl border-2 px-3 py-1.5 md:py-2 text-sm font-bold transition-all outline-none ${phoneValid ? 'border-gray-100 bg-gray-50/50 focus:border-[#ED4B00] focus:bg-white' : 'border-rose-100 bg-rose-50/50 text-rose-500 focus:border-rose-300'}`}
                        />
                        {autoFilled && phoneValid && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-100">
                            EXISTANT ✓
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: QR Code */}
                  <div className="order-1 md:order-2 md:col-span-4 flex flex-col items-center justify-center pb-1 md:pb-0">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-gradient-to-tr from-[#ED4B00]/10 to-[#020035]/5 rounded-[2rem] blur-2xl opacity-50 transition duration-500" />
                      <div
                        ref={qrRefBlank}
                        className="relative h-24 w-24 md:h-36 md:w-36 rounded-2xl md:rounded-3xl border-2 md:border-4 border-white shadow-xl bg-white p-2 md:p-3 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-500"
                      />
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Scanner</p>
                      <button
                        onClick={handlePrintQROnly}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-[#020035] hover:text-white transition-all active:scale-95 border border-gray-100"
                        title="Imprimer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Economic Section */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 border-t border-gray-100 pt-5">
                  <Input label="Montant (DA)" type="tel" value={amount} onChange={handleAmountEditChange} placeholder="0" />
                  <Input label="PIN" type="password" value={securityPin} onChange={handleSecurityPinChange} placeholder="****" maxLength={4} />
                </div>

                <button
                  onClick={handleActivate}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-[#ED4B00] to-[#FF6B21] text-white rounded-2xl py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? 'CHARGEMENT...' : 'Activer maintenant'}
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Desktop: Details Side-by-side | Mobile: Stacked */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-6 items-center">
                  {/* Details Card (Left) */}
                  <div className="order-2 md:order-1 md:col-span-8 bg-gray-50/50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-100 space-y-3 md:space-y-4 w-full">
                    <div className="pb-2 border-b border-gray-100/50 mb-1">
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Solde" value={fmtDZD(voucher.balance, lang)} bold color="text-emerald-700" />
                        {voucher.security_pin && <DetailItem label="PIN" value={voucher.security_pin} color="text-amber-500" />}
                      </div>
                    </div>

                    <DetailItem label="Acheteur" value={voucher.buyer_name} />
                    <DetailItem label="Téléphone" value={voucher.buyer_phone} />
                    <DetailItem label="Bénéficiaire" value={voucher.recipient_name} />
                  </div>

                  {/* QR Code (Right) */}
                  <div className="order-1 md:order-2 md:col-span-4 flex flex-col items-center justify-center pb-1 md:pb-0">
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-gradient-to-tr from-[#ED4B00]/10 to-[#020035]/5 rounded-[2rem] blur-2xl opacity-50 transition duration-500" />
                      <div
                        ref={voucher.status === 'active' ? qrRefActive : qrRefRedeemed}
                        className="relative h-24 w-24 md:h-36 md:w-36 rounded-xl md:rounded-2xl border-2 md:border-4 border-white shadow-xl bg-white p-1.5 md:p-2 flex items-center justify-center transition-transform group-hover:scale-105 duration-500"
                      />
                    </div>

                    <button
                      onClick={handlePrintQROnly}
                      className="mt-2 h-8 w-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-[#020035] hover:text-white transition-all active:scale-95 border border-gray-100"
                      title="Imprimer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>



                {/* Payment Actions */}
                {voucher.status === 'active' && (
                  <div className="space-y-2 pt-2 border-t border-gray-100/50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paiement</h4>
                      {['admin', 'superadmin', 'store_owner'].includes(userRole || '') && (
                        <button onClick={() => setEditMode(!editMode)} className="text-[10px] font-black text-[#ED4B00] uppercase underline underline-offset-4 hover:opacity-70 transition">
                          {editMode ? 'Annuler' : 'Modifier'}
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {editMode ? (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Nom" value={buyerName} onChange={setBuyerName} />
                            <Input label="Téléphone" value={buyerPhone} onChange={setBuyerPhone} />
                            <Input label="Solde" type="tel" value={amount} onChange={handleAmountEditChange} />
                            <Input label="PIN" type="password" value={securityPin} onChange={handleSecurityPinChange} maxLength={4} />
                          </div>
                          <button onClick={handleEditSave} className="w-full bg-emerald-600 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all">Enregistrer</button>
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-full">
                            <Input label="Montant à déduire" type="tel" value={consumeAmount} onChange={(val) => setConsumeAmount(val.replace(/,/g, '.').replace(/[^0-9.]/g, ''))} placeholder="DA" />
                          </div>
                          <button
                            onClick={() => handleConsume(true)}
                            className="w-full bg-[#020035] text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-indigo-900/10"
                          >
                            Valider
                          </button>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
            <button onClick={onClose} className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#020035] transition py-4 border-t border-gray-50">Fermer</button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'ACTIF' },
    blank: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', label: 'VIERGE' },
    redeemed: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-100', label: 'CONSOMMÉ' },
  }
  const config = configs[status] || configs.blank
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${config.bg} ${config.text} ${config.border}`}>{config.label}</span>
}

function DetailItem({ label, value, bold = false, color = "text-gray-700" }: { label: string, value: any, bold?: boolean, color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest shrink-0">{label}</span>
      <span className={`text-xs ${bold ? 'font-black' : 'font-bold'} ${color} truncate`}>{value || '—'}</span>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder, maxLength }: { label: string, value: any, onChange: (val: any) => void, type?: string, placeholder?: string, maxLength?: number }) {
  return (
    <div>
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-0.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl px-3 py-1.5 md:py-2 text-sm font-bold focus:border-[#ED4B00] focus:bg-white outline-none transition-all"
      />
    </div>
  )
}

function fmtDZD(n: number, lang: any) {
  return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(n)
}

function cleanPhone(input: string) { return input.replace(/\D/g, '') }
function isValidPhone(input: string) { return /^0[5-7]\d{8}$/.test(cleanPhone(input)) }
function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  const groups = digits.match(/.{1,2}/g) || []
  return groups.join(' ').trim().slice(0, 14)
}
