// src/components/LandownerDashboard/WithdrawalModal.tsx
import { useState } from 'react';
import { X, ArrowDownRight, AlertCircle, Heart, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { createWithdrawalRequest, type LandownerBalance } from '../../lib/withdrawals';

interface WithdrawalModalProps {
    onClose: () => void;
    balance: LandownerBalance;
    idToken: string;
    onWithdrawalSuccess: () => void;
}

export function WithdrawalModal({
    onClose,
    balance,
    idToken,
    onWithdrawalSuccess,
}: WithdrawalModalProps) {
    const [step, setStep] = useState<'amount' | 'confirm' | 'success'>('amount');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleWithdrawal = async () => {
        setError(null);
        setLoading(true);

        try {
            const withdrawAmount = parseFloat(amount);

            if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
                setError('Please enter a valid amount');
                toast.error('Please enter a valid amount');
                return;
            }

            if (withdrawAmount > balance.availableBalance) {
                setError(
                    `Insufficient balance. Available: £${balance.availableBalance.toFixed(2)}`
                );
                toast.error(`Insufficient balance`);
                return;
            }

            if (withdrawAmount < 20) {
                setError('Minimum withdrawal amount is £20');
                toast.error('Minimum withdrawal amount is £20');
                return;
            }

            await createWithdrawalRequest(idToken, withdrawAmount);

            setStep('success');
            toast.success(`Withdrawal of £${withdrawAmount.toFixed(2)} requested!`);
        } catch (err: any) {
            const message = err.message || 'Failed to process withdrawal';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (step === 'success') {
            onWithdrawalSuccess();
        }
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <ArrowDownRight className="size-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">
                                    {step === 'success' ? 'Withdrawal Requested' : 'Withdraw Funds'}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X className="size-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Amount Step */}
                        {step === 'amount' && (
                            <>
                                <div className="space-y-4">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                                            Available Balance
                                        </p>
                                        <p className="text-2xl font-black text-emerald-700">
                                            £{balance.availableBalance.toFixed(2)}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Withdrawal Amount (£)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                                                £
                                            </span>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={e => {
                                                    setAmount(e.target.value);
                                                    setError(null);
                                                }}
                                                placeholder="0.00"
                                                min="20"
                                                max={balance.availableBalance}
                                                step="0.01"
                                                className="w-full px-4 py-3 pl-8 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Minimum £20, Maximum £
                                            {balance.availableBalance.toFixed(2)}
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                            <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    )}

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                        <Heart className="size-5 text-blue-600 shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-bold text-blue-900 mb-1">
                                                Processing Time
                                            </p>
                                            <p className="text-blue-800 text-xs">
                                                Withdrawal requests are typically processed within
                                                1-2 business days.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('confirm')}
                                        disabled={!amount || parseFloat(amount) <= 0}
                                        className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Confirm Step */}
                        {step === 'confirm' && (
                            <>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                                            Withdrawal Summary
                                        </p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600">
                                                    Amount
                                                </span>
                                                <span className="text-lg font-black text-emerald-700">
                                                    £{Number(amount).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="border-t border-slate-200 pt-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-500">
                                                        Processing Time
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        1-2 business days
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                                        <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-bold text-amber-900 mb-1">
                                                Please confirm
                                            </p>
                                            <p className="text-amber-800 text-xs">
                                                By proceeding, you confirm that the bank account
                                                details are correct and owned by you.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('amount')}
                                        className="flex-1 border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleWithdrawal}
                                        disabled={loading}
                                        className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Confirm Withdrawal'
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Success Step */}
                        {step === 'success' && (
                            <>
                                <div className="text-center py-8">
                                    <div className="size-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="size-8 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">
                                        Withdrawal Requested!
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-6">
                                        Your withdrawal of{' '}
                                        <span className="font-bold text-emerald-700">
                                            £{Number(amount).toFixed(2)}
                                        </span>{' '}
                                        has been submitted successfully.
                                    </p>

                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 text-left">
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">
                                            What's Next?
                                        </p>
                                        <ul className="text-sm text-emerald-900 space-y-2">
                                            <li className="flex items-start gap-2">
                                                <span className="text-emerald-600 font-bold">
                                                    ✓
                                                </span>
                                                <span>
                                                    Your request has been submitted to Stripe
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-emerald-600 font-bold">
                                                    ✓
                                                </span>
                                                <span>
                                                    Processing usually takes 1-2 business days
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-emerald-600 font-bold">
                                                    ✓
                                                </span>
                                                <span>
                                                    You'll receive a notification once the funds are
                                                    transferred
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    Done
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
