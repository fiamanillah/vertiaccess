'use client';

import * as React from 'react';
import { 
    Building2, 
    MapPin, 
    Image as ImageIcon, 
    Banknote, 
    LayoutDashboard, 
    ShieldCheck, 
    Mail, 
    Phone, 
    Calendar,
    Download,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { PreviewMap } from '@/components/map/preview-map';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { DetailBox, MetricBox, DocumentListItem } from './ui-helpers';
import { Separator } from '@workspace/ui/components/separator';
import { generateGeoJSONFeature, downloadGeoJSONFile, polygonAreaM2, circleAreaM2, formatArea } from '@/lib/geojson-utils';

interface SiteContextColumnProps {
    site: any;
    onApprove: () => void;
    onReject: () => void;
}

export function SiteContextColumn({ site, onApprove, onReject }: SiteContextColumnProps) {
    const latVal = typeof site.latitude === 'number' ? site.latitude : parseFloat(site.latitude) || 0;
    const lngVal = typeof site.longitude === 'number' ? site.longitude : parseFloat(site.longitude) || 0;

    const calculatedArea = site.toalGeometryMode === 'polygon'
        ? formatArea(polygonAreaM2(site.toalPolygonPoints))
        : formatArea(circleAreaM2(site.toalRadius));

    const handleDownloadGeoJSON = (type: 'toal' | 'emergency') => {
        const mode = type === 'toal' ? site.toalGeometryMode : site.emergencyGeometryMode;
        const radius = type === 'toal' ? site.toalRadius : site.emergencyRadius;
        const points = type === 'toal' ? site.toalPolygonPoints : site.emergencyPolygonPoints;
        const name = type === 'toal' ? `${site.name} - TOAL Zone` : `${site.name} - Emergency Zone`;
        const center = { lat: latVal, lng: lngVal };

        const geojson = generateGeoJSONFeature(
            mode as 'circle' | 'polygon', 
            center, 
            radius, 
            points, 
            name
        );
        if (geojson) {
            downloadGeoJSONFile(`${site.name.toLowerCase().replace(/\s+/g, '_')}_${type}_boundary.geojson`, geojson);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-background custom-scrollbar pb-32">
                {/* 1. Basic Details */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 rounded-md bg-muted">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Basic Details</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-8">
                        <DetailBox label="Site Name" value={site.name} />
                        <DetailBox label="Category" value={site.category} />
                        <DetailBox
                            label="Primary Function"
                            value={site.siteType === 'toal' ? 'TOAL (Take-off & Landing)' : 'Emergency and Recovery'}
                            isBadge
                            badgeVariant={site.siteType === 'toal' ? 'indigo' : 'amber'}
                        />
                    </div>
                </div>

                {/* 2. Map & Boundaries */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 rounded-md bg-muted">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Map & Boundaries</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex flex-col gap-1">
                            <span className="text-xs font-semibold text-muted-foreground">Site Address</span>
                            <p className="text-sm font-semibold">{site.address}, <span className="font-mono text-primary">{site.postcode}</span></p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold gap-1.5 border-primary/20 hover:border-primary/50"
                                onClick={() => handleDownloadGeoJSON('toal')}
                            >
                                <Download className="h-4 w-4" /> Download TOAL GeoJSON
                            </Button>
                            {site.allowEmergencyLanding && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-semibold gap-1.5 border-primary/20 hover:border-primary/50"
                                    onClick={() => handleDownloadGeoJSON('emergency')}
                                >
                                    <Download className="h-4 w-4" /> Download CLZ GeoJSON
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <MetricBox label="Calculated Area" value={calculatedArea} icon={LayoutDashboard} />
                            <MetricBox label="Center Point" value={`${latVal.toFixed(4)}, ${lngVal.toFixed(4)}`} icon={MapPin} />
                            <MetricBox label="TOAL Geometry" value={site.toalGeometryMode === 'polygon' ? 'Polygon' : `${site.toalRadius} meters`} icon={ShieldCheck} />
                        </div>
                    </div>
                </div>

                {/* 3. Visuals & Description */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 rounded-md bg-muted">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Visuals & Description</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {site.photoUrls.map((url: string, i: number) => (
                                <div key={i} className="aspect-video rounded-2xl border border-border overflow-hidden relative group cursor-zoom-in shadow-md" onClick={() => window.open(url, '_blank')}>
                                    <img src={url} alt={`Site view ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" size="sm" className="font-semibold text-xs">Enlarge Photo</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 rounded-2xl bg-muted/10 border border-border/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                            <span className="text-xs font-semibold text-muted-foreground mb-3 block">Property Description</span>
                            <p className="text-base leading-relaxed text-foreground/80 italic">
                                "{site.description}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Operations & Pricing */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 rounded-md bg-muted">
                            <Banknote className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Operations & Pricing</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8 p-8 bg-muted/5 rounded-2xl border border-border/40">
                        <DetailBox label="Contact Email" value={site.assetManager.email} icon={Mail} />
                        <DetailBox label="Contact Phone" value={site.assetManager.phone} icon={Phone} />
                        <DetailBox
                            label="Availability"
                            value={site.isPermanentActivation ? "Permanent Activation" : "Scheduled Window"}
                            icon={Calendar}
                            subtitle={site.isPermanentActivation ? "24/7 Operational Status" : `${site.activationStartTime} - ${site.activationEndTime}`}
                        />
                        <DetailBox
                            label="Booking Model"
                            value={site.bookingApprovalModel === 'auto' ? "Auto-Approval" : "Manual Review"}
                            icon={ShieldCheck}
                        />
                        <DetailBox
                            label="TOAL Access Fee"
                            value={typeof site.toalFee === 'number' ? `£${site.toalFee.toFixed(2)}` : 'Free'}
                            icon={Banknote}
                            isHighlight
                        />
                        <DetailBox
                            label="Emergency Access Fee"
                            value={typeof site.emergencyFee === 'number' ? `£${site.emergencyFee.toFixed(2)}` : 'Free'}
                            icon={Banknote}
                            isHighlight
                        />
                    </div>
                </div>

                {/* 5. Documents & Legal Proof */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 rounded-md bg-muted">
                            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Documents & Proof of Authority</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Proof of Authority */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-semibold text-muted-foreground">Proof of Authority</span>
                                <Badge className="bg-emerald-100 text-emerald-700 border-none text-xs font-semibold h-5 px-2">
                                    Declaration Signed
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                {site.ownershipDocuments.map((doc: any, i: number) => (
                                    <DocumentListItem key={i} name={doc.name} size={doc.size} type="Ownership Proof" url={doc.url} />
                                ))}
                            </div>
                        </div>

                        {/* Policy Documents */}
                        <div className="space-y-4">
                            <span className="text-xs font-semibold text-muted-foreground px-1">Policy Documents</span>
                            <div className="space-y-2">
                                {site.policyDocuments.map((doc: any, i: number) => (
                                    <DocumentListItem key={i} name={doc.name} size={doc.size} type="Site Policy" url={doc.url} />
                                ))}
                            </div>
                            {site.policyDocuments.length === 0 && (
                                <div className="p-6 rounded-xl border border-dashed border-muted-foreground/20 text-center">
                                    <p className="text-xs text-muted-foreground italic">No additional documents provided.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="border-t bg-background/95 backdrop-blur-md p-6 absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-3 shadow-lg">
                <div className="flex gap-3">
                    <Button
                        onClick={onApprove}
                        className="flex-1 font-bold"
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        Approve Site
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onReject}
                        className="font-bold"
                    >
                        <XCircle className="h-5 w-5" />
                        Reject
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground font-semibold text-center opacity-60">
                    Final verification creates a live airspace record
                </p>
            </div>
        </div>
    );
}
