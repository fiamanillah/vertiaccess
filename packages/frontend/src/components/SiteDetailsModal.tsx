import { useEffect, useMemo, useState } from 'react';
import type { Site } from '../types';
import {
    X,
    MapPin,
    Edit2,
    Save,
    Download,
    FileText,
    Image as ImageIcon,
    Info,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileDigit,
    BarChart3,
    Globe,
    Shield,
    Phone,
    Mail,
    Map as MapIcon,
    Plus,
    Upload,
    Trash2,
    LayoutGrid,
    ArrowUpRight,
    ShieldCheck,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { SiteMap } from './SiteMap';
import { DateTimePicker } from './DateTimePicker';
import { generateGeoJSON, downloadGeoJSON } from '../utils/geojson';
import { motion, AnimatePresence } from 'motion/react';
import { SITE_STATUS_META, isWithdrawableSite, normalizeSiteStatus } from '../lib/site-status';
import { HumanIdChip } from './ui/HumanIdChip';

interface SiteDetailsModalProps {
    site: Site;
    onClose: () => void;
    onSave?: (updatedSite: Site) => Promise<void> | void;
    onWithdraw?: (siteId: string) => void;
    mode?: 'landowner' | 'admin';
    verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    adminInternalNote?: string;
    rejectionReasonNote?: string;
    onAdminInternalNoteChange?: (value: string) => void;
    onRejectionReasonNoteChange?: (value: string) => void;
    onSaveAdminInternalNote?: (value: string) => Promise<void> | void;
    onApprove?: (notes?: { adminInternalNote?: string; rejectionReasonNote?: string }) => void;
    onReject?: (notes?: { adminInternalNote?: string; rejectionReasonNote?: string }) => void;
    actionLoading?: boolean;
    adminInternalNoteSaving?: boolean;
    landownerInfo?: {
        name?: string;
        email?: string;
        organisation?: string;
    };
    adminStats?: {
        totalDocuments?: number;
        policyDocuments?: number;
        ownershipDocuments?: number;
        photos?: number;
    };
    consentChecks?: {
        authorizedToGrantAccess?: boolean;
        acceptedLandownerDeclaration?: boolean;
    };
}

const SectionTitle = ({ children }: { children: string }) => (
    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <div className="w-1 h-5 bg-blue-600 rounded-full" />
        {children}
    </h3>
);

const LabelValue = ({
    label,
    value,
    editingNode,
    isEditing,
}: {
    label: string;
    value: string | React.ReactNode;
    editingNode?: React.ReactNode;
    isEditing?: boolean;
}) => (
    <div className="mb-4 last:mb-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        {isEditing && editingNode ? (
            editingNode
        ) : (
            <p className="text-base text-slate-800 font-semibold leading-snug">{value || '—'}</p>
        )}
    </div>
);

const Badge = ({
    children,
    variant,
}: {
    children: string;
    variant: 'amber' | 'blue' | 'green';
}) => {
    const variants = {
        amber: 'bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7]',
        blue: 'bg-[#EFF6FF] text-blue-600 border-[#DBEAFE]',
        green: 'bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]',
    };
    return (
        <span
            className={`inline-flex px-4 py-1.5 rounded-full text-sm font-medium border ${variants[variant]}`}
        >
            {children}
        </span>
    );
};

function calculateSiteArea(geometry: Site['geometry']): number | null {
    if (!geometry) return null;

    if (geometry.type === 'circle') {
        const radius = Number(geometry.radius || 0);
        return radius > 0 ? Math.PI * radius * radius : null;
    }

    const points = geometry.points || [];
    if (points.length < 3) return null;

    const referenceLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
    const metersPerDegreeLat = 111_320;
    const metersPerDegreeLng = 111_320 * Math.cos((referenceLat * Math.PI) / 180);

    const projected = points.map(point => ({
        x: point.lng * metersPerDegreeLng,
        y: point.lat * metersPerDegreeLat,
    }));

    let area = 0;
    for (let i = 0; i < projected.length; i += 1) {
        const current = projected[i]!;
        const next = projected[(i + 1) % projected.length]!;
        area += current.x * next.y - next.x * current.y;
    }

    return Math.abs(area) / 2;
}

function formatArea(areaMetersSquared: number | null): string {
    if (!areaMetersSquared || !Number.isFinite(areaMetersSquared) || areaMetersSquared <= 0) {
        return '—';
    }

    if (areaMetersSquared >= 10_000) {
        return `${(areaMetersSquared / 10_000).toFixed(2)} ha`;
    }

    return `${Math.round(areaMetersSquared).toLocaleString()} m²`;
}

export function SiteDetailsModal({
    site,
    onClose,
    onSave,
    onWithdraw,
    mode = 'landowner',
    verificationStatus,
    adminInternalNote,
    rejectionReasonNote,
    onAdminInternalNoteChange,
    onRejectionReasonNoteChange,
    onSaveAdminInternalNote,
    onApprove,
    onReject,
    actionLoading = false,
    adminInternalNoteSaving = false,
    landownerInfo,
    adminStats,
    consentChecks,
}: SiteDetailsModalProps) {
    const currentStatus = normalizeSiteStatus(site.status);
    const isAdminMode = mode === 'admin';
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [internalAdminNoteState, setInternalAdminNoteState] = useState(adminInternalNote || '');
    const [savedInternalAdminNote, setSavedInternalAdminNote] = useState(adminInternalNote || '');
    const [rejectionReasonNoteState, setRejectionReasonNoteState] = useState(
        rejectionReasonNote || ''
    );
    const [isSavingInternalNote, setIsSavingInternalNote] = useState(false);
    const [pendingAdminAction, setPendingAdminAction] = useState<'approve' | 'reject' | null>(null);

    useEffect(() => {
        setInternalAdminNoteState(adminInternalNote || '');
        setSavedInternalAdminNote(adminInternalNote || '');
    }, [adminInternalNote]);

    useEffect(() => {
        setRejectionReasonNoteState(rejectionReasonNote || '');
    }, [rejectionReasonNote]);

    // Editable fields
    const [name, setName] = useState(site.name);
    const [address, setAddress] = useState(site.address);
    const [contactEmail, setContactEmail] = useState(site.contactEmail);
    const [contactPhone, setContactPhone] = useState(site.contactPhone);
    const [postcode, setPostcode] = useState(site.postcode || '');
    const [validityStart, setValidityStart] = useState<string>(
        site.validityStart
            ? (site.validityStart.split('T')[0] as string)
            : (new Date().toISOString().split('T')[0] as string)
    );
    const [validityStartTime, setValidityStartTime] = useState<string>(
        site.validityStart && site.validityStart.includes('T')
            ? (site.validityStart.split('T')[1]?.substring(0, 5) ?? '00:00')
            : '00:00'
    );
    const [validityEnd, setValidityEnd] = useState<string>(
        site.validityEnd ? (site.validityEnd.split('T')[0] as string) : ''
    );
    const [validityEndTime, setValidityEndTime] = useState<string>(
        site.validityEnd && site.validityEnd.includes('T')
            ? (site.validityEnd.split('T')[1]?.substring(0, 5) ?? '00:00')
            : '00:00'
    );
    const [untilFurtherNotice, setUntilFurtherNotice] = useState(!site.validityEnd);
    const [autoApprove, setAutoApprove] = useState(site.autoApprove);
    const [clzEnabled, setClzEnabled] = useState(site.clzEnabled);
    const [hasPolicy, setHasPolicy] = useState(!!site.policyDocument);
    const [policyDocument, setPolicyDocument] = useState(site.policyDocument || '');
    const [siteInformation, setSiteInformation] = useState(site.siteInformation || '');
    const [sitePhotos, setSitePhotos] = useState<string[]>(
        site.sitePhotos || (site.photoUrl ? [site.photoUrl] : [])
    );
    const [policyDocuments, setPolicyDocuments] = useState<string[]>(site.policyDocuments || []);
    const [ownershipDocuments, setOwnershipDocuments] = useState<string[]>(
        site.ownershipDocuments || site.documents || []
    );
    const [geometry, setGeometry] = useState(site.geometry || { type: 'circle' as const });
    const [clzGeometry, setClzGeometry] = useState(site.clzGeometry);

    // Operator details state
    const [operatorId, setOperatorId] = useState(site.operatorId || '');
    const [operatorName, setOperatorName] = useState(site.operatorName || '');
    const [operatorEmail, setOperatorEmail] = useState(site.operatorEmail || '');
    const [operatorPhone, setOperatorPhone] = useState(site.operatorPhone || '');
    const [operatorReference, setOperatorReference] = useState(site.operatorReference || '');
    const [flyerId, setFlyerId] = useState(site.flyerId || '');

    const mapCenter = useMemo(() => {
        if (geometry.center) return geometry.center;

        const points = geometry.points || [];
        if (points.length > 0) {
            const totals = points.reduce(
                (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
                { lat: 0, lng: 0 }
            );
            return {
                lat: totals.lat / points.length,
                lng: totals.lng / points.length,
            };
        }

        if (clzGeometry?.center) return clzGeometry.center;

        const clzPoints = clzGeometry?.points || [];
        if (clzPoints.length > 0) {
            const totals = clzPoints.reduce(
                (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
                { lat: 0, lng: 0 }
            );
            return {
                lat: totals.lat / clzPoints.length,
                lng: totals.lng / clzPoints.length,
            };
        }

        return { lat: 51.5074, lng: -0.1278 };
    }, [geometry.center, geometry.points, clzGeometry?.center, clzGeometry?.points]);

    const policyDocumentItems = useMemo(() => {
        const fromDetails = (site.documentDetails || [])
            .filter(doc => doc.documentType === 'policy')
            .map(doc => ({ fileName: doc.fileName, downloadUrl: doc.downloadUrl }));

        const detailNames = new Set(fromDetails.map(doc => doc.fileName));
        const fromLocalState = policyDocuments
            .filter(name => !detailNames.has(name))
            .map(fileName => ({ fileName, downloadUrl: undefined }));

        return [...fromDetails, ...fromLocalState];
    }, [policyDocuments, site.documentDetails]);

    const ownershipDocumentItems = useMemo(() => {
        const fromDetails = (site.documentDetails || [])
            .filter(doc => doc.documentType === 'ownership')
            .map(doc => ({ fileName: doc.fileName, downloadUrl: doc.downloadUrl }));

        const detailNames = new Set(fromDetails.map(doc => doc.fileName));
        const fromLocalState = ownershipDocuments
            .filter(name => !detailNames.has(name))
            .map(fileName => ({ fileName, downloadUrl: undefined }));

        return [...fromDetails, ...fromLocalState];
    }, [ownershipDocuments, site.documentDetails]);

    const allUploadedDocuments = useMemo(() => {
        if (site.documentDetails && site.documentDetails.length > 0) {
            return site.documentDetails;
        }

        return (site.documents || []).map((doc, idx) => ({
            id: `${site.id}-${idx}`,
            fileName: doc,
            fileKey: doc,
            documentType: undefined,
            downloadUrl: undefined,
            uploadedAt: undefined,
        }));
    }, [site.documentDetails, site.documents, site.id]);

    const internalNote = internalAdminNoteState;
    const rejectionNote = rejectionReasonNote ?? rejectionReasonNoteState;

    const setInternalNote = (value: string) => {
        if (onAdminInternalNoteChange) {
            onAdminInternalNoteChange(value);
            return;
        }
        setInternalAdminNoteState(value);
    };

    const setRejectionNote = (value: string) => {
        if (onRejectionReasonNoteChange) {
            onRejectionReasonNoteChange(value);
            return;
        }
        setRejectionReasonNoteState(value);
    };

    const handleSaveInternalNote = async () => {
        if (!onSaveAdminInternalNote) return;

        setIsSavingInternalNote(true);
        try {
            await onSaveAdminInternalNote(internalNote);
            setSavedInternalAdminNote(internalNote);
        } finally {
            setIsSavingInternalNote(false);
        }
    };

    const hasInternalNoteChanged = internalNote !== savedInternalAdminNote;

    const stats = {
        totalDocuments: adminStats?.totalDocuments ?? allUploadedDocuments.length,
        policyDocuments: adminStats?.policyDocuments ?? policyDocumentItems.length,
        ownershipDocuments: adminStats?.ownershipDocuments ?? ownershipDocumentItems.length,
        photos: adminStats?.photos ?? sitePhotos.length,
    };

    const handleDownloadGeoJSON = (mode: 'TOAL' | 'CLZ') => {
        const geojson = generateGeoJSON({
            siteId: site.id,
            geometryType: site.geometry.type,
            center: site.geometry.center || { lat: 0, lng: 0 },
            radius: site.geometry.radius || 0,
            polygonPoints: site.geometry.points || [],
            clzEnabled: site.clzEnabled,
            clzCenter: site.clzGeometry?.center,
            clzRadius: site.clzGeometry?.radius,
            clzPolygonPoints: site.clzGeometry?.points || [],
            exportMode: mode,
        });
        downloadGeoJSON(geojson, `${site.name.replace(/\s+/g, '_')}_${mode.toLowerCase()}.geojson`);
    };

    const handleSave = async () => {
        if (!onSave) return;
        setIsSaving(true);
        try {
            const updatedSite: Site = {
                ...site,
                name,
                address,
                postcode,
                contactEmail,
                contactPhone,
                validityStart: `${validityStart}T${validityStartTime}:00`,
                validityEnd: untilFurtherNotice
                    ? undefined
                    : validityEnd
                      ? `${validityEnd}T${validityEndTime}:00`
                      : undefined,
                autoApprove,
                clzEnabled,
                policyDocument: hasPolicy ? policyDocument || undefined : undefined,
                policyDocuments,
                ownershipDocuments,
                siteInformation,
                sitePhotos,
                photoUrl: sitePhotos.length > 0 ? sitePhotos[0] : undefined,
                geometry,
                clzGeometry: clzEnabled ? clzGeometry : undefined,
                // Save operator details
                operatorId,
                operatorName,
                operatorEmail,
                operatorPhone,
                operatorReference,
                flyerId,
            };
            await onSave(updatedSite);
        } catch (error) {
            console.error('Failed to save site updates:', error);
        } finally {
            setIsSaving(false);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setName(site.name);
        setAddress(site.address);
        setPostcode(site.postcode || '');
        setContactEmail(site.contactEmail);
        setContactPhone(site.contactPhone);
        setValidityStart(
            site.validityStart
                ? (site.validityStart.split('T')[0] as string)
                : (new Date().toISOString().split('T')[0] as string)
        );
        setValidityStartTime(
            site.validityStart && site.validityStart.includes('T')
                ? (site.validityStart.split('T')[1]?.substring(0, 5) ?? '00:00')
                : '00:00'
        );
        setValidityEnd(site.validityEnd ? (site.validityEnd.split('T')[0] as string) : '');
        setUntilFurtherNotice(!site.validityEnd);
        setAutoApprove(site.autoApprove);
        setClzEnabled(site.clzEnabled);
        setHasPolicy(!!site.policyDocument);
        setPolicyDocument(site.policyDocument || '');
        setPolicyDocuments(site.policyDocuments || []);
        setOwnershipDocuments(site.ownershipDocuments || site.documents || []);
        setSiteInformation(site.siteInformation || '');
        setSitePhotos(site.sitePhotos || (site.photoUrl ? [site.photoUrl] : []));
        setGeometry(site.geometry || { type: 'circle' as const });
        setClzGeometry(site.clzGeometry);

        // Reset operator details
        setOperatorId(site.operatorId || '');
        setOperatorName(site.operatorName || '');
        setOperatorEmail(site.operatorEmail || '');
        setOperatorPhone(site.operatorPhone || '');
        setOperatorReference(site.operatorReference || '');
        setFlyerId(site.flyerId || '');

        setIsEditing(false);
    };

    // Removed nested inline components to prevent unmounting and focus loss

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-275 w-full max-h-[90vh] flex flex-col overflow-hidden isolation-isolate"
            >
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 rounded-t-3xl">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <MapPin className="size-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight flex items-center gap-3">
                                {site.name}
                                <HumanIdChip id={site.vtId || site.id} prefix="vt-site" copyable />
                            </h2>
                            <p className="text-sm text-slate-500">{site.address}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {!isAdminMode && !isEditing ? (
                            <div className="flex items-center gap-3">
                                {isWithdrawableSite(site.status) && (
                                    <button
                                        onClick={() => onWithdraw?.(site.id)}
                                        className="h-11 px-6 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all flex items-center gap-2"
                                    >
                                        <AlertCircle className="size-4" />
                                        Withdraw Application
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="h-11 px-6 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                                >
                                    <Edit2 className="size-4" />
                                    Edit Details
                                </button>
                            </div>
                        ) : !isAdminMode ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="h-11 px-6 rounded-lg border border-slate-200 text-[#374151] font-bold hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="h-11 px-6 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Save className="size-4" />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        ) : null}
                        <button
                            onClick={onClose}
                            className="size-11 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"
                        >
                            <X className="size-6" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                    <div className="p-6">
                        <div className="grid lg:grid-cols-12 gap-6">
                            {/* Left Column - Main Info */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Site Details Card */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <SectionTitle>Site Information</SectionTitle>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                        <LabelValue
                                            isEditing={isEditing}
                                            label="Site Name"
                                            value={site.name}
                                            editingNode={
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                                />
                                            }
                                        />
                                        <LabelValue
                                            isEditing={isEditing}
                                            label="Site ID"
                                            value={
                                                <HumanIdChip
                                                    id={site.vtId || site.id}
                                                    prefix="vt-site"
                                                    copyable
                                                />
                                            }
                                        />
                                        <LabelValue
                                            isEditing={isEditing}
                                            label="Site Category"
                                            value={
                                                <span className="capitalize">
                                                    {(site.siteCategory || '—').replace(/_/g, ' ')}
                                                </span>
                                            }
                                        />
                                        <LabelValue
                                            label="Calculated Area"
                                            value={formatArea(calculateSiteArea(site.geometry))}
                                        />
                                        <LabelValue
                                            isEditing={isEditing}
                                            label="Postcode"
                                            value={site.postcode}
                                            editingNode={
                                                <input
                                                    type="text"
                                                    value={postcode}
                                                    onChange={e => setPostcode(e.target.value)}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                                />
                                            }
                                        />
                                        <div className="col-span-2">
                                            <LabelValue
                                                isEditing={isEditing}
                                                label="Address"
                                                value={site.address}
                                                editingNode={
                                                    <input
                                                        type="text"
                                                        value={address}
                                                        onChange={e => setAddress(e.target.value)}
                                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                                    />
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-x-8">
                                        <LabelValue
                                            isEditing={isEditing}
                                            label="Contact Email"
                                            value={site.contactEmail}
                                            editingNode={
                                                <input
                                                    type="email"
                                                    value={contactEmail}
                                                    onChange={e => setContactEmail(e.target.value)}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                                />
                                            }
                                        />
                                        <LabelValue
                                            isEditing={isEditing}
                                            label="Contact Phone"
                                            value={site.contactPhone}
                                            editingNode={
                                                <input
                                                    type="tel"
                                                    value={contactPhone}
                                                    onChange={e =>
                                                        setContactPhone(
                                                            e.target.value.replace(/[^0-9]/g, '')
                                                        )
                                                    }
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                                />
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Commercial Terms */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <SectionTitle>Commercial Terms</SectionTitle>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                        <LabelValue
                                            label="TOAL Access Fee"
                                            value={`£${Number(
                                                site.toalAccessFee || 0
                                            ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}`}
                                        />
                                        <LabelValue
                                            label="Emergency Access Fee"
                                            value={`£${Number(
                                                site.clzAccessFee || 0
                                            ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}`}
                                        />
                                        <LabelValue
                                            label="Primary Function"
                                            value={
                                                site.siteType === 'emergency'
                                                    ? 'Emergency'
                                                    : 'Take-off & Landing'
                                            }
                                        />
                                        <LabelValue
                                            label="Includes Emergency Landing"
                                            value={site.clzEnabled ? 'Yes' : 'No'}
                                        />
                                        <LabelValue
                                            label="Booking Approval"
                                            value={
                                                site.autoApprove
                                                    ? 'Auto Approval'
                                                    : 'Manual Approval'
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Validity Card */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <SectionTitle>Validity Period</SectionTitle>
                                    <div className="space-y-4">
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <DateTimePicker
                                                    dateValue={validityStart}
                                                    timeValue={validityStartTime}
                                                    onDateChange={setValidityStart}
                                                    onTimeChange={setValidityStartTime}
                                                    label="Start Date"
                                                    required
                                                />
                                                {!untilFurtherNotice && (
                                                    <DateTimePicker
                                                        dateValue={validityEnd}
                                                        timeValue={validityEndTime}
                                                        onDateChange={setValidityEnd}
                                                        onTimeChange={setValidityEndTime}
                                                        label="End Date"
                                                        required
                                                    />
                                                )}
                                                <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={untilFurtherNotice}
                                                        onChange={e =>
                                                            setUntilFurtherNotice(e.target.checked)
                                                        }
                                                        className="size-4 rounded text-blue-600 focus:ring-blue-600"
                                                    />
                                                    <span className="font-bold text-sm text-slate-900">
                                                        Until Further Notice
                                                    </span>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                                                        Active From
                                                    </p>
                                                    <p className="text-sm text-slate-800 font-bold">
                                                        {new Date(
                                                            site.validityStart
                                                        ).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                        })}
                                                        <span className="text-slate-400 font-medium ml-2">
                                                            {new Date(
                                                                site.validityStart
                                                            ).toLocaleTimeString('en-GB', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                                                        Active Until
                                                    </p>
                                                    <p
                                                        className={`text-sm font-bold ${!site.validityEnd ? 'text-blue-600' : 'text-slate-800'}`}
                                                    >
                                                        {site.validityEnd
                                                            ? `${new Date(site.validityEnd).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                                            : 'Until Further Notice'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Property Description */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <SectionTitle>Property Description</SectionTitle>
                                    {isEditing ? (
                                        <textarea
                                            value={siteInformation}
                                            onChange={e => setSiteInformation(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none min-h-30 bg-slate-50 text-sm"
                                            placeholder="Detail any specific hazards, ground surface, and access instructions."
                                        />
                                    ) : (
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-sm text-slate-600 leading-relaxed italic">
                                                {site.siteInformation || 'No description provided.'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {!isAdminMode &&
                                    currentStatus === 'REJECTED' &&
                                    site.rejectionReasonNote && (
                                        <div className="bg-red-50 rounded-2xl p-5 border border-red-200 shadow-sm">
                                            <SectionTitle>Rejection Reason</SectionTitle>
                                            <p className="text-sm text-red-800 leading-relaxed">
                                                {site.rejectionReasonNote}
                                            </p>
                                        </div>
                                    )}

                                {isAdminMode && (
                                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                        <SectionTitle>Admin Review Summary</SectionTitle>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Status
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                                        {verificationStatus || 'PENDING'}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Total Docs
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                                        {stats.totalDocuments}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Policy Docs
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                                        {stats.policyDocuments}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Ownership Docs
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                                        {stats.ownershipDocuments}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Submitted By
                                                </p>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {landownerInfo?.name ||
                                                        site.landownerName ||
                                                        'Unknown'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {landownerInfo?.email || 'Email unavailable'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {landownerInfo?.organisation || 'Independent'}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Admin Review Note (Internal Only)
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={internalNote}
                                                    onChange={e => setInternalNote(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                                    placeholder="Internal note for admins only. Not visible to landowner."
                                                />
                                                {hasInternalNoteChanged && (
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() =>
                                                                void handleSaveInternalNote()
                                                            }
                                                            disabled={
                                                                !onSaveAdminInternalNote ||
                                                                isSavingInternalNote ||
                                                                adminInternalNoteSaving
                                                            }
                                                            className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            {isSavingInternalNote ||
                                                            adminInternalNoteSaving
                                                                ? 'Saving...'
                                                                : 'Save Note'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {verificationStatus === 'REJECTED' && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-red-700 uppercase tracking-wider">
                                                        Rejection Reason (Shown To Landowner)
                                                    </label>
                                                    <div className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800 font-medium">
                                                        {rejectionNote ||
                                                            'No rejection reason provided.'}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Consent: Authorised To Grant Access
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                                        {consentChecks?.authorizedToGrantAccess
                                                            ? 'Checked'
                                                            : 'Not Checked'}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Consent: Landowner Declaration
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-900 mt-1">
                                                        {consentChecks?.acceptedLandownerDeclaration
                                                            ? 'Checked'
                                                            : 'Not Checked'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Map & Media */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* Map View Card */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <SectionTitle>Spatial Layout</SectionTitle>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 relative h-64 bg-slate-100 shadow-inner">
                                        <SiteMap
                                            geometryType={geometry.type || 'circle'}
                                            center={mapCenter}
                                            radius={geometry.radius || 50}
                                            polygonPoints={geometry.points || []}
                                            onCenterChange={center =>
                                                setGeometry(prev => ({ ...prev, center }))
                                            }
                                            onPolygonPointsChange={points =>
                                                setGeometry(prev => ({ ...prev, points }))
                                            }
                                            clzEnabled={isEditing ? clzEnabled : site.clzEnabled}
                                            clzPolygonPoints={clzGeometry?.points || []}
                                            onClzPolygonPointsChange={points =>
                                                setClzGeometry(prev => ({
                                                    ...prev,
                                                    type: prev?.type || 'polygon',
                                                    points,
                                                }))
                                            }
                                            clzRadius={clzGeometry?.radius || 150}
                                            readonly={isAdminMode || !isEditing}
                                        />
                                        <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-lg space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full bg-blue-600" />
                                                <span className="text-[9px] font-black text-slate-800 uppercase">
                                                    TOAL ZONE
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full border-2 border-[#F59E0B] bg-transparent" />
                                                <span className="text-[9px] font-black text-slate-800 uppercase">
                                                    Emergency & Recovery Site
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Site Policies Card */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <SectionTitle>Operational Policies</SectionTitle>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500 font-medium">
                                                Booking Protocol
                                            </span>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        value={autoApprove ? 'auto' : 'manual'}
                                                        onChange={e =>
                                                            setAutoApprove(
                                                                e.target.value === 'auto'
                                                            )
                                                        }
                                                        className="text-sm font-bold text-blue-600 bg-transparent outline-none cursor-pointer appearance-none"
                                                    >
                                                        <option value="manual">Manual</option>
                                                        <option value="auto">Auto Approval</option>
                                                    </select>
                                                    <ChevronRight className="size-3 text-blue-600 rotate-90" />
                                                </div>
                                            ) : (
                                                <Badge
                                                    variant={site.autoApprove ? 'green' : 'amber'}
                                                >
                                                    {site.autoApprove ? 'Auto Approval' : 'Manual'}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                            <span className="text-sm text-slate-500 font-medium">
                                                Emergency & Recovery Site Status
                                            </span>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        value={clzEnabled ? 'enabled' : 'disabled'}
                                                        onChange={e =>
                                                            setClzEnabled(
                                                                e.target.value === 'enabled'
                                                            )
                                                        }
                                                        className="text-sm font-bold text-blue-600 bg-transparent outline-none cursor-pointer appearance-none"
                                                    >
                                                        <option value="enabled">Enabled</option>
                                                        <option value="disabled">Disabled</option>
                                                    </select>
                                                    <ChevronRight className="size-3 text-blue-600 rotate-90" />
                                                </div>
                                            ) : (
                                                <span
                                                    className={`text-sm font-bold ${site.clzEnabled ? 'text-emerald-600' : 'text-slate-400'}`}
                                                >
                                                    {site.clzEnabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-2">
                                                Access Guidelines
                                            </p>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                                                <Shield className="size-4 text-slate-400" />
                                                <span className="text-sm text-slate-500 italic">
                                                    {site.policyDocument
                                                        ? 'Safety manual active'
                                                        : 'Default guidelines apply'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Media & Documentation Card */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <SectionTitle>Media & Documentation</SectionTitle>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                                                Site Photos
                                                <span className="text-blue-600 normal-case font-bold">
                                                    {sitePhotos.length} files
                                                </span>
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {sitePhotos.length > 0 ? (
                                                    sitePhotos.map((photo, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50"
                                                        >
                                                            <img
                                                                src={photo}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-3 h-20 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center bg-slate-50">
                                                        <ImageIcon className="size-5 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-3">
                                                Policy Documents
                                            </p>
                                            <div className="space-y-2">
                                                {policyDocumentItems.length > 0 ? (
                                                    policyDocumentItems.map((doc, idx) => (
                                                        <div
                                                            key={`${doc.fileName}-${idx}`}
                                                            className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100"
                                                        >
                                                            <div className="min-w-0 flex items-center gap-3">
                                                                <div className="size-7 bg-white rounded flex items-center justify-center border border-slate-200 text-blue-600">
                                                                    <FileText className="size-3.5" />
                                                                </div>
                                                                <span className="text-xs text-slate-600 font-medium truncate">
                                                                    {doc.fileName}
                                                                </span>
                                                            </div>
                                                            <a
                                                                href={
                                                                    doc.downloadUrl || 'about:blank'
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                                                            >
                                                                View
                                                            </a>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-3">
                                                        <AlertCircle className="size-4 text-amber-600" />
                                                        <span className="text-xs text-amber-700 font-bold italic">
                                                            No policy documents uploaded.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                                                Ownership & Authority
                                            </p>
                                            <div className="space-y-2">
                                                {ownershipDocumentItems.length > 0 ? (
                                                    ownershipDocumentItems.map((doc, idx) => (
                                                        <div
                                                            key={`${doc.fileName}-${idx}`}
                                                            className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 group hover:border-blue-600/30 transition-colors"
                                                        >
                                                            <div className="min-w-0 flex items-center gap-3">
                                                                <div className="size-7 bg-white rounded flex items-center justify-center border border-slate-200 text-emerald-600 transition-colors">
                                                                    <ShieldCheck className="size-3.5" />
                                                                </div>
                                                                <span className="text-xs text-slate-600 font-medium truncate">
                                                                    {doc.fileName}
                                                                </span>
                                                            </div>
                                                            <a
                                                                href={
                                                                    doc.downloadUrl || 'about:blank'
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                                                            >
                                                                View
                                                            </a>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-3">
                                                        <AlertCircle className="size-4 text-amber-600" />
                                                        <span className="text-xs text-amber-700 font-bold italic">
                                                            No ownership evidence provided.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <p className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                                                All Uploaded Documents
                                                <span className="text-blue-600 normal-case font-bold">
                                                    {allUploadedDocuments.length} files
                                                </span>
                                            </p>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                {allUploadedDocuments.length > 0 ? (
                                                    allUploadedDocuments.map(doc => (
                                                        <div
                                                            key={doc.id}
                                                            className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100"
                                                        >
                                                            <div className="min-w-0 flex items-center gap-3">
                                                                <div className="size-7 bg-white rounded flex items-center justify-center border border-slate-200 text-slate-600">
                                                                    <FileDigit className="size-3.5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-slate-700 font-medium truncate">
                                                                        {doc.fileName}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                                        {doc.documentType ||
                                                                            'document'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <a
                                                                href={
                                                                    doc.downloadUrl || 'about:blank'
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                                                            >
                                                                View
                                                            </a>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-3">
                                                        <AlertCircle className="size-4 text-amber-600" />
                                                        <span className="text-xs text-amber-700 font-bold italic">
                                                            No documents uploaded.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isAdminMode && pendingAdminAction && (
                    <div
                        className={`mx-6 mt-4 rounded-2xl border p-4 ${
                            pendingAdminAction === 'approve'
                                ? 'bg-emerald-50 border-emerald-100'
                                : 'bg-red-50 border-red-100'
                        }`}
                    >
                        <p
                            className={`text-sm font-bold ${
                                pendingAdminAction === 'approve'
                                    ? 'text-emerald-900'
                                    : 'text-red-900'
                            }`}
                        >
                            {pendingAdminAction === 'approve'
                                ? 'Confirm site approval'
                                : 'Confirm site rejection'}
                        </p>
                        <p
                            className={`text-xs mt-1 ${
                                pendingAdminAction === 'approve'
                                    ? 'text-emerald-700'
                                    : 'text-red-700'
                            }`}
                        >
                            {pendingAdminAction === 'approve'
                                ? 'This will approve the site and notify the landowner.'
                                : 'Add a rejection reason for the landowner before confirming.'}
                        </p>

                        {pendingAdminAction === 'reject' && (
                            <div className="mt-3">
                                <label className="text-xs font-bold text-red-700 uppercase tracking-wider">
                                    Rejection Reason (Landowner Note)
                                </label>
                                <textarea
                                    rows={3}
                                    value={rejectionNote}
                                    onChange={e => setRejectionNote(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Please explain why this site was rejected and what needs to be changed."
                                />
                            </div>
                        )}

                        <div className="mt-3 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setPendingAdminAction(null)}
                                disabled={actionLoading}
                                className="h-9 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            {pendingAdminAction === 'approve' ? (
                                <button
                                    onClick={() =>
                                        onApprove?.({
                                            adminInternalNote: internalNote.trim() || undefined,
                                            rejectionReasonNote: rejectionNote.trim() || undefined,
                                        })
                                    }
                                    disabled={actionLoading}
                                    className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-60"
                                >
                                    {actionLoading ? 'Processing...' : 'Confirm'}
                                </button>
                            ) : (
                                <button
                                    onClick={() =>
                                        onReject?.({
                                            adminInternalNote: internalNote.trim() || undefined,
                                            rejectionReasonNote: rejectionNote.trim() || undefined,
                                        })
                                    }
                                    disabled={actionLoading || rejectionNote.trim().length === 0}
                                    className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-60"
                                >
                                    {actionLoading ? 'Processing...' : 'Confirm'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Info & Final Status */}
                <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span
                                className={`size-2 rounded-full animate-pulse ${
                                    currentStatus === 'ACTIVE'
                                        ? 'bg-emerald-500'
                                        : currentStatus === 'UNDER_REVIEW'
                                          ? 'bg-blue-500'
                                          : currentStatus === 'TEMPORARY_RESTRICTED'
                                            ? 'bg-amber-500'
                                            : 'bg-red-500'
                                }`}
                            />
                            <span className="text-xs font-bold text-slate-800">
                                Site {SITE_STATUS_META[currentStatus].label.toUpperCase()}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="size-3.5" />
                            <span>
                                Registered {new Date(site.createdAt).toLocaleDateString('en-GB')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isAdminMode && (
                            <button
                                onClick={() => handleDownloadGeoJSON('TOAL')}
                                className="h-9 px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Download className="size-3.5" />
                                TOAL GEOJSON
                            </button>
                        )}
                        {!isAdminMode && site.clzEnabled && (
                            <button
                                onClick={() => handleDownloadGeoJSON('CLZ')}
                                className="h-9 px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Download className="size-3.5" />
                                CLZ GEOJSON
                            </button>
                        )}
                        {!isAdminMode && <div className="h-4 w-px bg-slate-200" />}
                        {!isAdminMode && (
                            <p className="text-xs text-slate-400 font-medium tracking-tight uppercase">
                                System Ref: {site.id.toUpperCase()}
                            </p>
                        )}
                        {isAdminMode && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onClose}
                                    className="h-10 px-4 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Close
                                </button>
                                {verificationStatus !== 'REJECTED' && (
                                    <button
                                        onClick={() => setPendingAdminAction('reject')}
                                        disabled={actionLoading}
                                        className="h-10 px-4 rounded-lg border border-red-200 text-red-700 font-bold hover:bg-red-50 transition-all disabled:opacity-60"
                                    >
                                        Reject
                                    </button>
                                )}
                                {verificationStatus !== 'APPROVED' && (
                                    <button
                                        onClick={() => setPendingAdminAction('approve')}
                                        disabled={actionLoading}
                                        className="h-10 px-4 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-60"
                                    >
                                        Approve
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
