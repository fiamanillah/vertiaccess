// src/components/LandownerDashboard/WithdrawalHistory.tsx
import { useEffect, useState } from 'react';
import { ArrowDownRight, AlertCircle, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { listWithdrawals, type WithdrawalRequest } from '../../lib/withdrawals';
import { toast } from 'sonner';

interface WithdrawalHistoryProps {
    idToken: string;
    loading?: boolean;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'IN_PROGRESS':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'PENDING':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'FAILED':
            return 'bg-red-50 text-red-700 border-red-200';
        case 'CANCELLED':
            return 'bg-slate-50 text-slate-700 border-slate-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return <CheckCircle2 className="size-4" />;
        case 'IN_PROGRESS':
            return <Clock className="size-4" />;
        case 'PENDING':
            return <Clock className="size-4" />;
        case 'FAILED':
            return <XCircle className="size-4" />;
        case 'CANCELLED':
            return <XCircle className="size-4" />;
        default:
            return <AlertCircle className="size-4" />;
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'Completed';
        case 'IN_PROGRESS':
            return 'In Progress';
        case 'PENDING':
            return 'Pending';
        case 'FAILED':
            return 'Failed';
        case 'CANCELLED':
            return 'Cancelled';
        default:
            return status;
    }
};

export function WithdrawalHistory({ idToken, loading: initialLoading }: WithdrawalHistoryProps) {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(initialLoading ?? true);

    useEffect(() => {
        const fetchWithdrawals = async () => {
            try {
                const data = await listWithdrawals(idToken);
                setWithdrawals(data);
            } catch (err: any) {
                toast.error('Failed to load withdrawal history');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (idToken) {
            fetchWithdrawals();
        }
    }, [idToken]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-slate-400" />
                </div>
            </div>
        );
    }

    if (withdrawals.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="text-center py-8">
                    <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowDownRight className="size-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600 font-medium">No withdrawal history yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                        Your withdrawal requests will appear here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
        >
            <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <ArrowDownRight className="size-5 text-slate-600" />
                    Withdrawal History
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                    Track your withdrawal requests and payouts
                </p>
            </div>

            <div className="space-y-3">
                {withdrawals.map(withdrawal => (
                    <motion.div
                        key={withdrawal.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-slate-100 rounded-full flex items-center justify-center">
                                    {getStatusIcon(withdrawal.status)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">
                                        £{withdrawal.amount.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Requested{' '}
                                        {new Date(withdrawal.requestedAt).toLocaleDateString(
                                            'en-GB',
                                            {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            }
                                        )}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${getStatusColor(withdrawal.status)}`}
                            >
                                {getStatusIcon(withdrawal.status)}
                                {getStatusLabel(withdrawal.status)}
                            </span>
                        </div>

                        {withdrawal.completedAt && (
                            <div className="text-xs text-slate-500">
                                Completed{' '}
                                {new Date(withdrawal.completedAt).toLocaleDateString('en-GB', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
