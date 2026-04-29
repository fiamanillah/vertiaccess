import { useState } from 'react';
import type { Site } from '../../types';
import {
    MapPin,
    AlertTriangle,
    Download,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    X,
    ImageOff,
    Shield,
    Zap,
    Clock,
    FileText,
    Info,
    Globe,
    Layers,
} from 'lucide-react';
import { ReadOnlySiteMap } from '../ReadOnlySiteMap';

interface SiteDetailsPanelProps {
    site: Site;
    activeWorkflow?: 'toal' | 'clz' | null;
    paymentCompleted?: boolean;
    onDownloadTOAL?: () => void;
    onDownloadEmergency?: () => void;
}

function formatValidity(start?: string, end?: string): string {
    if (!start) return 'Until Further Notice';
    const s = new Date(start).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    if (!end) return `${s} – UFN`;
    const e = new Date(end).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    return `${s} – ${e}`;
}

function SiteCategoryBadge({ category }: { category?: string }) {
    if (!category) return null;
    const map: Record<string, { label: string; cls: string }> = {
        private_land: { label: 'Private Land', cls: 'bg-slate-100 text-slate-700' },
        helipad: { label: 'Helipad', cls: 'bg-sky-100 text-sky-700' },
        vertiport: { label: 'Vertiport', cls: 'bg-violet-100 text-violet-700' },
        droneport: { label: 'Droneport', cls: 'bg-indigo-100 text-indigo-700' },
        temporary_landing_site: { label: 'Temporary Site', cls: 'bg-amber-100 text-amber-700' },
    };
    const entry = map[category] ?? { label: category, cls: 'bg-slate-100 text-slate-700' };
    return (
        <span
            className={`px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wide border shadow-sm ${entry.cls} ${entry.cls.includes('slate') ? 'border-slate-200/60' : 'border-current/20'}`}
        >
            {entry.label}
        </span>
    );
}

function PhotoGallery({ photos, siteName }: { photos: string[]; siteName: string }) {
    const [current, setCurrent] = useState(0);
    const [lightbox, setLightbox] = useState<number | null>(null);

    if (!photos || photos.length === 0) {
        return (
            <div className="w-full h-20 bg-slate-50 rounded-lg flex flex-col items-center justify-center gap-1 border border-slate-200 border-dashed">
                <ImageOff className="size-5 text-slate-300" />
                <p className="text-xs text-slate-400 font-medium">No photos</p>
            </div>
        );
    }

    const prev = () => setCurrent(c => (c - 1 + photos.length) % photos.length);
    const next = () => setCurrent(c => (c + 1) % photos.length);

    return (
        <>
            <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-32">
                <img
                    src={photos[current]}
                    alt={`${siteName} — photo ${current + 1}`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setLightbox(current)}
                    onError={e => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                />
                {photos.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 size-6 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft className="size-3.5" />
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 size-6 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight className="size-3.5" />
                        </button>
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {photos.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`rounded-full transition-all ${i === current ? 'w-3 h-1 bg-white' : 'size-1 bg-white/50 hover:bg-white/80'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
                <div className="absolute top-1.5 right-1.5 bg-black/40 backdrop-blur-sm rounded text-[9px] text-white font-bold px-1.5 py-0.5">
                    {current + 1} / {photos.length}
                </div>
            </div>

            {/* Thumbnails row */}
            {photos.length > 1 && (
                <div className="flex gap-1 mt-1.5 overflow-x-auto pb-0.5">
                    {photos.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`size-10 rounded-md overflow-hidden shrink-0 border-2 transition-all ${i === current ? 'border-blue-600 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                        >
                            <img
                                src={p}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={e => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightbox !== null && (
                <div
                    className="fixed inset-0 bg-black/90 z-100 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 size-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                        onClick={() => setLightbox(null)}
                    >
                        <X className="size-5" />
                    </button>
                    <img
                        src={photos[lightbox]}
                        alt={siteName}
                        className="max-w-full max-h-full object-contain rounded-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

function DetailRow({
    label,
    value,
    icon: Icon,
    accent = false,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
    accent?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            {Icon && (
                <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 flex-none border transition-all ${
                        accent
                            ? 'bg-blue-100 border-blue-200 text-blue-600'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                >
                    <Icon className="size-4" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {label}
                </p>
                <div
                    className={`text-sm font-semibold leading-snug ${accent ? 'text-blue-900' : 'text-slate-800'}`}
                >
                    {value}
                </div>
            </div>
        </div>
    );
}

function BooleanBadge({
    value,
    trueLabel = 'Yes',
    falseLabel = 'No',
}: {
    value: boolean;
    trueLabel?: string;
    falseLabel?: string;
}) {
    return value ? (
        <span className="inline-flex items-center gap-1 text-green-700 font-bold text-xs">
            <CheckCircle2 className="size-3.5" />
            {trueLabel}
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-slate-600 font-bold text-xs">
            <XCircle className="size-3.5" />
            {falseLabel}
        </span>
    );
}

export function SiteDetailsPanel({
    site,
    activeWorkflow,
    paymentCompleted: _paymentCompleted,
    onDownloadTOAL,
    onDownloadEmergency,
}: SiteDetailsPanelProps) {
    return (
        <div className="space-y-3">
            {/* Identity block - Status Badges */}
            <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1.5 bg-emerald-100 text-emerald-700 text-[8px] font-bold uppercase tracking-wide rounded-lg border border-emerald-200/60 shadow-sm flex items-center gap-1.5 shrink-0">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                </span>
                {site.autoApprove && (
                    <span className="px-2.5 py-1.5 bg-blue-100 text-blue-700 text-[8px] font-bold uppercase tracking-wide rounded-lg border border-blue-200/60 shadow-sm flex items-center gap-1">
                        <Zap className="size-3" />
                        Auto-Approve
                    </span>
                )}
                {site.clzEnabled && (
                    <span className="px-2.5 py-1.5 bg-orange-100 text-orange-700 text-[8px] font-bold uppercase tracking-wide rounded-lg border border-orange-200/60 shadow-sm flex items-center gap-1.5">
                        <Shield className="size-3" />
                        E&R Ready
                    </span>
                )}
                <SiteCategoryBadge category={site.siteCategory} />
            </div>

            {/* Photo Gallery */}
            <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                    <div className="size-7 bg-slate-100 rounded-lg flex items-center justify-center">
                        <ImageOff className="size-3.5 text-slate-600" />
                    </div>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                        Site Photos
                    </p>
                </div>
                <PhotoGallery photos={site.sitePhotos || []} siteName={site.name} />
            </div>

            {/* Map */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-7 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Globe className="size-3.5 text-slate-600" />
                        </div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                            Location Map
                        </p>
                    </div>
                    <span className="text-[8px] text-slate-400 font-semibold">Interactive</span>
                </div>
                <div
                    className="rounded-lg overflow-hidden border border-slate-200 shadow-sm w-full relative bg-slate-100 flex flex-col"
                    style={{ height: '192px' }}
                >
                    <ReadOnlySiteMap
                        geometry={site.geometry}
                        clzGeometry={site.clzGeometry}
                        highlightMode={
                            activeWorkflow === 'toal'
                                ? 'toal'
                                : activeWorkflow === 'clz'
                                  ? 'clz'
                                  : 'both'
                        }
                    />
                    {/* Map legend overlay */}
                    <div className="absolute h-auto bottom-2 left-2 bg-white/95 backdrop-blur-sm rounded-lg border border-slate-200 shadow-md px-2.5 py-2 space-y-1">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-blue-500 border border-blue-600" />
                            <span className="text-[8px] font-bold text-slate-800">TOAL</span>
                        </div>
                        {site.clzEnabled && (
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-orange-400 border border-orange-500" />
                                <span className="text-[8px] font-bold text-slate-800">
                                    E&R Zone
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Core Site Details - Grid */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                    <div className="size-7 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Layers className="size-3.5 text-slate-600" />
                    </div>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                        Technical Details
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <DetailRow
                        label="Zone Type"
                        icon={Layers}
                        value={
                            <span className="capitalize">{site.geometry?.type || 'Circle'}</span>
                        }
                    />
                    {site.geometry?.radius && (
                        <DetailRow label="Zone Size" value={`${site.geometry.radius}m`} />
                    )}
                    {site.geometry?.heightAGL !== undefined && (
                        <DetailRow label="Height AGL" value={`${site.geometry.heightAGL}m`} />
                    )}
                </div>
            </div>

            {/* Permissions & Features */}
            <div className="bg-slate-50/50 rounded-lg border border-slate-200/50 p-3 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                    <div className="size-7 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Shield className="size-3.5 text-slate-600" />
                    </div>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                        Permissions
                    </p>
                </div>
                <div className="space-y-3">
                    <DetailRow
                        label="Auto-Approval"
                        icon={CheckCircle2}
                        value={
                            <BooleanBadge
                                value={site.autoApprove}
                                trueLabel="Instant approval"
                                falseLabel="Landowner reviews"
                            />
                        }
                        accent={site.autoApprove}
                    />
                    <DetailRow
                        label="Exclusive Use"
                        icon={Shield}
                        value={
                            <BooleanBadge
                                value={site.exclusiveUse}
                                trueLabel="One operator at a time"
                                falseLabel="Shared use allowed"
                            />
                        }
                    />
                    <DetailRow
                        label="Emergency Access"
                        icon={AlertTriangle}
                        value={
                            <BooleanBadge
                                value={site.clzEnabled}
                                trueLabel="Available for E&R"
                                falseLabel="Not available"
                            />
                        }
                        accent={site.clzEnabled}
                    />
                </div>
            </div>

            {/* Pricing Information */}
            <div className="bg-blue-50 rounded-lg border border-blue-200/60 p-3 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                    <div className="size-7 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="size-3.5 text-blue-600" />
                    </div>
                    <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">
                        Access Fees
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {site.toalAccessFee !== undefined && site.toalAccessFee !== null ? (
                        <DetailRow
                            label="TOAL Access"
                            value={`£${Number(site.toalAccessFee).toFixed(2)} per booking`}
                            accent
                        />
                    ) : (
                        <DetailRow label="TOAL Access" value="Contact for pricing" />
                    )}
                    {site.clzAccessFee !== undefined && site.clzAccessFee !== null && (
                        <DetailRow
                            label="E&R Access"
                            value={`£${Number(site.clzAccessFee).toFixed(2)} per booking`}
                        />
                    )}
                </div>
            </div>

            {/* Validity Period */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                    <div className="size-7 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Clock className="size-3.5 text-slate-600" />
                    </div>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                        Operational Period
                    </p>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                    {formatValidity(site.validityStart, site.validityEnd)}
                </p>
            </div>

            {/* Site Information & Hazards */}
            {site.siteInformation && (
                <div className="bg-amber-50 rounded-lg border border-amber-200/60 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="size-7 bg-amber-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="size-3.5 text-amber-600" />
                        </div>
                        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">
                            Site Information
                        </p>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                        {site.siteInformation}
                    </p>
                </div>
            )}

            {/* Exclusive use warning */}
            {site.exclusiveUse && (
                <div className="flex gap-2.5 p-3 bg-yellow-50 border border-yellow-200/60 rounded-lg">
                    <div className="size-7 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                        <AlertTriangle className="size-3.5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-yellow-800 leading-snug font-medium">
                            <strong>Exclusive Use:</strong> Only one operator may book at a time.
                        </p>
                    </div>
                </div>
            )}

            {/* Policy Documents */}
            {/* {site.policyDocuments && site.policyDocuments.length > 0 && (
                <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                        <div className="size-7 bg-slate-100 rounded-lg flex items-center justify-center">
                            <FileText className="size-3.5 text-slate-600" />
                        </div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                            Policy Documents
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        {site.policyDocuments.map((doc, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-all"
                            >
                                <div className="size-7 bg-white border border-slate-200 rounded-md flex items-center justify-center shrink-0">
                                    <FileText className="size-3.5 text-slate-400" />
                                </div>
                                <span className="text-xs font-semibold text-slate-700 truncate flex-1">
                                    {doc.split('/').pop() || doc}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )} */}

            {/* GeoJSON Downloads */}
            {(onDownloadTOAL || onDownloadEmergency) && (
                <div className="bg-green-50 border border-green-200/60 rounded-lg p-3 space-y-2.5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2">
                        <div className="size-7 bg-green-100 rounded-lg flex items-center justify-center">
                            <Download className="size-3.5 text-green-600" />
                        </div>
                        <p className="text-[9px] font-bold text-green-700 uppercase tracking-wide">
                            Download Geometry
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(activeWorkflow === 'toal' || !activeWorkflow) && onDownloadTOAL && (
                            <button
                                onClick={onDownloadTOAL}
                                className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all flex-1 sm:flex-none"
                            >
                                <Download className="size-3" />
                                TOAL GeoJSON
                            </button>
                        )}
                        {site.clzEnabled &&
                            (activeWorkflow === 'clz' || !activeWorkflow) &&
                            onDownloadEmergency && (
                                <button
                                    onClick={onDownloadEmergency}
                                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all flex-1 sm:flex-none"
                                >
                                    <Download className="size-3" />
                                    E&R GeoJSON
                                </button>
                            )}
                    </div>
                </div>
            )}

            {/* Spacer for scroll breathing room */}
            <div className="h-3" />
        </div>
    );
}
