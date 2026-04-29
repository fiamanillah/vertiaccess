import type { Site, PaymentCard } from '../../types';
import {
    Download,
    CheckCircle,
    Loader2,
    CreditCard,
    Shield,
    Clock,
    MapPin,
    FileText,
    Plane,
    Zap,
    Info,
} from 'lucide-react';
import { motion } from 'motion/react';

// Brand label helpers
function getBrandLabel(brand: string): string {
    const map: Record<string, string> = {
        visa: 'Visa',
        mastercard: 'Mastercard',
        amex: 'American Express',
        discover: 'Discover',
        jcb: 'JCB',
        unionpay: 'UnionPay',
        diners: 'Diners Club',
    };
    return map[brand?.toLowerCase()] ?? brand?.toUpperCase() ?? 'Card';
}

function getBrandColor(brand: string): string {
    const map: Record<string, string> = {
        visa: 'text-blue-700',
        mastercard: 'text-red-600',
        amex: 'text-teal-600',
    };
    return map[brand?.toLowerCase()] ?? 'text-slate-700';
}

interface Step3ReviewSubmitProps {
    site: Site;
    activeWorkflow: 'toal' | 'clz';
    // Real form data from parent
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    operationReference: string;
    droneModel: string;
    missionIntent: string;
    // Billing / subscription
    hasActiveSubscription: boolean;
    subscriptionPlanName: string | null;
    slotCount: number;
    slotFee: number;
    platformFee: number;
    totalCost: number;
    // Payment card on file (for masked display)
    paymentCard?: PaymentCard | null;
    isPaymentCardLoading?: boolean;
    onRequestPaymentSetup?: () => void;
    // PAYG Stripe payment
    paygClientSecret: string | null;
    paygPaymentIntentId: string | null;
    isCreatingIntent: boolean;
    onCreatePaygIntent: () => void;
    // Conflict acknowledgement + submit
    conflictAcknowledged: boolean;
    onConflictAcknowledgedChange: (v: boolean) => void;
    isSubmitting: boolean;
    onStepChange: (step: 1 | 2) => void;
    onSubmit: () => void;
}

export function Step3ReviewSubmit({
    site,
    activeWorkflow,
    startDate,
    startTime,
    endDate,
    endTime,
    operationReference,
    droneModel,
    missionIntent,
    hasActiveSubscription,
    subscriptionPlanName,
    slotCount,
    slotFee,
    platformFee,
    totalCost,
    paymentCard,
    isPaymentCardLoading = false,
    onRequestPaymentSetup,
    paygClientSecret,
    paygPaymentIntentId,
    isCreatingIntent,
    onCreatePaygIntent,
    conflictAcknowledged,
    onConflictAcknowledgedChange,
    isSubmitting,
    onStepChange,
    onSubmit,
}: Step3ReviewSubmitProps) {
    const accessCharge = slotFee;
    const paymentReady = !!paymentCard;
    const canSubmit =
        conflictAcknowledged &&
        paymentReady &&
        !isSubmitting &&
        !isCreatingIntent &&
        !isPaymentCardLoading;

    const formatDateTime = (date: string, time: string) => {
        if (!date || !time) return '—';
        try {
            const dt = new Date(`${date}T${time}`);
            return dt.toLocaleString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return `${date} ${time}`;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10 px-4 sm:px-8 pb-10"
        >
            {/* ── Booking Summary ───────────────────────────────────── */}
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/40">
                <div className="px-8 py-6 border-b border-slate-50 bg-linear-to-r from-slate-50/50 to-white">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Operation Summary
                    </h4>
                </div>
                <div className="p-8 grid sm:grid-cols-2 gap-x-12 gap-y-6">
                    {[
                        { label: 'Operational Site', value: site.name, icon: MapPin },
                        {
                            label: 'Reference ID',
                            value: operationReference || 'Not Specified',
                            icon: FileText,
                        },
                        {
                            label: 'Aircraft Type',
                            value: droneModel || 'Not Specified',
                            icon: Plane,
                        },
                        {
                            label: 'Request Type',
                            value:
                                activeWorkflow === 'toal' ? 'Planned TOAL' : 'Emergency & Recovery',
                            icon: Zap,
                        },
                        {
                            label: 'Window Start',
                            value: formatDateTime(startDate, startTime),
                            icon: Clock,
                        },
                        {
                            label: 'Window End',
                            value: formatDateTime(endDate, endTime),
                            icon: Clock,
                        },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="space-y-1.5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Icon className="size-3" />
                                {label}
                            </p>
                            <p className="font-bold text-slate-900 text-sm leading-tight">
                                {value}
                            </p>
                        </div>
                    ))}
                    <div className="sm:col-span-2 pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Info className="size-3" />
                            Mission Intent
                        </p>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                            "{missionIntent || 'No intent description provided.'}"
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Payment Path Display ──────────────────────────────── */}
            {hasActiveSubscription ? (
                /* Option A: Subscription */
                <div className="rounded-2xl border border-green-200 bg-green-50 overflow-hidden shadow-sm">
                    <div className="px-4 sm:px-6 py-4 border-b border-green-100 flex items-start sm:items-center gap-3">
                        <div className="size-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-green-100">
                            <Shield className="size-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-green-800">
                                Subscription Active — Platform Fee Waived
                            </p>
                            <p className="text-xs text-green-700 mt-0.5">
                                {subscriptionPlanName || 'Your plan'} covers the platform booking
                                fee.
                            </p>
                        </div>
                        <div className="ml-auto">
                            <span className="text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-full">
                                Option A
                            </span>
                        </div>
                    </div>
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
                        <span className="text-green-700 font-medium">Platform fee:</span>
                        <span className="text-green-700 font-bold flex items-center gap-1.5">
                            <CheckCircle className="size-4" />
                            Covered by subscription
                        </span>
                    </div>
                    {accessCharge > 0 && (
                        <div className="px-6 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-sm">
                            <span className="text-green-700 font-medium">Selected slot fee:</span>
                            <span className="font-bold text-green-800">
                                £{accessCharge.toFixed(2)}
                            </span>
                        </div>
                    )}
                    {!paymentCard && (
                        <div className="mx-6 mb-4 mt-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold text-amber-900">
                                Add a payment card to submit bookings.
                            </p>
                            {onRequestPaymentSetup && (
                                <button
                                    onClick={onRequestPaymentSetup}
                                    className="text-blue-600 text-xs font-bold hover:underline shrink-0"
                                >
                                    Add Card →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* Option B: Pay As You Go */
                <div className="rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm">
                    <div className="px-4 sm:px-6 py-4 border-b border-amber-100 flex items-start sm:items-center gap-3 bg-amber-50">
                        <div className="size-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-amber-100">
                            <CreditCard className="size-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900">
                                Pay As You Go — Platform Fee Applies
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                No active subscription. A per-booking fee is charged.
                            </p>
                        </div>
                        <div className="ml-auto">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-full">
                                Option B
                            </span>
                        </div>
                    </div>

                    {!site.autoApprove && (
                        <div className="px-6 py-4 flex items-start justify-between border-b border-indigo-100 bg-indigo-50 gap-3">
                            <div className="flex items-center gap-3">
                                <Shield className="size-5 text-indigo-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-indigo-900">
                                        Payment is delayed pending approval
                                    </p>
                                    <p className="text-[11px] text-indigo-700 font-medium">
                                        Landowner must approve your request first. Payment will be
                                        requested then.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card on file display */}
                    {paymentCard ? (
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="size-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                                    <CreditCard className="size-4 text-slate-500" />
                                </div>
                                <div>
                                    <p
                                        className={`text-sm font-bold ${getBrandColor(paymentCard.brand)}`}
                                    >
                                        {getBrandLabel(paymentCard.brand)} •••• {paymentCard.last4}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Expires {paymentCard.expiryMonth}/{paymentCard.expiryYear}
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-full">
                                Payment Card
                            </span>
                        </div>
                    ) : isPaymentCardLoading ? (
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="size-9 bg-slate-100 rounded-lg animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-3 w-40 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-2.5 w-28 bg-slate-100 rounded animate-pulse" />
                                </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-full">
                                Loading card
                            </span>
                        </div>
                    ) : (
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-slate-100">
                            <p className="text-sm text-slate-500">No payment card on file.</p>
                            {onRequestPaymentSetup && (
                                <button
                                    onClick={onRequestPaymentSetup}
                                    className="text-blue-600 text-xs font-bold hover:underline"
                                >
                                    Add Card →
                                </button>
                            )}
                        </div>
                    )}

                    {platformFee > 0 && (
                        <div className="px-6 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm border-b border-slate-50">
                            <span className="text-slate-500 font-medium">Platform fee (PAYG):</span>
                            <span className="font-bold text-slate-800">
                                £{platformFee.toFixed(2)}
                            </span>
                        </div>
                    )}
                    {accessCharge > 0 && (
                        <div className="px-6 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm border-b border-slate-50">
                            <span className="text-slate-500 font-medium">Selected slot fee:</span>
                            <span className="font-bold text-slate-800">
                                £{accessCharge.toFixed(2)}
                            </span>
                        </div>
                    )}

                    <div className="px-6 py-5 bg-slate-900 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 blur-2xl rounded-full -mr-8 -mt-8" />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                    Total Access Cost
                                </p>
                                <p className="text-sm text-slate-300 font-medium">
                                    All-inclusive platform & site fees
                                </p>
                            </div>
                            <div className="text-3xl font-black text-white tracking-tight">
                                £{totalCost.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-5">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <Clock className="size-5 text-slate-500 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-slate-800">
                                    No payment needed now
                                </p>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    {activeWorkflow === 'clz' ? (
                                        <>
                                            Once approved, <strong>£{totalCost.toFixed(2)}</strong>{' '}
                                            is charged only if you confirm this Emergency & Recovery
                                            site was used.
                                        </>
                                    ) : (
                                        <>
                                            Once approved, <strong>£{totalCost.toFixed(2)}</strong>{' '}
                                            is charged automatically on the booking start date to
                                            your{' '}
                                            {paymentCard
                                                ? `${getBrandLabel(paymentCard.brand)}`
                                                : 'card on file'}
                                            .
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Conflict Acknowledgement & Submit ─────────────────── */}
            <div className="space-y-4">
                <label className="flex items-start gap-4 p-5 bg-amber-50/60 border border-amber-100 rounded-2xl cursor-pointer group hover:bg-amber-50 transition-colors">
                    <input
                        type="checkbox"
                        checked={conflictAcknowledged}
                        onChange={e => onConflictAcknowledgedChange(e.target.checked)}
                        className="mt-0.5 size-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <p className="text-sm text-amber-900 font-semibold leading-relaxed">
                        I acknowledge my operation is not in conflict with other bookings and I have
                        reviewed all site-specific directives.
                    </p>
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => onStepChange(2)}
                        disabled={isSubmitting}
                        className="h-12 px-8 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50 w-full sm:w-auto"
                    >
                        Back
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className={`flex-1 h-12 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 w-full ${
                            canSubmit
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                Submitting…
                            </>
                        ) : (
                            'Submit Request'
                        )}
                    </button>
                </div>
            </div>

            {/* ── GeoJSON download ──────────────────────────────────── */}
            <div className="flex justify-center">
                {activeWorkflow === 'toal' ? (
                    <button
                        onClick={() => {
                            /* handled in parent via SiteDetailsPanel */
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest"
                    >
                        <Download className="size-4" />
                        TOAL GeoJSON
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            /* handled in parent via SiteDetailsPanel */
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:underline uppercase tracking-widest"
                    >
                        <Download className="size-4" />
                        CLZ GeoJSON
                    </button>
                )}
            </div>
        </motion.div>
    );
}
