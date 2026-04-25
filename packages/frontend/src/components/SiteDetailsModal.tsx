import { useState } from 'react';
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

interface SiteDetailsModalProps {
    site: Site;
    onClose: () => void;
    onSave: (updatedSite: Site) => Promise<void> | void;
    onWithdraw?: (siteId: string) => void;
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
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {label}
        </p>
        {isEditing && editingNode ? (
            editingNode
        ) : (
            <p className="text-base text-slate-800 font-semibold leading-snug">
                {value || '—'}
            </p>
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

export function SiteDetailsModal({ site, onClose, onSave, onWithdraw }: SiteDetailsModalProps) {
    const currentStatus = normalizeSiteStatus(site.status);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
            console.error("Failed to save site updates:", error);
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
                className="bg-white rounded-2xl shadow-2xl max-w-275 w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <MapPin className="size-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                {site.name}
                                <span className="text-slate-500 text-base font-semibold ml-3 px-2.5 py-0.5 bg-slate-100 rounded-lg">
                                    VA-12345678
                                </span>
                            </h2>
                            <p className="text-sm text-slate-500">{site.address}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {!isEditing ? (
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
                        ) : (
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
                        )}
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
                    <div className="p-8">
                        <div className="grid lg:grid-cols-12 gap-8">
                            {/* Left Column - Main Info */}
                            <div className="lg:col-span-7 space-y-8">
                                {/* Site Details Card */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                    <SectionTitle>Site Information</SectionTitle>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                        <LabelValue isEditing={isEditing}
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
                                        <LabelValue isEditing={isEditing}
                                            label="Site ID"
                                            value={
                                                <span className="font-mono text-blue-600">
                                                    VA-12345678
                                                </span>
                                            }
                                        />
                                        <LabelValue isEditing={isEditing}
                                            label="Site Type"
                                            value={
                                                <span className="capitalize">
                                                    {site.siteType?.replace(/_/g, ' ')}
                                                </span>
                                            }
                                        />
                                        <LabelValue isEditing={isEditing}
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
                                            <LabelValue isEditing={isEditing}
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
                                        <LabelValue isEditing={isEditing}
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
                                        <LabelValue isEditing={isEditing}
                                            label="Contact Phone"
                                            value={site.contactPhone}
                                            editingNode={
                                                <input
                                                    type="tel"
                                                    value={contactPhone}
                                                    onChange={e => setContactPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                                                />
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Validity Card */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
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
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
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
                            </div>

                            {/* Right Column - Map & Media */}
                            <div className="lg:col-span-5 space-y-8">
                                {/* Map View Card */}
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <SectionTitle>Spatial Layout</SectionTitle>
                                        <button className="h-8 px-3 bg-slate-100 rounded-lg flex items-center gap-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                                            <Globe className="size-3 text-blue-600" />
                                            SATELLITE
                                        </button>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 relative h-[280px] bg-slate-100 shadow-inner">
                                        <SiteMap
                                            geometryType={geometry.type || 'circle'}
                                            center={
                                                geometry.center ||
                                                clzGeometry?.center || {
                                                    lat: 51.5074,
                                                    lng: -0.1278,
                                                }
                                            }
                                            radius={geometry.radius || 50}
                                            polygonPoints={geometry.points || []}
                                            onCenterChange={(center) => setGeometry(prev => ({ ...prev, center }))}
                                            onPolygonPointsChange={(points) => setGeometry(prev => ({ ...prev, points }))}
                                            clzEnabled={isEditing ? clzEnabled : site.clzEnabled}
                                            clzPolygonPoints={clzGeometry?.points || []}
                                            onClzPolygonPointsChange={(points) => setClzGeometry(prev => ({ ...prev, type: prev?.type || 'polygon', points }))}
                                            clzRadius={clzGeometry?.radius || 150}
                                            readonly={!isEditing}
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
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
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
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                    <SectionTitle>Media & Documentation</SectionTitle>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                                                Site Photos
                                                <span className="text-blue-600 normal-case font-bold">
                                                    {sitePhotos.length} files
                                                </span>
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {sitePhotos.length > 0 ? (
                                                    sitePhotos.slice(0, 3).map((photo, idx) => (
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
                                            <p className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center justify-between">
                                                Ownership & Authority
                                            </p>
                                            <div className="space-y-2">
                                                {ownershipDocuments.length > 0 ? (
                                                    ownershipDocuments
                                                        .slice(0, 2)
                                                        .map((doc, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 group hover:border-blue-600/30 transition-colors"
                                                            >
                                                                <div className="size-7 bg-white rounded flex items-center justify-center border border-slate-200 text-emerald-600 transition-colors">
                                                                    <ShieldCheck className="size-3.5" />
                                                                </div>
                                                                <span className="text-xs text-slate-600 font-medium truncate">
                                                                    {doc}
                                                                </span>
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info & Final Status */}
                <div className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
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
                        <button
                            onClick={() => handleDownloadGeoJSON('TOAL')}
                            className="h-9 px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Download className="size-3.5" />
                            TOAL GEOJSON
                        </button>
                        {site.clzEnabled && (
                            <button
                                onClick={() => handleDownloadGeoJSON('CLZ')}
                                className="h-9 px-4 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <Download className="size-3.5" />
                                CLZ GEOJSON
                            </button>
                        )}
                        <div className="h-4 w-px bg-slate-200" />
                        <p className="text-xs text-slate-400 font-medium tracking-tight uppercase">
                            System Ref: {site.id.toUpperCase()}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
