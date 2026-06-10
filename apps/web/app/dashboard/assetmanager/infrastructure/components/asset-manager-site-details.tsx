'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DetailedSite } from '../schema';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { 
  ArrowLeft, 
  FileText, 
  Download 
} from 'lucide-react';
import {
  generateGeoJSONFeature,
  downloadGeoJSONFile,
  circleAreaM2,
  polygonAreaM2,
  formatArea,
} from '@/lib/geojson-utils';

interface AssetManagerSiteDetailsProps {
    site: DetailedSite;
    onBack: () => void;
    className?: string;
}

function getStatusMeta(status: DetailedSite['status']) {
  switch (status) {
    case 'active':
      return { label: 'Active', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400', dotColor: 'bg-emerald-500' };
    case 'pending':
      return { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400', dotColor: 'bg-amber-500' };
    case 'disabled':
      return { label: 'Disabled', className: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400', dotColor: 'bg-slate-500' };
    case 'temporary_unavailable':
      return { label: 'Temporary Unavailable', className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400', dotColor: 'bg-orange-500' };
    case 'rejected':
      return { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400', dotColor: 'bg-red-500' };
    default:
      return { label: 'Unknown', className: 'bg-muted text-muted-foreground', dotColor: 'bg-gray-400' };
  }
}

function getAssetTypeLabel(category: string) {
  const mapping: Record<string, string> = {
    private_land: 'Private Land',
    helipad: 'Helipad',
    vertiport: 'Vertiport',
    droneport: 'Drone Port',
    temporary_landing_site: 'Temporary Landing Site',
  };
  return mapping[category] || category;
}

function formatDateTime(dateStr?: string, timeStr?: string) {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}${timeStr ? ' ' + timeStr : ''}`;
}

export function AssetManagerSiteDetails({
    site,
    onBack,
    className
}: AssetManagerSiteDetailsProps) {
    const router = useRouter();
    const statusMeta = getStatusMeta(site.status);
    const vaSiteId = site.vaId ? site.vaId.toUpperCase() : `VA-${site.id.substring(0, 6).toUpperCase()}`;

    const handleDownloadGeoJSON = (type: 'toal' | 'emergency') => {
        const mode = type === 'toal' ? site.toalGeometryMode : site.emergencyGeometryMode;
        const radius = type === 'toal' ? site.toalRadius : site.emergencyRadius;
        const points = type === 'toal' ? site.toalPolygonPoints : site.emergencyPolygonPoints;
        const name = type === 'toal' ? `${site.name} - TOAL Zone` : `${site.name} - Emergency & Recovery Zone`;
        const center = { lat: site.latitude, lng: site.longitude };

        const geojson = generateGeoJSONFeature(
            mode as 'circle' | 'polygon',
            center,
            radius || 0,
            points,
            name
        );
        if (geojson) {
            const filenameType = type === 'toal' ? 'toal' : 'emergency_and_recovery';
            downloadGeoJSONFile(
                `${site.name.toLowerCase().replace(/\s+/g, '_')}_${filenameType}_boundary.geojson`,
                geojson
            );
        }
    };

    const calculatedToalArea = site.toalGeometryMode === 'polygon'
        ? formatArea(polygonAreaM2(site.toalPolygonPoints || []))
        : formatArea(circleAreaM2(site.toalRadius || 100));

    const calculatedEmergencyArea = site.allowEmergencyLanding
        ? (site.emergencyGeometryMode === 'polygon'
            ? formatArea(polygonAreaM2(site.emergencyPolygonPoints || []))
            : formatArea(circleAreaM2(site.emergencyRadius || 0)))
        : 'N/A';

    return (
        <div className={cn("flex flex-col h-[600px] bg-card border-y border-r border-border/60 rounded-r-2xl overflow-hidden relative", className)}>
            {/* Header */}
            <div className="p-4 border-b border-border/60 bg-muted/30 flex items-center gap-3 shrink-0">
                <Button 
                    id="btn-back-to-list"
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{site.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{vaSiteId}</p>
                </div>
            </div>

            {/* Scrollable details */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5 pb-24">
                    {/* Section: Asset Details */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Asset Details</h4>
                        <div className="space-y-2 bg-muted/20 rounded-xl p-3 border border-border/30 divide-y divide-border/20">
                            <div className="flex justify-between items-center py-1 text-xs">
                                <span className="font-medium text-muted-foreground">Asset ID</span>
                                <span className="font-mono text-foreground">{vaSiteId}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 pb-1 text-xs">
                                <span className="font-medium text-muted-foreground">Asset Name</span>
                                <span className="font-semibold text-foreground text-right">{site.name}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 pb-1 text-xs">
                                <span className="font-medium text-muted-foreground">Asset Type</span>
                                <span className="font-medium text-foreground">{getAssetTypeLabel(site.category)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 pb-1 text-xs">
                                <span className="font-medium text-muted-foreground">Asset Capability</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                    <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0.5 border-none bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30">
                                        TOAL
                                    </Badge>
                                    {site.allowEmergencyLanding && (
                                        <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0.5 border-none bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30">
                                            Emergency Recovery
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 pb-1 text-xs">
                                <span className="font-medium text-muted-foreground">Asset Status</span>
                                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                    <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", statusMeta.dotColor)} />
                                    {statusMeta.label}
                                </span>
                            </div>
                            <div className="flex justify-between items-start pt-2 pb-1 text-xs">
                                <span className="font-medium text-muted-foreground shrink-0 mr-2">Asset Address</span>
                                <span className="font-medium text-foreground text-right">{site.address}, {site.postcode}</span>
                            </div>
                            <div className="flex flex-col gap-1 pt-2 text-xs">
                                <span className="font-medium text-muted-foreground">Asset Description</span>
                                <p className="text-foreground/80 leading-relaxed font-medium bg-muted/30 p-2 rounded border border-border/10 mt-1">
                                    {site.description || 'No description provided.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Asset Geometry */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Asset Geometry</h4>
                        <div className="space-y-2 bg-muted/20 rounded-xl p-3 border border-border/30 divide-y divide-border/20">
                            <div className="flex justify-between items-center py-1 text-xs">
                                <span className="font-medium text-muted-foreground">TOAL Area</span>
                                <span className="font-mono font-bold text-foreground">{calculatedToalArea}</span>
                            </div>
                            {site.allowEmergencyLanding && (
                                <div className="flex justify-between items-center pt-2 pb-1 text-xs">
                                    <span className="font-medium text-muted-foreground">Emergency Area</span>
                                    <span className="font-mono font-bold text-foreground">{calculatedEmergencyArea}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 pb-1 text-xs">
                                <span className="font-medium text-muted-foreground">TOAL Geometry</span>
                                <span className="font-medium text-foreground capitalize">{site.toalGeometryMode}</span>
                            </div>
                            {site.allowEmergencyLanding && (
                                <div className="flex justify-between items-center pt-2 pb-1 text-xs">
                                    <span className="font-medium text-muted-foreground">Emergency Geometry</span>
                                    <span className="font-medium text-foreground capitalize">{site.emergencyGeometryMode || 'Circle'}</span>
                                </div>
                            )}
                            <div className="flex flex-col gap-1.5 pt-2 text-xs">
                                <span className="font-medium text-muted-foreground">Boundary Files</span>
                                <div className="flex flex-col gap-1 mt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[10px] justify-start font-semibold border-primary/20 hover:border-primary/50"
                                        onClick={() => handleDownloadGeoJSON('toal')}
                                    >
                                        <Download className="h-3 w-3 mr-1.5 text-primary" />
                                        Download TOAL GeoJSON
                                    </Button>
                                    {site.allowEmergencyLanding && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-[10px] justify-start font-semibold border-primary/20 hover:border-primary/50"
                                            onClick={() => handleDownloadGeoJSON('emergency')}
                                        >
                                            <Download className="h-3 w-3 mr-1.5 text-primary" />
                                            Download Emergency GeoJSON
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Availability & Policy */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Availability & Policy</h4>
                        <div className="space-y-2 bg-muted/20 rounded-xl p-3 border border-border/30 divide-y divide-border/20">
                            <div className="flex justify-between items-center py-1 text-xs">
                                <span className="font-medium text-muted-foreground">Availability</span>
                                {site.isPermanentActivation ? (
                                    <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-none px-1.5 py-0.5 text-[9px] uppercase font-bold">
                                        Permanent
                                    </Badge>
                                ) : (
                                    <span className="font-semibold text-foreground text-right">
                                        {formatDateTime(site.activationStartDate, site.activationStartTime)} to {formatDateTime(site.activationEndDate, site.activationEndTime)}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center pt-2 pb-1 text-xs">
                                <span className="font-medium text-muted-foreground">Approval Mode</span>
                                <Badge className={cn("border-none px-1.5 py-0.5 text-[9px] font-bold", 
                                    site.bookingApprovalModel === 'auto' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                )}>
                                    {site.bookingApprovalModel === 'auto' ? 'Auto-Approval' : 'Manual Review'}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-2 text-xs">
                                <span className="font-medium text-muted-foreground">Policy Documents</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {site.policyDocuments.length > 0 ? (
                                        site.policyDocuments.map((doc, idx) => (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-[10px] font-semibold border-primary/20 hover:border-primary/50"
                                                onClick={() => window.open(doc.url, '_blank')}
                                            >
                                                <FileText className="h-3 w-3 mr-1" />
                                                Policy #{idx + 1}
                                            </Button>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">No policy documents available.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Commercials */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Commercials</h4>
                        <div className="space-y-2 bg-muted/20 rounded-xl p-3 border border-border/30 divide-y divide-border/20">
                            <div className="flex justify-between items-center py-1 text-xs">
                                <span className="font-medium text-muted-foreground">TOAL Access Fee</span>
                                <span className="font-mono text-primary font-bold text-sm">£{site.toalFee.toFixed(2)}</span>
                            </div>
                            {site.allowEmergencyLanding && (
                                <div className="flex justify-between items-center pt-2 pb-1 text-xs">
                                    <span className="font-medium text-muted-foreground">Emergency & Recovery Site Fee</span>
                                    <span className="font-mono font-bold text-foreground text-sm">£{site.emergencyFee.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Footer Buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-background/90 backdrop-blur border-t border-border/60 flex flex-col gap-2 z-10">
                <Button 
                    id="btn-plan-takeoff"
                    className="w-full font-bold shadow-md shadow-primary/10 text-xs h-9"
                    onClick={() => router.push(`/dashboard/operator/search/${site.id}/book?type=toal`)}
                >
                    Plan Takeoff and Landing
                </Button>
                {site.allowEmergencyLanding && (
                    <Button 
                        id="btn-emergency-recovery"
                        variant="secondary"
                        className="w-full font-bold text-xs h-9 border border-border"
                        onClick={() => router.push(`/dashboard/operator/search/${site.id}/book?type=emergency`)}
                    >
                        Emergency and Recovery
                    </Button>
                )}
            </div>
        </div>
    );
}
