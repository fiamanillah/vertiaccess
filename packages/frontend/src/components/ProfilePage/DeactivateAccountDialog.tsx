import { AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface DeactivateAccountDialogProps {
    open: boolean;
    accessUntilDate: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export function DeactivateAccountDialog({
    open,
    accessUntilDate,
    onCancel,
    onConfirm,
}: DeactivateAccountDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl shadow-slate-900/15 isolation-isolate"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                        <AlertCircle className="size-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Deactivate Account</h3>
                        <p className="text-sm text-slate-500">This action cannot be undone</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-sm text-slate-700">
                        Are you sure you want to deactivate the account?
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar className="size-4 text-amber-600" />
                            <p className="text-sm font-semibold text-amber-800">
                                Access Until Next Billing Period
                            </p>
                        </div>
                        <p className="text-xs text-amber-700">
                            You will continue to have full access to the platform until{' '}
                            <span className="font-bold">{accessUntilDate}</span>
                        </p>
                    </div>
                    <p className="text-xs text-slate-500">
                        After this date, your account will be permanently deactivated and you will
                        lose access to all flight records, site data, and financial history.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all"
                    >
                        Deactivate Account
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
