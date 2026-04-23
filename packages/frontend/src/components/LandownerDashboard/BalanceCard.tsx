// src/components/LandownerDashboard/BalanceCard.tsx
import { PoundSterling, TrendingUp, AlertCircle, ArrowDownRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export interface BalanceCardProps {
    availableBalance: number;
    pendingBalance: number;
    totalEarned: number;
    loading?: boolean;
    onWithdraw: () => void;
    onConnectBank: () => void;
    stripeConnected: boolean;
}

export function BalanceCard({
    availableBalance,
    pendingBalance,
    totalEarned,
    loading,
    onWithdraw,
    onConnectBank,
    stripeConnected,
}: BalanceCardProps) {
    const available = Number(availableBalance) || 0;
    const pending = Number(pendingBalance) || 0;
    const earned = Number(totalEarned) || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-lg border border-emerald-100 overflow-hidden relative"
        >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full opacity-20 -mr-16 -mt-16" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="size-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <PoundSterling className="size-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">
                                Your Balance
                            </p>
                            <p className="text-sm text-slate-600">Landowner earnings</p>
                        </div>
                    </div>
                    <div className="size-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="size-5 text-emerald-600" />
                    </div>
                </div>

                {/* Main balance display */}
                <div className="mb-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Available to withdraw
                    </p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black text-emerald-700">
                            £{available.toFixed(2)}
                        </p>
                        <span className="text-sm text-slate-600">GBP</span>
                    </div>
                </div>

                {/* Balance breakdown */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-emerald-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Total Earned
                        </p>
                        <p className="text-lg font-black text-slate-800">£{earned.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-amber-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Pending
                        </p>
                        <p className="text-lg font-black text-amber-600">£{pending.toFixed(2)}</p>
                    </div>
                </div>

                {/* Status message */}
                {!stripeConnected && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold text-amber-900 mb-1">
                                Bank account not connected
                            </p>
                            <p className="text-amber-800 text-xs">
                                Connect your bank account to start withdrawing earnings.
                            </p>
                        </div>
                    </div>
                )}

                {/* Withdraw button */}
                <button
                    onClick={stripeConnected ? onWithdraw : onConnectBank}
                    disabled={loading || available <= 0}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all ${
                        available <= 0
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                    }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <ArrowDownRight className="size-4" />
                            {stripeConnected ? 'Withdraw Funds' : 'Connect Bank Account'}
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
