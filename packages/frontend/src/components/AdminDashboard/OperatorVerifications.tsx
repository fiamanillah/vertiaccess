import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle, Filter, IdCard } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { HumanIdChip } from '../ui/HumanIdChip';

interface OperatorVerificationsProps {
    pendingVerifications: any[];
    onReviewVerification: (verification: any) => void;
    isLoading?: boolean;
}

export function OperatorVerifications({
    pendingVerifications,
    onReviewVerification,
    isLoading = false,
}: OperatorVerificationsProps) {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // pendingVerifications is pre-filtered by AdminDashboard to only contain operator verifications
    const operatorVerifications = pendingVerifications;

    const filteredVerifications =
        statusFilter === 'ALL'
            ? operatorVerifications
            : operatorVerifications.filter(v => v.status === statusFilter);

    const statusBadgeClass = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'REJECTED':
                return 'bg-red-50 text-red-700 border-red-100';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    const statusDotClass = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-emerald-500';
            case 'REJECTED':
                return 'bg-red-500';
            default:
                return 'bg-amber-500';
        }
    };

    /**
     * Resolve flyerId from the verification record.
     * The backend includes `flyerId` at the top level (from the operatorProfile).
     * For legacy records we fall back to the submittedDocuments array.
     */
    const resolveFlyerId = (v: any): string => {
        if (v.flyerId) return v.flyerId;
        const docs: any[] = Array.isArray(v.submittedDocuments) ? v.submittedDocuments : [];
        const credDoc = docs.find(d => d.documentType === 'operator_credentials');
        return credDoc?.flyerId ?? 'N/A';
    };

    const resolveOperatorRef = (v: any): string => {
        const docs: any[] = Array.isArray(v.submittedDocuments) ? v.submittedDocuments : [];
        const credDoc = docs.find(d => d.documentType === 'operator_credentials');
        return credDoc?.operatorReference ?? '—';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
            {/* Filter bar */}
            <div className="px-8 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-4">
                    <Filter className="size-4 text-slate-400" />
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        Filter by Status:
                    </label>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    {operatorVerifications.length > 0 && !isLoading && (
                        <span className="ml-auto px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-lg">
                            {operatorVerifications.filter(v => v.status === 'PENDING').length}{' '}
                            Pending
                        </span>
                    )}
                    {isLoading && (
                        <span className="ml-auto inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                            <ShieldCheck className="size-3 animate-pulse" />
                            Loading
                        </span>
                    )}
                </div>
            </div>

            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Operator
                        </th>
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Organisation
                        </th>
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Flyer ID
                        </th>
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Operator Ref
                        </th>
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Submitted
                        </th>
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="text-right px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <tr
                                key={`operator-loading-${index}`}
                                className="group hover:bg-slate-50 transition-colors"
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="size-10 rounded-xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-28" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <Skeleton className="h-4 w-36" />
                                </td>
                                <td className="px-8 py-6">
                                    <Skeleton className="h-4 w-28" />
                                </td>
                                <td className="px-8 py-6">
                                    <Skeleton className="h-4 w-24" />
                                </td>
                                <td className="px-8 py-6">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="mt-2 h-3 w-20" />
                                </td>
                                <td className="px-8 py-6">
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <Skeleton className="ml-auto h-10 w-24 rounded-xl" />
                                </td>
                            </tr>
                        ))
                    ) : filteredVerifications.length > 0 ? (
                        filteredVerifications.map(v => (
                            <tr key={v.id} className="group hover:bg-slate-50 transition-colors">
                                {/* Operator name + email */}
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 bg-[#EAF2FF] rounded-xl flex items-center justify-center text-blue-600">
                                            <ShieldCheck className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-slate-800">
                                                {v.userName || '—'}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {v.userEmail || '—'}
                                            </p>
                                            <div className="mt-1">
                                                <HumanIdChip id={v.id} prefix="vt-case" copyable />
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Organisation */}
                                <td className="px-8 py-6">
                                    <p className="text-sm font-bold text-slate-600">
                                        {v.userOrganisation || 'Independent Operator'}
                                    </p>
                                </td>

                                {/* Flyer ID */}
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <IdCard className="size-3.5 text-slate-400" />
                                        <p className="text-xs text-slate-700 font-mono font-bold uppercase tracking-wider">
                                            {resolveFlyerId(v)}
                                        </p>
                                    </div>
                                </td>

                                {/* Operator Reference */}
                                <td className="px-8 py-6">
                                    <p className="text-xs text-slate-600 font-mono font-bold uppercase tracking-wider">
                                        {resolveOperatorRef(v)}
                                    </p>
                                </td>

                                {/* Submitted date */}
                                <td className="px-8 py-6">
                                    <p className="text-sm font-bold text-slate-600">
                                        {new Date(v.createdAt).toLocaleDateString('en-GB')}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {new Date(v.createdAt).toLocaleTimeString('en-GB', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </td>

                                {/* Status badge */}
                                <td className="px-8 py-6">
                                    <div
                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusBadgeClass(v.status)}`}
                                    >
                                        <div
                                            className={`size-1.5 rounded-full ${statusDotClass(v.status)}`}
                                        />
                                        {v.status}
                                    </div>
                                </td>

                                {/* Action */}
                                <td className="px-8 py-6 text-right">
                                    {v.status === 'PENDING' ? (
                                        <button
                                            onClick={() => onReviewVerification(v)}
                                            className="h-10 px-6 bg-white border border-slate-200 text-blue-600 font-black text-sm rounded-xl hover:bg-slate-50 transition-all"
                                        >
                                            Review
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-end gap-2 text-slate-400">
                                            <CheckCircle className="size-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                Processed
                                            </span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <ShieldCheck className="size-10 text-slate-200" />
                                    <p className="text-slate-400 font-bold text-sm">
                                        {statusFilter === 'ALL'
                                            ? 'No operator verifications found'
                                            : `No operator verifications with status "${statusFilter}"`}
                                    </p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </motion.div>
    );
}
