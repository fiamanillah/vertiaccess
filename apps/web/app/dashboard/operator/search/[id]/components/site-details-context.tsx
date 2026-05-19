'use client';

import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { PreviewMap } from '@/components/map/preview-map';
import { Button } from '@workspace/ui/components/button';
import { 
    MapPin, 
    Info, 
    AlertTriangle, 
    FileText, 
    ShieldAlert, 
    CheckCircle2, 
    ExternalLink,
    CalendarDays,
    Clock,
    Mail,
    Phone,
    UserCheck,
    Zap,
    Shield,
    Download
} from 'lucide-react';
import { generateGeoJSONFeature, downloadGeoJSONFile } from '@/lib/geojson-utils';

interface SiteDetailsContextProps {
    site: any;
}

function calculateGeodesicArea(points: { lat: number; lng: number }[]): number {
    if (!points || points.length < 3) return 0;
    
    // Find centroid to use as center of flat coordinate projection
    let sumLat = 0;
    let sumLng = 0;
    for (const p of points) {
        sumLat += p.lat;
        sumLng += p.lng;
    }
    const lat0 = sumLat / points.length;
    
    // Constants for flat projection (meters per degree)
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos((lat0 * Math.PI) / 180);
    
    // Project to flat coordinates in meters
    const projected = points.map(p => ({
        x: p.lng * metersPerDegreeLng,
        y: p.lat * metersPerDegreeLat
    }));
    
    // Standard Shoelace formula
    let area = 0;
    const n = projected.length;
    for (let i = 0; i < n; i++) {
        const next = (i + 1) % n;
        const currPoint = projected[i];
        const nextPoint = projected[next];
        if (currPoint && nextPoint) {
            area += currPoint.x * nextPoint.y - nextPoint.x * currPoint.y;
        }
    }
    
    return Math.abs(area) / 2;
}

function getAreaFormatted(mode: string, radius: number, points: { lat: number; lng: number }[]): string {
    let areaM2 = 0;
    if (mode === 'circle') {
        areaM2 = Math.PI * Math.pow(radius, 2);
    } else {
        areaM2 = calculateGeodesicArea(points);
    }
    
    if (areaM2 === 0) return 'N/A';
    
    // Display in m² or hectares (ha)
    if (areaM2 >= 10000) {
        const ha = areaM2 / 10000;
        return `${Math.round(areaM2).toLocaleString()} m² (${ha.toFixed(2)} ha)`;
    }
    return `${Math.round(areaM2).toLocaleString()} m²`;
}

export function SiteDetailsContext({ site }: SiteDetailsContextProps) {
    const isAuto = site.autoApprove === true;
    const formattedCategory = site.siteCategory ? site.siteCategory.replace(/_/g, ' ') : '';
    
    // Geometry parsing for the map
    const lat = site.geometry?.center?.lat || 51.5072;
    const lng = site.geometry?.center?.lng || -0.1276;
    const toalRadius = site.geometry?.radius || 100;
    const emergencyRadius = site.clzGeometry?.radius || 0;
    const toalMode = site.geometry?.type || 'circle';
    const emergencyMode = site.clzGeometry?.type || 'circle';
    const toalPolygonPoints = site.geometry?.points || [];
    const emergencyPolygonPoints = site.clzGeometry?.points || [];

    const hasPhoto = !!site.photoUrl;
    const photoUrl = site.photoUrl;

    const policyDocuments = site.documents?.filter((d: any) => d.documentType === 'policy') || [];

    const handleDownloadGeoJSON = (type: 'toal' | 'emergency') => {
        const mode = type === 'toal' ? toalMode : emergencyMode;
        const radius = type === 'toal' ? toalRadius : emergencyRadius;
        const points = type === 'toal' ? toalPolygonPoints : emergencyPolygonPoints;
        const name = type === 'toal' ? `${site.name} - TOAL Zone` : `${site.name} - Emergency Zone`;
        const center = site.geometry?.center || { lat, lng };

        const geojson = generateGeoJSONFeature(mode as 'circle' | 'polygon', center, radius, points, name);
        if (geojson) {
            downloadGeoJSONFile(`${site.name.toLowerCase().replace(/\s+/g, '_')}_${type}_boundary.geojson`, geojson);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Hero Gallery */}
            <section className="relative rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] bg-muted group shadow-2xl">
                {hasPhoto ? (
                    <img 
                        src={photoUrl} 
                        alt={site.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 border-2 border-dashed border-border m-1 rounded-2xl">
                        <p className="text-muted-foreground font-medium">No photos available for this site</p>
                    </div>
                )}
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none px-3 py-1 shadow-lg">1 / 1 Photos</Badge>
                </div>
            </section>

            {/* 2. Header & Quick Stats */}
            <section className="space-y-6">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {formattedCategory && (
                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider font-bold text-[10px] px-3 py-1">
                                {formattedCategory}
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 uppercase tracking-wider font-bold text-[10px] px-3 py-1">
                            {site.status}
                        </Badge>
                        {site.clzEnabled && (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5 uppercase tracking-wider font-bold text-[10px] px-3 py-1">
                                Emergency Landing Allowed
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                        {site.name}
                    </h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={cn(
                        "p-4 rounded-2xl border flex flex-col justify-center space-y-1.5",
                        isAuto ? "bg-emerald-500/5 border-emerald-500/10" : "bg-amber-500/5 border-amber-500/10"
                    )}>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Approval Mode</p>
                        <div className="flex items-center gap-2 font-bold text-sm">
                            {isAuto ? (
                                <><Zap className="h-4 w-4 text-emerald-500 fill-current" /> Auto-Approval</>
                            ) : (
                                <><Shield className="h-4 w-4 text-amber-500" /> Manual Review</>
                            )}
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 col-span-2 space-y-1.5 flex flex-col justify-center">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Operational Window</p>
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            {`${site.validityStart ? new Date(site.validityStart).toLocaleDateString() : 'N/A'} — ${site.validityEnd ? new Date(site.validityEnd).toLocaleDateString() : 'Ongoing'}`}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Site Boundaries (Map) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Mission Geometry</h2>
                        <p className="text-sm text-muted-foreground">Detailed TOAL and Emergency boundary visualizations.</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="gap-1.5 font-semibold bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                            <div className="size-2 rounded-full bg-indigo-500" />
                            TOAL Zone
                        </Badge>
                        {site.clzEnabled && (
                            <Badge variant="secondary" className="gap-1.5 font-semibold bg-amber-500/10 text-amber-600 border-amber-500/20">
                                <div className="size-2 rounded-full bg-amber-500" />
                                Emergency
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col justify-between min-h-[140px]">
                        <div className="space-y-1.5">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">TOAL Zone Area</p>
                            <div className="flex items-baseline gap-2 font-black text-xl text-indigo-950 dark:text-indigo-50">
                                {getAreaFormatted(toalMode, toalRadius, toalPolygonPoints)}
                            </div>
                            <p className="text-[10px] text-indigo-500 font-medium">Calculated based on {toalMode} footprint.</p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="xs" 
                            className="mt-3 w-fit text-[10px] uppercase font-bold tracking-wider gap-1.5 border-indigo-500/20 hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 h-7"
                            onClick={() => handleDownloadGeoJSON('toal')}
                        >
                            <Download className="h-3.5 w-3.5" /> Download GeoJSON
                        </Button>
                    </div>
                    {site.clzEnabled ? (
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between min-h-[140px]">
                            <div className="space-y-1.5">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">Emergency Area</p>
                                <div className="flex items-baseline gap-2 font-black text-xl text-amber-950 dark:text-amber-50">
                                    {getAreaFormatted(emergencyMode, emergencyRadius, emergencyPolygonPoints)}
                                </div>
                                <p className="text-[10px] text-amber-500 font-medium">Calculated based on {emergencyMode} footprint.</p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="xs" 
                                className="mt-3 w-fit text-[10px] uppercase font-bold tracking-wider gap-1.5 border-amber-500/20 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 h-7"
                                onClick={() => handleDownloadGeoJSON('emergency')}
                            >
                                <Download className="h-3.5 w-3.5" /> Download GeoJSON
                            </Button>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center min-h-[140px]">
                            <p className="text-xs text-muted-foreground italic">Emergency Landing Zone is Disabled</p>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl overflow-hidden border border-border/40 shadow-sm">
                    <PreviewMap 
                        center={{ lat, lng }}
                        toalRadius={toalRadius}
                        emergencyRadius={emergencyRadius}
                        showEmergency={site.clzEnabled}
                        toalMode={toalMode}
                        emergencyMode={emergencyMode}
                        initialToalPolygonPoints={toalPolygonPoints}
                        initialEmergencyPolygonPoints={emergencyPolygonPoints}
                        className="shadow-2xl shadow-primary/5"
                    />
                </div>
            </section>

            {/* 4. Operational Logistics & Coordination */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-4 hover:border-primary/20 transition-all duration-300 shadow-sm">
                    <div className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3>Location Logistics</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-2 rounded-xl bg-background border border-border/50 shadow-inner">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold">{site.address}</p>
                                <p className="text-xs text-muted-foreground">{site.postcode}, United Kingdom</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-background border border-border/50 shadow-inner">
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs font-mono text-muted-foreground">
                                {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-4 hover:border-primary/20 transition-all duration-300 shadow-sm">
                    <div className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <h3>Site Coordination</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50 hover:border-primary/20 transition-all duration-300 group cursor-pointer shadow-sm">
                            <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium truncate">{site.contactEmail}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50 hover:border-primary/20 transition-all duration-300 group cursor-pointer shadow-sm">
                            <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">{site.contactPhone}</span>
                        </div>
                    </div>
                </div>
            </section>

            <Separator />

            {/* 5. Description & Hazards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-4 hover:border-primary/20 transition-all duration-300 shadow-sm">
                    <div className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                        <Info className="h-5 w-5 text-primary" />
                        <h3>About the Site</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                        {site.description || "No description provided for this site."}
                    </p>
                </div>
                
                <div className="p-6 rounded-2xl bg-muted/20 border border-border/50 space-y-4 hover:border-primary/20 transition-all duration-300 shadow-sm">
                    <div className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <h3>Risk Mitigation</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <p className="font-bold text-amber-700 dark:text-amber-400">Potential Hazards</p>
                                <p className="text-muted-foreground mt-0.5">Review the TOAL zone boundaries carefully for overhead obstructions.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <p className="font-bold text-emerald-700 dark:text-emerald-400">Safety Compliance</p>
                                <p className="text-muted-foreground mt-0.5">Operator must maintain visual line of sight at all times.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Requirements & Documents */}
            <section className="space-y-4 pb-12">
                <div className="flex items-center gap-2.5 text-xl font-bold">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3>Policy & Documentation</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {policyDocuments.length > 0 ? (
                        policyDocuments.map((doc: any, idx: number) => (
                            <div 
                                key={idx} 
                                className="p-4 rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all duration-300 group cursor-pointer flex flex-col justify-between min-h-[90px] shadow-sm"
                                onClick={() => doc.downloadUrl ? window.open(doc.downloadUrl, '_blank') : null}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <p className="font-bold text-sm text-foreground truncate max-w-[85%] group-hover:text-primary transition-colors">{doc.fileName}</p>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono w-fit uppercase bg-background/50 border-border/50 mt-2 px-2 py-0.5">
                                    DOCUMENT • VIEW
                                </Badge>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 rounded-2xl border border-dashed border-border/60 bg-muted/5 text-center col-span-2 flex flex-col items-center justify-center space-y-2">
                            <FileText className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-xs text-muted-foreground">No policy documents available for download.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
