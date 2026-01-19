'use client';

import { useState, useEffect } from 'react';
import { Package, X, Plus, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/useLanguage';

type Plan = {
    id: string;
    name: string;
    quantity: number;
    price_per_unit: number;
    total_price: number;
    features: string[];
    is_popular: boolean;
};

export default function PacksSettings({ onlyButton = false }: { onlyButton?: boolean }) {
    const { t, lang } = useLanguage();
    const supabase = createClientComponentClient();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({
        id: '',
        name: '',
        quantity: 0,
        price_per_unit: 0,
        features: [],
        is_popular: false
    });

    // --- FETCH DATA ---
    useEffect(() => {
        if (!onlyButton) fetchPlans();
    }, [onlyButton]);

    async function fetchPlans() {
        setLoading(true);
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('quantity', { ascending: true });

        if (error) {
            toast.error('Failed to load plans');
            console.error(error);
        } else {
            setPlans(data || []);
        }
        setLoading(false);
    }

    // --- HANDLERS ---
    const handleSave = async () => {
        if (!currentPlan.name || !currentPlan.quantity || !currentPlan.price_per_unit) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        const totalPrice = Number(currentPlan.quantity) * Number(currentPlan.price_per_unit);

        const planId = currentPlan.id || currentPlan.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const payload = {
            id: planId,
            name: currentPlan.name,
            quantity: Number(currentPlan.quantity),
            price_per_unit: Number(currentPlan.price_per_unit),
            total_price: totalPrice,
            features: currentPlan.features || [],
            is_popular: currentPlan.is_popular || false
        };

        const { error } = await supabase
            .from('plans')
            .upsert(payload);

        if (error) {
            toast.error('Error saving plan: ' + error.message);
        } else {
            toast.success(currentPlan.id ? 'Plan updated' : 'Plan created');
            setIsEditing(false);
            setCurrentPlan({ id: '', name: '', quantity: 0, price_per_unit: 0, features: [], is_popular: false });
            fetchPlans();
        }
        setSubmitting(false);
    };

    const handleEdit = (plan: Plan) => {
        setCurrentPlan(plan);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This might affect stores using this plan.")) return;

        const { error } = await supabase
            .from('plans')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Error deleting plan: ' + error.message);
        } else {
            toast.success('Plan deleted');
            fetchPlans();
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setCurrentPlan({ id: '', name: '', quantity: 0, price_per_unit: 0, features: [], is_popular: false });
    };

    const handleAdd = () => {
        setCurrentPlan({ name: '', quantity: 0, price_per_unit: 0, is_popular: false });
        setIsEditing(true);
        window.dispatchEvent(new CustomEvent('open-plan-editor'));
    };

    useEffect(() => {
        const handleOpen = () => setIsEditing(true);
        window.addEventListener('open-plan-editor', handleOpen);
        return () => window.removeEventListener('open-plan-editor', handleOpen);
    }, []);

    if (onlyButton) {
        return (
            <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-[var(--c-accent)] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:translate-y-[-1px] active:translate-y-[0] transition-all"
            >
                <Plus className="h-4 w-4" />
                {lang === 'ar' ? 'إضافة خطة' : lang === 'fr' ? 'Ajouter un pack' : 'Add Plan'}
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* --- EDITOR FORM --- */}
            {isEditing && (
                <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl p-6 shadow-xl animate-fade-in relative z-10 transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">{currentPlan.id ? 'Edit Plan' : 'New Pricing Pack'}</h3>
                        <button onClick={cancelEdit} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-gray-500 ml-1">Plan Display Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Starter Pack"
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)] outline-none transition-all font-medium"
                                value={currentPlan.name}
                                onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                            />
                        </div>
                        {!currentPlan.id && (
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-gray-500 ml-1">Custom ID (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. starter-pack"
                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)] outline-none transition-all font-medium"
                                    value={currentPlan.id}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, id: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-gray-500 ml-1">QR Quantity</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)] outline-none transition-all font-semibold"
                                value={currentPlan.quantity || ''}
                                onChange={(e) => setCurrentPlan({ ...currentPlan, quantity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-gray-500 ml-1">Price per unit (DA)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--c-accent)]/20 focus:border-[var(--c-accent)] outline-none transition-all font-semibold"
                                value={currentPlan.price_per_unit || ''}
                                onChange={(e) => setCurrentPlan({ ...currentPlan, price_per_unit: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="flex items-center lg:pt-6">
                            <label className="flex items-center gap-3 cursor-pointer group bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 px-4 py-3 rounded-xl transition-all w-full">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded text-[var(--c-accent)] focus:ring-[var(--c-accent)] border-gray-200"
                                    checked={currentPlan.is_popular}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, is_popular: e.target.checked })}
                                />
                                <span className="text-sm font-bold text-gray-700">Featured (Popular)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button
                            onClick={handleSave}
                            disabled={submitting}
                            className="bg-[var(--c-accent)] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[var(--c-accent)]/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                            {currentPlan.id ? 'Update Pack' : 'Create Pack'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- LIST --- */}
            {loading ? (
                <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-gray-200" /></div>
            ) : (
                <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100/50 overflow-hidden shadow-sm">
                    {plans.map((pack, index) => (
                        <div
                            key={pack.id}
                            className={`flex items-center justify-between p-5 md:p-6 transition-colors hover:bg-white/80 active:bg-gray-50/50 group
                                ${index !== plans.length - 1 ? 'border-b border-gray-50/50' : ''}`}
                        >
                            <div className="flex items-center gap-5 md:gap-6">
                                <div className={`h-14 w-14 md:h-16 md:w-16 rounded-[22px] flex flex-col items-center justify-center shadow-inner transition-transform group-hover:scale-105
                                    ${pack.is_popular ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 'bg-gray-100/80 text-gray-500'}`}>
                                    <span className="text-lg md:text-xl font-black leading-none">{pack.quantity}</span>
                                    <span className="text-[10px] uppercase font-black opacity-70">QR</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2.5">
                                        <p className="font-bold text-gray-900 text-base md:text-lg">{pack.name}</p>
                                        {pack.is_popular && (
                                            <span className="text-[9px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm">
                                                {lang === 'ar' ? 'شائع' : 'POPULAR'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[13px] md:text-sm text-gray-400 font-medium">
                                            <span className="font-bold text-gray-500">{pack.total_price.toLocaleString()} DA</span>
                                            <span className="mx-2 opacity-30">/</span>
                                            <span className="text-[11px] uppercase tracking-wider">{pack.quantity.toLocaleString()} Vouchers</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 md:gap-2 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(pack)}
                                    className="p-2.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                                    title="Edit Pack"
                                >
                                    <Edit2 className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(pack.id)}
                                    className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                    title="Delete Pack"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {plans.length === 0 && (
                        <div className="text-center py-24 px-6">
                            <div className="bg-gray-50/50 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Package className="h-10 w-10 text-gray-200" />
                            </div>
                            <h4 className="text-gray-900 font-bold mb-1">No Packs Available</h4>
                            <p className="text-gray-400 text-sm font-medium">
                                Start by adding your first pricing plan.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
