import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { PendingVerification } from '../../types';
import { Skeleton } from '../ui/skeleton';

interface PendingVerificationsQueueProps {
    pendingVerifications: PendingVerification[];
    onReviewVerification: (verification: PendingVerification) => void;
    isLoading?: boolean;
}

function resolveVerificationLabel(verification: PendingVerification) {
    const record = verification as any;
    if (record.type === 'site') return 'Site Verification';
    if (
        record.type === 'operator' ||
        (record.type === 'identity' && record.userRole === 'operator')
    ) {
        return 'Operator Verification';
    }
    return 'Landowner Verification';
}

function resolveVerificationSubject(verification: PendingVerification) {
    if (verification.type === 'site') {
        return verification.siteName || verification.siteId || 'Unknown Site Submission';
    }
    return verification.userName || verification.userEmail || 'Unknown Account Submission';
}

export function PendingVerificationsQueue({
    pendingVerifications,
    onReviewVerification,
    isLoading = false,
}: PendingVerificationsQueueProps) {
    const allPendingVerifications = pendingVerifications
        .filter(v => v.status === 'PENDING')
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-10"
        >
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                        All Pending Verifications
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Review, approve, or reject every pending verification from one queue.
                    </p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider rounded-lg inline-flex items-center gap-2">
                    {isLoading ? (
                        <>
                            <Loader2 className="size-3 animate-spin" />
                            Loading
                        </>
                    ) : (
                        <>{allPendingVerifications.length} Pending</>
                    )}
                </span>
            </div>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(index => (
                        <div
                            key={index}
                            className="grid grid-cols-5 gap-4 rounded-2xl border border-slate-100 p-4"
                        >
                            <Skeleton className="h-8 w-28 rounded-lg" />
                            <Skeleton className="h-5 w-40 rounded-lg" />
                            <Skeleton className="h-5 w-36 rounded-lg" />
                            <Skeleton className="h-5 w-24 rounded-lg" />
                            <div className="flex justify-end">
                                <Skeleton className="h-9 w-24 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : allPendingVerifications.length === 0 ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                    No pending verifications right now.
                </div>
            ) : (
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Organisation / Contact
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Submitted
                                </th>
                                <th className="text-right px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Admin Controls
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allPendingVerifications.map(verification => (
                                <tr key={verification.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-4">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase rounded-lg tracking-wider">
                                            {resolveVerificationLabel(verification)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-bold text-slate-800">
                                            {resolveVerificationSubject(verification)}
                                        </p>
                                        {verification.flyerId && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Flyer ID: {verification.flyerId}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-semibold text-slate-600">
                                            {verification.userOrganisation || 'Independent'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {verification.userEmail || 'No contact email'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm font-semibold text-slate-700">
                                            {new Date(verification.createdAt).toLocaleDateString(
                                                'en-GB'
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(verification.createdAt).toLocaleTimeString(
                                                'en-GB',
                                                {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }
                                            )}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onReviewVerification(verification)}
                                            className="font-bold"
                                        >
                                            Review
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
}
