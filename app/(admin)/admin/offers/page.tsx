'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';
import PacksSettings from '@/components/admin/settings/PacksSettings';

export default function OffersPage() {
    const { t, lang } = useLanguage();
    const router = useRouter();

    return (
        <div className="max-w-4xl mx-auto py-4 md:py-8 px-4">
            <button
                onClick={() => router.back()}
                className="hidden md:flex items-center gap-2 text-gray-500 hover:text-[var(--c-primary)] transition mb-6 group"
            >
                <div className={`p-2 rounded-full bg-white border border-gray-100 group-hover:border-[var(--c-primary)] group-hover:bg-gray-50 transition ${lang === 'ar' ? 'rotate-180' : ''}`}>
                    <ArrowLeft size={18} />
                </div>
                <span className="text-sm font-medium">{t.back || 'Back'}</span>
            </button>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-[var(--c-primary)]">
                        {t.offers || 'Offres & Packs'}
                    </h1>
                    <p className="hidden md:block text-sm text-gray-500 mt-1">
                        {lang === 'ar' ? 'إدارة العروض وباقات الأسعار المتاحة للمتاجر.' :
                            lang === 'fr' ? 'Gérez les offres et les packs de prix disponibles pour les magasins.' :
                                'Manage offers and price packs available for stores.'}
                    </p>
                </div>
                <PacksSettings onlyButton />
            </div>

            <div>
                <PacksSettings />
            </div>
        </div>
    );
}
