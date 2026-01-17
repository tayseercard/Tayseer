'use client';

import { useState, useEffect } from 'react';
import { Package, X, Plus, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

type Plan = {
    id: string;
    name: string;
    quantity: number;
    price_per_unit: number;
    total_price: number;
    features: string[];
    is_popular: boolean;
};

export default function PacksSettings({ t }: { t: any }) {
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
        fetchPlans();
    }, []);

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

        // Auto-generate ID if new (slugify name)
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
            toast.success(isEditing ? 'Plan updated' : 'Plan created');
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--c-primary)]">
                        <Package className="h-5 w-5 text-[var(--c-accent)]" />
                        Pricing Packs
                    </h2>
                    <p className="text-sm text-gray-500">Manage subscription plans and pricing.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => {
                            setCurrentPlan({ name: '', quantity: 0, price_per_unit: 0, is_popular: false });
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-2 bg-[var(--c-accent)] text-white px-3 py-1.5 rounded-lg text-sm hover:opacity-90 transition"
                    >
                        <Plus className="h-4 w-4" /> Add Plan
                    </button>
                )}
            </div>

            {/* --- EDITOR FORM --- */}
            {isEditing && (
                <div className="bg-gray-50 border rounded-xl p-4 animate-fade-in mb-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">{currentPlan.id ? 'Edit Plan' : 'New Plan'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Plan Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Starter Pack"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--c-accent)]/20 outline-none"
                                value={currentPlan.name}
                                onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                            />
                        </div>
                        {/* Only allow editing ID for new items to avoid breaking FKs easily, or just hide it */}
                        {!currentPlan.id && (
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">ID (auto-generated if empty)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. starter-pack"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--c-accent)]/20 outline-none"
                                    value={currentPlan.id}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, id: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label>
                            <input
                                type="number"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--c-accent)]/20 outline-none"
                                value={currentPlan.quantity || ''}
                                onChange={(e) => setCurrentPlan({ ...currentPlan, quantity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Price / Unit (DA)</label>
                            <input
                                type="number"
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--c-accent)]/20 outline-none"
                                value={currentPlan.price_per_unit || ''}
                                onChange={(e) => setCurrentPlan({ ...currentPlan, price_per_unit: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded text-[var(--c-accent)] focus:ring-[var(--c-accent)]"
                                    checked={currentPlan.is_popular}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, is_popular: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Is Popular?</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end border-t pt-3">
                        <button
                            onClick={cancelEdit}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={submitting}
                            className="bg-[var(--c-accent)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Save Plan
                        </button>
                    </div>
                </div>
            )}

            {/* --- LIST --- */}
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[var(--c-accent)]" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {plans.map((pack) => (
                        <div
                            key={pack.id}
                            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${pack.is_popular ? 'bg-[var(--c-accent)] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    {pack.quantity}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-800">{pack.name}</p>
                                        {pack.is_popular && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Popular</span>}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {pack.quantity.toLocaleString()} QR @ {pack.price_per_unit} DA <span className="text-gray-300">|</span> <strong className="text-[var(--c-primary)]">{pack.total_price.toLocaleString()} DA Total</strong>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(pack)}
                                    className="text-gray-400 hover:text-[var(--c-primary)] p-2 rounded-full hover:bg-gray-100 transition"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(pack.id)}
                                    className="text-gray-400 hover:text-rose-600 p-2 rounded-full hover:bg-rose-50 transition"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {plans.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500 text-sm">No plans found. Create one to get started.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
