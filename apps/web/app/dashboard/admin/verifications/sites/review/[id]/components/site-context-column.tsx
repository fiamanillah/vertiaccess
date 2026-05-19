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
    Download
} from 'lucide-react';
import { PreviewMap } from '@/components/map/preview-map';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { DetailBox, MetricBox } from './ui-helpers';
import { generateGeoJSONFeature, downloadGeoJSONFile } from '@/lib/geojson-utils';

interface SiteContextColumnProps {
    site: any;
}

export function SiteContextColumn({ site }: SiteContextColumnProps) {
    const latVal = typeof site.latitude === 'number' ? site.latitude : parseFloat(site.latitude) || 0;
    const lngVal = typeof site.longitude === 'number' ? site.longitude : parseFloat(site.longitude) || 0;

    const calculatedArea = site.toalRadius 
        ? `~${Math.round(Math.PI * Math.pow(site.toalRadius, 2)).toLocaleString()} m²` 
        : 'N/A';

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
        <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-background custom-scrollbar">
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
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Site Address</span>
                        <p className="text-sm font-semibold">{site.address}, <span className="font-mono text-primary">{site.postcode}</span></p>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-border shadow-2xl h-[450px] relative group">
                        <PreviewMap
                            center={{ lat: latVal, lng: lngVal }}
                            toalRadius={site.toalRadius}
                            emergencyRadius={site.emergencyRadius}
                            showEmergency={site.allowEmergencyLanding}
                            toalMode={site.toalGeometryMode as 'circle' | 'polygon'}
                            emergencyMode={site.emergencyGeometryMode as 'circle' | 'polygon'}
                            initialToalPolygonPoints={site.toalPolygonPoints}
                            initialEmergencyPolygonPoints={site.emergencyPolygonPoints}
                            className="h-full w-full"
                        />
                        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                            <Badge className="bg-background/90 backdrop-blur-md border shadow-lg text-[10px] font-bold py-1.5 px-3">
                                LIVE BOUNDARY PREVIEW
                            </Badge>
                            <Button
                                size="xs"
                                variant="secondary"
                                className="h-7 text-[10px] uppercase font-bold tracking-wider gap-1.5 bg-background/90 backdrop-blur-md border shadow-lg text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer pointer-events-auto"
                                onClick={() => handleDownloadGeoJSON('toal')}
                            >
                                <Download className="h-3.5 w-3.5" /> Download TOAL
                            </Button>
                            {site.allowEmergencyLanding && (
                                <Button
                                    size="xs"
                                    variant="secondary"
                                    className="h-7 text-[10px] uppercase font-bold tracking-wider gap-1.5 bg-background/90 backdrop-blur-md border shadow-lg text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer pointer-events-auto"
                                    onClick={() => handleDownloadGeoJSON('emergency')}
                                >
                                    <Download className="h-3.5 w-3.5" /> Download CLZ
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <MetricBox label="Calculated Area" value={calculatedArea} icon={LayoutDashboard} />
                        <MetricBox label="Center Point" value={`${latVal.toFixed(4)}, ${lngVal.toFixed(4)}`} icon={MapPin} />
                        <MetricBox label="TOAL Radius" value={`${site.toalRadius} meters`} icon={ShieldCheck} />
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
                                    <Button variant="secondary" size="sm" className="font-bold text-[10px] uppercase tracking-widest">Enlarge Photo</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-8 rounded-2xl bg-muted/10 border border-border/50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 block">Property Description</span>
                        <p className="text-base leading-relaxed text-foreground/80 italic">
                            "{site.description}"
                        </p>
                    </div>
                </div>
            </div>

            {/* 4. Operations & Pricing */}
            <div className="space-y-6 pb-8">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="p-2 rounded-md bg-muted">
                        <Banknote className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Operations & Pricing</h2>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-8 p-8 bg-muted/5 rounded-2xl border border-border/40">
                    <DetailBox label="Contact Email" value={site.landowner.email} icon={Mail} />
                    <DetailBox label="Contact Phone" value={site.landowner.phone} icon={Phone} />
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
        </div>
    );
}
