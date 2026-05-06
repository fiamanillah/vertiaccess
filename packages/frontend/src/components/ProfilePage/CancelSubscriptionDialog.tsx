import { AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface CancelSubscriptionDialogProps {
    open: boolean;
    currentPeriodEnd?: string | null;
    onCancel: () => void;
    onConfirm: (immediate: boolean) => void;
}

export function CancelSubscriptionDialog({
    open,
    currentPeriodEnd,
    onCancel,
    onConfirm,
}: CancelSubscriptionDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl shadow-slate-900/15 isolation-isolate"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100">
                        <AlertCircle className="size-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Cancel Subscription</h3>
                        <p className="text-sm text-slate-500">Choose how you'd like to cancel</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-sm text-slate-700">
                        You can cancel immediately to stop future payments now, or schedule
                        cancellation at the end of your current billing period and continue to have
                        access until then.
                    </p>

                    {currentPeriodEnd ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="size-4 text-amber-600" />
                                <p className="text-sm font-semibold text-amber-800">
                                    Current period ends
                                </p>
                            </div>
                            <p className="text-xs text-amber-700">
                                Your subscription will remain active until{' '}
                                <span className="font-bold">{currentPeriodEnd}</span> if you
                                schedule cancellation.
                            </p>
                        </div>
                    ) : null}

                    <p className="text-xs text-slate-500">
                        Cancelling will change billing for your account. Choose the option that
                        suits you.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => onConfirm(false)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all"
                    >
                        Schedule at period end
                    </button>
                    <button
                        onClick={() => onConfirm(true)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all"
                    >
                        Cancel Immediately
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
