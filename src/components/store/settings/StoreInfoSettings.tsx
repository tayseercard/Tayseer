'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Camera, Loader2, Save, Store, Phone, MapPin } from 'lucide-react'

export default function StoreInfoSettings({ t }: { t: any }) {
    const supabase = createClientComponentClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const [store, setStore] = useState<{
        id: string
        name: string
        phone: string
        address: string
        logo_url: string | null
    } | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadStoreData()
    }, [])

    async function loadStoreData() {
        setLoading(true)
        try {
            const res = await fetch('/api/store/me')
            // Handle non-JSON responses gracefully
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Invalid response format");
            }

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to load')

            if (data.store) {
                setStore({
                    id: data.store.id,
                    name: data.store.name,
                    phone: data.store.phone || '',
                    address: data.store.address || '',
                    logo_url: data.store.logo_url
                })
            }
        } catch (err) {
            console.error('Error loading store:', err)
            // Just silence the error for the user, maybe they haven't set up yet
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!store) return
        setSaving(true)
        setMessage(null)

        try {
            const res = await fetch('/api/store/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: store.name,
                    phone: store.phone,
                    address: store.address
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setMessage({ type: 'success', text: t.saved || 'Modifications enregistrées !' })
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setSaving(false)
        }
    }

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
            setMessage({ type: 'success', text: 'Logo mis à jour !' })
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Chargement...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Logo Section */}
            <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-[#020035]/20 transition-colors">
                        {store?.logo_url ? (
                            <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <Store className="w-10 h-10 text-gray-300" />
                        )}

                        {uploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-[#020035]" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#020035] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                    />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo de la Boutique</p>
            </div>

            {/* Form Section */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nom de la Boutique</label>
                    <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                            type="text"
                            value={store?.name || ''}
                            onChange={(e) => setStore(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#020035]/20 transition"
                            placeholder="Ex: Ma Boutique"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Téléphone</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                            type="text"
                            value={store?.phone || ''}
                            onChange={(e) => setStore(prev => prev ? { ...prev, phone: e.target.value } : null)}
                            className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#020035]/20 transition"
                            placeholder="05 00 00 00 00"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Adresse</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-300" />
                        <textarea
                            value={store?.address || ''}
                            onChange={(e) => setStore(prev => prev ? { ...prev, address: e.target.value } : null)}
                            className="w-full min-h-[80px] pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#020035]/20 transition resize-none"
                            placeholder="Adresse complète..."
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving || !store}
                className="w-full h-12 bg-[#020035] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#020035]/20 hover:bg-black transition active:scale-[0.98] disabled:opacity-50"
            >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Enregistrer les Informations
            </button>

            {message && (
                <p className={`text-center text-xs font-bold ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {message.text}
                </p>
            )}
        </div>
    )
}
