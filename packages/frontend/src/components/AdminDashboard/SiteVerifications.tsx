import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, FileText, Filter } from 'lucide-react';
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

function parseTimestamp(value?: string): number {
    const timestamp = value ? new Date(value).getTime() : 0;
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDateTime(value?: string): string {
    if (!value) return 'Not available';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';

    return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
}

function formatFee(value?: number): string {
    if (typeof value !== 'number') return 'N/A';
    return `£${value.toFixed(2)}`;
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
        site.geometry?.type === 'circle'
            ? site.geometry?.radius
                ? `${site.geometry.radius}m radius`
                : 'Circle geometry'
            : site.geometry?.points?.length
              ? `Polygon with ${site.geometry.points?.length} points`
              : site.geometry?.type === 'polygon'
                ? 'Polygon geometry'
                : 'No geometry defined';

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
        siteCategory: site.siteCategory,
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
        authorizedToGrantAccess: site.authorizedToGrantAccess,
        acceptedLandownerDeclaration: site.acceptedLandownerDeclaration,
        adminInternalNote: site.adminInternalNote,
        rejectionReasonNote: site.rejectionReasonNote,
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
        const sortedFromSites = [...fromSites].sort(
            (a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt)
        );

        if (sortedFromSites.length > 0) return sortedFromSites;

        return pendingVerifications
            .filter(v => v.type === 'site')
            .sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));
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

                <div className="overflow-x-auto">
                    <table className="w-full min-w-295 table-fixed">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70">
                                <th className="w-[18%] text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Site
                                </th>
                                <th className="w-[16%] text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Landowner
                                </th>
                                <th className="w-[18%] text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="w-[16%] text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Access & Fees
                                </th>
                                <th className="w-[10%] text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Documents
                                </th>
                                <th className="w-[10%] text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Submitted
                                </th>
                                <th className="w-[8%] text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="w-[4%] text-right px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                                    Action
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
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="size-10 rounded-xl" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-40" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Skeleton className="h-4 w-36" />
                                            <Skeleton className="mt-2 h-3 w-32" />
                                        </td>
                                        <td className="px-6 py-5">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="mt-2 h-3 w-28" />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-2">
                                                <Skeleton className="h-5 w-24 rounded-full" />
                                                <Skeleton className="h-5 w-28 rounded-full" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="mt-2 h-3 w-20" />
                                        </td>
                                        <td className="px-6 py-5">
                                            <Skeleton className="h-4 w-28" />
                                        </td>
                                        <td className="px-6 py-5">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </td>
                                        <td className="px-6 py-5 text-right">
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
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                    <MapPin className="size-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-black text-slate-800">
                                                        {v.siteName || 'Unnamed site'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {v.siteId ? (
                                                            <HumanIdChip
                                                                id={v.siteId}
                                                                prefix="vt-site"
                                                                copyable
                                                            />
                                                        ) : null}
                                                        <HumanIdChip id={v.id} prefix="vt-case" />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-700 truncate">
                                                    {v.userName || 'Unknown landowner'}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium truncate">
                                                    {v.userOrganisation ||
                                                        v.userEmail ||
                                                        'No organisation/email'}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium truncate">
                                                    {v.contactPhone || 'No contact phone'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-700 truncate">
                                                    {v.siteAddress || 'No address provided'}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {v.sitePostcode || 'No postcode'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
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
                                                <p className="text-xs font-semibold text-slate-500">
                                                    TOAL: {formatFee(v.toalAccessFee)} • CLZ:{' '}
                                                    {formatFee(v.clzAccessFee)}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                <FileText className="size-4 text-slate-400" />
                                                {v.submittedDocuments?.length || 0}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                files attached
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <p className="text-sm font-bold text-slate-600">
                                                {formatDateTime(v.createdAt)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 align-top">
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
                                        <td className="px-6 py-5 text-right align-top">
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
                                    <td colSpan={8} className="px-8 py-20 text-center">
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
            </div>
        </motion.div>
    );
}
