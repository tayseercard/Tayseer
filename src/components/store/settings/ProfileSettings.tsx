'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Store, Camera, Loader2 } from 'lucide-react'

export default function ProfileSettings({ t }: { t: Record<string, string> }) {
  const supabase = createClientComponentClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [store, setStore] = useState<{ id: string; name: string; logo_url: string | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 🔥 Load real user info & store info
  useEffect(() => {
    ; (async () => {
      // 1. Load User
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user
      if (!user) return

      setEmail(user.email || '')
      setFullName(
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        '' // fallback
      )

      // 2. Load Store (for display)
      try {
        const res = await fetch('/api/store/me', { cache: 'no-store' })
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const storeData = await res.json()
          if (storeData.store) {
            setStore(storeData.store)
            setPhone(storeData.store.phone || '')
            setAddress(storeData.store.address || '')
          }
        }
      } catch (e) {
        console.error("Error loading store for profile", e)
      }
    })()
  }, [supabase])

  // 📸 Custom Logo Upload for Profile
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !store) return

    setUploading(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${store.id}-${Math.random()}.${fileExt}`
      const filePath = `logos/${fileName}`

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      // 3. Update Stores Table via API (to bypass RLS)
      const res = await fetch('/api/store/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: publicUrl })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update logo')

      setStore({ ...store, logo_url: publicUrl })
      setMessage(t.saved || 'Logo updated!')
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setUploading(false)
    }
  }


  // 💾 Save changes
  async function handleSave() {
    setSaving(true)
    setMessage(null)

    try {
      // 1. Update User Profile
      const { error: userError } = await supabase.auth.updateUser({
        email,
        data: { full_name: fullName },
      })
      if (userError) throw userError

      // 2. Update Store Details (Phone/Address)
      const res = await fetch('/api/store/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, address })
      })
      const storeRes = await res.json()
      if (!res.ok) throw new Error(storeRes.error || 'Failed to save store info')

      setMessage(t.saved || 'Saved successfully!')
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 text-sm">

      {/* Store Identity Badge */}
      <div className="flex flex-col items-center justify-center space-y-3 pb-4 border-b border-gray-100">
        <div className="relative group w-24 h-24 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
          {store?.logo_url ? (
            <img src={store.logo_url} alt="Store Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <Store className="w-8 h-8 text-gray-300" />
          )}

          {/* Loading Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#020035]" />
            </div>
          )}

          {/* Edit Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#020035] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100 pb-0.5 pr-0.5"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-gray-900 text-lg">{store?.name || 'Ma Boutique'}</h3>
          <p className="text-xs text-gray-500 font-medium">Propriétaire du magasin</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Full Name */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap w-24">{t.fullName || 'Full Name'}</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="flex-1 h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#020035]/20 transition"
            placeholder={t.fullName || 'Full Name'}
          />
        </div>

        {/* Email */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap w-24">{t.email || 'Email'}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#020035]/20 transition"
            placeholder="you@example.com"
          />
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap w-24">{t.phone || 'Phone'}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#020035]/20 transition"
            placeholder="+213 555 ..."
          />
        </div>

        {/* Address */}
        <div className="flex items-start gap-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap w-24 pt-3">{t.address || 'Address'}</span>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 h-20 py-2 px-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#020035]/20 transition resize-none"
            placeholder={t.addressPlaceHolder || 'Store address...'}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 bg-[#020035] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg hover:bg-black transition active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? t.saving || 'Sauvegarde…' : t.save || 'Enregistrer'}
      </button>

      {/* Status Message */}
      {message && (
        <p className={`text-center text-xs font-bold mt-2 ${message.includes('saved') ? 'text-emerald-600' : 'text-rose-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
