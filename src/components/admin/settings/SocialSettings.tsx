'use client';

import { useState, useEffect } from 'react';
import { Share2, Loader2, Save, Facebook, Instagram, Twitter, Linkedin, Globe } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

type SocialLinks = {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    website: string;
};

export default function SocialSettings() {
    const supabase = createClientComponentClient();
    const [socials, setSocials] = useState<SocialLinks>({
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: '',
        website: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSocials();
    }, []);

    async function fetchSocials() {
        setLoading(true);
        try {
            const { data, error } = await supabase.storage.from('logos').download('socials.json');
            if (error) {
                // Ignore if not found
            } else if (data) {
                const text = await data.text();
                if (text) {
                    setSocials(JSON.parse(text));
                }
            }
        } catch (err) {
            console.error('Failed to load socials:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const file = new File([JSON.stringify(socials, null, 2)], 'socials.json', { type: 'application/json' });
            const { error } = await supabase.storage.from('logos').upload('socials.json', file, {
                upsert: true,
                cacheControl: '0'
            });

            if (error) throw error;
            toast.success('Social media links saved successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save social media links.');
        } finally {
            setSaving(false);
        }
    }

    const handleChange = (field: keyof SocialLinks) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setSocials(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--c-primary)]">
                        <Share2 className="h-5 w-5 text-[var(--c-accent)]" />
                        Réseaux Sociaux
                    </h2>
                    <p className="text-sm text-gray-500">
                        Gérez les liens de vos réseaux sociaux affichés sur le site.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--c-accent)]" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Facebook className="w-5 h-5" />
                            </div>
                            <input
                                type="url"
                                placeholder="Lien Facebook (ex: https://facebook.com/...)"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)]"
                                value={socials.facebook}
                                onChange={handleChange('facebook')}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                                <Instagram className="w-5 h-5" />
                            </div>
                            <input
                                type="url"
                                placeholder="Lien Instagram (ex: https://instagram.com/...)"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)]"
                                value={socials.instagram}
                                onChange={handleChange('instagram')}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                                <Twitter className="w-5 h-5" />
                            </div>
                            <input
                                type="url"
                                placeholder="Lien Twitter (ex: https://twitter.com/...)"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)]"
                                value={socials.twitter}
                                onChange={handleChange('twitter')}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                                <Linkedin className="w-5 h-5" />
                            </div>
                            <input
                                type="url"
                                placeholder="Lien LinkedIn (ex: https://linkedin.com/...)"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)]"
                                value={socials.linkedin}
                                onChange={handleChange('linkedin')}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                <Globe className="w-5 h-5" />
                            </div>
                            <input
                                type="url"
                                placeholder="Lien Site Web (ex: https://votresite.com)"
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)]"
                                value={socials.website}
                                onChange={handleChange('website')}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-[var(--c-accent)] text-white py-3 mt-4 rounded-xl font-medium hover:bg-orange-500 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {saving ? 'Enregistrement...' : 'Enregistrer Les Liens'}
                    </button>
                </div>
            )}
        </div>
    );
}
