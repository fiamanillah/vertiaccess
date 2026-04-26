import { useEffect, useMemo, useState } from 'react';
import type { Site } from '../types';
import {
    X,
    MapPin,
    Edit2,
    Save,
    Download,
    Calendar,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { generateGeoJSON, downloadGeoJSON } from '../utils/geojson';
import { motion, AnimatePresence } from 'motion/react';
import { SITE_STATUS_META, isWithdrawableSite, normalizeSiteStatus } from '../lib/site-status';
import { HumanIdChip } from './ui/HumanIdChip';

import { SectionTitle } from './SiteDetails/SectionTitle';
import { BasicInfoSection } from './SiteDetails/BasicInfoSection';
import { CommercialTermsSection } from './SiteDetails/CommercialTermsSection';
import { ValiditySection } from './SiteDetails/ValiditySection';
import { PropertyDescriptionSection } from './SiteDetails/PropertyDescriptionSection';
import { AdminReviewSection } from './SiteDetails/AdminReviewSection';
import { SpatialLayoutSection } from './SiteDetails/SpatialLayoutSection';
import { OperationalPoliciesSection } from './SiteDetails/OperationalPoliciesSection';
import { MediaSection } from './SiteDetails/MediaSection';

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
    const rejectionNote = rejectionReasonNoteState;

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
                                {/* Site Details Section */}
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <SectionTitle>Site Information</SectionTitle>
                                    <BasicInfoSection
                                        site={site}
                                        isEditing={isEditing}
                                        name={name}
                                        setName={setName}
                                        postcode={postcode}
                                        setPostcode={setPostcode}
                                        address={address}
                                        setAddress={setAddress}
                                        contactEmail={contactEmail}
                                        setContactEmail={setContactEmail}
                                        contactPhone={contactPhone}
                                        setContactPhone={setContactPhone}
                                    />
                                </div>

                                <CommercialTermsSection site={site} />

                                <ValiditySection
                                    site={site}
                                    isEditing={isEditing}
                                    validityStart={validityStart}
                                    setValidityStart={setValidityStart}
                                    validityStartTime={validityStartTime}
                                    setValidityStartTime={setValidityStartTime}
                                    validityEnd={validityEnd}
                                    setValidityEnd={setValidityEnd}
                                    validityEndTime={validityEndTime}
                                    setValidityEndTime={setValidityEndTime}
                                    untilFurtherNotice={untilFurtherNotice}
                                    setUntilFurtherNotice={setUntilFurtherNotice}
                                />

                                <PropertyDescriptionSection
                                    site={site}
                                    isEditing={isEditing}
                                    siteInformation={siteInformation}
                                    setSiteInformation={setSiteInformation}
                                />

                                <AdminReviewSection
                                    site={site}
                                    isAdminMode={isAdminMode}
                                    currentStatus={currentStatus}
                                    verificationStatus={verificationStatus}
                                    stats={stats}
                                    landownerInfo={landownerInfo}
                                    internalNote={internalNote}
                                    setInternalNote={setInternalNote}
                                    hasInternalNoteChanged={hasInternalNoteChanged}
                                    handleSaveInternalNote={handleSaveInternalNote}
                                    onSaveAdminInternalNote={onSaveAdminInternalNote}
                                    isSavingInternalNote={isSavingInternalNote}
                                    adminInternalNoteSaving={adminInternalNoteSaving}
                                    rejectionNote={rejectionNote}
                                    consentChecks={consentChecks}
                                />
                            </div>

                            {/* Right Column - Map & Media */}
                            <div className="lg:col-span-5 space-y-6">
                                <SpatialLayoutSection
                                    site={site}
                                    isEditing={isEditing}
                                    isAdminMode={isAdminMode}
                                    geometry={geometry}
                                    setGeometry={setGeometry}
                                    clzGeometry={clzGeometry}
                                    setClzGeometry={setClzGeometry}
                                    clzEnabled={clzEnabled}
                                    mapCenter={mapCenter}
                                />

                                <OperationalPoliciesSection
                                    site={site}
                                    isEditing={isEditing}
                                    autoApprove={autoApprove}
                                    setAutoApprove={setAutoApprove}
                                    clzEnabled={clzEnabled}
                                    setClzEnabled={setClzEnabled}
                                />

                                <MediaSection
                                    sitePhotos={sitePhotos}
                                    policyDocumentItems={policyDocumentItems}
                                    ownershipDocumentItems={ownershipDocumentItems}
                                    allUploadedDocuments={allUploadedDocuments}
                                />
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
