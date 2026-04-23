import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, CreditCard, Pencil, Plus, Power, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';
import {
    createBillingPlan,
    deactivateBillingPlan,
    fetchAdminPlans,
    updateBillingPlan,
    type BillingPlan,
} from '../../lib/billing';

interface SubscriptionPlanManagementProps {
    idToken: string;
}

const emptyForm = {
    name: '',
    billingType: 'subscription' as 'subscription' | 'payg',
    monthlyPrice: '',
    platformFee: '',
    annualPrice: '',
    includedBookings: '',
    currency: 'GBP',
    description: '',
    unitLabel: '',
    isActive: true,
    customFeatures: [] as Array<{ id: string; name: string; included: boolean }>,
    limits: {
        maxSites: '',
        monthlyBookings: '',
    },
};

const supportedCurrencies = [
    { code: 'GBP', label: 'GBP - British Pound' },
    { code: 'USD', label: 'USD - US Dollar' },
    { code: 'EUR', label: 'EUR - Euro' },
];

export function SubscriptionPlanManagement({ idToken }: SubscriptionPlanManagementProps) {
    const [plans, setPlans] = useState<BillingPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);

    const loadPlans = async () => {
        setIsLoading(true);
        try {
            const items = await fetchAdminPlans(idToken);
            setPlans(items);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to load subscription plans');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadPlans();
    }, [idToken]);

    const resetForm = () => {
        setEditingPlanId(null);
        setForm(emptyForm);
    };

    const startEdit = (plan: BillingPlan) => {
        setEditingPlanId(plan.id);
        setForm({
            name: plan.name,
            billingType: plan.billingType,
            monthlyPrice: String(plan.monthlyPrice),
            platformFee:
                plan.platformFee !== null && plan.platformFee !== undefined
                    ? String(plan.platformFee)
                    : '',
            annualPrice: String(plan.annualPrice || ''),
            includedBookings:
                plan.includedBookings !== null && plan.includedBookings !== undefined
                    ? String(plan.includedBookings)
                    : '',
            currency: plan.currency,
            description: plan.description || '',
            unitLabel: plan.unitLabel || '',
            isActive: plan.isActive,
            customFeatures: (plan.customFeatures || []).map(f => ({ ...f, id: f.id || Math.random().toString(36).substring(7) })),
            limits: {
                maxSites: plan.limits?.maxSites !== undefined ? String(plan.limits.maxSites) : '',
                monthlyBookings: plan.limits?.monthlyBookings !== undefined ? String(plan.limits.monthlyBookings) : '',
            },
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSaving(true);

        const payload = {
            name: form.name.trim(),
            billingType: form.billingType,
            monthlyPrice:
                form.billingType === 'subscription' && form.monthlyPrice
                    ? Number(form.monthlyPrice)
                    : undefined,
            platformFee:
                form.billingType === 'payg' && form.platformFee
                    ? Number(form.platformFee)
                    : undefined,
            annualPrice:
                form.billingType === 'subscription' && form.annualPrice
                    ? Number(form.annualPrice)
                    : undefined,
            includedBookings:
                form.billingType === 'subscription' && form.includedBookings
                    ? Number(form.includedBookings)
                    : undefined,
            currency: form.currency.trim().toUpperCase(),
            description: form.description.trim() || undefined,
            unitLabel: form.unitLabel.trim() || undefined,
            isActive: form.isActive,
            customFeatures: form.customFeatures,
            limits: {
                maxSites: form.limits.maxSites ? Number(form.limits.maxSites) : undefined,
                monthlyBookings: form.limits.monthlyBookings ? Number(form.limits.monthlyBookings) : undefined,
            },
        };

        try {
            if (editingPlanId) {
                await updateBillingPlan(idToken, editingPlanId, payload);
                toast.success('Plan updated');
            } else {
                await createBillingPlan(idToken, payload as any);
                toast.success('Plan created');
            }
            resetForm();
            await loadPlans();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to save plan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async (planId: string) => {
        if (!confirm('Deactivate this plan? Operators will no longer see it in booking flows.')) {
            return;
        }

        setIsSaving(true);
        try {
            await deactivateBillingPlan(idToken, planId);
            toast.success('Plan deactivated');
            await loadPlans();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to deactivate plan');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                            Billing Control
                        </p>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            Subscription Plan Management
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Create and maintain the active billing plans shown to operators.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => {
                            resetForm();
                            void loadPlans();
                        }}
                        variant="outline"
                        className="h-11 gap-2"
                    >
                        <RefreshCcw className="size-4" />
                        Refresh
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Plan Name
                        </label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                            placeholder="Professional"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Billing Type
                        </label>
                        <select
                            value={form.billingType}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    billingType: e.target.value as 'subscription' | 'payg',
                                }))
                            }
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                        >
                            <option value="subscription">Subscription</option>
                            <option value="payg">Pay As You Go</option>
                        </select>
                    </div>

                    {form.billingType === 'subscription' ? (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Subscription Monthly Price
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.monthlyPrice}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, monthlyPrice: e.target.value }))
                                }
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                                placeholder="e.g. 250"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Platform Fee (Per Booking)
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.platformFee}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, platformFee: e.target.value }))
                                }
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                                placeholder="e.g. 25"
                            />
                        </div>
                    )}

                    {form.billingType === 'subscription' ? (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Subscription Annual Price
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.annualPrice}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, annualPrice: e.target.value }))
                                }
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                                placeholder="e.g. 2500"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Unit Label
                            </label>
                            <input
                                type="text"
                                value={form.unitLabel}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, unitLabel: e.target.value }))
                                }
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                                placeholder="/booking"
                            />
                        </div>
                    )}

                    {form.billingType === 'subscription' && (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Included Bookings Per Billing Cycle
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="1"
                                value={form.includedBookings}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, includedBookings: e.target.value }))
                                }
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                                placeholder="e.g. 50"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Currency
                        </label>
                        <select
                            value={form.currency}
                            onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                        >
                            {supportedCurrencies.map(currency => (
                                <option key={currency.code} value={currency.code}>
                                    {currency.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {form.billingType === 'subscription' && (
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Unit Label
                            </label>
                            <input
                                type="text"
                                value={form.unitLabel}
                                onChange={e =>
                                    setForm(prev => ({ ...prev, unitLabel: e.target.value }))
                                }
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                                placeholder="/mo"
                            />
                        </div>
                    )}

                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Description
                        </label>
                        <textarea
                            value={form.description}
                            onChange={e =>
                                setForm(prev => ({ ...prev, description: e.target.value }))
                            }
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                            placeholder="Plan description shown to operators"
                        />
                    </div>

                    <label className="lg:col-span-2 inline-flex items-center gap-3 text-sm font-medium text-slate-600">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e =>
                                setForm(prev => ({ ...prev, isActive: e.target.checked }))
                            }
                            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                        />
                        Active plan
                    </label>

                    {/* Features & Limitations */}
                    <div className="lg:col-span-2 pt-6 border-t border-slate-100">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-4">
                            Limits & Features
                        </h3>
                        
                        <div className="grid gap-4 sm:grid-cols-2 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Max Sites
                                </label>
                                <input
                                    type="number"
                                    min="-1"
                                    step="1"
                                    value={form.limits.maxSites}
                                    onChange={e =>
                                        setForm(prev => ({ ...prev, limits: { ...prev.limits, maxSites: e.target.value } }))
                                    }
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                                    placeholder="Leave blank for unconstrained"
                                />
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">
                                    Use -1 for unlimited
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Monthly Bookings
                                </label>
                                <input
                                    type="number"
                                    min="-1"
                                    step="1"
                                    value={form.limits.monthlyBookings}
                                    onChange={e =>
                                        setForm(prev => ({ ...prev, limits: { ...prev.limits, monthlyBookings: e.target.value } }))
                                    }
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600"
                                    placeholder="Leave blank for unconstrained"
                                />
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">
                                    Use -1 for unlimited (Operator limitation)
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Custom Public Features
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1"
                                    onClick={() => setForm(prev => ({
                                        ...prev,
                                        customFeatures: [...prev.customFeatures, { id: Math.random().toString(36).substring(7), name: '', included: true }]
                                    }))}
                                >
                                    <Plus className="size-3" /> Add Feature
                                </Button>
                            </div>
                            {form.customFeatures.map((feat, index) => (
                                <div key={feat.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={feat.included}
                                        onChange={e => {
                                            const updated = [...form.customFeatures];
                                            updated[index].included = e.target.checked;
                                            setForm(prev => ({ ...prev, customFeatures: updated }));
                                        }}
                                        className="size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 ml-2"
                                    />
                                    <input
                                        type="text"
                                        required
                                        value={feat.name}
                                        onChange={e => {
                                            const updated = [...form.customFeatures];
                                            updated[index].name = e.target.value;
                                            setForm(prev => ({ ...prev, customFeatures: updated }));
                                        }}
                                        className="flex-1 h-10 px-3 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-600"
                                        placeholder="e.g. Priority Support"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = form.customFeatures.filter(f => f.id !== feat.id);
                                            setForm(prev => ({ ...prev, customFeatures: updated }));
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg shrink-0"
                                    >
                                        &times; Remove
                                    </button>
                                </div>
                            ))}
                            {form.customFeatures.length === 0 && (
                                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm font-medium text-slate-500">
                                    No custom features defined for this plan.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex items-center gap-3 pt-2">
                        <Button type="submit" loading={isSaving} className="h-11 gap-2">
                            {editingPlanId ? (
                                <Pencil className="size-4" />
                            ) : (
                                <Plus className="size-4" />
                            )}
                            {editingPlanId ? 'Update Plan' : 'Create Plan'}
                        </Button>
                        {editingPlanId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="h-11 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Plans</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {plans.length} plan{plans.length === 1 ? '' : 's'} configured
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <CreditCard className="size-4" />
                        Public billing catalogue
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(item => (
                            <div
                                key={item}
                                className="h-20 rounded-2xl bg-slate-50 animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {plans.map(plan => (
                            <div
                                key={plan.id}
                                className="px-8 py-6 flex flex-col lg:flex-row lg:items-center gap-4 justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h4 className="text-base font-black text-slate-800">
                                            {plan.name}
                                        </h4>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${plan.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700">
                                            {plan.billingType}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 max-w-2xl">
                                        {plan.description || 'No description provided.'}
                                    </p>
                                    <p className="text-sm font-bold text-slate-700">
                                        {plan.billingType === 'payg' ? (
                                            <>
                                                £{plan.platformFee ?? plan.monthlyPrice}{' '}
                                                <span className="text-slate-400 font-medium">
                                                    {plan.unitLabel || '/booking'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                £{plan.monthlyPrice}{' '}
                                                <span className="text-slate-400 font-medium">
                                                    {plan.unitLabel || '/mo'}
                                                </span>
                                                {plan.annualPrice ? (
                                                    <span className="ml-3 text-slate-400 font-medium">
                                                        Annual: £{plan.annualPrice}
                                                    </span>
                                                ) : null}
                                                <span className="ml-3 text-slate-500 font-medium">
                                                    Included bookings: {plan.includedBookings ?? 0}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                    
                                    {plan.customFeatures && plan.customFeatures.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                                            {plan.customFeatures.map(f => (
                                                <span key={f.id} className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${f.included ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400 line-through'}`}>
                                                    {f.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 gap-2"
                                        onClick={() => startEdit(plan)}
                                    >
                                        <Pencil className="size-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 gap-2 text-amber-700 border-amber-200 hover:bg-amber-50"
                                        onClick={() => handleDeactivate(plan.id)}
                                        disabled={!plan.isActive || isSaving}
                                    >
                                        <Power className="size-4" />
                                        Deactivate
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {!plans.length && (
                            <div className="px-8 py-16 text-center text-slate-500">
                                <CheckCircle2 className="size-10 mx-auto mb-4 text-slate-300" />
                                No plans configured yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
