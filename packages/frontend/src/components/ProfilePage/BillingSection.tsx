import type { User } from '../../App';
import { Loader2, CreditCard, Zap, CheckCircle } from 'lucide-react';
import type { BillingPlan } from '../../lib/billing';
import type { PaymentCard, WithdrawalMethod } from './ProfileTypes';

interface BillingSectionProps {
    user: User;
    isLandowner: boolean;
    isLoadingWithdrawalMethod: boolean;
    withdrawalMethod: WithdrawalMethod | null;
    savedPaymentCards: PaymentCard[];
    isLoadingPaymentMethods: boolean;
    onOpenPaymentSettings: () => void;
    isUpdatingPlan: boolean;
    setIsUpdatingPlan: (value: boolean) => void;
    isLoadingPlans: boolean;
    selectedPlan: 'Professional' | 'Growth' | 'Enterprise' | 'Standard' | 'Advanced';
    setSelectedPlan: (
        value: 'Professional' | 'Growth' | 'Enterprise' | 'Standard' | 'Advanced'
    ) => void;
    publicPlans: BillingPlan[];
    onUpdatePlan: () => Promise<void>;
    onCancelSubscription: () => void;
}

export function BillingSection({
    user,
    isLandowner,
    isLoadingWithdrawalMethod,
    withdrawalMethod,
    savedPaymentCards,
    isLoadingPaymentMethods,
    onOpenPaymentSettings,
    isUpdatingPlan,
    setIsUpdatingPlan,
    isLoadingPlans,
    selectedPlan,
    setSelectedPlan,
    publicPlans,
    onUpdatePlan,
    onCancelSubscription,
}: BillingSectionProps) {
    if (isLandowner) {
        return (
            <div className="space-y-3 rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-3">
                    <div className="size-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                        <CreditCard className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">
                            Connected Withdrawal Method
                        </p>
                        <p className="text-xs text-slate-500">
                            Receive earnings via payout account
                        </p>
                    </div>
                </div>

                {isLoadingWithdrawalMethod ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Provider
                                </p>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {withdrawalMethod?.provider || 'Stripe Connect'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Status
                                </p>
                                <span
                                    className={`inline-flex mt-1 text-[10px] font-bold px-2 py-1 rounded-full ${withdrawalMethod?.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                                >
                                    {withdrawalMethod?.connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Currency
                                </p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">
                                    {withdrawalMethod?.currency || 'GBP'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Last Synced
                                </p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">
                                    {withdrawalMethod?.lastSyncedAt
                                        ? new Date(withdrawalMethod.lastSyncedAt).toLocaleString()
                                        : 'Not available'}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 border-t border-slate-100 pt-2">
                            {withdrawalMethod?.connected
                                ? 'Your payout method is connected. You can withdraw funds from the Balance tab.'
                                : 'No payout method connected yet. Connect your bank account from the Balance tab to start withdrawals.'}
                        </p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 p-4 space-y-3 flex flex-col">
                <div className="flex items-center gap-3">
                    <div className="size-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                        <CreditCard className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">Payment Methods</p>
                        <p className="text-xs text-emerald-600 font-bold">
                            {savedPaymentCards.length}{' '}
                            {savedPaymentCards.length === 1 ? 'card' : 'cards'} saved
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col space-y-2">
                    {isLoadingPaymentMethods ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="size-5 animate-spin text-slate-400" />
                        </div>
                    ) : savedPaymentCards.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {savedPaymentCards.map(card => (
                                <div
                                    key={card.id}
                                    className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-5 bg-linear-to-br from-indigo-500 to-sky-600 rounded flex items-center justify-center text-xs font-bold text-white">
                                            {card.brand.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {card.brand} •••• {card.last4}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                Exp: {card.expiryMonth}/{card.expiryYear}
                                            </p>
                                        </div>
                                    </div>
                                    {card.isDefault && (
                                        <span className="text-[9px] font-bold bg-green-100 text-green-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                                            Default
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-sm text-slate-500 font-medium">
                                No payment methods added
                            </p>
                        </div>
                    )}

                    <button
                        onClick={onOpenPaymentSettings}
                        className="w-full h-10 bg-white border border-emerald-600 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-all"
                    >
                        Manage Payment Methods
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 space-y-3 flex flex-col">
                <div className="flex items-center gap-3">
                    <div className="size-9 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                        <Zap className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">Package Tier</p>
                        <p className="text-xs text-blue-600 font-bold">
                            Currently:{' '}
                            {user.planTier || (user.isPAYG ? 'Pay-As-You-Go' : 'Professional')}
                        </p>
                    </div>
                </div>

                {isUpdatingPlan && isLoadingPlans ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-slate-400" />
                    </div>
                ) : isUpdatingPlan ? (
                    <div className="space-y-3">
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                                Subscription Tiers
                            </p>
                            {publicPlans
                                .filter(p => p.billingType === 'subscription')
                                .map(tier => (
                                    <button
                                        key={tier.id}
                                        onClick={() =>
                                            setSelectedPlan(
                                                tier.name as BillingSectionProps['selectedPlan']
                                            )
                                        }
                                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${selectedPlan === tier.name ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-0.5">
                                                <p
                                                    className={`text-xs font-bold ${selectedPlan === tier.name ? 'text-blue-600' : 'text-slate-900'}`}
                                                >
                                                    {tier.name}
                                                </p>
                                                <div className="text-right shrink-0">
                                                    <span
                                                        className={`text-xs font-bold ${selectedPlan === tier.name ? 'text-blue-600' : 'text-slate-900'}`}
                                                    >
                                                        £{tier.monthlyPrice}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 ml-0.5">
                                                        {tier.unitLabel || '/mo'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 line-clamp-2">
                                                {tier.description}
                                            </p>
                                        </div>
                                        {selectedPlan === tier.name && (
                                            <CheckCircle className="size-4 text-blue-600 ml-2 shrink-0" />
                                        )}
                                    </button>
                                ))}

                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 pt-1">
                                Pay-As-You-Go
                            </p>
                            {publicPlans
                                .filter(p => p.billingType === 'payg')
                                .map(tier => (
                                    <button
                                        key={tier.id}
                                        onClick={() =>
                                            setSelectedPlan(
                                                tier.name as BillingSectionProps['selectedPlan']
                                            )
                                        }
                                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${selectedPlan === tier.name ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-0.5">
                                                <p
                                                    className={`text-xs font-bold ${selectedPlan === tier.name ? 'text-blue-600' : 'text-slate-900'}`}
                                                >
                                                    {tier.name} PAYG
                                                </p>
                                                <div className="text-right shrink-0">
                                                    <span
                                                        className={`text-xs font-bold ${selectedPlan === tier.name ? 'text-blue-600' : 'text-slate-900'}`}
                                                    >
                                                        £{tier.platformFee || tier.monthlyPrice}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 ml-0.5">
                                                        {tier.unitLabel || '/req'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 line-clamp-2">
                                                {tier.description}
                                            </p>
                                        </div>
                                        {selectedPlan === tier.name && (
                                            <CheckCircle className="size-4 text-blue-600 ml-2 shrink-0" />
                                        )}
                                    </button>
                                ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onUpdatePlan}
                                className="flex-1 h-10 bg-blue-600 text-white rounded-lg text-xs font-bold"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setIsUpdatingPlan(false)}
                                className="flex-1 h-10 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-end space-y-2">
                        <button
                            onClick={() => setIsUpdatingPlan(true)}
                            className="w-full h-10 border border-slate-200 text-blue-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                        >
                            Upgrade Tier
                        </button>
                        <button
                            onClick={onCancelSubscription}
                            className="w-full h-10 text-slate-400 hover:text-red-500 text-xs font-bold transition-colors"
                        >
                            Cancel Subscription
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
