import { useMemo, useState } from 'react';
import type { PendingVerification } from '../types';
import {
    X,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    MapPin,
    User,
    Building,
    Shield,
    Download,
    Map as MapIcon,
    ChevronRight,
    Info,
    ExternalLink,
    Copy,
    Check,
} from 'lucide-react';
import { ReadOnlySiteMap } from './ReadOnlySiteMap';
import { generateGeoJSON, downloadGeoJSON } from '../utils/geojson';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { Button } from './ui/button';

interface VerificationModalProps {
    verification: PendingVerification;
    onApprove: (adminNote?: string) => void;
    onReject: (adminNote?: string) => void;
    onClose: () => void;
    loading?: boolean;
}

export function VerificationModal({
    verification,
    onApprove,
    onReject,
    onClose,
    loading = false,
}: VerificationModalProps) {
    const [notes, setNotes] = useState('');
    const [showConfirm, setShowConfirm] = useState<'approve' | 'reject' | null>(null);
    const [documentTab, setDocumentTab] = useState<
        'all' | 'policy' | 'ownership' | 'photo' | 'other'
    >('all');
    const [copiedUserId, setCopiedUserId] = useState(false);

    const resolvedDocuments = useMemo(() => {
        if ((verification.submittedDocuments || []).length > 0) {
            return (verification.submittedDocuments || [])
                .filter(doc => Boolean(doc.downloadUrl || doc.fileKey))
                .map((doc, index) => ({
                    id: `${doc.fileKey || 'doc'}-${index}`,
                    label: doc.fileName || doc.documentType?.replace(/_/g, ' ') || 'Document',
                    meta: doc.documentType ? doc.documentType.replace(/_/g, ' ') : 'Document',
                    type: (doc.documentType || 'other') as
                        | 'policy'
                        | 'ownership'
                        | 'photo'
                        | 'other',
                    href: doc.downloadUrl || doc.fileKey,
                    uploadedAt: doc.uploadedAt,
                }));
        }

        return (verification.documents || []).map((doc, index) => {
            let docString = '';
            if (typeof doc === 'string') docString = doc;
            else if (typeof doc === 'object' && doc !== null) {
                // Defensive fallback if an object sneaks into the legacy array
                docString = (doc as any).fileName || (doc as any).name || (doc as any).fileKey || JSON.stringify(doc);
            }

            const looksLikeUrl = /^https?:\/\//i.test(docString);
            return {
                id: `${typeof doc === 'string' ? doc : 'doc'}-${index}`,
                label: looksLikeUrl ? `Document ${index + 1}` : docString,
                meta: 'Legacy submission',
                type: 'other' as const,
                href: looksLikeUrl ? docString : undefined,
                uploadedAt: undefined,
            };
        });
    }, [verification.documents, verification.submittedDocuments]);

    const filteredDocuments = useMemo(() => {
        if (documentTab === 'all') return resolvedDocuments;
        return resolvedDocuments.filter(doc => doc.type === documentTab);
    }, [documentTab, resolvedDocuments]);

    const categorizedDocuments = useMemo(() => {
        const docs = verification.submittedDocuments || [];
        return {
            policy: docs.filter(doc => doc.documentType === 'policy'),
            ownership: docs.filter(doc => doc.documentType === 'ownership'),
            photo: docs.filter(doc => doc.documentType === 'photo'),
        };
    }, [verification.submittedDocuments]);

    const isOperatorVerification =
        verification.type === 'operator' ||
        Boolean(verification.flyerId || verification.operatorCredentials);

    const confirmationMessage = isOperatorVerification
        ? 'The operator will be notified and gain full platform access.'
        : verification.type === 'site'
          ? 'The site will become active and visible to operators.'
          : 'The user will be notified and gain full landowner access.';

    const handleApprove = () => {
        onApprove(notes.trim() || undefined);
    };

    const handleReject = () => {
        onReject(notes.trim() || undefined);
    };

    const handleCopyUserId = () => {
        if (verification.userId) {
            navigator.clipboard.writeText(verification.userId);
            setCopiedUserId(true);
            toast.success('User ID copied');
            setTimeout(() => setCopiedUserId(false), 2000);
        }
    };

    const formatSiteType = (type: string) => {
        const types: Record<string, string> = {
            private_land: 'Private Land',
            helipad: 'Helipad',
            vertiport: 'Vertiport',
            temporary_landing_site: 'Temporary Landing Site',
        };
        return types[type] || type;
    };

    const handleDownloadGeoJSON = (mode: 'TOAL' | 'EMERGENCY') => {
        const geometrySource =
            mode === 'TOAL' ? verification.siteGeometry : verification.clzGeometry;
        if (!geometrySource) return;

        const geojson = generateGeoJSON({
            siteId: verification.siteId || verification.id,
            geometryType: geometrySource.type,
            center: geometrySource.center || { lat: 0, lng: 0 },
            radius: geometrySource.radius || 0,
            polygonPoints: geometrySource.points || [],
            // For the generator to pick it up in EMERGENCY mode if needed
            clzCenter: geometrySource.center,
            clzRadius: geometrySource.radius,
            clzPolygonPoints: geometrySource.points,
            clzEnabled: true,
            exportMode: mode === 'EMERGENCY' ? 'EMERGENCY' : 'TOAL',
        });
        downloadGeoJSON(
            geojson,
            `${verification.siteName?.replace(/\s+/g, '_')}_${mode.toLowerCase()}.geojson`
        );
    };

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col isolation-isolate"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-5">
                        <div className="size-14 bg-[#EAF2FF] rounded-3xl flex items-center justify-center text-blue-600">
                            <FileText className="size-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 leading-none tracking-tight">
                                {verification.type === 'identity'
                                    ? 'Landowner'
                                    : verification.type === 'operator'
                                      ? 'Operator'
                                      : 'Site'}{' '}
                                Verification Review
                            </h2>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">
                                Audit ID: {verification.id}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-12 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Account Details (merged with Landowner Details for site type) */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <User className="size-5 text-blue-600" />
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                Account Details
                            </h3>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <InfoItem
                                    label="Name"
                                    value={
                                        <div className="flex items-center gap-2">
                                            <span>{verification.userName || 'Not provided'}</span>
                                            {verification.userId && (
                                                <button
                                                    onClick={handleCopyUserId}
                                                    title="Copy User ID"
                                                    aria-label="Copy User ID"
                                                    className="size-7 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    {copiedUserId ? (
                                                        <Check className="size-4" />
                                                    ) : (
                                                        <Copy className="size-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    }
                                />
                                <InfoItem
                                    label="Email"
                                    value={verification.userEmail || 'Not provided'}
                                />
                                <InfoItem
                                    label="Organisation"
                                    value={verification.userOrganisation || 'Not provided'}
                                />
                                <InfoItem
                                    label="Account Status"
                                    value={
                                        <span
                                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                verification.submittedByVerified
                                                    ? 'bg-emerald-50 text-[#15803D] border border-emerald-100'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                            }`}
                                        >
                                            {verification.submittedByVerified
                                                ? 'Verified'
                                                : 'Unverified'}
                                        </span>
                                    }
                                />
                                <InfoItem
                                    label="Submitted"
                                    value={`${new Date(verification.createdAt).toLocaleDateString('en-GB')}, ${new Date(verification.createdAt).toLocaleTimeString('en-GB')}`}
                                />
                                {verification.type === 'landowner' && (
                                    <InfoItem label="Account Type" value="Landowner" />
                                )}
                                {verification.type === 'identity' && (
                                    <InfoItem label="Account Type" value="Landowner" />
                                )}
                                {verification.type === 'operator' && (
                                    <InfoItem label="Account Type" value="Operator" />
                                )}
                                {verification.type === 'site' && (
                                    <InfoItem label="Account Type" value="Landowner" />
                                )}
                                {verification.type === 'operator' && (
                                    <InfoItem
                                        label="Flyer ID"
                                        value={(verification as any).flyerId || 'N/A'}
                                        mono
                                    />
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Site Information Details */}
                    {verification.type === 'site' && (
                        <>
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <MapPin className="size-5 text-blue-600" />
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                        Site Information Details
                                    </h3>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8">
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                        <InfoItem
                                            label="Site ID"
                                            value={verification.siteId}
                                            mono
                                        />
                                        <InfoItem label="Site Name" value={verification.siteName} />
                                        <InfoItem
                                            label="Site Type"
                                            value={
                                                verification.siteType
                                                    ? formatSiteType(verification.siteType)
                                                    : 'Not specified'
                                            }
                                        />
                                        <InfoItem
                                            label="Address"
                                            value={verification.siteAddress || 'Not provided'}
                                        />
                                        <InfoItem
                                            label="Postcode"
                                            value={verification.sitePostcode || 'Not provided'}
                                            mono
                                        />
                                        <InfoItem
                                            label="Contact Email"
                                            value={verification.contactEmail || 'Not provided'}
                                        />
                                        <InfoItem
                                            label="Contact Phone"
                                            value={verification.contactPhone || 'Not provided'}
                                        />
                                        <InfoItem
                                            label="Operation Window"
                                            value={
                                                verification.operationWindowStart &&
                                                verification.operationWindowEnd
                                                    ? `${new Date(verification.operationWindowStart).toLocaleDateString()} - ${new Date(verification.operationWindowEnd).toLocaleString()}`
                                                    : 'Not provided'
                                            }
                                        />
                                        <InfoItem
                                            label="Validity"
                                            value={
                                                verification.validityStart
                                                    ? `${new Date(verification.validityStart).toLocaleDateString('en-GB')} - ${verification.validityEnd ? new Date(verification.validityEnd).toLocaleDateString('en-GB') : 'Until further notice'}`
                                                    : 'Not provided'
                                            }
                                        />
                                        <InfoItem
                                            label="Use Category"
                                            value={
                                                verification.siteType === 'emergency'
                                                    ? 'Emergency/Recovery Only'
                                                    : verification.toalOnly
                                                      ? 'TOAL Only'
                                                      : 'TOAL + Emergency/Recovery'
                                            }
                                        />
                                        <InfoItem
                                            label="Exclusive Use"
                                            value={verification.exclusiveUse ? 'Yes' : 'No'}
                                        />
                                        <InfoItem
                                            label="Approval Mode"
                                            value={
                                                verification.autoApprove
                                                    ? 'Auto Approval'
                                                    : 'Manual Approval'
                                            }
                                        />
                                        <InfoItem
                                            label="TOAL Access Fee"
                                            value={`£${Number(verification.toalAccessFee || 0).toFixed(2)}`}
                                        />
                                        <InfoItem
                                            label="Emergency Access Fee"
                                            value={
                                                verification.clzAccessFee
                                                    ? `£${Number(verification.clzAccessFee).toFixed(2)}`
                                                    : 'N/A'
                                            }
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Site Map & Geometry */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <MapIcon className="size-5 text-blue-600" />
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                        Site Map & Geometry
                                    </h3>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                                    <div className="h-[400px] rounded-3xl overflow-hidden border border-slate-200 mb-6 relative">
                                        <ReadOnlySiteMap
                                            geometry={verification.siteGeometry!}
                                            clzGeometry={verification.clzGeometry}
                                            showLegend={true}
                                            highlightMode="both"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {verification.siteGeometry && (
                                            <button
                                                onClick={() => handleDownloadGeoJSON('TOAL')}
                                                className="h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/10"
                                            >
                                                <Download className="size-5" />
                                                TOAL GeoJSON
                                            </button>
                                        )}
                                        {verification.clzGeometry && (
                                            <button
                                                onClick={() => handleDownloadGeoJSON('EMERGENCY')}
                                                className="h-14 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10"
                                            >
                                                <Download className="size-5" />
                                                Emergency GeoJSON
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Declarations & Confirmations */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Shield className="size-5 text-blue-600" />
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                        Declarations & Confirmations
                                    </h3>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-x-12">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-500">
                                                Authorized to Grant Access:
                                            </p>
                                            <span
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    verification.authorizedToGrantAccess
                                                        ? 'bg-emerald-50 text-[#15803D] border border-emerald-100'
                                                        : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}
                                            >
                                                {verification.authorizedToGrantAccess
                                                    ? 'Yes - Confirmed'
                                                    : 'No'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-500">
                                                Landowner Declaration:
                                            </p>
                                            <span
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    verification.acceptedLandownerDeclaration
                                                        ? 'bg-emerald-50 text-[#15803D] border border-emerald-100'
                                                        : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}
                                            >
                                                {verification.acceptedLandownerDeclaration
                                                    ? 'Accepted'
                                                    : 'Not Accepted'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                            Site Information
                                        </p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {verification.siteInformation ||
                                                'No additional site information submitted.'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <FileText className="size-5 text-blue-600" />
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                        Submission Checklist
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                            Policy Documents
                                        </p>
                                        <p className="text-2xl font-black text-slate-800 mt-2">
                                            {Math.max(
                                                categorizedDocuments.policy.length,
                                                verification.policyDocuments?.length || 0
                                            )}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                            Ownership Evidence
                                        </p>
                                        <p className="text-2xl font-black text-slate-800 mt-2">
                                            {Math.max(
                                                categorizedDocuments.ownership.length,
                                                verification.ownershipDocuments?.length || 0
                                            )}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                            Site Photos
                                        </p>
                                        <p className="text-2xl font-black text-slate-800 mt-2">
                                            {Math.max(
                                                categorizedDocuments.photo.length,
                                                verification.sitePhotos?.length || 0
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Operator Credentials Section — only for operator type */}
                    {verification.type === 'operator' &&
                        (() => {
                            const docs: any[] = Array.isArray(verification.submittedDocuments)
                                ? verification.submittedDocuments
                                : [];
                            const cred =
                                docs.find(d => d.documentType === 'operator_credentials') ?? {};
                            return (
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Shield className="size-5 text-blue-600" />
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                            Submitted Operator Credentials
                                        </h3>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                            <InfoItem
                                                label="Flyer ID"
                                                value={
                                                    (verification as any).flyerId ||
                                                    cred.flyerId ||
                                                    'N/A'
                                                }
                                                mono
                                            />
                                            <InfoItem
                                                label="Operator Reference"
                                                value={cred.operatorReference || '—'}
                                                mono
                                            />
                                            <InfoItem
                                                label="Full Name"
                                                value={
                                                    cred.fullName || verification.userName || '—'
                                                }
                                            />
                                            <InfoItem
                                                label="Organisation"
                                                value={
                                                    cred.organisation ||
                                                    verification.userOrganisation ||
                                                    'Independent'
                                                }
                                            />
                                            <InfoItem
                                                label="Contact Phone"
                                                value={cred.contactPhone || '—'}
                                            />
                                            <InfoItem
                                                label="Submitted At"
                                                value={
                                                    cred.submittedAt
                                                        ? new Date(cred.submittedAt).toLocaleString(
                                                              'en-GB'
                                                          )
                                                        : new Date(
                                                              verification.createdAt
                                                          ).toLocaleString('en-GB')
                                                }
                                            />
                                        </div>
                                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                            <p className="text-xs font-black text-blue-800 uppercase tracking-wider mb-1">
                                                Verification Note
                                            </p>
                                            <p className="text-sm text-blue-700">
                                                Please verify the Flyer ID and Operator Reference
                                                against the CAA Drone Register before approving.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            );
                        })()}

                    {/* Submitted Documents — shown for landowner/site types */}
                    <section className="space-y-6">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                            Submitted Documents
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'policy', label: 'Policy' },
                                { id: 'ownership', label: 'Ownership' },
                                { id: 'photo', label: 'Photos' },
                                { id: 'other', label: 'Supporting' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() =>
                                        setDocumentTab(
                                            tab.id as
                                                | 'all'
                                                | 'policy'
                                                | 'ownership'
                                                | 'photo'
                                                | 'other'
                                        )
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-colors ${
                                        documentTab === tab.id
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {filteredDocuments.length > 0 ? (
                                filteredDocuments.map(doc => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-3xl p-6 hover:bg-white hover:border-slate-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors border border-slate-100">
                                                <FileText className="size-6" />
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-800 capitalize">
                                                    {doc.label}
                                                </p>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                    {doc.uploadedAt
                                                        ? `Uploaded ${new Date(doc.uploadedAt).toLocaleDateString()}`
                                                        : doc.meta}
                                                </p>
                                            </div>
                                        </div>
                                        {doc.href ? (
                                            <a
                                                href={doc.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 font-black text-sm hover:underline flex items-center gap-1.5"
                                            >
                                                Open Document <ExternalLink className="size-4" />
                                            </a>
                                        ) : (
                                            <span className="text-slate-400 text-sm font-bold">
                                                Link unavailable
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-center">
                                    <p className="text-slate-400 font-bold text-sm">
                                        {documentTab === 'all'
                                            ? 'No documents submitted'
                                            : `No ${documentTab} documents submitted`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Admin Notes */}
                    <section className="space-y-6">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                            {verification.type === 'operator'
                                ? 'Admin Note To Operator (Optional)'
                                : 'Admin Note To Landowner (Optional)'}
                        </h3>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={4}
                            className="w-full p-6 bg-white border border-slate-200 rounded-3xl text-base focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-slate-400"
                            placeholder={
                                verification.type === 'operator'
                                    ? 'Add a note the operator will see (approval reason, rejection feedback, next steps)...'
                                    : 'Add a clear note the landowner will see (approval guidance, rejection reason, next steps)...'
                            }
                        />
                    </section>

                    {/* Confirmations */}
                    <AnimatePresence>
                        {showConfirm && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className={`p-8 rounded-3xl border ${showConfirm === 'approve' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}
                            >
                                <div className="flex items-start gap-5 mb-8">
                                    <div
                                        className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${showConfirm === 'approve' ? 'bg-white text-[#15803D]' : 'bg-white text-red-600'}`}
                                    >
                                        {showConfirm === 'approve' ? (
                                            <CheckCircle className="size-6" />
                                        ) : (
                                            <XCircle className="size-6" />
                                        )}
                                    </div>
                                    <div>
                                        <p
                                            className={`text-lg font-black ${showConfirm === 'approve' ? 'text-emerald-900' : 'text-red-900'}`}
                                        >
                                            Are you sure you want to {showConfirm} this
                                            verification?
                                        </p>
                                        <p
                                            className={`text-sm font-medium mt-1 ${showConfirm === 'approve' ? 'text-emerald-700' : 'text-red-700'}`}
                                        >
                                            {confirmationMessage}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button
                                        onClick={
                                            showConfirm === 'approve' ? handleApprove : handleReject
                                        }
                                        loading={loading}
                                        className={`flex-1 h-12 rounded-xl font-black uppercase tracking-wider transition-all ${
                                            showConfirm === 'approve'
                                                ? 'bg-[#15803D] text-white hover:bg-[#166534]'
                                                : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                    >
                                        Confirm {showConfirm}
                                    </Button>
                                    <button
                                        onClick={() => setShowConfirm(null)}
                                        className="flex-1 h-12 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                {!showConfirm && (
                    <div className="px-8 py-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50">
                        {verification.status === 'PENDING' ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="h-12 px-7 bg-white border border-slate-300 text-slate-700 rounded-xl font-black uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center gap-2"
                                >
                                    <X className="size-4" />
                                    Close
                                </button>
                                <button
                                    onClick={() => setShowConfirm('reject')}
                                    className="h-12 px-7 border border-red-200 text-red-600 rounded-xl font-black uppercase tracking-wider hover:bg-red-50 transition-all flex items-center gap-2"
                                >
                                    <XCircle className="size-5" />
                                    Reject
                                </button>
                                <button
                                    onClick={() => setShowConfirm('approve')}
                                    className="h-12 px-7 bg-[#15803D] text-white rounded-xl font-black uppercase tracking-wider hover:bg-[#166534] transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 "
                                >
                                    <CheckCircle className="size-5" />
                                    Approve
                                </button>
                            </>
                        ) : verification.status === 'REJECTED' ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="h-12 px-7 bg-white border border-slate-300 text-slate-700 rounded-xl font-black uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center gap-2"
                                >
                                    <X className="size-4" />
                                    Close
                                </button>
                                <button
                                    onClick={() => setShowConfirm('approve')}
                                    className="h-12 px-7! bg-[#15803D] text-white rounded-xl font-black uppercase tracking-wider hover:bg-[#166534] transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                                >
                                    <CheckCircle className="size-5" />
                                    Approve
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="h-12 px-7 bg-white border border-slate-300 text-slate-700 rounded-xl font-black uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                                <X className="size-4" />
                                Close
                            </button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function InfoItem({
    label,
    value,
    mono,
}: {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {label}
            </p>
            <div
                className={`text-base font-black text-slate-800 ${mono ? 'font-mono tracking-wider' : ''}`}
            >
                {value}
            </div>
        </div>
    );
}
