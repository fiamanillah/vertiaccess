import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle, Clock, Shield, Loader } from 'lucide-react';
import type { CLZSelection } from '../../types';
import { Skeleton } from '../ui/skeleton';

interface OperatorCLZSectionProps {
    clzSelections: CLZSelection[];
    isLoading?: boolean;
    isPayingClz: Record<string, boolean>;
    onConfirmUsage: (selection: CLZSelection, used: boolean) => Promise<void>;
    onRemove: (id: string) => void;
}

export function OperatorCLZSection({
    clzSelections,
    isLoading = false,
    isPayingClz,
    onConfirmUsage,
    onRemove,
}: OperatorCLZSectionProps) {
    const [confirmError, setConfirmError] = useState<Record<string, string>>({});

    const isOperationEnded = (selection: CLZSelection): boolean => {
        if (!selection.operationEndDate || !selection.operationEndTime) return false;
        const endDateTime = new Date(
            `${selection.operationEndDate}T${selection.operationEndTime}:00`
        );
        return new Date() > endDateTime;
    };

    const handleConfirmUsage = async (selection: CLZSelection, used: boolean) => {
        try {
            setConfirmError(prev => {
                const newErrors = { ...prev };
                delete newErrors[selection.id];
                return newErrors;
            });
            await onConfirmUsage(selection, used);
        } catch (error: any) {
            setConfirmError(prev => ({
                ...prev,
                [selection.id]: error?.message || 'Failed to confirm usage',
            }));
        }
    };

    return (
        <div className="space-y-6">
            {isLoading && (
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-blue-100">
                        <div className="size-3 rounded-full bg-blue-600 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Loading Emergency & Recovery zones</p>
                        <p className="text-xs text-slate-500">Fetching CLZ selections and confirmation state...</p>
                    </div>
                </div>
            )}

            {isLoading ? (
                <>
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-start gap-4 flex-1">
                                    <Skeleton className="size-11 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-6 w-40" />
                                        <Skeleton className="h-3 w-48 opacity-50" />
                                        <Skeleton className="h-4 w-56 mt-3" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-16 w-full rounded-3xl" />
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                <>
                    {clzSelections.map(sel => {
                        const ended = isOperationEnded(sel);
                        const confirmed = sel.clzUsed !== null;
                        const isProcessing = isPayingClz[sel.id];
                        const error = confirmError[sel.id];

                        return (
                            <motion.div
                                key={sel.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <div className="mb-6 flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
                                            <AlertTriangle className="size-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black tracking-tight text-slate-800">
                                                {sel.siteName}
                                            </h3>
                                            <div className="mt-1 flex flex-col gap-0.5">
                                                <p className="text-xs font-bold text-slate-400">
                                                    Selected on {new Date(sel.createdAt).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                    })}, {new Date(sel.createdAt).toLocaleTimeString('en-GB', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                                <p className="text-sm font-bold text-slate-500">
                                                    Operation: {new Date(sel.operationStartDate || '').toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })}, {sel.operationStartTime} - {new Date(sel.operationEndDate || '').toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })}, {sel.operationEndTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onRemove(sel.id)}
                                        disabled={isProcessing}
                                        className="text-xs font-black uppercase tracking-wider text-red-500 hover:underline disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                </div>

                                {error && (
                                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                                        <p className="text-sm font-medium text-red-700">{error}</p>
                                    </div>
                                )}

                                {confirmed ? (
                                    <div className="flex items-center gap-4 rounded-3xl border border-[#BBF7D0] bg-[#DCFCE7]/40 p-5">
                                        <div className="flex size-8 items-center justify-center rounded-full bg-white shadow-sm">
                                            <CheckCircle className="size-5 text-[#15803D]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#15803D]">
                                                Usage: {sel.clzUsed ? 'Used' : 'Not used'}
                                            </p>
                                            <p className="text-xs font-bold uppercase tracking-wider text-[#15803D]/70">
                                                Confirmed on {new Date(sel.clzConfirmedAt || '').toLocaleDateString('en-GB')}, {new Date(sel.clzConfirmedAt || '').toLocaleTimeString('en-GB')}
                                            </p>
                                        </div>
                                    </div>
                                ) : ended ? (
                                    <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
                                        <div className="mb-4 flex items-center gap-3">
                                            <AlertTriangle className="size-5 text-amber-600" />
                                            <p className="text-sm font-black uppercase tracking-tight text-amber-900">
                                                Window closed • Confirm usage
                                            </p>
                                        </div>
                                        <p className="mb-6 text-sm font-medium leading-relaxed text-amber-800">
                                            Was this Emergency & Recovery site utilized during the active flight window?
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => {
                                                    void handleConfirmUsage(sel, true);
                                                }}
                                                disabled={isProcessing}
                                                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-black text-white shadow-lg shadow-red-500/10 transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader className="size-4 animate-spin" />
                                                        <span>Processing...</span>
                                                    </>
                                                ) : (
                                                    'Yes, Site was used'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    void handleConfirmUsage(sel, false);
                                                }}
                                                disabled={isProcessing}
                                                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#15803D] text-sm font-black text-white shadow-lg shadow-emerald-500/10 transition-all hover:bg-[#166534] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader className="size-4 animate-spin" />
                                                        <span>Processing...</span>
                                                    </>
                                                ) : (
                                                    'No, Not used'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 rounded-3xl border border-[#D6E4FF] bg-[#EAF2FF]/60 p-5">
                                        <div className="flex size-8 items-center justify-center rounded-full bg-white shadow-sm">
                                            <Clock className="size-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-blue-600">Operation window active</p>
                                            <p className="text-xs font-bold uppercase tracking-wider text-blue-600/70">
                                                Confirm usage after window closes.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                    {clzSelections.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                            <Shield className="mx-auto mb-4 size-12 text-slate-300" />
                            <p className="font-medium text-slate-500">
                                No Emergency & Recovery selections pre-positioned.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
