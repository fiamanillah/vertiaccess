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
        private_land: { label: 'Private Land', cls: 'bg-slate-100 text-slate-600' },
        helipad: { label: 'Helipad', cls: 'bg-sky-50 text-sky-700' },
        vertiport: { label: 'Vertiport', cls: 'bg-violet-50 text-violet-700' },
        droneport: { label: 'Droneport', cls: 'bg-indigo-50 text-indigo-700' },
        temporary_landing_site: { label: 'Temporary Site', cls: 'bg-amber-50 text-amber-700' },
    };
    const entry = map[category] ?? { label: category, cls: 'bg-slate-100 text-slate-600' };
    return (
        <span
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${entry.cls} ${entry.cls.includes('slate') ? 'border-slate-200' : 'border-current/10'}`}
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
            <div className="w-full h-24 bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-slate-200 border-dashed">
                <ImageOff className="size-7 text-slate-400" />
                <p className="text-xs text-slate-500 font-semibold">No site photos uploaded</p>
            </div>
        );
    }

    const prev = () => setCurrent(c => (c - 1 + photos.length) % photos.length);
    const next = () => setCurrent(c => (c + 1) % photos.length);

    return (
        <>
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                    src={photos[current]}
                    alt={`${siteName} — photo ${current + 1}`}
                    className="w-full h-44 object-cover cursor-zoom-in"
                    onClick={() => setLightbox(current)}
                    onError={e => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                />
                {photos.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 size-7 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-2 top-1/2 -translate-y-1/2 size-7 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {photos.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-white' : 'size-1.5 bg-white/50 hover:bg-white/80'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-white font-bold">
                    {current + 1} / {photos.length}
                </div>
            </div>

            {/* Thumbnails row */}
            {photos.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {photos.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`size-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${i === current ? 'border-blue-600 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
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
        <div className="grid grid-cols-[auto,1fr] gap-2.5 items-start">
            {Icon && (
                <div
                    className={`size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${accent ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'}`}
                >
                    <Icon className={`size-3.5 ${accent ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                    {label}
                </p>
                <div className="text-sm font-bold text-slate-900 leading-snug">{value}</div>
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
        <div className="space-y-5 ">
            {/* Identity block */}
            {/* Identity block - Removed redundant title/address, keeping only status badges */}
            <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 shadow-sm flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                </span>
                {site.autoApprove && (
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-100 shadow-sm">
                        Auto-Approve
                    </span>
                )}
                {site.clzEnabled && (
                    <span className="px-3 py-1.5 bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-orange-100 shadow-sm flex items-center gap-1.5">
                        <Zap className="size-2.5" />
                        ERS Ready
                    </span>
                )}
                <SiteCategoryBadge category={site.siteCategory} />
            </div>

            {/* Photo Gallery */}
            <div className="space-y-2.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Site Photos
                </p>
                <PhotoGallery photos={site.sitePhotos || []} siteName={site.name} />
            </div>

            {/* Map */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Site Map
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                        <Globe className="size-3" />
                        <span>Interactive</span>
                    </div>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-44 sm:h-50 relative bg-slate-100">
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
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-md px-3 py-2 space-y-1">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2.5 rounded-full bg-blue-500 border border-blue-600" />
                            <span className="text-[9px] font-bold text-slate-800">TOAL Zone</span>
                        </div>
                        {site.clzEnabled && (
                            <div className="flex items-center gap-1.5">
                                <div className="size-2.5 rounded-full bg-orange-400 border border-orange-500" />
                                <span className="text-[9px] font-bold text-slate-800">
                                    Emergency Zone
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Core Site Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Site Details
                </p>
                <div className="grid grid-cols-1 gap-3">
                    <DetailRow
                        label="Geometry Type"
                        icon={Layers}
                        value={
                            <span className="capitalize">
                                {site.geometry?.type || 'Circle'}
                                {site.geometry?.radius ? ` — ${site.geometry.radius}m radius` : ''}
                            </span>
                        }
                    />
                    {site.geometry?.heightAGL !== undefined && (
                        <DetailRow
                            label="Height AGL"
                            icon={Zap}
                            value={`${site.geometry.heightAGL}m`}
                        />
                    )}
                    <DetailRow
                        label="Auto-Approval"
                        icon={CheckCircle2}
                        value={
                            <BooleanBadge
                                value={site.autoApprove}
                                trueLabel="Enabled — instant approval"
                                falseLabel="Disabled — landowner reviews each request"
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
                                trueLabel="Only one operator at a time"
                                falseLabel="Shared use permitted"
                            />
                        }
                    />
                    <DetailRow
                        label="Emergency & Recovery"
                        icon={Zap}
                        value={
                            <BooleanBadge
                                value={site.clzEnabled}
                                trueLabel="Available for E&R operations"
                                falseLabel="Not available"
                            />
                        }
                        accent={site.clzEnabled}
                    />
                    <DetailRow
                        label="Validity Period"
                        icon={Clock}
                        value={formatValidity(site.validityStart, site.validityEnd)}
                    />
                    {site.toalAccessFee !== undefined && site.toalAccessFee !== null && (
                        <DetailRow
                            label="TOAL Access Fee"
                            icon={FileText}
                            value={`£${Number(site.toalAccessFee).toFixed(2)} per booking`}
                            accent
                        />
                    )}
                    {site.clzAccessFee !== undefined && site.clzAccessFee !== null && (
                        <DetailRow
                            label="E&R Access Fee"
                            icon={FileText}
                            value={`£${Number(site.clzAccessFee).toFixed(2)} per booking`}
                        />
                    )}
                </div>
            </div>

            {/* Site Information & Hazards */}
            {site.siteInformation && (
                <div className="bg-blue-50/70 rounded-2xl border border-blue-200 p-4 space-y-2.5">
                    <div className="flex items-center gap-2">
                        <Info className="size-4 text-blue-600" />
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                            Information & Hazards
                        </p>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                        {site.siteInformation}
                    </p>
                </div>
            )}

            {/* Exclusive use warning */}
            {site.exclusiveUse && (
                <div className="flex gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        <strong>Exclusive Use:</strong> Only one operator may book this site at a
                        time. Check the availability calendar carefully before submitting.
                    </p>
                </div>
            )}

            {/* Policy Documents */}
            {site.policyDocuments && site.policyDocuments.length > 0 && (
                <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Policy Documents
                    </p>
                    <div className="space-y-2">
                        {site.policyDocuments.map((doc, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl"
                            >
                                <div className="size-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                                    <FileText className="size-4 text-slate-500" />
                                </div>
                                <span className="text-xs font-semibold text-slate-800 truncate flex-1">
                                    {doc.split('/').pop() || doc}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GeoJSON Downloads */}
            {(onDownloadTOAL || onDownloadEmergency) && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">
                        Download Geometry Data
                    </p>
                    <p className="text-xs text-green-700 font-medium">
                        Download the GeoJSON boundary files for your flight planning software.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {(activeWorkflow === 'toal' || !activeWorkflow) && onDownloadTOAL && (
                            <button
                                onClick={onDownloadTOAL}
                                className="flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all"
                            >
                                <Download className="size-3.5" />
                                TOAL GeoJSON
                            </button>
                        )}
                        {site.clzEnabled &&
                            (activeWorkflow === 'clz' || !activeWorkflow) &&
                            onDownloadEmergency && (
                                <button
                                    onClick={onDownloadEmergency}
                                    className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-all"
                                >
                                    <Download className="size-3.5" />
                                    E&R GeoJSON
                                </button>
                            )}
                    </div>
                </div>
            )}

            {/* Spacer for scroll breathing room */}
            <div className="h-4" />
        </div>
    );
}
