'use client';

import * as React from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { PreviewMap } from '@/components/map/preview-map';
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
    Shield
} from 'lucide-react';
import { DetailedSite } from '../../../../landowner/sites/schema';

interface SiteDetailsContextProps {
    site: DetailedSite;
}

export function SiteDetailsContext({ site }: SiteDetailsContextProps) {
    const isAuto = site.bookingApprovalModel === 'auto';
    
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Hero Gallery */}
            <section className="relative rounded-3xl overflow-hidden aspect-[21/9] bg-muted group shadow-2xl">
                {site.photoUrls && site.photoUrls.length > 0 ? (
                    <img 
                        src={site.photoUrls[0]?.url} 
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
            <section className="space-y-8">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider font-bold text-[10px] px-3 py-1">
                            {site.category}
                        </Badge>
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 uppercase tracking-wider font-bold text-[10px] px-3 py-1">
                            {site.status}
                        </Badge>
                        {site.allowEmergencyLanding && (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5 uppercase tracking-wider font-bold text-[10px] px-3 py-1">
                                Emergency Landing Allowed
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-foreground leading-tight">
                        {site.name}
                    </h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Approval Mode</p>
                        <div className="flex items-center gap-2 font-bold">
                            {isAuto ? (
                                <><Zap className="h-4 w-4 text-emerald-500 fill-current" /> Auto-Approval</>
                            ) : (
                                <><Shield className="h-4 w-4 text-amber-500" /> Manual Review</>
                            )}
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 col-span-2 space-y-2">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Operational Window</p>
                        <div className="flex items-center gap-2 font-bold">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            {site.isPermanentActivation ? (
                                "24/7 Permanent Activation"
                            ) : (
                                `${site.activationStartDate || 'N/A'} — ${site.activationEndDate || 'N/A'}`
                            )}
                        </div>
                        {!site.isPermanentActivation && (site.activationStartTime || site.activationEndTime) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                                <Clock className="h-3 w-3" />
                                Daily: {site.activationStartTime || '00:00'} to {site.activationEndTime || '23:59'}
                            </div>
                        )}
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
                        {site.allowEmergencyLanding && (
                            <Badge variant="secondary" className="gap-1.5 font-semibold bg-amber-500/10 text-amber-600 border-amber-500/20">
                                <div className="size-2 rounded-full bg-amber-500" />
                                Emergency
                            </Badge>
                        )}
                    </div>
                </div>
                <PreviewMap 
                    center={{ lat: site.latitude, lng: site.longitude }}
                    toalRadius={site.toalRadius}
                    emergencyRadius={site.emergencyRadius || 0}
                    showEmergency={site.allowEmergencyLanding}
                    toalMode={site.toalGeometryMode}
                    emergencyMode={site.emergencyGeometryMode || 'circle'}
                    initialToalPolygonPoints={site.toalPolygonPoints}
                    initialEmergencyPolygonPoints={site.emergencyPolygonPoints}
                    className="shadow-2xl shadow-primary/5"
                />
            </section>

            {/* 4. Operational Logistics & Coordination */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-bold">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3>Location Logistics</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 rounded-lg bg-muted border">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold">{site.address}</p>
                                <p className="text-xs text-muted-foreground">{site.postcode}, United Kingdom</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted border">
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs font-mono text-muted-foreground">
                                {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-xl font-bold">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <h3>Site Coordination</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/20 transition-colors group cursor-pointer">
                            <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">{site.contactEmail}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/20 transition-colors group cursor-pointer">
                            <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">{site.contactPhone}</span>
                        </div>
                    </div>
                </div>
            </section>

            <Separator />

            {/* 5. Description & Hazards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-bold">
                        <Info className="h-5 w-5 text-primary" />
                        <h3>About the Site</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                        {site.description || "No description provided for this site."}
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-bold">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <h3>Risk Mitigation</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                            <div className="text-sm">
                                <p className="font-bold text-amber-700 dark:text-amber-400">Potential Hazards</p>
                                <p className="text-muted-foreground mt-1">Review the TOAL zone boundaries carefully for overhead obstructions.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            <div className="text-sm">
                                <p className="font-bold">Safety Compliance</p>
                                <p className="text-muted-foreground mt-1">Operator must maintain visual line of sight at all times.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Requirements & Documents */}
            <section className="space-y-6 pb-12">
                <div className="flex items-center gap-2 text-xl font-bold">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3>Policy & Documentation</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {site.policyDocuments && site.policyDocuments.length > 0 ? (
                        site.policyDocuments.map((doc, idx) => (
                            <div key={idx} className="p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors group cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold text-sm text-foreground truncate max-w-[80%]">{doc.fileName}</p>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <Badge variant="outline" className="text-[10px] font-mono">DOCUMENT • VIEW</Badge>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 rounded-2xl border border-dashed border-border bg-muted/20 text-center col-span-2">
                            <p className="text-xs text-muted-foreground">No policy documents available for download.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
