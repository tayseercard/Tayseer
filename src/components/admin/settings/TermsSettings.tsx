'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader2, Save } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

export default function TermsSettings() {
    const supabase = createClientComponentClient();
    const [terms, setTerms] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTerms();
    }, []);

    async function fetchTerms() {
        setLoading(true);
        try {
            // First we check if it exists in the 'logos' bucket
            const { data, error } = await supabase.storage.from('logos').download('terms.txt');
            if (error) {
                // if it doesn't exist, we just leave it blank
                setTerms('');
            } else if (data) {
                const text = await data.text();
                setTerms(text);
            }
        } catch (err) {
            console.error('Failed to load terms:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const file = new File([terms], 'terms.txt', { type: 'text/plain' });
            const { error } = await supabase.storage.from('logos').upload('terms.txt', file, {
                upsert: true,
                cacheControl: '0'
            });

            if (error) throw error;
            toast.success('Terms and conditions saved successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save terms and conditions.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--c-primary)]">
                        <FileText className="h-5 w-5 text-[var(--c-accent)]" />
                        Terms & Conditions
                    </h2>
                    <p className="text-sm text-gray-500">
                        Edit the terms and conditions that appear on the homepage.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--c-accent)]" />
                </div>
            ) : (
                <div className="space-y-4">
                    <textarea
                        className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)] transition resize-none text-sm text-gray-700 leading-relaxed"
                        placeholder="Welcome to Tayseer! By using our platform..."
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                    />

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-[var(--c-accent)] text-white py-3 rounded-xl font-medium hover:bg-orange-500 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {saving ? 'Saving...' : 'Save Terms'}
                    </button>
                </div>
            )}
        </div>
    );
}
