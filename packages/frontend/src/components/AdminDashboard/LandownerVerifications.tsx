import { motion } from 'motion/react';
import { UserCheck, FileText, CheckCircle, Filter, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import { HumanIdChip } from '../ui/HumanIdChip';

interface LandownerVerificationsProps {
    pendingVerifications: any[];
    onReviewVerification: (verification: any) => void;
    isLoading?: boolean;
}

export function LandownerVerifications({
    pendingVerifications,
    onReviewVerification,
    isLoading = false,
}: LandownerVerificationsProps) {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Identity verifications come from backend with type="identity"
    // Legacy/mock verifications may use type="landowner"
    const landownerVerifications = pendingVerifications.filter(
        v => v.type === 'identity' || v.type === 'landowner'
    );

    const filteredVerifications =
        statusFilter === 'ALL'
            ? landownerVerifications
            : landownerVerifications.filter(v => v.status === statusFilter);

    // Helper: extract displayable documents from either the legacy string[] format
    // or the new backend format: submittedDocuments: [{documentType, fileKey, uploadedAt}]
    const getDocuments = (v: any): { label: string; fileKey?: string; downloadUrl?: string }[] => {
        if (v.submittedDocuments && Array.isArray(v.submittedDocuments)) {
            return v.submittedDocuments.map((doc: any) => ({
                label: doc.documentType?.replace(/_/g, ' ') || 'Document',
                fileKey: doc.fileKey,
                downloadUrl: doc.downloadUrl,
            }));
        }
        if (v.documents && Array.isArray(v.documents)) {
            return v.documents.map((doc: string) => ({ label: doc }));
        }
        return [];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
            {/* Filter Section */}
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
                </div>
            </div>

            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Applicant Name
                        </th>
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Organisation
                        </th>
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Contact
                        </th>
                        <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                            Verification Token
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
                                key={`landowner-loading-${index}`}
                                className="border-b border-slate-50"
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="size-10 rounded-xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-44" />
                                            <Skeleton className="h-3 w-28" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <Skeleton className="h-4 w-40" />
                                </td>
                                <td className="px-8 py-6">
                                    <Skeleton className="h-3 w-32" />
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
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
                        filteredVerifications.map(v => {
                            const docs = getDocuments(v);
                            return (
                                <tr
                                    key={v.id}
                                    className="group hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 bg-[#EAF2FF] rounded-xl flex items-center justify-center text-blue-600">
                                                <UserCheck className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-800">
                                                    {v.userName || v.userEmail || 'Unknown Landowner'}
                                                </p>
                                                <div className="mt-1">
                                                    <HumanIdChip id={v.id} prefix="vt-case" copyable />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-slate-600">
                                            {v.userOrganisation || 'Independent Landowner'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs text-slate-400 font-medium">
                                            {v.userEmail}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            {docs.length > 0 ? (
                                                docs.map((doc, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded flex items-center gap-1.5 capitalize"
                                                    >
                                                        <FileText className="size-3" />
                                                        {doc.label}
                                                        {doc.fileKey && (
                                                            <a
                                                                href={
                                                                    (doc as any).downloadUrl ||
                                                                    doc.fileKey
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-1 text-blue-500 hover:text-blue-700"
                                                                title="View document"
                                                            >
                                                                <ExternalLink className="size-2.5" />
                                                            </a>
                                                        )}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">
                                                    No documents
                                                </span>
                                            )}
                                        </div>
                                    </td>
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
                                    <td className="px-8 py-6">
                                        <div
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                v.status === 'APPROVED'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : v.status === 'REJECTED'
                                                      ? 'bg-red-50 text-red-700 border-red-100'
                                                      : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}
                                        >
                                            <div
                                                className={`size-1.5 rounded-full ${
                                                    v.status === 'APPROVED'
                                                        ? 'bg-emerald-500'
                                                        : v.status === 'REJECTED'
                                                          ? 'bg-red-500'
                                                          : 'bg-amber-500'
                                                }`}
                                            />
                                            {v.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {v.status === 'PENDING' ? (
                                            <button
                                                onClick={() => onReviewVerification(v)}
                                                className="h-10 px-6 bg-white border border-slate-200 text-blue-600 font-black text-sm rounded-xl hover:bg-slate-50 transition-all"
                                            >
                                                Review ID
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
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-8 py-20 text-center">
                                <p className="text-slate-400 font-bold text-sm">
                                    {statusFilter === 'ALL'
                                        ? 'No landowner identity verifications found'
                                        : `No landowner verifications with status "${statusFilter}"`}
                                </p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </motion.div>
    );
}
