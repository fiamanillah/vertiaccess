import { X, Ban } from 'lucide-react';
import { motion } from 'motion/react';
import type { ManagedUser } from '../../types';

interface UserSuspensionModalProps {
    user: ManagedUser;
    reason: string;
    onReasonChange: (reason: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export function UserSuspensionModal({
    user,
    reason,
    onReasonChange,
    onConfirm,
    onCancel,
}: UserSuspensionModalProps) {
    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-100">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100"
            >
                <div className="p-10">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-5">
                            <div className="size-14 bg-red-50 rounded-3xl flex items-center justify-center text-red-600">
                                <Ban className="size-8" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 leading-none tracking-tight">
                                Suspend {user.role === 'landowner' ? 'Landowner' : 'Operator'}
                                <br />
                                Account
                            </h2>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-slate-400 hover:text-slate-800 transition-colors"
                        >
                            <X className="size-6" />
                        </button>
                    </div>

                    <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6 mb-8">
                        <p className="text-sm font-black text-red-900 mb-3 uppercase tracking-tight">
                            Warning: Suspending this account will:
                        </p>
                        <ul className="space-y-2">
                            {[
                                user.role === 'landowner'
                                    ? 'Set all their sites to inactive status'
                                    : 'Cancel all upcoming bookings',
                                user.role === 'landowner'
                                    ? 'Block new TOAL booking requests'
                                    : 'Prevent new booking requests',
                                user.role === 'landowner'
                                    ? 'Prevent Emergency & Recovery selections for their sites'
                                    : 'Restrict dashboard access',
                                'Restrict their dashboard access',
                            ].map((warning, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-3 text-sm text-red-800/80 font-medium"
                                >
                                    <div className="size-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                                    {warning}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                {user.role === 'landowner' ? 'Landowner' : 'Operator'}
                            </p>
                            <p className="text-lg font-black text-slate-800">{user.name}</p>
                            <p className="text-sm text-slate-500 font-medium">{user.email}</p>
                        </div>
                        {user.role === 'landowner' && (
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Sites
                                </p>
                                <p className="text-base font-bold text-slate-800">
                                    {user.totalSites} total
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                Reason for Suspension *
                            </p>
                            <textarea
                                className="w-full p-5 bg-white border border-slate-200 rounded-3xl text-base min-h-35 focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-slate-400"
                                placeholder="Enter reason for suspending this account..."
                                value={reason}
                                onChange={e => onReasonChange(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 h-14 bg-white border border-slate-200 text-slate-800 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!reason.trim()}
                            onClick={onConfirm}
                            className="flex-1 h-14 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Confirm Suspension
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
