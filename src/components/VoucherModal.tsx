'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
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
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
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

    const size = window.innerWidth < 640 ? 100 : 150;

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
  async function handleConsume(partial = true) {
    const consumeValue = partial ? Number(consumeAmount) : voucher.balance
    if (!consumeValue || consumeValue <= 0) return toast.error('Montant invalide.')

    if (voucher.security_pin) {
      if (!consumePin) return toast.error('PIN requis pour la consommation.')
      if (consumePin !== voucher.security_pin) return toast.error('❌ PIN incorrect.')
    }

    if (consumeValue > voucher.balance)
      return toast.error('Le montant dépasse le solde disponible.')

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 pb-24 md:pb-4">

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="
          relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
          bg-white/95 backdrop-blur-xl border border-white/50
          shadow-[0_20px_50px_rgba(0,0,0,0.15)]
          rounded-[2.5rem] p-6 md:p-8
        "
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 h-10 w-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-[#020035] transition-all hover:bg-gray-100 active:scale-95 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* LEFT: QR & Status */}
          <div className="md:col-span-5 flex flex-col items-center space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black text-[#020035] mb-1">{t.voucherDetails}</h2>
              <StatusBadge status={voucher.status} />
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#ED4B00]/10 to-[#020035]/5 rounded-[2rem] blur-2xl group-hover:opacity-100 opacity-50 transition duration-500" />
              <div
                ref={voucher.status === 'blank' ? qrRefBlank : voucher.status === 'active' ? qrRefActive : qrRefRedeemed}
                className="relative h-28 w-28 md:h-40 md:w-40 rounded-2xl border-4 border-white shadow-2xl bg-white p-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-500"
              />
            </div>

            <div className="w-full space-y-2">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Code du Voucher</p>
              <p className="text-lg font-black text-[#020035] text-center font-mono bg-gray-50 py-2 rounded-xl border border-gray-100">
                {voucher.code}
              </p>
            </div>

            <button
              onClick={handlePrintQROnly}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#020035] text-white rounded-2xl text-xs font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-indigo-900/10"
            >
              <span className="text-lg">🧾</span> Imprimer le QR Code
            </button>
          </div>

          {/* RIGHT: Form / Details */}
          <div className="md:col-span-7 flex flex-col gap-6">
            {voucher.status === 'blank' ? (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#020035] uppercase tracking-wider opacity-80">Activation</h3>
                  <p className="text-xs text-gray-400 font-medium italic">Activez ce voucher pour commencer.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Input label="Nom de l'acheteur" value={buyerName} onChange={setBuyerName} placeholder="Nom complet" />
                  <Input label="Bénéficiaire" value={recipientName} onChange={setRecipientName} placeholder="Optionnel" />

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
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
                        className={`w-full rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all outline-none ${phoneValid ? 'border-gray-100 bg-gray-50/50 focus:border-[#ED4B00] focus:bg-white' : 'border-rose-100 bg-rose-50/50 text-rose-500 focus:border-rose-300'}`}
                      />
                      {autoFilled && phoneValid && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          EXISTANT ✓
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Montant (DA)" type="number" value={amount} onChange={setAmount} placeholder="0" />
                    <Input label="PIN (4 chiffres)" value={securityPin} onChange={setSecurityPin} placeholder="****" />
                  </div>
                </div>

                <button
                  onClick={handleActivate}
                  disabled={saving}
                  className="w-full mt-4 bg-gradient-to-r from-[#ED4B00] to-[#FF6B21] text-white rounded-2xl py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? 'CHARGEMENT...' : 'Activer maintenant'}
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#020035] uppercase tracking-wider opacity-80">Détails</h3>
                  <p className="text-xs text-gray-400 font-medium italic">Informations du compte.</p>
                </div>

                <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 space-y-3">
                  <DetailItem label="Acheteur" value={voucher.buyer_name} />
                  <DetailItem label="Téléphone" value={voucher.buyer_phone} />
                  <DetailItem label="Solde" value={fmtDZD(voucher.balance, lang)} bold color="text-emerald-600" />
                  {voucher.security_pin && <DetailItem label="PIN" value={voucher.security_pin} color="text-amber-500" />}
                </div>

                {voucher.status === 'active' && (
                  <div className="space-y-4">
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
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 pt-2">
                          <Input label="Nom" value={buyerName} onChange={setBuyerName} />
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Solde" value={amount} onChange={setAmount} />
                            <Input label="PIN" value={securityPin} onChange={setSecurityPin} />
                          </div>
                          <button onClick={handleEditSave} className="w-full bg-emerald-600 text-white rounded-xl py-2 text-xs font-black uppercase tracking-wider">Enregistrer</button>
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Montant" value={consumeAmount} onChange={setConsumeAmount} placeholder="DA" />
                            {voucher.security_pin && <Input label="PIN" value={consumePin} onChange={setConsumePin} placeholder="****" />}
                          </div>
                          <button onClick={() => handleConsume(true)} className="w-full bg-[#020035] text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-indigo-900/10">Valider l'achat</button>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {voucher.status === 'redeemed' && (
                  <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3 border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800">✅ Utilisé totalement.</p>
                  </div>
                )}
              </div>
            )}
            <button onClick={onClose} className="mt-2 w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#020035] transition">Fermer</button>
          </div>
        </div>
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
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest shrink-0">{label}</span>
      <span className={`text-xs ${bold ? 'font-black' : 'font-bold'} ${color} truncate`}>{value || '—'}</span>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string, value: any, onChange: (val: any) => void, type?: string, placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl p-3 text-sm font-bold focus:border-[#ED4B00] focus:bg-white outline-none transition-all"
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
