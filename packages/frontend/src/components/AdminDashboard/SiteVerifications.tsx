import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, FileText, CheckCircle, Filter } from 'lucide-react';
import type { ManagedUser, PendingVerification, Site } from '../../types';
import { normalizeSiteStatus } from '../../lib/site-status';
import { Skeleton } from '../ui/skeleton';
import { HumanIdChip } from '../ui/HumanIdChip';

interface SiteVerificationsProps {
    pendingVerifications: PendingVerification[];
    allSites?: Site[];
    managedUsers?: ManagedUser[];
    onReviewVerification: (verification: PendingVerification) => void;
    isLoading?: boolean;
}

function buildSiteVerification(site: Site, landowner?: ManagedUser): PendingVerification {
    const normalizedStatus = normalizeSiteStatus(site.status);
    const verificationStatus: PendingVerification['status'] =
        normalizedStatus === 'UNDER_REVIEW'
            ? 'PENDING'
            : normalizedStatus === 'REJECTED'
              ? 'REJECTED'
              : 'APPROVED';

    const geometrySummary =
        site.geometry.type === 'circle'
            ? site.geometry.radius
                ? `${site.geometry.radius}m radius`
                : 'Circle geometry'
            : site.geometry.points?.length
              ? `Polygon with ${site.geometry.points.length} points`
              : 'Polygon geometry';

    return {
        id: `site-${site.id}`,
        type: 'site',
        status: verificationStatus,
        userId: site.landownerId,
        userName: landowner?.name || site.landownerName,
        userEmail: landowner?.email,
        userOrganisation: landowner?.organisation,
        submittedByVerified: landowner?.verificationStatus === 'VERIFIED',
        siteId: site.id,
        siteName: site.name,
        siteType: site.siteType,
        siteAddress: site.address,
        sitePostcode: site.postcode,
        contactEmail: site.contactEmail,
        contactPhone: site.contactPhone,
        siteGeometry: site.geometry,
        clzGeometry: site.clzGeometry,
        siteCoordinates: geometrySummary,
        siteGeometrySize: geometrySummary,
        validityStart: site.validityStart,
        validityEnd: site.validityEnd,
        siteInformation: site.siteInformation,
        toalOnly: !site.clzEnabled,
        exclusiveUse: site.exclusiveUse,
        autoApprove: site.autoApprove,
        toalAccessFee: site.toalAccessFee,
        clzAccessFee: site.clzAccessFee,
        policyDocuments: site.policyDocuments || [],
        ownershipDocuments: site.ownershipDocuments || [],
        sitePhotos: site.sitePhotos || [],
        submittedDocuments:
            site.documents?.map((doc: any) => ({
                fileName: doc.fileName || doc.documentType,
                fileKey: doc.fileKey,
                documentType: doc.documentType,
                downloadUrl: doc.downloadUrl,
                uploadedAt: doc.uploadedAt,
            })) || [],
        documents: site.documents,
        createdAt: site.createdAt,
    };
}

export function SiteVerifications({
    pendingVerifications,
    allSites = [],
    managedUsers = [],
    onReviewVerification,
    isLoading = false,
}: SiteVerificationsProps) {
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const siteVerifications = useMemo(() => {
        const landownerMap = new Map(managedUsers.map(user => [user.id, user]));
        const fromSites = allSites.map(site =>
            buildSiteVerification(site, landownerMap.get(site.landownerId))
        );

        if (fromSites.length > 0) return fromSites;

        return pendingVerifications.filter(v => v.type === 'site');
    }, [allSites, pendingVerifications, managedUsers]);

    const filteredVerifications =
        statusFilter === 'ALL'
            ? siteVerifications
            : siteVerifications.filter(v => v.status === statusFilter);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
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
                        <tr className="border-b border-slate-100">
                            <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                                Site Name
                            </th>
                            <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                                Location
                            </th>
                            <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                                Type / Access
                            </th>
                            <th className="text-left px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-wider">
                                Documents
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
                                    key={`site-loading-${index}`}
                                    className="group hover:bg-slate-50 transition-colors"
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
                                        <Skeleton className="mt-2 h-3 w-28" />
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            <Skeleton className="h-5 w-24 rounded-full" />
                                            <Skeleton className="h-5 w-28 rounded-full" />
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Skeleton className="h-4 w-28" />
                                    </td>
                                    <td className="px-8 py-6">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Skeleton className="ml-auto h-5 w-16" />
                                    </td>
                                </tr>
                            ))
                        ) : filteredVerifications.length > 0 ? (
                            filteredVerifications.map(v => (
                                <tr
                                    key={v.id}
                                    className="group hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <MapPin className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-800">
                                                    {v.siteName}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <HumanIdChip id={v.siteId} prefix="vt-site" copyable />
                                                    <HumanIdChip id={v.id} prefix="vt-case" />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-700">
                                                {v.siteAddress}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {v.sitePostcode || 'No postcode'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded tracking-wider w-fit">
                                                {v.siteType === 'emergency'
                                                    ? 'Emergency / Recovery'
                                                    : 'TOAL'}
                                            </span>
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded tracking-wider w-fit">
                                                {v.autoApprove
                                                    ? 'Auto approval'
                                                    : 'Manual approval'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            {v.submittedDocuments &&
                                            v.submittedDocuments.length > 0 ? (
                                                v.submittedDocuments.map((doc: any, i: number) => {
                                                    const label =
                                                        doc.fileName ||
                                                        doc.documentType ||
                                                        'Document';
                                                    return (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded flex items-center gap-1.5"
                                                        >
                                                            <FileText className="size-3" />
                                                            {label.length > 18
                                                                ? label.substring(0, 18) + '...'
                                                                : label}
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">
                                                    No documents
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-slate-600">
                                            {new Date(v.createdAt).toLocaleDateString('en-GB')},{' '}
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
                                        <button
                                            onClick={() => onReviewVerification(v)}
                                            className="text-blue-600 font-black text-sm hover:underline"
                                        >
                                            {v.status === 'PENDING' ? 'Review' : 'Preview'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-8 py-20 text-center">
                                    <p className="text-slate-400 font-bold text-sm">
                                        {statusFilter === 'ALL'
                                            ? 'No site verifications found'
                                            : `No site verifications with status "${statusFilter}"`}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
